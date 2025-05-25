"""
Compatibility layer for governance vocabulary module.
This module provides backward compatibility for code that imports from old locations.
"""

import sys
import importlib.util
import warnings

# Emit a deprecation warning
warnings.warn(
    "Importing from old module paths is deprecated. Please update your imports to use the canonical paths.",
    DeprecationWarning,
    stacklevel=2
)

# Import from canonical location
from src.ui.governance_vocabulary import *
