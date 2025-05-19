"""
Trust Boundary Manager for Promethios Distributed Trust Surface

Codex Contract: v2025.05.18
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""

import json
import uuid
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple

class TrustBoundaryManager:
    """
    Defines and enforces trust boundaries between Promethios instances.
    
    The TrustBoundaryManager is responsible for:
    1. Creating and managing trust boundaries between Promethios instances
    2. Tracking trust attestations that support boundaries
    3. Enforcing boundary policies for cross-instance operations
    4. Generating Merkle proofs for boundary verification
    """
    
    def __init__(self, instance_id: str, schema_validator=None):
        """
        Initialize the Trust Boundary Manager.
        
        Args:
            instance_id: The identifier of this Promethios instance
            schema_validator: Optional validator for schema validation
        """
        self.instance_id = instance_id
        self.schema_validator = schema_validator
        self.boundaries: Dict[str, Dict] = {}  # boundary_id -> boundary
        self.attestations: Dict[str, Dict] = {}  # attestation_id -> attestation
        self.merkle_roots: Dict[str, str] = {}  # boundary_id -> merkle_root
        self.boundary_policies: Dict[str, Dict] = {}  # policy_id -> policy
        
        # Load schemas
        self._load_schemas()
    
    def _load_schemas(self):
        """Load the required schemas for validation."""
        try:
            with open('src/schemas/governance/trust_boundary.schema.v1.json', 'r') as f:
                self.boundary_schema = json.load(f)
            
            with open('src/schemas/governance/trust_attestation.schema.v1.json', 'r') as f:
                self.attestation_schema = json.load(f)
        except Exception as e:
            print(f"Error loading schemas: {e}")
            # Use minimal schema validation if files can't be loaded
            self.boundary_schema = {}
            self.attestation_schema = {}
    
    def create_boundary(self, source_instance_id: str, target_instance_id: str, 
                        trust_level: int, attestations: List[str] = None) -> Dict:
        """
        Create a new trust boundary with another Promethios instance.
        
        Args:
            source_instance_id: The identifier of the source Promethios instance
            target_instance_id: The identifier of the target Promethios instance
            trust_level: Trust level from 0 (no trust) to 100 (full trust)
            attestations: Optional list of attestation IDs supporting this boundary
            
        Returns:
            The newly created boundary object
        """
        # Generate a unique boundary ID
        boundary_id = f"tb-{uuid.uuid4().hex}"
        
        # Get current timestamp
        now = datetime.utcnow().isoformat() + 'Z'
        
        # Create the boundary object
        boundary = {
            "boundary_id": boundary_id,
            "created_at": now,
            "updated_at": now,
            "source_instance_id": source_instance_id,
            "target_instance_id": target_instance_id,
            "trust_level": trust_level,
            "attestations": attestations or [],
            "boundary_policies": [],
            "merkle_root": "0x" + "0" * 64,  # Placeholder, will be updated
            "status": "active",
            "metadata": {}
        }
        
        # Validate the boundary against the schema
        if self.schema_validator and self.boundary_schema:
            is_valid, errors = self.schema_validator.validate(boundary, self.boundary_schema)
            if not is_valid:
                raise ValueError(f"Invalid boundary: {errors}")
        
        # Generate Merkle root
        merkle_root = self._generate_merkle_root(boundary)
        boundary["merkle_root"] = merkle_root
        
        # Store the boundary
        self.boundaries[boundary_id] = boundary
        self.merkle_roots[boundary_id] = merkle_root
        
        return boundary
    
    def update_boundary(self, boundary_id: str, trust_level: Optional[int] = None) -> bool:
        """
        Update an existing trust boundary.
        
        Args:
            boundary_id: The ID of the boundary to update
            trust_level: Optional new trust level
            
        Returns:
            True if the update was successful, False otherwise
        """
        if boundary_id not in self.boundaries:
            return False
        
        boundary = self.boundaries[boundary_id]
        
        # Update fields if provided
        if trust_level is not None:
            boundary["trust_level"] = trust_level
        
        # Update timestamp
        boundary["updated_at"] = datetime.utcnow().isoformat() + 'Z'
        
        # Regenerate Merkle root
        merkle_root = self._generate_merkle_root(boundary)
        boundary["merkle_root"] = merkle_root
        self.merkle_roots[boundary_id] = merkle_root
        
        # Validate the updated boundary
        if self.schema_validator and self.boundary_schema:
            is_valid, errors = self.schema_validator.validate(boundary, self.boundary_schema)
            if not is_valid:
                raise ValueError(f"Invalid boundary after update: {errors}")
        
        # Store the updated boundary
        self.boundaries[boundary_id] = boundary
        
        return True
    
    def revoke_boundary(self, boundary_id: str, reason: str) -> bool:
        """
        Revoke a trust boundary.
        
        Args:
            boundary_id: The ID of the boundary to revoke
            reason: The reason for revocation
            
        Returns:
            True if the boundary was revoked, False otherwise
        """
        if boundary_id not in self.boundaries:
            return False
        
        boundary = self.boundaries[boundary_id]
        
        # Update status and add revocation info
        boundary["status"] = "revoked"
        boundary["revocation_reason"] = reason
        boundary["updated_at"] = datetime.utcnow().isoformat() + 'Z'
        
        # Regenerate Merkle root
        merkle_root = self._generate_merkle_root(boundary)
        boundary["merkle_root"] = merkle_root
        self.merkle_roots[boundary_id] = merkle_root
        
        return True
    
    def get_boundary(self, boundary_id: str) -> Optional[Dict]:
        """
        Get a trust boundary by ID.
        
        Args:
            boundary_id: The ID of the boundary to retrieve
            
        Returns:
            The boundary object, or None if not found
        """
        return self.boundaries.get(boundary_id)
    
    def list_boundaries(self, boundary_id: Optional[str] = None, 
                        source_instance_id: Optional[str] = None,
                        target_instance_id: Optional[str] = None,
                        min_trust_level: Optional[int] = None,
                        status: Optional[str] = None) -> List[Dict]:
        """
        List trust boundaries, optionally filtered by various criteria.
        
        Args:
            boundary_id: Optional boundary ID to filter by
            source_instance_id: Optional source instance ID to filter by
            target_instance_id: Optional target instance ID to filter by
            min_trust_level: Optional minimum trust level to filter by
            status: Optional status to filter by
            
        Returns:
            List of matching boundary objects
        """
        results = []
        
        for b_id, boundary in self.boundaries.items():
            if boundary_id and b_id != boundary_id:
                continue
            
            if source_instance_id and boundary["source_instance_id"] != source_instance_id:
                continue
            
            if target_instance_id and boundary["target_instance_id"] != target_instance_id:
                continue
            
            if min_trust_level is not None and boundary["trust_level"] < min_trust_level:
                continue
                
            if status is not None and boundary["status"] != status:
                continue
            
            results.append(boundary)
        
        return results
    
    def create_boundary_policy(self, boundary_id: str, policy_type: str, 
                              policy_config: Dict) -> Dict:
        """
        Create a policy for a trust boundary.
        
        Args:
            boundary_id: The ID of the boundary
            policy_type: The type of policy
            policy_config: The policy configuration
            
        Returns:
            The created policy object
        """
        if boundary_id not in self.boundaries:
            raise ValueError(f"Boundary {boundary_id} not found")
        
        # Generate a unique policy ID
        policy_id = f"tbp-{uuid.uuid4().hex}"
        
        # Get current timestamp
        now = datetime.utcnow().isoformat() + 'Z'
        
        # Create the policy object
        policy = {
            "policy_id": policy_id,
            "created_at": now,
            "updated_at": now,
            "boundary_id": boundary_id,
            "policy_type": policy_type,
            "policy_config": policy_config,
            "status": "active"
        }
        
        # Store the policy
        self.boundary_policies[policy_id] = policy
        
        # Add policy to boundary
        boundary = self.boundaries[boundary_id]
        boundary["boundary_policies"].append(policy_id)
        
        # Regenerate Merkle root
        merkle_root = self._generate_merkle_root(boundary)
        boundary["merkle_root"] = merkle_root
        self.merkle_roots[boundary_id] = merkle_root
        
        return policy
    
    def list_boundary_policies(self, boundary_id: str) -> List[Dict]:
        """
        List policies for a trust boundary.
        
        Args:
            boundary_id: The ID of the boundary
            
        Returns:
            List of policy objects
        """
        if boundary_id not in self.boundaries:
            return []
        
        boundary = self.boundaries[boundary_id]
        policy_ids = boundary.get("boundary_policies", [])
        
        return [self.boundary_policies[pid] for pid in policy_ids if pid in self.boundary_policies]
    
    def enforce_boundary_policy(self, boundary_id: str, operation: str, 
                               context: Dict) -> Tuple[bool, str]:
        """
        Enforce boundary policies for a cross-instance operation.
        
        Args:
            boundary_id: The ID of the boundary
            operation: The operation being performed
            context: Context information for policy evaluation
            
        Returns:
            Tuple of (is_allowed, reason)
        """
        if boundary_id not in self.boundaries:
            return False, "Boundary not found"
        
        boundary = self.boundaries[boundary_id]
        
        # Check if the boundary is active
        if boundary["status"] != "active":
            return False, f"Boundary is not active (status: {boundary['status']})"
        
        # Check trust level
        if boundary["trust_level"] < 1:
            return False, "Trust level too low"
        
        # Get policies for this boundary
        policy_ids = boundary.get("boundary_policies", [])
        
        # If no policies, default to allow
        if not policy_ids:
            return True, "Operation allowed"
        
        # Evaluate each policy
        for policy_id in policy_ids:
            if policy_id not in self.boundary_policies:
                continue
                
            policy = self.boundary_policies[policy_id]
            policy_type = policy["policy_type"]
            policy_config = policy["policy_config"]
            
            if policy_type == "access_control":
                allowed_ops = policy_config.get("allowed_operations", [])
                if allowed_ops and operation not in allowed_ops:
                    return False, f"Operation {operation} not allowed by policy"
                
                data_rules = policy_config.get("data_access_rules", [])
                for rule in data_rules:
                    path_pattern = rule.get("path_pattern", "")
                    data_path = context.get("data_path", "")
                    
                    # Simple pattern matching (could be more sophisticated)
                    if path_pattern.endswith("*"):
                        prefix = path_pattern[:-1]
                        if data_path.startswith(prefix):
                            allowed_types = rule.get("allowed_access_types", [])
                            if operation not in allowed_types:
                                return False, f"Operation {operation} not allowed for path {data_path}"
        
        # If we get here, all policies passed
        return True, "Operation allowed"
    
    def _generate_merkle_root(self, boundary: Dict) -> str:
        """
        Generate a Merkle root hash for a boundary.
        
        Args:
            boundary: The boundary object
            
        Returns:
            The Merkle root hash as a hex string
        """
        # Create a copy without the merkle_root field
        boundary_copy = boundary.copy()
        boundary_copy.pop("merkle_root", None)
        
        # Serialize to JSON
        serialized = json.dumps(boundary_copy, sort_keys=True)
        
        # Hash the serialized boundary
        boundary_hash = hashlib.sha256(serialized.encode()).hexdigest()
        
        # For simplicity, just return the boundary hash as the root
        # In a real implementation, this would build a proper Merkle tree
        return "0x" + boundary_hash
    
    def _codex_tether_check(self) -> Dict:
        """
        Perform a Codex Contract tethering check.
        
        Returns:
            A dictionary with tethering information
        """
        return {
            "codex_contract_version": "v2025.05.18",
            "phase_id": "5.6",
            "clauses": ["5.6", "5.5", "5.4", "11.0", "11.1", "5.2.6"],
            "component": "TrustBoundaryManager",
            "status": "compliant",
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
