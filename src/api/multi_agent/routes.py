"""
API routes for Multi-Agent Coordination in Promethios.

This module defines the routes for the Multi-Agent API, which is responsible for
managing multi-agent coordination, shared context collaboration, and agent-to-agent
communication with governance integration.
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel, Field
import json
import subprocess
import os
from datetime import datetime

from ..schema_validation.registry import SchemaValidationRegistry

# Define API models
class MultiAgentContextRequest(BaseModel):
    """Request model for creating a multi-agent context."""
    name: str = Field(..., description="Name of the multi-agent context")
    agent_ids: List[str] = Field(..., description="List of agent IDs to include in the context")
    collaboration_model: str = Field(..., description="Collaboration model (shared_context, sequential, parallel, etc.)")
    policies: Dict[str, Any] = Field(default_factory=dict, description="Coordination policies")
    governance_enabled: bool = Field(True, description="Whether governance is enabled for this context")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional context metadata")
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Customer Support Team",
                "agent_ids": ["creative_agent", "factual_agent", "governance_agent"],
                "collaboration_model": "shared_context",
                "policies": {
                    "max_response_time": 30,
                    "require_consensus": False,
                    "governance_threshold": 0.8
                },
                "governance_enabled": True,
                "metadata": {
                    "department": "customer_service",
                    "priority": "high"
                }
            }
        }

class MultiAgentContextResponse(BaseModel):
    """Response model for multi-agent context creation."""
    context_id: str = Field(..., description="Unique identifier for the multi-agent context")
    name: str = Field(..., description="Name of the context")
    agent_ids: List[str] = Field(..., description="List of agent IDs in the context")
    collaboration_model: str = Field(..., description="Collaboration model being used")
    status: str = Field(..., description="Status of the context")
    created_at: str = Field(..., description="Creation timestamp (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "context_id": "ctx-12345",
                "name": "Customer Support Team",
                "agent_ids": ["creative_agent", "factual_agent", "governance_agent"],
                "collaboration_model": "shared_context",
                "status": "active",
                "created_at": "2025-06-20T12:00:00Z"
            }
        }

class AgentMessageRequest(BaseModel):
    """Request model for sending messages between agents."""
    context_id: str = Field(..., description="Multi-agent context ID")
    from_agent_id: str = Field(..., description="ID of the sending agent")
    to_agent_ids: List[str] = Field(..., description="IDs of recipient agents")
    message: Dict[str, Any] = Field(..., description="Message content")
    require_response: bool = Field(False, description="Whether a response is required")
    priority: str = Field("normal", description="Message priority (low, normal, high)")
    
    class Config:
        schema_extra = {
            "example": {
                "context_id": "ctx-12345",
                "from_agent_id": "creative_agent",
                "to_agent_ids": ["factual_agent"],
                "message": {
                    "type": "task_request",
                    "content": "Please research customer satisfaction metrics for Q4",
                    "task_id": "task-789"
                },
                "require_response": True,
                "priority": "high"
            }
        }

class AgentMessageResponse(BaseModel):
    """Response model for agent message operations."""
    message_id: str = Field(..., description="Unique identifier for the message")
    delivery_results: List[Dict[str, Any]] = Field(..., description="Delivery results for each recipient")
    timestamp: str = Field(..., description="Message timestamp (ISO format)")
    governance_data: Optional[Dict[str, Any]] = Field(None, description="Governance verification data")
    
    class Config:
        schema_extra = {
            "example": {
                "message_id": "msg-12345",
                "delivery_results": [
                    {
                        "recipient_id": "factual_agent",
                        "delivered": True,
                        "timestamp": "2025-06-20T12:01:00Z"
                    }
                ],
                "timestamp": "2025-06-20T12:01:00Z",
                "governance_data": {
                    "approved": True,
                    "trust_score": 0.92,
                    "compliance_level": "high"
                }
            }
        }

class ConversationHistoryRequest(BaseModel):
    """Request model for retrieving conversation history."""
    context_id: str = Field(..., description="Multi-agent context ID")
    from_agent_id: Optional[str] = Field(None, description="Filter by sender agent ID")
    message_type: Optional[str] = Field(None, description="Filter by message type")
    since: Optional[str] = Field(None, description="Filter messages since timestamp (ISO format)")
    limit: int = Field(50, description="Maximum number of messages to return")
    
    class Config:
        schema_extra = {
            "example": {
                "context_id": "ctx-12345",
                "from_agent_id": "creative_agent",
                "message_type": "task_response",
                "since": "2025-06-20T10:00:00Z",
                "limit": 25
            }
        }

class ConversationHistoryResponse(BaseModel):
    """Response model for conversation history."""
    context_id: str = Field(..., description="Multi-agent context ID")
    messages: List[Dict[str, Any]] = Field(..., description="List of messages")
    total_messages: int = Field(..., description="Total number of messages in context")
    filtered_count: int = Field(..., description="Number of messages returned after filtering")
    collaboration_model: str = Field(..., description="Collaboration model of the context")
    
    class Config:
        schema_extra = {
            "example": {
                "context_id": "ctx-12345",
                "messages": [
                    {
                        "id": "msg-12345",
                        "from_agent_id": "creative_agent",
                        "content": {
                            "type": "task_request",
                            "content": "Please research customer satisfaction metrics"
                        },
                        "timestamp": "2025-06-20T12:01:00Z"
                    }
                ],
                "total_messages": 15,
                "filtered_count": 1,
                "collaboration_model": "shared_context"
            }
        }

class CollaborationMetricsResponse(BaseModel):
    """Response model for collaboration metrics."""
    context_id: str = Field(..., description="Multi-agent context ID")
    collaboration_model: str = Field(..., description="Collaboration model")
    total_messages: int = Field(..., description="Total number of messages")
    active_agents: int = Field(..., description="Number of active agents")
    average_participation: float = Field(..., description="Average participation rate")
    agent_metrics: List[Dict[str, Any]] = Field(..., description="Per-agent metrics")
    governance_metrics: Dict[str, Any] = Field(..., description="Governance-related metrics")
    
    class Config:
        schema_extra = {
            "example": {
                "context_id": "ctx-12345",
                "collaboration_model": "shared_context",
                "total_messages": 25,
                "active_agents": 3,
                "average_participation": 0.85,
                "agent_metrics": [
                    {
                        "agent_id": "creative_agent",
                        "message_count": 8,
                        "participation_rate": 0.32,
                        "responsiveness": 0.9
                    }
                ],
                "governance_metrics": {
                    "average_trust_score": 0.88,
                    "compliance_rate": 0.95,
                    "governance_interventions": 2
                }
            }
        }

# Create router
router = APIRouter(
    prefix="/multi_agent",
    tags=["multi_agent"],
    responses={404: {"description": "Not found"}},
)

# Dependency for schema registry
def get_schema_registry():
    """Dependency to get the schema registry."""
    return SchemaValidationRegistry()

def get_multi_agent_coordination():
    """Get the multi-agent coordination instance."""
    # In a real implementation, this would be a singleton or service
    # For now, we'll use a simple approach to call the Node.js module
    return None

@router.post("/context", response_model=MultiAgentContextResponse)
async def create_multi_agent_context(
    request: MultiAgentContextRequest,
    schema_registry: SchemaValidationRegistry = Depends(get_schema_registry)
):
    """
    Create a new multi-agent coordination context.
    
    This endpoint creates a new context for multi-agent collaboration,
    setting up shared context management, agent communication protocols,
    and governance frameworks based on the specified collaboration model.
    """
    try:
        # Call the Node.js multi-agent coordination module
        coordination_script = os.path.join(
            os.path.dirname(__file__), 
            "../../modules/multi_agent_coordination/api_bridge.js"
        )
        
        # Prepare the request data
        request_data = {
            "action": "create_context",
            "data": {
                "name": request.name,
                "agentIds": request.agent_ids,
                "collaborationModel": request.collaboration_model,
                "policies": request.policies,
                "governanceEnabled": request.governance_enabled,
                "metadata": request.metadata
            }
        }
        
        # Execute the Node.js script
        result = subprocess.run(
            ["node", coordination_script],
            input=json.dumps(request_data),
            capture_output=True,
            text=True,
            cwd=os.path.dirname(coordination_script)
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Multi-agent coordination error: {result.stderr}"
            )
        
        response_data = json.loads(result.stdout)
        
        return MultiAgentContextResponse(
            context_id=response_data["contextId"],
            name=response_data["name"],
            agent_ids=response_data["agentIds"],
            collaboration_model=response_data["collaborationModel"],
            status=response_data["status"],
            created_at=response_data["createdAt"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create multi-agent context: {str(e)}"
        )

@router.post("/message", response_model=AgentMessageResponse)
async def send_agent_message(
    request: AgentMessageRequest,
    schema_registry: SchemaValidationRegistry = Depends(get_schema_registry)
):
    """
    Send a message between agents in a multi-agent context.
    
    This endpoint handles agent-to-agent communication with governance
    verification, shared context updates, and delivery tracking.
    """
    try:
        # Call the Node.js multi-agent coordination module
        coordination_script = os.path.join(
            os.path.dirname(__file__), 
            "../../modules/multi_agent_coordination/api_bridge.js"
        )
        
        # Prepare the request data
        request_data = {
            "action": "send_message",
            "data": {
                "contextId": request.context_id,
                "fromAgentId": request.from_agent_id,
                "toAgentIds": request.to_agent_ids,
                "message": request.message,
                "requireResponse": request.require_response,
                "priority": request.priority
            }
        }
        
        # Execute the Node.js script
        result = subprocess.run(
            ["node", coordination_script],
            input=json.dumps(request_data),
            capture_output=True,
            text=True,
            cwd=os.path.dirname(coordination_script)
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Message sending error: {result.stderr}"
            )
        
        response_data = json.loads(result.stdout)
        
        return AgentMessageResponse(
            message_id=response_data["messageId"],
            delivery_results=response_data["deliveryResults"],
            timestamp=response_data["timestamp"],
            governance_data=response_data.get("governanceData")
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send agent message: {str(e)}"
        )

@router.get("/context/{context_id}/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    context_id: str = Path(..., description="Multi-agent context ID"),
    from_agent_id: Optional[str] = Query(None, description="Filter by sender agent ID"),
    message_type: Optional[str] = Query(None, description="Filter by message type"),
    since: Optional[str] = Query(None, description="Filter messages since timestamp"),
    limit: int = Query(50, description="Maximum number of messages to return"),
    schema_registry: SchemaValidationRegistry = Depends(get_schema_registry)
):
    """
    Get conversation history for a multi-agent context.
    
    This endpoint retrieves the shared conversation history with optional
    filtering by agent, message type, or time range.
    """
    try:
        # Call the Node.js multi-agent coordination module
        coordination_script = os.path.join(
            os.path.dirname(__file__), 
            "../../modules/multi_agent_coordination/api_bridge.js"
        )
        
        # Prepare the request data
        request_data = {
            "action": "get_conversation_history",
            "data": {
                "contextId": context_id,
                "fromAgentId": from_agent_id,
                "messageType": message_type,
                "since": since,
                "limit": limit
            }
        }
        
        # Execute the Node.js script
        result = subprocess.run(
            ["node", coordination_script],
            input=json.dumps(request_data),
            capture_output=True,
            text=True,
            cwd=os.path.dirname(coordination_script)
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"History retrieval error: {result.stderr}"
            )
        
        response_data = json.loads(result.stdout)
        
        return ConversationHistoryResponse(
            context_id=response_data["contextId"],
            messages=response_data["messages"],
            total_messages=response_data["totalMessages"],
            filtered_count=response_data["filteredCount"],
            collaboration_model=response_data["collaborationModel"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get conversation history: {str(e)}"
        )

@router.get("/context/{context_id}/metrics", response_model=CollaborationMetricsResponse)
async def get_collaboration_metrics(
    context_id: str = Path(..., description="Multi-agent context ID"),
    schema_registry: SchemaValidationRegistry = Depends(get_schema_registry)
):
    """
    Get collaboration metrics for a multi-agent context.
    
    This endpoint provides detailed metrics about agent collaboration,
    participation rates, governance compliance, and overall effectiveness.
    """
    try:
        # Call the Node.js multi-agent coordination module
        coordination_script = os.path.join(
            os.path.dirname(__file__), 
            "../../modules/multi_agent_coordination/api_bridge.js"
        )
        
        # Prepare the request data
        request_data = {
            "action": "get_collaboration_metrics",
            "data": {
                "contextId": context_id
            }
        }
        
        # Execute the Node.js script
        result = subprocess.run(
            ["node", coordination_script],
            input=json.dumps(request_data),
            capture_output=True,
            text=True,
            cwd=os.path.dirname(coordination_script)
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Metrics retrieval error: {result.stderr}"
            )
        
        response_data = json.loads(result.stdout)
        
        return CollaborationMetricsResponse(
            context_id=response_data["contextId"],
            collaboration_model=response_data["collaborationModel"],
            total_messages=response_data["totalMessages"],
            active_agents=response_data["activeAgents"],
            average_participation=response_data["averageParticipation"],
            agent_metrics=response_data["agentMetrics"],
            governance_metrics=response_data["governanceMetrics"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get collaboration metrics: {str(e)}"
        )

@router.get("/context/{context_id}/agents", response_model=List[Dict[str, Any]])
async def get_context_agents(
    context_id: str = Path(..., description="Multi-agent context ID"),
    schema_registry: SchemaValidationRegistry = Depends(get_schema_registry)
):
    """
    Get information about agents in a multi-agent context.
    
    This endpoint returns detailed information about all agents
    participating in the specified context, including their status,
    capabilities, and communication metrics.
    """
    try:
        # Call the Node.js multi-agent coordination module
        coordination_script = os.path.join(
            os.path.dirname(__file__), 
            "../../modules/multi_agent_coordination/api_bridge.js"
        )
        
        # Prepare the request data
        request_data = {
            "action": "get_context_agents",
            "data": {
                "contextId": context_id
            }
        }
        
        # Execute the Node.js script
        result = subprocess.run(
            ["node", coordination_script],
            input=json.dumps(request_data),
            capture_output=True,
            text=True,
            cwd=os.path.dirname(coordination_script)
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Agent retrieval error: {result.stderr}"
            )
        
        response_data = json.loads(result.stdout)
        return response_data["agents"]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get context agents: {str(e)}"
        )

@router.delete("/context/{context_id}", response_model=Dict[str, str])
async def terminate_multi_agent_context(
    context_id: str = Path(..., description="Multi-agent context ID"),
    schema_registry: SchemaValidationRegistry = Depends(get_schema_registry)
):
    """
    Terminate a multi-agent coordination context.
    
    This endpoint shuts down a multi-agent context, cleaning up
    shared context data, communication channels, and governance
    tracking for all participating agents.
    """
    try:
        # Call the Node.js multi-agent coordination module
        coordination_script = os.path.join(
            os.path.dirname(__file__), 
            "../../modules/multi_agent_coordination/api_bridge.js"
        )
        
        # Prepare the request data
        request_data = {
            "action": "terminate_context",
            "data": {
                "contextId": context_id
            }
        }
        
        # Execute the Node.js script
        result = subprocess.run(
            ["node", coordination_script],
            input=json.dumps(request_data),
            capture_output=True,
            text=True,
            cwd=os.path.dirname(coordination_script)
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Context termination error: {result.stderr}"
            )
        
        return {
            "status": "success",
            "message": f"Multi-agent context {context_id} terminated successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to terminate context: {str(e)}"
        )

