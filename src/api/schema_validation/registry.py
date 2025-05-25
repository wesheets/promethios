"""
Schema Validation Registry API Module for Promethios Phase 6.4

This module provides API endpoints for the schema validation registry,
ensuring that all API requests and responses conform to their defined schemas.
"""

from flask import Blueprint, request, jsonify
from src.schema_validation.registry import SchemaValidationRegistry

# Create blueprint for schema validation API
schema_validation_bp = Blueprint('schema_validation', __name__)

# Get singleton registry instance
def get_registry():
    """Get the singleton instance of the schema validation registry."""
    return SchemaValidationRegistry()

@schema_validation_bp.route('/schemas', methods=['GET'])
def list_schemas():
    """List all available schemas."""
    registry = get_registry()
    schemas = registry.get_all_schema_names()
    return jsonify({
        'schemas': schemas,
        'count': len(schemas)
    })

@schema_validation_bp.route('/schemas/<name>', methods=['GET'])
def get_schema(name):
    """Get a schema by name."""
    registry = get_registry()
    version = request.args.get('version')
    schema = registry.get_schema(name, version)
    
    if not schema:
        return jsonify({
            'error': f'Schema {name} not found'
        }), 404
        
    return jsonify({
        'name': name,
        'version': version or registry.get_latest_version(name),
        'schema': schema
    })

@schema_validation_bp.route('/schemas/<name>/versions', methods=['GET'])
def get_schema_versions(name):
    """Get all versions of a schema."""
    registry = get_registry()
    versions = registry.get_schema_versions(name)
    
    if not versions:
        return jsonify({
            'error': f'Schema {name} not found'
        }), 404
        
    return jsonify({
        'name': name,
        'versions': versions,
        'latest': registry.get_latest_version(name)
    })

@schema_validation_bp.route('/validate', methods=['POST'])
def validate_data():
    """Validate data against a schema."""
    data = request.json
    
    if not data or 'schema' not in data or 'data' not in data:
        return jsonify({
            'error': 'Missing required fields: schema, data'
        }), 400
        
    schema_name = data['schema']
    schema_data = data['data']
    schema_type = data.get('type', 'entity')
    version = data.get('version')
    
    registry = get_registry()
    is_valid, errors = registry.validate(schema_name, schema_data, schema_type, version)
    
    return jsonify({
        'valid': is_valid,
        'errors': errors
    })
