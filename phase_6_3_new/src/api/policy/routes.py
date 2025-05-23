"""
API routes for the Policy API in Promethios.

This module defines the routes for the Policy API, which is responsible for
enforcing governance policies, handling policy decisions, and managing policy
configurations.
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel, Field

from ..schema_validation.registry import SchemaRegistry

# Define API models
class PolicyEnforceRequest(BaseModel):
    """Request model for policy enforcement."""
    agent_id: str = Field(..., description="Unique identifier for the agent")
    task_id: str = Field(..., description="Identifier for the current task")
    action_type: str = Field(..., description="Type of action being evaluated")
    action_details: Dict[str, Any] = Field(..., description="Details of the action")
    context: Dict[str, Any] = Field(..., description="Contextual information for policy evaluation")
    timestamp: Optional[str] = Field(None, description="Optional timestamp (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "agent_id": "agent-123",
                "task_id": "task-456",
                "action_type": "file_write",
                "action_details": {
                    "path": "/home/user/sensitive_data.txt",
                    "content": "This is sensitive information",
                    "mode": "append"
                },
                "context": {
                    "user_permission_level": "standard",
                    "previous_actions": ["file_read", "network_access"],
                    "environment": "production"
                },
                "timestamp": "2025-05-22T03:50:12Z"
            }
        }

class PolicyEnforceResponse(BaseModel):
    """Response model for policy enforcement operations."""
    policy_decision_id: str = Field(..., description="Unique identifier for the policy decision")
    action: str = Field(..., description="Policy action (allow, deny, modify, log)")
    reason: str = Field(..., description="Reason for the policy decision")
    modifications: Optional[Dict[str, Any]] = Field(None, description="Modifications to the action if applicable")
    timestamp: str = Field(..., description="Timestamp of the decision (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "policy_decision_id": "pd-789",
                "action": "modify",
                "reason": "Sensitive data detected, applying redaction",
                "modifications": {
                    "content": "This is [REDACTED] information"
                },
                "timestamp": "2025-05-22T03:50:13Z"
            }
        }

class PolicyQueryRequest(BaseModel):
    """Request model for querying policy decisions."""
    agent_id: Optional[str] = Field(None, description="Optional filter by agent ID")
    action_type: Optional[str] = Field(None, description="Optional filter by action type")
    decision: Optional[str] = Field(None, description="Optional filter by decision (allow, deny, modify, log)")
    start_time: Optional[str] = Field(None, description="Optional start time filter (ISO format)")
    end_time: Optional[str] = Field(None, description="Optional end time filter (ISO format)")
    limit: int = Field(100, description="Maximum number of results to return")
    
    class Config:
        schema_extra = {
            "example": {
                "agent_id": "agent-123",
                "action_type": "file_write",
                "decision": "modify",
                "start_time": "2025-05-21T00:00:00Z",
                "end_time": "2025-05-22T23:59:59Z",
                "limit": 50
            }
        }

class PolicyDecision(BaseModel):
    """Model representing a policy decision."""
    policy_decision_id: str = Field(..., description="Unique identifier for the policy decision")
    agent_id: str = Field(..., description="Unique identifier for the agent")
    task_id: str = Field(..., description="Identifier for the task")
    action_type: str = Field(..., description="Type of action evaluated")
    action_details: Dict[str, Any] = Field(..., description="Details of the action")
    context: Dict[str, Any] = Field(..., description="Context of the evaluation")
    action: str = Field(..., description="Policy action taken")
    reason: str = Field(..., description="Reason for the decision")
    modifications: Optional[Dict[str, Any]] = Field(None, description="Modifications if applicable")
    timestamp: str = Field(..., description="Timestamp (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "policy_decision_id": "pd-789",
                "agent_id": "agent-123",
                "task_id": "task-456",
                "action_type": "file_write",
                "action_details": {
                    "path": "/home/user/sensitive_data.txt",
                    "content": "This is sensitive information",
                    "mode": "append"
                },
                "context": {
                    "user_permission_level": "standard",
                    "previous_actions": ["file_read", "network_access"],
                    "environment": "production"
                },
                "action": "modify",
                "reason": "Sensitive data detected, applying redaction",
                "modifications": {
                    "content": "This is [REDACTED] information"
                },
                "timestamp": "2025-05-22T03:50:13Z"
            }
        }

class PolicyQueryResponse(BaseModel):
    """Response model for policy query operations."""
    results: List[PolicyDecision] = Field(..., description="Query results")
    count: int = Field(..., description="Number of results returned")
    total: int = Field(..., description="Total number of matching results")
    
    class Config:
        schema_extra = {
            "example": {
                "results": [
                    {
                        "policy_decision_id": "pd-789",
                        "agent_id": "agent-123",
                        "task_id": "task-456",
                        "action_type": "file_write",
                        "action_details": {
                            "path": "/home/user/sensitive_data.txt",
                            "content": "This is sensitive information",
                            "mode": "append"
                        },
                        "context": {
                            "user_permission_level": "standard",
                            "previous_actions": ["file_read", "network_access"],
                            "environment": "production"
                        },
                        "action": "modify",
                        "reason": "Sensitive data detected, applying redaction",
                        "modifications": {
                            "content": "This is [REDACTED] information"
                        },
                        "timestamp": "2025-05-22T03:50:13Z"
                    }
                ],
                "count": 1,
                "total": 1
            }
        }

# Create router
router = APIRouter(
    prefix="/policy",
    tags=["policy"],
    responses={404: {"description": "Not found"}},
)

# Dependency for schema registry
def get_schema_registry():
    """Dependency to get the schema registry."""
    # In a real implementation, this would be a singleton or service
    return SchemaRegistry()

@router.post("/enforce", response_model=PolicyEnforceResponse)
async def enforce_policy(
    request: PolicyEnforceRequest,
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Enforce governance policies on an agent action.
    
    This endpoint evaluates an agent's proposed action against governance policies
    and returns a decision (allow, deny, modify, log). For modify decisions,
    the response includes the necessary modifications to make the action compliant.
    
    The policy evaluation considers the action type, details, and context to
    make appropriate governance decisions.
    """
    # In a real implementation, this would evaluate policies and return a decision
    # For now, we'll just return a mock response
    
    # Simple mock logic for demonstration
    action = "allow"
    reason = "Action complies with all policies"
    modifications = None
    
    # Mock sensitive data detection
    if request.action_type == "file_write" and "sensitive" in str(request.action_details.get("content", "")):
        action = "modify"
        reason = "Sensitive data detected, applying redaction"
        modifications = {
            "content": str(request.action_details.get("content", "")).replace("sensitive", "[REDACTED]")
        }
    
    return {
        "policy_decision_id": f"pd-{request.agent_id[-3:]}-{request.task_id[-3:]}",
        "action": action,
        "reason": reason,
        "modifications": modifications,
        "timestamp": request.timestamp or "2025-05-22T03:50:13Z"
    }

@router.get("/query", response_model=PolicyQueryResponse)
async def query_policies(
    agent_id: Optional[str] = Query(None, description="Optional filter by agent ID"),
    action_type: Optional[str] = Query(None, description="Optional filter by action type"),
    decision: Optional[str] = Query(None, description="Optional filter by decision"),
    start_time: Optional[str] = Query(None, description="Optional start time filter (ISO format)"),
    end_time: Optional[str] = Query(None, description="Optional end time filter (ISO format)"),
    limit: int = Query(100, description="Maximum number of results to return"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Query policy decisions.
    
    This endpoint allows querying of policy decisions based on various filters
    including agent ID, action type, decision, and time range. Results are paginated
    and can be limited to a maximum number.
    """
    # In a real implementation, this would query the policy decision store
    # For now, we'll just return a mock response
    mock_decision = PolicyDecision(
        policy_decision_id="pd-123-456",
        agent_id=agent_id or "agent-123",
        task_id="task-456",
        action_type=action_type or "file_write",
        action_details={
            "path": "/home/user/sensitive_data.txt",
            "content": "This is sensitive information",
            "mode": "append"
        },
        context={
            "user_permission_level": "standard",
            "previous_actions": ["file_read", "network_access"],
            "environment": "production"
        },
        action=decision or "modify",
        reason="Sensitive data detected, applying redaction",
        modifications={
            "content": "This is [REDACTED] information"
        },
        timestamp="2025-05-22T03:50:13Z"
    )
    
    return {
        "results": [mock_decision],
        "count": 1,
        "total": 1
    }

@router.get("/{policy_decision_id}", response_model=PolicyDecision)
async def get_policy_decision(
    policy_decision_id: str = Path(..., description="Unique identifier for the policy decision"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Get a specific policy decision by ID.
    
    This endpoint retrieves a single policy decision by its unique identifier.
    """
    # In a real implementation, this would retrieve the policy decision from storage
    # For now, we'll just return a mock response
    return {
        "policy_decision_id": policy_decision_id,
        "agent_id": "agent-123",
        "task_id": "task-456",
        "action_type": "file_write",
        "action_details": {
            "path": "/home/user/sensitive_data.txt",
            "content": "This is sensitive information",
            "mode": "append"
        },
        "context": {
            "user_permission_level": "standard",
            "previous_actions": ["file_read", "network_access"],
            "environment": "production"
        },
        "action": "modify",
        "reason": "Sensitive data detected, applying redaction",
        "modifications": {
            "content": "This is [REDACTED] information"
        },
        "timestamp": "2025-05-22T03:50:13Z"
    }
