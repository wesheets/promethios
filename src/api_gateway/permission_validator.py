"""
API Gateway Integration - Permission Validator

This module provides permission validation functionality for API gateway integration.
"""

import logging
import re
from typing import Dict, List, Optional, Any, Union, Set

from src.access_tier.exceptions import AccessDeniedError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PermissionValidator:
    """
    Permission validator for API requests.
    
    This class provides functionality for:
    - Validating user permissions against endpoints
    - Supporting wildcard permissions
    - Handling permission inheritance
    """
    
    def __init__(self):
        """Initialize the permission validator."""
        # Cache for compiled regex patterns
        self._pattern_cache = {}
        
        logger.info("Initialized permission validator")
    
    def validate_permission(self, permissions: List[str], method: str, endpoint: str) -> bool:
        """
        Validate if a set of permissions grants access to an endpoint.
        
        Args:
            permissions: List of permission strings
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            
        Returns:
            bool: True if access is allowed, False otherwise
            
        Raises:
            AccessDeniedError: If access is denied
        """
        # Normalize method to lowercase
        method = method.lower()
        
        # Check for wildcard permission
        if "*" in permissions or "*:*" in permissions:
            return True
        
        # Check for method wildcard
        if f"*:{endpoint}" in permissions:
            return True
        
        # Check for exact match
        if f"{method}:{endpoint}" in permissions:
            return True
        
        # Check for path wildcards
        for permission in permissions:
            if ":" not in permission:
                continue
            
            perm_method, perm_path = permission.split(":", 1)
            
            # Skip if method doesn't match and isn't wildcard
            if perm_method != "*" and perm_method.lower() != method:
                continue
            
            # Check if path matches wildcard pattern
            if self._match_wildcard_path(perm_path, endpoint):
                return True
        
        # If we get here, access is denied
        raise AccessDeniedError("user", f"{method}:{endpoint}", "Insufficient permissions")
    
    def _match_wildcard_path(self, pattern: str, path: str) -> bool:
        """
        Match a path against a wildcard pattern.
        
        Args:
            pattern: The wildcard pattern (e.g., "/api/v1/*")
            path: The path to check (e.g., "/api/v1/users")
            
        Returns:
            bool: True if the path matches the pattern, False otherwise
        """
        # Handle simple wildcard
        if pattern == "*":
            return True
        
        # Handle exact match
        if pattern == path:
            return True
        
        # Handle trailing wildcard
        if pattern.endswith("*") and path.startswith(pattern[:-1]):
            return True
        
        # Handle more complex patterns with wildcards in the middle
        if "*" in pattern:
            # Convert pattern to regex if not already cached
            if pattern not in self._pattern_cache:
                regex_pattern = "^" + re.escape(pattern).replace("\\*", ".*") + "$"
                self._pattern_cache[pattern] = re.compile(regex_pattern)
            
            # Match against regex
            return bool(self._pattern_cache[pattern].match(path))
        
        return False
    
    def get_accessible_endpoints(self, permissions: List[str], available_endpoints: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Get a list of endpoints that a user can access based on their permissions.
        
        Args:
            permissions: List of permission strings
            available_endpoints: List of available endpoints with method and path
            
        Returns:
            List[Dict[str, str]]: List of accessible endpoints
        """
        accessible = []
        
        # Check for wildcard permission
        if "*" in permissions or "*:*" in permissions:
            return available_endpoints
        
        for endpoint in available_endpoints:
            method = endpoint["method"].lower()
            path = endpoint["path"]
            
            try:
                if self.validate_permission(permissions, method, path):
                    accessible.append(endpoint)
            except AccessDeniedError:
                # Skip endpoints that are not accessible
                pass
        
        return accessible
    
    def group_permissions_by_resource(self, permissions: List[str]) -> Dict[str, Set[str]]:
        """
        Group permissions by resource for easier analysis.
        
        Args:
            permissions: List of permission strings
            
        Returns:
            Dict[str, Set[str]]: Permissions grouped by resource
        """
        grouped = {}
        
        for permission in permissions:
            if ":" not in permission:
                # Handle malformed permissions
                if "global" not in grouped:
                    grouped["global"] = set()
                grouped["global"].add(permission)
                continue
            
            method, path = permission.split(":", 1)
            
            # Extract resource from path
            parts = path.strip("/").split("/")
            resource = parts[0] if parts else "root"
            
            if resource not in grouped:
                grouped[resource] = set()
            
            grouped[resource].add(permission)
        
        return grouped
