"""
Compatibility layer for the TheAgentCompany integration module.

This module provides backward compatibility for code that imports from the old class names.
"""

import warnings
from src.integration.theagentcompany_integration import TheAgentCompanyIntegration

# Emit a deprecation warning
warnings.warn(
    "Importing from old class names is deprecated. Please update your imports to use the canonical classes.",
    DeprecationWarning,
    stacklevel=2
)

# Define compatibility enums and classes
class BenchmarkType:
    """Compatibility enum for backward compatibility."""
    REASONING = "reasoning"
    MEMORY = "memory"
    PLANNING = "planning"
    GOVERNANCE = "governance"
    COMPREHENSIVE = "comprehensive"
