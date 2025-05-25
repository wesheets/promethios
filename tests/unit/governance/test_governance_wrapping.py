"""
Test suite for the Governance Wrapping System in Promethios.

This module contains unit tests for the Governance Wrapping System,
ensuring that module instrumentation, trust reporting, and memory logging work correctly.
"""

import os
import sys
import unittest
from unittest.mock import patch, MagicMock, call

# Add the repository root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from src.governance_wrapping.core import (
    GovernanceWrapper, CoreModuleWrapper, ExtensionModuleWrapper,
    IntegrationModuleWrapper, GovernanceWrapperFactory, TrustReporter,
    MemoryLogger, GovernanceConfig
)
from src.governance_wrapping.integration import (
    GovernanceIntegrator, ModuleRegistry, ImportHook, wrap_module
)


class TestGovernanceWrappingSystem(unittest.TestCase):
    """Test cases for the Governance Wrapping System."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a test module
        class TestModule:
            def test_method(self, arg):
                return f"Original: {arg}"
                
            def __str__(self):
                return "TestModule"
        
        self.test_module = TestModule()
        
        # Reset ModuleRegistry
        ModuleRegistry._instance = None
    
    def test_governance_wrapper_initialization(self):
        """Test that GovernanceWrapper can be initialized."""
        wrapper = GovernanceWrapper(self.test_module)
        self.assertIsNotNone(wrapper)
        self.assertEqual(wrapper.wrapped_module, self.test_module)
        self.assertIsNotNone(wrapper.trust_reporter)
        self.assertIsNotNone(wrapper.memory_logger)
        self.assertIsNotNone(wrapper.reflection_engine)
    
    def test_governance_wrapper_method_proxy(self):
        """Test that GovernanceWrapper proxies method calls to the wrapped module."""
        wrapper = GovernanceWrapper(self.test_module)
        
        # Mock governance methods
        wrapper._start_operation = MagicMock(return_value="op_id")
        wrapper._complete_operation = MagicMock()
        wrapper._apply_overrides = MagicMock(return_value="Original: test")
        
        # Call a method on the wrapped module
        result = wrapper.test_method("test")
        
        # Verify that governance methods were called
        wrapper._start_operation.assert_called_once_with("test_method", ("test",), {})
        wrapper._complete_operation.assert_called_once_with("op_id", "Original: test")
        wrapper._apply_overrides.assert_called_once_with("op_id", "Original: test")
        
        # Verify that the result is correct
        self.assertEqual(result, "Original: test")
    
    def test_core_module_wrapper(self):
        """Test that CoreModuleWrapper adds enhanced governance for core modules."""
        wrapper = CoreModuleWrapper(self.test_module)
        
        # Verify that critical operations are identified
        self.assertIn("test_method", wrapper.critical_operations)
        
        # Mock governance methods
        wrapper._start_operation = MagicMock(return_value="op_id")
        wrapper._complete_operation = MagicMock()
        wrapper._apply_overrides = MagicMock(return_value="Original: test")
        
        # Call a method on the wrapped module
        result = wrapper.test_method("test")
        
        # Verify that the result is correct
        self.assertEqual(result, "Original: test")
    
    def test_extension_module_wrapper(self):
        """Test that ExtensionModuleWrapper adds boundary enforcement for extension modules."""
        wrapper = ExtensionModuleWrapper(self.test_module)
        
        # Mock boundary enforcer
        wrapper.boundary_enforcer.verify_boundaries = MagicMock()
        wrapper.boundary_enforcer.enforce_result_boundaries = MagicMock(return_value="Original: test")
        
        # Mock governance methods
        wrapper._start_operation = MagicMock(return_value="op_id")
        wrapper._complete_operation = MagicMock()
        wrapper._apply_overrides = MagicMock(return_value="Original: test")
        
        # Call a method on the wrapped module
        result = wrapper.test_method("test")
        
        # Verify that boundary methods were called
        wrapper.boundary_enforcer.verify_boundaries.assert_called_once()
        wrapper.boundary_enforcer.enforce_result_boundaries.assert_called_once()
        
        # Verify that the result is correct
        self.assertEqual(result, "Original: test")
    
    def test_integration_module_wrapper(self):
        """Test that IntegrationModuleWrapper adds external system validation for integration modules."""
        wrapper = IntegrationModuleWrapper(self.test_module)
        
        # Mock external validator
        wrapper.external_validator.validate_interaction = MagicMock()
        wrapper.external_validator.validate_response = MagicMock()
        
        # Mock governance methods
        wrapper._start_operation = MagicMock(return_value="op_id")
        wrapper._complete_operation = MagicMock()
        wrapper._apply_overrides = MagicMock(return_value="Original: test")
        
        # Call a method on the wrapped module
        result = wrapper.test_method("test")
        
        # Verify that validation methods were called
        wrapper.external_validator.validate_interaction.assert_called_once()
        wrapper.external_validator.validate_response.assert_called_once()
        
        # Verify that the result is correct
        self.assertEqual(result, "Original: test")
    
    def test_governance_wrapper_factory(self):
        """Test that GovernanceWrapperFactory creates appropriate wrappers."""
        # Test core module wrapper
        wrapper = GovernanceWrapperFactory.create_wrapper(self.test_module, "core")
        self.assertIsInstance(wrapper, CoreModuleWrapper)
        
        # Test extension module wrapper
        wrapper = GovernanceWrapperFactory.create_wrapper(self.test_module, "extension")
        self.assertIsInstance(wrapper, ExtensionModuleWrapper)
        
        # Test integration module wrapper
        wrapper = GovernanceWrapperFactory.create_wrapper(self.test_module, "integration")
        self.assertIsInstance(wrapper, IntegrationModuleWrapper)
        
        # Test default wrapper
        wrapper = GovernanceWrapperFactory.create_wrapper(self.test_module, "basic")
        self.assertIsInstance(wrapper, GovernanceWrapper)
        
        # Test auto-detection
        with patch.object(GovernanceWrapperFactory, "_detect_module_type", return_value="core"):
            wrapper = GovernanceWrapperFactory.create_wrapper(self.test_module)
            self.assertIsInstance(wrapper, CoreModuleWrapper)
    
    def test_trust_reporter(self):
        """Test that TrustReporter reports to the trust system."""
        config = GovernanceConfig.default()
        reporter = TrustReporter(config)
        
        # Mock trust client
        reporter.trust_client.submit_report = MagicMock()
        
        # Report operation start
        reporter.report_operation_start("op_id", "test_method", "6.4.0")
        reporter.trust_client.submit_report.assert_called_once()
        
        # Reset mock
        reporter.trust_client.submit_report.reset_mock()
        
        # Report operation complete
        reporter.report_operation_complete("op_id", "result")
        reporter.trust_client.submit_report.assert_called_once()
    
    def test_memory_logger(self):
        """Test that MemoryLogger logs operations with governance context."""
        config = GovernanceConfig.default()
        logger = MemoryLogger(config)
        
        # Mock storage
        logger.storage.store_entry = MagicMock()
        
        # Log operation start
        logger.log_operation_start("op_id", "test_method", ("arg",), {}, "6.4.0")
        logger.storage.store_entry.assert_called_once()
        
        # Reset mock
        logger.storage.store_entry.reset_mock()
        
        # Log operation complete
        logger.log_operation_complete("op_id", "result")
        logger.storage.store_entry.assert_called_once()
    
    def test_module_registry(self):
        """Test that ModuleRegistry tracks wrapped modules."""
        registry = ModuleRegistry.get_instance()
        
        # Register a module
        wrapped_module = GovernanceWrapper(self.test_module)
        registry.register("test_module", wrapped_module, self.test_module)
        
        # Get the wrapped module
        retrieved = registry.get_wrapped("test_module")
        self.assertEqual(retrieved, wrapped_module)
        
        # Get the original module
        original = registry.get_original("test_module")
        self.assertEqual(original, self.test_module)
        
        # List modules
        modules = registry.list_modules()
        self.assertIn("test_module", modules)
    
    def test_governance_integrator(self):
        """Test that GovernanceIntegrator applies wrapping to all modules."""
        integrator = GovernanceIntegrator()
        
        # Mock _find_python_modules and _wrap_module
        with patch.object(integrator, "_find_python_modules", return_value=["module1.py", "module2.py"]), \
             patch.object(integrator, "_wrap_module"):
            
            # Integrate all modules
            integrator.integrate_all_modules("/test/path")
            
            # Verify that _wrap_module was called for each module
            self.assertEqual(integrator._wrap_module.call_count, 2)


if __name__ == '__main__':
    unittest.main()
