"""
Service Registry Module for Promethios.

This module provides comprehensive service management including:
- External service integration and registration
- Service discovery and orchestration
- Service health monitoring and failover
- Service governance integration
- Service performance tracking and optimization
"""

from .service_registry import ServiceRegistry
from .service_orchestrator import ServiceOrchestrator
from .service_monitor import ServiceMonitor
from .service_optimizer import ServiceOptimizer

__version__ = "1.0.0"
__author__ = "Promethios Team"

__all__ = [
    "ServiceRegistry",
    "ServiceOrchestrator",
    "ServiceMonitor",
    "ServiceOptimizer"
]

