"""
Loop Management System for Promethios.

This package contains components for managing execution loops,
including controllers, state persistence, and recovery mechanisms.
"""

# Make loop management components available at the package level
from .loop_controller import (
    LoopController, LoopState, TerminationReason, 
    StatePersistenceManager, StateTransaction,
    MaxIterationsCondition, TimeoutCondition, ResourceLimitCondition
)
from .loop_recovery import (
    RecoverableLoopController, LoopRecoveryManager, 
    CheckpointManager, RecoveryStrategy, RecoveryAction
)

__all__ = [
    'LoopController', 'LoopState', 'TerminationReason',
    'StatePersistenceManager', 'StateTransaction',
    'MaxIterationsCondition', 'TimeoutCondition', 'ResourceLimitCondition',
    'RecoverableLoopController', 'LoopRecoveryManager',
    'CheckpointManager', 'RecoveryStrategy', 'RecoveryAction'
]
