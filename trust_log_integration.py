"""
Trust Log integration for Merkle seals and conflict metadata.

This module implements Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.20
Phase ID: 5.3
Clauses: 5.3, 11.0, 12.20
"""

import json
import uuid
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional, Union

from merkle_tree import pre_loop_tether_check
from merkle_sealing import MerkleSealGenerator
from conflict_detection import ConflictDetector


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
        
        # Load schema
        schema_path = os.path.join("schemas", schema_file)
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        
        # Validate
        jsonschema.validate(data, schema)
        return True, None
    except Exception as e:
        return False, str(e)


class TrustLogIntegration:
    """
    Integrates Merkle seals and conflict metadata with the Trust Log UI.
    
    This component implements Phase 5.3 of the Promethios roadmap.
    Codex Contract: v2025.05.20
    Phase ID: 5.3
    Clauses: 5.3, 11.0, 12.20
    """
    
    def __init__(self, merkle_seal_generator: MerkleSealGenerator, conflict_detector: ConflictDetector):
        """
        Initialize the Trust Log integration.
        
        Args:
            merkle_seal_generator: MerkleSealGenerator instance
            conflict_detector: ConflictDetector instance
        """
        # Perform pre-loop tether check
        if not pre_loop_tether_check("v2025.05.20", "5.3"):
            raise ValueError("Pre-loop tether check failed: Invalid contract version or phase ID")
            
        self.merkle_seal_generator = merkle_seal_generator
        self.conflict_detector = conflict_detector
        self.trust_log_entries: List[Dict[str, Any]] = []
    
    def create_trust_log_entry(self, execution_id: str, outputs: List[Dict[str, Any]], 
                              conflict_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create a Trust Log entry with Merkle seal and conflict metadata.
        
        Args:
            execution_id: ID of the execution
            outputs: List of execution outputs to seal
            conflict_metadata: Optional conflict metadata to include
            
        Returns:
            Trust Log entry
        """
        # Create Merkle seal
        merkle_seal = self.merkle_seal_generator.create_seal(outputs, conflict_metadata)
        
        # Create Trust Log entry
        entry_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        trust_log_entry = {
            "entry_id": entry_id,
            "execution_id": execution_id,
            "timestamp": timestamp,
            "merkle_seal": merkle_seal,
            "contract_version": "v2025.05.20",
            "phase_id": "5.3",
            "codex_clauses": ["5.3", "11.0", "12.20"],
            "trust_surface": {
                "trust_score": self._calculate_trust_score(merkle_seal, conflict_metadata),
                "verification_status": "verified",
                "verification_timestamp": timestamp,
                "verification_method": "merkle_seal"
            }
        }
        
        # Hash-seal the trust log entry
        trust_log_entry["entry_hash"] = self._hash_trust_log_entry(trust_log_entry)
        
        # Store the entry
        self.trust_log_entries.append(trust_log_entry)
        
        return trust_log_entry
    
    def _hash_trust_log_entry(self, entry: Dict[str, Any]) -> str:
        """
        Create a hash seal for a Trust Log entry.
        
        Args:
            entry: Trust Log entry to hash
            
        Returns:
            Hash of the entry
        """
        # Create a copy without the hash field
        entry_copy = entry.copy()
        if "entry_hash" in entry_copy:
            del entry_copy["entry_hash"]
        
        # Serialize and hash
        serialized = json.dumps(entry_copy, sort_keys=True)
        return hashlib.sha256(serialized.encode()).hexdigest()
    
    def _calculate_trust_score(self, merkle_seal: Dict[str, Any], 
                              conflict_metadata: Optional[Dict[str, Any]]) -> float:
        """
        Calculate a trust score based on Merkle seal and conflict metadata.
        
        Args:
            merkle_seal: Merkle seal
            conflict_metadata: Optional conflict metadata
            
        Returns:
            Trust score between 0.0 and 1.0
        """
        # Start with a high base score
        base_score = 0.8  
        
        # Reduce score based on conflict severity
        if conflict_metadata:
            conflict_type = conflict_metadata.get("conflict_type", "none")
            severity = conflict_metadata.get("severity", "low")
            
            if conflict_type != "none":
                if severity == "low":
                    base_score = 0.7  # Exact value to avoid floating point issues
                elif severity == "medium":
                    base_score = 0.6  # Exact value to avoid floating point issues
                elif severity == "high":
                    base_score = 0.4  # Exact value to avoid floating point issues
                elif severity == "critical":
                    base_score = 0.2  # Exact value to avoid floating point issues
        
        # Ensure score is between 0.0 and 1.0
        return max(0.0, min(1.0, base_score))
    
    def get_trust_log_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a Trust Log entry by ID.
        
        Args:
            entry_id: ID of the entry to get
            
        Returns:
            Trust Log entry or None if not found
        """
        for entry in self.trust_log_entries:
            if entry.get("entry_id") == entry_id:
                return entry
        return None
    
    def get_trust_log_entries_for_execution(self, execution_id: str) -> List[Dict[str, Any]]:
        """
        Get Trust Log entries for a specific execution.
        
        Args:
            execution_id: ID of the execution
            
        Returns:
            List of Trust Log entries
        """
        return [
            entry for entry in self.trust_log_entries
            if entry.get("execution_id") == execution_id
        ]
    
    def verify_trust_log_entry(self, entry: Dict[str, Any]) -> bool:
        """
        Verify the integrity of a Trust Log entry.
        
        Args:
            entry: Trust Log entry to verify
            
        Returns:
            Boolean indicating whether the entry is valid
        """
        # Verify hash seal
        expected_hash = entry.get("entry_hash")
        if not expected_hash:
            return False
        
        actual_hash = self._hash_trust_log_entry(entry)
        if expected_hash != actual_hash:
            return False
        
        # Verify Merkle seal
        merkle_seal = entry.get("merkle_seal")
        if not merkle_seal:
            return False
        
        return self.merkle_seal_generator.verify_seal(merkle_seal)
    
    def prepare_ui_data(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare Trust Log entry data for UI display.
        
        Args:
            entry: Trust Log entry to prepare
            
        Returns:
            UI-ready data object
        """
        # Create UI-ready data object
        ui_data = {
            "entry_id": entry.get("entry_id"),
            "execution_id": entry.get("execution_id"),
            "timestamp": entry.get("timestamp"),
            "merkle_seal": {
                "seal_id": entry.get("merkle_seal", {}).get("seal_id"),
                "root_hash": entry.get("merkle_seal", {}).get("root_hash"),
                "timestamp": entry.get("merkle_seal", {}).get("timestamp"),
                "tree_metadata": entry.get("merkle_seal", {}).get("tree_metadata", {}),
                "sealed_entries_count": len(entry.get("merkle_seal", {}).get("sealed_entries", [])),
                "has_previous_seal": entry.get("merkle_seal", {}).get("previous_seal_id") is not None
            },
            "conflict_metadata": entry.get("merkle_seal", {}).get("conflict_metadata", {}),
            "trust_surface": entry.get("trust_surface", {}),
            "verification": {
                "is_verified": self.verify_trust_log_entry(entry),
                "verification_method": "merkle_seal",
                "codex_clauses": entry.get("codex_clauses", [])
            }
        }
        
        return ui_data
