import unittest
import json
import os
import sys
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.progressive_access.workflow import ProgressiveAccessWorkflow
from src.progressive_access.criteria_evaluator import CriteriaEvaluator
from src.progressive_access.quota_manager import QuotaManager


class TestProgressiveAccessWorkflow(unittest.TestCase):
    """Test cases for the ProgressiveAccessWorkflow class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.mock_criteria_evaluator = MagicMock(spec=CriteriaEvaluator)
        self.mock_quota_manager = MagicMock(spec=QuotaManager)
        self.mock_notification_service = MagicMock()
        self.mock_analytics_service = MagicMock()
        
        # Initialize the ProgressiveAccessWorkflow
        self.workflow = ProgressiveAccessWorkflow(
            criteria_evaluator=self.mock_criteria_evaluator,
            quota_manager=self.mock_quota_manager,
            notification_service=self.mock_notification_service,
            analytics_service=self.mock_analytics_service
        )
    
    def test_initialization(self):
        """Test that the ProgressiveAccessWorkflow initializes correctly."""
        self.assertEqual(self.workflow.criteria_evaluator, self.mock_criteria_evaluator)
        self.assertEqual(self.workflow.quota_manager, self.mock_quota_manager)
        self.assertEqual(self.workflow.notification_service, self.mock_notification_service)
        self.assertEqual(self.workflow.analytics_service, self.mock_analytics_service)
    
    def test_evaluate_user_progression(self):
        """Test evaluating a user's progression."""
        user_id = "test_user_1"
        current_tier_id = "developer_preview"
        
        # Mock the criteria evaluator to return eligible for upgrade
        self.mock_criteria_evaluator.evaluate_user_criteria.return_value = {
            "eligible": True,
            "next_tier_id": "standard",
            "criteria_met": ["usage_volume", "api_diversity", "time_active"],
            "criteria_not_met": []
        }
        
        # Evaluate progression
        result = self.workflow.evaluate_user_progression(user_id, current_tier_id)
        
        # Check that the criteria evaluator was called
        self.mock_criteria_evaluator.evaluate_user_criteria.assert_called_once_with(
            user_id, current_tier_id
        )
        
        # Check the result
        self.assertTrue(result["eligible_for_upgrade"])
        self.assertEqual(result["next_tier_id"], "standard")
        self.assertEqual(len(result["criteria_met"]), 3)
        self.assertEqual(len(result["criteria_not_met"]), 0)
        
        # Mock the criteria evaluator to return not eligible for upgrade
        self.mock_criteria_evaluator.evaluate_user_criteria.return_value = {
            "eligible": False,
            "next_tier_id": None,
            "criteria_met": ["time_active"],
            "criteria_not_met": ["usage_volume", "api_diversity"]
        }
        
        # Evaluate progression
        result = self.workflow.evaluate_user_progression(user_id, current_tier_id)
        
        # Check the result
        self.assertFalse(result["eligible_for_upgrade"])
        self.assertIsNone(result["next_tier_id"])
        self.assertEqual(len(result["criteria_met"]), 1)
        self.assertEqual(len(result["criteria_not_met"]), 2)
    
    def test_process_tier_upgrade(self):
        """Test processing a tier upgrade."""
        user_id = "test_user_2"
        current_tier_id = "developer_preview"
        next_tier_id = "standard"
        
        # Process the upgrade
        result = self.workflow.process_tier_upgrade(user_id, current_tier_id, next_tier_id)
        
        # Check that the quota manager was called
        self.mock_quota_manager.update_user_quota.assert_called_once_with(
            user_id, next_tier_id
        )
        
        # Check that the notification service was called
        self.mock_notification_service.send_tier_upgrade_notification.assert_called_once_with(
            user_id, current_tier_id, next_tier_id
        )
        
        # Check that the analytics service was called
        self.mock_analytics_service.track_tier_upgrade.assert_called_once_with(
            user_id, current_tier_id, next_tier_id
        )
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["user_id"], user_id)
        self.assertEqual(result["previous_tier_id"], current_tier_id)
        self.assertEqual(result["new_tier_id"], next_tier_id)
    
    def test_get_progression_status(self):
        """Test getting a user's progression status."""
        user_id = "test_user_3"
        current_tier_id = "developer_preview"
        
        # Mock the criteria evaluator to return progression status
        self.mock_criteria_evaluator.get_user_progress.return_value = {
            "current_tier_id": current_tier_id,
            "next_tier_id": "standard",
            "progress_percentage": 75,
            "criteria_status": {
                "usage_volume": {"met": True, "current": 5000, "required": 1000},
                "api_diversity": {"met": True, "current": 10, "required": 5},
                "time_active": {"met": False, "current": 20, "required": 30},
                "success_rate": {"met": True, "current": 98, "required": 95}
            }
        }
        
        # Get progression status
        status = self.workflow.get_progression_status(user_id, current_tier_id)
        
        # Check that the criteria evaluator was called
        self.mock_criteria_evaluator.get_user_progress.assert_called_once_with(
            user_id, current_tier_id
        )
        
        # Check the status
        self.assertEqual(status["current_tier_id"], current_tier_id)
        self.assertEqual(status["next_tier_id"], "standard")
        self.assertEqual(status["progress_percentage"], 75)
        self.assertEqual(len(status["criteria_status"]), 4)
        self.assertTrue(status["criteria_status"]["usage_volume"]["met"])
        self.assertFalse(status["criteria_status"]["time_active"]["met"])
    
    def test_check_auto_upgrade_eligibility(self):
        """Test checking auto-upgrade eligibility for users."""
        # Mock the criteria evaluator to return eligible users
        self.mock_criteria_evaluator.find_eligible_users_for_upgrade.return_value = [
            {"user_id": "user1", "current_tier_id": "developer_preview", "next_tier_id": "standard"},
            {"user_id": "user2", "current_tier_id": "standard", "next_tier_id": "premium"}
        ]
        
        # Check auto-upgrade eligibility
        eligible_users = self.workflow.check_auto_upgrade_eligibility()
        
        # Check that the criteria evaluator was called
        self.mock_criteria_evaluator.find_eligible_users_for_upgrade.assert_called_once()
        
        # Check the result
        self.assertEqual(len(eligible_users), 2)
        self.assertEqual(eligible_users[0]["user_id"], "user1")
        self.assertEqual(eligible_users[0]["current_tier_id"], "developer_preview")
        self.assertEqual(eligible_users[0]["next_tier_id"], "standard")
    
    def test_process_auto_upgrades(self):
        """Test processing auto-upgrades for eligible users."""
        # Mock eligible users
        eligible_users = [
            {"user_id": "user1", "current_tier_id": "developer_preview", "next_tier_id": "standard"},
            {"user_id": "user2", "current_tier_id": "standard", "next_tier_id": "premium"}
        ]
        
        # Mock the criteria evaluator
        self.mock_criteria_evaluator.find_eligible_users_for_upgrade.return_value = eligible_users
        
        # Process auto-upgrades
        results = self.workflow.process_auto_upgrades()
        
        # Check that the criteria evaluator was called
        self.mock_criteria_evaluator.find_eligible_users_for_upgrade.assert_called_once()
        
        # Check that the quota manager was called for each user
        self.assertEqual(self.mock_quota_manager.update_user_quota.call_count, 2)
        
        # Check that the notification service was called for each user
        self.assertEqual(self.mock_notification_service.send_tier_upgrade_notification.call_count, 2)
        
        # Check that the analytics service was called for each user
        self.assertEqual(self.mock_analytics_service.track_tier_upgrade.call_count, 2)
        
        # Check the results
        self.assertEqual(len(results), 2)
        self.assertTrue(results[0]["success"])
        self.assertEqual(results[0]["user_id"], "user1")
        self.assertEqual(results[0]["previous_tier_id"], "developer_preview")
        self.assertEqual(results[0]["new_tier_id"], "standard")


class TestCriteriaEvaluator(unittest.TestCase):
    """Test cases for the CriteriaEvaluator class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
            "criteria": {
                "usage_volume": {
                    "developer_preview_to_standard": 1000,
                    "standard_to_premium": 10000,
                    "premium_to_enterprise": 100000
                },
                "api_diversity": {
                    "developer_preview_to_standard": 5,
                    "standard_to_premium": 10,
                    "premium_to_enterprise": 20
                },
                "time_active": {
                    "developer_preview_to_standard": 30,
                    "standard_to_premium": 60,
                    "premium_to_enterprise": 90
                },
                "success_rate": {
                    "developer_preview_to_standard": 95,
                    "standard_to_premium": 97,
                    "premium_to_enterprise": 99
                }
            },
            "tier_progression": {
                "developer_preview": "standard",
                "standard": "premium",
                "premium": "enterprise",
                "enterprise": null
            }
        }
        
        # Create mock dependencies
        self.mock_analytics_service = MagicMock()
        
        # Initialize the CriteriaEvaluator
        self.evaluator = CriteriaEvaluator(
            config=self.config,
            analytics_service=self.mock_analytics_service
        )
    
    def test_initialization(self):
        """Test that the CriteriaEvaluator initializes correctly."""
        self.assertEqual(self.evaluator.criteria, self.config["criteria"])
        self.assertEqual(self.evaluator.tier_progression, self.config["tier_progression"])
        self.assertEqual(self.evaluator.analytics_service, self.mock_analytics_service)
    
    def test_evaluate_user_criteria(self):
        """Test evaluating a user's criteria for tier progression."""
        user_id = "test_user_1"
        current_tier_id = "developer_preview"
        
        # Mock the analytics service to return usage data that meets all criteria
        self.mock_analytics_service.get_user_usage_metrics.return_value = {
            "total_requests": 5000,  # > 1000 required
            "unique_endpoints": 8,    # > 5 required
            "days_active": 45,        # > 30 required
            "success_rate": 98        # > 95 required
        }
        
        # Evaluate criteria
        result = self.evaluator.evaluate_user_criteria(user_id, current_tier_id)
        
        # Check that the analytics service was called
        self.mock_analytics_service.get_user_usage_metrics.assert_called_once_with(user_id)
        
        # Check the result
        self.assertTrue(result["eligible"])
        self.assertEqual(result["next_tier_id"], "standard")
        self.assertEqual(len(result["criteria_met"]), 4)
        self.assertEqual(len(result["criteria_not_met"]), 0)
        
        # Mock the analytics service to return usage data that doesn't meet all criteria
        self.mock_analytics_service.get_user_usage_metrics.return_value = {
            "total_requests": 500,    # < 1000 required
            "unique_endpoints": 8,    # > 5 required
            "days_active": 45,        # > 30 required
            "success_rate": 90        # < 95 required
        }
        
        # Evaluate criteria
        result = self.evaluator.evaluate_user_criteria(user_id, current_tier_id)
        
        # Check the result
        self.assertFalse(result["eligible"])
        self.assertEqual(result["next_tier_id"], "standard")
        self.assertEqual(len(result["criteria_met"]), 2)
        self.assertEqual(len(result["criteria_not_met"]), 2)
        self.assertIn("usage_volume", result["criteria_not_met"])
        self.assertIn("success_rate", result["criteria_not_met"])
    
    def test_get_user_progress(self):
        """Test getting a user's progress towards the next tier."""
        user_id = "test_user_2"
        current_tier_id = "developer_preview"
        
        # Mock the analytics service to return usage data
        self.mock_analytics_service.get_user_usage_metrics.return_value = {
            "total_requests": 800,    # 80% of 1000 required
            "unique_endpoints": 6,    # 120% of 5 required
            "days_active": 15,        # 50% of 30 required
            "success_rate": 97        # 102% of 95 required
        }
        
        # Get progress
        progress = self.evaluator.get_user_progress(user_id, current_tier_id)
        
        # Check that the analytics service was called
        self.mock_analytics_service.get_user_usage_metrics.assert_called_once_with(user_id)
        
        # Check the progress
        self.assertEqual(progress["current_tier_id"], current_tier_id)
        self.assertEqual(progress["next_tier_id"], "standard")
        
        # Progress percentage should be the average of all criteria percentages
        # (80 + 120 + 50 + 102) / 4 = 88%
        self.assertAlmostEqual(progress["progress_percentage"], 88, delta=1)
        
        # Check individual criteria status
        self.assertFalse(progress["criteria_status"]["usage_volume"]["met"])
        self.assertEqual(progress["criteria_status"]["usage_volume"]["current"], 800)
        self.assertEqual(progress["criteria_status"]["usage_volume"]["required"], 1000)
        
        self.assertTrue(progress["criteria_status"]["api_diversity"]["met"])
        self.assertEqual(progress["criteria_status"]["api_diversity"]["current"], 6)
        self.assertEqual(progress["criteria_status"]["api_diversity"]["required"], 5)
    
    def test_find_eligible_users_for_upgrade(self):
        """Test finding users eligible for auto-upgrade."""
        # Mock the analytics service to return eligible users
        self.mock_analytics_service.find_users_meeting_criteria.return_value = [
            {
                "user_id": "user1",
                "current_tier_id": "developer_preview",
                "metrics": {
                    "total_requests": 5000,
                    "unique_endpoints": 8,
                    "days_active": 45,
                    "success_rate": 98
                }
            },
            {
                "user_id": "user2",
                "current_tier_id": "standard",
                "metrics": {
                    "total_requests": 15000,
                    "unique_endpoints": 12,
                    "days_active": 75,
                    "success_rate": 99
                }
            }
        ]
        
        # Find eligible users
        eligible_users = self.evaluator.find_eligible_users_for_upgrade()
        
        # Check that the analytics service was called
        self.mock_analytics_service.find_users_meeting_criteria.assert_called_once()
        
        # Check the result
        self.assertEqual(len(eligible_users), 2)
        self.assertEqual(eligible_users[0]["user_id"], "user1")
        self.assertEqual(eligible_users[0]["current_tier_id"], "developer_preview")
        self.assertEqual(eligible_users[0]["next_tier_id"], "standard")
        self.assertEqual(eligible_users[1]["user_id"], "user2")
        self.assertEqual(eligible_users[1]["current_tier_id"], "standard")
        self.assertEqual(eligible_users[1]["next_tier_id"], "premium")


if __name__ == '__main__':
    unittest.main()
