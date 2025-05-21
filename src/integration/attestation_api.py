"""
Attestation API for the Governance Attestation Framework.

This module provides API endpoints for interacting with the attestation framework,
integrating the core components with external systems.
"""

import json
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from fastapi import APIRouter, HTTPException, Depends, Query, Path, Body, status

# Import required dependencies
try:
    from src.core.governance.attestation_service import AttestationService
    from src.core.governance.claim_verification_protocol import ClaimVerificationProtocol
    from src.core.governance.governance_audit_trail import GovernanceAuditTrail
    from src.core.governance.attestation_authority_manager import AttestationAuthorityManager
    from src.core.trust.trust_decay_engine import TrustDecayEngine
    from src.core.verification.seal_verification import SealVerificationService
except ImportError:
    # Handle import errors gracefully for testing environments
    logging.warning("Running with mock dependencies. Some functionality may be limited.")
    AttestationService = None
    ClaimVerificationProtocol = None
    GovernanceAuditTrail = None
    AttestationAuthorityManager = None
    TrustDecayEngine = None
    SealVerificationService = None


class AttestationAPI:
    """
    API endpoints for interacting with the Governance Attestation Framework.
    
    This API provides endpoints for:
    - Attestation creation and validation
    - Claim verification
    - Audit trail query
    - Authority management
    
    It integrates with the core components of the Governance Attestation Framework
    and provides a RESTful interface for external systems.
    """
    
    def __init__(self, 
                attestation_service: AttestationService,
                claim_verification_protocol: ClaimVerificationProtocol,
                governance_audit_trail: GovernanceAuditTrail,
                attestation_authority_manager: AttestationAuthorityManager,
                trust_decay_engine: Optional[TrustDecayEngine] = None,
                seal_verification_service: Optional[SealVerificationService] = None):
        """
        Initialize the AttestationAPI with the required services.
        
        Args:
            attestation_service: Instance of AttestationService
            claim_verification_protocol: Instance of ClaimVerificationProtocol
            governance_audit_trail: Instance of GovernanceAuditTrail
            attestation_authority_manager: Instance of AttestationAuthorityManager
            trust_decay_engine: Optional instance of TrustDecayEngine
            seal_verification_service: Optional instance of SealVerificationService
        """
        self.logger = logging.getLogger(__name__)
        self.attestation_service = attestation_service
        self.claim_protocol = claim_verification_protocol
        self.audit_trail = governance_audit_trail
        self.authority_manager = attestation_authority_manager
        self.trust_decay_engine = trust_decay_engine
        self.seal_verification = seal_verification_service
        
        # Create API router
        self.router = APIRouter(prefix="/attestation", tags=["attestation"])
        
        # Register routes
        self._register_routes()
        
        self.logger.info("AttestationAPI initialized")
    
    def _register_routes(self):
        """Register all API routes."""
        # Attestation endpoints
        self.router.post("/create", response_model=Dict[str, Any])(self.create_attestation)
        self.router.get("/{attestation_id}", response_model=Dict[str, Any])(self.get_attestation)
        self.router.get("/{attestation_id}/verify", response_model=Dict[str, Any])(self.verify_attestation)
        self.router.post("/{attestation_id}/revoke", response_model=Dict[str, Any])(self.revoke_attestation)
        self.router.get("/chain/{root_id}", response_model=List[Dict[str, Any]])(self.get_attestation_chain)
        
        # Claim endpoints
        self.router.post("/claim/create", response_model=Dict[str, Any])(self.create_claim)
        self.router.get("/claim/{claim_id}", response_model=Dict[str, Any])(self.get_claim)
        self.router.post("/claim/{claim_id}/verify", response_model=Dict[str, Any])(self.verify_claim)
        self.router.get("/claim/{claim_id}/attestations", response_model=List[Dict[str, Any]])(self.get_claim_attestations)
        
        # Audit trail endpoints
        self.router.get("/audit/events", response_model=List[Dict[str, Any]])(self.get_audit_events)
        self.router.get("/audit/events/{event_id}", response_model=Dict[str, Any])(self.get_audit_event)
        self.router.get("/audit/trail/{entity_id}", response_model=List[Dict[str, Any]])(self.get_entity_audit_trail)
        self.router.get("/audit/verify/{event_id}", response_model=Dict[str, Any])(self.verify_audit_event)
        
        # Authority endpoints
        self.router.post("/authority/register", response_model=Dict[str, Any])(self.register_authority)
        self.router.get("/authority/{authority_id}", response_model=Dict[str, Any])(self.get_authority)
        self.router.put("/authority/{authority_id}/trust", response_model=Dict[str, Any])(self.update_authority_trust)
        self.router.get("/authority/list", response_model=List[Dict[str, Any]])(self.list_authorities)
    
    # Attestation endpoints
    
    async def create_attestation(self, 
                               attestation_data: Dict[str, Any] = Body(...)):
        """
        Create a new attestation.
        
        Args:
            attestation_data: Data for the attestation
            
        Returns:
            The created attestation
        """
        try:
            # Extract required fields
            issuer_id = attestation_data.get("issuer_id")
            subject_id = attestation_data.get("subject_id")
            claim_id = attestation_data.get("claim_id")
            attestation_type = attestation_data.get("attestation_type")
            content = attestation_data.get("content", {})
            signature = attestation_data.get("signature", {})
            parent_attestation_id = attestation_data.get("parent_attestation_id")
            
            # Validate required fields
            if not issuer_id or not subject_id or not claim_id or not attestation_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing required fields"
                )
            
            # Verify authority if available
            if self.authority_manager:
                # Extract domain from content if available
                domain = content.get("context", {}).get("domain", "default")
                
                is_valid, details = self.authority_manager.verify_authority_for_attestation(
                    authority_id=issuer_id,
                    attestation_type=attestation_type,
                    domain=domain
                )
                
                if not is_valid:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Authority verification failed: {details.get('error', 'Unknown error')}"
                    )
            
            # Create attestation
            attestation = self.attestation_service.create_attestation(
                issuer_id=issuer_id,
                subject_id=subject_id,
                claim_id=claim_id,
                attestation_type=attestation_type,
                attestation_data={
                    "content": content,
                    "context": attestation_data.get("context", {}),
                    "evidence_references": attestation_data.get("evidence_references", []),
                    "contract_seal_reference": attestation_data.get("contract_seal_reference")
                },
                signature=signature,
                parent_attestation_id=parent_attestation_id,
                expiration_days=attestation_data.get("expiration_days")
            )
            
            # Log audit event
            if self.audit_trail:
                self.audit_trail.log_event(
                    entity_id=subject_id,
                    event_type=self.audit_trail.EVENT_ATTESTATION_CREATED,
                    actor_id=issuer_id,
                    event_data={
                        "content": {
                            "attestation_id": attestation["attestation_id"],
                            "attestation_type": attestation_type,
                            "claim_id": claim_id
                        },
                        "context": {
                            "source": "api"
                        },
                        "references": [
                            {
                                "reference_type": "ATTESTATION",
                                "reference_id": attestation["attestation_id"]
                            },
                            {
                                "reference_type": "CLAIM",
                                "reference_id": claim_id
                            }
                        ],
                        "result": {
                            "status": "SUCCESS",
                            "details": {}
                        }
                    },
                    metadata={
                        "severity": "INFO"
                    }
                )
            
            # Trigger trust regeneration if available
            if self.trust_decay_engine:
                self.trust_decay_engine.register_attestation_event(
                    subject_id=subject_id,
                    attestation_id=attestation["attestation_id"],
                    attestation_type=attestation_type,
                    trust_impact=0.1  # Default positive impact
                )
            
            return attestation
            
        except Exception as e:
            self.logger.error(f"Failed to create attestation: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create attestation: {str(e)}"
            )
    
    async def get_attestation(self, attestation_id: str = Path(...)):
        """
        Get attestation details.
        
        Args:
            attestation_id: Identifier of the attestation
            
        Returns:
            The attestation details
        """
        try:
            attestation = self.attestation_service.get_attestation(attestation_id)
            if not attestation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Attestation not found: {attestation_id}"
                )
            
            return attestation
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Failed to get attestation: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get attestation: {str(e)}"
            )
    
    async def verify_attestation(self, attestation_id: str = Path(...)):
        """
        Verify attestation validity.
        
        Args:
            attestation_id: Identifier of the attestation
            
        Returns:
            Verification result
        """
        try:
            is_valid, details = self.attestation_service.validate_attestation(attestation_id)
            
            # Log audit event
            if self.audit_trail:
                attestation = self.attestation_service.get_attestation(attestation_id)
                if attestation:
                    self.audit_trail.log_event(
                        entity_id=attestation["subject_id"],
                        event_type=self.audit_trail.EVENT_ATTESTATION_VERIFIED,
                        actor_id="system",  # System-initiated verification
                        event_data={
                            "content": {
                                "attestation_id": attestation_id,
                                "verification_result": "VALID" if is_valid else "INVALID"
                            },
                            "context": {
                                "source": "api"
                            },
                            "references": [
                                {
                                    "reference_type": "ATTESTATION",
                                    "reference_id": attestation_id
                                }
                            ],
                            "result": {
                                "status": "SUCCESS",
                                "details": details
                            }
                        },
                        metadata={
                            "severity": "INFO"
                        }
                    )
            
            return {
                "attestation_id": attestation_id,
                "is_valid": is_valid,
                "details": details
            }
            
        except Exception as e:
            self.logger.error(f"Failed to verify attestation: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to verify attestation: {str(e)}"
            )
    
    async def revoke_attestation(self, 
                               attestation_id: str = Path(...),
                               revocation_data: Dict[str, Any] = Body(...)):
        """
        Revoke an attestation.
        
        Args:
            attestation_id: Identifier of the attestation to revoke
            revocation_data: Data for the revocation
            
        Returns:
            The updated attestation
        """
        try:
            # Extract required fields
            reason = revocation_data.get("reason")
            actor_id = revocation_data.get("actor_id")
            
            # Validate required fields
            if not reason or not actor_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing required fields: reason and actor_id"
                )
            
            # Get attestation to check if it exists
            attestation = self.attestation_service.get_attestation(attestation_id)
            if not attestation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Attestation not found: {attestation_id}"
                )
            
            # Check if actor has authority to revoke
            # In a production environment, this would include more checks
            if actor_id != attestation["issuer_id"]:
                # Check if actor is an authority with sufficient trust level
                if self.authority_manager:
                    actor_authority = self.authority_manager.get_authority(actor_id)
                    if not actor_authority or actor_authority["status"] != "ACTIVE":
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Actor does not have authority to revoke this attestation"
                        )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Actor does not have authority to revoke this attestation"
                    )
            
            # Revoke attestation
            updated_attestation = self.attestation_service.revoke_attestation(
                attestation_id=attestation_id,
                reason=reason,
                actor_id=actor_id
            )
            
            # Log audit event
            if self.audit_trail:
                self.audit_trail.log_event(
                    entity_id=attestation["subject_id"],
                    event_type=self.audit_trail.EVENT_ATTESTATION_REVOKED,
                    actor_id=actor_id,
                    event_data={
                        "content": {
                            "attestation_id": attestation_id,
                            "revocation_reason": reason
                        },
                        "context": {
                            "source": "api"
                        },
                        "references": [
                            {
                                "reference_type": "ATTESTATION",
                                "reference_id": attestation_id
                            }
                        ],
                        "result": {
                            "status": "SUCCESS",
                            "details": {}
                        }
                    },
                    metadata={
                        "severity": "MEDIUM"
                    }
                )
            
            # Trigger trust decay if available
            if self.trust_decay_engine:
                self.trust_decay_engine.register_event(
                    entity_id=attestation["subject_id"],
                    event_type="ATTESTATION_REVOKED",
                    severity="MEDIUM",
                    context={
                        "attestation_id": attestation_id,
                        "actor_id": actor_id,
                        "reason": reason
                    }
                )
            
            return updated_attestation
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Failed to revoke attestation: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to revoke attestation: {str(e)}"
            )
    
    async def get_attestation_chain(self, root_id: str = Path(...)):
        """
        Get attestation chain.
        
        Args:
            root_id: Identifier of the root attestation
            
        Returns:
            List of attestations in the chain
        """
        try:
            chain = self.attestation_service.get_attestation_chain(root_id)
            if not chain:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Attestation chain not found for: {root_id}"
                )
            
            return chain
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Failed to get attestation chain: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get attestation chain: {str(e)}"
            )
    
    # Claim endpoints
    
    async def create_claim(self, claim_data: Dict[str, Any] = Body(...)):
        """
        Create a new claim.
        
        Args:
            claim_data: Data for the claim
            
        Returns:
            The created claim
        """
        try:
            # Extract required fields
            issuer_id = claim_data.get("issuer_id")
            subject_id = claim_data.get("subject_id")
            claim_type = claim_data.get("claim_type")
            statement = claim_data.get("statement")
            scope = claim_data.get("scope")
            evidence_references = claim_data.get("evidence_references")
            verification_requirements = claim_data.get("verification_requirements")
            
            # Validate required fields
            if not issuer_id or not subject_id or not claim_type or not statement or not scope:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing required fields"
                )
            
            # Create claim
            claim = self.claim_protocol.create_claim(
                issuer_id=issuer_id,
                subject_id=subject_id,
                claim_type=claim_type,
                statement=statement,
                scope=scope,
                evidence_references=evidence_references,
                verification_requirements=verification_requirements
            )
            
            # Log audit event
            if self.audit_trail:
                self.audit_trail.log_event(
                    entity_id=subject_id,
                    event_type=self.audit_trail.EVENT_CLAIM_CREATED,
                    actor_id=issuer_id,
                    event_data={
                        "content": {
                            "claim_id": claim["claim_id"],
                            "claim_type": claim_type,
                            "statement": statement
                        },
                        "context": {
                            "source": "api"
                        },
                        "references": [
                            {
                                "reference_type": "CLAIM",
                                "reference_id": claim["claim_id"]
                            }
                        ],
                        "result": {
                            "status": "SUCCESS",
                            "details": {}
                        }
                    },
                    metadata={
                        "severity": "INFO"
                    }
                )
            
            return claim
            
        except Exception as e:
            self.logger.error(f"Failed to create claim: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create claim: {str(e)}"
            )
    
    async def get_claim(self, claim_id: str = Path(...)):
        """
        Get claim details.
        
        Args:
            claim_id: Identifier of the claim
            
        Returns:
            The claim details
        """
        try:
            claim = self.claim_protocol.get_claim(claim_id)
            if not claim:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Claim not found: {claim_id}"
                )
            
            return claim
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Failed to get claim: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get claim: {str(e)}"
            )
    
    async def verify_claim(self, claim_id: str = Path(...)):
        """
        Verify a claim.
        
        Args:
            claim_id: Identifier of the claim
            
        Returns:
            Verification result
        """
        try:
            is_verified, details = self.claim_protocol.verify_claim(claim_id)
            
            # Log audit event
            if self.audit_trail:
                claim = self.claim_protocol.get_claim(claim_id)
                if claim:
                    event_type = (
                        self.audit_trail.EVENT_CLAIM_VERIFIED if is_verified 
                        else self.audit_trail.EVENT_CLAIM_REJECTED
                    )
                    
                    self.audit_trail.log_event(
                        entity_id=claim["subject_id"],
                        event_type=event_type,
                        actor_id="system",  # System-initiated verification
                        event_data={
                            "content": {
                                "claim_id": claim_id,
                                "verification_result": "VERIFIED" if is_verified else "REJECTED"
                            },
                            "context": {
                                "source": "api"
                            },
                            "references": [
                                {
                                    "reference_type": "CLAIM",
                                    "reference_id": claim_id
                                }
                            ],
                            "result": {
                                "status": "SUCCESS",
                                "details": details
                            }
                        },
                        metadata={
                            "severity": "INFO"
                        }
                    )
            
            return {
                "claim_id": claim_id,
                "is_verified": is_verified,
                "details": details
            }
            
        except Exception as e:
            self.logger.error(f"Failed to verify claim: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to verify claim: {str(e)}"
            )
    
    async def get_claim_attestations(self, claim_id: str = Path(...)):
        """
        Get attestations for a claim.
        
        Args:
            claim_id: Identifier of the claim
            
        Returns:
            List of attestations for the claim
        """
        try:
            # Check if claim exists
            claim = self.claim_protocol.get_claim(claim_id)
            if not claim:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Claim not found: {claim_id}"
                )
            
            attestations = self.claim_protocol.get_claim_attestations(claim_id)
            return attestations
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Failed to get claim attestations: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get claim attestations: {str(e)}"
            )
    
    # Audit trail endpoints
    
    async def get_audit_events(self,
                             entity_id: Optional[str] = Query(None),
                             event_type: Optional[str] = Query(None),
                             actor_id: Optional[str] = Query(None),
                             start_time: Optional[str] = Query(None),
                             end_time: Optional[str] = Query(None),
                             limit: int = Query(100, ge=1, le=1000)):
        """
        Get audit events.
        
        Args:
            entity_id: Optional entity ID to filter by
            event_type: Optional event type to filter by
            actor_id: Optional actor ID to filter by
            start_time: Optional ISO 8601 timestamp for start of time range
            end_time: Optional ISO 8601 timestamp for end of time range
            limit: Maximum number of events to return
            
        Returns:
            List of audit events
        """
        try:
            events = self.audit_trail.find_events(
                entity_id=entity_id,
                event_type=event_type,
                actor_id=actor_id,
                start_time=start_time,
                end_time=end_time,
                limit=limit
            )
            
            return events
            
        except Exception as e:
            self.logger.error(f"Failed to get audit events: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get audit events: {str(e)}"
            )
    
    async def get_audit_event(self, event_id: str = Path(...)):
        """
        Get audit event details.
        
        Args:
            event_id: Identifier of the audit event
            
        Returns:
            The audit event details
        """
        try:
            event = self.audit_trail.get_event(event_id)
            if not event:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Audit event not found: {event_id}"
                )
            
            return event
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Failed to get audit event: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get audit event: {str(e)}"
            )
    
    async def get_entity_audit_trail(self, 
                                   entity_id: str = Path(...),
                                   limit: int = Query(100, ge=1, le=1000)):
        """
        Get audit trail for an entity.
        
        Args:
            entity_id: Identifier of the entity
            limit: Maximum number of events to return
            
        Returns:
            List of audit events for the entity
        """
        try:
            events = self.audit_trail.get_entity_audit_trail(entity_id, limit=limit)
            return events
            
        except Exception as e:
            self.logger.error(f"Failed to get entity audit trail: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get entity audit trail: {str(e)}"
            )
    
    async def verify_audit_event(self, event_id: str = Path(...)):
        """
        Verify audit event integrity.
        
        Args:
            event_id: Identifier of the audit event
            
        Returns:
            Verification result
        """
        try:
            is_valid, details = self.audit_trail.verify_event(event_id)
            
            return {
                "event_id": event_id,
                "is_valid": is_valid,
                "details": details
            }
            
        except Exception as e:
            self.logger.error(f"Failed to verify audit event: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to verify audit event: {str(e)}"
            )
    
    # Authority endpoints
    
    async def register_authority(self, authority_data: Dict[str, Any] = Body(...)):
        """
        Register a new authority.
        
        Args:
            authority_data: Data for the authority
            
        Returns:
            The registered authority
        """
        try:
            # Extract required fields
            name = authority_data.get("name")
            description = authority_data.get("description")
            public_keys = authority_data.get("public_keys")
            capabilities = authority_data.get("capabilities")
            metadata = authority_data.get("metadata")
            
            # Validate required fields
            if not name or not description or not public_keys or not capabilities:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing required fields"
                )
            
            # Register authority
            authority = self.authority_manager.register_authority(
                name=name,
                description=description,
                public_keys=public_keys,
                capabilities=capabilities,
                metadata=metadata
            )
            
            # Log audit event
            if self.audit_trail:
                self.audit_trail.log_event(
                    entity_id=authority["authority_id"],
                    event_type=self.audit_trail.EVENT_AUTHORITY_REGISTERED,
                    actor_id="system",  # System-initiated registration
                    event_data={
                        "content": {
                            "authority_id": authority["authority_id"],
                            "name": name,
                            "capabilities": capabilities
                        },
                        "context": {
                            "source": "api"
                        },
                        "references": [
                            {
                                "reference_type": "AUTHORITY",
                                "reference_id": authority["authority_id"]
                            }
                        ],
                        "result": {
                            "status": "SUCCESS",
                            "details": {}
                        }
                    },
                    metadata={
                        "severity": "INFO"
                    }
                )
            
            return authority
            
        except Exception as e:
            self.logger.error(f"Failed to register authority: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to register authority: {str(e)}"
            )
    
    async def get_authority(self, authority_id: str = Path(...)):
        """
        Get authority details.
        
        Args:
            authority_id: Identifier of the authority
            
        Returns:
            The authority details
        """
        try:
            authority = self.authority_manager.get_authority(authority_id)
            if not authority:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Authority not found: {authority_id}"
                )
            
            return authority
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Failed to get authority: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get authority: {str(e)}"
            )
    
    async def update_authority_trust(self, authority_id: str = Path(...)):
        """
        Update authority trust level.
        
        Args:
            authority_id: Identifier of the authority
            
        Returns:
            The updated authority
        """
        try:
            # Check if authority exists
            authority = self.authority_manager.get_authority(authority_id)
            if not authority:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Authority not found: {authority_id}"
                )
            
            # Update trust level
            updated_authority = self.authority_manager.update_trust_level(authority_id)
            
            # Log audit event
            if self.audit_trail:
                self.audit_trail.log_event(
                    entity_id=authority_id,
                    event_type=self.audit_trail.EVENT_AUTHORITY_UPDATED,
                    actor_id="system",  # System-initiated update
                    event_data={
                        "content": {
                            "authority_id": authority_id,
                            "trust_level": updated_authority["trust_level"]["level"],
                            "trust_score": updated_authority["trust_level"]["score"]
                        },
                        "context": {
                            "source": "api"
                        },
                        "references": [
                            {
                                "reference_type": "AUTHORITY",
                                "reference_id": authority_id
                            }
                        ],
                        "result": {
                            "status": "SUCCESS",
                            "details": {}
                        }
                    },
                    metadata={
                        "severity": "INFO"
                    }
                )
            
            return updated_authority
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Failed to update authority trust: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update authority trust: {str(e)}"
            )
    
    async def list_authorities(self,
                             status: Optional[str] = Query(None),
                             attestation_type: Optional[str] = Query(None),
                             domain: Optional[str] = Query(None),
                             min_trust_score: Optional[float] = Query(None)):
        """
        List authorities.
        
        Args:
            status: Optional status to filter by
            attestation_type: Optional attestation type capability to filter by
            domain: Optional domain capability to filter by
            min_trust_score: Optional minimum trust score to filter by
            
        Returns:
            List of authorities
        """
        try:
            authorities = self.authority_manager.find_authorities(
                status=status,
                attestation_type=attestation_type,
                domain=domain,
                min_trust_score=min_trust_score
            )
            
            return authorities
            
        except Exception as e:
            self.logger.error(f"Failed to list authorities: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list authorities: {str(e)}"
            )
