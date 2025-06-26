"""
Model Registry Module for Promethios.

This module provides comprehensive model management including:
- Model registration and discovery
- Model version control
- Model performance tracking
- Model governance integration
- Model deployment management
"""

from .model_registry import ModelRegistry
from .model_version_manager import ModelVersionManager
from .model_performance_tracker import ModelPerformanceTracker
from .model_deployment_manager import ModelDeploymentManager

__version__ = "1.0.0"
__author__ = "Promethios Team"

__all__ = [
    "ModelRegistry",
    "ModelVersionManager",
    "ModelPerformanceTracker",
    "ModelDeploymentManager"
]

