"""
Tests for Trust Boundary Manager in Promethios Distributed Trust Surface

Codex Contract: v2025.05.20
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""

import unittest
import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

# Updated import for canonical structure
from src.core.governance.trust_boundary_manager import TrustBoundaryManager

class TestTrustBoundaryManager(unittest.TestCase):
    """Test suite for the Trust Boundary Manager."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.instance_id = "test-instance-001"
        self.schema_validator = MagicMock()
        self.schema_validator.validate.return_value = (True, None)
        
        # Create the Trust Boundary Manager
        self.manager = TrustBoundaryManager(
            instance_id=self.instance_id,
            schema_validator=self.schema_validator
        )
    
    def test_create_boundary(self):
        """Test creating a trust boundary."""
        # Create a boundary
        source_id = "source-instance-001"
        target_id = "target-instance-001"
        trust_level = 80
        
        boundary = self.manager.create_boundary(
            source_instance_id=source_id,
            target_instance_id=target_id,
            trust_level=trust_level
        )
        
        # Verify the boundary was created correctly
        self.assertIsNotNone(boundary)
        self.assertIn("boundary_id", boundary)
        self.assertEqual(boundary["source_instance_id"], source_id)
        self.assertEqual(boundary["target_instance_id"], target_id)
        self.assertEqual(boundary["trust_level"], trust_level)
        self.assertEqual(boundary["status"], "active")
        
        # Verify the boundary was added to the manager
        boundaries = self.manager.list_boundaries()
        self.assertEqual(len(boundaries), 1)
        self.assertEqual(boundaries[0]["boundary_id"], boundary["boundary_id"])
    
    def test_update_boundary(self):
        """Test updating a trust boundary."""
        # Create a boundary
        source_id = "source-instance-001"
        target_id = "target-instance-001"
        trust_level = 80
        
        boundary = self.manager.create_boundary(
            source_instance_id=source_id,
            target_instance_id=target_id,
            trust_level=trust_level
        )
        
        # Update the boundary
        new_trust_level = 90
        updated = self.manager.update_boundary(
            boundary_id=boundary["boundary_id"],
            trust_level=new_trust_level
        )
        
        # Verify the boundary was updated correctly
        self.assertTrue(updated)
        
        # Get the updated boundary
        boundaries = self.manager.list_boundaries(boundary_id=boundary["boundary_id"])
        self.assertEqual(len(boundaries), 1)
        self.assertEqual(boundaries[0]["trust_level"], new_trust_level)
    
    def test_revoke_boundary(self):
        """Test revoking a trust boundary."""
        # Create a boundary
        source_id = "source-instance-001"
        target_id = "target-instance-001"
        trust_level = 80
        
        boundary = self.manager.create_boundary(
            source_instance_id=source_id,
            target_instance_id=target_id,
            trust_level=trust_level
        )
        
        # Revoke the boundary
        revoked = self.manager.revoke_boundary(
            boundary_id=boundary["boundary_id"],
            reason="Test revocation"
        )
        
        # Verify the boundary was revoked correctly
        self.assertTrue(revoked)
        
        # Get the revoked boundary
        boundaries = self.manager.list_boundaries(boundary_id=boundary["boundary_id"])
        self.assertEqual(len(boundaries), 1)
        self.assertEqual(boundaries[0]["status"], "revoked")
        self.assertEqual(boundaries[0]["revocation_reason"], "Test revocation")
    
    def test_list_boundaries_with_filters(self):
        """Test listing boundaries with filters."""
        # Create multiple boundaries
        self.manager.create_boundary(
            source_instance_id="source-001",
            target_instance_id="target-001",
            trust_level=80
        )
        
        self.manager.create_boundary(
            source_instance_id="source-001",
            target_instance_id="target-002",
            trust_level=70
        )
        
        self.manager.create_boundary(
            source_instance_id="source-002",
            target_instance_id="target-001",
            trust_level=60
        )
        
        # Test filtering by source instance
        boundaries = self.manager.list_boundaries(source_instance_id="source-001")
        self.assertEqual(len(boundaries), 2)
        
        # Test filtering by target instance
        boundaries = self.manager.list_boundaries(target_instance_id="target-001")
        self.assertEqual(len(boundaries), 2)
        
        # Test filtering by both source and target
        boundaries = self.manager.list_boundaries(
            source_instance_id="source-001",
            target_instance_id="target-001"
        )
        self.assertEqual(len(boundaries), 1)
        
        # Test filtering by minimum trust level
        boundaries = self.manager.list_boundaries(min_trust_level=70)
        self.assertEqual(len(boundaries), 2)
    
    def test_create_boundary_policy(self):
        """Test creating a boundary policy."""
        # Create a boundary
        boundary = self.manager.create_boundary(
            source_instance_id="source-001",
            target_instance_id="target-001",
            trust_level=80
        )
        
        # Create a policy
        policy_config = {
            "allowed_operations": ["read", "write"],
            "data_access_rules": [
                {
                    "path_pattern": "/data/*",
                    "allowed_access_types": ["read"]
                }
            ]
        }
        
        policy = self.manager.create_boundary_policy(
            boundary_id=boundary["boundary_id"],
            policy_type="access_control",
            policy_config=policy_config
        )
        
        # Verify the policy was created correctly
        self.assertIsNotNone(policy)
        self.assertIn("policy_id", policy)
        self.assertEqual(policy["boundary_id"], boundary["boundary_id"])
        self.assertEqual(policy["policy_type"], "access_control")
        self.assertEqual(policy["policy_config"], policy_config)
        
        # Verify the policy was added to the manager
        policies = self.manager.list_boundary_policies(boundary_id=boundary["boundary_id"])
        self.assertEqual(len(policies), 1)
        self.assertEqual(policies[0]["policy_id"], policy["policy_id"])
    
    def test_enforce_boundary_policy(self):
        """Test enforcing a boundary policy."""
        # Create a boundary
        boundary = self.manager.create_boundary(
            source_instance_id="source-001",
            target_instance_id="target-001",
            trust_level=80
        )
        
        # Create a policy
        policy_config = {
            "allowed_operations": ["read", "write"],
            "data_access_rules": [
                {
                    "path_pattern": "/data/*",
                    "allowed_access_types": ["read"]
                }
            ]
        }
        
        self.manager.create_boundary_policy(
            boundary_id=boundary["boundary_id"],
            policy_type="access_control",
            policy_config=policy_config
        )
        
        # Test allowed operation
        is_allowed, reason = self.manager.enforce_boundary_policy(
            boundary_id=boundary["boundary_id"],
            operation="read",
            context={"data_path": "/data/file.txt"}
        )
        
        self.assertTrue(is_allowed)
        
        # Test disallowed operation
        is_allowed, reason = self.manager.enforce_boundary_policy(
            boundary_id=boundary["boundary_id"],
            operation="delete",
            context={"data_path": "/data/file.txt"}
        )
        
        self.assertFalse(is_allowed)
    
    def test_schema_validation(self):
        """Test schema validation during boundary creation."""
        # Mock schema validator to fail
        self.schema_validator.validate.return_value = (False, "Invalid schema")
        
        # Attempt to create a boundary
        with self.assertRaises(ValueError):
            self.manager.create_boundary(
                source_instance_id="source-001",
                target_instance_id="target-001",
                trust_level=80
            )
        
        # Verify schema validator was called
        self.schema_validator.validate.assert_called_once()
    
    def test_codex_tether_check(self):
        """Test Codex Contract tethering check."""
        result = self.manager._codex_tether_check()
        
        self.assertIsNotNone(result)
        self.assertEqual(result["codex_contract_version"], "v2025.05.20")
        self.assertEqual(result["phase_id"], "5.6")
        self.assertIn("5.6", result["clauses"])
        self.assertEqual(result["component"], "TrustBoundaryManager")
        self.assertEqual(result["status"], "compliant")

if __name__ == "__main__":
    unittest.main()
