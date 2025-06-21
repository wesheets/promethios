"""
Agent Scorecard API Routes

FastAPI endpoints that expose the existing agent scorecard and governance identity system.
Provides real backend data for agent scorecards with governance identities.
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel, Field
import subprocess
import json
import os
from datetime import datetime

# Initialize router
router = APIRouter(prefix="/api/agents", tags=["agents"])

# Pydantic models for API responses
class GovernanceIdentity(BaseModel):
    """Governance identity information"""
    type: str = Field(..., description="Type of governance framework")
    constitution_hash: str = Field(..., description="SHA-256 hash of governing constitution")
    compliance_level: str = Field(..., description="Level of compliance with governance framework")
    verification_endpoint: str = Field(..., description="URL endpoint for verifying governance identity")

class TrustScore(BaseModel):
    """Trust score information"""
    score: Optional[float] = Field(None, description="Composite trust score (0.0-1.0)")
    last_calculated: Optional[str] = Field(None, description="ISO timestamp of last calculation")
    calculation_method: str = Field("promethios_v1", description="Method used for calculation")

class ReflectionCompliance(BaseModel):
    """Reflection compliance metrics"""
    percentage: float = Field(..., description="Percentage of compliant reflections")
    total_reflections: int = Field(..., description="Total number of reflection operations")
    compliant_reflections: int = Field(..., description="Number of compliant reflections")

class BeliefTraceIntegrity(BaseModel):
    """Belief trace integrity metrics"""
    percentage: float = Field(..., description="Percentage of outputs with verified belief trace")
    total_outputs: int = Field(..., description="Total number of outputs")
    verified_outputs: int = Field(..., description="Number of verified outputs")

class ViolationHistory(BaseModel):
    """Governance violation history"""
    count: int = Field(..., description="Total number of violations")
    categories: Dict[str, int] = Field(..., description="Violations by category")
    recent_violations: List[Dict[str, Any]] = Field(..., description="Recent violations")

class PerformanceMetrics(BaseModel):
    """Agent performance metrics"""
    task_completion_rate: float = Field(..., description="Task completion rate percentage")
    average_response_time_ms: float = Field(..., description="Average response time in milliseconds")
    resource_efficiency_score: float = Field(..., description="Resource efficiency score (0.0-1.0)")
    uptime_percentage: float = Field(..., description="Uptime percentage")

class WarningState(BaseModel):
    """Agent warning state"""
    has_warning: bool = Field(..., description="Whether agent has active warnings")
    warning_level: str = Field(..., description="Warning level")
    warning_message: str = Field(..., description="Warning message")

class AgentScorecard(BaseModel):
    """Complete agent scorecard"""
    agent_id: str = Field(..., description="Unique agent identifier")
    scorecard_id: str = Field(..., description="Unique scorecard identifier")
    timestamp: str = Field(..., description="ISO timestamp of scorecard generation")
    governance_identity: GovernanceIdentity
    trust_score: TrustScore
    reflection_compliance: ReflectionCompliance
    belief_trace_integrity: BeliefTraceIntegrity
    violation_history: ViolationHistory
    performance_metrics: PerformanceMetrics
    warning_state: WarningState
    health_status: str = Field(..., description="Overall health status")
    deployment_status: str = Field(..., description="Current deployment status")

class AgentRegistration(BaseModel):
    """Agent registration request"""
    agent_id: str = Field(..., description="Unique agent identifier")
    name: str = Field(..., description="Human-readable agent name")
    description: Optional[str] = Field(None, description="Agent description")
    governance_framework: str = Field("promethios", description="Governance framework type")
    capabilities: List[str] = Field(default_factory=list, description="Agent capabilities")
    owner_id: str = Field(..., description="Owner user ID")

class AgentProfile(BaseModel):
    """Agent profile information"""
    agent_id: str
    name: str
    description: Optional[str]
    version: str
    governance_identity: GovernanceIdentity
    deployment_status: str
    health_status: str
    trust_score: TrustScore
    created_at: str
    last_updated: str
    owner_id: str

# Helper functions to interact with existing Node.js modules
def call_scorecard_manager(method: str, *args) -> Dict[str, Any]:
    """Call the existing Node.js ScorecardManager"""
    try:
        # Path to the scorecard manager
        script_path = "/home/ubuntu/promethios/src/modules/agent_scorecard/scorecard_manager.js"
        
        # Create a wrapper script that calls the method
        wrapper_script = f"""
const ScorecardManager = require('{script_path}');
const manager = new ScorecardManager();

async function callMethod() {{
    try {{
        const result = await manager.{method}({', '.join(f'"{arg}"' if isinstance(arg, str) else str(arg) for arg in args)});
        console.log(JSON.stringify(result));
    }} catch (error) {{
        console.error(JSON.stringify({{error: error.message}}));
        process.exit(1);
    }}
}}

callMethod();
"""
        
        # Write wrapper script to temp file
        temp_script = "/tmp/scorecard_wrapper.js"
        with open(temp_script, 'w') as f:
            f.write(wrapper_script)
        
        # Execute the script
        result = subprocess.run(
            ["node", temp_script],
            capture_output=True,
            text=True,
            cwd="/home/ubuntu/promethios"
        )
        
        if result.returncode != 0:
            raise Exception(f"Scorecard manager error: {result.stderr}")
        
        return json.loads(result.stdout.strip())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to call scorecard manager: {str(e)}")

def call_governance_identity(method: str, *args) -> Dict[str, Any]:
    """Call the existing Node.js GovernanceIdentity module"""
    try:
        # Path to the governance identity module
        script_path = "/home/ubuntu/promethios/src/modules/governance_identity/index.js"
        
        # Create a wrapper script
        wrapper_script = f"""
const GovernanceIdentity = require('{script_path}').GovernanceIdentity;
const identity = new GovernanceIdentity({{logger: console}});

async function callMethod() {{
    try {{
        const result = await identity.{method}({', '.join(f'"{arg}"' if isinstance(arg, str) else str(arg) for arg in args)});
        console.log(JSON.stringify(result));
    }} catch (error) {{
        console.error(JSON.stringify({{error: error.message}}));
        process.exit(1);
    }}
}}

callMethod();
"""
        
        # Write and execute wrapper script
        temp_script = "/tmp/governance_wrapper.js"
        with open(temp_script, 'w') as f:
            f.write(wrapper_script)
        
        result = subprocess.run(
            ["node", temp_script],
            capture_output=True,
            text=True,
            cwd="/home/ubuntu/promethios"
        )
        
        if result.returncode != 0:
            raise Exception(f"Governance identity error: {result.stderr}")
        
        return json.loads(result.stdout.strip())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to call governance identity: {str(e)}")

# API Routes

@router.post("/register", response_model=Dict[str, str])
async def register_agent(registration: AgentRegistration):
    """Register a new agent with governance identity"""
    try:
        # Create governance identity for the agent
        governance_data = {
            "agent_id": registration.agent_id,
            "governance_framework": registration.governance_framework,
            "owner_id": registration.owner_id,
            "capabilities": registration.capabilities
        }
        
        # Call governance identity module to register agent
        identity_result = call_governance_identity("registerAgent", governance_data)
        
        # Store agent profile
        agent_profile = {
            "agent_id": registration.agent_id,
            "name": registration.name,
            "description": registration.description,
            "governance_framework": registration.governance_framework,
            "capabilities": registration.capabilities,
            "owner_id": registration.owner_id,
            "created_at": datetime.utcnow().isoformat(),
            "deployment_status": "registered"
        }
        
        # TODO: Store in database when available
        # For now, store in file system
        os.makedirs(f"/tmp/agents/{registration.agent_id}", exist_ok=True)
        with open(f"/tmp/agents/{registration.agent_id}/profile.json", 'w') as f:
            json.dump(agent_profile, f, indent=2)
        
        return {
            "agent_id": registration.agent_id,
            "status": "registered",
            "governance_identity_id": identity_result.get("identity_id", "unknown")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register agent: {str(e)}")

@router.get("/{agent_id}/scorecard", response_model=AgentScorecard)
async def get_agent_scorecard(agent_id: str = Path(..., description="Agent ID")):
    """Get the latest scorecard for an agent"""
    try:
        # Get latest scorecard from scorecard manager
        scorecard_data = call_scorecard_manager("getLatestScorecard", agent_id)
        
        if not scorecard_data:
            raise HTTPException(status_code=404, detail="Agent scorecard not found")
        
        # Transform to API response format
        return AgentScorecard(
            agent_id=scorecard_data["agent_id"],
            scorecard_id=scorecard_data["scorecard_id"],
            timestamp=scorecard_data["timestamp"],
            governance_identity=GovernanceIdentity(**scorecard_data["governance_identity"]),
            trust_score=TrustScore(
                score=scorecard_data["trust_score"],
                last_calculated=scorecard_data["timestamp"],
                calculation_method="promethios_v1"
            ),
            reflection_compliance=ReflectionCompliance(**scorecard_data["reflection_compliance"]),
            belief_trace_integrity=BeliefTraceIntegrity(**scorecard_data["belief_trace_integrity"]),
            violation_history=ViolationHistory(**scorecard_data["violation_history"]),
            performance_metrics=PerformanceMetrics(
                task_completion_rate=scorecard_data["performance_metrics"]["task_completion"]["rate"],
                average_response_time_ms=scorecard_data["performance_metrics"]["response_time"]["average_ms"],
                resource_efficiency_score=scorecard_data["performance_metrics"]["resource_efficiency"]["compute_efficiency"],
                uptime_percentage=95.0  # TODO: Calculate from real data
            ),
            warning_state=WarningState(**scorecard_data["warning_state"]),
            health_status="healthy" if scorecard_data["performance_metrics"]["task_completion"]["rate"] > 80 else "degraded",
            deployment_status="deployed"  # TODO: Get from real deployment status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get agent scorecard: {str(e)}")

@router.get("/{agent_id}/profile", response_model=AgentProfile)
async def get_agent_profile(agent_id: str = Path(..., description="Agent ID")):
    """Get agent profile information"""
    try:
        # Load agent profile
        profile_path = f"/tmp/agents/{agent_id}/profile.json"
        if not os.path.exists(profile_path):
            raise HTTPException(status_code=404, detail="Agent profile not found")
        
        with open(profile_path, 'r') as f:
            profile_data = json.load(f)
        
        # Get governance identity
        governance_data = call_governance_identity("getAgentIdentity", agent_id)
        
        # Get latest scorecard for trust score
        try:
            scorecard_data = call_scorecard_manager("getLatestScorecard", agent_id)
            trust_score = TrustScore(
                score=scorecard_data.get("trust_score"),
                last_calculated=scorecard_data.get("timestamp"),
                calculation_method="promethios_v1"
            )
        except:
            trust_score = TrustScore(score=None, last_calculated=None)
        
        return AgentProfile(
            agent_id=agent_id,
            name=profile_data["name"],
            description=profile_data.get("description"),
            version="1.0.0",  # TODO: Get from real version data
            governance_identity=GovernanceIdentity(
                type=governance_data.get("type", "promethios"),
                constitution_hash=governance_data.get("constitution_hash", "0" * 64),
                compliance_level=governance_data.get("compliance_level", "full"),
                verification_endpoint=f"https://verify.promethios.ai/agent/{agent_id}"
            ),
            deployment_status=profile_data.get("deployment_status", "unknown"),
            health_status="healthy",  # TODO: Calculate from real metrics
            trust_score=trust_score,
            created_at=profile_data["created_at"],
            last_updated=profile_data.get("last_updated", profile_data["created_at"]),
            owner_id=profile_data["owner_id"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get agent profile: {str(e)}")

@router.get("", response_model=List[AgentProfile])
async def list_agents(
    owner_id: Optional[str] = Query(None, description="Filter by owner ID"),
    limit: int = Query(50, description="Maximum number of agents to return")
):
    """List agents with optional filtering"""
    try:
        agents = []
        
        # TODO: Replace with database query when available
        # For now, scan file system
        agents_dir = "/tmp/agents"
        if os.path.exists(agents_dir):
            for agent_id in os.listdir(agents_dir):
                try:
                    profile_path = os.path.join(agents_dir, agent_id, "profile.json")
                    if os.path.exists(profile_path):
                        with open(profile_path, 'r') as f:
                            profile_data = json.load(f)
                        
                        # Filter by owner if specified
                        if owner_id and profile_data.get("owner_id") != owner_id:
                            continue
                        
                        # Get basic profile info
                        agent_profile = await get_agent_profile(agent_id)
                        agents.append(agent_profile)
                        
                        if len(agents) >= limit:
                            break
                            
                except Exception as e:
                    # Skip agents with errors
                    continue
        
        return agents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list agents: {str(e)}")

@router.post("/{agent_id}/scorecard/generate")
async def generate_agent_scorecard(
    agent_id: str = Path(..., description="Agent ID"),
    force_recalculate: bool = Query(False, description="Force recalculation of metrics")
):
    """Generate a new scorecard for an agent"""
    try:
        # Get agent governance identity
        governance_data = call_governance_identity("getAgentIdentity", agent_id)
        
        # TODO: Get real metrics from PRISM and VIGIL observers
        # For now, use mock data that will be replaced with real metrics
        mock_prism_metrics = {
            "reflection": {
                "total_count": 100,
                "compliant_count": 95
            },
            "beliefTrace": {
                "total_outputs": 500,
                "verified_outputs": 475
            }
        }
        
        mock_vigil_metrics = {
            "violations": []
        }
        
        mock_additional_metrics = {
            "performance": {
                "total_tasks": 200,
                "completed_tasks": 190,
                "response_time": {
                    "average_ms": 150,
                    "p95_ms": 300,
                    "p99_ms": 500
                },
                "resource_efficiency": {
                    "energy_score": 0.85,
                    "memory_efficiency": 0.90,
                    "compute_efficiency": 0.88
                }
            }
        }
        
        # Calculate trust score (simplified calculation)
        trust_score = 0.92  # TODO: Implement real trust score calculation
        
        # Create scorecard using existing scorecard manager
        scorecard = call_scorecard_manager(
            "createScorecard",
            agent_id,
            governance_data,
            trust_score,
            mock_prism_metrics,
            mock_vigil_metrics,
            mock_additional_metrics
        )
        
        # Store the scorecard
        call_scorecard_manager("storeScorecard", scorecard)
        
        return {
            "agent_id": agent_id,
            "scorecard_id": scorecard["scorecard_id"],
            "status": "generated",
            "timestamp": scorecard["timestamp"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate scorecard: {str(e)}")

@router.get("/{agent_id}/governance", response_model=GovernanceIdentity)
async def get_agent_governance_identity(agent_id: str = Path(..., description="Agent ID")):
    """Get governance identity for an agent"""
    try:
        governance_data = call_governance_identity("getAgentIdentity", agent_id)
        
        return GovernanceIdentity(
            type=governance_data.get("type", "promethios"),
            constitution_hash=governance_data.get("constitution_hash", "0" * 64),
            compliance_level=governance_data.get("compliance_level", "full"),
            verification_endpoint=f"https://verify.promethios.ai/agent/{agent_id}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get governance identity: {str(e)}")

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check for the agent scorecard API"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "scorecard_manager": "available",
        "governance_identity": "available"
    }

