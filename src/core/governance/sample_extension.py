"""
Sample Governance Extension for the Governance Expansion Protocol.

This module provides a sample extension that demonstrates how to create and register
a governance extension using the Extension Point Framework.
"""

import logging
from typing import Dict, Any, Optional, List, Union

from src.core.governance.extension_point_framework import ExtensionPointFramework

logger = logging.getLogger(__name__)

class SampleExtensionImplementation:
    """
    Sample implementation of a governance extension.
    
    This class demonstrates how to implement a governance extension that can be
    registered with the Extension Point Framework.
    """
    
    def __init__(self):
        """Initialize the sample extension implementation."""
        self.threshold = 0.5
        self.max_attempts = 3
        self.configured = False
    
    def configure(self, config: Dict[str, Any]) -> None:
        """
        Configure the implementation.
        
        Args:
            config: Configuration parameters.
        """
        if "threshold" in config:
            self.threshold = config["threshold"]
        
        if "max_attempts" in config:
            self.max_attempts = config["max_attempts"]
        
        self.configured = True
    
    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the implementation.
        
        Args:
            input_data: Input data for execution.
        
        Returns:
            Dict[str, Any]: Execution result.
        """
        # Extract context for response
        context = input_data.get("context", "unknown")
        
        # Check for required input
        if "value" not in input_data:
            return {
                "success": False,
                "message": "Missing required input: value",
                "context": context
            }
        
        # Get the value
        value = input_data["value"]
        
        # Validate the value type
        if not isinstance(value, (int, float)):
            return {
                "success": False,
                "message": "Invalid input type: value must be a number",
                "context": context
            }
        
        # Compare with threshold
        if value >= self.threshold:
            return {
                "success": True,
                "message": f"Value {value} is above threshold {self.threshold}",
                "context": context
            }
        else:
            return {
                "success": False,
                "message": f"Value {value} is below threshold {self.threshold}",
                "context": context
            }


class SampleExtension:
    """
    Sample Governance Extension.
    
    This class demonstrates how to create and register a governance extension
    using the Extension Point Framework.
    """
    
    def __init__(self, extension_point_framework: ExtensionPointFramework):
        """
        Initialize the sample extension.
        
        Args:
            extension_point_framework: The extension point framework.
        """
        self.extension_point_framework = extension_point_framework
        self.extension_point_id = "governance.sample.threshold"
        self.implementation_id = "governance.sample.threshold.default"
        self.implementation = SampleExtensionImplementation()
    
    def register(self) -> bool:
        """
        Register the extension with the Extension Point Framework.
        
        Returns:
            bool: True if registration was successful, False otherwise.
        """
        # Create extension point data dictionary matching the expected format
        extension_point_data = {
            "extension_point_id": self.extension_point_id,
            "name": "Sample Threshold Extension Point",
            "description": "A sample extension point for threshold-based governance decisions",
            "input_schema": {
                "type": "object",
                "properties": {
                    "value": {"type": "number"},
                    "context": {"type": "string"}
                },
                "required": ["value"]
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "context": {"type": "string"}
                }
            },
            "owner_module_id": "governance.sample",
            "metadata": {
                "category": "governance",
                "tags": ["sample", "threshold"]
            }
        }
        
        # Register the extension point
        extension_point_result = self.extension_point_framework.register_extension_point(extension_point_data)
        
        # If extension point registration failed, return False
        if not extension_point_result:
            logger.error(f"Failed to register extension point: {self.extension_point_id}")
            return False
        
        # Create implementation data dictionary
        implementation_data = {
            "implementation_id": self.implementation_id,
            "name": "Default Threshold Implementation",
            "description": "Default implementation for the sample threshold extension point",
            "provider_module_id": "governance.sample.threshold",
            "priority": 10,
            "configuration": {
                "threshold": 0.5,
                "max_attempts": 3
            }
        }
        
        # Register the implementation
        implementation_result = self.extension_point_framework.register_implementation(
            self.extension_point_id, implementation_data
        )
        
        # If implementation registration failed, return False
        if not implementation_result:
            logger.error(f"Failed to register implementation: {self.implementation_id}")
            return False
        
        logger.info(f"Successfully registered sample extension: {self.extension_point_id}")
        return True
    
    def unregister(self) -> bool:
        """
        Unregister the extension from the Extension Point Framework.
        
        Returns:
            bool: True if unregistration was successful, False otherwise.
        """
        # Delete the implementation
        result = self.extension_point_framework.unregister_implementation(
            self.extension_point_id, self.implementation_id
        )
        
        if not result:
            logger.error(f"Failed to delete implementation: {self.implementation_id}")
            return False
        
        # Delete the extension point
        result = self.extension_point_framework.unregister_extension_point(self.extension_point_id)
        
        if not result:
            logger.error(f"Failed to delete extension point: {self.extension_point_id}")
            return False
        
        logger.info(f"Successfully unregistered sample extension: {self.extension_point_id}")
        return True
