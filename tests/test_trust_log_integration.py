"""
Integration tests for Trust Log Integration implementation.

This module tests Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.20
Phase ID: 5.3
Clauses: 5.3, 11.0, 12.20
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

from src.integration.trust_log_integration import TrustLogIntegration
from src.core.merkle.merkle_sealing import MerkleSealGenerator
from src.core.merkle.conflict_detection import ConflictDetector


class TestTrustLogIntegration(unittest.TestCase):
    """Test cases for TrustLogIntegration implementation."""
    
    def setUp(self):
        """Set up test environment."""
        # Mock the validate_against_schema function to always return True
        self.validate_patch = patch('trust_log_integration.validate_against_schema', return_value=(True, None))
        self.mock_validate = self.validate_patch.start()
        
        # Create mock instances for dependencies
        self.mock_merkle_seal_generator = MagicMock(spec=MerkleSealGenerator)
        self.mock_conflict_detector = MagicMock(spec=ConflictDetector)
        
        # Configure mock behavior
        self.mock_merkle_seal_generator.create_seal.return_value = {
            "seal_id": str(uuid.uuid4()),
            "root_hash": "a" * 64,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "contract_version": "v2025.05.20",
            "phase_id": "5.3",
            "conflict_metadata": {
                "conflict_type": "none",
                "agent_ids": [str(uuid.uuid4())],
                "timestamp_hash": "b" * 64
            },
            "tree_metadata": {
                "leaf_count": 2,
                "tree_height": 2,
                "algorithm": "sha256"
            },
            "sealed_entries": [
                {"entry_id": "entry1", "entry_hash": "c" * 64},
                {"entry_id": "entry2", "entry_hash": "d" * 64}
            ],
            "previous_seal_id": None,
            "codex_clauses": ["5.3", "11.0"]
        }
        
        self.mock_merkle_seal_generator.verify_seal.return_value = True
        
        # Create a TrustLogIntegration instance
        self.trust_log_integration = TrustLogIntegration(
            self.mock_merkle_seal_generator,
            self.mock_conflict_detector
        )
        
        # Sample data for testing
        self.execution_id = str(uuid.uuid4())
        self.sample_outputs = [
            {"id": "output1", "data": "test output 1"},
            {"id": "output2", "data": "test output 2"}
        ]
        self.sample_conflict = {
            "conflict_type": "trust_threshold",
            "agent_ids": [str(uuid.uuid4())],
            "timestamp_hash": "e" * 64,
            "severity": "medium",
            "resolution_status": "unresolved"
        }
    
    def tearDown(self):
        """Clean up after tests."""
        self.validate_patch.stop()
    
    def test_create_trust_log_entry_without_conflict(self):
        """Test creating a Trust Log entry without conflict metadata."""
        # Create Trust Log entry
        entry = self.trust_log_integration.create_trust_log_entry(
            self.execution_id,
            self.sample_outputs
        )
        
        # Verify entry structure
        self.assertIn("entry_id", entry)
        self.assertIn("execution_id", entry)
        self.assertIn("timestamp", entry)
        self.assertIn("merkle_seal", entry)
        self.assertIn("contract_version", entry)
        self.assertIn("phase_id", entry)
        self.assertIn("codex_clauses", entry)
        self.assertIn("trust_surface", entry)
        self.assertIn("entry_hash", entry)
        
        # Verify contract details
        self.assertEqual(entry["contract_version"], "v2025.05.20")
        self.assertEqual(entry["phase_id"], "5.3")
        self.assertEqual(entry["codex_clauses"], ["5.3", "11.0", "12.20"])
        
        # Verify execution ID
        self.assertEqual(entry["execution_id"], self.execution_id)
        
        # Verify Merkle seal generator was called
        self.mock_merkle_seal_generator.create_seal.assert_called_once_with(
            self.sample_outputs, None
        )
    
    def test_create_trust_log_entry_with_conflict(self):
        """Test creating a Trust Log entry with conflict metadata."""
        # Create Trust Log entry
        entry = self.trust_log_integration.create_trust_log_entry(
            self.execution_id,
            self.sample_outputs,
            self.sample_conflict
        )
        
        # Verify Merkle seal generator was called with conflict
        self.mock_merkle_seal_generator.create_seal.assert_called_once_with(
            self.sample_outputs, self.sample_conflict
        )
        
        # Verify trust score is lower due to conflict
        self.assertLess(entry["trust_surface"]["trust_score"], 0.8)
    
    def test_hash_trust_log_entry(self):
        """Test creating a hash seal for a Trust Log entry."""
        # Create a sample entry
        entry = {
            "entry_id": str(uuid.uuid4()),
            "execution_id": self.execution_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "merkle_seal": self.mock_merkle_seal_generator.create_seal.return_value,
            "contract_version": "v2025.05.20",
            "phase_id": "5.3",
            "codex_clauses": ["5.3", "11.0", "12.20"],
            "trust_surface": {
                "trust_score": 0.8,
                "verification_status": "verified",
                "verification_timestamp": datetime.utcnow().isoformat() + "Z",
                "verification_method": "merkle_seal"
            }
        }
        
        # Hash the entry
        entry_hash = self.trust_log_integration._hash_trust_log_entry(entry)
        
        # Verify hash format
        self.assertRegex(entry_hash, r'^[a-f0-9]{64}$')
        
        # Verify hash is deterministic
        second_hash = self.trust_log_integration._hash_trust_log_entry(entry)
        self.assertEqual(entry_hash, second_hash)
        
        # Verify hash changes when entry changes
        entry["timestamp"] = datetime.utcnow().isoformat() + "Z"
        different_hash = self.trust_log_integration._hash_trust_log_entry(entry)
        self.assertNotEqual(entry_hash, different_hash)
    
    def test_calculate_trust_score_no_conflict(self):
        """Test calculating trust score without conflict."""
        # Calculate trust score
        score = self.trust_log_integration._calculate_trust_score(
            self.mock_merkle_seal_generator.create_seal.return_value,
            None
        )
        
        # Verify score
        self.assertEqual(score, 0.8)
    
    def test_calculate_trust_score_with_conflict(self):
        """Test calculating trust score with conflict."""
        # Low severity conflict
        low_conflict = {
            "conflict_type": "trust_threshold",
            "severity": "low"
        }
        low_score = self.trust_log_integration._calculate_trust_score(
            self.mock_merkle_seal_generator.create_seal.return_value,
            low_conflict
        )
        self.assertEqual(low_score, 0.7)
        
        # Medium severity conflict
        medium_conflict = {
            "conflict_type": "trust_threshold",
            "severity": "medium"
        }
        medium_score = self.trust_log_integration._calculate_trust_score(
            self.mock_merkle_seal_generator.create_seal.return_value,
            medium_conflict
        )
        self.assertEqual(medium_score, 0.6)
        
        # High severity conflict
        high_conflict = {
            "conflict_type": "trust_threshold",
            "severity": "high"
        }
        high_score = self.trust_log_integration._calculate_trust_score(
            self.mock_merkle_seal_generator.create_seal.return_value,
            high_conflict
        )
        self.assertEqual(high_score, 0.4)
        
        # Critical severity conflict
        critical_conflict = {
            "conflict_type": "trust_threshold",
            "severity": "critical"
        }
        critical_score = self.trust_log_integration._calculate_trust_score(
            self.mock_merkle_seal_generator.create_seal.return_value,
            critical_conflict
        )
        self.assertEqual(critical_score, 0.2)
    
    def test_get_trust_log_entry(self):
        """Test getting a Trust Log entry by ID."""
        # Create Trust Log entry
        entry = self.trust_log_integration.create_trust_log_entry(
            self.execution_id,
            self.sample_outputs
        )
        entry_id = entry["entry_id"]
        
        # Get entry
        retrieved_entry = self.trust_log_integration.get_trust_log_entry(entry_id)
        
        # Verify retrieved entry
        self.assertEqual(retrieved_entry, entry)
        
        # Test with non-existent ID
        non_existent = self.trust_log_integration.get_trust_log_entry("non-existent-id")
        self.assertIsNone(non_existent)
    
    def test_get_trust_log_entries_for_execution(self):
        """Test getting Trust Log entries for a specific execution."""
        # Create multiple entries for different executions
        execution_id1 = str(uuid.uuid4())
        execution_id2 = str(uuid.uuid4())
        
        entry1 = self.trust_log_integration.create_trust_log_entry(
            execution_id1,
            self.sample_outputs
        )
        entry2 = self.trust_log_integration.create_trust_log_entry(
            execution_id2,
            self.sample_outputs
        )
        entry3 = self.trust_log_integration.create_trust_log_entry(
            execution_id1,
            self.sample_outputs
        )
        
        # Get entries for execution_id1
        entries = self.trust_log_integration.get_trust_log_entries_for_execution(execution_id1)
        
        # Verify entries
        self.assertEqual(len(entries), 2)
        self.assertIn(entry1, entries)
        self.assertIn(entry3, entries)
    
    def test_verify_trust_log_entry_valid(self):
        """Test verifying a valid Trust Log entry."""
        # Create Trust Log entry
        entry = self.trust_log_integration.create_trust_log_entry(
            self.execution_id,
            self.sample_outputs
        )
        
        # Verify entry
        self.assertTrue(self.trust_log_integration.verify_trust_log_entry(entry))
    
    def test_verify_trust_log_entry_invalid_hash(self):
        """Test verifying a Trust Log entry with invalid hash."""
        # Create Trust Log entry
        entry = self.trust_log_integration.create_trust_log_entry(
            self.execution_id,
            self.sample_outputs
        )
        
        # Tamper with the entry
        entry["entry_hash"] = "f" * 64
        
        # Verify entry
        self.assertFalse(self.trust_log_integration.verify_trust_log_entry(entry))
    
    def test_verify_trust_log_entry_invalid_seal(self):
        """Test verifying a Trust Log entry with invalid Merkle seal."""
        # Create Trust Log entry
        entry = self.trust_log_integration.create_trust_log_entry(
            self.execution_id,
            self.sample_outputs
        )
        
        # Configure mock to return False for seal verification
        self.mock_merkle_seal_generator.verify_seal.return_value = False
        
        # Verify entry
        self.assertFalse(self.trust_log_integration.verify_trust_log_entry(entry))
    
    def test_prepare_ui_data(self):
        """Test preparing Trust Log entry data for UI display."""
        # Create Trust Log entry
        entry = self.trust_log_integration.create_trust_log_entry(
            self.execution_id,
            self.sample_outputs
        )
        
        # Prepare UI data
        ui_data = self.trust_log_integration.prepare_ui_data(entry)
        
        # Verify UI data structure
        self.assertIn("entry_id", ui_data)
        self.assertIn("execution_id", ui_data)
        self.assertIn("timestamp", ui_data)
        self.assertIn("merkle_seal", ui_data)
        self.assertIn("conflict_metadata", ui_data)
        self.assertIn("trust_surface", ui_data)
        self.assertIn("verification", ui_data)
        
        # Verify Merkle seal data
        self.assertIn("seal_id", ui_data["merkle_seal"])
        self.assertIn("root_hash", ui_data["merkle_seal"])
        self.assertIn("timestamp", ui_data["merkle_seal"])
        self.assertIn("tree_metadata", ui_data["merkle_seal"])
        self.assertIn("sealed_entries_count", ui_data["merkle_seal"])
        self.assertIn("has_previous_seal", ui_data["merkle_seal"])
        
        # Verify verification data
        self.assertIn("is_verified", ui_data["verification"])
        self.assertIn("verification_method", ui_data["verification"])
        self.assertIn("codex_clauses", ui_data["verification"])
        
        # Verify values
        self.assertEqual(ui_data["execution_id"], self.execution_id)
        self.assertEqual(ui_data["verification"]["verification_method"], "merkle_seal")
        self.assertTrue(ui_data["verification"]["is_verified"])


if __name__ == "__main__":
    unittest.main()
