"""
Business System Integrations API Routes
=======================================

FastAPI routes for managing business system integrations in the Promethios Chat platform.

Endpoints:
- Integration management (register, activate, deactivate)
- Lead capture and CRM integration
- Support ticket creation
- Webhook management
- Health monitoring and status
- Configuration management
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import json
import logging

# Import integration components
from integrations.integration_manager import (
    IntegrationManager, IntegrationType, IntegrationStatus, 
    IntegrationConfig, IntegrationResult, ChatContext
)
from integrations.salesforce_integration import SalesforceConfig
from integrations.hubspot_integration import HubSpotConfig
from integrations.zendesk_integration import ZendeskConfig
from integrations.webhook_integration import WebhookConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/chat/integrations", tags=["Chat Integrations"])

# Global integration manager instance
integration_manager = None

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class IntegrationConfigRequest(BaseModel):
    """Request model for integration configuration"""
    name: str = Field(..., description="Integration name")
    type: str = Field(..., description="Integration type (salesforce, hubspot, zendesk, webhook)")
    config: Dict[str, Any] = Field(..., description="Integration-specific configuration")
    enabled: bool = Field(True, description="Whether integration is enabled")
    priority: int = Field(1, description="Integration priority (1=highest)")
    tags: List[str] = Field(default_factory=list, description="Integration tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class LeadCaptureRequest(BaseModel):
    """Request model for lead capture"""
    first_name: str = Field(..., description="Lead first name")
    last_name: str = Field(..., description="Lead last name")
    email: str = Field(..., description="Lead email address")
    phone: Optional[str] = Field(None, description="Lead phone number")
    company: Optional[str] = Field(None, description="Lead company")
    title: Optional[str] = Field(None, description="Lead job title")
    description: Optional[str] = Field(None, description="Lead description")
    chat_context: Dict[str, Any] = Field(default_factory=dict, description="Chat context data")
    integration_ids: Optional[List[str]] = Field(None, description="Specific integrations to use")

class SupportTicketRequest(BaseModel):
    """Request model for support ticket creation"""
    subject: str = Field(..., description="Ticket subject")
    description: str = Field(..., description="Ticket description")
    requester_email: Optional[str] = Field(None, description="Requester email")
    priority: str = Field("normal", description="Ticket priority")
    category: str = Field("question", description="Ticket category")
    chat_context: Dict[str, Any] = Field(default_factory=dict, description="Chat context data")
    integration_ids: Optional[List[str]] = Field(None, description="Specific integrations to use")

class WebhookNotificationRequest(BaseModel):
    """Request model for webhook notifications"""
    event_type: str = Field(..., description="Event type")
    data: Dict[str, Any] = Field(..., description="Event data")
    chat_context: Dict[str, Any] = Field(default_factory=dict, description="Chat context data")
    integration_ids: Optional[List[str]] = Field(None, description="Specific integrations to use")

class ChatContextModel(BaseModel):
    """Chat context model"""
    conversation_id: str = Field(..., description="Conversation ID")
    user_id: str = Field(..., description="User ID")
    agent_id: str = Field(..., description="Agent ID")
    messages: List[Dict[str, Any]] = Field(..., description="Chat messages")
    user_data: Dict[str, Any] = Field(default_factory=dict, description="User data")
    session_data: Dict[str, Any] = Field(default_factory=dict, description="Session data")

# ============================================================================
# DEPENDENCY FUNCTIONS
# ============================================================================

async def get_integration_manager() -> IntegrationManager:
    """Get or create integration manager instance"""
    global integration_manager
    
    if integration_manager is None:
        # Import governance adapter if available
        try:
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '../../services'))
            from UniversalGovernanceAdapter import UniversalGovernanceAdapter
            governance_adapter = UniversalGovernanceAdapter(context="integrations")
            logger.info("✅ [Integrations API] Universal Governance Adapter loaded")
        except ImportError as e:
            logger.warning(f"⚠️ [Integrations API] Could not load governance adapter: {e}")
            governance_adapter = None
        
        integration_manager = IntegrationManager(governance_adapter)
        logger.info("🔗 [Integrations API] Integration manager initialized")
    
    return integration_manager

def convert_chat_context(chat_context_data: Dict[str, Any]) -> ChatContext:
    """Convert chat context data to ChatContext object"""
    return ChatContext(
        conversation_id=chat_context_data.get("conversation_id", "unknown"),
        user_id=chat_context_data.get("user_id", "unknown"),
        agent_id=chat_context_data.get("agent_id", "unknown"),
        messages=chat_context_data.get("messages", []),
        user_data=chat_context_data.get("user_data", {}),
        session_data=chat_context_data.get("session_data", {})
    )

# ============================================================================
# INTEGRATION MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/register")
async def register_integration(
    config_request: IntegrationConfigRequest,
    manager: IntegrationManager = Depends(get_integration_manager)
):
    """Register a new business system integration"""
    try:
        logger.info(f"📝 [Integrations API] Registering integration: {config_request.name}")
        
        # Validate integration type
        try:
            integration_type = IntegrationType(config_request.type.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported integration type: {config_request.type}"
            )
        
        # Create integration config
        integration_config = IntegrationConfig(
            id=f"{config_request.type}_{config_request.name}".lower().replace(" ", "_"),
            name=config_request.name,
            type=integration_type,
            config=config_request.config,
            enabled=config_request.enabled,
            priority=config_request.priority,
            tags=config_request.tags,
            metadata=config_request.metadata
        )
        
        # Register integration
        success = await manager.register_integration(integration_config)
        
        if success:
            return {
                "success": True,
                "message": "Integration registered successfully",
                "integration_id": integration_config.id,
                "status": manager.get_integration_status(integration_config.id)
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to register integration"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [Integrations API] Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/activate/{integration_id}")
async def activate_integration(
    integration_id: str,
    manager: IntegrationManager = Depends(get_integration_manager)
):
    """Activate an integration"""
    try:
        logger.info(f"🔄 [Integrations API] Activating integration: {integration_id}")
        
        success = await manager.activate_integration(integration_id)
        
        if success:
            return {
                "success": True,
                "message": "Integration activated successfully",
                "status": manager.get_integration_status(integration_id)
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to activate integration"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [Integrations API] Activation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/deactivate/{integration_id}")
async def deactivate_integration(
    integration_id: str,
    manager: IntegrationManager = Depends(get_integration_manager)
):
    """Deactivate an integration"""
    try:
        logger.info(f"⏹️ [Integrations API] Deactivating integration: {integration_id}")
        
        success = await manager.deactivate_integration(integration_id)
        
        if success:
            return {
                "success": True,
                "message": "Integration deactivated successfully",
                "status": manager.get_integration_status(integration_id)
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to deactivate integration"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [Integrations API] Deactivation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_all_integrations_status(
    manager: IntegrationManager = Depends(get_integration_manager)
):
    """Get status of all integrations"""
    try:
        status = manager.get_integration_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        logger.error(f"❌ [Integrations API] Status retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{integration_id}")
async def get_integration_status(
    integration_id: str,
    manager: IntegrationManager = Depends(get_integration_manager)
):
    """Get status of a specific integration"""
    try:
        status = manager.get_integration_status(integration_id)
        
        if "error" in status:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        return {
            "success": True,
            "data": status
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [Integrations API] Status retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/health-check")
async def health_check_all_integrations(
    background_tasks: BackgroundTasks,
    manager: IntegrationManager = Depends(get_integration_manager)
):
    """Perform health check on all integrations"""
    try:
        logger.info("🏥 [Integrations API] Performing health check on all integrations")
        
        # Run health check in background
        health_results = await manager.health_check_all()
        
        return {
            "success": True,
            "message": "Health check completed",
            "results": health_results,
            "healthy_count": sum(1 for healthy in health_results.values() if healthy),
            "total_count": len(health_results)
        }
        
    except Exception as e:
        logger.error(f"❌ [Integrations API] Health check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# BUSINESS OPERATIONS ENDPOINTS
# ============================================================================

@router.post("/lead-capture")
async def capture_lead(
    lead_request: LeadCaptureRequest,
    manager: IntegrationManager = Depends(get_integration_manager)
):
    """Capture lead across CRM integrations"""
    try:
        logger.info(f"👤 [Integrations API] Capturing lead: {lead_request.email}")
        
        # Convert to lead data
        lead_data = {
            "first_name": lead_request.first_name,
            "last_name": lead_request.last_name,
            "email": lead_request.email,
            "phone": lead_request.phone,
            "company": lead_request.company,
            "title": lead_request.title,
            "description": lead_request.description
        }
        
        # Convert chat context
        chat_context = convert_chat_context(lead_request.chat_context)
        
        # Create lead across integrations
        results = await manager.create_lead(
            lead_data=lead_data,
            chat_context=chat_context,
            integration_ids=lead_request.integration_ids
        )
        
        # Analyze results
        successful_results = [r for r in results if r.success]
        failed_results = [r for r in results if not r.success]
        
        return {
            "success": len(successful_results) > 0,
            "message": f"Lead captured in {len(successful_results)} out of {len(results)} integrations",
            "results": [
                {
                    "integration_id": r.integration_id,
                    "integration_type": r.integration_type,
                    "success": r.success,
                    "result_data": r.result_data,
                    "error_message": r.error_message,
                    "execution_time": r.execution_time
                }
                for r in results
            ],
            "summary": {
                "total_integrations": len(results),
                "successful": len(successful_results),
                "failed": len(failed_results)
            }
        }
        
    except Exception as e:
        logger.error(f"❌ [Integrations API] Lead capture error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/support-ticket")
async def create_support_ticket(
    ticket_request: SupportTicketRequest,
    manager: IntegrationManager = Depends(get_integration_manager)
):
    """Create support ticket across helpdesk integrations"""
    try:
        logger.info(f"🎫 [Integrations API] Creating support ticket: {ticket_request.subject}")
        
        # Convert to ticket data
        ticket_data = {
            "subject": ticket_request.subject,
            "description": ticket_request.description,
            "requester_email": ticket_request.requester_email,
            "priority": ticket_request.priority,
            "category": ticket_request.category
        }
        
        # Convert chat context
        chat_context = convert_chat_context(ticket_request.chat_context)
        
        # Create ticket across integrations
        results = await manager.create_support_ticket(
            ticket_data=ticket_data,
            chat_context=chat_context,
            integration_ids=ticket_request.integration_ids
        )
        
        # Analyze results
        successful_results = [r for r in results if r.success]
        failed_results = [r for r in results if not r.success]
        
        return {
            "success": len(successful_results) > 0,
            "message": f"Ticket created in {len(successful_results)} out of {len(results)} integrations",
            "results": [
                {
                    "integration_id": r.integration_id,
                    "integration_type": r.integration_type,
                    "success": r.success,
                    "result_data": r.result_data,
                    "error_message": r.error_message,
                    "execution_time": r.execution_time
                }
                for r in results
            ],
            "summary": {
                "total_integrations": len(results),
                "successful": len(successful_results),
                "failed": len(failed_results)
            }
        }
        
    except Exception as e:
        logger.error(f"❌ [Integrations API] Support ticket error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook-notification")
async def send_webhook_notification(
    webhook_request: WebhookNotificationRequest,
    manager: IntegrationManager = Depends(get_integration_manager)
):
    """Send webhook notification to external systems"""
    try:
        logger.info(f"📤 [Integrations API] Sending webhook notification: {webhook_request.event_type}")
        
        # Convert chat context
        chat_context = convert_chat_context(webhook_request.chat_context)
        
        # Send webhook notifications
        results = await manager.send_webhook_notification(
            event_type=webhook_request.event_type,
            data=webhook_request.data,
            chat_context=chat_context,
            integration_ids=webhook_request.integration_ids
        )
        
        # Analyze results
        successful_results = [r for r in results if r.success]
        failed_results = [r for r in results if not r.success]
        
        return {
            "success": len(successful_results) > 0,
            "message": f"Webhook sent to {len(successful_results)} out of {len(results)} integrations",
            "results": [
                {
                    "integration_id": r.integration_id,
                    "integration_type": r.integration_type,
                    "success": r.success,
                    "result_data": r.result_data,
                    "error_message": r.error_message,
                    "execution_time": r.execution_time
                }
                for r in results
            ],
            "summary": {
                "total_integrations": len(results),
                "successful": len(successful_results),
                "failed": len(failed_results)
            }
        }
        
    except Exception as e:
        logger.error(f"❌ [Integrations API] Webhook notification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# CONFIGURATION ENDPOINTS
# ============================================================================

@router.get("/types")
async def get_supported_integration_types():
    """Get supported integration types and their capabilities"""
    try:
        manager = await get_integration_manager()
        
        integration_types = {}
        for int_type in IntegrationType:
            operations = manager.get_supported_operations(int_type)
            integration_types[int_type.value] = {
                "name": int_type.value.title(),
                "supported_operations": operations,
                "description": _get_integration_description(int_type)
            }
        
        return {
            "success": True,
            "data": integration_types
        }
        
    except Exception as e:
        logger.error(f"❌ [Integrations API] Types retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _get_integration_description(integration_type: IntegrationType) -> str:
    """Get description for integration type"""
    descriptions = {
        IntegrationType.SALESFORCE: "Salesforce CRM integration for lead and contact management",
        IntegrationType.HUBSPOT: "HubSpot marketing automation and CRM integration",
        IntegrationType.ZENDESK: "Zendesk support and helpdesk integration",
        IntegrationType.WEBHOOK: "Generic webhook integration for any HTTP-based system"
    }
    return descriptions.get(integration_type, "Unknown integration type")

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@router.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"❌ [Integrations API] Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "status_code": 500
        }
    )

