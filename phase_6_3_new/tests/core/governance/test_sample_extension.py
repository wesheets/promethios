"""
Unit tests for the Sample Extension component of the Governance Expansion Protocol.

This module contains tests for the SampleExtension class, which demonstrates
how to create and register a governance extension using the Extension Point Framework.
"""

import unittest
from unittest.mock import MagicMock, patch

# Import the module to test
from src.core.governance.sample_extension import SampleExtension, SampleExtensionImplementation
from src.core.governance.extension_point_framework import ExtensionPointFramework

class TestSampleExtension(unittest.TestCase):
    """Test cases for the SampleExtension class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.mock_extension_point_framework = MagicMock(spec=ExtensionPointFramework)
        
        # Configure mock extension point framework
        self.mock_extension_point_framework.register_extension_point = MagicMock(return_value=True)
        self.mock_extension_point_framework.register_extension_implementation = MagicMock(return_value=True)
        self.mock_extension_point_framework.delete_implementation = MagicMock(return_value=True)
        
        # Create sample extension
        self.sample_extension = SampleExtension(self.mock_extension_point_framework)
    
    def test_register_extension(self):
        """Test registering the extension."""
        # Register the extension
        result = self.sample_extension.register()
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the extension point framework was called
        self.mock_extension_point_framework.register_extension_point.assert_called_once()
        self.mock_extension_point_framework.register_extension_implementation.assert_called_once()
    
    def test_register_extension_with_extension_point_failure(self):
        """Test registering the extension when the extension point registration fails."""
        # Configure mock extension point framework to return False for register_extension_point
        self.mock_extension_point_framework.register_extension_point.return_value = False
        
        # Register the extension
        result = self.sample_extension.register()
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the extension point framework was called
        self.mock_extension_point_framework.register_extension_point.assert_called_once()
        self.mock_extension_point_framework.register_extension_implementation.assert_not_called()
    
    def test_register_extension_with_implementation_failure(self):
        """Test registering the extension when the implementation registration fails."""
        # Configure mock extension point framework to return False for register_extension_implementation
        self.mock_extension_point_framework.register_extension_implementation.return_value = False
        
        # Register the extension
        result = self.sample_extension.register()
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the extension point framework was called
        self.mock_extension_point_framework.register_extension_point.assert_called_once()
        self.mock_extension_point_framework.register_extension_implementation.assert_called_once()
    
    def test_unregister_extension(self):
        """Test unregistering the extension."""
        # Unregister the extension
        result = self.sample_extension.unregister()
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the extension point framework was called
        self.mock_extension_point_framework.delete_implementation.assert_called_once()
    
    def test_unregister_extension_with_nonexistent_implementation(self):
        """Test unregistering the extension when the implementation doesn't exist."""
        # Configure mock extension point framework to return False for delete_implementation
        self.mock_extension_point_framework.delete_implementation.return_value = False
        
        # Unregister the extension
        result = self.sample_extension.unregister()
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the extension point framework was called
        self.mock_extension_point_framework.delete_implementation.assert_called_once()


class TestSampleExtensionImplementation(unittest.TestCase):
    """Test cases for the SampleExtensionImplementation class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create sample implementation
        self.implementation = SampleExtensionImplementation()
    
    def test_configure(self):
        """Test configuring the implementation."""
        # Configure the implementation
        self.implementation.configure({
            "threshold": 0.7,
            "max_attempts": 5
        })
        
        # Verify the configuration
        self.assertEqual(self.implementation.threshold, 0.7)
        self.assertEqual(self.implementation.max_attempts, 5)
    
    def test_execute_with_valid_input(self):
        """Test executing the implementation with valid input."""
        # Configure the implementation
        self.implementation.configure({
            "threshold": 0.5
        })
        
        # Execute the implementation with valid input
        result = self.implementation.execute({
            "value": 0.7,
            "context": "test-context"
        })
        
        # Verify the result
        self.assertTrue(result["success"])
        self.assertEqual(result["message"], "Value 0.7 is above threshold 0.5")
        self.assertEqual(result["context"], "test-context")
    
    def test_execute_with_invalid_input(self):
        """Test executing the implementation with invalid input."""
        # Configure the implementation
        self.implementation.configure({
            "threshold": 0.5
        })
        
        # Execute the implementation with invalid input
        result = self.implementation.execute({
            "value": 0.3,
            "context": "test-context"
        })
        
        # Verify the result
        self.assertFalse(result["success"])
        self.assertEqual(result["message"], "Value 0.3 is below threshold 0.5")
        self.assertEqual(result["context"], "test-context")
    
    def test_execute_with_missing_input(self):
        """Test executing the implementation with missing input."""
        # Execute the implementation with missing input
        result = self.implementation.execute({
            "context": "test-context"
        })
        
        # Verify the result
        self.assertFalse(result["success"])
        self.assertEqual(result["message"], "Missing required input: value")
        self.assertEqual(result["context"], "test-context")
    
    def test_execute_with_invalid_input_type(self):
        """Test executing the implementation with an invalid input type."""
        # Execute the implementation with an invalid input type
        result = self.implementation.execute({
            "value": "not-a-number",
            "context": "test-context"
        })
        
        # Verify the result
        self.assertFalse(result["success"])
        self.assertEqual(result["message"], "Invalid input type: value must be a number")
        self.assertEqual(result["context"], "test-context")


if __name__ == "__main__":
    unittest.main()
