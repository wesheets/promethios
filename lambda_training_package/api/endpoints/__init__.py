"""
Governance AI API Endpoints Package
Specialized endpoints for different governance models
"""

from .ultimate_governance import ultimate_governance_router
from .constitutional import constitutional_governance_router
from .operational import operational_governance_router

__all__ = [
    "ultimate_governance_router",
    "constitutional_governance_router", 
    "operational_governance_router"
]

