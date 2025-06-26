"""
⚠️  DUPLICATE REGISTRY - DO NOT USE ⚠️

This Agent Registry is a DUPLICATE of existing functionality.
USE THE EXISTING SYSTEM INSTEAD:

EXISTING APIs TO USE:
- Agent Management: /api/multi-agent/communications
- Agent Coordination: /api/multi-agent/trust-relationships  
- Agent Registration: src/api/multi_agent_system/routes.py
- Agent Services: src/api/multi_agent_system/services/

EXISTING BACKEND SERVICES:
- Multi-Agent Coordinator: src/api/chat/multi_agent_coordinator.py
- Collaboration Service: src/api/multi_agent_system/services/collaboration_service.py
- Role Service: src/api/multi_agent_system/services/role_service.py

This registry was built in error - the system already has comprehensive
agent management through the existing multi-agent APIs and services.

DO NOT EXTEND THIS CODE - USE EXISTING SYSTEM INSTEAD
"""

import os
import json
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, NamedTuple
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class AgentStatus(Enum):
    """Agent status enumeration."""
    INITIALIZING = "initializing"
    ACTIVE = "active"
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"
    OFFLINE = "offline"
    TERMINATED = "terminated"

class AgentType(Enum):
    """Agent type enumeration."""
    SINGLE_AGENT = "single_agent"
    MULTI_AGENT = "multi_agent"
    GOVERNANCE_AGENT = "governance_agent"
    TOOL_AGENT = "tool_agent"
    ORCHESTRATOR = "orchestrator"

class AgentCapability(NamedTuple):
    """Agent capability definition."""
    capability_id: str
    name: str
    description: str
    version: str
    parameters: Dict[str, Any]
    requirements: List[str]

class AgentRegistrationResult(NamedTuple):
    """Result of agent registration."""
    success: bool
    agent_id: Optional[str] = None
    error: Optional[str] = None
    registration_timestamp: Optional[str] = None

class AgentRegistry:
    """Registry for managing agent lifecycle and coordination."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        registry_path: str,
        governance_integration=None
    ):
        """Initialize the agent registry.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            registry_path: Path to the registry JSON file.
            governance_integration: Optional governance integration service.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.registry_path = registry_path
        self.governance_integration = governance_integration
        self.agents = {}
        self.agent_capabilities = {}
        self.agent_health_status = {}
        self.agent_governance_scores = {}
        
        # Load existing registry if available
        self._load_registry()
    
    def _load_registry(self):
        """Load the registry from the JSON file."""
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r') as f:
                    data = json.load(f)
                
                # Verify the seal
                if not self.seal_verification_service.verify_seal(data):
                    logger.error("Agent registry file seal verification failed")
                    raise ValueError("Agent registry file seal verification failed")
                
                # Load registry data
                self.agents = data.get("agents", {})
                self.agent_capabilities = data.get("agent_capabilities", {})
                self.agent_health_status = data.get("agent_health_status", {})
                self.agent_governance_scores = data.get("agent_governance_scores", {})
                
                logger.info(f"Loaded {len(self.agents)} agents from registry")
            except Exception as e:
                logger.error(f"Error loading agent registry: {str(e)}")
                self._initialize_empty_registry()
    
    def _initialize_empty_registry(self):
        """Initialize empty registry structures."""
        self.agents = {}
        self.agent_capabilities = {}
        self.agent_health_status = {}
        self.agent_governance_scores = {}
    
    def _save_registry(self):
        """Save the registry to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.registry_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        # Prepare data for serialization
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_agent_registry",
            "agents": self.agents,
            "agent_capabilities": self.agent_capabilities,
            "agent_health_status": self.agent_health_status,
            "agent_governance_scores": self.agent_governance_scores
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.agents)} agents to registry")
    
    def _get_registry_state_hash(self) -> str:
        """Get a hash of the current registry state.
        
        Returns:
            Hash of the current registry state.
        """
        # Create a string representation of the registry state
        state_data = {
            "agents": self.agents,
            "agent_capabilities": self.agent_capabilities,
            "agent_health_status": self.agent_health_status,
            "agent_governance_scores": self.agent_governance_scores
        }
        state_str = json.dumps(state_data, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def register_agent(self, agent_data: Dict[str, Any]) -> AgentRegistrationResult:
        """Register a new agent.
        
        Args:
            agent_data: Data for the agent to register.
                Must include agent_id, name, description, agent_type, capabilities,
                and governance configuration.
                
        Returns:
            AgentRegistrationResult with success status and details.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "register_agent",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return AgentRegistrationResult(
                    success=False,
                    error="Pre-loop tether verification failed"
                )
            
            # Validate the agent data
            validation_result = self.schema_validator.validate(agent_data, "agent_registration.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Agent validation failed: {validation_result.errors}")
                return AgentRegistrationResult(
                    success=False,
                    error=f"Agent validation failed: {validation_result.errors}"
                )
            
            # Check if the agent already exists
            agent_id = agent_data["agent_id"]
            if agent_id in self.agents:
                logger.error(f"Agent {agent_id} already exists")
                return AgentRegistrationResult(
                    success=False,
                    error=f"Agent {agent_id} already exists"
                )
            
            # Prepare the agent data
            registration_timestamp = datetime.utcnow().isoformat()
            agent = {
                "agent_id": agent_id,
                "name": agent_data["name"],
                "description": agent_data["description"],
                "agent_type": agent_data["agent_type"],
                "version": agent_data.get("version", "1.0.0"),
                "owner": agent_data.get("owner", "unknown"),
                "capabilities": agent_data.get("capabilities", []),
                "governance_config": agent_data.get("governance_config", {}),
                "metadata": agent_data.get("metadata", {}),
                "registration_timestamp": registration_timestamp,
                "last_heartbeat": registration_timestamp,
                "status": AgentStatus.INITIALIZING.value
            }
            
            # Create a seal for the agent
            agent["seal"] = self.seal_verification_service.create_seal(agent)
            
            # Add the agent to the registry
            self.agents[agent_id] = agent
            
            # Initialize agent capabilities
            self.agent_capabilities[agent_id] = agent_data.get("capabilities", [])
            
            # Initialize agent health status
            self.agent_health_status[agent_id] = {
                "status": AgentStatus.INITIALIZING.value,
                "last_heartbeat": registration_timestamp,
                "health_score": 1.0,
                "error_count": 0,
                "uptime_seconds": 0
            }
            
            # Initialize governance scores if governance integration is available
            if self.governance_integration:
                governance_scores = self.governance_integration.initialize_agent_governance(agent_id, agent)
                self.agent_governance_scores[agent_id] = governance_scores
            else:
                self.agent_governance_scores[agent_id] = {
                    "constitutional_alignment": 0.0,
                    "policy_compliance": 0.0,
                    "trust_score": 0.0,
                    "emotional_veritas": 0.0
                }
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Registered agent {agent_id}")
            return AgentRegistrationResult(
                success=True,
                agent_id=agent_id,
                registration_timestamp=registration_timestamp
            )
            
        except Exception as e:
            logger.error(f"Error registering agent: {str(e)}")
            return AgentRegistrationResult(
                success=False,
                error=f"Error registering agent: {str(e)}"
            )
    
    def unregister_agent(self, agent_id: str) -> bool:
        """Unregister an agent.
        
        Args:
            agent_id: ID of the agent to unregister.
            
        Returns:
            True if the agent was unregistered successfully.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "unregister_agent",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return False
            
            # Check if the agent exists
            if agent_id not in self.agents:
                logger.error(f"Agent {agent_id} does not exist")
                return False
            
            # Remove the agent and related data
            del self.agents[agent_id]
            if agent_id in self.agent_capabilities:
                del self.agent_capabilities[agent_id]
            if agent_id in self.agent_health_status:
                del self.agent_health_status[agent_id]
            if agent_id in self.agent_governance_scores:
                del self.agent_governance_scores[agent_id]
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Unregistered agent {agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error unregistering agent {agent_id}: {str(e)}")
            return False
    
    def update_agent_status(self, agent_id: str, status: AgentStatus) -> bool:
        """Update an agent's status.
        
        Args:
            agent_id: ID of the agent to update.
            status: New status for the agent.
            
        Returns:
            True if the status was updated successfully.
        """
        try:
            if agent_id not in self.agents:
                logger.error(f"Agent {agent_id} does not exist")
                return False
            
            # Update agent status
            self.agents[agent_id]["status"] = status.value
            self.agents[agent_id]["last_heartbeat"] = datetime.utcnow().isoformat()
            
            # Update health status
            if agent_id in self.agent_health_status:
                self.agent_health_status[agent_id]["status"] = status.value
                self.agent_health_status[agent_id]["last_heartbeat"] = datetime.utcnow().isoformat()
            
            # Save the updated registry
            self._save_registry()
            
            logger.debug(f"Updated agent {agent_id} status to {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating agent {agent_id} status: {str(e)}")
            return False
    
    def update_agent_capabilities(self, agent_id: str, capabilities: List[AgentCapability]) -> bool:
        """Update an agent's capabilities.
        
        Args:
            agent_id: ID of the agent to update.
            capabilities: New capabilities for the agent.
            
        Returns:
            True if the capabilities were updated successfully.
        """
        try:
            if agent_id not in self.agents:
                logger.error(f"Agent {agent_id} does not exist")
                return False
            
            # Convert capabilities to serializable format
            capability_data = []
            for cap in capabilities:
                capability_data.append({
                    "capability_id": cap.capability_id,
                    "name": cap.name,
                    "description": cap.description,
                    "version": cap.version,
                    "parameters": cap.parameters,
                    "requirements": cap.requirements
                })
            
            # Update agent capabilities
            self.agents[agent_id]["capabilities"] = capability_data
            self.agent_capabilities[agent_id] = capability_data
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Updated agent {agent_id} capabilities")
            return True
            
        except Exception as e:
            logger.error(f"Error updating agent {agent_id} capabilities: {str(e)}")
            return False
    
    def update_agent_governance_scores(self, agent_id: str, governance_scores: Dict[str, float]) -> bool:
        """Update an agent's governance scores.
        
        Args:
            agent_id: ID of the agent to update.
            governance_scores: New governance scores for the agent.
            
        Returns:
            True if the scores were updated successfully.
        """
        try:
            if agent_id not in self.agents:
                logger.error(f"Agent {agent_id} does not exist")
                return False
            
            # Update governance scores
            self.agent_governance_scores[agent_id] = governance_scores
            
            # Save the updated registry
            self._save_registry()
            
            logger.debug(f"Updated agent {agent_id} governance scores")
            return True
            
        except Exception as e:
            logger.error(f"Error updating agent {agent_id} governance scores: {str(e)}")
            return False
    
    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get information about an agent.
        
        Args:
            agent_id: ID of the agent to get.
            
        Returns:
            Information about the agent, or None if it doesn't exist.
        """
        return self.agents.get(agent_id)
    
    def get_agent_capabilities(self, agent_id: str) -> List[Dict[str, Any]]:
        """Get an agent's capabilities.
        
        Args:
            agent_id: ID of the agent.
            
        Returns:
            List of agent capabilities.
        """
        return self.agent_capabilities.get(agent_id, [])
    
    def get_agent_health_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get an agent's health status.
        
        Args:
            agent_id: ID of the agent.
            
        Returns:
            Agent health status, or None if it doesn't exist.
        """
        return self.agent_health_status.get(agent_id)
    
    def get_agent_governance_scores(self, agent_id: str) -> Optional[Dict[str, float]]:
        """Get an agent's governance scores.
        
        Args:
            agent_id: ID of the agent.
            
        Returns:
            Agent governance scores, or None if it doesn't exist.
        """
        return self.agent_governance_scores.get(agent_id)
    
    def list_agents(self, status_filter: Optional[AgentStatus] = None, 
                   agent_type_filter: Optional[AgentType] = None) -> Dict[str, Dict[str, Any]]:
        """List all registered agents with optional filtering.
        
        Args:
            status_filter: Optional status filter.
            agent_type_filter: Optional agent type filter.
            
        Returns:
            Dictionary mapping agent IDs to agent information.
        """
        filtered_agents = {}
        
        for agent_id, agent in self.agents.items():
            # Apply status filter
            if status_filter and agent.get("status") != status_filter.value:
                continue
            
            # Apply agent type filter
            if agent_type_filter and agent.get("agent_type") != agent_type_filter.value:
                continue
            
            filtered_agents[agent_id] = agent
        
        return filtered_agents
    
    def find_agents_by_capability(self, capability_id: str) -> List[str]:
        """Find agents that have a specific capability.
        
        Args:
            capability_id: ID of the capability to search for.
            
        Returns:
            List of agent IDs that have the capability.
        """
        matching_agents = []
        
        for agent_id, capabilities in self.agent_capabilities.items():
            for capability in capabilities:
                if capability.get("capability_id") == capability_id:
                    matching_agents.append(agent_id)
                    break
        
        return matching_agents
    
    def get_active_agents(self) -> List[str]:
        """Get list of currently active agents.
        
        Returns:
            List of active agent IDs.
        """
        active_agents = []
        
        for agent_id, agent in self.agents.items():
            if agent.get("status") == AgentStatus.ACTIVE.value:
                active_agents.append(agent_id)
        
        return active_agents
    
    def get_registry_statistics(self) -> Dict[str, Any]:
        """Get registry statistics.
        
        Returns:
            Dictionary containing registry statistics.
        """
        stats = {
            "total_agents": len(self.agents),
            "agents_by_status": {},
            "agents_by_type": {},
            "total_capabilities": sum(len(caps) for caps in self.agent_capabilities.values()),
            "average_governance_scores": {}
        }
        
        # Count agents by status
        for agent in self.agents.values():
            status = agent.get("status", "unknown")
            stats["agents_by_status"][status] = stats["agents_by_status"].get(status, 0) + 1
        
        # Count agents by type
        for agent in self.agents.values():
            agent_type = agent.get("agent_type", "unknown")
            stats["agents_by_type"][agent_type] = stats["agents_by_type"].get(agent_type, 0) + 1
        
        # Calculate average governance scores
        if self.agent_governance_scores:
            governance_metrics = ["constitutional_alignment", "policy_compliance", "trust_score", "emotional_veritas"]
            for metric in governance_metrics:
                scores = [scores.get(metric, 0.0) for scores in self.agent_governance_scores.values()]
                stats["average_governance_scores"][metric] = sum(scores) / len(scores) if scores else 0.0
        
        return stats
    
    def check_agent_exists(self, agent_id: str) -> bool:
        """Check if an agent exists.
        
        Args:
            agent_id: ID of the agent to check.
            
        Returns:
            True if the agent exists, False otherwise.
        """
        return agent_id in self.agents
    
    def cleanup_stale_agents(self, stale_threshold_minutes: int = 30) -> int:
        """Clean up agents that haven't sent heartbeats recently.
        
        Args:
            stale_threshold_minutes: Minutes after which an agent is considered stale.
            
        Returns:
            Number of agents cleaned up.
        """
        try:
            current_time = datetime.utcnow()
            stale_threshold = timedelta(minutes=stale_threshold_minutes)
            stale_agents = []
            
            for agent_id, agent in self.agents.items():
                last_heartbeat_str = agent.get("last_heartbeat")
                if last_heartbeat_str:
                    last_heartbeat = datetime.fromisoformat(last_heartbeat_str.replace('Z', '+00:00'))
                    if current_time - last_heartbeat > stale_threshold:
                        stale_agents.append(agent_id)
            
            # Mark stale agents as offline
            for agent_id in stale_agents:
                self.update_agent_status(agent_id, AgentStatus.OFFLINE)
            
            logger.info(f"Marked {len(stale_agents)} stale agents as offline")
            return len(stale_agents)
            
        except Exception as e:
            logger.error(f"Error cleaning up stale agents: {str(e)}")
            return 0

