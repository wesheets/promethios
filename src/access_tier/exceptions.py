"""
Access Tier Management System - Exceptions

This module defines exceptions used by the Access Tier Management System.
"""

class AccessTierError(Exception):
    """Base exception for all Access Tier Management System errors."""
    pass


class TierNotFoundError(AccessTierError):
    """Exception raised when a requested tier is not found."""
    
    def __init__(self, tier_id: str):
        self.tier_id = tier_id
        super().__init__(f"Tier not found: {tier_id}")


class TierAlreadyExistsError(AccessTierError):
    """Exception raised when attempting to register a tier that already exists."""
    
    def __init__(self, tier_id: str):
        self.tier_id = tier_id
        super().__init__(f"Tier already exists: {tier_id}")


class InvalidTierError(AccessTierError):
    """Exception raised when a tier definition is invalid."""
    pass


class AccessDeniedError(AccessTierError):
    """Exception raised when access to a resource is denied."""
    
    def __init__(self, user_id: str, resource: str, reason: str = "insufficient permissions"):
        self.user_id = user_id
        self.resource = resource
        self.reason = reason
        super().__init__(f"Access denied for user {user_id} to resource {resource}: {reason}")


class RateLimitExceededError(AccessTierError):
    """Exception raised when a user exceeds their rate limit."""
    
    def __init__(self, user_id: str, limit_type: str):
        self.user_id = user_id
        self.limit_type = limit_type
        super().__init__(f"Rate limit exceeded for user {user_id}: {limit_type}")


class ConfigurationError(AccessTierError):
    """Exception raised for configuration errors."""
    pass


class PersistenceError(AccessTierError):
    """Exception raised for persistence layer errors."""
    pass


# Aliases for compatibility with test suite
TierNotFoundException = TierNotFoundError

class InvalidTierConfigurationError(InvalidTierError):
    """Exception raised when a tier configuration is invalid."""
    
    def __init__(self, message: str = "Invalid tier configuration"):
        super().__init__(message)
