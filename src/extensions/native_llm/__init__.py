"""
Native LLM Extension Module for Promethios

This extension module provides governance-native Large Language Model capabilities
that integrate directly with the Promethios governance framework. Unlike external
LLM providers, this native implementation has governance, trust, and multi-agent
coordination baked directly into the model architecture.

Extension Point Compliance:
- Follows Promethios Extension Point Framework
- Backward compatible with existing LLM integrations
- Full governance integration and compliance
- Comprehensive test coverage

Key Features:
- Governance-native model architecture
- Trust-aware response generation
- Multi-agent coordination capabilities
- Real-time compliance monitoring
- Emotional intelligence integration
- Collective intelligence optimization

This module represents Phase 2 of the Promethios LLM strategy - moving from
external LLM orchestration to native governance-integrated models.
"""

from .native_llm_extension import (
    NativeLLMExtension,
    native_llm_extension,
    NativeLLMConfig,
    NativeLLMResponse,
    GovernanceNativeModel
)

from .governance_integration import (
    GovernanceIntegrationService,
    governance_integration_service,
    TrustAwareGeneration,
    ComplianceMonitor
)

from .training import (
    GovernanceTrainingPipeline,
    governance_training_pipeline,
    TrainingConfig,
    TrainingMetrics
)

__version__ = "1.0.0"
__extension_id__ = "native_llm"
__extension_type__ = "llm_provider"
__governance_compliant__ = True

__all__ = [
    "NativeLLMExtension",
    "native_llm_extension", 
    "NativeLLMConfig",
    "NativeLLMResponse",
    "GovernanceNativeModel",
    "GovernanceIntegrationService",
    "governance_integration_service",
    "TrustAwareGeneration",
    "ComplianceMonitor",
    "GovernanceTrainingPipeline",
    "governance_training_pipeline",
    "TrainingConfig",
    "TrainingMetrics"
]

