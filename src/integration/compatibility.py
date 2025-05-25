"""
Compatibility layer for the integration modules.

This module provides backward compatibility for code that imports from the old
integration module structure. New code should import directly from the canonical
locations instead.
"""

import warnings
from enum import Enum

# Issue deprecation warning
warnings.warn(
    "Importing from old class names is deprecated. Please update your imports to use the canonical classes.",
    DeprecationWarning,
    stacklevel=2
)

# Re-export enums and constants for backward compatibility
class BenchmarkType(Enum):
    """Benchmark types for integration testing."""
    PERFORMANCE = "performance"
    SECURITY = "security"
    COMPLIANCE = "compliance"
    GOVERNANCE = "governance"
    MEMORY = "memory"

# Compatibility constants
INTEGRATION_MODES = ["strict", "lenient", "audit"]
DEFAULT_INTEGRATION_MODE = "strict"

# Compatibility functions
def get_integration_client(integration_type, config=None):
    """Compatibility function to get integration client.
    
    Args:
        integration_type: Type of integration client to get
        config: Optional configuration dictionary
        
    Returns:
        Integration client instance
    """
    from src.integration.theagentcompany_integration import TheAgentCompanyIntegration
    
    if integration_type.lower() == "theagentcompany":
        return TheAgentCompanyIntegration(config or {})
    else:
        raise ValueError(f"Unknown integration type: {integration_type}")

def run_benchmark(benchmark_type, test_cases, config=None):
    """Compatibility function to run benchmarks.
    
    Args:
        benchmark_type: Type of benchmark to run
        test_cases: List of test cases to run
        config: Optional configuration dictionary
        
    Returns:
        Benchmark results
    """
    from src.integration.benchmark_scenarios import run_benchmark_suite
    
    if isinstance(benchmark_type, BenchmarkType):
        benchmark_type = benchmark_type.value
        
    return run_benchmark_suite(benchmark_type, test_cases, config or {})
