"""
Integration Manager
==================

Centralized manager for all business system integrations in the Promethios Chat platform.
Provides a unified interface for managing and coordinating multiple integrations.

Features:
- Unified integration interface
- Configuration management
- Health monitoring and status tracking
- Automatic failover and retry logic
- Load balancing across multiple integrations
- Governance oversight and audit logging
- Real-time synchronization coordination
- Integration lifecycle management
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Union, Type
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

# Import all integration classes
from salesforce_integration import SalesforceIntegration, SalesforceConfig, SalesforceContact, SalesforceCase
from hubspot_integration import HubSpotIntegration, HubSpotConfig, HubSpotContact, HubSpotDeal, HubSpotTicket
from zendesk_integration import ZendeskIntegration, ZendeskConfig, ZendeskUser, ZendeskTicket, ZendeskOrganization
from webhook_integration import WebhookIntegration, WebhookConfig, WebhookPayload

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IntegrationType(Enum):
    """Supported integration types"""
    SALESFORCE = "salesforce"
    HUBSPOT = "hubspot"
    ZENDESK = "zendesk"
    WEBHOOK = "webhook"
    SLACK = "slack"
    TEAMS = "teams"

class IntegrationStatus(Enum):
    """Integration status states"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    TESTING = "testing"
    DISABLED = "disabled"

@dataclass
class IntegrationConfig:
    """Universal integration configuration"""
    id: str
    name: str
    type: IntegrationType
    config: Dict[str, Any]
    enabled: bool = True
    priority: int = 1
    tags: List[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.metadata is None:
            self.metadata = {}

@dataclass
class IntegrationResult:
    """Result of an integration operation"""
    success: bool
    integration_id: str
    integration_type: str
    operation: str
    result_data: Optional[Dict] = None
    error_message: Optional[str] = None
    execution_time: float = 0.0
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)

@dataclass
class ChatContext:
    """Chat context for integrations"""
    conversation_id: str
    user_id: str
    agent_id: str
    messages: List[Dict]
    user_data: Dict[str, Any] = None
    session_data: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.user_data is None:
            self.user_data = {}
        if self.session_data is None:
            self.session_data = {}

class IntegrationManager:
    """
    Integration Manager
    
    Centralized manager for all business system integrations.
    Provides unified interface and coordination across multiple systems.
    """
    
    def __init__(self, governance_adapter=None):
        self.governance_adapter = governance_adapter
        self.integrations: Dict[str, Any] = {}
        self.configs: Dict[str, IntegrationConfig] = {}
        self.status: Dict[str, IntegrationStatus] = {}
        self.health_checks: Dict[str, datetime] = {}
        
        logger.info("🔗 [IntegrationManager] Initializing integration manager")
    
    # ============================================================================
    # INTEGRATION LIFECYCLE MANAGEMENT
    # ============================================================================
    
    async def register_integration(self, config: IntegrationConfig) -> bool:
        """Register a new integration"""
        try:
            logger.info(f"📝 [IntegrationManager] Registering integration: {config.name} ({config.type.value})")
            
            # Create integration instance based on type
            integration = None
            
            if config.type == IntegrationType.SALESFORCE:
                sf_config = SalesforceConfig(**config.config)
                integration = SalesforceIntegration(sf_config, self.governance_adapter)
                
            elif config.type == IntegrationType.HUBSPOT:
                hs_config = HubSpotConfig(**config.config)
                integration = HubSpotIntegration(hs_config, self.governance_adapter)
                
            elif config.type == IntegrationType.ZENDESK:
                zd_config = ZendeskConfig(**config.config)
                integration = ZendeskIntegration(zd_config, self.governance_adapter)
                
            elif config.type == IntegrationType.WEBHOOK:
                wh_config = WebhookConfig(**config.config)
                integration = WebhookIntegration(wh_config, self.governance_adapter)
            
            if integration:
                self.integrations[config.id] = integration
                self.configs[config.id] = config
                self.status[config.id] = IntegrationStatus.INACTIVE
                
                # Test connection if enabled
                if config.enabled:
                    await self.activate_integration(config.id)
                
                logger.info(f"✅ [IntegrationManager] Integration registered successfully: {config.id}")
                
                # Log registration for governance
                if self.governance_adapter:
                    await self.governance_adapter.createAuditEntry({
                        "interaction_id": f"integration_register_{config.id}",
                        "agent_id": "integration_manager",
                        "event_type": "integration_registered",
                        "integration_id": config.id,
                        "integration_type": config.type.value,
                        "integration_name": config.name,
                        "status": "success"
                    })
                
                return True
            else:
                logger.error(f"❌ [IntegrationManager] Unsupported integration type: {config.type}")
                return False
                
        except Exception as e:
            logger.error(f"❌ [IntegrationManager] Integration registration failed: {e}")
            return False
    
    async def activate_integration(self, integration_id: str) -> bool:
        """Activate an integration and test connection"""
        try:
            if integration_id not in self.integrations:
                logger.error(f"❌ [IntegrationManager] Integration not found: {integration_id}")
                return False
            
            logger.info(f"🔄 [IntegrationManager] Activating integration: {integration_id}")
            
            integration = self.integrations[integration_id]
            config = self.configs[integration_id]
            
            # Test connection
            async with integration:
                connection_test = await integration.test_connection()
                
                if connection_test:
                    self.status[integration_id] = IntegrationStatus.ACTIVE
                    self.health_checks[integration_id] = datetime.now(timezone.utc)
                    
                    logger.info(f"✅ [IntegrationManager] Integration activated: {integration_id}")
                    
                    # Log activation for governance
                    if self.governance_adapter:
                        await self.governance_adapter.createAuditEntry({
                            "interaction_id": f"integration_activate_{integration_id}",
                            "agent_id": "integration_manager",
                            "event_type": "integration_activated",
                            "integration_id": integration_id,
                            "integration_type": config.type.value,
                            "status": "success"
                        })
                    
                    return True
                else:
                    self.status[integration_id] = IntegrationStatus.ERROR
                    logger.error(f"❌ [IntegrationManager] Integration connection test failed: {integration_id}")
                    return False
                    
        except Exception as e:
            self.status[integration_id] = IntegrationStatus.ERROR
            logger.error(f"❌ [IntegrationManager] Integration activation failed: {e}")
            return False
    
    async def deactivate_integration(self, integration_id: str) -> bool:
        """Deactivate an integration"""
        try:
            if integration_id not in self.integrations:
                return False
            
            logger.info(f"⏹️ [IntegrationManager] Deactivating integration: {integration_id}")
            
            self.status[integration_id] = IntegrationStatus.INACTIVE
            
            # Log deactivation for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"integration_deactivate_{integration_id}",
                    "agent_id": "integration_manager",
                    "event_type": "integration_deactivated",
                    "integration_id": integration_id,
                    "status": "success"
                })
            
            return True
            
        except Exception as e:
            logger.error(f"❌ [IntegrationManager] Integration deactivation failed: {e}")
            return False
    
    # ============================================================================
    # UNIFIED INTEGRATION OPERATIONS
    # ============================================================================
    
    async def create_lead(self, lead_data: Dict, chat_context: ChatContext, integration_ids: List[str] = None) -> List[IntegrationResult]:
        """Create lead across multiple integrations"""
        results = []
        target_integrations = integration_ids or self._get_active_integrations_by_type([IntegrationType.SALESFORCE, IntegrationType.HUBSPOT])
        
        for integration_id in target_integrations:
            try:
                start_time = datetime.now(timezone.utc)
                integration = self.integrations[integration_id]
                config = self.configs[integration_id]
                
                logger.info(f"👤 [IntegrationManager] Creating lead in {config.name}")
                
                async with integration:
                    result_id = None
                    
                    if config.type == IntegrationType.SALESFORCE:
                        # Create Salesforce lead
                        sf_contact = SalesforceContact(
                            first_name=lead_data.get("first_name", ""),
                            last_name=lead_data.get("last_name", ""),
                            email=lead_data.get("email", ""),
                            phone=lead_data.get("phone"),
                            company=lead_data.get("company"),
                            description=lead_data.get("description")
                        )
                        result_id = await integration.create_lead(sf_contact, asdict(chat_context))
                        
                    elif config.type == IntegrationType.HUBSPOT:
                        # Create HubSpot contact
                        hs_contact = HubSpotContact(
                            email=lead_data.get("email", ""),
                            firstname=lead_data.get("first_name"),
                            lastname=lead_data.get("last_name"),
                            phone=lead_data.get("phone"),
                            company=lead_data.get("company"),
                            jobtitle=lead_data.get("title")
                        )
                        result_id = await integration.create_contact(hs_contact, asdict(chat_context))
                    
                    execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()
                    
                    if result_id:
                        results.append(IntegrationResult(
                            success=True,
                            integration_id=integration_id,
                            integration_type=config.type.value,
                            operation="create_lead",
                            result_data={"id": result_id},
                            execution_time=execution_time
                        ))
                    else:
                        results.append(IntegrationResult(
                            success=False,
                            integration_id=integration_id,
                            integration_type=config.type.value,
                            operation="create_lead",
                            error_message="Failed to create lead",
                            execution_time=execution_time
                        ))
                        
            except Exception as e:
                logger.error(f"❌ [IntegrationManager] Lead creation failed in {integration_id}: {e}")
                results.append(IntegrationResult(
                    success=False,
                    integration_id=integration_id,
                    integration_type=config.type.value,
                    operation="create_lead",
                    error_message=str(e)
                ))
        
        return results
    
    async def create_support_ticket(self, ticket_data: Dict, chat_context: ChatContext, integration_ids: List[str] = None) -> List[IntegrationResult]:
        """Create support ticket across multiple integrations"""
        results = []
        target_integrations = integration_ids or self._get_active_integrations_by_type([IntegrationType.ZENDESK, IntegrationType.HUBSPOT])
        
        # Generate chat transcript
        chat_transcript = self._generate_chat_transcript(chat_context)
        
        for integration_id in target_integrations:
            try:
                start_time = datetime.now(timezone.utc)
                integration = self.integrations[integration_id]
                config = self.configs[integration_id]
                
                logger.info(f"🎫 [IntegrationManager] Creating ticket in {config.name}")
                
                async with integration:
                    result_id = None
                    
                    if config.type == IntegrationType.ZENDESK:
                        # Create Zendesk ticket
                        zd_ticket = ZendeskTicket(
                            subject=ticket_data.get("subject", ""),
                            description=ticket_data.get("description", ""),
                            requester_email=ticket_data.get("requester_email"),
                            priority=ticket_data.get("priority", "normal"),
                            ticket_type=ticket_data.get("type", "question")
                        )
                        result_id = await integration.create_ticket(zd_ticket, chat_transcript)
                        
                    elif config.type == IntegrationType.HUBSPOT:
                        # Create HubSpot ticket
                        hs_ticket = HubSpotTicket(
                            subject=ticket_data.get("subject", ""),
                            content=ticket_data.get("description", ""),
                            priority=ticket_data.get("priority", "MEDIUM").upper(),
                            category=ticket_data.get("category", "SUPPORT_REQUEST")
                        )
                        result_id = await integration.create_ticket(hs_ticket, None, chat_transcript)
                    
                    execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()
                    
                    if result_id:
                        results.append(IntegrationResult(
                            success=True,
                            integration_id=integration_id,
                            integration_type=config.type.value,
                            operation="create_ticket",
                            result_data={"id": result_id},
                            execution_time=execution_time
                        ))
                    else:
                        results.append(IntegrationResult(
                            success=False,
                            integration_id=integration_id,
                            integration_type=config.type.value,
                            operation="create_ticket",
                            error_message="Failed to create ticket",
                            execution_time=execution_time
                        ))
                        
            except Exception as e:
                logger.error(f"❌ [IntegrationManager] Ticket creation failed in {integration_id}: {e}")
                results.append(IntegrationResult(
                    success=False,
                    integration_id=integration_id,
                    integration_type=config.type.value,
                    operation="create_ticket",
                    error_message=str(e)
                ))
        
        return results
    
    async def send_webhook_notification(self, event_type: str, data: Dict, chat_context: ChatContext, integration_ids: List[str] = None) -> List[IntegrationResult]:
        """Send webhook notifications to external systems"""
        results = []
        target_integrations = integration_ids or self._get_active_integrations_by_type([IntegrationType.WEBHOOK])
        
        for integration_id in target_integrations:
            try:
                start_time = datetime.now(timezone.utc)
                integration = self.integrations[integration_id]
                config = self.configs[integration_id]
                
                logger.info(f"📤 [IntegrationManager] Sending webhook to {config.name}")
                
                async with integration:
                    # Prepare webhook payload
                    webhook_payload = WebhookPayload(
                        event_type=event_type,
                        timestamp=datetime.now(timezone.utc),
                        data=data,
                        metadata={
                            "chat_context": asdict(chat_context),
                            "integration_manager": True
                        }
                    )
                    
                    response = await integration.send_webhook(webhook_payload)
                    execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()
                    
                    if response.success:
                        results.append(IntegrationResult(
                            success=True,
                            integration_id=integration_id,
                            integration_type=config.type.value,
                            operation="send_webhook",
                            result_data={"status_code": response.status_code},
                            execution_time=execution_time
                        ))
                    else:
                        results.append(IntegrationResult(
                            success=False,
                            integration_id=integration_id,
                            integration_type=config.type.value,
                            operation="send_webhook",
                            error_message=response.error_message,
                            execution_time=execution_time
                        ))
                        
            except Exception as e:
                logger.error(f"❌ [IntegrationManager] Webhook sending failed in {integration_id}: {e}")
                results.append(IntegrationResult(
                    success=False,
                    integration_id=integration_id,
                    integration_type=config.type.value,
                    operation="send_webhook",
                    error_message=str(e)
                ))
        
        return results
    
    # ============================================================================
    # HEALTH MONITORING
    # ============================================================================
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Perform health check on all active integrations"""
        health_results = {}
        
        for integration_id, integration in self.integrations.items():
            if self.status[integration_id] == IntegrationStatus.ACTIVE:
                try:
                    async with integration:
                        is_healthy = await integration.test_connection()
                        health_results[integration_id] = is_healthy
                        
                        if is_healthy:
                            self.health_checks[integration_id] = datetime.now(timezone.utc)
                        else:
                            self.status[integration_id] = IntegrationStatus.ERROR
                            
                except Exception as e:
                    logger.error(f"❌ [IntegrationManager] Health check failed for {integration_id}: {e}")
                    health_results[integration_id] = False
                    self.status[integration_id] = IntegrationStatus.ERROR
            else:
                health_results[integration_id] = False
        
        return health_results
    
    # ============================================================================
    # UTILITY METHODS
    # ============================================================================
    
    def _get_active_integrations_by_type(self, types: List[IntegrationType]) -> List[str]:
        """Get active integrations by type"""
        active_integrations = []
        
        for integration_id, config in self.configs.items():
            if (config.type in types and 
                config.enabled and 
                self.status[integration_id] == IntegrationStatus.ACTIVE):
                active_integrations.append(integration_id)
        
        # Sort by priority
        active_integrations.sort(key=lambda x: self.configs[x].priority)
        return active_integrations
    
    def _generate_chat_transcript(self, chat_context: ChatContext) -> str:
        """Generate formatted chat transcript"""
        transcript_lines = []
        transcript_lines.append(f"Chat Transcript - Conversation ID: {chat_context.conversation_id}")
        transcript_lines.append(f"User ID: {chat_context.user_id}")
        transcript_lines.append(f"Agent ID: {chat_context.agent_id}")
        transcript_lines.append("=" * 50)
        
        for message in chat_context.messages:
            timestamp = message.get("timestamp", "Unknown")
            sender = message.get("sender", "Unknown")
            content = message.get("content", "")
            
            transcript_lines.append(f"[{timestamp}] {sender}: {content}")
        
        transcript_lines.append("=" * 50)
        transcript_lines.append(f"Generated: {datetime.now(timezone.utc).isoformat()}")
        
        return "\n".join(transcript_lines)
    
    def get_integration_status(self, integration_id: str = None) -> Dict[str, Any]:
        """Get status of integrations"""
        if integration_id:
            if integration_id in self.integrations:
                config = self.configs[integration_id]
                integration = self.integrations[integration_id]
                
                return {
                    "id": integration_id,
                    "name": config.name,
                    "type": config.type.value,
                    "status": self.status[integration_id].value,
                    "enabled": config.enabled,
                    "priority": config.priority,
                    "last_health_check": self.health_checks.get(integration_id),
                    "integration_status": integration.get_status() if hasattr(integration, 'get_status') else {}
                }
            else:
                return {"error": "Integration not found"}
        else:
            # Return status of all integrations
            all_status = {}
            for int_id in self.integrations.keys():
                all_status[int_id] = self.get_integration_status(int_id)
            
            return {
                "total_integrations": len(self.integrations),
                "active_integrations": len([s for s in self.status.values() if s == IntegrationStatus.ACTIVE]),
                "integrations": all_status
            }
    
    def get_supported_operations(self, integration_type: IntegrationType) -> List[str]:
        """Get supported operations for an integration type"""
        operations_map = {
            IntegrationType.SALESFORCE: ["create_lead", "create_contact", "create_case", "search_contacts", "search_leads"],
            IntegrationType.HUBSPOT: ["create_contact", "create_deal", "create_ticket", "search_contacts", "trigger_workflow"],
            IntegrationType.ZENDESK: ["create_user", "create_ticket", "create_organization", "search_users", "search_knowledge_base"],
            IntegrationType.WEBHOOK: ["send_webhook", "send_chat_event", "send_lead_capture", "process_inbound_webhook"]
        }
        
        return operations_map.get(integration_type, [])

