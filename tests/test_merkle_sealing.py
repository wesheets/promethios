"""
Unit tests for Merkle Seal Generator implementation.

This module tests Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.20
Phase ID: 5.3
Clauses: 5.3, 11.0
"""

import unittest
import hashlib
import json
import uuid
import sys
import os
from datetime import datetime
from unittest.mock import patch, MagicMock

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.merkle.merkle_sealing import MerkleSealGenerator


class TestMerkleSealGenerator(unittest.TestCase):
    """Test cases for MerkleSealGenerator implementation."""
    
    def setUp(self):
        """Set up test environment."""
        # Mock the validate_against_schema function to always return True
        self.validate_patch = patch('merkle_sealing.validate_against_schema', return_value=(True, None))
        self.mock_validate = self.validate_patch.start()
        
        # Create a MerkleSealGenerator instance
        self.seal_generator = MerkleSealGenerator()
        
        # Sample outputs for testing
        self.sample_outputs = [
            {"id": str(uuid.uuid4()), "data": "output 1"},
            {"id": str(uuid.uuid4()), "data": "output 2"}
        ]
        
        # Sample conflict metadata for testing
        self.sample_conflict = {
            "conflict_type": "trust_threshold",
            "agent_ids": [str(uuid.uuid4())],
            "timestamp_hash": hashlib.sha256(datetime.utcnow().isoformat().encode()).hexdigest(),
            "severity": "medium",
            "resolution_status": "unresolved"
        }
    
    def tearDown(self):
        """Clean up after tests."""
        self.validate_patch.stop()
    
    def test_create_seal_with_outputs(self):
        """Test creating a seal with outputs only."""
        # Create a seal
        seal = self.seal_generator.create_seal(self.sample_outputs)
        
        # Verify seal structure
        self.assertIn("seal_id", seal)
        self.assertIn("root_hash", seal)
        self.assertIn("timestamp", seal)
        self.assertIn("contract_version", seal)
        self.assertIn("phase_id", seal)
        self.assertIn("conflict_metadata", seal)
        self.assertIn("tree_metadata", seal)
        self.assertIn("sealed_entries", seal)
        self.assertIn("codex_clauses", seal)
        
        # Verify contract details
        self.assertEqual(seal["contract_version"], "v2025.05.20")
        self.assertEqual(seal["phase_id"], "5.3")
        self.assertEqual(seal["codex_clauses"], ["5.3", "11.0"])
        
        # Verify tree metadata
        self.assertEqual(seal["tree_metadata"]["leaf_count"], 2)
        self.assertEqual(seal["tree_metadata"]["algorithm"], "sha256")
        
        # Verify sealed entries
        self.assertEqual(len(seal["sealed_entries"]), 2)
        
        # Verify default conflict metadata
        self.assertEqual(seal["conflict_metadata"]["conflict_type"], "none")
    
    def test_create_seal_with_conflict(self):
        """Test creating a seal with conflict metadata."""
        # Create a seal with conflict metadata
        seal = self.seal_generator.create_seal(self.sample_outputs, self.sample_conflict)
        
        # Verify conflict metadata
        self.assertEqual(seal["conflict_metadata"], self.sample_conflict)
    
    def test_seal_chaining(self):
        """Test that seals form a chain with previous_seal_id."""
        # Create first seal
        first_seal = self.seal_generator.create_seal(self.sample_outputs)
        first_seal_id = first_seal["seal_id"]
        
        # Create second seal
        second_seal = self.seal_generator.create_seal(self.sample_outputs)
        
        # Verify chaining
        self.assertEqual(second_seal["previous_seal_id"], first_seal_id)
    
    def test_verify_seal_valid(self):
        """Test verifying a valid seal."""
        # Create a seal
        seal = self.seal_generator.create_seal(self.sample_outputs)
        
        # Verify the seal
        self.assertTrue(self.seal_generator.verify_seal(seal))
    
    def test_verify_seal_with_outputs(self):
        """Test verifying a seal with outputs."""
        # Create a seal
        seal = self.seal_generator.create_seal(self.sample_outputs)
        
        # Verify the seal with the same outputs
        self.assertTrue(self.seal_generator.verify_seal(seal, self.sample_outputs))
    
    def test_verify_seal_with_different_outputs(self):
        """Test verifying a seal with different outputs."""
        # Create a seal
        seal = self.seal_generator.create_seal(self.sample_outputs)
        
        # Different outputs
        different_outputs = [
            {"id": str(uuid.uuid4()), "data": "different output"}
        ]
        
        # Mock the MerkleTree to return a different root hash
        with patch('merkle_sealing.MerkleTree') as mock_tree_class:
            mock_tree = MagicMock()
            mock_tree.build_tree.return_value = "different_root_hash"
            mock_tree_class.return_value = mock_tree
            
            # Verify the seal with different outputs
            self.assertFalse(self.seal_generator.verify_seal(seal, different_outputs))
    
    def test_verify_seal_invalid_schema(self):
        """Test verifying a seal with invalid schema."""
        # Create a seal
        seal = self.seal_generator.create_seal(self.sample_outputs)
        
        # Mock validate_against_schema to return False
        self.mock_validate.return_value = (False, "Schema validation error")
        
        # Verify the seal
        self.assertFalse(self.seal_generator.verify_seal(seal))
    
    def test_get_seal_chain(self):
        """Test getting a chain of seals."""
        # Create multiple seals
        seal1 = self.seal_generator.create_seal(self.sample_outputs)
        seal2 = self.seal_generator.create_seal(self.sample_outputs)
        seal3 = self.seal_generator.create_seal(self.sample_outputs)
        
        # Create a seal store
        seal_store = {
            seal1["seal_id"]: seal1,
            seal2["seal_id"]: seal2,
            seal3["seal_id"]: seal3
        }
        
        # Get the chain starting from seal3
        chain = self.seal_generator.get_seal_chain(seal3["seal_id"], seal_store)
        
        # Verify chain
        self.assertEqual(len(chain), 3)
        self.assertEqual(chain[0]["seal_id"], seal3["seal_id"])
        self.assertEqual(chain[1]["seal_id"], seal2["seal_id"])
        self.assertEqual(chain[2]["seal_id"], seal1["seal_id"])
    
    def test_verify_seal_chain_valid(self):
        """Test verifying a valid chain of seals."""
        # Create multiple seals
        seal1 = self.seal_generator.create_seal(self.sample_outputs)
        seal2 = self.seal_generator.create_seal(self.sample_outputs)
        seal3 = self.seal_generator.create_seal(self.sample_outputs)
        
        # Create chain
        chain = [seal3, seal2, seal1]
        
        # Verify chain
        self.assertTrue(self.seal_generator.verify_seal_chain(chain))
    
    def test_verify_seal_chain_invalid(self):
        """Test verifying an invalid chain of seals."""
        # Create multiple seals
        seal1 = self.seal_generator.create_seal(self.sample_outputs)
        seal2 = self.seal_generator.create_seal(self.sample_outputs)
        
        # Break the chain by changing previous_seal_id
        seal2["previous_seal_id"] = "invalid_id"
        
        # Create chain
        chain = [seal2, seal1]
        
        # Verify chain
        self.assertFalse(self.seal_generator.verify_seal_chain(chain))


if __name__ == "__main__":
    unittest.main()
