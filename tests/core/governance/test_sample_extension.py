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
        
        # Configure mock extension point framework with the correct method names
        self.mock_extension_point_framework.register_extension_point = MagicMock(return_value=True)
        self.mock_extension_point_framework.register_implementation = MagicMock(return_value=True)
        self.mock_extension_point_framework.unregister_implementation = MagicMock(return_value=True)
        self.mock_extension_point_framework.unregister_extension_point = MagicMock(return_value=True)
        
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
        self.mock_extension_point_framework.register_implementation.assert_called_once()
    
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
        self.mock_extension_point_framework.register_implementation.assert_not_called()
    
    def test_register_extension_with_implementation_failure(self):
        """Test registering the extension when the implementation registration fails."""
        # Configure mock extension point framework to return False for register_implementation
        self.mock_extension_point_framework.register_implementation.return_value = False
        
        # Register the extension
        result = self.sample_extension.register()
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the extension point framework was called
        self.mock_extension_point_framework.register_extension_point.assert_called_once()
        self.mock_extension_point_framework.register_implementation.assert_called_once()
    
    def test_unregister_extension(self):
        """Test unregistering the extension."""
        # Unregister the extension
        result = self.sample_extension.unregister()
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the extension point framework was called
        self.mock_extension_point_framework.unregister_implementation.assert_called_once()
        self.mock_extension_point_framework.unregister_extension_point.assert_called_once()
    
    def test_unregister_extension_with_nonexistent_implementation(self):
        """Test unregistering the extension when the implementation doesn't exist."""
        # Configure mock extension point framework to return False for unregister_implementation
        self.mock_extension_point_framework.unregister_implementation.return_value = False
        
        # Unregister the extension
        result = self.sample_extension.unregister()
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the extension point framework was called
        self.mock_extension_point_framework.unregister_implementation.assert_called_once()
        self.mock_extension_point_framework.unregister_extension_point.assert_not_called()
    
    def test_unregister_extension_with_nonexistent_extension_point(self):
        """Test unregistering the extension when the extension point doesn't exist."""
        # Configure mock extension point framework to return False for unregister_extension_point
        self.mock_extension_point_framework.unregister_extension_point.return_value = False
        
        # Unregister the extension
        result = self.sample_extension.unregister()
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the extension point framework was called
        self.mock_extension_point_framework.unregister_implementation.assert_called_once()
        self.mock_extension_point_framework.unregister_extension_point.assert_called_once()
    
    def test_implementation_execute(self):
        """Test executing the implementation."""
        # Create implementation
        implementation = SampleExtensionImplementation()
        
        # Set threshold
        implementation.threshold = 0.5
        
        # Execute with value above threshold
        result = implementation.execute({"value": 0.6, "context": "test"})
        
        # Verify the result
        self.assertTrue(result["success"])
        self.assertEqual(result["context"], "test")
        
        # Execute with value below threshold
        result = implementation.execute({"value": 0.4, "context": "test"})
        
        # Verify the result
        self.assertFalse(result["success"])
        self.assertEqual(result["context"], "test")
    
    def test_implementation_execute_with_invalid_input(self):
        """Test executing the implementation with invalid input."""
        # Create implementation
        implementation = SampleExtensionImplementation()
        
        # Execute with invalid input
        result = implementation.execute({"value": "not a number", "context": "test"})
        
        # Verify the result
        self.assertFalse(result["success"])
        self.assertEqual(result["context"], "test")
        self.assertIn("Invalid input type", result["message"])
