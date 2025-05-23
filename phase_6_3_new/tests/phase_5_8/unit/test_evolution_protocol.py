import unittest
from unittest.mock import MagicMock, patch
import json
import os
import tempfile
from src.core.governance.evolution_protocol import ContractEvolutionProtocol
from src.core.governance.contract_sealer import ContractSealer

class TestEvolutionProtocol(unittest.TestCase):
    """
    Unit tests for the ContractEvolutionProtocol class.
    """
    
    def setUp(self):
        """
        Set up test fixtures.
        """
        self.contract_sealer = MagicMock(spec=ContractSealer)
        self.protocol = ContractEvolutionProtocol(self.contract_sealer, required_approvals=2)
        
        self.test_contract = {
            "version": "1.0.0",
            "clauses": {
                "clause1": {
                    "text": "This is a test clause",
                    "required": True
                }
            }
        }
        
        self.proposed_changes = {
            "clauses": {
                "clause1": {
                    "text": "This is a modified test clause"
                },
                "clause2": {
                    "text": "This is a new clause",
                    "required": False
                }
            }
        }
    
    def test_create_evolution_proposal(self):
        """
        Test that an evolution proposal can be created.
        """
        # Create a proposal
        proposal = self.protocol.create_evolution_proposal(
            self.test_contract,
            self.proposed_changes,
            "Improving the contract",
            "user123"
        )
        
        # Check that the proposal has the expected fields
        self.assertIn("proposal_id", proposal)
        self.assertIn("timestamp", proposal)
        self.assertIn("proposer_id", proposal)
        self.assertIn("current_contract", proposal)
        self.assertIn("proposed_contract", proposal)
        self.assertIn("justification", proposal)
        self.assertIn("status", proposal)
        self.assertIn("approvals", proposal)
        self.assertIn("rejections", proposal)
        self.assertIn("comments", proposal)
        
        # Check that the proposer ID is correct
        self.assertEqual(proposal["proposer_id"], "user123")
        
        # Check that the justification is correct
        self.assertEqual(proposal["justification"], "Improving the contract")
        
        # Check that the status is PROPOSED
        self.assertEqual(proposal["status"], "PROPOSED")
        
        # Check that the approvals, rejections, and comments are empty
        self.assertEqual(proposal["approvals"], [])
        self.assertEqual(proposal["rejections"], [])
        self.assertEqual(proposal["comments"], [])
        
        # Check that the current contract matches the original
        self.assertEqual(proposal["current_contract"], self.test_contract)
        
        # Check that the proposed contract has the expected changes
        self.assertEqual(proposal["proposed_contract"]["clauses"]["clause1"]["text"], 
                         "This is a modified test clause")
        self.assertEqual(proposal["proposed_contract"]["clauses"]["clause2"]["text"], 
                         "This is a new clause")
        self.assertEqual(proposal["proposed_contract"]["clauses"]["clause2"]["required"], 
                         False)
        
        # Check that the version has been incremented
        self.assertEqual(proposal["proposed_contract"]["version"], "1.0.1")
    
    def test_approve_proposal(self):
        """
        Test that a proposal can be approved.
        """
        # Create a proposal
        proposal = self.protocol.create_evolution_proposal(
            self.test_contract,
            self.proposed_changes,
            "Improving the contract",
            "user123"
        )
        
        # Approve the proposal
        updated_proposal = self.protocol.approve_proposal(
            proposal,
            "approver1",
            "Looks good"
        )
        
        # Check that the approval was added
        self.assertEqual(len(updated_proposal["approvals"]), 1)
        self.assertEqual(updated_proposal["approvals"][0]["approver_id"], "approver1")
        self.assertEqual(updated_proposal["approvals"][0]["comments"], "Looks good")
        
        # Check that the status is still PROPOSED (not enough approvals)
        self.assertEqual(updated_proposal["status"], "PROPOSED")
        
        # Approve again with a different approver
        updated_proposal = self.protocol.approve_proposal(
            updated_proposal,
            "approver2"
        )
        
        # Check that the second approval was added
        self.assertEqual(len(updated_proposal["approvals"]), 2)
        self.assertEqual(updated_proposal["approvals"][1]["approver_id"], "approver2")
        self.assertIsNone(updated_proposal["approvals"][1]["comments"])
        
        # Check that the status is now APPROVED (enough approvals)
        self.assertEqual(updated_proposal["status"], "APPROVED")
    
    def test_approve_proposal_already_approved(self):
        """
        Test that approving an already approved proposal raises an error.
        """
        # Create a proposal
        proposal = self.protocol.create_evolution_proposal(
            self.test_contract,
            self.proposed_changes,
            "Improving the contract",
            "user123"
        )
        
        # Approve the proposal twice to get it to APPROVED status
        updated_proposal = self.protocol.approve_proposal(proposal, "approver1")
        updated_proposal = self.protocol.approve_proposal(updated_proposal, "approver2")
        
        # Try to approve again
        with self.assertRaises(ValueError):
            self.protocol.approve_proposal(updated_proposal, "approver3")
    
    def test_approve_proposal_already_approved_by_same_approver(self):
        """
        Test that approving a proposal by the same approver raises an error.
        """
        # Create a proposal
        proposal = self.protocol.create_evolution_proposal(
            self.test_contract,
            self.proposed_changes,
            "Improving the contract",
            "user123"
        )
        
        # Approve the proposal
        updated_proposal = self.protocol.approve_proposal(proposal, "approver1")
        
        # Try to approve again with the same approver
        with self.assertRaises(ValueError):
            self.protocol.approve_proposal(updated_proposal, "approver1")
    
    def test_reject_proposal(self):
        """
        Test that a proposal can be rejected.
        """
        # Create a proposal
        proposal = self.protocol.create_evolution_proposal(
            self.test_contract,
            self.proposed_changes,
            "Improving the contract",
            "user123"
        )
        
        # Reject the proposal
        updated_proposal = self.protocol.reject_proposal(
            proposal,
            "rejector1",
            "Not good enough"
        )
        
        # Check that the rejection was added
        self.assertEqual(len(updated_proposal["rejections"]), 1)
        self.assertEqual(updated_proposal["rejections"][0]["rejector_id"], "rejector1")
        self.assertEqual(updated_proposal["rejections"][0]["reason"], "Not good enough")
        
        # Check that the status is REJECTED
        self.assertEqual(updated_proposal["status"], "REJECTED")
    
    def test_reject_proposal_already_rejected(self):
        """
        Test that rejecting an already rejected proposal raises an error.
        """
        # Create a proposal
        proposal = self.protocol.create_evolution_proposal(
            self.test_contract,
            self.proposed_changes,
            "Improving the contract",
            "user123"
        )
        
        # Reject the proposal
        updated_proposal = self.protocol.reject_proposal(
            proposal,
            "rejector1",
            "Not good enough"
        )
        
        # Try to reject again
        with self.assertRaises(ValueError):
            self.protocol.reject_proposal(
                updated_proposal,
                "rejector2",
                "Also not good"
            )
    
    def test_finalize_evolution(self):
        """
        Test that an approved proposal can be finalized.
        """
        # Create a proposal
        proposal = self.protocol.create_evolution_proposal(
            self.test_contract,
            self.proposed_changes,
            "Improving the contract",
            "user123"
        )
        
        # Approve the proposal twice to get it to APPROVED status
        updated_proposal = self.protocol.approve_proposal(proposal, "approver1")
        updated_proposal = self.protocol.approve_proposal(updated_proposal, "approver2")
        
        # Mock the contract sealer
        mock_seal = {
            "seal_id": "test-seal-id",
            "timestamp": "2025-05-20T12:00:00Z",
            "contract_hash": "test-hash",
            "hash_algorithm": "sha256",
            "contract_version": "1.0.1",
            "sealed_contract": updated_proposal["proposed_contract"]
        }
        self.contract_sealer.seal_contract.return_value = mock_seal
        
        # Finalize the evolution
        evolution_record = self.protocol.finalize_evolution(updated_proposal)
        
        # Check that the contract sealer was called
        self.contract_sealer.seal_contract.assert_called_once_with(
            updated_proposal["proposed_contract"]
        )
        
        # Check that the evolution record has the expected fields
        self.assertIn("evolution_id", evolution_record)
        self.assertIn("timestamp", evolution_record)
        self.assertIn("proposal_id", evolution_record)
        self.assertIn("previous_version", evolution_record)
        self.assertIn("new_version", evolution_record)
        self.assertIn("sealed_contract", evolution_record)
        self.assertIn("approvals", evolution_record)
        self.assertIn("justification", evolution_record)
        
        # Check that the proposal ID is correct
        self.assertEqual(evolution_record["proposal_id"], updated_proposal["proposal_id"])
        
        # Check that the versions are correct
        self.assertEqual(evolution_record["previous_version"], "1.0.0")
        self.assertEqual(evolution_record["new_version"], "1.0.1")
        
        # Check that the sealed contract is correct
        self.assertEqual(evolution_record["sealed_contract"], mock_seal)
        
        # Check that the approvals are correct
        self.assertEqual(evolution_record["approvals"], updated_proposal["approvals"])
        
        # Check that the justification is correct
        self.assertEqual(evolution_record["justification"], "Improving the contract")
    
    def test_finalize_evolution_not_approved(self):
        """
        Test that finalizing a non-approved proposal raises an error.
        """
        # Create a proposal
        proposal = self.protocol.create_evolution_proposal(
            self.test_contract,
            self.proposed_changes,
            "Improving the contract",
            "user123"
        )
        
        # Try to finalize the proposal (should fail because it's not approved)
        with self.assertRaises(ValueError):
            self.protocol.finalize_evolution(proposal)
        
        # Reject the proposal
        rejected_proposal = self.protocol.reject_proposal(
            proposal,
            "rejector1",
            "Not good enough"
        )
        
        # Try to finalize the rejected proposal
        with self.assertRaises(ValueError):
            self.protocol.finalize_evolution(rejected_proposal)

if __name__ == "__main__":
    unittest.main()
