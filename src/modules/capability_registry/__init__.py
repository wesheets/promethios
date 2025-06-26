"""
Capability Registry Module for Promethios.

This module provides comprehensive capability management including:
- Capability definition and registration
- Capability discovery and matching
- Capability composition and orchestration
- Capability governance integration
- Capability performance tracking
"""

from .capability_registry import CapabilityRegistry
from .capability_matcher import CapabilityMatcher
from .capability_composer import CapabilityComposer
from .capability_tracker import CapabilityTracker

__version__ = "1.0.0"
__author__ = "Promethios Team"

__all__ = [
    "CapabilityRegistry",
    "CapabilityMatcher",
    "CapabilityComposer",
    "CapabilityTracker"
]

