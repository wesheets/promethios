"""
Schema Validation API Module for Promethios Phase 6.4

This module provides API endpoints for schema validation capabilities,
ensuring that all API requests and responses conform to their defined schemas.
"""

from src.schema_validation.registry import SchemaValidationRegistry

# Create a singleton instance of the registry
_registry = None

def get_registry():
    """Get the singleton instance of the schema validation registry."""
    global _registry
    if _registry is None:
        _registry = SchemaValidationRegistry()
    return _registry
