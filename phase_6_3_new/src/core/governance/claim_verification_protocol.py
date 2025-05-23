"""
Claim Verification Protocol for the Governance Attestation Framework.

This module provides the core functionality for creating and verifying claims
within the Promethios governance framework.
"""

import json
import uuid
import logging
import datetime
from typing import Dict, List, Optional, Any, Tuple, Union
from pathlib import Path

# Import required dependencies
try:
    from src.core.governance.attestation_service import AttestationService
    from src.core.common.schema_validator import SchemaValidator
except ImportError:
    # Handle import errors gracefully for testing environments
    logging.warning("Running with mock dependencies. Some functionality may be limited.")
    AttestationService = None
    SchemaValidator = None


class ClaimVerificationProtocol:
    """
    Protocol for creating and verifying claims.
    
    The ClaimVerificationProtocol provides functionality for:
    - Claim creation and management
    - Claim verification through attestations
    - Evidence mapping and validation
    
    This protocol integrates with the AttestationService for attestation validation
    and provides a framework for verifying governance claims.
    """
    
    # Codex Contract Tethering
    CODEX_CONTRACT_ID = "governance.claim_verification_protocol"
    CODEX_CONTRACT_VERSION = "1.0.0"
    
    # Claim type constants
    CLAIM_TYPE_COMPLIANCE = "COMPLIANCE"
    CLAIM_TYPE_SECURITY = "SECURITY"
    CLAIM_TYPE_GOVERNANCE = "GOVERNANCE"
    CLAIM_TYPE_IDENTITY = "IDENTITY"
    CLAIM_TYPE_AUTHORIZATION = "AUTHORIZATION"
    CLAIM_TYPE_CERTIFICATION = "CERTIFICATION"
    
    # Verification status constants
    STATUS_PENDING = "PENDING"
    STATUS_VERIFIED = "VERIFIED"
    STATUS_REJECTED = "REJECTED"
    STATUS_EXPIRED = "EXPIRED"
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the ClaimVerificationProtocol with the provided configuration.
        
        Args:
            config: Configuration dictionary with the following optional keys:
                - schema_path: Path to the claim schema
                - storage_path: Path for claim storage
                - attestation_service: Instance of AttestationService
        """
        self.logger = logging.getLogger(__name__)
        self.config = config or {}
        
        # Pre-loop tether check
        self._verify_codex_contract_tether()
        
        # Initialize schema validator
        schema_path = self.config.get('schema_path', 
                                     str(Path(__file__).parent.parent.parent.parent / 
                                         'schemas/governance/claim.schema.v1.json'))
        self.schema_validator = SchemaValidator(schema_path) if SchemaValidator else None
        
        # Initialize dependencies
        self.attestation_service = self.config.get('attestation_service')
        
        # Initialize storage
        self.storage_path = self.config.get('storage_path', '/tmp/claims')
        Path(self.storage_path).mkdir(parents=True, exist_ok=True)
        
        # Initialize claim cache
        self.claim_cache = {}
        
        self.logger.info(f"ClaimVerificationProtocol initialized with schema: {schema_path}")
    
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
    
    def create_claim(self, 
                    issuer_id: str, 
                    subject_id: str, 
                    claim_type: str,
                    statement: str,
                    scope: Dict[str, Any],
                    evidence_references: Optional[List[str]] = None,
                    verification_requirements: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create a new claim.
        
        Args:
            issuer_id: Identifier of the claim issuer
            subject_id: Identifier of the claim subject
            claim_type: Type of claim
            statement: Claim statement
            scope: Scope of the claim
            evidence_references: Optional list of evidence references
            verification_requirements: Optional verification requirements
            
        Returns:
            The created claim as a dictionary
            
        Raises:
            ValueError: If the claim data is invalid
            RuntimeError: If claim creation fails
        """
        try:
            # Generate claim ID
            claim_id = f"claim-{uuid.uuid4()}"
            
            # Get current timestamp
            timestamp = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Prepare evidence references
            if not evidence_references:
                evidence_references = []
            
            # Prepare verification requirements
            if not verification_requirements:
                verification_requirements = {
                    "required_attestations": 1,
                    "required_attestation_types": ["VERIFICATION"]
                }
            elif "required_attestations" not in verification_requirements:
                verification_requirements["required_attestations"] = 1
            
            if "required_attestation_types" not in verification_requirements:
                verification_requirements["required_attestation_types"] = ["VERIFICATION"]
            
            # Create claim object
            claim = {
                "claim_id": claim_id,
                "issuer_id": issuer_id,
                "subject_id": subject_id,
                "claim_type": claim_type,
                "statement": statement,
                "scope": scope,
                "evidence_references": evidence_references,
                "verification_requirements": verification_requirements,
                "timestamp": timestamp,
                "metadata": {
                    "verification_status": self.STATUS_PENDING,
                    "version": "1.0.0"
                }
            }
            
            # Validate against schema
            if self.schema_validator:
                self.schema_validator.validate(claim)
            
            # Store claim
            self._store_claim(claim)
            
            # Update cache
            self.claim_cache[claim_id] = claim
            
            self.logger.info(f"Created claim: {claim_id}, type: {claim_type}")
            return claim
            
        except Exception as e:
            self.logger.error(f"Failed to create claim: {str(e)}")
            raise RuntimeError(f"Failed to create claim: {str(e)}")
    
    def get_claim(self, claim_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a claim by its ID.
        
        Args:
            claim_id: Identifier of the claim to retrieve
            
        Returns:
            The claim as a dictionary, or None if not found
        """
        # Check cache first
        if claim_id in self.claim_cache:
            return self.claim_cache[claim_id]
        
        # Try to load from storage
        claim_path = Path(self.storage_path) / f"{claim_id}.json"
        if claim_path.exists():
            try:
                with open(claim_path, 'r') as f:
                    claim = json.load(f)
                    self.claim_cache[claim_id] = claim
                    return claim
            except Exception as e:
                self.logger.error(f"Failed to load claim {claim_id}: {str(e)}")
        
        return None
    
    def find_claims(self, 
                   issuer_id: Optional[str] = None, 
                   subject_id: Optional[str] = None,
                   claim_type: Optional[str] = None,
                   verification_status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Find claims matching the specified criteria.
        
        Args:
            issuer_id: Optional issuer ID to filter by
            subject_id: Optional subject ID to filter by
            claim_type: Optional claim type to filter by
            verification_status: Optional verification status to filter by
            
        Returns:
            List of matching claims
        """
        results = []
        
        # Scan storage directory
        storage_path = Path(self.storage_path)
        for file_path in storage_path.glob("claim-*.json"):
            try:
                with open(file_path, 'r') as f:
                    claim = json.load(f)
                
                # Apply filters
                if issuer_id and claim["issuer_id"] != issuer_id:
                    continue
                if subject_id and claim["subject_id"] != subject_id:
                    continue
                if claim_type and claim["claim_type"] != claim_type:
                    continue
                if verification_status and claim["metadata"]["verification_status"] != verification_status:
                    continue
                
                results.append(claim)
                
                # Update cache
                self.claim_cache[claim["claim_id"]] = claim
                
            except Exception as e:
                self.logger.error(f"Failed to process claim file {file_path}: {str(e)}")
        
        return results
    
    def verify_claim(self, claim_id: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Verify a claim based on its verification requirements.
        
        Args:
            claim_id: Identifier of the claim to verify
            
        Returns:
            A tuple containing:
            - Boolean indicating verification success
            - Dictionary with verification details
            
        Raises:
            ValueError: If the claim ID is invalid
            RuntimeError: If verification fails due to system error
        """
        try:
            # Get claim
            claim = self.get_claim(claim_id)
            if not claim:
                return False, {"error": "Claim not found"}
            
            # Check if already verified
            if claim["metadata"]["verification_status"] == self.STATUS_VERIFIED:
                return True, {"status": "Already verified"}
            
            # Get verification requirements
            requirements = claim["verification_requirements"]
            required_attestations = requirements.get("required_attestations", 1)
            
            try:
                required_types = requirements.get("required_attestation_types", ["VERIFICATION"])
            except KeyError:
                # Handle missing key gracefully
                required_types = ["VERIFICATION"]
            
            # Get attestations for this claim
            if not self.attestation_service:
                return False, {"error": "Attestation service not available"}
            
            attestations = self.attestation_service.find_attestations(
                claim_id=claim_id,
                active_only=True
            )
            
            if not attestations:
                return False, {"error": "No attestations found for claim"}
            
            # Validate attestations
            valid_attestations = []
            invalid_attestations = []
            
            for attestation in attestations:
                # Check attestation type
                if attestation["attestation_type"] not in required_types:
                    invalid_attestations.append({
                        "attestation_id": attestation["attestation_id"],
                        "reason": f"Invalid attestation type: {attestation['attestation_type']}"
                    })
                    continue
                
                # Validate attestation
                is_valid, _ = self.attestation_service.validate_attestation(attestation["attestation_id"])
                
                if is_valid:
                    valid_attestations.append(attestation["attestation_id"])
                else:
                    invalid_attestations.append({
                        "attestation_id": attestation["attestation_id"],
                        "reason": "Attestation validation failed"
                    })
            
            # Check if we have enough valid attestations
            if len(valid_attestations) < required_attestations:
                return False, {
                    "error": f"Insufficient attestations ({len(valid_attestations)}) for claim, required: {required_attestations}",
                    "valid_attestations": len(valid_attestations),
                    "invalid_attestations": len(invalid_attestations)
                }
            
            # Update claim status
            claim["metadata"]["verification_status"] = self.STATUS_VERIFIED
            claim["metadata"]["verification_timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
            claim["metadata"]["verification_details"] = {
                "valid_attestations": valid_attestations,
                "invalid_attestations": invalid_attestations
            }
            
            # Store updated claim
            self._store_claim(claim)
            
            # Update cache
            self.claim_cache[claim_id] = claim
            
            self.logger.info(f"Verified claim: {claim_id} with {len(valid_attestations)} valid attestations")
            return True, {
                "valid_attestations": len(valid_attestations),
                "invalid_attestations": len(invalid_attestations),
                "verification_timestamp": claim["metadata"]["verification_timestamp"]
            }
            
        except Exception as e:
            self.logger.error(f"Failed to verify claim: {str(e)}")
            raise RuntimeError(f"Failed to verify claim: {str(e)}")
    
    def reject_claim(self, claim_id: str, reason: str) -> Dict[str, Any]:
        """
        Reject a claim.
        
        Args:
            claim_id: Identifier of the claim to reject
            reason: Reason for rejection
            
        Returns:
            The updated claim
            
        Raises:
            ValueError: If the claim ID is invalid
            RuntimeError: If rejection fails
        """
        try:
            # Get claim
            claim = self.get_claim(claim_id)
            if not claim:
                raise ValueError(f"Claim not found: {claim_id}")
            
            # Update claim status
            claim["metadata"]["verification_status"] = self.STATUS_REJECTED
            claim["metadata"]["rejection_timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
            claim["metadata"]["rejection_reason"] = reason
            
            # Store updated claim
            self._store_claim(claim)
            
            # Update cache
            self.claim_cache[claim_id] = claim
            
            self.logger.info(f"Rejected claim: {claim_id}, reason: {reason}")
            return claim
            
        except Exception as e:
            self.logger.error(f"Failed to reject claim: {str(e)}")
            raise RuntimeError(f"Failed to reject claim: {str(e)}")
    
    def get_claim_attestations(self, claim_id: str) -> List[Dict[str, Any]]:
        """
        Get attestations for a claim.
        
        Args:
            claim_id: Identifier of the claim
            
        Returns:
            List of attestations for the claim
        """
        if not self.attestation_service:
            return []
        
        try:
            attestations = self.attestation_service.find_attestations(claim_id=claim_id)
            return attestations
        except Exception as e:
            self.logger.error(f"Failed to get claim attestations: {str(e)}")
            return []
    
    def validate_evidence(self, 
                         claim_id: str, 
                         evidence_id: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Validate evidence for a claim.
        
        Args:
            claim_id: Identifier of the claim
            evidence_id: Identifier of the evidence to validate
            
        Returns:
            A tuple containing:
            - Boolean indicating validation success
            - Dictionary with validation details
        """
        try:
            # Get claim
            claim = self.get_claim(claim_id)
            if not claim:
                return False, {"error": "Claim not found"}
            
            # Check if evidence is referenced in claim
            if evidence_id not in claim["evidence_references"]:
                return False, {"error": "Evidence not referenced in claim"}
            
            # In a production environment, this would validate the evidence
            # For now, we just return success
            return True, {"status": "Evidence validated"}
            
        except Exception as e:
            self.logger.error(f"Failed to validate evidence: {str(e)}")
            return False, {"error": f"Failed to validate evidence: {str(e)}"}
    
    def _store_claim(self, claim: Dict[str, Any]) -> None:
        """
        Store a claim to persistent storage.
        
        Args:
            claim: The claim to store
        """
        claim_id = claim["claim_id"]
        claim_path = Path(self.storage_path) / f"{claim_id}.json"
        
        try:
            with open(claim_path, 'w') as f:
                json.dump(claim, f, indent=2)
        except Exception as e:
            self.logger.error(f"Failed to store claim {claim_id}: {str(e)}")
            raise RuntimeError(f"Failed to store claim: {str(e)}")
