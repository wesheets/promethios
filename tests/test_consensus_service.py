"""
Unit tests for ConsensusService.

This module tests the ConsensusService component of Phase 5.4.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import unittest
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

from consensus_service import ConsensusService, ThresholdSignature, pre_loop_tether_check


class TestConsensusService(unittest.TestCase):
    """Test cases for ConsensusService."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.consensus_service = ConsensusService()
        self.seal_id = str(uuid.uuid4())
        
        # Create valid node IDs and signatures for testing
        self.node_id1 = str(uuid.uuid4())
        self.node_id2 = str(uuid.uuid4())
        self.node_id3 = str(uuid.uuid4())
        self.signature1 = "BASE64_ENCODED_SIGNATURE_1"
        self.signature2 = "BASE64_ENCODED_SIGNATURE_2"
        self.signature3 = "BASE64_ENCODED_SIGNATURE_3"
    
    @patch('consensus_service.validate_against_schema')
    def test_create_consensus_record(self, mock_validate):
        """Test creating a consensus record."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record
        result = self.consensus_service.create_consensus_record(self.seal_id)
        
        # Verify result
        self.assertIn("consensus_id", result)
        self.assertEqual(result["seal_id"], self.seal_id)
        self.assertEqual(result["participating_nodes"], [])
        self.assertEqual(result["consensus_result"], False)
        self.assertEqual(result["contract_version"], "v2025.05.18")
        self.assertEqual(result["phase_id"], "5.4")
        self.assertIn("5.4", result["codex_clauses"])
        self.assertIn("11.0", result["codex_clauses"])
        
        # Verify record was stored
        self.assertIn(result["consensus_id"], self.consensus_service.consensus_records)
    
    @patch('consensus_service.validate_against_schema')
    def test_create_consensus_record_validation_failure(self, mock_validate):
        """Test creating a consensus record with validation failure."""
        # Mock validation to return failure
        mock_validate.return_value = (False, "Invalid consensus record")
        
        # Attempt to create consensus record
        with self.assertRaises(ValueError):
            self.consensus_service.create_consensus_record(self.seal_id)
    
    @patch('consensus_service.validate_against_schema')
    def test_add_verification_result(self, mock_validate):
        """Test adding a verification result to a consensus record."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record
        consensus_record = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_id = consensus_record["consensus_id"]
        
        # Add verification result
        result = self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id1,
            True,
            self.signature1
        )
        
        # Verify result
        self.assertEqual(result["consensus_id"], consensus_id)
        self.assertEqual(len(result["participating_nodes"]), 1)
        self.assertEqual(result["participating_nodes"][0]["node_id"], self.node_id1)
        self.assertEqual(result["participating_nodes"][0]["verification_result"], True)
        self.assertEqual(result["participating_nodes"][0]["signature"], self.signature1)
    
    @patch('consensus_service.validate_against_schema')
    def test_add_verification_result_invalid_consensus(self, mock_validate):
        """Test adding a verification result to an invalid consensus record."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Attempt to add verification result to non-existent consensus
        with self.assertRaises(ValueError):
            self.consensus_service.add_verification_result(
                str(uuid.uuid4()),
                self.node_id1,
                True,
                self.signature1
            )
    
    @patch('consensus_service.validate_against_schema')
    def test_add_duplicate_verification_result(self, mock_validate):
        """Test adding a duplicate verification result."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record
        consensus_record = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_id = consensus_record["consensus_id"]
        
        # Add verification result
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id1,
            True,
            self.signature1
        )
        
        # Attempt to add duplicate verification result
        with self.assertRaises(ValueError):
            self.consensus_service.add_verification_result(
                consensus_id,
                self.node_id1,
                True,
                self.signature1
            )
    
    @patch('consensus_service.validate_against_schema')
    def test_update_consensus_status(self, mock_validate):
        """Test updating consensus status."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record
        consensus_record = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_id = consensus_record["consensus_id"]
        
        # Add verification results
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id1,
            True,
            self.signature1
        )
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id2,
            True,
            self.signature2
        )
        
        # Get updated consensus record
        result = self.consensus_service.get_consensus_record(consensus_id)
        
        # Verify consensus status was updated
        self.assertEqual(result["consensus_percentage"], 1.0)
        self.assertEqual(result["consensus_result"], True)
    
    @patch('consensus_service.validate_against_schema')
    def test_get_consensus_record(self, mock_validate):
        """Test getting a consensus record."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record
        consensus_record = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_id = consensus_record["consensus_id"]
        
        # Get consensus record
        result = self.consensus_service.get_consensus_record(consensus_id)
        
        # Verify result
        self.assertEqual(result["consensus_id"], consensus_id)
        self.assertEqual(result["seal_id"], self.seal_id)
    
    @patch('consensus_service.validate_against_schema')
    def test_get_consensus_record_not_found(self, mock_validate):
        """Test getting a non-existent consensus record."""
        # Attempt to get non-existent consensus record
        with self.assertRaises(ValueError):
            self.consensus_service.get_consensus_record(str(uuid.uuid4()))
    
    @patch('consensus_service.validate_against_schema')
    def test_get_consensus_by_seal(self, mock_validate):
        """Test getting consensus records by seal ID."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create multiple consensus records for the same seal
        consensus_record1 = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_record2 = self.consensus_service.create_consensus_record(self.seal_id)
        
        # Get consensus records by seal
        result = self.consensus_service.get_consensus_by_seal(self.seal_id)
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(consensus_record1["consensus_id"], [r["consensus_id"] for r in result])
        self.assertIn(consensus_record2["consensus_id"], [r["consensus_id"] for r in result])
    
    @patch('consensus_service.validate_against_schema')
    def test_get_all_consensus_records(self, mock_validate):
        """Test getting all consensus records."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create multiple consensus records
        consensus_record1 = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_record2 = self.consensus_service.create_consensus_record(str(uuid.uuid4()))
        
        # Get all consensus records
        result = self.consensus_service.get_all_consensus_records()
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(consensus_record1["consensus_id"], [r["consensus_id"] for r in result])
        self.assertIn(consensus_record2["consensus_id"], [r["consensus_id"] for r in result])
    
    @patch('consensus_service.validate_against_schema')
    def test_resolve_conflict(self, mock_validate):
        """Test resolving a conflict in consensus."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record
        consensus_record = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_id = consensus_record["consensus_id"]
        
        # Add conflicting verification results
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id1,
            True,
            self.signature1
        )
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id2,
            False,
            self.signature2
        )
        
        # Resolve conflict
        result = self.consensus_service.resolve_conflict(
            consensus_id,
            "majority_vote",
            "Resolved by majority vote"
        )
        
        # Verify result
        self.assertIn("conflict_resolution", result)
        self.assertEqual(result["conflict_resolution"]["conflict_detected"], True)
        self.assertEqual(result["conflict_resolution"]["resolution_method"], "majority_vote")
        self.assertEqual(result["conflict_resolution"]["resolution_details"], "Resolved by majority vote")
    
    @patch('consensus_service.validate_against_schema')
    def test_resolve_conflict_invalid_consensus(self, mock_validate):
        """Test resolving a conflict in an invalid consensus record."""
        # Attempt to resolve conflict in non-existent consensus
        with self.assertRaises(ValueError):
            self.consensus_service.resolve_conflict(
                str(uuid.uuid4()),
                "majority_vote",
                "Resolved by majority vote"
            )
    
    @patch('consensus_service.validate_against_schema')
    def test_resolve_conflict_invalid_method(self, mock_validate):
        """Test resolving a conflict with an invalid method."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record
        consensus_record = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_id = consensus_record["consensus_id"]
        
        # Attempt to resolve with invalid method
        with self.assertRaises(ValueError):
            self.consensus_service.resolve_conflict(
                consensus_id,
                "invalid_method",
                "Invalid resolution method"
            )
    
    @patch('consensus_service.validate_against_schema')
    def test_detect_conflicts(self, mock_validate):
        """Test detecting conflicts in a consensus record."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record
        consensus_record = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_id = consensus_record["consensus_id"]
        
        # Add conflicting verification results
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id1,
            True,
            self.signature1
        )
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id2,
            False,
            self.signature2
        )
        
        # Detect conflicts
        result = self.consensus_service.detect_conflicts(consensus_id)
        
        # Verify result
        self.assertTrue(result)
        
        # Check that conflict_resolution was added to the record
        consensus_record = self.consensus_service.get_consensus_record(consensus_id)
        self.assertIn("conflict_resolution", consensus_record)
        self.assertEqual(consensus_record["conflict_resolution"]["conflict_detected"], True)
    
    @patch('consensus_service.validate_against_schema')
    def test_detect_conflicts_no_conflict(self, mock_validate):
        """Test detecting conflicts when there are none."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record
        consensus_record = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_id = consensus_record["consensus_id"]
        
        # Add non-conflicting verification results
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id1,
            True,
            self.signature1
        )
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id2,
            True,
            self.signature2
        )
        
        # Detect conflicts
        result = self.consensus_service.detect_conflicts(consensus_id)
        
        # Verify result
        self.assertFalse(result)
    
    @patch('consensus_service.validate_against_schema')
    def test_get_verification_status(self, mock_validate):
        """Test getting verification status for a seal."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record
        consensus_record = self.consensus_service.create_consensus_record(self.seal_id)
        consensus_id = consensus_record["consensus_id"]
        
        # Add verification results
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id1,
            True,
            self.signature1
        )
        self.consensus_service.add_verification_result(
            consensus_id,
            self.node_id2,
            True,
            self.signature2
        )
        
        # Get verification status
        result = self.consensus_service.get_verification_status(self.seal_id)
        
        # Verify result
        self.assertEqual(result["seal_id"], self.seal_id)
        self.assertEqual(result["verification_status"], "verified")
        self.assertEqual(result["consensus_count"], 1)
        self.assertEqual(result["latest_consensus"], consensus_id)
    
    @patch('consensus_service.validate_against_schema')
    def test_get_verification_status_no_consensus(self, mock_validate):
        """Test getting verification status when no consensus records exist."""
        # Get verification status for non-existent seal
        result = self.consensus_service.get_verification_status(str(uuid.uuid4()))
        
        # Verify result
        self.assertEqual(result["verification_status"], "not_verified")
        self.assertEqual(result["consensus_count"], 0)
        self.assertIsNone(result["latest_consensus"])
    
    def test_pre_loop_tether_check(self):
        """Test pre-loop tether check."""
        # Valid contract and phase
        self.assertTrue(pre_loop_tether_check("v2025.05.18", "5.4"))
        
        # Invalid contract
        self.assertFalse(pre_loop_tether_check("v2025.05.17", "5.4"))
        
        # Invalid phase
        self.assertFalse(pre_loop_tether_check("v2025.05.18", "5.3"))


class TestThresholdSignature(unittest.TestCase):
    """Test cases for ThresholdSignature."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.threshold_signature = ThresholdSignature()
        self.message_id = str(uuid.uuid4())
        
        # Create valid node IDs and signatures for testing
        self.node_id1 = str(uuid.uuid4())
        self.node_id2 = str(uuid.uuid4())
        self.node_id3 = str(uuid.uuid4())
        self.signature1 = "BASE64_ENCODED_SIGNATURE_1"
        self.signature2 = "BASE64_ENCODED_SIGNATURE_2"
        self.signature3 = "BASE64_ENCODED_SIGNATURE_3"
    
    def test_add_signature(self):
        """Test adding a signature."""
        # Add signature
        self.threshold_signature.add_signature(self.message_id, self.node_id1, self.signature1)
        
        # Verify signature was added
        self.assertIn(self.message_id, self.threshold_signature.signatures)
        self.assertIn(self.node_id1, self.threshold_signature.signatures[self.message_id]["signatures"])
        self.assertEqual(
            self.threshold_signature.signatures[self.message_id]["signatures"][self.node_id1],
            self.signature1
        )
    
    def test_check_threshold_not_reached(self):
        """Test checking threshold when not reached."""
        # Add one signature
        self.threshold_signature.add_signature(self.message_id, self.node_id1, self.signature1)
        
        # Check threshold with total of 3 nodes
        result = self.threshold_signature.check_threshold(self.message_id, 3)
        
        # Verify result
        self.assertFalse(result)
    
    def test_check_threshold_reached(self):
        """Test checking threshold when reached."""
        # Add two signatures
        self.threshold_signature.add_signature(self.message_id, self.node_id1, self.signature1)
        self.threshold_signature.add_signature(self.message_id, self.node_id2, self.signature2)
        
        # Check threshold with total of 3 nodes (threshold is 0.67, so 2/3 is enough)
        result = self.threshold_signature.check_threshold(self.message_id, 3)
        
        # Verify result
        self.assertTrue(result)
    
    def test_generate_threshold_signature(self):
        """Test generating a threshold signature."""
        # Add two signatures
        self.threshold_signature.add_signature(self.message_id, self.node_id1, self.signature1)
        self.threshold_signature.add_signature(self.message_id, self.node_id2, self.signature2)
        
        # Generate threshold signature
        result = self.threshold_signature.generate_threshold_signature(self.message_id, 3)
        
        # Verify result
        self.assertIsNotNone(result)
        self.assertTrue(self.threshold_signature.signatures[self.message_id]["threshold_reached"])
        self.assertEqual(self.threshold_signature.signatures[self.message_id]["threshold_signature"], result)
    
    def test_generate_threshold_signature_not_reached(self):
        """Test generating a threshold signature when threshold not reached."""
        # Add one signature
        self.threshold_signature.add_signature(self.message_id, self.node_id1, self.signature1)
        
        # Generate threshold signature
        result = self.threshold_signature.generate_threshold_signature(self.message_id, 3)
        
        # Verify result
        self.assertIsNone(result)
        self.assertFalse(self.threshold_signature.signatures[self.message_id]["threshold_reached"])
    
    def test_get_threshold_signature(self):
        """Test getting a threshold signature."""
        # Add signatures and generate threshold signature
        self.threshold_signature.add_signature(self.message_id, self.node_id1, self.signature1)
        self.threshold_signature.add_signature(self.message_id, self.node_id2, self.signature2)
        generated = self.threshold_signature.generate_threshold_signature(self.message_id, 3)
        
        # Get threshold signature
        result = self.threshold_signature.get_threshold_signature(self.message_id)
        
        # Verify result
        self.assertEqual(result, generated)
    
    def test_get_threshold_signature_not_generated(self):
        """Test getting a threshold signature that hasn't been generated."""
        # Add one signature (not enough for threshold)
        self.threshold_signature.add_signature(self.message_id, self.node_id1, self.signature1)
        
        # Get threshold signature
        result = self.threshold_signature.get_threshold_signature(self.message_id)
        
        # Verify result
        self.assertIsNone(result)
    
    def test_get_threshold_signature_not_found(self):
        """Test getting a threshold signature for a non-existent message."""
        # Get threshold signature for non-existent message
        result = self.threshold_signature.get_threshold_signature(str(uuid.uuid4()))
        
        # Verify result
        self.assertIsNone(result)


if __name__ == '__main__':
    unittest.main()
