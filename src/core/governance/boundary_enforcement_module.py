"""
Boundary Enforcement Module for Promethios Distributed Trust Surface

Codex Contract: v2025.05.20
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""

import json
import uuid
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Set, Callable

class BoundaryEnforcementModule:
    """
    Enforces trust boundaries and policies across the distributed network.
    
    The BoundaryEnforcementModule is responsible for:
    1. Enforcing trust boundary policies for cross-instance operations
    2. Implementing access control based on trust levels
    3. Validating operations against boundary policies
    4. Logging and auditing boundary enforcement actions
    """
    
    def __init__(self, instance_id: str, schema_validator=None, 
                trust_boundary_manager=None, attestation_service=None,
                trust_propagation_engine=None):
        """
        Initialize the Boundary Enforcement Module.
        
        Args:
            instance_id: The identifier of this Promethios instance
            schema_validator: Optional validator for schema validation
            trust_boundary_manager: Optional reference to the Trust Boundary Manager
            attestation_service: Optional reference to the Attestation Service
            trust_propagation_engine: Optional reference to the Trust Propagation Engine
        """
        self.instance_id = instance_id
        self.schema_validator = schema_validator
        self.trust_boundary_manager = trust_boundary_manager
        self.attestation_service = attestation_service
        self.trust_propagation_engine = trust_propagation_engine
        
        self.enforcement_logs = []
        self.enforcement_policies = []
    
    def enforce_boundary_access(self, source_id: str, operation: str, 
                               resource_path: str, required_trust_level: int) -> Tuple[bool, str]:
        """
        Enforce boundary access based on trust level.
        
        Args:
            source_id: The ID of the source instance
            operation: The operation being performed
            resource_path: Path to the resource being accessed
            required_trust_level: Required trust level (0-100)
            
        Returns:
            Tuple of (is_allowed, reason)
        """
        if not self.trust_boundary_manager:
            return False, "Trust boundary manager not available"
        
        # Get boundaries between source and this instance
        boundaries = self.trust_boundary_manager.list_boundaries(
            source_instance_id=source_id,
            target_instance_id=self.instance_id
        )
        
        if not boundaries:
            return False, "No trust boundary exists"
        
        # Get the first matching boundary
        boundary = boundaries[0]
        boundary_id = boundary["boundary_id"]
        trust_level = boundary["trust_level"]
        
        # Check if trust level is sufficient
        if trust_level < required_trust_level:
            return False, "Insufficient trust level"
        
        # Enforce boundary policy
        is_allowed, policy_result = self.trust_boundary_manager.enforce_boundary_policy(
            boundary_id=boundary_id,
            operation=operation,
            context={"data_path": resource_path}
        )
        
        if not is_allowed:
            return False, "Boundary policy denied access"
        
        # Log the enforcement action
        self.log_enforcement_action(
            source_id=source_id,
            operation=operation,
            resource_path=resource_path,
            is_allowed=True,
            reason="Trust level sufficient and policy allows access"
        )
        
        return True, "Access allowed"
    
    def enforce_attestation_requirement(self, source_id: str, attestation_type: str,
                                      operation: str, resource_path: str) -> Tuple[bool, str]:
        """
        Enforce attestation requirement for access.
        
        Args:
            source_id: The ID of the source instance
            attestation_type: Required attestation type
            operation: The operation being performed
            resource_path: Path to the resource being accessed
            
        Returns:
            Tuple of (is_allowed, reason)
        """
        if not self.attestation_service:
            return False, "Attestation service not available"
        
        # Get attestations for the source instance
        attestations = self.attestation_service.list_attestations(
            subject_instance_id=source_id,
            attestation_type=attestation_type
        )
        
        if not attestations:
            return False, "Required attestation not found"
        
        # Get the first matching attestation
        attestation = attestations[0]
        attestation_id = attestation["attestation_id"]
        
        # Verify the attestation
        is_valid, verification_result = self.attestation_service.verify_attestation(
            attestation_id=attestation_id
        )
        
        if not is_valid:
            return False, "Attestation verification failed"
        
        # Log the enforcement action
        self.log_enforcement_action(
            source_id=source_id,
            operation=operation,
            resource_path=resource_path,
            is_allowed=True,
            reason=f"Required attestation {attestation_type} verified"
        )
        
        return True, "Attestation requirement satisfied"
    
    def enforce_propagated_trust(self, source_id: str, operation: str,
                               resource_path: str, required_trust_level: int) -> Tuple[bool, str]:
        """
        Enforce access based on propagated trust.
        
        Args:
            source_id: The ID of the source instance
            operation: The operation being performed
            resource_path: Path to the resource being accessed
            required_trust_level: Required trust level (0-100)
            
        Returns:
            Tuple of (is_allowed, reason)
        """
        if not self.trust_propagation_engine:
            return False, "Trust propagation engine not available"
        
        # Get propagated trust from source to this instance
        propagated_trust, path = self.trust_propagation_engine.get_propagated_trust(
            source_id=source_id,
            target_id=self.instance_id
        )
        
        # Convert to percentage (0-100)
        trust_percentage = int(propagated_trust * 100)
        
        # Check if trust level is sufficient
        if trust_percentage < required_trust_level:
            return False, "Insufficient propagated trust level"
        
        # Log the enforcement action
        self.log_enforcement_action(
            source_id=source_id,
            operation=operation,
            resource_path=resource_path,
            is_allowed=True,
            reason=f"Propagated trust level sufficient: {trust_percentage}%"
        )
        
        return True, "Access allowed based on propagated trust"
    
    def create_enforcement_policy(self, policy_type: str, resource_pattern: str,
                                required_trust_level: int, required_attestations: List[str],
                                allowed_operations: List[str]) -> Dict:
        """
        Create an enforcement policy.
        
        Args:
            policy_type: Type of policy
            resource_pattern: Resource pattern to match
            required_trust_level: Required trust level (0-100)
            required_attestations: List of required attestation types
            allowed_operations: List of allowed operations
            
        Returns:
            The created policy
        """
        policy = {
            "policy_id": f"ep-{uuid.uuid4().hex}",
            "policy_type": policy_type,
            "resource_pattern": resource_pattern,
            "required_trust_level": required_trust_level,
            "required_attestations": required_attestations,
            "allowed_operations": allowed_operations,
            "created_at": datetime.utcnow().isoformat() + 'Z',
            "status": "active"
        }
        
        # Add to policies
        self.enforcement_policies.append(policy)
        
        return policy
    
    def list_enforcement_policies(self, policy_type: str = None,
                                resource_pattern: str = None) -> List[Dict]:
        """
        List enforcement policies, optionally filtered.
        
        Args:
            policy_type: Optional policy type to filter by
            resource_pattern: Optional resource pattern to filter by
            
        Returns:
            List of matching policies
        """
        results = []
        
        for policy in self.enforcement_policies:
            if policy_type and policy["policy_type"] != policy_type:
                continue
            
            if resource_pattern and policy["resource_pattern"] != resource_pattern:
                continue
            
            results.append(policy)
        
        return results
    
    def enforce_policy(self, policy_id: str, source_id: str,
                     operation: str, resource_path: str) -> Tuple[bool, str]:
        """
        Enforce a specific policy.
        
        Args:
            policy_id: ID of the policy to enforce
            source_id: The ID of the source instance
            operation: The operation being performed
            resource_path: Path to the resource being accessed
            
        Returns:
            Tuple of (is_allowed, reason)
        """
        # Find the policy
        policy = None
        for p in self.enforcement_policies:
            if p["policy_id"] == policy_id:
                policy = p
                break
        
        if not policy:
            return False, "Policy not found"
        
        # Check if operation is allowed
        if operation not in policy["allowed_operations"]:
            return False, "Operation not allowed by policy"
        
        # Check if resource path matches pattern
        # For simplicity, we just check if the resource path starts with the pattern
        # In a real implementation, this would use proper pattern matching
        if not resource_path.startswith(policy["resource_pattern"].replace("*", "")):
            return False, "Resource path does not match policy pattern"
        
        # Check trust level
        if self.trust_boundary_manager:
            boundaries = self.trust_boundary_manager.list_boundaries(
                source_instance_id=source_id,
                target_instance_id=self.instance_id
            )
            
            if not boundaries:
                return False, "No trust boundary exists"
            
            trust_level = boundaries[0]["trust_level"]
            
            if trust_level < policy["required_trust_level"]:
                return False, "Insufficient trust level for policy"
        
        # Check attestations
        if self.attestation_service and policy["required_attestations"]:
            for att_type in policy["required_attestations"]:
                attestations = self.attestation_service.list_attestations(
                    subject_instance_id=source_id,
                    attestation_type=att_type
                )
                
                if not attestations:
                    return False, f"Missing required attestation: {att_type}"
                
                # Verify the attestation
                is_valid, _ = self.attestation_service.verify_attestation(
                    attestation_id=attestations[0]["attestation_id"]
                )
                
                if not is_valid:
                    return False, f"Attestation verification failed: {att_type}"
        
        # Log the enforcement action
        self.log_enforcement_action(
            source_id=source_id,
            operation=operation,
            resource_path=resource_path,
            is_allowed=True,
            reason=f"Policy {policy_id} allows access"
        )
        
        return True, "Access allowed by policy"
    
    def log_enforcement_action(self, source_id: str, operation: str,
                             resource_path: str, is_allowed: bool, reason: str) -> str:
        """
        Log an enforcement action.
        
        Args:
            source_id: The ID of the source instance
            operation: The operation being performed
            resource_path: Path to the resource being accessed
            is_allowed: Whether access was allowed
            reason: Reason for the decision
            
        Returns:
            The ID of the created log entry
        """
        log_id = f"el-{uuid.uuid4().hex}"
        
        log_entry = {
            "log_id": log_id,
            "timestamp": datetime.utcnow().isoformat() + 'Z',
            "source_instance_id": source_id,
            "target_instance_id": self.instance_id,
            "operation": operation,
            "resource_path": resource_path,
            "is_allowed": is_allowed,
            "reason": reason
        }
        
        # Add to logs
        self.enforcement_logs.append(log_entry)
        
        return log_id
    
    def get_enforcement_logs(self, source_id: str = None, operation: str = None,
                           resource_path: str = None, is_allowed: bool = None) -> List[Dict]:
        """
        Get enforcement logs, optionally filtered.
        
        Args:
            source_id: Optional source instance ID to filter by
            operation: Optional operation to filter by
            resource_path: Optional resource path to filter by
            is_allowed: Optional allowed status to filter by
            
        Returns:
            List of matching log entries
        """
        results = []
        
        for log in self.enforcement_logs:
            if source_id and log["source_instance_id"] != source_id:
                continue
            
            if operation and log["operation"] != operation:
                continue
            
            if resource_path and log["resource_path"] != resource_path:
                continue
            
            if is_allowed is not None and log["is_allowed"] != is_allowed:
                continue
            
            results.append(log)
        
        return results
    
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
            "component": "BoundaryEnforcementModule",
            "status": "compliant",
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
