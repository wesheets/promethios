"""
Simple working test for Agent Registry.
"""

import pytest
import json
import os
import tempfile
from unittest.mock import Mock

# Import the simplified registry
import sys
sys.path.insert(0, '/home/ubuntu/promethios')

from src.modules.agent_registry.simple_agent_registry import (
    AgentRegistry, AgentType, AgentStatus
)

class MockSchemaValidator:
    """Mock schema validator for testing."""
    
    def validate(self, data, schema_name):
        return Mock(is_valid=True, errors=[])

class MockSealVerificationService:
    """Mock seal verification service for testing."""
    
    def create_seal(self, data):
        return "mock_seal"
    
    def verify_seal(self, data):
        return True

class MockGovernanceIntegration:
    """Mock governance integration for testing."""
    
    def evaluate_agent_registration(self, agent_data):
        return {"approved": True, "overall_score": 0.85}

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
def agent_registry(temp_registry_file):
    """Create an agent registry for testing."""
    return AgentRegistry(
        schema_validator=MockSchemaValidator(),
        seal_verification_service=MockSealVerificationService(),
        registry_path=temp_registry_file,
        governance_integration=MockGovernanceIntegration()
    )

@pytest.fixture
def sample_agent_data():
    """Create sample agent data for testing."""
    return {
        "agent_id": "test_agent_001",
        "name": "Test Agent",
        "description": "A test agent for unit testing",
        "agent_type": AgentType.CONVERSATIONAL.value,
        "capabilities": [
            {
                "capability_id": "text_processing",
                "level": "advanced",
                "description": "Advanced text processing capability"
            }
        ]
    }

def test_agent_registry_initialization(agent_registry):
    """Test agent registry initialization."""
    assert agent_registry is not None
    assert agent_registry.agents == {}

def test_register_agent_success(agent_registry, sample_agent_data):
    """Test successful agent registration."""
    result = agent_registry.register_agent(sample_agent_data)
    
    assert result.success is True
    assert result.agent_id == "test_agent_001"
    assert result.error is None
    
    # Verify agent was added to registry
    assert "test_agent_001" in agent_registry.agents
    agent = agent_registry.agents["test_agent_001"]
    assert agent["name"] == "Test Agent"
    assert agent["status"] == AgentStatus.ACTIVE.value

def test_register_agent_duplicate(agent_registry, sample_agent_data):
    """Test registration of duplicate agent."""
    # Register agent first time
    result1 = agent_registry.register_agent(sample_agent_data)
    assert result1.success is True
    
    # Try to register same agent again
    result2 = agent_registry.register_agent(sample_agent_data)
    assert result2.success is False
    assert "already exists" in result2.error

def test_invoke_agent_success(agent_registry, sample_agent_data):
    """Test successful agent invocation."""
    # Register agent first
    reg_result = agent_registry.register_agent(sample_agent_data)
    assert reg_result.success is True
    
    # Invoke agent
    task_data = {"task_type": "text_processing", "input": "Hello, world!"}
    result = agent_registry.invoke_agent("test_agent_001", task_data)
    
    assert result.success is True
    assert result.response is not None
    assert result.governance_score > 0

def test_invoke_agent_not_found(agent_registry):
    """Test invocation of non-existent agent."""
    task_data = {"task_type": "text_processing", "input": "Hello, world!"}
    result = agent_registry.invoke_agent("nonexistent_agent", task_data)
    
    assert result.success is False
    assert "does not exist" in result.error

def test_get_agent(agent_registry, sample_agent_data):
    """Test getting agent information."""
    # Register agent
    reg_result = agent_registry.register_agent(sample_agent_data)
    assert reg_result.success is True
    
    # Get agent
    agent = agent_registry.get_agent("test_agent_001")
    assert agent is not None
    assert agent["name"] == "Test Agent"

def test_list_agents(agent_registry, sample_agent_data):
    """Test listing all agents."""
    # Register agent
    reg_result = agent_registry.register_agent(sample_agent_data)
    assert reg_result.success is True
    
    # List all agents
    agents = agent_registry.list_agents()
    assert len(agents) == 1
    assert "test_agent_001" in agents

def test_find_agents_by_capability(agent_registry, sample_agent_data):
    """Test finding agents by capability."""
    # Register agent
    reg_result = agent_registry.register_agent(sample_agent_data)
    assert reg_result.success is True
    
    # Find agents with text processing capability
    agents = agent_registry.find_agents_by_capability("text_processing")
    assert len(agents) == 1
    assert agents[0]["agent_id"] == "test_agent_001"

def test_get_registry_statistics(agent_registry, sample_agent_data):
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

if __name__ == "__main__":
    pytest.main([__file__])

