"""
Unit tests for NetworkTopologyManager.

This module tests the NetworkTopologyManager component of Phase 5.4.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import unittest
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock
import pytest

from src.core.verification.network_topology_manager import NetworkTopologyManager, pre_loop_tether_check

@pytest.mark.phase_5_4
class TestNetworkTopologyManager(unittest.TestCase):
    """Test cases for NetworkTopologyManager."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.topology_manager = NetworkTopologyManager()
        
        # Create valid nodes for testing
        self.node1 = {
            "node_id": str(uuid.uuid4()),
            "node_type": "validator",
            "public_key": "BASE64_ENCODED_PUBLIC_KEY_1",
            "network_address": "node1.example.com:8080",
            "region": "us-west",
            "capabilities": ["seal_verification", "consensus_participation"],
            "status": "active",
            "trust_score": 0.95,
            "registration_time": datetime.utcnow().isoformat() + "Z"
        }
        
        self.node2 = {
            "node_id": str(uuid.uuid4()),
            "node_type": "validator",
            "public_key": "BASE64_ENCODED_PUBLIC_KEY_2",
            "network_address": "node2.example.com:8080",
            "region": "us-east",
            "capabilities": ["seal_verification", "consensus_participation"],
            "status": "active",
            "trust_score": 0.92,
            "registration_time": datetime.utcnow().isoformat() + "Z"
        }
        
        self.node3 = {
            "node_id": str(uuid.uuid4()),
            "node_type": "observer",
            "public_key": "BASE64_ENCODED_PUBLIC_KEY_3",
            "network_address": "node3.example.com:8080",
            "region": "eu-west",
            "capabilities": ["seal_verification"],
            "status": "active",
            "trust_score": 0.88,
            "registration_time": datetime.utcnow().isoformat() + "Z"
        }
        
        self.nodes = [self.node1, self.node2, self.node3]
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_create_topology(self, mock_validate):
        """Test creating a network topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        result = self.topology_manager.create_topology(self.nodes)
        
        # Verify result
        self.assertIn("topology_id", result)
        self.assertEqual(len(result["nodes"]), 3)
        self.assertIn("connections", result)
        self.assertGreater(len(result["connections"]), 0)
        self.assertEqual(result["contract_version"], "v2025.05.18")
        self.assertEqual(result["phase_id"], "5.4")
        self.assertIn("5.4", result["codex_clauses"])
        self.assertIn("11.0", result["codex_clauses"])
        
        # Verify topology was stored
        self.assertIn(result["topology_id"], self.topology_manager.topologies)
        self.assertEqual(self.topology_manager.current_topology_id, result["topology_id"])
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_create_topology_validation_failure(self, mock_validate):
        """Test creating a topology with validation failure."""
        # Mock validation to return failure
        mock_validate.return_value = (False, "Invalid network topology")
        
        # Attempt to create topology
        with self.assertRaises(ValueError):
            self.topology_manager.create_topology(self.nodes)
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
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
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_get_topology_not_found(self, mock_validate):
        """Test getting a non-existent topology."""
        # Attempt to get non-existent topology
        with self.assertRaises(ValueError):
            self.topology_manager.get_topology(str(uuid.uuid4()))
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
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
        self.assertEqual(len(result["nodes"]), 3)
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_get_current_topology_none(self, mock_validate):
        """Test getting the current topology when none exists."""
        # Attempt to get current topology when none exists
        with self.assertRaises(ValueError):
            self.topology_manager.get_current_topology()
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_get_all_topologies(self, mock_validate):
        """Test getting all topologies."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create multiple topologies
        topology1 = self.topology_manager.create_topology(self.nodes)
        topology2 = self.topology_manager.create_topology(self.nodes)
        
        # Get all topologies
        result = self.topology_manager.get_all_topologies()
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(topology1["topology_id"], [t["topology_id"] for t in result])
        self.assertIn(topology2["topology_id"], [t["topology_id"] for t in result])
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_add_node(self, mock_validate):
        """Test adding a node to the current topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology([self.node1, self.node2])
        topology_id = topology["topology_id"]
        
        # Add node
        result = self.topology_manager.add_node(self.node3)
        
        # Verify result
        self.assertEqual(result["topology_id"], topology_id)
        self.assertEqual(len(result["nodes"]), 3)
        self.assertIn(self.node3["node_id"], [n["node_id"] for n in result["nodes"]])
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_add_node_no_current_topology(self, mock_validate):
        """Test adding a node when no current topology exists."""
        # Attempt to add node when no current topology exists
        with self.assertRaises(ValueError):
            self.topology_manager.add_node(self.node1)
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_remove_node(self, mock_validate):
        """Test removing a node from the current topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Remove node
        result = self.topology_manager.remove_node(self.node3["node_id"])
        
        # Verify result
        self.assertEqual(result["topology_id"], topology_id)
        self.assertEqual(len(result["nodes"]), 2)
        self.assertNotIn(self.node3["node_id"], [n["node_id"] for n in result["nodes"]])
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_remove_node_not_found(self, mock_validate):
        """Test removing a non-existent node."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        self.topology_manager.create_topology(self.nodes)
        
        # Attempt to remove non-existent node
        with self.assertRaises(ValueError):
            self.topology_manager.remove_node(str(uuid.uuid4()))
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_update_node(self, mock_validate):
        """Test updating a node in the current topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        topology = self.topology_manager.create_topology(self.nodes)
        topology_id = topology["topology_id"]
        
        # Update node
        updated_node = self.node1.copy()
        updated_node["trust_score"] = 0.75
        updated_node["status"] = "degraded"
        
        result = self.topology_manager.update_node(updated_node)
        
        # Verify result
        self.assertEqual(result["topology_id"], topology_id)
        
        # Find the updated node
        updated_node_in_result = None
        for node in result["nodes"]:
            if node["node_id"] == updated_node["node_id"]:
                updated_node_in_result = node
                break
        
        self.assertIsNotNone(updated_node_in_result)
        self.assertEqual(updated_node_in_result["trust_score"], 0.75)
        self.assertEqual(updated_node_in_result["status"], "degraded")
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_update_node_not_found(self, mock_validate):
        """Test updating a non-existent node."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        self.topology_manager.create_topology(self.nodes)
        
        # Attempt to update non-existent node
        non_existent_node = {
            "node_id": str(uuid.uuid4()),
            "node_type": "validator",
            "status": "active"
        }
        
        with self.assertRaises(ValueError):
            self.topology_manager.update_node(non_existent_node)
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_get_node(self, mock_validate):
        """Test getting a node from the current topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        self.topology_manager.create_topology(self.nodes)
        
        # Get node
        result = self.topology_manager.get_node(self.node1["node_id"])
        
        # Verify result
        self.assertEqual(result["node_id"], self.node1["node_id"])
        self.assertEqual(result["node_type"], self.node1["node_type"])
        self.assertEqual(result["public_key"], self.node1["public_key"])
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_get_node_not_found(self, mock_validate):
        """Test getting a non-existent node."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        self.topology_manager.create_topology(self.nodes)
        
        # Attempt to get non-existent node
        with self.assertRaises(ValueError):
            self.topology_manager.get_node(str(uuid.uuid4()))
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_get_all_nodes(self, mock_validate):
        """Test getting all nodes from the current topology."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        self.topology_manager.create_topology(self.nodes)
        
        # Get all nodes
        result = self.topology_manager.get_all_nodes()
        
        # Verify result
        self.assertEqual(len(result), 3)
        self.assertIn(self.node1["node_id"], [n["node_id"] for n in result])
        self.assertIn(self.node2["node_id"], [n["node_id"] for n in result])
        self.assertIn(self.node3["node_id"], [n["node_id"] for n in result])
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_get_nodes_by_type(self, mock_validate):
        """Test getting nodes by type."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        self.topology_manager.create_topology(self.nodes)
        
        # Get nodes by type
        result = self.topology_manager.get_nodes_by_type("validator")
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(self.node1["node_id"], [n["node_id"] for n in result])
        self.assertIn(self.node2["node_id"], [n["node_id"] for n in result])
        self.assertNotIn(self.node3["node_id"], [n["node_id"] for n in result])
    
    @patch('src.core.verification.network_topology_manager.validate_against_schema')
    def test_get_nodes_by_capability(self, mock_validate):
        """Test getting nodes by capability."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Create topology
        self.topology_manager.create_topology(self.nodes)
        
        # Get nodes by capability
        result = self.topology_manager.get_nodes_by_capability("consensus_participation")
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(self.node1["node_id"], [n["node_id"] for n in result])
        self.assertIn(self.node2["node_id"], [n["node_id"] for n in result])
        self.assertNotIn(self.node3["node_id"], [n["node_id"] for n in result])
