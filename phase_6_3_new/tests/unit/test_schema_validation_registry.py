"""
Schema Validation Test Module for Promethios Phase 6.1

This module provides comprehensive tests for the schema validation registry,
ensuring that all API schemas are correctly validated and enforced.
"""

import unittest
import json
import os
import sys
from pathlib import Path

# Add the src directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.schema_validation.registry import SchemaValidationRegistry, get_registry

class TestSchemaValidationRegistry(unittest.TestCase):
    """Test cases for the SchemaValidationRegistry class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a test registry with test schemas
        self.test_schemas_dir = os.path.join(os.path.dirname(__file__), "test_schemas")
        os.makedirs(self.test_schemas_dir, exist_ok=True)
        
        # Create test schema files
        self.create_test_schemas()
        
        # Initialize registry with test schemas
        self.registry = SchemaValidationRegistry(self.test_schemas_dir)
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test schema files
        for filename in os.listdir(self.test_schemas_dir):
            os.remove(os.path.join(self.test_schemas_dir, filename))
        os.rmdir(self.test_schemas_dir)
    
    def create_test_schemas(self):
        """Create test schema files."""
        # Test memory record schema
        memory_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Memory Record Schema",
            "type": "object",
            "required": ["record_id", "timestamp", "content"],
            "properties": {
                "record_id": {"type": "string", "pattern": "^mem-[a-zA-Z0-9]{8,}$"},
                "timestamp": {"type": "string", "format": "date-time"},
                "content": {"type": "object"}
            }
        }
        
        # Test policy schema
        policy_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Policy Schema",
            "type": "object",
            "required": ["policy_id", "name", "rules"],
            "properties": {
                "policy_id": {"type": "string", "pattern": "^pol-[a-zA-Z0-9]{4,}$"},
                "name": {"type": "string"},
                "rules": {"type": "array", "items": {"type": "object"}}
            }
        }
        
        # Write schemas to files
        with open(os.path.join(self.test_schemas_dir, "memory_record.schema.json"), "w") as f:
            json.dump(memory_schema, f)
        
        with open(os.path.join(self.test_schemas_dir, "policy.schema.json"), "w") as f:
            json.dump(policy_schema, f)
    
    def test_load_schemas(self):
        """Test loading schemas from directory."""
        # Verify schemas were loaded
        self.assertIn("memory_record", self.registry.schemas)
        self.assertIn("policy", self.registry.schemas)
        
        # Verify schema versions
        self.assertIn("1.0.0", self.registry.schemas["memory_record"])
        self.assertIn("1.0.0", self.registry.schemas["policy"])
    
    def test_get_schema(self):
        """Test getting a schema by name and version."""
        # Get memory schema
        memory_schema = self.registry.get_schema("memory_record")
        self.assertIsNotNone(memory_schema)
        self.assertEqual(memory_schema["title"], "Memory Record Schema")
        
        # Get policy schema
        policy_schema = self.registry.get_schema("policy")
        self.assertIsNotNone(policy_schema)
        self.assertEqual(policy_schema["title"], "Policy Schema")
        
        # Get non-existent schema
        nonexistent_schema = self.registry.get_schema("nonexistent")
        self.assertIsNone(nonexistent_schema)
    
    def test_validate_valid_data(self):
        """Test validating valid data against schemas."""
        # Valid memory record
        valid_memory = {
            "record_id": "mem-12345abcdef",
            "timestamp": "2025-05-22T10:30:00Z",
            "content": {"key": "value"}
        }
        
        is_valid, errors = self.registry.validate(valid_memory, "memory_record")
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)
        
        # Valid policy
        valid_policy = {
            "policy_id": "pol-1234",
            "name": "Test Policy",
            "rules": [{"rule_id": "rule-1", "condition": "true"}]
        }
        
        is_valid, errors = self.registry.validate(valid_policy, "policy")
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)
    
    def test_validate_invalid_data(self):
        """Test validating invalid data against schemas."""
        # Invalid memory record (missing required field)
        invalid_memory = {
            "record_id": "mem-12345abcdef",
            "content": {"key": "value"}
            # Missing timestamp
        }
        
        is_valid, errors = self.registry.validate(invalid_memory, "memory_record")
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)
        
        # Invalid policy (invalid policy_id format)
        invalid_policy = {
            "policy_id": "invalid-id",  # Doesn't match pattern
            "name": "Test Policy",
            "rules": [{"rule_id": "rule-1", "condition": "true"}]
        }
        
        is_valid, errors = self.registry.validate(invalid_policy, "policy")
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)
    
    def test_register_schema(self):
        """Test registering a new schema."""
        # New schema
        new_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Test Schema",
            "type": "object",
            "required": ["id"],
            "properties": {
                "id": {"type": "string"}
            }
        }
        
        # Register schema
        self.registry.register_schema("test", new_schema, "1.0.0")
        
        # Verify schema was registered
        self.assertIn("test", self.registry.schemas)
        self.assertIn("1.0.0", self.registry.schemas["test"])
        
        # Verify schema can be retrieved
        retrieved_schema = self.registry.get_schema("test")
        self.assertEqual(retrieved_schema["title"], "Test Schema")
    
    def test_register_schema_new_version(self):
        """Test registering a new version of an existing schema."""
        # New version of memory schema
        new_version = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Memory Record Schema v2",
            "type": "object",
            "required": ["record_id", "timestamp", "content", "version"],
            "properties": {
                "record_id": {"type": "string", "pattern": "^mem-[a-zA-Z0-9]{8,}$"},
                "timestamp": {"type": "string", "format": "date-time"},
                "content": {"type": "object"},
                "version": {"type": "integer"}
            }
        }
        
        # Register new version
        self.registry.register_schema("memory_record", new_version, "2.0.0")
        
        # Verify new version was registered
        self.assertIn("2.0.0", self.registry.schemas["memory_record"])
        
        # Verify latest version is 2.0.0
        latest_version = self.registry.get_latest_version("memory_record")
        self.assertEqual(latest_version, "2.0.0")
        
        # Verify can get specific version
        v1_schema = self.registry.get_schema("memory_record", "1.0.0")
        self.assertEqual(v1_schema["title"], "Memory Record Schema")
        
        v2_schema = self.registry.get_schema("memory_record", "2.0.0")
        self.assertEqual(v2_schema["title"], "Memory Record Schema v2")
    
    def test_validate_request(self):
        """Test validating API requests."""
        # Valid memory record request
        valid_request = {
            "record_id": "mem-12345abcdef",
            "timestamp": "2025-05-22T10:30:00Z",
            "content": {"key": "value"}
        }
        
        is_valid, errors = self.registry.validate_request(valid_request, "/memory/records", "POST")
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)
        
        # Invalid endpoint
        is_valid, errors = self.registry.validate_request(valid_request, "/invalid/endpoint", "POST")
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)
    
    def test_validate_response(self):
        """Test validating API responses."""
        # Valid memory record response
        valid_response = {
            "record_id": "mem-12345abcdef",
            "timestamp": "2025-05-22T10:30:00Z",
            "content": {"key": "value"}
        }
        
        is_valid, errors = self.registry.validate_response(valid_response, "/memory/records/{id}", "GET")
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)
        
        # Valid list response
        valid_list_response = {
            "items": [
                {
                    "record_id": "mem-12345abcdef",
                    "timestamp": "2025-05-22T10:30:00Z",
                    "content": {"key": "value"}
                },
                {
                    "record_id": "mem-67890abcdef",
                    "timestamp": "2025-05-22T11:30:00Z",
                    "content": {"key": "value2"}
                }
            ]
        }
        
        is_valid, errors = self.registry.validate_response(valid_list_response, "/memory/records", "GET")
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)
    
    def test_get_registry_singleton(self):
        """Test getting the singleton registry instance."""
        # Get singleton instance
        registry1 = get_registry()
        registry2 = get_registry()
        
        # Verify same instance
        self.assertIs(registry1, registry2)


if __name__ == "__main__":
    unittest.main()
