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
import pytest

from src.core.verification.seal_distribution_service import SealDistributionService, pre_loop_tether_check

@pytest.mark.phase_5_4
class TestSealDistributionService(unittest.TestCase):
    """Test cases for SealDistributionService."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.distribution_service = SealDistributionService()
        
        # Create a valid seal for testing
        self.seal = {
            "seal_id": str(uuid.uuid4()),
            "execution_id": str(uuid.uuid4()),
            "hash": "SHA256_HASH_VALUE",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "contract_version": "v2025.05.18",
            "phase_id": "5.4",
            "codex_clauses": ["5.4", "11.0"]
        }
        
        # Create valid node IDs for testing
        self.node_id1 = str(uuid.uuid4())
        self.node_id2 = str(uuid.uuid4())
        self.node_id3 = str(uuid.uuid4())
        
        # Create a list of target nodes
        self.target_nodes = [self.node_id1, self.node_id2, self.node_id3]
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_queue_seal_for_distribution(self, mock_validate):
        """Test queuing a seal for distribution."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal for distribution
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.seal)
        
        # Verify distribution ID was returned
        self.assertIsNotNone(distribution_id)
        
        # Verify seal was added to queue
        self.assertEqual(len(self.distribution_service.distribution_queue), 1)
        self.assertEqual(self.distribution_service.distribution_queue[0]["seal"]["seal_id"], self.seal["seal_id"])
        self.assertEqual(self.distribution_service.distribution_queue[0]["priority"], 1)
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_queue_seal_for_distribution_with_priority(self, mock_validate):
        """Test queuing a seal with a specific priority."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal with high priority
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.seal, priority=5)
        
        # Verify priority was set
        self.assertEqual(self.distribution_service.distribution_queue[0]["priority"], 5)
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_queue_seal_for_distribution_invalid_priority(self, mock_validate):
        """Test queuing a seal with an invalid priority."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Attempt to queue with invalid priority
        with self.assertRaises(ValueError):
            self.distribution_service.queue_seal_for_distribution(self.seal, priority=6)
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_queue_seal_for_distribution_validation_failure(self, mock_validate):
        """Test queuing a seal with validation failure."""
        # Mock validation to return failure
        mock_validate.return_value = (False, "Invalid seal")
        
        # Attempt to queue invalid seal
        with self.assertRaises(ValueError):
            self.distribution_service.queue_seal_for_distribution(self.seal)
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_distribute_seal(self, mock_validate):
        """Test distributing a seal to nodes."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue seal for distribution
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.seal)
        
        # Distribute seal
        result = self.distribution_service.distribute_seal(distribution_id, self.target_nodes)
        
        # Verify result
        self.assertEqual(result["distribution_id"], distribution_id)
        self.assertEqual(result["seal_id"], self.seal["seal_id"])
        self.assertEqual(len(result["target_nodes"]), 3)
        self.assertEqual(result["status"], "distributed")
        
        # Verify distribution was recorded in history
        self.assertIn(distribution_id, self.distribution_service.distribution_history)
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_distribute_seal_not_found(self, mock_validate):
        """Test distributing a non-existent seal."""
        # Attempt to distribute non-existent seal
        with self.assertRaises(ValueError):
            self.distribution_service.distribute_seal(str(uuid.uuid4()), self.target_nodes)
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_get_distribution_status(self, mock_validate):
        """Test getting distribution status."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue and distribute seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.seal)
        self.distribution_service.distribute_seal(distribution_id, self.target_nodes)
        
        # Get distribution status
        result = self.distribution_service.get_distribution_status(distribution_id)
        
        # Verify result
        self.assertEqual(result["distribution_id"], distribution_id)
        self.assertEqual(result["seal_id"], self.seal["seal_id"])
        self.assertEqual(result["status"], "distributed")
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_get_distribution_status_not_found(self, mock_validate):
        """Test getting status for a non-existent distribution."""
        # Attempt to get status for non-existent distribution
        with self.assertRaises(ValueError):
            self.distribution_service.get_distribution_status(str(uuid.uuid4()))
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_get_all_distributions(self, mock_validate):
        """Test getting all distributions."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue and distribute multiple seals
        seal1 = self.seal.copy()
        seal1["seal_id"] = str(uuid.uuid4())
        
        seal2 = self.seal.copy()
        seal2["seal_id"] = str(uuid.uuid4())
        
        distribution_id1 = self.distribution_service.queue_seal_for_distribution(seal1)
        distribution_id2 = self.distribution_service.queue_seal_for_distribution(seal2)
        
        self.distribution_service.distribute_seal(distribution_id1, self.target_nodes)
        self.distribution_service.distribute_seal(distribution_id2, self.target_nodes)
        
        # Get all distributions
        result = self.distribution_service.get_all_distributions()
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(distribution_id1, [d["distribution_id"] for d in result])
        self.assertIn(distribution_id2, [d["distribution_id"] for d in result])
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_get_distributions_by_seal(self, mock_validate):
        """Test getting distributions by seal ID."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue and distribute multiple seals
        seal1 = self.seal.copy()
        seal1["seal_id"] = str(uuid.uuid4())
        
        distribution_id1 = self.distribution_service.queue_seal_for_distribution(seal1)
        distribution_id2 = self.distribution_service.queue_seal_for_distribution(seal1)
        
        self.distribution_service.distribute_seal(distribution_id1, self.target_nodes)
        self.distribution_service.distribute_seal(distribution_id2, self.target_nodes)
        
        # Get distributions by seal
        result = self.distribution_service.get_distributions_by_seal(seal1["seal_id"])
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(distribution_id1, [d["distribution_id"] for d in result])
        self.assertIn(distribution_id2, [d["distribution_id"] for d in result])
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_get_distributions_by_node(self, mock_validate):
        """Test getting distributions by node ID."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue and distribute seals to different nodes
        distribution_id1 = self.distribution_service.queue_seal_for_distribution(self.seal)
        self.distribution_service.distribute_seal(distribution_id1, [self.node_id1, self.node_id2])
        
        seal2 = self.seal.copy()
        seal2["seal_id"] = str(uuid.uuid4())
        distribution_id2 = self.distribution_service.queue_seal_for_distribution(seal2)
        self.distribution_service.distribute_seal(distribution_id2, [self.node_id2, self.node_id3])
        
        # Get distributions by node
        result = self.distribution_service.get_distributions_by_node(self.node_id2)
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(distribution_id1, [d["distribution_id"] for d in result])
        self.assertIn(distribution_id2, [d["distribution_id"] for d in result])
        
        # Get distributions for a different node
        result = self.distribution_service.get_distributions_by_node(self.node_id1)
        self.assertEqual(len(result), 1)
        self.assertIn(distribution_id1, [d["distribution_id"] for d in result])
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_record_node_receipt(self, mock_validate):
        """Test recording a node's receipt of a seal."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue and distribute seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.seal)
        self.distribution_service.distribute_seal(distribution_id, self.target_nodes)
        
        # Record node receipt
        result = self.distribution_service.record_node_receipt(
            distribution_id,
            self.node_id1,
            "received",
            "Seal received successfully"
        )
        
        # Verify result
        self.assertEqual(result["distribution_id"], distribution_id)
        self.assertEqual(len(result["node_receipts"]), 1)
        self.assertEqual(result["node_receipts"][0]["node_id"], self.node_id1)
        self.assertEqual(result["node_receipts"][0]["status"], "received")
        self.assertEqual(result["node_receipts"][0]["message"], "Seal received successfully")
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_record_node_receipt_not_found(self, mock_validate):
        """Test recording a receipt for a non-existent distribution."""
        # Attempt to record receipt for non-existent distribution
        with self.assertRaises(ValueError):
            self.distribution_service.record_node_receipt(
                str(uuid.uuid4()),
                self.node_id1,
                "received",
                "Seal received successfully"
            )
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_record_node_receipt_invalid_node(self, mock_validate):
        """Test recording a receipt for a node not in the target list."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue and distribute seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.seal)
        self.distribution_service.distribute_seal(distribution_id, [self.node_id1, self.node_id2])
        
        # Attempt to record receipt for non-target node
        with self.assertRaises(ValueError):
            self.distribution_service.record_node_receipt(
                distribution_id,
                self.node_id3,
                "received",
                "Seal received successfully"
            )
    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_get_node_receipts(self, mock_validate):
        """Test getting node receipts for a distribution."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Queue and distribute seal
        distribution_id = self.distribution_service.queue_seal_for_distribution(self.seal)
        self.distribution_service.distribute_seal(distribution_id, self.target_nodes)
        
        # Record multiple node receipts
        self.distribution_service.record_node_receipt(
            distribution_id,
            self.node_id1,
            "received",
            "Seal received successfully"
        )
        self.distribution_service.record_node_receipt(
            distribution_id,
            self.node_id2,
            "received",
            "Seal received successfully"
        )
        
        # Get node receipts
        result = self.distribution_service.get_node_receipts(distribution_id)
              # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(self.node_id1, [r["node_id"] for r in result])
        self.assertIn(self.node_id2, [r["node_id"] for r in result])    
    @patch('src.core.verification.seal_distribution_service.validate_against_schema')
    def test_get_node_receipts_not_found(self, mock_validate):
        """Test getting receipts for a non-existent distribution."""
        # Attempt to get receipts for non-existent distribution
        with self.assertRaises(ValueError):
            self.distribution_service.get_node_receipts(str(uuid.uuid4()))
