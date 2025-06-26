"""
Simplified Agent Registry for Testing.

This is a simplified version of the Agent Registry that can be tested
without complex dependencies.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional, NamedTuple
from enum import Enum

class AgentType(Enum):
    """Agent type enumeration."""
    CONVERSATIONAL = "conversational"
    ANALYTICAL = "analytical"
    CREATIVE = "creative"
    TASK_ORIENTED = "task_oriented"

class AgentStatus(Enum):
    """Agent status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    DEPRECATED = "deprecated"

class AgentRegistrationResult(NamedTuple):
    """Result of agent registration."""
    success: bool
    agent_id: Optional[str] = None
    error: Optional[str] = None
    registration_timestamp: Optional[str] = None

class AgentInvocationResult(NamedTuple):
    """Result of agent invocation."""
    success: bool
    response: Optional[Any] = None
    error: Optional[str] = None
    response_time: float = 0.0
    governance_score: float = 0.0

class AgentRegistry:
    """Simplified Agent Registry for testing."""
    
    def __init__(self, schema_validator, seal_verification_service, registry_path, governance_integration=None):
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.registry_path = registry_path
        self.governance_integration = governance_integration
        self.agents = {}
        self.agent_capabilities = {}
        self.agent_usage_stats = {}
        self.agent_performance = {}
        
        # Load existing registry if available
        self._load_registry()
    
    def _load_registry(self):
        """Load the registry from file."""
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r') as f:
                    data = json.load(f)
                self.agents = data.get("agents", {})
                self.agent_capabilities = data.get("agent_capabilities", {})
                self.agent_usage_stats = data.get("agent_usage_stats", {})
                self.agent_performance = data.get("agent_performance", {})
            except Exception:
                pass
    
    def _save_registry(self):
        """Save the registry to file."""
        os.makedirs(os.path.dirname(self.registry_path), exist_ok=True)
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "agents": self.agents,
            "agent_capabilities": self.agent_capabilities,
            "agent_usage_stats": self.agent_usage_stats,
            "agent_performance": self.agent_performance
        }
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def register_agent(self, agent_data: Dict[str, Any]) -> AgentRegistrationResult:
        """Register a new agent."""
        try:
            # Validate the agent data
            validation_result = self.schema_validator.validate(agent_data, "agent_registration.schema.v1.json")
            if not validation_result.is_valid:
                return AgentRegistrationResult(
                    success=False,
                    error=f"Agent validation failed: {validation_result.errors}"
                )
            
            agent_id = agent_data["agent_id"]
            if agent_id in self.agents:
                return AgentRegistrationResult(
                    success=False,
                    error=f"Agent {agent_id} already exists"
                )
            
            # Check governance
            if self.governance_integration:
                governance_result = self.governance_integration.evaluate_agent_registration(agent_data)
                if not governance_result.get("approved", True):
                    return AgentRegistrationResult(
                        success=False,
                        error=f"Agent registration not approved by governance"
                    )
            
            # Register the agent
            registration_timestamp = datetime.utcnow().isoformat()
            agent = {
                **agent_data,
                "registration_timestamp": registration_timestamp,
                "status": AgentStatus.ACTIVE.value,
                "usage_count": 0,
                "last_used": None
            }
            
            self.agents[agent_id] = agent
            self.agent_capabilities[agent_id] = agent_data.get("capabilities", [])
            self.agent_usage_stats[agent_id] = {
                "total_invocations": 0,
                "successful_invocations": 0,
                "failed_invocations": 0
            }
            self.agent_performance[agent_id] = {
                "average_response_time": 0.0,
                "total_invocations": 0,
                "successful_invocations": 0
            }
            
            self._save_registry()
            
            return AgentRegistrationResult(
                success=True,
                agent_id=agent_id,
                registration_timestamp=registration_timestamp
            )
            
        except Exception as e:
            return AgentRegistrationResult(
                success=False,
                error=f"Error registering agent: {str(e)}"
            )
    
    def invoke_agent(self, agent_id: str, task_data: Dict[str, Any]) -> AgentInvocationResult:
        """Invoke an agent."""
        try:
            if agent_id not in self.agents:
                return AgentInvocationResult(
                    success=False,
                    error=f"Agent {agent_id} does not exist"
                )
            
            agent = self.agents[agent_id]
            if agent.get("status") != AgentStatus.ACTIVE.value:
                return AgentInvocationResult(
                    success=False,
                    error=f"Agent {agent_id} is not active"
                )
            
            # Mock invocation
            response = f"Mock response from {agent_id} for task: {task_data.get('task_type', 'unknown')}"
            
            # Update stats
            self.agent_usage_stats[agent_id]["total_invocations"] += 1
            self.agent_usage_stats[agent_id]["successful_invocations"] += 1
            self.agent_performance[agent_id]["total_invocations"] += 1
            self.agent_performance[agent_id]["successful_invocations"] += 1
            
            return AgentInvocationResult(
                success=True,
                response=response,
                response_time=0.1,
                governance_score=0.85
            )
            
        except Exception as e:
            return AgentInvocationResult(
                success=False,
                error=f"Error invoking agent: {str(e)}"
            )
    
    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get agent information."""
        return self.agents.get(agent_id)
    
    def list_agents(self, agent_type_filter=None, status_filter=None) -> Dict[str, Dict[str, Any]]:
        """List all agents with optional filtering."""
        filtered_agents = {}
        
        for agent_id, agent in self.agents.items():
            if agent_type_filter and agent.get("agent_type") != agent_type_filter.value:
                continue
            if status_filter and agent.get("status") != status_filter.value:
                continue
            filtered_agents[agent_id] = agent
        
        return filtered_agents
    
    def find_agents_by_capability(self, capability_id: str) -> List[Dict[str, Any]]:
        """Find agents by capability."""
        matching_agents = []
        
        for agent_id, capabilities in self.agent_capabilities.items():
            if any(cap.get("capability_id") == capability_id for cap in capabilities):
                agent = self.agents.get(agent_id)
                if agent:
                    matching_agents.append(agent)
        
        return matching_agents
    
    def find_agents_by_type(self, agent_type: AgentType) -> List[Dict[str, Any]]:
        """Find agents by type."""
        matching_agents = []
        
        for agent in self.agents.values():
            if agent.get("agent_type") == agent_type.value:
                matching_agents.append(agent)
        
        return matching_agents
    
    def get_active_agents(self) -> List[str]:
        """Get list of active agent IDs."""
        return [
            agent_id for agent_id, agent in self.agents.items()
            if agent.get("status") == AgentStatus.ACTIVE.value
        ]
    
    def update_agent_status(self, agent_id: str, status: AgentStatus) -> bool:
        """Update agent status."""
        try:
            if agent_id not in self.agents:
                return False
            
            self.agents[agent_id]["status"] = status.value
            self._save_registry()
            return True
            
        except Exception:
            return False
    
    def check_agent_exists(self, agent_id: str) -> bool:
        """Check if agent exists."""
        return agent_id in self.agents
    
    def get_agent_capabilities(self, agent_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get agent capabilities."""
        return self.agent_capabilities.get(agent_id)
    
    def get_agent_performance(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get agent performance metrics."""
        return self.agent_performance.get(agent_id)
    
    def get_registry_statistics(self) -> Dict[str, Any]:
        """Get registry statistics."""
        stats = {
            "total_agents": len(self.agents),
            "agents_by_type": {},
            "agents_by_status": {},
            "total_invocations": sum(
                stats.get("total_invocations", 0) 
                for stats in self.agent_usage_stats.values()
            )
        }
        
        for agent in self.agents.values():
            agent_type = agent.get("agent_type", "unknown")
            stats["agents_by_type"][agent_type] = stats["agents_by_type"].get(agent_type, 0) + 1
            
            status = agent.get("status", "unknown")
            stats["agents_by_status"][status] = stats["agents_by_status"].get(status, 0) + 1
        
        return stats

