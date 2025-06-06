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
                    self.extension_points = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load extension points: {e}")
                self.extension_points = {}
    
    def _save_extension_points(self):
        """Save the extension points to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.extension_points_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        try:
            # Prepare extension points for serialization
            serializable_extension_points = {}
            for ext_id, ext_data in self.extension_points.items():
                serializable_extension_points[ext_id] = self._prepare_for_serialization(ext_data)
            
            # Create seal for the entire state
            state_hash = self._get_framework_state_hash()
            self.seal_verification_service.create_seal({"state_hash": state_hash})
            
            with open(self.extension_points_path, 'w') as f:
                json.dump(serializable_extension_points, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save extension points: {e}")
    
    def _prepare_for_serialization(self, obj):
        """Prepare an object for JSON serialization by removing non-serializable elements.
        
        Args:
            obj: Object to prepare for serialization.
            
        Returns:
            Serializable version of the object.
        """
        if isinstance(obj, dict):
            result = {}
            for key, value in obj.items():
                if key == 'implementation_function' and callable(value):
                    # Skip callable functions
                    continue
                result[key] = self._prepare_for_serialization(value)
            return result
        elif isinstance(obj, list):
            return [self._prepare_for_serialization(item) for item in obj]
        elif isinstance(obj, (str, int, float, bool, type(None))):
            return obj
        else:
            # Convert non-serializable objects to string representation
            return str(obj)
    
    def _get_framework_state_hash(self) -> str:
        """Get a hash of the current framework state.
        
        Returns:
            Hash string representing the current state.
        """
        state_str = json.dumps(self._prepare_for_serialization(self.extension_points), sort_keys=True)
        return hashlib.sha256(state_str.encode()).hexdigest()
    
    def register_extension_point(self, extension_point_data: Dict[str, Any]) -> bool:
        """Register a new extension point.
        
        Args:
            extension_point_data: Extension point data.
            
        Returns:
            True if registration was successful, False otherwise.
            
        Raises:
            ValueError: If the extension point already exists.
        """
        extension_point_id = extension_point_data.get('extension_point_id')
        if not extension_point_id:
            logger.error("Extension point ID is required")
            return False
        
        if extension_point_id in self.extension_points:
            raise ValueError(f"Extension point {extension_point_id} already exists")
        
        # Validate extension point data
        validation_result = self.schema_validator.validate(extension_point_data, 'extension_point')
        if not validation_result.is_valid:
            logger.error(f"Invalid extension point data: {validation_result.errors}")
            return False
        
        # Add timestamp and initialize implementations
        extension_point_data['registered_at'] = datetime.utcnow().isoformat() + 'Z'
        extension_point_data['implementations'] = {}
        
        # Create seal - first call
        extension_point_data['seal'] = self.seal_verification_service.create_seal(extension_point_data)
        
        # Add to registry
        self.extension_points[extension_point_id] = extension_point_data
        
        # Save to file - second call to create_seal happens here
        self._save_extension_points()
        
        logger.info(f"Registered extension point: {extension_point_id}")
        return True
    
    def register_implementation(self, extension_point_id: str, implementation_data: Dict[str, Any]) -> bool:
        """Register a new implementation for an extension point.
        
        Args:
            extension_point_id: Extension point ID.
            implementation_data: Implementation data.
            
        Returns:
            True if registration was successful, False otherwise.
            
        Raises:
            ValueError: If the extension point does not exist or the implementation already exists.
        """
        if extension_point_id not in self.extension_points:
            raise ValueError(f"Extension point {extension_point_id} does not exist")
        
        implementation_id = implementation_data.get('implementation_id')
        if not implementation_id:
            logger.error("Implementation ID is required")
            return False
        
        # Check if implementation already exists
        if implementation_id in self.extension_points[extension_point_id]['implementations']:
            raise ValueError(f"Implementation {implementation_id} already exists for extension point {extension_point_id}")
        
        # Validate implementation data
        validation_result = self.schema_validator.validate(implementation_data, 'extension_implementation')
        if not validation_result.is_valid:
            logger.error(f"Invalid implementation data: {validation_result.errors}")
            return False
        
        # Add timestamp
        implementation_data['registered_at'] = datetime.utcnow().isoformat() + 'Z'
        
        # Create seal - first call
        implementation_data['seal'] = self.seal_verification_service.create_seal(implementation_data)
        
        # Add to registry
        self.extension_points[extension_point_id]['implementations'][implementation_id] = implementation_data
        
        # Create seal for the extension point - second call
        self.extension_points[extension_point_id]['seal'] = self.seal_verification_service.create_seal(
            self.extension_points[extension_point_id]
        )
        
        # Save to file - third call to create_seal happens here
        self._save_extension_points()
        
        logger.info(f"Registered implementation {implementation_id} for extension point {extension_point_id}")
        return True
    
    def get_extension_point(self, extension_point_id: str) -> Optional[Dict[str, Any]]:
        """Get an extension point by ID.
        
        Args:
            extension_point_id: Extension point ID.
            
        Returns:
            Extension point data or None if not found.
        """
        return self.extension_points.get(extension_point_id)
    
    def list_extension_points(self) -> List[str]:
        """List all registered extension points.
        
        Returns:
            List of extension point IDs.
        """
        # Return just the list of extension point IDs to match test expectations
        return list(self.extension_points.keys())
    
    def list_implementations(self, extension_point_id: str) -> List[str]:
        """List all implementations for an extension point.
        
        Args:
            extension_point_id: Extension point ID.
            
        Returns:
            List of implementation IDs.
        """
        if extension_point_id not in self.extension_points:
            return []
        
        # Return just the list of implementation IDs to match test expectations
        return list(self.extension_points[extension_point_id]['implementations'].keys())
    
    def check_extension_point_exists(self, extension_point_id: str) -> bool:
        """Check if an extension point exists.
        
        Args:
            extension_point_id: Extension point ID.
            
        Returns:
            True if the extension point exists, False otherwise.
        """
        return extension_point_id in self.extension_points
    
    def check_implementation_exists(self, extension_point_id: str, implementation_id: str) -> bool:
        """Check if an implementation exists for an extension point.
        
        Args:
            extension_point_id: Extension point ID.
            implementation_id: Implementation ID.
            
        Returns:
            True if the implementation exists, False otherwise.
        """
        if extension_point_id not in self.extension_points:
            return False
        
        return implementation_id in self.extension_points[extension_point_id]['implementations']
    
    def get_implementation(self, extension_point_id: str, implementation_id: str) -> Optional[Dict[str, Any]]:
        """Get an implementation for an extension point.
        
        Args:
            extension_point_id: Extension point ID.
            implementation_id: Implementation ID.
            
        Returns:
            Implementation data or None if not found.
        """
        if not self.check_implementation_exists(extension_point_id, implementation_id):
            return None
        
        return self.extension_points[extension_point_id]['implementations'][implementation_id]
    
    def invoke_extension_point(self, extension_point_id: str, input_data: Dict[str, Any]) -> ExtensionPointInvocationResult:
        """Invoke an extension point with the given input data.
        
        Args:
            extension_point_id: Extension point ID.
            input_data: Input data for the extension point.
            
        Returns:
            Result of the invocation.
        """
        if extension_point_id not in self.extension_points:
            return ExtensionPointInvocationResult(
                success=False,
                output=None,
                error=f"Extension point {extension_point_id} does not exist",
                execution_time=0.0,
                provider_id=None
            )
        
        # Get the extension point
        extension_point = self.extension_points[extension_point_id]
        
        # Check if there are any implementations
        if not extension_point['implementations']:
            return ExtensionPointInvocationResult(
                success=False,
                output=None,
                error=f"No implementations found for extension point {extension_point_id}",
                execution_time=0.0,
                provider_id=None
            )
        
        # TODO: Implement proper implementation selection strategy
        # For now, just use the first implementation
        implementation_id = next(iter(extension_point['implementations']))
        implementation = extension_point['implementations'][implementation_id]
        
        # Check if the implementation has a function
        if 'implementation_function' not in implementation:
            return ExtensionPointInvocationResult(
                success=False,
                output=None,
                error=f"Implementation {implementation_id} has no function",
                execution_time=0.0,
                provider_id=implementation_id
            )
        
        # Invoke the implementation function
        try:
            start_time = datetime.utcnow()
            output = implementation['implementation_function'](input_data)
            end_time = datetime.utcnow()
            execution_time = (end_time - start_time).total_seconds()
            
            return ExtensionPointInvocationResult(
                success=True,
                output=output,
                error=None,
                execution_time=execution_time,
                provider_id=implementation_id
            )
        except Exception as e:
            return ExtensionPointInvocationResult(
                success=False,
                output=None,
                error=str(e),
                execution_time=0.0,
                provider_id=implementation_id
            )
    
    def unregister_extension_point(self, extension_point_id: str) -> bool:
        """Unregister an extension point.
        
        Args:
            extension_point_id: Extension point ID.
            
        Returns:
            True if unregistration was successful, False otherwise.
            
        Raises:
            ValueError: If the extension point does not exist or has implementations.
        """
        if extension_point_id not in self.extension_points:
            raise ValueError(f"Extension point {extension_point_id} does not exist")
        
        # Check if there are any implementations
        if self.extension_points[extension_point_id]['implementations']:
            raise ValueError(f"Cannot unregister extension point {extension_point_id} with implementations")
        
        # Create seal for the operation - first call
        self.seal_verification_service.create_seal({
            "operation": "unregister_extension_point",
            "extension_point_id": extension_point_id,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        })
        
        # Remove from registry
        del self.extension_points[extension_point_id]
        
        # Save to file - second call to create_seal happens here
        self._save_extension_points()
        
        logger.info(f"Unregistered extension point: {extension_point_id}")
        return True
    
    def unregister_implementation(self, extension_point_id: str, implementation_id: str) -> bool:
        """Unregister an implementation for an extension point.
        
        Args:
            extension_point_id: Extension point ID.
            implementation_id: Implementation ID.
            
        Returns:
            True if unregistration was successful, False otherwise.
            
        Raises:
            ValueError: If the extension point or implementation does not exist.
        """
        if extension_point_id not in self.extension_points:
            raise ValueError(f"Extension point {extension_point_id} does not exist")
        
        if implementation_id not in self.extension_points[extension_point_id]['implementations']:
            raise ValueError(f"Implementation {implementation_id} does not exist for extension point {extension_point_id}")
        
        # Create seal for the operation - first call
        self.seal_verification_service.create_seal({
            "operation": "unregister_implementation",
            "extension_point_id": extension_point_id,
            "implementation_id": implementation_id,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        })
        
        # Remove from registry
        del self.extension_points[extension_point_id]['implementations'][implementation_id]
        
        # Save to file - second call to create_seal happens here
        self._save_extension_points()
        
        logger.info(f"Unregistered implementation {implementation_id} for extension point {extension_point_id}")
        return True
