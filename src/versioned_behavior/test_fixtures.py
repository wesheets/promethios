"""
Test fixtures for versioned behavior testing.

This module provides context managers and fixtures for testing with
different behavior versions, allowing tests to explicitly bind to
specific behavior versions.
"""

import contextlib
from src.versioned_behavior.core import BehaviorVersion, set_current_behavior_version


@contextlib.contextmanager
def with_behavior_version(version):
    """
    Context manager for testing with a specific behavior version.
    
    This context manager sets the current behavior version for the duration
    of the context, then restores the previous version when exiting.
    
    Args:
        version: The behavior version to use (string or BehaviorVersion)
        
    Yields:
        None
    """
    # Convert string to BehaviorVersion if needed
    if isinstance(version, str):
        version = BehaviorVersion.from_string(version)
    
    # Save the current version
    previous_version = BehaviorVersion.get_current()
    
    try:
        # Set the specified version
        set_current_behavior_version(version)
        yield
    finally:
        # Restore the previous version
        set_current_behavior_version(previous_version)


def with_loop_state_behavior(version):
    """
    Decorator for testing loop state behavior with a specific version.
    
    This decorator wraps a test method with the with_behavior_version
    context manager, setting the specified version for the duration of the test.
    
    Args:
        version: The behavior version to use (string or BehaviorVersion)
        
    Returns:
        Decorated test method
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            with with_behavior_version(version):
                return func(*args, **kwargs)
        return wrapper
    return decorator


def with_recovery_behavior(version):
    """
    Decorator for testing recovery behavior with a specific version.
    
    This decorator wraps a test method with the with_behavior_version
    context manager, setting the specified version for the duration of the test.
    
    Args:
        version: The behavior version to use (string or BehaviorVersion)
        
    Returns:
        Decorated test method
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            with with_behavior_version(version):
                return func(*args, **kwargs)
        return wrapper
    return decorator


def with_monitoring_event_behavior(version):
    """
    Decorator for testing monitoring event behavior with a specific version.
    
    This decorator wraps a test method with the with_behavior_version
    context manager, setting the specified version for the duration of the test.
    
    Args:
        version: The behavior version to use (string or BehaviorVersion)
        
    Returns:
        Decorated test method
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            with with_behavior_version(version):
                return func(*args, **kwargs)
        return wrapper
    return decorator
