"""
Output Capture Mechanism for execution outputs.

This module implements Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.20
Phase ID: 5.3
Clauses: 5.3, 11.0
"""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Union

from src.core.merkle.merkle_tree import pre_loop_tether_check


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


class OutputCapture:
    """
    Captures and normalizes execution outputs for Merkle sealing.
    
    This component implements Phase 5.3 of the Promethios roadmap.
    Codex Contract: v2025.05.20
    Phase ID: 5.3
    Clauses: 5.3, 11.0
    """
    
    def __init__(self):
        """Initialize the output capture mechanism."""
        # Perform pre-loop tether check
        if not pre_loop_tether_check("v2025.05.20", "5.3"):
            raise ValueError("Pre-loop tether check failed: Invalid contract version or phase ID")
            
        self.captured_outputs: List[Dict[str, Any]] = []
    
    def capture_output(self, output: Any, output_type: str, source: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Capture and normalize an execution output.
        
        Args:
            output: The output to capture
            output_type: Type of output (e.g., 'log', 'result', 'error')
            source: Source of the output (e.g., 'runtime_executor', 'api_endpoint')
            metadata: Optional metadata about the output
            
        Returns:
            Normalized output object
        """
        # Generate output ID
        output_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Normalize output based on type
        normalized_output = self._normalize_output(output, output_type)
        
        # Create output object
        output_obj = {
            "id": output_id,
            "timestamp": timestamp,
            "output_type": output_type,
            "source": source,
            "output": normalized_output,
            "metadata": metadata or {},
            "contract_version": "v2025.05.20",
            "phase_id": "5.3"
        }
        
        # Store captured output
        self.captured_outputs.append(output_obj)
        
        return output_obj
    
    def _normalize_output(self, output: Any, output_type: str) -> Any:
        """
        Normalize an output based on its type.
        
        Args:
            output: The output to normalize
            output_type: Type of output
            
        Returns:
            Normalized output
        """
        if output_type == "log":
            # Ensure log output is a string
            return str(output)
        elif output_type == "result":
            # Convert result to JSON-serializable format
            try:
                # Try to serialize to ensure it's JSON-compatible
                json.dumps(output)
                return output
            except (TypeError, ValueError):
                # If not serializable, convert to string
                return str(output)
        elif output_type == "error":
            # Normalize error output
            if isinstance(output, Exception):
                return {
                    "error_type": type(output).__name__,
                    "error_message": str(output)
                }
            return {
                "error_type": "unknown",
                "error_message": str(output)
            }
        else:
            # Default normalization
            try:
                # Try to serialize to ensure it's JSON-compatible
                json.dumps(output)
                return output
            except (TypeError, ValueError):
                # If not serializable, convert to string
                return str(output)
    
    def get_outputs(self, output_type: Optional[str] = None, source: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get captured outputs, optionally filtered by type or source.
        
        Args:
            output_type: Optional filter by output type
            source: Optional filter by source
            
        Returns:
            List of captured outputs
        """
        if output_type is None and source is None:
            return self.captured_outputs
        
        filtered_outputs = self.captured_outputs
        
        if output_type is not None:
            filtered_outputs = [
                output for output in filtered_outputs
                if output.get("output_type") == output_type
            ]
        
        if source is not None:
            filtered_outputs = [
                output for output in filtered_outputs
                if output.get("source") == source
            ]
        
        return filtered_outputs
    
    def clear_outputs(self):
        """Clear all captured outputs."""
        self.captured_outputs = []
    
    def get_output_by_id(self, output_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a captured output by ID.
        
        Args:
            output_id: ID of the output to get
            
        Returns:
            Output object or None if not found
        """
        for output in self.captured_outputs:
            if output.get("id") == output_id:
                return output
        return None
