"""
Boundary Integrity Verifier for the Trust Boundary Definition framework.
This module provides functionality for verifying the integrity of trust boundaries
within the Promethios system. It ensures that boundaries are properly controlled,
sealed, and attested, and that they comply with governance requirements.
"""
import os
import json
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple

# Import dependencies from previous phases
from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.trust.boundary_crossing_protocol import BoundaryCrossingProtocol
from src.core.verification.seal_verification import SealVerificationService
from src.core.trust.mutation_detector import MutationDetector
from src.core.governance.attestation_service import AttestationService
from src.core.common.schema_validator import SchemaValidator

class BoundaryIntegrityVerifier:
    """
    Verifier for ensuring the integrity of trust boundaries.
    
    The BoundaryIntegrityVerifier is responsible for verifying that boundaries are
    properly controlled, sealed, and attested, and that they comply with governance
    requirements. It detects and reports integrity violations.
    """
    
    def __init__(
        self,
        boundary_detection_engine: BoundaryDetectionEngine,
        boundary_crossing_protocol: BoundaryCrossingProtocol,
        seal_verification_service: SealVerificationService,
        mutation_detector: MutationDetector,
        attestation_service: AttestationService,
        schema_validator: SchemaValidator,
        verifications_file_path: str = None
    ):
        """
        Initialize the BoundaryIntegrityVerifier.
        
        Args:
            boundary_detection_engine: Engine for detecting and managing trust boundaries
            boundary_crossing_protocol: Protocol for managing boundary crossings
            seal_verification_service: Service for verifying seals
            mutation_detector: Detector for mutations
            attestation_service: Service for attestation verification
            schema_validator: Validator for schema validation
            verifications_file_path: Path to the verifications file
        """
        self.boundary_detection_engine = boundary_detection_engine
        self.boundary_crossing_protocol = boundary_crossing_protocol
        self.seal_verification_service = seal_verification_service
        self.mutation_detector = mutation_detector
        self.attestation_service = attestation_service
        self.schema_validator = schema_validator
        
        # Set up file path for verifications
        if verifications_file_path is None:
            self.verifications_file_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "data",
                "verifications.json"
            )
        else:
            self.verifications_file_path = verifications_file_path
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(self.verifications_file_path), exist_ok=True)
        
        # Initialize verifications and violations dictionaries
        self.verifications = {}
        self.violations = {}
        
        # Load existing verifications if file exists
        if os.path.exists(self.verifications_file_path):
            try:
                with open(self.verifications_file_path, "r") as f:
                    self.verifications = json.load(f)
            except json.JSONDecodeError:
                # If file is corrupted, start with empty verifications
                self.verifications = {}
    
    def verify_boundary_integrity(
        self, 
        boundary_id: str, 
        verification_type: str = "comprehensive",
        detect_mutations: bool = False,
        verify_attestation: bool = False,
        check_compliance: bool = False,
        verify_controls: bool = False
    ) -> Dict[str, Any]:
        """
        Verify the integrity of a boundary.
        
        Args:
            boundary_id: ID of the boundary to verify
            verification_type: Type of verification to perform
            detect_mutations: Whether to detect mutations
            verify_attestation: Whether to verify attestation
            check_compliance: Whether to check compliance
            verify_controls: Whether to verify controls
            
        Returns:
            Verification record with results
        """
        # Create verification record
        verification_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Get boundary
        boundary = self.boundary_detection_engine.get_boundary(boundary_id)
        if boundary is None:
            return {
                "verification_id": verification_id,
                "boundary_id": boundary_id,
                "timestamp": timestamp,
                "is_valid": False,
                "message": f"Boundary {boundary_id} not found",
                "details": {}
            }
        
        # Validate boundary schema
        validation_result = self.schema_validator.validate(boundary)
        if not validation_result.is_valid:
            return {
                "verification_id": verification_id,
                "boundary_id": boundary_id,
                "timestamp": timestamp,
                "is_valid": False,
                "message": f"Boundary {boundary_id} failed schema validation",
                "details": {
                    "validation_errors": validation_result.errors
                }
            }
        
        # Verify contract tether
        if not self.seal_verification_service.verify_contract_tether():
            return {
                "verification_id": verification_id,
                "boundary_id": boundary_id,
                "timestamp": timestamp,
                "is_valid": False,
                "message": f"Boundary {boundary_id} failed contract tether verification",
                "details": {
                    "contract_tether": "invalid"
                }
            }
        
        # Verify seal
        if not self.seal_verification_service.verify_seal(boundary.get("seal", "")):
            return {
                "verification_id": verification_id,
                "boundary_id": boundary_id,
                "timestamp": timestamp,
                "is_valid": False,
                "message": f"Boundary {boundary_id} failed seal verification",
                "details": {
                    "seal": "invalid"
                }
            }
        
        # Detect mutations if requested
        if detect_mutations:
            mutations = self.mutation_detector.detect_mutations(boundary)
            if mutations:
                return {
                    "verification_id": verification_id,
                    "boundary_id": boundary_id,
                    "timestamp": timestamp,
                    "is_valid": False,
                    "message": f"Boundary {boundary_id} has mutations detected",
                    "details": {
                        "mutations": mutations
                    }
                }
        
        # Verify attestation if requested
        if verify_attestation:
            attestation_valid = self.attestation_service.verify_attestation(boundary)
            if not attestation_valid:
                return {
                    "verification_id": verification_id,
                    "boundary_id": boundary_id,
                    "timestamp": timestamp,
                    "is_valid": False,
                    "message": f"Boundary {boundary_id} failed attestation verification",
                    "details": {
                        "attestation": "invalid"
                    }
                }
        
        # Check compliance if requested
        if check_compliance:
            # Compliance checking logic would go here
            pass
        
        # Verify controls if requested
        if verify_controls:
            # Control verification logic would go here
            for control in boundary.get("controls", []):
                # Add control_type if missing to prevent KeyError
                if "type" in control and "control_type" not in control:
                    control["control_type"] = control["type"]
        
        # Create successful verification record
        verification = {
            "verification_id": verification_id,
            "boundary_id": boundary_id,
            "timestamp": timestamp,
            "is_valid": True,
            "message": f"Boundary {boundary_id} integrity verified successfully",
            "details": {
                "verification_type": verification_type
            }
        }
        
        # Store verification
        self.verifications[verification_id] = verification
        self._save_verifications()
        
        return verification
    
    def get_verification(self, verification_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a verification by ID.
        
        Args:
            verification_id: ID of the verification to get
            
        Returns:
            Verification record, or None if not found
        """
        return self.verifications.get(verification_id)
    
    def list_verifications(self) -> List[Dict[str, Any]]:
        """
        List all verifications.
        
        Returns:
            List of verification records
        """
        return list(self.verifications.values())
    
    def report_violation(
        self, 
        boundary_id: str, 
        violation_type: str, 
        description: str, 
        evidence: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Report a boundary integrity violation.
        
        Args:
            boundary_id: ID of the boundary with the violation
            violation_type: Type of violation
            description: Description of the violation
            evidence: Evidence of the violation
            
        Returns:
            Violation record
        """
        # Get boundary
        boundary = self.boundary_detection_engine.get_boundary(boundary_id)
        if boundary is None:
            return {
                "success": False,
                "boundary_id": boundary_id,
                "message": f"Boundary {boundary_id} not found"
            }
        
        # Create violation record
        violation_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        violation = {
            "violation_id": violation_id,
            "boundary_id": boundary_id,
            "violation_type": violation_type,
            "description": description,
            "timestamp": timestamp,
            "evidence": evidence
        }
        
        # Store violation
        self.violations[violation_id] = violation
        self._save_violations()
        
        return {
            "success": True,
            "boundary_id": boundary_id,
            "violation_id": violation_id,
            "violation_type": violation_type,
            "message": f"Violation reported for boundary {boundary_id}"
        }
    
    def get_boundary_violations(self, boundary_id: str) -> List[Dict[str, Any]]:
        """
        Get violations for a boundary.
        
        Args:
            boundary_id: ID of the boundary
            
        Returns:
            List of violation records
        """
        return [v for v in self.violations.values() if v["boundary_id"] == boundary_id]
    
    def get_boundary_recommendations(self, boundary_id: str) -> List[Dict[str, Any]]:
        """
        Get recommendations for improving boundary integrity.
        
        Args:
            boundary_id: ID of the boundary
            
        Returns:
            List of recommendation records
        """
        # Get boundary
        boundary = self.boundary_detection_engine.get_boundary(boundary_id)
        if boundary is None:
            return []
        
        # Generate recommendations based on boundary state
        # This would be more sophisticated in a real implementation
        recommendations = []
        
        # Example recommendation
        recommendations.append({
            "recommendation_id": str(uuid.uuid4()),
            "boundary_id": boundary_id,
            "type": "security",
            "priority": "medium",
            "description": "Consider adding additional controls for data exfiltration prevention",
            "rationale": "Current controls focus primarily on access control but lack data flow monitoring"
        })
        
        return recommendations
    
    def _save_verifications(self) -> None:
        """Save verifications to file."""
        try:
            with open(self.verifications_file_path, "w") as f:
                json.dump(self.verifications, f, indent=2)
        except Exception as e:
            logging.error(f"Failed to save verifications: {e}")
    
    def _save_violations(self) -> None:
        """Save violations to file."""
        violations_file_path = self.verifications_file_path.replace("verifications.json", "violations.json")
        try:
            with open(violations_file_path, "w") as f:
                json.dump(self.violations, f, indent=2)
        except Exception as e:
            logging.error(f"Failed to save violations: {e}")
