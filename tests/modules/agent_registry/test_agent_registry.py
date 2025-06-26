"""
Comprehensive test suite for Agent Registry.

This test suite covers all functionality of the Agent Registry including:
- Agent registration and validation
- Agent discovery and matching
- Agent lifecycle management
- Governance integration
- Performance tracking
"""

import pytest
import json
import os
import tempfile
from datetime import datetime
from unittest.mock import Mock, patch

# Import the modules to test
from src.modules.agent_registry.agent_registry import (
    AgentRegistry, AgentType, AgentStatus, AgentCapability,
    AgentRegistrationResult, AgentInvocationResult
)

class MockSchemaValidator:
    """Mock schema validator for testing."""
    
    def __init__(self, should_validate=True):
        self.should_validate = should_validate
    
    def validate(self, data, schema_name):
        return Mock(is_valid=self.should_validate, errors=[] if self.should_validate else ["Mock validation error"])

class MockSealVerificationService:
    """Mock seal verification service for testing."""
    
    def create_seal(self, data):
        return "mock_seal_" + str(hash(json.dumps(data, sort_keys=True)))
    
    def verify_seal(self, data):
        return True

class MockGovernanceIntegration:
    """Mock governance integration for testing."""
    
    def __init__(self, should_approve=True, governance_score=0.85):
        self.should_approve = should_approve
        self.governance_score = governance_score
    
    def evaluate_agent_registration(self, agent_data):
        return {
            "approved": self.should_approve,
            "overall_score": self.governance_score,
            "reason": "Mock governance evaluation"
        }
    
    def evaluate_agent_invocation(self, agent_id, task_data):
        return {
            "approved": self.should_approve,
            "overall_score": self.governance_score,
            "reason": "Mock governance evaluation"
        }

@pytest.fixture
def temp_registry_file():
    """Create a temporary registry file for testing."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        temp_path = f.name
    yield temp_path
    # Cleanup
    if os.path.exists(temp_path):
        os.unlink(temp_path)

@pytest.fixture
def mock_schema_validator():
    """Create a mock schema validator."""
    return MockSchemaValidator()

@pytest.fixture
def mock_seal_service():
    """Create a mock seal verification service."""
    return MockSealVerificationService()

@pytest.fixture
def mock_governance():
    """Create a mock governance integration."""
    return MockGovernanceIntegration()

@pytest.fixture
def agent_registry(temp_registry_file, mock_schema_validator, mock_seal_service, mock_governance):
    """Create an agent registry for testing."""
    return AgentRegistry(
        schema_validator=mock_schema_validator,
        seal_verification_service=mock_seal_service,
        registry_path=temp_registry_file,
        governance_integration=mock_governance
    )

@pytest.fixture
def sample_agent_data():
    """Create sample agent data for testing."""
    return {
        "agent_id": "test_agent_001",
        "name": "Test Agent",
        "description": "A test agent for unit testing",
        "agent_type": AgentType.CONVERSATIONAL.value,
        "version": "1.0.0",
        "author": "Test Author",
        "capabilities": [
            {
                "capability_id": "text_processing",
                "level": "advanced",
                "description": "Advanced text processing capability"
            }
        ],
        "configuration": {
            "max_tokens": 4096,
            "temperature": 0.7,
            "model_preferences": ["gpt-4", "claude-3"]
        },
        "governance_config": {
            "safety_level": "high",
            "content_filtering": True,
            "audit_logging": True
        },
        "metadata": {
            "tags": ["test", "conversational"],
            "category": "testing"
        }
    }

class TestAgentRegistry:
    """Test cases for Agent Registry."""
    
    def test_initialization(self, agent_registry):
        """Test agent registry initialization."""
        assert agent_registry is not None
        assert agent_registry.agents == {}
        assert agent_registry.agent_capabilities == {}
        assert agent_registry.agent_usage_stats == {}
        assert agent_registry.agent_performance == {}
    
    def test_register_agent_success(self, agent_registry, sample_agent_data):
        """Test successful agent registration."""
        result = agent_registry.register_agent(sample_agent_data)
        
        assert result.success is True
        assert result.agent_id == "test_agent_001"
        assert result.error is None
        assert result.registration_timestamp is not None
        
        # Verify agent was added to registry
        assert "test_agent_001" in agent_registry.agents
        agent = agent_registry.agents["test_agent_001"]
        assert agent["name"] == "Test Agent"
        assert agent["status"] == AgentStatus.ACTIVE.value
    
    def test_register_agent_duplicate(self, agent_registry, sample_agent_data):
        """Test registration of duplicate agent."""
        # Register agent first time
        result1 = agent_registry.register_agent(sample_agent_data)
        assert result1.success is True
        
        # Try to register same agent again
        result2 = agent_registry.register_agent(sample_agent_data)
        assert result2.success is False
        assert "already exists" in result2.error
    
    def test_register_agent_validation_failure(self, temp_registry_file, mock_seal_service, mock_governance):
        """Test agent registration with validation failure."""
        # Create registry with failing validator
        failing_validator = MockSchemaValidator(should_validate=False)
        registry = AgentRegistry(
            schema_validator=failing_validator,
            seal_verification_service=mock_seal_service,
            registry_path=temp_registry_file,
            governance_integration=mock_governance
        )
        
        sample_data = {
            "agent_id": "test_agent_002",
            "name": "Test Agent 2"
        }
        
        result = registry.register_agent(sample_data)
        assert result.success is False
        assert "validation failed" in result.error.lower()
    
    def test_register_agent_governance_rejection(self, temp_registry_file, mock_schema_validator, mock_seal_service):
        """Test agent registration with governance rejection."""
        # Create registry with rejecting governance
        rejecting_governance = MockGovernanceIntegration(should_approve=False)
        registry = AgentRegistry(
            schema_validator=mock_schema_validator,
            seal_verification_service=mock_seal_service,
            registry_path=temp_registry_file,
            governance_integration=rejecting_governance
        )
        
        sample_data = {
            "agent_id": "test_agent_003",
            "name": "Test Agent 3",
            "description": "Test agent",
            "agent_type": AgentType.CONVERSATIONAL.value,
            "capabilities": [],
            "configuration": {},
            "governance_config": {}
        }
        
        result = registry.register_agent(sample_data)
        assert result.success is False
        assert "not approved by governance" in result.error
    
    def test_invoke_agent_success(self, agent_registry, sample_agent_data):
        """Test successful agent invocation."""
        # Register agent first
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Invoke agent
        task_data = {
            "task_type": "text_processing",
            "input_text": "Hello, world!",
            "parameters": {"max_length": 100}
        }
        
        result = agent_registry.invoke_agent("test_agent_001", task_data)
        assert result.success is True
        assert result.response is not None
        assert result.governance_score > 0
    
    def test_invoke_agent_not_found(self, agent_registry):
        """Test invocation of non-existent agent."""
        task_data = {
            "task_type": "text_processing",
            "input_text": "Hello, world!"
        }
        
        result = agent_registry.invoke_agent("nonexistent_agent", task_data)
        assert result.success is False
        assert "does not exist" in result.error
    
    def test_invoke_agent_inactive(self, agent_registry, sample_agent_data):
        """Test invocation of inactive agent."""
        # Register and then deactivate agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        agent_registry.update_agent_status("test_agent_001", AgentStatus.INACTIVE)
        
        task_data = {
            "task_type": "text_processing",
            "input_text": "Hello, world!"
        }
        
        result = agent_registry.invoke_agent("test_agent_001", task_data)
        assert result.success is False
        assert "not active" in result.error
    
    def test_find_agents_by_capability(self, agent_registry, sample_agent_data):
        """Test finding agents by capability."""
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Find agents with text processing capability
        agents = agent_registry.find_agents_by_capability("text_processing")
        assert len(agents) == 1
        assert agents[0]["agent_id"] == "test_agent_001"
    
    def test_find_agents_by_type(self, agent_registry, sample_agent_data):
        """Test finding agents by type."""
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Find conversational agents
        agents = agent_registry.find_agents_by_type(AgentType.CONVERSATIONAL)
        assert len(agents) == 1
        assert agents[0]["agent_id"] == "test_agent_001"
    
    def test_get_agent(self, agent_registry, sample_agent_data):
        """Test getting agent information."""
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Get agent
        agent = agent_registry.get_agent("test_agent_001")
        assert agent is not None
        assert agent["name"] == "Test Agent"
        assert agent["agent_type"] == AgentType.CONVERSATIONAL.value
    
    def test_get_agent_not_found(self, agent_registry):
        """Test getting non-existent agent."""
        agent = agent_registry.get_agent("nonexistent_agent")
        assert agent is None
    
    def test_list_agents(self, agent_registry, sample_agent_data):
        """Test listing all agents."""
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # List all agents
        agents = agent_registry.list_agents()
        assert len(agents) == 1
        assert "test_agent_001" in agents
    
    def test_list_agents_with_filters(self, agent_registry, sample_agent_data):
        """Test listing agents with filters."""
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # List agents with type filter
        agents = agent_registry.list_agents(agent_type_filter=AgentType.CONVERSATIONAL)
        assert len(agents) == 1
        
        # List agents with status filter
        agents = agent_registry.list_agents(status_filter=AgentStatus.ACTIVE)
        assert len(agents) == 1
        
        # List agents with non-matching filter
        agents = agent_registry.list_agents(agent_type_filter=AgentType.ANALYTICAL)
        assert len(agents) == 0
    
    def test_get_active_agents(self, agent_registry, sample_agent_data):
        """Test getting active agents."""
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Get active agents
        active_agents = agent_registry.get_active_agents()
        assert len(active_agents) == 1
        assert "test_agent_001" in active_agents
    
    def test_update_agent_status(self, agent_registry, sample_agent_data):
        """Test updating agent status."""
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Update status to inactive
        success = agent_registry.update_agent_status("test_agent_001", AgentStatus.INACTIVE)
        assert success is True
        
        # Verify status was updated
        agent = agent_registry.get_agent("test_agent_001")
        assert agent["status"] == AgentStatus.INACTIVE.value
    
    def test_update_agent_status_not_found(self, agent_registry):
        """Test updating status of non-existent agent."""
        success = agent_registry.update_agent_status("nonexistent_agent", AgentStatus.INACTIVE)
        assert success is False
    
    def test_check_agent_exists(self, agent_registry, sample_agent_data):
        """Test checking if agent exists."""
        # Check non-existent agent
        exists = agent_registry.check_agent_exists("test_agent_001")
        assert exists is False
        
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Check existing agent
        exists = agent_registry.check_agent_exists("test_agent_001")
        assert exists is True
    
    def test_get_registry_statistics(self, agent_registry, sample_agent_data):
        """Test getting registry statistics."""
        # Get stats for empty registry
        stats = agent_registry.get_registry_statistics()
        assert stats["total_agents"] == 0
        
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Get stats after registration
        stats = agent_registry.get_registry_statistics()
        assert stats["total_agents"] == 1
        assert stats["agents_by_type"][AgentType.CONVERSATIONAL.value] == 1
        assert stats["agents_by_status"][AgentStatus.ACTIVE.value] == 1
    
    def test_agent_performance_tracking(self, agent_registry, sample_agent_data):
        """Test agent performance tracking."""
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Invoke agent multiple times
        task_data = {
            "task_type": "text_processing",
            "input_text": "Hello, world!"
        }
        
        for i in range(3):
            result = agent_registry.invoke_agent("test_agent_001", task_data)
            assert result.success is True
        
        # Check performance stats
        performance = agent_registry.get_agent_performance("test_agent_001")
        assert performance is not None
        assert performance["total_invocations"] == 3
        assert performance["successful_invocations"] == 3
        assert performance["average_response_time"] > 0
    
    def test_agent_capability_management(self, agent_registry, sample_agent_data):
        """Test agent capability management."""
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Get agent capabilities
        capabilities = agent_registry.get_agent_capabilities("test_agent_001")
        assert capabilities is not None
        assert len(capabilities) == 1
        assert capabilities[0]["capability_id"] == "text_processing"
    
    def test_registry_persistence(self, agent_registry, sample_agent_data):
        """Test registry persistence to file."""
        # Register agent
        reg_result = agent_registry.register_agent(sample_agent_data)
        assert reg_result.success is True
        
        # Verify file was created and contains data
        assert os.path.exists(agent_registry.registry_path)
        
        with open(agent_registry.registry_path, 'r') as f:
            data = json.load(f)
        
        assert "agents" in data
        assert "test_agent_001" in data["agents"]
        assert "seal" in data
    
    def test_registry_loading(self, temp_registry_file, mock_schema_validator, mock_seal_service, mock_governance):
        """Test loading registry from file."""
        # Create initial registry and add agent
        registry1 = AgentRegistry(
            schema_validator=mock_schema_validator,
            seal_verification_service=mock_seal_service,
            registry_path=temp_registry_file,
            governance_integration=mock_governance
        )
        
        sample_data = {
            "agent_id": "test_agent_load",
            "name": "Load Test Agent",
            "description": "Test agent for loading",
            "agent_type": AgentType.CONVERSATIONAL.value,
            "capabilities": [],
            "configuration": {},
            "governance_config": {}
        }
        
        reg_result = registry1.register_agent(sample_data)
        assert reg_result.success is True
        
        # Create new registry instance and verify it loads the data
        registry2 = AgentRegistry(
            schema_validator=mock_schema_validator,
            seal_verification_service=mock_seal_service,
            registry_path=temp_registry_file,
            governance_integration=mock_governance
        )
        
        assert "test_agent_load" in registry2.agents
        agent = registry2.get_agent("test_agent_load")
        assert agent["name"] == "Load Test Agent"
    
    def test_error_handling(self, agent_registry):
        """Test error handling in various scenarios."""
        # Test with invalid data types
        invalid_data = "not a dictionary"
        
        with pytest.raises(Exception):
            agent_registry.register_agent(invalid_data)
        
        # Test with missing required fields
        incomplete_data = {
            "agent_id": "incomplete_agent"
            # Missing required fields
        }
        
        result = agent_registry.register_agent(incomplete_data)
        assert result.success is False
    
    def test_concurrent_operations(self, agent_registry, sample_agent_data):
        """Test concurrent operations on the registry."""
        # This is a simplified test for concurrent operations
        # In a real scenario, you'd use threading or asyncio
        
        # Register multiple agents
        for i in range(5):
            agent_data = sample_agent_data.copy()
            agent_data["agent_id"] = f"concurrent_agent_{i}"
            agent_data["name"] = f"Concurrent Agent {i}"
            
            result = agent_registry.register_agent(agent_data)
            assert result.success is True
        
        # Verify all agents were registered
        stats = agent_registry.get_registry_statistics()
        assert stats["total_agents"] == 5
    
    def test_large_scale_operations(self, agent_registry):
        """Test registry performance with larger datasets."""
        # Register many agents
        num_agents = 100
        
        for i in range(num_agents):
            agent_data = {
                "agent_id": f"scale_agent_{i:03d}",
                "name": f"Scale Agent {i}",
                "description": f"Agent for scale testing {i}",
                "agent_type": AgentType.CONVERSATIONAL.value,
                "capabilities": [
                    {
                        "capability_id": f"capability_{i % 10}",
                        "level": "basic",
                        "description": f"Capability {i % 10}"
                    }
                ],
                "configuration": {"agent_number": i},
                "governance_config": {}
            }
            
            result = agent_registry.register_agent(agent_data)
            assert result.success is True
        
        # Test operations on large dataset
        stats = agent_registry.get_registry_statistics()
        assert stats["total_agents"] == num_agents
        
        # Test finding agents by capability
        agents = agent_registry.find_agents_by_capability("capability_0")
        assert len(agents) == 10  # Every 10th agent has capability_0
        
        # Test listing with filters
        all_agents = agent_registry.list_agents()
        assert len(all_agents) == num_agents

if __name__ == "__main__":
    pytest.main([__file__])

