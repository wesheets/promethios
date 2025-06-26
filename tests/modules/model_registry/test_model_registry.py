"""
Comprehensive test suite for Model Registry.

This test suite covers all functionality of the Model Registry including:
- Model registration and validation
- Model inference and execution
- Model lifecycle management
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
from src.modules.model_registry.model_registry import (
    ModelRegistry, ModelType, ModelStatus, ModelCapability,
    ModelRegistrationResult, ModelInferenceResult
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
    
    def evaluate_model_registration(self, model_data):
        return {
            "approved": self.should_approve,
            "overall_score": self.governance_score,
            "reason": "Mock governance evaluation"
        }
    
    def evaluate_model_inference(self, model_id, input_data):
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
def model_registry(temp_registry_file, mock_schema_validator, mock_seal_service, mock_governance):
    """Create a model registry for testing."""
    return ModelRegistry(
        schema_validator=mock_schema_validator,
        seal_verification_service=mock_seal_service,
        registry_path=temp_registry_file,
        governance_integration=mock_governance
    )

@pytest.fixture
def sample_model_data():
    """Create sample model data for testing."""
    return {
        "model_id": "test_model_001",
        "name": "Test Language Model",
        "description": "A test language model for unit testing",
        "model_type": ModelType.LANGUAGE_MODEL.value,
        "version": "1.0.0",
        "provider": "Test Provider",
        "capabilities": [
            {
                "capability_id": "text_generation",
                "level": "advanced",
                "description": "Advanced text generation capability"
            },
            {
                "capability_id": "text_completion",
                "level": "expert",
                "description": "Expert text completion capability"
            }
        ],
        "configuration": {
            "max_tokens": 4096,
            "temperature": 0.7,
            "top_p": 0.9,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        },
        "governance_config": {
            "safety_level": "high",
            "content_filtering": True,
            "bias_detection": True,
            "audit_logging": True
        },
        "metadata": {
            "tags": ["test", "language", "generation"],
            "category": "nlp",
            "license": "test-license"
        }
    }

class TestModelRegistry:
    """Test cases for Model Registry."""
    
    def test_initialization(self, model_registry):
        """Test model registry initialization."""
        assert model_registry is not None
        assert model_registry.models == {}
        assert model_registry.model_capabilities == {}
        assert model_registry.model_usage_stats == {}
        assert model_registry.model_performance == {}
    
    def test_register_model_success(self, model_registry, sample_model_data):
        """Test successful model registration."""
        result = model_registry.register_model(sample_model_data)
        
        assert result.success is True
        assert result.model_id == "test_model_001"
        assert result.error is None
        assert result.registration_timestamp is not None
        
        # Verify model was added to registry
        assert "test_model_001" in model_registry.models
        model = model_registry.models["test_model_001"]
        assert model["name"] == "Test Language Model"
        assert model["status"] == ModelStatus.ACTIVE.value
    
    def test_register_model_duplicate(self, model_registry, sample_model_data):
        """Test registration of duplicate model."""
        # Register model first time
        result1 = model_registry.register_model(sample_model_data)
        assert result1.success is True
        
        # Try to register same model again
        result2 = model_registry.register_model(sample_model_data)
        assert result2.success is False
        assert "already exists" in result2.error
    
    def test_inference_success(self, model_registry, sample_model_data):
        """Test successful model inference."""
        # Register model first
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Perform inference
        input_data = {
            "prompt": "Hello, world!",
            "max_tokens": 100,
            "temperature": 0.7
        }
        
        result = model_registry.inference("test_model_001", input_data)
        assert result.success is True
        assert result.output is not None
        assert result.governance_metrics is not None
    
    def test_inference_model_not_found(self, model_registry):
        """Test inference with non-existent model."""
        input_data = {
            "prompt": "Hello, world!",
            "max_tokens": 100
        }
        
        result = model_registry.inference("nonexistent_model", input_data)
        assert result.success is False
        assert "does not exist" in result.error
    
    def test_inference_inactive_model(self, model_registry, sample_model_data):
        """Test inference with inactive model."""
        # Register and then deactivate model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        model_registry.update_model_status("test_model_001", ModelStatus.INACTIVE)
        
        input_data = {
            "prompt": "Hello, world!",
            "max_tokens": 100
        }
        
        result = model_registry.inference("test_model_001", input_data)
        assert result.success is False
        assert "not active" in result.error
    
    def test_find_models_by_capability(self, model_registry, sample_model_data):
        """Test finding models by capability."""
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Find models with text generation capability
        models = model_registry.find_models_by_capability("text_generation")
        assert len(models) == 1
        assert models[0]["model_id"] == "test_model_001"
    
    def test_find_models_by_type(self, model_registry, sample_model_data):
        """Test finding models by type."""
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Find language models
        models = model_registry.find_models_by_type(ModelType.LANGUAGE_MODEL)
        assert len(models) == 1
        assert models[0]["model_id"] == "test_model_001"
    
    def test_get_model(self, model_registry, sample_model_data):
        """Test getting model information."""
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Get model
        model = model_registry.get_model("test_model_001")
        assert model is not None
        assert model["name"] == "Test Language Model"
        assert model["model_type"] == ModelType.LANGUAGE_MODEL.value
    
    def test_get_model_not_found(self, model_registry):
        """Test getting non-existent model."""
        model = model_registry.get_model("nonexistent_model")
        assert model is None
    
    def test_list_models(self, model_registry, sample_model_data):
        """Test listing all models."""
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # List all models
        models = model_registry.list_models()
        assert len(models) == 1
        assert "test_model_001" in models
    
    def test_list_models_with_filters(self, model_registry, sample_model_data):
        """Test listing models with filters."""
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # List models with type filter
        models = model_registry.list_models(model_type_filter=ModelType.LANGUAGE_MODEL)
        assert len(models) == 1
        
        # List models with status filter
        models = model_registry.list_models(status_filter=ModelStatus.ACTIVE)
        assert len(models) == 1
        
        # List models with non-matching filter
        models = model_registry.list_models(model_type_filter=ModelType.VISION_MODEL)
        assert len(models) == 0
    
    def test_get_active_models(self, model_registry, sample_model_data):
        """Test getting active models."""
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Get active models
        active_models = model_registry.get_active_models()
        assert len(active_models) == 1
        assert "test_model_001" in active_models
    
    def test_update_model_status(self, model_registry, sample_model_data):
        """Test updating model status."""
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Update status to inactive
        success = model_registry.update_model_status("test_model_001", ModelStatus.INACTIVE)
        assert success is True
        
        # Verify status was updated
        model = model_registry.get_model("test_model_001")
        assert model["status"] == ModelStatus.INACTIVE.value
    
    def test_check_model_exists(self, model_registry, sample_model_data):
        """Test checking if model exists."""
        # Check non-existent model
        exists = model_registry.check_model_exists("test_model_001")
        assert exists is False
        
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Check existing model
        exists = model_registry.check_model_exists("test_model_001")
        assert exists is True
    
    def test_get_registry_statistics(self, model_registry, sample_model_data):
        """Test getting registry statistics."""
        # Get stats for empty registry
        stats = model_registry.get_registry_statistics()
        assert stats["total_models"] == 0
        
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Get stats after registration
        stats = model_registry.get_registry_statistics()
        assert stats["total_models"] == 1
        assert stats["models_by_type"][ModelType.LANGUAGE_MODEL.value] == 1
        assert stats["models_by_status"][ModelStatus.ACTIVE.value] == 1
    
    def test_model_performance_tracking(self, model_registry, sample_model_data):
        """Test model performance tracking."""
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Perform inference multiple times
        input_data = {
            "prompt": "Test prompt",
            "max_tokens": 50
        }
        
        for i in range(3):
            result = model_registry.inference("test_model_001", input_data)
            assert result.success is True
        
        # Check performance stats
        performance = model_registry.get_model_performance("test_model_001")
        assert performance is not None
        assert performance["total_inferences"] == 3
        assert performance["successful_inferences"] == 3
        assert performance["average_inference_time"] > 0
    
    def test_model_capability_management(self, model_registry, sample_model_data):
        """Test model capability management."""
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Get model capabilities
        capabilities = model_registry.get_model_capabilities("test_model_001")
        assert capabilities is not None
        assert len(capabilities) == 2
        assert any(cap["capability_id"] == "text_generation" for cap in capabilities)
        assert any(cap["capability_id"] == "text_completion" for cap in capabilities)
    
    def test_registry_persistence(self, model_registry, sample_model_data):
        """Test registry persistence to file."""
        # Register model
        reg_result = model_registry.register_model(sample_model_data)
        assert reg_result.success is True
        
        # Verify file was created and contains data
        assert os.path.exists(model_registry.registry_path)
        
        with open(model_registry.registry_path, 'r') as f:
            data = json.load(f)
        
        assert "models" in data
        assert "test_model_001" in data["models"]
        assert "seal" in data
    
    def test_different_model_types(self, model_registry):
        """Test registration of different model types."""
        model_types = [
            ModelType.LANGUAGE_MODEL,
            ModelType.VISION_MODEL,
            ModelType.AUDIO_MODEL,
            ModelType.MULTIMODAL_MODEL
        ]
        
        for i, model_type in enumerate(model_types):
            model_data = {
                "model_id": f"test_model_{model_type.value}_{i}",
                "name": f"Test {model_type.value.title()} Model",
                "description": f"Test {model_type.value} model",
                "model_type": model_type.value,
                "capabilities": [],
                "configuration": {},
                "governance_config": {}
            }
            
            result = model_registry.register_model(model_data)
            assert result.success is True
        
        # Verify all models were registered
        stats = model_registry.get_registry_statistics()
        assert stats["total_models"] == len(model_types)
    
    def test_model_configuration_validation(self, model_registry):
        """Test model configuration validation."""
        model_data = {
            "model_id": "config_test_model",
            "name": "Configuration Test Model",
            "description": "Model for testing configuration validation",
            "model_type": ModelType.LANGUAGE_MODEL.value,
            "capabilities": [],
            "configuration": {
                "max_tokens": 2048,
                "temperature": 0.8,
                "top_p": 0.95,
                "custom_param": "test_value"
            },
            "governance_config": {
                "safety_level": "medium",
                "content_filtering": False
            }
        }
        
        result = model_registry.register_model(model_data)
        assert result.success is True
        
        # Verify configuration was stored correctly
        model = model_registry.get_model("config_test_model")
        assert model["configuration"]["max_tokens"] == 2048
        assert model["configuration"]["temperature"] == 0.8
        assert model["governance_config"]["safety_level"] == "medium"
    
    def test_error_handling(self, model_registry):
        """Test error handling in various scenarios."""
        # Test with invalid data types
        invalid_data = "not a dictionary"
        
        with pytest.raises(Exception):
            model_registry.register_model(invalid_data)
        
        # Test with missing required fields
        incomplete_data = {
            "model_id": "incomplete_model"
            # Missing required fields
        }
        
        result = model_registry.register_model(incomplete_data)
        assert result.success is False
    
    def test_large_scale_operations(self, model_registry):
        """Test registry performance with larger datasets."""
        # Register many models
        num_models = 25
        
        for i in range(num_models):
            model_data = {
                "model_id": f"scale_model_{i:03d}",
                "name": f"Scale Model {i}",
                "description": f"Model for scale testing {i}",
                "model_type": ModelType.LANGUAGE_MODEL.value,
                "capabilities": [
                    {
                        "capability_id": f"capability_{i % 5}",
                        "level": "basic",
                        "description": f"Capability {i % 5}"
                    }
                ],
                "configuration": {"model_number": i},
                "governance_config": {}
            }
            
            result = model_registry.register_model(model_data)
            assert result.success is True
        
        # Test operations on large dataset
        stats = model_registry.get_registry_statistics()
        assert stats["total_models"] == num_models
        
        # Test finding models by capability
        models = model_registry.find_models_by_capability("capability_0")
        assert len(models) == 5  # Every 5th model has capability_0
        
        # Test listing with filters
        all_models = model_registry.list_models()
        assert len(all_models) == num_models

if __name__ == "__main__":
    pytest.main([__file__])

