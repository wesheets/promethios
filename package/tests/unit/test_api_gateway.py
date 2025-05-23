import unittest
import json
import os
import sys
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.api_gateway.connector import ApiGatewayConnector
from src.api_gateway.middleware import AuthMiddleware, RateLimitMiddleware
from src.api_gateway.permission_validator import PermissionValidator
from src.api_gateway.error_handler import ErrorHandler


class TestApiGatewayConnector(unittest.TestCase):
    """Test cases for the ApiGatewayConnector class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
            "host": "localhost",
            "port": 8000,
            "base_path": "/api/v1",
            "cors_origins": ["http://localhost:3000"],
            "rate_limit": {
                "enabled": True,
                "default_limit": 100,
                "window_seconds": 60
            }
        }
        
        # Create mock dependencies
        self.mock_auth_middleware = MagicMock(spec=AuthMiddleware)
        self.mock_rate_limit_middleware = MagicMock(spec=RateLimitMiddleware)
        self.mock_permission_validator = MagicMock(spec=PermissionValidator)
        self.mock_error_handler = MagicMock(spec=ErrorHandler)
        
        # Initialize the ApiGatewayConnector with the test configuration
        self.connector = ApiGatewayConnector(
            config=self.config,
            auth_middleware=self.mock_auth_middleware,
            rate_limit_middleware=self.mock_rate_limit_middleware,
            permission_validator=self.mock_permission_validator,
            error_handler=self.mock_error_handler
        )
    
    def test_initialization(self):
        """Test that the ApiGatewayConnector initializes correctly."""
        self.assertEqual(self.connector.host, "localhost")
        self.assertEqual(self.connector.port, 8000)
        self.assertEqual(self.connector.base_path, "/api/v1")
        self.assertEqual(self.connector.cors_origins, ["http://localhost:3000"])
        self.assertTrue(self.connector.rate_limit_enabled)
        self.assertEqual(self.connector.rate_limit_default, 100)
        self.assertEqual(self.connector.rate_limit_window, 60)
        
        # Check that the dependencies were set correctly
        self.assertEqual(self.connector.auth_middleware, self.mock_auth_middleware)
        self.assertEqual(self.connector.rate_limit_middleware, self.mock_rate_limit_middleware)
        self.assertEqual(self.connector.permission_validator, self.mock_permission_validator)
        self.assertEqual(self.connector.error_handler, self.mock_error_handler)
    
    @patch('src.api_gateway.connector.requests.request')
    def test_forward_request(self, mock_request):
        """Test forwarding a request to the backend service."""
        # Set up the mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message": "Success"}
        mock_request.return_value = mock_response
        
        # Test request parameters
        method = "GET"
        endpoint = "/users"
        headers = {"Authorization": "Bearer test_token"}
        params = {"page": 1, "limit": 10}
        data = None
        
        # Mock the authentication check
        self.mock_auth_middleware.authenticate.return_value = {"user_id": "test_user", "tier": "standard"}
        
        # Mock the rate limit check
        self.mock_rate_limit_middleware.check_rate_limit.return_value = True
        
        # Mock the permission check
        self.mock_permission_validator.validate_permission.return_value = True
        
        # Forward the request
        response = self.connector.forward_request(method, endpoint, headers, params, data)
        
        # Check that the authentication middleware was called
        self.mock_auth_middleware.authenticate.assert_called_once_with(headers)
        
        # Check that the rate limit middleware was called
        self.mock_rate_limit_middleware.check_rate_limit.assert_called_once_with("test_user", endpoint)
        
        # Check that the permission validator was called
        self.mock_permission_validator.validate_permission.assert_called_once_with("test_user", "standard", endpoint, method)
        
        # Check that the request was forwarded correctly
        mock_request.assert_called_once_with(
            method=method,
            url=f"http://localhost:8000/api/v1{endpoint}",
            headers=headers,
            params=params,
            json=data,
            timeout=30
        )
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Success"})
    
    @patch('src.api_gateway.connector.requests.request')
    def test_forward_request_auth_failure(self, mock_request):
        """Test forwarding a request with authentication failure."""
        # Mock the authentication check to fail
        self.mock_auth_middleware.authenticate.side_effect = Exception("Authentication failed")
        
        # Mock the error handler
        self.mock_error_handler.handle_error.return_value = {
            "status_code": 401,
            "body": {"error": "Authentication failed"}
        }
        
        # Test request parameters
        method = "GET"
        endpoint = "/users"
        headers = {"Authorization": "Bearer invalid_token"}
        params = {}
        data = None
        
        # Forward the request
        response = self.connector.forward_request(method, endpoint, headers, params, data)
        
        # Check that the authentication middleware was called
        self.mock_auth_middleware.authenticate.assert_called_once_with(headers)
        
        # Check that the error handler was called
        self.mock_error_handler.handle_error.assert_called_once()
        
        # Check that the request was not forwarded
        mock_request.assert_not_called()
        
        # Check the response
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"error": "Authentication failed"})
    
    @patch('src.api_gateway.connector.requests.request')
    def test_forward_request_rate_limit_exceeded(self, mock_request):
        """Test forwarding a request with rate limit exceeded."""
        # Mock the authentication check
        self.mock_auth_middleware.authenticate.return_value = {"user_id": "test_user", "tier": "standard"}
        
        # Mock the rate limit check to fail
        self.mock_rate_limit_middleware.check_rate_limit.return_value = False
        
        # Mock the error handler
        self.mock_error_handler.handle_rate_limit_exceeded.return_value = {
            "status_code": 429,
            "body": {"error": "Rate limit exceeded"}
        }
        
        # Test request parameters
        method = "GET"
        endpoint = "/users"
        headers = {"Authorization": "Bearer test_token"}
        params = {}
        data = None
        
        # Forward the request
        response = self.connector.forward_request(method, endpoint, headers, params, data)
        
        # Check that the authentication middleware was called
        self.mock_auth_middleware.authenticate.assert_called_once_with(headers)
        
        # Check that the rate limit middleware was called
        self.mock_rate_limit_middleware.check_rate_limit.assert_called_once_with("test_user", endpoint)
        
        # Check that the error handler was called
        self.mock_error_handler.handle_rate_limit_exceeded.assert_called_once()
        
        # Check that the request was not forwarded
        mock_request.assert_not_called()
        
        # Check the response
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.json(), {"error": "Rate limit exceeded"})
    
    @patch('src.api_gateway.connector.requests.request')
    def test_forward_request_permission_denied(self, mock_request):
        """Test forwarding a request with permission denied."""
        # Mock the authentication check
        self.mock_auth_middleware.authenticate.return_value = {"user_id": "test_user", "tier": "developer_preview"}
        
        # Mock the rate limit check
        self.mock_rate_limit_middleware.check_rate_limit.return_value = True
        
        # Mock the permission check to fail
        self.mock_permission_validator.validate_permission.return_value = False
        
        # Mock the error handler
        self.mock_error_handler.handle_permission_denied.return_value = {
            "status_code": 403,
            "body": {"error": "Permission denied"}
        }
        
        # Test request parameters
        method = "POST"
        endpoint = "/advanced/feature"
        headers = {"Authorization": "Bearer test_token"}
        params = {}
        data = {"test": "data"}
        
        # Forward the request
        response = self.connector.forward_request(method, endpoint, headers, params, data)
        
        # Check that the authentication middleware was called
        self.mock_auth_middleware.authenticate.assert_called_once_with(headers)
        
        # Check that the rate limit middleware was called
        self.mock_rate_limit_middleware.check_rate_limit.assert_called_once_with("test_user", endpoint)
        
        # Check that the permission validator was called
        self.mock_permission_validator.validate_permission.assert_called_once_with(
            "test_user", "developer_preview", endpoint, method
        )
        
        # Check that the error handler was called
        self.mock_error_handler.handle_permission_denied.assert_called_once()
        
        # Check that the request was not forwarded
        mock_request.assert_not_called()
        
        # Check the response
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json(), {"error": "Permission denied"})
    
    @patch('src.api_gateway.connector.requests.request')
    def test_forward_request_backend_error(self, mock_request):
        """Test forwarding a request with backend error."""
        # Set up the mock response to simulate a backend error
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.json.return_value = {"error": "Internal server error"}
        mock_request.return_value = mock_response
        
        # Mock the authentication check
        self.mock_auth_middleware.authenticate.return_value = {"user_id": "test_user", "tier": "standard"}
        
        # Mock the rate limit check
        self.mock_rate_limit_middleware.check_rate_limit.return_value = True
        
        # Mock the permission check
        self.mock_permission_validator.validate_permission.return_value = True
        
        # Test request parameters
        method = "GET"
        endpoint = "/users"
        headers = {"Authorization": "Bearer test_token"}
        params = {}
        data = None
        
        # Forward the request
        response = self.connector.forward_request(method, endpoint, headers, params, data)
        
        # Check that the request was forwarded
        mock_request.assert_called_once()
        
        # Check the response
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"error": "Internal server error"})


class TestAuthMiddleware(unittest.TestCase):
    """Test cases for the AuthMiddleware class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.mock_token_validator = MagicMock()
        self.mock_access_tier_manager = MagicMock()
        
        # Initialize the AuthMiddleware
        self.middleware = AuthMiddleware(
            token_validator=self.mock_token_validator,
            access_tier_manager=self.mock_access_tier_manager
        )
    
    def test_authenticate_valid_token(self):
        """Test authentication with a valid token."""
        # Mock headers with a valid token
        headers = {"Authorization": "Bearer valid_token"}
        
        # Mock the token validator to return a valid user ID
        self.mock_token_validator.validate_token.return_value = {"user_id": "test_user"}
        
        # Mock the access tier manager to return a tier
        self.mock_access_tier_manager.get_user_tier_id.return_value = "standard"
        
        # Authenticate
        result = self.middleware.authenticate(headers)
        
        # Check that the token validator was called
        self.mock_token_validator.validate_token.assert_called_once_with("valid_token")
        
        # Check that the access tier manager was called
        self.mock_access_tier_manager.get_user_tier_id.assert_called_once_with("test_user")
        
        # Check the result
        self.assertEqual(result["user_id"], "test_user")
        self.assertEqual(result["tier"], "standard")
    
    def test_authenticate_missing_token(self):
        """Test authentication with a missing token."""
        # Mock headers without a token
        headers = {}
        
        # Authenticate
        with self.assertRaises(Exception) as context:
            self.middleware.authenticate(headers)
        
        # Check the exception message
        self.assertIn("Missing Authorization header", str(context.exception))
        
        # Check that the token validator was not called
        self.mock_token_validator.validate_token.assert_not_called()
    
    def test_authenticate_invalid_token_format(self):
        """Test authentication with an invalid token format."""
        # Mock headers with an invalid token format
        headers = {"Authorization": "InvalidFormat"}
        
        # Authenticate
        with self.assertRaises(Exception) as context:
            self.middleware.authenticate(headers)
        
        # Check the exception message
        self.assertIn("Invalid Authorization header format", str(context.exception))
        
        # Check that the token validator was not called
        self.mock_token_validator.validate_token.assert_not_called()
    
    def test_authenticate_invalid_token(self):
        """Test authentication with an invalid token."""
        # Mock headers with an invalid token
        headers = {"Authorization": "Bearer invalid_token"}
        
        # Mock the token validator to raise an exception
        self.mock_token_validator.validate_token.side_effect = Exception("Invalid token")
        
        # Authenticate
        with self.assertRaises(Exception) as context:
            self.middleware.authenticate(headers)
        
        # Check the exception message
        self.assertEqual("Invalid token", str(context.exception))
        
        # Check that the token validator was called
        self.mock_token_validator.validate_token.assert_called_once_with("invalid_token")


if __name__ == '__main__':
    unittest.main()
