"""
Template Registry Module for Promethios.

This module provides comprehensive template management including:
- Template definition and registration
- Template instantiation and customization
- Template versioning and inheritance
- Template governance integration
- Template performance tracking and optimization
"""

from .template_registry import TemplateRegistry
from .template_instantiator import TemplateInstantiator
from .template_versioner import TemplateVersioner
from .template_optimizer import TemplateOptimizer

__version__ = "1.0.0"
__author__ = "Promethios Team"

__all__ = [
    "TemplateRegistry",
    "TemplateInstantiator",
    "TemplateVersioner",
    "TemplateOptimizer"
]

