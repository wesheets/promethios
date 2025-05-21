"""
Unit tests for the Extension Point Framework.

This module contains unit tests for the ExtensionPointFramework class.
"""

import unittest
from unittest.mock import Mock, MagicMock, patch
import json
from datetime import datetime
from collections import namedtuple

from src.core.governance.extension_point_framework import ExtensionPointFramework

class TestExtensionPointFramework(unittest.TestCase):
    """Test cases for the ExtensionPointFramework class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock objects
        self.mock_schema_validator = Mock()
        self.mock_seal_verification_service = Mock()
        
        # Configure mock behavior
        self.mock_seal_verification_service.create_seal.return_value = "test-seal"
        self.mock_seal_verification_service.verify_seal.return_value = True
        
        # Configure schema validator mock
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        validation_result = ValidationResult(is_valid=True, errors=[])
        self.mock_schema_validator.validate = Mock(return_value=validation_result)
        
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
        patcher = patch('os.path.exists', return_value=False)
        self.addCleanup(patcher.stop)
        patcher.start()
        
        # Patch os.path.dirname to return a valid directory
        patcher = patch('os.path.dirname', return_value='test_dir')
        self.addCleanup(patcher.stop)
        patcher.start()

    def test_register_extension_point(self):
        """Test registering an extension point."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Call the method under test
        result = self.framework.register_extension_point(extension_point_data)
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the mock calls - expect multiple calls to create_seal:
        # 1. Pre-loop tether
        # 2. Save operation
        self.assertEqual(self.mock_seal_verification_service.create_seal.call_count, 2)
        self.mock_schema_validator.validate.assert_called_once()

    def test_register_duplicate_extension_point(self):
        """Test registering a duplicate extension point."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point first
        self.framework.register_extension_point(extension_point_data)
        
        # Reset the mock calls
        self.mock_schema_validator.validate.reset_mock()
        self.mock_seal_verification_service.create_seal.reset_mock()
        
        # Call the method under test again with the same extension point
        with self.assertRaises(ValueError):
            self.framework.register_extension_point(extension_point_data)

    def test_register_implementation(self):
        """Test registering an implementation."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point first
        self.framework.register_extension_point(extension_point_data)
        
        # Reset the mock calls
        self.mock_schema_validator.validate.reset_mock()
        self.mock_seal_verification_service.create_seal.reset_mock()
        
        # Set up implementation data
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {}
        }
        
        # Call the method under test
        result = self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the mock calls - expect multiple calls to create_seal:
        # 1. Pre-loop tether
        # 2. Implementation object seal
        # 3. Save operation
        self.assertEqual(self.mock_seal_verification_service.create_seal.call_count, 3)
        self.assertEqual(self.mock_schema_validator.validate.call_count, 1)

    def test_register_implementation_for_nonexistent_extension_point(self):
        """Test registering an implementation for a nonexistent extension point."""
        # Set up implementation data
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {}
        }
        
        # Call the method under test
        with self.assertRaises(ValueError):
            self.framework.register_implementation("nonexistent.extension_point", implementation_data)

    def test_register_duplicate_implementation(self):
        """Test registering a duplicate implementation."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point first
        self.framework.register_extension_point(extension_point_data)
        
        # Set up implementation data
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {}
        }
        
        # Register the implementation first
        self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Reset the mock calls
        self.mock_schema_validator.validate.reset_mock()
        self.mock_seal_verification_service.create_seal.reset_mock()
        
        # Call the method under test again with the same implementation
        with self.assertRaises(ValueError):
            self.framework.register_implementation("test.extension_point", implementation_data)

    def test_get_extension_point(self):
        """Test getting an extension point."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point
        self.framework.register_extension_point(extension_point_data)
        
        # Call the method under test
        extension_point = self.framework.get_extension_point("test.extension_point")
        
        # Verify the result
        self.assertIsNotNone(extension_point)
        self.assertEqual(extension_point["extension_point_id"], "test.extension_point")
        self.assertEqual(extension_point["name"], "Test Extension Point")

    def test_get_nonexistent_extension_point(self):
        """Test getting a nonexistent extension point."""
        # Call the method under test
        extension_point = self.framework.get_extension_point("nonexistent.extension_point")
        
        # Verify the result
        self.assertIsNone(extension_point)

    def test_get_implementation(self):
        """Test getting an implementation."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point
        self.framework.register_extension_point(extension_point_data)
        
        # Set up implementation data
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {}
        }
        
        # Register the implementation
        self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Call the method under test
        implementation = self.framework.get_implementation("test.extension_point", "test.implementation")
        
        # Verify the result
        self.assertIsNotNone(implementation)
        self.assertEqual(implementation["implementation_id"], "test.implementation")
        self.assertEqual(implementation["name"], "Test Implementation")

    def test_get_nonexistent_implementation(self):
        """Test getting a nonexistent implementation."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point
        self.framework.register_extension_point(extension_point_data)
        
        # Call the method under test
        implementation = self.framework.get_implementation("test.extension_point", "nonexistent.implementation")
        
        # Verify the result
        self.assertIsNone(implementation)
        
        # Check a nonexistent extension point
        implementation = self.framework.get_implementation("nonexistent.extension_point", "test.implementation")
        
        # Verify the result
        self.assertIsNone(implementation)

    def test_list_extension_points(self):
        """Test listing all extension points."""
        # Set up test data
        extension_point_data_1 = {
            "extension_point_id": "test.extension_point1",
            "name": "Test Extension Point 1",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        extension_point_data_2 = {
            "extension_point_id": "test.extension_point2",
            "name": "Test Extension Point 2",
            "description": "Another test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension points
        self.framework.register_extension_point(extension_point_data_1)
        self.framework.register_extension_point(extension_point_data_2)
        
        # Call the method under test
        extension_points = self.framework.list_extension_points()
        
        # Verify the result
        self.assertEqual(len(extension_points), 2)
        self.assertIn("test.extension_point1", extension_points)
        self.assertIn("test.extension_point2", extension_points)

    def test_list_implementations(self):
        """Test listing all implementations for an extension point."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point
        self.framework.register_extension_point(extension_point_data)
        
        # Set up implementation data
        implementation_data_1 = {
            "implementation_id": "test.implementation1",
            "name": "Test Implementation 1",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {}
        }
        
        implementation_data_2 = {
            "implementation_id": "test.implementation2",
            "name": "Test Implementation 2",
            "description": "Another test implementation",
            "provider_module_id": "test.provider",
            "priority": 1,
            "configuration": {}
        }
        
        # Register the implementations
        self.framework.register_implementation("test.extension_point", implementation_data_1)
        self.framework.register_implementation("test.extension_point", implementation_data_2)
        
        # Call the method under test
        implementations = self.framework.list_implementations("test.extension_point")
        
        # Verify the result
        self.assertEqual(len(implementations), 2)
        self.assertIn("test.implementation1", implementations)
        self.assertIn("test.implementation2", implementations)

    def test_list_implementations_for_nonexistent_extension_point(self):
        """Test listing implementations for a nonexistent extension point."""
        # Call the method under test
        implementations = self.framework.list_implementations("nonexistent.extension_point")
        
        # Verify the result
        self.assertEqual(len(implementations), 0)

    def test_check_extension_point_exists(self):
        """Test checking if an extension point exists."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point
        self.framework.register_extension_point(extension_point_data)
        
        # Call the method under test
        exists = self.framework.check_extension_point_exists("test.extension_point")
        
        # Verify the result
        self.assertTrue(exists)
        
        # Check a nonexistent extension point
        exists = self.framework.check_extension_point_exists("nonexistent.extension_point")
        
        # Verify the result
        self.assertFalse(exists)

    def test_check_implementation_exists(self):
        """Test checking if an implementation exists."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point
        self.framework.register_extension_point(extension_point_data)
        
        # Set up implementation data
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {}
        }
        
        # Register the implementation
        self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Call the method under test
        exists = self.framework.check_implementation_exists("test.extension_point", "test.implementation")
        
        # Verify the result
        self.assertTrue(exists)
        
        # Check a nonexistent implementation
        exists = self.framework.check_implementation_exists("test.extension_point", "nonexistent.implementation")
        
        # Verify the result
        self.assertFalse(exists)
        
        # Check a nonexistent extension point
        exists = self.framework.check_implementation_exists("nonexistent.extension_point", "test.implementation")
        
        # Verify the result
        self.assertFalse(exists)

    def test_unregister_implementation(self):
        """Test unregistering an implementation."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point
        self.framework.register_extension_point(extension_point_data)
        
        # Set up implementation data
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {}
        }
        
        # Register the implementation
        self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Reset the mock calls
        self.mock_schema_validator.validate.reset_mock()
        self.mock_seal_verification_service.create_seal.reset_mock()
        
        # Call the method under test
        result = self.framework.unregister_implementation("test.extension_point", "test.implementation")
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the mock calls - expect multiple calls to create_seal:
        # 1. Pre-loop tether
        # 2. Save operation
        self.assertEqual(self.mock_seal_verification_service.create_seal.call_count, 2)

    def test_unregister_nonexistent_implementation(self):
        """Test unregistering a nonexistent implementation."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point
        self.framework.register_extension_point(extension_point_data)
        
        # Call the method under test
        with self.assertRaises(ValueError):
            self.framework.unregister_implementation("test.extension_point", "nonexistent.implementation")
        
        # Check a nonexistent extension point
        with self.assertRaises(ValueError):
            self.framework.unregister_implementation("nonexistent.extension_point", "test.implementation")

    def test_unregister_extension_point(self):
        """Test unregistering an extension point."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point
        self.framework.register_extension_point(extension_point_data)
        
        # Reset the mock calls
        self.mock_schema_validator.validate.reset_mock()
        self.mock_seal_verification_service.create_seal.reset_mock()
        
        # Call the method under test
        result = self.framework.unregister_extension_point("test.extension_point")
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the mock calls - expect multiple calls to create_seal:
        # 1. Pre-loop tether
        # 2. Save operation
        self.assertEqual(self.mock_seal_verification_service.create_seal.call_count, 2)

    def test_unregister_nonexistent_extension_point(self):
        """Test unregistering a nonexistent extension point."""
        # Call the method under test
        with self.assertRaises(ValueError):
            self.framework.unregister_extension_point("nonexistent.extension_point")

    def test_unregister_extension_point_with_implementations(self):
        """Test unregistering an extension point with implementations."""
        # Set up test data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        
        # Register the extension point
        self.framework.register_extension_point(extension_point_data)
        
        # Set up implementation data
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {}
        }
        
        # Register the implementation
        self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Call the method under test
        with self.assertRaises(ValueError):
            self.framework.unregister_extension_point("test.extension_point")

if __name__ == '__main__':
    unittest.main()
