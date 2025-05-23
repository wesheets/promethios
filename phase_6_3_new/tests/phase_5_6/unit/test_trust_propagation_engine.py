"""
Unit tests for Trust Propagation Engine component of Phase 5.6.

This module contains tests for the trust_propagation_engine.py implementation,
ensuring proper trust propagation functionality in the distributed trust system.

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
from src.core.trust.trust_propagation_engine import TrustPropagationEngine
from src.core.common.schema_validator import SchemaValidator

@pytest.mark.phase_5_6
class TestTrustPropagationEngine(unittest.TestCase):
    """Test cases for the TrustPropagationEngine class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with real dependencies
        self.schema_validator = SchemaValidator(schema_dir="schemas")
        self.trust_propagation_engine = TrustPropagationEngine(self.schema_validator)
        
        # Test data
        self.source_node_id = str(uuid.uuid4())
        self.surface_id = str(uuid.uuid4())
        self.target_node_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
        self.propagation_type = "transitive"
        self.metadata = {"trust_level": "high", "description": "Test propagation"}
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        trust_propagation_engine = TrustPropagationEngine(self.schema_validator)
        self.assertIsNotNone(trust_propagation_engine)
        
    def test_init_without_schema_validator(self):
        """Test initialization without schema validator."""
        with self.assertRaises(ValueError):
            TrustPropagationEngine(None)
            
    def test_create_propagation_record(self):
        """Test creating a trust propagation record."""
        record = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            self.propagation_type,
            self.metadata
        )
        
        # Verify record structure
        self.assertIn("propagation_id", record)
        self.assertEqual(record["source_node_id"], self.source_node_id)
        self.assertEqual(record["surface_id"], self.surface_id)
        self.assertEqual(record["target_node_ids"], self.target_node_ids)
        self.assertEqual(record["propagation_type"], self.propagation_type)
        self.assertEqual(record["metadata"]["trust_level"], "high")
        self.assertEqual(record["status"], "pending")
        self.assertEqual(record["successful_nodes"], [])
        self.assertEqual(record["failed_nodes"], [])
        
    def test_validate_propagation_record(self):
        """Test validating a trust propagation record."""
        record = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            self.propagation_type,
            self.metadata
        )
        
        # Should not raise an exception
        self.trust_propagation_engine.validate_propagation_record(record)
        
    def test_validate_invalid_propagation_record(self):
        """Test validating an invalid trust propagation record."""
        record = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            self.propagation_type,
            self.metadata
        )
        
        # Corrupt the record
        record.pop("propagation_id")
        
        with self.assertRaises(ValueError):
            self.trust_propagation_engine.validate_propagation_record(record)
            
    def test_propagate_trust(self):
        """Test propagating trust to target nodes."""
        result = self.trust_propagation_engine.propagate_trust(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            self.propagation_type,
            self.metadata
        )
        
        # Verify propagation result
        self.assertIn("propagation_id", result)
        self.assertEqual(result["source_node_id"], self.source_node_id)
        self.assertEqual(result["surface_id"], self.surface_id)
        self.assertEqual(result["target_node_ids"], self.target_node_ids)
        self.assertEqual(result["propagation_type"], self.propagation_type)
        self.assertEqual(result["metadata"]["trust_level"], "high")
        
        # In our implementation, all nodes should succeed by default
        self.assertEqual(len(result["successful_nodes"]), len(self.target_node_ids))
        self.assertEqual(len(result["failed_nodes"]), 0)
        self.assertEqual(result["status"], "complete")
        
    def test_get_propagation_record(self):
        """Test retrieving a trust propagation record."""
        record = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            self.propagation_type,
            self.metadata
        )
        
        retrieved_record = self.trust_propagation_engine.get_propagation_record(record["propagation_id"])
        
        # Verify retrieved record
        self.assertEqual(retrieved_record["propagation_id"], record["propagation_id"])
        
    def test_get_nonexistent_propagation_record(self):
        """Test retrieving a non-existent trust propagation record."""
        with self.assertRaises(ValueError):
            self.trust_propagation_engine.get_propagation_record("nonexistent-id")
            
    def test_list_propagation_records(self):
        """Test listing all trust propagation records."""
        # Create multiple records
        record1 = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            "transitive",
            {"trust_level": "high"}
        )
        
        record2 = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            str(uuid.uuid4()),  # Different surface_id
            [str(uuid.uuid4())],  # Different target node IDs
            "direct",
            {"trust_level": "medium"}
        )
        
        records = self.trust_propagation_engine.list_propagation_records()
        
        # Verify records list
        self.assertEqual(len(records), 2)
        self.assertIn(record1["propagation_id"], [r["propagation_id"] for r in records])
        self.assertIn(record2["propagation_id"], [r["propagation_id"] for r in records])
        
    def test_filter_propagation_records_by_type(self):
        """Test filtering trust propagation records by type."""
        # Create multiple records
        record1 = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            "transitive",
            {"trust_level": "high"}
        )
        
        record2 = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            str(uuid.uuid4()),  # Different surface_id
            [str(uuid.uuid4())],  # Different target node IDs
            "direct",
            {"trust_level": "medium"}
        )
        
        filtered_records = self.trust_propagation_engine.filter_propagation_records_by_type("transitive")
        
        # Verify filtered records
        self.assertEqual(len(filtered_records), 1)
        self.assertEqual(filtered_records[0]["propagation_id"], record1["propagation_id"])
        
    def test_filter_propagation_records_by_surface(self):
        """Test filtering trust propagation records by surface ID."""
        # Create multiple records
        record1 = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            "transitive",
            {"trust_level": "high"}
        )
        
        record2 = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            str(uuid.uuid4()),  # Different surface_id
            [str(uuid.uuid4())],  # Different target node IDs
            "direct",
            {"trust_level": "medium"}
        )
        
        filtered_records = self.trust_propagation_engine.filter_propagation_records_by_surface(self.surface_id)
        
        # Verify filtered records
        self.assertEqual(len(filtered_records), 1)
        self.assertEqual(filtered_records[0]["propagation_id"], record1["propagation_id"])
        
    def test_filter_propagation_records_by_status(self):
        """Test filtering trust propagation records by status."""
        # Create a record
        record = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            "transitive",
            {"trust_level": "high"}
        )
        
        filtered_records = self.trust_propagation_engine.filter_propagation_records_by_status("pending")
        
        # Verify filtered records
        self.assertEqual(len(filtered_records), 1)
        self.assertEqual(filtered_records[0]["propagation_id"], record["propagation_id"])
        
    def test_retry_failed_propagations(self):
        """Test retrying failed propagations."""
        # Create a record with failed nodes
        record = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            "transitive",
            {"trust_level": "high"}
        )
        
        # Manually set failed nodes
        record["failed_nodes"] = self.target_node_ids
        record["successful_nodes"] = []
        record["status"] = "failed"
        
        # Store the modified record
        self.trust_propagation_engine.propagation_records[record["propagation_id"]] = record
        
        # Retry failed propagations
        with patch.object(self.trust_propagation_engine, 'propagation_records', {record["propagation_id"]: record}):
            result = self.trust_propagation_engine.retry_failed_propagations(record["propagation_id"])
            
            # Verify result
            self.assertIn("propagation_id", result)
            self.assertTrue(len(result["successful_nodes"]) > 0 or len(result["failed_nodes"]) > 0)
            self.assertIn(result["status"], ["complete", "partial", "failed"])
        
    def test_retry_with_no_failed_nodes(self):
        """Test retrying propagations with no failed nodes."""
        # Create a record with no failed nodes
        record = self.trust_propagation_engine.create_propagation_record(
            self.source_node_id,
            self.surface_id,
            self.target_node_ids,
            "transitive",
            {"trust_level": "high"}
        )
        
        # Manually set successful nodes
        record["successful_nodes"] = self.target_node_ids
        record["failed_nodes"] = []
        record["status"] = "complete"
        
        # Store the modified record
        self.trust_propagation_engine.propagation_records[record["propagation_id"]] = record
        
        # Retry should raise an error
        with self.assertRaises(ValueError):
            self.trust_propagation_engine.retry_failed_propagations(record["propagation_id"])
        
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should return True for valid contract and phase
        result = self.trust_propagation_engine._codex_tether_check()
        self.assertTrue(result)
        
if __name__ == '__main__':
    unittest.main()
