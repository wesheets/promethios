"""
Unit tests for Boundary Enforcement Module component of Phase 5.6.

This module contains tests for the boundary_enforcement_module.py implementation,
ensuring proper boundary enforcement functionality in the distributed trust system.

This test suite implements Phase 5.6 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import unittest
import json
import uuid
import os
import sys
import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

# Import modules to be tested
from src.core.trust.boundary_enforcement_module import BoundaryEnforcementModule
from src.core.common.schema_validator import SchemaValidator

@pytest.mark.phase_5_6
class TestBoundaryEnforcementModule(unittest.TestCase):
    """Test cases for the BoundaryEnforcementModule class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with real dependencies
        self.schema_validator = SchemaValidator(schema_dir="schemas")
        self.boundary_enforcement = BoundaryEnforcementModule(self.schema_validator)
        
        # Test data
        self.boundary_id = str(uuid.uuid4())
        self.enforcement_level = "strict"
        self.protected_actions = ["read", "write"]
        self.metadata = {"auto_remediate": True, "description": "Test policy"}
        self.resource_id = str(uuid.uuid4())
        self.requester_id = str(uuid.uuid4())
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        boundary_enforcement = BoundaryEnforcementModule(self.schema_validator)
        self.assertIsNotNone(boundary_enforcement)
        
    def test_init_without_schema_validator(self):
        """Test initialization without schema validator."""
        with self.assertRaises(ValueError):
            BoundaryEnforcementModule(None)
            
    def test_create_enforcement_policy(self):
        """Test creating an enforcement policy."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,
            self.metadata
        )
        
        # Verify policy structure
        self.assertIn("policy_id", policy)
        self.assertEqual(policy["boundary_id"], self.boundary_id)
        self.assertEqual(policy["enforcement_level"], self.enforcement_level)
        self.assertEqual(policy["protected_actions"], self.protected_actions)
        self.assertEqual(policy["metadata"]["auto_remediate"], True)
        self.assertEqual(policy["status"], "active")
        self.assertEqual(policy["enforcement_logs"], [])
        
    def test_validate_enforcement_policy(self):
        """Test validating an enforcement policy."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,
            self.metadata
        )
        
        # Should not raise an exception
        self.boundary_enforcement.validate_enforcement_policy(policy)
        
    def test_validate_invalid_enforcement_policy(self):
        """Test validating an invalid enforcement policy."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,
            self.metadata
        )
        
        # Corrupt the policy
        policy.pop("policy_id")
        
        with self.assertRaises(ValueError):
            self.boundary_enforcement.validate_enforcement_policy(policy)
            
    def test_enforce_boundary_allowed(self):
        """Test enforcing a boundary with allowed access."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,
            self.metadata
        )
        
        # Test with allowed action
        result = self.boundary_enforcement.enforce_boundary(
            policy["policy_id"],
            self.resource_id,
            "read",
            self.requester_id
        )
        
        # Verify enforcement result
        self.assertIn("enforcement_id", result)
        self.assertEqual(result["resource_id"], self.resource_id)
        self.assertEqual(result["action"], "read")
        self.assertEqual(result["requester_id"], self.requester_id)
        self.assertTrue(result["access_granted"])
        self.assertNotIn("denial_reason", result)
        
    def test_enforce_boundary_denied(self):
        """Test enforcing a boundary with denied access."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,  # Only read and write are allowed
            self.metadata
        )
        
        # Test with disallowed action
        result = self.boundary_enforcement.enforce_boundary(
            policy["policy_id"],
            self.resource_id,
            "execute",  # Not in protected_actions
            self.requester_id
        )
        
        # Verify enforcement result
        self.assertIn("enforcement_id", result)
        self.assertEqual(result["resource_id"], self.resource_id)
        self.assertEqual(result["action"], "execute")
        self.assertEqual(result["requester_id"], self.requester_id)
        self.assertFalse(result["access_granted"])
        self.assertIn("denial_reason", result)
        
    def test_enforce_boundary_audit_only(self):
        """Test enforcing a boundary with audit-only level."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            "audit-only",  # Audit-only level always grants access
            self.protected_actions,
            self.metadata
        )
        
        # Test with action not in protected_actions
        result = self.boundary_enforcement.enforce_boundary(
            policy["policy_id"],
            self.resource_id,
            "execute",  # Not in protected_actions
            self.requester_id
        )
        
        # Verify enforcement result - should be granted in audit-only mode
        self.assertTrue(result["access_granted"])
        
    def test_get_enforcement_policy(self):
        """Test retrieving an enforcement policy."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,
            self.metadata
        )
        
        retrieved_policy = self.boundary_enforcement.get_enforcement_policy(policy["policy_id"])
        
        # Verify retrieved policy
        self.assertEqual(retrieved_policy["policy_id"], policy["policy_id"])
        
    def test_get_nonexistent_enforcement_policy(self):
        """Test retrieving a non-existent enforcement policy."""
        with self.assertRaises(ValueError):
            self.boundary_enforcement.get_enforcement_policy("nonexistent-id")
            
    def test_update_enforcement_policy(self):
        """Test updating an enforcement policy."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,
            self.metadata
        )
        
        new_level = "moderate"
        new_actions = ["read", "write", "execute"]
        new_metadata = {"auto_remediate": False, "description": "Updated test policy"}
        
        updated_policy = self.boundary_enforcement.update_enforcement_policy(
            policy["policy_id"],
            enforcement_level=new_level,
            protected_actions=new_actions,
            metadata=new_metadata
        )
        
        # Verify updated policy
        self.assertEqual(updated_policy["policy_id"], policy["policy_id"])
        self.assertEqual(updated_policy["enforcement_level"], new_level)
        self.assertEqual(updated_policy["protected_actions"], new_actions)
        self.assertEqual(updated_policy["metadata"]["auto_remediate"], False)
        
    def test_update_enforcement_policy_status(self):
        """Test updating an enforcement policy status."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,
            self.metadata
        )
        
        updated_policy = self.boundary_enforcement.update_enforcement_policy(
            policy["policy_id"],
            status="inactive"
        )
        
        # Verify updated status
        self.assertEqual(updated_policy["status"], "inactive")
        
    def test_update_enforcement_policy_invalid_status(self):
        """Test updating an enforcement policy with invalid status."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,
            self.metadata
        )
        
        with self.assertRaises(ValueError):
            self.boundary_enforcement.update_enforcement_policy(
                policy["policy_id"],
                status="invalid-status"
            )
            
    def test_list_enforcement_policies(self):
        """Test listing all enforcement policies."""
        # Create multiple policies
        policy1 = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            "strict",
            ["read", "write"],
            {"auto_remediate": True}
        )
        
        policy2 = self.boundary_enforcement.create_enforcement_policy(
            str(uuid.uuid4()),  # Different boundary_id
            "moderate",
            ["read"],
            {"auto_remediate": False}
        )
        
        policies = self.boundary_enforcement.list_enforcement_policies()
        
        # Verify policies list
        self.assertEqual(len(policies), 2)
        self.assertIn(policy1["policy_id"], [p["policy_id"] for p in policies])
        self.assertIn(policy2["policy_id"], [p["policy_id"] for p in policies])
        
    def test_filter_policies_by_boundary(self):
        """Test filtering policies by boundary ID."""
        # Create multiple policies
        policy1 = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            "strict",
            ["read", "write"],
            {"auto_remediate": True}
        )
        
        policy2 = self.boundary_enforcement.create_enforcement_policy(
            str(uuid.uuid4()),  # Different boundary_id
            "moderate",
            ["read"],
            {"auto_remediate": False}
        )
        
        filtered_policies = self.boundary_enforcement.filter_policies_by_boundary(self.boundary_id)
        
        # Verify filtered policies
        self.assertEqual(len(filtered_policies), 1)
        self.assertEqual(filtered_policies[0]["policy_id"], policy1["policy_id"])
        
    def test_get_enforcement_logs(self):
        """Test retrieving enforcement logs."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,
            self.metadata
        )
        
        # Generate some enforcement actions
        self.boundary_enforcement.enforce_boundary(
            policy["policy_id"],
            self.resource_id,
            "read",
            self.requester_id
        )
        
        self.boundary_enforcement.enforce_boundary(
            policy["policy_id"],
            self.resource_id,
            "execute",  # Should be denied
            self.requester_id
        )
        
        logs = self.boundary_enforcement.get_enforcement_logs(policy["policy_id"])
        
        # Verify logs
        self.assertEqual(len(logs), 2)
        self.assertTrue(logs[0]["access_granted"])
        self.assertFalse(logs[1]["access_granted"])
        
    def test_clear_enforcement_logs(self):
        """Test clearing enforcement logs."""
        policy = self.boundary_enforcement.create_enforcement_policy(
            self.boundary_id,
            self.enforcement_level,
            self.protected_actions,
            self.metadata
        )
        
        # Generate some enforcement actions
        self.boundary_enforcement.enforce_boundary(
            policy["policy_id"],
            self.resource_id,
            "read",
            self.requester_id
        )
        
        # Clear logs
        updated_policy = self.boundary_enforcement.clear_enforcement_logs(policy["policy_id"])
        
        # Verify logs are cleared
        self.assertEqual(len(updated_policy["enforcement_logs"]), 0)
        
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should return True for valid contract and phase
        result = self.boundary_enforcement._codex_tether_check()
        self.assertTrue(result)
        
if __name__ == '__main__':
    unittest.main()
