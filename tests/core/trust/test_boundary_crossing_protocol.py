"""
Unit tests for the Boundary Crossing Protocol.

This module contains unit tests for the Boundary Crossing Protocol component
of the Trust Boundary Definition framework.
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from src.core.trust.boundary_crossing_protocol import BoundaryCrossingProtocol
from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.common.schema_validator import SchemaValidator
from src.core.verification.seal_verification import SealVerificationService

class TestBoundaryCrossingProtocol(unittest.TestCase):
    """Test cases for the BoundaryCrossingProtocol class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.boundary_detection_engine = MagicMock(spec=BoundaryDetectionEngine)
        self.schema_validator = MagicMock()
        self.seal_verification_service = MagicMock(spec=SealVerificationService)
        
        # Configure mock behavior - explicitly add validate method
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        self.schema_validator.validate = MagicMock(return_value=validation_result)
        
        self.seal_verification_service.create_seal.return_value = "mock-seal"
        self.seal_verification_service.verify_seal.return_value = True
        self.seal_verification_service.verify_contract_tether.return_value = True
        
        # Configure boundary detection engine mock
        self.boundary_detection_engine.get_boundary.return_value = {
            "boundary_id": "source-boundary",
            "name": "Source Boundary",
            "boundary_type": "process",
            "status": "active"
        }
        
        # Create a temporary file path for testing
        self.test_crossings_file = "/tmp/test_crossings.json"
        
        # Create the protocol instance
        self.protocol = BoundaryCrossingProtocol(
            boundary_detection_engine=self.boundary_detection_engine,
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            crossings_file_path=self.test_crossings_file
        )
        
        # Sample crossing for testing
        self.sample_crossing = {
            "crossing_id": f"crossing-{str(uuid.uuid4())}",
            "source_boundary_id": "source-boundary",
            "target_boundary_id": "target-boundary",
            "crossing_type": "data-transfer",
            "direction": "outbound",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "status": "active",
            "protocol": "HTTPS",
            "port": 443,
            "path": "/api/data",
            "authentication_required": True,
            "authorization_required": True,
            "encryption_required": True
        }

    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the test file if it exists
        if os.path.exists(self.test_crossings_file):
            os.remove(self.test_crossings_file)

    def test_register_crossing(self):
        """Test registering a new crossing."""
        # Register the crossing
        crossing_id = self.protocol.register_crossing(self.sample_crossing)
        
        # Verify the crossing was registered
        self.assertIsNotNone(crossing_id)
        self.assertEqual(crossing_id, self.sample_crossing["crossing_id"])
        self.assertIn(crossing_id, self.protocol.crossings)
        
        # Verify schema validation was called
        self.schema_validator.validate.assert_called_once()
        
        # Verify boundary detection engine was used
        self.boundary_detection_engine.get_boundary.assert_called()
        
        # Verify seal verification service was used
        self.seal_verification_service.create_seal.assert_called()
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_register_crossing_with_invalid_schema(self):
        """Test registering a crossing with an invalid schema."""
        # Configure mock to return invalid validation
        validation_result = MagicMock()
        validation_result.is_valid = False
        validation_result.errors = ["Invalid schema"]
        self.schema_validator.validate.return_value = validation_result
        
        # Attempt to register the crossing
        with self.assertRaises(ValueError):
            self.protocol.register_crossing(self.sample_crossing)

    def test_register_crossing_with_nonexistent_source_boundary(self):
        """Test registering a crossing with a nonexistent source boundary."""
        # Configure boundary detection engine to return None for source boundary
        self.boundary_detection_engine.get_boundary.side_effect = lambda boundary_id: None if boundary_id == "source-boundary" else {
            "boundary_id": "target-boundary",
            "name": "Target Boundary",
            "boundary_type": "process",
            "status": "active"
        }
        
        # Attempt to register the crossing
        with self.assertRaises(ValueError):
            self.protocol.register_crossing(self.sample_crossing)

    def test_register_crossing_with_nonexistent_target_boundary(self):
        """Test registering a crossing with a nonexistent target boundary."""
        # Configure boundary detection engine to return None for target boundary
        self.boundary_detection_engine.get_boundary.side_effect = lambda boundary_id: {
            "boundary_id": "source-boundary",
            "name": "Source Boundary",
            "boundary_type": "process",
            "status": "active"
        } if boundary_id == "source-boundary" else None
        
        # Attempt to register the crossing
        with self.assertRaises(ValueError):
            self.protocol.register_crossing(self.sample_crossing)

    def test_get_crossing(self):
        """Test getting a crossing by ID."""
        # Register the crossing
        crossing_id = self.protocol.register_crossing(self.sample_crossing)
        
        # Get the crossing
        crossing = self.protocol.get_crossing(crossing_id)
        
        # Verify the crossing was retrieved
        self.assertIsNotNone(crossing)
        self.assertEqual(crossing["crossing_id"], crossing_id)
        self.assertEqual(crossing["source_boundary_id"], self.sample_crossing["source_boundary_id"])
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_nonexistent_crossing(self):
        """Test getting a crossing that doesn't exist."""
        # Attempt to get a nonexistent crossing
        crossing = self.protocol.get_crossing("nonexistent-crossing")
        
        # Verify None was returned
        self.assertIsNone(crossing)

    def test_update_crossing(self):
        """Test updating a crossing."""
        # Register the crossing
        crossing_id = self.protocol.register_crossing(self.sample_crossing)
        
        # Create updates
        updates = {
            "protocol": "HTTP",
            "port": 80,
            "path": "/api/data/updated",
            "authentication_required": False
        }
        
        # Update the crossing
        result = self.protocol.update_crossing(crossing_id, updates)
        
        # Verify the update was successful
        self.assertTrue(result)
        
        # Get the updated crossing
        updated_crossing = self.protocol.get_crossing(crossing_id)
        
        # Verify the updates were applied
        self.assertEqual(updated_crossing["protocol"], updates["protocol"])
        self.assertEqual(updated_crossing["port"], updates["port"])
        self.assertEqual(updated_crossing["path"], updates["path"])
        self.assertEqual(updated_crossing["authentication_required"], updates["authentication_required"])
        
        # Verify schema validation was called
        self.schema_validator.validate.assert_called()
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_update_nonexistent_crossing(self):
        """Test updating a crossing that doesn't exist."""
        # Attempt to update a nonexistent crossing
        result = self.protocol.update_crossing("nonexistent-crossing", {"protocol": "HTTP"})
        
        # Verify the update failed
        self.assertFalse(result)

    def test_delete_crossing(self):
        """Test deleting a crossing."""
        # Register the crossing
        crossing_id = self.protocol.register_crossing(self.sample_crossing)
        
        # Delete the crossing
        result = self.protocol.delete_crossing(crossing_id)
        
        # Verify the deletion was successful
        self.assertTrue(result)
        
        # Verify the crossing was removed
        self.assertNotIn(crossing_id, self.protocol.crossings)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_delete_nonexistent_crossing(self):
        """Test deleting a crossing that doesn't exist."""
        # Attempt to delete a nonexistent crossing
        result = self.protocol.delete_crossing("nonexistent-crossing")
        
        # Verify the deletion failed
        self.assertFalse(result)

    def test_list_crossings(self):
        """Test listing crossings."""
        # Register multiple crossings
        crossing1 = self.sample_crossing.copy()
        crossing1["crossing_id"] = f"crossing-{str(uuid.uuid4())}"
        crossing1["crossing_type"] = "data-transfer"
        
        crossing2 = self.sample_crossing.copy()
        crossing2["crossing_id"] = f"crossing-{str(uuid.uuid4())}"
        crossing2["crossing_type"] = "control-transfer"
        
        crossing3 = self.sample_crossing.copy()
        crossing3["crossing_id"] = f"crossing-{str(uuid.uuid4())}"
        crossing3["crossing_type"] = "data-transfer"
        crossing3["status"] = "deprecated"
        
        self.protocol.register_crossing(crossing1)
        self.protocol.register_crossing(crossing2)
        self.protocol.register_crossing(crossing3)
        
        # List all crossings
        crossings = self.protocol.list_crossings()
        
        # Verify all crossings were returned
        self.assertEqual(len(crossings), 3)
        
        # List crossings by type
        data_crossings = self.protocol.list_crossings(crossing_type="data-transfer")
        
        # Verify only data crossings were returned
        self.assertEqual(len(data_crossings), 2)
        for crossing in data_crossings:
            self.assertEqual(crossing["crossing_type"], "data-transfer")
        
        # List crossings by status
        active_crossings = self.protocol.list_crossings(status="active")
        
        # Verify only active crossings were returned
        self.assertEqual(len(active_crossings), 2)
        for crossing in active_crossings:
            self.assertEqual(crossing["status"], "active")
        
        # List crossings by type and status
        active_data_crossings = self.protocol.list_crossings(crossing_type="data-transfer", status="active")
        
        # Verify only active data crossings were returned
        self.assertEqual(len(active_data_crossings), 1)
        for crossing in active_data_crossings:
            self.assertEqual(crossing["crossing_type"], "data-transfer")
            self.assertEqual(crossing["status"], "active")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_crossings_for_boundary(self):
        """Test getting crossings for a boundary."""
        # Register multiple crossings
        crossing1 = self.sample_crossing.copy()
        crossing1["crossing_id"] = f"crossing-{str(uuid.uuid4())}"
        crossing1["source_boundary_id"] = "boundary-1"
        crossing1["target_boundary_id"] = "boundary-2"
        
        crossing2 = self.sample_crossing.copy()
        crossing2["crossing_id"] = f"crossing-{str(uuid.uuid4())}"
        crossing2["source_boundary_id"] = "boundary-2"
        crossing2["target_boundary_id"] = "boundary-3"
        
        crossing3 = self.sample_crossing.copy()
        crossing3["crossing_id"] = f"crossing-{str(uuid.uuid4())}"
        crossing3["source_boundary_id"] = "boundary-1"
        crossing3["target_boundary_id"] = "boundary-3"
        
        # Configure boundary detection engine to return boundaries
        self.boundary_detection_engine.get_boundary.side_effect = lambda boundary_id: {
            "boundary_id": boundary_id,
            "name": f"Boundary {boundary_id}",
            "boundary_type": "process",
            "status": "active"
        }
        
        self.protocol.register_crossing(crossing1)
        self.protocol.register_crossing(crossing2)
        self.protocol.register_crossing(crossing3)
        
        # Get crossings for boundary-1 as source
        source_crossings = self.protocol.get_crossings_for_boundary("boundary-1", "source")
        
        # Verify only crossings with boundary-1 as source were returned
        self.assertEqual(len(source_crossings), 2)
        for crossing in source_crossings:
            self.assertEqual(crossing["source_boundary_id"], "boundary-1")
        
        # Get crossings for boundary-3 as target
        target_crossings = self.protocol.get_crossings_for_boundary("boundary-3", "target")
        
        # Verify only crossings with boundary-3 as target were returned
        self.assertEqual(len(target_crossings), 2)
        for crossing in target_crossings:
            self.assertEqual(crossing["target_boundary_id"], "boundary-3")
        
        # Get all crossings for boundary-2
        all_crossings = self.protocol.get_crossings_for_boundary("boundary-2", "all")
        
        # Verify all crossings involving boundary-2 were returned
        self.assertEqual(len(all_crossings), 2)
        for crossing in all_crossings:
            self.assertTrue(
                crossing["source_boundary_id"] == "boundary-2" or
                crossing["target_boundary_id"] == "boundary-2"
            )
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_validate_crossing(self):
        """Test validating a crossing."""
        # Register the crossing
        crossing_id = self.protocol.register_crossing(self.sample_crossing)
        
        # Validate the crossing
        validation_result = self.protocol.validate_crossing(crossing_id)
        
        # Verify the validation was successful
        self.assertTrue(validation_result.is_valid)
        self.assertEqual(len(validation_result.violations), 0)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_validate_crossing_with_violations(self):
        """Test validating a crossing with violations."""
        # Register the crossing
        crossing = self.sample_crossing.copy()
        crossing["encryption_required"] = True
        crossing_id = self.protocol.register_crossing(crossing)
        
        # Configure validation to find violations
        self.protocol._check_authentication = MagicMock(return_value=(False, "Authentication failed"))
        self.protocol._check_authorization = MagicMock(return_value=(True, ""))
        self.protocol._check_encryption = MagicMock(return_value=(False, "Encryption failed"))
        
        # Validate the crossing
        validation_result = self.protocol.validate_crossing(crossing_id)
        
        # Verify the validation found violations
        self.assertFalse(validation_result.is_valid)
        self.assertEqual(len(validation_result.violations), 2)
        
        # Verify the violations were recorded correctly
        violation_types = [v["violation_type"] for v in validation_result.violations]
        self.assertIn("authentication", violation_types)
        self.assertIn("encryption", violation_types)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_validate_nonexistent_crossing(self):
        """Test validating a nonexistent crossing."""
        # Attempt to validate a nonexistent crossing
        with self.assertRaises(ValueError):
            self.protocol.validate_crossing("nonexistent-crossing")

    def test_add_crossing_control(self):
        """Test adding a control to a crossing."""
        # Register the crossing
        crossing_id = self.protocol.register_crossing(self.sample_crossing)
        
        # Create a control
        control = {
            "control_id": f"control-{str(uuid.uuid4())}",
            "control_type": "authentication",
            "name": "Test Authentication Control",
            "description": "A test authentication control",
            "implementation": {
                "type": "token-based",
                "mechanism": "JWT"
            },
            "status": "active"
        }
        
        # Add the control to the crossing
        result = self.protocol.add_crossing_control(crossing_id, control)
        
        # Verify the control was added successfully
        self.assertTrue(result)
        
        # Get the updated crossing
        updated_crossing = self.protocol.get_crossing(crossing_id)
        
        # Verify the control was added to the crossing
        self.assertIn("controls", updated_crossing)
        self.assertEqual(len(updated_crossing["controls"]), 1)
        self.assertEqual(updated_crossing["controls"][0]["control_id"], control["control_id"])
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_add_control_to_nonexistent_crossing(self):
        """Test adding a control to a nonexistent crossing."""
        # Create a control
        control = {
            "control_id": f"control-{str(uuid.uuid4())}",
            "control_type": "authentication",
            "name": "Test Authentication Control",
            "description": "A test authentication control",
            "implementation": {
                "type": "token-based",
                "mechanism": "JWT"
            },
            "status": "active"
        }
        
        # Attempt to add the control to a nonexistent crossing
        result = self.protocol.add_crossing_control("nonexistent-crossing", control)
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_remove_crossing_control(self):
        """Test removing a control from a crossing."""
        # Register the crossing
        crossing_id = self.protocol.register_crossing(self.sample_crossing)
        
        # Create a control
        control = {
            "control_id": f"control-{str(uuid.uuid4())}",
            "control_type": "authentication",
            "name": "Test Authentication Control",
            "description": "A test authentication control",
            "implementation": {
                "type": "token-based",
                "mechanism": "JWT"
            },
            "status": "active"
        }
        
        # Add the control to the crossing
        self.protocol.add_crossing_control(crossing_id, control)
        
        # Remove the control from the crossing
        result = self.protocol.remove_crossing_control(crossing_id, control["control_id"])
        
        # Verify the control was removed successfully
        self.assertTrue(result)
        
        # Get the updated crossing
        updated_crossing = self.protocol.get_crossing(crossing_id)
        
        # Verify the control was removed from the crossing
        self.assertEqual(len(updated_crossing["controls"]), 0)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_remove_nonexistent_control(self):
        """Test removing a nonexistent control from a crossing."""
        # Register the crossing
        crossing_id = self.protocol.register_crossing(self.sample_crossing)
        
        # Attempt to remove a nonexistent control
        result = self.protocol.remove_crossing_control(crossing_id, "nonexistent-control")
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_get_crossing_controls(self):
        """Test getting controls for a crossing."""
        # Register the crossing
        crossing_id = self.protocol.register_crossing(self.sample_crossing)
        
        # Create controls
        control1 = {
            "control_id": f"control-{str(uuid.uuid4())}",
            "control_type": "authentication",
            "name": "Test Authentication Control",
            "description": "A test authentication control",
            "implementation": {
                "type": "token-based",
                "mechanism": "JWT"
            },
            "status": "active"
        }
        
        control2 = {
            "control_id": f"control-{str(uuid.uuid4())}",
            "control_type": "encryption",
            "name": "Test Encryption Control",
            "description": "A test encryption control",
            "implementation": {
                "type": "transport-layer",
                "mechanism": "TLS"
            },
            "status": "active"
        }
        
        # Add the controls to the crossing
        self.protocol.add_crossing_control(crossing_id, control1)
        self.protocol.add_crossing_control(crossing_id, control2)
        
        # Get the controls for the crossing
        controls = self.protocol.get_crossing_controls(crossing_id)
        
        # Verify the controls were returned
        self.assertEqual(len(controls), 2)
        control_ids = [c["control_id"] for c in controls]
        self.assertIn(control1["control_id"], control_ids)
        self.assertIn(control2["control_id"], control_ids)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_controls_for_nonexistent_crossing(self):
        """Test getting controls for a nonexistent crossing."""
        # Attempt to get controls for a nonexistent crossing
        controls = self.protocol.get_crossing_controls("nonexistent-crossing")
        
        # Verify an empty list was returned
        self.assertEqual(len(controls), 0)

    def test_file_operations(self):
        """Test file operations (load and save)."""
        # Register a crossing
        crossing_id = self.protocol.register_crossing(self.sample_crossing)
        
        # Create a new protocol instance with the same file path
        new_protocol = BoundaryCrossingProtocol(
            boundary_detection_engine=self.boundary_detection_engine,
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            crossings_file_path=self.test_crossings_file
        )
        
        # Verify the crossing was loaded from the file
        self.assertIn(crossing_id, new_protocol.crossings)
        self.assertEqual(new_protocol.crossings[crossing_id]["source_boundary_id"], self.sample_crossing["source_boundary_id"])

    def test_contract_tether_verification_failure(self):
        """Test behavior when contract tether verification fails."""
        # Configure mock to fail contract tether verification
        self.seal_verification_service.verify_contract_tether.return_value = False
        
        # Attempt to register a crossing
        with self.assertRaises(ValueError):
            self.protocol.register_crossing(self.sample_crossing)

if __name__ == '__main__':
    unittest.main()
