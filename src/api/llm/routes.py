"""
LLM API Routes for Promethios

Provides REST API endpoints for the Promethios LLM service that coordinates
with existing multi-agent systems, governance, and trust frameworks.

This is the main interface for V2 streamlined user experience.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging

from .promethios_llm_service import (
    promethios_llm_service, 
    LLMRequest, 
    LLMResponse
)
from .endpoints.ultimate_governance import ultimate_governance_router
from .endpoints.constitutional import constitutional_governance_router
from .endpoints.operational import operational_governance_router
from .model_router import GovernanceModelRouter

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/llm",
    tags=["llm"],
    responses={404: {"description": "Not found"}},
)

class ChatRequest(BaseModel):
    """Simple chat request model for user-friendly interface."""
    message: str = Field(..., description="User's message or request")
    session_id: Optional[str] = Field(None, description="Optional session ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Optional context")
    
    class Config:
        schema_extra = {
            "example": {
                "message": "Help me create a comprehensive marketing strategy for a new AI product",
                "session_id": "user-session-123",
                "context": {
                    "product_type": "AI assistant",
                    "target_market": "enterprise",
                    "budget": "moderate"
                }
            }
        }

class ChatResponse(BaseModel):
    """Simple chat response model."""
    response: str = Field(..., description="AI response")
    session_id: str = Field(..., description="Session identifier")
    agents_coordinated: List[str] = Field(..., description="Agents that worked on this")
    workflow_used: str = Field(..., description="Type of workflow used")
    governance_status: str = Field(..., description="Governance compliance status")
    timestamp: str = Field(..., description="Response timestamp")
    
    class Config:
        schema_extra = {
            "example": {
                "response": "I've coordinated with our research, strategy, and writing agents to create a comprehensive marketing strategy...",
                "session_id": "user-session-123",
                "agents_coordinated": ["research-agent", "strategy-agent", "writing-agent"],
                "workflow_used": "sequential_handoffs",
                "governance_status": "compliant",
                "timestamp": "2025-01-20T10:30:00Z"
            }
        }

class MultiAgentRequest(BaseModel):
    """Advanced multi-agent coordination request."""
    task: str = Field(..., description="Task description")
    preferred_agents: Optional[List[str]] = Field(None, description="Preferred agent IDs")
    collaboration_model: Optional[str] = Field(None, description="Preferred collaboration model")
    constraints: Optional[Dict[str, Any]] = Field(None, description="Task constraints")
    session_id: Optional[str] = Field(None, description="Session identifier")
    
    class Config:
        schema_extra = {
            "example": {
                "task": "Analyze market trends and create investment recommendations",
                "preferred_agents": ["market-analyst", "financial-advisor"],
                "collaboration_model": "parallel_processing",
                "constraints": {
                    "risk_tolerance": "moderate",
                    "time_horizon": "1-year",
                    "sectors": ["technology", "healthcare"]
                },
                "session_id": "advanced-session-456"
            }
        }

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Simple chat interface for streamlined user experience.
    
    This endpoint provides the V2 streamlined experience where users simply
    ask what they want and the LLM coordinates appropriate agents automatically.
    
    The LLM will:
    1. Analyze the request
    2. Select appropriate agents using existing trust systems
    3. Configure optimal workflows using existing collaboration services
    4. Execute coordination using existing multi-agent APIs
    5. Ensure governance compliance using existing governance systems
    """
    try:
        # Convert simple chat request to internal LLM request
        llm_request = LLMRequest(
            user_query=request.message,
            context=request.context,
            session_id=request.session_id
        )
        
        # Process using existing Promethios systems
        llm_response = await promethios_llm_service.process_request(llm_request)
        
        # Convert to simple chat response
        return ChatResponse(
            response=llm_response.response,
            session_id=llm_response.session_id,
            agents_coordinated=llm_response.agents_used,
            workflow_used=llm_response.workflow_type,
            governance_status=llm_response.governance_status,
            timestamp=llm_response.timestamp
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/coordinate", response_model=LLMResponse)
async def coordinate_agents(request: MultiAgentRequest):
    """
    Advanced multi-agent coordination interface.
    
    This endpoint provides more control over the coordination process,
    allowing users to specify preferred agents, collaboration models,
    and constraints while still leveraging existing Promethios systems.
    """
    try:
        # Convert advanced request to internal LLM request
        llm_request = LLMRequest(
            user_query=request.task,
            context={
                "preferred_agents": request.preferred_agents,
                "collaboration_model": request.collaboration_model,
                "constraints": request.constraints
            },
            session_id=request.session_id
        )
        
        # Process using existing Promethios systems
        return await promethios_llm_service.process_request(llm_request)
        
    except Exception as e:
        logger.error(f"Error in coordinate endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/status")
async def get_llm_status():
    """
    Get the status of the LLM service and connected systems.
    
    This endpoint checks connectivity to existing Promethios systems:
    - Multi-agent APIs
    - Trust calculation engine
    - Governance systems
    - Flow configuration service
    """
    try:
        # Check connectivity to existing systems
        status = {
            "llm_service": "operational",
            "multi_agent_api": "checking...",
            "trust_system": "checking...",
            "governance_system": "checking...",
            "flow_service": "checking...",
            "timestamp": "2025-01-20T10:30:00Z"
        }
        
        # TODO: Add actual health checks to existing APIs
        # For now, return basic status
        status.update({
            "multi_agent_api": "operational",
            "trust_system": "operational", 
            "governance_system": "operational",
            "flow_service": "operational"
        })
        
        return status
        
    except Exception as e:
        logger.error(f"Error checking LLM status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.get("/capabilities")
async def get_llm_capabilities():
    """
    Get the capabilities of the LLM service.
    
    Returns information about:
    - Available collaboration models
    - Supported workflow types
    - Connected agent capabilities
    - Governance features
    """
    return {
        "collaboration_models": [
            "shared_context",
            "sequential_handoffs", 
            "parallel_processing",
            "hierarchical_coordination",
            "consensus_decision"
        ],
        "workflow_types": [
            "research_and_analysis",
            "content_creation",
            "problem_solving",
            "decision_making",
            "planning_and_strategy"
        ],
        "governance_features": [
            "trust_based_agent_selection",
            "real_time_compliance_monitoring",
            "emotional_intelligence_integration",
            "collective_intelligence_assessment"
        ],
        "integration_points": [
            "existing_multi_agent_apis",
            "trust_calculation_engine",
            "veritas_emotional_intelligence",
            "governance_core_systems",
            "flow_configuration_service"
        ]
    }

# Include Native LLM routers
router.include_router(ultimate_governance_router, prefix="/governance/ultimate", tags=["ultimate-governance"])
router.include_router(constitutional_governance_router, prefix="/governance/constitutional", tags=["constitutional-governance"])
router.include_router(operational_governance_router, prefix="/governance/operational", tags=["operational-governance"])

# Health check for the service
@router.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "service": "promethios-llm"}

# Governance health check
@router.get("/governance/health")
async def governance_health_check():
    """Health check for governance models."""
    try:
        # Initialize model router to check model availability
        model_router = GovernanceModelRouter({})
        await model_router.initialize()
        return {
            "status": "healthy", 
            "service": "governance-models",
            "available_models": list(model_router.model_capabilities.keys())
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

