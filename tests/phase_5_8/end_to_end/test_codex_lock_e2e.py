import unittest
from unittest.mock import MagicMock, patch
import json
import os
import tempfile
import requests
from src.core.governance.codex_lock import CodexLock
from src.core.governance.contract_sealer import ContractSealer
from src.core.governance.evolution_protocol import ContractEvolutionProtocol
from src.core.trust.mutation_detector import MutationDetector

class TestCodexLockEndToEnd(unittest.TestCase):
    """
    End-to-end tests for the Codex Lock system.
    """
    
    def setUp(self):
        """
        Set up test fixtures.
        """
        # Create a temporary directory for the test
        self.temp_dir = tempfile.mkdtemp()
        
        # Create a codex file path
        self.codex_path = os.path.join(self.temp_dir, "codex.json")
        
        # Create a minimal contract
        self.test_contract = {
            "version": "1.0.0",
            "clauses": {
                "clause1": {
                    "text": "This is a test clause",
                    "required": True
                }
            }
        }
        
        # Write the contract to the file
        with open(self.codex_path, 'w') as f:
            json.dump(self.test_contract, f)
        
        # Create the CodexLock instance
        self.codex_lock = CodexLock(self.codex_path)
    
    def tearDown(self):
        """
        Clean up test fixtures.
        """
        # Remove the temporary directory
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_full_evolution_workflow(self):
        """
        Test the full contract evolution workflow.
        """
        # Step 1: Lock the current contract
        seal = self.codex_lock.lock_current_contract()
        
        # Check that the seal was created
        self.assertIn("seal_id", seal)
        self.assertIn("timestamp", seal)
        self.assertIn("contract_hash", seal)
        self.assertIn("hash_algorithm", seal)
        self.assertIn("contract_version", seal)
        self.assertIn("sealed_contract", seal)
        
        # Check that the seal was added to the registry
        self.assertEqual(len(self.codex_lock.seal_registry["seals"]), 1)
        self.assertEqual(self.codex_lock.seal_registry["seals"][0]["seal_id"], seal["seal_id"])
        
        # Step 2: Verify the contract integrity
        integrity_check = self.codex_lock.verify_contract_integrity()
        
        # Check that the integrity is verified
        self.assertTrue(integrity_check["verified"])
        self.assertIsNone(integrity_check["reason"])
        self.assertIsNone(integrity_check["details"])
        
        # Step 3: Propose an evolution
        proposed_changes = {
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
        
        proposal = self.codex_lock.propose_contract_evolution(
            proposed_changes,
            "Improving the contract",
            "user123"
        )
        
        # Check that the proposal was created
        self.assertIn("proposal_id", proposal)
        self.assertIn("timestamp", proposal)
        self.assertIn("proposer_id", proposal)
        self.assertIn("current_contract", proposal)
        self.assertIn("proposed_contract", proposal)
        self.assertIn("justification", proposal)
        self.assertIn("status", proposal)
        
        # Check that the proposal has the expected values
        self.assertEqual(proposal["proposer_id"], "user123")
        self.assertEqual(proposal["justification"], "Improving the contract")
        self.assertEqual(proposal["status"], "PROPOSED")
        
        # Step 4: Approve the proposal
        updated_proposal = self.codex_lock.approve_proposal(
            proposal["proposal_id"],
            "approver1",
            "Looks good"
        )
        
        # Check that the approval was added
        self.assertEqual(len(updated_proposal["approvals"]), 1)
        self.assertEqual(updated_proposal["approvals"][0]["approver_id"], "approver1")
        self.assertEqual(updated_proposal["approvals"][0]["comments"], "Looks good")
        
        # Add another approval
        updated_proposal = self.codex_lock.approve_proposal(
            proposal["proposal_id"],
            "approver2"
        )
        
        # Check that the second approval was added
        self.assertEqual(len(updated_proposal["approvals"]), 2)
        self.assertEqual(updated_proposal["approvals"][1]["approver_id"], "approver2")
        
        # Check that the status is now APPROVED
        self.assertEqual(updated_proposal["status"], "APPROVED")
        
        # Step 5: Apply the evolution
        evolution_record = self.codex_lock.apply_approved_evolution(proposal["proposal_id"])
        
        # Check that the evolution record was created
        self.assertIn("evolution_id", evolution_record)
        self.assertIn("timestamp", evolution_record)
        self.assertIn("proposal_id", evolution_record)
        self.assertIn("previous_version", evolution_record)
        self.assertIn("new_version", evolution_record)
        self.assertIn("sealed_contract", evolution_record)
        
        # Check that the evolution record has the expected values
        self.assertEqual(evolution_record["proposal_id"], proposal["proposal_id"])
        self.assertEqual(evolution_record["previous_version"], "1.0.0")
        self.assertEqual(evolution_record["new_version"], "1.0.1")
        
        # Step 6: Verify that the contract was updated
        self.assertEqual(self.codex_lock.current_contract["version"], "1.0.1")
        self.assertEqual(
            self.codex_lock.current_contract["clauses"]["clause1"]["text"],
            "This is a modified test clause"
        )
        self.assertEqual(
            self.codex_lock.current_contract["clauses"]["clause2"]["text"],
            "This is a new clause"
        )
        
        # Step 7: Verify that a new seal was added to the registry
        self.assertEqual(len(self.codex_lock.seal_registry["seals"]), 2)
        
        # Step 8: Verify the integrity of the updated contract
        integrity_check = self.codex_lock.verify_contract_integrity()
        
        # Check that the integrity is still verified
        self.assertTrue(integrity_check["verified"])
        self.assertIsNone(integrity_check["reason"])
        self.assertIsNone(integrity_check["details"])
        
        # Step 9: Try to modify the contract directly
        self.codex_lock.current_contract["clauses"]["clause1"]["text"] = "Unauthorized modification"
        self.codex_lock._save_contract()
        
        # Step 10: Verify that the integrity check now fails
        integrity_check = self.codex_lock.verify_contract_integrity()
        
        # Check that the integrity is no longer verified
        self.assertFalse(integrity_check["verified"])
        self.assertEqual(integrity_check["reason"], "STATE_MODIFIED")
        self.assertEqual(integrity_check["details"], "The contract state has been modified.")

if __name__ == "__main__":
    unittest.main()
