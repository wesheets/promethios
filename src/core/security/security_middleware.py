"""
Security middleware for integrating input validation and rate limiting into API endpoints.

This module provides middleware components that can be applied to API endpoints
to enforce input validation and rate limiting consistently across the system.
"""

import logging
import time
import functools
from typing import Dict, Any, Callable, Optional, Union, List, Tuple

from src.core.security.input_validation import InputValidator, ValidationResult
from src.core.security.rate_limiting import (
    global_rate_limiter, RateLimitExceededError, 
    RateLimitScope, RateLimitAlgorithm
)

# Configure logging
logger = logging.getLogger(__name__)

class SecurityMiddleware:
    """
    Security middleware for API endpoints.
    
    This class provides methods to wrap API handlers with security
    features like input validation and rate limiting.
    """
    
    @staticmethod
    def validate_input(schema: Dict[str, Any]) -> Callable:
        """
        Decorator for validating input against a schema.
        
        Args:
            schema: Schema definition for validation
            
        Returns:
            Decorated function
            
        Example:
            @SecurityMiddleware.validate_input({
                'name': {'type': 'string', 'required': True},
                'age': {'type': 'number', 'min': 0, 'max': 120}
            })
            def handle_request(request):
                # Function implementation
        """
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Extract request data (assuming first arg is request)
                request = args[0] if args else None
                
                if request is None:
                    logger.error("No request object provided to validation middleware")
                    raise ValueError("No request object provided")
                
                # Get request data (assuming request has a data attribute or is dict-like)
                data = request.data if hasattr(request, 'data') else request
                
                # Validate each field according to schema
                result = ValidationResult()
                
                for field_name, field_schema in schema.items():
                    field_type = field_schema.get('type', 'string')
                    required = field_schema.get('required', False)
                    
                    # Check if field exists
                    if field_name not in data:
                        if required:
                            result.add_error(f"Required field '{field_name}' is missing")
                        continue
                    
                    value = data.get(field_name)
                    
                    # Validate based on type
                    if field_type == 'string':
                        min_length = field_schema.get('min_length')
                        max_length = field_schema.get('max_length')
                        pattern = field_schema.get('pattern')
                        
                        field_result = InputValidator.validate_string(
                            value, field_name, min_length, max_length, pattern
                        )
                        result.merge(field_result)
                        
                    elif field_type == 'number':
                        min_value = field_schema.get('min')
                        max_value = field_schema.get('max')
                        
                        field_result = InputValidator.validate_number(
                            value, field_name, min_value, max_value
                        )
                        result.merge(field_result)
                        
                    elif field_type == 'boolean':
                        field_result = InputValidator.validate_boolean(value, field_name)
                        result.merge(field_result)
                        
                    elif field_type == 'array':
                        min_length = field_schema.get('min_items')
                        max_length = field_schema.get('max_items')
                        
                        field_result = InputValidator.validate_list(
                            value, field_name, min_length, max_length
                        )
                        result.merge(field_result)
                        
                    elif field_type == 'object':
                        required_keys = field_schema.get('required_keys')
                        
                        field_result = InputValidator.validate_dict(
                            value, field_name, required_keys
                        )
                        result.merge(field_result)
                
                # If validation failed, raise an exception
                if not result.is_valid:
                    logger.warning(f"Input validation failed: {result.errors}")
                    raise ValueError(f"Input validation failed: {result.errors}")
                
                # Call the original function
                return func(*args, **kwargs)
                
            return wrapper
        return decorator
    
    @staticmethod
    def apply_rate_limit(limit_key: str, 
                        scope: RateLimitScope = RateLimitScope.GLOBAL,
                        instance_key_func: Callable = None) -> Callable:
        """
        Decorator for applying rate limiting to a function.
        
        Args:
            limit_key: Identifier for the rate limit
            scope: Scope of the rate limit
            instance_key_func: Function to extract instance key from args/kwargs
            
        Returns:
            Decorated function
            
        Example:
            @SecurityMiddleware.apply_rate_limit(
                'api.get_user', 
                RateLimitScope.IP,
                lambda request, *args, **kwargs: request.remote_addr
            )
            def handle_request(request):
                # Function implementation
        """
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Get instance key if needed
                instance_key = None
                if scope != RateLimitScope.GLOBAL:
                    if instance_key_func is None:
                        logger.error(f"Instance key function required for scope {scope}")
                        raise ValueError(f"Instance key function required for scope {scope}")
                    
                    instance_key = instance_key_func(*args, **kwargs)
                
                # Check rate limit
                try:
                    global_rate_limiter.check_limit(limit_key, instance_key)
                except RateLimitExceededError as e:
                    # Log the rate limit event
                    logger.warning(f"Rate limit exceeded: {e}")
                    
                    # Return a rate limit exceeded response
                    retry_after = e.retry_after
                    raise RateLimitExceededError(limit_key, retry_after)
                
                # Call the original function
                return func(*args, **kwargs)
                
            return wrapper
        return decorator
    
    @staticmethod
    def secure_endpoint(
        input_schema: Dict[str, Any] = None,
        rate_limit_key: str = None,
        rate_limit_scope: RateLimitScope = RateLimitScope.GLOBAL,
        instance_key_func: Callable = None
    ) -> Callable:
        """
        Combined decorator for securing an endpoint with validation and rate limiting.
        
        Args:
            input_schema: Schema for input validation
            rate_limit_key: Identifier for the rate limit
            rate_limit_scope: Scope of the rate limit
            instance_key_func: Function to extract instance key from args/kwargs
            
        Returns:
            Decorated function
            
        Example:
            @SecurityMiddleware.secure_endpoint(
                input_schema={
                    'name': {'type': 'string', 'required': True},
                },
                rate_limit_key='api.users',
                rate_limit_scope=RateLimitScope.IP,
                instance_key_func=lambda request, *args, **kwargs: request.remote_addr
            )
            def handle_request(request):
                # Function implementation
        """
        def decorator(func):
            # Apply decorators in reverse order (innermost first)
            decorated_func = func
            
            # Apply rate limiting if specified
            if rate_limit_key is not None:
                decorated_func = SecurityMiddleware.apply_rate_limit(
                    rate_limit_key, rate_limit_scope, instance_key_func
                )(decorated_func)
            
            # Apply input validation if specified
            if input_schema is not None:
                decorated_func = SecurityMiddleware.validate_input(
                    input_schema
                )(decorated_func)
            
            return decorated_func
        return decorator
