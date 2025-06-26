"""
Comprehensive Test Suite for Native LLM Extension

This module provides complete test coverage for the Native LLM extension,
including unit tests, integration tests, and governance compliance tests.
"""

import pytest
import asyncio
import json
import torch
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime
from typing import Dict, Any

# Import the modules we're testing
from ....src.extensions.native_llm.native_llm_extension import (
    NativeLLMExtension,
    GovernanceNativeModel,
    NativeLLMConfig,
    NativeLLMResponse,
    ModelSize,
    GenerationMode
)
from ....src.extensions.native_llm.governance_integration import (
    GovernanceIntegrationService,
    TrustAwareGeneration,
    ComplianceMonitor,
    ComplianceLevel
)
from ....src.extensions.native_llm.training import (
    GovernanceTrainingPipeline,
    TrainingConfig,
    TrainingStage,
    GovernanceDatasetGenerator
)

class TestNativeLLMConfig:
    """Test cases for Native LLM configuration."""
    
    def test_default_config(self):
        """Test default configuration values."""
        config = NativeLLMConfig()
        
        assert config.model_size == ModelSize.MEDIUM
        assert config.generation_mode == GenerationMode.GOVERNANCE_AWARE
        assert config.max_tokens == 2048
        assert config.temperature == 0.7
        assert config.governance_weight == 0.3
        assert config.trust_threshold == 0.7
        assert config.enable_real_time_monitoring is True
    
    def test_custom_config(self):
        """Test custom configuration values."""
        config = NativeLLMConfig(
            model_size=ModelSize.LARGE,
            generation_mode=GenerationMode.TRUST_OPTIMIZED,
            max_tokens=1024,
            temperature=0.5,
            governance_weight=0.5,
            trust_threshold=0.8
        )
        
        assert config.model_size == ModelSize.LARGE
        assert config.generation_mode == GenerationMode.TRUST_OPTIMIZED
        assert config.max_tokens == 1024
        assert config.temperature == 0.5
        assert config.governance_weight == 0.5
        assert config.trust_threshold == 0.8
    
    def test_config_validation(self):
        """Test configuration validation."""
        # Test valid ranges
        config = NativeLLMConfig(
            temperature=0.1,
            governance_weight=0.0,
            trust_threshold=1.0
        )
        assert config.temperature == 0.1
        assert config.governance_weight == 0.0
        assert config.trust_threshold == 1.0

class TestGovernanceNativeModel:
    """Test cases for Governance Native Model."""
    
    @pytest.fixture
    def mock_governance_core(self):
        """Mock governance core for testing."""
        mock = AsyncMock()
        mock.evaluate_request.return_value = {
            "compliant": True,
            "score": 0.9,
            "violations": [],
            "recommendations": []
        }
        mock.evaluate_content.return_value = {
            "compliance_score": 0.85
        }
        return mock
    
    @pytest.fixture
    def mock_trust_engine(self):
        """Mock trust engine for testing."""
        mock = AsyncMock()
        mock.calculate_content_trust.return_value = {
            "trust_score": 0.8
        }
        return mock
    
    @pytest.fixture
    def model_config(self):
        """Test model configuration."""
        return NativeLLMConfig(
            model_size=ModelSize.SMALL,
            generation_mode=GenerationMode.GOVERNANCE_AWARE
        )
    
    @pytest.fixture
    def governance_model(self, model_config, mock_governance_core, mock_trust_engine):
        """Create governance model for testing."""
        with patch('....src.extensions.native_llm.native_llm_extension.GovernanceCore', return_value=mock_governance_core), \
             patch('....src.extensions.native_llm.native_llm_extension.TrustPropagationEngine', return_value=mock_trust_engine):
            return GovernanceNativeModel(model_config)
    
    @pytest.mark.asyncio
    async def test_model_initialization(self, governance_model):
        """Test model initialization."""
        assert governance_model.config.model_size == ModelSize.SMALL
        assert governance_model.is_loaded is False
        assert governance_model.model_path.endswith("governance-native-small")
    
    @pytest.mark.asyncio
    async def test_model_loading(self, governance_model):
        """Test model loading process."""
        # Mock the model loading
        with patch.object(governance_model, '_initialize_governance_integration'), \
             patch.object(governance_model, '_initialize_trust_integration'), \
             patch.object(governance_model, '_initialize_emotional_intelligence'):
            
            result = await governance_model.load_model()
            
            assert result is True
            assert governance_model.is_loaded is True
    
    @pytest.mark.asyncio
    async def test_text_generation(self, governance_model, mock_governance_core, mock_trust_engine):
        """Test text generation with governance integration."""
        # Setup model as loaded
        governance_model.is_loaded = True
        governance_model.governance_core = mock_governance_core
        governance_model.trust_engine = mock_trust_engine
        
        # Test generation
        response = await governance_model.generate(
            prompt="Explain renewable energy benefits",
            context={"topic": "environment"}
        )
        
        # Verify response structure
        assert isinstance(response, NativeLLMResponse)
        assert response.text is not None
        assert response.governance_score > 0
        assert response.trust_score > 0
        assert response.compliance_status in ["compliant", "review_required", "blocked"]
        assert response.timestamp is not None
        
        # Verify governance integration was called
        mock_governance_core.evaluate_request.assert_called_once()
        mock_governance_core.evaluate_content.assert_called_once()
        mock_trust_engine.calculate_content_trust.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_governance_blocked_generation(self, governance_model, mock_governance_core):
        """Test generation blocked by governance."""
        # Setup model as loaded
        governance_model.is_loaded = True
        governance_model.governance_core = mock_governance_core
        
        # Mock governance blocking the request
        mock_governance_core.evaluate_request.return_value = {
            "compliant": False,
            "score": 0.2,
            "violations": ["policy_violation"],
            "recommendations": ["revise_request"]
        }
        
        response = await governance_model.generate(
            prompt="How to hack systems",
            context={}
        )
        
        # Verify blocked response
        assert response.compliance_status == "blocked"
        assert response.governance_score == 0.0
        assert response.trust_score == 0.0
        assert "cannot generate" in response.text.lower()
    
    @pytest.mark.asyncio
    async def test_different_generation_modes(self, model_config, mock_governance_core, mock_trust_engine):
        """Test different generation modes."""
        modes_to_test = [
            GenerationMode.STANDARD,
            GenerationMode.GOVERNANCE_AWARE,
            GenerationMode.TRUST_OPTIMIZED,
            GenerationMode.MULTI_AGENT,
            GenerationMode.COLLECTIVE_INTELLIGENCE
        ]
        
        for mode in modes_to_test:
            config = NativeLLMConfig(generation_mode=mode)
            
            with patch('....src.extensions.native_llm.native_llm_extension.GovernanceCore', return_value=mock_governance_core), \
                 patch('....src.extensions.native_llm.native_llm_extension.TrustPropagationEngine', return_value=mock_trust_engine):
                
                model = GovernanceNativeModel(config)
                model.is_loaded = True
                model.governance_core = mock_governance_core
                model.trust_engine = mock_trust_engine
                
                response = await model.generate("Test prompt")
                
                # Verify mode-specific content
                assert mode.value.replace("_", " ") in response.text.lower()

class TestNativeLLMExtension:
    """Test cases for Native LLM Extension."""
    
    @pytest.fixture
    def llm_extension(self):
        """Create LLM extension for testing."""
        return NativeLLMExtension()
    
    @pytest.mark.asyncio
    async def test_extension_initialization(self, llm_extension):
        """Test extension initialization."""
        assert llm_extension.extension_id == "native_llm"
        assert llm_extension.version == "1.0.0"
        assert len(llm_extension.models) == 0
        assert llm_extension.default_config is not None
    
    @pytest.mark.asyncio
    async def test_extension_initialize(self, llm_extension):
        """Test extension initialization process."""
        with patch.object(llm_extension, '_register_extension_points'), \
             patch.object(llm_extension, '_initialize_default_model'):
            
            result = await llm_extension.initialize()
            assert result is True
    
    @pytest.mark.asyncio
    async def test_text_generation_via_extension(self, llm_extension):
        """Test text generation through extension interface."""
        # Mock a model
        mock_model = AsyncMock()
        mock_response = NativeLLMResponse(
            text="Test response",
            governance_score=0.9,
            trust_score=0.8,
            emotional_state={"confidence": 0.8},
            collective_intelligence_score=0.85,
            generation_metadata={},
            compliance_status="compliant",
            timestamp=datetime.utcnow().isoformat()
        )
        mock_model.generate.return_value = mock_response
        
        llm_extension.models["test"] = mock_model
        
        response = await llm_extension.generate(
            prompt="Test prompt",
            model_id="test"
        )
        
        assert response == mock_response
        mock_model.generate.assert_called_once_with("Test prompt", None)
    
    @pytest.mark.asyncio
    async def test_model_info_retrieval(self, llm_extension):
        """Test model information retrieval."""
        # Mock a model
        mock_model = Mock()
        mock_model.config = NativeLLMConfig()
        mock_model.is_loaded = True
        mock_model.model_path = "/test/path"
        
        llm_extension.models["test"] = mock_model
        
        info = await llm_extension.get_model_info("test")
        
        assert info["model_id"] == "test"
        assert info["is_loaded"] is True
        assert info["model_path"] == "/test/path"
        assert "capabilities" in info
    
    @pytest.mark.asyncio
    async def test_list_models(self, llm_extension):
        """Test listing all models."""
        # Add mock models
        for i in range(3):
            mock_model = Mock()
            mock_model.config = NativeLLMConfig()
            mock_model.is_loaded = True
            mock_model.model_path = f"/test/path/{i}"
            llm_extension.models[f"model_{i}"] = mock_model
        
        models = await llm_extension.list_models()
        
        assert len(models) == 3
        for i, model_info in enumerate(models):
            assert model_info["model_id"] == f"model_{i}"

class TestGovernanceIntegration:
    """Test cases for Governance Integration components."""
    
    @pytest.fixture
    def mock_trust_engine(self):
        """Mock trust engine."""
        mock = AsyncMock()
        mock.calculate_content_trust.return_value = {"trust_score": 0.8}
        return mock
    
    @pytest.fixture
    def mock_governance_core(self):
        """Mock governance core."""
        mock = AsyncMock()
        mock.evaluate_request.return_value = {
            "compliant": True,
            "score": 0.9,
            "violations": []
        }
        mock.evaluate_content.return_value = {
            "compliance_score": 0.85
        }
        return mock
    
    @pytest.fixture
    def trust_aware_generation(self, mock_trust_engine):
        """Create trust-aware generation for testing."""
        return TrustAwareGeneration(mock_trust_engine)
    
    @pytest.fixture
    def compliance_monitor(self, mock_governance_core):
        """Create compliance monitor for testing."""
        return ComplianceMonitor(mock_governance_core)
    
    @pytest.mark.asyncio
    async def test_trust_evaluation(self, trust_aware_generation, mock_trust_engine):
        """Test trust evaluation for generated text."""
        result = await trust_aware_generation.evaluate_generation_trust(
            prompt="Test prompt",
            generated_text="Test response",
            context={"user_trust_level": 0.9}
        )
        
        assert "trust_score" in result
        assert "base_trust" in result
        assert "context_trust" in result
        assert "confidence_interval" in result
        assert "trust_factors" in result
        
        # Verify trust engine was called
        mock_trust_engine.calculate_content_trust.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_compliance_monitoring(self, compliance_monitor, mock_governance_core):
        """Test compliance monitoring for generation."""
        result = await compliance_monitor.monitor_generation(
            prompt="Test prompt",
            generated_text="Test response",
            compliance_level=ComplianceLevel.BALANCED
        )
        
        assert "compliant" in result
        assert "compliance_score" in result
        assert "violations" in result
        assert "compliance_level" in result
        assert "timestamp" in result
        
        # Verify governance core was called
        mock_governance_core.evaluate_request.assert_called_once()
        mock_governance_core.evaluate_content.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_governance_integration_service(self):
        """Test complete governance integration service."""
        service = GovernanceIntegrationService()
        
        # Mock the internal components
        service.trust_aware_generation = AsyncMock()
        service.compliance_monitor = AsyncMock()
        
        service.trust_aware_generation.evaluate_generation_trust.return_value = {
            "trust_score": 0.8,
            "confidence_interval": [0.7, 0.9]
        }
        
        service.compliance_monitor.monitor_generation.return_value = {
            "compliant": True,
            "compliance_score": 0.9,
            "violations": []
        }
        
        result = await service.process_generation(
            prompt="Test prompt",
            generated_text="Test response"
        )
        
        assert "trust_evaluation" in result
        assert "compliance_monitoring" in result
        assert "overall_approved" in result
        assert result["overall_approved"] is True

class TestTrainingPipeline:
    """Test cases for Training Pipeline components."""
    
    @pytest.fixture
    def training_config(self):
        """Test training configuration."""
        return TrainingConfig(
            model_name="microsoft/DialoGPT-small",
            training_stage=TrainingStage.GOVERNANCE_INJECTION,
            batch_size=2,
            num_epochs=1,
            max_length=128
        )
    
    @pytest.fixture
    def mock_governance_core(self):
        """Mock governance core."""
        return AsyncMock()
    
    @pytest.fixture
    def mock_trust_engine(self):
        """Mock trust engine."""
        return AsyncMock()
    
    @pytest.fixture
    def dataset_generator(self, mock_governance_core, mock_trust_engine):
        """Create dataset generator for testing."""
        return GovernanceDatasetGenerator(mock_governance_core, mock_trust_engine)
    
    @pytest.mark.asyncio
    async def test_dataset_generation(self, dataset_generator):
        """Test governance dataset generation."""
        # Mock the example generation
        with patch.object(dataset_generator, '_generate_example') as mock_generate:
            mock_generate.return_value = {
                "input_text": "Test prompt",
                "target_text": "Test response",
                "governance_score": 0.9,
                "trust_score": 0.8,
                "compliance_status": "compliant"
            }
            
            dataset = await dataset_generator.generate_governance_dataset(
                num_examples=10,
                include_violations=True
            )
            
            assert len(dataset) == 10
            assert "input_text" in dataset[0]
            assert "target_text" in dataset[0]
            assert "governance_score" in dataset[0]
    
    def test_training_config_validation(self):
        """Test training configuration validation."""
        config = TrainingConfig(
            model_name="test-model",
            training_stage=TrainingStage.TRUST_CALIBRATION,
            batch_size=4,
            learning_rate=1e-4
        )
        
        assert config.model_name == "test-model"
        assert config.training_stage == TrainingStage.TRUST_CALIBRATION
        assert config.batch_size == 4
        assert config.learning_rate == 1e-4
    
    @pytest.mark.asyncio
    async def test_training_pipeline_initialization(self, training_config):
        """Test training pipeline initialization."""
        with patch('....src.extensions.native_llm.training.GovernanceCore'), \
             patch('....src.extensions.native_llm.training.TrustPropagationEngine'):
            
            pipeline = GovernanceTrainingPipeline(training_config)
            
            assert pipeline.config == training_config
            assert pipeline.model is None
            assert pipeline.tokenizer is None
            assert len(pipeline.training_metrics) == 0

class TestIntegrationScenarios:
    """Integration test scenarios for complete workflows."""
    
    @pytest.mark.asyncio
    async def test_end_to_end_generation_workflow(self):
        """Test complete end-to-end generation workflow."""
        # Setup components
        extension = NativeLLMExtension()
        
        # Mock all external dependencies
        with patch('....src.extensions.native_llm.native_llm_extension.GovernanceCore') as mock_gov, \
             patch('....src.extensions.native_llm.native_llm_extension.TrustPropagationEngine') as mock_trust:
            
            mock_gov.return_value.evaluate_request = AsyncMock(return_value={
                "compliant": True, "score": 0.9, "violations": []
            })
            mock_gov.return_value.evaluate_content = AsyncMock(return_value={
                "compliance_score": 0.85
            })
            mock_trust.return_value.calculate_content_trust = AsyncMock(return_value={
                "trust_score": 0.8
            })
            
            # Initialize extension
            await extension.initialize()
            
            # Generate text
            response = await extension.generate(
                prompt="Explain the benefits of renewable energy",
                context={"domain": "environment"}
            )
            
            # Verify complete workflow
            assert isinstance(response, NativeLLMResponse)
            assert response.governance_score > 0
            assert response.trust_score > 0
            assert response.compliance_status == "compliant"
    
    @pytest.mark.asyncio
    async def test_governance_violation_handling(self):
        """Test handling of governance violations."""
        extension = NativeLLMExtension()
        
        # Mock governance core to return violation
        with patch('....src.extensions.native_llm.native_llm_extension.GovernanceCore') as mock_gov, \
             patch('....src.extensions.native_llm.native_llm_extension.TrustPropagationEngine'):
            
            mock_gov.return_value.evaluate_request = AsyncMock(return_value={
                "compliant": False,
                "score": 0.1,
                "violations": ["harmful_content"],
                "recommendations": ["revise_request"]
            })
            
            await extension.initialize()
            
            response = await extension.generate(
                prompt="How to cause harm",
                context={}
            )
            
            # Verify violation handling
            assert response.compliance_status == "blocked"
            assert response.governance_score == 0.0
            assert "cannot generate" in response.text.lower()
    
    @pytest.mark.asyncio
    async def test_trust_calibration_workflow(self):
        """Test trust calibration and uncertainty handling."""
        service = GovernanceIntegrationService()
        
        # Mock components for uncertainty scenario
        service.trust_aware_generation = AsyncMock()
        service.compliance_monitor = AsyncMock()
        
        # High uncertainty, low trust scenario
        service.trust_aware_generation.evaluate_generation_trust.return_value = {
            "trust_score": 0.4,  # Low trust due to uncertainty
            "confidence_interval": [0.2, 0.6],
            "trust_factors": {"uncertainty": 0.8}
        }
        
        service.compliance_monitor.monitor_generation.return_value = {
            "compliant": True,
            "compliance_score": 0.9,
            "violations": []
        }
        
        result = await service.process_generation(
            prompt="What will happen to the economy next year?",
            generated_text="I cannot provide definitive predictions..."
        )
        
        # Verify trust calibration
        assert result["trust_evaluation"]["trust_score"] == 0.4
        assert result["overall_approved"] is False  # Low trust should block approval

# Performance and stress tests
class TestPerformanceAndStress:
    """Performance and stress test scenarios."""
    
    @pytest.mark.asyncio
    async def test_concurrent_generation_requests(self):
        """Test handling of concurrent generation requests."""
        extension = NativeLLMExtension()
        
        # Mock dependencies for fast execution
        with patch('....src.extensions.native_llm.native_llm_extension.GovernanceCore') as mock_gov, \
             patch('....src.extensions.native_llm.native_llm_extension.TrustPropagationEngine') as mock_trust:
            
            mock_gov.return_value.evaluate_request = AsyncMock(return_value={
                "compliant": True, "score": 0.9, "violations": []
            })
            mock_gov.return_value.evaluate_content = AsyncMock(return_value={
                "compliance_score": 0.85
            })
            mock_trust.return_value.calculate_content_trust = AsyncMock(return_value={
                "trust_score": 0.8
            })
            
            await extension.initialize()
            
            # Create multiple concurrent requests
            tasks = []
            for i in range(10):
                task = extension.generate(
                    prompt=f"Test prompt {i}",
                    context={"request_id": i}
                )
                tasks.append(task)
            
            # Execute all requests concurrently
            responses = await asyncio.gather(*tasks)
            
            # Verify all requests completed successfully
            assert len(responses) == 10
            for i, response in enumerate(responses):
                assert isinstance(response, NativeLLMResponse)
                assert response.compliance_status == "compliant"
    
    @pytest.mark.asyncio
    async def test_large_context_handling(self):
        """Test handling of large context inputs."""
        extension = NativeLLMExtension()
        
        with patch('....src.extensions.native_llm.native_llm_extension.GovernanceCore') as mock_gov, \
             patch('....src.extensions.native_llm.native_llm_extension.TrustPropagationEngine') as mock_trust:
            
            mock_gov.return_value.evaluate_request = AsyncMock(return_value={
                "compliant": True, "score": 0.9, "violations": []
            })
            mock_gov.return_value.evaluate_content = AsyncMock(return_value={
                "compliance_score": 0.85
            })
            mock_trust.return_value.calculate_content_trust = AsyncMock(return_value={
                "trust_score": 0.8
            })
            
            await extension.initialize()
            
            # Create large context
            large_context = {
                "document": "A" * 10000,  # Large document
                "metadata": {"key": "value"} * 1000,  # Large metadata
                "history": [{"message": f"Message {i}"} for i in range(1000)]  # Large history
            }
            
            response = await extension.generate(
                prompt="Summarize this large context",
                context=large_context
            )
            
            # Verify large context was handled
            assert isinstance(response, NativeLLMResponse)
            assert response.compliance_status in ["compliant", "review_required"]

# Backward compatibility tests
class TestBackwardCompatibility:
    """Test backward compatibility with existing systems."""
    
    @pytest.mark.asyncio
    async def test_existing_api_compatibility(self):
        """Test compatibility with existing API interfaces."""
        extension = NativeLLMExtension()
        
        # Test that extension can be used with existing API patterns
        with patch('....src.extensions.native_llm.native_llm_extension.GovernanceCore'), \
             patch('....src.extensions.native_llm.native_llm_extension.TrustPropagationEngine'):
            
            await extension.initialize()
            
            # Test standard API call pattern
            response = await extension.generate("Test prompt")
            assert isinstance(response, NativeLLMResponse)
            
            # Test with config override
            custom_config = NativeLLMConfig(temperature=0.5)
            response = await extension.generate("Test prompt", config=custom_config)
            assert isinstance(response, NativeLLMResponse)
            
            # Test model info retrieval
            info = await extension.get_model_info()
            assert isinstance(info, dict)
            assert "capabilities" in info
    
    def test_extension_framework_compliance(self):
        """Test compliance with Promethios extension framework."""
        extension = NativeLLMExtension()
        
        # Verify extension has required attributes
        assert hasattr(extension, 'extension_id')
        assert hasattr(extension, 'version')
        assert extension.extension_id == "native_llm"
        assert isinstance(extension.version, str)
        
        # Verify extension follows naming conventions
        assert extension.extension_id.islower()
        assert "_" in extension.extension_id or extension.extension_id.isalnum()

if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])

