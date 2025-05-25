"""
Loop Management package for Phase 6.3.1 remediation.

This package provides enhanced loop control, transactional state persistence,
and robust recovery mechanisms for the Promethios platform.
"""

from loop_controller import (
    LoopController, LoopState, TerminationReason, 
    StatePersistenceManager, StateTransaction,
    MaxIterationsCondition, TimeoutCondition, ResourceLimitCondition
)

from loop_recovery import (
    RecoverableLoopController, LoopRecoveryManager, 
    CheckpointManager, RecoveryStrategy, RecoveryAction
)

__all__ = [
    'LoopController',
    'LoopState',
    'TerminationReason',
    'StatePersistenceManager',
    'StateTransaction',
    'MaxIterationsCondition',
    'TimeoutCondition',
    'ResourceLimitCondition',
    'RecoverableLoopController',
    'LoopRecoveryManager',
    'CheckpointManager',
    'RecoveryStrategy',
    'RecoveryAction'
]
