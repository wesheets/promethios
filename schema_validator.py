"""
Schema validation utilities for Promethios.

This module provides utilities for validating data against JSON schemas.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import json
import os
import jsonschema

def validate_against_schema(data, schema_path):
    """
    Validate data against a JSON schema.
    
    Args:
        data (dict): The data to validate.
        schema_path (str): Path to the schema file.
        
    Returns:
        tuple: (is_valid, error_message) where is_valid is a boolean indicating
            whether the data is valid, and error_message is a string containing
            the error message if validation fails, or None if validation succeeds.
    """
    try:
        # Load schema
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        
        # Validate data
        jsonschema.validate(instance=data, schema=schema)
        
        # If validation succeeds, return True and None
        return True, None
    
    except FileNotFoundError as e:
        return False, str(e)
    
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON schema: {str(e)}"
    
    except jsonschema.exceptions.ValidationError as e:
        return False, str(e)
    
    except Exception as e:
        return False, f"Validation error: {str(e)}"


def pre_loop_tether_check(contract_version, phase_id):
    """
    Perform pre-loop tether check to ensure compliance with Codex Contract.
    
    Args:
        contract_version (str): The contract version to check against.
        phase_id (str): The phase ID to check against.
        
    Returns:
        bool: True if tether check passes, False otherwise.
    """
    return contract_version == "v2025.05.18" and phase_id == "5.4"


def validate_schema_file(schema_path):
    """
    Validate that a schema file exists and contains valid JSON Schema.
    
    Args:
        schema_path (str): Path to the schema file.
        
    Returns:
        tuple: (is_valid, error_message) where is_valid is a boolean indicating
            whether the schema is valid, and error_message is a string containing
            the error message if validation fails, or None if validation succeeds.
    """
    try:
        # Check if file exists
        if not os.path.exists(schema_path):
            return False, f"Schema file not found: {schema_path}"
        
        # Load schema
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        
        # Validate schema
        jsonschema.Draft7Validator.check_schema(schema)
        
        # If validation succeeds, return True and None
        return True, None
    
    except FileNotFoundError as e:
        return False, str(e)
    
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON schema: {str(e)}"
    
    except jsonschema.exceptions.SchemaError as e:
        return False, str(e)
    
    except Exception as e:
        return False, f"Schema validation error: {str(e)}"
