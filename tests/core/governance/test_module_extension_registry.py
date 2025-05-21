"""
Unit tests for the Module Extension Registry.

This module contains unit tests for the ModuleExtensionRegistry class.
"""

import unittest
from unittest.mock import Mock, MagicMock, patch
import json
from datetime import datetime
from collections import namedtuple

from src.core.governance.module_extension_registry import ModuleExtensionRegistry

class TestModuleExtensionRegistry(unittest.TestCase):
    """Test cases for the ModuleExtensionRegistry class."""

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
        
        # Create a test registry with a valid path that includes a directory
        self.registry = ModuleExtensionRegistry(
            schema_validator=self.mock_schema_validator,
            seal_verification_service=self.mock_seal_verification_service,
            registry_path="test_dir/test_registry.json"
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

    def test_register_extension(self):
        """Test registering an extension."""
        # Set up test data
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Call the method under test
        result = self.registry.register_extension(extension_data)
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the mock calls - expect 3 calls to create_seal:
        # 1. Pre-loop tether
        # 2. Extension object seal
        # 3. Registry save operation
        self.assertEqual(self.mock_seal_verification_service.create_seal.call_count, 3)
        self.mock_schema_validator.validate.assert_called_once()

    def test_register_duplicate_extension(self):
        """Test registering a duplicate extension."""
        # Set up test data
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the extension first
        self.registry.register_extension(extension_data)
        
        # Reset the mock calls
        self.mock_schema_validator.validate.reset_mock()
        self.mock_seal_verification_service.create_seal.reset_mock()
        
        # Call the method under test again with the same extension
        with self.assertRaises(ValueError):
            self.registry.register_extension(extension_data)

    def test_register_extension_version(self):
        """Test registering an extension version."""
        # Set up test data
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the extension first
        self.registry.register_extension(extension_data)
        
        # Reset the mock calls
        self.mock_schema_validator.validate.reset_mock()
        self.mock_seal_verification_service.create_seal.reset_mock()
        
        # Set up version data
        version_data = {
            "version": "1.1.0",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Call the method under test
        result = self.registry.register_extension_version("test.extension", version_data)
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the mock calls - expect 3 calls to create_seal:
        # 1. Pre-loop tether
        # 2. Extension object seal update
        # 3. Registry save operation
        self.assertEqual(self.mock_seal_verification_service.create_seal.call_count, 3)
        self.assertEqual(self.mock_schema_validator.validate.call_count, 1)

    def test_register_duplicate_extension_version(self):
        """Test registering a duplicate extension version."""
        # Set up test data
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the extension first
        self.registry.register_extension(extension_data)
        
        # Set up version data (same as the initial version)
        version_data = {
            "version": "1.0.0",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Call the method under test with the same version
        with self.assertRaises(ValueError):
            self.registry.register_extension_version("test.extension", version_data)

    def test_register_version_for_nonexistent_extension(self):
        """Test registering a version for a nonexistent extension."""
        # Set up version data
        version_data = {
            "version": "1.0.0",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Call the method under test
        with self.assertRaises(ValueError):
            self.registry.register_extension_version("nonexistent.extension", version_data)

    def test_get_extension(self):
        """Test getting an extension."""
        # Set up test data
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the extension
        self.registry.register_extension(extension_data)
        
        # Call the method under test
        extension = self.registry.get_extension("test.extension")
        
        # Verify the result
        self.assertIsNotNone(extension)
        self.assertEqual(extension["extension_id"], "test.extension")
        self.assertEqual(extension["name"], "Test Extension")
        self.assertEqual(extension["version"], "1.0.0")

    def test_get_nonexistent_extension(self):
        """Test getting a nonexistent extension."""
        # Call the method under test
        extension = self.registry.get_extension("nonexistent.extension")
        
        # Verify the result
        self.assertIsNone(extension)

    def test_get_extension_version(self):
        """Test getting an extension version."""
        # Set up test data
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the extension
        self.registry.register_extension(extension_data)
        
        # Set up version data
        version_data = {
            "version": "1.1.0",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the version
        self.registry.register_extension_version("test.extension", version_data)
        
        # Call the method under test
        version = self.registry.get_extension_version("test.extension", "1.1.0")
        
        # Verify the result
        self.assertIsNotNone(version)
        self.assertEqual(version["version"], "1.1.0")

    def test_get_nonexistent_extension_version(self):
        """Test getting a nonexistent extension version."""
        # Set up test data
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the extension
        self.registry.register_extension(extension_data)
        
        # Call the method under test
        version = self.registry.get_extension_version("test.extension", "nonexistent.version")
        
        # Verify the result
        self.assertIsNone(version)
        
        # Check a nonexistent extension
        version = self.registry.get_extension_version("nonexistent.extension", "1.0.0")
        
        # Verify the result
        self.assertIsNone(version)

    def test_list_extensions(self):
        """Test listing all extensions."""
        # Set up test data
        extension_data_1 = {
            "extension_id": "test.extension1",
            "name": "Test Extension 1",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        extension_data_2 = {
            "extension_id": "test.extension2",
            "name": "Test Extension 2",
            "description": "Another test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the extensions
        self.registry.register_extension(extension_data_1)
        self.registry.register_extension(extension_data_2)
        
        # Call the method under test
        extensions = self.registry.list_extensions()
        
        # Verify the result
        self.assertEqual(len(extensions), 2)
        self.assertIn("test.extension1", extensions)
        self.assertIn("test.extension2", extensions)

    def test_list_extension_versions(self):
        """Test listing all versions of an extension."""
        # Set up test data
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the extension
        self.registry.register_extension(extension_data)
        
        # Set up version data
        version_data_1 = {
            "version": "1.1.0",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        version_data_2 = {
            "version": "1.2.0",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the versions
        self.registry.register_extension_version("test.extension", version_data_1)
        self.registry.register_extension_version("test.extension", version_data_2)
        
        # Call the method under test
        versions = self.registry.list_extension_versions("test.extension")
        
        # Verify the result
        self.assertEqual(len(versions), 3)  # Including the initial version
        self.assertIn("1.0.0", versions)
        self.assertIn("1.1.0", versions)
        self.assertIn("1.2.0", versions)

    def test_list_versions_for_nonexistent_extension(self):
        """Test listing versions for a nonexistent extension."""
        # Call the method under test
        versions = self.registry.list_extension_versions("nonexistent.extension")
        
        # Verify the result
        self.assertEqual(len(versions), 0)

    def test_check_extension_exists(self):
        """Test checking if an extension exists."""
        # Set up test data
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the extension
        self.registry.register_extension(extension_data)
        
        # Call the method under test
        exists = self.registry.check_extension_exists("test.extension")
        
        # Verify the result
        self.assertTrue(exists)
        
        # Check a nonexistent extension
        exists = self.registry.check_extension_exists("nonexistent.extension")
        
        # Verify the result
        self.assertFalse(exists)

    def test_check_extension_version_exists(self):
        """Test checking if an extension version exists."""
        # Set up test data
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        # Register the extension
        self.registry.register_extension(extension_data)
        
        # Call the method under test
        exists = self.registry.check_extension_version_exists("test.extension", "1.0.0")
        
        # Verify the result
        self.assertTrue(exists)
        
        # Check a nonexistent version
        exists = self.registry.check_extension_version_exists("test.extension", "nonexistent.version")
        
        # Verify the result
        self.assertFalse(exists)
        
        # Check a nonexistent extension
        exists = self.registry.check_extension_version_exists("nonexistent.extension", "1.0.0")
        
        # Verify the result
        self.assertFalse(exists)

if __name__ == '__main__':
    unittest.main()
