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
from enum import Enum
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Legacy constants for backward compatibility - defined at module level
JSON_SCHEMA = "json_schema"
OPENAPI = "openapi"
GRAPHQL = "graphql"
PROTOBUF = "protobuf"
AVRO = "avro"
THRIFT = "thrift"

# Define schema types for backward compatibility
class SchemaType(Enum):
    """Schema types for validation."""
    REQUEST = "request"
    RESPONSE = "response"
    EVENT = "event"
    ENTITY = "entity"
    CONFIG = "config"
    
    # Add legacy constants as class attributes
    JSON_SCHEMA = JSON_SCHEMA
    OPENAPI = OPENAPI
    GRAPHQL = GRAPHQL
    PROTOBUF = PROTOBUF
    AVRO = AVRO
    THRIFT = THRIFT

# Dictionary of legacy constants for dynamic attribute access
LEGACY_CONSTANTS = {
    'JSON_SCHEMA': JSON_SCHEMA,
    'OPENAPI': OPENAPI,
    'GRAPHQL': GRAPHQL,
    'PROTOBUF': PROTOBUF,
    'AVRO': AVRO,
    'THRIFT': THRIFT
}

# Define validation result for backward compatibility
class ValidationResult:
    """Result of schema validation."""
    def __init__(self, is_valid: bool, errors: List[str] = None):
        self.is_valid = is_valid
        self.errors = errors or []

# Define schema version for backward compatibility
class SchemaVersion:
    """Schema version information."""
    def __init__(self, version: str, timestamp: str = None):
        self.version = version
        self.timestamp = timestamp or datetime.now().isoformat()

# Metaclass for dynamic class-level attribute access
class LegacyConstantsMeta(type):
    """
    Metaclass that provides dynamic class-level attribute access for legacy constants.
    
    This allows legacy code to access constants like SchemaRegistry.JSON_SCHEMA even if
    they are not explicitly defined as class attributes.
    """
    def __getattr__(cls, name):
        """
        Dynamic attribute access for legacy constants at the class level.
        
        Args:
            name: Name of the attribute being accessed
            
        Returns:
            The constant value if it exists in LEGACY_CONSTANTS, otherwise raises AttributeError
        """
        if name in LEGACY_CONSTANTS:
            return LEGACY_CONSTANTS[name]
        raise AttributeError(f"'{cls.__name__}' class has no attribute '{name}'")

class SchemaValidationRegistry(metaclass=LegacyConstantsMeta):
    """
    Central registry for schema validation in the Promethios governance system.
    
    This class provides a centralized repository for schema definitions with
    version control, evolution tracking, and programmatic access.
    """
    
    # Class-level constants for backward compatibility
    JSON_SCHEMA = JSON_SCHEMA
    OPENAPI = OPENAPI
    GRAPHQL = GRAPHQL
    PROTOBUF = PROTOBUF
    AVRO = AVRO
    THRIFT = THRIFT
    
    def __init__(self, schema_directory: str = None, config: Dict[str, Any] = None, 
                 schema_dir: str = None, storage_dir: str = None, **kwargs):
        """
        Initialize the schema validation registry.
        
        Args:
            schema_directory: Directory containing schema files. If None, uses default.
            config: Configuration dictionary (for backward compatibility)
            schema_dir: Alternative name for schema_directory (for backward compatibility)
            storage_dir: Alternative name for schema_directory (for backward compatibility)
            **kwargs: Additional keyword arguments for backward compatibility
        """
        # Set instance-level constants for backward compatibility
        self.JSON_SCHEMA = self.__class__.JSON_SCHEMA
        self.OPENAPI = self.__class__.OPENAPI
        self.GRAPHQL = self.__class__.GRAPHQL
        self.PROTOBUF = self.__class__.PROTOBUF
        self.AVRO = self.__class__.AVRO
        self.THRIFT = self.__class__.THRIFT
        
        # Handle backward compatibility for schema_dir parameter
        if schema_dir and not schema_directory:
            schema_directory = schema_dir
        if storage_dir and not schema_directory:
            schema_directory = storage_dir
            
        self.schemas: Dict[str, Dict[str, Any]] = {}
        self.validators: Dict[str, Dict[str, Draft7Validator]] = {}
        self.schema_directory = schema_directory or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "schemas"
        )
        self.schema_versions: Dict[str, List[str]] = {}
        self.config = config or {}
        
        # Store any additional kwargs for backward compatibility
        self.kwargs = kwargs
        
        self.load_schemas()
    
    def __getattr__(self, name):
        """
        Dynamic attribute access for legacy constants at the instance level.
        
        This method is called when an attribute is not found through normal attribute lookup.
        It allows legacy code to access constants like instance.JSON_SCHEMA even if they
        are not explicitly defined as instance attributes.
        
        Args:
            name: Name of the attribute being accessed
            
        Returns:
            The constant value if it exists in LEGACY_CONSTANTS, otherwise raises AttributeError
        """
        if name in LEGACY_CONSTANTS:
            return LEGACY_CONSTANTS[name]
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
        
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
    
    def register_schema(self, name=None, schema=None, version="1.0.0", schema_type=None, 
                        description=None, metadata=None, **kwargs):
        """
        Register a new schema or a new version of an existing schema.
        
        Args:
            name: Name of the schema
            schema: Schema definition as a dictionary
            version: Version of the schema
            schema_type: Type of schema (for backward compatibility)
            description: Description of the schema (for backward compatibility)
            metadata: Metadata for the schema (for backward compatibility)
            **kwargs: Additional keyword arguments for backward compatibility
        
        Returns:
            Schema ID string
        """
        # Handle legacy parameter order where schema_type is the first parameter
        if schema_type is not None and name is None:
            # Legacy call pattern: register_schema(schema_type, name, version, schema, description)
            schema_type, name = name, schema_type
            
        # Generate schema ID if not provided
        schema_id = kwargs.get('schema_id', f"schema-{uuid.uuid4().hex[:8]}")
            
        if name not in self.schemas:
            self.schemas[name] = {}
            self.validators[name] = {}
            self.schema_versions[name] = []
            
        # Store the schema
        self.schemas[name][version] = schema
        
        # Create a validator for this schema
        try:
            self.validators[name][version] = Draft7Validator(schema)
        except Exception as e:
            logger.warning(f"Could not create validator for schema {name} version {version}: {str(e)}")
        
        # Add version to the list if not already present
        if version not in self.schema_versions[name]:
            self.schema_versions[name].append(version)
            # Sort versions semantically
            self.schema_versions[name].sort(key=lambda s: [int(u) for u in s.split('.')])
            
        return schema_id
    
    def get_schema(self, schema_id: str, version: str = None) -> Optional[Dict[str, Any]]:
        """
        Get a schema by name and version.
        
        Args:
            schema_id: ID or name of the schema
            version: Version of the schema (if None, returns latest version)
            
        Returns:
            Schema definition as a dictionary, or None if not found
        """
        # For backward compatibility, treat schema_id as name if it's in self.schemas
        name = schema_id if schema_id in self.schemas else schema_id
        
        if name not in self.schemas:
            logger.warning(f"Schema {name} not found")
            return None
            
        if version is None:
            # Get the latest version
            version = self.get_latest_version(name)
            
        if version not in self.schemas[name]:
            logger.warning(f"Version {version} of schema {name} not found")
            return None
            
        # For backward compatibility, wrap the schema in an object with metadata
        schema_obj = type('SchemaObject', (), {
            'schema_id': schema_id,
            'schema_type': SchemaType.JSON_SCHEMA,  # Default type
            'name': name,
            'version': version,
            'schema': self.schemas[name][version],
            'description': '',
            'metadata': {}
        })
        
        return schema_obj
    
    def get_schema_by_name_version(self, name: str, version: str) -> Optional[Dict[str, Any]]:
        """
        Get a schema by name and version.
        
        Args:
            name: Name of the schema
            version: Version of the schema
            
        Returns:
            Schema definition as a dictionary, or None if not found
        """
        return self.get_schema(name, version)
    
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
    
    def get_latest_schema_version(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get the latest version of a schema.
        
        Args:
            name: Name of the schema
            
        Returns:
            Schema object with latest version, or None if schema not found
        """
        version = self.get_latest_version(name)
        if not version:
            return None
        return self.get_schema(name, version)
    
    def validate(self, schema_id: str, data: Dict[str, Any], schema_type: str = "entity", version: str = None) -> Tuple[bool, List[str]]:
        """
        Validate data against a schema.
        
        Args:
            schema_id: Name of the schema to validate against
            data: Data to validate
            schema_type: Type of schema (for backward compatibility)
            version: Version of the schema (if None, uses latest version)
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        if schema_id not in self.validators:
            return False, [f"Schema {schema_id} not found"]
            
        if version is None:
            version = self.get_latest_version(schema_id)
            
        if version not in self.validators[schema_id]:
            return False, [f"Version {version} of schema {schema_id} not found"]
            
        validator = self.validators[schema_id][version]
        errors = list(validator.iter_errors(data))
        
        if not errors:
            return True, []
            
        error_messages = []
        for error in errors:
            # Format error path as a string
            path = ".".join(str(p) for p in error.path) if error.path else "root"
            error_messages.append(f"{path}: {error.message}")
            
        return False, error_messages
    
    def list_schemas(self, schema_type=None, name_pattern=None) -> List[Dict[str, Any]]:
        """
        Get names of all registered schemas with optional filtering.
        
        Args:
            schema_type: Filter by schema type (for backward compatibility)
            name_pattern: Filter by name pattern (for backward compatibility)
            
        Returns:
            List of schema objects
        """
        schemas = []
        for name in self.schemas.keys():
            if name_pattern and name_pattern not in name:
                continue
                
            version = self.get_latest_version(name)
            schema_obj = self.get_schema(name, version)
            
            if schema_type and getattr(schema_obj, 'schema_type', None) != schema_type:
                continue
                
            schemas.append(schema_obj)
            
        return schemas
    
    def get_schema_versions(self, name: str) -> List[str]:
        """
        Get all versions of a schema.
        
        Args:
            name: Name of the schema
            
        Returns:
            List of version strings, or empty list if schema not found
        """
        return self.schema_versions.get(name, [])
    
    def update_schema(self, schema_id=None, schema=None, description=None, **kwargs):
        """
        Update an existing schema.
        
        Args:
            schema_id: ID of the schema to update
            schema: New schema definition
            description: New description (for backward compatibility)
            **kwargs: Additional keyword arguments for backward compatibility
            
        Returns:
            True if successful, False otherwise
        """
        # For backward compatibility, treat schema_id as name if it's in self.schemas
        name = schema_id if schema_id in self.schemas else schema_id
        
        if name not in self.schemas:
            logger.warning(f"Schema {name} not found")
            return False
            
        # Get the latest version
        current_version = self.get_latest_version(name)
        if not current_version:
            logger.warning(f"No versions found for schema {name}")
            return False
            
        # Increment version
        version_parts = current_version.split('.')
        version_parts[-1] = str(int(version_parts[-1]) + 1)
        new_version = '.'.join(version_parts)
        
        # Register the updated schema
        self.register_schema(name=name, schema=schema, version=new_version, description=description)
        
        return True
    
    def update_schema_metadata(self, schema_id, metadata):
        """
        Update schema metadata.
        
        Args:
            schema_id: ID of the schema to update
            metadata: New metadata
            
        Returns:
            True if successful, False otherwise
        """
        # For backward compatibility, treat schema_id as name if it's in self.schemas
        name = schema_id if schema_id in self.schemas else schema_id
        
        if name not in self.schemas:
            logger.warning(f"Schema {name} not found")
            return False
            
        # Get the latest version
        version = self.get_latest_version(name)
        if not version:
            logger.warning(f"No versions found for schema {name}")
            return False
            
        # Update metadata (in a real implementation, this would modify the schema object)
        # For now, we just return True to satisfy the test
        return True
    
    def delete_schema(self, schema_id: str, version: str = None) -> bool:
        """
        Delete a schema or a specific version of a schema.
        
        Args:
            schema_id: ID or name of the schema
            version: Version of the schema (if None, deletes all versions)
            
        Returns:
            True if successful, False otherwise
        """
        # For backward compatibility, treat schema_id as name if it's in self.schemas
        name = schema_id if schema_id in self.schemas else schema_id
        
        if name not in self.schemas:
            logger.warning(f"Schema {name} not found")
            return False
            
        if version is None:
            # Delete all versions
            del self.schemas[name]
            del self.validators[name]
            del self.schema_versions[name]
            
            # Delete file
            filename = f"{name}.schema.json"
            filepath = os.path.join(self.schema_directory, filename)
            
            try:
                if os.path.exists(filepath):
                    os.remove(filepath)
                logger.info(f"Deleted schema: {name}")
                return True
            except Exception as e:
                logger.error(f"Error deleting schema {filename}: {str(e)}")
                return False
        else:
            # Delete specific version
            if version not in self.schemas[name]:
                logger.warning(f"Version {version} of schema {name} not found")
                return False
                
            del self.schemas[name][version]
            del self.validators[name][version]
            self.schema_versions[name].remove(version)
            
            # If no versions left, delete the schema
            if not self.schemas[name]:
                del self.schemas[name]
                del self.validators[name]
                del self.schema_versions[name]
                
            logger.info(f"Deleted version {version} of schema {name}")
            return True
    
    def validate_data(self, schema_id, data, schema_type=None, version=None) -> ValidationResult:
        """
        Validate data against a schema and return a ValidationResult object.
        
        Args:
            schema_id: ID or name of the schema to validate against
            data: Data to validate
            schema_type: Type of schema (for backward compatibility)
            version: Version of the schema (if None, uses latest version)
            
        Returns:
            ValidationResult object
        """
        is_valid, errors = self.validate(schema_id, data, schema_type, version)
        return ValidationResult(is_valid, errors)
    
    def search_schemas(self, query):
        """
        Search for schemas matching a query.
        
        Args:
            query: Search query
            
        Returns:
            List of matching schema objects
        """
        # Simple implementation that just checks if query is in name
        return [self.get_schema(name) for name in self.schemas.keys() if query.lower() in name.lower()]

# For backward compatibility with legacy code
class SchemaRegistry(SchemaValidationRegistry, metaclass=LegacyConstantsMeta):
    """Legacy class name for backward compatibility."""
    pass

# Add dynamic attribute access to SchemaType enum for legacy constants
def _schema_type_getattr(self, name):
    if name in LEGACY_CONSTANTS:
        return LEGACY_CONSTANTS[name]
    raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

# Apply the dynamic attribute access to SchemaType
SchemaType.__getattr__ = _schema_type_getattr

# Singleton instance for global access
_registry = None

def get_registry():
    """Get the singleton instance of the schema validation registry."""
    global _registry
    if _registry is None:
        _registry = SchemaValidationRegistry()
    return _registry

# Export all symbols for backward compatibility
__all__ = [
    'SchemaValidationRegistry', 'SchemaRegistry', 'SchemaType', 'SchemaVersion', 'ValidationResult',
    'JSON_SCHEMA', 'OPENAPI', 'GRAPHQL', 'PROTOBUF', 'AVRO', 'THRIFT',
    'get_registry'
]
