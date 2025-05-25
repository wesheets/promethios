"""
Compatibility layer for the compliance mapping framework.

This module provides backward compatibility for code that imports from the old class names.
"""

import warnings
from .framework import ComplianceMappingFramework

# Emit a deprecation warning
warnings.warn(
    "Importing from old class names is deprecated. Please update your imports to use ComplianceMappingFramework.",
    DeprecationWarning,
    stacklevel=2
)

# Create compatibility classes that inherit from the new framework
class ComplianceFramework(ComplianceMappingFramework):
    """Compatibility class for backward compatibility."""
    pass

class ComplianceStandard:
    """Compatibility class for backward compatibility."""
    def __init__(self, id, name, description, version, categories=None, controls=None):
        self.id = id
        self.name = name
        self.description = description
        self.version = version
        self.categories = categories or []
        self.controls = controls or []

class ComplianceControl:
    """Compatibility class for backward compatibility."""
    def __init__(self, id, name, description, category_id):
        self.id = id
        self.name = name
        self.description = description
        self.category_id = category_id

class ComplianceMapping:
    """Compatibility class for backward compatibility."""
    def __init__(self, id, name, description, mappings=None):
        self.id = id
        self.name = name
        self.description = description
        self.mappings = mappings or []

class ComplianceReport:
    """Compatibility class for backward compatibility."""
    def __init__(self, standard, version, controls=None, status=None):
        self.standard = standard
        self.version = version
        self.controls = controls or {}
        self.status = status or {}

class ComplianceStatus:
    """Compatibility enum for backward compatibility."""
    IMPLEMENTED = "implemented"
    PARTIAL = "partial"
    NOT_IMPLEMENTED = "not_implemented"
    NOT_APPLICABLE = "not_applicable"
