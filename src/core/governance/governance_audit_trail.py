"""
Governance Audit Trail for the Governance Attestation Framework.

This module provides the core functionality for creating and maintaining immutable
audit trails for governance decisions within the Promethios governance framework.
"""

import json
import uuid
import hashlib
import logging
import datetime
from typing import Dict, List, Optional, Any, Tuple, Union
from pathlib import Path

# Import required dependencies
try:
    from src.core.governance.attestation_service import AttestationService
    from src.core.verification.seal_verification import SealVerificationService
    from src.core.trust.trust_decay_engine import TrustDecayEngine
    from src.core.common.schema_validator import SchemaValidator
except ImportError:
    # Handle import errors gracefully for testing environments
    logging.warning("Running with mock dependencies. Some functionality may be limited.")
    AttestationService = None
    SealVerificationService = None
    TrustDecayEngine = None
    SchemaValidator = None


class GovernanceAuditTrail:
    """
    Service for creating and maintaining immutable audit trails for governance decisions.
    
    The GovernanceAuditTrail provides functionality for:
    - Audit event logging
    - Merkle tree-based audit trail
    - Audit trail verification
    - Audit event querying and filtering
    
    This service integrates with the AttestationService for attestation validation,
    the SealVerificationService for contract state verification, and the
    TrustDecayEngine for trust-related operations.
    """
    
    # Codex Contract Tethering
    CODEX_CONTRACT_ID = "governance.governance_audit_trail"
    CODEX_CONTRACT_VERSION = "1.0.0"
    
    # Event type constants
    EVENT_ATTESTATION_CREATED = "ATTESTATION_CREATED"
    EVENT_ATTESTATION_VERIFIED = "ATTESTATION_VERIFIED"
    EVENT_ATTESTATION_REVOKED = "ATTESTATION_REVOKED"
    EVENT_CLAIM_CREATED = "CLAIM_CREATED"
    EVENT_CLAIM_VERIFIED = "CLAIM_VERIFIED"
    EVENT_CLAIM_REJECTED = "CLAIM_REJECTED"
    EVENT_AUTHORITY_REGISTERED = "AUTHORITY_REGISTERED"
    EVENT_AUTHORITY_UPDATED = "AUTHORITY_UPDATED"
    EVENT_AUTHORITY_REVOKED = "AUTHORITY_REVOKED"
    EVENT_GOVERNANCE_DECISION = "GOVERNANCE_DECISION"
    EVENT_COMPLIANCE_CHECK = "COMPLIANCE_CHECK"
    EVENT_SECURITY_EVENT = "SECURITY_EVENT"
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the GovernanceAuditTrail with the provided configuration.
        
        Args:
            config: Configuration dictionary with the following optional keys:
                - schema_path: Path to the audit trail schema
                - storage_path: Path for audit event storage
                - merkle_tree_path: Path for Merkle tree storage
                - attestation_service: Instance of AttestationService
                - verification_service: Instance of SealVerificationService
                - trust_decay_engine: Instance of TrustDecayEngine
                - retention_period: Default retention period for audit events
        """
        self.logger = logging.getLogger(__name__)
        self.config = config or {}
        
        # Pre-loop tether check
        self._verify_codex_contract_tether()
        
        # Initialize schema validator
        schema_path = self.config.get('schema_path', 
                                     str(Path(__file__).parent.parent.parent.parent / 
                                         'schemas/governance/audit_trail.schema.v1.json'))
        self.schema_validator = SchemaValidator(schema_path) if SchemaValidator else None
        
        # Initialize dependencies
        self.attestation_service = self.config.get('attestation_service')
        self.verification_service = self.config.get('verification_service')
        self.trust_decay_engine = self.config.get('trust_decay_engine')
        
        # Initialize storage
        self.storage_path = self.config.get('storage_path', '/tmp/audit_events')
        self.merkle_tree_path = self.config.get('merkle_tree_path', '/tmp/merkle_tree')
        Path(self.storage_path).mkdir(parents=True, exist_ok=True)
        Path(self.merkle_tree_path).mkdir(parents=True, exist_ok=True)
        
        # Initialize Merkle tree
        self.merkle_tree = self._load_merkle_tree()
        
        # Initialize event cache
        self.event_cache = {}
        
        # Initialize retention policy
        self.default_retention_period = self.config.get('retention_period', 'P7Y')  # 7 years by default
        
        self.logger.info(f"GovernanceAuditTrail initialized with schema: {schema_path}")
    
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
    
    def log_event(self, 
                 entity_id: str, 
                 event_type: str, 
                 actor_id: str,
                 event_data: Dict[str, Any],
                 metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Log an audit event and add it to the audit trail.
        
        Args:
            entity_id: Identifier of the entity being audited
            event_type: Type of audit event
            actor_id: Identifier of the actor who triggered the event
            event_data: Data specific to the event type
            metadata: Optional additional metadata for the event
            
        Returns:
            The created audit event as a dictionary
            
        Raises:
            ValueError: If the event data is invalid
            RuntimeError: If event logging fails
        """
        try:
            # Generate event ID
            event_id = f"audit-{uuid.uuid4()}"
            
            # Get current timestamp
            timestamp = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Prepare metadata
            if not metadata:
                metadata = {}
            
            if "version" not in metadata:
                metadata["version"] = "1.0.0"
            
            if "severity" not in metadata:
                metadata["severity"] = "INFO"
            
            if "retention_period" not in metadata:
                metadata["retention_period"] = self.default_retention_period
            
            # Create leaf hash for Merkle tree
            leaf_data = f"{event_id}:{entity_id}:{event_type}:{timestamp}:{actor_id}"
            leaf_hash = self._hash_data(leaf_data)
            
            # Add to Merkle tree and get proof
            merkle_proof = self._add_to_merkle_tree(leaf_hash)
            
            # Create audit event object
            audit_event = {
                "event_id": event_id,
                "entity_id": entity_id,
                "event_type": event_type,
                "timestamp": timestamp,
                "actor_id": actor_id,
                "event_data": event_data,
                "merkle_proof": merkle_proof,
                "metadata": metadata
            }
            
            # Validate against schema
            if self.schema_validator:
                self.schema_validator.validate(audit_event)
            
            # Store audit event
            self._store_event(audit_event)
            
            # Update cache
            self.event_cache[event_id] = audit_event
            
            # Trigger trust decay if available and event is significant
            if self.trust_decay_engine and event_type in [
                self.EVENT_ATTESTATION_REVOKED,
                self.EVENT_CLAIM_REJECTED,
                self.EVENT_AUTHORITY_REVOKED,
                self.EVENT_SECURITY_EVENT
            ]:
                self.trust_decay_engine.register_event(
                    entity_id=entity_id,
                    event_type=f"AUDIT_{event_type}",
                    severity=metadata.get("severity", "INFO"),
                    context={
                        "audit_event_id": event_id,
                        "actor_id": actor_id
                    }
                )
            
            self.logger.info(f"Logged audit event: {event_id} of type: {event_type}")
            return audit_event
            
        except Exception as e:
            self.logger.error(f"Failed to log audit event: {str(e)}")
            raise RuntimeError(f"Failed to log audit event: {str(e)}")
    
    def verify_event(self, event_id: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Verify the integrity of an audit event.
        
        Args:
            event_id: Identifier of the audit event to verify
            
        Returns:
            A tuple containing:
            - Boolean indicating verification success
            - Dictionary with verification details
            
        Raises:
            ValueError: If the event ID is invalid
            RuntimeError: If verification fails due to system error
        """
        try:
            # Get audit event
            audit_event = self.get_event(event_id)
            if not audit_event:
                return False, {"error": "Audit event not found"}
            
            # Extract Merkle proof
            merkle_proof = audit_event["merkle_proof"]
            root_hash = merkle_proof["root_hash"]
            path = merkle_proof["path"]
            leaf_hash = merkle_proof["leaf_hash"]
            
            # Verify Merkle proof
            calculated_root = self._verify_merkle_proof(leaf_hash, path)
            if calculated_root != root_hash:
                return False, {"error": "Invalid Merkle proof"}
            
            # Verify leaf hash
            leaf_data = f"{audit_event['event_id']}:{audit_event['entity_id']}:{audit_event['event_type']}:{audit_event['timestamp']}:{audit_event['actor_id']}"
            calculated_leaf_hash = self._hash_data(leaf_data)
            if calculated_leaf_hash != leaf_hash:
                return False, {"error": "Invalid leaf hash"}
            
            self.logger.info(f"Verified audit event: {event_id}")
            return True, {
                "event_id": event_id,
                "verification_result": "VALID",
                "root_hash": root_hash,
                "timestamp": audit_event["timestamp"]
            }
            
        except Exception as e:
            self.logger.error(f"Failed to verify audit event: {str(e)}")
            raise RuntimeError(f"Failed to verify audit event: {str(e)}")
    
    def get_event(self, event_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an audit event by its ID.
        
        Args:
            event_id: Identifier of the audit event to retrieve
            
        Returns:
            The audit event as a dictionary, or None if not found
        """
        # Check cache first
        if event_id in self.event_cache:
            return self.event_cache[event_id]
        
        # Try to load from storage
        event_path = Path(self.storage_path) / f"{event_id}.json"
        if event_path.exists():
            try:
                with open(event_path, 'r') as f:
                    audit_event = json.load(f)
                    self.event_cache[event_id] = audit_event
                    return audit_event
            except Exception as e:
                self.logger.error(f"Failed to load audit event {event_id}: {str(e)}")
        
        return None
    
    def find_events(self, 
                   entity_id: Optional[str] = None, 
                   event_type: Optional[str] = None,
                   actor_id: Optional[str] = None,
                   start_time: Optional[str] = None,
                   end_time: Optional[str] = None,
                   limit: int = 100) -> List[Dict[str, Any]]:
        """
        Find audit events matching the specified criteria.
        
        Args:
            entity_id: Optional entity ID to filter by
            event_type: Optional event type to filter by
            actor_id: Optional actor ID to filter by
            start_time: Optional ISO 8601 timestamp for start of time range
            end_time: Optional ISO 8601 timestamp for end of time range
            limit: Maximum number of events to return
            
        Returns:
            List of matching audit events
        """
        results = []
        
        # Scan storage directory
        storage_path = Path(self.storage_path)
        for file_path in storage_path.glob("audit-*.json"):
            if len(results) >= limit:
                break
                
            try:
                with open(file_path, 'r') as f:
                    audit_event = json.load(f)
                
                # Apply filters
                if entity_id and audit_event["entity_id"] != entity_id:
                    continue
                if event_type and audit_event["event_type"] != event_type:
                    continue
                if actor_id and audit_event["actor_id"] != actor_id:
                    continue
                if start_time and audit_event["timestamp"] < start_time:
                    continue
                if end_time and audit_event["timestamp"] > end_time:
                    continue
                
                results.append(audit_event)
                
                # Update cache
                self.event_cache[audit_event["event_id"]] = audit_event
                
            except Exception as e:
                self.logger.error(f"Failed to process audit event file {file_path}: {str(e)}")
        
        # Sort by timestamp (newest first)
        results.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return results[:limit]
    
    def get_entity_audit_trail(self, entity_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get the audit trail for a specific entity.
        
        Args:
            entity_id: Identifier of the entity
            limit: Maximum number of events to return
            
        Returns:
            List of audit events for the entity, sorted by timestamp (newest first)
        """
        return self.find_events(entity_id=entity_id, limit=limit)
    
    def get_merkle_root(self) -> str:
        """
        Get the current Merkle root hash.
        
        Returns:
            The current Merkle root hash
        """
        return self.merkle_tree["root_hash"]
    
    def export_merkle_tree(self) -> Dict[str, Any]:
        """
        Export the current state of the Merkle tree.
        
        Returns:
            Dictionary containing the Merkle tree state
        """
        return {
            "root_hash": self.merkle_tree["root_hash"],
            "tree_size": self.merkle_tree["tree_size"],
            "last_updated": self.merkle_tree["last_updated"]
        }
    
    def _hash_data(self, data: str) -> str:
        """
        Hash data using SHA-256.
        
        Args:
            data: Data to hash
            
        Returns:
            Hexadecimal hash string
        """
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    
    def _load_merkle_tree(self) -> Dict[str, Any]:
        """
        Load the Merkle tree from storage or initialize a new one.
        
        Returns:
            Dictionary containing the Merkle tree state
        """
        merkle_tree_file = Path(self.merkle_tree_path) / "merkle_tree.json"
        
        if merkle_tree_file.exists():
            try:
                with open(merkle_tree_file, 'r') as f:
                    merkle_tree = json.load(f)
                    self.logger.info(f"Loaded Merkle tree with size: {merkle_tree['tree_size']}")
                    return merkle_tree
            except Exception as e:
                self.logger.error(f"Failed to load Merkle tree: {str(e)}")
        
        # Initialize new Merkle tree
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        merkle_tree = {
            "root_hash": self._hash_data("initial_root"),
            "tree_size": 0,
            "last_updated": timestamp,
            "nodes": []
        }
        
        self._save_merkle_tree(merkle_tree)
        self.logger.info("Initialized new Merkle tree")
        
        return merkle_tree
    
    def _save_merkle_tree(self, merkle_tree: Dict[str, Any]) -> None:
        """
        Save the Merkle tree to storage.
        
        Args:
            merkle_tree: Dictionary containing the Merkle tree state
        """
        merkle_tree_file = Path(self.merkle_tree_path) / "merkle_tree.json"
        
        try:
            with open(merkle_tree_file, 'w') as f:
                json.dump(merkle_tree, f, indent=2)
        except Exception as e:
            self.logger.error(f"Failed to save Merkle tree: {str(e)}")
            raise RuntimeError(f"Failed to save Merkle tree: {str(e)}")
    
    def _add_to_merkle_tree(self, leaf_hash: str) -> Dict[str, Any]:
        """
        Add a leaf hash to the Merkle tree and return the proof.
        
        Args:
            leaf_hash: Hash of the leaf node to add
            
        Returns:
            Dictionary containing the Merkle proof
        """
        # Get current timestamp
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        
        # Add leaf to nodes
        self.merkle_tree["nodes"].append(leaf_hash)
        self.merkle_tree["tree_size"] += 1
        self.merkle_tree["last_updated"] = timestamp
        
        # Calculate new root hash
        nodes = self.merkle_tree["nodes"]
        current_level = nodes.copy()
        
        # Build path for proof
        path = []
        node_index = len(nodes) - 1
        
        # Calculate root hash and build proof path
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                if i + 1 < len(current_level):
                    # If this is the node we're building a proof for
                    if i <= node_index < i + 2:
                        # Add sibling to path
                        sibling_index = i if node_index == i + 1 else i + 1
                        sibling_position = "LEFT" if node_index > sibling_index else "RIGHT"
                        path.append({
                            "position": sibling_position,
                            "hash": current_level[sibling_index]
                        })
                        
                    # Hash pair of nodes
                    combined = current_level[i] + current_level[i + 1]
                    next_level.append(self._hash_data(combined))
                else:
                    # Odd number of nodes, promote the last one
                    next_level.append(current_level[i])
                    
                    # If this is the node we're building a proof for
                    if node_index == i:
                        # No sibling for this node
                        pass
            
            # Update node index for next level
            node_index = node_index // 2
            current_level = next_level
        
        # Update root hash
        root_hash = current_level[0]
        self.merkle_tree["root_hash"] = root_hash
        
        # Save updated Merkle tree
        self._save_merkle_tree(self.merkle_tree)
        
        # Create Merkle proof
        merkle_proof = {
            "root_hash": root_hash,
            "path": path,
            "leaf_hash": leaf_hash,
            "tree_size": self.merkle_tree["tree_size"],
            "timestamp": timestamp
        }
        
        return merkle_proof
    
    def _verify_merkle_proof(self, leaf_hash: str, path: List[Dict[str, str]]) -> str:
        """
        Verify a Merkle proof and calculate the root hash.
        
        Args:
            leaf_hash: Hash of the leaf node
            path: Path from leaf to root
            
        Returns:
            Calculated root hash
        """
        current_hash = leaf_hash
        
        for node in path:
            position = node["position"]
            sibling_hash = node["hash"]
            
            if position == "LEFT":
                # Sibling is on the left
                combined = sibling_hash + current_hash
            else:
                # Sibling is on the right
                combined = current_hash + sibling_hash
            
            current_hash = self._hash_data(combined)
        
        return current_hash
    
    def _store_event(self, audit_event: Dict[str, Any]) -> None:
        """
        Store an audit event to persistent storage.
        
        Args:
            audit_event: The audit event to store
        """
        event_id = audit_event["event_id"]
        event_path = Path(self.storage_path) / f"{event_id}.json"
        
        try:
            with open(event_path, 'w') as f:
                json.dump(audit_event, f, indent=2)
        except Exception as e:
            self.logger.error(f"Failed to store audit event {event_id}: {str(e)}")
            raise RuntimeError(f"Failed to store audit event: {str(e)}")
    
    def cleanup_expired_events(self) -> int:
        """
        Clean up expired audit events based on retention policy.
        
        Returns:
            Number of events deleted
        """
        # This is a simplified implementation
        # In a production environment, this would parse ISO 8601 duration strings
        # and apply proper retention policies
        
        # For now, we just assume all events are retained
        return 0
