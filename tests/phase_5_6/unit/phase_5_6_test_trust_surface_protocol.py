"""
Unit tests for Trust Surface Protocol component of Phase 5.6.

This module contains tests for the trust_surface_protocol.py implementation,
ensuring proper trust surface management functionality in the distributed trust system.

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
from src.core.trust.trust_surface_protocol import TrustSurfaceProtocol
from src.core.common.schema_validator import SchemaValidator

@pytest.mark.phase_5_6
class TestTrustSurfaceProtocol(unittest.TestCase):
    """Test cases for the TrustSurfaceProtocol class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with real dependencies
        self.schema_validator = SchemaValidator(schema_dir="schemas")
        self.trust_surface_protocol = TrustSurfaceProtocol(self.schema_validator)
        
        # Test data
        self.node_id = str(uuid.uuid4())
        self.boundary_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
        self.surface_type = "standard"
        self.metadata = {"visibility": "public", "description": "Test surface"}
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        trust_surface_protocol = TrustSurfaceProtocol(self.schema_validator)
        self.assertIsNotNone(trust_surface_protocol)
        
    def test_init_without_schema_validator(self):
        """Test initialization without schema validator."""
        with self.assertRaises(ValueError):
            TrustSurfaceProtocol(None)
            
    def test_create_trust_surface(self):
        """Test creating a trust surface."""
        surface = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            self.boundary_ids,
            self.surface_type,
            self.metadata
        )
        
        # Verify surface structure
        self.assertIn("surface_id", surface)
        self.assertEqual(surface["node_id"], self.node_id)
        self.assertEqual(surface["boundary_ids"], self.boundary_ids)
        self.assertEqual(surface["surface_type"], self.surface_type)
        self.assertEqual(surface["metadata"]["visibility"], "public")
        self.assertEqual(surface["status"], "active")
        
    def test_validate_trust_surface(self):
        """Test validating a trust surface."""
        surface = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            self.boundary_ids,
            self.surface_type,
            self.metadata
        )
        
        # Should not raise an exception
        self.trust_surface_protocol.validate_trust_surface(surface)
        
    def test_validate_invalid_trust_surface(self):
        """Test validating an invalid trust surface."""
        surface = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            self.boundary_ids,
            self.surface_type,
            self.metadata
        )
        
        # Corrupt the surface
        surface.pop("surface_id")
        
        with self.assertRaises(ValueError):
            self.trust_surface_protocol.validate_trust_surface(surface)
            
    def test_get_trust_surface(self):
        """Test retrieving a trust surface."""
        surface = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            self.boundary_ids,
            self.surface_type,
            self.metadata
        )
        
        retrieved_surface = self.trust_surface_protocol.get_trust_surface(surface["surface_id"])
        
        # Verify retrieved surface
        self.assertEqual(retrieved_surface["surface_id"], surface["surface_id"])
        
    def test_get_nonexistent_trust_surface(self):
        """Test retrieving a non-existent trust surface."""
        with self.assertRaises(ValueError):
            self.trust_surface_protocol.get_trust_surface("nonexistent-id")
            
    def test_update_trust_surface(self):
        """Test updating a trust surface."""
        surface = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            self.boundary_ids,
            self.surface_type,
            self.metadata
        )
        
        new_boundary_ids = [str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())]
        new_metadata = {"visibility": "restricted", "description": "Updated test surface"}
        
        updated_surface = self.trust_surface_protocol.update_trust_surface(
            surface["surface_id"],
            boundary_ids=new_boundary_ids,
            metadata=new_metadata
        )
        
        # Verify updated surface
        self.assertEqual(updated_surface["surface_id"], surface["surface_id"])
        self.assertEqual(updated_surface["boundary_ids"], new_boundary_ids)
        self.assertEqual(updated_surface["metadata"]["visibility"], "restricted")
        
    def test_update_trust_surface_status(self):
        """Test updating a trust surface status."""
        surface = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            self.boundary_ids,
            self.surface_type,
            self.metadata
        )
        
        updated_surface = self.trust_surface_protocol.update_trust_surface(
            surface["surface_id"],
            status="inactive"
        )
        
        # Verify updated status
        self.assertEqual(updated_surface["status"], "inactive")
        
    def test_update_trust_surface_invalid_status(self):
        """Test updating a trust surface with invalid status."""
        surface = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            self.boundary_ids,
            self.surface_type,
            self.metadata
        )
        
        with self.assertRaises(ValueError):
            self.trust_surface_protocol.update_trust_surface(
                surface["surface_id"],
                status="invalid-status"
            )
            
    def test_delete_trust_surface(self):
        """Test deleting a trust surface."""
        surface = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            self.boundary_ids,
            self.surface_type,
            self.metadata
        )
        
        result = self.trust_surface_protocol.delete_trust_surface(surface["surface_id"])
        self.assertTrue(result)
        
        # Verify surface is deleted
        with self.assertRaises(ValueError):
            self.trust_surface_protocol.get_trust_surface(surface["surface_id"])
            
    def test_list_trust_surfaces(self):
        """Test listing all trust surfaces."""
        # Create multiple surfaces
        surface1 = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [str(uuid.uuid4())],
            "standard",
            {"visibility": "public"}
        )
        
        surface2 = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [str(uuid.uuid4())],
            "enhanced",
            {"visibility": "private"}
        )
        
        surfaces = self.trust_surface_protocol.list_trust_surfaces()
        
        # Verify surfaces list
        self.assertEqual(len(surfaces), 2)
        self.assertIn(surface1["surface_id"], [s["surface_id"] for s in surfaces])
        self.assertIn(surface2["surface_id"], [s["surface_id"] for s in surfaces])
        
    def test_filter_surfaces_by_type(self):
        """Test filtering surfaces by type."""
        # Create multiple surfaces
        surface1 = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [str(uuid.uuid4())],
            "standard",
            {"visibility": "public"}
        )
        
        surface2 = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [str(uuid.uuid4())],
            "enhanced",
            {"visibility": "private"}
        )
        
        filtered_surfaces = self.trust_surface_protocol.filter_surfaces_by_type("standard")
        
        # Verify filtered surfaces
        self.assertEqual(len(filtered_surfaces), 1)
        self.assertEqual(filtered_surfaces[0]["surface_id"], surface1["surface_id"])
        
    def test_filter_surfaces_by_boundary(self):
        """Test filtering surfaces by boundary ID."""
        # Create a boundary ID to filter by
        boundary_id = str(uuid.uuid4())
        
        # Create multiple surfaces
        surface1 = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [boundary_id, str(uuid.uuid4())],
            "standard",
            {"visibility": "public"}
        )
        
        surface2 = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [str(uuid.uuid4())],
            "enhanced",
            {"visibility": "private"}
        )
        
        filtered_surfaces = self.trust_surface_protocol.filter_surfaces_by_boundary(boundary_id)
        
        # Verify filtered surfaces
        self.assertEqual(len(filtered_surfaces), 1)
        self.assertEqual(filtered_surfaces[0]["surface_id"], surface1["surface_id"])
        
    def test_merge_surfaces(self):
        """Test merging multiple trust surfaces."""
        # Create multiple surfaces
        surface1 = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [str(uuid.uuid4()), str(uuid.uuid4())],
            "standard",
            {"visibility": "public"}
        )
        
        surface2 = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [str(uuid.uuid4())],
            "enhanced",
            {"visibility": "private"}
        )
        
        # Merge surfaces
        merged_surface = self.trust_surface_protocol.merge_surfaces(
            self.node_id,
            [surface1["surface_id"], surface2["surface_id"]],
            "composite",
            {"visibility": "restricted"}
        )
        
        # Verify merged surface
        self.assertIn("surface_id", merged_surface)
        self.assertEqual(merged_surface["surface_type"], "composite")
        self.assertEqual(merged_surface["metadata"]["visibility"], "restricted")
        
        # Verify all boundary IDs are included
        for boundary_id in surface1["boundary_ids"]:
            self.assertIn(boundary_id, merged_surface["boundary_ids"])
        for boundary_id in surface2["boundary_ids"]:
            self.assertIn(boundary_id, merged_surface["boundary_ids"])
        
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should return True for valid contract and phase
        result = self.trust_surface_protocol._codex_tether_check()
        self.assertTrue(result)
        
if __name__ == '__main__':
    unittest.main()
