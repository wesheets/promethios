import unittest
import json
import os
import sys
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.developer_portal.portal import DeveloperPortal
from src.developer_portal.auth import PortalAuthManager
from src.developer_portal.documentation import DocumentationManager
from src.developer_portal.api_explorer import ApiExplorer
from src.developer_portal.code_samples import CodeSampleRepository
from src.developer_portal.onboarding import OnboardingWorkflow


class TestDeveloperPortal(unittest.TestCase):
    """Test cases for the DeveloperPortal class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
            "host": "localhost",
            "port": 3000,
            "api_explorer": {
                "enabled": True,
                "sample_requests": True
            },
            "code_samples": {
                "enabled": True,
                "languages": ["python", "javascript", "java", "go"]
            },
            "onboarding": {
                "enabled": True,
                "guided_tour": True
            }
        }
        
        # Create mock dependencies
        self.mock_auth_manager = MagicMock(spec=PortalAuthManager)
        self.mock_documentation_manager = MagicMock(spec=DocumentationManager)
        self.mock_api_explorer = MagicMock(spec=ApiExplorer)
        self.mock_code_sample_repo = MagicMock(spec=CodeSampleRepository)
        self.mock_onboarding_workflow = MagicMock(spec=OnboardingWorkflow)
        
        # Initialize the DeveloperPortal
        self.portal = DeveloperPortal(
            config=self.config,
            auth_manager=self.mock_auth_manager,
            documentation_manager=self.mock_documentation_manager,
            api_explorer=self.mock_api_explorer,
            code_sample_repo=self.mock_code_sample_repo,
            onboarding_workflow=self.mock_onboarding_workflow
        )
    
    def test_initialization(self):
        """Test that the DeveloperPortal initializes correctly."""
        self.assertEqual(self.portal.host, "localhost")
        self.assertEqual(self.portal.port, 3000)
        self.assertTrue(self.portal.api_explorer_enabled)
        self.assertTrue(self.portal.code_samples_enabled)
        self.assertTrue(self.portal.onboarding_enabled)
        self.assertTrue(self.portal.guided_tour_enabled)
        
        # Check that the dependencies were set correctly
        self.assertEqual(self.portal.auth_manager, self.mock_auth_manager)
        self.assertEqual(self.portal.documentation_manager, self.mock_documentation_manager)
        self.assertEqual(self.portal.api_explorer, self.mock_api_explorer)
        self.assertEqual(self.portal.code_sample_repo, self.mock_code_sample_repo)
        self.assertEqual(self.portal.onboarding_workflow, self.mock_onboarding_workflow)
    
    def test_get_portal_status(self):
        """Test getting the portal status."""
        # Mock the dependencies to return status information
        self.mock_auth_manager.get_status.return_value = {"active_users": 100, "status": "healthy"}
        self.mock_documentation_manager.get_status.return_value = {"doc_count": 50, "status": "healthy"}
        self.mock_api_explorer.get_status.return_value = {"endpoints": 25, "status": "healthy"}
        self.mock_code_sample_repo.get_status.return_value = {"sample_count": 75, "status": "healthy"}
        self.mock_onboarding_workflow.get_status.return_value = {"active_sessions": 10, "status": "healthy"}
        
        # Get the portal status
        status = self.portal.get_portal_status()
        
        # Check that the dependencies were called
        self.mock_auth_manager.get_status.assert_called_once()
        self.mock_documentation_manager.get_status.assert_called_once()
        self.mock_api_explorer.get_status.assert_called_once()
        self.mock_code_sample_repo.get_status.assert_called_once()
        self.mock_onboarding_workflow.get_status.assert_called_once()
        
        # Check the status
        self.assertEqual(status["host"], "localhost")
        self.assertEqual(status["port"], 3000)
        self.assertEqual(status["auth"]["active_users"], 100)
        self.assertEqual(status["documentation"]["doc_count"], 50)
        self.assertEqual(status["api_explorer"]["endpoints"], 25)
        self.assertEqual(status["code_samples"]["sample_count"], 75)
        self.assertEqual(status["onboarding"]["active_sessions"], 10)
        self.assertEqual(status["overall_status"], "healthy")
    
    def test_get_user_dashboard(self):
        """Test getting a user's dashboard."""
        user_id = "test_user_1"
        
        # Mock the auth manager to return user information
        self.mock_auth_manager.get_user_info.return_value = {
            "id": user_id,
            "name": "Test User",
            "email": "test@example.com",
            "tier": "standard"
        }
        
        # Mock the documentation manager to return recent docs
        self.mock_documentation_manager.get_recent_docs.return_value = [
            {"id": "doc1", "title": "Getting Started", "last_viewed": "2025-05-20T10:30:00Z"},
            {"id": "doc2", "title": "API Reference", "last_viewed": "2025-05-21T14:45:00Z"}
        ]
        
        # Mock the api explorer to return recent endpoints
        self.mock_api_explorer.get_recent_endpoints.return_value = [
            {"path": "/users", "method": "GET", "last_used": "2025-05-22T09:15:00Z"},
            {"path": "/resources", "method": "POST", "last_used": "2025-05-22T11:20:00Z"}
        ]
        
        # Get the user dashboard
        dashboard = self.portal.get_user_dashboard(user_id)
        
        # Check that the dependencies were called
        self.mock_auth_manager.get_user_info.assert_called_once_with(user_id)
        self.mock_documentation_manager.get_recent_docs.assert_called_once_with(user_id)
        self.mock_api_explorer.get_recent_endpoints.assert_called_once_with(user_id)
        
        # Check the dashboard
        self.assertEqual(dashboard["user"]["id"], user_id)
        self.assertEqual(dashboard["user"]["name"], "Test User")
        self.assertEqual(dashboard["user"]["tier"], "standard")
        self.assertEqual(len(dashboard["recent_docs"]), 2)
        self.assertEqual(dashboard["recent_docs"][0]["title"], "Getting Started")
        self.assertEqual(len(dashboard["recent_endpoints"]), 2)
        self.assertEqual(dashboard["recent_endpoints"][0]["path"], "/users")
    
    def test_start_onboarding(self):
        """Test starting the onboarding process for a user."""
        user_id = "test_user_2"
        
        # Mock the onboarding workflow to return session information
        self.mock_onboarding_workflow.start_onboarding.return_value = {
            "session_id": "onboarding_123",
            "steps": [
                {"id": "welcome", "title": "Welcome", "completed": False},
                {"id": "api_keys", "title": "API Keys", "completed": False},
                {"id": "first_request", "title": "Your First Request", "completed": False}
            ],
            "current_step": "welcome"
        }
        
        # Start onboarding
        session = self.portal.start_onboarding(user_id)
        
        # Check that the onboarding workflow was called
        self.mock_onboarding_workflow.start_onboarding.assert_called_once_with(user_id)
        
        # Check the session
        self.assertEqual(session["session_id"], "onboarding_123")
        self.assertEqual(len(session["steps"]), 3)
        self.assertEqual(session["current_step"], "welcome")
    
    def test_get_api_documentation(self):
        """Test getting API documentation."""
        # Mock the documentation manager to return API documentation
        self.mock_documentation_manager.get_api_documentation.return_value = {
            "version": "1.0",
            "base_url": "https://api.example.com/v1",
            "endpoints": [
                {
                    "path": "/users",
                    "methods": ["GET", "POST"],
                    "description": "User management endpoints"
                },
                {
                    "path": "/resources",
                    "methods": ["GET", "POST", "PUT", "DELETE"],
                    "description": "Resource management endpoints"
                }
            ]
        }
        
        # Get API documentation
        docs = self.portal.get_api_documentation()
        
        # Check that the documentation manager was called
        self.mock_documentation_manager.get_api_documentation.assert_called_once()
        
        # Check the documentation
        self.assertEqual(docs["version"], "1.0")
        self.assertEqual(docs["base_url"], "https://api.example.com/v1")
        self.assertEqual(len(docs["endpoints"]), 2)
        self.assertEqual(docs["endpoints"][0]["path"], "/users")
        self.assertEqual(docs["endpoints"][1]["path"], "/resources")
    
    def test_get_code_samples(self):
        """Test getting code samples for an endpoint."""
        endpoint = "/users"
        method = "GET"
        
        # Mock the code sample repo to return code samples
        self.mock_code_sample_repo.get_samples.return_value = {
            "python": "import requests\n\nresponse = requests.get('https://api.example.com/v1/users')",
            "javascript": "fetch('https://api.example.com/v1/users')\n  .then(response => response.json())\n  .then(data => console.log(data))",
            "java": "// Java code sample",
            "go": "// Go code sample"
        }
        
        # Get code samples
        samples = self.portal.get_code_samples(endpoint, method)
        
        # Check that the code sample repo was called
        self.mock_code_sample_repo.get_samples.assert_called_once_with(endpoint, method)
        
        # Check the samples
        self.assertEqual(len(samples), 4)
        self.assertIn("python", samples)
        self.assertIn("javascript", samples)
        self.assertIn("java", samples)
        self.assertIn("go", samples)
        self.assertTrue(samples["python"].startswith("import requests"))
        self.assertTrue(samples["javascript"].startswith("fetch("))


class TestApiExplorer(unittest.TestCase):
    """Test cases for the ApiExplorer class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
            "enabled": True,
            "sample_requests": True,
            "api_base_url": "https://api.example.com/v1"
        }
        
        # Create mock dependencies
        self.mock_documentation_manager = MagicMock()
        self.mock_auth_manager = MagicMock()
        
        # Initialize the ApiExplorer
        self.api_explorer = ApiExplorer(
            config=self.config,
            documentation_manager=self.mock_documentation_manager,
            auth_manager=self.mock_auth_manager
        )
    
    def test_initialization(self):
        """Test that the ApiExplorer initializes correctly."""
        self.assertTrue(self.api_explorer.enabled)
        self.assertTrue(self.api_explorer.sample_requests_enabled)
        self.assertEqual(self.api_explorer.api_base_url, "https://api.example.com/v1")
        self.assertEqual(self.api_explorer.documentation_manager, self.mock_documentation_manager)
        self.assertEqual(self.api_explorer.auth_manager, self.mock_auth_manager)
    
    @patch('src.developer_portal.api_explorer.requests.request')
    def test_execute_request(self, mock_request):
        """Test executing an API request."""
        # Set up the mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.elapsed.total_seconds.return_value = 0.5
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = {"id": 1, "name": "Test User"}
        mock_response.text = '{"id": 1, "name": "Test User"}'
        mock_request.return_value = mock_response
        
        # Test request parameters
        user_id = "test_user"
        method = "GET"
        endpoint = "/users/1"
        headers = {"Authorization": "Bearer test_token"}
        params = {"include": "details"}
        body = None
        
        # Mock the auth manager to return user information
        self.mock_auth_manager.get_user_api_key.return_value = "test_api_key"
        
        # Execute the request
        result = self.api_explorer.execute_request(user_id, method, endpoint, headers, params, body)
        
        # Check that the auth manager was called
        self.mock_auth_manager.get_user_api_key.assert_called_once_with(user_id)
        
        # Check that the request was made correctly
        mock_request.assert_called_once_with(
            method=method,
            url=f"{self.api_explorer.api_base_url}{endpoint}",
            headers=headers,
            params=params,
            json=body,
            timeout=30
        )
        
        # Check the result
        self.assertEqual(result["status_code"], 200)
        self.assertEqual(result["response_time_ms"], 500)  # 0.5 seconds = 500 ms
        self.assertEqual(result["headers"]["Content-Type"], "application/json")
        self.assertEqual(result["body"]["id"], 1)
        self.assertEqual(result["body"]["name"], "Test User")
        
        # Check that the request was saved to history
        self.assertEqual(len(self.api_explorer.request_history), 1)
        self.assertEqual(self.api_explorer.request_history[0]["user_id"], user_id)
        self.assertEqual(self.api_explorer.request_history[0]["method"], method)
        self.assertEqual(self.api_explorer.request_history[0]["endpoint"], endpoint)
    
    def test_get_recent_endpoints(self):
        """Test getting recent endpoints for a user."""
        user_id = "test_user"
        
        # Add some requests to history
        self.api_explorer.request_history = [
            {
                "user_id": user_id,
                "method": "GET",
                "endpoint": "/users",
                "timestamp": "2025-05-22T10:00:00Z"
            },
            {
                "user_id": user_id,
                "method": "POST",
                "endpoint": "/resources",
                "timestamp": "2025-05-22T11:00:00Z"
            },
            {
                "user_id": "other_user",
                "method": "GET",
                "endpoint": "/settings",
                "timestamp": "2025-05-22T12:00:00Z"
            },
            {
                "user_id": user_id,
                "method": "PUT",
                "endpoint": "/users/1",
                "timestamp": "2025-05-22T13:00:00Z"
            }
        ]
        
        # Get recent endpoints
        recent = self.api_explorer.get_recent_endpoints(user_id)
        
        # Check the result
        self.assertEqual(len(recent), 3)
        self.assertEqual(recent[0]["endpoint"], "/users/1")  # Most recent first
        self.assertEqual(recent[0]["method"], "PUT")
        self.assertEqual(recent[1]["endpoint"], "/resources")
        self.assertEqual(recent[1]["method"], "POST")
        self.assertEqual(recent[2]["endpoint"], "/users")
        self.assertEqual(recent[2]["method"], "GET")
    
    def test_get_sample_request(self):
        """Test getting a sample request for an endpoint."""
        endpoint = "/users"
        method = "POST"
        
        # Mock the documentation manager to return endpoint schema
        self.mock_documentation_manager.get_endpoint_schema.return_value = {
            "request": {
                "body": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "email": {"type": "string"},
                        "age": {"type": "integer"}
                    },
                    "required": ["name", "email"]
                }
            }
        }
        
        # Get sample request
        sample = self.api_explorer.get_sample_request(endpoint, method)
        
        # Check that the documentation manager was called
        self.mock_documentation_manager.get_endpoint_schema.assert_called_once_with(endpoint, method)
        
        # Check the sample
        self.assertEqual(sample["method"], method)
        self.assertEqual(sample["endpoint"], endpoint)
        self.assertIn("name", sample["body"])
        self.assertIn("email", sample["body"])
        self.assertIn("age", sample["body"])


if __name__ == '__main__':
    unittest.main()
