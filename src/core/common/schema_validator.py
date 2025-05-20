"""
Schema Validator Module

This module provides utilities for validating JSON data against JSON Schema definitions.
It is used throughout the Promethios project to ensure data integrity and compliance.

Part of the Common Utilities for Promethios
"""

import json
import os
import logging
from typing import Dict, Any, List, Optional, Union

logger = logging.getLogger(__name__)

def validate_against_schema(data: Dict[str, Any], schema_path: str) -> Dict[str, Any]:
    """
    Validate JSON data against a JSON Schema.
    
    Args:
        data: The data to validate
        schema_path: Path to the schema file, relative to project root
        
    Returns:
        Dictionary with validation results:
        {
            "valid": bool,
            "errors": list (only present if valid is False)
        }
    """
    try:
        # Try to import jsonschema, which is required for validation
        import jsonschema
    except ImportError:
        logger.error("jsonschema package is not installed. Cannot validate schema.")
        return {
            "valid": False,
            "errors": ["jsonschema package is not installed"]
        }
    
    try:
        # Resolve the schema path relative to project root
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        absolute_schema_path = os.path.join(project_root, schema_path)
        
        # Check if schema file exists
        if not os.path.exists(absolute_schema_path):
            logger.error(f"Schema file not found: {absolute_schema_path}")
            return {
                "valid": False,
                "errors": [f"Schema file not found: {schema_path}"]
            }
        
        # Load the schema
        with open(absolute_schema_path, 'r') as schema_file:
            schema = json.load(schema_file)
        
        # Validate the data against the schema
        jsonschema.validate(instance=data, schema=schema)
        
        # If we get here, validation passed
        logger.debug(f"Schema validation passed for {schema_path}")
        return {"valid": True}
        
    except jsonschema.exceptions.ValidationError as e:
        # Validation failed
        logger.error(f"Schema validation failed: {str(e)}")
        return {
            "valid": False,
            "errors": [str(e)]
        }
    except json.JSONDecodeError as e:
        # Schema file is not valid JSON
        logger.error(f"Invalid JSON in schema file: {str(e)}")
        return {
            "valid": False,
            "errors": [f"Invalid JSON in schema file: {str(e)}"]
        }
    except Exception as e:
        # Other errors
        logger.error(f"Error during schema validation: {str(e)}")
        return {
            "valid": False,
            "errors": [f"Error during schema validation: {str(e)}"]
        }

def load_schema(schema_path: str) -> Optional[Dict[str, Any]]:
    """
    Load a JSON Schema from file.
    
    Args:
        schema_path: Path to the schema file, relative to project root
        
    Returns:
        The loaded schema as a dictionary, or None if loading failed
    """
    try:
        # Resolve the schema path relative to project root
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        absolute_schema_path = os.path.join(project_root, schema_path)
        
        # Check if schema file exists
        if not os.path.exists(absolute_schema_path):
            logger.error(f"Schema file not found: {absolute_schema_path}")
            return None
        
        # Load the schema
        with open(absolute_schema_path, 'r') as schema_file:
            schema = json.load(schema_file)
        
        return schema
        
    except json.JSONDecodeError as e:
        # Schema file is not valid JSON
        logger.error(f"Invalid JSON in schema file: {str(e)}")
        return None
    except Exception as e:
        # Other errors
        logger.error(f"Error loading schema: {str(e)}")
        return None

def generate_schema_report(data: Dict[str, Any], schema_path: str) -> Dict[str, Any]:
    """
    Generate a detailed report on schema validation.
    
    Args:
        data: The data to validate
        schema_path: Path to the schema file, relative to project root
        
    Returns:
        Dictionary with validation report:
        {
            "valid": bool,
            "errors": list (only present if valid is False),
            "schema_path": str,
            "schema_version": str,
            "timestamp": str,
            "data_summary": dict
        }
    """
    # Start with basic validation
    validation_result = validate_against_schema(data, schema_path)
    
    # Load the schema to get version info
    schema = load_schema(schema_path)
    schema_version = schema.get("$id", "unknown") if schema else "unknown"
    
    # Generate data summary
    data_summary = {
        "keys": list(data.keys()),
        "size_bytes": len(json.dumps(data)),
        "top_level_types": {k: type(v).__name__ for k, v in data.items()}
    }
    
    # Build the report
    report = {
        "valid": validation_result.get("valid", False),
        "schema_path": schema_path,
        "schema_version": schema_version,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
        "data_summary": data_summary
    }
    
    # Add errors if validation failed
    if not validation_result.get("valid", False):
        report["errors"] = validation_result.get("errors", ["Unknown validation error"])
    
    return report
