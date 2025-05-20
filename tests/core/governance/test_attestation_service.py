"""
Tests for Attestation Service in Promethios Distributed Trust Surface

Codex Contract: v2025.05.18
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""

import unittest
import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

# Updated import for canonical structure
from src.core.governance.attestation_service import AttestationService
from src.core.governance.trust_boundary_manager import TrustBoundaryManager

class TestAttestationService(unittest.TestCase):
    """Test suite for the Attestation Service."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.instance_id = "test-instance-001"
        self.schema_validator = MagicMock()
        self.schema_validator.validate.return_value = (True, None)
        
        # Create a mock Trust Boundary Manager
        self.trust_boundary_manager = MagicMock(spec=TrustBoundaryManager)
        
        # Create the Attestation Service
        self.service = AttestationService(
            instance_id=self.instance_id,
            schema_validator=self.schema_validator,
            trust_boundary_manager=self.trust_boundary_manager
        )
    
    def test_create_attestation(self):
        """Test creating an attestation."""
        # Create an attestation
        attestation_type = "identity"
        subject_id = "subject-001"
        attestation_data = {"identity": "test-identity"}
        
        attestation = self.service.create_attestation(
            attestation_type=attestation_type,
            subject_instance_id=subject_id,
            attestation_data=attestation_data
        )
        
        # Verify the attestation was created correctly
        self.assertIsNotNone(attestation)
        self.assertIn("attestation_id", attestation)
        self.assertEqual(attestation["attestation_type"], attestation_type)
        self.assertEqual(attestation["subject_instance_id"], subject_id)
        self.assertEqual(attestation["attester_instance_id"], self.instance_id)
        self.assertEqual(attestation["attestation_data"], attestation_data)
        self.assertEqual(attestation["status"], "active")
        
        # Verify the attestation was added to the service
        attestations = self.service.list_attestations()
        self.assertEqual(len(attestations), 1)
        self.assertEqual(attestations[0]["attestation_id"], attestation["attestation_id"])
    
    def test_verify_attestation(self):
        """Test verifying an attestation."""
        # Create an attestation
        attestation = self.service.create_attestation(
            attestation_type="identity",
            subject_instance_id="subject-001",
            attestation_data={"identity": "test-identity"}
        )
        
        # Verify the attestation
        is_valid, result = self.service.verify_attestation(
            attestation_id=attestation["attestation_id"]
        )
        
        # Verify the result
        self.assertTrue(is_valid)
        self.assertEqual(result["attestation_id"], attestation["attestation_id"])
        self.assertEqual(result["verification_status"], "valid")
    
    def test_revoke_attestation(self):
        """Test revoking an attestation."""
        # Create an attestation
        attestation = self.service.create_attestation(
            attestation_type="identity",
            subject_instance_id="subject-001",
            attestation_data={"identity": "test-identity"}
        )
        
        # Revoke the attestation
        revoked = self.service.revoke_attestation(
            attestation_id=attestation["attestation_id"],
            reason="Test revocation"
        )
        
        # Verify the attestation was revoked
        self.assertTrue(revoked)
        
        # Get the revoked attestation
        attestations = self.service.list_attestations(
            attestation_id=attestation["attestation_id"]
        )
        self.assertEqual(len(attestations), 1)
        self.assertEqual(attestations[0]["status"], "revoked")
        self.assertEqual(attestations[0]["revocation_reason"], "Test revocation")
        
        # Verify the revoked attestation
        is_valid, result = self.service.verify_attestation(
            attestation_id=attestation["attestation_id"]
        )
        self.assertFalse(is_valid)
        self.assertEqual(result["verification_status"], "revoked")
    
    def test_list_attestations_with_filters(self):
        """Test listing attestations with filters."""
        # Create multiple attestations
        self.service.create_attestation(
            attestation_type="identity",
            subject_instance_id="subject-001",
            attestation_data={"identity": "identity-001"}
        )
        
        self.service.create_attestation(
            attestation_type="identity",
            subject_instance_id="subject-002",
            attestation_data={"identity": "identity-002"}
        )
        
        self.service.create_attestation(
            attestation_type="capability",
            subject_instance_id="subject-001",
            attestation_data={"capability": "capability-001"}
        )
        
        # Test filtering by subject instance
        attestations = self.service.list_attestations(
            subject_instance_id="subject-001"
        )
        self.assertEqual(len(attestations), 2)
        
        # Test filtering by attestation type
        attestations = self.service.list_attestations(
            attestation_type="identity"
        )
        self.assertEqual(len(attestations), 2)
        
        # Test filtering by both subject and type
        attestations = self.service.list_attestations(
            subject_instance_id="subject-001",
            attestation_type="identity"
        )
        self.assertEqual(len(attestations), 1)
    
    def test_create_attestation_chain(self):
        """Test creating an attestation chain."""
        # Create a root attestation
        root_attestation = self.service.create_attestation(
            attestation_type="identity",
            subject_instance_id="subject-001",
            attestation_data={"identity": "identity-001"}
        )
        
        # Create a chained attestation
        chained_attestation = self.service.create_attestation_chain(
            parent_attestation_id=root_attestation["attestation_id"],
            attestation_type="capability",
            subject_instance_id="subject-001",
            attestation_data={"capability": "capability-001"}
        )
        
        # Verify the chained attestation
        self.assertIsNotNone(chained_attestation)
        self.assertIn("attestation_id", chained_attestation)
        self.assertEqual(chained_attestation["parent_attestation_id"], root_attestation["attestation_id"])
        
        # Verify the chain
        chain = self.service.get_attestation_chain(
            attestation_id=chained_attestation["attestation_id"]
        )
        self.assertEqual(len(chain), 2)
        self.assertEqual(chain[0]["attestation_id"], chained_attestation["attestation_id"])
        self.assertEqual(chain[1]["attestation_id"], root_attestation["attestation_id"])
    
    def test_verify_attestation_chain(self):
        """Test verifying an attestation chain."""
        # Create a root attestation
        root_attestation = self.service.create_attestation(
            attestation_type="identity",
            subject_instance_id="subject-001",
            attestation_data={"identity": "identity-001"}
        )
        
        # Create a chained attestation
        chained_attestation = self.service.create_attestation_chain(
            parent_attestation_id=root_attestation["attestation_id"],
            attestation_type="capability",
            subject_instance_id="subject-001",
            attestation_data={"capability": "capability-001"}
        )
        
        # Verify the chain
        is_valid, result = self.service.verify_attestation_chain(
            attestation_id=chained_attestation["attestation_id"]
        )
        
        # Verify the result
        self.assertTrue(is_valid)
        self.assertEqual(len(result["chain"]), 2)
        self.assertEqual(result["verification_status"], "valid")
        
        # Revoke the root attestation
        self.service.revoke_attestation(
            attestation_id=root_attestation["attestation_id"],
            reason="Test revocation"
        )
        
        # Verify the chain again
        is_valid, result = self.service.verify_attestation_chain(
            attestation_id=chained_attestation["attestation_id"]
        )
        
        # Chain should be invalid if root is revoked
        self.assertFalse(is_valid)
        self.assertEqual(result["verification_status"], "invalid")
        self.assertEqual(result["reason"], "Chain contains revoked attestation")
    
    def test_schema_validation(self):
        """Test schema validation during attestation creation."""
        # Mock schema validator to fail
        self.schema_validator.validate.return_value = (False, "Invalid schema")
        
        # Attempt to create an attestation
        with self.assertRaises(ValueError):
            self.service.create_attestation(
                attestation_type="identity",
                subject_instance_id="subject-001",
                attestation_data={"identity": "test-identity"}
            )
        
        # Verify schema validator was called
        self.schema_validator.validate.assert_called_once()
    
    def test_codex_tether_check(self):
        """Test Codex Contract tethering check."""
        result = self.service._codex_tether_check()
        
        self.assertIsNotNone(result)
        self.assertEqual(result["codex_contract_version"], "v2025.05.18")
        self.assertEqual(result["phase_id"], "5.6")
        self.assertIn("5.6", result["clauses"])
        self.assertEqual(result["component"], "AttestationService")
        self.assertEqual(result["status"], "compliant")

if __name__ == "__main__":
    unittest.main()
