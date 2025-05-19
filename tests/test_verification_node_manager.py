"""
Unit tests for VerificationNodeManager.

This module tests the VerificationNodeManager component of Phase 5.4.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import unittest
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

from verification_node_manager import VerificationNodeManager, NodeDiscoveryService, HealthMonitor, pre_loop_tether_check


class TestVerificationNodeManager(unittest.TestCase):
    """Test cases for VerificationNodeManager."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.node_manager = VerificationNodeManager()
        
        # Create a valid node for testing
        self.valid_node = {
            "node_id": str(uuid.uuid4()),
            "public_key": "BASE64_ENCODED_PUBLIC_KEY",
            "status": "active",
            "capabilities": ["merkle_verification", "consensus_participation"],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "contract_version": "v2025.05.18",
            "phase_id": "5.4",
            "network_address": "https://node.verification.network",
            "trust_score": 0.8,
            "metadata": {
                "version": "1.0.0",
                "region": "region-1"
            },
            "codex_clauses": ["5.4", "11.0"]
        }
    
    @patch('verification_node_manager.validate_against_schema')
    def test_register_node(self, mock_validate):
        """Test registering a verification node."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Register node
        result = self.node_manager.register_node(self.valid_node)
        
        # Verify result
        self.assertEqual(result["node_id"], self.valid_node["node_id"])
        self.assertEqual(result["status"], "active")
        self.assertEqual(result["contract_version"], "v2025.05.18")
        self.assertEqual(result["phase_id"], "5.4")
        
        # Verify node was added to manager
        self.assertIn(self.valid_node["node_id"], self.node_manager.nodes)
    
    @patch('verification_node_manager.validate_against_schema')
    def test_register_node_validation_failure(self, mock_validate):
        """Test registering a node with validation failure."""
        # Mock validation to return failure
        mock_validate.return_value = (False, "Invalid node data")
        
        # Attempt to register node
        with self.assertRaises(ValueError):
            self.node_manager.register_node(self.valid_node)
    
    @patch('verification_node_manager.validate_against_schema')
    def test_register_duplicate_node(self, mock_validate):
        """Test registering a duplicate node."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Register node
        self.node_manager.register_node(self.valid_node)
        
        # Attempt to register again
        with self.assertRaises(ValueError):
            self.node_manager.register_node(self.valid_node)
    
    @patch('verification_node_manager.validate_against_schema')
    def test_update_node_status(self, mock_validate):
        """Test updating node status."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Register node
        self.node_manager.register_node(self.valid_node)
        
        # Update status
        result = self.node_manager.update_node_status(self.valid_node["node_id"], "inactive")
        
        # Verify result
        self.assertEqual(result["status"], "inactive")
    
    @patch('verification_node_manager.validate_against_schema')
    def test_update_node_status_invalid(self, mock_validate):
        """Test updating node status with invalid status."""
        # Mock validation to return success for registration
        mock_validate.return_value = (True, None)
        
        # Register node
        self.node_manager.register_node(self.valid_node)
        
        # Attempt to update with invalid status
        with self.assertRaises(ValueError):
            self.node_manager.update_node_status(self.valid_node["node_id"], "invalid_status")
    
    @patch('verification_node_manager.validate_against_schema')
    def test_get_node(self, mock_validate):
        """Test getting a node by ID."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Register node
        self.node_manager.register_node(self.valid_node)
        
        # Get node
        result = self.node_manager.get_node(self.valid_node["node_id"])
        
        # Verify result
        self.assertEqual(result["node_id"], self.valid_node["node_id"])
    
    @patch('verification_node_manager.validate_against_schema')
    def test_get_node_not_found(self, mock_validate):
        """Test getting a non-existent node."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Attempt to get non-existent node
        with self.assertRaises(ValueError):
            self.node_manager.get_node(str(uuid.uuid4()))
    
    @patch('verification_node_manager.validate_against_schema')
    def test_get_all_nodes(self, mock_validate):
        """Test getting all nodes."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Register multiple nodes
        node1 = self.valid_node.copy()
        node1["node_id"] = str(uuid.uuid4())
        
        node2 = self.valid_node.copy()
        node2["node_id"] = str(uuid.uuid4())
        
        self.node_manager.register_node(node1)
        self.node_manager.register_node(node2)
        
        # Get all nodes
        result = self.node_manager.get_all_nodes()
        
        # Verify result
        self.assertEqual(len(result), 2)
        self.assertIn(node1["node_id"], [node["node_id"] for node in result])
        self.assertIn(node2["node_id"], [node["node_id"] for node in result])
    
    @patch('verification_node_manager.validate_against_schema')
    def test_get_active_nodes(self, mock_validate):
        """Test getting active nodes."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Register active and inactive nodes
        node1 = self.valid_node.copy()
        node1["node_id"] = str(uuid.uuid4())
        node1["status"] = "active"
        
        node2 = self.valid_node.copy()
        node2["node_id"] = str(uuid.uuid4())
        node2["status"] = "inactive"
        
        self.node_manager.register_node(node1)
        self.node_manager.register_node(node2)
        
        # Get active nodes
        result = self.node_manager.get_active_nodes()
        
        # Verify result
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["node_id"], node1["node_id"])
    
    @patch('verification_node_manager.validate_against_schema')
    def test_remove_node(self, mock_validate):
        """Test removing a node."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Register node
        self.node_manager.register_node(self.valid_node)
        
        # Remove node
        result = self.node_manager.remove_node(self.valid_node["node_id"])
        
        # Verify result
        self.assertTrue(result)
        
        # Verify node was removed
        with self.assertRaises(ValueError):
            self.node_manager.get_node(self.valid_node["node_id"])
    
    @patch('verification_node_manager.validate_against_schema')
    def test_calculate_node_trust_score(self, mock_validate):
        """Test calculating node trust score."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Register node
        self.node_manager.register_node(self.valid_node)
        
        # Mock health monitor
        self.node_manager.health_monitor.get_node_health = MagicMock(return_value={
            "health_status": "healthy"
        })
        
        # Calculate trust score
        result = self.node_manager.calculate_node_trust_score(self.valid_node["node_id"])
        
        # Verify result
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    @patch('verification_node_manager.validate_against_schema')
    def test_update_node_trust_score(self, mock_validate):
        """Test updating node trust score."""
        # Mock validation to return success
        mock_validate.return_value = (True, None)
        
        # Register node
        self.node_manager.register_node(self.valid_node)
        
        # Mock health monitor and calculate_node_trust_score
        self.node_manager.health_monitor.get_node_health = MagicMock(return_value={
            "health_status": "healthy"
        })
        self.node_manager.calculate_node_trust_score = MagicMock(return_value=0.9)
        
        # Update trust score
        result = self.node_manager.update_node_trust_score(self.valid_node["node_id"])
        
        # Verify result
        self.assertEqual(result["trust_score"], 0.9)
    
    def test_pre_loop_tether_check(self):
        """Test pre-loop tether check."""
        # Valid contract and phase
        self.assertTrue(pre_loop_tether_check("v2025.05.18", "5.4"))
        
        # Invalid contract
        self.assertFalse(pre_loop_tether_check("v2025.05.17", "5.4"))
        
        # Invalid phase
        self.assertFalse(pre_loop_tether_check("v2025.05.18", "5.3"))


class TestNodeDiscoveryService(unittest.TestCase):
    """Test cases for NodeDiscoveryService."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.discovery_service = NodeDiscoveryService()
    
    def test_discover_nodes(self):
        """Test discovering nodes."""
        # Discover nodes
        result = self.discovery_service.discover_nodes()
        
        # Verify result
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
        
        # Verify node structure
        for node in result:
            self.assertIn("node_id", node)
            self.assertIn("public_key", node)
            self.assertIn("status", node)
            self.assertIn("capabilities", node)
    
    def test_discover_nodes_invalid_method(self):
        """Test discovering nodes with invalid method."""
        # Attempt to discover with invalid method
        with self.assertRaises(ValueError):
            self.discovery_service.discover_nodes("invalid_method")
    
    def test_register_with_discovery_service(self):
        """Test registering with discovery service."""
        # Register node
        result = self.discovery_service.register_with_discovery_service({
            "node_id": str(uuid.uuid4()),
            "public_key": "BASE64_ENCODED_PUBLIC_KEY"
        })
        
        # Verify result
        self.assertTrue(result)


class TestHealthMonitor(unittest.TestCase):
    """Test cases for HealthMonitor."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.health_monitor = HealthMonitor()
        
        # Create a valid node for testing
        self.valid_node = {
            "node_id": str(uuid.uuid4()),
            "public_key": "BASE64_ENCODED_PUBLIC_KEY",
            "status": "active"
        }
    
    def test_monitor_node(self):
        """Test monitoring a node."""
        # Monitor node
        self.health_monitor.monitor_node(self.valid_node["node_id"], self.valid_node)
        
        # Verify node is monitored
        self.assertIn(self.valid_node["node_id"], self.health_monitor.monitored_nodes)
    
    def test_check_node_health(self):
        """Test checking node health."""
        # Monitor node
        self.health_monitor.monitor_node(self.valid_node["node_id"], self.valid_node)
        
        # Check health
        result = self.health_monitor.check_node_health(self.valid_node["node_id"])
        
        # Verify result
        self.assertIsInstance(result, dict)
        for check in self.health_monitor.health_checks:
            self.assertIn(check, result)
            self.assertEqual(result[check]["status"], "passed")
    
    def test_check_node_health_not_monitored(self):
        """Test checking health of non-monitored node."""
        # Attempt to check health of non-monitored node
        with self.assertRaises(ValueError):
            self.health_monitor.check_node_health(str(uuid.uuid4()))
    
    def test_get_node_health(self):
        """Test getting node health."""
        # Monitor node
        self.health_monitor.monitor_node(self.valid_node["node_id"], self.valid_node)
        
        # Check health first to populate history
        self.health_monitor.check_node_health(self.valid_node["node_id"])
        
        # Get health
        result = self.health_monitor.get_node_health(self.valid_node["node_id"])
        
        # Verify result
        self.assertIsInstance(result, dict)
        self.assertEqual(result["node_id"], self.valid_node["node_id"])
        self.assertIn("health_status", result)
        self.assertIn("last_check", result)
        self.assertIn("check_history", result)
    
    def test_get_node_health_not_monitored(self):
        """Test getting health of non-monitored node."""
        # Attempt to get health of non-monitored node
        with self.assertRaises(ValueError):
            self.health_monitor.get_node_health(str(uuid.uuid4()))


if __name__ == '__main__':
    unittest.main()
