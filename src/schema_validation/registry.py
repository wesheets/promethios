"""
Schema Validation Module for Promethios Phase 6.1

This module provides comprehensive schema validation capabilities for the Promethios
governance system, ensuring that all API requests and responses conform to their
defined schemas.
"""

import json
import jsonschema
from jsonschema import validators, Draft7Validator
import os
import logging
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SchemaValidationRegistry:
    """
    Central registry for schema validation in the Promethios governance system.
    
    This class provides a centralized repository for schema definitions with
    version control, evolution tracking, and programmatic access.
    """
    
    def __init__(self, schema_directory: str = None):
        """
        Initialize the schema validation registry.
        
        Args:
            schema_directory: Directory containing schema files. If None, uses default.
        """
        self.schemas: Dict[str, Dict[str, Any]] = {}
        self.validators: Dict[str, Dict[str, Draft7Validator]] = {}
        self.schema_directory = schema_directory or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "schemas"
        )
        self.schema_versions: Dict[str, List[str]] = {}
        self.load_schemas()
        
    def load_schemas(self) -> None:
        """
        Load all schema files from the schema directory.
        """
        logger.info(f"Loading schemas from {self.schema_directory}")
        if not os.path.exists(self.schema_directory):
            logger.warning(f"Schema directory {self.schema_directory} does not exist")
            return
            
        for filename in os.listdir(self.schema_directory):
            if filename.endswith(".schema.json"):
                schema_path = os.path.join(self.schema_directory, filename)
                try:
                    with open(schema_path, 'r') as f:
                        schema = json.load(f)
                    
                    # Extract schema name from filename (e.g., "memory_record" from "memory_record.schema.json")
                    schema_name = filename.replace(".schema.json", "")
                    
                    # Get schema version (default to "1.0.0" if not specified)
                    schema_version = schema.get("version", "1.0.0")
                    
                    self.register_schema(schema_name, schema, schema_version)
                    logger.info(f"Loaded schema: {schema_name} (version {schema_version})")
                except Exception as e:
                    logger.error(f"Error loading schema {filename}: {str(e)}")
    
    def register_schema(self, name: str, schema: Dict[str, Any], version: str = "1.0.0") -> None:
        """
        Register a new schema or a new version of an existing schema.
        
        Args:
            name: Name of the schema
            schema: Schema definition as a dictionary
            version: Version of the schema
        """
        if name not in self.schemas:
            self.schemas[name] = {}
            self.validators[name] = {}
            self.schema_versions[name] = []
            
        # Store the schema
        self.schemas[name][version] = schema
        
        # Create a validator for this schema
        self.validators[name][version] = Draft7Validator(schema)
        
        # Add version to the list if not already present
        if version not in self.schema_versions[name]:
            self.schema_versions[name].append(version)
            # Sort versions semantically
            self.schema_versions[name].sort(key=lambda s: [int(u) for u in s.split('.')])
    
    def get_schema(self, name: str, version: str = None) -> Optional[Dict[str, Any]]:
        """
        Get a schema by name and version.
        
        Args:
            name: Name of the schema
            version: Version of the schema (if None, returns latest version)
            
        Returns:
            Schema definition as a dictionary, or None if not found
        """
        if name not in self.schemas:
            logger.warning(f"Schema {name} not found")
            return None
            
        if version is None:
            # Get the latest version
            version = self.get_latest_version(name)
            
        if version not in self.schemas[name]:
            logger.warning(f"Version {version} of schema {name} not found")
            return None
            
        return self.schemas[name][version]
    
    def get_latest_version(self, name: str) -> Optional[str]:
        """
        Get the latest version of a schema.
        
        Args:
            name: Name of the schema
            
        Returns:
            Latest version string, or None if schema not found
        """
        if name not in self.schema_versions or not self.schema_versions[name]:
            return None
        return self.schema_versions[name][-1]
    
    def validate(self, data: Dict[str, Any], schema_name: str, version: str = None) -> Tuple[bool, List[str]]:
        """
        Validate data against a schema.
        
        Args:
            data: Data to validate
            schema_name: Name of the schema to validate against
            version: Version of the schema (if None, uses latest version)
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        if schema_name not in self.validators:
            return False, [f"Schema {schema_name} not found"]
            
        if version is None:
            version = self.get_latest_version(schema_name)
            
        if version not in self.validators[schema_name]:
            return False, [f"Version {version} of schema {schema_name} not found"]
            
        validator = self.validators[schema_name][version]
        errors = list(validator.iter_errors(data))
        
        if not errors:
            return True, []
            
        error_messages = []
        for error in errors:
            # Format error path as a string
            path = ".".join(str(p) for p in error.path) if error.path else "root"
            error_messages.append(f"{path}: {error.message}")
            
        return False, error_messages
    
    def get_all_schema_names(self) -> List[str]:
        """
        Get names of all registered schemas.
        
        Returns:
            List of schema names
        """
        return list(self.schemas.keys())
    
    def get_schema_versions(self, name: str) -> List[str]:
        """
        Get all versions of a schema.
        
        Args:
            name: Name of the schema
            
        Returns:
            List of version strings, or empty list if schema not found
        """
        return self.schema_versions.get(name, [])
    
    def export_schema(self, name: str, version: str = None, format: str = "json") -> Optional[str]:
        """
        Export a schema to a string in the specified format.
        
        Args:
            name: Name of the schema
            version: Version of the schema (if None, uses latest version)
            format: Output format ("json" or "yaml")
            
        Returns:
            Schema as a string, or None if not found
        """
        schema = self.get_schema(name, version)
        if not schema:
            return None
            
        if format.lower() == "json":
            return json.dumps(schema, indent=2)
        elif format.lower() == "yaml":
            try:
                import yaml
                return yaml.dump(schema)
            except ImportError:
                logger.error("PyYAML not installed, falling back to JSON")
                return json.dumps(schema, indent=2)
        else:
            logger.error(f"Unsupported format: {format}")
            return None
    
    def schema_evolution_report(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Generate a report on the evolution of a schema across versions.
        
        Args:
            name: Name of the schema
            
        Returns:
            Report as a dictionary, or None if schema not found
        """
        if name not in self.schemas:
            return None
            
        versions = self.get_schema_versions(name)
        if not versions:
            return None
            
        report = {
            "schema_name": name,
            "versions": versions,
            "latest_version": self.get_latest_version(name),
            "version_count": len(versions),
            "changes": []
        }
        
        # Compare each version with the next
        for i in range(len(versions) - 1):
            v1 = versions[i]
            v2 = versions[i + 1]
            changes = self._compare_schemas(
                self.schemas[name][v1],
                self.schemas[name][v2],
                v1,
                v2
            )
            report["changes"].append(changes)
            
        return report
    
    def _compare_schemas(self, schema1: Dict[str, Any], schema2: Dict[str, Any], 
                         version1: str, version2: str) -> Dict[str, Any]:
        """
        Compare two versions of a schema and identify changes.
        
        Args:
            schema1: First schema
            schema2: Second schema
            version1: Version of first schema
            version2: Version of second schema
            
        Returns:
            Dictionary describing changes
        """
        # This is a simplified comparison - a real implementation would be more thorough
        properties1 = set(schema1.get("properties", {}).keys())
        properties2 = set(schema2.get("properties", {}).keys())
        
        added = properties2 - properties1
        removed = properties1 - properties2
        common = properties1.intersection(properties2)
        
        modified = []
        for prop in common:
            if schema1["properties"][prop] != schema2["properties"][prop]:
                modified.append(prop)
                
        return {
            "from_version": version1,
            "to_version": version2,
            "added_properties": list(added),
            "removed_properties": list(removed),
            "modified_properties": modified,
            "timestamp": datetime.now().isoformat()
        }
    
    def validate_request(self, request_data: Dict[str, Any], endpoint: str, 
                        method: str = "POST") -> Tuple[bool, List[str]]:
        """
        Validate an API request against the appropriate schema.
        
        Args:
            request_data: Request data to validate
            endpoint: API endpoint (e.g., "/memory/records")
            method: HTTP method (e.g., "POST", "PUT")
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        # Map endpoint and method to schema name
        schema_mapping = {
            # Memory API
            ("/memory/records", "POST"): "memory_record",
            ("/memory/records", "PUT"): "memory_record",
            
            # Policy API
            ("/policy", "POST"): "policy",
            ("/policy", "PUT"): "policy",
            
            # Reflection API
            ("/reflection/records", "POST"): "reflection_record",
            ("/reflection/records", "PUT"): "reflection_record",
            
            # Override API
            ("/override/requests", "POST"): "override_request",
            ("/override/requests", "PUT"): "override_request",
            
            # Compliance API
            ("/compliance/mappings", "POST"): "compliance_mapping",
            ("/compliance/mappings", "PUT"): "compliance_mapping",
        }
        
        key = (endpoint, method)
        if key not in schema_mapping:
            return False, [f"No schema defined for {method} {endpoint}"]
            
        schema_name = schema_mapping[key]
        return self.validate(request_data, schema_name)
    
    def validate_response(self, response_data: Dict[str, Any], endpoint: str, 
                         method: str = "GET") -> Tuple[bool, List[str]]:
        """
        Validate an API response against the appropriate schema.
        
        Args:
            response_data: Response data to validate
            endpoint: API endpoint (e.g., "/memory/records")
            method: HTTP method (e.g., "GET", "POST")
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        # Map endpoint and method to schema name
        schema_mapping = {
            # Memory API
            ("/memory/records", "GET"): "memory_record",
            ("/memory/records/{id}", "GET"): "memory_record",
            ("/memory/records", "POST"): "memory_record",
            ("/memory/records/{id}", "PUT"): "memory_record",
            
            # Policy API
            ("/policy", "GET"): "policy",
            ("/policy/{id}", "GET"): "policy",
            ("/policy", "POST"): "policy",
            ("/policy/{id}", "PUT"): "policy",
            
            # Reflection API
            ("/reflection/records", "GET"): "reflection_record",
            ("/reflection/records/{id}", "GET"): "reflection_record",
            ("/reflection/records", "POST"): "reflection_record",
            ("/reflection/records/{id}", "PUT"): "reflection_record",
            
            # Override API
            ("/override/requests", "GET"): "override_request",
            ("/override/requests/{id}", "GET"): "override_request",
            ("/override/requests", "POST"): "override_request",
            ("/override/requests/{id}", "PUT"): "override_request",
            
            # Compliance API
            ("/compliance/mappings", "GET"): "compliance_mapping",
            ("/compliance/mappings/{id}", "GET"): "compliance_mapping",
            ("/compliance/mappings", "POST"): "compliance_mapping",
            ("/compliance/mappings/{id}", "PUT"): "compliance_mapping",
        }
        
        # Handle endpoints with path parameters
        if "{id}" in endpoint:
            # Try to find a matching endpoint pattern
            for pattern_key, schema in schema_mapping.items():
                # Fix: Unpack the tuple properly
                pattern_endpoint, pattern_method = pattern_key
                if endpoint.split("/")[1] == pattern_endpoint.split("/")[1] and method == pattern_method:
                    return self.validate(response_data, schema)
        
        key = (endpoint, method)
        if key not in schema_mapping:
            return False, [f"No schema defined for {method} {endpoint} response"]
            
        schema_name = schema_mapping[key]
        
        # For list endpoints, validate each item in the list
        if endpoint.endswith("s") and not endpoint.endswith("/{id}") and method == "GET":
            if "items" in response_data:
                items = response_data["items"]
                if not isinstance(items, list):
                    return False, ["Response 'items' field is not a list"]
                
                all_valid = True
                all_errors = []
                
                for i, item in enumerate(items):
                    valid, errors = self.validate(item, schema_name)
                    if not valid:
                        all_valid = False
                        all_errors.append(f"Item {i}: {', '.join(errors)}")
                
                return all_valid, all_errors
        
        return self.validate(response_data, schema_name)


# Singleton instance
_registry_instance = None

def get_registry() -> SchemaValidationRegistry:
    """
    Get the singleton instance of the schema validation registry.
    
    Returns:
        SchemaValidationRegistry instance
    """
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = SchemaValidationRegistry()
    return _registry_instance
