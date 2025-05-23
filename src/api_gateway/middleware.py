"""
API Gateway Integration - Middleware

This module provides middleware components for integrating with API gateways,
enabling access control, rate limiting, and permission validation in web frameworks.
"""

import json
import logging
import time
from typing import Dict, List, Optional, Any, Union, Callable
from datetime import datetime, timedelta
from functools import wraps

from src.api_gateway.connector import ApiGatewayConnector
from src.access_tier.exceptions import AccessDeniedError, RateLimitExceededError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TierMiddleware:
    """
    Base middleware class for API gateway integration with access tier management.
    
    This middleware provides:
    - Token validation
    - Rate limiting
    - Permission validation
    - Usage tracking
    - Error handling
    
    It serves as a base class for framework-specific middleware implementations.
    """
    
    def __init__(self, connector: ApiGatewayConnector):
        """
        Initialize the middleware.
        
        Args:
            connector: The API Gateway connector instance
        """
        self.connector = connector
        logger.info("Initialized tier middleware for API gateway integration")
    
    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate an API token.
        
        Args:
            token: The API token to validate
            
        Returns:
            Dict: User information extracted from the token
            
        Raises:
            AccessDeniedError: If the token is invalid
        """
        return self.connector.validate_token(token)
    
    def check_access(self, user_id: str, endpoint: str, method: str) -> bool:
        """
        Check if a user has access to a specific endpoint.
        
        Args:
            user_id: The ID of the user
            endpoint: The API endpoint
            method: The HTTP method
            
        Returns:
            bool: True if access is allowed
            
        Raises:
            AccessDeniedError: If access is denied
        """
        return self.connector.check_access(user_id, endpoint, method)
    
    def check_rate_limit(self, user_id: str) -> bool:
        """
        Check if a user has exceeded their rate limit.
        
        Args:
            user_id: The ID of the user
            
        Returns:
            bool: True if the user is within their rate limit
            
        Raises:
            RateLimitExceededError: If the rate limit is exceeded
        """
        return self.connector.check_rate_limit(user_id)
    
    def track_request(self, user_id: str, endpoint: str, method: str, 
                     status_code: int, response_time: int,
                     request_size: Optional[int] = None,
                     response_size: Optional[int] = None) -> None:
        """
        Track an API request.
        
        Args:
            user_id: The ID of the user
            endpoint: The API endpoint
            method: The HTTP method
            status_code: The HTTP status code
            response_time: The response time in milliseconds
            request_size: The size of the request in bytes (optional)
            response_size: The size of the response in bytes (optional)
        """
        self.connector.track_request(
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time=response_time,
            request_size=request_size,
            response_size=response_size
        )
    
    def get_rate_limit_headers(self, user_id: str) -> Dict[str, str]:
        """
        Get rate limit headers for a user.
        
        Args:
            user_id: The ID of the user
            
        Returns:
            Dict: Rate limit headers
        """
        return self.connector.get_rate_limit_headers(user_id)
    
    def format_error_response(self, error: Exception) -> Dict[str, Any]:
        """
        Format an error response.
        
        Args:
            error: The exception that occurred
            
        Returns:
            Dict: Formatted error response
        """
        return self.connector.format_error_response(error)


class FlaskMiddleware(TierMiddleware):
    """
    Flask middleware for API gateway integration.
    
    This middleware provides:
    - Token validation
    - Rate limiting
    - Permission validation
    - Usage tracking
    - Error handling
    
    It can be used with Flask applications to enforce access control policies.
    """
    
    def __init__(self, connector: ApiGatewayConnector):
        """
        Initialize the Flask middleware.
        
        Args:
            connector: The API Gateway connector instance
        """
        super().__init__(connector)
        logger.info("Initialized Flask middleware for API gateway integration")
    
    def authenticate(self, f):
        """
        Decorator for authenticating requests.
        
        Args:
            f: The Flask route function to decorate
            
        Returns:
            Decorated function
        """
        @wraps(f)
        def decorated(*args, **kwargs):
            from flask import request, jsonify
            
            # Extract token from Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                response = self.format_error_response(
                    AccessDeniedError("anonymous", request.path, "Missing Authorization header")
                )
                return jsonify(response), response['error']['status_code']
            
            # Extract token (Bearer token format)
            parts = auth_header.split()
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                response = self.format_error_response(
                    AccessDeniedError("anonymous", request.path, "Invalid Authorization header format")
                )
                return jsonify(response), response['error']['status_code']
            
            token = parts[1]
            
            try:
                # Validate token
                user_info = self.validate_token(token)
                
                # Store user info in request context
                request.user_info = user_info
                
                # Check rate limit
                self.check_rate_limit(user_info['user_id'])
                
                # Check access permission
                self.check_access(user_info['user_id'], request.path, request.method)
                
                # Track request start time
                request.start_time = time.time()
                
                # Call the original function
                response = f(*args, **kwargs)
                
                # Track request
                end_time = time.time()
                response_time = int((end_time - request.start_time) * 1000)  # Convert to milliseconds
                
                # Get status code from response
                if isinstance(response, tuple) and len(response) > 1:
                    status_code = response[1]
                else:
                    status_code = 200
                
                # Track the request
                self.track_request(
                    user_id=user_info['user_id'],
                    endpoint=request.path,
                    method=request.method,
                    status_code=status_code,
                    response_time=response_time,
                    request_size=request.content_length,
                    response_size=len(response[0].get_data()) if isinstance(response, tuple) else None
                )
                
                # Add rate limit headers if it's a tuple response
                if isinstance(response, tuple) and len(response) >= 2:
                    headers = self.get_rate_limit_headers(user_info['user_id'])
                    
                    # If there's a headers dict in the response, update it
                    if len(response) >= 3 and isinstance(response[2], dict):
                        response[2].update(headers)
                        return response
                    
                    # Otherwise, add headers to the response
                    return response[0], response[1], headers
                
                return response
            
            except (AccessDeniedError, RateLimitExceededError) as e:
                response = self.format_error_response(e)
                return jsonify(response), response['error']['status_code']
            
            except Exception as e:
                logger.error(f"Authentication error: {str(e)}")
                response = self.format_error_response(e)
                return jsonify(response), response['error']['status_code']
        
        return decorated


class FastAPIMiddleware(TierMiddleware):
    """
    FastAPI middleware for API gateway integration.
    
    This middleware provides:
    - Token validation
    - Rate limiting
    - Permission validation
    - Usage tracking
    - Error handling
    
    It can be used with FastAPI applications to enforce access control policies.
    """
    
    def __init__(self, connector: ApiGatewayConnector):
        """
        Initialize the FastAPI middleware.
        
        Args:
            connector: The API Gateway connector instance
        """
        super().__init__(connector)
        logger.info("Initialized FastAPI middleware for API gateway integration")
    
    async def authenticate(self, request):
        """
        Authenticate a request.
        
        Args:
            request: The FastAPI request
            
        Returns:
            Dict: User information if authentication is successful
            
        Raises:
            HTTPException: If authentication fails
        """
        from fastapi import HTTPException
        
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            error = AccessDeniedError("anonymous", request.url.path, "Missing Authorization header")
            response = self.format_error_response(error)
            raise HTTPException(
                status_code=response['error']['status_code'],
                detail=response['error']
            )
        
        # Extract token (Bearer token format)
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            error = AccessDeniedError("anonymous", request.url.path, "Invalid Authorization header format")
            response = self.format_error_response(error)
            raise HTTPException(
                status_code=response['error']['status_code'],
                detail=response['error']
            )
        
        token = parts[1]
        
        try:
            # Validate token
            user_info = self.validate_token(token)
            
            # Check rate limit
            self.check_rate_limit(user_info['user_id'])
            
            # Check access permission
            self.check_access(user_info['user_id'], request.url.path, request.method)
            
            return user_info
        
        except (AccessDeniedError, RateLimitExceededError) as e:
            response = self.format_error_response(e)
            raise HTTPException(
                status_code=response['error']['status_code'],
                detail=response['error']
            )
        
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            response = self.format_error_response(e)
            raise HTTPException(
                status_code=response['error']['status_code'],
                detail=response['error']
            )
    
    def setup_middleware(self, app):
        """
        Set up the middleware for a FastAPI application.
        
        Args:
            app: The FastAPI application
        """
        from fastapi import Request, Response
        from starlette.middleware.base import BaseHTTPMiddleware
        import time
        
        class APIGatewayMiddleware(BaseHTTPMiddleware):
            async def dispatch(self, request: Request, call_next):
                # Store request start time
                start_time = time.time()
                
                # Try to authenticate the request
                try:
                    user_info = await self.authenticate(request)
                    request.state.user_info = user_info
                    
                    # Process the request
                    response = await call_next(request)
                    
                    # Calculate response time
                    end_time = time.time()
                    response_time = int((end_time - start_time) * 1000)  # Convert to milliseconds
                    
                    # Track the request
                    self.track_request(
                        user_id=user_info['user_id'],
                        request=request,
                        status_code=response.status_code,
                        response_time=response_time
                    )
                    
                    # Add rate limit headers
                    headers = self.get_rate_limit_headers(user_info['user_id'])
                    for key, value in headers.items():
                        response.headers[key] = value
                    
                    return response
                
                except Exception as e:
                    # If authentication failed, the exception has already been raised
                    # This is just a fallback
                    from fastapi import HTTPException
                    
                    if not isinstance(e, HTTPException):
                        logger.error(f"Middleware error: {str(e)}")
                        response = self.format_error_response(e)
                        raise HTTPException(
                            status_code=response['error']['status_code'],
                            detail=response['error']
                        )
                    raise
        
        # Add the middleware to the application
        app.add_middleware(APIGatewayMiddleware)


def create_flask_middleware(connector: ApiGatewayConnector) -> FlaskMiddleware:
    """
    Create a Flask middleware instance.
    
    Args:
        connector: The API Gateway connector instance
        
    Returns:
        FlaskMiddleware: The middleware instance
    """
    return FlaskMiddleware(connector)


def create_fastapi_middleware(connector: ApiGatewayConnector) -> FastAPIMiddleware:
    """
    Create a FastAPI middleware instance.
    
    Args:
        connector: The API Gateway connector instance
        
    Returns:
        FastAPIMiddleware: The middleware instance
    """
    return FastAPIMiddleware(connector)
