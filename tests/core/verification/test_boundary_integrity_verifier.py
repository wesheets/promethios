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
from collections import namedtuple

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
        
        # Configure mock behavior with proper validation result object
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        validation_result = ValidationResult(is_valid=True, errors=[])
        self.schema_validator.validate = MagicMock(return_value=validation_result)
        
        self.seal_verification_service.create_seal = MagicMock(return_value="mock-seal")
        self.seal_verification_service.verify_seal = MagicMock(return_value=True)
        self.seal_verification_service.verify_contract_tether = MagicMock(return_value=True)
        
        # Configure boundary detection engine mock
        self.sample_boundary = {
            "boundary_id": "test-boundary",
            "name": "Test Boundary",
            "description": "A test boundary for unit testing",
            "type": "logical",
            "owner": "test-owner",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "seal": "mock-seal",
            "controls": [
                {
                    "control_id": "test-control",
                    "name": "Test Control",
                    "description": "A test control for unit testing",
                    "type": "access",
                    "parameters": {}
                }
            ]
        }
        
        self.boundary_detection_engine.get_boundary = MagicMock(return_value=self.sample_boundary)
        self.boundary_detection_engine.list_boundaries = MagicMock(return_value=[self.sample_boundary])
        
        # Configure mutation detector mock
        self.mutation_detector.detect_mutations = MagicMock(return_value=[])
        
        # Configure attestation service mock
        self.attestation_service.verify_attestation = MagicMock(return_value=True)
        
        # Create a test verifier with a valid path that includes a directory
        self.verifier = BoundaryIntegrityVerifier(
            boundary_detection_engine=self.boundary_detection_engine,
            boundary_crossing_protocol=self.boundary_crossing_protocol,
            seal_verification_service=self.seal_verification_service,
            mutation_detector=self.mutation_detector,
            attestation_service=self.attestation_service,
            schema_validator=self.schema_validator,
            verifications_file_path="test_dir/test_verifications.json"
        )
        
        # Patch the file operations
        patcher = patch('builtins.open', unittest.mock.mock_open())
        self.addCleanup(patcher.stop)
        patcher.start()
        
        # Patch os.makedirs
        patcher = patch('os.makedirs')
        self.addCleanup(patcher.stop)
        patcher.start()
        
        # Patch os.path.exists
        patcher = patch('os.path.exists')
        self.addCleanup(patcher.stop)
        self.mock_exists = patcher.start()
        self.mock_exists.return_value = False

    def test_verify_boundary_integrity(self):
        """Test verifying boundary integrity."""
        # Call the method under test
        result = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Verify the result
        self.assertTrue(result["is_valid"])
        self.assertEqual(result["boundary_id"], "test-boundary")
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("test-boundary")
        self.schema_validator.validate.assert_called_once()
        self.seal_verification_service.verify_seal.assert_called_once()

    def test_verify_boundary_integrity_nonexistent_boundary(self):
        """Test verifying boundary integrity for a nonexistent boundary."""
        # Configure mock to return None for nonexistent boundary
        self.boundary_detection_engine.get_boundary.return_value = None
        
        # Call the method under test
        result = self.verifier.verify_boundary_integrity("nonexistent-boundary")
        
        # Verify the result
        self.assertFalse(result["is_valid"])
        self.assertEqual(result["boundary_id"], "nonexistent-boundary")
        self.assertIn("not found", result["message"])
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("nonexistent-boundary")
        self.schema_validator.validate.assert_not_called()
        self.seal_verification_service.verify_seal.assert_not_called()

    def test_verify_boundary_integrity_with_invalid_schema(self):
        """Test verifying boundary integrity with an invalid schema."""
        # Configure schema validator mock to return invalid result
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        validation_result = ValidationResult(is_valid=False, errors=["Invalid schema"])
        self.schema_validator.validate.return_value = validation_result
        
        # Call the method under test
        result = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Verify the result
        self.assertFalse(result["is_valid"])
        self.assertEqual(result["boundary_id"], "test-boundary")
        self.assertIn("schema validation", result["message"])
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("test-boundary")
        self.schema_validator.validate.assert_called_once()
        self.seal_verification_service.verify_seal.assert_not_called()

    def test_verify_boundary_integrity_with_invalid_seal(self):
        """Test verifying boundary integrity with an invalid seal."""
        # Configure seal verification service mock to return False
        self.seal_verification_service.verify_seal.return_value = False
        
        # Call the method under test
        result = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Verify the result
        self.assertFalse(result["is_valid"])
        self.assertEqual(result["boundary_id"], "test-boundary")
        self.assertIn("seal verification", result["message"])
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("test-boundary")
        self.schema_validator.validate.assert_called_once()
        self.seal_verification_service.verify_seal.assert_called_once()

    def test_verify_boundary_integrity_with_mutation_detection(self):
        """Test verifying boundary integrity with mutation detection."""
        # Configure mutation detector mock to return mutations
        self.mutation_detector.detect_mutations.return_value = [
            {
                "field": "name",
                "original_value": "Original Name",
                "current_value": "Modified Name",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        ]
        
        # Call the method under test
        result = self.verifier.verify_boundary_integrity("test-boundary", detect_mutations=True)
        
        # Verify the result
        self.assertFalse(result["is_valid"])
        self.assertEqual(result["boundary_id"], "test-boundary")
        self.assertIn("mutations detected", result["message"])
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("test-boundary")
        self.schema_validator.validate.assert_called_once()
        self.seal_verification_service.verify_seal.assert_called_once()
        self.mutation_detector.detect_mutations.assert_called_once()

    def test_verify_boundary_integrity_with_attestation_verification(self):
        """Test verifying boundary integrity with attestation verification."""
        # Call the method under test
        result = self.verifier.verify_boundary_integrity("test-boundary", verify_attestation=True)
        
        # Verify the result
        self.assertTrue(result["is_valid"])
        self.assertEqual(result["boundary_id"], "test-boundary")
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("test-boundary")
        self.schema_validator.validate.assert_called_once()
        self.seal_verification_service.verify_seal.assert_called_once()
        self.attestation_service.verify_attestation.assert_called_once()

    def test_verify_boundary_integrity_with_compliance_checking(self):
        """Test verifying boundary integrity with compliance checking."""
        # Call the method under test
        result = self.verifier.verify_boundary_integrity("test-boundary", check_compliance=True)
        
        # Verify the result
        self.assertTrue(result["is_valid"])
        self.assertEqual(result["boundary_id"], "test-boundary")
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("test-boundary")
        self.schema_validator.validate.assert_called_once()
        self.seal_verification_service.verify_seal.assert_called_once()

    def test_verify_boundary_integrity_with_control_verification(self):
        """Test verifying boundary integrity with control verification."""
        # Call the method under test
        result = self.verifier.verify_boundary_integrity("test-boundary", verify_controls=True)
        
        # Verify the result
        self.assertTrue(result["is_valid"])
        self.assertEqual(result["boundary_id"], "test-boundary")
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("test-boundary")
        self.schema_validator.validate.assert_called_once()
        self.seal_verification_service.verify_seal.assert_called_once()

    def test_contract_tether_verification_failure(self):
        """Test contract tether verification failure."""
        # Configure seal verification service mock to return False for verify_contract_tether
        self.seal_verification_service.verify_contract_tether.return_value = False
        
        # Call the method under test
        result = self.verifier.verify_boundary_integrity("test-boundary")
        
        # Verify the result
        self.assertFalse(result["is_valid"])
        self.assertEqual(result["boundary_id"], "test-boundary")
        self.assertIn("contract tether", result["message"])
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("test-boundary")
        self.schema_validator.validate.assert_called_once()
        self.seal_verification_service.verify_contract_tether.assert_called_once()
        self.seal_verification_service.verify_seal.assert_not_called()

    def test_get_verification(self):
        """Test getting a verification."""
        # Set up test data
        verification_id = str(uuid.uuid4())
        self.verifier.verifications = {
            verification_id: {
                "verification_id": verification_id,
                "boundary_id": "test-boundary",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "is_valid": True,
                "message": "Boundary integrity verified successfully",
                "details": {}
            }
        }
        
        # Call the method under test
        verification = self.verifier.get_verification(verification_id)
        
        # Verify the result
        self.assertIsNotNone(verification)
        self.assertEqual(verification["verification_id"], verification_id)
        self.assertEqual(verification["boundary_id"], "test-boundary")
        self.assertTrue(verification["is_valid"])

    def test_get_nonexistent_verification(self):
        """Test getting a nonexistent verification."""
        # Call the method under test
        verification = self.verifier.get_verification("nonexistent-verification")
        
        # Verify the result
        self.assertIsNone(verification)

    def test_list_verifications(self):
        """Test listing verifications."""
        # Set up test data
        verification_id_1 = str(uuid.uuid4())
        verification_id_2 = str(uuid.uuid4())
        self.verifier.verifications = {
            verification_id_1: {
                "verification_id": verification_id_1,
                "boundary_id": "test-boundary-1",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "is_valid": True,
                "message": "Boundary integrity verified successfully",
                "details": {}
            },
            verification_id_2: {
                "verification_id": verification_id_2,
                "boundary_id": "test-boundary-2",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "is_valid": False,
                "message": "Boundary integrity verification failed",
                "details": {}
            }
        }
        
        # Call the method under test
        verifications = self.verifier.list_verifications()
        
        # Verify the result
        self.assertEqual(len(verifications), 2)
        self.assertIn(verification_id_1, [v["verification_id"] for v in verifications])
        self.assertIn(verification_id_2, [v["verification_id"] for v in verifications])

    def test_report_violation(self):
        """Test reporting a violation."""
        # Call the method under test
        result = self.verifier.report_violation(
            boundary_id="test-boundary",
            violation_type="unauthorized_access",
            description="Unauthorized access detected",
            evidence={"source_ip": "192.168.1.1", "timestamp": datetime.utcnow().isoformat() + "Z"}
        )
        
        # Verify the result
        self.assertTrue(result["success"])
        self.assertEqual(result["boundary_id"], "test-boundary")
        self.assertEqual(result["violation_type"], "unauthorized_access")
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("test-boundary")

    def test_report_violation_nonexistent_boundary(self):
        """Test reporting a violation for a nonexistent boundary."""
        # Configure mock to return None for nonexistent boundary
        self.boundary_detection_engine.get_boundary.return_value = None
        
        # Call the method under test
        result = self.verifier.report_violation(
            boundary_id="nonexistent-boundary",
            violation_type="unauthorized_access",
            description="Unauthorized access detected",
            evidence={"source_ip": "192.168.1.1", "timestamp": datetime.utcnow().isoformat() + "Z"}
        )
        
        # Verify the result
        self.assertFalse(result["success"])
        self.assertEqual(result["boundary_id"], "nonexistent-boundary")
        self.assertIn("not found", result["message"])
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("nonexistent-boundary")

    def test_get_boundary_violations(self):
        """Test getting boundary violations."""
        # Set up test data
        violation_id_1 = str(uuid.uuid4())
        violation_id_2 = str(uuid.uuid4())
        self.verifier.violations = {
            violation_id_1: {
                "violation_id": violation_id_1,
                "boundary_id": "test-boundary",
                "violation_type": "unauthorized_access",
                "description": "Unauthorized access detected",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "evidence": {"source_ip": "192.168.1.1"}
            },
            violation_id_2: {
                "violation_id": violation_id_2,
                "boundary_id": "test-boundary",
                "violation_type": "data_exfiltration",
                "description": "Data exfiltration detected",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "evidence": {"destination_ip": "203.0.113.1"}
            }
        }
        
        # Call the method under test
        violations = self.verifier.get_boundary_violations("test-boundary")
        
        # Verify the result
        self.assertEqual(len(violations), 2)
        self.assertIn(violation_id_1, [v["violation_id"] for v in violations])
        self.assertIn(violation_id_2, [v["violation_id"] for v in violations])

    def test_get_boundary_recommendations(self):
        """Test getting boundary recommendations."""
        # Call the method under test
        recommendations = self.verifier.get_boundary_recommendations("test-boundary")
        
        # Verify the result
        self.assertIsInstance(recommendations, list)
        
        # Verify the mock calls
        self.boundary_detection_engine.get_boundary.assert_called_once_with("test-boundary")

    def test_file_operations(self):
        """Test file operations."""
        # Configure mock to return True for file existence
        self.mock_exists.return_value = True
        
        # Create a new verifier to test file loading
        with patch('builtins.open', unittest.mock.mock_open(read_data='{"test": "data"}')):
            verifier = BoundaryIntegrityVerifier(
                boundary_detection_engine=self.boundary_detection_engine,
                boundary_crossing_protocol=self.boundary_crossing_protocol,
                seal_verification_service=self.seal_verification_service,
                mutation_detector=self.mutation_detector,
                attestation_service=self.attestation_service,
                schema_validator=self.schema_validator,
                verifications_file_path="test_dir/test_verifications.json"
            )
        
        # Verify that file operations work
        with patch('builtins.open', unittest.mock.mock_open()) as mock_file:
            verifier._save_verifications()
            mock_file.assert_called_once()
