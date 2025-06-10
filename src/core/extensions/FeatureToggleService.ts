"""
FeatureToggleService module for the Promethios extension system.

This module provides the FeatureToggleService class, which is responsible for
managing feature toggles and their dependencies in the Promethios system.
"""

from typing import Dict, List, Set, Any, Optional
import logging

# Set up logging
logger = logging.getLogger(__name__)

class FeatureToggleService:
    """
    Service for managing feature toggles in the Promethios system.
    
    The FeatureToggleService is responsible for:
    - Enabling and disabling features
    - Managing feature dependencies
    - Tracking feature state
    - Providing feature availability information
    """
    
    def __init__(self):
        """Initialize the FeatureToggleService."""
        self._enabled_features: Set[str] = set()
        self._feature_dependencies: Dict[str, List[str]] = {}
        self._dependent_features: Dict[str, List[str]] = {}
        logger.info("FeatureToggleService initialized")
    
    def enable_feature(self, feature_id: str) -> bool:
        """
        Enable a feature and its dependencies.
        
        Args:
            feature_id: The ID of the feature to enable.
            
        Returns:
            bool: True if the feature was enabled successfully, False otherwise.
        """
        # Check if feature is already enabled
        if feature_id in self._enabled_features:
            logger.info(f"Feature '{feature_id}' is already enabled")
            return True
        
        # Enable dependencies first
        if feature_id in self._feature_dependencies:
            for dependency in self._feature_dependencies[feature_id]:
                if not self.enable_feature(dependency):
                    logger.error(f"Failed to enable dependency '{dependency}' for feature '{feature_id}'")
                    return False
        
        # Enable the feature
        self._enabled_features.add(feature_id)
        logger.info(f"Feature '{feature_id}' enabled successfully")
        return True
    
    def disable_feature(self, feature_id: str) -> bool:
        """
        Disable a feature and its dependent features.
        
        Args:
            feature_id: The ID of the feature to disable.
            
        Returns:
            bool: True if the feature was disabled successfully, False otherwise.
        """
        # Check if feature is already disabled
        if feature_id not in self._enabled_features:
            logger.info(f"Feature '{feature_id}' is already disabled")
            return True
        
        # Disable dependent features first
        if feature_id in self._dependent_features:
            for dependent in self._dependent_features[feature_id]:
                if not self.disable_feature(dependent):
                    logger.error(f"Failed to disable dependent feature '{dependent}' for feature '{feature_id}'")
                    return False
        
        # Disable the feature
        self._enabled_features.discard(feature_id)
        logger.info(f"Feature '{feature_id}' disabled successfully")
        return True
    
    def is_feature_enabled(self, feature_id: str) -> bool:
        """
        Check if a feature is enabled.
        
        Args:
            feature_id: The ID of the feature to check.
            
        Returns:
            bool: True if the feature is enabled, False otherwise.
        """
        return feature_id in self._enabled_features
    
    def set_feature_dependencies(self, feature_id: str, dependencies: List[str]) -> bool:
        """
        Set dependencies for a feature.
        
        Args:
            feature_id: The ID of the feature to set dependencies for.
            dependencies: A list of feature IDs that this feature depends on.
            
        Returns:
            bool: True if dependencies were set successfully, False otherwise.
        """
        # Check for circular dependencies
        if self._would_create_circular_dependency(feature_id, dependencies):
            logger.error(f"Setting dependencies for feature '{feature_id}' would create a circular dependency")
            return False
        
        # Update dependencies
        self._feature_dependencies[feature_id] = dependencies
        
        # Update dependent features
        for dependency in dependencies:
            if dependency not in self._dependent_features:
                self._dependent_features[dependency] = []
            
            if feature_id not in self._dependent_features[dependency]:
                self._dependent_features[dependency].append(feature_id)
        
        logger.info(f"Dependencies for feature '{feature_id}' set successfully")
        return True
    
    def get_feature_dependencies(self, feature_id: str) -> List[str]:
        """
        Get dependencies for a feature.
        
        Args:
            feature_id: The ID of the feature to get dependencies for.
            
        Returns:
            List[str]: A list of feature IDs that this feature depends on.
        """
        return self._feature_dependencies.get(feature_id, [])
    
    def get_dependent_features(self, feature_id: str) -> List[str]:
        """
        Get features that depend on a feature.
        
        Args:
            feature_id: The ID of the feature to get dependents for.
            
        Returns:
            List[str]: A list of feature IDs that depend on this feature.
        """
        return self._dependent_features.get(feature_id, [])
    
    def get_all_enabled_features(self) -> List[str]:
        """
        Get a list of all enabled features.
        
        Returns:
            List[str]: A list of enabled feature IDs.
        """
        return list(self._enabled_features)
    
    def _would_create_circular_dependency(self, feature_id: str, dependencies: List[str]) -> bool:
        """
        Check if setting dependencies would create a circular dependency.
        
        Args:
            feature_id: The ID of the feature to set dependencies for.
            dependencies: A list of feature IDs that this feature would depend on.
            
        Returns:
            bool: True if a circular dependency would be created, False otherwise.
        """
        # If feature_id is in dependencies, it's a direct circular dependency
        if feature_id in dependencies:
            return True
        
        # Check for indirect circular dependencies
        visited = set()
        
        def has_cycle(fid):
            if fid in visited:
                return False
            
            visited.add(fid)
            
            # Use existing dependencies for features other than the one being updated
            deps = dependencies if fid == feature_id else self._feature_dependencies.get(fid, [])
            
            for dep in deps:
                if dep == feature_id or has_cycle(dep):
                    return True
            
            return False
        
        for dependency in dependencies:
            if has_cycle(dependency):
                return True
        
        return False
