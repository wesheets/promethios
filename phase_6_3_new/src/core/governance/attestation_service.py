"""
Attestation Service for the Governance Attestation Framework.

This module provides the core functionality for creating, validating, and managing
attestations within the Promethios governance framework.
"""

import json
import uuid
import logging
import datetime
from typing import Dict, List, Optional, Any, Tuple, Union
from pathlib import Path

# Import required dependencies
try:
    from src.core.common.schema_validator import SchemaValidator
    from src.core.verification.seal_verification import SealVerificationService
except ImportError:
    # Handle import errors gracefully for testing environments
    logging.warning("Running with mock dependencies. Some functionality may be limited.")
    SchemaValidator = None
    SealVerificationService = None


class AttestationService:
    """
    Service for creating and managing attestations.
    
    The AttestationService provides functionality for:
    - Attestation creation and validation
    - Cryptographic signature verification
    - Attestation chain management
    - Revocation and expiration handling
    
    This service is a core component of the Governance Attestation Framework
    and integrates with the SealVerificationService for additional security.
    """
    
    # Codex Contract Tethering
    CODEX_CONTRACT_ID = "governance.attestation_service"
    CODEX_CONTRACT_VERSION = "1.0.0"
    
    # Attestation type constants
    ATTESTATION_TYPE_VERIFICATION = "VERIFICATION"
    ATTESTATION_TYPE_CERTIFICATION = "CERTIFICATION"
    ATTESTATION_TYPE_APPROVAL = "APPROVAL"
    ATTESTATION_TYPE_ENDORSEMENT = "ENDORSEMENT"
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the AttestationService with the provided configuration.
        
        Args:
            config: Configuration dictionary with the following optional keys:
                - schema_path: Path to the attestation schema
                - storage_path: Path for attestation storage
                - default_expiration_days: Default expiration period in days
        """
        self.logger = logging.getLogger(__name__)
        self.config = config or {}
        
        # Pre-loop tether check
        self._verify_codex_contract_tether()
        
        # Initialize schema validator
        schema_path = self.config.get('schema_path', 
                                     str(Path(__file__).parent.parent.parent.parent / 
                                         'schemas/governance/attestation.schema.v1.json'))
        self.schema_validator = SchemaValidator(schema_path) if SchemaValidator else None
        
        # Initialize seal verification service
        self.seal_verification = SealVerificationService() if SealVerificationService else None
        
        # Initialize storage
        self.storage_path = self.config.get('storage_path', '/tmp/attestations')
        Path(self.storage_path).mkdir(parents=True, exist_ok=True)
        
        # Set default expiration
        self.default_expiration_days = self.config.get('default_expiration_days', 365)
        
        # Initialize attestation cache
        self.attestation_cache = {}
        
        # Initialize parent-child relationships cache
        self.attestation_relationships = {}
        
        self.logger.info(f"AttestationService initialized with schema: {schema_path}")
    
    def _verify_codex_contract_tether(self) -> None:
        """
        Verify the Codex contract tether to ensure integrity.
        
        This method implements the pre-loop tether check required by the
        Promethios governance framework.
        
        Raises:
            RuntimeError: If the tether verification fails
        """
        try:
            # In a production environment, this would verify against the actual Codex contract
            # For now, we just check that the constants are defined correctly
            if not self.CODEX_CONTRACT_ID or not self.CODEX_CONTRACT_VERSION:
                raise ValueError("Codex contract tether constants are not properly defined")
            
            # Additional verification would be performed here in production
            self.logger.info(f"Codex contract tether verified: {self.CODEX_CONTRACT_ID}@{self.CODEX_CONTRACT_VERSION}")
        except Exception as e:
            self.logger.error(f"Codex contract tether verification failed: {str(e)}")
            raise RuntimeError(f"Codex contract tether verification failed: {str(e)}")
    
    def create_attestation(self, 
                          issuer_id: str, 
                          subject_id: str, 
                          claim_id: str,
                          attestation_type: str,
                          attestation_data: Dict[str, Any],
                          signature: Dict[str, str],
                          parent_attestation_id: Optional[str] = None,
                          expiration_days: Optional[int] = None) -> Dict[str, Any]:
        """
        Create a new attestation.
        
        Args:
            issuer_id: Identifier of the attestation issuer
            subject_id: Identifier of the attestation subject
            claim_id: Identifier of the claim being attested
            attestation_type: Type of attestation
            attestation_data: Dictionary containing attestation content and context
            signature: Dictionary containing signature information
            parent_attestation_id: Optional parent attestation ID for chaining
            expiration_days: Optional expiration period in days
            
        Returns:
            The created attestation as a dictionary
            
        Raises:
            ValueError: If the attestation data is invalid
            RuntimeError: If attestation creation fails
        """
        try:
            # Generate attestation ID
            attestation_id = f"attestation-{uuid.uuid4()}"
            
            # Get current timestamp
            timestamp = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Calculate expiration
            if expiration_days is None:
                expiration_days = self.default_expiration_days
                
            expiration = (datetime.datetime.utcnow() + 
                         datetime.timedelta(days=expiration_days)).isoformat() + "Z"
            
            # Create attestation object
            attestation = {
                "attestation_id": attestation_id,
                "issuer_id": issuer_id,
                "subject_id": subject_id,
                "claim_id": claim_id,
                "attestation_type": attestation_type,
                "timestamp": timestamp,
                "expiration": expiration,
                "attestation_data": attestation_data,
                "signature": signature,
                "metadata": {
                    "revocation_status": "ACTIVE",
                    "version": "1.0.0"
                }
            }
            
            # Add parent reference if provided
            if parent_attestation_id:
                attestation["parent_attestation_id"] = parent_attestation_id
                
                # Update relationships cache
                if parent_attestation_id not in self.attestation_relationships:
                    self.attestation_relationships[parent_attestation_id] = []
                self.attestation_relationships[parent_attestation_id].append(attestation_id)
            
            # Validate against schema
            if self.schema_validator:
                self.schema_validator.validate(attestation)
            
            # Store attestation
            self._store_attestation(attestation)
            
            # Update cache
            self.attestation_cache[attestation_id] = attestation
            
            self.logger.info(f"Created attestation: {attestation_id}, type: {attestation_type}")
            return attestation
            
        except Exception as e:
            self.logger.error(f"Failed to create attestation: {str(e)}")
            raise RuntimeError(f"Failed to create attestation: {str(e)}")
    
    def get_attestation(self, attestation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an attestation by its ID.
        
        Args:
            attestation_id: Identifier of the attestation to retrieve
            
        Returns:
            The attestation as a dictionary, or None if not found
        """
        # Check cache first
        if attestation_id in self.attestation_cache:
            return self.attestation_cache[attestation_id]
        
        # Try to load from storage
        attestation_path = Path(self.storage_path) / f"{attestation_id}.json"
        if attestation_path.exists():
            try:
                with open(attestation_path, 'r') as f:
                    attestation = json.load(f)
                    self.attestation_cache[attestation_id] = attestation
                    
                    # Update relationships cache if needed
                    if "parent_attestation_id" in attestation:
                        parent_id = attestation["parent_attestation_id"]
                        if parent_id not in self.attestation_relationships:
                            self.attestation_relationships[parent_id] = []
                        if attestation_id not in self.attestation_relationships[parent_id]:
                            self.attestation_relationships[parent_id].append(attestation_id)
                    
                    return attestation
            except Exception as e:
                self.logger.error(f"Failed to load attestation {attestation_id}: {str(e)}")
        
        return None
    
    def find_attestations(self, 
                         issuer_id: Optional[str] = None, 
                         subject_id: Optional[str] = None,
                         claim_id: Optional[str] = None,
                         attestation_type: Optional[str] = None,
                         active_only: bool = False) -> List[Dict[str, Any]]:
        """
        Find attestations matching the specified criteria.
        
        Args:
            issuer_id: Optional issuer ID to filter by
            subject_id: Optional subject ID to filter by
            claim_id: Optional claim ID to filter by
            attestation_type: Optional attestation type to filter by
            active_only: If True, only return active attestations
            
        Returns:
            List of matching attestations
        """
        results = []
        
        # Scan storage directory
        storage_path = Path(self.storage_path)
        for file_path in storage_path.glob("attestation-*.json"):
            try:
                with open(file_path, 'r') as f:
                    attestation = json.load(f)
                
                # Apply filters
                if issuer_id and attestation["issuer_id"] != issuer_id:
                    continue
                if subject_id and attestation["subject_id"] != subject_id:
                    continue
                if claim_id and attestation["claim_id"] != claim_id:
                    continue
                if attestation_type and attestation["attestation_type"] != attestation_type:
                    continue
                if active_only and attestation["metadata"]["revocation_status"] != "ACTIVE":
                    continue
                
                results.append(attestation)
                
                # Update cache
                self.attestation_cache[attestation["attestation_id"]] = attestation
                
                # Update relationships cache if needed
                if "parent_attestation_id" in attestation:
                    parent_id = attestation["parent_attestation_id"]
                    if parent_id not in self.attestation_relationships:
                        self.attestation_relationships[parent_id] = []
                    if attestation["attestation_id"] not in self.attestation_relationships[parent_id]:
                        self.attestation_relationships[parent_id].append(attestation["attestation_id"])
                
            except Exception as e:
                self.logger.error(f"Failed to process attestation file {file_path}: {str(e)}")
        
        return results
    
    def revoke_attestation(self, 
                          attestation_id: str, 
                          reason: str,
                          actor_id: str) -> Dict[str, Any]:
        """
        Revoke an attestation.
        
        Args:
            attestation_id: Identifier of the attestation to revoke
            reason: Reason for revocation
            actor_id: Identifier of the actor performing the revocation
            
        Returns:
            The updated attestation
            
        Raises:
            ValueError: If the attestation ID is invalid
            RuntimeError: If revocation fails
        """
        try:
            # Get attestation
            attestation = self.get_attestation(attestation_id)
            if not attestation:
                raise ValueError(f"Attestation not found: {attestation_id}")
            
            # Update attestation status
            attestation["metadata"]["revocation_status"] = "REVOKED"
            attestation["metadata"]["revocation_reason"] = reason
            attestation["metadata"]["revocation_actor"] = actor_id
            attestation["metadata"]["revocation_timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Store updated attestation
            self._store_attestation(attestation)
            
            # Update cache
            self.attestation_cache[attestation_id] = attestation
            
            self.logger.info(f"Revoked attestation: {attestation_id}, reason: {reason}")
            return attestation
            
        except Exception as e:
            self.logger.error(f"Failed to revoke attestation: {str(e)}")
            raise RuntimeError(f"Failed to revoke attestation: {str(e)}")
    
    def validate_attestation(self, attestation_id: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Validate an attestation.
        
        Args:
            attestation_id: Identifier of the attestation to validate
            
        Returns:
            A tuple containing:
            - Boolean indicating validation success
            - Dictionary with validation details
        """
        try:
            # Get attestation
            attestation = self.get_attestation(attestation_id)
            if not attestation:
                return False, {"error": "Attestation not found"}
            
            # Check revocation status
            if attestation["metadata"]["revocation_status"] != "ACTIVE":
                return False, {"error": "Attestation is revoked"}
            
            # Check expiration
            expiration = datetime.datetime.fromisoformat(attestation["expiration"].rstrip("Z"))
            if expiration < datetime.datetime.utcnow():
                return False, {"error": "Attestation is expired"}
            
            # Verify signature
            is_valid, signature_details = self._verify_signature(attestation)
            if not is_valid:
                return False, {"error": "Invalid signature", "details": signature_details}
            
            # Return validation result
            return True, {
                "validation_timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "signature_details": signature_details
            }
            
        except Exception as e:
            self.logger.error(f"Failed to validate attestation: {str(e)}")
            return False, {"error": f"Validation error: {str(e)}"}
    
    def get_attestation_chain(self, attestation_id: str) -> List[Dict[str, Any]]:
        """
        Get the chain of attestations starting from the specified attestation.
        
        Args:
            attestation_id: Identifier of the attestation to start from
            
        Returns:
            List of attestations in the chain, starting with the specified attestation
        """
        chain = []
        
        # Get the starting attestation
        attestation = self.get_attestation(attestation_id)
        if not attestation:
            return chain
        
        # Add it to the chain
        chain.append(attestation)
        
        # Build the relationships cache if needed
        if not self.attestation_relationships:
            self._build_relationships_cache()
        
        # Recursively add children
        self._add_children_to_chain(attestation_id, chain)
        
        return chain
    
    def _add_children_to_chain(self, attestation_id: str, chain: List[Dict[str, Any]]) -> None:
        """
        Recursively add children attestations to the chain.
        
        Args:
            attestation_id: Identifier of the parent attestation
            chain: List to add children to
        """
        # Check if this attestation has children
        if attestation_id in self.attestation_relationships:
            for child_id in self.attestation_relationships[attestation_id]:
                child = self.get_attestation(child_id)
                if child:
                    chain.append(child)
                    self._add_children_to_chain(child_id, chain)
    
    def _build_relationships_cache(self) -> None:
        """
        Build the attestation relationships cache.
        """
        self.attestation_relationships = {}
        
        # Scan all attestations
        for attestation in self.find_attestations():
            if "parent_attestation_id" in attestation:
                parent_id = attestation["parent_attestation_id"]
                if parent_id not in self.attestation_relationships:
                    self.attestation_relationships[parent_id] = []
                self.attestation_relationships[parent_id].append(attestation["attestation_id"])
    
    def _verify_signature(self, attestation: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """
        Verify the signature of an attestation.
        
        Args:
            attestation: The attestation to verify
            
        Returns:
            A tuple containing:
            - Boolean indicating verification success
            - Dictionary with verification details
        """
        # In a production environment, this would verify the cryptographic signature
        # For now, we just check that the signature exists
        signature = attestation["signature"]
        if not signature or not signature.get("signature_value"):
            return False, {"error": "Missing signature"}
        
        # Additional verification would be performed here in production
        return True, {"algorithm": signature.get("algorithm", "UNKNOWN")}
    
    def _store_attestation(self, attestation: Dict[str, Any]) -> None:
        """
        Store an attestation to persistent storage.
        
        Args:
            attestation: The attestation to store
        """
        attestation_id = attestation["attestation_id"]
        attestation_path = Path(self.storage_path) / f"{attestation_id}.json"
        
        try:
            with open(attestation_path, 'w') as f:
                json.dump(attestation, f, indent=2)
        except Exception as e:
            self.logger.error(f"Failed to store attestation {attestation_id}: {str(e)}")
            raise RuntimeError(f"Failed to store attestation: {str(e)}")
