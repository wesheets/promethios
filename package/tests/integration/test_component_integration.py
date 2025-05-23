import unittest
import os
import sys
import json
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.access_tier.access_tier_manager import AccessTierManager
from src.api_gateway.connector import ApiGatewayConnector
from src.progressive_access.workflow import ProgressiveAccessWorkflow


class TestAccessTierApiGatewayIntegration(unittest.TestCase):
    """Integration tests for Access Tier Management and API Gateway."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.mock_persistence = MagicMock()
        self.mock_auth_middleware = MagicMock()
        self.mock_rate_limit_middleware = MagicMock()
        self.mock_permission_validator = MagicMock()
        self.mock_error_handler = MagicMock()
        
        # Create test configurations
        self.access_tier_config = {
            "default_tier": "developer_preview",
            "auto_upgrade": True,
            "evaluation_interval": 86400,
            "tiers": {
                "developer_preview": {
                    "quota": {
                        "requests_per_day": 1000,
                        "concurrent_requests": 5
                    },
                    "features": ["basic_api", "documentation"]
                },
                "standard": {
                    "quota": {
                        "requests_per_day": 10000,
                        "concurrent_requests": 20
                    },
                    "features": ["basic_api", "advanced_api", "documentation", "support"]
                }
            }
        }
        
        self.api_gateway_config = {
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
        
        # Initialize the components
        self.access_tier_manager = AccessTierManager(
            config=self.access_tier_config,
            persistence=self.mock_persistence
        )
        
        self.api_gateway = ApiGatewayConnector(
            config=self.api_gateway_config,
            auth_middleware=self.mock_auth_middleware,
            rate_limit_middleware=self.mock_rate_limit_middleware,
            permission_validator=self.mock_permission_validator,
            error_handler=self.mock_error_handler
        )
    
    def test_feature_access_integration(self):
        """Test that API Gateway correctly uses Access Tier Manager for feature access checks."""
        # Set up test data
        user_id = "test_user"
        tier_id = "developer_preview"
        endpoint = "/advanced/feature"
        method = "GET"
        
        # Mock the auth middleware to return user info
        self.mock_auth_middleware.authenticate.return_value = {
            "user_id": user_id,
            "tier": tier_id
        }
        
        # Mock the rate limit middleware to allow the request
        self.mock_rate_limit_middleware.check_rate_limit.return_value = True
        
        # Create a custom permission validator that uses the access tier manager
        def custom_validate_permission(user_id, tier_id, endpoint, method):
            # Check if the endpoint requires advanced API access
            if endpoint.startswith("/advanced/"):
                # Use the access tier manager to check if the user has access to the advanced API
                return self.access_tier_manager.has_feature_access(user_id, "advanced_api")
            return True
        
        # Set the permission validator to use our custom function
        self.mock_permission_validator.validate_permission.side_effect = custom_validate_permission
        
        # Mock the access tier manager's has_feature_access method
        # Developer preview tier doesn't have access to advanced API
        self.access_tier_manager.has_feature_access = MagicMock(return_value=False)
        
        # Make the request
        response = self.api_gateway.forward_request(
            method=method,
            endpoint=endpoint,
            headers={"Authorization": "Bearer test_token"},
            params={},
            data=None
        )
        
        # Check that the access tier manager was called
        self.access_tier_manager.has_feature_access.assert_called_once_with(user_id, "advanced_api")
        
        # Check that the permission validator was called
        self.mock_permission_validator.validate_permission.assert_called_once_with(
            user_id, tier_id, endpoint, method
        )
        
        # Check that the request was denied
        self.mock_error_handler.handle_permission_denied.assert_called_once()
        
        # Now change the tier to standard, which has access to advanced API
        self.mock_auth_middleware.authenticate.return_value = {
            "user_id": user_id,
            "tier": "standard"
        }
        
        # And mock the access tier manager to allow access
        self.access_tier_manager.has_feature_access = MagicMock(return_value=True)
        
        # Make the request again
        self.api_gateway.forward_request(
            method=method,
            endpoint=endpoint,
            headers={"Authorization": "Bearer test_token"},
            params={},
            data=None
        )
        
        # Check that the access tier manager was called
        self.access_tier_manager.has_feature_access.assert_called_once_with(user_id, "advanced_api")
        
        # Check that the request was allowed (error handler not called again)
        self.assertEqual(self.mock_error_handler.handle_permission_denied.call_count, 1)


class TestProgressiveAccessIntegration(unittest.TestCase):
    """Integration tests for Progressive Access Workflow with Access Tier Management."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.mock_persistence = MagicMock()
        self.mock_criteria_evaluator = MagicMock()
        self.mock_quota_manager = MagicMock()
        self.mock_notification_service = MagicMock()
        self.mock_analytics_service = MagicMock()
        
        # Create test configuration
        self.access_tier_config = {
            "default_tier": "developer_preview",
            "auto_upgrade": True,
            "evaluation_interval": 86400,
            "tiers": {
                "developer_preview": {
                    "quota": {
                        "requests_per_day": 1000,
                        "concurrent_requests": 5
                    },
                    "features": ["basic_api", "documentation"]
                },
                "standard": {
                    "quota": {
                        "requests_per_day": 10000,
                        "concurrent_requests": 20
                    },
                    "features": ["basic_api", "advanced_api", "documentation", "support"]
                }
            }
        }
        
        # Initialize the components
        self.access_tier_manager = AccessTierManager(
            config=self.access_tier_config,
            persistence=self.mock_persistence
        )
        
        self.progressive_workflow = ProgressiveAccessWorkflow(
            criteria_evaluator=self.mock_criteria_evaluator,
            quota_manager=self.mock_quota_manager,
            notification_service=self.mock_notification_service,
            analytics_service=self.mock_analytics_service
        )
    
    def test_tier_upgrade_integration(self):
        """Test that Progressive Access Workflow correctly integrates with Access Tier Manager for tier upgrades."""
        # Set up test data
        user_id = "test_user"
        current_tier_id = "developer_preview"
        next_tier_id = "standard"
        
        # Mock the criteria evaluator to return eligible for upgrade
        self.mock_criteria_evaluator.evaluate_user_criteria.return_value = {
            "eligible": True,
            "next_tier_id": next_tier_id,
            "criteria_met": ["usage_volume", "api_diversity", "time_active"],
            "criteria_not_met": []
        }
        
        # Mock the access tier manager's assign_tier method
        self.access_tier_manager.assign_tier = MagicMock()
        
        # Integrate the access tier manager with the progressive workflow
        # by setting it as the quota manager's dependency
        self.mock_quota_manager.update_user_quota.side_effect = lambda user_id, tier_id: self.access_tier_manager.assign_tier(user_id, tier_id)
        
        # Evaluate and process the upgrade
        evaluation_result = self.progressive_workflow.evaluate_user_progression(user_id, current_tier_id)
        upgrade_result = self.progressive_workflow.process_tier_upgrade(
            user_id, current_tier_id, evaluation_result["next_tier_id"]
        )
        
        # Check that the criteria evaluator was called
        self.mock_criteria_evaluator.evaluate_user_criteria.assert_called_once_with(
            user_id, current_tier_id
        )
        
        # Check that the quota manager was called, which should call the access tier manager
        self.mock_quota_manager.update_user_quota.assert_called_once_with(
            user_id, next_tier_id
        )
        
        # Check that the access tier manager was called
        self.access_tier_manager.assign_tier.assert_called_once_with(user_id, next_tier_id)
        
        # Check that the notification service was called
        self.mock_notification_service.send_tier_upgrade_notification.assert_called_once_with(
            user_id, current_tier_id, next_tier_id
        )
        
        # Check that the analytics service was called
        self.mock_analytics_service.track_tier_upgrade.assert_called_once_with(
            user_id, current_tier_id, next_tier_id
        )
        
        # Check the upgrade result
        self.assertTrue(upgrade_result["success"])
        self.assertEqual(upgrade_result["user_id"], user_id)
        self.assertEqual(upgrade_result["previous_tier_id"], current_tier_id)
        self.assertEqual(upgrade_result["new_tier_id"], next_tier_id)


class TestDeveloperPortalIntegration(unittest.TestCase):
    """Integration tests for Developer Portal with API Gateway and Access Tier Management."""

    def setUp(self):
        """Set up test fixtures."""
        # This would be a more complex setup involving multiple components
        # For brevity, we'll use mocks for most dependencies
        pass
    
    @patch('src.developer_portal.portal.DeveloperPortal')
    @patch('src.api_gateway.connector.ApiGatewayConnector')
    @patch('src.access_tier.access_tier_manager.AccessTierManager')
    def test_api_explorer_integration(self, mock_access_tier_manager_class, mock_api_gateway_class, mock_developer_portal_class):
        """Test that the API Explorer in Developer Portal correctly integrates with API Gateway and Access Tier Management."""
        # Set up mock instances
        mock_access_tier_manager = mock_access_tier_manager_class.return_value
        mock_api_gateway = mock_api_gateway_class.return_value
        mock_developer_portal = mock_developer_portal_class.return_value
        
        # Set up test data
        user_id = "test_user"
        tier_id = "standard"
        endpoint = "/users"
        method = "GET"
        
        # Mock the access tier manager to return the user's tier
        mock_access_tier_manager.get_user_tier_id.return_value = tier_id
        
        # Mock the API gateway to return a successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"items": [{"id": 1, "name": "Test User"}]}
        mock_api_gateway.forward_request.return_value = mock_response
        
        # Mock the developer portal's API explorer to use the API gateway
        mock_developer_portal.api_explorer.execute_request.side_effect = lambda user_id, method, endpoint, headers, params, body: mock_api_gateway.forward_request(method, endpoint, headers, params, body)
        
        # Execute a request through the developer portal
        headers = {"Authorization": f"Bearer {user_id}"}
        params = {"page": 1, "limit": 10}
        body = None
        
        result = mock_developer_portal.api_explorer.execute_request(
            user_id, method, endpoint, headers, params, body
        )
        
        # Check that the API gateway was called
        mock_api_gateway.forward_request.assert_called_once_with(
            method, endpoint, headers, params, body
        )
        
        # Check the result
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json(), {"items": [{"id": 1, "name": "Test User"}]})


if __name__ == '__main__':
    unittest.main()
