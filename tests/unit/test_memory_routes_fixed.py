"""
Update test_memory_routes.py to use compatibility layer.

This module contains tests for the memory API routes.
"""

import unittest
import json
from unittest.mock import patch, MagicMock

# Import the module to test using compatibility layer
# The compatibility layer in src/api/schema_validation/__init__.py makes this import work
from src.api.memory.routes import MemoryRouter, MemoryRecord, MemoryQuery, MemoryStats

# Rest of the test file remains unchanged
