"""
Test suite for Governance Mesh Integration component of Phase 5.5.

This module contains comprehensive tests for the governance_mesh_integration.py
implementation, ensuring proper integration of governance mesh with existing verification network.

This component implements Phase 5.5 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.5
Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import unittest
import json
import uuid
import os
import sys
from datetime import datetime
from unittest.mock import patch, MagicMock

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from governance_mesh_integration import GovernanceMeshIntegration
from schema_validator import SchemaValidator

class TestGovernanceMeshIntegration(unittest.TestCase):
    """Test cases for the GovernanceMeshIntegration class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with mock dependencies
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            self.schema_validator = SchemaValidator(skip_tether_check=True)
            self.contract_sync_mock = MagicMock()
            self.proposal_protocol_mock = MagicMock()
            self.mesh_topology_mock = MagicMock()
            
            self.mesh_integration = GovernanceMeshIntegration(
                self.schema_validator,
                self.contract_sync_mock,
                self.proposal_protocol_mock,
                self.mesh_topology_mock
            )
        
        # Test data
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        self.node_ids = [str(uuid.uuid4()) for _ in range(3)]
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            mesh_integration = GovernanceMeshIntegration(
                self.schema_validator,
                self.contract_sync_mock,
                self.proposal_protocol_mock,
                self.mesh_topology_mock
            )
            self.assertIsNotNone(mesh_integration)
        
    def test_init_without_dependencies(self):
        """Test initialization without required dependencies."""
        with self.assertRaises(ValueError):
            GovernanceMeshIntegration(None, self.contract_sync_mock, self.proposal_protocol_mock, self.mesh_topology_mock)
            
        with self.assertRaises(ValueError):
            GovernanceMeshIntegration(self.schema_validator, None, self.proposal_protocol_mock, self.mesh_topology_mock)
            
        with self.assertRaises(ValueError):
            GovernanceMeshIntegration(self.schema_validator, self.contract_sync_mock, None, self.mesh_topology_mock)
            
        with self.assertRaises(ValueError):
            GovernanceMeshIntegration(self.schema_validator, self.contract_sync_mock, self.proposal_protocol_mock, None)
            
    def test_initialize_governance_mesh(self):
        """Test initializing the governance mesh."""
        # Mock the dependencies
        self.mesh_topology_mock.create_topology.return_value = {
            "topology_id": str(uuid.uuid4()),
            "timestamp": self.timestamp,
            "phase_id": "5.5",
            "codex_clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"],
            "nodes": [{
                "node_id": self.node_ids[0],
                "node_type": "governance_hub",
                "status": "active",
                "privileges": ["can_propose_policy", "can_vote_on_proposal"],
                "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
                "network_address": "https://node1.example.com",
                "last_seen": self.timestamp,
                "node_policy_capabilities": ["contract_sync", "proposal_voting"]
            }],
            "connections": [],
            "domains": []
        }
        
        result = self.mesh_integration.initialize_governance_mesh(
            self.node_ids[0],
            "Primary Governance Domain",
            "v2025.05.18"
        )
        
        # Verify initialization result
        self.assertIn("mesh_id", result)
        self.assertIn("topology_id", result)
        self.assertIn("admin_node_id", result)
        self.assertEqual(result["admin_node_id"], self.node_ids[0])
        self.assertEqual(result["contract_version"], "v2025.05.18")
        
        # Verify the topology manager was called
        self.mesh_topology_mock.create_topology.assert_called_once()
        
    def test_register_node(self):
        """Test registering a node with the governance mesh."""
        # Mock the dependencies
        self.mesh_topology_mock.add_node.return_value = {
            "topology_id": str(uuid.uuid4()),
            "timestamp": self.timestamp,
            "phase_id": "5.5",
            "codex_clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"],
            "nodes": [
                {
                    "node_id": self.node_ids[0],
                    "node_type": "governance_hub",
                    "status": "active",
                    "privileges": ["can_propose_policy", "can_vote_on_proposal"],
                    "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
                    "network_address": "https://node1.example.com",
                    "last_seen": self.timestamp,
                    "node_policy_capabilities": ["contract_sync", "proposal_voting"]
                },
                {
                    "node_id": self.node_ids[1],
                    "node_type": "compliance_witness",
                    "status": "active",
                    "privileges": ["can_validate_attestation"],
                    "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
                    "network_address": "https://node2.example.com",
                    "last_seen": self.timestamp,
                    "node_policy_capabilities": ["attestation_validation"]
                }
            ],
            "connections": [],
            "domains": []
        }
        
        mesh_state = {
            "mesh_id": str(uuid.uuid4()),
            "topology_id": str(uuid.uuid4()),
            "admin_node_id": self.node_ids[0],
            "contract_version": "v2025.05.18",
            "phase_id": "5.5",
            "codex_clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"],
            "timestamp": self.timestamp,
            "nodes": [
                {
                    "node_id": self.node_ids[0],
                    "node_type": "governance_hub",
                    "status": "active",
                    "privileges": ["can_propose_policy", "can_vote_on_proposal"],
                    "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
                    "network_address": "https://node1.example.com",
                    "last_seen": self.timestamp,
                    "node_policy_capabilities": ["contract_sync", "proposal_voting"]
                }
            ],
            "connections": [],
            "domains": []
        }
        
        node_data = {
            "node_id": self.node_ids[1],
            "node_type": "compliance_witness",
            "status": "active",
            "privileges": ["can_validate_attestation"],
            "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
            "network_address": "https://node2.example.com",
            "last_seen": self.timestamp,
            "node_policy_capabilities": ["attestation_validation"]
        }
        
        result = self.mesh_integration.register_node(mesh_state, node_data)
        
        # Verify registration result
        self.assertEqual(result["mesh_id"], mesh_state["mesh_id"])
        self.assertNotEqual(result["topology_id"], mesh_state["topology_id"])  # Should be updated
        self.assertEqual(len(result["nodes"]), 2)
        
        # Verify the topology manager was called
        self.mesh_topology_mock.add_node.assert_called_once()
        
    def test_establish_connection(self):
        """Test establishing a connection between nodes in the governance mesh."""
        # Mock the dependencies
        self.mesh_topology_mock.add_connection.return_value = {
            "topology_id": str(uuid.uuid4()),
            "timestamp": self.timestamp,
            "phase_id": "5.5",
            "codex_clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"],
            "nodes": [
                {
                    "node_id": self.node_ids[0],
                    "node_type": "governance_hub",
                    "status": "active",
                    "privileges": ["can_propose_policy", "can_vote_on_proposal"],
                    "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
                    "network_address": "https://node1.example.com",
                    "last_seen": self.timestamp,
                    "node_policy_capabilities": ["contract_sync", "proposal_voting"]
                },
                {
                    "node_id": self.node_ids[1],
                    "node_type": "compliance_witness",
                    "status": "active",
                    "privileges": ["can_validate_attestation"],
                    "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
                    "network_address": "https://node2.example.com",
                    "last_seen": self.timestamp,
                    "node_policy_capabilities": ["attestation_validation"]
                }
            ],
            "connections": [
                {
                    "source_node_id": self.node_ids[0],
                    "target_node_id": self.node_ids[1],
                    "connection_type": "direct",
                    "trust_score": 0.95,
                    "attestation_id": str(uuid.uuid4())
                }
            ],
            "domains": []
        }
        
        mesh_state = {
            "mesh_id": str(uuid.uuid4()),
            "topology_id": str(uuid.uuid4()),
            "admin_node_id": self.node_ids[0],
            "contract_version": "v2025.05.18",
            "phase_id": "5.5",
            "codex_clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"],
            "timestamp": self.timestamp,
            "nodes": [
                {
                    "node_id": self.node_ids[0],
                    "node_type": "governance_hub",
                    "status": "active",
                    "privileges": ["can_propose_policy", "can_vote_on_proposal"],
                    "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
                    "network_address": "https://node1.example.com",
                    "last_seen": self.timestamp,
                    "node_policy_capabilities": ["contract_sync", "proposal_voting"]
                },
                {
                    "node_id": self.node_ids[1],
                    "node_type": "compliance_witness",
                    "status": "active",
                    "privileges": ["can_validate_attestation"],
                    "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
                    "network_address": "https://node2.example.com",
                    "last_seen": self.timestamp,
                    "node_policy_capabilities": ["attestation_validation"]
                }
            ],
            "connections": [],
            "domains": []
        }
        
        connection_data = {
            "source_node_id": self.node_ids[0],
            "target_node_id": self.node_ids[1],
            "connection_type": "direct",
            "trust_score": 0.95,
            "attestation_id": str(uuid.uuid4())
        }
        
        result = self.mesh_integration.establish_connection(mesh_state, connection_data)
        
        # Verify connection result
        self.assertEqual(result["mesh_id"], mesh_state["mesh_id"])
        self.assertNotEqual(result["topology_id"], mesh_state["topology_id"])  # Should be updated
        self.assertEqual(len(result["connections"]), 1)
        
        # Verify the topology manager was called
        self.mesh_topology_mock.add_connection.assert_called_once()
        
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should not raise an exception
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            self.mesh_integration._codex_tether_check()

if __name__ == '__main__':
    unittest.main()
