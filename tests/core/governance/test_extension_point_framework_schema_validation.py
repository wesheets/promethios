"""
Schema validation tests for the Extension Point Framework.
This module contains tests for schema validation in the ExtensionPointFramework class.
"""
import unittest
from unittest.mock import Mock, MagicMock, patch
import json
from datetime import datetime
from collections import namedtuple
from src.core.governance.extension_point_framework import ExtensionPointFramework

class TestExtensionPointFrameworkSchemaValidation(unittest.TestCase):
    """Test cases for schema validation in the ExtensionPointFramework class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock objects
        self.mock_schema_validator = Mock()
        self.mock_seal_verification_service = Mock()
        
        # Configure mock behavior
        self.mock_seal_verification_service.create_seal.return_value = "test-seal"
        self.mock_seal_verification_service.verify_seal.return_value = True
        
        # Create a test framework with a valid path that includes a directory
        self.framework = ExtensionPointFramework(
            schema_validator=self.mock_schema_validator,
            seal_verification_service=self.mock_seal_verification_service,
            extension_points_path="test_dir/test_extension_points.json"
        )
        
        # Patch the file operations
        patcher = patch('builtins.open', unittest.mock.mock_open())
        self.addCleanup(patcher.stop)
        patcher.start()
        
        # Patch os.makedirs
        patcher = patch('os.makedirs')
        self.addCleanup(patcher.stop)
        patcher.start()
        
        # Patch os.path.exists
        patcher = patch('os.path.exists')
        self.addCleanup(patcher.stop)
        self.mock_exists = patcher.start()
        self.mock_exists.return_value = False
        
        # Reset the extension points dictionary to ensure test isolation
        self.framework.extension_points = {}

    def test_register_extension_point_with_invalid_schema(self):
        """Test registering an extension point with invalid schema."""
        # Configure schema validator to return invalid result
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        validation_result = ValidationResult(is_valid=False, errors=["Invalid schema"])
        self.mock_schema_validator.validate.return_value = validation_result
        
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "invalid_type"},  # Invalid schema
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Call the method under test
        result = self.framework.register_extension_point(extension_point_data)
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the mock calls
        self.mock_schema_validator.validate.assert_called_once()
        self.mock_seal_verification_service.create_seal.assert_not_called()
        
        # Verify the extension point was not added to the registry
        self.assertNotIn("test.extension_point", self.framework.extension_points)

    def test_register_extension_point_with_missing_required_fields(self):
        """Test registering an extension point with missing required fields."""
        # Set up test data with missing fields
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            # Missing name
            "description": "A test extension point",
            # Missing input_schema
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Configure schema validator to return invalid result for this data
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        validation_result = ValidationResult(is_valid=False, errors=["Missing required field: name", "Missing required field: input_schema"])
        self.mock_schema_validator.validate.return_value = validation_result
        
        # Call the method under test
        result = self.framework.register_extension_point(extension_point_data)
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the mock calls
        self.mock_schema_validator.validate.assert_called_once()
        self.mock_seal_verification_service.create_seal.assert_not_called()
        
        # Verify the extension point was not added to the registry
        self.assertNotIn("test.extension_point", self.framework.extension_points)

    def test_register_extension_point_with_invalid_id_format(self):
        """Test registering an extension point with invalid ID format."""
        # Set up test data with invalid ID format
        extension_point_data = {
            "extension_point_id": "invalid id with spaces",  # Invalid ID format
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Configure schema validator to return invalid result for this data
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        validation_result = ValidationResult(is_valid=False, errors=["Invalid ID format"])
        self.mock_schema_validator.validate.return_value = validation_result
        
        # Call the method under test
        result = self.framework.register_extension_point(extension_point_data)
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the mock calls
        self.mock_schema_validator.validate.assert_called_once()
        self.mock_seal_verification_service.create_seal.assert_not_called()
        
        # Verify the extension point was not added to the registry
        self.assertNotIn("invalid id with spaces", self.framework.extension_points)

    def test_register_implementation_with_invalid_schema(self):
        """Test registering an implementation with invalid schema."""
        # Register a valid extension point first
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        valid_result = ValidationResult(is_valid=True, errors=[])
        self.mock_schema_validator.validate.return_value = valid_result
        
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        self.framework.register_extension_point(extension_point_data)
        
        # Reset the mock and configure it to return invalid result for implementation
        self.mock_schema_validator.validate.reset_mock()
        invalid_result = ValidationResult(is_valid=False, errors=["Invalid schema"])
        self.mock_schema_validator.validate.return_value = invalid_result
        
        # Set up implementation data with invalid schema
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": "not_a_number",  # Invalid priority type
            "configuration": {}
        }
        
        # Call the method under test
        result = self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the mock calls
        self.mock_schema_validator.validate.assert_called_once()
        
        # Verify the implementation was not added to the registry
        self.assertNotIn("test.implementation", self.framework.extension_points["test.extension_point"]["implementations"])

    def test_register_implementation_with_incompatible_schemas(self):
        """Test registering an implementation with schemas incompatible with the extension point."""
        # Register a valid extension point first
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        valid_result = ValidationResult(is_valid=True, errors=[])
        self.mock_schema_validator.validate.return_value = valid_result
        
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {"required_field": {"type": "string"}}},
            "output_schema": {"type": "object", "properties": {"result": {"type": "number"}}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        self.framework.register_extension_point(extension_point_data)
        
        # Reset the mock and configure it to return invalid result for implementation
        self.mock_schema_validator.validate.reset_mock()
        invalid_result = ValidationResult(is_valid=False, errors=["Schema incompatibility"])
        self.mock_schema_validator.validate.return_value = invalid_result
        
        # Set up implementation data with incompatible schemas
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {},
            "input_schema": {"type": "object", "properties": {}},  # Missing required_field
            "output_schema": {"type": "object", "properties": {"result": {"type": "string"}}}  # Wrong type
        }
        
        # Call the method under test
        result = self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the mock calls
        self.mock_schema_validator.validate.assert_called_once()
        
        # Verify the implementation was not added to the registry
        self.assertNotIn("test.implementation", self.framework.extension_points["test.extension_point"]["implementations"])

    def test_register_extension_point_with_malformed_json_schema(self):
        """Test registering an extension point with malformed JSON schema."""
        # Configure schema validator to return invalid result
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        validation_result = ValidationResult(is_valid=False, errors=["Malformed JSON schema"])
        self.mock_schema_validator.validate.return_value = validation_result
        
        # Set up test data with malformed JSON schema
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {"field": {"type": "string"}, "additionalProperties": True}},  # Malformed schema
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Call the method under test
        result = self.framework.register_extension_point(extension_point_data)
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the mock calls
        self.mock_schema_validator.validate.assert_called_once()
        self.mock_seal_verification_service.create_seal.assert_not_called()
        
        # Verify the extension point was not added to the registry
        self.assertNotIn("test.extension_point", self.framework.extension_points)

    def test_register_extension_point_with_schema_version_mismatch(self):
        """Test registering an extension point with schema version mismatch."""
        # Configure schema validator to return invalid result
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        validation_result = ValidationResult(is_valid=False, errors=["Schema version mismatch"])
        self.mock_schema_validator.validate.return_value = validation_result
        
        # Set up test data with schema version mismatch
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"$schema": "http://json-schema.org/draft-07/schema#", "type": "object", "properties": {}},  # Wrong version
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Call the method under test
        result = self.framework.register_extension_point(extension_point_data)
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the mock calls
        self.mock_schema_validator.validate.assert_called_once()
        self.mock_seal_verification_service.create_seal.assert_not_called()
        
        # Verify the extension point was not added to the registry
        self.assertNotIn("test.extension_point", self.framework.extension_points)

    def test_extension_point_with_special_characters(self):
        """Test registering an extension point with special characters in fields."""
        # Configure schema validator to return valid result
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        validation_result = ValidationResult(is_valid=True, errors=[])
        self.mock_schema_validator.validate.return_value = validation_result
        
        # Set up test data with special characters
        extension_point_data = {
            "extension_point_id": "test.extension_point.special",
            "name": "Test Extension Point with 特殊字符 and émojis 🚀",
            "description": "A test extension point with special characters: !@#$%^&*()_+",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {"special_key": "特殊值", "emoji": "🔥"}
        }
        
        # Call the method under test
        result = self.framework.register_extension_point(extension_point_data)
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the extension point was added to the registry
        self.assertIn("test.extension_point.special", self.framework.extension_points)
        
        # Verify the special characters were preserved
        registered_extension_point = self.framework.extension_points["test.extension_point.special"]
        self.assertEqual(registered_extension_point["name"], "Test Extension Point with 特殊字符 and émojis 🚀")
        self.assertEqual(registered_extension_point["description"], "A test extension point with special characters: !@#$%^&*()_+")
        self.assertEqual(registered_extension_point["metadata"]["special_key"], "特殊值")
        self.assertEqual(registered_extension_point["metadata"]["emoji"], "🔥")

    def test_register_extension_point_with_extremely_large_schema(self):
        """Test registering an extension point with an extremely large schema."""
        # Configure schema validator to return valid result
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        validation_result = ValidationResult(is_valid=True, errors=[])
        self.mock_schema_validator.validate.return_value = validation_result
        
        # Create a large schema with many properties
        large_properties = {}
        for i in range(1000):
            large_properties[f"property_{i}"] = {"type": "string", "description": f"Property {i}"}
        
        # Set up test data with large schema
        extension_point_data = {
            "extension_point_id": "test.extension_point.large",
            "name": "Test Extension Point with Large Schema",
            "description": "A test extension point with an extremely large schema",
            "input_schema": {"type": "object", "properties": large_properties},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Call the method under test
        result = self.framework.register_extension_point(extension_point_data)
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the extension point was added to the registry
        self.assertIn("test.extension_point.large", self.framework.extension_points)
        
        # Verify the large schema was preserved
        registered_extension_point = self.framework.extension_points["test.extension_point.large"]
        self.assertEqual(len(registered_extension_point["input_schema"]["properties"]), 1000)

if __name__ == '__main__':
    unittest.main()
