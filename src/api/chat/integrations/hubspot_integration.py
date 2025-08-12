"""
HubSpot Marketing Automation Integration
=======================================

Provides comprehensive integration with HubSpot for marketing automation,
lead scoring, and customer journey tracking.

Features:
- Contact creation and management
- Lead scoring and qualification
- Deal and pipeline management
- Email marketing automation
- Workflow triggers
- Custom property mapping
- Real-time data synchronization
- Governance oversight and audit logging
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
import aiohttp
from urllib.parse import urlencode

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class HubSpotConfig:
    """HubSpot configuration"""
    api_key: str
    portal_id: str
    base_url: str = "https://api.hubapi.com"
    api_version: str = "v3"

@dataclass
class HubSpotContact:
    """HubSpot contact data structure"""
    email: str
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    jobtitle: Optional[str] = None
    website: Optional[str] = None
    lifecyclestage: str = "lead"
    lead_source: str = "Chat"
    custom_properties: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.custom_properties is None:
            self.custom_properties = {}

@dataclass
class HubSpotDeal:
    """HubSpot deal data structure"""
    dealname: str
    amount: Optional[float] = None
    dealstage: str = "appointmentscheduled"
    pipeline: str = "default"
    closedate: Optional[str] = None
    deal_source: str = "Chat"
    custom_properties: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.custom_properties is None:
            self.custom_properties = {}

@dataclass
class HubSpotTicket:
    """HubSpot ticket data structure"""
    subject: str
    content: str
    priority: str = "MEDIUM"
    category: str = "SUPPORT_REQUEST"
    source: str = "CHAT"
    status: str = "NEW"
    custom_properties: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.custom_properties is None:
            self.custom_properties = {}

class HubSpotIntegration:
    """
    HubSpot Marketing Automation Integration
    
    Provides comprehensive integration with HubSpot for:
    - Contact and lead management
    - Deal and pipeline tracking
    - Marketing automation workflows
    - Lead scoring and qualification
    """
    
    def __init__(self, config: HubSpotConfig, governance_adapter=None):
        self.config = config
        self.governance_adapter = governance_adapter
        self.session = None
        
        logger.info(f"🔗 [HubSpot] Initializing integration with portal {config.portal_id}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get standard headers for HubSpot API requests"""
        return {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json"
        }
    
    # ============================================================================
    # CONTACT MANAGEMENT
    # ============================================================================
    
    async def create_contact(self, contact: HubSpotContact, chat_context: Dict = None) -> Optional[str]:
        """Create a new contact in HubSpot"""
        try:
            logger.info(f"👤 [HubSpot] Creating contact for {contact.email}")
            
            # Prepare contact properties
            properties = {
                "email": contact.email,
                "lifecyclestage": contact.lifecyclestage,
                "hs_lead_status": "NEW"
            }
            
            # Add optional fields
            if contact.firstname:
                properties["firstname"] = contact.firstname
            if contact.lastname:
                properties["lastname"] = contact.lastname
            if contact.phone:
                properties["phone"] = contact.phone
            if contact.company:
                properties["company"] = contact.company
            if contact.jobtitle:
                properties["jobtitle"] = contact.jobtitle
            if contact.website:
                properties["website"] = contact.website
            
            # Add lead source
            properties["hs_analytics_source"] = contact.lead_source
            properties["hs_analytics_source_data_1"] = "Promethios Chat"
            
            # Add chat context as notes
            if chat_context:
                properties["notes_last_contacted"] = f"Chat Context: {json.dumps(chat_context, indent=2)}"
            
            # Add custom properties
            if contact.custom_properties:
                properties.update(contact.custom_properties)
            
            # Prepare request data
            contact_data = {"properties": properties}
            
            # Make API request
            url = f"{self.config.base_url}/crm/{self.config.api_version}/objects/contacts"
            headers = self._get_headers()
            
            async with self.session.post(url, json=contact_data, headers=headers) as response:
                if response.status == 201:
                    result = await response.json()
                    contact_id = result["id"]
                    
                    logger.info(f"✅ [HubSpot] Contact created successfully: {contact_id}")
                    
                    # Log contact creation for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"hs_contact_{contact_id}",
                            "agent_id": "hubspot_integration",
                            "event_type": "contact_creation",
                            "contact_id": contact_id,
                            "contact_email": contact.email,
                            "integration": "hubspot",
                            "status": "success"
                        })
                    
                    return contact_id
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [HubSpot] Contact creation failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [HubSpot] Contact creation error: {e}")
            return None
    
    async def update_contact(self, contact_id: str, properties: Dict[str, Any]) -> bool:
        """Update an existing contact"""
        try:
            logger.info(f"🔄 [HubSpot] Updating contact {contact_id}")
            
            # Prepare request data
            update_data = {"properties": properties}
            
            url = f"{self.config.base_url}/crm/{self.config.api_version}/objects/contacts/{contact_id}"
            headers = self._get_headers()
            
            async with self.session.patch(url, json=update_data, headers=headers) as response:
                if response.status == 200:
                    logger.info(f"✅ [HubSpot] Contact updated successfully: {contact_id}")
                    
                    # Log update for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"hs_contact_update_{contact_id}",
                            "agent_id": "hubspot_integration",
                            "event_type": "contact_update",
                            "contact_id": contact_id,
                            "updates": properties,
                            "integration": "hubspot",
                            "status": "success"
                        })
                    
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [HubSpot] Contact update failed: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ [HubSpot] Contact update error: {e}")
            return False
    
    async def get_contact(self, contact_id: str) -> Optional[Dict]:
        """Get contact details"""
        try:
            url = f"{self.config.base_url}/crm/{self.config.api_version}/objects/contacts/{contact_id}"
            headers = self._get_headers()
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"❌ [HubSpot] Failed to get contact {contact_id}: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [HubSpot] Get contact error: {e}")
            return None
    
    async def search_contacts(self, email: str) -> List[Dict]:
        """Search for contacts by email"""
        try:
            # Prepare search request
            search_data = {
                "filterGroups": [
                    {
                        "filters": [
                            {
                                "propertyName": "email",
                                "operator": "EQ",
                                "value": email
                            }
                        ]
                    }
                ],
                "properties": ["email", "firstname", "lastname", "phone", "company", "lifecyclestage"]
            }
            
            url = f"{self.config.base_url}/crm/{self.config.api_version}/objects/contacts/search"
            headers = self._get_headers()
            
            async with self.session.post(url, json=search_data, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("results", [])
                else:
                    logger.error(f"❌ [HubSpot] Contact search failed: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"❌ [HubSpot] Contact search error: {e}")
            return []
    
    # ============================================================================
    # DEAL MANAGEMENT
    # ============================================================================
    
    async def create_deal(self, deal: HubSpotDeal, contact_id: Optional[str] = None) -> Optional[str]:
        """Create a new deal in HubSpot"""
        try:
            logger.info(f"💼 [HubSpot] Creating deal: {deal.dealname}")
            
            # Prepare deal properties
            properties = {
                "dealname": deal.dealname,
                "dealstage": deal.dealstage,
                "pipeline": deal.pipeline,
                "hs_analytics_source": deal.deal_source,
                "hs_analytics_source_data_1": "Promethios Chat"
            }
            
            # Add optional fields
            if deal.amount:
                properties["amount"] = str(deal.amount)
            if deal.closedate:
                properties["closedate"] = deal.closedate
            
            # Add custom properties
            if deal.custom_properties:
                properties.update(deal.custom_properties)
            
            # Prepare request data
            deal_data = {"properties": properties}
            
            # Add associations if contact_id provided
            if contact_id:
                deal_data["associations"] = [
                    {
                        "to": {"id": contact_id},
                        "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 3}]
                    }
                ]
            
            # Make API request
            url = f"{self.config.base_url}/crm/{self.config.api_version}/objects/deals"
            headers = self._get_headers()
            
            async with self.session.post(url, json=deal_data, headers=headers) as response:
                if response.status == 201:
                    result = await response.json()
                    deal_id = result["id"]
                    
                    logger.info(f"✅ [HubSpot] Deal created successfully: {deal_id}")
                    
                    # Log deal creation for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"hs_deal_{deal_id}",
                            "agent_id": "hubspot_integration",
                            "event_type": "deal_creation",
                            "deal_id": deal_id,
                            "deal_name": deal.dealname,
                            "contact_id": contact_id,
                            "integration": "hubspot",
                            "status": "success"
                        })
                    
                    return deal_id
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [HubSpot] Deal creation failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [HubSpot] Deal creation error: {e}")
            return None
    
    # ============================================================================
    # TICKET MANAGEMENT
    # ============================================================================
    
    async def create_ticket(self, ticket: HubSpotTicket, contact_id: Optional[str] = None, chat_transcript: Optional[str] = None) -> Optional[str]:
        """Create a support ticket in HubSpot"""
        try:
            logger.info(f"🎫 [HubSpot] Creating ticket: {ticket.subject}")
            
            # Prepare ticket properties
            properties = {
                "subject": ticket.subject,
                "content": ticket.content,
                "hs_ticket_priority": ticket.priority,
                "hs_ticket_category": ticket.category,
                "source_type": ticket.source,
                "hs_pipeline_stage": ticket.status
            }
            
            # Add chat transcript
            if chat_transcript:
                properties["content"] = f"{properties['content']}\n\nChat Transcript:\n{chat_transcript}"
            
            # Add custom properties
            if ticket.custom_properties:
                properties.update(ticket.custom_properties)
            
            # Prepare request data
            ticket_data = {"properties": properties}
            
            # Add associations if contact_id provided
            if contact_id:
                ticket_data["associations"] = [
                    {
                        "to": {"id": contact_id},
                        "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 16}]
                    }
                ]
            
            # Make API request
            url = f"{self.config.base_url}/crm/{self.config.api_version}/objects/tickets"
            headers = self._get_headers()
            
            async with self.session.post(url, json=ticket_data, headers=headers) as response:
                if response.status == 201:
                    result = await response.json()
                    ticket_id = result["id"]
                    
                    logger.info(f"✅ [HubSpot] Ticket created successfully: {ticket_id}")
                    
                    # Log ticket creation for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"hs_ticket_{ticket_id}",
                            "agent_id": "hubspot_integration",
                            "event_type": "ticket_creation",
                            "ticket_id": ticket_id,
                            "ticket_subject": ticket.subject,
                            "contact_id": contact_id,
                            "integration": "hubspot",
                            "status": "success"
                        })
                    
                    return ticket_id
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [HubSpot] Ticket creation failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [HubSpot] Ticket creation error: {e}")
            return None
    
    # ============================================================================
    # WORKFLOW AUTOMATION
    # ============================================================================
    
    async def trigger_workflow(self, workflow_id: str, contact_id: str, enrollment_data: Dict = None) -> bool:
        """Trigger a HubSpot workflow for a contact"""
        try:
            logger.info(f"⚡ [HubSpot] Triggering workflow {workflow_id} for contact {contact_id}")
            
            # Prepare enrollment data
            enrollment_request = {
                "contactId": contact_id
            }
            
            if enrollment_data:
                enrollment_request.update(enrollment_data)
            
            # Make API request
            url = f"{self.config.base_url}/automation/v2/workflows/{workflow_id}/enrollments/contacts/{contact_id}"
            headers = self._get_headers()
            
            async with self.session.post(url, json=enrollment_request, headers=headers) as response:
                if response.status == 204:
                    logger.info(f"✅ [HubSpot] Workflow triggered successfully")
                    
                    # Log workflow trigger for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"hs_workflow_{workflow_id}_{contact_id}",
                            "agent_id": "hubspot_integration",
                            "event_type": "workflow_trigger",
                            "workflow_id": workflow_id,
                            "contact_id": contact_id,
                            "integration": "hubspot",
                            "status": "success"
                        })
                    
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [HubSpot] Workflow trigger failed: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ [HubSpot] Workflow trigger error: {e}")
            return False
    
    # ============================================================================
    # LEAD SCORING
    # ============================================================================
    
    async def update_lead_score(self, contact_id: str, score_change: int, reason: str) -> bool:
        """Update lead score for a contact"""
        try:
            logger.info(f"📊 [HubSpot] Updating lead score for contact {contact_id}: {score_change:+d}")
            
            # Get current contact to calculate new score
            contact = await self.get_contact(contact_id)
            if not contact:
                return False
            
            current_score = int(contact.get("properties", {}).get("hubspotscore", 0))
            new_score = max(0, current_score + score_change)
            
            # Update contact with new score
            properties = {
                "hubspotscore": str(new_score),
                "notes_last_contacted": f"Lead score updated: {score_change:+d} ({reason})"
            }
            
            return await self.update_contact(contact_id, properties)
            
        except Exception as e:
            logger.error(f"❌ [HubSpot] Lead score update error: {e}")
            return False
    
    # ============================================================================
    # UTILITY METHODS
    # ============================================================================
    
    async def test_connection(self) -> bool:
        """Test the HubSpot connection"""
        try:
            # Test with a simple API call
            url = f"{self.config.base_url}/crm/{self.config.api_version}/objects/contacts?limit=1"
            headers = self._get_headers()
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    logger.info("✅ [HubSpot] Connection test successful")
                    return True
                else:
                    logger.error(f"❌ [HubSpot] Connection test failed: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ [HubSpot] Connection test error: {e}")
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get integration status"""
        return {
            "integration": "hubspot",
            "portal_id": self.config.portal_id,
            "base_url": self.config.base_url,
            "api_version": self.config.api_version,
            "authenticated": bool(self.config.api_key),
            "status": "active" if self.config.api_key else "inactive"
        }

