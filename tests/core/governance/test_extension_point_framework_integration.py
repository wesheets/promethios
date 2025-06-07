"""
Integration tests for the Extension Point Framework.
This module contains tests for integration between the ExtensionPointFramework and other kernel components.
"""
import unittest
from unittest.mock import Mock, MagicMock, patch
import json
from datetime import datetime
from collections import namedtuple
from src.core.governance.extension_point_framework import ExtensionPointFramework

class TestExtensionPointFrameworkIntegration(unittest.TestCase):
    """Test cases for integration between the ExtensionPointFramework and other kernel components."""

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

    def test_integration_with_trust_monitoring_service(self):
        """Test integration with the TrustMonitoringService."""
        # Create a mock TrustMonitoringService
        mock_trust_monitoring_service = Mock()
        mock_trust_monitoring_service.add_alert = Mock()
        
        # Register an extension point for trust monitoring
        extension_point_data = {
            "extension_point_id": "trust.monitoring.alert_handler",
            "name": "Trust Monitoring Alert Handler",
            "description": "Extension point for handling trust monitoring alerts",
            "input_schema": {
                "type": "object",
                "properties": {
                    "alert_id": {"type": "string"},
                    "alert_type": {"type": "string"},
                    "severity": {"type": "string"},
                    "message": {"type": "string"},
                    "timestamp": {"type": "string"}
                },
                "required": ["alert_id", "alert_type", "severity", "message", "timestamp"]
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "handled": {"type": "boolean"},
                    "action_taken": {"type": "string"}
                },
                "required": ["handled"]
            },
            "owner_module_id": "trust.monitoring",
            "metadata": {}
        }
        self.framework.register_extension_point(extension_point_data)
        
        # Define an alert handler implementation
        def alert_handler_impl(alert_data):
            # Forward the alert to the trust monitoring service
            mock_trust_monitoring_service.add_alert(
                alert_id=alert_data["alert_id"],
                alert_type=alert_data["alert_type"],
                severity=alert_data["severity"],
                message=alert_data["message"],
                timestamp=alert_data["timestamp"]
            )
            return {"handled": True, "action_taken": "Alert forwarded to TrustMonitoringService"}
        
        # Register the implementation
        implementation_data = {
            "implementation_id": "trust.monitoring.default_alert_handler",
            "name": "Default Alert Handler",
            "description": "Default implementation for handling trust monitoring alerts",
            "provider_module_id": "trust.monitoring",
            "priority": 0,
            "configuration": {},
            "implementation_function": alert_handler_impl
        }
        self.framework.register_implementation("trust.monitoring.alert_handler", implementation_data)
        
        # Create an alert
        alert_data = {
            "alert_id": "test-alert-001",
            "alert_type": "boundary_violation",
            "severity": "high",
            "message": "Boundary violation detected in module X",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Invoke the extension point
        result = self.framework.invoke_extension_point("trust.monitoring.alert_handler", alert_data)
        
        # Verify the result
        self.assertTrue(result.success)
        self.assertTrue(result.output["handled"])
        self.assertEqual(result.output["action_taken"], "Alert forwarded to TrustMonitoringService")
        
        # Verify the trust monitoring service was called
        mock_trust_monitoring_service.add_alert.assert_called_once_with(
            alert_id=alert_data["alert_id"],
            alert_type=alert_data["alert_type"],
            severity=alert_data["severity"],
            message=alert_data["message"],
            timestamp=alert_data["timestamp"]
        )

    def test_integration_with_seal_verification_service(self):
        """Test integration with the SealVerificationService."""
        # The framework already uses the seal verification service for extension point registration
        # This test verifies that the integration works correctly
        
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
        
        # Verify the seal verification service was called
        self.mock_seal_verification_service.create_seal.assert_called()
        
        # Verify the seal was stored in the extension point
        self.assertEqual(self.framework.extension_points["test.extension_point"]["seal"], "test-seal")

    def test_integration_with_schema_validator(self):
        """Test integration with the SchemaValidator."""
        # The framework already uses the schema validator for extension point registration
        # This test verifies that the integration works correctly
        
        # Configure schema validator to reject invalid data
        ValidationResult = namedtuple('ValidationResult', ['is_valid', 'errors'])
        invalid_result = ValidationResult(is_valid=False, errors=["Invalid schema"])
        self.mock_schema_validator.validate.return_value = invalid_result
        
        # Try to register an extension point with invalid data
        extension_point_data = {
            "extension_point_id": "test.extension_point",
            "name": "Test Extension Point",
            "description": "A test extension point",
            "input_schema": {"type": "invalid_type"},  # Invalid schema
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "test.module",
            "metadata": {}
        }
        result = self.framework.register_extension_point(extension_point_data)
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the schema validator was called
        self.mock_schema_validator.validate.assert_called_once()
        
        # Verify the extension point was not added to the registry
        self.assertNotIn("test.extension_point", self.framework.extension_points)

    def test_integration_with_module_extension_registry(self):
        """Test integration with the ModuleExtensionRegistry."""
        # Create a mock ModuleExtensionRegistry
        mock_registry = Mock()
        mock_registry.get_extension = Mock(return_value={
            "extension_id": "test.extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "author": "Test Author",
            "versions": {
                "1.0.0": {
                    "extension_points": ["test.extension_point"],
                    "compatibility": {"min_framework_version": "1.0.0"}
                }
            }
        })
        
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
        
        # Create a function to verify extension point ownership
        def verify_extension_point_ownership(framework, registry, extension_point_id):
            extension_point = framework.get_extension_point(extension_point_id)
            if not extension_point:
                return False
            
            owner_module_id = extension_point["owner_module_id"]
            extension = registry.get_extension(owner_module_id)
            if not extension:
                return False
            
            # Check if the extension point is declared in the extension
            latest_version = extension["version"]
            version_data = extension["versions"][latest_version]
            return extension_point_id in version_data["extension_points"]
        
        # Verify the extension point ownership
        self.assertTrue(verify_extension_point_ownership(self.framework, mock_registry, "test.extension_point"))
        
        # Verify the registry was called
        mock_registry.get_extension.assert_called_once_with("test.module")

    def test_lifecycle_integration(self):
        """Test lifecycle integration with system startup and shutdown."""
        # Create a mock system lifecycle manager
        mock_lifecycle_manager = Mock()
        
        # Define lifecycle hooks
        def on_system_startup():
            # Load extension points
            self.framework._load_extension_points()
            return True
        
        def on_system_shutdown():
            # Save extension points
            self.framework._save_extension_points()
            return True
        
        # Register lifecycle hooks with the manager
        mock_lifecycle_manager.register_startup_hook = Mock()
        mock_lifecycle_manager.register_shutdown_hook = Mock()
        
        mock_lifecycle_manager.register_startup_hook("extension_point_framework", on_system_startup)
        mock_lifecycle_manager.register_shutdown_hook("extension_point_framework", on_system_shutdown)
        
        # Verify the hooks were registered
        mock_lifecycle_manager.register_startup_hook.assert_called_once()
        mock_lifecycle_manager.register_shutdown_hook.assert_called_once()
        
        # Simulate system startup
        startup_result = on_system_startup()
        self.assertTrue(startup_result)
        
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
        
        # Simulate system shutdown
        shutdown_result = on_system_shutdown()
        self.assertTrue(shutdown_result)
        
        # Verify the extension points were saved
        self.mock_seal_verification_service.create_seal.assert_called()

    def test_cross_extension_communication(self):
        """Test communication between extensions."""
        # Register two extension points
        producer_extension_point_data = {
            "extension_point_id": "test.producer",
            "name": "Producer Extension Point",
            "description": "An extension point that produces data",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {
                "type": "object",
                "properties": {
                    "data": {"type": "string"}
                },
                "required": ["data"]
            },
            "owner_module_id": "test.module",
            "metadata": {}
        }
        self.framework.register_extension_point(producer_extension_point_data)
        
        consumer_extension_point_data = {
            "extension_point_id": "test.consumer",
            "name": "Consumer Extension Point",
            "description": "An extension point that consumes data",
            "input_schema": {
                "type": "object",
                "properties": {
                    "data": {"type": "string"}
                },
                "required": ["data"]
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "processed": {"type": "boolean"},
                    "result": {"type": "string"}
                },
                "required": ["processed"]
            },
            "owner_module_id": "test.module",
            "metadata": {}
        }
        self.framework.register_extension_point(consumer_extension_point_data)
        
        # Register implementations
        def producer_impl(input_data):
            return {"data": "test data"}
        
        producer_implementation_data = {
            "implementation_id": "test.producer.impl",
            "name": "Producer Implementation",
            "description": "An implementation that produces data",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {},
            "implementation_function": producer_impl
        }
        self.framework.register_implementation("test.producer", producer_implementation_data)
        
        def consumer_impl(input_data):
            data = input_data["data"]
            return {"processed": True, "result": f"Processed: {data}"}
        
        consumer_implementation_data = {
            "implementation_id": "test.consumer.impl",
            "name": "Consumer Implementation",
            "description": "An implementation that consumes data",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {},
            "implementation_function": consumer_impl
        }
        self.framework.register_implementation("test.consumer", consumer_implementation_data)
        
        # Create a function that uses both extensions
        def process_data():
            # Get data from the producer
            producer_result = self.framework.invoke_extension_point("test.producer", {})
            if not producer_result.success:
                return {"success": False, "error": producer_result.error}
            
            # Pass the data to the consumer
            consumer_result = self.framework.invoke_extension_point("test.consumer", producer_result.output)
            if not consumer_result.success:
                return {"success": False, "error": consumer_result.error}
            
            return {"success": True, "result": consumer_result.output}
        
        # Call the function
        result = process_data()
        
        # Verify the result
        self.assertTrue(result["success"])
        self.assertEqual(result["result"]["result"], "Processed: test data")

    def test_error_propagation(self):
        """Test error propagation through the extension system."""
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
        
        # Register an implementation that throws an exception
        def failing_impl(input_data):
            raise ValueError("Test error")
        
        implementation_data = {
            "implementation_id": "test.implementation",
            "name": "Failing Implementation",
            "description": "An implementation that throws an exception",
            "provider_module_id": "test.provider",
            "priority": 0,
            "configuration": {},
            "implementation_function": failing_impl
        }
        self.framework.register_implementation("test.extension_point", implementation_data)
        
        # Create a mock error handler
        mock_error_handler = Mock()
        
        # Create a function that uses the extension with error handling
        def call_with_error_handling():
            try:
                result = self.framework.invoke_extension_point("test.extension_point", {})
                if not result.success:
                    mock_error_handler.handle_error(result.error, result.provider_id)
                    return {"success": False, "error": result.error}
                return {"success": True, "result": result.output}
            except Exception as e:
                mock_error_handler.handle_exception(str(e))
                return {"success": False, "error": str(e)}
        
        # Call the function
        result = call_with_error_handling()
        
        # Verify the result
        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "Test error")
        
        # Verify the error handler was called
        mock_error_handler.handle_error.assert_called_once()

    def test_dynamic_extension_loading(self):
        """Test dynamic loading of extensions during runtime."""
        # Create a mock dynamic loader
        mock_dynamic_loader = Mock()
        mock_dynamic_loader.load_extension = Mock(return_value={
            "extension_point_id": "dynamic.extension_point",
            "name": "Dynamic Extension Point",
            "description": "A dynamically loaded extension point",
            "input_schema": {"type": "object", "properties": {}},
            "output_schema": {"type": "object", "properties": {}},
            "owner_module_id": "dynamic.module",
            "metadata": {}
        })
        
        # Create a function to dynamically load an extension
        def load_extension(extension_id):
            extension_data = mock_dynamic_loader.load_extension(extension_id)
            if not extension_data:
                return False
            
            return self.framework.register_extension_point(extension_data)
        
        # Load a dynamic extension
        result = load_extension("dynamic.extension")
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the dynamic loader was called
        mock_dynamic_loader.load_extension.assert_called_once_with("dynamic.extension")
        
        # Verify the extension point was registered
        self.assertIn("dynamic.extension_point", self.framework.extension_points)

if __name__ == '__main__':
    unittest.main()
