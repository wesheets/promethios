"""
Versioned Behavior Adapters for Promethios.

This package contains adapters that implement different versions of behaviors
for various components of the Promethios system. These adapters allow the system
to maintain backward compatibility while evolving semantics.

Each adapter implements a specific behavior for a specific component, with
different implementations for different versions of the behavior.
"""

from .loop_state_behavior import LoopStateBehavior
from .recovery_behavior import RecoveryBehavior
from .monitoring_event_behavior import MonitoringEventBehavior

__all__ = [
    'LoopStateBehavior',
    'RecoveryBehavior',
    'MonitoringEventBehavior',
]
