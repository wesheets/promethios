"""
ExtensionRegistry module for the Promethios extension system.

This module provides the ExtensionRegistry class, which is responsible for
managing extensions and their lifecycle in the Promethios system.
"""

from typing import Dict, List, Any, Optional
import logging

# Set up logging
logger = logging.getLogger(__name__)

class ExtensionRegistry:
    """
    Registry for managing extensions in the Promethios system.
    
    The ExtensionRegistry is responsible for:
    - Registering and deregistering extensions
    - Enabling and disabling extensions
    - Tracking extension metadata and state
    - Coordinating with ModuleRegistry and FeatureToggleService
    """
    
    def __init__(self):
        """Initialize the ExtensionRegistry."""
        self._extensions: Dict[str, Any] = {}
        self._enabled_extensions: Dict[str, bool] = {}
        logger.info("ExtensionRegistry initialized")
    
    def register(self, extension: Any) -> bool:
        """
        Register an extension with the registry.
        
        Args:
            extension: The extension to register. Must have an 'id' attribute.
            
        Returns:
            bool: True if registration was successful, False otherwise.
        """
        if not hasattr(extension, 'id'):
            logger.error("Extension must have an 'id' attribute")
            return False
        
        extension_id = extension.id
        
        if extension_id in self._extensions:
            logger.warning(f"Extension '{extension_id}' is already registered")
            return False
        
        self._extensions[extension_id] = extension
        self._enabled_extensions[extension_id] = False
        
        logger.info(f"Extension '{extension_id}' registered successfully")
        return True
    
    def deregister(self, extension_id: str) -> bool:
        """
        Deregister an extension from the registry.
        
        Args:
            extension_id: The ID of the extension to deregister.
            
        Returns:
            bool: True if deregistration was successful, False otherwise.
        """
        if extension_id not in self._extensions:
            logger.warning(f"Extension '{extension_id}' is not registered")
            return False
        
        # Disable the extension if it's enabled
        if self._enabled_extensions.get(extension_id, False):
            logger.info(f"Disabling extension '{extension_id}' before deregistration")
            # Note: We don't pass module_registry or feature_toggle_service here
            # because we're just cleaning up internal state
            self._enabled_extensions[extension_id] = False
        
        # Remove the extension
        del self._extensions[extension_id]
        del self._enabled_extensions[extension_id]
        
        logger.info(f"Extension '{extension_id}' deregistered successfully")
        return True
    
    def get_extension(self, extension_id: str) -> Optional[Any]:
        """
        Get an extension by ID.
        
        Args:
            extension_id: The ID of the extension to retrieve.
            
        Returns:
            The extension object, or None if not found.
        """
        return self._extensions.get(extension_id)
    
    def get_all_extensions(self) -> List[str]:
        """
        Get a list of all registered extension IDs.
        
        Returns:
            List[str]: A list of extension IDs.
        """
        return list(self._extensions.keys())
    
    def is_extension_enabled(self, extension_id: str) -> bool:
        """
        Check if an extension is enabled.
        
        Args:
            extension_id: The ID of the extension to check.
            
        Returns:
            bool: True if the extension is enabled, False otherwise.
        """
        if extension_id not in self._extensions:
            logger.warning(f"Extension '{extension_id}' is not registered")
            return False
        
        return self._enabled_extensions.get(extension_id, False)
    
    def enable_extension(self, extension_id: str, module_registry: Any, feature_toggle_service: Any) -> bool:
        """
        Enable an extension and its associated modules and features.
        
        Args:
            extension_id: The ID of the extension to enable.
            module_registry: The ModuleRegistry instance to use for module loading.
            feature_toggle_service: The FeatureToggleService instance to use for feature toggling.
            
        Returns:
            bool: True if the extension was enabled successfully, False otherwise.
        """
        if extension_id not in self._extensions:
            logger.warning(f"Extension '{extension_id}' is not registered")
            return False
        
        if self._enabled_extensions.get(extension_id, False):
            logger.info(f"Extension '{extension_id}' is already enabled")
            return True
        
        extension = self._extensions[extension_id]
        
        # Enable modules
        if hasattr(extension, 'modules') and extension.modules:
            for module_id in extension.modules:
                if not module_registry.load_module(module_id):
                    logger.error(f"Failed to load module '{module_id}' for extension '{extension_id}'")
                    return False
        
        # Enable features
        if hasattr(extension, 'features') and extension.features:
            for feature_id in extension.features:
                feature_toggle_service.enable_feature(feature_id)
        
        # Mark extension as enabled
        self._enabled_extensions[extension_id] = True
        
        logger.info(f"Extension '{extension_id}' enabled successfully")
        return True
    
    def disable_extension(self, extension_id: str, module_registry: Any, feature_toggle_service: Any) -> bool:
        """
        Disable an extension and its associated modules and features.
        
        Args:
            extension_id: The ID of the extension to disable.
            module_registry: The ModuleRegistry instance to use for module unloading.
            feature_toggle_service: The FeatureToggleService instance to use for feature toggling.
            
        Returns:
            bool: True if the extension was disabled successfully, False otherwise.
        """
        if extension_id not in self._extensions:
            logger.warning(f"Extension '{extension_id}' is not registered")
            return False
        
        if not self._enabled_extensions.get(extension_id, False):
            logger.info(f"Extension '{extension_id}' is already disabled")
            return True
        
        extension = self._extensions[extension_id]
        
        # Disable features
        if hasattr(extension, 'features') and extension.features:
            for feature_id in extension.features:
                feature_toggle_service.disable_feature(feature_id)
        
        # Disable modules
        if hasattr(extension, 'modules') and extension.modules:
            for module_id in extension.modules:
                if not module_registry.unload_module(module_id):
                    logger.error(f"Failed to unload module '{module_id}' for extension '{extension_id}'")
                    return False
        
        # Mark extension as disabled
        self._enabled_extensions[extension_id] = False
        
        logger.info(f"Extension '{extension_id}' disabled successfully")
        return True
