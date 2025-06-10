"""
Separate working test file for the Promethios extension system.

This module provides a clean implementation of tests for the extension system
without relying on the problematic test harness from the original tests.
"""

import sys
import os
import unittest
import unittest.mock

# Add the src directory to the path so we can import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

class TestExtensionSystem(unittest.TestCase):
    """
    Test class for the Promethios extension system.
    
    This class provides tests for the extension system components:
    - ExtensionRegistry
    - ModuleRegistry
    - FeatureToggleService
    """
    
    def setUp(self):
        """Set up test environment with mock objects."""
        # Import the extension system components
        from src.core.extensions.ExtensionRegistry import ExtensionRegistry
        from src.core.extensions.ModuleRegistry import ModuleRegistry
        from src.core.extensions.FeatureToggleService import FeatureToggleService
        
        # Create instances of the extension system components
        self.extension_registry = ExtensionRegistry()
        self.module_registry = ModuleRegistry()
        self.feature_toggle_service = FeatureToggleService()
        
        # Create mock extensions and modules
        self.mock_extension = unittest.mock.MagicMock()
        self.mock_extension.id = "test-extension"
        self.mock_extension.name = "Test Extension"
        self.mock_extension.version = "1.0.0"
        
        self.mock_module = unittest.mock.MagicMock()
        self.mock_module.id = "test-module"
        self.mock_module.name = "Test Module"
        self.mock_module.version = "1.0.0"
        self.mock_module.dependencies = []
    
    def test_extension_registry_registration(self):
        """Test extension registration in the ExtensionRegistry."""
        # Register an extension
        result = self.extension_registry.register(self.mock_extension)
        
        # Verify registration was successful
        self.assertTrue(result)
        self.assertIn(self.mock_extension.id, self.extension_registry.get_all_extensions())
        
        # Verify extension can be retrieved
        extension = self.extension_registry.get_extension(self.mock_extension.id)
        self.assertEqual(extension, self.mock_extension)
    
    def test_extension_registry_deregistration(self):
        """Test extension deregistration in the ExtensionRegistry."""
        # Register an extension
        self.extension_registry.register(self.mock_extension)
        
        # Deregister the extension
        result = self.extension_registry.deregister(self.mock_extension.id)
        
        # Verify deregistration was successful
        self.assertTrue(result)
        self.assertNotIn(self.mock_extension.id, self.extension_registry.get_all_extensions())
    
    def test_module_registry_registration(self):
        """Test module registration in the ModuleRegistry."""
        # Register a module
        result = self.module_registry.register(self.mock_module)
        
        # Verify registration was successful
        self.assertTrue(result)
        self.assertIn(self.mock_module.id, self.module_registry.get_all_modules())
        
        # Verify module can be retrieved
        module = self.module_registry.get_module(self.mock_module.id)
        self.assertEqual(module, self.mock_module)
    
    def test_module_registry_dependency_resolution(self):
        """Test dependency resolution in the ModuleRegistry."""
        # Create modules with dependencies
        module_a = unittest.mock.MagicMock()
        module_a.id = "module-a"
        module_a.dependencies = []
        
        module_b = unittest.mock.MagicMock()
        module_b.id = "module-b"
        module_b.dependencies = ["module-a"]
        
        module_c = unittest.mock.MagicMock()
        module_c.id = "module-c"
        module_c.dependencies = ["module-b"]
        
        # Register modules
        self.module_registry.register(module_a)
        self.module_registry.register(module_b)
        self.module_registry.register(module_c)
        
        # Resolve dependencies
        resolved = self.module_registry.resolve_dependencies("module-c")
        
        # Verify dependency resolution
        self.assertEqual(len(resolved), 3)
        self.assertEqual(resolved[0].id, "module-a")
        self.assertEqual(resolved[1].id, "module-b")
        self.assertEqual(resolved[2].id, "module-c")
    
    def test_feature_toggle_service(self):
        """Test feature toggling in the FeatureToggleService."""
        # Enable a feature
        self.feature_toggle_service.enable_feature("test-feature")
        
        # Verify feature is enabled
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("test-feature"))
        
        # Disable the feature
        self.feature_toggle_service.disable_feature("test-feature")
        
        # Verify feature is disabled
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("test-feature"))
    
    def test_feature_toggle_service_with_dependencies(self):
        """Test feature toggling with dependencies in the FeatureToggleService."""
        # Set up feature dependencies
        self.feature_toggle_service.set_feature_dependencies("feature-c", ["feature-b"])
        self.feature_toggle_service.set_feature_dependencies("feature-b", ["feature-a"])
        
        # Enable feature-c (should enable all dependencies)
        self.feature_toggle_service.enable_feature("feature-c")
        
        # Verify all features are enabled
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("feature-a"))
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("feature-b"))
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("feature-c"))
        
        # Disable feature-a (should disable dependent features)
        self.feature_toggle_service.disable_feature("feature-a")
        
        # Verify dependent features are disabled
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("feature-a"))
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("feature-b"))
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("feature-c"))
    
    def test_extension_integration(self):
        """Test integration between ExtensionRegistry, ModuleRegistry, and FeatureToggleService."""
        # Create an extension with modules and features
        extension = unittest.mock.MagicMock()
        extension.id = "test-extension"
        extension.modules = ["test-module"]
        extension.features = ["test-feature"]
        
        # Register the extension
        self.extension_registry.register(extension)
        
        # Register the module
        self.module_registry.register(self.mock_module)
        
        # Enable the extension
        self.extension_registry.enable_extension("test-extension", 
                                               self.module_registry, 
                                               self.feature_toggle_service)
        
        # Verify module is loaded
        self.assertTrue(self.module_registry.is_module_loaded("test-module"))
        
        # Verify feature is enabled
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("test-feature"))
        
        # Disable the extension
        self.extension_registry.disable_extension("test-extension",
                                                self.module_registry,
                                                self.feature_toggle_service)
        
        # Verify feature is disabled
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("test-feature"))

if __name__ == "__main__":
    unittest.main()
