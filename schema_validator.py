"""
Schema validation utilities for Phase 5.3 components.

This module implements Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.3
Clauses: 5.3, 11.0, 5.2.5
"""

import json
import os
import jsonschema
from typing import Dict, Any, Optional, Tuple, List


def pre_loop_tether_check(contract_version: str, phase_id: str) -> bool:
    """
    Perform pre-loop tether check to verify contract compliance.
    
    Args:
        contract_version: Version of the Codex contract
        phase_id: Phase ID of the implementation
        
    Returns:
        Boolean indicating whether the tether check passed
    """
    if contract_version != "v2025.05.18":
        return False
    if phase_id != "5.3":
        return False
    return True


class SchemaValidator:
    """
    Validates data structures against JSON schemas.
    
    This component implements Phase 5.3 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.3
    Clauses: 5.3, 11.0, 5.2.5
    """
    
    def __init__(self, schema_dir: str = "schemas"):
        """
        Initialize the schema validator.
        
        Args:
            schema_dir: Directory containing schema files
        """
        # Perform pre-loop tether check
        if not pre_loop_tether_check("v2025.05.18", "5.3"):
            raise ValueError("Pre-loop tether check failed: Invalid contract version or phase ID")
            
        self.schema_dir = schema_dir
        self.schema_cache: Dict[str, Dict[str, Any]] = {}
    
    def load_schema(self, schema_file: str) -> Dict[str, Any]:
        """
        Load a JSON schema from file.
        
        Args:
            schema_file: Name of the schema file
            
        Returns:
            Loaded schema
        """
        if schema_file in self.schema_cache:
            return self.schema_cache[schema_file]
        
        schema_path = os.path.join(self.schema_dir, schema_file)
        try:
            with open(schema_path, 'r') as f:
                schema = json.load(f)
            self.schema_cache[schema_file] = schema
            return schema
        except Exception as e:
            raise ValueError(f"Failed to load schema {schema_file}: {str(e)}")
    
    def validate(self, data: Dict[str, Any], schema_file: str) -> Tuple[bool, Optional[str]]:
        """
        Validate data against a JSON schema.
        
        Args:
            data: Data to validate
            schema_file: Name of the schema file
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            schema = self.load_schema(schema_file)
            jsonschema.validate(data, schema)
            return True, None
        except jsonschema.exceptions.ValidationError as e:
            return False, str(e)
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def validate_merkle_seal(self, seal: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Validate a Merkle seal against its schema.
        
        Args:
            seal: Merkle seal to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        return self.validate(seal, "merkle_seal.schema.v1.json")
    
    def validate_conflict_metadata(self, metadata: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Validate conflict metadata against its schema.
        
        Args:
            metadata: Conflict metadata to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        return self.validate(metadata, "conflict_metadata.schema.v1.json")
    
    def validate_all_schemas(self, data_objects: Dict[str, Dict[str, Any]]) -> Dict[str, Tuple[bool, Optional[str]]]:
        """
        Validate multiple data objects against their respective schemas.
        
        Args:
            data_objects: Dictionary mapping object names to data objects and their schema files
                          Format: {"object_name": {"data": {...}, "schema": "schema_file.json"}}
            
        Returns:
            Dictionary mapping object names to validation results
        """
        results = {}
        for name, obj_info in data_objects.items():
            data = obj_info.get("data", {})
            schema = obj_info.get("schema", "")
            if not schema:
                results[name] = (False, "No schema specified")
                continue
            
            results[name] = self.validate(data, schema)
        
        return results


# Create a global instance for convenience
validator = SchemaValidator()


def validate_against_schema(data: Dict[str, Any], schema_file: str) -> Tuple[bool, Optional[str]]:
    """
    Validate data against a JSON schema using the global validator.
    
    Args:
        data: Data to validate
        schema_file: Name of the schema file
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    return validator.validate(data, schema_file)
