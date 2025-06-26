"""
Workflow Registry Module for Promethios.

This module provides comprehensive workflow management including:
- Workflow definition and registration
- Multi-agent workflow orchestration
- Workflow execution tracking
- Workflow governance integration
- Workflow optimization and analytics
"""

from .workflow_registry import WorkflowRegistry
from .workflow_orchestrator import WorkflowOrchestrator
from .workflow_execution_tracker import WorkflowExecutionTracker
from .workflow_optimizer import WorkflowOptimizer

__version__ = "1.0.0"
__author__ = "Promethios Team"

__all__ = [
    "WorkflowRegistry",
    "WorkflowOrchestrator",
    "WorkflowExecutionTracker",
    "WorkflowOptimizer"
]

