"""
Test file for the Request Processor module.

This module contains unit tests for the RequestProcessor class.
"""

import unittest
import json
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from src.test_harness.request_processor import RequestProcessor

class TestRequestProcessor(unittest.TestCase):
    """Test cases for the RequestProcessor class."""
    
    def setUp(self):
        """Set up test environment before each test."""
        self.base_url = "http://localhost:8000"
        self.auth_config = {
            "endpoint": "/auth/token",
            "method": "POST",
            "payload": {
                "client_id": "test_client",
                "client_secret": "test_secret"
            }
        }
        self.processor = RequestProcessor(
            base_url=self.base_url,
            auth_config=self.auth_config
        )
    
    @patch('requests.Session.request')
    def test_authenticate(self, mock_request):
        """Test authentication process."""
        # Mock the authentication response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "token": "test_token",
            "expires_in": 3600
        }
        mock_request.return_value = mock_response
        
        # Call the authenticate method
        self.processor._authenticate()
        
        # Verify the request was made correctly
        mock_request.assert_called_once_with(
            method="POST",
            url="http://localhost:8000/auth/token",
            json=self.auth_config["payload"],
            headers={'Content-Type': 'application/json'}
        )
        
        # Verify the token was stored
        self.assertEqual(self.processor.auth_token, "test_token")
        
        # Verify the expiry was set
        self.assertIsNotNone(self.processor.token_expiry)
    
    @patch('requests.Session.request')
    def test_authenticate_failure(self, mock_request):
        """Test authentication failure handling."""
        # Mock a failed authentication response
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.raise_for_status.side_effect = Exception("Authentication failed")
        mock_request.return_value = mock_response
        
        # Call the authenticate method and verify it raises an exception
        with self.assertRaises(ValueError):
            self.processor._authenticate()
        
        # Verify the token was not stored
        self.assertIsNone(self.processor.auth_token)
    
    def test_authenticate_request(self):
        """Test adding authentication to a request."""
        # Set a token directly
        self.processor.auth_token = "test_token"
        
        # Create a request
        request = {
            "url": "http://localhost:8000/api/test",
            "method": "GET",
            "headers": {
                "Content-Type": "application/json"
            }
        }
        
        # Authenticate the request
        authenticated_request = self.processor.authenticate_request(request)
        
        # Verify the authentication header was added
        self.assertIn("Authorization", authenticated_request["headers"])
        self.assertEqual(
            authenticated_request["headers"]["Authorization"],
            "Bearer test_token"
        )
        
        # Verify the original request was not modified
        self.assertNotIn("Authorization", request["headers"])
    
    def test_process_request(self):
        """Test processing a request."""
        # Set a token directly
        self.processor.auth_token = "test_token"
        
        # Process a request
        request = self.processor.process_request(
            endpoint="/api/test",
            method="GET",
            payload={"key": "value"},
            headers={"X-Custom-Header": "test"}
        )
        
        # Verify the request was constructed correctly
        self.assertEqual(request["url"], "http://localhost:8000/api/test")
        self.assertEqual(request["method"], "GET")
        self.assertEqual(request["payload"], {"key": "value"})
        self.assertEqual(request["headers"]["X-Custom-Header"], "test")
        self.assertEqual(request["headers"]["Content-Type"], "application/json")
        self.assertEqual(request["headers"]["Authorization"], "Bearer test_token")
    
    def test_process_request_no_auth(self):
        """Test processing a request without authentication."""
        # Process a request without authentication
        request = self.processor.process_request(
            endpoint="/api/public",
            method="GET",
            authenticate=False
        )
        
        # Verify no authentication header was added
        self.assertNotIn("Authorization", request["headers"])
    
    @patch('requests.Session.request')
    def test_execute_request(self, mock_request):
        """Test executing a request."""
        # Mock the response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = {"result": "success"}
        mock_request.return_value = mock_response
        
        # Create a request
        request = {
            "url": "http://localhost:8000/api/test",
            "method": "GET",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer test_token"
            }
        }
        
        # Execute the request
        result = self.processor.execute_request(request)
        
        # Verify the request was made correctly
        mock_request.assert_called_once_with(
            method="GET",
            url="http://localhost:8000/api/test",
            json=None,
            headers=request["headers"],
            timeout=30
        )
        
        # Verify the result contains the expected fields
        self.assertEqual(result["status_code"], 200)
        self.assertEqual(result["body"], {"result": "success"})
        self.assertIn("duration", result)
        self.assertIn("timestamp", result)
    
    @patch('requests.Session.request')
    def test_execute_request_with_payload(self, mock_request):
        """Test executing a request with a payload."""
        # Mock the response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = {"result": "success"}
        mock_request.return_value = mock_response
        
        # Create a request with payload
        request = {
            "url": "http://localhost:8000/api/test",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "payload": {
                "key": "value"
            }
        }
        
        # Execute the request
        result = self.processor.execute_request(request)
        
        # Verify the request was made correctly with the payload
        mock_request.assert_called_once_with(
            method="POST",
            url="http://localhost:8000/api/test",
            json={"key": "value"},
            headers=request["headers"],
            timeout=30
        )
        
        # Verify the result
        self.assertEqual(result["status_code"], 200)
    
    @patch('requests.Session.request')
    def test_execute_request_error(self, mock_request):
        """Test handling request execution errors."""
        # Mock a request error
        mock_request.side_effect = Exception("Connection error")
        
        # Create a request
        request = {
            "url": "http://localhost:8000/api/test",
            "method": "GET",
            "headers": {}
        }
        
        # Execute the request
        result = self.processor.execute_request(request)
        
        # Verify the error was captured
        self.assertIn("error", result)
        self.assertEqual(result["error"], "Connection error")
        self.assertIn("duration", result)
        self.assertIn("timestamp", result)
    
    @patch('requests.Session.request')
    def test_execute_request_retry(self, mock_request):
        """Test request retry functionality."""
        # Mock a request error followed by success
        mock_request.side_effect = [
            Exception("Connection error"),
            MagicMock(
                status_code=200,
                headers={"Content-Type": "application/json"},
                json=lambda: {"result": "success"}
            )
        ]
        
        # Create a request
        request = {
            "url": "http://localhost:8000/api/test",
            "method": "GET",
            "headers": {}
        }
        
        # Execute the request with retry
        result = self.processor.execute_request(
            request=request,
            retry_attempts=1,
            retry_delay=0.1
        )
        
        # Verify the request was retried
        self.assertEqual(mock_request.call_count, 2)
        
        # Verify the final result was successful
        self.assertEqual(result["status_code"], 200)
        self.assertEqual(result["body"], {"result": "success"})
    
    @patch.object(RequestProcessor, 'execute_request')
    def test_execute_step(self, mock_execute_request):
        """Test executing a test step."""
        # Mock the execute_request method
        mock_execute_request.return_value = {
            "status_code": 200,
            "body": {"result": "success"},
            "duration": 0.1,
            "timestamp": datetime.now().isoformat()
        }
        
        # Create a test step
        step = {
            "id": "STEP-0001",
            "description": "Test step",
            "endpoint": "/api/test",
            "method": "GET",
            "expected_status": 200
        }
        
        # Execute the step
        result = self.processor.execute_step(step)
        
        # Verify the result contains the expected fields
        self.assertEqual(result["step_id"], "STEP-0001")
        self.assertIn("request", result)
        self.assertIn("response", result)
        self.assertIn("timestamp", result)
        
        # Verify the request was processed correctly
        mock_execute_request.assert_called_once()
        request_arg = mock_execute_request.call_args[1]["request"]
        self.assertEqual(request_arg["url"], "http://localhost:8000/api/test")
        self.assertEqual(request_arg["method"], "GET")
    
    def test_process_templates(self):
        """Test template variable processing."""
        # Create a context with variables
        context = {
            "user_id": "123",
            "token": "abc"
        }
        
        # Test string template processing
        template_str = "User ${user_id} with token ${token}"
        processed_str = self.processor._process_templates(template_str, context)
        self.assertEqual(processed_str, "User 123 with token abc")
        
        # Test dictionary template processing
        template_dict = {
            "user": "${user_id}",
            "auth": {
                "token": "${token}"
            }
        }
        processed_dict = self.processor._process_templates(template_dict, context)
        self.assertEqual(processed_dict["user"], "123")
        self.assertEqual(processed_dict["auth"]["token"], "abc")
        
        # Test list template processing
        template_list = ["${user_id}", "${token}"]
        processed_list = self.processor._process_templates(template_list, context)
        self.assertEqual(processed_list[0], "123")
        self.assertEqual(processed_list[1], "abc")


if __name__ == "__main__":
    unittest.main()
