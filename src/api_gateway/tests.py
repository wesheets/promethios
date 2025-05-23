"""
API Gateway Integration - Tests

This module provides test utilities for the API Gateway Integration.
"""

import unittest
from unittest.mock import MagicMock, patch
import json
from datetime import datetime, timedelta

from src.access_tier.models import TierDefinition, TierAssignment, RateLimits
from src.access_tier.access_tier_manager import AccessTierManager
from src.api_gateway.connector import ApiGatewayConnector
from src.api_gateway.rate_limiter import RateLimiter
from src.api_gateway.permission_validator import PermissionValidator
from src.api_gateway.error_handler import ErrorHandler
from src.access_tier.exceptions import AccessDeniedError, RateLimitExceededError


class ApiGatewayConnectorTests(unittest.TestCase):
    """Test cases for the ApiGatewayConnector class."""
    
    def setUp(self):
        """Set up test environment."""
        # Create mock access tier manager
        self.access_tier_manager = MagicMock(spec=AccessTierManager)
        
        # Configure the mock
        self.access_tier_manager.check_access.return_value = True
        self.access_tier_manager.check_rate_limit.return_value = True
        self.access_tier_manager.get_tier.return_value = TierDefinition(
            id="developer_preview",
            name="Developer Preview",
            description="Limited access for early developers",
            permissions=["read:basic", "write:basic"],
            rate_limits=RateLimits(
                requests_per_minute=60,
                requests_per_day=10000
            )
        )
        
        # Create connector
        self.connector = ApiGatewayConnector(
            access_tier_manager=self.access_tier_manager,
            config={
                "token_validation_endpoint": None,
                "rate_limit_headers": True,
                "detailed_error_responses": True
            }
        )
    
    def test_validate_token_success(self):
        """Test successful token validation."""
        # Create a test token (user_id:tier_id:expiration_timestamp)
        future_timestamp = int((datetime.now() + timedelta(days=1)).timestamp())
        token = f"user123:developer_preview:{future_timestamp}"
        
        # Validate token
        user_info = self.connector.validate_token(token)
        
        # Verify user info
        self.assertEqual(user_info["user_id"], "user123")
        self.assertEqual(user_info["tier_id"], "developer_preview")
    
    def test_validate_token_expired(self):
        """Test expired token validation."""
        # Create an expired test token
        past_timestamp = int((datetime.now() - timedelta(days=1)).timestamp())
        token = f"user123:developer_preview:{past_timestamp}"
        
        # Validate token should raise AccessDeniedError
        with self.assertRaises(AccessDeniedError):
            self.connector.validate_token(token)
    
    def test_check_access_success(self):
        """Test successful access check."""
        # Configure mock
        self.access_tier_manager.check_access.return_value = True
        
        # Check access
        result = self.connector.check_access("user123", "/api/v1/resource", "GET")
        
        # Verify result
        self.assertTrue(result)
        
        # Verify mock was called correctly
        self.access_tier_manager.check_access.assert_called_once_with(
            "user123", "/api/v1/resource", "GET"
        )
    
    def test_check_access_denied(self):
        """Test access denied."""
        # Configure mock to deny access
        self.access_tier_manager.check_access.return_value = False
        
        # Check access should raise AccessDeniedError
        with self.assertRaises(AccessDeniedError):
            self.connector.check_access("user123", "/api/v1/resource", "GET")
    
    def test_check_rate_limit_success(self):
        """Test successful rate limit check."""
        # Configure mock
        self.access_tier_manager.check_rate_limit.return_value = True
        
        # Check rate limit
        result = self.connector.check_rate_limit("user123")
        
        # Verify result
        self.assertTrue(result)
        
        # Verify mock was called correctly
        self.access_tier_manager.check_rate_limit.assert_called_once_with("user123")
    
    def test_check_rate_limit_exceeded(self):
        """Test rate limit exceeded."""
        # Configure mock to exceed rate limit
        self.access_tier_manager.check_rate_limit.return_value = False
        
        # Check rate limit should raise RateLimitExceededError
        with self.assertRaises(RateLimitExceededError):
            self.connector.check_rate_limit("user123")
    
    def test_track_request(self):
        """Test tracking a request."""
        # Track request
        self.connector.track_request(
            user_id="user123",
            endpoint="/api/v1/resource",
            method="GET",
            status_code=200,
            response_time=50
        )
        
        # Verify mock was called correctly
        self.access_tier_manager.track_usage.assert_called_once_with(
            user_id="user123",
            endpoint="/api/v1/resource",
            method="GET",
            status_code=200,
            response_time=50,
            request_size=None,
            response_size=None
        )
    
    def test_format_error_response(self):
        """Test formatting an error response."""
        # Create an error
        error = AccessDeniedError("user123", "/api/v1/resource", "Insufficient permissions")
        
        # Format error response
        response = self.connector.format_error_response(error)
        
        # Verify response
        self.assertEqual(response["error"]["type"], "access_denied")
        self.assertEqual(response["error"]["status_code"], 403)
        self.assertIn("Access denied", response["error"]["message"])


class RateLimiterTests(unittest.TestCase):
    """Test cases for the RateLimiter class."""
    
    def setUp(self):
        """Set up test environment."""
        self.rate_limiter = RateLimiter()
    
    def test_check_limit_success(self):
        """Test successful rate limit check."""
        # Define tier limits
        tier_limits = {
            "requests_per_minute": 60,
            "requests_per_day": 10000
        }
        
        # Check limit
        result = self.rate_limiter.check_limit("user123", tier_limits)
        
        # Verify result
        self.assertTrue(result)
    
    def test_check_limit_exceeded(self):
        """Test rate limit exceeded."""
        # Define tier limits
        tier_limits = {
            "requests_per_minute": 5,
            "requests_per_day": 10000
        }
        
        # Track requests to exceed limit
        for _ in range(5):
            self.rate_limiter.track_request("user123")
        
        # Check limit should raise RateLimitExceededError
        with self.assertRaises(RateLimitExceededError):
            self.rate_limiter.check_limit("user123", tier_limits)
    
    def test_get_rate_limit_headers(self):
        """Test getting rate limit headers."""
        # Define tier limits
        tier_limits = {
            "requests_per_minute": 60,
            "requests_per_day": 10000
        }
        
        # Track a request
        self.rate_limiter.track_request("user123")
        
        # Get headers
        headers = self.rate_limiter.get_rate_limit_headers("user123", tier_limits)
        
        # Verify headers
        self.assertIn("X-RateLimit-Limit", headers)
        self.assertIn("X-RateLimit-Remaining", headers)
        self.assertIn("X-RateLimit-Reset", headers)
        self.assertEqual(headers["X-RateLimit-Limit"], "60")
        self.assertEqual(headers["X-RateLimit-Remaining"], "59")


class PermissionValidatorTests(unittest.TestCase):
    """Test cases for the PermissionValidator class."""
    
    def setUp(self):
        """Set up test environment."""
        self.validator = PermissionValidator()
    
    def test_validate_permission_success(self):
        """Test successful permission validation."""
        # Define permissions
        permissions = ["read:basic", "write:basic"]
        
        # Validate permission
        result = self.validator.validate_permission(permissions, "GET", "basic")
        
        # Verify result
        self.assertTrue(result)
    
    def test_validate_permission_denied(self):
        """Test permission denied."""
        # Define permissions
        permissions = ["read:basic"]
        
        # Validate permission should raise AccessDeniedError
        with self.assertRaises(AccessDeniedError):
            self.validator.validate_permission(permissions, "POST", "advanced")
    
    def test_wildcard_permission(self):
        """Test wildcard permission."""
        # Define permissions with wildcard
        permissions = ["read:*"]
        
        # Validate permission
        result = self.validator.validate_permission(permissions, "GET", "anything")
        
        # Verify result
        self.assertTrue(result)
    
    def test_get_accessible_endpoints(self):
        """Test getting accessible endpoints."""
        # Define permissions
        permissions = ["read:basic", "write:basic"]
        
        # Define available endpoints
        available_endpoints = [
            {"method": "GET", "path": "basic"},
            {"method": "POST", "path": "basic"},
            {"method": "GET", "path": "advanced"}
        ]
        
        # Get accessible endpoints
        accessible = self.validator.get_accessible_endpoints(permissions, available_endpoints)
        
        # Verify accessible endpoints
        self.assertEqual(len(accessible), 2)
        self.assertIn({"method": "GET", "path": "basic"}, accessible)
        self.assertIn({"method": "POST", "path": "basic"}, accessible)


class ErrorHandlerTests(unittest.TestCase):
    """Test cases for the ErrorHandler class."""
    
    def setUp(self):
        """Set up test environment."""
        self.error_handler = ErrorHandler(detailed_errors=True)
    
    def test_handle_access_denied_error(self):
        """Test handling an access denied error."""
        # Create an error
        error = AccessDeniedError("user123", "/api/v1/resource", "Insufficient permissions")
        
        # Handle error
        response = self.error_handler.handle_error(error)
        
        # Verify response
        self.assertEqual(response["status_code"], 403)
        self.assertEqual(response["body"]["error"]["type"], "access_denied")
        self.assertIn("Access denied", response["body"]["error"]["message"])
    
    def test_handle_rate_limit_error(self):
        """Test handling a rate limit error."""
        # Create an error
        error = RateLimitExceededError("user123", "60 requests per minute")
        
        # Handle error
        response = self.error_handler.handle_error(error)
        
        # Verify response
        self.assertEqual(response["status_code"], 429)
        self.assertEqual(response["body"]["error"]["type"], "rate_limit_exceeded")
        self.assertIn("Rate limit exceeded", response["body"]["error"]["message"])
    
    def test_create_error_response(self):
        """Test creating an error response."""
        # Create error response
        response = self.error_handler.create_error_response(400, "Bad request", "validation_error")
        
        # Verify response
        self.assertEqual(response["status_code"], 400)
        self.assertEqual(response["body"]["error"]["type"], "validation_error")
        self.assertEqual(response["body"]["error"]["message"], "Bad request")


if __name__ == "__main__":
    unittest.main()
