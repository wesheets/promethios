"""
Compatibility Verification Engine for the Governance Expansion Protocol.

This module provides the core engine for verifying compatibility between
governance modules, extensions, and the Promethios framework.
"""

import os
import json
import logging
import semver
from datetime import datetime
from typing import Dict, List, Any, Optional, NamedTuple

# Configure logging
logger = logging.getLogger(__name__)

class VerificationResult(NamedTuple):
    """Result of a compatibility verification."""
    is_compatible: bool
    status: str
    details: Dict[str, Any]
    timestamp: str

class CompatibilityVerificationEngine:
    """Engine for verifying compatibility between modules and extensions."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        module_extension_registry,
        verification_history_path: str = None
    ):
        """Initialize the compatibility verification engine.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            module_extension_registry: Registry for module extensions.
            verification_history_path: Path to the verification history JSON file.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.module_extension_registry = module_extension_registry
        
        # Set default verification history path if not provided
        if verification_history_path is None:
            verification_history_path = "verification_history.json"
        
        self.verification_history_path = verification_history_path
        self.verification_history = {}
        
        # Framework version information
        self.framework_version = "1.0.0"  # Default framework version
        
        # Load existing verification history if available
        self._load_verification_history()
        
        # Create directory for verification history if it doesn't exist
        if verification_history_path and os.path.dirname(verification_history_path):
            os.makedirs(os.path.dirname(self.verification_history_path), exist_ok=True)
    
    def _load_verification_history(self):
        """Load the verification history from the JSON file."""
        if os.path.exists(self.verification_history_path):
            try:
                with open(self.verification_history_path, 'r') as f:
                    data = json.load(f)
                
                # Verify the seal
                if not self.seal_verification_service.verify_seal(data):
                    logger.error("Verification history file seal verification failed")
                    raise ValueError("Verification history file seal verification failed")
                
                # Load verification history
                self.verification_history = data.get("verifications", {})
                
                logger.info(f"Loaded {len(self.verification_history)} verification records")
            except Exception as e:
                logger.error(f"Error loading verification history: {str(e)}")
                self.verification_history = {}
    
    def _save_verification_history(self):
        """Save the verification history to the JSON file."""
        # Create directory if it doesn't exist
        if self.verification_history_path and os.path.dirname(self.verification_history_path):
            os.makedirs(os.path.dirname(self.verification_history_path), exist_ok=True)
        
        # Prepare data for serialization
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_verification_history",
            "verifications": self.verification_history
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.verification_history_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.verification_history)} verification records")
    
    def _get_engine_state_hash(self) -> str:
        """Get a hash of the current engine state.
        
        Returns:
            Hash of the current engine state.
        """
        # Create a string representation of the engine state
        state_str = json.dumps(self.verification_history, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def set_framework_version(self, version: str):
        """Set the current framework version.
        
        Args:
            version: Framework version string (semver format).
        """
        # Validate the version string
        try:
            semver.parse(version)
        except ValueError:
            logger.error(f"Invalid version string: {version}")
            raise ValueError(f"Invalid version string: {version}")
        
        self.framework_version = version
        logger.info(f"Set framework version to {version}")
    
    def verify_extension_compatibility(self, extension_id: str, version: str = None) -> VerificationResult:
        """Verify compatibility of an extension with the current framework.
        
        Args:
            extension_id: ID of the extension to verify.
            version: Specific version of the extension to verify, or None for the latest.
            
        Returns:
            VerificationResult with compatibility status and details.
            
        Raises:
            ValueError: If the extension doesn't exist.
        """
        # Pre-loop tether check
        engine_state_hash = self._get_engine_state_hash()
        tether_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "verify_extension_compatibility",
            "engine_state_hash": engine_state_hash,
        }
        tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
        
        # Verify the tether
        if not self.seal_verification_service.verify_seal(tether_data):
            logger.error("Pre-loop tether verification failed")
            raise ValueError("Pre-loop tether verification failed")
        
        # Get the extension from the registry
        extension = self.module_extension_registry.get_extension(extension_id)
        if not extension:
            logger.error(f"Extension {extension_id} does not exist")
            raise ValueError(f"Extension {extension_id} does not exist")
        
        # Get the specific version or use the latest
        if version:
            extension_version = self.module_extension_registry.get_extension_version(extension_id, version)
            if not extension_version:
                logger.error(f"Version {version} of extension {extension_id} does not exist")
                raise ValueError(f"Version {version} of extension {extension_id} does not exist")
        else:
            version = extension["version"]
            extension_version = self.module_extension_registry.get_extension_version(extension_id, version)
        
        # Get compatibility information
        compatibility = extension_version.get("compatibility", {})
        min_framework_version = compatibility.get("min_framework_version", "0.0.0")
        max_framework_version = compatibility.get("max_framework_version", "999.999.999")
        compatible_modules = compatibility.get("compatible_modules", [])
        
        # Check framework version compatibility
        framework_compatible = (
            semver.compare(self.framework_version, min_framework_version) >= 0 and
            semver.compare(self.framework_version, max_framework_version) <= 0
        )
        
        # Check module compatibility
        modules_compatible = True
        incompatible_modules = []
        
        for module_req in compatible_modules:
            module_id = module_req.get("module_id")
            min_version = module_req.get("min_version", "0.0.0")
            max_version = module_req.get("max_version", "999.999.999")
            
            # Check if the module exists
            module = self.module_extension_registry.get_extension(module_id)
            if not module:
                modules_compatible = False
                incompatible_modules.append({
                    "module_id": module_id,
                    "reason": "Module does not exist"
                })
                continue
            
            # Check version compatibility
            module_version = module["version"]
            if (semver.compare(module_version, min_version) < 0 or
                semver.compare(module_version, max_version) > 0):
                modules_compatible = False
                incompatible_modules.append({
                    "module_id": module_id,
                    "reason": f"Module version {module_version} is outside the required range {min_version} - {max_version}"
                })
        
        # Check dependency compatibility
        dependencies_compatible = True
        incompatible_dependencies = []
        
        for dependency in extension_version.get("dependencies", []):
            dependency_id = dependency.get("extension_id")
            min_version = dependency.get("min_version", "0.0.0")
            max_version = dependency.get("max_version", "999.999.999")
            
            # Check if the dependency exists
            dep_extension = self.module_extension_registry.get_extension(dependency_id)
            if not dep_extension:
                dependencies_compatible = False
                incompatible_dependencies.append({
                    "extension_id": dependency_id,
                    "reason": "Dependency does not exist"
                })
                continue
            
            # Check version compatibility
            dep_version = dep_extension["version"]
            if (semver.compare(dep_version, min_version) < 0 or
                semver.compare(dep_version, max_version) > 0):
                dependencies_compatible = False
                incompatible_dependencies.append({
                    "extension_id": dependency_id,
                    "reason": f"Dependency version {dep_version} is outside the required range {min_version} - {max_version}"
                })
        
        # Determine overall compatibility
        is_compatible = framework_compatible and modules_compatible and dependencies_compatible
        
        # Determine status
        if is_compatible:
            status = "COMPATIBLE"
        else:
            if not framework_compatible:
                status = "INCOMPATIBLE_FRAMEWORK"
            elif not modules_compatible:
                status = "INCOMPATIBLE_MODULES"
            else:
                status = "INCOMPATIBLE_DEPENDENCIES"
        
        # Create verification result
        timestamp = datetime.utcnow().isoformat()
        details = {
            "extension_id": extension_id,
            "extension_version": version,
            "framework_version": self.framework_version,
            "framework_compatible": framework_compatible,
            "modules_compatible": modules_compatible,
            "dependencies_compatible": dependencies_compatible,
            "incompatible_modules": incompatible_modules,
            "incompatible_dependencies": incompatible_dependencies
        }
        
        result = VerificationResult(
            is_compatible=is_compatible,
            status=status,
            details=details,
            timestamp=timestamp
        )
        
        # Add to verification history
        verification_id = f"{extension_id}:{version}:{timestamp}"
        self.verification_history[verification_id] = {
            "verification_id": verification_id,
            "extension_id": extension_id,
            "extension_version": version,
            "framework_version": self.framework_version,
            "is_compatible": is_compatible,
            "status": status,
            "details": details,
            "timestamp": timestamp
        }
        
        # Save the updated verification history
        self._save_verification_history()
        
        logger.info(f"Verified compatibility of extension {extension_id} version {version}: {status}")
        return result
    
    def get_verification(self, verification_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a verification.
        
        Args:
            verification_id: ID of the verification to get.
            
        Returns:
            Information about the verification, or None if it doesn't exist.
        """
        return self.verification_history.get(verification_id)
    
    def list_verifications(self) -> Dict[str, Dict[str, Any]]:
        """List all verifications.
        
        Returns:
            Dictionary mapping verification IDs to verification information.
        """
        return self.verification_history
    
    def list_verifications_by_extension(self, extension_id: str) -> Dict[str, Dict[str, Any]]:
        """List all verifications for an extension.
        
        Args:
            extension_id: ID of the extension.
            
        Returns:
            Dictionary mapping verification IDs to verification information.
        """
        return {
            verification_id: verification
            for verification_id, verification in self.verification_history.items()
            if verification["extension_id"] == extension_id
        }
    
    def list_verifications_by_status(self, status: str) -> Dict[str, Dict[str, Any]]:
        """List all verifications with a specific status.
        
        Args:
            status: Status to filter by.
            
        Returns:
            Dictionary mapping verification IDs to verification information.
        """
        return {
            verification_id: verification
            for verification_id, verification in self.verification_history.items()
            if verification["status"] == status
        }
    
    def get_latest_verification(self, extension_id: str, version: str = None) -> Optional[Dict[str, Any]]:
        """Get the latest verification for an extension.
        
        Args:
            extension_id: ID of the extension.
            version: Specific version of the extension, or None for any version.
            
        Returns:
            Information about the latest verification, or None if none exists.
        """
        # Filter verifications by extension ID and version
        filtered_verifications = [
            verification
            for verification in self.verification_history.values()
            if verification["extension_id"] == extension_id and
               (version is None or verification["extension_version"] == version)
        ]
        
        # Sort by timestamp (descending)
        sorted_verifications = sorted(
            filtered_verifications,
            key=lambda v: v["timestamp"],
            reverse=True
        )
        
        # Return the latest verification, or None if none exists
        return sorted_verifications[0] if sorted_verifications else None
