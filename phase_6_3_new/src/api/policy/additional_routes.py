# Additional Policy Management API Models

class PolicyCreateRequest(BaseModel):
    """Request model for creating a new policy."""
    name: str = Field(..., description="Human-readable name for the policy")
    description: Optional[str] = Field(None, description="Detailed description of the policy")
    policy_type: str = Field(..., description="Type of policy (SECURITY, COMPLIANCE, OPERATIONAL, ETHICAL, LEGAL)")
    status: Optional[str] = Field("DRAFT", description="Policy status (DRAFT, ACTIVE, DEPRECATED, ARCHIVED)")
    enforcement_level: Optional[str] = Field("MODERATE", description="Enforcement level (STRICT, MODERATE, ADVISORY)")
    rules: List[Dict[str, Any]] = Field(..., description="List of policy rules")
    version: Optional[str] = Field("1.0.0", description="Policy version")
    
    class Config:
        schema_extra = {
            "example": {
                "name": "File Access Security Policy",
                "description": "Controls access to sensitive files",
                "policy_type": "SECURITY",
                "status": "ACTIVE",
                "enforcement_level": "STRICT",
                "rules": [
                    {
                        "condition": "deny_all",
                        "action_type": "file_delete",
                        "agent_pattern": "^external_.*"
                    }
                ],
                "version": "1.0.0"
            }
        }

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
    
class ExemptionCreateRequest(BaseModel):
    """Request model for creating a policy exemption."""
    policy_id: str = Field(..., description="ID of the policy to exempt from")
    agent_id: str = Field(..., description="ID of the agent requesting exemption")
    reason: str = Field(..., description="Reason for the exemption request")
    expires_at: Optional[str] = Field(None, description="Expiration timestamp (ISO format)")
    
class ExemptionResponse(BaseModel):
    """Response model for exemption operations."""
    exemption_id: str = Field(..., description="Unique identifier for the exemption")
    policy_id: str = Field(..., description="Policy ID")
    agent_id: str = Field(..., description="Agent ID")
    reason: str = Field(..., description="Exemption reason")
    status: str = Field(..., description="Exemption status")
    expires_at: Optional[str] = Field(None, description="Expiration timestamp")
    created_at: str = Field(..., description="Creation timestamp")

# Additional Policy Management Endpoints

@router.post("/policies", response_model=PolicyResponse)
async def create_policy(
    request: PolicyCreateRequest,
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Create a new governance policy.
    
    This endpoint creates a new policy with the specified rules and configuration.
    The policy will be validated and stored for future enforcement operations.
    """
    try:
        # Prepare policy data
        policy_data = {
            "name": request.name,
            "description": request.description,
            "policy_type": request.policy_type,
            "status": request.status,
            "enforcement_level": request.enforcement_level,
            "rules": request.rules,
            "version": request.version
        }
        
        # Call the Node.js policy management module
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
    limit: int = Query(100, description="Maximum number of policies to return"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    List governance policies.
    
    This endpoint returns a list of policies with optional filtering by type and status.
    """
    try:
        # Prepare filter data
        filters = {}
        if policy_type:
            filters["policy_type"] = policy_type
        if status:
            filters["status"] = status
        
        # Call the Node.js policy management module
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

@router.get("/policies/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: str = Path(..., description="Unique identifier of the policy"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Get a specific governance policy by ID.
    """
    try:
        # Call the Node.js policy management module
        policy = call_policy_management("getPolicy", policy_id)
        
        if not policy:
            raise HTTPException(
                status_code=404,
                detail=f"Policy with ID {policy_id} not found"
            )
        
        return PolicyResponse(
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
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during policy retrieval: {str(e)}"
        )

@router.put("/policies/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: str = Path(..., description="Unique identifier of the policy"),
    request: PolicyCreateRequest = None,
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Update an existing governance policy.
    """
    try:
        # Prepare update data
        update_data = {
            "name": request.name,
            "description": request.description,
            "policy_type": request.policy_type,
            "status": request.status,
            "enforcement_level": request.enforcement_level,
            "rules": request.rules,
            "version": request.version
        }
        
        # Call the Node.js policy management module
        result = call_policy_management("updatePolicy", policy_id, update_data)
        
        if not result.get("success", False):
            if "not found" in result.get("error", "").lower():
                raise HTTPException(
                    status_code=404,
                    detail=f"Policy with ID {policy_id} not found"
                )
            raise HTTPException(
                status_code=400,
                detail=f"Policy update failed: {result.get('error', 'Unknown error')}"
            )
        
        policy = result.get("policy", {})
        
        return PolicyResponse(
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
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during policy update: {str(e)}"
        )

@router.delete("/policies/{policy_id}")
async def delete_policy(
    policy_id: str = Path(..., description="Unique identifier of the policy"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Delete (archive) a governance policy.
    """
    try:
        # Call the Node.js policy management module
        result = call_policy_management("deletePolicy", policy_id)
        
        if not result.get("success", False):
            if "not found" in result.get("error", "").lower():
                raise HTTPException(
                    status_code=404,
                    detail=f"Policy with ID {policy_id} not found"
                )
            raise HTTPException(
                status_code=400,
                detail=f"Policy deletion failed: {result.get('error', 'Unknown error')}"
            )
        
        return {"message": f"Policy {policy_id} successfully archived"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during policy deletion: {str(e)}"
        )

@router.post("/exemptions", response_model=ExemptionResponse)
async def create_exemption(
    request: ExemptionCreateRequest,
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Create a policy exemption request.
    """
    try:
        # Prepare exemption data
        exemption_data = {
            "policy_id": request.policy_id,
            "agent_id": request.agent_id,
            "reason": request.reason,
            "expires_at": request.expires_at
        }
        
        # Call the Node.js policy management module
        result = call_policy_management("createExemption", exemption_data)
        
        if not result.get("success", False):
            raise HTTPException(
                status_code=400,
                detail=f"Exemption creation failed: {result.get('error', 'Unknown error')}"
            )
        
        exemption = result.get("exemption", {})
        
        return ExemptionResponse(
            exemption_id=result.get("exemption_id"),
            policy_id=exemption.get("policy_id"),
            agent_id=exemption.get("agent_id"),
            reason=exemption.get("reason"),
            status=exemption.get("status"),
            expires_at=exemption.get("expires_at"),
            created_at=exemption.get("created_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during exemption creation: {str(e)}"
        )

@router.get("/statistics")
async def get_policy_statistics(
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Get policy system statistics.
    """
    try:
        # Call the Node.js policy management module
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

