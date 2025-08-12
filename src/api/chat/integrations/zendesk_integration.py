"""
Zendesk Support Integration
==========================

Provides comprehensive integration with Zendesk for customer support,
ticket management, and help desk operations.

Features:
- Ticket creation and management
- User and organization management
- Automated ticket routing
- SLA tracking and escalation
- Knowledge base integration
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
class ZendeskConfig:
    """Zendesk configuration"""
    subdomain: str
    email: str
    api_token: str
    base_url: Optional[str] = None
    api_version: str = "v2"
    
    def __post_init__(self):
        if self.base_url is None:
            self.base_url = f"https://{self.subdomain}.zendesk.com"

@dataclass
class ZendeskUser:
    """Zendesk user data structure"""
    name: str
    email: str
    phone: Optional[str] = None
    organization_id: Optional[int] = None
    role: str = "end-user"
    verified: bool = False
    tags: List[str] = None
    user_fields: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = ["chat_user"]
        if self.user_fields is None:
            self.user_fields = {}

@dataclass
class ZendeskTicket:
    """Zendesk ticket data structure"""
    subject: str
    description: str
    requester_id: Optional[int] = None
    requester_email: Optional[str] = None
    priority: str = "normal"
    status: str = "new"
    ticket_type: str = "question"
    group_id: Optional[int] = None
    assignee_id: Optional[int] = None
    tags: List[str] = None
    custom_fields: List[Dict] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = ["chat", "promethios"]
        if self.custom_fields is None:
            self.custom_fields = []

@dataclass
class ZendeskOrganization:
    """Zendesk organization data structure"""
    name: str
    domain_names: List[str] = None
    details: Optional[str] = None
    notes: Optional[str] = None
    group_id: Optional[int] = None
    shared_tickets: bool = False
    shared_comments: bool = False
    tags: List[str] = None
    organization_fields: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.domain_names is None:
            self.domain_names = []
        if self.tags is None:
            self.tags = ["chat_organization"]
        if self.organization_fields is None:
            self.organization_fields = {}

class ZendeskIntegration:
    """
    Zendesk Support Integration
    
    Provides comprehensive integration with Zendesk for:
    - Ticket creation and management
    - User and organization management
    - Automated support workflows
    - Knowledge base integration
    """
    
    def __init__(self, config: ZendeskConfig, governance_adapter=None):
        self.config = config
        self.governance_adapter = governance_adapter
        self.session = None
        
        # Prepare authentication
        auth_string = f"{self.config.email}/token:{self.config.api_token}"
        self.auth_header = base64.b64encode(auth_string.encode()).decode()
        
        logger.info(f"🔗 [Zendesk] Initializing integration with {config.subdomain}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get standard headers for Zendesk API requests"""
        return {
            "Authorization": f"Basic {self.auth_header}",
            "Content-Type": "application/json"
        }
    
    # ============================================================================
    # USER MANAGEMENT
    # ============================================================================
    
    async def create_user(self, user: ZendeskUser, chat_context: Dict = None) -> Optional[int]:
        """Create a new user in Zendesk"""
        try:
            logger.info(f"👤 [Zendesk] Creating user for {user.email}")
            
            # Prepare user data
            user_data = {
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "verified": user.verified,
                "tags": user.tags
            }
            
            # Add optional fields
            if user.phone:
                user_data["phone"] = user.phone
            if user.organization_id:
                user_data["organization_id"] = user.organization_id
            
            # Add chat context as notes
            if chat_context:
                user_data["notes"] = f"Chat Context: {json.dumps(chat_context, indent=2)}"
            
            # Add custom user fields
            if user.user_fields:
                user_data["user_fields"] = user.user_fields
            
            # Prepare request data
            request_data = {"user": user_data}
            
            # Make API request
            url = f"{self.config.base_url}/api/{self.config.api_version}/users.json"
            headers = self._get_headers()
            
            async with self.session.post(url, json=request_data, headers=headers) as response:
                if response.status == 201:
                    result = await response.json()
                    user_id = result["user"]["id"]
                    
                    logger.info(f"✅ [Zendesk] User created successfully: {user_id}")
                    
                    # Log user creation for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"zd_user_{user_id}",
                            "agent_id": "zendesk_integration",
                            "event_type": "user_creation",
                            "user_id": user_id,
                            "user_email": user.email,
                            "integration": "zendesk",
                            "status": "success"
                        })
                    
                    return user_id
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [Zendesk] User creation failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [Zendesk] User creation error: {e}")
            return None
    
    async def search_users(self, email: str) -> List[Dict]:
        """Search for users by email"""
        try:
            # Use Zendesk search API
            query = f"type:user email:{email}"
            encoded_query = urlencode({"query": query})
            
            url = f"{self.config.base_url}/api/{self.config.api_version}/search.json?{encoded_query}"
            headers = self._get_headers()
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("results", [])
                else:
                    logger.error(f"❌ [Zendesk] User search failed: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"❌ [Zendesk] User search error: {e}")
            return []
    
    async def get_user(self, user_id: int) -> Optional[Dict]:
        """Get user details"""
        try:
            url = f"{self.config.base_url}/api/{self.config.api_version}/users/{user_id}.json"
            headers = self._get_headers()
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("user")
                else:
                    logger.error(f"❌ [Zendesk] Failed to get user {user_id}: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [Zendesk] Get user error: {e}")
            return None
    
    # ============================================================================
    # TICKET MANAGEMENT
    # ============================================================================
    
    async def create_ticket(self, ticket: ZendeskTicket, chat_transcript: Optional[str] = None) -> Optional[int]:
        """Create a new ticket in Zendesk"""
        try:
            logger.info(f"🎫 [Zendesk] Creating ticket: {ticket.subject}")
            
            # Prepare ticket data
            ticket_data = {
                "subject": ticket.subject,
                "description": ticket.description,
                "priority": ticket.priority,
                "status": ticket.status,
                "type": ticket.ticket_type,
                "tags": ticket.tags
            }
            
            # Add requester information
            if ticket.requester_id:
                ticket_data["requester_id"] = ticket.requester_id
            elif ticket.requester_email:
                ticket_data["requester"] = {"email": ticket.requester_email}
            
            # Add assignment information
            if ticket.group_id:
                ticket_data["group_id"] = ticket.group_id
            if ticket.assignee_id:
                ticket_data["assignee_id"] = ticket.assignee_id
            
            # Add chat transcript
            if chat_transcript:
                ticket_data["description"] = f"{ticket_data['description']}\n\n--- Chat Transcript ---\n{chat_transcript}"
            
            # Add custom fields
            if ticket.custom_fields:
                ticket_data["custom_fields"] = ticket.custom_fields
            
            # Prepare request data
            request_data = {"ticket": ticket_data}
            
            # Make API request
            url = f"{self.config.base_url}/api/{self.config.api_version}/tickets.json"
            headers = self._get_headers()
            
            async with self.session.post(url, json=request_data, headers=headers) as response:
                if response.status == 201:
                    result = await response.json()
                    ticket_id = result["ticket"]["id"]
                    
                    logger.info(f"✅ [Zendesk] Ticket created successfully: {ticket_id}")
                    
                    # Log ticket creation for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"zd_ticket_{ticket_id}",
                            "agent_id": "zendesk_integration",
                            "event_type": "ticket_creation",
                            "ticket_id": ticket_id,
                            "ticket_subject": ticket.subject,
                            "requester_email": ticket.requester_email,
                            "integration": "zendesk",
                            "status": "success"
                        })
                    
                    return ticket_id
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [Zendesk] Ticket creation failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [Zendesk] Ticket creation error: {e}")
            return None
    
    async def update_ticket(self, ticket_id: int, updates: Dict[str, Any]) -> bool:
        """Update an existing ticket"""
        try:
            logger.info(f"🔄 [Zendesk] Updating ticket {ticket_id}")
            
            # Prepare request data
            request_data = {"ticket": updates}
            
            url = f"{self.config.base_url}/api/{self.config.api_version}/tickets/{ticket_id}.json"
            headers = self._get_headers()
            
            async with self.session.put(url, json=request_data, headers=headers) as response:
                if response.status == 200:
                    logger.info(f"✅ [Zendesk] Ticket updated successfully: {ticket_id}")
                    
                    # Log update for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"zd_ticket_update_{ticket_id}",
                            "agent_id": "zendesk_integration",
                            "event_type": "ticket_update",
                            "ticket_id": ticket_id,
                            "updates": updates,
                            "integration": "zendesk",
                            "status": "success"
                        })
                    
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [Zendesk] Ticket update failed: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ [Zendesk] Ticket update error: {e}")
            return False
    
    async def get_ticket(self, ticket_id: int) -> Optional[Dict]:
        """Get ticket details"""
        try:
            url = f"{self.config.base_url}/api/{self.config.api_version}/tickets/{ticket_id}.json"
            headers = self._get_headers()
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("ticket")
                else:
                    logger.error(f"❌ [Zendesk] Failed to get ticket {ticket_id}: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [Zendesk] Get ticket error: {e}")
            return None
    
    async def add_ticket_comment(self, ticket_id: int, comment: str, public: bool = True, author_id: Optional[int] = None) -> bool:
        """Add a comment to a ticket"""
        try:
            logger.info(f"💬 [Zendesk] Adding comment to ticket {ticket_id}")
            
            # Prepare comment data
            comment_data = {
                "body": comment,
                "public": public
            }
            
            if author_id:
                comment_data["author_id"] = author_id
            
            # Prepare request data
            request_data = {
                "ticket": {
                    "comment": comment_data
                }
            }
            
            url = f"{self.config.base_url}/api/{self.config.api_version}/tickets/{ticket_id}.json"
            headers = self._get_headers()
            
            async with self.session.put(url, json=request_data, headers=headers) as response:
                if response.status == 200:
                    logger.info(f"✅ [Zendesk] Comment added successfully to ticket {ticket_id}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [Zendesk] Comment addition failed: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ [Zendesk] Comment addition error: {e}")
            return False
    
    # ============================================================================
    # ORGANIZATION MANAGEMENT
    # ============================================================================
    
    async def create_organization(self, organization: ZendeskOrganization) -> Optional[int]:
        """Create a new organization in Zendesk"""
        try:
            logger.info(f"🏢 [Zendesk] Creating organization: {organization.name}")
            
            # Prepare organization data
            org_data = {
                "name": organization.name,
                "shared_tickets": organization.shared_tickets,
                "shared_comments": organization.shared_comments,
                "tags": organization.tags
            }
            
            # Add optional fields
            if organization.domain_names:
                org_data["domain_names"] = organization.domain_names
            if organization.details:
                org_data["details"] = organization.details
            if organization.notes:
                org_data["notes"] = organization.notes
            if organization.group_id:
                org_data["group_id"] = organization.group_id
            
            # Add custom organization fields
            if organization.organization_fields:
                org_data["organization_fields"] = organization.organization_fields
            
            # Prepare request data
            request_data = {"organization": org_data}
            
            # Make API request
            url = f"{self.config.base_url}/api/{self.config.api_version}/organizations.json"
            headers = self._get_headers()
            
            async with self.session.post(url, json=request_data, headers=headers) as response:
                if response.status == 201:
                    result = await response.json()
                    org_id = result["organization"]["id"]
                    
                    logger.info(f"✅ [Zendesk] Organization created successfully: {org_id}")
                    
                    # Log organization creation for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"zd_org_{org_id}",
                            "agent_id": "zendesk_integration",
                            "event_type": "organization_creation",
                            "organization_id": org_id,
                            "organization_name": organization.name,
                            "integration": "zendesk",
                            "status": "success"
                        })
                    
                    return org_id
                else:
                    error_text = await response.text()
                    logger.error(f"❌ [Zendesk] Organization creation failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ [Zendesk] Organization creation error: {e}")
            return None
    
    # ============================================================================
    # AUTOMATION AND TRIGGERS
    # ============================================================================
    
    async def create_ticket_with_automation(self, ticket: ZendeskTicket, automation_rules: Dict = None) -> Optional[int]:
        """Create a ticket with automated routing and assignment"""
        try:
            # Create the base ticket
            ticket_id = await self.create_ticket(ticket)
            if not ticket_id:
                return None
            
            # Apply automation rules if provided
            if automation_rules:
                updates = {}
                
                # Auto-assignment based on keywords
                if "keywords" in automation_rules:
                    keywords = automation_rules["keywords"]
                    subject_lower = ticket.subject.lower()
                    description_lower = ticket.description.lower()
                    
                    for keyword, assignment in keywords.items():
                        if keyword.lower() in subject_lower or keyword.lower() in description_lower:
                            if "group_id" in assignment:
                                updates["group_id"] = assignment["group_id"]
                            if "assignee_id" in assignment:
                                updates["assignee_id"] = assignment["assignee_id"]
                            if "priority" in assignment:
                                updates["priority"] = assignment["priority"]
                            break
                
                # Priority escalation based on urgency words
                if "urgency_escalation" in automation_rules:
                    urgency_words = ["urgent", "emergency", "critical", "asap", "immediately"]
                    content = f"{ticket.subject} {ticket.description}".lower()
                    
                    if any(word in content for word in urgency_words):
                        updates["priority"] = "urgent"
                        updates["tags"] = ticket.tags + ["escalated", "urgent"]
                
                # Apply updates if any
                if updates:
                    await self.update_ticket(ticket_id, updates)
            
            return ticket_id
            
        except Exception as e:
            logger.error(f"❌ [Zendesk] Automated ticket creation error: {e}")
            return None
    
    # ============================================================================
    # KNOWLEDGE BASE INTEGRATION
    # ============================================================================
    
    async def search_knowledge_base(self, query: str, limit: int = 5) -> List[Dict]:
        """Search Zendesk knowledge base articles"""
        try:
            logger.info(f"🔍 [Zendesk] Searching knowledge base for: {query}")
            
            # Prepare search query
            search_query = f"type:article {query}"
            encoded_query = urlencode({"query": search_query, "per_page": limit})
            
            url = f"{self.config.base_url}/api/{self.config.api_version}/search.json?{encoded_query}"
            headers = self._get_headers()
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    articles = result.get("results", [])
                    
                    logger.info(f"✅ [Zendesk] Found {len(articles)} knowledge base articles")
                    return articles
                else:
                    logger.error(f"❌ [Zendesk] Knowledge base search failed: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"❌ [Zendesk] Knowledge base search error: {e}")
            return []
    
    # ============================================================================
    # UTILITY METHODS
    # ============================================================================
    
    async def test_connection(self) -> bool:
        """Test the Zendesk connection"""
        try:
            # Test with a simple API call
            url = f"{self.config.base_url}/api/{self.config.api_version}/users/me.json"
            headers = self._get_headers()
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    logger.info("✅ [Zendesk] Connection test successful")
                    return True
                else:
                    logger.error(f"❌ [Zendesk] Connection test failed: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ [Zendesk] Connection test error: {e}")
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get integration status"""
        return {
            "integration": "zendesk",
            "subdomain": self.config.subdomain,
            "base_url": self.config.base_url,
            "api_version": self.config.api_version,
            "authenticated": bool(self.config.api_token),
            "status": "active" if self.config.api_token else "inactive"
        }

