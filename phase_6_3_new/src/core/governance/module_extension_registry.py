"""
Module Extension Registry for the Governance Expansion Protocol.

This module provides the core registry for managing governance module extensions
within the Promethios system. It enables modules to register themselves and their
extensions, creating a flexible and extensible governance architecture.
"""

import os
import json
import hashlib
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, NamedTuple

# Configure logging
logger = logging.getLogger(__name__)

class ModuleExtensionRegistry:
    """Registry for managing governance module extensions."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        registry_path: str
    ):
        """Initialize the module extension registry.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            registry_path: Path to the registry JSON file.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.registry_path = registry_path
        self.extensions = {}
        
        # Load existing registry if available
        self._load_registry()
    
    def _load_registry(self):
        """Load the registry from the JSON file."""
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r') as f:
                    data = json.load(f)
                
                # Verify the seal
                if not self.seal_verification_service.verify_seal(data):
                    logger.error("Registry file seal verification failed")
                    raise ValueError("Registry file seal verification failed")
                
                # Load extensions
                self.extensions = data.get("extensions", {})
                
                logger.info(f"Loaded {len(self.extensions)} extensions")
            except Exception as e:
                logger.error(f"Error loading registry: {str(e)}")
                self.extensions = {}
    
    def _save_registry(self):
        """Save the registry to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.registry_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        # Prepare data for serialization
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_registry",
            "extensions": self.extensions
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.extensions)} extensions")
    
    def _get_registry_state_hash(self) -> str:
        """Get a hash of the current registry state.
        
        Returns:
            Hash of the current registry state.
        """
        # Create a string representation of the registry state
        state_str = json.dumps(self.extensions, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def register_extension(self, extension_data: Dict[str, Any]) -> bool:
        """Register a new extension.
        
        Args:
            extension_data: Data for the extension to register.
                Must include extension_id, name, description, version, author,
                dependencies, extension_points, and compatibility information.
                
        Returns:
            True if the extension was registered successfully.
            
        Raises:
            ValueError: If the extension already exists or validation fails.
        """
        # Pre-loop tether check
        registry_state_hash = self._get_registry_state_hash()
        tether_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "register_extension",
            "registry_state_hash": registry_state_hash,
        }
        tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
        
        # Verify the tether
        if not self.seal_verification_service.verify_seal(tether_data):
            logger.error("Pre-loop tether verification failed")
            raise ValueError("Pre-loop tether verification failed")
        
        # Validate the extension data
        validation_result = self.schema_validator.validate(extension_data, "module_extension.schema.v1.json")
        if not validation_result.is_valid:
            logger.error(f"Extension validation failed: {validation_result.errors}")
            raise ValueError(f"Extension validation failed: {validation_result.errors}")
        
        # Check if the extension already exists
        extension_id = extension_data["extension_id"]
        if extension_id in self.extensions:
            logger.error(f"Extension {extension_id} already exists")
            raise ValueError(f"Extension {extension_id} already exists")
        
        # Prepare the extension data
        extension = {
            "extension_id": extension_id,
            "name": extension_data["name"],
            "description": extension_data["description"],
            "author": extension_data["author"],
            "version": extension_data["version"],
            "registration_timestamp": datetime.utcnow().isoformat(),
            "versions": {
                extension_data["version"]: {
                    "version": extension_data["version"],
                    "dependencies": extension_data["dependencies"],
                    "extension_points": extension_data["extension_points"],
                    "compatibility": extension_data["compatibility"],
                    "registration_timestamp": datetime.utcnow().isoformat()
                }
            }
        }
        
        # Create a seal for the extension
        extension["seal"] = self.seal_verification_service.create_seal(extension)
        
        # Add the extension to the registry
        self.extensions[extension_id] = extension
        
        # Save the updated registry
        self._save_registry()
        
        logger.info(f"Registered extension {extension_id} version {extension_data['version']}")
        return True
    
    def register_extension_version(self, extension_id: str, version_data: Dict[str, Any]) -> bool:
        """Register a new version of an existing extension.
        
        Args:
            extension_id: ID of the extension to update.
            version_data: Data for the new version.
                Must include version, dependencies, extension_points, and compatibility information.
                
        Returns:
            True if the version was registered successfully.
            
        Raises:
            ValueError: If the extension doesn't exist, the version already exists, or validation fails.
        """
        # Pre-loop tether check
        registry_state_hash = self._get_registry_state_hash()
        tether_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "register_extension_version",
            "registry_state_hash": registry_state_hash,
        }
        tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
        
        # Verify the tether
        if not self.seal_verification_service.verify_seal(tether_data):
            logger.error("Pre-loop tether verification failed")
            raise ValueError("Pre-loop tether verification failed")
        
        # Check if the extension exists
        if extension_id not in self.extensions:
            logger.error(f"Extension {extension_id} does not exist")
            raise ValueError(f"Extension {extension_id} does not exist")
        
        # Validate the version data
        validation_result = self.schema_validator.validate(version_data, "module_extension.schema.v1.json")
        if not validation_result.is_valid:
            logger.error(f"Version validation failed: {validation_result.errors}")
            raise ValueError(f"Version validation failed: {validation_result.errors}")
        
        # Check if the version already exists
        version = version_data["version"]
        if version in self.extensions[extension_id]["versions"]:
            logger.error(f"Version {version} already exists for extension {extension_id}")
            raise ValueError(f"Version {version} already exists for extension {extension_id}")
        
        # Prepare the version data
        version_entry = {
            "version": version,
            "dependencies": version_data["dependencies"],
            "extension_points": version_data["extension_points"],
            "compatibility": version_data["compatibility"],
            "registration_timestamp": datetime.utcnow().isoformat()
        }
        
        # Add the version to the extension
        self.extensions[extension_id]["versions"][version] = version_entry
        
        # Update the extension's current version if the new version is higher
        current_version = self.extensions[extension_id]["version"]
        if self._compare_versions(version, current_version) > 0:
            self.extensions[extension_id]["version"] = version
        
        # Create a seal for the updated extension
        self.extensions[extension_id]["seal"] = self.seal_verification_service.create_seal(self.extensions[extension_id])
        
        # Save the updated registry
        self._save_registry()
        
        logger.info(f"Registered version {version} for extension {extension_id}")
        return True
    
    def _compare_versions(self, version1: str, version2: str) -> int:
        """Compare two version strings.
        
        Args:
            version1: First version string.
            version2: Second version string.
            
        Returns:
            1 if version1 > version2, -1 if version1 < version2, 0 if equal.
        """
        v1_parts = [int(x) for x in version1.split('.')]
        v2_parts = [int(x) for x in version2.split('.')]
        
        for i in range(max(len(v1_parts), len(v2_parts))):
            v1 = v1_parts[i] if i < len(v1_parts) else 0
            v2 = v2_parts[i] if i < len(v2_parts) else 0
            
            if v1 > v2:
                return 1
            elif v1 < v2:
                return -1
        
        return 0
    
    def get_extension(self, extension_id: str) -> Optional[Dict[str, Any]]:
        """Get information about an extension.
        
        Args:
            extension_id: ID of the extension to get.
            
        Returns:
            Information about the extension, or None if it doesn't exist.
        """
        return self.extensions.get(extension_id)
    
    def get_extension_version(self, extension_id: str, version: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific version of an extension.
        
        Args:
            extension_id: ID of the extension.
            version: Version to get.
            
        Returns:
            Information about the version, or None if it doesn't exist.
        """
        extension = self.extensions.get(extension_id)
        if not extension:
            return None
        
        versions = extension.get("versions", {})
        return versions.get(version)
    
    def list_extensions(self) -> Dict[str, Dict[str, Any]]:
        """List all registered extensions.
        
        Returns:
            Dictionary mapping extension IDs to extension information.
        """
        return self.extensions
    
    def list_extension_versions(self, extension_id: str) -> List[str]:
        """List all versions of an extension.
        
        Args:
            extension_id: ID of the extension.
            
        Returns:
            List of version strings.
        """
        extension = self.extensions.get(extension_id)
        if not extension:
            return []
        
        return list(extension.get("versions", {}).keys())
    
    def check_extension_exists(self, extension_id: str) -> bool:
        """Check if an extension exists.
        
        Args:
            extension_id: ID of the extension to check.
            
        Returns:
            True if the extension exists, False otherwise.
        """
        return extension_id in self.extensions
    
    def check_extension_version_exists(self, extension_id: str, version: str) -> bool:
        """Check if a specific version of an extension exists.
        
        Args:
            extension_id: ID of the extension.
            version: Version to check.
            
        Returns:
            True if the version exists, False otherwise.
        """
        extension = self.extensions.get(extension_id)
        if not extension:
            return False
        
        versions = extension.get("versions", {})
        return version in versions
    
    def unregister_extension(self, extension_id: str) -> bool:
        """Unregister an extension.
        
        Args:
            extension_id: ID of the extension to unregister.
            
        Returns:
            True if the extension was unregistered successfully.
            
        Raises:
            ValueError: If the extension doesn't exist.
        """
        # Pre-loop tether check
        registry_state_hash = self._get_registry_state_hash()
        tether_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "unregister_extension",
            "registry_state_hash": registry_state_hash,
        }
        tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
        
        # Verify the tether
        if not self.seal_verification_service.verify_seal(tether_data):
            logger.error("Pre-loop tether verification failed")
            raise ValueError("Pre-loop tether verification failed")
        
        # Check if the extension exists
        if extension_id not in self.extensions:
            logger.error(f"Extension {extension_id} does not exist")
            raise ValueError(f"Extension {extension_id} does not exist")
        
        # Remove the extension
        del self.extensions[extension_id]
        
        # Save the updated registry
        self._save_registry()
        
        logger.info(f"Unregistered extension {extension_id}")
        return True
    
    def unregister_extension_version(self, extension_id: str, version: str) -> bool:
        """Unregister a specific version of an extension.
        
        Args:
            extension_id: ID of the extension.
            version: Version to unregister.
            
        Returns:
            True if the version was unregistered successfully.
            
        Raises:
            ValueError: If the extension or version doesn't exist, or if it's the only version.
        """
        # Pre-loop tether check
        registry_state_hash = self._get_registry_state_hash()
        tether_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "unregister_extension_version",
            "registry_state_hash": registry_state_hash,
        }
        tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
        
        # Verify the tether
        if not self.seal_verification_service.verify_seal(tether_data):
            logger.error("Pre-loop tether verification failed")
            raise ValueError("Pre-loop tether verification failed")
        
        # Check if the extension exists
        if extension_id not in self.extensions:
            logger.error(f"Extension {extension_id} does not exist")
            raise ValueError(f"Extension {extension_id} does not exist")
        
        # Check if the version exists
        versions = self.extensions[extension_id].get("versions", {})
        if version not in versions:
            logger.error(f"Version {version} does not exist for extension {extension_id}")
            raise ValueError(f"Version {version} does not exist for extension {extension_id}")
        
        # Check if it's the only version
        if len(versions) == 1:
            logger.error(f"Cannot unregister the only version of extension {extension_id}")
            raise ValueError(f"Cannot unregister the only version of extension {extension_id}")
        
        # Remove the version
        del versions[version]
        
        # Update the extension's current version if necessary
        current_version = self.extensions[extension_id]["version"]
        if current_version == version:
            # Find the highest remaining version
            highest_version = max(versions.keys(), key=lambda v: self._compare_versions(v, "0.0.0"))
            self.extensions[extension_id]["version"] = highest_version
        
        # Create a seal for the updated extension
        self.extensions[extension_id]["seal"] = self.seal_verification_service.create_seal(self.extensions[extension_id])
        
        # Save the updated registry
        self._save_registry()
        
        logger.info(f"Unregistered version {version} for extension {extension_id}")
        return True
