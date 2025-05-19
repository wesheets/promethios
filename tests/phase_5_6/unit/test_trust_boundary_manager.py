"""
Unit tests for Trust Boundary Manager component of Phase 5.6.

This module contains tests for the trust_boundary_manager.py implementation,
ensuring proper boundary management functionality in the distributed trust system.

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
from src.core.trust.trust_boundary_manager import TrustBoundaryManager
from src.core.common.schema_validator import SchemaValidator

@pytest.mark.phase_5_6
class TestTrustBoundaryManager(unittest.TestCase):
    """Test cases for the TrustBoundaryManager class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with real dependencies
        self.schema_validator = SchemaValidator(schema_dir="schemas")
        self.trust_boundary_manager = TrustBoundaryManager(self.schema_validator)
        
        # Test data
        self.node_id = str(uuid.uuid4())
        self.boundary_type = "internal"
        self.protected_resources = ["data_access", "execution_context"]
        self.metadata = {"sensitivity": "high", "description": "Test boundary"}
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        trust_boundary_manager = TrustBoundaryManager(self.schema_validator)
        self.assertIsNotNone(trust_boundary_manager)
        
    def test_init_without_schema_validator(self):
        """Test initialization without schema validator."""
        with self.assertRaises(ValueError):
            TrustBoundaryManager(None)
            
    def test_create_boundary(self):
        """Test creating a trust boundary."""
        boundary = self.trust_boundary_manager.create_boundary(
            self.node_id,
            self.boundary_type,
            self.protected_resources,
            self.metadata
        )
        
        # Verify boundary structure
        self.assertIn("boundary_id", boundary)
        self.assertEqual(boundary["node_id"], self.node_id)
        self.assertEqual(boundary["boundary_type"], self.boundary_type)
        self.assertEqual(boundary["protected_resources"], self.protected_resources)
        self.assertEqual(boundary["metadata"]["sensitivity"], "high")
        self.assertEqual(boundary["status"], "active")
        
    def test_validate_boundary(self):
        """Test validating a trust boundary."""
        boundary = self.trust_boundary_manager.create_boundary(
            self.node_id,
            self.boundary_type,
            self.protected_resources,
            self.metadata
        )
        
        # Should not raise an exception
        self.trust_boundary_manager.validate_boundary(boundary)
        
    def test_validate_invalid_boundary(self):
        """Test validating an invalid trust boundary."""
        boundary = self.trust_boundary_manager.create_boundary(
            self.node_id,
            self.boundary_type,
            self.protected_resources,
            self.metadata
        )
        
        # Corrupt the boundary
        boundary.pop("boundary_id")
        
        with self.assertRaises(ValueError):
            self.trust_boundary_manager.validate_boundary(boundary)
            
    def test_get_boundary(self):
        """Test retrieving a trust boundary."""
        boundary = self.trust_boundary_manager.create_boundary(
            self.node_id,
            self.boundary_type,
            self.protected_resources,
            self.metadata
        )
        
        retrieved_boundary = self.trust_boundary_manager.get_boundary(boundary["boundary_id"])
        
        # Verify retrieved boundary
        self.assertEqual(retrieved_boundary["boundary_id"], boundary["boundary_id"])
        
    def test_get_nonexistent_boundary(self):
        """Test retrieving a non-existent trust boundary."""
        with self.assertRaises(ValueError):
            self.trust_boundary_manager.get_boundary("nonexistent-id")
            
    def test_update_boundary(self):
        """Test updating a trust boundary."""
        boundary = self.trust_boundary_manager.create_boundary(
            self.node_id,
            self.boundary_type,
            self.protected_resources,
            self.metadata
        )
        
        new_resources = ["data_access", "execution_context", "network_access"]
        new_metadata = {"sensitivity": "critical", "description": "Updated test boundary"}
        
        updated_boundary = self.trust_boundary_manager.update_boundary(
            boundary["boundary_id"],
            protected_resources=new_resources,
            metadata=new_metadata
        )
        
        # Verify updated boundary
        self.assertEqual(updated_boundary["boundary_id"], boundary["boundary_id"])
        self.assertEqual(updated_boundary["protected_resources"], new_resources)
        self.assertEqual(updated_boundary["metadata"]["sensitivity"], "critical")
        
    def test_update_boundary_status(self):
        """Test updating a trust boundary status."""
        boundary = self.trust_boundary_manager.create_boundary(
            self.node_id,
            self.boundary_type,
            self.protected_resources,
            self.metadata
        )
        
        updated_boundary = self.trust_boundary_manager.update_boundary(
            boundary["boundary_id"],
            status="inactive"
        )
        
        # Verify updated status
        self.assertEqual(updated_boundary["status"], "inactive")
        
    def test_update_boundary_invalid_status(self):
        """Test updating a trust boundary with invalid status."""
        boundary = self.trust_boundary_manager.create_boundary(
            self.node_id,
            self.boundary_type,
            self.protected_resources,
            self.metadata
        )
        
        with self.assertRaises(ValueError):
            self.trust_boundary_manager.update_boundary(
                boundary["boundary_id"],
                status="invalid-status"
            )
            
    def test_delete_boundary(self):
        """Test deleting a trust boundary."""
        boundary = self.trust_boundary_manager.create_boundary(
            self.node_id,
            self.boundary_type,
            self.protected_resources,
            self.metadata
        )
        
        result = self.trust_boundary_manager.delete_boundary(boundary["boundary_id"])
        self.assertTrue(result)
        
        # Verify boundary is deleted
        with self.assertRaises(ValueError):
            self.trust_boundary_manager.get_boundary(boundary["boundary_id"])
            
    def test_list_boundaries(self):
        """Test listing all trust boundaries."""
        # Create multiple boundaries
        boundary1 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "internal",
            ["data_access"],
            {"sensitivity": "high"}
        )
        
        boundary2 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "external",
            ["network_access"],
            {"sensitivity": "medium"}
        )
        
        boundaries = self.trust_boundary_manager.list_boundaries()
        
        # Verify boundaries list
        self.assertEqual(len(boundaries), 2)
        self.assertIn(boundary1["boundary_id"], [b["boundary_id"] for b in boundaries])
        self.assertIn(boundary2["boundary_id"], [b["boundary_id"] for b in boundaries])
        
    def test_filter_boundaries_by_type(self):
        """Test filtering boundaries by type."""
        # Create multiple boundaries
        boundary1 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "internal",
            ["data_access"],
            {"sensitivity": "high"}
        )
        
        boundary2 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "external",
            ["network_access"],
            {"sensitivity": "medium"}
        )
        
        filtered_boundaries = self.trust_boundary_manager.filter_boundaries_by_type("internal")
        
        # Verify filtered boundaries
        self.assertEqual(len(filtered_boundaries), 1)
        self.assertEqual(filtered_boundaries[0]["boundary_id"], boundary1["boundary_id"])
        
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should return True for valid contract and phase
        result = self.trust_boundary_manager._codex_tether_check()
        self.assertTrue(result)
        
if __name__ == '__main__':
    unittest.main()
