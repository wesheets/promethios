"""
Runtime Executor integration for Merkle sealing and conflict detection.

This module integrates Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.20
Phase ID: 5.3
Clauses: 5.3, 11.0, 10.4, 5.2.5
"""

import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

from src.core.merkle.merkle_tree import pre_loop_tether_check
from src.core.merkle.merkle_sealing import MerkleSealGenerator
from src.core.merkle.conflict_detection import ConflictDetector
from src.core.merkle.output_capture import OutputCapture
from src.integration.trust_log_integration import TrustLogIntegration

# Initialize components
merkle_seal_generator = MerkleSealGenerator()
conflict_detector = ConflictDetector()
output_capture = OutputCapture()
trust_log_integration = TrustLogIntegration(merkle_seal_generator, conflict_detector)

# Store for seals and execution logs
seal_store: Dict[str, Dict[str, Any]] = {}
execution_log_store: Dict[str, Dict[str, Any]] = {}


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


def process_execution(execution_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process an execution with Merkle sealing and conflict detection.
    
    This function implements Phase 5.3 of the Promethios roadmap.
    Codex Contract: v2025.05.20
    Phase ID: 5.3
    Clauses: 5.3, 11.0, 10.4, 5.2.5
    
    Args:
        execution_data: Execution data to process
        
    Returns:
        Processed execution data with Merkle seal and conflict metadata
    """
    # Perform pre-loop tether check
    if not pre_loop_tether_check("v2025.05.20", "5.3"):
        raise ValueError("Pre-loop tether check failed: Invalid contract version or phase ID")
    
    # Generate execution ID if not provided
    execution_id = execution_data.get("execution_id", str(uuid.uuid4()))
    execution_data["execution_id"] = execution_id
    
    # Capture outputs
    outputs = []
    for output in execution_data.get("outputs", []):
        captured_output = output_capture.capture_output(
            output.get("data"),
            output.get("type", "result"),
            output.get("source", "runtime_executor"),
            output.get("metadata", {})
        )
        outputs.append(captured_output)
    
    # Check for conflicts
    conflict_metadata = None
    execution_context = {
        "agent_ids": execution_data.get("agent_ids", [str(uuid.uuid4())]),
        "components": ["runtime_executor", "merkle_sealing", "conflict_detection"]
    }
    
    # Detect schema violations
    if "schema_validation_error" in execution_data:
        execution_context["schema"] = execution_data.get("schema", "unknown")
        execution_context["error"] = execution_data.get("schema_validation_error")
        conflict_metadata = conflict_detector.detect_conflict(
            execution_context,
            "schema_violation",
            "high"
        )
    
    # Detect trust threshold violations
    elif "trust_score" in execution_data and execution_data["trust_score"] < execution_data.get("trust_threshold", 0.7):
        execution_context["trust_score"] = execution_data["trust_score"]
        execution_context["threshold"] = execution_data.get("trust_threshold", 0.7)
        conflict_metadata = conflict_detector.detect_conflict(
            execution_context,
            "trust_threshold",
            "medium"
        )
    
    # Detect tether failures
    elif "tether_failure" in execution_data:
        execution_context["failure_reason"] = execution_data["tether_failure"]
        conflict_metadata = conflict_detector.detect_conflict(
            execution_context,
            "tether_failure",
            "critical"
        )
    
    # Create Trust Log entry
    trust_log_entry = trust_log_integration.create_trust_log_entry(
        execution_id,
        outputs,
        conflict_metadata
    )
    
    # Update execution data with Merkle seal and Trust Log
    execution_data["merkle_seal"] = trust_log_entry["merkle_seal"]
    execution_data["trust_log"] = {
        "entry_id": trust_log_entry["entry_id"],
        "entry_hash": trust_log_entry["entry_hash"],
        "trust_score": trust_log_entry["trust_surface"]["trust_score"]
    }
    
    if conflict_metadata:
        execution_data["conflict_metadata"] = conflict_metadata
    
    # Store seal and execution log
    seal_id = trust_log_entry["merkle_seal"]["seal_id"]
    seal_store[seal_id] = trust_log_entry["merkle_seal"]
    execution_log_store[execution_id] = execution_data
    
    return execution_data


def get_execution_log(execution_id: str) -> Optional[Dict[str, Any]]:
    """
    Get an execution log by ID.
    
    Args:
        execution_id: ID of the execution log to get
        
    Returns:
        Execution log or None if not found
    """
    return execution_log_store.get(execution_id)


def get_merkle_seal(seal_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a Merkle seal by ID.
    
    Args:
        seal_id: ID of the Merkle seal to get
        
    Returns:
        Merkle seal or None if not found
    """
    return seal_store.get(seal_id)


def get_trust_log_entry(entry_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a Trust Log entry by ID.
    
    Args:
        entry_id: ID of the Trust Log entry to get
        
    Returns:
        Trust Log entry or None if not found
    """
    return trust_log_integration.get_trust_log_entry(entry_id)


def get_conflict(conflict_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a conflict by ID.
    
    Args:
        conflict_id: ID of the conflict to get
        
    Returns:
        Conflict metadata or None if not found
    """
    return conflict_detector.get_conflict(conflict_id)


def verify_merkle_seal(seal: Dict[str, Any], outputs: Optional[List[Dict[str, Any]]] = None) -> bool:
    """
    Verify a Merkle seal.
    
    Args:
        seal: The Merkle seal to verify
        outputs: Optional outputs to verify against the seal
        
    Returns:
        Boolean indicating whether the seal is valid
    """
    return merkle_seal_generator.verify_seal(seal, outputs)


def verify_trust_log_entry(entry: Dict[str, Any]) -> bool:
    """
    Verify the integrity of a Trust Log entry.
    
    Args:
        entry: Trust Log entry to verify
        
    Returns:
        Boolean indicating whether the entry is valid
    """
    return trust_log_integration.verify_trust_log_entry(entry)
