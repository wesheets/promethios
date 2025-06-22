"""
API routes for the Policy API in Promethios.

This module defines the routes for the Policy API, which is responsible for
enforcing governance policies, handling policy decisions, and managing policy
configurations.
"""

import json
import subprocess
import uuid
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel, Field

def call_policy_management(method: str, *args) -> dict:
    """
    Call the Node.js Policy Management module.
    
    Args:
        method: The method name to call
        *args: Arguments to pass to the method
    
    Returns:
        dict: The result from the Node.js module
    """
    try:
        # Create a wrapper script to call the policy management module
        script = f"""
        const {{ PolicyManagement }} = require('./src/modules/policy_management/index.js');
        
        const policyManager = new PolicyManagement({{
            config: {{
                dataPath: './data/policy_management',
                enablePolicyEnforcement: true,
                defaultEnforcementLevel: 'MODERATE'
            }}
        }});
        
        const args = {json.dumps(list(args))};
        const result = policyManager.{method}(...args);
        console.log(JSON.stringify(result));
        """
        
        # Execute the Node.js script
        result = subprocess.run(
            ['node', '-e', script],
            cwd='/home/ubuntu/promethios',
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return json.loads(result.stdout.strip())
        else:
            return {
                "success": False,
                "error": f"Node.js execution failed: {result.stderr}"
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to call policy management: {str(e)}"
        }

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
    prefix="",
    tags=["policy"],
    responses={404: {"description": "Not found"}},
)

# Dependency for schema registry

@router.post("/enforce", response_model=PolicyEnforceResponse)
async def enforce_policy(
    request: PolicyEnforceRequest,
):
    """
    Enforce governance policies on an agent action.
    
    This endpoint evaluates an agent's proposed action against governance policies
    and returns a decision (allow, deny, modify, log). For modify decisions,
    the response includes the necessary modifications to make the action compliant.
    
    The policy evaluation considers the action type, details, and context to
    make appropriate governance decisions.
    """
    try:
        # Prepare action data for policy enforcement
        action_data = {
            "agent_id": request.agent_id,
            "task_id": request.task_id,
            "action_type": request.action_type,
            "action_details": request.action_details,
            "context": request.context,
            "timestamp": request.timestamp
        }
        
        # Call the Node.js policy management module
        enforcement_result = call_policy_management("enforcePolicy", action_data)
        
        if not enforcement_result.get("success", True):
            raise HTTPException(
                status_code=500,
                detail=f"Policy enforcement failed: {enforcement_result.get('error', 'Unknown error')}"
            )
        
        # Generate unique policy decision ID
        policy_decision_id = f"pd_{uuid.uuid4().hex[:8]}"
        
        # Extract decision from enforcement result
        decision = enforcement_result.get("decision", {})
        action = decision.get("action", "allow")
        reason = decision.get("reason", "Policy evaluation completed")
        modifications = decision.get("modifications")
        
        return {
            "policy_decision_id": policy_decision_id,
            "action": action,
            "reason": reason,
            "modifications": modifications,
            "timestamp": request.timestamp or "2025-06-22T12:00:00Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during policy enforcement: {str(e)}"
        )

@router.get("/query", response_model=PolicyQueryResponse)
async def query_policies(
    agent_id: Optional[str] = Query(None, description="Optional filter by agent ID"),
    action_type: Optional[str] = Query(None, description="Optional filter by action type"),
    decision: Optional[str] = Query(None, description="Optional filter by decision"),
    start_time: Optional[str] = Query(None, description="Optional start time filter (ISO format)"),
    end_time: Optional[str] = Query(None, description="Optional end time filter (ISO format)"),
    limit: int = Query(100, description="Maximum number of results to return"),
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

@router.get("/statistics")
async def get_policy_statistics():
    """Get policy system statistics."""
    try:
        stats = call_policy_management("getStatistics")
        
        return stats or {
            "total_policies": 0,
            "active_policies": 0,
            "draft_policies": 0,
            "total_exemptions": 0,
            "pending_exemptions": 0,
            "total_decisions": 0,
            "recent_decisions": 0
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during statistics retrieval: {str(e)}"
        )

# Additional Policy Management Endpoints

class PolicyCreateRequest(BaseModel):
    """Request model for creating a new policy."""
    name: str = Field(..., description="Human-readable name for the policy")
    description: Optional[str] = Field(None, description="Detailed description of the policy")
    policy_type: str = Field(..., description="Type of policy (SECURITY, COMPLIANCE, OPERATIONAL, ETHICAL, LEGAL)")
    status: Optional[str] = Field("DRAFT", description="Policy status (DRAFT, ACTIVE, DEPRECATED, ARCHIVED)")
    enforcement_level: Optional[str] = Field("MODERATE", description="Enforcement level (STRICT, MODERATE, ADVISORY)")
    rules: List[Dict[str, Any]] = Field(..., description="List of policy rules")
    version: Optional[str] = Field("1.0.0", description="Policy version")

class PolicyResponse(BaseModel):
    """Response model for policy operations."""
    policy_id: str = Field(..., description="Unique identifier for the policy")
    name: str = Field(..., description="Policy name")
    description: Optional[str] = Field(None, description="Policy description")
    policy_type: str = Field(..., description="Policy type")
    status: str = Field(..., description="Policy status")
    enforcement_level: str = Field(..., description="Enforcement level")
    rules: List[Dict[str, Any]] = Field(..., description="Policy rules")
    version: str = Field(..., description="Policy version")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class PolicyListResponse(BaseModel):
    """Response model for listing policies."""
    policies: List[PolicyResponse] = Field(..., description="List of policies")
    total: int = Field(..., description="Total number of policies")

@router.post("/policies", response_model=PolicyResponse)
async def create_policy(request: PolicyCreateRequest):
    """Create a new governance policy."""
    try:
        policy_data = {
            "name": request.name,
            "description": request.description,
            "policy_type": request.policy_type,
            "status": request.status,
            "enforcement_level": request.enforcement_level,
            "rules": request.rules,
            "version": request.version
        }
        
        result = call_policy_management("createPolicy", policy_data)
        
        if not result.get("success", False):
            raise HTTPException(
                status_code=400,
                detail=f"Policy creation failed: {result.get('error', 'Unknown error')}"
            )
        
        policy = result.get("policy", {})
        
        return PolicyResponse(
            policy_id=result.get("policy_id"),
            name=policy.get("name"),
            description=policy.get("description"),
            policy_type=policy.get("policy_type"),
            status=policy.get("status"),
            enforcement_level=policy.get("enforcement_level"),
            rules=policy.get("rules", []),
            version=policy.get("version"),
            created_at=policy.get("created_at"),
            updated_at=policy.get("updated_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during policy creation: {str(e)}"
        )

@router.get("/policies", response_model=PolicyListResponse)
async def list_policies(
    policy_type: Optional[str] = Query(None, description="Filter by policy type"),
    status: Optional[str] = Query(None, description="Filter by policy status"),
    limit: int = Query(100, description="Maximum number of policies to return")
):
    """List governance policies."""
    try:
        filters = {}
        if policy_type:
            filters["policy_type"] = policy_type
        if status:
            filters["status"] = status
        
        policies = call_policy_management("listPolicies", filters)
        
        if not isinstance(policies, list):
            policies = []
        
        policy_responses = []
        for policy in policies[:limit]:
            policy_responses.append(PolicyResponse(
                policy_id=policy.get("policy_id"),
                name=policy.get("name"),
                description=policy.get("description"),
                policy_type=policy.get("policy_type"),
                status=policy.get("status"),
                enforcement_level=policy.get("enforcement_level"),
                rules=policy.get("rules", []),
                version=policy.get("version"),
                created_at=policy.get("created_at"),
                updated_at=policy.get("updated_at")
            ))
        
        return PolicyListResponse(
            policies=policy_responses,
            total=len(policies)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during policy listing: {str(e)}"
        )


# Generic policy decision route - MUST be last to avoid conflicts
@router.get("/{policy_decision_id}", response_model=PolicyDecision)
async def get_policy_decision(
    policy_decision_id: str = Path(..., description="Unique identifier for the policy decision"),
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

