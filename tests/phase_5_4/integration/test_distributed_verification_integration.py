"""
Integration tests for Distributed Verification Integration.

This module tests the integration of all Phase 5.4 components.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import unittest
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

from src.integration.distributed_verification_integration import DistributedVerificationIntegration, pre_loop_tether_check


class TestDistributedVerificationIntegration(unittest.TestCase):
    """Test cases for DistributedVerificationIntegration."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Mock all component dependencies
        with patch('distributed_verification_integration.VerificationNodeManager'), \
             patch('distributed_verification_integration.ConsensusService'), \
             patch('distributed_verification_integration.NetworkTopologyManager'), \
             patch('distributed_verification_integration.SealDistributionService'), \
             patch('distributed_verification_integration.TrustAggregationService'), \
             patch('distributed_verification_integration.MerkleSealGenerator'), \
             patch('distributed_verification_integration.MerkleTree'), \
             patch('distributed_verification_integration.ConflictDetector'), \
             patch('distributed_verification_integration.OutputCapture'):
            self.integration = DistributedVerificationIntegration()
        
        # Create a valid execution output for testing
        self.execution_output = {
            "output_id": str(uuid.uuid4()),
            "content": "Test execution output",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "metadata": {
                "execution_id": str(uuid.uuid4()),
                "user_id": "user-123"
            }
        }
    
    def test_process_execution_output(self):
        """Test processing execution output."""
        # Mock component methods
        self.integration.seal_generator.generate_seal = MagicMock(return_value={
            "seal_id": str(uuid.uuid4())
        })
        self.integration.node_manager.get_active_nodes = MagicMock(return_value=[
            {"node_id": str(uuid.uuid4())},
            {"node_id": str(uuid.uuid4())}
        ])
        self.integration.seal_distribution.queue_seal_for_distribution = MagicMock(return_value=str(uuid.uuid4()))
        self.integration.seal_distribution.distribute_seal = MagicMock(return_value={
            "distribution_id": str(uuid.uuid4()),
            "status": "distributing"
        })
        self.integration.consensus_service.create_consensus_record = MagicMock(return_value={
            "consensus_id": str(uuid.uuid4())
        })
        
        # Process execution output
        result = self.integration.process_execution_output(self.execution_output)
        
        # Verify result
        self.assertIn("verification_id", result)
        self.assertIn("seal_id", result)
        self.assertEqual(result["status"], "pending")
        
        # Verify verification request was stored
        self.assertIn(result["verification_id"], self.integration.verification_requests)
    
    def test_collect_verification_results_pending(self):
        """Test collecting verification results when still pending."""
        # Set up a verification request
        verification_id = str(uuid.uuid4())
        seal_id = str(uuid.uuid4())
        consensus_id = str(uuid.uuid4())
        
        self.integration.verification_requests[verification_id] = {
            "verification_id": verification_id,
            "seal_id": seal_id,
            "consensus_id": consensus_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "pending",
            "output": self.execution_output
        }
        
        # Mock consensus service to raise ValueError (consensus not found)
        self.integration.consensus_service.get_consensus_record = MagicMock(side_effect=ValueError("Consensus not found"))
        
        # Collect verification results
        result = self.integration.collect_verification_results(verification_id)
        
        # Verify result
        self.assertEqual(result["verification_id"], verification_id)
        self.assertEqual(result["seal_id"], seal_id)
        self.assertEqual(result["status"], "pending")
    
    def test_collect_verification_results_no_participants(self):
        """Test collecting verification results when no participants yet."""
        # Set up a verification request
        verification_id = str(uuid.uuid4())
        seal_id = str(uuid.uuid4())
        consensus_id = str(uuid.uuid4())
        
        self.integration.verification_requests[verification_id] = {
            "verification_id": verification_id,
            "seal_id": seal_id,
            "consensus_id": consensus_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "pending",
            "output": self.execution_output
        }
        
        # Mock consensus service to return empty participating_nodes
        self.integration.consensus_service.get_consensus_record = MagicMock(return_value={
            "consensus_id": consensus_id,
            "participating_nodes": []
        })
        
        # Collect verification results
        result = self.integration.collect_verification_results(verification_id)
        
        # Verify result
        self.assertEqual(result["verification_id"], verification_id)
        self.assertEqual(result["seal_id"], seal_id)
        self.assertEqual(result["status"], "pending")
        self.assertIn("No verification results received yet", result["message"])
    
    def test_collect_verification_results_complete(self):
        """Test collecting verification results when verification is complete."""
        # Set up a verification request
        verification_id = str(uuid.uuid4())
        seal_id = str(uuid.uuid4())
        consensus_id = str(uuid.uuid4())
        
        self.integration.verification_requests[verification_id] = {
            "verification_id": verification_id,
            "seal_id": seal_id,
            "consensus_id": consensus_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "pending",
            "output": self.execution_output
        }
        
        # Mock consensus service to return participating nodes
        node_id1 = str(uuid.uuid4())
        node_id2 = str(uuid.uuid4())
        
        self.integration.consensus_service.get_consensus_record = MagicMock(return_value={
            "consensus_id": consensus_id,
            "participating_nodes": [
                {
                    "node_id": node_id1,
                    "verification_result": True
                },
                {
                    "node_id": node_id2,
                    "verification_result": True
                }
            ],
            "consensus_result": True
        })
        
        # Mock node manager to return nodes
        self.integration.node_manager.get_node = MagicMock(side_effect=lambda node_id: {
            "node_id": node_id,
            "trust_score": 0.9 if node_id == node_id1 else 0.8
        })
        
        # Mock trust aggregation to return trust record
        trust_record_id = str(uuid.uuid4())
        self.integration.trust_aggregation.aggregate_verification_results = MagicMock(return_value={
            "trust_record_id": trust_record_id,
            "trust_score": 0.85
        })
        
        # Mock consensus service detect_conflicts
        self.integration.consensus_service.detect_conflicts = MagicMock(return_value=False)
        
        # Collect verification results
        result = self.integration.collect_verification_results(verification_id)
        
        # Verify result
        self.assertEqual(result["verification_id"], verification_id)
        self.assertEqual(result["seal_id"], seal_id)
        self.assertEqual(result["status"], "verified")
        self.assertEqual(result["trust_score"], 0.85)
        self.assertEqual(result["node_count"], 2)
        
        # Verify verification result was stored
        self.assertIn(verification_id, self.integration.verification_results)
    
    def test_collect_verification_results_conflict(self):
        """Test collecting verification results when there's a conflict."""
        # Set up a verification request
        verification_id = str(uuid.uuid4())
        seal_id = str(uuid.uuid4())
        consensus_id = str(uuid.uuid4())
        
        self.integration.verification_requests[verification_id] = {
            "verification_id": verification_id,
            "seal_id": seal_id,
            "consensus_id": consensus_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "pending",
            "output": self.execution_output
        }
        
        # Mock consensus service to return participating nodes with conflict
        node_id1 = str(uuid.uuid4())
        node_id2 = str(uuid.uuid4())
        
        self.integration.consensus_service.get_consensus_record = MagicMock(return_value={
            "consensus_id": consensus_id,
            "participating_nodes": [
                {
                    "node_id": node_id1,
                    "verification_result": True
                },
                {
                    "node_id": node_id2,
                    "verification_result": False
                }
            ],
            "consensus_result": False
        })
        
        # Mock node manager to return nodes
        self.integration.node_manager.get_node = MagicMock(side_effect=lambda node_id: {
            "node_id": node_id,
            "trust_score": 0.9 if node_id == node_id1 else 0.8
        })
        
        # Mock trust aggregation to return trust record
        trust_record_id = str(uuid.uuid4())
        self.integration.trust_aggregation.aggregate_verification_results = MagicMock(return_value={
            "trust_record_id": trust_record_id,
            "trust_score": 0.5
        })
        
        # Mock consensus service detect_conflicts to return True
        self.integration.consensus_service.detect_conflicts = MagicMock(return_value=True)
        
        # Collect verification results
        result = self.integration.collect_verification_results(verification_id)
        
        # Verify result
        self.assertEqual(result["verification_id"], verification_id)
        self.assertEqual(result["seal_id"], seal_id)
        self.assertEqual(result["status"], "conflict")
        self.assertEqual(result["trust_score"], 0.5)
        self.assertEqual(result["node_count"], 2)
    
    def test_get_verification_status_from_results(self):
        """Test getting verification status from results."""
        # Set up a verification result
        verification_id = str(uuid.uuid4())
        seal_id = str(uuid.uuid4())
        
        self.integration.verification_results[verification_id] = {
            "verification_id": verification_id,
            "seal_id": seal_id,
            "status": "verified",
            "trust_score": 0.9,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Get verification status
        result = self.integration.get_verification_status(verification_id)
        
        # Verify result
        self.assertEqual(result["verification_id"], verification_id)
        self.assertEqual(result["seal_id"], seal_id)
        self.assertEqual(result["status"], "verified")
        self.assertEqual(result["trust_score"], 0.9)
    
    def test_get_verification_status_from_request(self):
        """Test getting verification status from request."""
        # Set up a verification request
        verification_id = str(uuid.uuid4())
        seal_id = str(uuid.uuid4())
        consensus_id = str(uuid.uuid4())
        
        self.integration.verification_requests[verification_id] = {
            "verification_id": verification_id,
            "seal_id": seal_id,
            "consensus_id": consensus_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "pending",
            "output": self.execution_output
        }
        
        # Mock collect_verification_results
        self.integration.collect_verification_results = MagicMock(return_value={
            "verification_id": verification_id,
            "seal_id": seal_id,
            "status": "pending",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })
        
        # Get verification status
        result = self.integration.get_verification_status(verification_id)
        
        # Verify result
        self.assertEqual(result["verification_id"], verification_id)
        self.assertEqual(result["seal_id"], seal_id)
        self.assertEqual(result["status"], "pending")
    
    def test_get_verification_status_not_found(self):
        """Test getting verification status for non-existent verification."""
        # Attempt to get status for non-existent verification
        with self.assertRaises(ValueError):
            self.integration.get_verification_status(str(uuid.uuid4()))
    
    def test_get_seal_verification_status(self):
        """Test getting verification status for a seal."""
        # Set up a verification request
        verification_id = str(uuid.uuid4())
        seal_id = str(uuid.uuid4())
        
        self.integration.verification_requests[verification_id] = {
            "verification_id": verification_id,
            "seal_id": seal_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "pending",
            "output": self.execution_output
        }
        
        # Mock get_verification_status
        self.integration.get_verification_status = MagicMock(return_value={
            "verification_id": verification_id,
            "seal_id": seal_id,
            "status": "verified",
            "trust_score": 0.9
        })
        
        # Get seal verification status
        result = self.integration.get_seal_verification_status(seal_id)
        
        # Verify result
        self.assertEqual(result["verification_id"], verification_id)
        self.assertEqual(result["seal_id"], seal_id)
        self.assertEqual(result["status"], "verified")
        self.assertEqual(result["trust_score"], 0.9)
    
    def test_get_seal_verification_status_not_found(self):
        """Test getting verification status for a non-existent seal."""
        # Attempt to get status for non-existent seal
        with self.assertRaises(ValueError):
            self.integration.get_seal_verification_status(str(uuid.uuid4()))
    
    def test_initialize_verification_network(self):
        """Test initializing the verification network."""
        # Mock node manager
        self.integration.node_manager.register_node = MagicMock(side_effect=lambda node_data: node_data)
        
        # Mock topology manager
        topology_id = str(uuid.uuid4())
        self.integration.topology_manager.create_topology = MagicMock(return_value={
            "topology_id": topology_id
        })
        
        # Initialize network
        result = self.integration.initialize_verification_network(node_count=3)
        
        # Verify result
        self.assertEqual(result["status"], "initialized")
        self.assertEqual(result["node_count"], 3)
        self.assertEqual(result["topology_id"], topology_id)
    
    def test_get_network_status_not_initialized(self):
        """Test getting network status when not initialized."""
        # Mock topology manager to return None
        self.integration.topology_manager.get_current_topology = MagicMock(return_value=None)
        
        # Get network status
        result = self.integration.get_network_status()
        
        # Verify result
        self.assertEqual(result["status"], "not_initialized")
    
    def test_get_network_status_active(self):
        """Test getting network status when active."""
        # Mock topology manager
        topology_id = str(uuid.uuid4())
        self.integration.topology_manager.get_current_topology = MagicMock(return_value={
            "topology_id": topology_id,
            "nodes": [{"node_id": str(uuid.uuid4())} for _ in range(3)]
        })
        
        # Mock node manager
        self.integration.node_manager.get_active_nodes = MagicMock(return_value=[
            {"node_id": str(uuid.uuid4())} for _ in range(2)
        ])
        
        # Set up verification requests and results
        verification_id1 = str(uuid.uuid4())
        verification_id2 = str(uuid.uuid4())
        verification_id3 = str(uuid.uuid4())
        
        self.integration.verification_results[verification_id1] = {
            "status": "verified"
        }
        self.integration.verification_results[verification_id2] = {
            "status": "conflict"
        }
        self.integration.verification_results[verification_id3] = {
            "status": "pending"
        }
        
        self.integration.verification_requests = {
            verification_id1: {},
            verification_id2: {},
            verification_id3: {}
        }
        
        # Get network status
        result = self.integration.get_network_status()
        
        # Verify result
        self.assertEqual(result["status"], "active")
        self.assertEqual(result["topology_id"], topology_id)
        self.assertEqual(result["node_count"], 3)
        self.assertEqual(result["active_node_count"], 2)
        self.assertEqual(result["verification_count"], 3)
        self.assertEqual(result["verified_count"], 1)
        self.assertEqual(result["conflict_count"], 1)
    
    def test_prepare_trust_data_for_ui(self):
        """Test preparing trust data for UI visualization."""
        # Set up seal ID
        seal_id = str(uuid.uuid4())
        
        # Mock trust aggregation
        self.integration.trust_aggregation.get_trust_summary = MagicMock(return_value={
            "seal_id": seal_id,
            "trust_score": 0.9,
            "verification_count": 2
        })
        
        # Mock consensus service
        consensus_id = str(uuid.uuid4())
        self.integration.consensus_service.get_consensus_by_seal = MagicMock(return_value=[
            {
                "consensus_id": consensus_id,
                "participating_nodes": [
                    {
                        "node_id": str(uuid.uuid4()),
                        "verification_result": True
                    }
                ]
            }
        ])
        
        # Mock seal distribution
        self.integration.seal_distribution.get_seal_distribution_history = MagicMock(return_value=[
            {
                "distribution_id": str(uuid.uuid4()),
                "status": "distributed"
            }
        ])
        
        # Mock node manager
        self.integration.node_manager.get_node = MagicMock(return_value={
            "role": "verifier",
            "status": "active",
            "trust_score": 0.9
        })
        
        # Prepare trust data
        result = self.integration.prepare_trust_data_for_ui(seal_id)
        
        # Verify result
        self.assertEqual(result["seal_id"], seal_id)
        self.assertIn("trust_summary", result)
        self.assertIn("consensus_records", result)
        self.assertIn("distribution_history", result)
        self.assertIn("node_data", result)
    
    def test_pre_loop_tether_check(self):
        """Test pre-loop tether check."""
        # Valid contract and phase
        self.assertTrue(pre_loop_tether_check("v2025.05.18", "5.4"))
        
        # Invalid contract
        self.assertFalse(pre_loop_tether_check("v2025.05.17", "5.4"))
        
        # Invalid phase
        self.assertFalse(pre_loop_tether_check("v2025.05.18", "5.3"))


class TestAPIEndpoints(unittest.TestCase):
    """Test cases for API endpoints."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Mock Flask app
        self.app = MagicMock()
        self.app.route = MagicMock()
        
        # Mock DistributedVerificationIntegration
        self.integration = MagicMock()
        
        # Import create_api_endpoints function
        from src.integration.distributed_verification_integration import create_api_endpoints
        self.create_api_endpoints = create_api_endpoints
    
    def test_create_api_endpoints(self):
        """Test creating API endpoints."""
        # Create API endpoints
        self.create_api_endpoints(self.app, self.integration)
        
        # Verify routes were created
        self.assertEqual(self.app.route.call_count, 5)
        
        # Verify route paths
        route_paths = [call.args[0] for call in self.app.route.call_args_list]
        self.assertIn('/api/verification/network/status', route_paths)
        self.assertIn('/api/verification/seal/<seal_id>', route_paths)
        self.assertIn('/api/verification/trust/<seal_id>', route_paths)
        self.assertIn('/api/verification/nodes', route_paths)
        self.assertIn('/api/verification/topology', route_paths)


if __name__ == '__main__':
    unittest.main()
