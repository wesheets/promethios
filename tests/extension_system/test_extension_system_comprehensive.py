"""
Tests for the Promethios extension system.

This module provides comprehensive tests for the extension system components:
- ExtensionRegistry
- ModuleRegistry
- FeatureToggleService
"""

import sys
import os
import unittest
import unittest.mock

# Add the src directory to the path so we can import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

class TestExtensionSystem(unittest.TestCase):
    """
    Comprehensive test class for the Promethios extension system.
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
        self.mock_extension.modules = ["test-module"]
        self.mock_extension.features = ["test-feature"]
        
        self.mock_module = unittest.mock.MagicMock()
        self.mock_module.id = "test-module"
        self.mock_module.name = "Test Module"
        self.mock_module.version = "1.0.0"
        self.mock_module.dependencies = []
        
        # Register the mock module
        self.module_registry.register(self.mock_module)
    
    def test_extension_registry_basic_operations(self):
        """Test basic operations of the ExtensionRegistry."""
        # Register an extension
        self.assertTrue(self.extension_registry.register(self.mock_extension))
        
        # Verify extension is registered
        self.assertIn(self.mock_extension.id, self.extension_registry.get_all_extensions())
        
        # Get the extension
        extension = self.extension_registry.get_extension(self.mock_extension.id)
        self.assertEqual(extension, self.mock_extension)
        
        # Check if extension is enabled (should be False initially)
        self.assertFalse(self.extension_registry.is_extension_enabled(self.mock_extension.id))
        
        # Deregister the extension
        self.assertTrue(self.extension_registry.deregister(self.mock_extension.id))
        
        # Verify extension is deregistered
        self.assertNotIn(self.mock_extension.id, self.extension_registry.get_all_extensions())
    
    def test_extension_registry_enable_disable(self):
        """Test enabling and disabling extensions in the ExtensionRegistry."""
        # Register an extension
        self.extension_registry.register(self.mock_extension)
        
        # Enable the extension
        self.assertTrue(self.extension_registry.enable_extension(
            self.mock_extension.id, 
            self.module_registry, 
            self.feature_toggle_service
        ))
        
        # Verify extension is enabled
        self.assertTrue(self.extension_registry.is_extension_enabled(self.mock_extension.id))
        
        # Verify module is loaded
        self.assertTrue(self.module_registry.is_module_loaded(self.mock_module.id))
        
        # Verify feature is enabled
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("test-feature"))
        
        # Disable the extension
        self.assertTrue(self.extension_registry.disable_extension(
            self.mock_extension.id, 
            self.module_registry, 
            self.feature_toggle_service
        ))
        
        # Verify extension is disabled
        self.assertFalse(self.extension_registry.is_extension_enabled(self.mock_extension.id))
        
        # Verify feature is disabled
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("test-feature"))
    
    def test_module_registry_basic_operations(self):
        """Test basic operations of the ModuleRegistry."""
        # Module was registered in setUp
        
        # Verify module is registered
        self.assertIn(self.mock_module.id, self.module_registry.get_all_modules())
        
        # Get the module
        module = self.module_registry.get_module(self.mock_module.id)
        self.assertEqual(module, self.mock_module)
        
        # Check if module is loaded (should be False initially)
        self.assertFalse(self.module_registry.is_module_loaded(self.mock_module.id))
        
        # Deregister the module
        self.assertTrue(self.module_registry.deregister(self.mock_module.id))
        
        # Verify module is deregistered
        self.assertNotIn(self.mock_module.id, self.module_registry.get_all_modules())
    
    def test_module_registry_load_unload(self):
        """Test loading and unloading modules in the ModuleRegistry."""
        # Module was registered in setUp
        
        # Load the module
        self.assertTrue(self.module_registry.load_module(self.mock_module.id))
        
        # Verify module is loaded
        self.assertTrue(self.module_registry.is_module_loaded(self.mock_module.id))
        
        # Verify initialize was called
        self.mock_module.initialize.assert_called_once()
        
        # Unload the module
        self.assertTrue(self.module_registry.unload_module(self.mock_module.id))
        
        # Verify module is unloaded
        self.assertFalse(self.module_registry.is_module_loaded(self.mock_module.id))
        
        # Verify shutdown was called
        self.mock_module.shutdown.assert_called_once()
    
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
        
        # Resolve dependencies for module-c
        resolved = self.module_registry.resolve_dependencies("module-c")
        
        # Verify dependency resolution
        self.assertEqual(len(resolved), 3)
        self.assertEqual(resolved[0].id, "module-a")
        self.assertEqual(resolved[1].id, "module-b")
        self.assertEqual(resolved[2].id, "module-c")
        
        # Load module-c (should load dependencies)
        self.assertTrue(self.module_registry.load_module("module-c"))
        
        # Verify all modules are loaded
        self.assertTrue(self.module_registry.is_module_loaded("module-a"))
        self.assertTrue(self.module_registry.is_module_loaded("module-b"))
        self.assertTrue(self.module_registry.is_module_loaded("module-c"))
        
        # Try to unload module-a (should fail because module-b depends on it)
        self.assertFalse(self.module_registry.unload_module("module-a"))
        
        # Unload module-c
        self.assertTrue(self.module_registry.unload_module("module-c"))
        
        # Unload module-b
        self.assertTrue(self.module_registry.unload_module("module-b"))
        
        # Now unload module-a (should succeed)
        self.assertTrue(self.module_registry.unload_module("module-a"))
    
    def test_feature_toggle_service_basic_operations(self):
        """Test basic operations of the FeatureToggleService."""
        # Enable a feature
        self.assertTrue(self.feature_toggle_service.enable_feature("test-feature"))
        
        # Verify feature is enabled
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("test-feature"))
        
        # Disable the feature
        self.assertTrue(self.feature_toggle_service.disable_feature("test-feature"))
        
        # Verify feature is disabled
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("test-feature"))
    
    def test_feature_toggle_service_dependencies(self):
        """Test feature dependencies in the FeatureToggleService."""
        # Set up feature dependencies
        self.assertTrue(self.feature_toggle_service.set_feature_dependencies("feature-c", ["feature-b"]))
        self.assertTrue(self.feature_toggle_service.set_feature_dependencies("feature-b", ["feature-a"]))
        
        # Enable feature-c (should enable all dependencies)
        self.assertTrue(self.feature_toggle_service.enable_feature("feature-c"))
        
        # Verify all features are enabled
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("feature-a"))
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("feature-b"))
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("feature-c"))
        
        # Disable feature-a (should disable dependent features)
        self.assertTrue(self.feature_toggle_service.disable_feature("feature-a"))
        
        # Verify all features are disabled
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("feature-a"))
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("feature-b"))
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("feature-c"))
    
    def test_feature_toggle_service_circular_dependencies(self):
        """Test circular dependency detection in the FeatureToggleService."""
        # Set up feature dependencies
        self.assertTrue(self.feature_toggle_service.set_feature_dependencies("feature-a", ["feature-b"]))
        self.assertTrue(self.feature_toggle_service.set_feature_dependencies("feature-b", ["feature-c"]))
        
        # Try to create a circular dependency (should fail)
        self.assertFalse(self.feature_toggle_service.set_feature_dependencies("feature-c", ["feature-a"]))
    
    def test_integration_between_components(self):
        """Test integration between ExtensionRegistry, ModuleRegistry, and FeatureToggleService."""
        # Register an extension
        self.extension_registry.register(self.mock_extension)
        
        # Enable the extension
        self.assertTrue(self.extension_registry.enable_extension(
            self.mock_extension.id, 
            self.module_registry, 
            self.feature_toggle_service
        ))
        
        # Verify extension is enabled
        self.assertTrue(self.extension_registry.is_extension_enabled(self.mock_extension.id))
        
        # Verify module is loaded
        self.assertTrue(self.module_registry.is_module_loaded(self.mock_module.id))
        
        # Verify feature is enabled
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("test-feature"))
        
        # Disable the extension
        self.assertTrue(self.extension_registry.disable_extension(
            self.mock_extension.id, 
            self.module_registry, 
            self.feature_toggle_service
        ))
        
        # Verify extension is disabled
        self.assertFalse(self.extension_registry.is_extension_enabled(self.mock_extension.id))
        
        # Verify feature is disabled
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("test-feature"))
    
    def test_extension_with_multiple_modules_and_features(self):
        """Test an extension with multiple modules and features."""
        # Create an extension with multiple modules and features
        complex_extension = unittest.mock.MagicMock()
        complex_extension.id = "complex-extension"
        complex_extension.name = "Complex Extension"
        complex_extension.version = "1.0.0"
        complex_extension.modules = ["module-a", "module-b", "module-c"]
        complex_extension.features = ["feature-a", "feature-b", "feature-c"]
        
        # Create modules
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
        
        # Set up feature dependencies
        self.feature_toggle_service.set_feature_dependencies("feature-b", ["feature-a"])
        self.feature_toggle_service.set_feature_dependencies("feature-c", ["feature-b"])
        
        # Register the extension
        self.extension_registry.register(complex_extension)
        
        # Enable the extension
        self.assertTrue(self.extension_registry.enable_extension(
            complex_extension.id, 
            self.module_registry, 
            self.feature_toggle_service
        ))
        
        # Verify extension is enabled
        self.assertTrue(self.extension_registry.is_extension_enabled(complex_extension.id))
        
        # Verify all modules are loaded
        self.assertTrue(self.module_registry.is_module_loaded("module-a"))
        self.assertTrue(self.module_registry.is_module_loaded("module-b"))
        self.assertTrue(self.module_registry.is_module_loaded("module-c"))
        
        # Verify all features are enabled
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("feature-a"))
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("feature-b"))
        self.assertTrue(self.feature_toggle_service.is_feature_enabled("feature-c"))
        
        # Disable the extension
        self.assertTrue(self.extension_registry.disable_extension(
            complex_extension.id, 
            self.module_registry, 
            self.feature_toggle_service
        ))
        
        # Verify extension is disabled
        self.assertFalse(self.extension_registry.is_extension_enabled(complex_extension.id))
        
        # Verify all features are disabled
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("feature-a"))
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("feature-b"))
        self.assertFalse(self.feature_toggle_service.is_feature_enabled("feature-c"))

if __name__ == "__main__":
    unittest.main()
