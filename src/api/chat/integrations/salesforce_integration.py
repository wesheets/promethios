"""
Salesforce CRM Integration
==========================

Provides comprehensive integration with Salesforce CRM for lead capture,
contact management, and customer relationship tracking.

Features:
- Lead creation and qualification
- Contact and account management
- Opportunity tracking
- Case creation for support
- Custom field mapping
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
import base64
from urllib.parse import urlencode

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SalesforceConfig:
    """Salesforce configuration"""
    instance_url: str
    client_id: str
    client_secret: str
    username: str
    password: str
    security_token: str
    api_version: str = "v58.0"
    sandbox: bool = False

@dataclass
class SalesforceContact:
    """Salesforce contact data structure"""
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    lead_source: str = "Chat"
    description: Optional[str] = None
    custom_fields: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.custom_fields is None:
            self.custom_fields = {}

@dataclass
class SalesforceCase:
    """Salesforce case data structure"""
    subject: str
    description: str
    contact_id: Optional[str] = None
    account_id: Optional[str] = None
    priority: str = "Medium"
    status: str = "New"
    origin: str = "Chat"
    case_type: str = "Question"
    custom_fields: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.custom_fields is None:
            self.custom_fields = {}

class SalesforceIntegration:
    """
    Salesforce CRM Integration
    
    Provides comprehensive integration with Salesforce for:
    - Lead and contact management
    - Case creation and tracking
    - Opportunity management
    - Custom object interactions
    """
    
    def __init__(self, config: SalesforceConfig, governance_adapter=None):
        self.config = config
        self.governance_adapter = governance_adapter
        self.access_token = None
        self.token_expires_at = None
        self.session = None
        
        logger.info(f"🔗 [Salesforce] Initializing integration with {config.instance_url}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        await self.authenticate()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    # ============================================================================
    # AUTHENTICATION
    # ============================================================================
    
    async def authenticate(self) -> bool:
        """Authenticate with Salesforce using OAuth 2.0"""
        try:
            logger.info("🔐 [Salesforce] Authenticating with OAuth 2.0")
            
            # Prepare authentication data
            auth_url = f"{self.config.instance_url}/services/oauth2/token"
            auth_data = {
                "grant_type": "password",
                "client_id": self.config.client_id,
                "client_secret": self.config.client_secret,
                "username": self.config.username,
                "password": f"{self.config.password}{self.config.security_token}"
            }
            
            # Make authentication request
            async with self.session.post(auth_url, data=auth_data) as response:
                if response.status == 200:
                    auth_result = await response.json()
                    
                    self.access_token = auth_result["access_token"]
                    self.config.instance_url = auth_result["instance_url"]
                    
                    # Calculate token expiration (Salesforce tokens typically last 2 hours)
                    self.token_expires_at = datetime.now(timezone.utc).timestamp() + 7200
                    
                    logger.info("✅ [Salesforce] Authentication successful")
                    
                    # Log authentication event for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"sf_auth_{datetime.now().timestamp()}",
                            "agent_id": "salesforce_integration",
                            "event_type": "authentication",
                            "status": "success",
                            "integration": "salesforce"
                        })
                    
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [Salesforce] Authentication failed: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ [Salesforce] Authentication error: {e}")
            return False
    
    async def ensure_authenticated(self) -> bool:
        """Ensure we have a valid access token"""
        if not self.access_token:
            return await self.authenticate()
        
        # Check if token is expired
        if self.token_expires_at and datetime.now(timezone.utc).timestamp() > self.token_expires_at:
            logger.info("🔄 [Salesforce] Token expired, re-authenticating")
            return await self.authenticate()
        
        return True
    
    # ============================================================================
    # LEAD MANAGEMENT
    # ============================================================================
    
    async def create_lead(self, contact: SalesforceContact, chat_context: Dict = None) -> Optional[str]:
        """Create a new lead in Salesforce"""
        try:
            if not await self.ensure_authenticated():
                return None
            
            logger.info(f"👤 [Salesforce] Creating lead for {contact.email}")
            
            # Prepare lead data
            lead_data = {
                "FirstName": contact.first_name,
                "LastName": contact.last_name,
                "Email": contact.email,
                "Company": contact.company or "Unknown",
                "LeadSource": contact.lead_source,
                "Status": "Open - Not Contacted"
            }
            
            # Add optional fields
            if contact.phone:
                lead_data["Phone"] = contact.phone
            if contact.title:
                lead_data["Title"] = contact.title
            if contact.description:
                lead_data["Description"] = contact.description
            
            # Add chat context
            if chat_context:
                lead_data["Description"] = f"{lead_data.get('Description', '')}\n\nChat Context:\n{json.dumps(chat_context, indent=2)}"
            
            # Add custom fields
            if contact.custom_fields:
                lead_data.update(contact.custom_fields)
            
            # Make API request
            url = f"{self.config.instance_url}/services/data/{self.config.api_version}/sobjects/Lead"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            async with self.session.post(url, json=lead_data, headers=headers) as response:
                if response.status == 201:
                    result = await response.json()
                    lead_id = result["id"]
                    
                    logger.info(f"✅ [Salesforce] Lead created successfully: {lead_id}")
                    
                    # Log lead creation for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"sf_lead_{lead_id}",
                            "agent_id": "salesforce_integration",
                            "event_type": "lead_creation",
                            "lead_id": lead_id,
                            "contact_email": contact.email,
                            "integration": "salesforce",
                            "status": "success"
                        })
                    
                    return lead_id
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [Salesforce] Lead creation failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [Salesforce] Lead creation error: {e}")
            return None
    
    async def update_lead(self, lead_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing lead"""
        try:
            if not await self.ensure_authenticated():
                return False
            
            logger.info(f"🔄 [Salesforce] Updating lead {lead_id}")
            
            url = f"{self.config.instance_url}/services/data/{self.config.api_version}/sobjects/Lead/{lead_id}"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            async with self.session.patch(url, json=updates, headers=headers) as response:
                if response.status == 204:
                    logger.info(f"✅ [Salesforce] Lead updated successfully: {lead_id}")
                    
                    # Log update for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"sf_lead_update_{lead_id}",
                            "agent_id": "salesforce_integration",
                            "event_type": "lead_update",
                            "lead_id": lead_id,
                            "updates": updates,
                            "integration": "salesforce",
                            "status": "success"
                        })
                    
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [Salesforce] Lead update failed: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ [Salesforce] Lead update error: {e}")
            return False
    
    async def get_lead(self, lead_id: str) -> Optional[Dict]:
        """Get lead details"""
        try:
            if not await self.ensure_authenticated():
                return None
            
            url = f"{self.config.instance_url}/services/data/{self.config.api_version}/sobjects/Lead/{lead_id}"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"❌ [Salesforce] Failed to get lead {lead_id}: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [Salesforce] Get lead error: {e}")
            return None
    
    # ============================================================================
    # CONTACT MANAGEMENT
    # ============================================================================
    
    async def create_contact(self, contact: SalesforceContact, account_id: Optional[str] = None) -> Optional[str]:
        """Create a new contact in Salesforce"""
        try:
            if not await self.ensure_authenticated():
                return None
            
            logger.info(f"👤 [Salesforce] Creating contact for {contact.email}")
            
            # Prepare contact data
            contact_data = {
                "FirstName": contact.first_name,
                "LastName": contact.last_name,
                "Email": contact.email,
                "LeadSource": contact.lead_source
            }
            
            # Add optional fields
            if contact.phone:
                contact_data["Phone"] = contact.phone
            if contact.title:
                contact_data["Title"] = contact.title
            if contact.description:
                contact_data["Description"] = contact.description
            if account_id:
                contact_data["AccountId"] = account_id
            
            # Add custom fields
            if contact.custom_fields:
                contact_data.update(contact.custom_fields)
            
            # Make API request
            url = f"{self.config.instance_url}/services/data/{self.config.api_version}/sobjects/Contact"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            async with self.session.post(url, json=contact_data, headers=headers) as response:
                if response.status == 201:
                    result = await response.json()
                    contact_id = result["id"]
                    
                    logger.info(f"✅ [Salesforce] Contact created successfully: {contact_id}")
                    
                    # Log contact creation for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"sf_contact_{contact_id}",
                            "agent_id": "salesforce_integration",
                            "event_type": "contact_creation",
                            "contact_id": contact_id,
                            "contact_email": contact.email,
                            "integration": "salesforce",
                            "status": "success"
                        })
                    
                    return contact_id
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [Salesforce] Contact creation failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [Salesforce] Contact creation error: {e}")
            return None
    
    # ============================================================================
    # CASE MANAGEMENT
    # ============================================================================
    
    async def create_case(self, case: SalesforceCase, chat_transcript: Optional[str] = None) -> Optional[str]:
        """Create a support case in Salesforce"""
        try:
            if not await self.ensure_authenticated():
                return None
            
            logger.info(f"🎫 [Salesforce] Creating case: {case.subject}")
            
            # Prepare case data
            case_data = {
                "Subject": case.subject,
                "Description": case.description,
                "Priority": case.priority,
                "Status": case.status,
                "Origin": case.origin,
                "Type": case.case_type
            }
            
            # Add optional fields
            if case.contact_id:
                case_data["ContactId"] = case.contact_id
            if case.account_id:
                case_data["AccountId"] = case.account_id
            
            # Add chat transcript
            if chat_transcript:
                case_data["Description"] = f"{case_data['Description']}\n\nChat Transcript:\n{chat_transcript}"
            
            # Add custom fields
            if case.custom_fields:
                case_data.update(case.custom_fields)
            
            # Make API request
            url = f"{self.config.instance_url}/services/data/{self.config.api_version}/sobjects/Case"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            async with self.session.post(url, json=case_data, headers=headers) as response:
                if response.status == 201:
                    result = await response.json()
                    case_id = result["id"]
                    
                    logger.info(f"✅ [Salesforce] Case created successfully: {case_id}")
                    
                    # Log case creation for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"sf_case_{case_id}",
                            "agent_id": "salesforce_integration",
                            "event_type": "case_creation",
                            "case_id": case_id,
                            "case_subject": case.subject,
                            "integration": "salesforce",
                            "status": "success"
                        })
                    
                    return case_id
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [Salesforce] Case creation failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [Salesforce] Case creation error: {e}")
            return None
    
    # ============================================================================
    # SEARCH AND QUERY
    # ============================================================================
    
    async def search_contacts(self, email: str) -> List[Dict]:
        """Search for contacts by email"""
        try:
            if not await self.ensure_authenticated():
                return []
            
            # Use SOQL query to search contacts
            query = f"SELECT Id, FirstName, LastName, Email, Phone, AccountId FROM Contact WHERE Email = '{email}'"
            encoded_query = urlencode({"q": query})
            
            url = f"{self.config.instance_url}/services/data/{self.config.api_version}/query?{encoded_query}"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("records", [])
                else:
                    logger.error(f"❌ [Salesforce] Contact search failed: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"❌ [Salesforce] Contact search error: {e}")
            return []
    
    async def search_leads(self, email: str) -> List[Dict]:
        """Search for leads by email"""
        try:
            if not await self.ensure_authenticated():
                return []
            
            # Use SOQL query to search leads
            query = f"SELECT Id, FirstName, LastName, Email, Phone, Company, Status FROM Lead WHERE Email = '{email}'"
            encoded_query = urlencode({"q": query})
            
            url = f"{self.config.instance_url}/services/data/{self.config.api_version}/query?{encoded_query}"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("records", [])
                else:
                    logger.error(f"❌ [Salesforce] Lead search failed: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"❌ [Salesforce] Lead search error: {e}")
            return []
    
    # ============================================================================
    # UTILITY METHODS
    # ============================================================================
    
    async def test_connection(self) -> bool:
        """Test the Salesforce connection"""
        try:
            if not await self.ensure_authenticated():
                return False
            
            # Test with a simple query
            url = f"{self.config.instance_url}/services/data/{self.config.api_version}/limits"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    logger.info("✅ [Salesforce] Connection test successful")
                    return True
                else:
                    logger.error(f"❌ [Salesforce] Connection test failed: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ [Salesforce] Connection test error: {e}")
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get integration status"""
        return {
            "integration": "salesforce",
            "instance_url": self.config.instance_url,
            "api_version": self.config.api_version,
            "authenticated": self.access_token is not None,
            "token_expires_at": self.token_expires_at,
            "sandbox": self.config.sandbox,
            "status": "active" if self.access_token else "inactive"
        }

