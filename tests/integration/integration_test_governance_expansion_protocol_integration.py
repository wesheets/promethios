"""
Integration tests for the Governance Expansion Protocol.

This module contains integration tests for the interaction between the core components
of the Governance Expansion Protocol: ModuleExtensionRegistry, CompatibilityVerificationEngine,
ModuleLifecycleManager, and ExtensionPointFramework.
"""

import os
import json
import unittest
from unittest.mock import MagicMock, patch
import tempfile
import shutil

# Import the modules to test
from src.core.governance.module_extension_registry import ModuleExtensionRegistry
from src.core.governance.compatibility_verification_engine import CompatibilityVerificationEngine
from src.core.governance.module_lifecycle_manager import ModuleLifecycleManager
from src.core.governance.extension_point_framework import ExtensionPointFramework
from src.core.governance.sample_extension import SampleExtension
from src.core.verification.seal_verification import SealVerificationService
from src.core.common.schema_validator import SchemaValidator

class TestGovernanceExpansionProtocolIntegration(unittest.TestCase):
    """Integration tests for the Governance Expansion Protocol."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a temporary directory for test files
        self.test_dir = tempfile.mkdtemp()
        
        # Create mock dependencies
        self.mock_seal_verification_service = MagicMock(spec=SealVerificationService)
        self.mock_schema_validator = MagicMock(spec=SchemaValidator)
        
        # Configure mock schema validator
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        self.mock_schema_validator.validate.return_value = validation_result
        
        # Configure mock seal verification service
        verification_result = MagicMock()
        verification_result.is_valid = True
        verification_result.reason = ""
        self.mock_seal_verification_service.verify_seal.return_value = verification_result
        
        # Create file paths
        self.registry_path = os.path.join(self.test_dir, "module_extensions.json")
        self.verification_history_path = os.path.join(self.test_dir, "verification_history.json")
        self.lifecycle_history_path = os.path.join(self.test_dir, "lifecycle_history.json")
        self.extension_points_path = os.path.join(self.test_dir, "extension_points.json")
        
        # Create components
        self.registry = ModuleExtensionRegistry(
            self.mock_seal_verification_service,
            self.mock_schema_validator,
            self.registry_path
        )
        
        self.verification_engine = CompatibilityVerificationEngine(
            self.registry,
            self.mock_seal_verification_service,
            self.mock_schema_validator,
            self.verification_history_path
        )
        
        self.lifecycle_manager = ModuleLifecycleManager(
            self.registry,
            self.verification_engine,
            self.mock_seal_verification_service,
            self.mock_schema_validator,
            self.lifecycle_history_path
        )
        
        self.extension_framework = ExtensionPointFramework(
            self.registry,
            self.mock_seal_verification_service,
            self.mock_schema_validator,
            self.extension_points_path
        )
        
        self.sample_extension = SampleExtension(self.extension_framework)
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the temporary directory
        shutil.rmtree(self.test_dir)
    
    def test_end_to_end_extension_lifecycle(self):
        """Test the end-to-end lifecycle of an extension."""
        # Step 1: Register an extension in the registry
        extension_metadata = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": ["test.extension_point"],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        result = self.registry.register_extension(extension_metadata)
        self.assertTrue(result)
        self.assertIn("test.extension", self.registry.extensions)
        
        # Step 2: Verify the extension's compatibility
        verification_result = self.verification_engine.verify_extension_compatibility("test.extension", "1.0.0")
        self.assertEqual(verification_result.compatibility_status, "compatible")
        self.assertTrue(verification_result.is_compatible)
        
        # Step 3: Register the extension's lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        self.assertIsNotNone(lifecycle_id)
        
        # Step 4: Transition the extension to installed state
        result = self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state="installed",
            actor_id="test-actor",
            reason="Test installation",
            metadata={"installation_path": "/test/path"}
        )
        self.assertTrue(result)
        
        # Step 5: Register an extension point
        extension_point_metadata = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "version": "1.0.0",
            "owner_module": "test.extension",
            "input_schema": {
                "type": "object",
                "properties": {
                    "test_property": {"type": "string"}
                }
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "result": {"type": "boolean"}
                }
            },
            "execution_order": "sequential",
            "required_permissions": ["test.permission"]
        }
        
        result = self.extension_framework.register_extension_point(extension_point_metadata)
        self.assertTrue(result)
        self.assertIn("test.extension_point", self.extension_framework.extension_points)
        
        # Step 6: Register an implementation for the extension point
        implementation_metadata = {
            "implementation_id": "test.implementation",
            "extension_point_id": "test.extension_point",
            "extension_id": "test.extension",
            "name": "Test Implementation",
            "description": "A test implementation",
            "version": "1.0.0",
            "priority": 10,
            "enabled": True,
            "implementation_module": "test.module",
            "implementation_class": "TestImplementation",
            "configuration": {
                "test_config": "test_value"
            }
        }
        
        result = self.extension_framework.register_extension_implementation(implementation_metadata)
        self.assertTrue(result)
        
        # Step 7: Transition the extension to activated state
        result = self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state="activated",
            actor_id="test-actor",
            reason="Test activation"
        )
        self.assertTrue(result)
        
        # Step 8: Update the extension
        extension_metadata_v2 = extension_metadata.copy()
        extension_metadata_v2["version"] = "2.0.0"
        result = self.registry.register_extension_version("test.extension", extension_metadata_v2)
        self.assertTrue(result)
        
        result = self.lifecycle_manager.update_extension(
            lifecycle_id=lifecycle_id,
            new_version="2.0.0",
            actor_id="test-actor",
            reason="Test update",
            changelog="Test changelog"
        )
        self.assertTrue(result)
        
        # Step 9: Rollback the extension
        result = self.lifecycle_manager.rollback_extension(
            lifecycle_id=lifecycle_id,
            target_version="1.0.0",
            actor_id="test-actor",
            reason="Test rollback",
            issues_encountered=["Test issue"]
        )
        self.assertTrue(result)
        
        # Step 10: Deactivate the extension
        result = self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state="deactivated",
            actor_id="test-actor",
            reason="Test deactivation"
        )
        self.assertTrue(result)
        
        # Step 11: Uninstall the extension
        result = self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state="uninstalled",
            actor_id="test-actor",
            reason="Test uninstallation"
        )
        self.assertTrue(result)
    
    def test_sample_extension_integration(self):
        """Test the integration of the sample extension."""
        # Register the sample extension
        result = self.sample_extension.register()
        self.assertTrue(result)
        
        # Verify the extension point was registered
        extension_point = self.extension_framework.get_extension_point("governance.sample.threshold_validation")
        self.assertIsNotNone(extension_point)
        self.assertEqual(extension_point.name, "Sample Threshold Validation")
        
        # Verify the implementation was registered
        implementation = self.extension_framework.get_implementation(
            "governance.sample.threshold_validation",
            "governance.sample.threshold_validation.default"
        )
        self.assertIsNotNone(implementation)
        self.assertEqual(implementation.name, "Default Threshold Validation Implementation")
        
        # Unregister the sample extension
        result = self.sample_extension.unregister()
        self.assertTrue(result)
        
        # Verify the implementation was unregistered
        implementation = self.extension_framework.get_implementation(
            "governance.sample.threshold_validation",
            "governance.sample.threshold_validation.default"
        )
        self.assertIsNone(implementation)
    
    def test_compatibility_verification_with_lifecycle_management(self):
        """Test compatibility verification integrated with lifecycle management."""
        # Register an extension in the registry
        extension_metadata = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": ["test.extension_point"],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        self.registry.register_extension(extension_metadata)
        
        # Register another extension that is compatible
        compatible_extension_metadata = {
            "extension_id": "test.compatible_extension",
            "name": "Compatible Extension",
            "description": "A compatible extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": ["test.extension"]
            }
        }
        
        self.registry.register_extension(compatible_extension_metadata)
        
        # Register an incompatible extension
        incompatible_extension_metadata = {
            "extension_id": "test.incompatible_extension",
            "name": "Incompatible Extension",
            "description": "An incompatible extension",
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
        
        self.registry.register_extension(incompatible_extension_metadata)
        
        # Configure verification engine to return incompatible for the incompatible extension
        original_verify_extension_compatibility = self.verification_engine.verify_extension_compatibility
        
        def mock_verify_extension_compatibility(extension_id, extension_version=None):
            if extension_id == "test.incompatible_extension":
                result = MagicMock()
                result.compatibility_status = "incompatible"
                result.is_compatible = False
                result.verification_id = "test-verification-id"
                result.verification_results = []
                return result
            return original_verify_extension_compatibility(extension_id, extension_version)
        
        self.verification_engine.verify_extension_compatibility = mock_verify_extension_compatibility
        
        # Register lifecycle for the compatible extension
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.compatible_extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        result = self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state="installed",
            actor_id="test-actor"
        )
        self.assertTrue(result)
        
        # Transition to activated state
        result = self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state="activated",
            actor_id="test-actor"
        )
        self.assertTrue(result)
        
        # Register lifecycle for the incompatible extension
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.incompatible_extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        result = self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state="installed",
            actor_id="test-actor"
        )
        self.assertTrue(result)
        
        # Try to transition to activated state (should fail due to incompatibility)
        with self.assertRaises(ValueError):
            self.lifecycle_manager.transition_state(
                lifecycle_id=lifecycle_id,
                new_state="activated",
                actor_id="test-actor"
            )
    
    def test_extension_point_framework_with_registry_integration(self):
        """Test integration between extension point framework and registry."""
        # Register an extension in the registry
        extension_metadata = {
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": ["test.extension_point"],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        }
        
        self.registry.register_extension(extension_metadata)
        
        # Register an extension point
        extension_point_metadata = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "version": "1.0.0",
            "owner_module": "test.extension",
            "input_schema": {
                "type": "object",
                "properties": {
                    "test_property": {"type": "string"}
                }
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "result": {"type": "boolean"}
                }
            },
            "execution_order": "sequential",
            "required_permissions": ["test.permission"]
        }
        
        result = self.extension_framework.register_extension_point(extension_point_metadata)
        self.assertTrue(result)
        
        # Delete the extension from the registry
        result = self.registry.delete_extension("test.extension")
        self.assertTrue(result)
        
        # Configure registry to return False for check_extension_exists
        self.registry.check_extension_exists.return_value = False
        
        # Try to register an implementation for the extension point (should fail)
        implementation_metadata = {
            "implementation_id": "test.implementation",
            "extension_point_id": "test.extension_point",
            "extension_id": "test.extension",
            "name": "Test Implementation",
            "description": "A test implementation",
            "version": "1.0.0",
            "priority": 10,
            "enabled": True,
            "implementation_module": "test.module",
            "implementation_class": "TestImplementation",
            "configuration": {
                "test_config": "test_value"
            }
        }
        
        with self.assertRaises(ValueError):
            self.extension_framework.register_extension_implementation(implementation_metadata)


if __name__ == "__main__":
    unittest.main()
