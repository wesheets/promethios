"""
Extension Point Framework for the Governance Expansion Protocol.

This module provides the core framework for defining and managing extension points
within the Promethios system. It enables modules to define extension points and
register implementations for those extension points.
"""

import os
import json
import hashlib
import logging
import inspect
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable, NamedTuple

# Configure logging
logger = logging.getLogger(__name__)

class ExtensionPointInvocationResult(NamedTuple):
    """Result of an extension point invocation."""
    success: bool
    output: Any
    error: Optional[str] = None
    execution_time: float = 0.0
    provider_id: Optional[str] = None

class ExtensionPointFramework:
    """Framework for managing extension points and their implementations."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        extension_points_path: str
    ):
        """Initialize the extension point framework.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            extension_points_path: Path to the extension points JSON file.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.extension_points_path = extension_points_path
        self.extension_points = {}
        
        # Load existing extension points if available
        self._load_extension_points()
    
    def _load_extension_points(self):
        """Load the extension points from the JSON file."""
        if os.path.exists(self.extension_points_path):
            try:
                with open(self.extension_points_path, 'r') as f:
                    data = json.load(f)
                
                # Verify the seal
                if not self.seal_verification_service.verify_seal(data):
                    logger.error("Extension points file seal verification failed")
                    raise ValueError("Extension points file seal verification failed")
                
                # Load extension points
                self.extension_points = data.get("extension_points", {})
                
                logger.info(f"Loaded {len(self.extension_points)} extension points")
            except Exception as e:
                logger.error(f"Error loading extension points: {str(e)}")
                self.extension_points = {}
    
    def _save_extension_points(self):
        """Save the extension points to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.extension_points_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        # Prepare data for serialization
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_extension_points",
            "extension_points": self._prepare_for_serialization(self.extension_points)
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.extension_points_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.extension_points)} extension points")
    
    def _prepare_for_serialization(self, obj):
        """Prepare an object for JSON serialization by removing non-serializable elements.
        
        Args:
            obj: The object to prepare for serialization.
            
        Returns:
            A serializable version of the object.
        """
        if isinstance(obj, dict):
            result = {}
            for key, value in obj.items():
                # Skip callable objects (functions, methods, etc.)
                if callable(value):
                    continue
                # Skip keys that start with underscore (private attributes)
                if isinstance(key, str) and key.startswith('_'):
                    continue
                # Process other values recursively
                try:
                    json.dumps(value)  # Test if value is JSON serializable
                    result[key] = value
                except (TypeError, OverflowError):
                    # If value is not serializable, try to prepare it
                    if isinstance(value, (dict, list)):
                        result[key] = self._prepare_for_serialization(value)
                    else:
                        # For non-serializable objects, store their string representation
                        result[key] = str(value)
            return result
        elif isinstance(obj, list):
            result = []
            for item in obj:
                try:
                    json.dumps(item)  # Test if item is JSON serializable
                    result.append(item)
                except (TypeError, OverflowError):
                    # If item is not serializable, try to prepare it
                    if isinstance(item, (dict, list)):
                        result.append(self._prepare_for_serialization(item))
                    else:
                        # For non-serializable objects, store their string representation
                        result.append(str(item))
            return result
        else:
            # For other types, return as is (will be handled by the caller)
            return obj
    
    def _get_framework_state_hash(self) -> str:
        """Get a hash of the current framework state.
        
        Returns:
            Hash of the current framework state.
        """
        # Create a string representation of the framework state
        # Use _prepare_for_serialization to handle non-serializable objects
        serializable_state = self._prepare_for_serialization(self.extension_points)
        state_str = json.dumps(serializable_state, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def register_extension_point(self, extension_point_data: Dict[str, Any]) -> bool:
        """Register a new extension point.
        
        Args:
            extension_point_data: Data for the extension point to register.
                Must include extension_point_id, name, description, input_schema,
                output_schema, owner_module_id, and optional metadata.
                
        Returns:
            True if the extension point was registered successfully.
            
        Raises:
            ValueError: If the extension point already exists or validation fails.
        """
        # Pre-loop tether check
        framework_state_hash = self._get_framework_state_hash()
        tether_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "register_extension_point",
            "framework_state_hash": framework_state_hash,
        }
        tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
        
        # Verify the tether
        if not self.seal_verification_service.verify_seal(tether_data):
            logger.error("Pre-loop tether verification failed")
            raise ValueError("Pre-loop tether verification failed")
        
        # Validate the extension point data
        validation_result = self.schema_validator.validate(extension_point_data, "extension_point.schema.v1.json")
        if not validation_result.is_valid:
            logger.error(f"Extension point validation failed: {validation_result.errors}")
            raise ValueError(f"Extension point validation failed: {validation_result.errors}")
        
        # Check if the extension point already exists
        extension_point_id = extension_point_data["extension_point_id"]
        if extension_point_id in self.extension_points:
            logger.error(f"Extension point {extension_point_id} already exists")
            raise ValueError(f"Extension point {extension_point_id} already exists")
        
        # Prepare the extension point data
        extension_point = {
            "extension_point_id": extension_point_id,
            "name": extension_point_data["name"],
            "description": extension_point_data["description"],
            "input_schema": extension_point_data["input_schema"],
            "output_schema": extension_point_data["output_schema"],
            "owner_module_id": extension_point_data["owner_module_id"],
            "metadata": extension_point_data.get("metadata", {}),
            "registration_timestamp": datetime.utcnow().isoformat(),
            "implementations": {}
        }
        
        # Add the extension point to the framework
        self.extension_points[extension_point_id] = extension_point
        
        # Save the updated extension points
        self._save_extension_points()
        
        logger.info(f"Registered extension point {extension_point_id}")
        return True
    
    def register_implementation(self, extension_point_id: str, implementation_data: Dict[str, Any]) -> bool:
        """Register a new implementation for an extension point.
        
        Args:
            extension_point_id: ID of the extension point to implement.
            implementation_data: Data for the implementation to register.
                Must include implementation_id, name, description, provider_module_id,
                priority, and optional configuration.
                
        Returns:
            True if the implementation was registered successfully.
            
        Raises:
            ValueError: If the extension point doesn't exist, the implementation already exists, or validation fails.
        """
        # Pre-loop tether check
        framework_state_hash = self._get_framework_state_hash()
        tether_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "register_implementation",
            "framework_state_hash": framework_state_hash,
        }
        tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
        
        # Verify the tether
        if not self.seal_verification_service.verify_seal(tether_data):
            logger.error("Pre-loop tether verification failed")
            raise ValueError("Pre-loop tether verification failed")
        
        # Check if the extension point exists
        if extension_point_id not in self.extension_points:
            logger.error(f"Extension point {extension_point_id} does not exist")
            raise ValueError(f"Extension point {extension_point_id} does not exist")
        
        # Validate the implementation data
        validation_result = self.schema_validator.validate(implementation_data, "extension_point.schema.v1.json")
        if not validation_result.is_valid:
            logger.error(f"Implementation validation failed: {validation_result.errors}")
            raise ValueError(f"Implementation validation failed: {validation_result.errors}")
        
        # Check if the implementation already exists
        implementation_id = implementation_data["implementation_id"]
        if implementation_id in self.extension_points[extension_point_id]["implementations"]:
            logger.error(f"Implementation {implementation_id} already exists for extension point {extension_point_id}")
            raise ValueError(f"Implementation {implementation_id} already exists for extension point {extension_point_id}")
        
        # Prepare the implementation data
        implementation = {
            "implementation_id": implementation_id,
            "name": implementation_data["name"],
            "description": implementation_data["description"],
            "provider_module_id": implementation_data["provider_module_id"],
            "priority": implementation_data["priority"],
            "configuration": implementation_data.get("configuration", {}),
            "registration_timestamp": datetime.utcnow().isoformat(),
            "implementation_function": None  # Will be set by the implementation provider
        }
        
        # Add the implementation to the extension point
        self.extension_points[extension_point_id]["implementations"][implementation_id] = implementation
        
        # Save the updated extension points
        self._save_extension_points()
        
        logger.info(f"Registered implementation {implementation_id} for extension point {extension_point_id}")
        return True
    
    def check_extension_point_exists(self, extension_point_id: str) -> bool:
        """Check if an extension point exists.
        
        Args:
            extension_point_id: ID of the extension point to check.
            
        Returns:
            True if the extension point exists, False otherwise.
        """
        return extension_point_id in self.extension_points
    
    def check_implementation_exists(self, extension_point_id: str, implementation_id: str) -> bool:
        """Check if an implementation exists for an extension point.
        
        Args:
            extension_point_id: ID of the extension point to check.
            implementation_id: ID of the implementation to check.
            
        Returns:
            True if the implementation exists, False otherwise.
        """
        if not self.check_extension_point_exists(extension_point_id):
            return False
        
        return implementation_id in self.extension_points[extension_point_id]["implementations"]
    
    def get_implementation(self, extension_point_id: str, implementation_id: str) -> Optional[Dict[str, Any]]:
        """Get an implementation for an extension point.
        
        Args:
            extension_point_id: ID of the extension point.
            implementation_id: ID of the implementation.
            
        Returns:
            The implementation data, or None if not found.
        """
        if not self.check_implementation_exists(extension_point_id, implementation_id):
            return None
        
        return self.extension_points[extension_point_id]["implementations"][implementation_id]
    
    def invoke_extension_point(self, extension_point_id: str, input_data: Dict[str, Any]) -> ExtensionPointInvocationResult:
        """Invoke an extension point with the given input data.
        
        Args:
            extension_point_id: ID of the extension point to invoke.
            input_data: Input data for the extension point.
            
        Returns:
            Result of the invocation.
        """
        # Check if the extension point exists
        if not self.check_extension_point_exists(extension_point_id):
            return ExtensionPointInvocationResult(
                success=False,
                output=None,
                error=f"Extension point {extension_point_id} does not exist",
                execution_time=0.0,
                provider_id=None
            )
        
        # Get the extension point
        extension_point = self.extension_points[extension_point_id]
        
        # Validate the input data against the input schema
        input_schema = extension_point["input_schema"]
        validation_result = self.schema_validator.validate(input_data, input_schema)
        if not validation_result.is_valid:
            return ExtensionPointInvocationResult(
                success=False,
                output=None,
                error=f"Input validation failed: {validation_result.errors}",
                execution_time=0.0,
                provider_id=None
            )
        
        # Get the implementations for the extension point
        implementations = extension_point["implementations"]
        if not implementations:
            return ExtensionPointInvocationResult(
                success=False,
                output=None,
                error=f"No implementations found for extension point {extension_point_id}",
                execution_time=0.0,
                provider_id=None
            )
        
        # Sort implementations by priority (highest first)
        sorted_implementations = sorted(
            implementations.values(),
            key=lambda impl: impl["priority"],
            reverse=True
        )
        
        # Get the highest priority implementation
        implementation = sorted_implementations[0]
        implementation_function = implementation.get("implementation_function")
        
        # Check if the implementation function is set
        if implementation_function is None:
            return ExtensionPointInvocationResult(
                success=False,
                output=None,
                error=f"Implementation function not set for {implementation['implementation_id']}",
                execution_time=0.0,
                provider_id=implementation["provider_module_id"]
            )
        
        # Invoke the implementation function
        start_time = datetime.utcnow()
        try:
            output = implementation_function(input_data)
            end_time = datetime.utcnow()
            execution_time = (end_time - start_time).total_seconds()
            
            # Validate the output against the output schema
            output_schema = extension_point["output_schema"]
            validation_result = self.schema_validator.validate(output, output_schema)
            if not validation_result.is_valid:
                return ExtensionPointInvocationResult(
                    success=False,
                    output=None,
                    error=f"Output validation failed: {validation_result.errors}",
                    execution_time=execution_time,
                    provider_id=implementation["provider_module_id"]
                )
            
            return ExtensionPointInvocationResult(
                success=True,
                output=output,
                error=None,
                execution_time=execution_time,
                provider_id=implementation["provider_module_id"]
            )
        except Exception as e:
            end_time = datetime.utcnow()
            execution_time = (end_time - start_time).total_seconds()
            return ExtensionPointInvocationResult(
                success=False,
                output=None,
                error=str(e),
                execution_time=execution_time,
                provider_id=implementation["provider_module_id"]
            )
    
    def unregister_extension_point(self, extension_point_id: str) -> bool:
        """Unregister an extension point.
        
        Args:
            extension_point_id: ID of the extension point to unregister.
            
        Returns:
            True if the extension point was unregistered successfully.
            
        Raises:
            ValueError: If the extension point doesn't exist.
        """
        # Pre-loop tether check
        framework_state_hash = self._get_framework_state_hash()
        tether_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "unregister_extension_point",
            "framework_state_hash": framework_state_hash,
        }
        tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
        
        # Verify the tether
        if not self.seal_verification_service.verify_seal(tether_data):
            logger.error("Pre-loop tether verification failed")
            raise ValueError("Pre-loop tether verification failed")
        
        # Check if the extension point exists
        if not self.check_extension_point_exists(extension_point_id):
            logger.error(f"Extension point {extension_point_id} does not exist")
            raise ValueError(f"Extension point {extension_point_id} does not exist")
        
        # Remove the extension point
        del self.extension_points[extension_point_id]
        
        # Save the updated extension points
        self._save_extension_points()
        
        logger.info(f"Unregistered extension point {extension_point_id}")
        return True
    
    def unregister_implementation(self, extension_point_id: str, implementation_id: str) -> bool:
        """Unregister an implementation for an extension point.
        
        Args:
            extension_point_id: ID of the extension point.
            implementation_id: ID of the implementation to unregister.
            
        Returns:
            True if the implementation was unregistered successfully.
            
        Raises:
            ValueError: If the extension point or implementation doesn't exist.
        """
        # Pre-loop tether check
        framework_state_hash = self._get_framework_state_hash()
        tether_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "unregister_implementation",
            "framework_state_hash": framework_state_hash,
        }
        tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
        
        # Verify the tether
        if not self.seal_verification_service.verify_seal(tether_data):
            logger.error("Pre-loop tether verification failed")
            raise ValueError("Pre-loop tether verification failed")
        
        # Check if the extension point exists
        if not self.check_extension_point_exists(extension_point_id):
            logger.error(f"Extension point {extension_point_id} does not exist")
            raise ValueError(f"Extension point {extension_point_id} does not exist")
        
        # Check if the implementation exists
        if not self.check_implementation_exists(extension_point_id, implementation_id):
            logger.error(f"Implementation {implementation_id} does not exist for extension point {extension_point_id}")
            raise ValueError(f"Implementation {implementation_id} does not exist for extension point {extension_point_id}")
        
        # Remove the implementation
        del self.extension_points[extension_point_id]["implementations"][implementation_id]
        
        # Save the updated extension points
        self._save_extension_points()
        
        logger.info(f"Unregistered implementation {implementation_id} for extension point {extension_point_id}")
        return True
