"""
Unit tests for Merkle Tree implementation.

This module tests Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.3
Clauses: 5.3, 11.0
"""

import unittest
import hashlib
import json
import sys
import os
import pytest

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.merkle.merkle_tree import MerkleTree, pre_loop_tether_check

@pytest.mark.phase_5_3
class TestMerkleTree(unittest.TestCase):
    """Test cases for MerkleTree implementation."""
    
    def test_pre_loop_tether_check(self):
        """Test pre-loop tether check function."""
        # Valid contract and phase
        self.assertTrue(pre_loop_tether_check("v2025.05.18", "5.3"))
        
        # Invalid contract
        self.assertFalse(pre_loop_tether_check("v2025.05.17", "5.3"))
        
        # Invalid phase
        self.assertFalse(pre_loop_tether_check("v2025.05.18", "5.2"))
    
    def test_init(self):
        """Test MerkleTree initialization."""
        tree = MerkleTree()
        self.assertEqual(tree.algorithm, "sha256")
        self.assertEqual(tree.leaves, [])
        self.assertEqual(tree.nodes, [])
        self.assertIsNone(tree.root_hash)
    
    def test_add_leaf_with_string(self):
        """Test adding a string leaf to the tree."""
        tree = MerkleTree()
        data = "test data"
        expected_hash = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
        
        leaf_hash = tree.add_leaf(data)
        
        self.assertEqual(leaf_hash, expected_hash)
        self.assertEqual(tree.leaves, [expected_hash])
    
    def test_add_leaf_with_dict(self):
        """Test adding a dictionary leaf to the tree."""
        tree = MerkleTree()
        data = {"key": "value", "number": 42}
        expected_hash = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
        
        leaf_hash = tree.add_leaf(data)
        
        self.assertEqual(leaf_hash, expected_hash)
        self.assertEqual(tree.leaves, [expected_hash])
    
    def test_add_leaf_with_hash(self):
        """Test adding a pre-computed hash as a leaf."""
        tree = MerkleTree()
        hash_value = "a" * 64  # Valid hash format
        
        leaf_hash = tree.add_leaf(hash_value)
        
        self.assertEqual(leaf_hash, hash_value)
        self.assertEqual(tree.leaves, [hash_value])
    
    def test_build_tree_with_one_leaf(self):
        """Test building a tree with one leaf."""
        tree = MerkleTree()
        data = "test data"
        leaf_hash = tree.add_leaf(data)
        
        root_hash = tree.build_tree()
        
        self.assertEqual(root_hash, leaf_hash)
        self.assertEqual(tree.root_hash, leaf_hash)
        self.assertEqual(len(tree.nodes), 1)
        self.assertEqual(tree.nodes[0], [leaf_hash])
    
    def test_build_tree_with_two_leaves(self):
        """Test building a tree with two leaves."""
        tree = MerkleTree()
        data1 = "test data 1"
        data2 = "test data 2"
        leaf1 = tree.add_leaf(data1)
        leaf2 = tree.add_leaf(data2)
        
        root_hash = tree.build_tree()
        
        # Expected root is hash of concatenated leaf hashes
        expected_root = hashlib.sha256((leaf1 + leaf2).encode()).hexdigest()
        
        self.assertEqual(root_hash, expected_root)
        self.assertEqual(tree.root_hash, expected_root)
        self.assertEqual(len(tree.nodes), 2)
        self.assertEqual(tree.nodes[0], [leaf1, leaf2])
        self.assertEqual(tree.nodes[1], [expected_root])
    
    def test_build_tree_with_odd_leaves(self):
        """Test building a tree with an odd number of leaves."""
        tree = MerkleTree()
        data1 = "test data 1"
        data2 = "test data 2"
        data3 = "test data 3"
        leaf1 = tree.add_leaf(data1)
        leaf2 = tree.add_leaf(data2)
        leaf3 = tree.add_leaf(data3)
        
        root_hash = tree.build_tree()
        
        # First level: hash of leaf1 + leaf2, and leaf3 promoted
        hash12 = hashlib.sha256((leaf1 + leaf2).encode()).hexdigest()
        
        # Second level: hash of hash12 + leaf3
        expected_root = hashlib.sha256((hash12 + leaf3).encode()).hexdigest()
        
        self.assertEqual(root_hash, expected_root)
        self.assertEqual(tree.root_hash, expected_root)
        self.assertEqual(len(tree.nodes), 3)
        self.assertEqual(tree.nodes[0], [leaf1, leaf2, leaf3])
        self.assertEqual(tree.nodes[1], [hash12, leaf3])
        self.assertEqual(tree.nodes[2], [expected_root])
    
    def test_build_tree_with_no_leaves(self):
        """Test building a tree with no leaves raises an error."""
        tree = MerkleTree()
        
        with self.assertRaises(ValueError):
            tree.build_tree()
    
    def test_get_proof_for_leaf(self):
        """Test getting a Merkle proof for a leaf."""
        tree = MerkleTree()
        data1 = "test data 1"
        data2 = "test data 2"
        data3 = "test data 3"
        data4 = "test data 4"
        tree.add_leaf(data1)
        tree.add_leaf(data2)
        tree.add_leaf(data3)
        tree.add_leaf(data4)
        
        tree.build_tree()
        
        # Get proof for leaf 0 (data1)
        proof = tree.get_proof(0)
        
        # Proof should contain steps to reconstruct the root
        self.assertEqual(len(proof), 2)
        self.assertEqual(proof[0]["position"], "left")
        self.assertEqual(proof[1]["position"], "left")
    
    def test_verify_proof(self):
        """Test verifying a Merkle proof."""
        tree = MerkleTree()
        data1 = "test data 1"
        data2 = "test data 2"
        leaf1 = tree.add_leaf(data1)
        leaf2 = tree.add_leaf(data2)
        
        tree.build_tree()
        
        # Get proof for leaf 0 (data1)
        proof = tree.get_proof(0)
        
        # Verify the proof
        self.assertTrue(tree.verify_proof(leaf1, proof))
        
        # Verify with incorrect leaf hash
        incorrect_hash = "a" * 64
        self.assertFalse(tree.verify_proof(incorrect_hash, proof))
    
    def test_verify_proof_with_custom_root(self):
        """Test verifying a Merkle proof with a custom root hash."""
        tree = MerkleTree()
        data1 = "test data 1"
        data2 = "test data 2"
        leaf1 = tree.add_leaf(data1)
        leaf2 = tree.add_leaf(data2)
        
        tree.build_tree()
        
        # Get proof for leaf 0 (data1)
        proof = tree.get_proof(0)
        
        # Verify the proof with custom root
        custom_root = tree.root_hash
        self.assertTrue(tree.verify_proof(leaf1, proof, custom_root))
        
        # Verify with incorrect root
        incorrect_root = "a" * 64
        self.assertFalse(tree.verify_proof(leaf1, proof, incorrect_root))


if __name__ == "__main__":
    unittest.main()
