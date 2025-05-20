import unittest
from unittest.mock import MagicMock, patch
import json
import os
import tempfile
from fastapi.testclient import TestClient
from src.integration.codex_lock_api import router, get_codex_lock
from src.core.governance.codex_lock import CodexLock

class TestCodexLockAPI(unittest.TestCase):
    """
    Integration tests for the Codex Lock API.
    """
    
    def setUp(self):
        """
        Set up test fixtures.
        """
        # Create a mock CodexLock
        self.mock_codex_lock = MagicMock(spec=CodexLock)
        
        # Create a test client with a dependency override
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(router)
        
        # Override the dependency
        app.dependency_overrides[get_codex_lock] = lambda: self.mock_codex_lock
        
        self.client = TestClient(app)
        
        # Set up mock return values
        self.mock_codex_lock.current_contract = {"version": "1.0.0"}
        self.mock_codex_lock.seal_registry = {"seals": [], "last_updated": None}
    
    def test_get_lock_status_verified(self):
        """
        Test getting the lock status when the contract is verified.
        """
        # Set up the mock
        self.mock_codex_lock.verify_contract_integrity.return_value = {
            "verified": True,
            "reason": None,
            "details": None
        }
        
        # Make the request
        response = self.client.get("/api/v1/codex-lock/status")
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["contract_version"], "1.0.0")
        self.assertTrue(response.json()["integrity_verified"])
        self.assertEqual(response.json()["details"], "Contract integrity verified")
        self.assertIsNone(response.json()["last_sealed"])
    
    def test_get_lock_status_not_verified(self):
        """
        Test getting the lock status when the contract is not verified.
        """
        # Set up the mock
        self.mock_codex_lock.verify_contract_integrity.return_value = {
            "verified": False,
            "reason": "STATE_MODIFIED",
            "details": "The contract state has been modified."
        }
        
        # Make the request
        response = self.client.get("/api/v1/codex-lock/status")
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["contract_version"], "1.0.0")
        self.assertFalse(response.json()["integrity_verified"])
        self.assertEqual(response.json()["details"], "The contract state has been modified.")
        self.assertIsNone(response.json()["last_sealed"])
    
    def test_lock_contract(self):
        """
        Test locking a contract.
        """
        # Set up the mock
        self.mock_codex_lock.lock_current_contract.return_value = {
            "seal_id": "test-seal-id",
            "timestamp": "2025-05-20T12:00:00Z",
            "contract_hash": "test-hash",
            "hash_algorithm": "sha256",
            "contract_version": "1.0.0",
            "sealed_contract": {"version": "1.0.0"}
        }
        
        # Make the request
        response = self.client.post("/api/v1/codex-lock/lock")
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        self.assertEqual(response.json()["message"], "Contract successfully locked")
        self.assertEqual(response.json()["seal_id"], "test-seal-id")
        self.assertEqual(response.json()["timestamp"], "2025-05-20T12:00:00Z")
        self.assertEqual(response.json()["contract_version"], "1.0.0")
    
    def test_propose_evolution(self):
        """
        Test proposing an evolution.
        """
        # Set up the mock
        self.mock_codex_lock.propose_contract_evolution.return_value = {
            "proposal_id": "test-proposal-id",
            "timestamp": "2025-05-20T12:00:00Z"
        }
        
        # Make the request
        response = self.client.post(
            "/api/v1/codex-lock/propose-evolution",
            json={
                "changes": {"clauses": {"clause1": {"text": "Modified text"}}},
                "justification": "Improving the contract",
                "proposer_id": "user123"
            }
        )
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        self.assertEqual(response.json()["message"], "Evolution proposal created")
        self.assertEqual(response.json()["proposal_id"], "test-proposal-id")
        self.assertEqual(response.json()["timestamp"], "2025-05-20T12:00:00Z")
        
        # Check that the mock was called with the correct arguments
        self.mock_codex_lock.propose_contract_evolution.assert_called_once_with(
            {"clauses": {"clause1": {"text": "Modified text"}}},
            "Improving the contract",
            "user123"
        )
    
    def test_approve_proposal(self):
        """
        Test approving a proposal.
        """
        # Set up the mock
        self.mock_codex_lock.approve_proposal.return_value = {
            "status": "APPROVED",
            "approvals": [{"approver_id": "approver1"}, {"approver_id": "approver2"}]
        }
        
        # Make the request
        response = self.client.post(
            "/api/v1/codex-lock/approve-proposal/test-proposal-id",
            json={
                "approver_id": "approver2",
                "comments": "Looks good"
            }
        )
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        self.assertEqual(response.json()["message"], "Proposal approved")
        self.assertEqual(response.json()["proposal_id"], "test-proposal-id")
        self.assertEqual(response.json()["status"], "APPROVED")
        self.assertEqual(response.json()["approvals_count"], 2)
        
        # Check that the mock was called with the correct arguments
        self.mock_codex_lock.approve_proposal.assert_called_once_with(
            "test-proposal-id",
            "approver2",
            "Looks good"
        )
    
    def test_reject_proposal(self):
        """
        Test rejecting a proposal.
        """
        # Set up the mock
        self.mock_codex_lock.reject_proposal.return_value = {
            "status": "REJECTED"
        }
        
        # Make the request
        response = self.client.post(
            "/api/v1/codex-lock/reject-proposal/test-proposal-id",
            json={
                "rejector_id": "rejector1",
                "reason": "Not good enough"
            }
        )
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        self.assertEqual(response.json()["message"], "Proposal rejected")
        self.assertEqual(response.json()["proposal_id"], "test-proposal-id")
        self.assertEqual(response.json()["status"], "REJECTED")
        
        # Check that the mock was called with the correct arguments
        self.mock_codex_lock.reject_proposal.assert_called_once_with(
            "test-proposal-id",
            "rejector1",
            "Not good enough"
        )
    
    def test_apply_evolution(self):
        """
        Test applying an evolution.
        """
        # Set up the mock
        self.mock_codex_lock.apply_approved_evolution.return_value = {
            "evolution_id": "test-evolution-id",
            "previous_version": "1.0.0",
            "new_version": "1.0.1",
            "timestamp": "2025-05-20T12:00:00Z"
        }
        
        # Make the request
        response = self.client.post("/api/v1/codex-lock/apply-evolution/test-proposal-id")
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        self.assertEqual(response.json()["message"], "Evolution successfully applied")
        self.assertEqual(response.json()["evolution_id"], "test-evolution-id")
        self.assertEqual(response.json()["previous_version"], "1.0.0")
        self.assertEqual(response.json()["new_version"], "1.0.1")
        self.assertEqual(response.json()["timestamp"], "2025-05-20T12:00:00Z")
        
        # Check that the mock was called with the correct arguments
        self.mock_codex_lock.apply_approved_evolution.assert_called_once_with(
            "test-proposal-id"
        )

if __name__ == "__main__":
    unittest.main()
