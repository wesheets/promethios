"""
Recovery Behavior Adapter for Promethios.

This module implements versioned behaviors for recovery mechanism semantics,
supporting both pre-6.4 and 6.4.0 behaviors as documented in
constitutional amendment CGF-2025-02.

Pre-6.4: Checkpoint recovery excludes keys added after checkpoint creation
         Error recovery always transitions away from 'failed' state
6.4.0: Checkpoint recovery preserves full state context
       Error recovery maintains 'failed' state when unsuccessful
"""

from enum import Enum
from ...versioned_behavior.core import BehaviorVersion, register_behavior


class RecoveryBehavior:
    """
    Versioned behavior adapter for recovery mechanism semantics.
    
    This adapter implements different behaviors for state preservation
    during recovery operations and state transitions after error recovery.
    """
    
    @staticmethod
    @register_behavior(version=BehaviorVersion.from_string("pre_6.4"))
    def recover_from_checkpoint_pre_6_4(checkpoint_state, current_state):
        """
        Recover from a checkpoint using pre-6.4 behavior.
        
        In pre-6.4, checkpoint recovery excludes keys added after checkpoint creation.
        
        Args:
            checkpoint_state: The state stored in the checkpoint
            current_state: The current state before recovery
            
        Returns:
            The recovered state
        """
        # Pre-6.4 behavior: Only return the exact checkpointed state
        return checkpoint_state.copy()
    
    @staticmethod
    @register_behavior(version=BehaviorVersion.from_string("6.4.0"))
    def recover_from_checkpoint_6_4_0(checkpoint_state, current_state):
        """
        Recover from a checkpoint using 6.4.0 behavior.
        
        In 6.4.0, checkpoint recovery preserves full state context,
        including keys added after checkpoint creation.
        
        Args:
            checkpoint_state: The state stored in the checkpoint
            current_state: The current state before recovery
            
        Returns:
            The recovered state
        """
        # 6.4.0 behavior: Merge checkpoint state with current state
        merged_state = {**current_state, **checkpoint_state}
        return merged_state
    
    @classmethod
    def recover_from_checkpoint(cls, checkpoint_state, current_state, version=None):
        """
        Recover from a checkpoint.
        
        This method delegates to the appropriate versioned implementation
        based on the specified behavior version.
        
        Args:
            checkpoint_state: The state stored in the checkpoint
            current_state: The current state before recovery
            version: The behavior version to use (defaults to current context)
            
        Returns:
            The recovered state
        """
        from ...versioned_behavior.core import get_behavior_implementation
        
        # Get the appropriate implementation based on version
        implementation = get_behavior_implementation(
            cls.recover_from_checkpoint_pre_6_4,
            cls.recover_from_checkpoint_6_4_0,
            version
        )
        
        # Call the implementation
        return implementation(checkpoint_state, current_state)
    
    @staticmethod
    @register_behavior(version=BehaviorVersion.from_string("pre_6.4"))
    def get_post_recovery_state_pre_6_4(recovery_successful, previous_state):
        """
        Get the appropriate state after error recovery in pre-6.4 behavior.
        
        In pre-6.4, error recovery always transitions away from 'failed' state,
        regardless of whether the recovery was successful.
        
        Args:
            recovery_successful: Whether the recovery was successful
            previous_state: The state before recovery
            
        Returns:
            The appropriate state value after recovery
        """
        # Pre-6.4 behavior: Always transition to RECOVERED
        return "recovered"
    
    @staticmethod
    @register_behavior(version=BehaviorVersion.from_string("6.4.0"))
    def get_post_recovery_state_6_4_0(recovery_successful, previous_state):
        """
        Get the appropriate state after error recovery in 6.4.0 behavior.
        
        In 6.4.0, error recovery maintains 'failed' state when unsuccessful.
        
        Args:
            recovery_successful: Whether the recovery was successful
            previous_state: The state before recovery
            
        Returns:
            The appropriate state value after recovery
        """
        # 6.4.0 behavior: Only transition to RECOVERED if successful
        if recovery_successful:
            return "recovered"
        else:
            return previous_state
    
    @classmethod
    def get_post_recovery_state(cls, recovery_successful, previous_state, version=None):
        """
        Get the appropriate state after error recovery.
        
        This method delegates to the appropriate versioned implementation
        based on the specified behavior version.
        
        Args:
            recovery_successful: Whether the recovery was successful
            previous_state: The state before recovery
            version: The behavior version to use (defaults to current context)
            
        Returns:
            The appropriate state value after recovery
        """
        from ...versioned_behavior.core import get_behavior_implementation
        
        # Get the appropriate implementation based on version
        implementation = get_behavior_implementation(
            cls.get_post_recovery_state_pre_6_4,
            cls.get_post_recovery_state_6_4_0,
            version
        )
        
        # Call the implementation
        return implementation(recovery_successful, previous_state)
