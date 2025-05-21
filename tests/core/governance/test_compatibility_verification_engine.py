"""
Unit tests for the Compatibility Verification Engine.
"""

import os
import json
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from src.core.governance.compatibility_verification_engine import CompatibilityVerificationEngine, VerificationResult

class TestCompatibilityVerificationEngine(unittest.TestCase):
    """Test cases for the Compatibility Verification Engine."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create mocks
        self.schema_validator = MagicMock()
        self.seal_verification_service = MagicMock()
        self.module_extension_registry = MagicMock()
        
        # Configure mocks
        self.seal_verification_service.create_seal.return_value = "test_seal"
        self.seal_verification_service.verify_seal.return_value = True
        
        # Create a temporary file path for verification history
        self.verification_history_path = "/tmp/test_verification_history.json"
        
        # Create the engine with patched os.makedirs
        with patch('os.makedirs'):
            self.engine = CompatibilityVerificationEngine(
                self.schema_validator,
                self.seal_verification_service,
                self.module_extension_registry,
                self.verification_history_path
            )
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the temporary file if it exists
        if os.path.exists(self.verification_history_path):
            os.remove(self.verification_history_path)
    
    def test_verify_extension_compatibility_with_framework_version(self):
        """Test verifying compatibility with framework version."""
        # Configure mocks
        extension_id = "test.extension"
        extension_version = "1.0.0"
        
        self.module_extension_registry.get_extension.return_value = {
            "extension_id": extension_id,
            "version": extension_version
        }
        
        self.module_extension_registry.get_extension_version.return_value = {
            "extension_id": extension_id,
            "version": extension_version,
            "compatibility": {
                "min_framework_version": "0.9.0",
                "max_framework_version": "1.1.0"
            }
        }
        
        # Set the framework version
        self.engine.set_framework_version("1.0.0")
        
        # Mock the save method
        with patch.object(self.engine, '_save_verification_history'):
            # Verify compatibility
            result = self.engine.verify_extension_compatibility(extension_id)
            
            # Check the result
            self.assertTrue(result.is_compatible)
            self.assertEqual(result.status, "COMPATIBLE")
            self.assertEqual(result.details["extension_id"], extension_id)
            self.assertEqual(result.details["extension_version"], extension_version)
            self.assertTrue(result.details["framework_compatible"])
    
    def test_verify_extension_compatibility_with_incompatible_framework(self):
        """Test verifying compatibility with incompatible framework version."""
        # Configure mocks
        extension_id = "test.extension"
        extension_version = "1.0.0"
        
        self.module_extension_registry.get_extension.return_value = {
            "extension_id": extension_id,
            "version": extension_version
        }
        
        self.module_extension_registry.get_extension_version.return_value = {
            "extension_id": extension_id,
            "version": extension_version,
            "compatibility": {
                "min_framework_version": "1.1.0",
                "max_framework_version": "1.2.0"
            }
        }
        
        # Set the framework version
        self.engine.set_framework_version("1.0.0")
        
        # Mock the save method
        with patch.object(self.engine, '_save_verification_history'):
            # Verify compatibility
            result = self.engine.verify_extension_compatibility(extension_id)
            
            # Check the result
            self.assertFalse(result.is_compatible)
            self.assertEqual(result.status, "INCOMPATIBLE_FRAMEWORK")
            self.assertEqual(result.details["extension_id"], extension_id)
            self.assertEqual(result.details["extension_version"], extension_version)
            self.assertFalse(result.details["framework_compatible"])
    
    def test_verify_extension_compatibility_with_incompatible_modules(self):
        """Test verifying compatibility with incompatible modules."""
        # Configure mocks
        extension_id = "test.extension"
        extension_version = "1.0.0"
        
        self.module_extension_registry.get_extension.side_effect = lambda id: {
            "test.extension": {
                "extension_id": extension_id,
                "version": extension_version
            },
            "test.module": None
        }.get(id)
        
        self.module_extension_registry.get_extension_version.return_value = {
            "extension_id": extension_id,
            "version": extension_version,
            "compatibility": {
                "min_framework_version": "0.9.0",
                "max_framework_version": "1.1.0",
                "compatible_modules": [
                    {
                        "module_id": "test.module",
                        "min_version": "1.0.0",
                        "max_version": "1.1.0"
                    }
                ]
            }
        }
        
        # Set the framework version
        self.engine.set_framework_version("1.0.0")
        
        # Mock the save method
        with patch.object(self.engine, '_save_verification_history'):
            # Verify compatibility
            result = self.engine.verify_extension_compatibility(extension_id)
            
            # Check the result
            self.assertFalse(result.is_compatible)
            self.assertEqual(result.status, "INCOMPATIBLE_MODULES")
            self.assertEqual(result.details["extension_id"], extension_id)
            self.assertEqual(result.details["extension_version"], extension_version)
            self.assertTrue(result.details["framework_compatible"])
            self.assertFalse(result.details["modules_compatible"])
    
    def test_verify_extension_compatibility_with_dependencies(self):
        """Test verifying compatibility with dependencies."""
        # Configure mocks
        extension_id = "test.extension"
        extension_version = "1.0.0"
        dependency_id = "test.dependency"
        dependency_version = "1.0.0"
        
        self.module_extension_registry.get_extension.side_effect = lambda id: {
            "test.extension": {
                "extension_id": extension_id,
                "version": extension_version
            },
            "test.dependency": {
                "extension_id": dependency_id,
                "version": dependency_version
            }
        }.get(id)
        
        self.module_extension_registry.get_extension_version.return_value = {
            "extension_id": extension_id,
            "version": extension_version,
            "compatibility": {
                "min_framework_version": "0.9.0",
                "max_framework_version": "1.1.0"
            },
            "dependencies": [
                {
                    "extension_id": dependency_id,
                    "min_version": "0.9.0",
                    "max_version": "1.1.0"
                }
            ]
        }
        
        # Set the framework version
        self.engine.set_framework_version("1.0.0")
        
        # Mock the save method
        with patch.object(self.engine, '_save_verification_history'):
            # Verify compatibility
            result = self.engine.verify_extension_compatibility(extension_id)
            
            # Check the result
            self.assertTrue(result.is_compatible)
            self.assertEqual(result.status, "COMPATIBLE")
            self.assertEqual(result.details["extension_id"], extension_id)
            self.assertEqual(result.details["extension_version"], extension_version)
            self.assertTrue(result.details["framework_compatible"])
            self.assertTrue(result.details["dependencies_compatible"])
    
    def test_get_verification(self):
        """Test getting a verification."""
        # Configure mocks
        verification_id = "test.extension:1.0.0:2023-01-01T00:00:00.000000"
        verification = {
            "verification_id": verification_id,
            "extension_id": "test.extension",
            "extension_version": "1.0.0",
            "framework_version": "1.0.0",
            "is_compatible": True,
            "status": "COMPATIBLE",
            "details": {},
            "timestamp": "2023-01-01T00:00:00.000000"
        }
        
        # Add the verification to the history
        self.engine.verification_history[verification_id] = verification
        
        # Get the verification
        result = self.engine.get_verification(verification_id)
        
        # Check the result
        self.assertEqual(result, verification)
    
    def test_list_verifications(self):
        """Test listing all verifications."""
        # Configure mocks
        verification1 = {
            "verification_id": "test.extension1:1.0.0:2023-01-01T00:00:00.000000",
            "extension_id": "test.extension1",
            "extension_version": "1.0.0",
            "framework_version": "1.0.0",
            "is_compatible": True,
            "status": "COMPATIBLE",
            "details": {},
            "timestamp": "2023-01-01T00:00:00.000000"
        }
        
        verification2 = {
            "verification_id": "test.extension2:1.0.0:2023-01-01T00:00:00.000000",
            "extension_id": "test.extension2",
            "extension_version": "1.0.0",
            "framework_version": "1.0.0",
            "is_compatible": False,
            "status": "INCOMPATIBLE_FRAMEWORK",
            "details": {},
            "timestamp": "2023-01-01T00:00:00.000000"
        }
        
        # Add the verifications to the history
        self.engine.verification_history[verification1["verification_id"]] = verification1
        self.engine.verification_history[verification2["verification_id"]] = verification2
        
        # List the verifications
        result = self.engine.list_verifications()
        
        # Check the result
        self.assertEqual(len(result), 2)
        self.assertEqual(result[verification1["verification_id"]], verification1)
        self.assertEqual(result[verification2["verification_id"]], verification2)
    
    def test_list_verifications_by_extension(self):
        """Test listing verifications by extension."""
        # Configure mocks
        extension_id = "test.extension"
        
        verification1 = {
            "verification_id": f"{extension_id}:1.0.0:2023-01-01T00:00:00.000000",
            "extension_id": extension_id,
            "extension_version": "1.0.0",
            "framework_version": "1.0.0",
            "is_compatible": True,
            "status": "COMPATIBLE",
            "details": {},
            "timestamp": "2023-01-01T00:00:00.000000"
        }
        
        verification2 = {
            "verification_id": f"{extension_id}:1.1.0:2023-01-01T00:00:00.000000",
            "extension_id": extension_id,
            "extension_version": "1.1.0",
            "framework_version": "1.0.0",
            "is_compatible": False,
            "status": "INCOMPATIBLE_FRAMEWORK",
            "details": {},
            "timestamp": "2023-01-01T00:00:00.000000"
        }
        
        verification3 = {
            "verification_id": "other.extension:1.0.0:2023-01-01T00:00:00.000000",
            "extension_id": "other.extension",
            "extension_version": "1.0.0",
            "framework_version": "1.0.0",
            "is_compatible": True,
            "status": "COMPATIBLE",
            "details": {},
            "timestamp": "2023-01-01T00:00:00.000000"
        }
        
        # Add the verifications to the history
        self.engine.verification_history[verification1["verification_id"]] = verification1
        self.engine.verification_history[verification2["verification_id"]] = verification2
        self.engine.verification_history[verification3["verification_id"]] = verification3
        
        # List the verifications by extension
        result = self.engine.list_verifications_by_extension(extension_id)
        
        # Check the result
        self.assertEqual(len(result), 2)
        self.assertEqual(result[verification1["verification_id"]], verification1)
        self.assertEqual(result[verification2["verification_id"]], verification2)
    
    def test_list_verifications_by_status(self):
        """Test listing verifications by status."""
        # Configure mocks
        status = "COMPATIBLE"
        
        verification1 = {
            "verification_id": "test.extension1:1.0.0:2023-01-01T00:00:00.000000",
            "extension_id": "test.extension1",
            "extension_version": "1.0.0",
            "framework_version": "1.0.0",
            "is_compatible": True,
            "status": status,
            "details": {},
            "timestamp": "2023-01-01T00:00:00.000000"
        }
        
        verification2 = {
            "verification_id": "test.extension2:1.0.0:2023-01-01T00:00:00.000000",
            "extension_id": "test.extension2",
            "extension_version": "1.0.0",
            "framework_version": "1.0.0",
            "is_compatible": True,
            "status": status,
            "details": {},
            "timestamp": "2023-01-01T00:00:00.000000"
        }
        
        verification3 = {
            "verification_id": "test.extension3:1.0.0:2023-01-01T00:00:00.000000",
            "extension_id": "test.extension3",
            "extension_version": "1.0.0",
            "framework_version": "1.0.0",
            "is_compatible": False,
            "status": "INCOMPATIBLE_FRAMEWORK",
            "details": {},
            "timestamp": "2023-01-01T00:00:00.000000"
        }
        
        # Add the verifications to the history
        self.engine.verification_history[verification1["verification_id"]] = verification1
        self.engine.verification_history[verification2["verification_id"]] = verification2
        self.engine.verification_history[verification3["verification_id"]] = verification3
        
        # List the verifications by status
        result = self.engine.list_verifications_by_status(status)
        
        # Check the result
        self.assertEqual(len(result), 2)
        self.assertEqual(result[verification1["verification_id"]], verification1)
        self.assertEqual(result[verification2["verification_id"]], verification2)
    
    def test_get_latest_verification(self):
        """Test getting the latest verification for an extension."""
        # Configure mocks
        extension_id = "test.extension"
        extension_version = "1.0.0"
        
        verification1 = {
            "verification_id": f"{extension_id}:{extension_version}:2023-01-01T00:00:00.000000",
            "extension_id": extension_id,
            "extension_version": extension_version,
            "framework_version": "1.0.0",
            "is_compatible": True,
            "status": "COMPATIBLE",
            "details": {},
            "timestamp": "2023-01-01T00:00:00.000000"
        }
        
        verification2 = {
            "verification_id": f"{extension_id}:{extension_version}:2023-01-02T00:00:00.000000",
            "extension_id": extension_id,
            "extension_version": extension_version,
            "framework_version": "1.0.0",
            "is_compatible": False,
            "status": "INCOMPATIBLE_FRAMEWORK",
            "details": {},
            "timestamp": "2023-01-02T00:00:00.000000"
        }
        
        # Add the verifications to the history
        self.engine.verification_history[verification1["verification_id"]] = verification1
        self.engine.verification_history[verification2["verification_id"]] = verification2
        
        # Get the latest verification
        result = self.engine.get_latest_verification(extension_id, extension_version)
        
        # Check the result
        self.assertEqual(result, verification2)

if __name__ == '__main__':
    unittest.main()
