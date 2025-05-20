"""
End-to-end tests for Phase 5.3 implementation.

This module tests Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.20
Phase ID: 5.3
Clauses: 5.3, 11.0, 10.4, 5.2.5
"""

import unittest
import json
import sys
import os
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from merkle_tree import MerkleTree
from merkle_sealing import MerkleSealGenerator
from conflict_detection import ConflictDetector
from output_capture import OutputCapture
from trust_log_integration import TrustLogIntegration
from runtime_executor_integration import process_execution, get_execution_log, get_merkle_seal


class TestPhase53(unittest.TestCase):
    """End-to-end tests for Phase 5.3 implementation."""
    
    def setUp(self):
        """Set up test environment."""
        # Mock the validate_against_schema function to always return True
        self.validate_patch = patch('runtime_executor_integration.validate_against_schema', return_value=(True, None))
        self.mock_validate = self.validate_patch.start()
        
        # Sample execution data for testing
        self.execution_id = str(uuid.uuid4())
        self.sample_execution_data = {
            "execution_id": self.execution_id,
            "agent_ids": [str(uuid.uuid4())],
            "outputs": [
                {
                    "data": "Test output 1",
                    "type": "log",
                    "source": "test_source"
                },
                {
                    "data": {"key": "value", "number": 42},
                    "type": "result",
                    "source": "test_source"
                }
            ],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    def tearDown(self):
        """Clean up after tests."""
        self.validate_patch.stop()
    
    def test_end_to_end_normal_execution(self):
        """Test end-to-end normal execution flow."""
        # Process execution
        processed_execution = process_execution(self.sample_execution_data)
        
        # Verify processed execution
        self.assertEqual(processed_execution["execution_id"], self.execution_id)
        self.assertIn("merkle_seal", processed_execution)
        self.assertIn("trust_log", processed_execution)
        
        # Verify Merkle seal
        merkle_seal = processed_execution["merkle_seal"]
        self.assertIn("seal_id", merkle_seal)
        self.assertIn("root_hash", merkle_seal)
        self.assertIn("contract_version", merkle_seal)
        self.assertEqual(merkle_seal["contract_version"], "v2025.05.20")
        self.assertEqual(merkle_seal["phase_id"], "5.3")
        
        # Verify Trust Log
        trust_log = processed_execution["trust_log"]
        self.assertIn("entry_id", trust_log)
        self.assertIn("entry_hash", trust_log)
        self.assertIn("trust_score", trust_log)
        
        # Verify no conflict metadata
        self.assertNotIn("conflict_metadata", processed_execution)
        
        # Verify execution log storage
        stored_execution = get_execution_log(self.execution_id)
        self.assertEqual(stored_execution, processed_execution)
        
        # Verify Merkle seal storage
        stored_seal = get_merkle_seal(merkle_seal["seal_id"])
        self.assertEqual(stored_seal, merkle_seal)
    
    def test_end_to_end_with_schema_violation(self):
        """Test end-to-end execution with schema violation."""
        # Add schema validation error to execution data
        execution_data = self.sample_execution_data.copy()
        execution_data["schema_validation_error"] = "Invalid schema: missing required field"
        execution_data["schema"] = "test_schema.json"
        
        # Process execution
        processed_execution = process_execution(execution_data)
        
        # Verify conflict metadata
        self.assertIn("conflict_metadata", processed_execution)
        conflict_metadata = processed_execution["conflict_metadata"]
        self.assertEqual(conflict_metadata["conflict_type"], "schema_violation")
        self.assertEqual(conflict_metadata["severity"], "high")
        
        # Verify Trust Log score is lower
        self.assertLess(processed_execution["trust_log"]["trust_score"], 0.8)
    
    def test_end_to_end_with_trust_threshold_violation(self):
        """Test end-to-end execution with trust threshold violation."""
        # Add trust threshold violation to execution data
        execution_data = self.sample_execution_data.copy()
        execution_data["trust_score"] = 0.5
        execution_data["trust_threshold"] = 0.7
        
        # Process execution
        processed_execution = process_execution(execution_data)
        
        # Verify conflict metadata
        self.assertIn("conflict_metadata", processed_execution)
        conflict_metadata = processed_execution["conflict_metadata"]
        self.assertEqual(conflict_metadata["conflict_type"], "trust_threshold")
        self.assertEqual(conflict_metadata["severity"], "medium")
        
        # Verify evidence
        evidence = conflict_metadata["conflict_details"]["evidence"][0]
        self.assertEqual(evidence["evidence_type"], "trust_score")
        self.assertEqual(evidence["evidence_data"]["trust_score"], 0.5)
        self.assertEqual(evidence["evidence_data"]["threshold"], 0.7)
    
    def test_end_to_end_with_tether_failure(self):
        """Test end-to-end execution with tether failure."""
        # Add tether failure to execution data
        execution_data = self.sample_execution_data.copy()
        execution_data["tether_failure"] = "Contract version mismatch"
        
        # Process execution
        processed_execution = process_execution(execution_data)
        
        # Verify conflict metadata
        self.assertIn("conflict_metadata", processed_execution)
        conflict_metadata = processed_execution["conflict_metadata"]
        self.assertEqual(conflict_metadata["conflict_type"], "tether_failure")
        self.assertEqual(conflict_metadata["severity"], "critical")
        
        # Verify evidence
        evidence = conflict_metadata["conflict_details"]["evidence"][0]
        self.assertEqual(evidence["evidence_type"], "tether_check")
        self.assertEqual(evidence["evidence_data"]["failure_reason"], "Contract version mismatch")
    
    def test_pre_loop_tether_check_failure(self):
        """Test that pre-loop tether check failure is handled correctly."""
        # Mock pre_loop_tether_check to return False
        with patch('runtime_executor_integration.pre_loop_tether_check', return_value=False):
            # Process execution should raise ValueError
            with self.assertRaises(ValueError):
                process_execution(self.sample_execution_data)


if __name__ == "__main__":
    unittest.main()
