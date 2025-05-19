"""
Unit tests for NetworkTopologyManager.

This module tests the NetworkTopologyManager component of Phase 5.4.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import unittest
import uuid
import json
from datetime import datetime
from unittest.mock import patch, MagicMock

from network_topology_manager import NetworkTopologyManager, pre_loop_tether_check


class TestNetworkTopologyManager(unittest.TestCase):
    """Test cases for NetworkTopologyManager."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.topology_manager = NetworkTopologyManager()
        
        # Create valid nodes for testing
        self.node1 = {
            "node_id": str(uuid.uuid4()),
            "public_key": "BASE64_ENCODED_PUBLIC_KEY_1",
            "status": "active",
            "capabilities": ["merkle_verification", "consensus_participation"],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "contract_version": "v2025.05.18",
            "phase_id": "5.4",
            "network_address": "https://node1.verification.network",
            "trust_score": 0.8,
            "metadata": {
                "version": "1.0.0",
                "region": "region-1"
            },
            "codex_clauses": ["5.4", "11.0"],
            "role": "coordinator"
        }
        
        self.node2 = {
            "node_id": str(uuid.uuid4()),
            "public_key": "BASE64_ENCODED_PUBLIC_KEY_2",
            "status": "active",
            "capabilities": ["merkle_verification", "consensus_participation"],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "contract_version": "v2025.05.18",
            "phase_id": "5.4",
            "network_address": "https://node2.verification.network",
            "trust_score": 0.8,
            "metadata": {
                "version": "1.0.0",
                "region": "region-2"
            },
            "codex_clauses": ["5.4", "11.0"],
            "role": "verifier"
        }
        
        self.node3 = {
            "node_id": str(uuid.uuid4()),
            "public_key": "BASE64_ENCODED_PUBLIC_KEY_3",
            "status": "active",
            "capabilities": ["merkle_verification", "consensus_participation"],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "contract_version": "v2025.05.18",
            "phase_id": "5.4",
            "network_address": "https://node3.verification.network",
            "trust_score": 0.8,
            "metadata": {
                "version": "1.0.0",
                "region": "region-3"
            },
            "codex_clauses": ["5.4", "11.0"],
            "role": "verifier"
        }
        
        self.nodes = [self.node1, self.node2, self.node3]
    
    @patch('network_topology_manager.validate_against_schema')
    def test_create_topology(self, mock_validate):
        """Test creating a network topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        result = self.topology_manager.create_topology(self.nodes)
        
        # Verify result
        self.assertIn("topology_id", result)
        self.assertEqual(len(result["nodes"]), 3)
        self.assertGreater(len(result["connections"]), 0)
        self.assertEqual(result["contract_version"], "v2025.05.18")
        self.assertEqual(result["phase_id"], "5.4")
        self.assertIn("5.4", result["codex_clauses"])
        self.assertIn("11.0", result["codex_clauses"])
        self.assertIn("topology_hash", result)
        self.assertIn("optimization_metrics", result)
        
        # Verify topology was stored
        self.assertIn(result["topology_id"], self.topology_manager.topologies)
        self.assertEqual(self.topology_manager.current_topology_id, result["topology_id"])
    
    @patch('network_topology_manager.validate_against_schema')
    def test_create_topology_validation_failure(self, mock_validate):
        """Test creating a topology with validation failure."""
        # Mock validation to return failure
        mock_validate.return_value = (False, "Invalid network topology")
        
        # Attempt to create topology
        with self.assertRaises(ValueError):
            self.topology_manager.create_topology(self.nodes)
    
    @patch('network_topology_manager.validate_against_schema')
    def test_get_topology(self, mock_validate):
        """Test getting a topology by ID."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Get topology
        result = self.topology_manager.get_topology(topology_id)
        
        # Verify result
        self.assertEqual(result["topology_id"], topology_id)
        self.assertEqual(len(result["nodes"]), 3)
    
    @patch('network_topology_manager.validate_against_schema')
    def test_get_topology_not_found(self, mock_validate):
        """Test getting a non-existent topology."""
        # Attempt to get non-existent topology
        with self.assertRaises(ValueError):
            self.topology_manager.get_topology(str(uuid.uuid4()))
    
    @patch('network_topology_manager.validate_against_schema')
    def test_get_current_topology(self, mock_validate):
        """Test getting the current topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        
        # Get current topology
        result = self.topology_manager.get_current_topology()
        
        # Verify result
        self.assertEqual(result["topology_id"], topology["topology_id"])
    
    @patch('network_topology_manager.validate_against_schema')
    def test_get_current_topology_none(self, mock_validate):
        """Test getting the current topology when none exists."""
        # Get current topology without creating one
        result = self.topology_manager.get_current_topology()
        
        # Verify result
        self.assertIsNone(result)
    
    @patch('network_topology_manager.validate_against_schema')
    def test_add_node_to_topology(self, mock_validate):
        """Test adding a node to a topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology with two nodes
        topology = self.topology_manager.create_topology([self.node1, self.node2])
        topology_id = topology["topology_id"]
        
        # Add third node
        result = self.topology_manager.add_node_to_topology(topology_id, self.node3)
        
        # Verify result
        self.assertEqual(result["topology_id"], topology_id)
        self.assertEqual(len(result["nodes"]), 3)
        self.assertIn(self.node3["node_id"], [node["node_id"] for node in result["nodes"]])
        
        # Verify connections were added
        node3_connections = [
            conn for conn in result["connections"]
            if conn["source_node_id"] == self.node3["node_id"] or conn["target_node_id"] == self.node3["node_id"]
        ]
        self.assertGreater(len(node3_connections), 0)
    
    @patch('network_topology_manager.validate_against_schema')
    def test_add_node_to_topology_invalid_topology(self, mock_validate):
        """Test adding a node to an invalid topology."""
        # Attempt to add node to non-existent topology
        with self.assertRaises(ValueError):
            self.topology_manager.add_node_to_topology(str(uuid.uuid4()), self.node1)
    
    @patch('network_topology_manager.validate_against_schema')
    def test_add_duplicate_node_to_topology(self, mock_validate):
        """Test adding a duplicate node to a topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology([self.node1, self.node2])
        topology_id = topology["topology_id"]
        
        # Attempt to add duplicate node
        with self.assertRaises(ValueError):
            self.topology_manager.add_node_to_topology(topology_id, self.node1)
    
    @patch('network_topology_manager.validate_against_schema')
    def test_remove_node_from_topology(self, mock_validate):
        """Test removing a node from a topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Remove node
        result = self.topology_manager.remove_node_from_topology(topology_id, self.node3["node_id"])
        
        # Verify result
        self.assertEqual(result["topology_id"], topology_id)
        self.assertEqual(len(result["nodes"]), 2)
        self.assertNotIn(self.node3["node_id"], [node["node_id"] for node in result["nodes"]])
        
        # Verify connections were removed
        node3_connections = [
            conn for conn in result["connections"]
            if conn["source_node_id"] == self.node3["node_id"] or conn["target_node_id"] == self.node3["node_id"]
        ]
        self.assertEqual(len(node3_connections), 0)
    
    @patch('network_topology_manager.validate_against_schema')
    def test_remove_node_from_topology_invalid_topology(self, mock_validate):
        """Test removing a node from an invalid topology."""
        # Attempt to remove node from non-existent topology
        with self.assertRaises(ValueError):
            self.topology_manager.remove_node_from_topology(str(uuid.uuid4()), self.node1["node_id"])
    
    @patch('network_topology_manager.validate_against_schema')
    def test_remove_node_from_topology_invalid_node(self, mock_validate):
        """Test removing an invalid node from a topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Attempt to remove non-existent node
        with self.assertRaises(ValueError):
            self.topology_manager.remove_node_from_topology(topology_id, str(uuid.uuid4()))
    
    @patch('network_topology_manager.validate_against_schema')
    def test_update_node_role(self, mock_validate):
        """Test updating a node's role in a topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Update node role
        result = self.topology_manager.update_node_role(topology_id, self.node2["node_id"], "coordinator")
        
        # Verify result
        self.assertEqual(result["topology_id"], topology_id)
        
        # Find updated node
        updated_node = None
        for node in result["nodes"]:
            if node["node_id"] == self.node2["node_id"]:
                updated_node = node
                break
        
        self.assertIsNotNone(updated_node)
        self.assertEqual(updated_node["role"], "coordinator")
        
        # Verify connections were updated
        node2_connections = [
            conn for conn in result["connections"]
            if conn["source_node_id"] == self.node2["node_id"]
        ]
        self.assertGreater(len(node2_connections), 0)
    
    @patch('network_topology_manager.validate_against_schema')
    def test_update_node_role_invalid_topology(self, mock_validate):
        """Test updating a node's role in an invalid topology."""
        # Attempt to update role in non-existent topology
        with self.assertRaises(ValueError):
            self.topology_manager.update_node_role(str(uuid.uuid4()), self.node1["node_id"], "verifier")
    
    @patch('network_topology_manager.validate_against_schema')
    def test_update_node_role_invalid_node(self, mock_validate):
        """Test updating an invalid node's role in a topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Attempt to update non-existent node
        with self.assertRaises(ValueError):
            self.topology_manager.update_node_role(topology_id, str(uuid.uuid4()), "verifier")
    
    @patch('network_topology_manager.validate_against_schema')
    def test_update_node_role_invalid_role(self, mock_validate):
        """Test updating a node's role with an invalid role."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Attempt to update with invalid role
        with self.assertRaises(ValueError):
            self.topology_manager.update_node_role(topology_id, self.node2["node_id"], "invalid_role")
    
    @patch('network_topology_manager.validate_against_schema')
    def test_optimize_topology(self, mock_validate):
        """Test optimizing a topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Optimize topology
        result = self.topology_manager.optimize_topology(topology_id)
        
        # Verify result
        self.assertNotEqual(result["topology_id"], topology_id)
        self.assertEqual(len(result["nodes"]), 3)
        self.assertGreater(len(result["connections"]), 0)
        self.assertEqual(result["previous_topology_id"], topology_id)
        
        # Verify new topology was stored
        self.assertIn(result["topology_id"], self.topology_manager.topologies)
        self.assertEqual(self.topology_manager.current_topology_id, result["topology_id"])
    
    @patch('network_topology_manager.validate_against_schema')
    def test_optimize_topology_invalid_topology(self, mock_validate):
        """Test optimizing an invalid topology."""
        # Attempt to optimize non-existent topology
        with self.assertRaises(ValueError):
            self.topology_manager.optimize_topology(str(uuid.uuid4()))
    
    @patch('network_topology_manager.validate_against_schema')
    def test_verify_topology_integrity(self, mock_validate):
        """Test verifying topology integrity."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Verify integrity
        result = self.topology_manager.verify_topology_integrity(topology_id)
        
        # Verify result
        self.assertTrue(result)
    
    @patch('network_topology_manager.validate_against_schema')
    def test_verify_topology_integrity_invalid_topology(self, mock_validate):
        """Test verifying integrity of an invalid topology."""
        # Attempt to verify non-existent topology
        with self.assertRaises(ValueError):
            self.topology_manager.verify_topology_integrity(str(uuid.uuid4()))
    
    @patch('network_topology_manager.validate_against_schema')
    def test_get_node_connections(self, mock_validate):
        """Test getting connections for a node in a topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Get node connections
        result = self.topology_manager.get_node_connections(topology_id, self.node1["node_id"])
        
        # Verify result
        self.assertGreater(len(result), 0)
        for conn in result:
            self.assertTrue(
                conn["source_node_id"] == self.node1["node_id"] or
                conn["target_node_id"] == self.node1["node_id"]
            )
    
    @patch('network_topology_manager.validate_against_schema')
    def test_get_node_connections_invalid_topology(self, mock_validate):
        """Test getting connections for a node in an invalid topology."""
        # Attempt to get connections in non-existent topology
        with self.assertRaises(ValueError):
            self.topology_manager.get_node_connections(str(uuid.uuid4()), self.node1["node_id"])
    
    @patch('network_topology_manager.validate_against_schema')
    def test_get_node_connections_invalid_node(self, mock_validate):
        """Test getting connections for an invalid node in a topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Attempt to get connections for non-existent node
        with self.assertRaises(ValueError):
            self.topology_manager.get_node_connections(topology_id, str(uuid.uuid4()))
    
    @patch('network_topology_manager.validate_against_schema')
    def test_get_topology_history(self, mock_validate):
        """Test getting topology history."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create multiple topologies
        topology1 = self.topology_manager.create_topology([self.node1, self.node2])
        topology2 = self.topology_manager.optimize_topology(topology1["topology_id"])
        
        # Get topology history
        result = self.topology_manager.get_topology_history()
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["topology_id"], topology2["topology_id"])
        self.assertEqual(result[1]["topology_id"], topology1["topology_id"])
    
    def test_calculate_topology_hash(self):
        """Test calculating topology hash."""
        # Create a topology dictionary
        topology = {
            "topology_id": str(uuid.uuid4()),
            "nodes": self.nodes,
            "connections": [
                {
                    "source_node_id": self.node1["node_id"],
                    "target_node_id": self.node2["node_id"],
                    "connection_type": "direct",
                    "latency": 50
                }
            ],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Calculate hash
        result = self.topology_manager._calculate_topology_hash(topology)
        
        # Verify result
        self.assertIsInstance(result, str)
        self.assertEqual(len(result), 64)  # SHA-256 hash length
    
    def test_calculate_optimization_metrics(self):
        """Test calculating optimization metrics."""
        # Create a topology dictionary
        topology = {
            "topology_id": str(uuid.uuid4()),
            "nodes": self.nodes,
            "connections": [
                {
                    "source_node_id": self.node1["node_id"],
                    "target_node_id": self.node2["node_id"],
                    "connection_type": "direct",
                    "latency": 50
                },
                {
                    "source_node_id": self.node1["node_id"],
                    "target_node_id": self.node3["node_id"],
                    "connection_type": "direct",
                    "latency": 100
                }
            ],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Calculate metrics
        result = self.topology_manager._calculate_optimization_metrics(topology)
        
        # Verify result
        self.assertIn("average_latency", result)
        self.assertIn("connectivity_score", result)
        self.assertIn("resilience_score", result)
        self.assertEqual(result["average_latency"], 75.0)  # (50 + 100) / 2
    
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
