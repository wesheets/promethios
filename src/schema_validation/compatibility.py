"""
Compatibility layer for the schema validation registry.

This module provides backward compatibility for code that imports from the old class names.
"""

import warnings
from src.schema_validation.registry import SchemaValidationRegistry

# Emit a deprecation warning
warnings.warn(
    "Importing from old class names is deprecated. Please update your imports to use SchemaValidationRegistry.",
    DeprecationWarning,
    stacklevel=2
)

# Create compatibility classes that inherit from the new framework
class SchemaRegistry(SchemaValidationRegistry):
    """Compatibility class for backward compatibility."""
    pass

class SchemaType:
    """Compatibility enum for backward compatibility."""
    INPUT = "input"
    OUTPUT = "output"
    MEMORY = "memory"
    CONFIG = "config"
    EVENT = "event"

class SchemaVersion:
    """Compatibility class for backward compatibility."""
    def __init__(self, major, minor, patch=0):
        self.major = major
        self.minor = minor
        self.patch = patch
        
    def __str__(self):
        return f"{self.major}.{self.minor}.{self.patch}"

class ValidationResult:
    """Compatibility class for backward compatibility."""
    def __init__(self, is_valid, errors=None):
        self.is_valid = is_valid
        self.errors = errors or []
