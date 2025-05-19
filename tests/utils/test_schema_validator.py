"""
Enhanced SchemaValidator for testing purposes.

This module provides a modified version of the SchemaValidator that can be used
in test environments without requiring actual schema files.

Codex Contract: v2025.05.18
Phase ID: 5.2.6.2
Clauses: 5.2.6, 5.2.5, 11.0
"""

import os
import json
import jsonschema
from datetime import datetime
from unittest.mock import MagicMock

class TestSchemaValidator:
    """
    Mock SchemaValidator for testing purposes.
    
    This class provides a test-friendly version of the SchemaValidator that doesn't
    require actual schema files to be present.
    """
    
    def __init__(self, schema_dir=None, skip_tether_check=True):
        """
        Initialize the test schema validator.
        
        Args:
            schema_dir: Directory containing schema files (ignored in mock)
            skip_tether_check: Whether to skip the tether check
        """
        self.schema_dir = schema_dir or "/home/ubuntu/promethios/schemas"
        self.schemas = {}
        self.phase_id = "5.5"
        self.codex_clauses = ["5.5", "5.4", "11.0", "11.1", "5.2.5"]
        
        # Create mock schemas for testing
        self._create_mock_schemas()
        
    def _create_mock_schemas(self):
        """
        Create mock schemas for testing purposes.
        """
        # Create minimal schemas for testing
        self.schemas["governance_contract_sync"] = {"type": "object"}
        self.schemas["governance_proposal"] = {"type": "object"}
        self.schemas["mesh_topology"] = {"type": "object"}
        self.schemas["governance_mesh"] = {"type": "object"}
        
    def _perform_tether_check(self):
        """
        Mock tether check that always passes.
        """
        return True
        
    def validate_object(self, obj, schema_type):
        """
        Validate an object against a schema.
        
        Args:
            obj: Object to validate
            schema_type: Type of schema to validate against
            
        Returns:
            Dict with validation results
        """
        if schema_type not in self.schemas:
            return {
                "valid": False,
                "error": f"Schema not found: {schema_type}",
                "phase_id": self.phase_id,
                "codex_clauses": self.codex_clauses,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
        # For testing, always return valid
        return {
            "valid": True,
            "phase_id": self.phase_id,
            "codex_clauses": self.codex_clauses,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
            
    def validate_governance_contract_sync(self, sync_data):
        """
        Validate governance contract sync data.
        
        Args:
            sync_data: Contract sync data to validate
            
        Returns:
            Dict with validation results
        """
        return self.validate_object(sync_data, "governance_contract_sync")
        
    def validate_governance_proposal(self, proposal):
        """
        Validate governance proposal data.
        
        Args:
            proposal: Proposal data to validate
            
        Returns:
            Dict with validation results
        """
        return self.validate_object(proposal, "governance_proposal")
        
    def validate_mesh_topology(self, topology):
        """
        Validate mesh topology data.
        
        Args:
            topology: Topology data to validate
            
        Returns:
            Dict with validation results
        """
        return self.validate_object(topology, "mesh_topology")
        
    def validate_governance_mesh(self, mesh_state):
        """
        Validate governance mesh state.
        
        Args:
            mesh_state: Mesh state data to validate
            
        Returns:
            Dict with validation results
        """
        return self.validate_object(mesh_state, "governance_mesh")
