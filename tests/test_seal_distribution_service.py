"""
Unit tests for SealDistributionService.

This module tests the SealDistributionService component of Phase 5.4.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import unittest
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

from src.core.verification.seal_distribution_service import SealDistributionService, pre_loop_tether_check


class TestSealDistributionService(unittest.TestCase):
    """Test cases for SealDistributionService."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.distribution_service = SealDistributionService()
        
        # Create a valid seal for testing
        self.valid_seal = {
            "seal_id": str(uuid.uuid4()),
            "merkle_root": "BASE64_ENCODED_MERKLE_ROOT",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "contract_version": "v2025.05.18",
            "phase_id": "5.4",
            "codex_clauses": ["5.4", "11.0"],
            "signature": "BASE64_ENCODED_SIGNATURE"
        }
        
        # Create valid nodes for testing
        self.node1 = {
            "node_id": str(uuid.uuid4()),
            "public_key": "BASE64_ENCODED_PUBLIC_KEY_1",
            "status": "active",
            "role": "coordinator"
        }
        
        self.node2 = {
            "node_id": str(uuid.uuid4()),
            "public_key": "BASE64_ENCODED_PUBLIC_KEY_2",
            "status": "active",
            "role": "verifier"
        }
        
        self.nodes = [self.node1, self.node2]
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_queue_seal_for_distribution(self, mock_validate):
        """Test queuing a seal for distribution."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal
        result = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        # Verify result
        self.assertIsInstance(result, str)  # Distribution ID
        
        # Verify seal was queued
        self.assertEqual(len(self.distribution_service.distribution_queue), 1)
        self.assertEqual(self.distribution_service.distribution_queue[0]["seal_id"], self.valid_seal["seal_id"])
        self.assertEqual(self.distribution_service.distribution_queue[0]["status"], "queued")
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_queue_seal_for_distribution_with_priority(self, mock_validate):
        """Test queuing a seal with priority."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal with priority
        result = self.distribution_service.queue_seal_for_distribution(self.valid_seal, priority=5)
        
        # Verify result
        self.assertIsInstance(result, str)  # Distribution ID
        
        # Verify seal was queued with priority
        self.assertEqual(self.distribution_service.distribution_queue[0]["priority"], 5)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_queue_seal_for_distribution_invalid_priority(self, mock_validate):
        """Test queuing a seal with invalid priority."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Attempt to queue with invalid priority
        with self.assertRaises(ValueError):
            self.distribution_service.queue_seal_for_distribution(self.valid_seal, priority=6)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_queue_seal_for_distribution_validation_failure(self, mock_validate):
        """Test queuing a seal with validation failure."""
        # Mock validation to return failure
        mock_validate.return_value = (False, "Invalid seal")
        
        # Attempt to queue invalid seal
        with self.assertRaises(ValueError):
            self.distribution_service.queue_seal_for_distribution(self.valid_seal)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_distribute_seal(self, mock_validate):
        """Test distributing a seal to nodes."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        # Mock _send_seal_to_node to always succeed
        self.distribution_service._send_seal_to_node = MagicMock(return_value=True)
        
        # Distribute seal
        result = self.distribution_service.distribute_seal(distribution_id, self.nodes)
        
        # Verify result
        self.assertEqual(result["distribution_id"], distribution_id)
        self.assertEqual(result["seal_id"], self.valid_seal["seal_id"])
        self.assertEqual(result["status"], "distributed")
        self.assertEqual(len(result["node_distributions"]), 2)
        
        # Verify all node distributions succeeded
        for node_dist in result["node_distributions"]:
            self.assertTrue(node_dist["success"])
        
        # Verify distribution was moved to history
        self.assertEqual(len(self.distribution_service.distribution_queue), 0)
        self.assertEqual(len(self.distribution_service.distribution_history), 1)
        self.assertIn(distribution_id, self.distribution_service.distribution_history)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_distribute_seal_partial_success(self, mock_validate):
        """Test distributing a seal with partial success."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        # Mock _send_seal_to_node to succeed for first node, fail for second
        def mock_send_seal(seal, node):
            return node["node_id"] == self.node1["node_id"]
        
        self.distribution_service._send_seal_to_node = MagicMock(side_effect=mock_send_seal)
        
        # Distribute seal
        result = self.distribution_service.distribute_seal(distribution_id, self.nodes)
        
        # Verify result
        self.assertEqual(result["status"], "partially_distributed")
        self.assertEqual(result["retry_count"], 1)
        
        # Verify node distributions
        success_count = sum(1 for node_dist in result["node_distributions"] if node_dist["success"])
        self.assertEqual(success_count, 1)
        
        # Verify distribution remains in queue
        self.assertEqual(len(self.distribution_service.distribution_queue), 1)
        self.assertEqual(len(self.distribution_service.distribution_history), 0)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_distribute_seal_all_fail(self, mock_validate):
        """Test distributing a seal with all failures."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        # Mock _send_seal_to_node to always fail
        self.distribution_service._send_seal_to_node = MagicMock(return_value=False)
        
        # Distribute seal
        result = self.distribution_service.distribute_seal(distribution_id, self.nodes)
        
        # Verify result
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["retry_count"], 1)
        
        # Verify all node distributions failed
        for node_dist in result["node_distributions"]:
            self.assertFalse(node_dist["success"])
        
        # Verify distribution remains in queue
        self.assertEqual(len(self.distribution_service.distribution_queue), 1)
        self.assertEqual(len(self.distribution_service.distribution_history), 0)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_distribute_seal_invalid_distribution(self, mock_validate):
        """Test distributing an invalid seal distribution."""
        # Attempt to distribute non-existent distribution
        with self.assertRaises(ValueError):
            self.distribution_service.distribute_seal(str(uuid.uuid4()), self.nodes)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_retry_failed_distributions(self, mock_validate):
        """Test retrying failed distributions."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue two seals
        distribution_id1 = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        seal2 = self.valid_seal.copy()
        seal2["seal_id"] = str(uuid.uuid4())
        distribution_id2 = self.distribution_service.queue_seal_for_distribution(seal2)
        
        # Mock _send_seal_to_node to always fail
        self.distribution_service._send_seal_to_node = MagicMock(return_value=False)
        
        # Distribute seals (both will fail)
        self.distribution_service.distribute_seal(distribution_id1, self.nodes)
        self.distribution_service.distribute_seal(distribution_id2, self.nodes)
        
        # Now mock _send_seal_to_node to always succeed for retries
        self.distribution_service._send_seal_to_node = MagicMock(return_value=True)
        
        # Retry failed distributions
        result = self.distribution_service.retry_failed_distributions(self.nodes)
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["status"], "distributed")
        self.assertEqual(result[1]["status"], "distributed")
        
        # Verify distributions were moved to history
        self.assertEqual(len(self.distribution_service.distribution_queue), 0)
        self.assertEqual(len(self.distribution_service.distribution_history), 2)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_get_distribution_status(self, mock_validate):
        """Test getting distribution status."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        # Get status
        result = self.distribution_service.get_distribution_status(distribution_id)
        
        # Verify result
        self.assertEqual(result["distribution_id"], distribution_id)
        self.assertEqual(result["seal_id"], self.valid_seal["seal_id"])
        self.assertEqual(result["status"], "queued")
        self.assertEqual(result["node_count"], 0)
        self.assertEqual(result["success_count"], 0)
        self.assertEqual(result["retry_count"], 0)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_get_distribution_status_from_history(self, mock_validate):
        """Test getting distribution status from history."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        # Mock _send_seal_to_node to always succeed
        self.distribution_service._send_seal_to_node = MagicMock(return_value=True)
        
        # Distribute seal (will move to history)
        self.distribution_service.distribute_seal(distribution_id, self.nodes)
        
        # Get status
        result = self.distribution_service.get_distribution_status(distribution_id)
        
        # Verify result
        self.assertEqual(result["distribution_id"], distribution_id)
        self.assertEqual(result["seal_id"], self.valid_seal["seal_id"])
        self.assertEqual(result["status"], "distributed")
        self.assertEqual(result["node_count"], 2)
        self.assertEqual(result["success_count"], 2)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_get_distribution_status_invalid_distribution(self, mock_validate):
        """Test getting status of an invalid distribution."""
        # Attempt to get status of non-existent distribution
        with self.assertRaises(ValueError):
            self.distribution_service.get_distribution_status(str(uuid.uuid4()))
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_get_seal_distribution_history(self, mock_validate):
        """Test getting distribution history for a seal."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        # Get history
        result = self.distribution_service.get_seal_distribution_history(self.valid_seal["seal_id"])
        
        # Verify result
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["distribution_id"], distribution_id)
        self.assertEqual(result[0]["seal_id"], self.valid_seal["seal_id"])
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_get_node_distribution_history(self, mock_validate):
        """Test getting distribution history for a node."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        # Mock _send_seal_to_node to always succeed
        self.distribution_service._send_seal_to_node = MagicMock(return_value=True)
        
        # Distribute seal
        self.distribution_service.distribute_seal(distribution_id, self.nodes)
        
        # Get history for node1
        result = self.distribution_service.get_node_distribution_history(self.node1["node_id"])
        
        # Verify result
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["distribution_id"], distribution_id)
        self.assertEqual(result[0]["seal_id"], self.valid_seal["seal_id"])
        self.assertTrue(result[0]["success"])
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_prioritize_seal_distribution(self, mock_validate):
        """Test prioritizing a seal distribution."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal with default priority (1)
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        # Prioritize distribution
        result = self.distribution_service.prioritize_seal_distribution(distribution_id, 5)
        
        # Verify result
        self.assertEqual(result["distribution_id"], distribution_id)
        self.assertEqual(result["priority"], 5)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_prioritize_seal_distribution_invalid_priority(self, mock_validate):
        """Test prioritizing a seal distribution with invalid priority."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.valid_seal)
        
        # Attempt to prioritize with invalid priority
        with self.assertRaises(ValueError):
            self.distribution_service.prioritize_seal_distribution(distribution_id, 6)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_prioritize_seal_distribution_invalid_distribution(self, mock_validate):
        """Test prioritizing an invalid seal distribution."""
        # Attempt to prioritize non-existent distribution
        with self.assertRaises(ValueError):
            self.distribution_service.prioritize_seal_distribution(str(uuid.uuid4()), 3)
    
    @patch('seal_distribution_service.validate_against_schema')
    def test_optimize_bandwidth(self, mock_validate):
        """Test optimizing bandwidth."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue multiple seals
        for i in range(10):
            seal = self.valid_seal.copy()
            seal["seal_id"] = str(uuid.uuid4())
            self.distribution_service.queue_seal_for_distribution(seal)
        
        # Optimize bandwidth with max_concurrent=3
        result = self.distribution_service.optimize_bandwidth(max_concurrent=3)
        
        # Verify result
        self.assertEqual(len(result), 3)
        for record in result:
            self.assertEqual(record["status"], "distributing")
        
        # Verify queue status
        distributing_count = sum(1 for record in self.distribution_service.distribution_queue 
                                if record["status"] == "distributing")
        self.assertEqual(distributing_count, 3)
    
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
