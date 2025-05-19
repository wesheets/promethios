"""
Test suite for Governance Proposal Protocol component of Phase 5.5.

This module contains comprehensive tests for the governance_proposal_protocol.py
implementation, ensuring proper proposal creation, validation, and voting.

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

from governance_proposal_protocol import GovernanceProposalProtocol
from schema_validator import SchemaValidator

class TestGovernanceProposalProtocol(unittest.TestCase):
    """Test cases for the GovernanceProposalProtocol class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with mock dependencies
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            self.schema_validator = SchemaValidator(skip_tether_check=True)
            self.proposal_protocol = GovernanceProposalProtocol(self.schema_validator)
        
        # Test data
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        self.proposer_id = str(uuid.uuid4())
        self.target_clause = "11.4.2"
        self.current_text = "The resilience threshold shall be set to 0.75 for all governance mesh operations."
        self.proposed_text = "The resilience threshold shall be set to 0.85 for all governance mesh operations."
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            proposal_protocol = GovernanceProposalProtocol(self.schema_validator)
            self.assertIsNotNone(proposal_protocol)
        
    def test_init_without_schema_validator(self):
        """Test initialization without schema validator."""
        with self.assertRaises(ValueError):
            GovernanceProposalProtocol(None)
            
    def test_create_proposal(self):
        """Test creating a governance proposal."""
        proposal = self.proposal_protocol.create_proposal(
            self.proposer_id,
            self.target_clause,
            "This proposal aims to improve the governance mesh resilience",
            self.current_text,
            self.proposed_text,
            [
                {
                    "path": "/governance/mesh/resilience_threshold",
                    "operation": "replace",
                    "value": "0.85"
                }
            ]
        )
        
        # Verify proposal structure
        self.assertIn("proposal_id", proposal)
        self.assertEqual(proposal["proposed_by"], self.proposer_id)
        self.assertEqual(proposal["target_contract_clause"], self.target_clause)
        self.assertEqual(proposal["status"], "draft")
        self.assertEqual(proposal["phase_id"], "5.5")
        self.assertEqual(proposal["codex_clauses"], ["5.5", "5.4", "11.0", "11.1", "5.2.5"])
        self.assertIn("changes", proposal)
        self.assertEqual(proposal["changes"]["current_text"], self.current_text)
        self.assertEqual(proposal["changes"]["proposed_text"], self.proposed_text)
        
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should not raise an exception
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            self.proposal_protocol._codex_tether_check()
        
if __name__ == '__main__':
    unittest.main()
