"""
Integration tests for Phase 5.6 Distributed Trust Surface Implementation.

This module contains integration tests for the Phase 5.6 components,
ensuring they work together properly to implement the distributed trust surface.

This test suite implements Phase 5.6 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import unittest
import json
import uuid
import os
import sys
import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

# Import modules to be tested
from src.core.trust.trust_boundary_manager import TrustBoundaryManager
from src.core.trust.trust_surface_protocol import TrustSurfaceProtocol
from src.core.trust.attestation_service import AttestationService
from src.core.trust.trust_propagation_engine import TrustPropagationEngine
from src.core.trust.boundary_enforcement_module import BoundaryEnforcementModule
from src.core.common.schema_validator import SchemaValidator

@pytest.mark.phase_5_6
class TestDistributedTrustSurfaceIntegration(unittest.TestCase):
    """Integration tests for the Distributed Trust Surface components."""

    def setUp(self):
        """Set up test environment before each test."""
        # Initialize with real dependencies
        self.schema_validator = SchemaValidator(schema_dir="schemas")
        
        # Initialize all components
        self.trust_boundary_manager = TrustBoundaryManager(self.schema_validator)
        self.trust_surface_protocol = TrustSurfaceProtocol(self.schema_validator)
        self.attestation_service = AttestationService(self.schema_validator)
        self.trust_propagation_engine = TrustPropagationEngine(self.schema_validator)
        self.boundary_enforcement = BoundaryEnforcementModule(self.schema_validator)
        
        # Test data
        self.node_id = str(uuid.uuid4())
        self.resource_id = str(uuid.uuid4())
        self.requester_id = str(uuid.uuid4())
        
    def test_end_to_end_trust_surface_creation_and_enforcement(self):
        """Test end-to-end flow from boundary creation to enforcement."""
        # 1. Create trust boundaries
        boundary1 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "internal",
            ["data_access", "api_access"],
            {"sensitivity": "high"}
        )
        
        boundary2 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "external",
            ["data_access"],
            {"sensitivity": "medium"}
        )
        
        # 2. Create trust surface from boundaries
        surface = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [boundary1["boundary_id"], boundary2["boundary_id"]],
            "composite",
            {"visibility": "restricted"}
        )
        
        # 3. Create attestation for the surface
        attestation = self.attestation_service.create_attestation(
            self.node_id,
            surface["surface_id"],
            "trust_surface_validation",
            {"confidence_score": 0.95}
        )
        
        # 4. Verify attestation
        attestation_valid = self.attestation_service.verify_attestation(attestation)
        self.assertTrue(attestation_valid)
        
        # 5. Propagate trust to other nodes
        target_node_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
        propagation = self.trust_propagation_engine.propagate_trust(
            self.node_id,
            surface["surface_id"],
            target_node_ids,
            "transitive",
            {"trust_level": "high"}
        )
        
        # 6. Create enforcement policy for first boundary
        policy = self.boundary_enforcement.create_enforcement_policy(
            boundary1["boundary_id"],
            "strict",
            ["read", "write"],
            {"auto_remediate": True}
        )
        
        # 7. Test enforcement - allowed action
        result1 = self.boundary_enforcement.enforce_boundary(
            policy["policy_id"],
            self.resource_id,
            "read",
            self.requester_id
        )
        
        # 8. Test enforcement - denied action
        result2 = self.boundary_enforcement.enforce_boundary(
            policy["policy_id"],
            self.resource_id,
            "execute",
            self.requester_id
        )
        
        # Verify the entire flow
        self.assertTrue(attestation_valid)
        self.assertEqual(propagation["status"], "complete")
        self.assertTrue(result1["access_granted"])
        self.assertFalse(result2["access_granted"])
        
    def test_trust_chain_with_multiple_attestations(self):
        """Test creating a chain of trust with multiple attestations."""
        # 1. Create trust boundary
        boundary = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "internal",
            ["data_access", "api_access"],
            {"sensitivity": "high"}
        )
        
        # 2. Create trust surface
        surface = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [boundary["boundary_id"]],
            "standard",
            {"visibility": "public"}
        )
        
        # 3. Create base attestation
        base_attestation = self.attestation_service.create_attestation(
            self.node_id,
            surface["surface_id"],
            "trust_surface_validation",
            {"confidence_score": 0.95}
        )
        
        # 4. Create second node attestation that validates the first
        second_node_id = str(uuid.uuid4())
        second_attestation = self.attestation_service.create_attestation(
            second_node_id,
            surface["surface_id"],
            "attestation_validation",
            {
                "confidence_score": 0.90,
                "validated_attestation_id": base_attestation["attestation_id"]
            }
        )
        
        # 5. Create third node attestation that validates the second
        third_node_id = str(uuid.uuid4())
        third_attestation = self.attestation_service.create_attestation(
            third_node_id,
            surface["surface_id"],
            "attestation_validation",
            {
                "confidence_score": 0.85,
                "validated_attestation_id": second_attestation["attestation_id"]
            }
        )
        
        # 6. Get the trust chain
        chain = self.attestation_service.get_trust_chain(third_attestation["attestation_id"])
        
        # Verify the chain
        self.assertEqual(len(chain), 3)
        self.assertEqual(chain[0]["attestation_id"], third_attestation["attestation_id"])
        self.assertEqual(chain[1]["attestation_id"], second_attestation["attestation_id"])
        self.assertEqual(chain[2]["attestation_id"], base_attestation["attestation_id"])
        
    def test_multi_surface_trust_propagation(self):
        """Test propagating trust across multiple surfaces."""
        # 1. Create multiple boundaries
        boundary1 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "internal",
            ["data_access"],
            {"sensitivity": "high"}
        )
        
        boundary2 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "external",
            ["api_access"],
            {"sensitivity": "medium"}
        )
        
        boundary3 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "hybrid",  # Changed from 'network' to 'hybrid' to match schema
            ["network_access"],
            {"sensitivity": "low"}
        )
        
        # 2. Create multiple surfaces
        surface1 = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [boundary1["boundary_id"]],
            "standard",
            {"visibility": "public"}
        )
        
        surface2 = self.trust_surface_protocol.create_trust_surface(
            self.node_id,
            [boundary2["boundary_id"]],
            "enhanced",
            {"visibility": "restricted"}
        )
        
        # 3. Create attestations for each surface
        attestation1 = self.attestation_service.create_attestation(
            self.node_id,
            surface1["surface_id"],
            "trust_surface_validation",
            {"confidence_score": 0.95}
        )
        
        attestation2 = self.attestation_service.create_attestation(
            self.node_id,
            surface2["surface_id"],
            "trust_surface_validation",
            {"confidence_score": 0.90}
        )
        
        # 4. Merge surfaces
        merged_surface = self.trust_surface_protocol.merge_surfaces(
            self.node_id,
            [surface1["surface_id"], surface2["surface_id"]],
            "composite",
            {"visibility": "private"}
        )
        
        # 5. Create attestation for merged surface
        merged_attestation = self.attestation_service.create_attestation(
            self.node_id,
            merged_surface["surface_id"],
            "trust_surface_validation",
            {
                "confidence_score": 0.85,
                "source_attestations": [attestation1["attestation_id"], attestation2["attestation_id"]]
            }
        )
        
        # 6. Propagate trust for merged surface
        target_node_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
        propagation = self.trust_propagation_engine.propagate_trust(
            self.node_id,
            merged_surface["surface_id"],
            target_node_ids,
            "transitive",
            {"trust_level": "high"}
        )
        
        # Verify the propagation
        self.assertEqual(propagation["status"], "complete")
        self.assertEqual(len(propagation["successful_nodes"]), len(target_node_ids))
        
    def test_boundary_enforcement_with_multiple_policies(self):
        """Test enforcing multiple policies on the same resource."""
        # 1. Create multiple boundaries
        boundary1 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "internal",
            ["data_access"],
            {"sensitivity": "high"}
        )
        
        boundary2 = self.trust_boundary_manager.create_boundary(
            self.node_id,
            "external",
            ["api_access"],
            {"sensitivity": "medium"}
        )
        
        # 2. Create multiple policies
        policy1 = self.boundary_enforcement.create_enforcement_policy(
            boundary1["boundary_id"],
            "strict",
            ["read"],
            {"auto_remediate": True}
        )
        
        policy2 = self.boundary_enforcement.create_enforcement_policy(
            boundary2["boundary_id"],
            "moderate",
            ["write"],
            {"auto_remediate": False}
        )
        
        # 3. Test enforcement against both policies
        # Policy 1 should allow read, deny write
        result1_read = self.boundary_enforcement.enforce_boundary(
            policy1["policy_id"],
            self.resource_id,
            "read",
            self.requester_id
        )
        
        result1_write = self.boundary_enforcement.enforce_boundary(
            policy1["policy_id"],
            self.resource_id,
            "write",
            self.requester_id
        )
        
        # Policy 2 should deny read, allow write
        result2_read = self.boundary_enforcement.enforce_boundary(
            policy2["policy_id"],
            self.resource_id,
            "read",
            self.requester_id
        )
        
        result2_write = self.boundary_enforcement.enforce_boundary(
            policy2["policy_id"],
            self.resource_id,
            "write",
            self.requester_id
        )
        
        # Verify the enforcement results
        self.assertTrue(result1_read["access_granted"])
        self.assertFalse(result1_write["access_granted"])
        self.assertFalse(result2_read["access_granted"])
        self.assertTrue(result2_write["access_granted"])
        
    def test_codex_tether_check_across_components(self):
        """Test that all components perform Codex tether checks."""
        # All components should return True for valid contract and phase
        self.assertTrue(self.trust_boundary_manager._codex_tether_check())
        self.assertTrue(self.trust_surface_protocol._codex_tether_check())
        self.assertTrue(self.attestation_service._codex_tether_check())
        self.assertTrue(self.trust_propagation_engine._codex_tether_check())
        self.assertTrue(self.boundary_enforcement._codex_tether_check())
        
if __name__ == '__main__':
    unittest.main()
