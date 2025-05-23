"""
Module Lifecycle Manager for the Governance Expansion Protocol.

This module provides the ModuleLifecycleManager class, which is responsible for
managing the lifecycle of governance extensions, including registration, installation,
activation, deactivation, and uninstallation.
"""

import os
import json
import uuid
import logging
from datetime import datetime
from enum import Enum
from typing import Dict, Any, Optional, List, Union

from src.core.governance.module_extension_registry import ModuleExtensionRegistry
from src.core.governance.compatibility_verification_engine import CompatibilityVerificationEngine
from src.core.verification.seal_verification import SealVerificationService
from src.core.common.schema_validator import SchemaValidator

logger = logging.getLogger(__name__)

class LifecycleState(Enum):
    """Enum representing the possible states of an extension lifecycle."""
    REGISTERED = "registered"
    INSTALLED = "installed"
    ACTIVATED = "activated"
    DEACTIVATED = "deactivated"
    UNINSTALLED = "uninstalled"
    FAILED = "failed"


class LifecycleTransitionError(Exception):
    """Exception raised when a lifecycle transition is invalid."""
    pass


class ModuleLifecycleManager:
    """
    Module Lifecycle Manager for the Governance Expansion Protocol.
    
    This class is responsible for managing the lifecycle of governance extensions,
    including registration, installation, activation, deactivation, and uninstallation.
    """
    
    def __init__(
        self,
        registry: ModuleExtensionRegistry,
        verification_engine: CompatibilityVerificationEngine,
        seal_verification_service: SealVerificationService,
        schema_validator: SchemaValidator,
        lifecycle_history_path: str
    ):
        """
        Initialize the Module Lifecycle Manager.
        
        Args:
            registry: The module extension registry.
            verification_engine: The compatibility verification engine.
            seal_verification_service: The seal verification service.
            schema_validator: The schema validator.
            lifecycle_history_path: Path to the lifecycle history file.
        """
        self.registry = registry
        self.verification_engine = verification_engine
        self.seal_verification_service = seal_verification_service
        self.schema_validator = schema_validator
        self.lifecycle_history_path = lifecycle_history_path
        self.lifecycles = {}
        
        # Define valid state transitions
        self.valid_transitions = {
            LifecycleState.REGISTERED: [LifecycleState.INSTALLED, LifecycleState.FAILED],
            LifecycleState.INSTALLED: [LifecycleState.ACTIVATED, LifecycleState.UNINSTALLED, LifecycleState.FAILED],
            LifecycleState.ACTIVATED: [LifecycleState.DEACTIVATED, LifecycleState.FAILED],
            LifecycleState.DEACTIVATED: [LifecycleState.ACTIVATED, LifecycleState.UNINSTALLED, LifecycleState.FAILED],
            LifecycleState.UNINSTALLED: [LifecycleState.REGISTERED, LifecycleState.FAILED],
            LifecycleState.FAILED: [LifecycleState.REGISTERED]
        }
        
        # Load existing lifecycles
        self._load_lifecycles()
    
    def register_extension_lifecycle(
        self,
        extension_id: str,
        extension_version: str,
        actor_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Register a new extension lifecycle.
        
        Args:
            extension_id: The ID of the extension.
            extension_version: The version of the extension.
            actor_id: The ID of the actor performing the registration.
            metadata: Optional metadata for the registration.
        
        Returns:
            str: The ID of the new lifecycle.
        
        Raises:
            ValueError: If the extension or version doesn't exist.
        """
        # Check if the extension exists
        if not self.registry.check_extension_exists(extension_id):
            raise ValueError(f"Extension {extension_id} does not exist")
        
        # Check if the extension version exists
        if not self.registry.check_extension_version_exists(extension_id, extension_version):
            raise ValueError(f"Extension version {extension_id}@{extension_version} does not exist")
        
        # Generate a unique ID for the lifecycle
        lifecycle_id = str(uuid.uuid4())
        
        # Create the lifecycle
        lifecycle = {
            "lifecycle_id": lifecycle_id,
            "extension_id": extension_id,
            "extension_version": extension_version,
            "current_state": LifecycleState.REGISTERED.value,
            "registration_timestamp": datetime.utcnow().isoformat(),
            "last_updated_timestamp": datetime.utcnow().isoformat(),
            "actor_id": actor_id,
            "metadata": metadata or {},
            "transition_history": [],
            "update_history": [],
            "rollback_history": []
        }
        
        # Validate the lifecycle against the schema
        validation_result = self.schema_validator.validate(
            lifecycle,
            "module_lifecycle.schema.v1.json"
        )
        
        if not validation_result.is_valid:
            raise ValueError(f"Invalid lifecycle: {validation_result.errors}")
        
        # Create a seal for the lifecycle
        lifecycle["seal"] = self.seal_verification_service.create_seal(lifecycle)
        
        # Add the lifecycle to the registry
        self.lifecycles[lifecycle_id] = lifecycle
        
        # Save the lifecycles
        self._save_lifecycles()
        
        return lifecycle_id
    
    def get_lifecycle(self, lifecycle_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a lifecycle by ID.
        
        Args:
            lifecycle_id: The ID of the lifecycle.
        
        Returns:
            Optional[Dict[str, Any]]: The lifecycle, or None if not found.
        """
        return self.lifecycles.get(lifecycle_id)
    
    def list_lifecycles(self) -> Dict[str, Dict[str, Any]]:
        """
        List all lifecycles.
        
        Returns:
            Dict[str, Dict[str, Any]]: A dictionary of all lifecycles.
        """
        return self.lifecycles
    
    def list_lifecycles_by_extension(self, extension_id: str) -> Dict[str, Dict[str, Any]]:
        """
        List all lifecycles for a specific extension.
        
        Args:
            extension_id: The ID of the extension.
        
        Returns:
            Dict[str, Dict[str, Any]]: A dictionary of lifecycles for the extension.
        """
        return {
            lifecycle_id: lifecycle
            for lifecycle_id, lifecycle in self.lifecycles.items()
            if lifecycle["extension_id"] == extension_id
        }
    
    def list_lifecycles_by_state(self, state: str) -> Dict[str, Dict[str, Any]]:
        """
        List all lifecycles in a specific state.
        
        Args:
            state: The state to filter by.
        
        Returns:
            Dict[str, Dict[str, Any]]: A dictionary of lifecycles in the state.
        """
        return {
            lifecycle_id: lifecycle
            for lifecycle_id, lifecycle in self.lifecycles.items()
            if lifecycle["current_state"] == state
        }
    
    def transition_state(
        self,
        lifecycle_id: str,
        new_state: str,
        actor_id: str,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Transition a lifecycle to a new state.
        
        Args:
            lifecycle_id: The ID of the lifecycle.
            new_state: The new state.
            actor_id: The ID of the actor performing the transition.
            reason: Optional reason for the transition.
            metadata: Optional metadata for the transition.
        
        Returns:
            bool: True if the transition was successful.
        
        Raises:
            ValueError: If the lifecycle doesn't exist or the new state is invalid.
            LifecycleTransitionError: If the transition is invalid.
        """
        # Check if the lifecycle exists
        lifecycle = self.get_lifecycle(lifecycle_id)
        if not lifecycle:
            raise ValueError(f"Lifecycle {lifecycle_id} does not exist")
        
        # Check if the new state is valid
        try:
            new_state_enum = LifecycleState(new_state)
        except ValueError:
            raise ValueError(f"Invalid state: {new_state}")
        
        # Check if the transition is valid
        current_state_enum = LifecycleState(lifecycle["current_state"])
        if new_state_enum not in self.valid_transitions[current_state_enum]:
            raise LifecycleTransitionError(
                f"Invalid transition from {current_state_enum.value} to {new_state_enum.value}"
            )
        
        # Special handling for activation
        if new_state_enum == LifecycleState.ACTIVATED:
            # Verify compatibility
            verification_result = self.verification_engine.verify_extension_compatibility(
                lifecycle["extension_id"],
                lifecycle["extension_version"]
            )
            
            if not verification_result.is_compatible:
                raise LifecycleTransitionError(
                    f"Extension {lifecycle['extension_id']}@{lifecycle['extension_version']} "
                    f"is not compatible: {verification_result.compatibility_status}"
                )
        
        # Create the transition record
        transition = {
            "from_state": lifecycle["current_state"],
            "to_state": new_state,
            "timestamp": datetime.utcnow().isoformat(),
            "actor_id": actor_id,
            "reason": reason,
            "metadata": metadata or {}
        }
        
        # Update the lifecycle
        lifecycle["current_state"] = new_state
        lifecycle["last_updated_timestamp"] = datetime.utcnow().isoformat()
        lifecycle["transition_history"].append(transition)
        
        # Validate the lifecycle against the schema
        validation_result = self.schema_validator.validate(
            lifecycle,
            "module_lifecycle.schema.v1.json"
        )
        
        if not validation_result.is_valid:
            raise ValueError(f"Invalid lifecycle after transition: {validation_result.errors}")
        
        # Create a new seal for the lifecycle
        lifecycle["seal"] = self.seal_verification_service.create_seal(lifecycle)
        
        # Save the lifecycles
        self._save_lifecycles()
        
        return True
    
    def update_extension(
        self,
        lifecycle_id: str,
        new_version: str,
        actor_id: str,
        reason: Optional[str] = None,
        changelog: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Update an extension to a new version.
        
        Args:
            lifecycle_id: The ID of the lifecycle.
            new_version: The new version.
            actor_id: The ID of the actor performing the update.
            reason: Optional reason for the update.
            changelog: Optional changelog for the update.
            metadata: Optional metadata for the update.
        
        Returns:
            bool: True if the update was successful.
        
        Raises:
            ValueError: If the lifecycle doesn't exist or the new version is invalid.
            LifecycleTransitionError: If the update is invalid.
        """
        # Check if the lifecycle exists
        lifecycle = self.get_lifecycle(lifecycle_id)
        if not lifecycle:
            raise ValueError(f"Lifecycle {lifecycle_id} does not exist")
        
        # Check if the new version is different
        if lifecycle["extension_version"] == new_version:
            raise ValueError(f"Extension is already at version {new_version}")
        
        # Check if the new version exists
        if not self.registry.check_extension_version_exists(lifecycle["extension_id"], new_version):
            raise ValueError(f"Extension version {lifecycle['extension_id']}@{new_version} does not exist")
        
        # Check if the lifecycle is in a valid state for update
        current_state = LifecycleState(lifecycle["current_state"])
        if current_state not in [LifecycleState.INSTALLED, LifecycleState.ACTIVATED, LifecycleState.DEACTIVATED]:
            raise LifecycleTransitionError(
                f"Cannot update extension in state {current_state.value}"
            )
        
        # Verify compatibility
        verification_result = self.verification_engine.verify_extension_compatibility(
            lifecycle["extension_id"],
            new_version
        )
        
        if not verification_result.is_compatible:
            raise LifecycleTransitionError(
                f"Extension {lifecycle['extension_id']}@{new_version} "
                f"is not compatible: {verification_result.compatibility_status}"
            )
        
        # Create the update record
        update = {
            "from_version": lifecycle["extension_version"],
            "to_version": new_version,
            "timestamp": datetime.utcnow().isoformat(),
            "actor_id": actor_id,
            "reason": reason,
            "changelog": changelog,
            "metadata": metadata or {}
        }
        
        # Update the lifecycle
        old_version = lifecycle["extension_version"]
        lifecycle["extension_version"] = new_version
        lifecycle["last_updated_timestamp"] = datetime.utcnow().isoformat()
        lifecycle["update_history"].append(update)
        
        # Validate the lifecycle against the schema
        validation_result = self.schema_validator.validate(
            lifecycle,
            "module_lifecycle.schema.v1.json"
        )
        
        if not validation_result.is_valid:
            # Revert the update
            lifecycle["extension_version"] = old_version
            lifecycle["update_history"].pop()
            raise ValueError(f"Invalid lifecycle after update: {validation_result.errors}")
        
        # Create a new seal for the lifecycle
        lifecycle["seal"] = self.seal_verification_service.create_seal(lifecycle)
        
        # Save the lifecycles
        self._save_lifecycles()
        
        return True
    
    def rollback_extension(
        self,
        lifecycle_id: str,
        target_version: str,
        actor_id: str,
        reason: Optional[str] = None,
        issues_encountered: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Rollback an extension to a previous version.
        
        Args:
            lifecycle_id: The ID of the lifecycle.
            target_version: The target version to rollback to.
            actor_id: The ID of the actor performing the rollback.
            reason: Optional reason for the rollback.
            issues_encountered: Optional list of issues encountered.
            metadata: Optional metadata for the rollback.
        
        Returns:
            bool: True if the rollback was successful.
        
        Raises:
            ValueError: If the lifecycle doesn't exist or the target version is invalid.
            LifecycleTransitionError: If the rollback is invalid.
        """
        # Check if the lifecycle exists
        lifecycle = self.get_lifecycle(lifecycle_id)
        if not lifecycle:
            raise ValueError(f"Lifecycle {lifecycle_id} does not exist")
        
        # Check if the target version is different
        if lifecycle["extension_version"] == target_version:
            raise ValueError(f"Extension is already at version {target_version}")
        
        # Check if the target version exists
        if not self.registry.check_extension_version_exists(lifecycle["extension_id"], target_version):
            raise ValueError(f"Extension version {lifecycle['extension_id']}@{target_version} does not exist")
        
        # Check if the target version is in the update history
        update_versions = [update["from_version"] for update in lifecycle["update_history"]]
        if target_version not in update_versions:
            raise ValueError(f"Target version {target_version} is not in the update history")
        
        # Create the rollback record
        rollback = {
            "from_version": lifecycle["extension_version"],
            "to_version": target_version,
            "timestamp": datetime.utcnow().isoformat(),
            "actor_id": actor_id,
            "reason": reason,
            "issues_encountered": issues_encountered or [],
            "metadata": metadata or {}
        }
        
        # Update the lifecycle
        old_version = lifecycle["extension_version"]
        lifecycle["extension_version"] = target_version
        lifecycle["last_updated_timestamp"] = datetime.utcnow().isoformat()
        lifecycle["rollback_history"].append(rollback)
        
        # Validate the lifecycle against the schema
        validation_result = self.schema_validator.validate(
            lifecycle,
            "module_lifecycle.schema.v1.json"
        )
        
        if not validation_result.is_valid:
            # Revert the rollback
            lifecycle["extension_version"] = old_version
            lifecycle["rollback_history"].pop()
            raise ValueError(f"Invalid lifecycle after rollback: {validation_result.errors}")
        
        # Create a new seal for the lifecycle
        lifecycle["seal"] = self.seal_verification_service.create_seal(lifecycle)
        
        # Save the lifecycles
        self._save_lifecycles()
        
        return True
    
    def _load_lifecycles(self):
        """
        Load lifecycles from the lifecycle history file.
        """
        if os.path.exists(self.lifecycle_history_path):
            try:
                with open(self.lifecycle_history_path, "r") as f:
                    self.lifecycles = json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Failed to load lifecycles: {e}")
                self.lifecycles = {}
        else:
            self.lifecycles = {}
    
    def _save_lifecycles(self):
        """
        Save lifecycles to the lifecycle history file.
        """
        try:
            # Create the directory if it doesn't exist
            os.makedirs(os.path.dirname(self.lifecycle_history_path), exist_ok=True)
            
            with open(self.lifecycle_history_path, "w") as f:
                json.dump(self.lifecycles, f, indent=2)
        except IOError as e:
            logger.error(f"Failed to save lifecycles: {e}")
