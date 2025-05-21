"""
Unit tests for the GovernanceAuditTrail class.

This module contains unit tests for the GovernanceAuditTrail class,
which is responsible for creating and maintaining immutable audit trails
for governance decisions.
"""

import unittest
import json
import uuid
import hashlib
from unittest.mock import MagicMock, patch
from pathlib import Path
import sys
import os

# Add the src directory to the path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

# Import the class to test
from src.core.governance.governance_audit_trail import GovernanceAuditTrail


class TestGovernanceAuditTrail(unittest.TestCase):
    """Test cases for the GovernanceAuditTrail class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a mock configuration
        self.config = {
            'storage_path': '/tmp/test_audit_events',
            'merkle_tree_path': '/tmp/test_merkle_tree',
            'schema_path': '/tmp/test_schemas/audit_trail.schema.v1.json'
        }
        
        # Create mock dependencies
        self.mock_schema_validator = MagicMock()
        self.mock_schema_validator.validate.return_value = True
        
        # Create test directories
        Path(self.config['storage_path']).mkdir(parents=True, exist_ok=True)
        Path(self.config['merkle_tree_path']).mkdir(parents=True, exist_ok=True)
        
        # Create the service with mocked dependencies
        with patch('src.core.governance.governance_audit_trail.SchemaValidator', return_value=self.mock_schema_validator):
            self.audit_trail = GovernanceAuditTrail(self.config)
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test files
        import shutil
        if Path(self.config['storage_path']).exists():
            shutil.rmtree(self.config['storage_path'])
        if Path(self.config['merkle_tree_path']).exists():
            shutil.rmtree(self.config['merkle_tree_path'])
    
    def test_init(self):
        """Test initialization of the audit trail."""
        self.assertEqual(self.audit_trail.config, self.config)
        self.assertEqual(self.audit_trail.storage_path, self.config['storage_path'])
        self.assertEqual(self.audit_trail.merkle_tree_path, self.config['merkle_tree_path'])
        self.assertIsNotNone(self.audit_trail.schema_validator)
        self.assertIsNotNone(self.audit_trail.merkle_tree)
        self.assertIn("root_hash", self.audit_trail.merkle_tree)
        self.assertIn("tree_size", self.audit_trail.merkle_tree)
    
    def test_log_event(self):
        """Test logging an audit event."""
        # Define test data
        entity_id = "test-entity"
        event_type = "TEST_EVENT"
        actor_id = "test-actor"
        event_data = {"key": "value"}
        metadata = {"severity": "INFO"}
        
        # Log event
        event = self.audit_trail.log_event(
            entity_id=entity_id,
            event_type=event_type,
            actor_id=actor_id,
            event_data=event_data,
            metadata=metadata
        )
        
        # Verify event
        self.assertIsNotNone(event)
        self.assertIn("event_id", event)
        self.assertEqual(event["entity_id"], entity_id)
        self.assertEqual(event["event_type"], event_type)
        self.assertEqual(event["actor_id"], actor_id)
        self.assertEqual(event["event_data"], event_data)
        self.assertEqual(event["metadata"], metadata)
        self.assertIn("timestamp", event)
        self.assertIn("merkle_proof", event)
        
        # Verify schema validation was called
        self.mock_schema_validator.validate.assert_called_once()
        
        # Verify event was stored
        event_path = Path(self.config['storage_path']) / f"{event['event_id']}.json"
        self.assertTrue(event_path.exists())
    
    def test_get_event(self):
        """Test getting an audit event."""
        # Log an event first
        event = self.audit_trail.log_event(
            entity_id="test-entity",
            event_type="TEST_EVENT",
            actor_id="test-actor",
            event_data={"key": "value"}
        )
        
        # Get the event
        retrieved = self.audit_trail.get_event(event["event_id"])
        
        # Verify it's the same
        self.assertEqual(retrieved, event)
        
        # Test getting a non-existent event
        non_existent = self.audit_trail.get_event("non-existent")
        self.assertIsNone(non_existent)
    
    def test_find_events(self):
        """Test finding audit events by criteria."""
        # Log multiple events
        event1 = self.audit_trail.log_event(
            entity_id="entity1",
            event_type="TYPE1",
            actor_id="actor1",
            event_data={"key": "value1"}
        )
        
        event2 = self.audit_trail.log_event(
            entity_id="entity1",
            event_type="TYPE2",
            actor_id="actor2",
            event_data={"key": "value2"}
        )
        
        event3 = self.audit_trail.log_event(
            entity_id="entity2",
            event_type="TYPE1",
            actor_id="actor1",
            event_data={"key": "value3"}
        )
        
        # Find by entity
        entity1_events = self.audit_trail.find_events(entity_id="entity1")
        self.assertEqual(len(entity1_events), 2)
        event_ids = [e["event_id"] for e in entity1_events]
        self.assertIn(event1["event_id"], event_ids)
        self.assertIn(event2["event_id"], event_ids)
        
        # Find by type
        type1_events = self.audit_trail.find_events(event_type="TYPE1")
        self.assertEqual(len(type1_events), 2)
        event_ids = [e["event_id"] for e in type1_events]
        self.assertIn(event1["event_id"], event_ids)
        self.assertIn(event3["event_id"], event_ids)
        
        # Find by actor
        actor1_events = self.audit_trail.find_events(actor_id="actor1")
        self.assertEqual(len(actor1_events), 2)
        event_ids = [e["event_id"] for e in actor1_events]
        self.assertIn(event1["event_id"], event_ids)
        self.assertIn(event3["event_id"], event_ids)
        
        # Find by multiple criteria
        filtered_events = self.audit_trail.find_events(
            entity_id="entity1",
            event_type="TYPE1"
        )
        self.assertEqual(len(filtered_events), 1)
        self.assertEqual(filtered_events[0]["event_id"], event1["event_id"])
    
    def test_verify_event(self):
        """Test verifying an audit event."""
        # Log an event
        event = self.audit_trail.log_event(
            entity_id="test-entity",
            event_type="TEST_EVENT",
            actor_id="test-actor",
            event_data={"key": "value"}
        )
        
        # Verify the event
        is_valid, details = self.audit_trail.verify_event(event["event_id"])
        
        # Should be valid
        self.assertTrue(is_valid)
        self.assertIn("verification_result", details)
        self.assertEqual(details["verification_result"], "VALID")
        self.assertIn("root_hash", details)
        self.assertEqual(details["root_hash"], event["merkle_proof"]["root_hash"])
        
        # Test verifying a non-existent event
        is_valid, details = self.audit_trail.verify_event("non-existent")
        self.assertFalse(is_valid)
        self.assertIn("error", details)
    
    def test_get_entity_audit_trail(self):
        """Test getting an entity's audit trail."""
        # Log multiple events for different entities
        event1 = self.audit_trail.log_event(
            entity_id="entity1",
            event_type="TYPE1",
            actor_id="actor1",
            event_data={"key": "value1"}
        )
        
        event2 = self.audit_trail.log_event(
            entity_id="entity1",
            event_type="TYPE2",
            actor_id="actor2",
            event_data={"key": "value2"}
        )
        
        event3 = self.audit_trail.log_event(
            entity_id="entity2",
            event_type="TYPE1",
            actor_id="actor1",
            event_data={"key": "value3"}
        )
        
        # Get entity1's audit trail
        trail = self.audit_trail.get_entity_audit_trail("entity1")
        self.assertEqual(len(trail), 2)
        event_ids = [e["event_id"] for e in trail]
        self.assertIn(event1["event_id"], event_ids)
        self.assertIn(event2["event_id"], event_ids)
        
        # Get entity2's audit trail
        trail = self.audit_trail.get_entity_audit_trail("entity2")
        self.assertEqual(len(trail), 1)
        self.assertEqual(trail[0]["event_id"], event3["event_id"])
        
        # Get non-existent entity's audit trail
        trail = self.audit_trail.get_entity_audit_trail("non-existent")
        self.assertEqual(len(trail), 0)
    
    def test_merkle_tree_operations(self):
        """Test Merkle tree operations."""
        # Get initial root hash
        initial_root = self.audit_trail.get_merkle_root()
        
        # Log an event
        event1 = self.audit_trail.log_event(
            entity_id="test-entity",
            event_type="TEST_EVENT",
            actor_id="test-actor",
            event_data={"key": "value1"}
        )
        
        # Root hash should have changed
        new_root = self.audit_trail.get_merkle_root()
        self.assertNotEqual(initial_root, new_root)
        
        # Log another event
        event2 = self.audit_trail.log_event(
            entity_id="test-entity",
            event_type="TEST_EVENT",
            actor_id="test-actor",
            event_data={"key": "value2"}
        )
        
        # Root hash should have changed again
        newer_root = self.audit_trail.get_merkle_root()
        self.assertNotEqual(new_root, newer_root)
        
        # Export Merkle tree
        tree_export = self.audit_trail.export_merkle_tree()
        self.assertIn("root_hash", tree_export)
        self.assertEqual(tree_export["root_hash"], newer_root)
        self.assertIn("tree_size", tree_export)
        self.assertEqual(tree_export["tree_size"], 2)
    
    def test_hash_data(self):
        """Test hashing data."""
        # Hash some data
        data = "test data"
        hash_value = self.audit_trail._hash_data(data)
        
        # Verify hash
        expected_hash = hashlib.sha256(data.encode('utf-8')).hexdigest()
        self.assertEqual(hash_value, expected_hash)
    
    def test_verify_merkle_proof(self):
        """Test verifying a Merkle proof."""
        # Log an event to create a Merkle proof
        event = self.audit_trail.log_event(
            entity_id="test-entity",
            event_type="TEST_EVENT",
            actor_id="test-actor",
            event_data={"key": "value"}
        )
        
        # Extract proof
        merkle_proof = event["merkle_proof"]
        leaf_hash = merkle_proof["leaf_hash"]
        path = merkle_proof["path"]
        root_hash = merkle_proof["root_hash"]
        
        # Verify proof
        calculated_root = self.audit_trail._verify_merkle_proof(leaf_hash, path)
        self.assertEqual(calculated_root, root_hash)
        
        # Tamper with leaf hash
        tampered_leaf = "tampered" + leaf_hash
        calculated_root = self.audit_trail._verify_merkle_proof(tampered_leaf, path)
        self.assertNotEqual(calculated_root, root_hash)


if __name__ == '__main__':
    unittest.main()
