"""
API routes for the Override API in Promethios.

This module defines the routes for the Override API, which is responsible for
managing governance decision overrides, approval workflows, and override auditing.
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel, Field
from datetime import datetime

from ..schema_validation.registry import SchemaRegistry

# Define API models
class OverrideRequestModel(BaseModel):
    """Request model for requesting a governance override."""
    agent_id: str = Field(..., description="Unique identifier for the agent")
    policy_decision_id: str = Field(..., description="ID of the policy decision to override")
    requested_action: str = Field(..., description="Requested action (allow, modify)")
    justification: str = Field(..., description="Justification for the override request")
    risk_assessment: Dict[str, Any] = Field(..., description="Assessment of risks associated with the override")
    requested_by: str = Field(..., description="Identifier of the requester")
    expiration: Optional[str] = Field(None, description="Optional expiration time (ISO format)")
    timestamp: Optional[str] = Field(None, description="Optional timestamp (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "agent_id": "agent-123",
                "policy_decision_id": "pd-456",
                "requested_action": "allow",
                "justification": "Critical business need to access this resource for emergency response",
                "risk_assessment": {
                    "impact": "medium",
                    "likelihood": "low",
                    "mitigations": ["Temporary access only", "Enhanced monitoring", "Post-access review"]
                },
                "requested_by": "user-789",
                "expiration": "2025-05-23T03:53:30Z",
                "timestamp": "2025-05-22T03:53:20Z"
            }
        }

class OverrideResponseModel(BaseModel):
    """Response model for override request operations."""
    override_request_id: str = Field(..., description="Unique identifier for the override request")
    status: str = Field(..., description="Status of the request (pending, approved, rejected)")
    next_steps: List[str] = Field(..., description="Next steps in the approval process")
    estimated_completion: Optional[str] = Field(None, description="Estimated completion time (ISO format)")
    timestamp: str = Field(..., description="Timestamp of the request (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "override_request_id": "or-789",
                "status": "pending",
                "next_steps": [
                    "Security review",
                    "Management approval",
                    "Implementation"
                ],
                "estimated_completion": "2025-05-22T05:00:00Z",
                "timestamp": "2025-05-22T03:53:25Z"
            }
        }

class OverrideApprovalRequest(BaseModel):
    """Request model for approving or rejecting an override."""
    override_request_id: str = Field(..., description="Unique identifier for the override request")
    decision: str = Field(..., description="Approval decision (approve, reject)")
    approver_id: str = Field(..., description="Identifier of the approver")
    comments: Optional[str] = Field(None, description="Optional comments on the decision")
    conditions: Optional[List[str]] = Field(None, description="Optional conditions for approval")
    timestamp: Optional[str] = Field(None, description="Optional timestamp (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "override_request_id": "or-789",
                "decision": "approve",
                "approver_id": "admin-456",
                "comments": "Approved for emergency response purposes only",
                "conditions": [
                    "Access limited to 24 hours",
                    "Enhanced monitoring must be enabled",
                    "Post-incident review required"
                ],
                "timestamp": "2025-05-22T04:15:00Z"
            }
        }

class OverrideApprovalResponse(BaseModel):
    """Response model for override approval operations."""
    override_request_id: str = Field(..., description="Unique identifier for the override request")
    status: str = Field(..., description="Updated status of the request")
    implementation_details: Optional[Dict[str, Any]] = Field(None, description="Details for implementing the override")
    expiration: Optional[str] = Field(None, description="Expiration time of the override (ISO format)")
    timestamp: str = Field(..., description="Timestamp of the approval (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "override_request_id": "or-789",
                "status": "approved",
                "implementation_details": {
                    "override_type": "temporary_policy_exception",
                    "affected_policies": ["data_access_policy", "audit_policy"],
                    "implementation_steps": [
                        "Update policy configuration",
                        "Enable enhanced monitoring",
                        "Schedule automatic expiration"
                    ]
                },
                "expiration": "2025-05-23T04:15:00Z",
                "timestamp": "2025-05-22T04:15:05Z"
            }
        }

class OverrideQueryRequest(BaseModel):
    """Request model for querying override requests."""
    agent_id: Optional[str] = Field(None, description="Optional filter by agent ID")
    status: Optional[str] = Field(None, description="Optional filter by status")
    requested_by: Optional[str] = Field(None, description="Optional filter by requester")
    approver_id: Optional[str] = Field(None, description="Optional filter by approver")
    start_time: Optional[str] = Field(None, description="Optional start time filter (ISO format)")
    end_time: Optional[str] = Field(None, description="Optional end time filter (ISO format)")
    limit: int = Field(100, description="Maximum number of results to return")
    
    class Config:
        schema_extra = {
            "example": {
                "agent_id": "agent-123",
                "status": "approved",
                "requested_by": "user-789",
                "approver_id": "admin-456",
                "start_time": "2025-05-21T00:00:00Z",
                "end_time": "2025-05-22T23:59:59Z",
                "limit": 50
            }
        }

class OverrideRequest(BaseModel):
    """Model representing an override request."""
    override_request_id: str = Field(..., description="Unique identifier for the override request")
    agent_id: str = Field(..., description="Unique identifier for the agent")
    policy_decision_id: str = Field(..., description="ID of the policy decision")
    requested_action: str = Field(..., description="Requested action")
    justification: str = Field(..., description="Justification for the override")
    risk_assessment: Dict[str, Any] = Field(..., description="Risk assessment")
    requested_by: str = Field(..., description="Requester identifier")
    status: str = Field(..., description="Current status")
    approver_id: Optional[str] = Field(None, description="Approver identifier if applicable")
    approval_timestamp: Optional[str] = Field(None, description="Approval timestamp if applicable")
    expiration: Optional[str] = Field(None, description="Expiration time if applicable")
    created_timestamp: str = Field(..., description="Creation timestamp (ISO format)")
    updated_timestamp: str = Field(..., description="Last updated timestamp (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "override_request_id": "or-789",
                "agent_id": "agent-123",
                "policy_decision_id": "pd-456",
                "requested_action": "allow",
                "justification": "Critical business need to access this resource for emergency response",
                "risk_assessment": {
                    "impact": "medium",
                    "likelihood": "low",
                    "mitigations": ["Temporary access only", "Enhanced monitoring", "Post-access review"]
                },
                "requested_by": "user-789",
                "status": "approved",
                "approver_id": "admin-456",
                "approval_timestamp": "2025-05-22T04:15:05Z",
                "expiration": "2025-05-23T04:15:00Z",
                "created_timestamp": "2025-05-22T03:53:25Z",
                "updated_timestamp": "2025-05-22T04:15:05Z"
            }
        }

class OverrideQueryResponse(BaseModel):
    """Response model for override query operations."""
    results: List[OverrideRequest] = Field(..., description="Query results")
    count: int = Field(..., description="Number of results returned")
    total: int = Field(..., description="Total number of matching results")
    
    class Config:
        schema_extra = {
            "example": {
                "results": [
                    {
                        "override_request_id": "or-789",
                        "agent_id": "agent-123",
                        "policy_decision_id": "pd-456",
                        "requested_action": "allow",
                        "justification": "Critical business need to access this resource for emergency response",
                        "risk_assessment": {
                            "impact": "medium",
                            "likelihood": "low",
                            "mitigations": ["Temporary access only", "Enhanced monitoring", "Post-access review"]
                        },
                        "requested_by": "user-789",
                        "status": "approved",
                        "approver_id": "admin-456",
                        "approval_timestamp": "2025-05-22T04:15:05Z",
                        "expiration": "2025-05-23T04:15:00Z",
                        "created_timestamp": "2025-05-22T03:53:25Z",
                        "updated_timestamp": "2025-05-22T04:15:05Z"
                    }
                ],
                "count": 1,
                "total": 1
            }
        }

# Create router
router = APIRouter(
    prefix="/override",
    tags=["override"],
    responses={404: {"description": "Not found"}},
)

# Dependency for schema registry
def get_schema_registry():
    """Dependency to get the schema registry."""
    # In a real implementation, this would be a singleton or service
    return SchemaRegistry()

@router.post("/request", response_model=OverrideResponseModel)
async def request_override(
    request: OverrideRequestModel,
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Request a governance policy override.
    
    This endpoint allows agents or users to request an override of a governance
    policy decision. The request includes justification, risk assessment, and
    other details necessary for approval consideration.
    
    Override requests initiate an approval workflow that may involve multiple
    stakeholders depending on the nature and risk of the override.
    """
    # In a real implementation, this would create an override request and initiate approval workflow
    # For now, we'll just return a mock response
    
    # Simple mock logic for demonstration
    override_request_id = f"or-{request.agent_id[-3:]}-{request.policy_decision_id[-3:]}"
    
    # Mock next steps based on risk assessment
    next_steps = ["Security review", "Management approval", "Implementation"]
    if request.risk_assessment.get("impact") == "high":
        next_steps.insert(1, "Executive approval")
    
    # Mock estimated completion time (2 hours from now)
    now = datetime.now()
    estimated_completion = (now.replace(microsecond=0).isoformat() + "Z").replace(
        hour=now.hour + 2
    )
    
    return {
        "override_request_id": override_request_id,
        "status": "pending",
        "next_steps": next_steps,
        "estimated_completion": estimated_completion,
        "timestamp": request.timestamp or (now.replace(microsecond=0).isoformat() + "Z")
    }

@router.post("/approve", response_model=OverrideApprovalResponse)
async def approve_override(
    request: OverrideApprovalRequest,
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Approve or reject an override request.
    
    This endpoint allows authorized approvers to make decisions on override
    requests. Approvals can include conditions that must be met for the override
    to be implemented. Rejections should include reasons for the decision.
    
    Approved overrides include implementation details and an expiration time.
    """
    # In a real implementation, this would process the approval decision
    # For now, we'll just return a mock response
    
    # Simple mock logic for demonstration
    status = "approved" if request.decision == "approve" else "rejected"
    
    # Mock implementation details for approved overrides
    implementation_details = None
    expiration = None
    
    if status == "approved":
        implementation_details = {
            "override_type": "temporary_policy_exception",
            "affected_policies": ["data_access_policy", "audit_policy"],
            "implementation_steps": [
                "Update policy configuration",
                "Enable enhanced monitoring",
                "Schedule automatic expiration"
            ]
        }
        
        # Mock expiration (24 hours from approval)
        now = datetime.now()
        expiration = (now.replace(microsecond=0).isoformat() + "Z").replace(
            day=now.day + 1
        )
    
    return {
        "override_request_id": request.override_request_id,
        "status": status,
        "implementation_details": implementation_details,
        "expiration": expiration,
        "timestamp": request.timestamp or (datetime.now().replace(microsecond=0).isoformat() + "Z")
    }

@router.get("/query", response_model=OverrideQueryResponse)
async def query_overrides(
    agent_id: Optional[str] = Query(None, description="Optional filter by agent ID"),
    status: Optional[str] = Query(None, description="Optional filter by status"),
    requested_by: Optional[str] = Query(None, description="Optional filter by requester"),
    approver_id: Optional[str] = Query(None, description="Optional filter by approver"),
    start_time: Optional[str] = Query(None, description="Optional start time filter (ISO format)"),
    end_time: Optional[str] = Query(None, description="Optional end time filter (ISO format)"),
    limit: int = Query(100, description="Maximum number of results to return"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Query override requests.
    
    This endpoint allows querying of override requests based on various filters
    including agent ID, status, requester, approver, and time range. Results are
    paginated and can be limited to a maximum number.
    """
    # In a real implementation, this would query the override request store
    # For now, we'll just return a mock response
    mock_override = OverrideRequest(
        override_request_id="or-123-456",
        agent_id=agent_id or "agent-123",
        policy_decision_id="pd-456",
        requested_action="allow",
        justification="Critical business need to access this resource for emergency response",
        risk_assessment={
            "impact": "medium",
            "likelihood": "low",
            "mitigations": ["Temporary access only", "Enhanced monitoring", "Post-access review"]
        },
        requested_by=requested_by or "user-789",
        status=status or "approved",
        approver_id=approver_id or "admin-456",
        approval_timestamp="2025-05-22T04:15:05Z",
        expiration="2025-05-23T04:15:00Z",
        created_timestamp="2025-05-22T03:53:25Z",
        updated_timestamp="2025-05-22T04:15:05Z"
    )
    
    return {
        "results": [mock_override],
        "count": 1,
        "total": 1
    }

@router.get("/{override_request_id}", response_model=OverrideRequest)
async def get_override(
    override_request_id: str = Path(..., description="Unique identifier for the override request"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Get a specific override request by ID.
    
    This endpoint retrieves a single override request by its unique identifier.
    """
    # In a real implementation, this would retrieve the override request from storage
    # For now, we'll just return a mock response
    return {
        "override_request_id": override_request_id,
        "agent_id": "agent-123",
        "policy_decision_id": "pd-456",
        "requested_action": "allow",
        "justification": "Critical business need to access this resource for emergency response",
        "risk_assessment": {
            "impact": "medium",
            "likelihood": "low",
            "mitigations": ["Temporary access only", "Enhanced monitoring", "Post-access review"]
        },
        "requested_by": "user-789",
        "status": "approved",
        "approver_id": "admin-456",
        "approval_timestamp": "2025-05-22T04:15:05Z",
        "expiration": "2025-05-23T04:15:00Z",
        "created_timestamp": "2025-05-22T03:53:25Z",
        "updated_timestamp": "2025-05-22T04:15:05Z"
    }
