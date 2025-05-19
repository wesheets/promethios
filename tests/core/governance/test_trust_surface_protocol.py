"""
Tests for Trust Surface Protocol in Promethios Distributed Trust Surface

Codex Contract: v2025.05.18
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""

import unittest
import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

# Updated import for canonical structure
from src.core.governance.trust_surface_protocol import TrustSurfaceProtocol
from src.core.governance.trust_boundary_manager import TrustBoundaryManager

class TestTrustSurfaceProtocol(unittest.TestCase):
    """Test suite for the Trust Surface Protocol."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.instance_id = "test-instance-001"
        self.schema_validator = MagicMock()
        self.schema_validator.validate.return_value = (True, None)
        
        # Create a mock Trust Boundary Manager
        self.trust_boundary_manager = MagicMock(spec=TrustBoundaryManager)
        
        # Create the Trust Surface Protocol
        self.protocol = TrustSurfaceProtocol(
            instance_id=self.instance_id,
            schema_validator=self.schema_validator,
            trust_boundary_manager=self.trust_boundary_manager
        )
    
    def test_create_protocol_message(self):
        """Test creating a protocol message."""
        # Create a message
        message_type = "boundary_request"
        payload = {
            "source_instance_id": "source-001",
            "target_instance_id": "target-001",
            "trust_level": 80
        }
        
        message = self.protocol.create_protocol_message(
            message_type=message_type,
            payload=payload
        )
        
        # Verify the message was created correctly
        self.assertIsNotNone(message)
        self.assertIn("message_id", message)
        self.assertEqual(message["message_type"], message_type)
        self.assertEqual(message["payload"], payload)
        self.assertEqual(message["sender_instance_id"], self.instance_id)
        self.assertIn("timestamp", message)
    
    def test_validate_protocol_message(self):
        """Test validating a protocol message."""
        # Create a valid message
        message = {
            "message_id": f"msg-{uuid.uuid4().hex}",
            "message_type": "boundary_request",
            "sender_instance_id": "source-001",
            "recipient_instance_id": "target-001",
            "timestamp": datetime.utcnow().isoformat() + 'Z',
            "payload": {
                "source_instance_id": "source-001",
                "target_instance_id": "target-001",
                "trust_level": 80
            }
        }
        
        # Validate the message
        is_valid, errors = self.protocol.validate_protocol_message(message)
        
        # Verify the message was validated correctly
        self.assertTrue(is_valid)
        self.assertIsNone(errors)
        
        # Test with an invalid message (missing required field)
        invalid_message = message.copy()
        del invalid_message["message_type"]
        
        is_valid, errors = self.protocol.validate_protocol_message(invalid_message)
        
        self.assertFalse(is_valid)
        self.assertIsNotNone(errors)
    
    def test_process_boundary_request(self):
        """Test processing a boundary request message."""
        # Create a boundary request message
        message = {
            "message_id": f"msg-{uuid.uuid4().hex}",
            "message_type": "boundary_request",
            "sender_instance_id": "source-001",
            "recipient_instance_id": self.instance_id,
            "timestamp": datetime.utcnow().isoformat() + 'Z',
            "payload": {
                "source_instance_id": "source-001",
                "target_instance_id": self.instance_id,
                "trust_level": 80,
                "request_id": f"req-{uuid.uuid4().hex}"
            }
        }
        
        # Mock the trust boundary manager to return a boundary
        boundary_id = f"tb-{uuid.uuid4().hex}"
        self.trust_boundary_manager.create_boundary.return_value = {
            "boundary_id": boundary_id,
            "source_instance_id": "source-001",
            "target_instance_id": self.instance_id,
            "trust_level": 80,
            "status": "active"
        }
        
        # Process the message
        response = self.protocol.process_message(message)
        
        # Verify the response
        self.assertIsNotNone(response)
        self.assertEqual(response["message_type"], "boundary_response")
        self.assertEqual(response["recipient_instance_id"], "source-001")
        self.assertEqual(response["payload"]["request_id"], message["payload"]["request_id"])
        self.assertEqual(response["payload"]["status"], "approved")
        self.assertEqual(response["payload"]["boundary_id"], boundary_id)
        
        # Verify the trust boundary manager was called
        self.trust_boundary_manager.create_boundary.assert_called_once_with(
            source_instance_id="source-001",
            target_instance_id=self.instance_id,
            trust_level=80
        )
    
    def test_process_attestation_request(self):
        """Test processing an attestation request message."""
        # Create an attestation request message
        message = {
            "message_id": f"msg-{uuid.uuid4().hex}",
            "message_type": "attestation_request",
            "sender_instance_id": "source-001",
            "recipient_instance_id": self.instance_id,
            "timestamp": datetime.utcnow().isoformat() + 'Z',
            "payload": {
                "attestation_type": "identity",
                "subject_instance_id": self.instance_id,
                "request_id": f"req-{uuid.uuid4().hex}"
            }
        }
        
        # Mock the attestation service
        self.protocol.attestation_service = MagicMock()
        attestation_id = f"att-{uuid.uuid4().hex}"
        self.protocol.attestation_service.create_attestation.return_value = {
            "attestation_id": attestation_id,
            "attestation_type": "identity",
            "subject_instance_id": self.instance_id,
            "attester_instance_id": self.instance_id,
            "attestation_data": {"identity": "test-identity"}
        }
        
        # Process the message
        response = self.protocol.process_message(message)
        
        # Verify the response
        self.assertIsNotNone(response)
        self.assertEqual(response["message_type"], "attestation_response")
        self.assertEqual(response["recipient_instance_id"], "source-001")
        self.assertEqual(response["payload"]["request_id"], message["payload"]["request_id"])
        self.assertEqual(response["payload"]["status"], "approved")
        self.assertEqual(response["payload"]["attestation_id"], attestation_id)
    
    def test_process_trust_verification(self):
        """Test processing a trust verification message."""
        # Create a trust verification message
        message = {
            "message_id": f"msg-{uuid.uuid4().hex}",
            "message_type": "trust_verification",
            "sender_instance_id": "source-001",
            "recipient_instance_id": self.instance_id,
            "timestamp": datetime.utcnow().isoformat() + 'Z',
            "payload": {
                "verification_type": "boundary",
                "boundary_id": f"tb-{uuid.uuid4().hex}",
                "request_id": f"req-{uuid.uuid4().hex}"
            }
        }
        
        # Mock the trust boundary manager to return a boundary
        self.trust_boundary_manager.get_boundary.return_value = {
            "boundary_id": message["payload"]["boundary_id"],
            "source_instance_id": "source-001",
            "target_instance_id": self.instance_id,
            "trust_level": 80,
            "status": "active"
        }
        
        # Process the message
        response = self.protocol.process_message(message)
        
        # Verify the response
        self.assertIsNotNone(response)
        self.assertEqual(response["message_type"], "trust_verification_response")
        self.assertEqual(response["recipient_instance_id"], "source-001")
        self.assertEqual(response["payload"]["request_id"], message["payload"]["request_id"])
        self.assertEqual(response["payload"]["status"], "verified")
        self.assertEqual(response["payload"]["boundary_id"], message["payload"]["boundary_id"])
    
    def test_sign_and_verify_message(self):
        """Test signing and verifying a message."""
        # Create a message
        message = self.protocol.create_protocol_message(
            message_type="test",
            payload={"test": "data"}
        )
        
        # Sign the message
        signed_message = self.protocol.sign_message(message)
        
        # Verify the signature was added
        self.assertIn("signature", signed_message)
        
        # Verify the signature
        is_valid = self.protocol.verify_message_signature(signed_message)
        self.assertTrue(is_valid)
        
        # Test with a tampered message
        tampered_message = signed_message.copy()
        tampered_message["payload"]["test"] = "tampered"
        
        is_valid = self.protocol.verify_message_signature(tampered_message)
        self.assertFalse(is_valid)
    
    def test_codex_tether_check(self):
        """Test Codex Contract tethering check."""
        result = self.protocol._codex_tether_check()
        
        self.assertIsNotNone(result)
        self.assertEqual(result["codex_contract_version"], "v2025.05.18")
        self.assertEqual(result["phase_id"], "5.6")
        self.assertIn("5.6", result["clauses"])
        self.assertEqual(result["component"], "TrustSurfaceProtocol")
        self.assertEqual(result["status"], "compliant")

if __name__ == "__main__":
    unittest.main()
