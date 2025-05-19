"""
Test suite for Governance Contract Sync component of Phase 5.5.

This module contains comprehensive tests for the governance_contract_sync.py
implementation, ensuring proper contract synchronization across the governance mesh.

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

from governance_contract_sync import GovernanceContractSync
from schema_validator import SchemaValidator

class TestGovernanceContractSync(unittest.TestCase):
    """Test cases for the GovernanceContractSync class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with mock dependencies
        self.schema_validator = SchemaValidator()
        self.contract_sync = GovernanceContractSync(self.schema_validator)
        
        # Test data
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        self.source_node_id = str(uuid.uuid4())
        self.target_node_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
        self.contract_hash = "a" * 64  # Mock SHA-256 hash
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        contract_sync = GovernanceContractSync(self.schema_validator)
        self.assertIsNotNone(contract_sync)
        
    def test_init_without_schema_validator(self):
        """Test initialization without schema validator."""
        with self.assertRaises(ValueError):
            GovernanceContractSync(None)
            
    def test_create_sync_record(self):
        """Test creating a sync record."""
        sync_record = self.contract_sync.create_sync_record(
            self.source_node_id,
            self.target_node_ids,
            "v2025.05.18",
            self.contract_hash,
            "full"
        )
        
        # Verify record structure
        self.assertIn("sync_id", sync_record)
        self.assertEqual(sync_record["source_node_id"], self.source_node_id)
        self.assertEqual(sync_record["target_node_ids"], self.target_node_ids)
        self.assertEqual(sync_record["contract_version"], "v2025.05.18")
        self.assertEqual(sync_record["contract_hash"], self.contract_hash)
        self.assertEqual(sync_record["sync_type"], "full")
        self.assertEqual(sync_record["phase_id"], "5.5")
        self.assertEqual(sync_record["codex_clauses"], ["5.5", "5.4", "11.0", "11.1", "5.2.5"])
        
    def test_validate_sync_record(self):
        """Test validating a sync record."""
        sync_record = self.contract_sync.create_sync_record(
            self.source_node_id,
            self.target_node_ids,
            "v2025.05.18",
            self.contract_hash,
            "full"
        )
        
        # Should not raise an exception
        self.contract_sync.validate_sync_record(sync_record)
        
    def test_validate_invalid_sync_record(self):
        """Test validating an invalid sync record."""
        sync_record = self.contract_sync.create_sync_record(
            self.source_node_id,
            self.target_node_ids,
            "v2025.05.18",
            self.contract_hash,
            "full"
        )
        
        # Corrupt the record
        sync_record.pop("sync_id")
        
        with self.assertRaises(ValueError):
            self.contract_sync.validate_sync_record(sync_record)
            
    @patch('governance_contract_sync.requests.post')
    def test_distribute_contract(self, mock_post):
        """Test distributing a contract to target nodes."""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "success"}
        mock_post.return_value = mock_response
        
        result = self.contract_sync.distribute_contract(
            self.source_node_id,
            self.target_node_ids,
            "v2025.05.18",
            self.contract_hash,
            "contract_content"
        )
        
        # Verify distribution result
        self.assertEqual(len(result["successful_nodes"]), 2)
        self.assertEqual(len(result["failed_nodes"]), 0)
        
    @patch('governance_contract_sync.requests.post')
    def test_distribute_contract_partial_failure(self, mock_post):
        """Test distributing a contract with partial failure."""
        # Mock responses - one success, one failure
        def side_effect(*args, **kwargs):
            if args[0].endswith(self.target_node_ids[0]):
                mock_success = MagicMock()
                mock_success.status_code = 200
                mock_success.json.return_value = {"status": "success"}
                return mock_success
            else:
                mock_failure = MagicMock()
                mock_failure.status_code = 500
                return mock_failure
                
        mock_post.side_effect = side_effect
        
        result = self.contract_sync.distribute_contract(
            self.source_node_id,
            self.target_node_ids,
            "v2025.05.18",
            self.contract_hash,
            "contract_content"
        )
        
        # Verify distribution result
        self.assertEqual(len(result["successful_nodes"]), 1)
        self.assertEqual(len(result["failed_nodes"]), 1)
        
    def test_generate_attestation(self):
        """Test generating an attestation for a sync record."""
        sync_record = self.contract_sync.create_sync_record(
            self.source_node_id,
            self.target_node_ids,
            "v2025.05.18",
            self.contract_hash,
            "full"
        )
        
        attestation = self.contract_sync.generate_attestation(
            sync_record,
            self.source_node_id
        )
        
        # Verify attestation structure
        self.assertEqual(attestation["attester_node_id"], self.source_node_id)
        self.assertIn("signature", attestation)
        self.assertIn("timestamp", attestation)
        
    def test_verify_attestation(self):
        """Test verifying an attestation."""
        sync_record = self.contract_sync.create_sync_record(
            self.source_node_id,
            self.target_node_ids,
            "v2025.05.18",
            self.contract_hash,
            "full"
        )
        
        attestation = self.contract_sync.generate_attestation(
            sync_record,
            self.source_node_id
        )
        
        # Should not raise an exception
        self.assertTrue(self.contract_sync.verify_attestation(sync_record, attestation))
        
    def test_verify_invalid_attestation(self):
        """Test verifying an invalid attestation."""
        sync_record = self.contract_sync.create_sync_record(
            self.source_node_id,
            self.target_node_ids,
            "v2025.05.18",
            self.contract_hash,
            "full"
        )
        
        attestation = self.contract_sync.generate_attestation(
            sync_record,
            self.source_node_id
        )
        
        # Corrupt the attestation
        attestation["signature"] = "invalid_signature"
        
        self.assertFalse(self.contract_sync.verify_attestation(sync_record, attestation))
        
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should not raise an exception
        self.contract_sync._codex_tether_check()
        
if __name__ == '__main__':
    unittest.main()
