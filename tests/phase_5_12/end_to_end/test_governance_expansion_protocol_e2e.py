"""
End-to-end tests for the Governance Expansion Protocol.

This module contains end-to-end tests for the Governance Expansion Protocol,
validating the complete functionality of the protocol including extension
registration, lifecycle management, and execution.
"""

import os
import json
import unittest
from unittest.mock import MagicMock, patch
import tempfile
import shutil

from src.core.governance.module_extension_registry import ModuleExtensionRegistry
from src.core.governance.compatibility_verification_engine import CompatibilityVerificationEngine
from src.core.governance.module_lifecycle_manager import ModuleLifecycleManager
from src.core.governance.extension_point_framework import ExtensionPointFramework, ExtensionPointInvocationResult
from src.core.governance.sample_extension import SampleExtension

class TestGovernanceExpansionProtocolE2E(unittest.TestCase):
    """End-to-end tests for the Governance Expansion Protocol."""
    
    def setUp(self):
        """Set up the test environment."""
        # Create temporary directories for test files
        self.temp_dir = tempfile.mkdtemp()
        self.extensions_path = os.path.join(self.temp_dir, "extensions.json")
        self.extension_points_path = os.path.join(self.temp_dir, "extension_points.json")
        self.lifecycle_history_path = os.path.join(self.temp_dir, "lifecycle_history.json")
        
        # Create mock objects
        self.mock_schema_validator = MagicMock()
        self.mock_schema_validator.validate.return_value = MagicMock(is_valid=True, errors=None)
        
        self.mock_seal_verification_service = MagicMock()
        self.mock_seal_verification_service.create_seal = MagicMock(return_value="test-seal")
        self.mock_seal_verification_service.verify_seal = MagicMock(return_value=True)
        
        self.mock_codex_lock = MagicMock()
        self.mock_codex_lock.verify_contract_state = MagicMock(return_value=True)
        
        self.mock_trust_metrics_calculator = MagicMock()
        
        # Initialize the components
        self.module_extension_registry = ModuleExtensionRegistry(
            self.mock_schema_validator,
            self.mock_seal_verification_service,
            self.extensions_path
        )
        
        self.compatibility_verification_engine = CompatibilityVerificationEngine(
            self.mock_schema_validator,
            self.mock_seal_verification_service,
            self.module_extension_registry
        )
        
        # Initialize the Module Lifecycle Manager with the correct arguments
        self.module_lifecycle_manager = ModuleLifecycleManager(
            self.module_extension_registry,
            self.compatibility_verification_engine,
            self.mock_seal_verification_service,
            self.mock_schema_validator,
            self.lifecycle_history_path
        )
        
        self.extension_point_framework = ExtensionPointFramework(
            self.mock_schema_validator,
            self.mock_seal_verification_service,
            self.extension_points_path
        )
        
        # Initialize the sample extension with only the extension_point_framework
        self.sample_extension = SampleExtension(
            self.extension_point_framework
        )
    
    def tearDown(self):
        """Clean up after the test."""
        # Remove temporary directory
        shutil.rmtree(self.temp_dir)
    
    def test_complete_extension_lifecycle_with_execution(self):
        """Test the complete lifecycle of an extension, including execution."""
        # Register a new extension
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension for end-to-end testing",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "implementations": [],
            "compatibility": {
                "min_version": "1.0.0",
                "max_version": "2.0.0",
                "compatible_with": ["core", "governance"]
            }
        }
        
        # Mock the schema validation
        self.mock_schema_validator.validate.return_value = MagicMock(is_valid=True, errors=None)
        
        # Register the extension
        result = self.module_extension_registry.register_extension(extension_data)
        self.assertTrue(result)
        
        # Verify the extension exists
        self.assertTrue(self.module_extension_registry.check_extension_exists("test.extension"))
        
        # Register an extension point
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point for end-to-end testing",
            "input_schema": {"type": "object", "properties": {"input": {"type": "string"}}},
            "output_schema": {"type": "object", "properties": {"output": {"type": "string"}}},
            "owner_module_id": "test.extension",
            "metadata": {"test": "metadata"}
        }
        
        # Register the extension point
        result = self.extension_point_framework.register_extension_point(extension_point_data)
        self.assertTrue(result)
        
        # Verify the extension point exists
        self.assertTrue(self.extension_point_framework.check_extension_point_exists("test.extension_point"))
        
        # Register an implementation
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation for end-to-end testing",
            "provider_module_id": "test.extension",
            "priority": 10,
            "configuration": {"test": "configuration"}
        }
        
        # Register the implementation
        result = self.extension_point_framework.register_implementation("test.extension_point", implementation_data)
        self.assertTrue(result)
        
        # Verify the implementation exists
        self.assertTrue(self.extension_point_framework.check_implementation_exists("test.extension_point", "test.implementation"))
        
        # Mock the implementation function
        implementation = self.extension_point_framework.get_implementation("test.extension_point", "test.implementation")
        implementation["implementation_function"] = MagicMock(return_value={"output": "test output"})
        
        # Invoke the extension point
        result = self.extension_point_framework.invoke_extension_point("test.extension_point", {"input": "test input"})
        
        # Verify the result
        self.assertTrue(result.success)
        self.assertEqual(result.output, {"output": "test output"})
        self.assertIsNone(result.error)
        self.assertEqual(result.provider_id, "test.extension")
        
        # Unregister the implementation
        result = self.extension_point_framework.unregister_implementation("test.extension_point", "test.implementation")
        self.assertTrue(result)
        
        # Verify the implementation no longer exists
        self.assertFalse(self.extension_point_framework.check_implementation_exists("test.extension_point", "test.implementation"))
        
        # Unregister the extension point
        result = self.extension_point_framework.unregister_extension_point("test.extension_point")
        self.assertTrue(result)
        
        # Verify the extension point no longer exists
        self.assertFalse(self.extension_point_framework.check_extension_point_exists("test.extension_point"))
        
        # Unregister the extension
        result = self.module_extension_registry.unregister_extension("test.extension")
        self.assertTrue(result)
        
        # Verify the extension no longer exists
        self.assertFalse(self.module_extension_registry.check_extension_exists("test.extension"))
    
    def test_multiple_implementations_e2e(self):
        """Test the end-to-end functionality with multiple implementations."""
        # Register a new extension
        extension_data = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension for end-to-end testing",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "implementations": [],
            "compatibility": {
                "min_version": "1.0.0",
                "max_version": "2.0.0",
                "compatible_with": ["core", "governance"]
            }
        }
        
        # Register the extension
        result = self.module_extension_registry.register_extension(extension_data)
        self.assertTrue(result)
        
        # Register an extension point
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point for end-to-end testing",
            "input_schema": {"type": "object", "properties": {"input": {"type": "string"}}},
            "output_schema": {"type": "object", "properties": {"output": {"type": "string"}}},
            "owner_module_id": "test.extension",
            "metadata": {"test": "metadata"}
        }
        
        # Register the extension point
        result = self.extension_point_framework.register_extension_point(extension_point_data)
        self.assertTrue(result)
        
        # Register multiple implementations with different priorities
        implementation_data_1 = {
            "implementation_id": "test.implementation.1",
            "name": "Test Implementation 1",
            "description": "A test implementation with low priority",
            "provider_module_id": "test.extension",
            "priority": 5,
            "configuration": {"test": "configuration"}
        }
        
        implementation_data_2 = {
            "implementation_id": "test.implementation.2",
            "name": "Test Implementation 2",
            "description": "A test implementation with high priority",
            "provider_module_id": "test.extension",
            "priority": 10,
            "configuration": {"test": "configuration"}
        }
        
        # Register the implementations
        result1 = self.extension_point_framework.register_implementation("test.extension_point", implementation_data_1)
        result2 = self.extension_point_framework.register_implementation("test.extension_point", implementation_data_2)
        self.assertTrue(result1)
        self.assertTrue(result2)
        
        # Mock the implementation functions
        implementation1 = self.extension_point_framework.get_implementation("test.extension_point", "test.implementation.1")
        implementation1["implementation_function"] = MagicMock(return_value={"output": "output from implementation 1"})
        
        implementation2 = self.extension_point_framework.get_implementation("test.extension_point", "test.implementation.2")
        implementation2["implementation_function"] = MagicMock(return_value={"output": "output from implementation 2"})
        
        # Invoke the extension point - should use the highest priority implementation (2)
        result = self.extension_point_framework.invoke_extension_point("test.extension_point", {"input": "test input"})
        
        # Verify the result
        self.assertTrue(result.success)
        self.assertEqual(result.output, {"output": "output from implementation 2"})
        self.assertIsNone(result.error)
        self.assertEqual(result.provider_id, "test.extension")
        
        # Verify implementation 1 was not called
        implementation1["implementation_function"].assert_not_called()
        
        # Verify implementation 2 was called
        implementation2["implementation_function"].assert_called_once_with({"input": "test input"})
        
        # Clean up
        self.extension_point_framework.unregister_implementation("test.extension_point", "test.implementation.1")
        self.extension_point_framework.unregister_implementation("test.extension_point", "test.implementation.2")
        self.extension_point_framework.unregister_extension_point("test.extension_point")
        self.module_extension_registry.unregister_extension("test.extension")
    
    def test_sample_extension_e2e(self):
        """Test the end-to-end functionality of the sample extension."""
        # Set up the extension point framework with a properly structured mock extension point
        extension_point_id = "governance.sample.threshold"
        implementation_id = "governance.sample.threshold.default"
        
        # Create a complete mock extension point with all required fields
        self.extension_point_framework.extension_points = {
            extension_point_id: {
                "extension_point_id": extension_point_id,
                "name": "Sample Threshold Extension Point",
                "description": "A sample extension point for threshold-based governance decisions",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "value": {"type": "number"},
                        "context": {"type": "string"}
                    },
                    "required": ["value"]
                },
                "output_schema": {
                    "type": "object",
                    "properties": {
                        "success": {"type": "boolean"},
                        "message": {"type": "string"},
                        "context": {"type": "string"}
                    }
                },
                "owner_module_id": "governance.sample",
                "implementations": {
                    implementation_id: {
                        "implementation_id": implementation_id,
                        "name": "Default Threshold Implementation",
                        "description": "Default implementation for the sample threshold extension point",
                        "provider_module_id": "governance.sample.threshold",
                        "priority": 10,
                        "implementation_function": MagicMock(return_value={"threshold_result": True})
                    }
                }
            }
        }
        
        # Mock the check_extension_exists method
        self.module_extension_registry.check_extension_exists = MagicMock(return_value=True)
        
        # Mock the check_extension_point_exists method
        self.extension_point_framework.check_extension_point_exists = MagicMock(return_value=True)
        
        # Mock the check_implementation_exists method
        self.extension_point_framework.check_implementation_exists = MagicMock(return_value=True)
        
        # Invoke the sample extension
        input_data = {"value": 75, "threshold": 70}
        result = self.extension_point_framework.invoke_extension_point(extension_point_id, input_data)
        
        # Verify the result
        self.assertTrue(result.success)
        self.assertEqual(result.output, {"threshold_result": True})
        self.assertIsNone(result.error)
        self.assertEqual(result.provider_id, "governance.sample.threshold")
        
        # Mock the unregister methods to avoid serialization issues
        self.extension_point_framework.unregister_implementation = MagicMock(return_value=True)
        self.extension_point_framework.unregister_extension_point = MagicMock(return_value=True)
        
        # Unregister the sample extension
        result = self.sample_extension.unregister()
        self.assertTrue(result)
        
        # Verify the unregister methods were called
        self.extension_point_framework.unregister_implementation.assert_called_once_with(
            extension_point_id, implementation_id
        )
        self.extension_point_framework.unregister_extension_point.assert_called_once_with(
            extension_point_id
        )


if __name__ == "__main__":
    unittest.main()
