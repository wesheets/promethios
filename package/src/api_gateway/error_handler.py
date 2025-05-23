"""
API Gateway Integration - Error Handler

This module provides error handling functionality for API gateway integration.
"""

import json
import logging
import traceback
from typing import Dict, List, Optional, Any, Union

from src.access_tier.exceptions import AccessDeniedError, RateLimitExceededError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ErrorHandler:
    """
    Error handler for API gateway integration.
    
    This class provides functionality for:
    - Formatting error responses
    - Logging errors
    - Generating appropriate HTTP status codes
    """
    
    def __init__(self, detailed_errors: bool = False):
        """
        Initialize the error handler.
        
        Args:
            detailed_errors: Whether to include detailed error information in responses
        """
        self.detailed_errors = detailed_errors
        logger.info("Initialized error handler")
    
    def handle_error(self, error: Exception) -> Dict[str, Any]:
        """
        Handle an error and generate a response.
        
        Args:
            error: The exception that occurred
            
        Returns:
            Dict: Error response with status code and body
        """
        # Log the error
        logger.error(f"API error: {str(error)}")
        
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
        
        # Create the error response
        response = {
            "error": {
                "type": error_type,
                "message": message,
                "status_code": status_code
            }
        }
        
        # Add detailed information if configured
        if self.detailed_errors:
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
            
            # Add stack trace in development mode
            if self.detailed_errors:
                response["error"]["stack_trace"] = traceback.format_exc()
        
        return {
            "status_code": status_code,
            "body": response
        }
    
    def create_error_response(self, status_code: int, message: str, error_type: str = "error") -> Dict[str, Any]:
        """
        Create an error response.
        
        Args:
            status_code: HTTP status code
            message: Error message
            error_type: Type of error
            
        Returns:
            Dict: Error response with status code and body
        """
        response = {
            "error": {
                "type": error_type,
                "message": message,
                "status_code": status_code
            }
        }
        
        return {
            "status_code": status_code,
            "body": response
        }
    
    def log_error(self, error: Exception, user_id: Optional[str] = None, endpoint: Optional[str] = None) -> None:
        """
        Log an error with context.
        
        Args:
            error: The exception that occurred
            user_id: The ID of the user (optional)
            endpoint: The API endpoint (optional)
        """
        context = []
        if user_id:
            context.append(f"user_id={user_id}")
        if endpoint:
            context.append(f"endpoint={endpoint}")
        
        context_str = " ".join(context)
        if context_str:
            logger.error(f"API error [{context_str}]: {str(error)}")
        else:
            logger.error(f"API error: {str(error)}")
        
        # Log stack trace at debug level
        logger.debug(traceback.format_exc())
