"""
Unit tests for the BoundaryEnforcementModule class.

This module contains unit tests for the BoundaryEnforcementModule class,
which is responsible for enforcing governance boundaries and policies.
"""

import unittest
import json
import uuid
import datetime
from unittest.mock import MagicMock, patch
from pathlib import Path
import sys
import os

# Add the src directory to the path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

# Import the class to test
from src.core.governance.boundary_enforcement_module import BoundaryEnforcementModule


class TestBoundaryEnforcementModule(unittest.TestCase):
    """Test cases for the BoundaryEnforcementModule class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a mock configuration
        self.config = {
            'storage_path': '/tmp/test_policies',
            'schema_path': '/tmp/test_schemas/policy.schema.v1.json'
        }
        
        # Create mock dependencies
        self.mock_schema_validator = MagicMock()
        self.mock_schema_validator.validate.return_value = True
        
        self.mock_attestation_service = MagicMock()
        # Add find_attestations method to mock for compatibility with both naming conventions
        self.mock_attestation_service.find_attestations = MagicMock()
        self.mock_attestation_service.list_attestations = self.mock_attestation_service.find_attestations
        
        self.mock_audit_trail = MagicMock()
        
        # Create a test directory
        Path(self.config['storage_path']).mkdir(parents=True, exist_ok=True)
        
        # Create the module with mocked dependencies
        with patch('src.core.governance.boundary_enforcement_module.SchemaValidator', return_value=self.mock_schema_validator):
            self.module = BoundaryEnforcementModule(self.config)
            self.module.attestation_service = self.mock_attestation_service
            self.module.audit_trail = self.mock_audit_trail
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test files
        import shutil
        if Path(self.config['storage_path']).exists():
            shutil.rmtree(self.config['storage_path'])
    
    def test_init(self):
        """Test initialization of the module."""
        self.assertEqual(self.module.config, self.config)
        self.assertEqual(self.module.storage_path, self.config['storage_path'])
        self.assertIsNotNone(self.module.schema_validator)
    
    def test_create_policy(self):
        """Test creating a policy."""
        # Define test data
        name = "Test Policy"
        description = "A test policy"
        policy_type = "ATTESTATION_REQUIREMENT"
        scope = {"domain": "test-domain"}
        rules = {
            "required_attestations": 2,
            "required_attestation_types": ["VERIFICATION"],
            "required_authority_level": "HIGH"
        }
        
        # Create policy
        policy = self.module.create_policy(
            name=name,
            description=description,
            policy_type=policy_type,
            scope=scope,
            rules=rules
        )
        
        # Verify policy
        self.assertIsNotNone(policy)
        self.assertIn("policy_id", policy)
        self.assertEqual(policy["name"], name)
        self.assertEqual(policy["description"], description)
        self.assertEqual(policy["policy_type"], policy_type)
        self.assertEqual(policy["scope"], scope)
        self.assertEqual(policy["rules"], rules)
        self.assertIn("created_at", policy)
        self.assertEqual(policy["status"], self.module.STATUS_ACTIVE)
        
        # Verify schema validation was called
        self.mock_schema_validator.validate.assert_called_once()
    
    def test_get_policy(self):
        """Test getting a policy."""
        # Create a policy first
        policy = self.module.create_policy(
            name="Test Policy",
            description="A test policy",
            policy_type="ATTESTATION_REQUIREMENT",
            scope={"domain": "test-domain"},
            rules={"required_attestations": 1}
        )
        
        # Get the policy
        retrieved = self.module.get_policy(policy["policy_id"])
        
        # Verify it's the same
        self.assertEqual(retrieved, policy)
        
        # Test getting a non-existent policy
        non_existent = self.module.get_policy("non-existent")
        self.assertIsNone(non_existent)
    
    def test_enforce_attestation_requirement(self):
        """Test enforcing attestation requirement."""
        # Create a policy
        policy = self.module.create_policy(
            name="Attestation Requirement",
            description="Requires attestations",
            policy_type="ATTESTATION_REQUIREMENT",
            scope={"domain": "test-domain"},
            rules={
                "required_attestations": 2,
                "required_attestation_types": ["VERIFICATION"],
                "required_authority_level": "HIGH"
            }
        )
        
        # Mock attestation service to return attestations
        self.mock_attestation_service.find_attestations.return_value = [
            {
                "attestation_id": "att1",
                "issuer_id": "auth1",
                "attestation_type": "VERIFICATION"
            },
            {
                "attestation_id": "att2",
                "issuer_id": "auth2",
                "attestation_type": "VERIFICATION"
            }
        ]
        
        # Mock attestation validation to return valid
        self.mock_attestation_service.validate_attestation.return_value = (True, {})
        
        # Enforce policy
        entity_id = "test-entity"
        is_compliant, details = self.module.enforce_policy(
            policy_id=policy["policy_id"],
            entity_id=entity_id
        )
        
        # Should be compliant
        self.assertTrue(is_compliant)
        self.assertIn("valid_attestations", details)
        self.assertEqual(details["valid_attestations"], 2)
        
        # Verify attestation service was called
        self.mock_attestation_service.find_attestations.assert_called_once_with(
            subject_id=entity_id,
            attestation_type="VERIFICATION",
            active_only=True
        )
        
        # Verify audit trail was called
        self.mock_audit_trail.log_event.assert_called_once()
    
    def test_enforce_policy_insufficient_attestations(self):
        """Test enforcing policy with insufficient attestations."""
        # Create a policy
        policy = self.module.create_policy(
            name="Attestation Requirement",
            description="Requires attestations",
            policy_type="ATTESTATION_REQUIREMENT",
            scope={"domain": "test-domain"},
            rules={
                "required_attestations": 2,
                "required_attestation_types": ["VERIFICATION"],
                "required_authority_level": "HIGH"
            }
        )
        
        # Mock attestation service to return 1 attestation
        self.mock_attestation_service.find_attestations.return_value = [
            {
                "attestation_id": "att1",
                "issuer_id": "auth1",
                "attestation_type": "VERIFICATION"
            }
        ]
        
        # Mock attestation validation to return valid
        self.mock_attestation_service.validate_attestation.return_value = (True, {})
        
        # Enforce policy
        entity_id = "test-entity"
        is_compliant, details = self.module.enforce_policy(
            policy_id=policy["policy_id"],
            entity_id=entity_id
        )
        
        # Should not be compliant
        self.assertFalse(is_compliant)
        self.assertIn("error", details)
        self.assertIn("Insufficient attestations", details["error"])
        
        # Verify attestation service was called
        self.mock_attestation_service.find_attestations.assert_called_once()
        
        # Verify audit trail was called
        self.mock_audit_trail.log_event.assert_called_once()
    
    def test_enforce_policy(self):
        """Test enforcing a policy."""
        # Create a policy
        policy = self.module.create_policy(
            name="Test Policy",
            description="A test policy",
            policy_type="ATTESTATION_REQUIREMENT",
            scope={"domain": "test-domain"},
            rules={
                "required_attestations": 2,
                "required_attestation_types": ["VERIFICATION"],
                "required_authority_level": "HIGH"
            }
        )
        
        # Mock attestation service to return attestations
        self.mock_attestation_service.find_attestations.return_value = [
            {
                "attestation_id": "att1",
                "issuer_id": "auth1",
                "attestation_type": "VERIFICATION"
            },
            {
                "attestation_id": "att2",
                "issuer_id": "auth2",
                "attestation_type": "VERIFICATION"
            }
        ]
        
        # Mock attestation validation to return valid
        self.mock_attestation_service.validate_attestation.return_value = (True, {})
        
        # Enforce policy
        entity_id = "test-entity"
        is_compliant, details = self.module.enforce_policy(
            policy_id=policy["policy_id"],
            entity_id=entity_id
        )
        
        # Should be compliant
        self.assertTrue(is_compliant)
        
        # Verify attestation service was called
        self.mock_attestation_service.find_attestations.assert_called_once()
        
        # Verify audit trail was called
        self.mock_audit_trail.log_event.assert_called_once()
    
    def test_find_applicable_policies(self):
        """Test finding applicable policies."""
        # Create multiple policies
        policy1 = self.module.create_policy(
            name="Policy 1",
            description="First test policy",
            policy_type="ATTESTATION_REQUIREMENT",
            scope={"domain": "domain1"},
            rules={"required_attestations": 1}
        )
        
        policy2 = self.module.create_policy(
            name="Policy 2",
            description="Second test policy",
            policy_type="ATTESTATION_REQUIREMENT",
            scope={"domain": "domain2"},
            rules={"required_attestations": 2}
        )
        
        policy3 = self.module.create_policy(
            name="Policy 3",
            description="Third test policy",
            policy_type="BOUNDARY_CONSTRAINT",
            scope={"domain": "domain1"},
            rules={"constraint_type": "MAX_OPERATIONS"}
        )
        
        # Find by domain
        domain1_policies = self.module.find_applicable_policies(domain="domain1")
        self.assertEqual(len(domain1_policies), 2)
        policy_ids = [p["policy_id"] for p in domain1_policies]
        self.assertIn(policy1["policy_id"], policy_ids)
        self.assertIn(policy3["policy_id"], policy_ids)
        
        # Find by type
        attestation_policies = self.module.find_applicable_policies(policy_type="ATTESTATION_REQUIREMENT")
        self.assertEqual(len(attestation_policies), 2)
        policy_ids = [p["policy_id"] for p in attestation_policies]
        self.assertIn(policy1["policy_id"], policy_ids)
        self.assertIn(policy2["policy_id"], policy_ids)
        
        # Find by multiple criteria
        filtered_policies = self.module.find_applicable_policies(
            domain="domain1",
            policy_type="ATTESTATION_REQUIREMENT"
        )
        self.assertEqual(len(filtered_policies), 1)
        self.assertEqual(filtered_policies[0]["policy_id"], policy1["policy_id"])


if __name__ == '__main__':
    unittest.main()
