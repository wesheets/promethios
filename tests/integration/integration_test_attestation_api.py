"""
Integration tests for the AttestationAPI.

This module contains integration tests for the AttestationAPI class,
which provides API endpoints for interacting with the attestation framework.
"""

import unittest
import json
import uuid
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import FastAPI
import sys
import os

# Add the src directory to the path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

# Import the class to test
from src.integration.attestation_api import AttestationAPI


class TestAttestationAPI(unittest.TestCase):
    """Integration tests for the AttestationAPI class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.mock_attestation_service = MagicMock()
        self.mock_claim_protocol = MagicMock()
        self.mock_audit_trail = MagicMock()
        self.mock_authority_manager = MagicMock()
        self.mock_trust_decay_engine = MagicMock()
        self.mock_seal_verification = MagicMock()
        
        # Create the API
        self.api = AttestationAPI(
            attestation_service=self.mock_attestation_service,
            claim_verification_protocol=self.mock_claim_protocol,
            governance_audit_trail=self.mock_audit_trail,
            attestation_authority_manager=self.mock_authority_manager,
            trust_decay_engine=self.mock_trust_decay_engine,
            seal_verification_service=self.mock_seal_verification
        )
        
        # Create FastAPI app and test client
        self.app = FastAPI()
        self.app.include_router(self.api.router)
        self.client = TestClient(self.app)
    
    def test_create_attestation(self):
        """Test creating an attestation via API."""
        # Mock authority verification
        self.mock_authority_manager.verify_authority_for_attestation.return_value = (True, {})
        
        # Mock attestation creation
        mock_attestation = {
            "attestation_id": "test-attestation-id",
            "issuer_id": "test-issuer",
            "subject_id": "test-subject",
            "claim_id": "test-claim",
            "attestation_type": "VERIFICATION",
            "timestamp": "2025-05-21T00:00:00Z",
            "expiration": "2026-05-21T00:00:00Z",
            "attestation_data": {
                "content": {"key": "value"},
                "context": {"domain": "test-domain"}
            },
            "signature": {
                "signature_value": "test-signature",
                "key_id": "test-key",
                "algorithm": "test-algorithm"
            },
            "metadata": {
                "revocation_status": "ACTIVE"
            }
        }
        self.mock_attestation_service.create_attestation.return_value = mock_attestation
        
        # Test data
        attestation_data = {
            "issuer_id": "test-issuer",
            "subject_id": "test-subject",
            "claim_id": "test-claim",
            "attestation_type": "VERIFICATION",
            "content": {"key": "value"},
            "context": {"domain": "test-domain"},
            "signature": {
                "signature_value": "test-signature",
                "key_id": "test-key",
                "algorithm": "test-algorithm"
            }
        }
        
        # Make request
        response = self.client.post("/attestation/create", json=attestation_data)
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), mock_attestation)
        
        # Verify service calls
        self.mock_authority_manager.verify_authority_for_attestation.assert_called_once()
        self.mock_attestation_service.create_attestation.assert_called_once()
        self.mock_audit_trail.log_event.assert_called_once()
        self.mock_trust_decay_engine.register_attestation_event.assert_called_once()
    
    def test_get_attestation(self):
        """Test getting an attestation via API."""
        # Mock attestation retrieval
        mock_attestation = {
            "attestation_id": "test-attestation-id",
            "issuer_id": "test-issuer",
            "subject_id": "test-subject",
            "claim_id": "test-claim",
            "attestation_type": "VERIFICATION",
            "timestamp": "2025-05-21T00:00:00Z",
            "expiration": "2026-05-21T00:00:00Z",
            "attestation_data": {
                "content": {"key": "value"},
                "context": {"domain": "test-domain"}
            },
            "metadata": {
                "revocation_status": "ACTIVE"
            }
        }
        self.mock_attestation_service.get_attestation.return_value = mock_attestation
        
        # Make request
        response = self.client.get("/attestation/test-attestation-id")
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), mock_attestation)
        
        # Verify service calls
        self.mock_attestation_service.get_attestation.assert_called_once_with("test-attestation-id")
    
    def test_verify_attestation(self):
        """Test verifying an attestation via API."""
        # Mock attestation validation
        mock_validation_result = (True, {"validation_timestamp": "2025-05-21T00:00:00Z"})
        self.mock_attestation_service.validate_attestation.return_value = mock_validation_result
        
        # Mock attestation retrieval for audit
        mock_attestation = {
            "attestation_id": "test-attestation-id",
            "issuer_id": "test-issuer",
            "subject_id": "test-subject"
        }
        self.mock_attestation_service.get_attestation.return_value = mock_attestation
        
        # Make request
        response = self.client.get("/attestation/test-attestation-id/verify")
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["is_valid"], True)
        self.assertEqual(response.json()["attestation_id"], "test-attestation-id")
        
        # Verify service calls
        self.mock_attestation_service.validate_attestation.assert_called_once_with("test-attestation-id")
        self.mock_audit_trail.log_event.assert_called_once()
    
    def test_create_claim(self):
        """Test creating a claim via API."""
        # Mock claim creation
        mock_claim = {
            "claim_id": "test-claim-id",
            "issuer_id": "test-issuer",
            "subject_id": "test-subject",
            "claim_type": "COMPLIANCE",
            "statement": "Test statement",
            "scope": {"domain": "test-domain"},
            "timestamp": "2025-05-21T00:00:00Z",
            "metadata": {
                "verification_status": "PENDING"
            }
        }
        self.mock_claim_protocol.create_claim.return_value = mock_claim
        
        # Test data
        claim_data = {
            "issuer_id": "test-issuer",
            "subject_id": "test-subject",
            "claim_type": "COMPLIANCE",
            "statement": "Test statement",
            "scope": {"domain": "test-domain"}
        }
        
        # Make request
        response = self.client.post("/attestation/claim/create", json=claim_data)
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), mock_claim)
        
        # Verify service calls
        self.mock_claim_protocol.create_claim.assert_called_once()
        self.mock_audit_trail.log_event.assert_called_once()
    
    def test_verify_claim(self):
        """Test verifying a claim via API."""
        # Mock claim verification
        mock_verification_result = (True, {"valid_attestations": 2})
        self.mock_claim_protocol.verify_claim.return_value = mock_verification_result
        
        # Mock claim retrieval for audit
        mock_claim = {
            "claim_id": "test-claim-id",
            "issuer_id": "test-issuer",
            "subject_id": "test-subject"
        }
        self.mock_claim_protocol.get_claim.return_value = mock_claim
        
        # Make request
        response = self.client.post("/attestation/claim/test-claim-id/verify")
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["is_verified"], True)
        self.assertEqual(response.json()["claim_id"], "test-claim-id")
        
        # Verify service calls
        self.mock_claim_protocol.verify_claim.assert_called_once_with("test-claim-id")
        self.mock_audit_trail.log_event.assert_called_once()
    
    def test_get_audit_events(self):
        """Test getting audit events via API."""
        # Mock audit event retrieval
        mock_events = [
            {
                "event_id": "event1",
                "entity_id": "entity1",
                "event_type": "TEST_EVENT",
                "timestamp": "2025-05-21T00:00:00Z",
                "actor_id": "actor1",
                "event_data": {"key": "value1"},
                "metadata": {"severity": "INFO"}
            },
            {
                "event_id": "event2",
                "entity_id": "entity1",
                "event_type": "TEST_EVENT",
                "timestamp": "2025-05-21T01:00:00Z",
                "actor_id": "actor2",
                "event_data": {"key": "value2"},
                "metadata": {"severity": "MEDIUM"}
            }
        ]
        self.mock_audit_trail.find_events.return_value = mock_events
        
        # Make request
        response = self.client.get("/attestation/audit/events?entity_id=entity1&event_type=TEST_EVENT")
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)
        self.assertEqual(response.json()[0]["event_id"], "event1")
        self.assertEqual(response.json()[1]["event_id"], "event2")
        
        # Verify service calls
        self.mock_audit_trail.find_events.assert_called_once_with(
            entity_id="entity1",
            event_type="TEST_EVENT",
            actor_id=None,
            start_time=None,
            end_time=None,
            limit=100
        )
    
    def test_register_authority(self):
        """Test registering an authority via API."""
        # Mock authority registration
        mock_authority = {
            "authority_id": "test-authority-id",
            "name": "Test Authority",
            "description": "A test authority",
            "public_keys": [
                {
                    "key_id": "key1",
                    "algorithm": "RSA",
                    "key_data": "test-key-data",
                    "status": "ACTIVE"
                }
            ],
            "trust_level": {
                "level": "MEDIUM",
                "score": 0.5
            },
            "status": "PENDING",
            "registration_date": "2025-05-21T00:00:00Z",
            "capabilities": {
                "attestation_types": ["VERIFICATION"],
                "domains": ["test-domain"]
            },
            "metadata": {"version": "1.0.0"}
        }
        self.mock_authority_manager.register_authority.return_value = mock_authority
        
        # Test data
        authority_data = {
            "name": "Test Authority",
            "description": "A test authority",
            "public_keys": [
                {
                    "key_id": "key1",
                    "algorithm": "RSA",
                    "key_data": "test-key-data"
                }
            ],
            "capabilities": {
                "attestation_types": ["VERIFICATION"],
                "domains": ["test-domain"]
            }
        }
        
        # Make request
        response = self.client.post("/attestation/authority/register", json=authority_data)
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), mock_authority)
        
        # Verify service calls
        self.mock_authority_manager.register_authority.assert_called_once()
        self.mock_audit_trail.log_event.assert_called_once()


if __name__ == '__main__':
    unittest.main()
"""
