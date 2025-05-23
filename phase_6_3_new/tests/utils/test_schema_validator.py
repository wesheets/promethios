import unittest
import pytest
from datetime import datetime
from unittest.mock import MagicMock

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


# Create a fixture instead of a class with __init__ constructor
@pytest.fixture
def test_schema_validator():
    """
    Fixture providing a mock SchemaValidator for testing purposes.
    
    This fixture provides a test-friendly version of the SchemaValidator that doesn't
    require actual schema files to be present.
    """
    schema_dir = "/home/ubuntu/promethios/schemas"
    schemas = {}
    phase_id = "5.5"
    codex_clauses = ["5.5", "5.4", "11.0", "11.1", "5.2.5"]
    
    # Create minimal schemas for testing
    schemas["governance_contract_sync"] = {"type": "object"}
    schemas["governance_proposal"] = {"type": "object"}
    schemas["mesh_topology"] = {"type": "object"}
    schemas["governance_mesh"] = {"type": "object"}
    
    # Create a mock validator object with all the methods
    validator = MagicMock()
    validator.schema_dir = schema_dir
    validator.schemas = schemas
    validator.phase_id = phase_id
    validator.codex_clauses = codex_clauses
    
    # Define behavior for validate_object method
    def validate_object(obj, schema_type):
        if schema_type not in schemas:
            return {
                "valid": False,
                "error": f"Schema not found: {schema_type}",
                "phase_id": phase_id,
                "codex_clauses": codex_clauses,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
        # For testing, always return valid
        return {
            "valid": True,
            "phase_id": phase_id,
            "codex_clauses": codex_clauses,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    validator.validate_object.side_effect = validate_object
    
    # Define behavior for specific validation methods
    def validate_governance_contract_sync(sync_data):
        return validate_object(sync_data, "governance_contract_sync")
    
    def validate_governance_proposal(proposal):
        return validate_object(proposal, "governance_proposal")
    
    def validate_mesh_topology(topology):
        return validate_object(topology, "mesh_topology")
    
    def validate_governance_mesh(mesh_state):
        return validate_object(mesh_state, "governance_mesh")
    
    validator.validate_governance_contract_sync.side_effect = validate_governance_contract_sync
    validator.validate_governance_proposal.side_effect = validate_governance_proposal
    validator.validate_mesh_topology.side_effect = validate_mesh_topology
    validator.validate_governance_mesh.side_effect = validate_governance_mesh
    
    return validator


# For backward compatibility with existing tests
class MockSchemaValidator:
    """
    Helper class for tests that expect a class-based validator.
    This avoids the __init__ constructor issue with pytest collection.
    """
    @staticmethod
    def create(schema_dir=None, skip_tether_check=True):
        """Factory method to create a validator without using __init__"""
        validator = MagicMock()
        validator.schema_dir = schema_dir or "/home/ubuntu/promethios/schemas"
        validator.schemas = {
            "governance_contract_sync": {"type": "object"},
            "governance_proposal": {"type": "object"},
            "mesh_topology": {"type": "object"},
            "governance_mesh": {"type": "object"}
        }
        validator.phase_id = "5.5"
        validator.codex_clauses = ["5.5", "5.4", "11.0", "11.1", "5.2.5"]
        
        # Define validation methods
        def validate_object(obj, schema_type):
            return {
                "valid": True,
                "phase_id": validator.phase_id,
                "codex_clauses": validator.codex_clauses,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        
        validator.validate_object.side_effect = validate_object
        validator.validate_governance_contract_sync.return_value = validate_object(None, "governance_contract_sync")
        validator.validate_governance_proposal.return_value = validate_object(None, "governance_proposal")
        validator.validate_mesh_topology.return_value = validate_object(None, "mesh_topology")
        validator.validate_governance_mesh.return_value = validate_object(None, "governance_mesh")
        
        return validator
