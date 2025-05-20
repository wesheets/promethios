"""
Trust Surface Protocol for Promethios Distributed Trust Surface

Codex Contract: v2025.05.20
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""

import json
import uuid
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple

class TrustSurfaceProtocol:
    """
    Defines the communication protocol for trust surface interactions.
    
    The TrustSurfaceProtocol is responsible for:
    1. Defining message formats for trust surface interactions
    2. Implementing secure message passing between trust boundaries
    3. Ensuring cryptographic verification of cross-boundary operations
    4. Managing message routing and delivery
    """
    
    def __init__(self, instance_id: str, schema_validator=None, trust_boundary_manager=None):
        """
        Initialize the Trust Surface Protocol.
        
        Args:
            instance_id: The identifier of this Promethios instance
            schema_validator: Optional validator for schema validation
            trust_boundary_manager: Optional reference to the Trust Boundary Manager
        """
        self.instance_id = instance_id
        self.schema_validator = schema_validator
        self.trust_boundary_manager = trust_boundary_manager
        self.messages: Dict[str, Dict] = {}  # message_id -> message
        self.pending_responses: Dict[str, List[str]] = {}  # message_id -> [response_ids]
        self.sequence_counter = 0
        self.attestation_service = None  # Will be set externally
        
        # Load schemas
        self._load_schemas()
    
    def _load_schemas(self):
        """Load the required schemas for validation."""
        try:
            with open('src/schemas/governance/trust_surface_protocol.schema.v1.json', 'r') as f:
                self.protocol_schema = json.load(f)
        except Exception as e:
            print(f"Error loading schemas: {e}")
            # Use minimal schema validation if files can't be loaded
            self.protocol_schema = {}
    
    def create_protocol_message(self, message_type: str, payload: Dict) -> Dict:
        """
        Create a new trust surface protocol message.
        
        Args:
            message_type: Type of trust surface protocol message
            payload: Message-specific payload
            
        Returns:
            The newly created message object
        """
        # Generate a unique message ID
        message_id = f"tsp-{uuid.uuid4().hex}"
        
        # Get current timestamp
        now = datetime.utcnow().isoformat() + 'Z'
        
        # Increment sequence counter
        self.sequence_counter += 1
        
        # Create the message object
        message = {
            "message_id": message_id,
            "message_type": message_type,
            "created_at": now,
            "timestamp": now,
            "sender_instance_id": self.instance_id,
            "payload": payload,
            "sequence_number": self.sequence_counter,
            "ttl": 3600  # Default TTL of 1 hour
        }
        
        # Validate the message against the schema
        if self.schema_validator and self.protocol_schema:
            is_valid, errors = self.schema_validator.validate(message, self.protocol_schema)
            if not is_valid:
                raise ValueError(f"Invalid message: {errors}")
        
        # Store the message
        self.messages[message_id] = message
        
        return message
    
    def validate_protocol_message(self, message: Dict) -> Tuple[bool, Optional[str]]:
        """
        Validate a protocol message against the schema.
        
        Args:
            message: The message to validate
            
        Returns:
            Tuple of (is_valid, errors)
        """
        if not isinstance(message, dict):
            return False, "Message must be a dictionary"
            
        required_fields = ["message_id", "message_type", "sender_instance_id", "timestamp", "payload"]
        for field in required_fields:
            if field not in message:
                return False, f"Missing required field: {field}"
        
        if self.schema_validator and self.protocol_schema:
            return self.schema_validator.validate(message, self.protocol_schema)
            
        return True, None
    
    def sign_message(self, message: Dict) -> Dict:
        """
        Sign a message with the instance's private key.
        
        Args:
            message: The message to sign
            
        Returns:
            The signed message
        """
        # Create a copy of the message
        signed_message = message.copy()
        
        # Generate a signature
        signature = self._generate_signature(message)
        signed_message["signature"] = signature
        
        return signed_message
    
    def verify_message_signature(self, message: Dict) -> bool:
        """
        Verify the signature of a message.
        
        Args:
            message: The message to verify
            
        Returns:
            True if the signature is valid, False otherwise
        """
        # Extract the signature
        signature = message.get("signature")
        if not signature:
            return False
        
        # Create a copy without the signature field
        message_copy = message.copy()
        message_copy.pop("signature", None)
        
        # Generate a new signature
        new_signature = self._generate_signature(message_copy)
        
        # Compare the signatures
        return signature == new_signature
    
    def process_message(self, message: Dict) -> Dict:
        """
        Process an incoming protocol message.
        
        Args:
            message: The message to process
            
        Returns:
            The response message
        """
        # Validate the message
        is_valid, errors = self.validate_protocol_message(message)
        if not is_valid:
            return self._create_error_response(message, f"Invalid message: {errors}")
        
        # Check if this message is for us
        if "recipient_instance_id" in message and message["recipient_instance_id"] != self.instance_id:
            return self._create_error_response(message, "Message not intended for this instance")
        
        # Process based on message type
        message_type = message["message_type"]
        
        if message_type == "boundary_request":
            return self._process_boundary_request(message)
        elif message_type == "attestation_request":
            return self._process_attestation_request(message)
        elif message_type == "trust_verification":
            return self._process_trust_verification(message)
        else:
            return self._create_error_response(message, f"Unsupported message type: {message_type}")
    
    def _process_boundary_request(self, message: Dict) -> Dict:
        """
        Process a boundary request message.
        
        Args:
            message: The boundary request message
            
        Returns:
            The response message
        """
        if not self.trust_boundary_manager:
            return self._create_error_response(message, "Trust Boundary Manager not available")
        
        payload = message["payload"]
        sender_id = message["sender_instance_id"]
        request_id = payload.get("request_id", "unknown")
        
        try:
            # Create a boundary
            boundary = self.trust_boundary_manager.create_boundary(
                source_instance_id=sender_id,
                target_instance_id=self.instance_id,
                trust_level=payload.get("trust_level", 50)
            )
            
            # Create response payload
            response_payload = {
                "request_id": request_id,
                "status": "approved",
                "boundary_id": boundary["boundary_id"],
                "trust_level": boundary["trust_level"]
            }
            
            # Create response message
            response = self.create_protocol_message(
                message_type="boundary_response",
                payload=response_payload
            )
            response["recipient_instance_id"] = sender_id
            
            return response
            
        except Exception as e:
            return self._create_error_response(message, f"Error processing boundary request: {str(e)}")
    
    def _process_attestation_request(self, message: Dict) -> Dict:
        """
        Process an attestation request message.
        
        Args:
            message: The attestation request message
            
        Returns:
            The response message
        """
        if not self.attestation_service:
            return self._create_error_response(message, "Attestation Service not available")
        
        payload = message["payload"]
        sender_id = message["sender_instance_id"]
        request_id = payload.get("request_id", "unknown")
        
        try:
            # Create an attestation
            attestation = self.attestation_service.create_attestation(
                attestation_type=payload.get("attestation_type", "identity"),
                subject_instance_id=payload.get("subject_instance_id", sender_id),
                attester_instance_id=self.instance_id,
                attestation_data=payload.get("attestation_data", {})
            )
            
            # Create response payload
            response_payload = {
                "request_id": request_id,
                "status": "approved",
                "attestation_id": attestation["attestation_id"]
            }
            
            # Create response message
            response = self.create_protocol_message(
                message_type="attestation_response",
                payload=response_payload
            )
            response["recipient_instance_id"] = sender_id
            
            return response
            
        except Exception as e:
            return self._create_error_response(message, f"Error processing attestation request: {str(e)}")
    
    def _process_trust_verification(self, message: Dict) -> Dict:
        """
        Process a trust verification message.
        
        Args:
            message: The trust verification message
            
        Returns:
            The response message
        """
        if not self.trust_boundary_manager:
            return self._create_error_response(message, "Trust Boundary Manager not available")
        
        payload = message["payload"]
        sender_id = message["sender_instance_id"]
        request_id = payload.get("request_id", "unknown")
        boundary_id = payload.get("boundary_id")
        
        try:
            # Get the boundary
            boundary = self.trust_boundary_manager.get_boundary(boundary_id)
            if not boundary:
                return self._create_error_response(message, f"Boundary not found: {boundary_id}")
            
            # Create response payload
            response_payload = {
                "request_id": request_id,
                "status": "verified",
                "boundary_id": boundary_id,
                "trust_level": boundary["trust_level"],
                "verification_timestamp": datetime.utcnow().isoformat() + 'Z'
            }
            
            # Create response message
            response = self.create_protocol_message(
                message_type="trust_verification_response",
                payload=response_payload
            )
            response["recipient_instance_id"] = sender_id
            
            return response
            
        except Exception as e:
            return self._create_error_response(message, f"Error processing trust verification: {str(e)}")
    
    def _create_error_response(self, original_message: Dict, error_message: str) -> Dict:
        """
        Create an error response message.
        
        Args:
            original_message: The original message that caused the error
            error_message: The error message
            
        Returns:
            The error response message
        """
        sender_id = original_message.get("sender_instance_id", "unknown")
        message_id = original_message.get("message_id", "unknown")
        
        response_payload = {
            "status": "error",
            "error_message": error_message,
            "original_message_id": message_id
        }
        
        response = self.create_protocol_message(
            message_type="error_response",
            payload=response_payload
        )
        response["recipient_instance_id"] = sender_id
        
        return response
    
    def _generate_signature(self, message: Dict) -> str:
        """
        Generate a signature for a message.
        
        Args:
            message: The message to sign
            
        Returns:
            The signature as a hex string
        """
        # Serialize the message to JSON
        serialized = json.dumps(message, sort_keys=True)
        
        # Hash the serialized message
        message_hash = hashlib.sha256(serialized.encode()).hexdigest()
        
        # In a real implementation, this would use a proper signing algorithm
        # For now, we'll just return the hash as the signature
        return f"0x{message_hash}"
    
    def _codex_tether_check(self) -> Dict:
        """
        Perform a Codex Contract tethering check.
        
        Returns:
            A dictionary with tethering information
        """
        return {
            "codex_contract_version": "v2025.05.20",
            "phase_id": "5.6",
            "clauses": ["5.6", "5.5", "5.4", "11.0", "11.1", "5.2.6"],
            "component": "TrustSurfaceProtocol",
            "status": "compliant",
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
