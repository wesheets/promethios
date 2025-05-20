"""
Unit tests for Attestation Service component of Phase 5.6.

This module contains tests for the attestation_service.py implementation,
ensuring proper attestation functionality in the distributed trust system.

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
from src.core.trust.attestation_service import AttestationService
from src.core.common.schema_validator import SchemaValidator

@pytest.mark.phase_5_6
class TestAttestationService(unittest.TestCase):
    """Test cases for the AttestationService class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with real dependencies
        self.schema_validator = SchemaValidator(schema_dir="schemas")
        self.attestation_service = AttestationService(self.schema_validator)
        
        # Test data
        self.node_id = str(uuid.uuid4())
        self.surface_id = str(uuid.uuid4())
        self.attestation_type = "trust_surface_validation"
        self.metadata = {"confidence_score": 0.95, "description": "Test attestation"}
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        attestation_service = AttestationService(self.schema_validator)
        self.assertIsNotNone(attestation_service)
        
    def test_init_without_schema_validator(self):
        """Test initialization without schema validator."""
        with self.assertRaises(ValueError):
            AttestationService(None)
            
    def test_create_attestation(self):
        """Test creating an attestation."""
        attestation = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            self.attestation_type,
            self.metadata
        )
        
        # Verify attestation structure
        self.assertIn("attestation_id", attestation)
        self.assertEqual(attestation["attester_node_id"], self.node_id)
        self.assertEqual(attestation["surface_id"], self.surface_id)
        self.assertEqual(attestation["attestation_type"], self.attestation_type)
        self.assertEqual(attestation["metadata"]["confidence_score"], 0.95)
        self.assertIn("signature", attestation)
        self.assertEqual(attestation["status"], "valid")
        
    def test_validate_attestation(self):
        """Test validating an attestation."""
        attestation = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            self.attestation_type,
            self.metadata
        )
        
        # Should not raise an exception
        self.attestation_service.validate_attestation(attestation)
        
    def test_validate_invalid_attestation(self):
        """Test validating an invalid attestation."""
        attestation = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            self.attestation_type,
            self.metadata
        )
        
        # Corrupt the attestation
        attestation.pop("attestation_id")
        
        with self.assertRaises(ValueError):
            self.attestation_service.validate_attestation(attestation)
            
    def test_verify_attestation(self):
        """Test verifying an attestation signature."""
        attestation = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            self.attestation_type,
            self.metadata
        )
        
        # Should return True for valid attestation
        result = self.attestation_service.verify_attestation(attestation)
        self.assertTrue(result)
        
    def test_verify_invalid_attestation(self):
        """Test verifying an invalid attestation signature."""
        attestation = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            self.attestation_type,
            self.metadata
        )
        
        # Corrupt the signature
        attestation["signature"] = "invalid_signature"
        
        # Should return False for invalid attestation
        result = self.attestation_service.verify_attestation(attestation)
        self.assertFalse(result)
        
    def test_get_attestation(self):
        """Test retrieving an attestation."""
        attestation = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            self.attestation_type,
            self.metadata
        )
        
        retrieved_attestation = self.attestation_service.get_attestation(attestation["attestation_id"])
        
        # Verify retrieved attestation
        self.assertEqual(retrieved_attestation["attestation_id"], attestation["attestation_id"])
        
    def test_get_nonexistent_attestation(self):
        """Test retrieving a non-existent attestation."""
        with self.assertRaises(ValueError):
            self.attestation_service.get_attestation("nonexistent-id")
            
    def test_list_attestations(self):
        """Test listing all attestations."""
        # Create multiple attestations
        attestation1 = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            "trust_surface_validation",
            {"confidence_score": 0.95}
        )
        
        attestation2 = self.attestation_service.create_attestation(
            self.node_id,
            str(uuid.uuid4()),  # Different surface_id
            "boundary_validation",
            {"confidence_score": 0.85}
        )
        
        attestations = self.attestation_service.list_attestations()
        
        # Verify attestations list
        self.assertEqual(len(attestations), 2)
        self.assertIn(attestation1["attestation_id"], [a["attestation_id"] for a in attestations])
        self.assertIn(attestation2["attestation_id"], [a["attestation_id"] for a in attestations])
        
    def test_filter_attestations_by_type(self):
        """Test filtering attestations by type."""
        # Create multiple attestations
        attestation1 = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            "trust_surface_validation",
            {"confidence_score": 0.95}
        )
        
        attestation2 = self.attestation_service.create_attestation(
            self.node_id,
            str(uuid.uuid4()),  # Different surface_id
            "boundary_validation",
            {"confidence_score": 0.85}
        )
        
        filtered_attestations = self.attestation_service.filter_attestations_by_type("trust_surface_validation")
        
        # Verify filtered attestations
        self.assertEqual(len(filtered_attestations), 1)
        self.assertEqual(filtered_attestations[0]["attestation_id"], attestation1["attestation_id"])
        
    def test_filter_attestations_by_surface(self):
        """Test filtering attestations by surface ID."""
        # Create multiple attestations
        attestation1 = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            "trust_surface_validation",
            {"confidence_score": 0.95}
        )
        
        attestation2 = self.attestation_service.create_attestation(
            self.node_id,
            str(uuid.uuid4()),  # Different surface_id
            "boundary_validation",
            {"confidence_score": 0.85}
        )
        
        filtered_attestations = self.attestation_service.filter_attestations_by_surface(self.surface_id)
        
        # Verify filtered attestations
        self.assertEqual(len(filtered_attestations), 1)
        self.assertEqual(filtered_attestations[0]["attestation_id"], attestation1["attestation_id"])
        
    def test_get_trust_chain(self):
        """Test getting the trust chain for an attestation."""
        # Create a base attestation
        base_attestation = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            "trust_surface_validation",
            {"confidence_score": 0.95}
        )
        
        # Create a second attestation that validates the first
        second_node_id = str(uuid.uuid4())
        second_attestation = self.attestation_service.create_attestation(
            second_node_id,
            self.surface_id,
            "attestation_validation",
            {
                "confidence_score": 0.90,
                "validated_attestation_id": base_attestation["attestation_id"]
            }
        )
        
        # Get the trust chain
        chain = self.attestation_service.get_trust_chain(second_attestation["attestation_id"])
        
        # Verify chain
        self.assertEqual(len(chain), 2)
        self.assertEqual(chain[0]["attestation_id"], second_attestation["attestation_id"])
        self.assertEqual(chain[1]["attestation_id"], base_attestation["attestation_id"])
        
    def test_revoke_attestation(self):
        """Test revoking an attestation."""
        attestation = self.attestation_service.create_attestation(
            self.node_id,
            self.surface_id,
            self.attestation_type,
            self.metadata
        )
        
        # Revoke the attestation
        revoked_attestation = self.attestation_service.revoke_attestation(attestation["attestation_id"])
        
        # Verify revoked status
        self.assertEqual(revoked_attestation["status"], "revoked")
        
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should return True for valid contract and phase
        result = self.attestation_service._codex_tether_check()
        self.assertTrue(result)
        
if __name__ == '__main__':
    unittest.main()
