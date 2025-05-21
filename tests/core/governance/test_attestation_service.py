"""
Unit tests for the AttestationService class.

This module contains unit tests for the AttestationService class,
which is responsible for creating, validating, and managing attestations.
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
from src.core.governance.attestation_service import AttestationService


class TestAttestationService(unittest.TestCase):
    """Test cases for the AttestationService class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a mock configuration
        self.config = {
            'storage_path': '/tmp/test_attestations',
            'schema_path': '/tmp/test_schemas/attestation.schema.v1.json'
        }
        
        # Create mock dependencies
        self.mock_schema_validator = MagicMock()
        self.mock_schema_validator.validate.return_value = True
        
        # Create a test directory
        Path(self.config['storage_path']).mkdir(parents=True, exist_ok=True)
        
        # Create the service with mocked dependencies
        with patch('src.core.governance.attestation_service.SchemaValidator', return_value=self.mock_schema_validator):
            with patch('src.core.governance.attestation_service.SealVerificationService'):
                self.service = AttestationService(self.config)
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test files
        import shutil
        if Path(self.config['storage_path']).exists():
            shutil.rmtree(self.config['storage_path'])
    
    def test_init(self):
        """Test initialization of the service."""
        self.assertEqual(self.service.config, self.config)
        self.assertEqual(self.service.storage_path, self.config['storage_path'])
        self.assertIsNotNone(self.service.schema_validator)
    
    def test_create_attestation(self):
        """Test creating an attestation."""
        # Define test data
        issuer_id = "test-issuer"
        subject_id = "test-subject"
        claim_id = "test-claim"
        attestation_type = "VERIFICATION"
        attestation_data = {
            "content": {"key": "value"},
            "context": {"domain": "test-domain"},
            "evidence_references": ["ref1", "ref2"]
        }
        signature = {
            "signature_value": "test-signature",
            "key_id": "test-key",
            "algorithm": "test-algorithm"
        }
        
        # Create attestation
        attestation = self.service.create_attestation(
            issuer_id=issuer_id,
            subject_id=subject_id,
            claim_id=claim_id,
            attestation_type=attestation_type,
            attestation_data=attestation_data,
            signature=signature
        )
        
        # Verify attestation
        self.assertIsNotNone(attestation)
        self.assertIn("attestation_id", attestation)
        self.assertEqual(attestation["issuer_id"], issuer_id)
        self.assertEqual(attestation["subject_id"], subject_id)
        self.assertEqual(attestation["claim_id"], claim_id)
        self.assertEqual(attestation["attestation_type"], attestation_type)
        self.assertEqual(attestation["attestation_data"], attestation_data)
        self.assertEqual(attestation["signature"], signature)
        self.assertIn("timestamp", attestation)
        self.assertIn("expiration", attestation)
        self.assertIn("metadata", attestation)
        self.assertEqual(attestation["metadata"]["revocation_status"], "ACTIVE")
        
        # Verify schema validation was called
        self.mock_schema_validator.validate.assert_called_once()
    
    def test_get_attestation(self):
        """Test getting an attestation."""
        # Create an attestation first
        attestation = self.service.create_attestation(
            issuer_id="test-issuer",
            subject_id="test-subject",
            claim_id="test-claim",
            attestation_type="VERIFICATION",
            attestation_data={"content": {"key": "value"}},
            signature={"signature_value": "test-signature"}
        )
        
        # Get the attestation
        retrieved = self.service.get_attestation(attestation["attestation_id"])
        
        # Verify it's the same
        self.assertEqual(retrieved, attestation)
        
        # Test getting a non-existent attestation
        non_existent = self.service.get_attestation("non-existent")
        self.assertIsNone(non_existent)
    
    def test_find_attestations(self):
        """Test finding attestations by criteria."""
        # Create multiple attestations
        attestation1 = self.service.create_attestation(
            issuer_id="issuer1",
            subject_id="subject1",
            claim_id="claim1",
            attestation_type="VERIFICATION",
            attestation_data={"content": {"key": "value1"}},
            signature={"signature_value": "signature1"}
        )
        
        attestation2 = self.service.create_attestation(
            issuer_id="issuer2",
            subject_id="subject1",
            claim_id="claim2",
            attestation_type="CERTIFICATION",
            attestation_data={"content": {"key": "value2"}},
            signature={"signature_value": "signature2"}
        )
        
        attestation3 = self.service.create_attestation(
            issuer_id="issuer1",
            subject_id="subject2",
            claim_id="claim3",
            attestation_type="VERIFICATION",
            attestation_data={"content": {"key": "value3"}},
            signature={"signature_value": "signature3"}
        )
        
        # Find by issuer
        issuer1_attestations = self.service.find_attestations(issuer_id="issuer1")
        self.assertEqual(len(issuer1_attestations), 2)
        self.assertIn(attestation1, issuer1_attestations)
        self.assertIn(attestation3, issuer1_attestations)
        
        # Find by subject
        subject1_attestations = self.service.find_attestations(subject_id="subject1")
        self.assertEqual(len(subject1_attestations), 2)
        self.assertIn(attestation1, subject1_attestations)
        self.assertIn(attestation2, subject1_attestations)
        
        # Find by type
        verification_attestations = self.service.find_attestations(attestation_type="VERIFICATION")
        self.assertEqual(len(verification_attestations), 2)
        self.assertIn(attestation1, verification_attestations)
        self.assertIn(attestation3, verification_attestations)
        
        # Find by multiple criteria
        filtered_attestations = self.service.find_attestations(
            issuer_id="issuer1",
            attestation_type="VERIFICATION"
        )
        self.assertEqual(len(filtered_attestations), 2)
        self.assertIn(attestation1, filtered_attestations)
        self.assertIn(attestation3, filtered_attestations)
    
    def test_revoke_attestation(self):
        """Test revoking an attestation."""
        # Create an attestation
        attestation = self.service.create_attestation(
            issuer_id="test-issuer",
            subject_id="test-subject",
            claim_id="test-claim",
            attestation_type="VERIFICATION",
            attestation_data={"content": {"key": "value"}},
            signature={"signature_value": "test-signature"}
        )
        
        # Verify it's active
        self.assertEqual(attestation["metadata"]["revocation_status"], "ACTIVE")
        
        # Revoke it
        reason = "Test revocation"
        actor_id = "test-actor"
        revoked = self.service.revoke_attestation(
            attestation_id=attestation["attestation_id"],
            reason=reason,
            actor_id=actor_id
        )
        
        # Verify it's revoked
        self.assertEqual(revoked["metadata"]["revocation_status"], "REVOKED")
        self.assertEqual(revoked["metadata"]["revocation_reason"], reason)
        self.assertEqual(revoked["metadata"]["revocation_actor"], actor_id)
        self.assertIn("revocation_timestamp", revoked["metadata"])
        
        # Get it again to verify persistence
        retrieved = self.service.get_attestation(attestation["attestation_id"])
        self.assertEqual(retrieved["metadata"]["revocation_status"], "REVOKED")
    
    def test_validate_attestation(self):
        """Test validating an attestation."""
        # Create an attestation
        attestation = self.service.create_attestation(
            issuer_id="test-issuer",
            subject_id="test-subject",
            claim_id="test-claim",
            attestation_type="VERIFICATION",
            attestation_data={"content": {"key": "value"}},
            signature={"signature_value": "test-signature"}
        )
        
        # Mock the signature verification
        with patch.object(self.service, '_verify_signature', return_value=(True, {})):
            # Validate it
            is_valid, details = self.service.validate_attestation(attestation["attestation_id"])
            
            # Verify it's valid
            self.assertTrue(is_valid)
            self.assertIn("validation_timestamp", details)
        
        # Test validation of a revoked attestation
        self.service.revoke_attestation(
            attestation_id=attestation["attestation_id"],
            reason="Test revocation",
            actor_id="test-actor"
        )
        
        is_valid, details = self.service.validate_attestation(attestation["attestation_id"])
        self.assertFalse(is_valid)
        self.assertIn("error", details)
        self.assertEqual(details["error"], "Attestation is revoked")
        
        # Test validation of a non-existent attestation
        is_valid, details = self.service.validate_attestation("non-existent")
        self.assertFalse(is_valid)
        self.assertIn("error", details)
        self.assertEqual(details["error"], "Attestation not found")
    
    def test_get_attestation_chain(self):
        """Test getting an attestation chain."""
        # Create a chain of attestations
        root = self.service.create_attestation(
            issuer_id="issuer1",
            subject_id="subject1",
            claim_id="claim1",
            attestation_type="VERIFICATION",
            attestation_data={"content": {"key": "root"}},
            signature={"signature_value": "signature1"}
        )
        
        child1 = self.service.create_attestation(
            issuer_id="issuer2",
            subject_id="subject2",
            claim_id="claim2",
            attestation_type="CERTIFICATION",
            attestation_data={"content": {"key": "child1"}},
            signature={"signature_value": "signature2"},
            parent_attestation_id=root["attestation_id"]
        )
        
        child2 = self.service.create_attestation(
            issuer_id="issuer3",
            subject_id="subject3",
            claim_id="claim3",
            attestation_type="APPROVAL",
            attestation_data={"content": {"key": "child2"}},
            signature={"signature_value": "signature3"},
            parent_attestation_id=child1["attestation_id"]
        )
        
        # Get the chain from the root
        chain = self.service.get_attestation_chain(root["attestation_id"])
        self.assertEqual(len(chain), 3)
        self.assertEqual(chain[0]["attestation_id"], root["attestation_id"])
        self.assertEqual(chain[1]["attestation_id"], child1["attestation_id"])
        self.assertEqual(chain[2]["attestation_id"], child2["attestation_id"])
        
        # Get the chain from a child
        chain = self.service.get_attestation_chain(child1["attestation_id"])
        self.assertEqual(len(chain), 2)
        self.assertEqual(chain[0]["attestation_id"], child1["attestation_id"])
        self.assertEqual(chain[1]["attestation_id"], child2["attestation_id"])
        
        # Get the chain from a leaf
        chain = self.service.get_attestation_chain(child2["attestation_id"])
        self.assertEqual(len(chain), 1)
        self.assertEqual(chain[0]["attestation_id"], child2["attestation_id"])
        
        # Test getting a chain for a non-existent attestation
        chain = self.service.get_attestation_chain("non-existent")
        self.assertEqual(len(chain), 0)


if __name__ == '__main__':
    unittest.main()
