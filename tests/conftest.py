"""
Pytest configuration for Promethios tests.

This module provides fixtures and configuration for all Promethios tests.
"""

import os
import sys
import pytest
from unittest.mock import patch

# We don't use a global mock for schema validation
# This allows individual tests to control validation behavior
