"""
Ultimate Governance LLM Extension Module
AI-powered governance analysis and decision support system
"""

from .model_loader import UltimateGovernanceLLMLoader, create_ultimate_governance_llm, EXTENSION_INFO
from .api_integration import UltimateGovernanceAPI, create_governance_api, API_EXTENSION_INFO

__version__ = "1.0.0"
__author__ = "Promethios Team"
__description__ = "Ultimate Governance LLM - Multi-domain governance reasoning engine"

# Extension registry
ULTIMATE_GOVERNANCE_EXTENSION = {
    "name": "ultimate_governance_llm",
    "version": __version__,
    "description": __description__,
    "author": __author__,
    "type": "governance_ai_extension",
    "components": {
        "model_loader": UltimateGovernanceLLMLoader,
        "api_integration": UltimateGovernanceAPI,
        "factory_functions": {
            "create_model": create_ultimate_governance_llm,
            "create_api": create_governance_api
        }
    },
    "capabilities": [
        "constitutional_governance",
        "operational_management", 
        "crisis_response",
        "ethical_reasoning",
        "stakeholder_coordination",
        "compliance_analysis"
    ],
    "interfaces": [
        "python_api",
        "rest_api",
        "cli_interface"
    ],
    "dependencies": [
        "transformers>=4.30.0",
        "torch>=2.0.0",
        "peft>=0.4.0",
        "fastapi>=0.100.0",
        "pydantic>=2.0.0"
    ]
}

# Convenience imports
__all__ = [
    "UltimateGovernanceLLMLoader",
    "UltimateGovernanceAPI", 
    "create_ultimate_governance_llm",
    "create_governance_api",
    "ULTIMATE_GOVERNANCE_EXTENSION"
]

