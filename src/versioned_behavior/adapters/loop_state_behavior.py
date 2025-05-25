"""
Loop State Behavior Adapter for Promethios.

This module implements versioned behaviors for loop state semantics,
supporting both pre-6.4 and 6.4.0 behaviors as documented in
constitutional amendment CGF-2025-01.

Pre-6.4: All termination conditions result in 'completed' state
6.4.0: Resource limits and timeouts result in 'aborted' state
"""

from enum import Enum
from ...versioned_behavior.core import BehaviorVersion, register_behavior


class LoopState(Enum):
    """Loop state enumeration."""
    INITIALIZED = "initialized"
    RUNNING = "running"
    COMPLETED = "completed"
    ABORTED = "aborted"
    FAILED = "failed"
    RECOVERED = "recovered"


class LoopStateBehavior:
    """
    Versioned behavior adapter for loop state semantics.
    
    This adapter implements different behaviors for determining the
    appropriate loop state based on termination conditions.
    """
    
    @staticmethod
    @register_behavior(version=BehaviorVersion.from_string("pre_6.4"))
    def get_termination_state_pre_6_4(termination_reason):
        """
        Get the appropriate loop state for a termination condition in pre-6.4 behavior.
        
        In pre-6.4, all normal termination conditions (including resource limits and timeouts)
        result in a 'completed' state.
        
        Args:
            termination_reason: The reason for termination
            
        Returns:
            The appropriate loop state value
        """
        if termination_reason in ["error", "exception"]:
            return LoopState.FAILED.value
        else:
            # All other termination reasons result in 'completed'
            return LoopState.COMPLETED.value
    
    @staticmethod
    @register_behavior(version=BehaviorVersion.from_string("6.4.0"))
    def get_termination_state_6_4_0(termination_reason):
        """
        Get the appropriate loop state for a termination condition in 6.4.0 behavior.
        
        In 6.4.0, resource limits and timeouts result in 'aborted' state,
        while normal completion results in 'completed' state.
        
        Args:
            termination_reason: The reason for termination
            
        Returns:
            The appropriate loop state value
        """
        if termination_reason in ["error", "exception"]:
            return LoopState.FAILED.value
        elif termination_reason in ["resource_limit_exceeded", "timeout"]:
            return LoopState.ABORTED.value
        else:
            return LoopState.COMPLETED.value
    
    @classmethod
    def get_termination_state(cls, termination_reason, version=None):
        """
        Get the appropriate loop state for a termination condition.
        
        This method delegates to the appropriate versioned implementation
        based on the specified behavior version.
        
        Args:
            termination_reason: The reason for termination
            version: The behavior version to use (defaults to current context)
            
        Returns:
            The appropriate loop state value
        """
        from ...versioned_behavior.core import get_behavior_implementation
        
        # Get the appropriate implementation based on version
        implementation = get_behavior_implementation(
            cls.get_termination_state_pre_6_4,
            cls.get_termination_state_6_4_0,
            version
        )
        
        # Call the implementation
        return implementation(termination_reason)
