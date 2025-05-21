"""
Unit tests for the Module Lifecycle Manager component of the Governance Expansion Protocol.

This module contains tests for the ModuleLifecycleManager class, which is responsible
for managing the lifecycle of governance extensions.
"""

import os
import json
import unittest
from unittest.mock import MagicMock, patch
import tempfile
import shutil
import uuid
from datetime import datetime

# Import the module to test
from src.core.governance.module_lifecycle_manager import (
    ModuleLifecycleManager,
    LifecycleState,
    LifecycleTransitionError
)
from src.core.governance.module_extension_registry import ModuleExtensionRegistry
from src.core.governance.compatibility_verification_engine import CompatibilityVerificationEngine
from src.core.verification.seal_verification import SealVerificationService
from src.core.common.schema_validator import SchemaValidator

class TestModuleLifecycleManager(unittest.TestCase):
    """Test cases for the ModuleLifecycleManager class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a temporary directory for test files
        self.test_dir = tempfile.mkdtemp()
        
        # Create mock dependencies
        self.mock_registry = MagicMock(spec=ModuleExtensionRegistry)
        self.mock_verification_engine = MagicMock(spec=CompatibilityVerificationEngine)
        self.mock_seal_verification_service = MagicMock(spec=SealVerificationService)
        self.mock_schema_validator = MagicMock(spec=SchemaValidator)
        
        # Configure mock schema validator
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        self.mock_schema_validator.validate = MagicMock(return_value=validation_result)
        
        # Configure mock verification engine
        verification_result = MagicMock()
        verification_result.is_compatible = True
        verification_result.compatibility_status = "compatible"
        verification_result.verification_id = "test-verification-id"
        self.mock_verification_engine.verify_extension_compatibility.return_value = verification_result
        
        # Configure mock seal verification service
        self.mock_seal_verification_service.create_seal = MagicMock(return_value="test-seal")
        self.mock_seal_verification_service.verify_seal = MagicMock(return_value=True)
        
        # Configure mock registry
        self.mock_registry.get_extension = MagicMock(return_value={
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
        })
        
        self.mock_registry.get_extension_version = MagicMock(return_value={
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "2.0.0",
            "author": "Test Author",
            "dependencies": [],
            "extension_points": [],
            "compatibility": {
                "min_framework_version": "1.0.0",
                "max_framework_version": "2.0.0",
                "compatible_modules": []
            }
        })
        
        self.mock_registry.check_extension_exists = MagicMock(return_value=True)
        self.mock_registry.check_extension_version_exists = MagicMock(return_value=True)
        
        # Create lifecycle manager with test directory
        self.lifecycle_history_path = os.path.join(self.test_dir, "lifecycle_history.json")
        self.lifecycle_manager = ModuleLifecycleManager(
            self.mock_registry,
            self.mock_verification_engine,
            self.mock_seal_verification_service,
            self.mock_schema_validator,
            self.lifecycle_history_path
        )
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the temporary directory
        shutil.rmtree(self.test_dir)
    
    def test_register_extension_lifecycle(self):
        """Test registering an extension lifecycle."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Verify the lifecycle ID is a UUID
        try:
            uuid.UUID(lifecycle_id)
            is_valid_uuid = True
        except ValueError:
            is_valid_uuid = False
        
        self.assertTrue(is_valid_uuid)
        
        # Verify the lifecycle was added
        self.assertIn(lifecycle_id, self.lifecycle_manager.lifecycles)
        
        # Verify the lifecycle state
        lifecycle = self.lifecycle_manager.lifecycles[lifecycle_id]
        self.assertEqual(lifecycle["extension_id"], "test.extension")
        self.assertEqual(lifecycle["extension_version"], "1.0.0")
        self.assertEqual(lifecycle["current_state"], LifecycleState.REGISTERED.value)
        
        # Verify the registry was called
        self.mock_registry.check_extension_exists.assert_called_once_with("test.extension")
        self.mock_registry.check_extension_version_exists.assert_called_once_with("test.extension", "1.0.0")
        
        # Verify schema validation was called
        self.mock_schema_validator.validate.assert_called_once()
        
        # Verify seal verification was called
        self.mock_seal_verification_service.create_seal.assert_called_once()
    
    def test_register_nonexistent_extension(self):
        """Test registering a nonexistent extension."""
        # Configure mock registry to return False for check_extension_exists
        self.mock_registry.check_extension_exists.return_value = False
        
        # Try to register a nonexistent extension
        with self.assertRaises(ValueError):
            self.lifecycle_manager.register_extension_lifecycle(
                extension_id="nonexistent.extension",
                extension_version="1.0.0",
                actor_id="test-actor"
            )
    
    def test_register_nonexistent_extension_version(self):
        """Test registering a nonexistent extension version."""
        # Configure mock registry to return False for check_extension_version_exists
        self.mock_registry.check_extension_version_exists.return_value = False
        
        # Try to register a nonexistent extension version
        with self.assertRaises(ValueError):
            self.lifecycle_manager.register_extension_lifecycle(
                extension_id="test.extension",
                extension_version="nonexistent.version",
                actor_id="test-actor"
            )
    
    def test_get_lifecycle(self):
        """Test getting a lifecycle."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Get the lifecycle
        lifecycle = self.lifecycle_manager.get_lifecycle(lifecycle_id)
        
        # Verify the lifecycle
        self.assertIsNotNone(lifecycle)
        self.assertEqual(lifecycle["extension_id"], "test.extension")
        self.assertEqual(lifecycle["extension_version"], "1.0.0")
        self.assertEqual(lifecycle["current_state"], LifecycleState.REGISTERED.value)
    
    def test_get_nonexistent_lifecycle(self):
        """Test getting a nonexistent lifecycle."""
        # Get a nonexistent lifecycle
        lifecycle = self.lifecycle_manager.get_lifecycle("nonexistent-lifecycle-id")
        
        # Verify the result
        self.assertIsNone(lifecycle)
    
    def test_list_lifecycles(self):
        """Test listing all lifecycles."""
        # Register extension lifecycles
        lifecycle_id_1 = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension1",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        lifecycle_id_2 = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension2",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # List all lifecycles
        lifecycles = self.lifecycle_manager.list_lifecycles()
        
        # Verify the lifecycles
        self.assertEqual(len(lifecycles), 2)
        self.assertIn(lifecycle_id_1, lifecycles)
        self.assertIn(lifecycle_id_2, lifecycles)
    
    def test_list_lifecycles_by_extension(self):
        """Test listing lifecycles by extension."""
        # Register extension lifecycles
        lifecycle_id_1 = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension1",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        lifecycle_id_2 = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension2",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # List lifecycles by extension
        lifecycles = self.lifecycle_manager.list_lifecycles_by_extension("test.extension1")
        
        # Verify the lifecycles
        self.assertEqual(len(lifecycles), 1)
        self.assertIn(lifecycle_id_1, lifecycles)
        self.assertNotIn(lifecycle_id_2, lifecycles)
    
    def test_list_lifecycles_by_state(self):
        """Test listing lifecycles by state."""
        # Register extension lifecycles
        lifecycle_id_1 = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension1",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        lifecycle_id_2 = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension2",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition one lifecycle to installed state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id_1,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor"
        )
        
        # List lifecycles by state
        registered_lifecycles = self.lifecycle_manager.list_lifecycles_by_state(LifecycleState.REGISTERED.value)
        installed_lifecycles = self.lifecycle_manager.list_lifecycles_by_state(LifecycleState.INSTALLED.value)
        
        # Verify the lifecycles
        self.assertEqual(len(registered_lifecycles), 1)
        self.assertEqual(len(installed_lifecycles), 1)
        self.assertIn(lifecycle_id_2, registered_lifecycles)
        self.assertIn(lifecycle_id_1, installed_lifecycles)
    
    def test_transition_state(self):
        """Test transitioning a lifecycle state."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        result = self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor",
            reason="Test installation",
            metadata={"installation_path": "/test/path"}
        )
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the lifecycle state
        lifecycle = self.lifecycle_manager.get_lifecycle(lifecycle_id)
        self.assertEqual(lifecycle["current_state"], LifecycleState.INSTALLED.value)
        
        # Verify the transition history
        self.assertEqual(len(lifecycle["transition_history"]), 1)
        transition = lifecycle["transition_history"][0]
        self.assertEqual(transition["from_state"], LifecycleState.REGISTERED.value)
        self.assertEqual(transition["to_state"], LifecycleState.INSTALLED.value)
        self.assertEqual(transition["actor_id"], "test-actor")
        self.assertEqual(transition["reason"], "Test installation")
        self.assertEqual(transition["metadata"]["installation_path"], "/test/path")
        
        # Verify schema validation was called
        self.assertEqual(self.mock_schema_validator.validate.call_count, 2)
        
        # Verify seal verification was called
        self.assertEqual(self.mock_seal_verification_service.create_seal.call_count, 2)
    
    def test_transition_to_same_state(self):
        """Test transitioning to the same state."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Try to transition to the same state
        with self.assertRaises(LifecycleTransitionError):
            self.lifecycle_manager.transition_state(
                lifecycle_id=lifecycle_id,
                new_state=LifecycleState.REGISTERED.value,
                actor_id="test-actor"
            )
    
    def test_transition_to_invalid_state(self):
        """Test transitioning to an invalid state."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Try to transition to an invalid state
        with self.assertRaises(ValueError):
            self.lifecycle_manager.transition_state(
                lifecycle_id=lifecycle_id,
                new_state="invalid-state",
                actor_id="test-actor"
            )
    
    def test_transition_nonexistent_lifecycle(self):
        """Test transitioning a nonexistent lifecycle."""
        # Try to transition a nonexistent lifecycle
        with self.assertRaises(ValueError):
            self.lifecycle_manager.transition_state(
                lifecycle_id="nonexistent-lifecycle-id",
                new_state=LifecycleState.INSTALLED.value,
                actor_id="test-actor"
            )
    
    def test_transition_to_activated_with_incompatible_extension(self):
        """Test transitioning to activated state with an incompatible extension."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor"
        )
        
        # Configure mock verification engine to return incompatible
        verification_result = MagicMock()
        verification_result.is_compatible = False
        verification_result.compatibility_status = "incompatible"
        verification_result.verification_id = "test-verification-id"
        self.mock_verification_engine.verify_extension_compatibility.return_value = verification_result
        
        # Try to transition to activated state
        with self.assertRaises(LifecycleTransitionError):
            self.lifecycle_manager.transition_state(
                lifecycle_id=lifecycle_id,
                new_state=LifecycleState.ACTIVATED.value,
                actor_id="test-actor"
            )
    
    def test_update_extension(self):
        """Test updating an extension."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor"
        )
        
        # Transition to activated state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.ACTIVATED.value,
            actor_id="test-actor"
        )
        
        # Update the extension
        result = self.lifecycle_manager.update_extension(
            lifecycle_id=lifecycle_id,
            new_version="2.0.0",
            actor_id="test-actor",
            reason="Test update",
            changelog="Test changelog"
        )
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the lifecycle state
        lifecycle = self.lifecycle_manager.get_lifecycle(lifecycle_id)
        self.assertEqual(lifecycle["extension_version"], "2.0.0")
        self.assertEqual(lifecycle["current_state"], LifecycleState.ACTIVATED.value)
        
        # Verify the update history
        self.assertEqual(len(lifecycle["update_history"]), 1)
        update = lifecycle["update_history"][0]
        self.assertEqual(update["from_version"], "1.0.0")
        self.assertEqual(update["to_version"], "2.0.0")
        self.assertEqual(update["actor_id"], "test-actor")
        self.assertEqual(update["reason"], "Test update")
        self.assertEqual(update["changelog"], "Test changelog")
        
        # Verify the registry was called
        self.mock_registry.check_extension_version_exists.assert_called_with("test.extension", "2.0.0")
        
        # Verify the verification engine was called
        self.mock_verification_engine.verify_extension_compatibility.assert_called_with("test.extension", "2.0.0")
        
        # Verify schema validation was called
        self.assertEqual(self.mock_schema_validator.validate.call_count, 4)
        
        # Verify seal verification was called
        self.assertEqual(self.mock_seal_verification_service.create_seal.call_count, 4)
    
    def test_update_nonexistent_lifecycle(self):
        """Test updating a nonexistent lifecycle."""
        # Try to update a nonexistent lifecycle
        with self.assertRaises(ValueError):
            self.lifecycle_manager.update_extension(
                lifecycle_id="nonexistent-lifecycle-id",
                new_version="2.0.0",
                actor_id="test-actor"
            )
    
    def test_update_to_nonexistent_version(self):
        """Test updating to a nonexistent version."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor"
        )
        
        # Configure mock registry to return False for check_extension_version_exists
        self.mock_registry.check_extension_version_exists.return_value = False
        
        # Try to update to a nonexistent version
        with self.assertRaises(ValueError):
            self.lifecycle_manager.update_extension(
                lifecycle_id=lifecycle_id,
                new_version="nonexistent.version",
                actor_id="test-actor"
            )
    
    def test_update_to_same_version(self):
        """Test updating to the same version."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Try to update to the same version
        with self.assertRaises(ValueError):
            self.lifecycle_manager.update_extension(
                lifecycle_id=lifecycle_id,
                new_version="1.0.0",
                actor_id="test-actor"
            )
    
    def test_update_extension_from_invalid_state(self):
        """Test updating an extension from an invalid state."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Try to update from registered state
        with self.assertRaises(LifecycleTransitionError):
            self.lifecycle_manager.update_extension(
                lifecycle_id=lifecycle_id,
                new_version="2.0.0",
                actor_id="test-actor"
            )
    
    def test_update_with_incompatible_version(self):
        """Test updating with an incompatible version."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor"
        )
        
        # Configure mock verification engine to return incompatible
        verification_result = MagicMock()
        verification_result.is_compatible = False
        verification_result.compatibility_status = "incompatible"
        verification_result.verification_id = "test-verification-id"
        self.mock_verification_engine.verify_extension_compatibility.return_value = verification_result
        
        # Try to update with an incompatible version
        with self.assertRaises(LifecycleTransitionError):
            self.lifecycle_manager.update_extension(
                lifecycle_id=lifecycle_id,
                new_version="2.0.0",
                actor_id="test-actor"
            )
    
    def test_rollback_extension(self):
        """Test rolling back an extension."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor"
        )
        
        # Transition to activated state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.ACTIVATED.value,
            actor_id="test-actor"
        )
        
        # Update the extension
        self.lifecycle_manager.update_extension(
            lifecycle_id=lifecycle_id,
            new_version="2.0.0",
            actor_id="test-actor"
        )
        
        # Rollback the extension
        result = self.lifecycle_manager.rollback_extension(
            lifecycle_id=lifecycle_id,
            target_version="1.0.0",
            actor_id="test-actor",
            reason="Test rollback",
            issues_encountered=["Test issue"]
        )
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the lifecycle state
        lifecycle = self.lifecycle_manager.get_lifecycle(lifecycle_id)
        self.assertEqual(lifecycle["extension_version"], "1.0.0")
        self.assertEqual(lifecycle["current_state"], LifecycleState.ACTIVATED.value)
        
        # Verify the rollback history
        self.assertEqual(len(lifecycle["rollback_history"]), 1)
        rollback = lifecycle["rollback_history"][0]
        self.assertEqual(rollback["from_version"], "2.0.0")
        self.assertEqual(rollback["to_version"], "1.0.0")
        self.assertEqual(rollback["actor_id"], "test-actor")
        self.assertEqual(rollback["reason"], "Test rollback")
        self.assertEqual(rollback["issues_encountered"], ["Test issue"])
        
        # Verify schema validation was called
        self.assertEqual(self.mock_schema_validator.validate.call_count, 5)
        
        # Verify seal verification was called
        self.assertEqual(self.mock_seal_verification_service.create_seal.call_count, 5)
    
    def test_rollback_nonexistent_lifecycle(self):
        """Test rolling back a nonexistent lifecycle."""
        # Try to rollback a nonexistent lifecycle
        with self.assertRaises(ValueError):
            self.lifecycle_manager.rollback_extension(
                lifecycle_id="nonexistent-lifecycle-id",
                target_version="1.0.0",
                actor_id="test-actor"
            )
    
    def test_rollback_to_nonexistent_version(self):
        """Test rolling back to a nonexistent version."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor"
        )
        
        # Update the extension
        self.lifecycle_manager.update_extension(
            lifecycle_id=lifecycle_id,
            new_version="2.0.0",
            actor_id="test-actor"
        )
        
        # Configure mock registry to return False for check_extension_version_exists
        self.mock_registry.check_extension_version_exists.return_value = False
        
        # Try to rollback to a nonexistent version
        with self.assertRaises(ValueError):
            self.lifecycle_manager.rollback_extension(
                lifecycle_id=lifecycle_id,
                target_version="nonexistent.version",
                actor_id="test-actor"
            )
    
    def test_rollback_to_same_version(self):
        """Test rolling back to the same version."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor"
        )
        
        # Update the extension
        self.lifecycle_manager.update_extension(
            lifecycle_id=lifecycle_id,
            new_version="2.0.0",
            actor_id="test-actor"
        )
        
        # Try to rollback to the same version
        with self.assertRaises(ValueError):
            self.lifecycle_manager.rollback_extension(
                lifecycle_id=lifecycle_id,
                target_version="2.0.0",
                actor_id="test-actor"
            )
    
    def test_rollback_with_no_update_history(self):
        """Test rolling back with no update history."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Try to rollback with no update history
        with self.assertRaises(ValueError):
            self.lifecycle_manager.rollback_extension(
                lifecycle_id=lifecycle_id,
                target_version="0.9.0",
                actor_id="test-actor"
            )
    
    def test_rollback_to_version_not_in_history(self):
        """Test rolling back to a version not in the update history."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor"
        )
        
        # Update the extension
        self.lifecycle_manager.update_extension(
            lifecycle_id=lifecycle_id,
            new_version="2.0.0",
            actor_id="test-actor"
        )
        
        # Try to rollback to a version not in the update history
        with self.assertRaises(ValueError):
            self.lifecycle_manager.rollback_extension(
                lifecycle_id=lifecycle_id,
                target_version="0.9.0",
                actor_id="test-actor"
            )
    
    def test_save_and_load_lifecycles(self):
        """Test saving and loading lifecycles."""
        # Register an extension lifecycle
        lifecycle_id = self.lifecycle_manager.register_extension_lifecycle(
            extension_id="test.extension",
            extension_version="1.0.0",
            actor_id="test-actor"
        )
        
        # Transition to installed state
        self.lifecycle_manager.transition_state(
            lifecycle_id=lifecycle_id,
            new_state=LifecycleState.INSTALLED.value,
            actor_id="test-actor"
        )
        
        # Save lifecycles
        self.lifecycle_manager._save_lifecycles()
        
        # Create a new lifecycle manager that will load from the same file
        new_lifecycle_manager = ModuleLifecycleManager(
            self.mock_registry,
            self.mock_verification_engine,
            self.mock_seal_verification_service,
            self.mock_schema_validator,
            self.lifecycle_history_path
        )
        
        # Verify the lifecycle was loaded
        self.assertIn(lifecycle_id, new_lifecycle_manager.lifecycles)
        lifecycle = new_lifecycle_manager.get_lifecycle(lifecycle_id)
        self.assertEqual(lifecycle["extension_id"], "test.extension")
        self.assertEqual(lifecycle["extension_version"], "1.0.0")
        self.assertEqual(lifecycle["current_state"], LifecycleState.INSTALLED.value)


if __name__ == "__main__":
    unittest.main()
