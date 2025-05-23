"""
API Gateway Integration - Core Connector

This module provides the core connector for integrating with API gateways,
enabling access control, rate limiting, and permission validation.
"""

import json
import logging
import requests
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta

from src.access_tier.models import TierDefinition
from src.access_tier.access_tier_manager import AccessTierManager
from src.access_tier.exceptions import AccessDeniedError, RateLimitExceededError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ApiGatewayConnector:
    """
    Connector for integrating with API gateways.
    
    This class provides functionality for:
    - Token validation
    - Rate limiting
    - Permission validation
    - Error handling
    
    It acts as a bridge between the Access Tier Management System and the API Gateway.
    """
    
    def __init__(self, access_tier_manager: AccessTierManager, config: Dict[str, Any] = None):
        """
        Initialize the API Gateway connector.
        
        Args:
            access_tier_manager: The Access Tier Manager instance
            config: Configuration dictionary
        """
        self.access_tier_manager = access_tier_manager
        self.config = config or {}
        
        # Extract configuration values
        self.token_validation_endpoint = self.config.get('token_validation_endpoint')
        self.rate_limit_headers = self.config.get('rate_limit_headers', True)
        self.detailed_error_responses = self.config.get('detailed_error_responses', False)
        
        logger.info("Initialized API Gateway connector")
    
    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate an API token and extract user information.
        
        Args:
            token: The API token to validate
            
        Returns:
            Dict: User information extracted from the token
            
        Raises:
            AccessDeniedError: If the token is invalid
        """
        if not token:
            raise AccessDeniedError("anonymous", "token_validation", "Missing token")
        
        # If a validation endpoint is configured, use it
        if self.token_validation_endpoint:
            try:
                response = requests.post(
                    self.token_validation_endpoint,
                    json={"token": token},
                    headers={"Content-Type": "application/json"},
                    timeout=5
                )
                
                if response.status_code != 200:
                    raise AccessDeniedError("anonymous", "token_validation", f"Token validation failed: {response.status_code}")
                
                user_info = response.json()
                logger.info(f"Token validated for user {user_info.get('user_id')}")
                return user_info
            except requests.RequestException as e:
                logger.error(f"Token validation request failed: {str(e)}")
                raise AccessDeniedError("anonymous", "token_validation", f"Token validation service unavailable: {str(e)}")
        
        # If no validation endpoint is configured, perform basic validation
        # This is a simplified example - in a real implementation, we would use JWT or similar
        try:
            # Simple format: user_id:tier_id:timestamp
            parts = token.split(':')
            if len(parts) != 3:
                raise AccessDeniedError("anonymous", "token_validation", "Invalid token format")
            
            user_id, tier_id, timestamp_str = parts
            
            # Validate timestamp (token expiration)
            try:
                timestamp = int(timestamp_str)
                if timestamp < int(datetime.now().timestamp()):
                    raise AccessDeniedError(user_id, "token_validation", "Token expired")
            except ValueError:
                raise AccessDeniedError("anonymous", "token_validation", "Invalid token timestamp")
            
            # Verify the tier exists
            if not self.access_tier_manager.get_tier(tier_id):
                raise AccessDeniedError(user_id, "token_validation", f"Invalid tier: {tier_id}")
            
            logger.info(f"Token validated for user {user_id}")
            return {
                "user_id": user_id,
                "tier_id": tier_id,
                "expires_at": datetime.fromtimestamp(timestamp).isoformat()
            }
        except Exception as e:
            if not isinstance(e, AccessDeniedError):
                logger.error(f"Token validation failed: {str(e)}")
                raise AccessDeniedError("anonymous", "token_validation", f"Invalid token: {str(e)}")
            raise
    
    def check_access(self, user_id: str, endpoint: str, method: str) -> bool:
        """
        Check if a user has access to a specific endpoint.
        
        Args:
            user_id: The ID of the user
            endpoint: The API endpoint
            method: The HTTP method
            
        Returns:
            bool: True if access is allowed, False otherwise
            
        Raises:
            AccessDeniedError: If access is denied
        """
        # Use the Access Tier Manager to check access
        has_access = self.access_tier_manager.check_access(user_id, endpoint, method)
        
        if not has_access:
            # Get the user's tier for more detailed error message
            tier = self.access_tier_manager.get_user_tier(user_id)
            tier_name = tier.name if tier else "Unknown"
            
            raise AccessDeniedError(
                user_id, 
                f"{method}:{endpoint}", 
                f"Insufficient permissions for tier: {tier_name}"
            )
        
        return True
    
    def check_rate_limit(self, user_id: str) -> bool:
        """
        Check if a user has exceeded their rate limit.
        
        Args:
            user_id: The ID of the user
            
        Returns:
            bool: True if the user is within their rate limit, False otherwise
            
        Raises:
            RateLimitExceededError: If the rate limit is exceeded
        """
        # Use the Access Tier Manager to check rate limits
        within_limit = self.access_tier_manager.check_rate_limit(user_id)
        
        if not within_limit:
            # Get the user's tier for more detailed error message
            tier = self.access_tier_manager.get_user_tier(user_id)
            
            if tier:
                limit_type = f"{tier.rate_limits.requests_per_minute} requests per minute"
                if tier.rate_limits.requests_per_day:
                    limit_type += f", {tier.rate_limits.requests_per_day} requests per day"
            else:
                limit_type = "unknown limit"
            
            raise RateLimitExceededError(user_id, limit_type)
        
        return True
    
    def track_request(self, user_id: str, endpoint: str, method: str, 
                     status_code: int, response_time: int,
                     request_size: Optional[int] = None,
                     response_size: Optional[int] = None) -> None:
        """
        Track an API request for usage monitoring and rate limiting.
        
        Args:
            user_id: The ID of the user
            endpoint: The API endpoint
            method: The HTTP method
            status_code: The HTTP status code
            response_time: The response time in milliseconds
            request_size: The size of the request in bytes (optional)
            response_size: The size of the response in bytes (optional)
        """
        # Use the Access Tier Manager to track usage
        self.access_tier_manager.track_usage(
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
        if not self.rate_limit_headers:
            return {}
        
        # Get the user's tier
        tier = self.access_tier_manager.get_user_tier(user_id)
        if not tier:
            return {}
        
        # Get the user's recent usage
        now = datetime.now()
        
        # Count requests in the last minute
        requests_last_minute = sum(
            1 for record in self.access_tier_manager.usage_records
            if record.user_id == user_id and (now - record.timestamp).total_seconds() < 60
        )
        
        # Calculate remaining requests
        remaining_minute = max(0, tier.rate_limits.requests_per_minute - requests_last_minute)
        
        headers = {
            "X-RateLimit-Limit": str(tier.rate_limits.requests_per_minute),
            "X-RateLimit-Remaining": str(remaining_minute),
            "X-RateLimit-Reset": str(int((now.replace(second=0, microsecond=0) + timedelta(minutes=1)).timestamp()))
        }
        
        # Add daily limit if configured
        if tier.rate_limits.requests_per_day:
            # Count requests in the last day
            requests_last_day = sum(
                1 for record in self.access_tier_manager.usage_records
                if record.user_id == user_id and (now - record.timestamp).total_seconds() < 86400
            )
            
            # Calculate remaining requests
            remaining_day = max(0, tier.rate_limits.requests_per_day - requests_last_day)
            
            headers["X-RateLimit-Daily-Limit"] = str(tier.rate_limits.requests_per_day)
            headers["X-RateLimit-Daily-Remaining"] = str(remaining_day)
        
        return headers
    
    def format_error_response(self, error: Exception) -> Dict[str, Any]:
        """
        Format an error response.
        
        Args:
            error: The exception that occurred
            
        Returns:
            Dict: Formatted error response
        """
        if isinstance(error, AccessDeniedError):
            status_code = 403
            error_type = "access_denied"
            message = f"Access denied: {error.reason}"
        elif isinstance(error, RateLimitExceededError):
            status_code = 429
            error_type = "rate_limit_exceeded"
            message = f"Rate limit exceeded: {error.limit_type}"
        else:
            status_code = 500
            error_type = "internal_error"
            message = "An internal error occurred"
        
        response = {
            "error": {
                "type": error_type,
                "message": message,
                "status_code": status_code
            }
        }
        
        # Add detailed information if configured
        if self.detailed_error_responses:
            response["error"]["details"] = str(error)
            
            if hasattr(error, "__dict__"):
                # Add all attributes of the error that are serializable
                details = {}
                for key, value in error.__dict__.items():
                    if key.startswith("_"):
                        continue
                    
                    try:
                        # Check if the value is JSON serializable
                        json.dumps({key: value})
                        details[key] = value
                    except (TypeError, OverflowError):
                        # Skip non-serializable values
                        pass
                
                if details:
                    response["error"]["error_data"] = details
        
        return response


# Alias for compatibility with test suite
APIGatewayConnector = ApiGatewayConnector
