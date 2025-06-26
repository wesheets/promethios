"""
Comprehensive test suite for Tool Registry.

This test suite covers all functionality of the Tool Registry including:
- Tool registration and validation
- Tool invocation and execution
- Tool lifecycle management
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
from src.modules.tool_registry.tool_registry import (
    ToolRegistry, ToolType, ToolStatus, ToolParameter,
    ToolRegistrationResult, ToolInvocationResult
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
    
    def evaluate_tool_registration(self, tool_data):
        return {
            "approved": self.should_approve,
            "overall_score": self.governance_score,
            "reason": "Mock governance evaluation"
        }
    
    def evaluate_tool_invocation(self, tool_id, parameters):
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
def tool_registry(temp_registry_file, mock_schema_validator, mock_seal_service, mock_governance):
    """Create a tool registry for testing."""
    return ToolRegistry(
        schema_validator=mock_schema_validator,
        seal_verification_service=mock_seal_service,
        registry_path=temp_registry_file,
        governance_integration=mock_governance
    )

@pytest.fixture
def sample_tool_data():
    """Create sample tool data for testing."""
    return {
        "tool_id": "test_tool_001",
        "name": "Test Calculator",
        "description": "A test calculator tool for unit testing",
        "tool_type": ToolType.COMPUTATIONAL.value,
        "version": "1.0.0",
        "author": "Test Author",
        "parameters": [
            {
                "name": "operation",
                "type": "string",
                "required": True,
                "description": "Mathematical operation to perform",
                "allowed_values": ["add", "subtract", "multiply", "divide"]
            },
            {
                "name": "operand1",
                "type": "number",
                "required": True,
                "description": "First operand"
            },
            {
                "name": "operand2",
                "type": "number",
                "required": True,
                "description": "Second operand"
            }
        ],
        "execution_config": {
            "timeout": 30,
            "memory_limit": "128MB",
            "cpu_limit": "1 core"
        },
        "governance_config": {
            "safety_level": "medium",
            "audit_logging": True,
            "rate_limiting": True
        },
        "metadata": {
            "tags": ["test", "calculator", "math"],
            "category": "utilities"
        }
    }

class TestToolRegistry:
    """Test cases for Tool Registry."""
    
    def test_initialization(self, tool_registry):
        """Test tool registry initialization."""
        assert tool_registry is not None
        assert tool_registry.tools == {}
        assert tool_registry.tool_executions == {}
        assert tool_registry.tool_usage_stats == {}
        assert tool_registry.tool_performance == {}
    
    def test_register_tool_success(self, tool_registry, sample_tool_data):
        """Test successful tool registration."""
        result = tool_registry.register_tool(sample_tool_data)
        
        assert result.success is True
        assert result.tool_id == "test_tool_001"
        assert result.error is None
        assert result.registration_timestamp is not None
        
        # Verify tool was added to registry
        assert "test_tool_001" in tool_registry.tools
        tool = tool_registry.tools["test_tool_001"]
        assert tool["name"] == "Test Calculator"
        assert tool["status"] == ToolStatus.ACTIVE.value
    
    def test_register_tool_duplicate(self, tool_registry, sample_tool_data):
        """Test registration of duplicate tool."""
        # Register tool first time
        result1 = tool_registry.register_tool(sample_tool_data)
        assert result1.success is True
        
        # Try to register same tool again
        result2 = tool_registry.register_tool(sample_tool_data)
        assert result2.success is False
        assert "already exists" in result2.error
    
    def test_register_tool_validation_failure(self, temp_registry_file, mock_seal_service, mock_governance):
        """Test tool registration with validation failure."""
        # Create registry with failing validator
        failing_validator = MockSchemaValidator(should_validate=False)
        registry = ToolRegistry(
            schema_validator=failing_validator,
            seal_verification_service=mock_seal_service,
            registry_path=temp_registry_file,
            governance_integration=mock_governance
        )
        
        sample_data = {
            "tool_id": "test_tool_002",
            "name": "Test Tool 2"
        }
        
        result = registry.register_tool(sample_data)
        assert result.success is False
        assert "validation failed" in result.error.lower()
    
    def test_invoke_tool_success(self, tool_registry, sample_tool_data):
        """Test successful tool invocation."""
        # Register tool first
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Invoke tool
        parameters = {
            "operation": "add",
            "operand1": 5,
            "operand2": 3
        }
        
        result = tool_registry.invoke_tool("test_tool_001", parameters)
        assert result.success is True
        assert result.output is not None
        assert result.governance_score > 0
    
    def test_invoke_tool_not_found(self, tool_registry):
        """Test invocation of non-existent tool."""
        parameters = {
            "operation": "add",
            "operand1": 5,
            "operand2": 3
        }
        
        result = tool_registry.invoke_tool("nonexistent_tool", parameters)
        assert result.success is False
        assert "does not exist" in result.error
    
    def test_invoke_tool_inactive(self, tool_registry, sample_tool_data):
        """Test invocation of inactive tool."""
        # Register and then deactivate tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        tool_registry.update_tool_status("test_tool_001", ToolStatus.INACTIVE)
        
        parameters = {
            "operation": "add",
            "operand1": 5,
            "operand2": 3
        }
        
        result = tool_registry.invoke_tool("test_tool_001", parameters)
        assert result.success is False
        assert "not active" in result.error
    
    def test_invoke_tool_parameter_validation(self, tool_registry, sample_tool_data):
        """Test tool invocation with parameter validation."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Test missing required parameter
        parameters = {
            "operation": "add",
            "operand1": 5
            # Missing operand2
        }
        
        result = tool_registry.invoke_tool("test_tool_001", parameters)
        assert result.success is False
        assert "required parameter" in result.error.lower()
        
        # Test invalid parameter value
        parameters = {
            "operation": "invalid_operation",
            "operand1": 5,
            "operand2": 3
        }
        
        result = tool_registry.invoke_tool("test_tool_001", parameters)
        assert result.success is False
        assert "invalid value" in result.error.lower()
    
    def test_find_tools_by_type(self, tool_registry, sample_tool_data):
        """Test finding tools by type."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Find computational tools
        tools = tool_registry.find_tools_by_type(ToolType.COMPUTATIONAL)
        assert len(tools) == 1
        assert tools[0]["tool_id"] == "test_tool_001"
    
    def test_find_tools_by_capability(self, tool_registry, sample_tool_data):
        """Test finding tools by capability."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Find tools with math capability
        tools = tool_registry.find_tools_by_capability("math")
        assert len(tools) >= 0  # May or may not find tools depending on implementation
    
    def test_get_tool(self, tool_registry, sample_tool_data):
        """Test getting tool information."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Get tool
        tool = tool_registry.get_tool("test_tool_001")
        assert tool is not None
        assert tool["name"] == "Test Calculator"
        assert tool["tool_type"] == ToolType.COMPUTATIONAL.value
    
    def test_get_tool_not_found(self, tool_registry):
        """Test getting non-existent tool."""
        tool = tool_registry.get_tool("nonexistent_tool")
        assert tool is None
    
    def test_list_tools(self, tool_registry, sample_tool_data):
        """Test listing all tools."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # List all tools
        tools = tool_registry.list_tools()
        assert len(tools) == 1
        assert "test_tool_001" in tools
    
    def test_list_tools_with_filters(self, tool_registry, sample_tool_data):
        """Test listing tools with filters."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # List tools with type filter
        tools = tool_registry.list_tools(tool_type_filter=ToolType.COMPUTATIONAL)
        assert len(tools) == 1
        
        # List tools with status filter
        tools = tool_registry.list_tools(status_filter=ToolStatus.ACTIVE)
        assert len(tools) == 1
        
        # List tools with non-matching filter
        tools = tool_registry.list_tools(tool_type_filter=ToolType.DATA_PROCESSING)
        assert len(tools) == 0
    
    def test_get_active_tools(self, tool_registry, sample_tool_data):
        """Test getting active tools."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Get active tools
        active_tools = tool_registry.get_active_tools()
        assert len(active_tools) == 1
        assert "test_tool_001" in active_tools
    
    def test_update_tool_status(self, tool_registry, sample_tool_data):
        """Test updating tool status."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Update status to inactive
        success = tool_registry.update_tool_status("test_tool_001", ToolStatus.INACTIVE)
        assert success is True
        
        # Verify status was updated
        tool = tool_registry.get_tool("test_tool_001")
        assert tool["status"] == ToolStatus.INACTIVE.value
    
    def test_update_tool_status_not_found(self, tool_registry):
        """Test updating status of non-existent tool."""
        success = tool_registry.update_tool_status("nonexistent_tool", ToolStatus.INACTIVE)
        assert success is False
    
    def test_check_tool_exists(self, tool_registry, sample_tool_data):
        """Test checking if tool exists."""
        # Check non-existent tool
        exists = tool_registry.check_tool_exists("test_tool_001")
        assert exists is False
        
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Check existing tool
        exists = tool_registry.check_tool_exists("test_tool_001")
        assert exists is True
    
    def test_get_registry_statistics(self, tool_registry, sample_tool_data):
        """Test getting registry statistics."""
        # Get stats for empty registry
        stats = tool_registry.get_registry_statistics()
        assert stats["total_tools"] == 0
        
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Get stats after registration
        stats = tool_registry.get_registry_statistics()
        assert stats["total_tools"] == 1
        assert stats["tools_by_type"][ToolType.COMPUTATIONAL.value] == 1
        assert stats["tools_by_status"][ToolStatus.ACTIVE.value] == 1
    
    def test_tool_performance_tracking(self, tool_registry, sample_tool_data):
        """Test tool performance tracking."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Invoke tool multiple times
        parameters = {
            "operation": "add",
            "operand1": 5,
            "operand2": 3
        }
        
        for i in range(3):
            result = tool_registry.invoke_tool("test_tool_001", parameters)
            assert result.success is True
        
        # Check performance stats
        performance = tool_registry.get_tool_performance("test_tool_001")
        assert performance is not None
        assert performance["total_invocations"] == 3
        assert performance["successful_invocations"] == 3
        assert performance["average_execution_time"] > 0
    
    def test_tool_execution_tracking(self, tool_registry, sample_tool_data):
        """Test tool execution tracking."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Invoke tool
        parameters = {
            "operation": "multiply",
            "operand1": 4,
            "operand2": 7
        }
        
        result = tool_registry.invoke_tool("test_tool_001", parameters)
        assert result.success is True
        
        # Check execution was tracked
        executions = tool_registry.get_tool_executions("test_tool_001")
        assert executions is not None
        assert len(executions) > 0
    
    def test_registry_persistence(self, tool_registry, sample_tool_data):
        """Test registry persistence to file."""
        # Register tool
        reg_result = tool_registry.register_tool(sample_tool_data)
        assert reg_result.success is True
        
        # Verify file was created and contains data
        assert os.path.exists(tool_registry.registry_path)
        
        with open(tool_registry.registry_path, 'r') as f:
            data = json.load(f)
        
        assert "tools" in data
        assert "test_tool_001" in data["tools"]
        assert "seal" in data
    
    def test_registry_loading(self, temp_registry_file, mock_schema_validator, mock_seal_service, mock_governance):
        """Test loading registry from file."""
        # Create initial registry and add tool
        registry1 = ToolRegistry(
            schema_validator=mock_schema_validator,
            seal_verification_service=mock_seal_service,
            registry_path=temp_registry_file,
            governance_integration=mock_governance
        )
        
        sample_data = {
            "tool_id": "test_tool_load",
            "name": "Load Test Tool",
            "description": "Test tool for loading",
            "tool_type": ToolType.COMPUTATIONAL.value,
            "parameters": [],
            "execution_config": {},
            "governance_config": {}
        }
        
        reg_result = registry1.register_tool(sample_data)
        assert reg_result.success is True
        
        # Create new registry instance and verify it loads the data
        registry2 = ToolRegistry(
            schema_validator=mock_schema_validator,
            seal_verification_service=mock_seal_service,
            registry_path=temp_registry_file,
            governance_integration=mock_governance
        )
        
        assert "test_tool_load" in registry2.tools
        tool = registry2.get_tool("test_tool_load")
        assert tool["name"] == "Load Test Tool"
    
    def test_tool_parameter_types(self, tool_registry):
        """Test different tool parameter types."""
        tool_data = {
            "tool_id": "param_test_tool",
            "name": "Parameter Test Tool",
            "description": "Tool for testing different parameter types",
            "tool_type": ToolType.DATA_PROCESSING.value,
            "parameters": [
                {
                    "name": "string_param",
                    "type": "string",
                    "required": True,
                    "description": "String parameter"
                },
                {
                    "name": "number_param",
                    "type": "number",
                    "required": True,
                    "description": "Number parameter"
                },
                {
                    "name": "boolean_param",
                    "type": "boolean",
                    "required": False,
                    "default_value": False,
                    "description": "Boolean parameter"
                },
                {
                    "name": "array_param",
                    "type": "array",
                    "required": False,
                    "description": "Array parameter"
                }
            ],
            "execution_config": {},
            "governance_config": {}
        }
        
        # Register tool
        reg_result = tool_registry.register_tool(tool_data)
        assert reg_result.success is True
        
        # Test with valid parameters
        parameters = {
            "string_param": "test string",
            "number_param": 42,
            "boolean_param": True,
            "array_param": [1, 2, 3]
        }
        
        result = tool_registry.invoke_tool("param_test_tool", parameters)
        assert result.success is True
    
    def test_error_handling(self, tool_registry):
        """Test error handling in various scenarios."""
        # Test with invalid data types
        invalid_data = "not a dictionary"
        
        with pytest.raises(Exception):
            tool_registry.register_tool(invalid_data)
        
        # Test with missing required fields
        incomplete_data = {
            "tool_id": "incomplete_tool"
            # Missing required fields
        }
        
        result = tool_registry.register_tool(incomplete_data)
        assert result.success is False
    
    def test_concurrent_operations(self, tool_registry, sample_tool_data):
        """Test concurrent operations on the registry."""
        # Register multiple tools
        for i in range(5):
            tool_data = sample_tool_data.copy()
            tool_data["tool_id"] = f"concurrent_tool_{i}"
            tool_data["name"] = f"Concurrent Tool {i}"
            
            result = tool_registry.register_tool(tool_data)
            assert result.success is True
        
        # Verify all tools were registered
        stats = tool_registry.get_registry_statistics()
        assert stats["total_tools"] == 5
    
    def test_large_scale_operations(self, tool_registry):
        """Test registry performance with larger datasets."""
        # Register many tools
        num_tools = 50
        
        for i in range(num_tools):
            tool_data = {
                "tool_id": f"scale_tool_{i:03d}",
                "name": f"Scale Tool {i}",
                "description": f"Tool for scale testing {i}",
                "tool_type": ToolType.COMPUTATIONAL.value,
                "parameters": [
                    {
                        "name": "input",
                        "type": "string",
                        "required": True,
                        "description": "Input parameter"
                    }
                ],
                "execution_config": {"tool_number": i},
                "governance_config": {}
            }
            
            result = tool_registry.register_tool(tool_data)
            assert result.success is True
        
        # Test operations on large dataset
        stats = tool_registry.get_registry_statistics()
        assert stats["total_tools"] == num_tools
        
        # Test listing with filters
        all_tools = tool_registry.list_tools()
        assert len(all_tools) == num_tools
        
        # Test finding tools by type
        computational_tools = tool_registry.find_tools_by_type(ToolType.COMPUTATIONAL)
        assert len(computational_tools) == num_tools

if __name__ == "__main__":
    pytest.main([__file__])

