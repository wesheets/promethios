"""
Unit tests for the Boundary Integrity Verifier.

This module contains unit tests for the Boundary Integrity Verifier component
of the Trust Boundary Definition framework.
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from src.core.verification.boundary_integrity_verifier import BoundaryIntegrityVerifier
from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.trust.boundary_crossing_protocol import BoundaryCrossingProtocol
from src.core.verification.seal_verification import SealVerificationService
from src.core.trust.mutation_detector import MutationDetector
from src.core.governance.attestation_service import AttestationService
from src.core.common.schema_validator import SchemaValidator

class TestBoundaryIntegrityVerifier(unittest.TestCase):
    """Test cases for the BoundaryIntegrityVerifier class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.boundary_detection_engine = MagicMock(spec=BoundaryDetectionEngine)
        self.boundary_crossing_protocol = MagicMock(spec=BoundaryCrossingProtocol)
        self.seal_verification_service = MagicMock(spec=SealVerificationService)
        self.mutation_detector = MagicMock(spec=MutationDetector)
        self.attestation_service = MagicMock(spec=AttestationService)
        self.schema_validator = MagicMock(spec=SchemaValidator)
        
        # Configure mock behavior
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        self.schema_validator.validate.return_value = validation_result
        
        self.seal_verification_service.create_seal.return_value = "mock-seal"
        self.seal_verification_service.verify_seal.return_value = True
        self.seal_verification_service.verify_contract_tether.return_value = True
        
        # Configure boundary detection engine mock
        self.sample_boundary = {
            "boundary_id": "test-boundary",
            "name": "Test Boundary",
            "description": "A test boundary for unit testing",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "controls": [
                {
                    "control_id": "control-1",
                    "control_type": "authentication",
                    "name": "Authentication Control",
                    "status": "active"
                },
                {
                    "control_id": "control-2",
                    "control_type": "encryption",
                    "name": "Encryption Control",
                    "status": "active"
                }
            ],
            "signature": "test-signature"
        }
        
        self.boundary_detection_engine.get_boundary.return_value = self.sample_boundary
        
        # Configure attestation service mock
        self.attestation_service.get_attestation.return_value = {
            "attestation_id": "test-attestation",
            "attester_id": "test-attester",
            "timestamp": datetime.utcnow().isoformat()
        }
        self.attestation_service.verify_attestation.return_value = True
        
        # Configure mutation detector mock
        self.mutation_detector.detect_mutations.return_value = []
        
        # Create a temporary file path for testing
        self.test_verifications_file = "/tmp/test_verifications.json"
        
        # Create the verifier instance
        self.verifier = BoundaryIntegrityVerifier(
            boundary_detection_engine=self.boundary_detection_engine,
            boundary_crossing_protocol=self.boundary_crossing_protocol,
            seal_verification_service=self.seal_verification_service,
            mutation_detector=self.mutation_detector,
            attestation_service=self.attestation_service,
            schema_validator=self.schema_validator,
            verifications_file_path=self.test_verifications_file
        )

    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the test file if it exists
        if os.path.exists(self.test_verifications_file):
            os.remove(self.test_verifications_file)

    def test_verify_boundary_integrity(self):
        """Test verifying boundary integrity."""
        # Verify boundary integrity
        verification = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Verify the verification record was created
        self.assertIsNotNone(verification)
        self.assertIn("verification_id", verification)
        self.assertEqual(verification["boundary_id"], "test-boundary")
        self.assertEqual(verification["verification_type"], "comprehensive")
        self.assertEqual(verification["result"]["integrity_status"], "intact")
        
        # Verify the verification was stored
        self.assertIn(verification["verification_id"], self.verifier.verifications)
        
        # Verify boundary detection engine was used
        self.boundary_detection_engine.get_boundary.assert_called_with("test-boundary")
        
        # Verify schema validation was called
        self.schema_validator.validate.assert_called()
        
        # Verify seal verification service was used
        self.seal_verification_service.verify_seal.assert_called()
        self.seal_verification_service.create_seal.assert_called()
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_verify_boundary_integrity_nonexistent_boundary(self):
        """Test verifying integrity of a nonexistent boundary."""
        # Configure boundary detection engine to return None
        self.boundary_detection_engine.get_boundary.return_value = None
        
        # Attempt to verify boundary integrity
        with self.assertRaises(ValueError):
            self.verifier.verify_boundary_integrity("nonexistent-boundary")

    def test_verify_boundary_integrity_with_control_verification(self):
        """Test verifying boundary integrity with control verification."""
        # Verify boundary integrity with control verification
        verification = self.verifier.verify_boundary_integrity("test-boundary", "control_verification")
        
        # Verify the verification record was created
        self.assertIsNotNone(verification)
        self.assertEqual(verification["verification_type"], "control_verification")
        self.assertIn("control_verifications", verification)
        
        # Verify control verifications were performed
        self.assertEqual(len(verification["control_verifications"]), 2)
        control_ids = [c["control_id"] for c in verification["control_verifications"]]
        self.assertIn("control-1", control_ids)
        self.assertIn("control-2", control_ids)

    def test_verify_boundary_integrity_with_seal_validation(self):
        """Test verifying boundary integrity with seal validation."""
        # Verify boundary integrity with seal validation
        verification = self.verifier.verify_boundary_integrity("test-boundary", "seal_validation")
        
        # Verify the verification record was created
        self.assertIsNotNone(verification)
        self.assertEqual(verification["verification_type"], "seal_validation")
        self.assertIn("seal_validations", verification)
        
        # Verify seal validations were performed
        self.assertEqual(len(verification["seal_validations"]), 1)
        self.assertEqual(verification["seal_validations"][0]["seal_id"], "boundary-signature")
        self.assertTrue(verification["seal_validations"][0]["is_valid"])

    def test_verify_boundary_integrity_with_mutation_detection(self):
        """Test verifying boundary integrity with mutation detection."""
        # Configure mutation detector to return mutations
        self.mutation_detector.detect_mutations.return_value = [
            {
                "mutation_id": "mutation-1",
                "mutation_type": "boundary_definition",
                "detection_timestamp": datetime.utcnow().isoformat(),
                "severity": "medium",
                "details": "Test mutation",
                "evidence": "Test evidence"
            }
        ]
        
        # Verify boundary integrity with mutation detection
        verification = self.verifier.verify_boundary_integrity("test-boundary", "mutation_detection")
        
        # Verify the verification record was created
        self.assertIsNotNone(verification)
        self.assertEqual(verification["verification_type"], "mutation_detection")
        self.assertIn("mutation_detections", verification)
        
        # Verify mutation detections were performed
        self.assertEqual(len(verification["mutation_detections"]), 1)
        self.assertEqual(verification["mutation_detections"][0]["mutation_id"], "mutation-1")
        self.assertEqual(verification["mutation_detections"][0]["severity"], "medium")
        
        # Verify integrity status reflects mutations
        self.assertEqual(verification["result"]["integrity_status"], "warning")

    def test_verify_boundary_integrity_with_attestation_verification(self):
        """Test verifying boundary integrity with attestation verification."""
        # Add attestations to the boundary
        boundary_with_attestations = self.sample_boundary.copy()
        boundary_with_attestations["attestations"] = [
            {
                "attestation_id": "test-attestation",
                "attester_id": "test-attester"
            }
        ]
        self.boundary_detection_engine.get_boundary.return_value = boundary_with_attestations
        
        # Verify boundary integrity with attestation verification
        verification = self.verifier.verify_boundary_integrity("test-boundary", "attestation_verification")
        
        # Verify the verification record was created
        self.assertIsNotNone(verification)
        self.assertEqual(verification["verification_type"], "attestation_verification")
        self.assertIn("attestation_verifications", verification)
        
        # Verify attestation verifications were performed
        self.assertEqual(len(verification["attestation_verifications"]), 1)
        self.assertEqual(verification["attestation_verifications"][0]["attestation_id"], "test-attestation")
        self.assertTrue(verification["attestation_verifications"][0]["is_valid"])
        
        # Restore original boundary
        self.boundary_detection_engine.get_boundary.return_value = self.sample_boundary

    def test_verify_boundary_integrity_with_compliance_checking(self):
        """Test verifying boundary integrity with compliance checking."""
        # Verify boundary integrity with compliance checking
        verification = self.verifier.verify_boundary_integrity("test-boundary", "compliance_checking")
        
        # Verify the verification record was created
        self.assertIsNotNone(verification)
        self.assertEqual(verification["verification_type"], "compliance_checking")
        self.assertIn("compliance_checks", verification)
        
        # Verify compliance checks were performed
        self.assertGreaterEqual(len(verification["compliance_checks"]), 1)
        self.assertTrue(all(check["is_compliant"] for check in verification["compliance_checks"]))

    def test_verify_boundary_integrity_with_invalid_schema(self):
        """Test verifying boundary integrity with invalid schema."""
        # Configure schema validator to return invalid validation
        validation_result = MagicMock()
        validation_result.is_valid = False
        validation_result.errors = ["Invalid schema"]
        self.schema_validator.validate.return_value = validation_result
        
        # Verify boundary integrity
        verification = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Verify the verification record was created
        self.assertIsNotNone(verification)
        
        # Verify integrity status reflects schema validation failure
        self.assertNotEqual(verification["result"]["integrity_status"], "intact")
        
        # Verify compliance checks show failure
        compliance_checks = verification.get("compliance_checks", [])
        schema_check = next((c for c in compliance_checks if c["requirement_id"] == "schema-compliance"), None)
        if schema_check:
            self.assertFalse(schema_check["is_compliant"])

    def test_verify_boundary_integrity_with_invalid_seal(self):
        """Test verifying boundary integrity with invalid seal."""
        # Configure seal verification service to return False
        self.seal_verification_service.verify_seal.return_value = False
        
        # Verify boundary integrity
        verification = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Verify the verification record was created
        self.assertIsNotNone(verification)
        
        # Verify integrity status reflects seal validation failure
        self.assertEqual(verification["result"]["integrity_status"], "compromised")
        
        # Verify seal validations show failure
        seal_validations = verification.get("seal_validations", [])
        if seal_validations:
            self.assertFalse(seal_validations[0]["is_valid"])
        
        # Verify violations were identified
        self.assertIn("violations", verification)
        self.assertGreaterEqual(len(verification["violations"]), 1)
        
        # Verify recommendations were generated
        self.assertIn("recommendations", verification)
        self.assertGreaterEqual(len(verification["recommendations"]), 1)

    def test_get_verification(self):
        """Test getting a verification by ID."""
        # Verify boundary integrity
        verification = self.verifier.verify_boundary_integrity("test-boundary")
        verification_id = verification["verification_id"]
        
        # Get the verification
        retrieved_verification = self.verifier.get_verification(verification_id)
        
        # Verify the verification was retrieved
        self.assertIsNotNone(retrieved_verification)
        self.assertEqual(retrieved_verification["verification_id"], verification_id)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_nonexistent_verification(self):
        """Test getting a verification that doesn't exist."""
        # Attempt to get a nonexistent verification
        verification = self.verifier.get_verification("nonexistent-verification")
        
        # Verify None was returned
        self.assertIsNone(verification)

    def test_list_verifications(self):
        """Test listing verifications."""
        # Create multiple verifications
        verification1 = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Configure boundary detection engine to return a different boundary
        boundary2 = self.sample_boundary.copy()
        boundary2["boundary_id"] = "test-boundary-2"
        self.boundary_detection_engine.get_boundary.side_effect = lambda boundary_id: (
            boundary2 if boundary_id == "test-boundary-2" else self.sample_boundary
        )
        
        verification2 = self.verifier.verify_boundary_integrity("test-boundary-2")
        
        # Configure seal verification service to return False for the next verification
        self.seal_verification_service.verify_seal.return_value = False
        verification3 = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Reset mock behavior
        self.seal_verification_service.verify_seal.return_value = True
        self.boundary_detection_engine.get_boundary.side_effect = None
        self.boundary_detection_engine.get_boundary.return_value = self.sample_boundary
        
        # List all verifications
        verifications = self.verifier.list_verifications()
        
        # Verify all verifications were returned
        self.assertEqual(len(verifications), 3)
        
        # List verifications by boundary ID
        boundary_verifications = self.verifier.list_verifications(boundary_id="test-boundary")
        
        # Verify only verifications for the specified boundary were returned
        self.assertEqual(len(boundary_verifications), 2)
        for v in boundary_verifications:
            self.assertEqual(v["boundary_id"], "test-boundary")
        
        # List verifications by integrity status
        compromised_verifications = self.verifier.list_verifications(integrity_status="compromised")
        
        # Verify only verifications with the specified integrity status were returned
        self.assertGreaterEqual(len(compromised_verifications), 1)
        for v in compromised_verifications:
            self.assertEqual(v["result"]["integrity_status"], "compromised")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_boundary_violations(self):
        """Test getting violations for a boundary."""
        # Configure seal verification service to return False
        self.seal_verification_service.verify_seal.return_value = False
        
        # Verify boundary integrity to generate violations
        verification = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Reset mock behavior
        self.seal_verification_service.verify_seal.return_value = True
        
        # Get violations for the boundary
        violations = self.verifier.get_boundary_violations("test-boundary")
        
        # Verify violations were returned
        self.assertGreaterEqual(len(violations), 1)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_boundary_recommendations(self):
        """Test getting recommendations for a boundary."""
        # Configure seal verification service to return False
        self.seal_verification_service.verify_seal.return_value = False
        
        # Verify boundary integrity to generate recommendations
        verification = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Reset mock behavior
        self.seal_verification_service.verify_seal.return_value = True
        
        # Get recommendations for the boundary
        recommendations = self.verifier.get_boundary_recommendations("test-boundary")
        
        # Verify recommendations were returned
        self.assertGreaterEqual(len(recommendations), 1)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_report_violation(self):
        """Test reporting a violation."""
        # Report a violation
        verification_id = self.verifier.report_violation(
            boundary_id="test-boundary",
            violation_type="unauthorized_access",
            details="Unauthorized access detected",
            severity="high"
        )
        
        # Verify the verification record was created
        self.assertIsNotNone(verification_id)
        self.assertIn(verification_id, self.verifier.verifications)
        
        # Get the verification
        verification = self.verifier.get_verification(verification_id)
        
        # Verify the verification contains the reported violation
        self.assertIn("violations", verification)
        self.assertEqual(len(verification["violations"]), 1)
        self.assertEqual(verification["violations"][0]["violation_type"], "unauthorized_access")
        self.assertEqual(verification["violations"][0]["severity"], "high")
        
        # Verify integrity status reflects the violation
        self.assertEqual(verification["result"]["integrity_status"], "compromised")
        
        # Verify boundary detection engine was used
        self.boundary_detection_engine.get_boundary.assert_called_with("test-boundary")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_report_violation_nonexistent_boundary(self):
        """Test reporting a violation for a nonexistent boundary."""
        # Configure boundary detection engine to return None
        self.boundary_detection_engine.get_boundary.return_value = None
        
        # Attempt to report a violation
        with self.assertRaises(ValueError):
            self.verifier.report_violation(
                boundary_id="nonexistent-boundary",
                violation_type="unauthorized_access",
                details="Unauthorized access detected"
            )

    def test_file_operations(self):
        """Test file operations (load and save)."""
        # Verify boundary integrity
        verification = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Create a new verifier instance with the same file path
        new_verifier = BoundaryIntegrityVerifier(
            boundary_detection_engine=self.boundary_detection_engine,
            boundary_crossing_protocol=self.boundary_crossing_protocol,
            seal_verification_service=self.seal_verification_service,
            mutation_detector=self.mutation_detector,
            attestation_service=self.attestation_service,
            schema_validator=self.schema_validator,
            verifications_file_path=self.test_verifications_file
        )
        
        # Verify the verification was loaded from the file
        self.assertIn(verification["verification_id"], new_verifier.verifications)

    def test_contract_tether_verification_failure(self):
        """Test behavior when contract tether verification fails."""
        # Configure mock to fail contract tether verification
        self.seal_verification_service.verify_contract_tether.return_value = False
        
        # Attempt to verify boundary integrity
        with self.assertRaises(ValueError):
            self.verifier.verify_boundary_integrity("test-boundary")

if __name__ == '__main__':
    unittest.main()
