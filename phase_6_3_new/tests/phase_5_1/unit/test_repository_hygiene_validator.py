"""
Test suite for Repository Hygiene Validator component of Phase 5.1.

This module contains comprehensive tests for the repository_hygiene_validator.py
implementation, ensuring proper repository hygiene and contract tethering.

This component implements Phase 5.1 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.1
Clauses: 5.1, 5.2.5
"""

import unittest
import json
import uuid
import os
import sys
from datetime import datetime
from unittest.mock import patch, MagicMock
import pytest

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the test schema validator - use the MockSchemaValidator instead of TestSchemaValidator
from tests.utils.test_schema_validator import MockSchemaValidator

# Import the module under test
from src.utils.repository_hygiene_validator import RepositoryHygieneValidator

@pytest.mark.phase_5_1
class TestRepositoryHygieneValidator(unittest.TestCase):
    """Test cases for the RepositoryHygieneValidator class."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with mock dependencies - use the factory method instead of constructor
        self.schema_validator = MockSchemaValidator.create(skip_tether_check=True)
        
        # Mock the repository path to use a test directory
        self.repo_path = "/tmp/test_repo"
        
        # Create the hygiene validator with the mock schema validator
        with patch('os.path.exists', return_value=True):
            self.hygiene_validator = RepositoryHygieneValidator(
                schema_validator=self.schema_validator,
                repo_root=self.repo_path
            )
        
        # Test data
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        
    def test_init_with_tether_check(self):
        """Test initialization with tether check."""
        # Should not raise an exception
        with patch('os.path.exists', return_value=True):
            hygiene_validator = RepositoryHygieneValidator(
                schema_validator=self.schema_validator,
                repo_root=self.repo_path
            )
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
            self.assertEqual(result["phase_id"], "5.5")  # Note: This is the phase ID from the implementation
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
    "description": "Integration with governance mesh",
    "scope": "core",
    "clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"],
    "sealed": true
  }
}
"""
        with patch('os.path.exists', return_value=True), \
             patch('builtins.open', unittest.mock.mock_open(read_data=mock_codex_content)):
            
            result = self.hygiene_validator.validate_codex_lock(self.repo_path)
            
            # Verify validation result
            self.assertTrue(result["valid"])
            self.assertEqual(result["phase_id"], "5.5")  # Note: This is the phase ID from the implementation
            self.assertEqual(result["contract_version"], "v2025.05.18")
            self.assertIn("timestamp", result)
            
    def test_codex_tether_check(self):
        """Test the Codex tether check."""
        # Should not raise an exception
        self.hygiene_validator._codex_tether_check()
        
if __name__ == '__main__':
    unittest.main()
