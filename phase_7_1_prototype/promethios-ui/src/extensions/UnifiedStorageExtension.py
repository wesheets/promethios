"""
Unified Storage Extension for the Promethios System.

This module provides a unified storage abstraction layer that integrates with the
Extension Point Framework, enabling consistent storage patterns across all UI components
while maintaining backward compatibility and supporting multiple storage providers.
"""

import logging
from typing import Dict, Any, Optional, List, Union, Protocol, runtime_checkable
from datetime import datetime
import json

logger = logging.getLogger(__name__)

@runtime_checkable
class StorageProvider(Protocol):
    """Protocol defining the interface for storage providers."""
    
    async def get(self, key: str) -> Any:
        """Get a value by key."""
        ...
    
    async def set(self, key: str, value: Any) -> bool:
        """Set a value by key."""
        ...
    
    async def delete(self, key: str) -> bool:
        """Delete a value by key."""
        ...
    
    async def clear(self) -> bool:
        """Clear all values."""
        ...
    
    async def keys(self) -> List[str]:
        """Get all keys."""
        ...
    
    async def has(self, key: str) -> bool:
        """Check if key exists."""
        ...

class StoragePolicy:
    """Defines storage policies for data governance."""
    
    def __init__(
        self,
        ttl: Optional[int] = None,
        allowed_providers: Optional[List[str]] = None,
        forbidden_providers: Optional[List[str]] = None,
        encryption: Optional[str] = None,
        sync_strategy: str = 'immediate',
        conflict_resolution: str = 'client-wins',
        pii: bool = False,
        gdpr_category: str = 'functional',
        retention_period: Optional[int] = None
    ):
        self.ttl = ttl
        self.allowed_providers = allowed_providers or ['localStorage', 'firebase', 'indexedDB']
        self.forbidden_providers = forbidden_providers or []
        self.encryption = encryption
        self.sync_strategy = sync_strategy
        self.conflict_resolution = conflict_resolution
        self.pii = pii
        self.gdpr_category = gdpr_category
        self.retention_period = retention_period

class UnifiedStorageExtension:
    """
    Unified Storage Extension for the Promethios System.
    
    This extension provides a unified storage abstraction layer that integrates
    with the Extension Point Framework and supports multiple storage providers.
    """
    
    def __init__(self, extension_point_framework):
        """
        Initialize the unified storage extension.
        
        Args:
            extension_point_framework: The extension point framework instance.
        """
        self.extension_point_framework = extension_point_framework
        self.extension_id = "core.storage.unified"
        self.providers: Dict[str, StorageProvider] = {}
        self.policies: Dict[str, StoragePolicy] = {}
        self.namespaces: Dict[str, Dict[str, Any]] = {}
        
        # Initialize default policies
        self._initialize_default_policies()
    
    def _initialize_default_policies(self):
        """Initialize default storage policies for Promethios data types."""
        
        # User authentication data - Firebase only, encrypted
        self.policies['user.auth.*'] = StoragePolicy(
            allowed_providers=['firebase'],
            encryption='both',
            sync_strategy='immediate',
            gdpr_category='essential',
            retention_period=365 * 24 * 60 * 60 * 1000  # 1 year
        )
        
        # Observer Agent data - Critical for session persistence
        self.policies['observer.*'] = StoragePolicy(
            allowed_providers=['localStorage', 'firebase'],
            sync_strategy='immediate',
            conflict_resolution='server-wins',  # Server has latest AI state
            retention_period=90 * 24 * 60 * 60 * 1000  # 90 days
        )
        
        # Governance notifications - Batched sync, encrypted at rest
        self.policies['notifications.governance.*'] = StoragePolicy(
            allowed_providers=['localStorage', 'firebase'],
            ttl=30 * 24 * 60 * 60 * 1000,  # 30 days
            sync_strategy='batched',
            encryption='at-rest'
        )
        
        # User preferences - Immediate sync, client wins
        self.policies['user.preferences.*'] = StoragePolicy(
            allowed_providers=['localStorage', 'firebase'],
            sync_strategy='immediate',
            conflict_resolution='client-wins',
            gdpr_category='functional'
        )
        
        # UI state - Local only, no sync needed
        self.policies['ui.*'] = StoragePolicy(
            allowed_providers=['localStorage', 'memory'],
            forbidden_providers=['firebase'],
            sync_strategy='never'
        )
        
        # Agent configurations - Immediate sync, important data
        self.policies['agents.*'] = StoragePolicy(
            allowed_providers=['localStorage', 'firebase'],
            sync_strategy='immediate',
            conflict_resolution='merge',
            retention_period=180 * 24 * 60 * 60 * 1000  # 6 months
        )
        
        # Governance data - Firebase only, encrypted, long retention
        self.policies['governance.*'] = StoragePolicy(
            allowed_providers=['firebase'],
            forbidden_providers=['localStorage'],
            encryption='both',
            sync_strategy='immediate',
            retention_period=7 * 365 * 24 * 60 * 60 * 1000  # 7 years (compliance)
        )
        
        # Trust metrics - Firebase preferred, encrypted
        self.policies['trust.*'] = StoragePolicy(
            allowed_providers=['firebase', 'localStorage'],
            encryption='at-rest',
            sync_strategy='immediate',
            retention_period=365 * 24 * 60 * 60 * 1000  # 1 year
        )
        
        # Cache data - Local only, short TTL
        self.policies['cache.*'] = StoragePolicy(
            allowed_providers=['indexedDB', 'memory'],
            forbidden_providers=['firebase'],
            ttl=60 * 60 * 1000,  # 1 hour
            sync_strategy='never'
        )
    
    def register_provider(self, name: str, provider: StorageProvider) -> bool:
        """
        Register a storage provider.
        
        Args:
            name: Name of the provider (e.g., 'localStorage', 'firebase').
            provider: The provider instance.
            
        Returns:
            True if registration was successful.
        """
        self.providers[name] = provider
        logger.info(f"Registered storage provider: {name}")
        return True
    
    def get_policy_for_key(self, key: str) -> StoragePolicy:
        """
        Get the storage policy for a given key.
        
        Args:
            key: The storage key.
            
        Returns:
            The applicable storage policy.
        """
        # Check for exact match first
        if key in self.policies:
            return self.policies[key]
        
        # Check for wildcard matches
        for pattern, policy in self.policies.items():
            if pattern.endswith('*'):
                prefix = pattern[:-1]
                if key.startswith(prefix):
                    return policy
        
        # Return default policy
        return StoragePolicy()
    
    def select_provider(self, policy: StoragePolicy) -> Optional[StorageProvider]:
        """
        Select the best available provider based on policy.
        
        Args:
            policy: The storage policy.
            
        Returns:
            The selected provider, or None if none available.
        """
        allowed = policy.allowed_providers
        forbidden = policy.forbidden_providers
        
        candidates = [p for p in allowed if p not in forbidden and p in self.providers]
        
        if not candidates:
            logger.warning(f"No available providers for policy: {policy}")
            return None
        
        # Smart provider selection based on policy
        if policy.encryption == 'at-rest' and 'firebase' in candidates:
            return self.providers['firebase']  # Firebase handles encryption
        
        if policy.sync_strategy == 'never' and 'localStorage' in candidates:
            return self.providers['localStorage']  # Local only
        
        if policy.sync_strategy == 'immediate' and 'firebase' in candidates:
            return self.providers['firebase']  # Firebase for real-time sync
        
        # Default to first available
        return self.providers[candidates[0]]
    
    async def get(self, key: str) -> Any:
        """
        Get a value by key using the appropriate provider.
        
        Args:
            key: The storage key.
            
        Returns:
            The stored value, or None if not found.
        """
        policy = self.get_policy_for_key(key)
        provider = self.select_provider(policy)
        
        if not provider:
            logger.error(f"No provider available for key: {key}")
            return None
        
        try:
            return await provider.get(key)
        except Exception as e:
            logger.error(f"Error getting key {key}: {e}")
            
            # Try fallback providers
            for provider_name in policy.allowed_providers:
                if provider_name in self.providers and provider_name not in policy.forbidden_providers:
                    try:
                        fallback_provider = self.providers[provider_name]
                        if fallback_provider != provider:
                            return await fallback_provider.get(key)
                    except Exception as fallback_error:
                        logger.warning(f"Fallback provider {provider_name} also failed: {fallback_error}")
                        continue
            
            return None
    
    async def set(self, key: str, value: Any) -> bool:
        """
        Set a value by key using the appropriate provider.
        
        Args:
            key: The storage key.
            value: The value to store.
            
        Returns:
            True if successful.
        """
        policy = self.get_policy_for_key(key)
        provider = self.select_provider(policy)
        
        if not provider:
            logger.error(f"No provider available for key: {key}")
            return False
        
        try:
            # Apply encryption if required
            processed_value = value
            if policy.encryption:
                # TODO: Implement encryption
                processed_value = value
            
            result = await provider.set(key, processed_value)
            
            # Schedule TTL expiration if needed
            if policy.ttl:
                # TODO: Implement TTL scheduling
                pass
            
            return result
            
        except Exception as e:
            logger.error(f"Error setting key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete a value by key.
        
        Args:
            key: The storage key.
            
        Returns:
            True if successful.
        """
        policy = self.get_policy_for_key(key)
        provider = self.select_provider(policy)
        
        if not provider:
            logger.error(f"No provider available for key: {key}")
            return False
        
        try:
            return await provider.delete(key)
        except Exception as e:
            logger.error(f"Error deleting key {key}: {e}")
            return False
    
    async def get_namespace(self, namespace: str) -> Dict[str, Any]:
        """
        Get all values in a namespace.
        
        Args:
            namespace: The namespace (e.g., 'user', 'observer').
            
        Returns:
            Dictionary of all values in the namespace.
        """
        policy = self.get_policy_for_key(f"{namespace}.*")
        provider = self.select_provider(policy)
        
        if not provider:
            logger.error(f"No provider available for namespace: {namespace}")
            return {}
        
        try:
            all_keys = await provider.keys()
            namespace_keys = [k for k in all_keys if k.startswith(f"{namespace}.")]
            
            result = {}
            for key in namespace_keys:
                value = await provider.get(key)
                if value is not None:
                    result[key] = value
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting namespace {namespace}: {e}")
            return {}
    
    async def clear_namespace(self, namespace: str) -> bool:
        """
        Clear all values in a namespace.
        
        Args:
            namespace: The namespace to clear.
            
        Returns:
            True if successful.
        """
        policy = self.get_policy_for_key(f"{namespace}.*")
        provider = self.select_provider(policy)
        
        if not provider:
            logger.error(f"No provider available for namespace: {namespace}")
            return False
        
        try:
            all_keys = await provider.keys()
            namespace_keys = [k for k in all_keys if k.startswith(f"{namespace}.")]
            
            for key in namespace_keys:
                await provider.delete(key)
            
            return True
            
        except Exception as e:
            logger.error(f"Error clearing namespace {namespace}: {e}")
            return False
    
    def register(self) -> bool:
        """
        Register the unified storage extension with the Extension Point Framework.
        
        Returns:
            True if registration was successful.
        """
        # Extension point data for storage provider registration
        storage_provider_extension_point = {
            "extension_point_id": "core.storage.provider.registration",
            "name": "Storage Provider Registration",
            "description": "Extension point for registering storage providers",
            "input_schema": {
                "type": "object",
                "properties": {
                    "provider_name": {"type": "string"},
                    "provider_instance": {"type": "object"},
                    "capabilities": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["provider_name", "provider_instance"]
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"}
                }
            },
            "owner_module_id": self.extension_id,
            "metadata": {
                "category": "storage",
                "tags": ["storage", "provider", "registration"]
            }
        }
        
        # Extension point data for namespace management
        namespace_management_extension_point = {
            "extension_point_id": "core.storage.namespace.management",
            "name": "Storage Namespace Management",
            "description": "Extension point for managing storage namespaces",
            "input_schema": {
                "type": "object",
                "properties": {
                    "namespace": {"type": "string"},
                    "operation": {"type": "string", "enum": ["get", "set", "clear", "list"]},
                    "data": {"type": "object"}
                },
                "required": ["namespace", "operation"]
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "data": {"type": "object"},
                    "message": {"type": "string"}
                }
            },
            "owner_module_id": self.extension_id,
            "metadata": {
                "category": "storage",
                "tags": ["storage", "namespace", "management"]
            }
        }
        
        try:
            # Register extension points
            self.extension_point_framework.register_extension_point(storage_provider_extension_point)
            self.extension_point_framework.register_extension_point(namespace_management_extension_point)
            
            logger.info(f"Successfully registered unified storage extension: {self.extension_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to register unified storage extension: {e}")
            return False

