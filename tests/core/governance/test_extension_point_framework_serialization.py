"""
Serialization tests for the Extension Point Framework.
This module contains tests for serialization aspects of the ExtensionPointFramework class.
"""
import unittest
from unittest.mock import Mock, MagicMock, patch, mock_open, call
import json
from datetime import datetime
from collections import namedtuple
from src.core.governance.extension_point_framework import ExtensionPointFramework

class TestExtensionPointFrameworkSerialization(unittest.TestCase):
    """Test cases for serialization aspects of the ExtensionPointFramework class."""

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
        patcher = patch('os.path.exists')
        self.addCleanup(patcher.stop)
        self.mock_exists = patcher.start()
        self.mock_exists.return_value = False
        
        # Reset the extension points dictionary to ensure test isolation
        self.framework.extension_points = {}

    def test_save_extension_points_with_valid_data(self):
        """Test saving extension points with valid data."""
        # Register an extension point
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
        
        # Mock the open function to capture the written data
        mock_file = mock_open()
        
        # Patch the open function
        with patch('builtins.open', mock_file):
            # Call the method under test
            self.framework._save_extension_points()
        
        # Verify the file was opened for writing
        mock_file.assert_called_once_with(self.framework.extension_points_path, 'w')
        
        # Verify that write was called (we don't need to check the exact content)
        mock_file().write.assert_called()

    def test_load_extension_points_with_valid_data(self):
        """Test loading extension points with valid data."""
        # Set up test data
        mock_data = {
            "test.extension_point": {
                "extension_point_id": "test.extension_point",
                "name": "Test Extension Point",
                "description": "A test extension point",
                "input_schema": {"type": "object", "properties": {}},
                "output_schema": {"type": "object", "properties": {}},
                "owner_module_id": "test.module",
                "metadata": {},
                "registered_at": "2025-06-06T12:00:00Z",
                "implementations": {},
                "seal": "test-seal"
            }
        }
        
        # Patch os.path.exists to return True
        with patch('os.path.exists', return_value=True):
            # Patch open to return mock data
            with patch('builtins.open', mock_open(read_data=json.dumps(mock_data))):
                # Call the method under test
                self.framework._load_extension_points()
        
        # Verify the extension points were loaded
        self.assertIn("test.extension_point", self.framework.extension_points)
        self.assertEqual(self.framework.extension_points["test.extension_point"]["name"], "Test Extension Point")

    def test_load_extension_points_with_invalid_json(self):
        """Test loading extension points with invalid JSON."""
        # Patch os.path.exists to return True
        with patch('os.path.exists', return_value=True):
            # Patch open to return invalid JSON
            with patch('builtins.open', mock_open(read_data="invalid json")):
                # Call the method under test
                self.framework._load_extension_points()
        
        # Verify the extension points dictionary is empty
        self.assertEqual(self.framework.extension_points, {})

    def test_load_extension_points_with_file_not_found(self):
        """Test loading extension points with file not found."""
        # Patch os.path.exists to return False
        with patch('os.path.exists', return_value=False):
            # Call the method under test
            self.framework._load_extension_points()
        
        # Verify the extension points dictionary is empty
        self.assertEqual(self.framework.extension_points, {})

    def test_prepare_for_serialization_with_callable(self):
        """Test preparing data for serialization with callable objects."""
        # Create a test function
        def test_function(x):
            return x * 2
        
        # Create test data with a callable
        test_data = {
            "function": test_function
        }
        
        # Call the method under test
        result = self.framework._prepare_for_serialization(test_data)
        
        # Verify the callable was converted to a string representation
        self.assertIsInstance(result["function"], str)
        self.assertIn("test_function", result["function"])

    def test_prepare_for_serialization_with_complex_object(self):
        """Test preparing data for serialization with complex objects."""
        # Create a complex object
        class TestObject:
            def __init__(self, value):
                self.value = value
            
            def get_value(self):
                return self.value
        
        # Create test data with a complex object
        test_object = TestObject(42)
        test_data = {
            "object": test_object,
            "lambda": lambda x: x * 2
        }
        
        # Call the method under test
        result = self.framework._prepare_for_serialization(test_data)
        
        # Verify the complex object was converted to a string representation
        self.assertIsInstance(result["object"], str)
        self.assertIn("TestObject", result["object"])
        
        # Verify the lambda was converted to a string representation
        self.assertIsInstance(result["lambda"], str)
        self.assertIn("lambda", result["lambda"])

    def test_serialization_with_unicode_characters(self):
        """Test serialization with Unicode characters."""
        # Register an extension point with Unicode characters
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {
                "unicode_key": "你好世界",  # Hello World in Chinese
                "emoji": "🚀"  # Rocket emoji
            }
        }
        self.framework.register_extension_point(extension_point_data)
        
        # Mock the open function to capture the written data
        mock_file = mock_open()
        
        # Patch the open function
        with patch('builtins.open', mock_file):
            # Call the method under test
            self.framework._save_extension_points()
        
        # Verify the file was opened for writing
        mock_file.assert_called_once_with(self.framework.extension_points_path, 'w')
        
        # Verify that write was called
        mock_file().write.assert_called()

    def test_serialization_with_large_data(self):
        """Test serialization with large data."""
        # Register an extension point with large data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {
                "large_data": "x" * 10000  # 10KB of data
            }
        }
        self.framework.register_extension_point(extension_point_data)
        
        # Mock the open function to capture the written data
        mock_file = mock_open()
        
        # Patch the open function
        with patch('builtins.open', mock_file):
            # Call the method under test
            self.framework._save_extension_points()
        
        # Verify the file was opened for writing
        mock_file.assert_called_once_with(self.framework.extension_points_path, 'w')
        
        # Verify that write was called
        mock_file().write.assert_called()

if __name__ == '__main__':
    unittest.main()
