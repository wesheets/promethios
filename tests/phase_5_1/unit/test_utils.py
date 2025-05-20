"""
Test utilities for Phase 5.1 tests.

This module provides utility functions for setting up test environments
with proper mocking of the Codex tether check.

This component implements Phase 5.1 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.1
Clauses: 5.1, 5.2.5
"""

import os
import json
import tempfile
from unittest.mock import patch, MagicMock
import pytest

@pytest.mark.phase_5_1
def setup_test_environment():
    """
    Set up a test environment with a mock .codex.lock file.
    
    Returns:
        Tuple of (temp_dir, mock_codex_lock_path)
    """
    # Create a temporary directory for tests
    temp_dir = tempfile.mkdtemp()
    
    # Create a mock .codex.lock file
    mock_codex_lock_path = os.path.join(temp_dir, '.codex.lock')
    mock_codex_content = """This file signifies that the codebase is tethered to the Codex Contract.
Contract Version: v2025.05.18

Phase 5.1 Core Functionality Entry:
{
  "5.1": {
    "title": "Core Functionality",
    "description": "Basic utilities and repository hygiene validation",
    "scope": "core",
    "clauses": ["5.1", "5.2.5"],
    "sealed": true
  }
}
"""
    
    with open(mock_codex_lock_path, 'w') as f:
        f.write(mock_codex_content)
    
    # Create schemas directory
    os.makedirs(os.path.join(temp_dir, 'schemas'), exist_ok=True)
    
    return temp_dir, mock_codex_lock_path

@pytest.mark.phase_5_1
def mock_schema_validator():
    """
    Create a mock SchemaValidator that skips the tether check.
    
    Returns:
        Mock SchemaValidator
    """
    mock_validator = MagicMock()
    mock_validator.validate_object.return_value = {"valid": True, "schema_name": "test_schema", "timestamp": "2025-05-19T00:00:00Z"}
    
    return mock_validator

@pytest.mark.phase_5_1
def patch_codex_tether_check():
    """
    Create a patch decorator for the Codex tether check.
    
    Returns:
        Patch decorator
    """
    return patch('schema_validator.SchemaValidator._perform_tether_check', return_value=None)
