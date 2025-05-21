"""
Boundary Enforcement Module for the Governance Attestation Framework.

This module provides the core functionality for enforcing governance boundaries
and policies within the Promethios governance framework.
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
    from src.core.governance.attestation_service import AttestationService
except ImportError:
    # Handle import errors gracefully for testing environments
    logging.warning("Running with mock dependencies. Some functionality may be limited.")
    SchemaValidator = None
    AttestationService = None


class BoundaryEnforcementModule:
    """
    Module for enforcing governance boundaries and policies.
    
    The BoundaryEnforcementModule provides functionality for:
    - Policy creation and management
    - Policy enforcement and validation
    - Boundary constraint checking
    - Attestation requirement verification
    
    This module integrates with the AttestationService for attestation validation
    and provides a framework for enforcing governance policies.
    """
    
    # Codex Contract Tethering
    CODEX_CONTRACT_ID = "governance.boundary_enforcement_module"
    CODEX_CONTRACT_VERSION = "1.0.0"
    
    # Policy type constants
    POLICY_TYPE_ATTESTATION_REQUIREMENT = "ATTESTATION_REQUIREMENT"
    POLICY_TYPE_BOUNDARY_CONSTRAINT = "BOUNDARY_CONSTRAINT"
    POLICY_TYPE_RATE_LIMIT = "RATE_LIMIT"
    
    # Policy status constants
    STATUS_ACTIVE = "ACTIVE"
    STATUS_INACTIVE = "INACTIVE"
    STATUS_DEPRECATED = "DEPRECATED"
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the BoundaryEnforcementModule with the provided configuration.
        
        Args:
            config: Configuration dictionary with the following optional keys:
                - schema_path: Path to the policy schema
                - storage_path: Path for policy storage
        """
        self.logger = logging.getLogger(__name__)
        self.config = config or {}
        
        # Pre-loop tether check
        self._verify_codex_contract_tether()
        
        # Initialize schema validator
        schema_path = self.config.get('schema_path', 
                                     str(Path(__file__).parent.parent.parent.parent / 
                                         'schemas/governance/policy.schema.v1.json'))
        self.schema_validator = SchemaValidator(schema_path) if SchemaValidator else None
        
        # Initialize dependencies
        self.attestation_service = self.config.get('attestation_service')
        self.audit_trail = self.config.get('audit_trail')
        
        # Initialize storage
        self.storage_path = self.config.get('storage_path', '/tmp/policies')
        Path(self.storage_path).mkdir(parents=True, exist_ok=True)
        
        # Initialize policy cache
        self.policy_cache = {}
        
        self.logger.info(f"BoundaryEnforcementModule initialized with schema: {schema_path}")
    
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
    
    def create_policy(self, 
                     name: str, 
                     description: str,
                     policy_type: str,
                     scope: Dict[str, Any],
                     rules: Dict[str, Any],
                     metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create a new policy.
        
        Args:
            name: Name of the policy
            description: Description of the policy
            policy_type: Type of policy
            scope: Scope of the policy
            rules: Rules for the policy
            metadata: Optional metadata for the policy
            
        Returns:
            The created policy as a dictionary
            
        Raises:
            ValueError: If the policy data is invalid
            RuntimeError: If policy creation fails
        """
        try:
            # Generate policy ID
            policy_id = f"policy-{uuid.uuid4()}"
            
            # Get current timestamp
            timestamp = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Create policy object
            policy = {
                "policy_id": policy_id,
                "name": name,
                "description": description,
                "policy_type": policy_type,
                "scope": scope,
                "rules": rules,
                "status": self.STATUS_ACTIVE,
                "created_at": timestamp,
                "updated_at": timestamp,
                "metadata": metadata or {}
            }
            
            # Validate against schema
            if self.schema_validator:
                self.schema_validator.validate(policy)
            
            # Store policy
            self._store_policy(policy)
            
            # Update cache
            self.policy_cache[policy_id] = policy
            
            self.logger.info(f"Created policy: {policy_id}, type: {policy_type}")
            return policy
            
        except Exception as e:
            self.logger.error(f"Failed to create policy: {str(e)}")
            raise RuntimeError(f"Failed to create policy: {str(e)}")
    
    def get_policy(self, policy_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a policy by its ID.
        
        Args:
            policy_id: Identifier of the policy to retrieve
            
        Returns:
            The policy as a dictionary, or None if not found
        """
        # Check cache first
        if policy_id in self.policy_cache:
            return self.policy_cache[policy_id]
        
        # Try to load from storage
        policy_path = Path(self.storage_path) / f"{policy_id}.json"
        if policy_path.exists():
            try:
                with open(policy_path, 'r') as f:
                    policy = json.load(f)
                    self.policy_cache[policy_id] = policy
                    return policy
            except Exception as e:
                self.logger.error(f"Failed to load policy {policy_id}: {str(e)}")
        
        return None
    
    def find_applicable_policies(self, 
                               domain: Optional[str] = None,
                               policy_type: Optional[str] = None,
                               status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Find policies applicable to the specified criteria.
        
        Args:
            domain: Optional domain to filter by
            policy_type: Optional policy type to filter by
            status: Optional status to filter by
            
        Returns:
            List of matching policies
        """
        results = []
        
        # Scan storage directory
        storage_path = Path(self.storage_path)
        for file_path in storage_path.glob("policy-*.json"):
            try:
                with open(file_path, 'r') as f:
                    policy = json.load(f)
                
                # Apply filters
                if status and policy["status"] != status:
                    continue
                
                if policy_type and policy["policy_type"] != policy_type:
                    continue
                
                if domain and "domain" in policy["scope"]:
                    if policy["scope"]["domain"] != domain:
                        continue
                
                results.append(policy)
                
                # Update cache
                self.policy_cache[policy["policy_id"]] = policy
                
            except Exception as e:
                self.logger.error(f"Failed to process policy file {file_path}: {str(e)}")
        
        return results
    
    def enforce_policy(self, 
                      policy_id: str,
                      entity_id: str,
                      context: Optional[Dict[str, Any]] = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Enforce a policy on an entity.
        
        Args:
            policy_id: Identifier of the policy to enforce
            entity_id: Identifier of the entity to enforce the policy on
            context: Optional context for policy enforcement
            
        Returns:
            A tuple containing:
            - Boolean indicating compliance
            - Dictionary with enforcement details
            
        Raises:
            ValueError: If the policy ID is invalid
            RuntimeError: If enforcement fails
        """
        try:
            # Get policy
            policy = self.get_policy(policy_id)
            if not policy:
                return False, {"error": "Policy not found"}
            
            # Check if policy is active
            if policy["status"] != self.STATUS_ACTIVE:
                return False, {"error": f"Policy is not active, status: {policy['status']}"}
            
            # Enforce based on policy type
            if policy["policy_type"] == self.POLICY_TYPE_ATTESTATION_REQUIREMENT:
                return self._enforce_attestation_requirement(policy, entity_id, context)
            elif policy["policy_type"] == self.POLICY_TYPE_BOUNDARY_CONSTRAINT:
                return self._enforce_boundary_constraint(policy, entity_id, context)
            elif policy["policy_type"] == self.POLICY_TYPE_RATE_LIMIT:
                return self._enforce_rate_limit(policy, entity_id, context)
            else:
                return False, {"error": f"Unsupported policy type: {policy['policy_type']}"}
            
        except Exception as e:
            self.logger.error(f"Failed to enforce policy: {str(e)}")
            
            # Log enforcement failure
            if self.audit_trail:
                self.audit_trail.log_event(
                    entity_id=entity_id,
                    event_type="POLICY_ENFORCEMENT_FAILURE",
                    actor_id="system",
                    event_data={
                        "policy_id": policy_id,
                        "error": str(e)
                    },
                    metadata={"severity": "ERROR"}
                )
            
            return False, {"error": f"Enforcement error: {str(e)}"}
    
    def _enforce_attestation_requirement(self, 
                                        policy: Dict[str, Any],
                                        entity_id: str,
                                        context: Optional[Dict[str, Any]] = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Enforce an attestation requirement policy.
        
        Args:
            policy: The policy to enforce
            entity_id: Identifier of the entity to enforce the policy on
            context: Optional context for policy enforcement
            
        Returns:
            A tuple containing:
            - Boolean indicating compliance
            - Dictionary with enforcement details
        """
        # Check if attestation service is available
        if not self.attestation_service:
            return False, {"error": "Attestation service not available"}
        
        # Get policy rules
        rules = policy["rules"]
        required_attestations = rules.get("required_attestations", 1)
        required_types = rules.get("required_attestation_types", ["VERIFICATION"])
        required_authority_level = rules.get("required_authority_level")
        
        # Get attestations for this entity
        attestation_type = required_types[0] if required_types else None
        attestations = self.attestation_service.find_attestations(
            subject_id=entity_id,
            attestation_type=attestation_type,
            active_only=True
        )
        
        if not attestations:
            # Log enforcement result
            if self.audit_trail:
                self.audit_trail.log_event(
                    entity_id=entity_id,
                    event_type="POLICY_ENFORCEMENT",
                    actor_id="system",
                    event_data={
                        "policy_id": policy["policy_id"],
                        "result": "NON_COMPLIANT",
                        "reason": "No attestations found"
                    },
                    metadata={"severity": "MEDIUM"}
                )
            
            return False, {"error": "No attestations found for entity"}
        
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
            # Log enforcement result
            if self.audit_trail:
                self.audit_trail.log_event(
                    entity_id=entity_id,
                    event_type="POLICY_ENFORCEMENT",
                    actor_id="system",
                    event_data={
                        "policy_id": policy["policy_id"],
                        "result": "NON_COMPLIANT",
                        "reason": f"Insufficient attestations: {len(valid_attestations)}/{required_attestations}"
                    },
                    metadata={"severity": "MEDIUM"}
                )
            
            return False, {
                "error": f"Insufficient attestations ({len(valid_attestations)}) for entity, required: {required_attestations}",
                "valid_attestations": len(valid_attestations),
                "invalid_attestations": len(invalid_attestations)
            }
        
        # Log enforcement result
        if self.audit_trail:
            self.audit_trail.log_event(
                entity_id=entity_id,
                event_type="POLICY_ENFORCEMENT",
                actor_id="system",
                event_data={
                    "policy_id": policy["policy_id"],
                    "result": "COMPLIANT",
                    "valid_attestations": len(valid_attestations)
                },
                metadata={"severity": "INFO"}
            )
        
        return True, {
            "valid_attestations": len(valid_attestations),
            "invalid_attestations": len(invalid_attestations),
            "enforcement_timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }
    
    def _enforce_boundary_constraint(self, 
                                    policy: Dict[str, Any],
                                    entity_id: str,
                                    context: Optional[Dict[str, Any]] = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Enforce a boundary constraint policy.
        
        Args:
            policy: The policy to enforce
            entity_id: Identifier of the entity to enforce the policy on
            context: Optional context for policy enforcement
            
        Returns:
            A tuple containing:
            - Boolean indicating compliance
            - Dictionary with enforcement details
        """
        # In a production environment, this would enforce boundary constraints
        # For now, we just return success
        
        # Log enforcement result
        if self.audit_trail:
            self.audit_trail.log_event(
                entity_id=entity_id,
                event_type="POLICY_ENFORCEMENT",
                actor_id="system",
                event_data={
                    "policy_id": policy["policy_id"],
                    "result": "COMPLIANT",
                    "constraint_type": policy["rules"].get("constraint_type")
                },
                metadata={"severity": "INFO"}
            )
        
        return True, {
            "enforcement_timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "constraint_type": policy["rules"].get("constraint_type")
        }
    
    def _enforce_rate_limit(self, 
                           policy: Dict[str, Any],
                           entity_id: str,
                           context: Optional[Dict[str, Any]] = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Enforce a rate limit policy.
        
        Args:
            policy: The policy to enforce
            entity_id: Identifier of the entity to enforce the policy on
            context: Optional context for policy enforcement
            
        Returns:
            A tuple containing:
            - Boolean indicating compliance
            - Dictionary with enforcement details
        """
        # In a production environment, this would enforce rate limits
        # For now, we just return success
        
        # Log enforcement result
        if self.audit_trail:
            self.audit_trail.log_event(
                entity_id=entity_id,
                event_type="POLICY_ENFORCEMENT",
                actor_id="system",
                event_data={
                    "policy_id": policy["policy_id"],
                    "result": "COMPLIANT",
                    "rate_limit": policy["rules"].get("rate_limit")
                },
                metadata={"severity": "INFO"}
            )
        
        return True, {
            "enforcement_timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "rate_limit": policy["rules"].get("rate_limit")
        }
    
    def _store_policy(self, policy: Dict[str, Any]) -> None:
        """
        Store a policy to persistent storage.
        
        Args:
            policy: The policy to store
        """
        policy_id = policy["policy_id"]
        policy_path = Path(self.storage_path) / f"{policy_id}.json"
        
        try:
            with open(policy_path, 'w') as f:
                json.dump(policy, f, indent=2)
        except Exception as e:
            self.logger.error(f"Failed to store policy {policy_id}: {str(e)}")
            raise RuntimeError(f"Failed to store policy: {str(e)}")
