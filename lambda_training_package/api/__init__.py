"""
Promethios Governance AI API Package
Unified API for governance AI models and capabilities
"""

from .governance_api import GovernanceAPIServer, create_governance_api_server
from .model_router import GovernanceModelRouter

__version__ = "1.0.0"
__author__ = "Promethios Team"
__description__ = "Governance AI API - Unified interface for AI-powered governance analysis"

# API Extension Registry
GOVERNANCE_API_EXTENSION = {
    "name": "governance_ai_api",
    "version": __version__,
    "description": __description__,
    "author": __author__,
    "type": "governance_api_extension",
    "components": {
        "api_server": GovernanceAPIServer,
        "model_router": GovernanceModelRouter,
        "factory_functions": {
            "create_server": create_governance_api_server
        }
    },
    "endpoints": [
        "/",
        "/health",
        "/models",
        "/governance/analyze",
        "/governance/evaluate", 
        "/governance/recommend",
        "/api/v1/ultimate/*",
        "/api/v1/constitutional/*",
        "/api/v1/operational/*"
    ],
    "dependencies": [
        "fastapi>=0.100.0",
        "uvicorn>=0.23.0",
        "pydantic>=2.0.0"
    ]
}

__all__ = [
    "GovernanceAPIServer",
    "GovernanceModelRouter",
    "create_governance_api_server",
    "GOVERNANCE_API_EXTENSION"
]

