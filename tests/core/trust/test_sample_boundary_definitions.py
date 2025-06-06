"""
Unit tests for the Sample Boundary Definitions.

This module contains unit tests for the Sample Boundary Definitions component
of the Trust Boundary Definition framework.
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from src.core.trust.sample_boundary_definitions import SampleBoundaryDefinitions
from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.trust.boundary_crossing_protocol import BoundaryCrossingProtocol
from src.core.verification.boundary_integrity_verifier import BoundaryIntegrityVerifier
from src.core.trust.trust_domain_manager import TrustDomainManager

class TestSampleBoundaryDefinitions(unittest.TestCase):
    """Test cases for the SampleBoundaryDefinitions class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies without spec restriction to allow adding methods
        self.boundary_detection_engine = MagicMock()
        self.boundary_crossing_protocol = MagicMock()
        self.boundary_integrity_verifier = MagicMock()
        self.trust_domain_manager = MagicMock()
        
        # Configure mock behavior
        self.boundary_detection_engine.register_boundary.return_value = "test-boundary-id"
        self.boundary_crossing_protocol.register_crossing.return_value = "test-crossing-id"
        self.boundary_integrity_verifier.verify_boundary_integrity.return_value = {
            "verification_id": "test-verification-id",
            "boundary_id": "test-boundary-id",
            "result": {"integrity_status": "intact"}
        }
        self.trust_domain_manager.register_domain.return_value = "test-domain-id"
        
        # Create the sample definitions instance
        self.sample_definitions = SampleBoundaryDefinitions(
            boundary_detection_engine=self.boundary_detection_engine,
            boundary_crossing_protocol=self.boundary_crossing_protocol,
            boundary_integrity_verifier=self.boundary_integrity_verifier,
            trust_domain_manager=self.trust_domain_manager
        )

    def test_create_sample_process_boundary(self):
        """Test creating a sample process boundary."""
        # Create a sample process boundary
        boundary_id = self.sample_definitions.create_sample_process_boundary()
        
        # Verify the boundary was created
        self.assertIsNotNone(boundary_id)
        self.assertEqual(boundary_id, "test-boundary-id")
        
        # Verify boundary detection engine was used
        self.boundary_detection_engine.register_boundary.assert_called_once()
        
        # Verify the boundary has the correct type
        boundary_def = self.boundary_detection_engine.register_boundary.call_args[0][0]
        self.assertEqual(boundary_def["boundary_type"], "process")

    def test_create_sample_network_boundary(self):
        """Test creating a sample network boundary."""
        # Create a sample network boundary
        boundary_id = self.sample_definitions.create_sample_network_boundary()
        
        # Verify the boundary was created
        self.assertIsNotNone(boundary_id)
        self.assertEqual(boundary_id, "test-boundary-id")
        
        # Verify boundary detection engine was used
        self.boundary_detection_engine.register_boundary.assert_called_once()
        
        # Verify the boundary has the correct type
        boundary_def = self.boundary_detection_engine.register_boundary.call_args[0][0]
        self.assertEqual(boundary_def["boundary_type"], "network")

    def test_create_sample_data_boundary(self):
        """Test creating a sample data boundary."""
        # Create a sample data boundary
        boundary_id = self.sample_definitions.create_sample_data_boundary()
        
        # Verify the boundary was created
        self.assertIsNotNone(boundary_id)
        self.assertEqual(boundary_id, "test-boundary-id")
        
        # Verify boundary detection engine was used
        self.boundary_detection_engine.register_boundary.assert_called_once()
        
        # Verify the boundary has the correct type
        boundary_def = self.boundary_detection_engine.register_boundary.call_args[0][0]
        self.assertEqual(boundary_def["boundary_type"], "data")

    def test_create_sample_governance_boundary(self):
        """Test creating a sample governance boundary."""
        # Create a sample governance boundary
        boundary_id = self.sample_definitions.create_sample_governance_boundary()
        
        # Verify the boundary was created
        self.assertIsNotNone(boundary_id)
        self.assertEqual(boundary_id, "test-boundary-id")
        
        # Verify boundary detection engine was used
        self.boundary_detection_engine.register_boundary.assert_called_once()
        
        # Verify the boundary has the correct type
        boundary_def = self.boundary_detection_engine.register_boundary.call_args[0][0]
        self.assertEqual(boundary_def["boundary_type"], "governance")

    def test_create_sample_trust_domain(self):
        """Test creating a sample trust domain."""
        # Create a sample trust domain
        domain_id = self.sample_definitions.create_sample_trust_domain()
        
        # Verify the domain was created
        self.assertIsNotNone(domain_id)
        self.assertEqual(domain_id, "test-domain-id")
        
        # Verify trust domain manager was used
        self.trust_domain_manager.register_domain.assert_called_once()
        
        # Verify the domain has the correct type
        domain_def = self.trust_domain_manager.register_domain.call_args[0][0]
        self.assertEqual(domain_def["domain_type"], "application")

    def test_create_sample_boundary_crossing(self):
        """Test creating a sample boundary crossing."""
        # Create source and target boundaries
        source_boundary_id = "source-boundary"
        target_boundary_id = "target-boundary"
        
        # Configure boundary detection engine to return boundaries
        self.boundary_detection_engine.get_boundary.side_effect = lambda boundary_id: {
            "boundary_id": boundary_id,
            "name": f"Boundary {boundary_id}",
            "boundary_type": "process",
            "status": "active"
        }
        
        # Create a sample boundary crossing
        crossing_id = self.sample_definitions.create_sample_boundary_crossing(
            source_boundary_id=source_boundary_id,
            target_boundary_id=target_boundary_id
        )
        
        # Verify the crossing was created
        self.assertIsNotNone(crossing_id)
        self.assertEqual(crossing_id, "test-crossing-id")
        
        # Verify boundary crossing protocol was used
        self.boundary_crossing_protocol.register_crossing.assert_called_once()
        
        # Verify the crossing has the correct source and target
        crossing_def = self.boundary_crossing_protocol.register_crossing.call_args[0][0]
        self.assertEqual(crossing_def["source_boundary_id"], source_boundary_id)
        self.assertEqual(crossing_def["target_boundary_id"], target_boundary_id)

    def test_create_sample_boundary_integrity_verification(self):
        """Test creating a sample boundary integrity verification."""
        # Create a boundary
        boundary_id = "test-boundary"
        
        # Create a sample boundary integrity verification
        verification = self.sample_definitions.create_sample_boundary_integrity_verification(boundary_id)
        
        # Verify the verification was created
        self.assertIsNotNone(verification)
        self.assertEqual(verification["verification_id"], "test-verification-id")
        self.assertEqual(verification["boundary_id"], "test-boundary-id")
        
        # Verify boundary integrity verifier was used
        self.boundary_integrity_verifier.verify_boundary_integrity.assert_called_once_with(boundary_id)

    def test_create_sample_domain_relationship(self):
        """Test creating a sample domain relationship."""
        # Create source and target domains
        source_domain_id = "source-domain"
        target_domain_id = "target-domain"
        
        # Create a sample domain relationship
        result = self.sample_definitions.create_sample_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain_id
        )
        
        # Verify the relationship was created
        self.assertTrue(result)
        
        # Verify trust domain manager was used
        self.trust_domain_manager.add_domain_relationship.assert_called_once()
        
        # Verify the relationship has the correct source and target
        args = self.trust_domain_manager.add_domain_relationship.call_args[1]
        self.assertEqual(args["source_domain_id"], source_domain_id)
        self.assertEqual(args["target_domain_id"], target_domain_id)
        self.assertEqual(args["relationship_type"], "trusted")
        self.assertEqual(args["trust_direction"], "bidirectional")

    def test_create_sample_domain_boundary_association(self):
        """Test creating a sample domain-boundary association."""
        # Create a domain and a boundary
        domain_id = "test-domain"
        boundary_id = "test-boundary"
        
        # Create a sample domain-boundary association
        result = self.sample_definitions.create_sample_domain_boundary_association(
            domain_id=domain_id,
            boundary_id=boundary_id
        )
        
        # Verify the association was created
        self.assertTrue(result)
        
        # Verify trust domain manager was used
        self.trust_domain_manager.associate_domain_with_boundary.assert_called_once()
        
        # Verify the association has the correct domain and boundary
        args = self.trust_domain_manager.associate_domain_with_boundary.call_args[1]
        self.assertEqual(args["domain_id"], domain_id)
        self.assertEqual(args["boundary_id"], boundary_id)
        self.assertEqual(args["relationship"], "defines")

    def test_create_complete_sample_environment(self):
        """Test creating a complete sample environment."""
        # Create a complete sample environment
        result = self.sample_definitions.create_complete_sample_environment()
        
        # Verify the environment was created
        self.assertTrue(result)
        
        # Verify all components were used
        self.boundary_detection_engine.register_boundary.assert_called()
        self.boundary_crossing_protocol.register_crossing.assert_called()
        self.boundary_integrity_verifier.verify_boundary_integrity.assert_called()
        self.trust_domain_manager.register_domain.assert_called()
        self.trust_domain_manager.add_domain_relationship.assert_called()
        self.trust_domain_manager.associate_domain_with_boundary.assert_called()
        
        # Verify the correct number of boundaries were created
        self.assertEqual(self.boundary_detection_engine.register_boundary.call_count, 4)
        
        # Verify the correct number of domains were created
        self.assertEqual(self.trust_domain_manager.register_domain.call_count, 3)
        
        # Verify the correct number of crossings were created
        self.assertEqual(self.boundary_crossing_protocol.register_crossing.call_count, 3)
        
        # Verify the correct number of verifications were performed
        self.assertEqual(self.boundary_integrity_verifier.verify_boundary_integrity.call_count, 4)
        
        # Verify the correct number of domain relationships were created
        self.assertEqual(self.trust_domain_manager.add_domain_relationship.call_count, 3)
        
        # Verify the correct number of domain-boundary associations were created
        self.assertEqual(self.trust_domain_manager.associate_domain_with_boundary.call_count, 4)

    def test_create_sample_process_boundary_with_controls(self):
        """Test creating a sample process boundary with controls."""
        # Configure boundary detection engine to return a boundary ID and support adding controls
        self.boundary_detection_engine.add_boundary_control.return_value = True
        
        # Create a sample process boundary with controls
        boundary_id = self.sample_definitions.create_sample_process_boundary(with_controls=True)
        
        # Verify the boundary was created
        self.assertIsNotNone(boundary_id)
        self.assertEqual(boundary_id, "test-boundary-id")
        
        # Verify controls were added
        self.boundary_detection_engine.add_boundary_control.assert_called()
        
        # Verify at least one authentication control was added
        auth_control_added = False
        for call in self.boundary_detection_engine.add_boundary_control.call_args_list:
            control = call[0][1]
            if control["control_type"] == "authentication":
                auth_control_added = True
                break
        self.assertTrue(auth_control_added)

    def test_create_sample_network_boundary_with_entry_points(self):
        """Test creating a sample network boundary with entry points."""
        # Configure boundary detection engine to return a boundary ID and support adding entry points
        self.boundary_detection_engine.add_entry_point.return_value = True
        
        # Create a sample network boundary with entry points
        boundary_id = self.sample_definitions.create_sample_network_boundary(with_entry_points=True)
        
        # Verify the boundary was created
        self.assertIsNotNone(boundary_id)
        self.assertEqual(boundary_id, "test-boundary-id")
        
        # Verify entry points were added
        self.boundary_detection_engine.add_entry_point.assert_called()

    def test_create_sample_data_boundary_with_exit_points(self):
        """Test creating a sample data boundary with exit points."""
        # Configure boundary detection engine to return a boundary ID and support adding exit points
        self.boundary_detection_engine.add_exit_point.return_value = True
        
        # Create a sample data boundary with exit points
        boundary_id = self.sample_definitions.create_sample_data_boundary(with_exit_points=True)
        
        # Verify the boundary was created
        self.assertIsNotNone(boundary_id)
        self.assertEqual(boundary_id, "test-boundary-id")
        
        # Verify exit points were added
        self.boundary_detection_engine.add_exit_point.assert_called()

    def test_create_sample_trust_domain_with_components(self):
        """Test creating a sample trust domain with components."""
        # Configure trust domain manager to return a domain ID and support adding components
        self.trust_domain_manager.add_domain_component.return_value = True
        
        # Create a sample trust domain with components
        domain_id = self.sample_definitions.create_sample_trust_domain(with_components=True)
        
        # Verify the domain was created
        self.assertIsNotNone(domain_id)
        self.assertEqual(domain_id, "test-domain-id")
        
        # Verify components were added
        self.trust_domain_manager.add_domain_component.assert_called()

    def test_create_sample_trust_domain_with_governance_policies(self):
        """Test creating a sample trust domain with governance policies."""
        # Configure trust domain manager to return a domain ID and support adding policies
        self.trust_domain_manager.associate_governance_policy.return_value = True
        
        # Create a sample trust domain with governance policies
        domain_id = self.sample_definitions.create_sample_trust_domain(with_governance_policies=True)
        
        # Verify the domain was created
        self.assertIsNotNone(domain_id)
        self.assertEqual(domain_id, "test-domain-id")
        
        # Verify policies were added
        self.trust_domain_manager.associate_governance_policy.assert_called()

    def test_create_sample_trust_domain_with_attestations(self):
        """Test creating a sample trust domain with attestations."""
        # Configure trust domain manager to return a domain ID and support adding attestations
        self.trust_domain_manager.add_domain_attestation.return_value = "test-attestation-id"
        
        # Create a sample trust domain with attestations
        domain_id = self.sample_definitions.create_sample_trust_domain(with_attestations=True)
        
        # Verify the domain was created
        self.assertIsNotNone(domain_id)
        self.assertEqual(domain_id, "test-domain-id")
        
        # Verify attestations were added
        self.trust_domain_manager.add_domain_attestation.assert_called()

    def test_create_sample_boundary_crossing_with_controls(self):
        """Test creating a sample boundary crossing with controls."""
        # Configure boundary crossing protocol to return a crossing ID and support adding controls
        self.boundary_crossing_protocol.add_crossing_control.return_value = True
        
        # Create source and target boundaries
        source_boundary_id = "source-boundary"
        target_boundary_id = "target-boundary"
        
        # Configure boundary detection engine to return boundaries
        self.boundary_detection_engine.get_boundary.side_effect = lambda boundary_id: {
            "boundary_id": boundary_id,
            "name": f"Boundary {boundary_id}",
            "boundary_type": "process",
            "status": "active"
        }
        
        # Create a sample boundary crossing with controls
        crossing_id = self.sample_definitions.create_sample_boundary_crossing(
            source_boundary_id=source_boundary_id,
            target_boundary_id=target_boundary_id,
            with_controls=True
        )
        
        # Verify the crossing was created
        self.assertIsNotNone(crossing_id)
        self.assertEqual(crossing_id, "test-crossing-id")
        
        # Verify controls were added
        self.boundary_crossing_protocol.add_crossing_control.assert_called()

if __name__ == '__main__':
    unittest.main()
