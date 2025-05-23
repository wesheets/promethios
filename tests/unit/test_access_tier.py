import unittest
import json
import os
import sys
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.access_tier.models import TierDefinition, TierAssignment
from src.access_tier.access_tier_manager import AccessTierManager
from src.access_tier.exceptions import TierNotFoundError, QuotaExceededError


class TestAccessTierManager(unittest.TestCase):
    """Test cases for the AccessTierManager class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
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
                },
                "premium": {
                    "quota": {
                        "requests_per_day": 100000,
                        "concurrent_requests": 50
                    },
                    "features": ["basic_api", "advanced_api", "documentation", "support", "analytics"]
                }
            }
        }
        
        # Create a mock persistence layer
        self.mock_persistence = MagicMock()
        
        # Initialize the AccessTierManager with the test configuration
        self.manager = AccessTierManager(self.config, persistence=self.mock_persistence)
    
    def test_initialization(self):
        """Test that the AccessTierManager initializes correctly."""
        self.assertEqual(self.manager.default_tier_id, "developer_preview")
        self.assertTrue(self.manager.auto_upgrade)
        self.assertEqual(self.manager.evaluation_interval, 86400)
        self.assertEqual(len(self.manager.tiers), 3)
        
        # Check that the tiers were loaded correctly
        self.assertIn("developer_preview", self.manager.tiers)
        self.assertIn("standard", self.manager.tiers)
        self.assertIn("premium", self.manager.tiers)
        
        # Check the features of a tier
        dev_preview = self.manager.tiers["developer_preview"]
        self.assertEqual(dev_preview.id, "developer_preview")
        self.assertEqual(dev_preview.quota["requests_per_day"], 1000)
        self.assertEqual(dev_preview.quota["concurrent_requests"], 5)
        self.assertIn("basic_api", dev_preview.features)
        self.assertIn("documentation", dev_preview.features)
    
    def test_get_tier_definition(self):
        """Test getting a tier definition."""
        # Get an existing tier
        tier = self.manager.get_tier_definition("standard")
        self.assertIsInstance(tier, TierDefinition)
        self.assertEqual(tier.id, "standard")
        self.assertEqual(tier.quota["requests_per_day"], 10000)
        
        # Try to get a non-existent tier
        with self.assertRaises(TierNotFoundError):
            self.manager.get_tier_definition("non_existent_tier")
    
    def test_assign_tier(self):
        """Test assigning a tier to a user."""
        user_id = "test_user_1"
        tier_id = "standard"
        
        # Mock the persistence layer to return None for get_assignment
        self.mock_persistence.get_assignment.return_value = None
        
        # Assign the tier
        assignment = self.manager.assign_tier(user_id, tier_id)
        
        # Check the assignment
        self.assertIsInstance(assignment, TierAssignment)
        self.assertEqual(assignment.user_id, user_id)
        self.assertEqual(assignment.tier_id, tier_id)
        
        # Check that the persistence layer was called
        self.mock_persistence.save_assignment.assert_called_once()
        
        # Try to assign a non-existent tier
        with self.assertRaises(TierNotFoundError):
            self.manager.assign_tier(user_id, "non_existent_tier")
    
    def test_get_user_tier(self):
        """Test getting a user's tier."""
        user_id = "test_user_2"
        tier_id = "premium"
        
        # Create a mock assignment
        mock_assignment = TierAssignment(user_id=user_id, tier_id=tier_id)
        
        # Mock the persistence layer to return the assignment
        self.mock_persistence.get_assignment.return_value = mock_assignment
        
        # Get the user's tier
        tier = self.manager.get_user_tier(user_id)
        
        # Check the tier
        self.assertIsInstance(tier, TierDefinition)
        self.assertEqual(tier.id, tier_id)
        
        # Check that the persistence layer was called
        self.mock_persistence.get_assignment.assert_called_once_with(user_id)
        
        # Test default tier when no assignment exists
        self.mock_persistence.get_assignment.return_value = None
        tier = self.manager.get_user_tier("new_user")
        self.assertEqual(tier.id, "developer_preview")
    
    def test_check_quota(self):
        """Test checking if a user has exceeded their quota."""
        user_id = "test_user_3"
        tier_id = "standard"
        
        # Create a mock assignment
        mock_assignment = TierAssignment(user_id=user_id, tier_id=tier_id)
        
        # Mock the persistence layer
        self.mock_persistence.get_assignment.return_value = mock_assignment
        self.mock_persistence.get_usage.return_value = {
            "requests_today": 5000,  # Below the limit
            "concurrent_requests": 10  # Below the limit
        }
        
        # Check quota - should not raise an exception
        self.manager.check_quota(user_id, "requests_per_day")
        
        # Set usage above the limit
        self.mock_persistence.get_usage.return_value = {
            "requests_today": 15000,  # Above the limit
            "concurrent_requests": 10
        }
        
        # Check quota - should raise an exception
        with self.assertRaises(QuotaExceededError):
            self.manager.check_quota(user_id, "requests_per_day")
    
    def test_increment_usage(self):
        """Test incrementing a user's usage."""
        user_id = "test_user_4"
        metric = "requests_today"
        amount = 1
        
        # Call increment_usage
        self.manager.increment_usage(user_id, metric, amount)
        
        # Check that the persistence layer was called
        self.mock_persistence.increment_usage.assert_called_once_with(user_id, metric, amount)
    
    def test_evaluate_tier_progression(self):
        """Test evaluating tier progression for a user."""
        user_id = "test_user_5"
        current_tier_id = "developer_preview"
        
        # Create a mock assignment
        mock_assignment = TierAssignment(user_id=user_id, tier_id=current_tier_id)
        
        # Mock the persistence layer
        self.mock_persistence.get_assignment.return_value = mock_assignment
        
        # Mock usage data that qualifies for an upgrade
        self.mock_persistence.get_usage_history.return_value = {
            "total_requests": 50000,
            "successful_requests": 49000,
            "unique_endpoints": 15,
            "days_active": 30
        }
        
        # Evaluate tier progression
        result = self.manager.evaluate_tier_progression(user_id)
        
        # Check the result
        self.assertTrue(result["eligible_for_upgrade"])
        self.assertEqual(result["current_tier_id"], current_tier_id)
        self.assertEqual(result["next_tier_id"], "standard")
        
        # Mock usage data that doesn't qualify for an upgrade
        self.mock_persistence.get_usage_history.return_value = {
            "total_requests": 500,
            "successful_requests": 490,
            "unique_endpoints": 3,
            "days_active": 5
        }
        
        # Evaluate tier progression
        result = self.manager.evaluate_tier_progression(user_id)
        
        # Check the result
        self.assertFalse(result["eligible_for_upgrade"])
        self.assertEqual(result["current_tier_id"], current_tier_id)
    
    def test_has_feature_access(self):
        """Test checking if a user has access to a feature."""
        user_id = "test_user_6"
        tier_id = "standard"
        
        # Create a mock assignment
        mock_assignment = TierAssignment(user_id=user_id, tier_id=tier_id)
        
        # Mock the persistence layer
        self.mock_persistence.get_assignment.return_value = mock_assignment
        
        # Check access to features
        self.assertTrue(self.manager.has_feature_access(user_id, "basic_api"))
        self.assertTrue(self.manager.has_feature_access(user_id, "advanced_api"))
        self.assertFalse(self.manager.has_feature_access(user_id, "analytics"))
        
        # Check access to a non-existent feature
        self.assertFalse(self.manager.has_feature_access(user_id, "non_existent_feature"))


if __name__ == '__main__':
    unittest.main()
