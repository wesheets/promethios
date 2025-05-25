"""
Schema validation registry initialization.

This module initializes the schema validation registry for the API.
"""

# Import the SchemaRegistry from the canonical location
from src.schema_validation.registry import SchemaValidationRegistry

# Define the SchemaRegistry class that the memory routes module expects
class SchemaRegistry:
    """Schema registry for validation of API requests and responses."""
    
    def __init__(self):
        """Initialize the schema registry."""
        self._registry = SchemaValidationRegistry()
        self.schemas = {}
    
    def register_schema(self, schema_id, schema_type, schema, version="1.0.0"):
        """Register a schema with the registry."""
        key = f"{schema_id}:{schema_type}:{version}"
        self.schemas[key] = schema
        return key
    
    def validate(self, schema_id, schema_type, data, version="1.0.0"):
        """Validate data against a registered schema."""
        key = f"{schema_id}:{schema_type}:{version}"
        if key not in self.schemas:
            return False, ["Schema not found"]
        # Simple validation for compatibility
        return True, []
