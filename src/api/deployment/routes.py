"""
Deployment Management API Routes

FastAPI routes for managing governed wrapped agent deployments,
monitoring deployment status, and handling deployment lifecycle.
"""

from fastapi import APIRouter, HTTPException, Query, Path, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import uuid
import os

router = APIRouter()

# Request/Response Models
class DeploymentRequest(BaseModel):
    agent_id: str = Field(..., description="Unique agent identifier")
    agent_name: str = Field(..., description="Human-readable agent name")
    deployment_config: Dict[str, Any] = Field(..., description="Deployment configuration")
    target_environment: str = Field("production", description="Target deployment environment")
    governance_policies: List[str] = Field([], description="Applied governance policies")
    resource_requirements: Optional[Dict[str, Any]] = Field(None, description="Resource requirements")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class DeploymentStatus(BaseModel):
    deployment_id: str
    agent_id: str
    agent_name: str
    status: str  # pending, deploying, deployed, failed, stopped
    created_at: str
    updated_at: str
    target_environment: str
    deployment_url: Optional[str] = None
    logs: List[str] = []
    error_message: Optional[str] = None
    resource_usage: Optional[Dict[str, Any]] = None

class DeploymentAlert(BaseModel):
    id: str
    deployment_id: str
    type: str  # error, warning, info
    severity: str  # low, medium, high, critical
    message: str
    timestamp: str
    resolved: bool = False

class SystemMetrics(BaseModel):
    timestamp: str
    active_deployments: int
    total_deployments: int
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_io: Dict[str, float]
    deployment_success_rate: float

# Helper functions
def store_deployment_data(deployment: Dict[str, Any]) -> None:
    """Store deployment data to filesystem (temporary storage)"""
    try:
        os.makedirs(f"/tmp/deployments/{deployment['deployment_id']}", exist_ok=True)
        with open(f"/tmp/deployments/{deployment['deployment_id']}/config.json", 'w') as f:
            json.dump(deployment, f, indent=2)
    except Exception as e:
        print(f"Failed to store deployment data: {e}")

def load_deployment_data(deployment_id: str) -> Optional[Dict[str, Any]]:
    """Load deployment data from filesystem"""
    try:
        with open(f"/tmp/deployments/{deployment_id}/config.json", 'r') as f:
            return json.load(f)
    except Exception:
        return None

def update_deployment_status(deployment_id: str, status: str, logs: List[str] = None, error_message: str = None) -> None:
    """Update deployment status"""
    deployment = load_deployment_data(deployment_id)
    if deployment:
        deployment['status'] = status
        deployment['updated_at'] = datetime.utcnow().isoformat()
        if logs:
            deployment['logs'].extend(logs)
        if error_message:
            deployment['error_message'] = error_message
        store_deployment_data(deployment)

def simulate_deployment_process(deployment_id: str) -> None:
    """Simulate the deployment process (background task)"""
    import time
    
    # Simulate deployment steps
    steps = [
        ("Validating deployment configuration", 2),
        ("Preparing deployment environment", 3),
        ("Deploying agent container", 5),
        ("Configuring governance policies", 2),
        ("Starting health checks", 3),
        ("Deployment completed successfully", 1)
    ]
    
    for step_message, duration in steps:
        update_deployment_status(deployment_id, "deploying", [step_message])
        time.sleep(duration)
    
    # Final status update
    deployment = load_deployment_data(deployment_id)
    if deployment:
        deployment['status'] = 'deployed'
        deployment['deployment_url'] = f"https://agent-{deployment_id[:8]}.promethios.app"
        deployment['updated_at'] = datetime.utcnow().isoformat()
        store_deployment_data(deployment)

def list_all_deployments(status_filter: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """List all deployments with optional filtering"""
    deployments = []
    deployments_dir = "/tmp/deployments"
    
    if os.path.exists(deployments_dir):
        for deployment_id in os.listdir(deployments_dir):
            deployment_data = load_deployment_data(deployment_id)
            if deployment_data:
                # Apply status filter
                if status_filter and deployment_data.get("status") != status_filter:
                    continue
                deployments.append(deployment_data)
    
    # Sort by creation time (newest first)
    deployments.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    # Apply limit
    return deployments[:limit] if limit > 0 else deployments

# API Routes

@router.post("/deploy", response_model=DeploymentStatus)
async def deploy_agent(request: DeploymentRequest, background_tasks: BackgroundTasks):
    """Deploy a governed wrapped agent"""
    try:
        deployment_id = str(uuid.uuid4())
        
        # Create deployment record
        deployment = {
            "deployment_id": deployment_id,
            "agent_id": request.agent_id,
            "agent_name": request.agent_name,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "target_environment": request.target_environment,
            "deployment_config": request.deployment_config,
            "governance_policies": request.governance_policies,
            "resource_requirements": request.resource_requirements or {},
            "metadata": request.metadata or {},
            "logs": [f"Deployment initiated for agent {request.agent_name}"],
            "error_message": None,
            "deployment_url": None
        }
        
        # Store deployment data
        store_deployment_data(deployment)
        
        # Start background deployment process
        background_tasks.add_task(simulate_deployment_process, deployment_id)
        
        return DeploymentStatus(**deployment)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate deployment: {str(e)}")

@router.get("/deployments/{deployment_id}", response_model=DeploymentStatus)
async def get_deployment_status(deployment_id: str = Path(..., description="Deployment ID")):
    """Get deployment status and details"""
    try:
        deployment = load_deployment_data(deployment_id)
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")
        
        return DeploymentStatus(**deployment)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deployment status: {str(e)}")

@router.get("/deployments")
async def list_deployments(
    status: Optional[str] = Query(None, description="Filter by deployment status"),
    environment: Optional[str] = Query(None, description="Filter by target environment"),
    limit: int = Query(50, description="Maximum number of deployments to return"),
    agent_id: Optional[str] = Query(None, description="Filter by agent ID")
):
    """List deployments with optional filtering"""
    try:
        deployments = list_all_deployments(status, limit * 2)  # Get more for filtering
        
        # Apply additional filters
        if environment:
            deployments = [d for d in deployments if d.get("target_environment") == environment]
        
        if agent_id:
            deployments = [d for d in deployments if d.get("agent_id") == agent_id]
        
        # Apply final limit
        deployments = deployments[:limit]
        
        return {
            "deployments": [DeploymentStatus(**d) for d in deployments],
            "total_count": len(deployments),
            "filters_applied": {
                "status": status,
                "environment": environment,
                "agent_id": agent_id,
                "limit": limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list deployments: {str(e)}")

@router.post("/deployments/{deployment_id}/stop")
async def stop_deployment(deployment_id: str = Path(..., description="Deployment ID")):
    """Stop a running deployment"""
    try:
        deployment = load_deployment_data(deployment_id)
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")
        
        if deployment['status'] not in ['deployed', 'deploying']:
            raise HTTPException(status_code=400, detail=f"Cannot stop deployment with status: {deployment['status']}")
        
        # Update deployment status
        update_deployment_status(deployment_id, "stopped", ["Deployment stopped by user request"])
        
        return {"message": f"Deployment {deployment_id} stopped successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop deployment: {str(e)}")

@router.delete("/deployments/{deployment_id}")
async def delete_deployment(deployment_id: str = Path(..., description="Deployment ID")):
    """Delete a deployment record"""
    try:
        deployment_dir = f"/tmp/deployments/{deployment_id}"
        
        if not os.path.exists(deployment_dir):
            raise HTTPException(status_code=404, detail="Deployment not found")
        
        # Remove deployment directory
        import shutil
        shutil.rmtree(deployment_dir)
        
        return {"message": f"Deployment {deployment_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete deployment: {str(e)}")

@router.get("/deployments/{deployment_id}/logs")
async def get_deployment_logs(
    deployment_id: str = Path(..., description="Deployment ID"),
    limit: int = Query(100, description="Maximum number of log entries")
):
    """Get deployment logs"""
    try:
        deployment = load_deployment_data(deployment_id)
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")
        
        logs = deployment.get('logs', [])
        
        # Apply limit (get most recent logs)
        if limit > 0:
            logs = logs[-limit:]
        
        return {
            "deployment_id": deployment_id,
            "logs": logs,
            "total_count": len(logs)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deployment logs: {str(e)}")

@router.get("/alerts")
async def get_deployment_alerts(
    deployment_id: Optional[str] = Query(None, description="Filter by deployment ID"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    limit: int = Query(50, description="Maximum number of alerts")
):
    """Get deployment alerts"""
    try:
        # Mock alerts for now
        alerts = [
            {
                "id": str(uuid.uuid4()),
                "deployment_id": "dep_12345",
                "type": "warning",
                "severity": "medium",
                "message": "High memory usage detected in agent container",
                "timestamp": datetime.utcnow().isoformat(),
                "resolved": False
            },
            {
                "id": str(uuid.uuid4()),
                "deployment_id": "dep_67890",
                "type": "info",
                "severity": "low",
                "message": "Deployment completed successfully",
                "timestamp": datetime.utcnow().isoformat(),
                "resolved": True
            }
        ]
        
        # Apply filters
        if deployment_id:
            alerts = [a for a in alerts if a["deployment_id"] == deployment_id]
        
        if severity:
            alerts = [a for a in alerts if a["severity"] == severity]
        
        if resolved is not None:
            alerts = [a for a in alerts if a["resolved"] == resolved]
        
        # Apply limit
        alerts = alerts[:limit]
        
        return {
            "alerts": [DeploymentAlert(**alert) for alert in alerts],
            "total_count": len(alerts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deployment alerts: {str(e)}")

@router.get("/metrics", response_model=SystemMetrics)
async def get_system_metrics():
    """Get system deployment metrics"""
    try:
        # Calculate metrics from deployment data
        all_deployments = list_all_deployments()
        active_deployments = len([d for d in all_deployments if d.get('status') == 'deployed'])
        total_deployments = len(all_deployments)
        
        # Calculate success rate
        completed_deployments = [d for d in all_deployments if d.get('status') in ['deployed', 'failed']]
        successful_deployments = [d for d in completed_deployments if d.get('status') == 'deployed']
        success_rate = len(successful_deployments) / len(completed_deployments) if completed_deployments else 1.0
        
        return SystemMetrics(
            timestamp=datetime.utcnow().isoformat(),
            active_deployments=active_deployments,
            total_deployments=total_deployments,
            cpu_usage=45.2,  # Mock values
            memory_usage=62.1,
            disk_usage=34.8,
            network_io={"in": 1024.5, "out": 2048.3},
            deployment_success_rate=success_rate
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system metrics: {str(e)}")

@router.get("/health")
async def deployment_health_check():
    """Health check for deployment service"""
    try:
        # Check if deployment storage is accessible
        os.makedirs("/tmp/deployments", exist_ok=True)
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "deployment_storage": "healthy",
                "background_tasks": "healthy"
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

