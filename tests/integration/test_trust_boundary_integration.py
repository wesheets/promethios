"""
Integration tests for the Trust Boundary Definition framework.

This module contains integration tests for the Trust Boundary Definition framework
components, ensuring they work together correctly.
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.trust.boundary_crossing_protocol import BoundaryCrossingProtocol
from src.core.verification.boundary_integrity_verifier import BoundaryIntegrityVerifier
from src.core.trust.trust_domain_manager import TrustDomainManager
from src.core.trust.sample_boundary_definitions import SampleBoundaryDefinitions
from src.core.common.schema_validator import SchemaValidator
from src.core.verification.seal_verification import SealVerificationService
from src.core.governance.attestation_service import AttestationService
from src.core.governance.governance_primitive_manager import GovernancePrimitiveManager
from src.core.governance.evolution_protocol import EvolutionProtocol
from src.core.trust.mutation_detector import MutationDetector

class TestTrustBoundaryIntegration(unittest.TestCase):
    """Integration tests for the Trust Boundary Definition framework."""

    def setUp(self):
        """Set up test fixtures."""
        # Create temporary file paths for testing
        self.test_boundaries_file = "/tmp/test_boundaries.json"
        self.test_crossings_file = "/tmp/test_crossings.json"
        self.test_verifications_file = "/tmp/test_verifications.json"
        self.test_domains_file = "/tmp/test_domains.json"
        
        # Create mock dependencies that aren't part of the trust boundary framework
        self.schema_validator = MagicMock(spec=SchemaValidator)
        self.seal_verification_service = MagicMock(spec=SealVerificationService)
        self.attestation_service = MagicMock(spec=AttestationService)
        self.governance_primitive_manager = MagicMock(spec=GovernancePrimitiveManager)
        self.evolution_protocol = MagicMock(spec=EvolutionProtocol)
        self.mutation_detector = MagicMock(spec=MutationDetector)
        
        # Configure mock behavior
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        self.schema_validator.validate.return_value = validation_result
        
        self.seal_verification_service.create_seal.return_value = "mock-seal"
        self.seal_verification_service.verify_seal.return_value = True
        self.seal_verification_service.verify_contract_tether.return_value = True
        
        self.attestation_service.create_attestation.return_value = "test-attestation-id"
        self.attestation_service.get_attestation.return_value = {
            "attestation_id": "test-attestation-id",
            "attester_id": "test-attester",
            "timestamp": datetime.utcnow().isoformat(),
            "validity_period": {
                "start": datetime.utcnow().isoformat(),
                "end": datetime.utcnow().replace(year=datetime.utcnow().year + 1).isoformat()
            }
        }
        self.attestation_service.verify_attestation.return_value = True
        
        # Create the actual components
        self.boundary_detection_engine = BoundaryDetectionEngine(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            boundaries_file_path=self.test_boundaries_file
        )
        
        self.boundary_crossing_protocol = BoundaryCrossingProtocol(
            boundary_detection_engine=self.boundary_detection_engine,
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            crossings_file_path=self.test_crossings_file
        )
        
        self.boundary_integrity_verifier = BoundaryIntegrityVerifier(
            boundary_detection_engine=self.boundary_detection_engine,
            boundary_crossing_protocol=self.boundary_crossing_protocol,
            seal_verification_service=self.seal_verification_service,
            mutation_detector=self.mutation_detector,
            attestation_service=self.attestation_service,
            schema_validator=self.schema_validator,
            verifications_file_path=self.test_verifications_file
        )
        
        self.trust_domain_manager = TrustDomainManager(
            boundary_detection_engine=self.boundary_detection_engine,
            governance_primitive_manager=self.governance_primitive_manager,
            attestation_service=self.attestation_service,
            evolution_protocol=self.evolution_protocol,
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            domains_file_path=self.test_domains_file
        )
        
        self.sample_definitions = SampleBoundaryDefinitions(
            boundary_detection_engine=self.boundary_detection_engine,
            boundary_crossing_protocol=self.boundary_crossing_protocol,
            boundary_integrity_verifier=self.boundary_integrity_verifier,
            trust_domain_manager=self.trust_domain_manager
        )

    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the test files if they exist
        for file_path in [
            self.test_boundaries_file,
            self.test_crossings_file,
            self.test_verifications_file,
            self.test_domains_file
        ]:
            if os.path.exists(file_path):
                os.remove(file_path)

    def test_boundary_creation_and_verification(self):
        """Test creating a boundary and verifying its integrity."""
        # Create a boundary
        boundary_def = {
            "boundary_id": f"boundary-{str(uuid.uuid4())}",
            "name": "Test Boundary",
            "description": "A test boundary for integration testing",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        }
        
        boundary_id = self.boundary_detection_engine.register_boundary(boundary_def)
        
        # Verify the boundary was created
        self.assertIsNotNone(boundary_id)
        self.assertEqual(boundary_id, boundary_def["boundary_id"])
        
        # Get the boundary
        boundary = self.boundary_detection_engine.get_boundary(boundary_id)
        
        # Verify the boundary was retrieved
        self.assertIsNotNone(boundary)
        self.assertEqual(boundary["boundary_id"], boundary_id)
        
        # Verify the boundary's integrity
        verification = self.boundary_integrity_verifier.verify_boundary_integrity(boundary_id)
        
        # Verify the verification was successful
        self.assertIsNotNone(verification)
        self.assertEqual(verification["boundary_id"], boundary_id)
        self.assertEqual(verification["result"]["integrity_status"], "intact")

    def test_boundary_crossing_creation_and_validation(self):
        """Test creating a boundary crossing and validating it."""
        # Create source and target boundaries
        source_boundary_def = {
            "boundary_id": f"source-boundary-{str(uuid.uuid4())}",
            "name": "Source Boundary",
            "description": "A source boundary for integration testing",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        }
        
        target_boundary_def = {
            "boundary_id": f"target-boundary-{str(uuid.uuid4())}",
            "name": "Target Boundary",
            "description": "A target boundary for integration testing",
            "boundary_type": "data",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        }
        
        source_boundary_id = self.boundary_detection_engine.register_boundary(source_boundary_def)
        target_boundary_id = self.boundary_detection_engine.register_boundary(target_boundary_def)
        
        # Create a boundary crossing
        crossing_def = {
            "crossing_id": f"crossing-{str(uuid.uuid4())}",
            "source_boundary_id": source_boundary_id,
            "target_boundary_id": target_boundary_id,
            "crossing_type": "data-transfer",
            "direction": "outbound",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "status": "active",
            "protocol": "HTTPS",
            "port": 443,
            "path": "/api/data",
            "authentication_required": True,
            "authorization_required": True,
            "encryption_required": True
        }
        
        crossing_id = self.boundary_crossing_protocol.register_crossing(crossing_def)
        
        # Verify the crossing was created
        self.assertIsNotNone(crossing_id)
        self.assertEqual(crossing_id, crossing_def["crossing_id"])
        
        # Get the crossing
        crossing = self.boundary_crossing_protocol.get_crossing(crossing_id)
        
        # Verify the crossing was retrieved
        self.assertIsNotNone(crossing)
        self.assertEqual(crossing["crossing_id"], crossing_id)
        
        # Validate the crossing
        validation_result = self.boundary_crossing_protocol.validate_crossing(crossing_id)
        
        # Verify the validation was successful
        self.assertTrue(validation_result.is_valid)
        self.assertEqual(len(validation_result.violations), 0)

    def test_domain_creation_and_boundary_association(self):
        """Test creating a trust domain and associating it with a boundary."""
        # Create a boundary
        boundary_def = {
            "boundary_id": f"boundary-{str(uuid.uuid4())}",
            "name": "Test Boundary",
            "description": "A test boundary for integration testing",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        }
        
        boundary_id = self.boundary_detection_engine.register_boundary(boundary_def)
        
        # Create a domain
        domain_def = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Test Domain",
            "description": "A test domain for integration testing",
            "domain_type": "application",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "test-owner",
                "name": "Test Owner",
                "role": "administrator"
            }
        }
        
        domain_id = self.trust_domain_manager.register_domain(domain_def)
        
        # Verify the domain was created
        self.assertIsNotNone(domain_id)
        self.assertEqual(domain_id, domain_def["domain_id"])
        
        # Associate the domain with the boundary
        result = self.trust_domain_manager.associate_domain_with_boundary(
            domain_id=domain_id,
            boundary_id=boundary_id,
            relationship="defines"
        )
        
        # Verify the association was created
        self.assertTrue(result)
        
        # Get the domain
        domain = self.trust_domain_manager.get_domain(domain_id)
        
        # Verify the domain was retrieved
        self.assertIsNotNone(domain)
        self.assertEqual(domain["domain_id"], domain_id)
        
        # Verify the boundary was associated with the domain
        self.assertIn("boundaries", domain)
        self.assertEqual(len(domain["boundaries"]), 1)
        self.assertEqual(domain["boundaries"][0]["boundary_id"], boundary_id)
        self.assertEqual(domain["boundaries"][0]["relationship"], "defines")
        
        # Get the boundaries for the domain
        boundaries = self.trust_domain_manager.get_domain_boundaries(domain_id)
        
        # Verify the boundaries were returned
        self.assertEqual(len(boundaries), 1)
        self.assertEqual(boundaries[0]["boundary_id"], boundary_id)

    def test_domain_relationship_and_trust_calculation(self):
        """Test creating domain relationships and calculating trust levels."""
        # Create domains
        domain1_def = {
            "domain_id": f"domain1-{str(uuid.uuid4())}",
            "name": "Domain 1",
            "description": "First test domain",
            "domain_type": "application",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "test-owner-1",
                "name": "Test Owner 1",
                "role": "administrator"
            }
        }
        
        domain2_def = {
            "domain_id": f"domain2-{str(uuid.uuid4())}",
            "name": "Domain 2",
            "description": "Second test domain",
            "domain_type": "security",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "test-owner-2",
                "name": "Test Owner 2",
                "role": "security-officer"
            }
        }
        
        domain1_id = self.trust_domain_manager.register_domain(domain1_def)
        domain2_id = self.trust_domain_manager.register_domain(domain2_def)
        
        # Add a relationship between the domains
        result = self.trust_domain_manager.add_domain_relationship(
            source_domain_id=domain1_id,
            target_domain_id=domain2_id,
            relationship_type="trusted",
            trust_direction="bidirectional",
            trust_level=0.8,
            description="Test relationship"
        )
        
        # Verify the relationship was added
        self.assertTrue(result)
        
        # Get the relationships for domain1
        relationships = self.trust_domain_manager.get_domain_relationships(domain1_id)
        
        # Verify the relationships were returned
        self.assertEqual(len(relationships), 1)
        self.assertEqual(relationships[0]["related_domain_id"], domain2_id)
        self.assertEqual(relationships[0]["relationship_type"], "trusted")
        self.assertEqual(relationships[0]["trust_direction"], "bidirectional")
        self.assertEqual(relationships[0]["trust_level"], 0.8)
        
        # Calculate trust level for domain1
        trust_level = self.trust_domain_manager.calculate_domain_trust_level(domain1_id)
        
        # Verify the trust level was calculated
        self.assertIsNotNone(trust_level)
        self.assertIn("level", trust_level)
        self.assertIn("confidence", trust_level)
        self.assertIn("factors", trust_level)
        
        # Verify the factors were calculated
        self.assertGreaterEqual(len(trust_level["factors"]), 1)

    def test_complete_sample_environment(self):
        """Test creating a complete sample environment."""
        # Create a complete sample environment
        result = self.sample_definitions.create_complete_sample_environment()
        
        # Verify the environment was created
        self.assertTrue(result)
        
        # List all boundaries
        boundaries = self.boundary_detection_engine.list_boundaries()
        
        # Verify boundaries were created
        self.assertGreaterEqual(len(boundaries), 4)
        
        # List all domains
        domains = self.trust_domain_manager.list_domains()
        
        # Verify domains were created
        self.assertGreaterEqual(len(domains), 3)
        
        # Verify each boundary has been verified
        for boundary in boundaries:
            verifications = self.boundary_integrity_verifier.list_verifications(boundary_id=boundary["boundary_id"])
            self.assertGreaterEqual(len(verifications), 1)
            
            # Verify the integrity status
            self.assertEqual(verifications[0]["result"]["integrity_status"], "intact")
        
        # Verify domain relationships exist
        for domain in domains:
            relationships = self.trust_domain_manager.get_domain_relationships(domain["domain_id"])
            if domain["name"] != "Security Domain":  # Security domain might not have relationships
                self.assertGreaterEqual(len(relationships), 1)
        
        # Verify domain-boundary associations exist
        for domain in domains:
            boundaries = self.trust_domain_manager.get_domain_boundaries(domain["domain_id"])
            self.assertGreaterEqual(len(boundaries), 1)

    def test_boundary_mutation_detection(self):
        """Test detecting mutations in a boundary."""
        # Create a boundary
        boundary_def = {
            "boundary_id": f"boundary-{str(uuid.uuid4())}",
            "name": "Test Boundary",
            "description": "A test boundary for integration testing",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        }
        
        boundary_id = self.boundary_detection_engine.register_boundary(boundary_def)
        
        # Verify the boundary's integrity
        verification1 = self.boundary_integrity_verifier.verify_boundary_integrity(boundary_id)
        
        # Verify the verification was successful
        self.assertEqual(verification1["result"]["integrity_status"], "intact")
        
        # Configure mutation detector to return mutations
        self.mutation_detector.detect_mutations.return_value = [
            {
                "mutation_id": "mutation-1",
                "mutation_type": "boundary_definition",
                "detection_timestamp": datetime.utcnow().isoformat(),
                "severity": "high",
                "details": "Unauthorized modification of boundary definition",
                "evidence": "Signature mismatch"
            }
        ]
        
        # Verify the boundary's integrity again
        verification2 = self.boundary_integrity_verifier.verify_boundary_integrity(boundary_id, "mutation_detection")
        
        # Verify the verification detected mutations
        self.assertEqual(verification2["result"]["integrity_status"], "warning")
        self.assertIn("mutation_detections", verification2)
        self.assertEqual(len(verification2["mutation_detections"]), 1)
        self.assertEqual(verification2["mutation_detections"][0]["severity"], "high")
        
        # Reset mutation detector
        self.mutation_detector.detect_mutations.return_value = []

    def test_boundary_crossing_validation_failure(self):
        """Test validation failure for a boundary crossing."""
        # Create source and target boundaries
        source_boundary_id = self.boundary_detection_engine.register_boundary({
            "boundary_id": f"source-boundary-{str(uuid.uuid4())}",
            "name": "Source Boundary",
            "description": "A source boundary for integration testing",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        })
        
        target_boundary_id = self.boundary_detection_engine.register_boundary({
            "boundary_id": f"target-boundary-{str(uuid.uuid4())}",
            "name": "Target Boundary",
            "description": "A target boundary for integration testing",
            "boundary_type": "data",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        })
        
        # Create a boundary crossing with encryption required
        crossing_id = self.boundary_crossing_protocol.register_crossing({
            "crossing_id": f"crossing-{str(uuid.uuid4())}",
            "source_boundary_id": source_boundary_id,
            "target_boundary_id": target_boundary_id,
            "crossing_type": "data-transfer",
            "direction": "outbound",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "status": "active",
            "protocol": "HTTP",  # Not HTTPS
            "port": 80,
            "path": "/api/data",
            "authentication_required": True,
            "authorization_required": True,
            "encryption_required": True  # Requires encryption but using HTTP
        })
        
        # Override the validation methods to simulate failures
        original_check_encryption = self.boundary_crossing_protocol._check_encryption
        self.boundary_crossing_protocol._check_encryption = lambda crossing: (False, "Encryption required but not provided (HTTP instead of HTTPS)")
        
        # Validate the crossing
        validation_result = self.boundary_crossing_protocol.validate_crossing(crossing_id)
        
        # Verify the validation failed
        self.assertFalse(validation_result.is_valid)
        self.assertGreaterEqual(len(validation_result.violations), 1)
        
        # Verify the violation details
        violation_types = [v["violation_type"] for v in validation_result.violations]
        self.assertIn("encryption", violation_types)
        
        # Restore the original method
        self.boundary_crossing_protocol._check_encryption = original_check_encryption

    def test_domain_merge_and_split(self):
        """Test merging and splitting domains."""
        # Create source domains
        domain1_id = self.trust_domain_manager.register_domain({
            "domain_id": f"domain1-{str(uuid.uuid4())}",
            "name": "Domain 1",
            "description": "First test domain",
            "domain_type": "application",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "test-owner-1",
                "name": "Test Owner 1",
                "role": "administrator"
            }
        })
        
        domain2_id = self.trust_domain_manager.register_domain({
            "domain_id": f"domain2-{str(uuid.uuid4())}",
            "name": "Domain 2",
            "description": "Second test domain",
            "domain_type": "security",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "test-owner-2",
                "name": "Test Owner 2",
                "role": "security-officer"
            }
        })
        
        # Add components to the domains
        self.trust_domain_manager.add_domain_component(domain1_id, "component-1", "service")
        self.trust_domain_manager.add_domain_component(domain2_id, "component-2", "database")
        
        # Create a new domain definition for the merged domain
        merged_domain = {
            "domain_id": f"merged-domain-{str(uuid.uuid4())}",
            "name": "Merged Domain",
            "description": "A merged domain",
            "domain_type": "application",
            "classification": "confidential",
            "status": "active"
        }
        
        # Merge the domains
        merged_domain_id = self.trust_domain_manager.merge_domains(
            source_domain_ids=[domain1_id, domain2_id],
            new_domain_definition=merged_domain
        )
        
        # Verify the merged domain was created
        self.assertIsNotNone(merged_domain_id)
        self.assertEqual(merged_domain_id, merged_domain["domain_id"])
        
        # Get the merged domain
        merged = self.trust_domain_manager.get_domain(merged_domain_id)
        
        # Verify the merged domain contains components from both source domains
        self.assertIn("components", merged)
        self.assertEqual(len(merged["components"]), 2)
        component_ids = [c["component_id"] for c in merged["components"]]
        self.assertIn("component-1", component_ids)
        self.assertIn("component-2", component_ids)
        
        # Verify the source domains were deprecated
        domain1 = self.trust_domain_manager.get_domain(domain1_id)
        domain2 = self.trust_domain_manager.get_domain(domain2_id)
        self.assertEqual(domain1["status"], "deprecated")
        self.assertEqual(domain2["status"], "deprecated")
        
        # Create new domain definitions for the split domains
        split_domain1 = {
            "domain_id": f"split-domain1-{str(uuid.uuid4())}",
            "name": "Split Domain 1",
            "description": "First split domain",
            "domain_type": "application",
            "classification": "confidential",
            "status": "active"
        }
        
        split_domain2 = {
            "domain_id": f"split-domain2-{str(uuid.uuid4())}",
            "name": "Split Domain 2",
            "description": "Second split domain",
            "domain_type": "security",
            "classification": "restricted",
            "status": "active"
        }
        
        # Split the merged domain
        split_domain_ids = self.trust_domain_manager.split_domain(
            source_domain_id=merged_domain_id,
            new_domain_definitions=[split_domain1, split_domain2]
        )
        
        # Verify the split domains were created
        self.assertEqual(len(split_domain_ids), 2)
        self.assertEqual(split_domain_ids[0], split_domain1["domain_id"])
        self.assertEqual(split_domain_ids[1], split_domain2["domain_id"])
        
        # Verify the merged domain was deprecated
        merged_updated = self.trust_domain_manager.get_domain(merged_domain_id)
        self.assertEqual(merged_updated["status"], "deprecated")

if __name__ == '__main__':
    unittest.main()
