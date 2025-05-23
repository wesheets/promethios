"""
Unit tests for the ClaimVerificationProtocol class.

This module contains unit tests for the ClaimVerificationProtocol class,
which is responsible for creating, verifying, and managing claims.
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
from src.core.governance.claim_verification_protocol import ClaimVerificationProtocol


class TestClaimVerificationProtocol(unittest.TestCase):
    """Test cases for the ClaimVerificationProtocol class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a mock configuration
        self.config = {
            'storage_path': '/tmp/test_claims',
            'schema_path': '/tmp/test_schemas/claim.schema.v1.json'
        }
        
        # Create mock dependencies
        self.mock_schema_validator = MagicMock()
        self.mock_schema_validator.validate.return_value = True
        
        self.mock_attestation_service = MagicMock()
        
        # Create a test directory
        Path(self.config['storage_path']).mkdir(parents=True, exist_ok=True)
        
        # Create the protocol with mocked dependencies
        with patch('src.core.governance.claim_verification_protocol.SchemaValidator', return_value=self.mock_schema_validator):
            self.protocol = ClaimVerificationProtocol(self.config)
            self.protocol.attestation_service = self.mock_attestation_service
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test files
        import shutil
        if Path(self.config['storage_path']).exists():
            shutil.rmtree(self.config['storage_path'])
    
    def test_init(self):
        """Test initialization of the protocol."""
        self.assertEqual(self.protocol.config, self.config)
        self.assertEqual(self.protocol.storage_path, self.config['storage_path'])
        self.assertIsNotNone(self.protocol.schema_validator)
    
    def test_create_claim(self):
        """Test creating a claim."""
        # Define test data
        issuer_id = "test-issuer"
        subject_id = "test-subject"
        claim_type = "COMPLIANCE"
        statement = "Subject complies with regulation XYZ"
        scope = {"domain": "regulatory", "jurisdiction": "global"}
        evidence_references = ["evidence1", "evidence2"]
        verification_requirements = {
            "required_attestations": 2,
            "required_attestation_types": ["VERIFICATION"]
        }
        
        # Create claim
        claim = self.protocol.create_claim(
            issuer_id=issuer_id,
            subject_id=subject_id,
            claim_type=claim_type,
            statement=statement,
            scope=scope,
            evidence_references=evidence_references,
            verification_requirements=verification_requirements
        )
        
        # Verify claim
        self.assertIsNotNone(claim)
        self.assertIn("claim_id", claim)
        self.assertEqual(claim["issuer_id"], issuer_id)
        self.assertEqual(claim["subject_id"], subject_id)
        self.assertEqual(claim["claim_type"], claim_type)
        self.assertEqual(claim["statement"], statement)
        self.assertEqual(claim["scope"], scope)
        self.assertEqual(claim["evidence_references"], evidence_references)
        self.assertEqual(claim["verification_requirements"], verification_requirements)
        self.assertIn("timestamp", claim)
        self.assertIn("metadata", claim)
        self.assertEqual(claim["metadata"]["verification_status"], self.protocol.STATUS_PENDING)
        
        # Verify schema validation was called
        self.mock_schema_validator.validate.assert_called_once()
    
    def test_get_claim(self):
        """Test getting a claim."""
        # Create a claim first
        claim = self.protocol.create_claim(
            issuer_id="test-issuer",
            subject_id="test-subject",
            claim_type="COMPLIANCE",
            statement="Test statement",
            scope={"domain": "test"}
        )
        
        # Get the claim
        retrieved = self.protocol.get_claim(claim["claim_id"])
        
        # Verify it's the same
        self.assertEqual(retrieved, claim)
        
        # Test getting a non-existent claim
        non_existent = self.protocol.get_claim("non-existent")
        self.assertIsNone(non_existent)
    
    def test_find_claims(self):
        """Test finding claims by criteria."""
        # Create multiple claims
        claim1 = self.protocol.create_claim(
            issuer_id="issuer1",
            subject_id="subject1",
            claim_type="COMPLIANCE",
            statement="Statement 1",
            scope={"domain": "domain1"}
        )
        
        claim2 = self.protocol.create_claim(
            issuer_id="issuer2",
            subject_id="subject1",
            claim_type="SECURITY",
            statement="Statement 2",
            scope={"domain": "domain2"}
        )
        
        claim3 = self.protocol.create_claim(
            issuer_id="issuer1",
            subject_id="subject2",
            claim_type="COMPLIANCE",
            statement="Statement 3",
            scope={"domain": "domain1"}
        )
        
        # Find by issuer
        issuer1_claims = self.protocol.find_claims(issuer_id="issuer1")
        self.assertEqual(len(issuer1_claims), 2)
        self.assertIn(claim1, issuer1_claims)
        self.assertIn(claim3, issuer1_claims)
        
        # Find by subject
        subject1_claims = self.protocol.find_claims(subject_id="subject1")
        self.assertEqual(len(subject1_claims), 2)
        self.assertIn(claim1, subject1_claims)
        self.assertIn(claim2, subject1_claims)
        
        # Find by type
        compliance_claims = self.protocol.find_claims(claim_type="COMPLIANCE")
        self.assertEqual(len(compliance_claims), 2)
        self.assertIn(claim1, compliance_claims)
        self.assertIn(claim3, compliance_claims)
        
        # Find by multiple criteria
        filtered_claims = self.protocol.find_claims(
            issuer_id="issuer1",
            claim_type="COMPLIANCE"
        )
        self.assertEqual(len(filtered_claims), 2)
        self.assertIn(claim1, filtered_claims)
        self.assertIn(claim3, filtered_claims)
    
    def test_verify_claim_no_attestations(self):
        """Test verifying a claim with no attestations."""
        # Create a claim
        claim = self.protocol.create_claim(
            issuer_id="test-issuer",
            subject_id="test-subject",
            claim_type="COMPLIANCE",
            statement="Test statement",
            scope={"domain": "test"},
            verification_requirements={
                "required_attestations": 2,
                "required_attestation_types": ["VERIFICATION"]
            }
        )
        
        # Mock attestation service to return no attestations
        self.mock_attestation_service.find_attestations.return_value = []
        
        # Verify claim
        is_verified, details = self.protocol.verify_claim(claim["claim_id"])
        
        # Should not be verified due to no attestations
        self.assertFalse(is_verified)
        self.assertIn("error", details)
        self.assertEqual(details["error"], "No attestations found for claim")
        
        # Verify attestation service was called
        self.mock_attestation_service.find_attestations.assert_called_once_with(
            claim_id=claim["claim_id"],
            active_only=True
        )
    
    def test_verify_claim_insufficient_attestations(self):
        """Test verifying a claim with insufficient attestations."""
        # Create a claim requiring 2 attestations
        claim = self.protocol.create_claim(
            issuer_id="test-issuer",
            subject_id="test-subject",
            claim_type="COMPLIANCE",
            statement="Test statement",
            scope={"domain": "test"},
            verification_requirements={
                "required_attestations": 2,
                "required_attestation_types": ["VERIFICATION"]
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
        
        # Verify claim
        is_verified, details = self.protocol.verify_claim(claim["claim_id"])
        
        # Should not be verified due to insufficient attestations
        self.assertFalse(is_verified)
        self.assertIn("error", details)
        self.assertEqual(details["error"], "Insufficient attestations (1) for claim, required: 2")
    
    def test_verify_claim_success(self):
        """Test successful claim verification."""
        # Create a claim requiring 2 attestations
        claim = self.protocol.create_claim(
            issuer_id="test-issuer",
            subject_id="test-subject",
            claim_type="COMPLIANCE",
            statement="Test statement",
            scope={"domain": "test"},
            verification_requirements={
                "required_attestations": 2,
                "required_attestation_types": ["VERIFICATION"]
            }
        )
        
        # Mock attestation service to return 2 attestations
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
        
        # Verify claim
        is_verified, details = self.protocol.verify_claim(claim["claim_id"])
        
        # Should be verified
        self.assertTrue(is_verified)
        self.assertIn("valid_attestations", details)
        self.assertEqual(details["valid_attestations"], 2)
        
        # Verify attestation validations were called
        self.assertEqual(self.mock_attestation_service.validate_attestation.call_count, 2)
        
        # Verify claim status was updated
        updated_claim = self.protocol.get_claim(claim["claim_id"])
        self.assertEqual(updated_claim["metadata"]["verification_status"], "VERIFIED")
    
    def test_verify_claim_invalid_attestations(self):
        """Test claim verification with invalid attestations."""
        # Create a claim requiring 2 attestations
        claim = self.protocol.create_claim(
            issuer_id="test-issuer",
            subject_id="test-subject",
            claim_type="COMPLIANCE",
            statement="Test statement",
            scope={"domain": "test"},
            verification_requirements={
                "required_attestations": 2,
                "required_attestation_types": ["VERIFICATION"]
            }
        )
        
        # Mock attestation service to return 3 attestations
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
            },
            {
                "attestation_id": "att3", 
                "issuer_id": "auth3",
                "attestation_type": "VERIFICATION"
            }
        ]
        
        # Mock attestation validation to return mixed results
        self.mock_attestation_service.validate_attestation.side_effect = [
            (True, {}),
            (False, {"error": "Invalid signature"}),
            (True, {})
        ]
        
        # Verify claim
        is_verified, details = self.protocol.verify_claim(claim["claim_id"])
        
        # Should be verified (2 valid attestations out of 3)
        self.assertTrue(is_verified)
        self.assertIn("valid_attestations", details)
        self.assertEqual(details["valid_attestations"], 2)
        self.assertIn("invalid_attestations", details)
        self.assertEqual(details["invalid_attestations"], 1)
        
        # Verify attestation validations were called
        self.assertEqual(self.mock_attestation_service.validate_attestation.call_count, 3)
    
    def test_get_claim_attestations(self):
        """Test getting attestations for a claim."""
        # Create a claim
        claim = self.protocol.create_claim(
            issuer_id="test-issuer",
            subject_id="test-subject",
            claim_type="COMPLIANCE",
            statement="Test statement",
            scope={"domain": "test"}
        )
        
        # Mock attestation service to return attestations
        mock_attestations = [
            {
                "attestation_id": "att1", 
                "issuer_id": "auth1",
                "attestation_type": "VERIFICATION"
            },
            {
                "attestation_id": "att2", 
                "issuer_id": "auth2",
                "attestation_type": "CERTIFICATION"
            }
        ]
        self.mock_attestation_service.find_attestations.return_value = mock_attestations
        
        # Get attestations
        attestations = self.protocol.get_claim_attestations(claim["claim_id"])
        
        # Verify attestations
        self.assertEqual(attestations, mock_attestations)
        
        # Verify attestation service was called
        self.mock_attestation_service.find_attestations.assert_called_once_with(
            claim_id=claim["claim_id"]
        )


if __name__ == '__main__':
    unittest.main()
