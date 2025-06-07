"""
Concurrency tests for the Extension Point Framework.
This module contains tests for concurrent operations on the ExtensionPointFramework class.
"""
import unittest
from unittest.mock import Mock, MagicMock, patch
import json
import threading
import time
from datetime import datetime
from collections import namedtuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from src.core.governance.extension_point_framework import ExtensionPointFramework

class TestExtensionPointFrameworkConcurrency(unittest.TestCase):
    """Test cases for concurrent operations on the ExtensionPointFramework class."""

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

    def test_concurrent_extension_point_registration(self):
        """Test concurrent registration of extension points."""
        # Number of concurrent registrations
        num_registrations = 10
        
        # Create extension point data templates
        extension_point_templates = []
        for i in range(num_registrations):
            extension_point_templates.append({
                "extension_point_id": f"test.extension_point.{i}",
                "name": f"Test Extension Point {i}",
                "description": f"A test extension point {i}",
                "input_schema": {"type": "object", "properties": {}},
                "output_schema": {"type": "object", "properties": {}},
                "owner_module_id": "test.module",
                "metadata": {}
            })
        
        # Function to register an extension point
        def register_extension_point(extension_point_data):
            return self.framework.register_extension_point(extension_point_data)
        
        # Use ThreadPoolExecutor to run registrations concurrently
        results = []
        with ThreadPoolExecutor(max_workers=num_registrations) as executor:
            futures = [executor.submit(register_extension_point, template) for template in extension_point_templates]
            for future in as_completed(futures):
                results.append(future.result())
        
        # Verify all registrations were successful
        self.assertEqual(len(results), num_registrations)
        self.assertTrue(all(results))
        
        # Verify all extension points were registered
        for i in range(num_registrations):
            self.assertIn(f"test.extension_point.{i}", self.framework.extension_points)

    def test_concurrent_implementation_registration(self):
        """Test concurrent registration of implementations for a single extension point."""
        # Register an extension point first
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
        
        # Number of concurrent registrations
        num_registrations = 10
        
        # Create implementation data templates
        implementation_templates = []
        for i in range(num_registrations):
            implementation_templates.append({
                "implementation_id": f"test.implementation.{i}",
                "name": f"Test Implementation {i}",
                "description": f"A test implementation {i}",
                "provider_module_id": "test.provider",
                "priority": i,
                "configuration": {}
            })
        
        # Function to register an implementation
        def register_implementation(implementation_data):
            return self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Use ThreadPoolExecutor to run registrations concurrently
        results = []
        with ThreadPoolExecutor(max_workers=num_registrations) as executor:
            futures = [executor.submit(register_implementation, template) for template in implementation_templates]
            for future in as_completed(futures):
                try:
                    results.append(future.result())
                except ValueError:
                    # Some registrations might fail due to race conditions
                    results.append(False)
        
        # Verify the number of successful registrations
        successful_registrations = sum(1 for result in results if result)
        self.assertEqual(successful_registrations, num_registrations)
        
        # Verify all implementations were registered
        implementations = self.framework.list_implementations("test.extension_point")
        self.assertEqual(len(implementations), num_registrations)
        for i in range(num_registrations):
            self.assertIn(f"test.implementation.{i}", implementations)

    def test_concurrent_extension_point_invocation(self):
        """Test concurrent invocation of an extension point."""
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
        
        # Register an implementation with a mock function
        mock_function = Mock(return_value="test_result")
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {},
            "implementation_function": mock_function
        }
        self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Number of concurrent invocations
        num_invocations = 20
        
        # Function to invoke the extension point
        def invoke_extension_point(i):
            input_data = {"request_id": f"request_{i}"}
            return self.framework.invoke_extension_point("test.extension_point", input_data)
        
        # Use ThreadPoolExecutor to run invocations concurrently
        results = []
        with ThreadPoolExecutor(max_workers=num_invocations) as executor:
            futures = [executor.submit(invoke_extension_point, i) for i in range(num_invocations)]
            for future in as_completed(futures):
                results.append(future.result())
        
        # Verify all invocations were successful
        self.assertEqual(len(results), num_invocations)
        for result in results:
            self.assertTrue(result.success)
            self.assertEqual(result.output, "test_result")
            self.assertEqual(result.provider_id, "test.implementation")
        
        # Verify the mock function was called the correct number of times
        self.assertEqual(mock_function.call_count, num_invocations)

    def test_concurrent_mixed_operations(self):
        """Test concurrent mixed operations (registration and invocation)."""
        # Register an initial extension point
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
        
        # Register an initial implementation
        mock_function = Mock(return_value="test_result")
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Test Implementation",
            "description": "A test implementation",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {},
            "implementation_function": mock_function
        }
        self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Number of concurrent operations
        num_operations = 30
        
        # Functions for different operations
        def register_extension_point(i):
            data = {
                "extension_point_id": f"test.extension_point.{i}",
                "name": f"Test Extension Point {i}",
                "description": f"A test extension point {i}",
                "input_schema": {"type": "object", "properties": {}},
                "output_schema": {"type": "object", "properties": {}},
                "owner_module_id": "test.module",
                "metadata": {}
            }
            try:
                return ("register_extension_point", self.framework.register_extension_point(data))
            except ValueError:
                return ("register_extension_point", False)
        
        def register_implementation(i):
            data = {
                "implementation_id": f"test.implementation.{i}",
                "name": f"Test Implementation {i}",
                "description": f"A test implementation {i}",
                "provider_module_id": "test.provider",
                "priority": i,
                "configuration": {},
                "implementation_function": mock_function
            }
            try:
                return ("register_implementation", self.framework.register_implementation("test.extension_point", data))
            except ValueError:
                return ("register_implementation", False)
        
        def invoke_extension_point(i):
            input_data = {"request_id": f"request_{i}"}
            result = self.framework.invoke_extension_point("test.extension_point", input_data)
            return ("invoke_extension_point", result.success)
        
        # Create a list of operations to perform
        operations = []
        for i in range(num_operations):
            if i % 3 == 0:
                operations.append(lambda i=i: register_extension_point(i))
            elif i % 3 == 1:
                operations.append(lambda i=i: register_implementation(i))
            else:
                operations.append(lambda i=i: invoke_extension_point(i))
        
        # Use ThreadPoolExecutor to run operations concurrently
        results = []
        with ThreadPoolExecutor(max_workers=num_operations) as executor:
            futures = [executor.submit(operation) for operation in operations]
            for future in as_completed(futures):
                results.append(future.result())
        
        # Verify the results
        self.assertEqual(len(results), num_operations)
        
        # Count the number of each type of operation
        extension_point_registrations = sum(1 for result in results if result[0] == "register_extension_point" and result[1])
        implementation_registrations = sum(1 for result in results if result[0] == "register_implementation" and result[1])
        invocations = sum(1 for result in results if result[0] == "invoke_extension_point" and result[1])
        
        # Verify that some operations of each type were successful
        self.assertGreater(extension_point_registrations, 0)
        self.assertGreater(implementation_registrations, 0)
        self.assertGreater(invocations, 0)

    def test_concurrent_unregistration(self):
        """Test concurrent unregistration of extension points and implementations."""
        # Register multiple extension points
        num_extension_points = 5
        for i in range(num_extension_points):
            extension_point_data = {
                "extension_point_id": f"test.extension_point.{i}",
                "name": f"Test Extension Point {i}",
                "description": f"A test extension point {i}",
                "input_schema": {"type": "object", "properties": {}},
                "output_schema": {"type": "object", "properties": {}},
                "owner_module_id": "test.module",
                "metadata": {}
            }
            self.framework.register_extension_point(extension_point_data)
        
        # Function to unregister an extension point
        def unregister_extension_point(i):
            try:
                return self.framework.unregister_extension_point(f"test.extension_point.{i}")
            except ValueError:
                return False
        
        # Use ThreadPoolExecutor to run unregistrations concurrently
        results = []
        with ThreadPoolExecutor(max_workers=num_extension_points) as executor:
            futures = [executor.submit(unregister_extension_point, i) for i in range(num_extension_points)]
            for future in as_completed(futures):
                results.append(future.result())
        
        # Verify all unregistrations were successful
        self.assertEqual(len(results), num_extension_points)
        self.assertTrue(all(results))
        
        # Verify all extension points were unregistered
        for i in range(num_extension_points):
            self.assertNotIn(f"test.extension_point.{i}", self.framework.extension_points)

if __name__ == '__main__':
    unittest.main()
