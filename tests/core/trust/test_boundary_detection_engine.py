"""
Unit tests for the Boundary Detection Engine.

This module contains unit tests for the Boundary Detection Engine component
of the Trust Boundary Definition framework.
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.common.schema_validator import SchemaValidator
from src.core.verification.seal_verification import SealVerificationService

class TestBoundaryDetectionEngine(unittest.TestCase):
    """Test cases for the BoundaryDetectionEngine class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.schema_validator = MagicMock(spec=SchemaValidator)
        self.seal_verification_service = MagicMock(spec=SealVerificationService)
        
        # Configure mock behavior
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        self.schema_validator.validate.return_value = validation_result
        
        self.seal_verification_service.create_seal.return_value = "mock-seal"
        self.seal_verification_service.verify_seal.return_value = True
        self.seal_verification_service.verify_contract_tether.return_value = True
        
        # Create a temporary file path for testing
        self.test_boundaries_file = "/tmp/test_boundaries.json"
        
        # Create the engine instance
        self.engine = BoundaryDetectionEngine(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            boundaries_file_path=self.test_boundaries_file
        )
        
        # Sample boundary for testing
        self.sample_boundary = {
            "boundary_id": f"boundary-{str(uuid.uuid4())}",
            "name": "Test Boundary",
            "description": "A test boundary for unit testing",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        }

    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the test file if it exists
        if os.path.exists(self.test_boundaries_file):
            os.remove(self.test_boundaries_file)

    def test_register_boundary(self):
        """Test registering a new boundary."""
        # Register the boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
        # Verify the boundary was registered
        self.assertIsNotNone(boundary_id)
        self.assertEqual(boundary_id, self.sample_boundary["boundary_id"])
        self.assertIn(boundary_id, self.engine.boundaries)
        
        # Verify schema validation was called
        self.schema_validator.validate.assert_called_once()
        
        # Verify seal verification service was used
        self.seal_verification_service.create_seal.assert_called()
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_register_boundary_with_invalid_schema(self):
        """Test registering a boundary with an invalid schema."""
        # Configure mock to return invalid validation
        validation_result = MagicMock()
        validation_result.is_valid = False
        validation_result.errors = ["Invalid schema"]
        self.schema_validator.validate.return_value = validation_result
        
        # Attempt to register the boundary
        with self.assertRaises(ValueError):
            self.engine.register_boundary(self.sample_boundary)

    def test_get_boundary(self):
        """Test getting a boundary by ID."""
        # Register the boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
        # Get the boundary
        boundary = self.engine.get_boundary(boundary_id)
        
        # Verify the boundary was retrieved
        self.assertIsNotNone(boundary)
        self.assertEqual(boundary["boundary_id"], boundary_id)
        self.assertEqual(boundary["name"], self.sample_boundary["name"])
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_nonexistent_boundary(self):
        """Test getting a boundary that doesn't exist."""
        # Attempt to get a nonexistent boundary
        boundary = self.engine.get_boundary("nonexistent-boundary")
        
        # Verify None was returned
        self.assertIsNone(boundary)

    def test_update_boundary(self):
        """Test updating a boundary."""
        # Register the boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
        # Create updates
        updates = {
            "name": "Updated Test Boundary",
            "description": "An updated test boundary for unit testing",
            "classification": "restricted"
        }
        
        # Update the boundary
        result = self.engine.update_boundary(boundary_id, updates)
        
        # Verify the update was successful
        self.assertTrue(result)
        
        # Get the updated boundary
        updated_boundary = self.engine.get_boundary(boundary_id)
        
        # Verify the updates were applied
        self.assertEqual(updated_boundary["name"], updates["name"])
        self.assertEqual(updated_boundary["description"], updates["description"])
        self.assertEqual(updated_boundary["classification"], updates["classification"])
        
        # Verify schema validation was called
        self.schema_validator.validate.assert_called()
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_update_nonexistent_boundary(self):
        """Test updating a boundary that doesn't exist."""
        # Attempt to update a nonexistent boundary
        result = self.engine.update_boundary("nonexistent-boundary", {"name": "Updated"})
        
        # Verify the update failed
        self.assertFalse(result)

    def test_delete_boundary(self):
        """Test deleting a boundary."""
        # Register the boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
        # Delete the boundary
        result = self.engine.delete_boundary(boundary_id)
        
        # Verify the deletion was successful
        self.assertTrue(result)
        
        # Verify the boundary was removed
        self.assertNotIn(boundary_id, self.engine.boundaries)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_delete_nonexistent_boundary(self):
        """Test deleting a boundary that doesn't exist."""
        # Attempt to delete a nonexistent boundary
        result = self.engine.delete_boundary("nonexistent-boundary")
        
        # Verify the deletion failed
        self.assertFalse(result)

    def test_list_boundaries(self):
        """Test listing boundaries."""
        # Register multiple boundaries
        boundary1 = self.sample_boundary.copy()
        boundary1["boundary_id"] = f"boundary-{str(uuid.uuid4())}"
        boundary1["boundary_type"] = "process"
        
        boundary2 = self.sample_boundary.copy()
        boundary2["boundary_id"] = f"boundary-{str(uuid.uuid4())}"
        boundary2["boundary_type"] = "network"
        
        boundary3 = self.sample_boundary.copy()
        boundary3["boundary_id"] = f"boundary-{str(uuid.uuid4())}"
        boundary3["boundary_type"] = "process"
        boundary3["status"] = "deprecated"
        
        self.engine.register_boundary(boundary1)
        self.engine.register_boundary(boundary2)
        self.engine.register_boundary(boundary3)
        
        # List all boundaries
        boundaries = self.engine.list_boundaries()
        
        # Verify all boundaries were returned
        self.assertEqual(len(boundaries), 3)
        
        # List boundaries by type
        process_boundaries = self.engine.list_boundaries(boundary_type="process")
        
        # Verify only process boundaries were returned
        self.assertEqual(len(process_boundaries), 2)
        for boundary in process_boundaries:
            self.assertEqual(boundary["boundary_type"], "process")
        
        # List boundaries by status
        active_boundaries = self.engine.list_boundaries(status="active")
        
        # Verify only active boundaries were returned
        self.assertEqual(len(active_boundaries), 2)
        for boundary in active_boundaries:
            self.assertEqual(boundary["status"], "active")
        
        # List boundaries by type and status
        active_process_boundaries = self.engine.list_boundaries(boundary_type="process", status="active")
        
        # Verify only active process boundaries were returned
        self.assertEqual(len(active_process_boundaries), 1)
        for boundary in active_process_boundaries:
            self.assertEqual(boundary["boundary_type"], "process")
            self.assertEqual(boundary["status"], "active")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_search_boundaries(self):
        """Test searching boundaries."""
        # Register multiple boundaries
        boundary1 = self.sample_boundary.copy()
        boundary1["boundary_id"] = f"boundary-{str(uuid.uuid4())}"
        boundary1["name"] = "API Gateway Boundary"
        boundary1["description"] = "Boundary for the API Gateway"
        
        boundary2 = self.sample_boundary.copy()
        boundary2["boundary_id"] = f"boundary-{str(uuid.uuid4())}"
        boundary2["name"] = "Database Boundary"
        boundary2["description"] = "Boundary for the database"
        
        boundary3 = self.sample_boundary.copy()
        boundary3["boundary_id"] = f"boundary-{str(uuid.uuid4())}"
        boundary3["name"] = "User Service Boundary"
        boundary3["description"] = "Boundary for the user service"
        
        self.engine.register_boundary(boundary1)
        self.engine.register_boundary(boundary2)
        self.engine.register_boundary(boundary3)
        
        # Search for boundaries containing "API" in name
        api_boundaries = self.engine.search_boundaries("API")
        
        # Verify only API boundaries were returned
        self.assertEqual(len(api_boundaries), 1)
        self.assertEqual(api_boundaries[0]["name"], "API Gateway Boundary")
        
        # Search for boundaries containing "service" in description
        service_boundaries = self.engine.search_boundaries("service")
        
        # Verify only service boundaries were returned
        self.assertEqual(len(service_boundaries), 1)
        self.assertEqual(service_boundaries[0]["name"], "User Service Boundary")
        
        # Search for boundaries containing "boundary" in name or description
        boundary_boundaries = self.engine.search_boundaries("boundary")
        
        # Verify all boundaries were returned (case-insensitive)
        self.assertEqual(len(boundary_boundaries), 3)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_add_boundary_control(self):
        """Test adding a control to a boundary."""
        # Register the boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
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
        
        # Add the control to the boundary
        result = self.engine.add_boundary_control(boundary_id, control)
        
        # Verify the control was added successfully
        self.assertTrue(result)
        
        # Get the updated boundary
        updated_boundary = self.engine.get_boundary(boundary_id)
        
        # Verify the control was added to the boundary
        self.assertIn("controls", updated_boundary)
        self.assertEqual(len(updated_boundary["controls"]), 1)
        self.assertEqual(updated_boundary["controls"][0]["control_id"], control["control_id"])
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_add_control_to_nonexistent_boundary(self):
        """Test adding a control to a nonexistent boundary."""
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
        
        # Attempt to add the control to a nonexistent boundary
        result = self.engine.add_boundary_control("nonexistent-boundary", control)
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_remove_boundary_control(self):
        """Test removing a control from a boundary."""
        # Register the boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
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
        
        # Add the control to the boundary
        self.engine.add_boundary_control(boundary_id, control)
        
        # Remove the control from the boundary
        result = self.engine.remove_boundary_control(boundary_id, control["control_id"])
        
        # Verify the control was removed successfully
        self.assertTrue(result)
        
        # Get the updated boundary
        updated_boundary = self.engine.get_boundary(boundary_id)
        
        # Verify the control was removed from the boundary
        self.assertEqual(len(updated_boundary["controls"]), 0)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_remove_nonexistent_control(self):
        """Test removing a nonexistent control from a boundary."""
        # Register the boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
        # Attempt to remove a nonexistent control
        result = self.engine.remove_boundary_control(boundary_id, "nonexistent-control")
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_get_boundary_controls(self):
        """Test getting controls for a boundary."""
        # Register the boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
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
            "control_type": "authorization",
            "name": "Test Authorization Control",
            "description": "A test authorization control",
            "implementation": {
                "type": "role-based",
                "mechanism": "RBAC"
            },
            "status": "active"
        }
        
        # Add the controls to the boundary
        self.engine.add_boundary_control(boundary_id, control1)
        self.engine.add_boundary_control(boundary_id, control2)
        
        # Get the controls for the boundary
        controls = self.engine.get_boundary_controls(boundary_id)
        
        # Verify the controls were returned
        self.assertEqual(len(controls), 2)
        control_ids = [c["control_id"] for c in controls]
        self.assertIn(control1["control_id"], control_ids)
        self.assertIn(control2["control_id"], control_ids)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_controls_for_nonexistent_boundary(self):
        """Test getting controls for a nonexistent boundary."""
        # Attempt to get controls for a nonexistent boundary
        controls = self.engine.get_boundary_controls("nonexistent-boundary")
        
        # Verify an empty list was returned
        self.assertEqual(len(controls), 0)

    def test_add_entry_point(self):
        """Test adding an entry point to a boundary."""
        # Register the boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
        # Create an entry point
        entry_point = {
            "entry_point_id": f"entry-point-{str(uuid.uuid4())}",
            "name": "Test Entry Point",
            "description": "A test entry point",
            "protocol": "HTTP",
            "port": 8080,
            "path": "/api/test",
            "authentication_required": True,
            "authorization_required": True
        }
        
        # Add the entry point to the boundary
        result = self.engine.add_entry_point(boundary_id, entry_point)
        
        # Verify the entry point was added successfully
        self.assertTrue(result)
        
        # Get the updated boundary
        updated_boundary = self.engine.get_boundary(boundary_id)
        
        # Verify the entry point was added to the boundary
        self.assertIn("entry_points", updated_boundary)
        self.assertEqual(len(updated_boundary["entry_points"]), 1)
        self.assertEqual(updated_boundary["entry_points"][0]["entry_point_id"], entry_point["entry_point_id"])
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_add_exit_point(self):
        """Test adding an exit point to a boundary."""
        # Register the boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
        # Create an exit point
        exit_point = {
            "exit_point_id": f"exit-point-{str(uuid.uuid4())}",
            "name": "Test Exit Point",
            "description": "A test exit point",
            "protocol": "HTTP",
            "port": 8080,
            "path": "/api/external",
            "authentication_required": True,
            "encryption_required": True
        }
        
        # Add the exit point to the boundary
        result = self.engine.add_exit_point(boundary_id, exit_point)
        
        # Verify the exit point was added successfully
        self.assertTrue(result)
        
        # Get the updated boundary
        updated_boundary = self.engine.get_boundary(boundary_id)
        
        # Verify the exit point was added to the boundary
        self.assertIn("exit_points", updated_boundary)
        self.assertEqual(len(updated_boundary["exit_points"]), 1)
        self.assertEqual(updated_boundary["exit_points"][0]["exit_point_id"], exit_point["exit_point_id"])
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_file_operations(self):
        """Test file operations (load and save)."""
        # Register a boundary
        boundary_id = self.engine.register_boundary(self.sample_boundary)
        
        # Create a new engine instance with the same file path
        new_engine = BoundaryDetectionEngine(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            boundaries_file_path=self.test_boundaries_file
        )
        
        # Verify the boundary was loaded from the file
        self.assertIn(boundary_id, new_engine.boundaries)
        self.assertEqual(new_engine.boundaries[boundary_id]["name"], self.sample_boundary["name"])

    def test_contract_tether_verification_failure(self):
        """Test behavior when contract tether verification fails."""
        # Configure mock to fail contract tether verification
        self.seal_verification_service.verify_contract_tether.return_value = False
        
        # Attempt to register a boundary
        with self.assertRaises(ValueError):
            self.engine.register_boundary(self.sample_boundary)

if __name__ == '__main__':
    unittest.main()
