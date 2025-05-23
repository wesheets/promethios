"""
Test suite for Mesh Topology Manager component of Phase 5.5.

This module contains comprehensive tests for the mesh_topology_manager.py
implementation, ensuring proper mesh topology creation, validation, and management.

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

from src.core.governance.mesh_topology_manager import MeshTopologyManager
from src.core.common.schema_validator import SchemaValidator

class TestMeshTopologyManager(unittest.TestCase):
    """Test cases for the MeshTopologyManager class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with mock dependencies
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            self.schema_validator = SchemaValidator(skip_tether_check=True)
            self.topology_manager = MeshTopologyManager(self.schema_validator)
        
        # Test data
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        self.node_ids = [str(uuid.uuid4()) for _ in range(3)]
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            topology_manager = MeshTopologyManager(self.schema_validator)
            self.assertIsNotNone(topology_manager)
        
    def test_init_without_schema_validator(self):
        """Test initialization without schema validator."""
        with self.assertRaises(ValueError):
            MeshTopologyManager(None)
            
    def test_create_topology(self):
        """Test creating a mesh topology."""
        topology = self.topology_manager.create_topology(
            [
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
            [
                {
                    "source_node_id": self.node_ids[0],
                    "target_node_id": self.node_ids[1],
                    "connection_type": "direct",
                    "trust_score": 0.95,
                    "attestation_id": str(uuid.uuid4())
                }
            ],
            [
                {
                    "domain_id": str(uuid.uuid4()),
                    "name": "Primary Governance Domain",
                    "description": "Main governance domain for contract synchronization",
                    "admin_node_id": self.node_ids[0],
                    "member_nodes": [self.node_ids[0], self.node_ids[1]],
                    "policy_rules": [
                        {
                            "rule_id": str(uuid.uuid4()),
                            "description": "Require 2/3 majority for proposal approval",
                            "rule_type": "voting_threshold",
                            "parameters": {
                                "threshold": 0.66
                            }
                        }
                    ]
                }
            ]
        )
        
        # Verify topology structure
        self.assertIn("topology_id", topology)
        self.assertEqual(len(topology["nodes"]), 2)
        self.assertEqual(len(topology["connections"]), 1)
        self.assertEqual(len(topology["domains"]), 1)
        self.assertEqual(topology["phase_id"], "5.5")
        self.assertEqual(topology["codex_clauses"], ["5.5", "5.4", "11.0", "11.1", "5.2.5"])
        
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should not raise an exception
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            self.topology_manager._codex_tether_check()
        
if __name__ == '__main__':
    unittest.main()
