#!/usr/bin/env python3
"""
trust_log_writer.py - Trust Log Writer Module

This module implements the TrustLogWriter class for routing replay logs
to the Trust Log UI according to the Codex Contract Tethering Protocol.

Contract Version: v2025.05.20
Phase ID: 5.2
Clauses: 5.2, 5.3, 11.0, 12.20
Schema: trust_log_replay_binding.schema.v1.json
"""

import json
import hashlib
import uuid
from datetime import datetime
import jsonschema
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("promethios-trust-log")

# Load schema for validation
def load_schema(schema_name):
    """
    Load JSON schema from file.
    
    Args:
        schema_name: Name of the schema file
        
    Returns:
        dict: Loaded schema
    """
    schema_path = os.path.join("schemas", "ui", schema_name)
    try:
        with open(schema_path, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load schema {schema_name}: {str(e)}")
        raise

def pre_loop_tether_check(module_id, contract_version, schema_version, clauses):
    """
    Verify that the module is properly tethered to the Codex contract.
    
    Args:
        module_id: Identifier of the module
        contract_version: Version of the Codex contract
        schema_version: Version of the schema
        clauses: List of Codex clauses this module implements
        
    Returns:
        bool: True if tethered, False otherwise
    """
    logger.info(f"Performing pre-loop tether check for {module_id}, Contract {contract_version}")
    
    # Load .codex.lock to verify contract version and clauses
    try:
        with open(".codex.lock", "r") as f:
            # Parse as JSON instead of plain text
            codex_lock = json.load(f)
            
        # Verify contract version
        if codex_lock.get("contract_version") != contract_version:
            logger.error(f"[TETHER FAILURE] Contract version mismatch: expected {contract_version}, got {codex_lock.get('contract_version')}")
            return False
            
        # Verify clauses
        codex_clauses = codex_lock.get("codex_clauses", [])
        for clause in clauses:
            # Check if any clause in codex_clauses starts with this clause number
            clause_found = False
            for codex_clause in codex_clauses:
                if codex_clause.startswith(clause + ":") or codex_clause == clause:
                    clause_found = True
                    break
                    
            if not clause_found:
                logger.error(f"[TETHER FAILURE] Missing clause: {clause}")
                return False
                
        # Verify schema
        schema_registry = codex_lock.get("schema_registry", [])
        if "trust_log_replay_binding.schema.v1.json" not in schema_registry:
            logger.error(f"[TETHER FAILURE] Missing schema: trust_log_replay_binding.schema.v1.json")
            return False
            
        logger.info(f"Codex Contract Tethering verification successful.")
        return True
    except Exception as e:
        logger.error(f"[TETHER FAILURE] Error: {str(e)}")
        return False

class TrustLogWriter:
    """
    Routes replay logs to the Trust Log UI.
    
    This class implements Phase 12.20 (Trust Log UI Viewer) for routing
    replay logs to the Trust Log UI for visualization and verification.
    """
    
    def __init__(self):
        """Initialize the TrustLogWriter."""
        self.contract_version = "v2025.05.20"
        self.schema_version = "v1"
        self.clauses = ["5.2", "5.3", "11.0", "12.20"]
        self.module_id = "trust_log_writer"
        
        try:
            self.schema = load_schema("trust_log_replay_binding.schema.v1.json")
        except Exception as e:
            logger.error(f"Failed to initialize TrustLogWriter: {str(e)}")
            raise
        
    def write_replay_log(self, replay_log, verification_result):
        """
        Write replay log to trust log for UI visualization.
        
        Args:
            replay_log: Execution log to write
            verification_result: Verification result from ReplayVerifier
            
        Returns:
            dict: Trust log binding
        """
        # Log contract version and hash on invocation
        contract_hash = hashlib.sha256(self.contract_version.encode()).hexdigest()
        logger.info(f"[TRUST LOG] Contract Version: {self.contract_version}, Hash: {contract_hash}")
        
        # Perform pre-loop tether check
        if not pre_loop_tether_check(self.module_id, self.contract_version, self.schema_version, self.clauses):
            error_msg = "Tether check failed. Trust log writing aborted."
            logger.error(error_msg)
            raise Exception(error_msg)
            
        # Create binding
        binding_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        execution_id = replay_log.get("execution_id", str(uuid.uuid4()))
        
        # Extract verification details
        verification_status = {
            "is_verified": verification_result.get("verification_result", {}).get("is_valid", False),
            "verification_timestamp": verification_result.get("timestamp", ""),
            "verification_method": verification_result.get("verification_method", ""),
            "verification_id": verification_result.get("verification_id", "")
        }
        
        # Get Merkle root from verification result
        merkle_root = verification_result.get("verification_result", {}).get("consensus_details", {}).get("merkle_root", "")
        if not merkle_root or len(merkle_root) != 64:
            merkle_root = "0" * 64
        
        # Process entries to ensure all hash fields are pattern-compliant
        processed_entries = []
        default_hash = "0" * 64
        
        for entry in replay_log.get("entries", []):
            processed_entry = entry.copy()
            
            # Ensure previous_hash is a valid 64-character hex string
            if not processed_entry.get("previous_hash") or len(processed_entry.get("previous_hash", "")) != 64:
                processed_entry["previous_hash"] = default_hash
                
            # Ensure current_hash is a valid 64-character hex string
            if not processed_entry.get("current_hash") or len(processed_entry.get("current_hash", "")) != 64:
                processed_entry["current_hash"] = default_hash
                
            processed_entries.append(processed_entry)
        
        # Create trust log binding
        binding = {
            "binding_id": binding_id,
            "contract_version": self.contract_version,
            "timestamp": timestamp,
            "replay_log": {
                "log_id": str(uuid.uuid4()),
                "execution_id": execution_id,
                "entries": processed_entries,
                "merkle_root": merkle_root,
                "verification_status": verification_status
            },
            "ui_binding": {
                "module_id": "UI-12.20",
                "view_id": str(uuid.uuid4()),
                "binding_type": "direct",
                "display_options": {
                    "show_verification_status": True,
                    "show_hash_chain": True,
                    "show_merkle_tree": True,
                    "show_conflict_metadata": True
                },
                "access_control": {
                    "read_only": True,
                    "required_roles": ["operator", "auditor"]
                }
            },
            "codex_clauses": self.clauses
        }
        
        # Hash-seal the trust log
        binding["replay_log"]["merkle_root"] = self._calculate_merkle_root(binding["replay_log"]["entries"])
        
        # Validate against schema
        try:
            jsonschema.validate(binding, self.schema)
            logger.info(f"[TRUST LOG] Successfully validated binding against schema")
        except jsonschema.exceptions.ValidationError as e:
            error_msg = f"Trust log binding does not match schema: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        # Write to file
        self._write_to_file(binding)
            
        return binding
        
    def _calculate_merkle_root(self, entries):
        """
        Calculate the Merkle root of the log entries.
        
        Args:
            entries: Log entries to calculate Merkle root for
            
        Returns:
            str: Merkle root hash
        """
        if not entries:
            return "0" * 64  # Return a valid hash pattern for empty entries
            
        hashes = [entry.get("current_hash", "0" * 64) for entry in entries]
        while len(hashes) > 1:
            if len(hashes) % 2 != 0:
                hashes.append(hashes[-1])
                
            new_hashes = []
            for i in range(0, len(hashes), 2):
                combined = hashes[i] + hashes[i+1]
                new_hash = hashlib.sha256(combined.encode()).hexdigest()
                new_hashes.append(new_hash)
                
            hashes = new_hashes
            
        return hashes[0] if hashes else "0" * 64  # Return a valid hash pattern if empty
        
    def _write_to_file(self, binding):
        """
        Write trust log binding to file.
        
        Args:
            binding: Trust log binding to write
        """
        # Create directory if it doesn't exist
        os.makedirs("logs/trust_logs", exist_ok=True)
        
        # Write to file
        binding_id = binding.get("binding_id", str(uuid.uuid4()))
        file_path = f"logs/trust_logs/{binding_id}.json"
        
        with open(file_path, "w") as f:
            json.dump(binding, f, indent=2)
            
        logger.info(f"[TRUST LOG] Wrote binding to {file_path}")
