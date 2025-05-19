"""
Test suite for Repository Hygiene Validator component of Phase 5.5.

This module contains comprehensive tests for the repository_hygiene_validator.py
implementation, ensuring proper repository hygiene and contract tethering.

This component implements Phase 5.5 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.5
Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import unittest
import json
import uuid
import os
import sys
from datetime import datetime
from unittest.mock import patch, MagicMock

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.utils.repository_hygiene_validator import RepositoryHygieneValidator
from src.core.common.schema_validator import SchemaValidator

class TestRepositoryHygieneValidator(unittest.TestCase):
    """Test cases for the RepositoryHygieneValidator class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with mock dependencies
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            self.schema_validator = SchemaValidator(skip_tether_check=True)
            self.hygiene_validator = RepositoryHygieneValidator(self.schema_validator)
        
        # Test data
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        self.repo_path = "/tmp/test_repo"
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            hygiene_validator = RepositoryHygieneValidator(self.schema_validator)
            self.assertIsNotNone(hygiene_validator)
        
    def test_init_without_schema_validator(self):
        """Test initialization without schema validator."""
        with self.assertRaises(ValueError):
            RepositoryHygieneValidator(None)
            
    def test_validate_repository_structure(self):
        """Test validating repository structure."""
        # Mock the file system operations
        with patch('os.path.exists', return_value=True), \
             patch('os.path.isdir', return_value=True), \
             patch('os.listdir', return_value=['.codex.lock', 'schemas', 'src']):
            
            result = self.hygiene_validator.validate_repository_structure(self.repo_path)
            
            # Verify validation result
            self.assertTrue(result["valid"])
            self.assertEqual(result["phase_id"], "5.5")
            self.assertEqual(result["codex_clauses"], ["5.5", "5.4", "11.0", "11.1", "5.2.5"])
            self.assertIn("timestamp", result)
            
    def test_validate_codex_lock(self):
        """Test validating .codex.lock file."""
        # Mock the file operations
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
        with patch('os.path.exists', return_value=True), \
             patch('builtins.open', unittest.mock.mock_open(read_data=mock_codex_content)):
            
            result = self.hygiene_validator.validate_codex_lock(self.repo_path)
            
            # Verify validation result
            self.assertTrue(result["valid"])
            self.assertEqual(result["phase_id"], "5.5")
            self.assertEqual(result["contract_version"], "v2025.05.18")
            self.assertIn("timestamp", result)
            
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should not raise an exception
        with patch('schema_validator.SchemaValidator._perform_tether_check'):
            self.hygiene_validator._codex_tether_check()
        
if __name__ == '__main__':
    unittest.main()
