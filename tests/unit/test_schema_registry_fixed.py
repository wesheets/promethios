"""
Update test_schema_registry.py to use compatibility layer.

This module contains tests for the schema validation registry system.
"""

import unittest
import os
import json
import tempfile
from unittest.mock import patch, MagicMock

# Import the module to test using compatibility layer
from src.schema_validation.compatibility import (
    SchemaRegistry,
    SchemaType,
    SchemaVersion,
    ValidationResult
)

# Rest of the test file remains unchanged
