"""
Access Tier Management System - Integration Tests

This module provides test utilities for the Access Tier Management System.
"""

import json
import os
import tempfile
import unittest
from datetime import datetime, timedelta

from src.access_tier.models import TierDefinition, TierAssignment, RateLimits, ProgressionCriteria
from src.access_tier.access_tier_manager import AccessTierManager
from src.access_tier.config_loader import AccessTierConfigLoader
from src.access_tier.persistence import AccessTierPersistence
from src.access_tier.exceptions import AccessDeniedError, RateLimitExceededError


class AccessTierManagerTests(unittest.TestCase):
    """Test cases for the AccessTierManager class."""
    
    def setUp(self):
        """Set up test environment."""
        # Create a temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        
        # Create test tiers
        self.developer_preview = TierDefinition(
            id="developer_preview",
            name="Developer Preview",
            description="Limited access for early developers",
            permissions=["read:basic", "write:basic"],
            rate_limits=RateLimits(
                requests_per_minute=60,
                requests_per_day=10000
            ),
            progression_criteria=ProgressionCriteria(
                min_days_in_tier=30,
                min_successful_requests=1000,
                max_error_rate=0.05
            )
        )
        
        self.partner_access = TierDefinition(
            id="partner_access",
            name="Partner Access",
            description="Extended access for partners",
            permissions=["read:basic", "write:basic", "read:advanced"],
            rate_limits=RateLimits(
                requests_per_minute=120,
                requests_per_day=20000
            ),
            progression_criteria=ProgressionCriteria(
                min_days_in_tier=60,
                min_successful_requests=5000,
                max_error_rate=0.03
            )
        )
        
        # Initialize the manager
        self.manager = AccessTierManager()
        
        # Register test tiers
        self.manager.register_tier(self.developer_preview)
        self.manager.register_tier(self.partner_access)
        
        # Create test assignments
        self.test_assignment = TierAssignment(
            user_id="user123",
            tier_id="developer_preview",
            assigned_by="admin",
            assigned_at=datetime.now(),
            expires_at=None
        )
        
        # Assign test user to tier
        self.manager.assign_tier(self.test_assignment)
    
    def tearDown(self):
        """Clean up after tests."""
        # Remove temporary directory
        import shutil
        shutil.rmtree(self.test_dir)
    
    def test_register_tier(self):
        """Test registering a new tier."""
        # Create a new tier
        new_tier = TierDefinition(
            id="public_beta",
            name="Public Beta",
            description="Public beta access",
            permissions=["read:basic", "write:basic", "read:advanced", "write:advanced"],
            rate_limits=RateLimits(
                requests_per_minute=180,
                requests_per_day=30000
            )
        )
        
        # Register the tier
        result = self.manager.register_tier(new_tier)
        
        # Verify registration was successful
        self.assertTrue(result)
        self.assertIn("public_beta", self.manager.tiers)
        self.assertEqual(self.manager.tiers["public_beta"].name, "Public Beta")
    
    def test_get_tier(self):
        """Test retrieving a tier by ID."""
        # Get an existing tier
        tier = self.manager.get_tier("developer_preview")
        
        # Verify the tier was retrieved correctly
        self.assertIsNotNone(tier)
        self.assertEqual(tier.id, "developer_preview")
        self.assertEqual(tier.name, "Developer Preview")
        
        # Try to get a non-existent tier
        tier = self.manager.get_tier("non_existent")
        
        # Verify None is returned
        self.assertIsNone(tier)
    
    def test_list_tiers(self):
        """Test listing all tiers."""
        # List all tiers
        tiers = self.manager.list_tiers()
        
        # Verify the correct number of tiers is returned
        self.assertEqual(len(tiers), 2)
        
        # Verify the tiers are correct
        tier_ids = [tier.id for tier in tiers]
        self.assertIn("developer_preview", tier_ids)
        self.assertIn("partner_access", tier_ids)
    
    def test_assign_tier(self):
        """Test assigning a user to a tier."""
        # Create a new assignment
        assignment = TierAssignment(
            user_id="user456",
            tier_id="partner_access",
            assigned_by="admin",
            assigned_at=datetime.now(),
            expires_at=None
        )
        
        # Assign the user to the tier
        result = self.manager.assign_tier(assignment)
        
        # Verify assignment was successful
        self.assertTrue(result)
        self.assertIn("user456", self.manager.assignments)
        self.assertEqual(self.manager.assignments["user456"].tier_id, "partner_access")
    
    def test_get_user_tier(self):
        """Test retrieving a user's tier."""
        # Get an existing user's tier
        tier = self.manager.get_user_tier("user123")
        
        # Verify the tier was retrieved correctly
        self.assertIsNotNone(tier)
        self.assertEqual(tier.id, "developer_preview")
        
        # Try to get a non-existent user's tier
        tier = self.manager.get_user_tier("non_existent")
        
        # Verify None is returned
        self.assertIsNone(tier)
    
    def test_check_access(self):
        """Test checking if a user has access to an endpoint."""
        # Check access for a permitted endpoint
        result = self.manager.check_access("user123", "/api/basic", "GET")
        
        # Verify access is granted
        self.assertTrue(result)
        
        # Check access for a non-permitted endpoint
        result = self.manager.check_access("user123", "/api/advanced", "GET")
        
        # Verify access is denied
        self.assertFalse(result)
    
    def test_track_usage(self):
        """Test tracking API usage."""
        # Track some usage
        self.manager.track_usage(
            user_id="user123",
            endpoint="/api/basic",
            method="GET",
            status_code=200,
            response_time=50
        )
        
        # Verify usage was tracked
        self.assertEqual(len(self.manager.usage_records), 1)
        self.assertEqual(self.manager.usage_records[0].user_id, "user123")
        self.assertEqual(self.manager.usage_records[0].endpoint, "/api/basic")
    
    def test_check_rate_limit(self):
        """Test checking if a user has exceeded their rate limit."""
        # Initially, the user should be within their rate limit
        result = self.manager.check_rate_limit("user123")
        self.assertTrue(result)
        
        # Track usage that exceeds the rate limit
        for i in range(70):  # More than the 60 requests per minute limit
            self.manager.track_usage(
                user_id="user123",
                endpoint="/api/basic",
                method="GET",
                status_code=200,
                response_time=50
            )
        
        # Now the user should exceed their rate limit
        result = self.manager.check_rate_limit("user123")
        self.assertFalse(result)
    
    def test_evaluate_progression(self):
        """Test evaluating users for tier progression."""
        # Create a user with enough usage to qualify for progression
        assignment = TierAssignment(
            user_id="user789",
            tier_id="developer_preview",
            assigned_by="admin",
            assigned_at=datetime.now() - timedelta(days=60),  # More than the 30 days required
            expires_at=None
        )
        
        # Assign the user to the tier
        self.manager.assign_tier(assignment)
        
        # Track enough successful requests to qualify for progression
        for i in range(1200):  # More than the 1000 requests required
            self.manager.track_usage(
                user_id="user789",
                endpoint="/api/basic",
                method="GET",
                status_code=200,
                response_time=50
            )
        
        # Evaluate progression
        candidates = self.manager.evaluate_progression()
        
        # Verify the user is a candidate for progression
        self.assertEqual(len(candidates), 1)
        self.assertEqual(candidates[0].user_id, "user789")
        self.assertEqual(candidates[0].current_tier_id, "developer_preview")
        self.assertEqual(candidates[0].next_tier_id, "partner_access")


class AccessTierPersistenceTests(unittest.TestCase):
    """Test cases for the AccessTierPersistence class."""
    
    def setUp(self):
        """Set up test environment."""
        # Create a temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        
        # Initialize the persistence layer
        self.persistence = AccessTierPersistence(self.test_dir)
        
        # Create test tiers
        self.tiers = {
            "developer_preview": TierDefinition(
                id="developer_preview",
                name="Developer Preview",
                description="Limited access for early developers",
                permissions=["read:basic", "write:basic"],
                rate_limits=RateLimits(
                    requests_per_minute=60,
                    requests_per_day=10000
                )
            ),
            "partner_access": TierDefinition(
                id="partner_access",
                name="Partner Access",
                description="Extended access for partners",
                permissions=["read:basic", "write:basic", "read:advanced"],
                rate_limits=RateLimits(
                    requests_per_minute=120,
                    requests_per_day=20000
                )
            )
        }
        
        # Create test assignments
        self.assignments = {
            "user123": TierAssignment(
                user_id="user123",
                tier_id="developer_preview",
                assigned_by="admin",
                assigned_at=datetime.now(),
                expires_at=None
            ),
            "user456": TierAssignment(
                user_id="user456",
                tier_id="partner_access",
                assigned_by="admin",
                assigned_at=datetime.now(),
                expires_at=datetime.now() + timedelta(days=90)
            )
        }
    
    def tearDown(self):
        """Clean up after tests."""
        # Remove temporary directory
        import shutil
        shutil.rmtree(self.test_dir)
    
    def test_save_and_load_tiers(self):
        """Test saving and loading tiers."""
        # Save tiers
        result = self.persistence.save_tiers(self.tiers)
        
        # Verify save was successful
        self.assertTrue(result)
        self.assertTrue(os.path.exists(self.persistence.tiers_file))
        
        # Load tiers
        loaded_tiers = self.persistence.load_tiers()
        
        # Verify tiers were loaded correctly
        self.assertEqual(len(loaded_tiers), 2)
        self.assertIn("developer_preview", loaded_tiers)
        self.assertIn("partner_access", loaded_tiers)
        self.assertEqual(loaded_tiers["developer_preview"].name, "Developer Preview")
        self.assertEqual(loaded_tiers["partner_access"].name, "Partner Access")
    
    def test_save_and_load_assignments(self):
        """Test saving and loading assignments."""
        # Save assignments
        result = self.persistence.save_assignments(self.assignments)
        
        # Verify save was successful
        self.assertTrue(result)
        self.assertTrue(os.path.exists(self.persistence.assignments_file))
        
        # Load assignments
        loaded_assignments = self.persistence.load_assignments()
        
        # Verify assignments were loaded correctly
        self.assertEqual(len(loaded_assignments), 2)
        self.assertIn("user123", loaded_assignments)
        self.assertIn("user456", loaded_assignments)
        self.assertEqual(loaded_assignments["user123"].tier_id, "developer_preview")
        self.assertEqual(loaded_assignments["user456"].tier_id, "partner_access")


if __name__ == "__main__":
    unittest.main()
