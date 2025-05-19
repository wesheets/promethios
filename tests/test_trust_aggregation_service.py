"""
Unit tests for TrustAggregationService.

This module tests the TrustAggregationService component of Phase 5.4.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import unittest
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

from src.core.verification.trust_aggregation_service import TrustAggregationService, pre_loop_tether_check


class TestTrustAggregationService(unittest.TestCase):
    """Test cases for TrustAggregationService."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.trust_service = TrustAggregationService()
        
        # Create a valid seal ID for testing
        self.seal_id = str(uuid.uuid4())
        
        # Create valid node IDs for testing
        self.node_id1 = str(uuid.uuid4())
        self.node_id2 = str(uuid.uuid4())
        self.node_id3 = str(uuid.uuid4())
        
        # Create node trust scores
        self.node_trust_scores = {
            self.node_id1: 0.9,
            self.node_id2: 0.8,
            self.node_id3: 0.7
        }
        
        # Create a valid consensus record for testing
        self.consensus_record = {
            "consensus_id": str(uuid.uuid4()),
            "seal_id": self.seal_id,
            "participating_nodes": [
                {
                    "node_id": self.node_id1,
                    "verification_result": True,
                    "signature": "BASE64_ENCODED_SIGNATURE_1",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                },
                {
                    "node_id": self.node_id2,
                    "verification_result": True,
                    "signature": "BASE64_ENCODED_SIGNATURE_2",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                },
                {
                    "node_id": self.node_id3,
                    "verification_result": False,
                    "signature": "BASE64_ENCODED_SIGNATURE_3",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            ],
            "consensus_result": True,
            "consensus_threshold": 0.67,
            "consensus_percentage": 0.67,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "contract_version": "v2025.05.18",
            "phase_id": "5.4",
            "codex_clauses": ["5.4", "11.0"]
        }
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_aggregate_verification_results(self, mock_validate):
        """Test aggregating verification results."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Aggregate verification results
        result = self.trust_service.aggregate_verification_results(
            self.seal_id,
            self.consensus_record,
            self.node_trust_scores
        )
        
        # Verify result
        self.assertIn("trust_record_id", result)
        self.assertEqual(result["seal_id"], self.seal_id)
        self.assertEqual(result["consensus_id"], self.consensus_record["consensus_id"])
        self.assertIn("trust_score", result)
        self.assertIn("weighted_results", result)
        self.assertEqual(len(result["weighted_results"]), 3)
        self.assertEqual(result["node_count"], 3)
        self.assertEqual(result["contract_version"], "v2025.05.18")
        self.assertEqual(result["phase_id"], "5.4")
        self.assertIn("5.4", result["codex_clauses"])
        self.assertIn("11.0", result["codex_clauses"])
        
        # Verify trust record was stored
        self.assertIn(result["trust_record_id"], self.trust_service.trust_records)
        
        # Verify seal trust score was updated
        self.assertIn(self.seal_id, self.trust_service.seal_trust_scores)
        
        # Verify historical record was added
        self.assertIn(self.seal_id, self.trust_service.historical_records)
        self.assertEqual(len(self.trust_service.historical_records[self.seal_id]), 1)
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_aggregate_verification_results_validation_failure(self, mock_validate):
        """Test aggregating verification results with validation failure."""
        # Mock validation to return failure
        mock_validate.return_value = (False, "Invalid consensus record")
        
        # Attempt to aggregate with invalid consensus record
        with self.assertRaises(ValueError):
            self.trust_service.aggregate_verification_results(
                self.seal_id,
                self.consensus_record,
                self.node_trust_scores
            )
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_aggregate_verification_results_no_nodes(self, mock_validate):
        """Test aggregating verification results with no participating nodes."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create consensus record with no participating nodes
        empty_consensus = self.consensus_record.copy()
        empty_consensus["participating_nodes"] = []
        
        # Attempt to aggregate with no participating nodes
        with self.assertRaises(ValueError):
            self.trust_service.aggregate_verification_results(
                self.seal_id,
                empty_consensus,
                self.node_trust_scores
            )
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_trust_record(self, mock_validate):
        """Test getting a trust record by ID."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Aggregate verification results
        trust_record = self.trust_service.aggregate_verification_results(
            self.seal_id,
            self.consensus_record,
            self.node_trust_scores
        )
        trust_record_id = trust_record["trust_record_id"]
        
        # Get trust record
        result = self.trust_service.get_trust_record(trust_record_id)
        
        # Verify result
        self.assertEqual(result["trust_record_id"], trust_record_id)
        self.assertEqual(result["seal_id"], self.seal_id)
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_trust_record_not_found(self, mock_validate):
        """Test getting a non-existent trust record."""
        # Attempt to get non-existent trust record
        with self.assertRaises(ValueError):
            self.trust_service.get_trust_record(str(uuid.uuid4()))
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_seal_trust_score(self, mock_validate):
        """Test getting the trust score for a seal."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Aggregate verification results
        trust_record = self.trust_service.aggregate_verification_results(
            self.seal_id,
            self.consensus_record,
            self.node_trust_scores
        )
        
        # Get seal trust score
        result = self.trust_service.get_seal_trust_score(self.seal_id)
        
        # Verify result
        self.assertEqual(result, trust_record["trust_score"])
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_seal_trust_score_not_found(self, mock_validate):
        """Test getting the trust score for a non-existent seal."""
        # Get trust score for non-existent seal
        result = self.trust_service.get_seal_trust_score(str(uuid.uuid4()))
        
        # Verify result
        self.assertEqual(result, 0.0)
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_seal_trust_history(self, mock_validate):
        """Test getting the trust history for a seal."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Aggregate verification results
        trust_record = self.trust_service.aggregate_verification_results(
            self.seal_id,
            self.consensus_record,
            self.node_trust_scores
        )
        
        # Get seal trust history
        result = self.trust_service.get_seal_trust_history(self.seal_id)
        
        # Verify result
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["trust_record_id"], trust_record["trust_record_id"])
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_seal_trust_history_not_found(self, mock_validate):
        """Test getting the trust history for a non-existent seal."""
        # Get trust history for non-existent seal
        result = self.trust_service.get_seal_trust_history(str(uuid.uuid4()))
        
        # Verify result
        self.assertEqual(result, [])
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_calculate_confidence_metrics(self, mock_validate):
        """Test calculating confidence metrics for a trust record."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Aggregate verification results
        trust_record = self.trust_service.aggregate_verification_results(
            self.seal_id,
            self.consensus_record,
            self.node_trust_scores
        )
        trust_record_id = trust_record["trust_record_id"]
        
        # Calculate confidence metrics
        result = self.trust_service.calculate_confidence_metrics(trust_record_id)
        
        # Verify result
        self.assertIn("confidence", result)
        self.assertIn("variance", result)
        self.assertIn("agreement_ratio", result)
        self.assertGreaterEqual(result["confidence"], 0.0)
        self.assertLessEqual(result["confidence"], 1.0)
        self.assertGreaterEqual(result["variance"], 0.0)
        self.assertLessEqual(result["variance"], 1.0)
        self.assertGreaterEqual(result["agreement_ratio"], 0.0)
        self.assertLessEqual(result["agreement_ratio"], 1.0)
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_calculate_confidence_metrics_not_found(self, mock_validate):
        """Test calculating confidence metrics for a non-existent trust record."""
        # Attempt to calculate metrics for non-existent trust record
        with self.assertRaises(ValueError):
            self.trust_service.calculate_confidence_metrics(str(uuid.uuid4()))
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_trust_summary(self, mock_validate):
        """Test getting a trust summary for a seal."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Aggregate verification results
        trust_record = self.trust_service.aggregate_verification_results(
            self.seal_id,
            self.consensus_record,
            self.node_trust_scores
        )
        
        # Get trust summary
        result = self.trust_service.get_trust_summary(self.seal_id)
        
        # Verify result
        self.assertEqual(result["seal_id"], self.seal_id)
        self.assertEqual(result["trust_score"], trust_record["trust_score"])
        self.assertEqual(result["verification_count"], 1)
        self.assertIsNotNone(result["last_verified"])
        self.assertIsNotNone(result["confidence_metrics"])
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_trust_summary_not_found(self, mock_validate):
        """Test getting a trust summary for a non-existent seal."""
        # Get trust summary for non-existent seal
        result = self.trust_service.get_trust_summary(str(uuid.uuid4()))
        
        # Verify result
        self.assertEqual(result["trust_score"], 0.0)
        self.assertEqual(result["verification_count"], 0)
        self.assertIsNone(result["last_verified"])
        self.assertIsNone(result["confidence_metrics"])
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_all_seal_trust_scores(self, mock_validate):
        """Test getting trust scores for all seals."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Aggregate verification results for multiple seals
        self.trust_service.aggregate_verification_results(
            self.seal_id,
            self.consensus_record,
            self.node_trust_scores
        )
        
        seal_id2 = str(uuid.uuid4())
        consensus_record2 = self.consensus_record.copy()
        consensus_record2["consensus_id"] = str(uuid.uuid4())
        consensus_record2["seal_id"] = seal_id2
        
        self.trust_service.aggregate_verification_results(
            seal_id2,
            consensus_record2,
            self.node_trust_scores
        )
        
        # Get all seal trust scores
        result = self.trust_service.get_all_seal_trust_scores()
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(self.seal_id, result)
        self.assertIn(seal_id2, result)
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_high_trust_seals(self, mock_validate):
        """Test getting high trust seals."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Aggregate verification results with different trust scores
        # First seal with high trust
        self.trust_service.aggregate_verification_results(
            self.seal_id,
            self.consensus_record,
            self.node_trust_scores
        )
        self.trust_service.seal_trust_scores[self.seal_id] = 0.9  # Force high trust
        
        # Second seal with low trust
        seal_id2 = str(uuid.uuid4())
        consensus_record2 = self.consensus_record.copy()
        consensus_record2["consensus_id"] = str(uuid.uuid4())
        consensus_record2["seal_id"] = seal_id2
        
        self.trust_service.aggregate_verification_results(
            seal_id2,
            consensus_record2,
            self.node_trust_scores
        )
        self.trust_service.seal_trust_scores[seal_id2] = 0.3  # Force low trust
        
        # Get high trust seals
        result = self.trust_service.get_high_trust_seals(threshold=0.8)
        
        # Verify result
        self.assertEqual(len(result), 1)
        self.assertIn(self.seal_id, result)
        self.assertNotIn(seal_id2, result)
    
    @patch('trust_aggregation_service.validate_against_schema')
    def test_get_low_trust_seals(self, mock_validate):
        """Test getting low trust seals."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Aggregate verification results with different trust scores
        # First seal with high trust
        self.trust_service.aggregate_verification_results(
            self.seal_id,
            self.consensus_record,
            self.node_trust_scores
        )
        self.trust_service.seal_trust_scores[self.seal_id] = 0.9  # Force high trust
        
        # Second seal with low trust
        seal_id2 = str(uuid.uuid4())
        consensus_record2 = self.consensus_record.copy()
        consensus_record2["consensus_id"] = str(uuid.uuid4())
        consensus_record2["seal_id"] = seal_id2
        
        self.trust_service.aggregate_verification_results(
            seal_id2,
            consensus_record2,
            self.node_trust_scores
        )
        self.trust_service.seal_trust_scores[seal_id2] = 0.2  # Force low trust
        
        # Get low trust seals
        result = self.trust_service.get_low_trust_seals(threshold=0.3)
        
        # Verify result
        self.assertEqual(len(result), 1)
        self.assertIn(seal_id2, result)
        self.assertNotIn(self.seal_id, result)
    
    def test_pre_loop_tether_check(self):
        """Test pre-loop tether check."""
        # Valid contract and phase
        self.assertTrue(pre_loop_tether_check("v2025.05.18", "5.4"))
        
        # Invalid contract
        self.assertFalse(pre_loop_tether_check("v2025.05.17", "5.4"))
        
        # Invalid phase
        self.assertFalse(pre_loop_tether_check("v2025.05.18", "5.3"))


if __name__ == '__main__':
    unittest.main()
