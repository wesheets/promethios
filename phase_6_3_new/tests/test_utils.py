"""
Test utilities for Phase 5.5 tests.

This module provides utility functions for setting up test environments
with proper mocking of the Codex tether check.

This component implements Phase 5.5 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.5
Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import os
import json
import tempfile
from unittest.mock import patch, MagicMock

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

Phase 5.5 Governance Entry:
{
  "5.5": {
    "title": "Governance Mesh Integration",
    "description": "Synchronize contract states, policy proposals, and attestation boundaries across Promethios kernels",
    "scope": "multi-node",
    "schemas": [
      "governance_contract_sync.schema.v1.json",
      "governance_proposal.schema.v1.json",
      "governance_mesh_topology.schema.v1.json"
    ],
    "clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"],
    "dependencies": ["5.4", "11.0", "11.1"],
    "sealed": true
  }
}
"""
    
    with open(mock_codex_lock_path, 'w') as f:
        f.write(mock_codex_content)
    
    # Create schemas directory
    os.makedirs(os.path.join(temp_dir, 'schemas'), exist_ok=True)
    
    return temp_dir, mock_codex_lock_path

def mock_schema_validator():
    """
    Create a mock SchemaValidator that skips the tether check.
    
    Returns:
        Mock SchemaValidator
    """
    mock_validator = MagicMock()
    mock_validator.validate_object.return_value = {"valid": True, "schema_name": "test_schema", "timestamp": "2025-05-19T00:00:00Z"}
    mock_validator.validate_contract_sync.return_value = {"valid": True, "schema_name": "governance_contract_sync", "timestamp": "2025-05-19T00:00:00Z"}
    mock_validator.validate_governance_proposal.return_value = {"valid": True, "schema_name": "governance_proposal", "timestamp": "2025-05-19T00:00:00Z"}
    mock_validator.validate_mesh_topology.return_value = {"valid": True, "schema_name": "mesh_topology", "timestamp": "2025-05-19T00:00:00Z"}
    
    return mock_validator

def patch_codex_tether_check():
    """
    Create a patch decorator for the Codex tether check.
    
    Returns:
        Patch decorator
    """
    return patch('schema_validator.SchemaValidator._perform_tether_check', return_value=None)
