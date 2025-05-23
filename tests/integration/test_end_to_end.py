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
from src.developer_portal.portal import DeveloperPortal
from src.sandbox.sandbox_manager import SandboxManager
from src.feedback.feedback_telemetry import TelemetryCollector, FeedbackManager
from src.agent_preference.preference_elicitation import PreferenceElicitor


class TestEndToEndUserJourney(unittest.TestCase):
    """End-to-end tests for complete user journeys through the system."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock components
        self.mock_access_tier_manager = MagicMock(spec=AccessTierManager)
        self.mock_api_gateway = MagicMock(spec=ApiGatewayConnector)
        self.mock_progressive_workflow = MagicMock(spec=ProgressiveAccessWorkflow)
        self.mock_developer_portal = MagicMock(spec=DeveloperPortal)
        self.mock_sandbox_manager = MagicMock(spec=SandboxManager)
        self.mock_telemetry_collector = MagicMock(spec=TelemetryCollector)
        self.mock_feedback_manager = MagicMock(spec=FeedbackManager)
        self.mock_preference_elicitor = MagicMock(spec=PreferenceElicitor)
    
    def test_new_developer_onboarding_journey(self):
        """Test the complete journey of a new developer from signup to first API call."""
        # Set up test data
        user_id = "new_developer_123"
        email = "developer@example.com"
        initial_tier_id = "developer_preview"
        
        # Step 1: User signs up and gets assigned to developer preview tier
        self.mock_access_tier_manager.assign_tier.return_value = {
            "user_id": user_id,
            "tier_id": initial_tier_id,
            "assigned_at": "2025-05-23T10:00:00Z",
            "status": "active"
        }
        
        tier_assignment = self.mock_access_tier_manager.assign_tier(user_id, initial_tier_id)
        self.assertEqual(tier_assignment["tier_id"], initial_tier_id)
        
        # Step 2: User starts onboarding in developer portal
        self.mock_developer_portal.start_onboarding.return_value = {
            "session_id": "onboarding_456",
            "steps": [
                {"id": "welcome", "title": "Welcome", "completed": False},
                {"id": "api_keys", "title": "API Keys", "completed": False},
                {"id": "first_request", "title": "Your First Request", "completed": False}
            ],
            "current_step": "welcome"
        }
        
        onboarding_session = self.mock_developer_portal.start_onboarding(user_id)
        self.assertEqual(onboarding_session["current_step"], "welcome")
        
        # Step 3: User creates a sandbox environment
        self.mock_sandbox_manager.create_environment.return_value = {
            "id": "sandbox_789",
            "name": "My Test Environment",
            "template": "standard",
            "user_id": user_id,
            "created_at": "2025-05-23T10:15:00Z",
            "expires_at": "2025-05-24T10:15:00Z",
            "status": "active",
            "directory": "/var/data/sandbox_environments/sandbox_789"
        }
        
        sandbox = self.mock_sandbox_manager.create_environment(
            name="My Test Environment",
            template="standard",
            user_id=user_id
        )
        self.assertEqual(sandbox["status"], "active")
        
        # Step 4: User makes their first API call through the developer portal
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message": "Hello, World!"}
        
        self.mock_developer_portal.api_explorer.execute_request.return_value = mock_response
        
        response = self.mock_developer_portal.api_explorer.execute_request(
            user_id=user_id,
            method="GET",
            endpoint="/hello",
            headers={"Authorization": "Bearer test_token"},
            params={},
            body=None
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Hello, World!"})
        
        # Step 5: Telemetry is collected for the API call
        self.mock_telemetry_collector.track.assert_not_called()  # Reset mock
        
        self.mock_telemetry_collector.track("api_request", {
            "user_id": user_id,
            "endpoint": "/hello",
            "method": "GET",
            "status_code": 200,
            "response_time": 150
        })
        
        self.mock_telemetry_collector.track.assert_called_once()
        
        # Step 6: User provides feedback
        self.mock_feedback_manager.submit_feedback.return_value = {
            "id": "feedback_101",
            "submitted_at": "2025-05-23T10:30:00Z",
            "status": "new"
        }
        
        feedback_result = self.mock_feedback_manager.submit_feedback(
            user_id=user_id,
            feedback_type="general",
            content="The API is easy to use, but I'd like more examples.",
            metadata={"source": "developer_portal"}
        )
        
        self.assertEqual(feedback_result["status"], "new")
        
        # Step 7: User's preferences are elicited
        self.mock_preference_elicitor.elicit_preference.return_value = {
            "id": "pref_202",
            "user_id": user_id,
            "prompt_type": "specific",
            "params": {"feature": "documentation"},
            "response": "5",
            "timestamp": "2025-05-23T10:45:00Z"
        }
        
        preference = self.mock_preference_elicitor.elicit_preference(
            user_id=user_id,
            prompt_type="specific",
            params={"feature": "documentation"},
            response="5"
        )
        
        self.assertEqual(preference["response"], "5")
        
        # Step 8: After continued usage, user becomes eligible for tier upgrade
        self.mock_progressive_workflow.evaluate_user_progression.return_value = {
            "eligible_for_upgrade": True,
            "current_tier_id": initial_tier_id,
            "next_tier_id": "standard",
            "criteria_met": ["usage_volume", "api_diversity", "time_active"],
            "criteria_not_met": []
        }
        
        progression = self.mock_progressive_workflow.evaluate_user_progression(
            user_id=user_id,
            current_tier_id=initial_tier_id
        )
        
        self.assertTrue(progression["eligible_for_upgrade"])
        
        # Step 9: User is upgraded to standard tier
        self.mock_progressive_workflow.process_tier_upgrade.return_value = {
            "success": True,
            "user_id": user_id,
            "previous_tier_id": initial_tier_id,
            "new_tier_id": "standard",
            "processed_at": "2025-05-30T10:00:00Z"
        }
        
        upgrade_result = self.mock_progressive_workflow.process_tier_upgrade(
            user_id=user_id,
            current_tier_id=initial_tier_id,
            next_tier_id="standard"
        )
        
        self.assertTrue(upgrade_result["success"])
        self.assertEqual(upgrade_result["new_tier_id"], "standard")
    
    def test_api_access_with_different_tiers(self):
        """Test API access with different access tiers."""
        # Set up test data
        basic_user_id = "basic_user"
        standard_user_id = "standard_user"
        premium_user_id = "premium_user"
        
        basic_tier_id = "developer_preview"
        standard_tier_id = "standard"
        premium_tier_id = "premium"
        
        # Mock the access tier manager to return different tiers for different users
        def get_user_tier_id(user_id):
            if user_id == basic_user_id:
                return basic_tier_id
            elif user_id == standard_user_id:
                return standard_tier_id
            elif user_id == premium_user_id:
                return premium_tier_id
            return None
        
        self.mock_access_tier_manager.get_user_tier_id.side_effect = get_user_tier_id
        
        # Mock the access tier manager's has_feature_access method
        def has_feature_access(user_id, feature):
            tier_id = get_user_tier_id(user_id)
            
            if feature == "basic_api":
                return True  # All tiers have access to basic API
            elif feature == "advanced_api":
                return tier_id in [standard_tier_id, premium_tier_id]  # Standard and Premium only
            elif feature == "premium_api":
                return tier_id == premium_tier_id  # Premium only
            
            return False
        
        self.mock_access_tier_manager.has_feature_access.side_effect = has_feature_access
        
        # Mock the API gateway's forward_request method
        def forward_request(method, endpoint, headers, params, data):
            # Extract user_id from headers (in a real system, this would be done by auth middleware)
            auth_header = headers.get("Authorization", "")
            user_id = auth_header.replace("Bearer ", "")
            
            # Check if the user has access to the endpoint
            if endpoint.startswith("/basic/"):
                has_access = has_feature_access(user_id, "basic_api")
            elif endpoint.startswith("/advanced/"):
                has_access = has_feature_access(user_id, "advanced_api")
            elif endpoint.startswith("/premium/"):
                has_access = has_feature_access(user_id, "premium_api")
            else:
                has_access = True
            
            # Create mock response
            mock_response = MagicMock()
            
            if has_access:
                mock_response.status_code = 200
                mock_response.json.return_value = {"message": "Success"}
            else:
                mock_response.status_code = 403
                mock_response.json.return_value = {"error": "Access denied"}
            
            return mock_response
        
        self.mock_api_gateway.forward_request.side_effect = forward_request
        
        # Test basic API access (all users should have access)
        for user_id in [basic_user_id, standard_user_id, premium_user_id]:
            response = self.mock_api_gateway.forward_request(
                method="GET",
                endpoint="/basic/resource",
                headers={"Authorization": f"Bearer {user_id}"},
                params={},
                data=None
            )
            
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), {"message": "Success"})
        
        # Test advanced API access (standard and premium users only)
        # Basic user should be denied
        response = self.mock_api_gateway.forward_request(
            method="GET",
            endpoint="/advanced/resource",
            headers={"Authorization": f"Bearer {basic_user_id}"},
            params={},
            data=None
        )
        
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json(), {"error": "Access denied"})
        
        # Standard and premium users should have access
        for user_id in [standard_user_id, premium_user_id]:
            response = self.mock_api_gateway.forward_request(
                method="GET",
                endpoint="/advanced/resource",
                headers={"Authorization": f"Bearer {user_id}"},
                params={},
                data=None
            )
            
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), {"message": "Success"})
        
        # Test premium API access (premium users only)
        # Basic and standard users should be denied
        for user_id in [basic_user_id, standard_user_id]:
            response = self.mock_api_gateway.forward_request(
                method="GET",
                endpoint="/premium/resource",
                headers={"Authorization": f"Bearer {user_id}"},
                params={},
                data=None
            )
            
            self.assertEqual(response.status_code, 403)
            self.assertEqual(response.json(), {"error": "Access denied"})
        
        # Premium user should have access
        response = self.mock_api_gateway.forward_request(
            method="GET",
            endpoint="/premium/resource",
            headers={"Authorization": f"Bearer {premium_user_id}"},
            params={},
            data=None
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Success"})


if __name__ == '__main__':
    unittest.main()
