"""
Merkle Seal Generator for execution outputs and conflict metadata.

This module implements Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.3
Clauses: 5.3, 11.0
"""

import hashlib
import json
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Union

from src.core.merkle.merkle_tree import MerkleTree, pre_loop_tether_check


def validate_against_schema(data: Dict[str, Any], schema_file: str) -> tuple[bool, Optional[str]]:
    """
    Validate data against a JSON schema.
    
    Args:
        data: Data to validate
        schema_file: Path to the schema file
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        import jsonschema
        import os
        
        # Load schema from canonical location
        schema_path = os.path.join("/home/ubuntu/promethios/schemas/merkle", schema_file)
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        
        # Validate
        jsonschema.validate(data, schema)
        return True, None
    except Exception as e:
        return False, str(e)


class MerkleSealGenerator:
    """
    Generates Merkle seals for execution outputs and conflict metadata.
    
    This component implements Phase 5.3 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.3
    Clauses: 5.3, 11.0
    """
    
    def __init__(self):
        """Initialize the Merkle seal generator."""
        # Perform pre-loop tether check
        if not pre_loop_tether_check("v2025.05.18", "5.3"):
            raise ValueError("Pre-loop tether check failed: Invalid contract version or phase ID")
            
        self.merkle_tree = MerkleTree()
        self.previous_seal_id: Optional[str] = None
    
    def create_seal(self, outputs: List[Dict[str, Any]], conflict_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create a Merkle seal for the given outputs and conflict metadata.
        
        Args:
            outputs: List of execution outputs to seal
            conflict_metadata: Optional conflict metadata to include
            
        Returns:
            A Merkle seal object conforming to merkle_seal.schema.v1.json
        """
        # Validate against schema
        if conflict_metadata:
            is_valid, error = validate_against_schema(
                conflict_metadata, 
                "conflict_metadata.schema.v1.json"
            )
            if not is_valid:
                raise ValueError(f"Invalid conflict metadata: {error}")
        
        # Add outputs to Merkle tree
        sealed_entries = []
        for output in outputs:
            entry_id = output.get("id", str(uuid.uuid4()))
            entry_hash = self.merkle_tree.add_leaf(output)
            sealed_entries.append({
                "entry_id": entry_id,
                "entry_hash": entry_hash
            })
        
        # Build the Merkle tree
        root_hash = self.merkle_tree.build_tree()
        
        # Create the seal
        seal_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Prepare conflict metadata if not provided
        if not conflict_metadata:
            conflict_metadata = {
                "conflict_id": str(uuid.uuid4()),
                "conflict_type": "none",
                "agent_ids": [str(uuid.uuid4())],  # Generate a placeholder agent ID
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "timestamp_hash": hashlib.sha256(timestamp.encode()).hexdigest(),
                "contract_version": "v2025.05.18",
                "phase_id": "5.3",
                "severity": "low",
                "resolution_status": "unresolved",
                "conflict_details": {
                    "description": "No conflict detected",
                    "affected_components": [],
                    "evidence": []
                },
                "resolution_path": [],
                "arbitration_metadata": {
                    "arbitration_status": "not_required"
                },
                "codex_clauses": ["5.3", "11.0"]
            }
        else:
            # Ensure conflict metadata has all required fields
            if "conflict_id" not in conflict_metadata:
                conflict_metadata["conflict_id"] = str(uuid.uuid4())
            if "timestamp" not in conflict_metadata:
                conflict_metadata["timestamp"] = datetime.utcnow().isoformat() + "Z"
            if "contract_version" not in conflict_metadata:
                conflict_metadata["contract_version"] = "v2025.05.18"
            if "phase_id" not in conflict_metadata:
                conflict_metadata["phase_id"] = "5.3"
            if "conflict_details" not in conflict_metadata:
                conflict_metadata["conflict_details"] = {
                    "description": f"{conflict_metadata.get('conflict_type', 'unknown')} conflict detected",
                    "affected_components": [],
                    "evidence": []
                }
            if "resolution_path" not in conflict_metadata:
                conflict_metadata["resolution_path"] = []
            if "arbitration_metadata" not in conflict_metadata:
                conflict_metadata["arbitration_metadata"] = {
                    "arbitration_status": "not_required"
                }
            if "codex_clauses" not in conflict_metadata:
                conflict_metadata["codex_clauses"] = ["5.3", "11.0"]
        
        # Create the seal object
        seal = {
            "seal_id": seal_id,
            "root_hash": root_hash,
            "timestamp": timestamp,
            "contract_version": "v2025.05.18",
            "phase_id": "5.3",
            "conflict_metadata": conflict_metadata,
            "tree_metadata": {
                "leaf_count": len(self.merkle_tree.leaves),
                "tree_height": len(self.merkle_tree.nodes),
                "algorithm": self.merkle_tree.algorithm
            },
            "sealed_entries": sealed_entries,
            "codex_clauses": ["5.3", "11.0"]
        }
        
        # Add previous_seal_id only if it exists
        if self.previous_seal_id:
            seal["previous_seal_id"] = self.previous_seal_id
        
        # Validate the seal against schema
        is_valid, error = validate_against_schema(seal, "merkle_seal.schema.v1.json")
        if not is_valid:
            raise ValueError(f"Invalid Merkle seal: {error}")
        
        # Update previous seal ID for chaining
        self.previous_seal_id = seal_id
        
        return seal
    
    def verify_seal(self, seal: Dict[str, Any], outputs: Optional[List[Dict[str, Any]]] = None) -> bool:
        """
        Verify a Merkle seal.
        
        Args:
            seal: The Merkle seal to verify
            outputs: Optional outputs to verify against the seal
            
        Returns:
            Boolean indicating whether the seal is valid
        """
        # Validate against schema
        is_valid, error = validate_against_schema(seal, "merkle_seal.schema.v1.json")
        if not is_valid:
            return False
        
        # If outputs provided, verify them against the seal
        if outputs:
            # Create a temporary Merkle tree
            temp_tree = MerkleTree()
            
            # Add outputs to the tree
            for output in outputs:
                temp_tree.add_leaf(output)
            
            # Build the tree and check the root hash
            root_hash = temp_tree.build_tree()
            if root_hash != seal["root_hash"]:
                return False
        
        return True
    
    def get_seal_chain(self, seal_id: str, seal_store: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Get the chain of seals starting from the specified seal.
        
        Args:
            seal_id: ID of the seal to start from
            seal_store: Dictionary of stored seals, keyed by seal_id
            
        Returns:
            List of seals in the chain, from newest to oldest
        """
        if seal_id not in seal_store:
            return []
        
        chain = []
        current_seal_id = seal_id
        
        while current_seal_id and current_seal_id in seal_store:
            current_seal = seal_store[current_seal_id]
            chain.append(current_seal)
            current_seal_id = current_seal.get("previous_seal_id")
        
        return chain
    
    def verify_seal_chain(self, chain: List[Dict[str, Any]]) -> bool:
        """
        Verify the integrity of a chain of seals.
        
        Args:
            chain: List of seals in the chain, from newest to oldest
            
        Returns:
            Boolean indicating whether the chain is valid
        """
        if not chain:
            return True  # Empty chain is valid
        
        for i in range(len(chain) - 1):
            current_seal = chain[i]
            previous_seal = chain[i + 1]
            
            # Check that the previous_seal_id matches
            if current_seal.get("previous_seal_id") != previous_seal.get("seal_id"):
                return False
            
            # Validate each seal
            if not self.verify_seal(current_seal) or not self.verify_seal(previous_seal):
                return False
        
        return True
