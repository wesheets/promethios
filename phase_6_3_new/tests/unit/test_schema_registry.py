"""
Unit tests for the Schema Validation Registry in Promethios.

This module contains comprehensive tests for the schema validation registry,
which is responsible for managing and validating API schemas.
"""

import unittest
import os
import json
import tempfile
import shutil
from datetime import datetime
from unittest.mock import patch, MagicMock

# Import the module to test
from src.schema_validation.registry import SchemaRegistry, SchemaType, SchemaVersion, ValidationResult

class TestSchemaRegistry(unittest.TestCase):
    """Test cases for the SchemaRegistry class."""
    
    def setUp(self):
        """Set up test environment before each test."""
        # Create a temporary directory for test schemas
        self.test_dir = tempfile.mkdtemp()
        self.registry = SchemaRegistry(storage_dir=self.test_dir)
        
        # Sample schemas for testing
        self.openapi_schema = {
            "openapi": "3.0.0",
            "info": {
                "title": "Test API",
                "version": "1.0.0"
            },
            "paths": {
                "/test": {
                    "get": {
                        "summary": "Test endpoint",
                        "responses": {
                            "200": {
                                "description": "Successful response"
                            }
                        }
                    }
                }
            }
        }
        
        self.json_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "age": {"type": "integer", "minimum": 0}
            },
            "required": ["name", "age"]
        }
        
        self.graphql_schema = """
        type Query {
            user(id: ID!): User
        }
        
        type User {
            id: ID!
            name: String!
            email: String
        }
        """
        
        self.protobuf_schema = """
        syntax = "proto3";
        
        message User {
            string name = 1;
            int32 age = 2;
        }
        """
    
    def tearDown(self):
        """Clean up test environment after each test."""
        # Remove the temporary directory
        shutil.rmtree(self.test_dir)
    
    def test_register_schema(self):
        """Test registering a new schema."""
        # Register an OpenAPI schema
        schema_id = self.registry.register_schema(
            schema_type=SchemaType.OPENAPI,
            name="test-api",
            version="1.0.0",
            schema=self.openapi_schema,
            description="Test API schema"
        )
        
        # Verify the schema was registered
        self.assertIsNotNone(schema_id)
        self.assertIn(schema_id, self.registry.schemas)
        
        # Verify schema properties
        schema = self.registry.schemas[schema_id]
        self.assertEqual(schema.schema_type, SchemaType.OPENAPI)
        self.assertEqual(schema.name, "test-api")
        self.assertEqual(schema.version, "1.0.0")
        self.assertEqual(schema.schema, self.openapi_schema)
        self.assertEqual(schema.description, "Test API schema")
    
    def test_get_schema(self):
        """Test retrieving a schema by ID."""
        # Register a schema
        schema_id = self.registry.register_schema(
            schema_type=SchemaType.JSON_SCHEMA,
            name="user-schema",
            version="1.0.0",
            schema=self.json_schema,
            description="User schema"
        )
        
        # Retrieve the schema
        schema = self.registry.get_schema(schema_id)
        
        # Verify the schema
        self.assertIsNotNone(schema)
        self.assertEqual(schema.schema_id, schema_id)
        self.assertEqual(schema.schema_type, SchemaType.JSON_SCHEMA)
        self.assertEqual(schema.name, "user-schema")
        self.assertEqual(schema.version, "1.0.0")
        self.assertEqual(schema.schema, self.json_schema)
    
    def test_get_schema_by_name_version(self):
        """Test retrieving a schema by name and version."""
        # Register a schema
        self.registry.register_schema(
            schema_type=SchemaType.GRAPHQL,
            name="user-api",
            version="1.0.0",
            schema=self.graphql_schema,
            description="User API schema"
        )
        
        # Retrieve the schema by name and version
        schema = self.registry.get_schema_by_name_version("user-api", "1.0.0")
        
        # Verify the schema
        self.assertIsNotNone(schema)
        self.assertEqual(schema.schema_type, SchemaType.GRAPHQL)
        self.assertEqual(schema.name, "user-api")
        self.assertEqual(schema.version, "1.0.0")
        self.assertEqual(schema.schema, self.graphql_schema)
    
    def test_list_schemas(self):
        """Test listing schemas with optional filtering."""
        # Register multiple schemas
        self.registry.register_schema(
            schema_type=SchemaType.OPENAPI,
            name="api-1",
            version="1.0.0",
            schema=self.openapi_schema,
            description="API 1"
        )
        
        self.registry.register_schema(
            schema_type=SchemaType.JSON_SCHEMA,
            name="schema-1",
            version="1.0.0",
            schema=self.json_schema,
            description="Schema 1"
        )
        
        self.registry.register_schema(
            schema_type=SchemaType.GRAPHQL,
            name="api-2",
            version="1.0.0",
            schema=self.graphql_schema,
            description="API 2"
        )
        
        # List all schemas
        all_schemas = self.registry.list_schemas()
        self.assertEqual(len(all_schemas), 3)
        
        # List schemas by type
        openapi_schemas = self.registry.list_schemas(schema_type=SchemaType.OPENAPI)
        self.assertEqual(len(openapi_schemas), 1)
        self.assertEqual(openapi_schemas[0].name, "api-1")
        
        # List schemas by name pattern
        api_schemas = self.registry.list_schemas(name_pattern="api-")
        self.assertEqual(len(api_schemas), 2)
    
    def test_update_schema(self):
        """Test updating an existing schema."""
        # Register a schema
        schema_id = self.registry.register_schema(
            schema_type=SchemaType.PROTOBUF,
            name="user-proto",
            version="1.0.0",
            schema=self.protobuf_schema,
            description="User protobuf schema"
        )
        
        # Update the schema
        updated_schema = """
        syntax = "proto3";
        
        message User {
            string name = 1;
            int32 age = 2;
            string email = 3;
        }
        """
        
        self.registry.update_schema(
            schema_id=schema_id,
            schema=updated_schema,
            description="Updated user protobuf schema"
        )
        
        # Verify the update
        schema = self.registry.get_schema(schema_id)
        self.assertEqual(schema.schema, updated_schema)
        self.assertEqual(schema.description, "Updated user protobuf schema")
        
        # Version should be incremented
        self.assertEqual(schema.version, "1.0.1")
    
    def test_delete_schema(self):
        """Test deleting a schema."""
        # Register a schema
        schema_id = self.registry.register_schema(
            schema_type=SchemaType.JSON_SCHEMA,
            name="temp-schema",
            version="1.0.0",
            schema=self.json_schema,
            description="Temporary schema"
        )
        
        # Verify the schema exists
        self.assertIn(schema_id, self.registry.schemas)
        
        # Delete the schema
        result = self.registry.delete_schema(schema_id)
        self.assertTrue(result)
        
        # Verify the schema was deleted
        self.assertNotIn(schema_id, self.registry.schemas)
        self.assertIsNone(self.registry.get_schema(schema_id))
    
    def test_validate_data_json_schema(self):
        """Test validating data against a JSON Schema."""
        # Register a JSON Schema
        schema_id = self.registry.register_schema(
            schema_type=SchemaType.JSON_SCHEMA,
            name="user-schema",
            version="1.0.0",
            schema=self.json_schema,
            description="User schema"
        )
        
        # Valid data
        valid_data = {
            "name": "John Doe",
            "age": 30
        }
        
        # Invalid data
        invalid_data = {
            "name": "Jane Doe",
            "age": -5  # Violates minimum constraint
        }
        
        # Validate valid data
        result = self.registry.validate_data(schema_id, valid_data)
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.errors), 0)
        
        # Validate invalid data
        result = self.registry.validate_data(schema_id, invalid_data)
        self.assertFalse(result.is_valid)
        self.assertGreater(len(result.errors), 0)
    
    def test_schema_versioning(self):
        """Test schema versioning functionality."""
        # Register initial version
        schema_id_v1 = self.registry.register_schema(
            schema_type=SchemaType.OPENAPI,
            name="versioned-api",
            version="1.0.0",
            schema=self.openapi_schema,
            description="Initial version"
        )
        
        # Update to create new version
        updated_schema = dict(self.openapi_schema)
        updated_schema["info"]["version"] = "1.1.0"
        updated_schema["paths"]["/test2"] = {
            "get": {
                "summary": "Another test endpoint",
                "responses": {
                    "200": {
                        "description": "Successful response"
                    }
                }
            }
        }
        
        schema_id_v2 = self.registry.register_schema(
            schema_type=SchemaType.OPENAPI,
            name="versioned-api",
            version="1.1.0",
            schema=updated_schema,
            description="Updated version"
        )
        
        # Verify both versions exist
        v1 = self.registry.get_schema_by_name_version("versioned-api", "1.0.0")
        v2 = self.registry.get_schema_by_name_version("versioned-api", "1.1.0")
        
        self.assertIsNotNone(v1)
        self.assertIsNotNone(v2)
        self.assertNotEqual(v1.schema_id, v2.schema_id)
        
        # Get latest version
        latest = self.registry.get_latest_schema_version("versioned-api")
        self.assertEqual(latest.schema_id, schema_id_v2)
        self.assertEqual(latest.version, "1.1.0")
    
    def test_schema_persistence(self):
        """Test schema persistence to disk."""
        # Register a schema
        schema_id = self.registry.register_schema(
            schema_type=SchemaType.JSON_SCHEMA,
            name="persistent-schema",
            version="1.0.0",
            schema=self.json_schema,
            description="Schema to be persisted"
        )
        
        # Create a new registry instance with the same storage directory
        new_registry = SchemaRegistry(storage_dir=self.test_dir)
        
        # Verify the schema was loaded
        schema = new_registry.get_schema(schema_id)
        self.assertIsNotNone(schema)
        self.assertEqual(schema.name, "persistent-schema")
        self.assertEqual(schema.schema, self.json_schema)
    
    def test_schema_search(self):
        """Test searching for schemas."""
        # Register multiple schemas
        self.registry.register_schema(
            schema_type=SchemaType.OPENAPI,
            name="user-api",
            version="1.0.0",
            schema=self.openapi_schema,
            description="User API schema"
        )
        
        self.registry.register_schema(
            schema_type=SchemaType.JSON_SCHEMA,
            name="user-model",
            version="1.0.0",
            schema=self.json_schema,
            description="User model schema"
        )
        
        self.registry.register_schema(
            schema_type=SchemaType.GRAPHQL,
            name="product-api",
            version="1.0.0",
            schema=self.graphql_schema,
            description="Product API schema"
        )
        
        # Search by keyword
        user_schemas = self.registry.search_schemas("user")
        self.assertEqual(len(user_schemas), 2)
        
        # Search by description
        model_schemas = self.registry.search_schemas("model")
        self.assertEqual(len(model_schemas), 1)
        self.assertEqual(model_schemas[0].name, "user-model")
    
    def test_schema_validation_errors(self):
        """Test detailed validation error reporting."""
        # Register a JSON Schema
        schema_id = self.registry.register_schema(
            schema_type=SchemaType.JSON_SCHEMA,
            name="validation-test",
            version="1.0.0",
            schema=self.json_schema,
            description="Schema for validation testing"
        )
        
        # Data with multiple validation errors
        invalid_data = {
            "name": 123,  # Should be string
            "age": -5     # Should be non-negative
        }
        
        # Validate and check errors
        result = self.registry.validate_data(schema_id, invalid_data)
        self.assertFalse(result.is_valid)
        self.assertGreaterEqual(len(result.errors), 2)
        
        # Check error details
        error_paths = [error.path for error in result.errors]
        self.assertIn("name", error_paths)
        self.assertIn("age", error_paths)
    
    def test_schema_metadata(self):
        """Test schema metadata functionality."""
        # Register a schema with metadata
        metadata = {
            "owner": "API Team",
            "status": "draft",
            "tags": ["user", "authentication"]
        }
        
        schema_id = self.registry.register_schema(
            schema_type=SchemaType.OPENAPI,
            name="metadata-test",
            version="1.0.0",
            schema=self.openapi_schema,
            description="Schema with metadata",
            metadata=metadata
        )
        
        # Verify metadata
        schema = self.registry.get_schema(schema_id)
        self.assertEqual(schema.metadata["owner"], "API Team")
        self.assertEqual(schema.metadata["status"], "draft")
        self.assertEqual(schema.metadata["tags"], ["user", "authentication"])
        
        # Update metadata
        updated_metadata = dict(metadata)
        updated_metadata["status"] = "published"
        updated_metadata["reviewed_by"] = "Security Team"
        
        self.registry.update_schema_metadata(schema_id, updated_metadata)
        
        # Verify updated metadata
        schema = self.registry.get_schema(schema_id)
        self.assertEqual(schema.metadata["status"], "published")
        self.assertEqual(schema.metadata["reviewed_by"], "Security Team")
    
    def test_schema_dependencies(self):
        """Test schema dependency tracking."""
        # Register base schema
        base_schema_id = self.registry.register_schema(
            schema_type=SchemaType.JSON_SCHEMA,
            name="base-schema",
            version="1.0.0",
            schema={"type": "object", "properties": {"id": {"type": "string"}}},
            description="Base schema"
        )
        
        # Register dependent schema
        dependent_schema = {
            "type": "object",
            "properties": {
                "user": {"$ref": "#/definitions/base"},
                "role": {"type": "string"}
            },
            "definitions": {
                "base": self.registry.get_schema(base_schema_id).schema
            }
        }
        
        dependent_schema_id = self.registry.register_schema(
            schema_type=SchemaType.JSON_SCHEMA,
            name="dependent-schema",
            version="1.0.0",
            schema=dependent_schema,
            description="Dependent schema",
            dependencies=[base_schema_id]
        )
        
        # Verify dependencies
        schema = self.registry.get_schema(dependent_schema_id)
        self.assertIn(base_schema_id, schema.dependencies)
        
        # Get dependent schemas
        dependents = self.registry.get_dependent_schemas(base_schema_id)
        self.assertEqual(len(dependents), 1)
        self.assertEqual(dependents[0].schema_id, dependent_schema_id)

if __name__ == "__main__":
    unittest.main()
