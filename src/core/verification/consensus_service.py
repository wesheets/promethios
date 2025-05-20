"""
Consensus Service for managing consensus formation in the distributed verification network.

This module implements Phase 5.4 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import json
import uuid
import hashlib
import base64
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple, Set

# Import from verification_node_manager.py
from src.core.verification.verification_node_manager import pre_loop_tether_check, validate_against_schema


class ThresholdSignature:
    """
    Implements threshold signatures for collective attestation.
    
    This component implements Phase 5.4 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.4
    Clauses: 5.4, 11.0
    """
    
    def __init__(self, threshold: float = 0.67):
        """
        Initialize the threshold signature system.
        
        Args:
            threshold: Threshold required for signature (between 0.5 and 1.0)
        """
        # Perform pre-loop tether check
        if not pre_loop_tether_check("v2025.05.18", "5.4"):
            raise ValueError("Pre-loop tether check failed: Invalid contract version or phase ID")
            
        if threshold < 0.5 or threshold > 1.0:
            raise ValueError("Threshold must be between 0.5 and 1.0")
            
        self.threshold = threshold
        self.signatures: Dict[str, Dict[str, Any]] = {}
    
    def add_signature(self, message_id: str, node_id: str, signature: str) -> None:
        """
        Add a signature to a message.
        
        Args:
            message_id: ID of the message being signed
            node_id: ID of the node providing the signature
            signature: Cryptographic signature
        """
        if message_id not in self.signatures:
            self.signatures[message_id] = {
                "signatures": {},
                "threshold_reached": False,
                "threshold_signature": None
            }
        
        self.signatures[message_id]["signatures"][node_id] = signature
    
    def check_threshold(self, message_id: str, total_nodes: int) -> bool:
        """
        Check if the threshold has been reached for a message.
        
        Args:
            message_id: ID of the message
            total_nodes: Total number of nodes in the network
            
        Returns:
            Boolean indicating whether the threshold has been reached
        """
        if message_id not in self.signatures:
            return False
        
        signature_count = len(self.signatures[message_id]["signatures"])
        threshold_count = int(total_nodes * self.threshold)
        
        return signature_count >= threshold_count
    
    def generate_threshold_signature(self, message_id: str, total_nodes: int) -> Optional[str]:
        """
        Generate a threshold signature if the threshold has been reached.
        
        Args:
            message_id: ID of the message
            total_nodes: Total number of nodes in the network
            
        Returns:
            Threshold signature or None if threshold not reached
        """
        if not self.check_threshold(message_id, total_nodes):
            return None
        
        # Combine signatures
        # In a real implementation, this would use a cryptographic threshold signature scheme
        # For demonstration, we'll concatenate and hash the signatures
        
        signatures = self.signatures[message_id]["signatures"]
        combined = "".join(sorted(signatures.values()))
        threshold_signature = hashlib.sha256(combined.encode()).hexdigest()
        
        # Encode in base64 for schema compatibility
        threshold_signature_b64 = base64.b64encode(threshold_signature.encode()).decode()
        
        # Store the threshold signature
        self.signatures[message_id]["threshold_reached"] = True
        self.signatures[message_id]["threshold_signature"] = threshold_signature_b64
        
        return threshold_signature_b64
    
    def get_threshold_signature(self, message_id: str) -> Optional[str]:
        """
        Get the threshold signature for a message.
        
        Args:
            message_id: ID of the message
            
        Returns:
            Threshold signature or None if not available
        """
        if message_id not in self.signatures:
            return None
        
        return self.signatures[message_id].get("threshold_signature")


class ConsensusService:
    """
    Manages consensus formation in the distributed verification network.
    
    This component implements Phase 5.4 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.4
    Clauses: 5.4, 11.0, 5.2.5
    """
    
    def __init__(self, consensus_threshold: float = 0.67):
        """
        Initialize the consensus service.
        
        Args:
            consensus_threshold: Threshold required for consensus (between 0.5 and 1.0)
        """
        # Perform pre-loop tether check
        if not pre_loop_tether_check("v2025.05.18", "5.4"):
            raise ValueError("Pre-loop tether check failed: Invalid contract version or phase ID")
            
        if consensus_threshold < 0.5 or consensus_threshold > 1.0:
            raise ValueError("Consensus threshold must be between 0.5 and 1.0")
            
        self.consensus_threshold = consensus_threshold
        self.consensus_records: Dict[str, Dict[str, Any]] = {}
        self.threshold_signature = ThresholdSignature(consensus_threshold)
    
    def create_consensus_record(self, seal_id: str) -> Dict[str, Any]:
        """
        Create a new consensus record for a Merkle seal.
        
        Args:
            seal_id: ID of the Merkle seal to verify
            
        Returns:
            New consensus record
        """
        consensus_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        consensus_record = {
            "consensus_id": consensus_id,
            "seal_id": seal_id,
            "participating_nodes": [],
            "consensus_result": False,
            "consensus_threshold": self.consensus_threshold,
            "consensus_percentage": 0.0,
            "timestamp": timestamp,
            "contract_version": "v2025.05.18",
            "phase_id": "5.4",
            "codex_clauses": ["5.4", "11.0"]
        }
        
        # Validate against schema
        is_valid, error = validate_against_schema(
            consensus_record, 
            "consensus_record.schema.v1.json"
        )
        if not is_valid:
            raise ValueError(f"Invalid consensus record: {error}")
        
        # Store consensus record
        self.consensus_records[consensus_id] = consensus_record
        
        return consensus_record
    
    def add_verification_result(
        self, 
        consensus_id: str, 
        node_id: str, 
        verification_result: bool, 
        signature: str
    ) -> Dict[str, Any]:
        """
        Add a verification result from a node to a consensus record.
        
        Args:
            consensus_id: ID of the consensus record
            node_id: ID of the verification node
            verification_result: Result of the verification
            signature: Cryptographic signature of the verification result
            
        Returns:
            Updated consensus record
        """
        if consensus_id not in self.consensus_records:
            raise ValueError(f"Consensus record {consensus_id} not found")
        
        consensus_record = self.consensus_records[consensus_id]
        
        # Check if node has already participated
        for node in consensus_record["participating_nodes"]:
            if node["node_id"] == node_id:
                raise ValueError(f"Node {node_id} has already participated in consensus {consensus_id}")
        
        # Add verification result
        timestamp = datetime.utcnow().isoformat() + "Z"
        node_result = {
            "node_id": node_id,
            "verification_result": verification_result,
            "signature": signature,
            "timestamp": timestamp
        }
        
        consensus_record["participating_nodes"].append(node_result)
        
        # Add signature to threshold signature system
        self.threshold_signature.add_signature(consensus_id, node_id, signature)
        
        # Update consensus record
        self._update_consensus_status(consensus_id)
        
        # Validate updated consensus record
        is_valid, error = validate_against_schema(
            consensus_record, 
            "consensus_record.schema.v1.json"
        )
        if not is_valid:
            # Revert changes
            consensus_record["participating_nodes"].pop()
            raise ValueError(f"Invalid consensus record after update: {error}")
        
        return consensus_record
    
    def _update_consensus_status(self, consensus_id: str) -> None:
        """
        Update the consensus status based on verification results.
        
        Args:
            consensus_id: ID of the consensus record
        """
        consensus_record = self.consensus_records[consensus_id]
        participating_nodes = consensus_record["participating_nodes"]
        
        if not participating_nodes:
            return
        
        # Count positive verifications
        positive_count = sum(1 for node in participating_nodes if node["verification_result"])
        total_count = len(participating_nodes)
        
        # Calculate consensus percentage
        consensus_percentage = positive_count / total_count
        consensus_record["consensus_percentage"] = consensus_percentage
        
        # Check if consensus threshold is reached
        if consensus_percentage >= self.consensus_threshold:
            consensus_record["consensus_result"] = True
        else:
            consensus_record["consensus_result"] = False
        
        # Check if threshold signature can be generated
        threshold_signature = self.threshold_signature.generate_threshold_signature(
            consensus_id, 
            total_count
        )
        if threshold_signature:
            consensus_record["threshold_signature"] = threshold_signature
        
        # Update timestamp
        consensus_record["timestamp"] = datetime.utcnow().isoformat() + "Z"
    
    def get_consensus_record(self, consensus_id: str) -> Dict[str, Any]:
        """
        Get a consensus record by ID.
        
        Args:
            consensus_id: ID of the consensus record
            
        Returns:
            Consensus record
        """
        if consensus_id not in self.consensus_records:
            raise ValueError(f"Consensus record {consensus_id} not found")
        
        return self.consensus_records[consensus_id]
    
    def get_consensus_by_seal(self, seal_id: str) -> List[Dict[str, Any]]:
        """
        Get all consensus records for a Merkle seal.
        
        Args:
            seal_id: ID of the Merkle seal
            
        Returns:
            List of consensus records
        """
        return [
            record for record in self.consensus_records.values()
            if record["seal_id"] == seal_id
        ]
    
    def get_all_consensus_records(self) -> List[Dict[str, Any]]:
        """
        Get all consensus records.
        
        Returns:
            List of all consensus records
        """
        return list(self.consensus_records.values())
    
    def resolve_conflict(self, consensus_id: str, resolution_method: str, details: str) -> Dict[str, Any]:
        """
        Resolve a conflict in consensus.
        
        Args:
            consensus_id: ID of the consensus record
            resolution_method: Method used to resolve the conflict
            details: Details about the conflict resolution
            
        Returns:
            Updated consensus record
        """
        if consensus_id not in self.consensus_records:
            raise ValueError(f"Consensus record {consensus_id} not found")
        
        valid_methods = ["majority_vote", "weighted_vote", "authority_decision", "none"]
        if resolution_method not in valid_methods:
            raise ValueError(f"Invalid resolution method: {resolution_method}. Must be one of {valid_methods}")
        
        consensus_record = self.consensus_records[consensus_id]
        
        # Initialize conflict resolution if not present
        if "conflict_resolution" not in consensus_record:
            consensus_record["conflict_resolution"] = {
                "conflict_detected": True,
                "resolution_method": "none",
                "resolution_details": ""
            }
        
        # Update conflict resolution
        consensus_record["conflict_resolution"]["conflict_detected"] = True
        consensus_record["conflict_resolution"]["resolution_method"] = resolution_method
        consensus_record["conflict_resolution"]["resolution_details"] = details
        
        # Update timestamp
        consensus_record["timestamp"] = datetime.utcnow().isoformat() + "Z"
        
        # Validate updated consensus record
        is_valid, error = validate_against_schema(
            consensus_record, 
            "consensus_record.schema.v1.json"
        )
        if not is_valid:
            # Revert changes
            if "conflict_resolution" in consensus_record:
                del consensus_record["conflict_resolution"]
            raise ValueError(f"Invalid consensus record after update: {error}")
        
        return consensus_record
    
    def detect_conflicts(self, consensus_id: str) -> bool:
        """
        Detect conflicts in a consensus record.
        
        Args:
            consensus_id: ID of the consensus record
            
        Returns:
            Boolean indicating whether a conflict was detected
        """
        if consensus_id not in self.consensus_records:
            raise ValueError(f"Consensus record {consensus_id} not found")
        
        consensus_record = self.consensus_records[consensus_id]
        participating_nodes = consensus_record["participating_nodes"]
        
        if len(participating_nodes) < 2:
            return False
        
        # Check for disagreements
        results = [node["verification_result"] for node in participating_nodes]
        if all(results) or not any(results):
            # All agree (all True or all False)
            return False
        
        # Disagreement detected
        if "conflict_resolution" not in consensus_record:
            consensus_record["conflict_resolution"] = {
                "conflict_detected": True,
                "resolution_method": "none",
                "resolution_details": "Verification results in disagreement"
            }
        
        return True
    
    def get_verification_status(self, seal_id: str) -> Dict[str, Any]:
        """
        Get the verification status for a Merkle seal.
        
        Args:
            seal_id: ID of the Merkle seal
            
        Returns:
            Verification status
        """
        consensus_records = self.get_consensus_by_seal(seal_id)
        
        if not consensus_records:
            return {
                "seal_id": seal_id,
                "verification_status": "not_verified",
                "consensus_count": 0,
                "latest_consensus": None
            }
        
        # Get the latest consensus record
        latest_consensus = max(
            consensus_records,
            key=lambda record: record["timestamp"]
        )
        
        # Determine verification status
        if latest_consensus["consensus_result"]:
            verification_status = "verified"
        elif self.detect_conflicts(latest_consensus["consensus_id"]):
            verification_status = "conflict"
        else:
            verification_status = "pending"
        
        return {
            "seal_id": seal_id,
            "verification_status": verification_status,
            "consensus_count": len(consensus_records),
            "latest_consensus": latest_consensus["consensus_id"]
        }
