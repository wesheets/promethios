"""
Governance Versioning System for Phase 6.3.1 remediation.

This module implements a comprehensive versioning system for governance components,
supporting the Governance Lifecycle Framework with version tracking, compatibility
management, and upgrade/rollback procedures.

Version Structure:
- Major Version: Constitutional changes (rare, requires extensive validation)
- Minor Version: Significant governance enhancements (requires full validation)
- Patch Version: Implementation improvements (requires targeted validation)
"""

import os
import json
import time
import uuid
import logging
import datetime
import semver
from enum import Enum
from typing import Dict, List, Any, Optional, Set, Tuple, Union

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VersionType(Enum):
    """Types of version changes."""
    MAJOR = "major"  # Constitutional changes
    MINOR = "minor"  # Significant governance enhancements
    PATCH = "patch"  # Implementation improvements


class VersionStatus(Enum):
    """Status of a governance version."""
    DRAFT = "draft"           # In development
    PROPOSED = "proposed"     # Proposed for review
    APPROVED = "approved"     # Approved for implementation
    ACTIVE = "active"         # Currently active
    DEPRECATED = "deprecated" # Still supported but being phased out
    RETIRED = "retired"       # No longer supported


class ValidationLevel(Enum):
    """Required validation level for version changes."""
    EXTENSIVE = "extensive"   # Full constitutional validation
    FULL = "full"             # Complete validation of all components
    TARGETED = "targeted"     # Validation of specific components
    MINIMAL = "minimal"       # Basic validation checks


class CompatibilityType(Enum):
    """Types of compatibility between versions."""
    FULL = "full"                 # Fully compatible
    BACKWARD = "backward"         # New version works with old components
    FORWARD = "forward"           # Old version works with new components
    PARTIAL = "partial"           # Some compatibility issues
    INCOMPATIBLE = "incompatible" # Not compatible


class GovernanceVersion:
    """
    Represents a specific version of a governance component.
    
    This class encapsulates all metadata and functionality related to
    governance versioning, including version numbers, compatibility,
    and validation requirements.
    """
    
    def __init__(self, 
                 component_id: str,
                 version: str,
                 description: str = None,
                 status: VersionStatus = VersionStatus.DRAFT,
                 created_at: float = None,
                 created_by: str = None,
                 metadata: Dict[str, Any] = None):
        """
        Initialize a governance version.
        
        Args:
            component_id: Identifier for the governance component
            version: Semantic version string (e.g., "1.0.0")
            description: Optional description of this version
            status: Current status of this version
            created_at: Timestamp of creation (defaults to now)
            created_by: Identifier of the creator
            metadata: Additional metadata for this version
        """
        self.component_id = component_id
        self.version_id = str(uuid.uuid4())
        
        # Validate and parse version
        try:
            self.version = semver.VersionInfo.parse(version)
        except ValueError:
            logger.error(f"Invalid version format: {version}")
            raise ValueError(f"Invalid version format: {version}. Must be semver compatible (e.g., 1.0.0)")
        
        self.description = description or f"Version {version} of {component_id}"
        self.status = status
        self.created_at = created_at or time.time()
        self.created_by = created_by
        self.metadata = metadata or {}
        
        # Additional tracking fields
        self.last_updated = self.created_at
        self.changelog = []
        self.validation_history = []
        self.compatibility = {}
        self.upgrade_paths = []
        self.rollback_paths = []
        self.required_validation = self._determine_validation_level()
    
    def _determine_validation_level(self) -> ValidationLevel:
        """
        Determine the required validation level based on version type.
        
        Returns:
            ValidationLevel enum indicating required validation
        """
        if self.version.major == 0:
            # Pre-release versions always require full validation
            return ValidationLevel.FULL
        
        # Check if this is the first version
        if self.version.major == 1 and self.version.minor == 0 and self.version.patch == 0:
            return ValidationLevel.EXTENSIVE
        
        # Determine based on which component changed
        if self.metadata.get("previous_version"):
            prev_version = semver.VersionInfo.parse(self.metadata["previous_version"])
            
            if self.version.major > prev_version.major:
                return ValidationLevel.EXTENSIVE
            elif self.version.minor > prev_version.minor:
                return ValidationLevel.FULL
            else:
                return ValidationLevel.TARGETED
        
        # Default to full validation if we can't determine
        return ValidationLevel.FULL
    
    def update_status(self, new_status: VersionStatus, reason: str = None) -> None:
        """
        Update the status of this version.
        
        Args:
            new_status: New status to set
            reason: Optional reason for the status change
        """
        old_status = self.status
        self.status = new_status
        self.last_updated = time.time()
        
        # Record in changelog
        self.add_changelog_entry(
            f"Status changed from {old_status.value} to {new_status.value}",
            details={"old_status": old_status.value, "new_status": new_status.value, "reason": reason}
        )
        
        logger.info(f"Version {self.version} of {self.component_id} status updated: {old_status.value} -> {new_status.value}")
    
    def add_changelog_entry(self, message: str, details: Dict[str, Any] = None) -> None:
        """
        Add an entry to the version changelog.
        
        Args:
            message: Description of the change
            details: Additional details about the change
        """
        entry = {
            "timestamp": time.time(),
            "message": message,
            "details": details or {}
        }
        self.changelog.append(entry)
    
    def add_validation_result(self, validation_type: str, passed: bool, 
                             details: Dict[str, Any] = None) -> None:
        """
        Add a validation result to the version history.
        
        Args:
            validation_type: Type of validation performed
            passed: Whether validation passed
            details: Additional details about the validation
        """
        result = {
            "timestamp": time.time(),
            "validation_type": validation_type,
            "passed": passed,
            "details": details or {}
        }
        self.validation_history.append(result)
        
        # Update status based on validation if appropriate
        if passed and self.status == VersionStatus.PROPOSED:
            self.update_status(VersionStatus.APPROVED, 
                              f"Automatically approved after passing {validation_type} validation")
    
    def set_compatibility(self, other_version: str, 
                         compatibility_type: CompatibilityType,
                         details: Dict[str, Any] = None) -> None:
        """
        Set compatibility information with another version.
        
        Args:
            other_version: Version string to compare with
            compatibility_type: Type of compatibility
            details: Additional details about compatibility
        """
        self.compatibility[other_version] = {
            "type": compatibility_type.value,
            "details": details or {},
            "timestamp": time.time()
        }
    
    def add_upgrade_path(self, target_version: str, 
                        procedure: Dict[str, Any],
                        requirements: List[str] = None) -> None:
        """
        Add an upgrade path to another version.
        
        Args:
            target_version: Version that can be upgraded to
            procedure: Upgrade procedure details
            requirements: Requirements for the upgrade
        """
        path = {
            "target_version": target_version,
            "procedure": procedure,
            "requirements": requirements or [],
            "timestamp": time.time()
        }
        self.upgrade_paths.append(path)
    
    def add_rollback_path(self, target_version: str, 
                         procedure: Dict[str, Any],
                         requirements: List[str] = None) -> None:
        """
        Add a rollback path to another version.
        
        Args:
            target_version: Version that can be rolled back to
            procedure: Rollback procedure details
            requirements: Requirements for the rollback
        """
        path = {
            "target_version": target_version,
            "procedure": procedure,
            "requirements": requirements or [],
            "timestamp": time.time()
        }
        self.rollback_paths.append(path)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the version to a dictionary.
        
        Returns:
            Dictionary representation of the version
        """
        return {
            "component_id": self.component_id,
            "version_id": self.version_id,
            "version": str(self.version),
            "description": self.description,
            "status": self.status.value,
            "created_at": self.created_at,
            "created_by": self.created_by,
            "last_updated": self.last_updated,
            "metadata": self.metadata,
            "changelog": self.changelog,
            "validation_history": self.validation_history,
            "compatibility": self.compatibility,
            "upgrade_paths": self.upgrade_paths,
            "rollback_paths": self.rollback_paths,
            "required_validation": self.required_validation.value
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GovernanceVersion':
        """
        Create a version from a dictionary.
        
        Args:
            data: Dictionary representation of a version
            
        Returns:
            GovernanceVersion instance
        """
        version = cls(
            component_id=data["component_id"],
            version=data["version"],
            description=data.get("description"),
            status=VersionStatus(data["status"]),
            created_at=data.get("created_at"),
            created_by=data.get("created_by"),
            metadata=data.get("metadata", {})
        )
        
        # Restore additional fields
        version.version_id = data["version_id"]
        version.last_updated = data.get("last_updated", version.created_at)
        version.changelog = data.get("changelog", [])
        version.validation_history = data.get("validation_history", [])
        version.compatibility = data.get("compatibility", {})
        version.upgrade_paths = data.get("upgrade_paths", [])
        version.rollback_paths = data.get("rollback_paths", [])
        
        # Parse required validation
        if "required_validation" in data:
            version.required_validation = ValidationLevel(data["required_validation"])
        
        return version


class VersionManager:
    """
    Manages governance versions for multiple components.
    
    This class provides functionality for creating, tracking, and managing
    versions across different governance components.
    """
    
    def __init__(self, storage_dir: str = None):
        """
        Initialize the version manager.
        
        Args:
            storage_dir: Directory for storing version data
        """
        self.storage_dir = storage_dir or os.path.join(os.getcwd(), "governance_versions")
        self.logger = logging.getLogger(__name__)
        
        # Create storage directory
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Cache of loaded versions
        self._version_cache = {}
        self._component_versions = {}
    
    def create_version(self, component_id: str, version_type: VersionType, 
                      description: str = None, metadata: Dict[str, Any] = None,
                      created_by: str = None) -> GovernanceVersion:
        """
        Create a new version for a component.
        
        Args:
            component_id: Identifier for the governance component
            version_type: Type of version change
            description: Optional description of this version
            metadata: Additional metadata for this version
            created_by: Identifier of the creator
            
        Returns:
            Newly created GovernanceVersion
        """
        # Get the latest version for this component
        latest = self.get_latest_version(component_id)
        
        # Determine new version number
        if latest:
            current = latest.version
            if version_type == VersionType.MAJOR:
                new_version = semver.bump_major(str(current))
            elif version_type == VersionType.MINOR:
                new_version = semver.bump_minor(str(current))
            else:  # PATCH
                new_version = semver.bump_patch(str(current))
                
            # Add previous version to metadata
            if not metadata:
                metadata = {}
            metadata["previous_version"] = str(current)
        else:
            # First version
            new_version = "1.0.0"
        
        # Create new version
        version = GovernanceVersion(
            component_id=component_id,
            version=new_version,
            description=description,
            status=VersionStatus.DRAFT,
            created_by=created_by,
            metadata=metadata
        )
        
        # Save the version
        self._save_version(version)
        
        # Update cache
        self._add_to_cache(version)
        
        return version
    
    def get_version(self, component_id: str, version_str: str) -> Optional[GovernanceVersion]:
        """
        Get a specific version of a component.
        
        Args:
            component_id: Identifier for the governance component
            version_str: Version string to retrieve
            
        Returns:
            GovernanceVersion if found, None otherwise
        """
        cache_key = f"{component_id}:{version_str}"
        
        # Check cache first
        if cache_key in self._version_cache:
            return self._version_cache[cache_key]
        
        # Load from storage
        version_file = os.path.join(
            self.storage_dir, 
            component_id, 
            f"{version_str.replace('.', '_')}.json"
        )
        
        if not os.path.exists(version_file):
            return None
        
        try:
            with open(version_file, 'r') as f:
                data = json.load(f)
                version = GovernanceVersion.from_dict(data)
                
                # Add to cache
                self._add_to_cache(version)
                
                return version
        except Exception as e:
            self.logger.error(f"Error loading version {version_str} for {component_id}: {str(e)}")
            return None
    
    def get_latest_version(self, component_id: str) -> Optional[GovernanceVersion]:
        """
        Get the latest version of a component.
        
        Args:
            component_id: Identifier for the governance component
            
        Returns:
            Latest GovernanceVersion if found, None otherwise
        """
        # Load all versions for this component
        versions = self.get_all_versions(component_id)
        
        if not versions:
            return None
        
        # Sort by version number (highest first)
        versions.sort(key=lambda v: v.version, reverse=True)
        
        return versions[0]
    
    def get_active_version(self, component_id: str) -> Optional[GovernanceVersion]:
        """
        Get the currently active version of a component.
        
        Args:
            component_id: Identifier for the governance component
            
        Returns:
            Active GovernanceVersion if found, None otherwise
        """
        # Load all versions for this component
        versions = self.get_all_versions(component_id)
        
        if not versions:
            return None
        
        # Find active version
        active_versions = [v for v in versions if v.status == VersionStatus.ACTIVE]
        
        if not active_versions:
            return None
        
        # If multiple active versions (shouldn't happen), return the latest
        if len(active_versions) > 1:
            self.logger.warning(f"Multiple active versions found for {component_id}")
            active_versions.sort(key=lambda v: v.version, reverse=True)
        
        return active_versions[0]
    
    def get_all_versions(self, component_id: str) -> List[GovernanceVersion]:
        """
        Get all versions of a component.
        
        Args:
            component_id: Identifier for the governance component
            
        Returns:
            List of GovernanceVersion objects
        """
        # Check if we've already loaded this component's versions
        if component_id in self._component_versions:
            return list(self._component_versions[component_id].values())
        
        # Load from storage
        component_dir = os.path.join(self.storage_dir, component_id)
        if not os.path.exists(component_dir):
            return []
        
        versions = []
        for filename in os.listdir(component_dir):
            if not filename.endswith('.json'):
                continue
            
            try:
                with open(os.path.join(component_dir, filename), 'r') as f:
                    data = json.load(f)
                    version = GovernanceVersion.from_dict(data)
                    versions.append(version)
                    
                    # Add to cache
                    self._add_to_cache(version)
            except Exception as e:
                self.logger.error(f"Error loading version file {filename}: {str(e)}")
        
        return versions
    
    def update_version(self, version: GovernanceVersion) -> bool:
        """
        Update a version in storage.
        
        Args:
            version: GovernanceVersion to update
            
        Returns:
            True if successful, False otherwise
        """
        # Update last_updated timestamp
        version.last_updated = time.time()
        
        # Save to storage
        return self._save_version(version)
    
    def activate_version(self, component_id: str, version_str: str, 
                        reason: str = None) -> Optional[GovernanceVersion]:
        """
        Activate a specific version of a component.
        
        Args:
            component_id: Identifier for the governance component
            version_str: Version string to activate
            reason: Optional reason for activation
            
        Returns:
            Activated GovernanceVersion if successful, None otherwise
        """
        # Get the version to activate
        version = self.get_version(component_id, version_str)
        if not version:
            self.logger.error(f"Version {version_str} not found for {component_id}")
            return None
        
        # Check if version can be activated
        if version.status not in [VersionStatus.APPROVED, VersionStatus.DEPRECATED]:
            self.logger.error(f"Cannot activate version {version_str} with status {version.status.value}")
            return None
        
        # Get current active version
        active = self.get_active_version(component_id)
        
        # Deactivate current active version
        if active:
            active.update_status(VersionStatus.DEPRECATED, 
                               f"Replaced by version {version_str}")
            self.update_version(active)
        
        # Activate new version
        version.update_status(VersionStatus.ACTIVE, reason)
        self.update_version(version)
        
        return version
    
    def deprecate_version(self, component_id: str, version_str: str, 
                         reason: str = None) -> Optional[GovernanceVersion]:
        """
        Deprecate a specific version of a component.
        
        Args:
            component_id: Identifier for the governance component
            version_str: Version string to deprecate
            reason: Optional reason for deprecation
            
        Returns:
            Deprecated GovernanceVersion if successful, None otherwise
        """
        # Get the version to deprecate
        version = self.get_version(component_id, version_str)
        if not version:
            self.logger.error(f"Version {version_str} not found for {component_id}")
            return None
        
        # Check if version is active
        if version.status != VersionStatus.ACTIVE:
            self.logger.error(f"Cannot deprecate non-active version {version_str}")
            return None
        
        # Deprecate version
        version.update_status(VersionStatus.DEPRECATED, reason)
        self.update_version(version)
        
        return version
    
    def retire_version(self, component_id: str, version_str: str, 
                      reason: str = None) -> Optional[GovernanceVersion]:
        """
        Retire a specific version of a component.
        
        Args:
            component_id: Identifier for the governance component
            version_str: Version string to retire
            reason: Optional reason for retirement
            
        Returns:
            Retired GovernanceVersion if successful, None otherwise
        """
        # Get the version to retire
        version = self.get_version(component_id, version_str)
        if not version:
            self.logger.error(f"Version {version_str} not found for {component_id}")
            return None
        
        # Check if version can be retired
        if version.status == VersionStatus.ACTIVE:
            self.logger.error(f"Cannot retire active version {version_str}")
            return None
        
        # Retire version
        version.update_status(VersionStatus.RETIRED, reason)
        self.update_version(version)
        
        return version
    
    def get_upgrade_path(self, component_id: str, from_version: str, 
                        to_version: str) -> Optional[Dict[str, Any]]:
        """
        Get the upgrade path between two versions.
        
        Args:
            component_id: Identifier for the governance component
            from_version: Starting version
            to_version: Target version
            
        Returns:
            Upgrade path details if available, None otherwise
        """
        # Get the source version
        source = self.get_version(component_id, from_version)
        if not source:
            self.logger.error(f"Source version {from_version} not found for {component_id}")
            return None
        
        # Check for direct upgrade path
        for path in source.upgrade_paths:
            if path["target_version"] == to_version:
                return path
        
        # No direct path found
        return None
    
    def get_rollback_path(self, component_id: str, from_version: str, 
                         to_version: str) -> Optional[Dict[str, Any]]:
        """
        Get the rollback path between two versions.
        
        Args:
            component_id: Identifier for the governance component
            from_version: Starting version
            to_version: Target version
            
        Returns:
            Rollback path details if available, None otherwise
        """
        # Get the source version
        source = self.get_version(component_id, from_version)
        if not source:
            self.logger.error(f"Source version {from_version} not found for {component_id}")
            return None
        
        # Check for direct rollback path
        for path in source.rollback_paths:
            if path["target_version"] == to_version:
                return path
        
        # No direct path found
        return None
    
    def get_compatibility_info(self, component_id: str, version1: str, 
                             version2: str) -> Optional[Dict[str, Any]]:
        """
        Get compatibility information between two versions.
        
        Args:
            component_id: Identifier for the governance component
            version1: First version
            version2: Second version
            
        Returns:
            Compatibility details if available, None otherwise
        """
        # Get the first version
        v1 = self.get_version(component_id, version1)
        if not v1:
            self.logger.error(f"Version {version1} not found for {component_id}")
            return None
        
        # Check for direct compatibility info
        if version2 in v1.compatibility:
            return v1.compatibility[version2]
        
        # No compatibility info found
        return None
    
    def generate_version_report(self, component_id: str) -> Dict[str, Any]:
        """
        Generate a comprehensive report of all versions for a component.
        
        Args:
            component_id: Identifier for the governance component
            
        Returns:
            Report dictionary with version information
        """
        versions = self.get_all_versions(component_id)
        
        # Sort by version number
        versions.sort(key=lambda v: v.version)
        
        # Generate report
        report = {
            "component_id": component_id,
            "total_versions": len(versions),
            "active_version": None,
            "latest_version": str(versions[-1].version) if versions else None,
            "versions": [],
            "status_summary": {
                "draft": 0,
                "proposed": 0,
                "approved": 0,
                "active": 0,
                "deprecated": 0,
                "retired": 0
            },
            "generated_at": time.time()
        }
        
        # Add version details
        for version in versions:
            # Update status summary
            report["status_summary"][version.status.value] += 1
            
            # Track active version
            if version.status == VersionStatus.ACTIVE:
                report["active_version"] = str(version.version)
            
            # Add version details
            report["versions"].append({
                "version": str(version.version),
                "status": version.status.value,
                "created_at": version.created_at,
                "last_updated": version.last_updated,
                "description": version.description,
                "validation_status": any(v["passed"] for v in version.validation_history),
                "has_upgrade_paths": len(version.upgrade_paths) > 0,
                "has_rollback_paths": len(version.rollback_paths) > 0
            })
        
        return report
    
    def _save_version(self, version: GovernanceVersion) -> bool:
        """
        Save a version to storage.
        
        Args:
            version: GovernanceVersion to save
            
        Returns:
            True if successful, False otherwise
        """
        # Create component directory
        component_dir = os.path.join(self.storage_dir, version.component_id)
        os.makedirs(component_dir, exist_ok=True)
        
        # Create version file
        version_file = os.path.join(
            component_dir, 
            f"{str(version.version).replace('.', '_')}.json"
        )
        
        try:
            with open(version_file, 'w') as f:
                json.dump(version.to_dict(), f, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Error saving version {version.version} for {version.component_id}: {str(e)}")
            return False
    
    def _add_to_cache(self, version: GovernanceVersion) -> None:
        """
        Add a version to the cache.
        
        Args:
            version: GovernanceVersion to cache
        """
        cache_key = f"{version.component_id}:{version.version}"
        self._version_cache[cache_key] = version
        
        # Add to component versions cache
        if version.component_id not in self._component_versions:
            self._component_versions[version.component_id] = {}
        
        self._component_versions[version.component_id][str(version.version)] = version


class GovernanceVersionRegistry:
    """
    Central registry for governance component versions.
    
    This class provides a high-level interface for managing governance
    versions across the entire system, including component relationships
    and system-wide version compatibility.
    """
    
    def __init__(self, storage_dir: str = None):
        """
        Initialize the governance version registry.
        
        Args:
            storage_dir: Directory for storing registry data
        """
        self.storage_dir = storage_dir or os.path.join(os.getcwd(), "governance_registry")
        self.logger = logging.getLogger(__name__)
        
        # Create storage directories
        os.makedirs(self.storage_dir, exist_ok=True)
        os.makedirs(os.path.join(self.storage_dir, "components"), exist_ok=True)
        os.makedirs(os.path.join(self.storage_dir, "relationships"), exist_ok=True)
        
        # Initialize version manager
        self.version_manager = VersionManager(
            os.path.join(self.storage_dir, "versions")
        )
        
        # Component metadata
        self.components = {}
        self._load_components()
        
        # Component relationships
        self.relationships = {}
        self._load_relationships()
    
    def register_component(self, component_id: str, name: str, 
                          description: str = None, 
                          metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Register a new governance component.
        
        Args:
            component_id: Unique identifier for the component
            name: Human-readable name
            description: Optional description
            metadata: Additional metadata
            
        Returns:
            Component information dictionary
        """
        if component_id in self.components:
            self.logger.warning(f"Component {component_id} already registered, updating")
        
        component = {
            "component_id": component_id,
            "name": name,
            "description": description or f"Governance component: {name}",
            "registered_at": time.time(),
            "metadata": metadata or {},
            "last_updated": time.time()
        }
        
        # Save component
        self._save_component(component)
        
        # Update cache
        self.components[component_id] = component
        
        return component
    
    def get_component(self, component_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered component.
        
        Args:
            component_id: Unique identifier for the component
            
        Returns:
            Component information dictionary if found, None otherwise
        """
        return self.components.get(component_id)
    
    def update_component(self, component_id: str, 
                        updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update a registered component.
        
        Args:
            component_id: Unique identifier for the component
            updates: Dictionary of fields to update
            
        Returns:
            Updated component information dictionary if successful, None otherwise
        """
        if component_id not in self.components:
            self.logger.error(f"Component {component_id} not registered")
            return None
        
        component = self.components[component_id]
        
        # Update fields
        for key, value in updates.items():
            if key not in ["component_id", "registered_at"]:
                component[key] = value
        
        component["last_updated"] = time.time()
        
        # Save component
        self._save_component(component)
        
        return component
    
    def register_relationship(self, source_id: str, target_id: str, 
                             relationship_type: str,
                             metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Register a relationship between components.
        
        Args:
            source_id: Source component ID
            target_id: Target component ID
            relationship_type: Type of relationship
            metadata: Additional metadata
            
        Returns:
            Relationship information dictionary
        """
        # Check that components exist
        if source_id not in self.components:
            self.logger.error(f"Source component {source_id} not registered")
            raise ValueError(f"Source component {source_id} not registered")
        
        if target_id not in self.components:
            self.logger.error(f"Target component {target_id} not registered")
            raise ValueError(f"Target component {target_id} not registered")
        
        # Create relationship ID
        relationship_id = f"{source_id}:{target_id}:{relationship_type}"
        
        relationship = {
            "relationship_id": relationship_id,
            "source_id": source_id,
            "target_id": target_id,
            "relationship_type": relationship_type,
            "registered_at": time.time(),
            "metadata": metadata or {},
            "last_updated": time.time()
        }
        
        # Save relationship
        self._save_relationship(relationship)
        
        # Update cache
        self.relationships[relationship_id] = relationship
        
        return relationship
    
    def get_relationship(self, relationship_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered relationship.
        
        Args:
            relationship_id: Unique identifier for the relationship
            
        Returns:
            Relationship information dictionary if found, None otherwise
        """
        return self.relationships.get(relationship_id)
    
    def get_relationships_for_component(self, component_id: str, 
                                      as_source: bool = True,
                                      as_target: bool = True) -> List[Dict[str, Any]]:
        """
        Get relationships for a component.
        
        Args:
            component_id: Component ID to find relationships for
            as_source: Include relationships where component is the source
            as_target: Include relationships where component is the target
            
        Returns:
            List of relationship dictionaries
        """
        results = []
        
        for relationship in self.relationships.values():
            if as_source and relationship["source_id"] == component_id:
                results.append(relationship)
            elif as_target and relationship["target_id"] == component_id:
                results.append(relationship)
        
        return results
    
    def create_component_version(self, component_id: str, 
                               version_type: VersionType,
                               description: str = None,
                               metadata: Dict[str, Any] = None,
                               created_by: str = None) -> Optional[GovernanceVersion]:
        """
        Create a new version for a registered component.
        
        Args:
            component_id: Component ID to create version for
            version_type: Type of version change
            description: Optional description
            metadata: Additional metadata
            created_by: Identifier of the creator
            
        Returns:
            Newly created GovernanceVersion if successful, None otherwise
        """
        # Check that component exists
        if component_id not in self.components:
            self.logger.error(f"Component {component_id} not registered")
            return None
        
        # Create version
        return self.version_manager.create_version(
            component_id=component_id,
            version_type=version_type,
            description=description,
            metadata=metadata,
            created_by=created_by
        )
    
    def get_system_version_report(self) -> Dict[str, Any]:
        """
        Generate a comprehensive report of all governance versions.
        
        Returns:
            System-wide version report
        """
        report = {
            "generated_at": time.time(),
            "total_components": len(self.components),
            "total_relationships": len(self.relationships),
            "components": {},
            "active_versions": {},
            "version_summary": {
                "total": 0,
                "active": 0,
                "deprecated": 0,
                "draft": 0,
                "proposed": 0,
                "approved": 0,
                "retired": 0
            }
        }
        
        # Add component details
        for component_id, component in self.components.items():
            # Get component report
            component_report = self.version_manager.generate_version_report(component_id)
            
            # Add to system report
            report["components"][component_id] = {
                "name": component["name"],
                "total_versions": component_report["total_versions"],
                "active_version": component_report["active_version"],
                "latest_version": component_report["latest_version"]
            }
            
            # Track active version
            if component_report["active_version"]:
                report["active_versions"][component_id] = component_report["active_version"]
            
            # Update version summary
            report["version_summary"]["total"] += component_report["total_versions"]
            for status, count in component_report["status_summary"].items():
                report["version_summary"][status] += count
        
        return report
    
    def _load_components(self) -> None:
        """Load all registered components from storage."""
        components_dir = os.path.join(self.storage_dir, "components")
        if not os.path.exists(components_dir):
            return
        
        for filename in os.listdir(components_dir):
            if not filename.endswith('.json'):
                continue
            
            try:
                with open(os.path.join(components_dir, filename), 'r') as f:
                    component = json.load(f)
                    self.components[component["component_id"]] = component
            except Exception as e:
                self.logger.error(f"Error loading component file {filename}: {str(e)}")
    
    def _save_component(self, component: Dict[str, Any]) -> bool:
        """
        Save a component to storage.
        
        Args:
            component: Component dictionary to save
            
        Returns:
            True if successful, False otherwise
        """
        components_dir = os.path.join(self.storage_dir, "components")
        os.makedirs(components_dir, exist_ok=True)
        
        component_file = os.path.join(components_dir, f"{component['component_id']}.json")
        
        try:
            with open(component_file, 'w') as f:
                json.dump(component, f, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Error saving component {component['component_id']}: {str(e)}")
            return False
    
    def _load_relationships(self) -> None:
        """Load all registered relationships from storage."""
        relationships_dir = os.path.join(self.storage_dir, "relationships")
        if not os.path.exists(relationships_dir):
            return
        
        for filename in os.listdir(relationships_dir):
            if not filename.endswith('.json'):
                continue
            
            try:
                with open(os.path.join(relationships_dir, filename), 'r') as f:
                    relationship = json.load(f)
                    self.relationships[relationship["relationship_id"]] = relationship
            except Exception as e:
                self.logger.error(f"Error loading relationship file {filename}: {str(e)}")
    
    def _save_relationship(self, relationship: Dict[str, Any]) -> bool:
        """
        Save a relationship to storage.
        
        Args:
            relationship: Relationship dictionary to save
            
        Returns:
            True if successful, False otherwise
        """
        relationships_dir = os.path.join(self.storage_dir, "relationships")
        os.makedirs(relationships_dir, exist_ok=True)
        
        # Create safe filename
        safe_id = relationship["relationship_id"].replace(":", "_")
        relationship_file = os.path.join(relationships_dir, f"{safe_id}.json")
        
        try:
            with open(relationship_file, 'w') as f:
                json.dump(relationship, f, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Error saving relationship {relationship['relationship_id']}: {str(e)}")
            return False


# Example usage
if __name__ == "__main__":
    # Create registry
    registry = GovernanceVersionRegistry()
    
    # Register components
    registry.register_component(
        component_id="trust_propagation",
        name="Trust Propagation System",
        description="System for propagating trust across components"
    )
    
    registry.register_component(
        component_id="governance_inheritance",
        name="Governance Inheritance System",
        description="System for inheriting governance attributes"
    )
    
    # Register relationship
    registry.register_relationship(
        source_id="trust_propagation",
        target_id="governance_inheritance",
        relationship_type="depends_on"
    )
    
    # Create versions
    v1 = registry.create_component_version(
        component_id="trust_propagation",
        version_type=VersionType.MAJOR,
        description="Initial version of Trust Propagation System"
    )
    
    v2 = registry.create_component_version(
        component_id="governance_inheritance",
        version_type=VersionType.MAJOR,
        description="Initial version of Governance Inheritance System"
    )
    
    # Activate versions
    registry.version_manager.activate_version(
        component_id="trust_propagation",
        version_str=str(v1.version),
        reason="Initial deployment"
    )
    
    registry.version_manager.activate_version(
        component_id="governance_inheritance",
        version_str=str(v2.version),
        reason="Initial deployment"
    )
    
    # Generate system report
    report = registry.get_system_version_report()
    print(json.dumps(report, indent=2))
