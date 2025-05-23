"""
Unit tests for the Trust Domain Manager.

This module contains unit tests for the Trust Domain Manager component
of the Trust Boundary Definition framework.
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from src.core.trust.trust_domain_manager import TrustDomainManager
from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.governance.governance_primitive_manager import GovernancePrimitiveManager
from src.core.governance.attestation_service import AttestationService
from src.core.governance.evolution_protocol import EvolutionProtocol
from src.core.common.schema_validator import SchemaValidator
from src.core.verification.seal_verification import SealVerificationService

class TestTrustDomainManager(unittest.TestCase):
    """Test cases for the TrustDomainManager class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.boundary_detection_engine = MagicMock(spec=BoundaryDetectionEngine)
        self.governance_primitive_manager = MagicMock(spec=GovernancePrimitiveManager)
        self.attestation_service = MagicMock(spec=AttestationService)
        self.evolution_protocol = MagicMock(spec=EvolutionProtocol)
        self.schema_validator = MagicMock(spec=SchemaValidator)
        self.seal_verification_service = MagicMock(spec=SealVerificationService)
        
        # Configure mock behavior
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        self.schema_validator.validate.return_value = validation_result
        
        self.seal_verification_service.create_seal.return_value = "mock-seal"
        self.seal_verification_service.verify_seal.return_value = True
        self.seal_verification_service.verify_contract_tether.return_value = True
        
        # Configure boundary detection engine mock
        self.boundary_detection_engine.get_boundary.return_value = {
            "boundary_id": "test-boundary",
            "name": "Test Boundary",
            "boundary_type": "process",
            "status": "active"
        }
        
        # Configure attestation service mock
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
        
        # Configure governance primitive manager mock
        self.governance_primitive_manager.get_primitives_for_entity.return_value = [
            {
                "primitive_id": "primitive-1",
                "status": "active"
            },
            {
                "primitive_id": "primitive-2",
                "status": "active"
            }
        ]
        
        # Create a temporary file path for testing
        self.test_domains_file = "/tmp/test_domains.json"
        
        # Create the manager instance
        self.manager = TrustDomainManager(
            boundary_detection_engine=self.boundary_detection_engine,
            governance_primitive_manager=self.governance_primitive_manager,
            attestation_service=self.attestation_service,
            evolution_protocol=self.evolution_protocol,
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            domains_file_path=self.test_domains_file
        )
        
        # Sample domain for testing
        self.sample_domain = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Test Domain",
            "description": "A test domain for unit testing",
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

    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the test file if it exists
        if os.path.exists(self.test_domains_file):
            os.remove(self.test_domains_file)

    def test_register_domain(self):
        """Test registering a new domain."""
        # Register the domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Verify the domain was registered
        self.assertIsNotNone(domain_id)
        self.assertEqual(domain_id, self.sample_domain["domain_id"])
        self.assertIn(domain_id, self.manager.domains)
        
        # Verify schema validation was called
        self.schema_validator.validate.assert_called_once()
        
        # Verify seal verification service was used
        self.seal_verification_service.create_seal.assert_called()
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_register_domain_with_invalid_schema(self):
        """Test registering a domain with an invalid schema."""
        # Configure mock to return invalid validation
        validation_result = MagicMock()
        validation_result.is_valid = False
        validation_result.errors = ["Invalid schema"]
        self.schema_validator.validate.return_value = validation_result
        
        # Attempt to register the domain
        with self.assertRaises(ValueError):
            self.manager.register_domain(self.sample_domain)

    def test_get_domain(self):
        """Test getting a domain by ID."""
        # Register the domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the domain was retrieved
        self.assertIsNotNone(domain)
        self.assertEqual(domain["domain_id"], domain_id)
        self.assertEqual(domain["name"], self.sample_domain["name"])
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_nonexistent_domain(self):
        """Test getting a domain that doesn't exist."""
        # Attempt to get a nonexistent domain
        domain = self.manager.get_domain("nonexistent-domain")
        
        # Verify None was returned
        self.assertIsNone(domain)

    def test_update_domain(self):
        """Test updating a domain."""
        # Register the domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Create updates
        updates = {
            "name": "Updated Test Domain",
            "description": "An updated test domain for unit testing",
            "classification": "restricted"
        }
        
        # Update the domain
        result = self.manager.update_domain(domain_id, updates)
        
        # Verify the update was successful
        self.assertTrue(result)
        
        # Get the updated domain
        updated_domain = self.manager.get_domain(domain_id)
        
        # Verify the updates were applied
        self.assertEqual(updated_domain["name"], updates["name"])
        self.assertEqual(updated_domain["description"], updates["description"])
        self.assertEqual(updated_domain["classification"], updates["classification"])
        
        # Verify version was incremented
        self.assertEqual(updated_domain["version"], "1.0.1")
        
        # Verify schema validation was called
        self.schema_validator.validate.assert_called()
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_update_nonexistent_domain(self):
        """Test updating a domain that doesn't exist."""
        # Attempt to update a nonexistent domain
        result = self.manager.update_domain("nonexistent-domain", {"name": "Updated"})
        
        # Verify the update failed
        self.assertFalse(result)

    def test_delete_domain(self):
        """Test deleting a domain."""
        # Register the domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Delete the domain
        result = self.manager.delete_domain(domain_id)
        
        # Verify the deletion was successful
        self.assertTrue(result)
        
        # Verify the domain was removed
        self.assertNotIn(domain_id, self.manager.domains)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_delete_nonexistent_domain(self):
        """Test deleting a domain that doesn't exist."""
        # Attempt to delete a nonexistent domain
        result = self.manager.delete_domain("nonexistent-domain")
        
        # Verify the deletion failed
        self.assertFalse(result)

    def test_list_domains(self):
        """Test listing domains."""
        # Register multiple domains
        domain1 = self.sample_domain.copy()
        domain1["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain1["domain_type"] = "application"
        
        domain2 = self.sample_domain.copy()
        domain2["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain2["domain_type"] = "security"
        
        domain3 = self.sample_domain.copy()
        domain3["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain3["domain_type"] = "application"
        domain3["status"] = "deprecated"
        
        self.manager.register_domain(domain1)
        self.manager.register_domain(domain2)
        self.manager.register_domain(domain3)
        
        # List all domains
        domains = self.manager.list_domains()
        
        # Verify all domains were returned
        self.assertEqual(len(domains), 3)
        
        # List domains by type
        application_domains = self.manager.list_domains(domain_type="application")
        
        # Verify only application domains were returned
        self.assertEqual(len(application_domains), 2)
        for domain in application_domains:
            self.assertEqual(domain["domain_type"], "application")
        
        # List domains by status
        active_domains = self.manager.list_domains(status="active")
        
        # Verify only active domains were returned
        self.assertEqual(len(active_domains), 2)
        for domain in active_domains:
            self.assertEqual(domain["status"], "active")
        
        # List domains by type and status
        active_application_domains = self.manager.list_domains(domain_type="application", status="active")
        
        # Verify only active application domains were returned
        self.assertEqual(len(active_application_domains), 1)
        for domain in active_application_domains:
            self.assertEqual(domain["domain_type"], "application")
            self.assertEqual(domain["status"], "active")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_add_domain_relationship(self):
        """Test adding a relationship between domains."""
        # Register two domains
        source_domain_id = self.manager.register_domain(self.sample_domain)
        
        target_domain = self.sample_domain.copy()
        target_domain["domain_id"] = f"domain-{str(uuid.uuid4())}"
        target_domain_id = self.manager.register_domain(target_domain)
        
        # Add a relationship
        result = self.manager.add_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain_id,
            relationship_type="trusted",
            trust_direction="bidirectional",
            trust_level=0.8,
            description="Test relationship"
        )
        
        # Verify the relationship was added successfully
        self.assertTrue(result)
        
        # Get the source domain
        source_domain = self.manager.get_domain(source_domain_id)
        
        # Verify the relationship was added to the domain
        self.assertIn("relationships", source_domain)
        self.assertEqual(len(source_domain["relationships"]), 1)
        self.assertEqual(source_domain["relationships"][0]["related_domain_id"], target_domain_id)
        self.assertEqual(source_domain["relationships"][0]["relationship_type"], "trusted")
        self.assertEqual(source_domain["relationships"][0]["trust_direction"], "bidirectional")
        self.assertEqual(source_domain["relationships"][0]["trust_level"], 0.8)
        self.assertEqual(source_domain["relationships"][0]["description"], "Test relationship")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_add_relationship_nonexistent_domain(self):
        """Test adding a relationship to a nonexistent domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to add a relationship with a nonexistent source domain
        result = self.manager.add_domain_relationship(
            source_domain_id="nonexistent-domain",
            target_domain_id=domain_id,
            relationship_type="trusted",
            trust_direction="bidirectional"
        )
        
        # Verify the operation failed
        self.assertFalse(result)
        
        # Attempt to add a relationship with a nonexistent target domain
        result = self.manager.add_domain_relationship(
            source_domain_id=domain_id,
            target_domain_id="nonexistent-domain",
            relationship_type="trusted",
            trust_direction="bidirectional"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_add_relationship_invalid_type(self):
        """Test adding a relationship with an invalid type."""
        # Register two domains
        source_domain_id = self.manager.register_domain(self.sample_domain)
        
        target_domain = self.sample_domain.copy()
        target_domain["domain_id"] = f"domain-{str(uuid.uuid4())}"
        target_domain_id = self.manager.register_domain(target_domain)
        
        # Attempt to add a relationship with an invalid type
        result = self.manager.add_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain_id,
            relationship_type="invalid-type",
            trust_direction="bidirectional"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_add_relationship_invalid_direction(self):
        """Test adding a relationship with an invalid direction."""
        # Register two domains
        source_domain_id = self.manager.register_domain(self.sample_domain)
        
        target_domain = self.sample_domain.copy()
        target_domain["domain_id"] = f"domain-{str(uuid.uuid4())}"
        target_domain_id = self.manager.register_domain(target_domain)
        
        # Attempt to add a relationship with an invalid direction
        result = self.manager.add_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain_id,
            relationship_type="trusted",
            trust_direction="invalid-direction"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_update_domain_relationship(self):
        """Test updating a relationship between domains."""
        # Register two domains
        source_domain_id = self.manager.register_domain(self.sample_domain)
        
        target_domain = self.sample_domain.copy()
        target_domain["domain_id"] = f"domain-{str(uuid.uuid4())}"
        target_domain_id = self.manager.register_domain(target_domain)
        
        # Add a relationship
        self.manager.add_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain_id,
            relationship_type="trusted",
            trust_direction="bidirectional",
            trust_level=0.8,
            description="Test relationship"
        )
        
        # Update the relationship
        result = self.manager.add_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain_id,
            relationship_type="distrusted",
            trust_direction="outbound",
            trust_level=0.2,
            description="Updated relationship"
        )
        
        # Verify the relationship was updated successfully
        self.assertTrue(result)
        
        # Get the source domain
        source_domain = self.manager.get_domain(source_domain_id)
        
        # Verify the relationship was updated
        self.assertEqual(len(source_domain["relationships"]), 1)
        self.assertEqual(source_domain["relationships"][0]["relationship_type"], "distrusted")
        self.assertEqual(source_domain["relationships"][0]["trust_direction"], "outbound")
        self.assertEqual(source_domain["relationships"][0]["trust_level"], 0.2)
        self.assertEqual(source_domain["relationships"][0]["description"], "Updated relationship")

    def test_remove_domain_relationship(self):
        """Test removing a relationship between domains."""
        # Register two domains
        source_domain_id = self.manager.register_domain(self.sample_domain)
        
        target_domain = self.sample_domain.copy()
        target_domain["domain_id"] = f"domain-{str(uuid.uuid4())}"
        target_domain_id = self.manager.register_domain(target_domain)
        
        # Add a relationship
        self.manager.add_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain_id,
            relationship_type="trusted",
            trust_direction="bidirectional"
        )
        
        # Remove the relationship
        result = self.manager.remove_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain_id
        )
        
        # Verify the relationship was removed successfully
        self.assertTrue(result)
        
        # Get the source domain
        source_domain = self.manager.get_domain(source_domain_id)
        
        # Verify the relationship was removed
        self.assertEqual(len(source_domain["relationships"]), 0)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_remove_nonexistent_relationship(self):
        """Test removing a nonexistent relationship."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to remove a nonexistent relationship
        result = self.manager.remove_domain_relationship(
            source_domain_id=domain_id,
            target_domain_id="nonexistent-domain"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_get_domain_relationships(self):
        """Test getting relationships for a domain."""
        # Register multiple domains
        source_domain_id = self.manager.register_domain(self.sample_domain)
        
        target_domain1 = self.sample_domain.copy()
        target_domain1["domain_id"] = f"domain-{str(uuid.uuid4())}"
        target_domain1_id = self.manager.register_domain(target_domain1)
        
        target_domain2 = self.sample_domain.copy()
        target_domain2["domain_id"] = f"domain-{str(uuid.uuid4())}"
        target_domain2_id = self.manager.register_domain(target_domain2)
        
        # Add relationships
        self.manager.add_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain1_id,
            relationship_type="trusted",
            trust_direction="bidirectional"
        )
        
        self.manager.add_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain2_id,
            relationship_type="parent",
            trust_direction="outbound"
        )
        
        # Get relationships for the domain
        relationships = self.manager.get_domain_relationships(source_domain_id)
        
        # Verify the relationships were returned
        self.assertEqual(len(relationships), 2)
        related_domain_ids = [r["related_domain_id"] for r in relationships]
        self.assertIn(target_domain1_id, related_domain_ids)
        self.assertIn(target_domain2_id, related_domain_ids)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_relationships_nonexistent_domain(self):
        """Test getting relationships for a nonexistent domain."""
        # Attempt to get relationships for a nonexistent domain
        relationships = self.manager.get_domain_relationships("nonexistent-domain")
        
        # Verify an empty list was returned
        self.assertEqual(len(relationships), 0)

    def test_calculate_domain_trust_level(self):
        """Test calculating trust level for a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Calculate trust level
        trust_level = self.manager.calculate_domain_trust_level(domain_id)
        
        # Verify the trust level was calculated
        self.assertIsNotNone(trust_level)
        self.assertIn("level", trust_level)
        self.assertIn("confidence", trust_level)
        self.assertIn("factors", trust_level)
        
        # Verify the factors were calculated
        self.assertEqual(len(trust_level["factors"]), 5)
        factor_ids = [f["factor_id"] for f in trust_level["factors"]]
        self.assertIn("attestation_factor", factor_ids)
        self.assertIn("compliance_factor", factor_ids)
        self.assertIn("history_factor", factor_ids)
        self.assertIn("integrity_factor", factor_ids)
        self.assertIn("governance_factor", factor_ids)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_calculate_trust_level_nonexistent_domain(self):
        """Test calculating trust level for a nonexistent domain."""
        # Attempt to calculate trust level for a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.calculate_domain_trust_level("nonexistent-domain")

    def test_associate_governance_policy(self):
        """Test associating a governance policy with a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Associate a policy
        result = self.manager.associate_governance_policy(
            domain_id=domain_id,
            policy_id="test-policy",
            policy_type="access-control",
            enforcement_level="strict"
        )
        
        # Verify the policy was associated successfully
        self.assertTrue(result)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the policy was associated with the domain
        self.assertIn("governance_policies", domain)
        self.assertEqual(len(domain["governance_policies"]), 1)
        self.assertEqual(domain["governance_policies"][0]["policy_id"], "test-policy")
        self.assertEqual(domain["governance_policies"][0]["policy_type"], "access-control")
        self.assertEqual(domain["governance_policies"][0]["enforcement_level"], "strict")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_associate_policy_nonexistent_domain(self):
        """Test associating a policy with a nonexistent domain."""
        # Attempt to associate a policy with a nonexistent domain
        result = self.manager.associate_governance_policy(
            domain_id="nonexistent-domain",
            policy_id="test-policy",
            policy_type="access-control"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_update_governance_policy(self):
        """Test updating a governance policy association."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Associate a policy
        self.manager.associate_governance_policy(
            domain_id=domain_id,
            policy_id="test-policy",
            policy_type="access-control",
            enforcement_level="mandatory"
        )
        
        # Update the policy association
        result = self.manager.associate_governance_policy(
            domain_id=domain_id,
            policy_id="test-policy",
            policy_type="data-protection",
            enforcement_level="strict"
        )
        
        # Verify the policy was updated successfully
        self.assertTrue(result)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the policy was updated
        self.assertEqual(len(domain["governance_policies"]), 1)
        self.assertEqual(domain["governance_policies"][0]["policy_type"], "data-protection")
        self.assertEqual(domain["governance_policies"][0]["enforcement_level"], "strict")

    def test_remove_governance_policy(self):
        """Test removing a governance policy association."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Associate a policy
        self.manager.associate_governance_policy(
            domain_id=domain_id,
            policy_id="test-policy",
            policy_type="access-control"
        )
        
        # Remove the policy
        result = self.manager.remove_governance_policy(
            domain_id=domain_id,
            policy_id="test-policy"
        )
        
        # Verify the policy was removed successfully
        self.assertTrue(result)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the policy was removed
        self.assertEqual(len(domain["governance_policies"]), 0)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_remove_nonexistent_policy(self):
        """Test removing a nonexistent policy."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to remove a nonexistent policy
        result = self.manager.remove_governance_policy(
            domain_id=domain_id,
            policy_id="nonexistent-policy"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_get_domain_governance_policies(self):
        """Test getting governance policies for a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Associate multiple policies
        self.manager.associate_governance_policy(
            domain_id=domain_id,
            policy_id="policy-1",
            policy_type="access-control",
            enforcement_level="mandatory"
        )
        
        self.manager.associate_governance_policy(
            domain_id=domain_id,
            policy_id="policy-2",
            policy_type="data-protection",
            enforcement_level="strict"
        )
        
        # Get policies for the domain
        policies = self.manager.get_domain_governance_policies(domain_id)
        
        # Verify the policies were returned
        self.assertEqual(len(policies), 2)
        policy_ids = [p["policy_id"] for p in policies]
        self.assertIn("policy-1", policy_ids)
        self.assertIn("policy-2", policy_ids)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_policies_nonexistent_domain(self):
        """Test getting policies for a nonexistent domain."""
        # Attempt to get policies for a nonexistent domain
        policies = self.manager.get_domain_governance_policies("nonexistent-domain")
        
        # Verify an empty list was returned
        self.assertEqual(len(policies), 0)

    def test_add_domain_attestation(self):
        """Test adding an attestation to a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add an attestation
        claims = [
            {
                "claim_id": "claim-1",
                "claim_type": "identity",
                "claim_value": "test-value"
            }
        ]
        
        attestation_id = self.manager.add_domain_attestation(
            domain_id=domain_id,
            attester_id="test-attester",
            claims=claims
        )
        
        # Verify the attestation was added successfully
        self.assertIsNotNone(attestation_id)
        self.assertEqual(attestation_id, "test-attestation-id")
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the attestation was added to the domain
        self.assertIn("attestations", domain)
        self.assertEqual(len(domain["attestations"]), 1)
        self.assertEqual(domain["attestations"][0]["attestation_id"], "test-attestation-id")
        self.assertEqual(domain["attestations"][0]["attester_id"], "test-attester")
        self.assertEqual(domain["attestations"][0]["claims"], claims)
        
        # Verify attestation service was used
        self.attestation_service.create_attestation.assert_called_with(
            attester_id="test-attester",
            claims=claims,
            subject_id=domain_id,
            subject_type="trust_domain"
        )
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_add_attestation_nonexistent_domain(self):
        """Test adding an attestation to a nonexistent domain."""
        # Attempt to add an attestation to a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.add_domain_attestation(
                domain_id="nonexistent-domain",
                attester_id="test-attester",
                claims=[]
            )

    def test_remove_domain_attestation(self):
        """Test removing an attestation from a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add an attestation
        attestation_id = self.manager.add_domain_attestation(
            domain_id=domain_id,
            attester_id="test-attester",
            claims=[]
        )
        
        # Remove the attestation
        result = self.manager.remove_domain_attestation(
            domain_id=domain_id,
            attestation_id=attestation_id
        )
        
        # Verify the attestation was removed successfully
        self.assertTrue(result)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the attestation was removed
        self.assertEqual(len(domain["attestations"]), 0)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_remove_nonexistent_attestation(self):
        """Test removing a nonexistent attestation."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to remove a nonexistent attestation
        result = self.manager.remove_domain_attestation(
            domain_id=domain_id,
            attestation_id="nonexistent-attestation"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_get_domain_attestations(self):
        """Test getting attestations for a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add multiple attestations
        attestation_id1 = self.manager.add_domain_attestation(
            domain_id=domain_id,
            attester_id="attester-1",
            claims=[]
        )
        
        # Configure attestation service to return a different attestation
        self.attestation_service.create_attestation.return_value = "test-attestation-id-2"
        self.attestation_service.get_attestation.side_effect = lambda attestation_id: {
            "attestation_id": attestation_id,
            "attester_id": "attester-2" if attestation_id == "test-attestation-id-2" else "attester-1",
            "timestamp": datetime.utcnow().isoformat(),
            "validity_period": {
                "start": datetime.utcnow().isoformat(),
                "end": datetime.utcnow().replace(year=datetime.utcnow().year + 1).isoformat()
            }
        }
        
        attestation_id2 = self.manager.add_domain_attestation(
            domain_id=domain_id,
            attester_id="attester-2",
            claims=[]
        )
        
        # Reset mock behavior
        self.attestation_service.create_attestation.return_value = "test-attestation-id"
        self.attestation_service.get_attestation.side_effect = None
        
        # Get attestations for the domain
        attestations = self.manager.get_domain_attestations(domain_id)
        
        # Verify the attestations were returned
        self.assertEqual(len(attestations), 2)
        attestation_ids = [a["attestation_id"] for a in attestations]
        self.assertIn(attestation_id1, attestation_ids)
        self.assertIn(attestation_id2, attestation_ids)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_attestations_nonexistent_domain(self):
        """Test getting attestations for a nonexistent domain."""
        # Attempt to get attestations for a nonexistent domain
        attestations = self.manager.get_domain_attestations("nonexistent-domain")
        
        # Verify an empty list was returned
        self.assertEqual(len(attestations), 0)

    def test_add_domain_component(self):
        """Test adding a component to a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add a component
        result = self.manager.add_domain_component(
            domain_id=domain_id,
            component_id="test-component",
            component_type="service",
            description="Test component"
        )
        
        # Verify the component was added successfully
        self.assertTrue(result)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the component was added to the domain
        self.assertIn("components", domain)
        self.assertEqual(len(domain["components"]), 1)
        self.assertEqual(domain["components"][0]["component_id"], "test-component")
        self.assertEqual(domain["components"][0]["component_type"], "service")
        self.assertEqual(domain["components"][0]["description"], "Test component")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_add_component_nonexistent_domain(self):
        """Test adding a component to a nonexistent domain."""
        # Attempt to add a component to a nonexistent domain
        result = self.manager.add_domain_component(
            domain_id="nonexistent-domain",
            component_id="test-component",
            component_type="service"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_update_domain_component(self):
        """Test updating a component in a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add a component
        self.manager.add_domain_component(
            domain_id=domain_id,
            component_id="test-component",
            component_type="service",
            description="Test component"
        )
        
        # Update the component
        result = self.manager.add_domain_component(
            domain_id=domain_id,
            component_id="test-component",
            component_type="database",
            description="Updated component"
        )
        
        # Verify the component was updated successfully
        self.assertTrue(result)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the component was updated
        self.assertEqual(len(domain["components"]), 1)
        self.assertEqual(domain["components"][0]["component_type"], "database")
        self.assertEqual(domain["components"][0]["description"], "Updated component")

    def test_remove_domain_component(self):
        """Test removing a component from a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add a component
        self.manager.add_domain_component(
            domain_id=domain_id,
            component_id="test-component",
            component_type="service"
        )
        
        # Remove the component
        result = self.manager.remove_domain_component(
            domain_id=domain_id,
            component_id="test-component"
        )
        
        # Verify the component was removed successfully
        self.assertTrue(result)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the component was removed
        self.assertEqual(len(domain["components"]), 0)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_remove_nonexistent_component(self):
        """Test removing a nonexistent component."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to remove a nonexistent component
        result = self.manager.remove_domain_component(
            domain_id=domain_id,
            component_id="nonexistent-component"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_get_domain_components(self):
        """Test getting components for a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add multiple components
        self.manager.add_domain_component(
            domain_id=domain_id,
            component_id="component-1",
            component_type="service"
        )
        
        self.manager.add_domain_component(
            domain_id=domain_id,
            component_id="component-2",
            component_type="database"
        )
        
        # Get components for the domain
        components = self.manager.get_domain_components(domain_id)
        
        # Verify the components were returned
        self.assertEqual(len(components), 2)
        component_ids = [c["component_id"] for c in components]
        self.assertIn("component-1", component_ids)
        self.assertIn("component-2", component_ids)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_components_nonexistent_domain(self):
        """Test getting components for a nonexistent domain."""
        # Attempt to get components for a nonexistent domain
        components = self.manager.get_domain_components("nonexistent-domain")
        
        # Verify an empty list was returned
        self.assertEqual(len(components), 0)

    def test_associate_domain_with_boundary(self):
        """Test associating a domain with a boundary."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Associate a boundary
        result = self.manager.associate_domain_with_boundary(
            domain_id=domain_id,
            boundary_id="test-boundary",
            relationship="defines"
        )
        
        # Verify the association was created successfully
        self.assertTrue(result)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the boundary was associated with the domain
        self.assertIn("boundaries", domain)
        self.assertEqual(len(domain["boundaries"]), 1)
        self.assertEqual(domain["boundaries"][0]["boundary_id"], "test-boundary")
        self.assertEqual(domain["boundaries"][0]["relationship"], "defines")
        
        # Verify boundary detection engine was used
        self.boundary_detection_engine.get_boundary.assert_called_with("test-boundary")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_associate_with_nonexistent_boundary(self):
        """Test associating a domain with a nonexistent boundary."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Configure boundary detection engine to return None
        self.boundary_detection_engine.get_boundary.return_value = None
        
        # Attempt to associate a nonexistent boundary
        result = self.manager.associate_domain_with_boundary(
            domain_id=domain_id,
            boundary_id="nonexistent-boundary",
            relationship="defines"
        )
        
        # Verify the operation failed
        self.assertFalse(result)
        
        # Reset mock behavior
        self.boundary_detection_engine.get_boundary.return_value = {
            "boundary_id": "test-boundary",
            "name": "Test Boundary",
            "boundary_type": "process",
            "status": "active"
        }

    def test_associate_with_invalid_relationship(self):
        """Test associating a domain with a boundary using an invalid relationship."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to associate a boundary with an invalid relationship
        result = self.manager.associate_domain_with_boundary(
            domain_id=domain_id,
            boundary_id="test-boundary",
            relationship="invalid-relationship"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_update_domain_boundary_association(self):
        """Test updating a domain-boundary association."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Associate a boundary
        self.manager.associate_domain_with_boundary(
            domain_id=domain_id,
            boundary_id="test-boundary",
            relationship="defines"
        )
        
        # Update the association
        result = self.manager.associate_domain_with_boundary(
            domain_id=domain_id,
            boundary_id="test-boundary",
            relationship="contains"
        )
        
        # Verify the association was updated successfully
        self.assertTrue(result)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the association was updated
        self.assertEqual(len(domain["boundaries"]), 1)
        self.assertEqual(domain["boundaries"][0]["relationship"], "contains")

    def test_remove_domain_boundary_association(self):
        """Test removing a domain-boundary association."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Associate a boundary
        self.manager.associate_domain_with_boundary(
            domain_id=domain_id,
            boundary_id="test-boundary",
            relationship="defines"
        )
        
        # Remove the association
        result = self.manager.remove_domain_boundary_association(
            domain_id=domain_id,
            boundary_id="test-boundary"
        )
        
        # Verify the association was removed successfully
        self.assertTrue(result)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the association was removed
        self.assertEqual(len(domain["boundaries"]), 0)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_remove_nonexistent_boundary_association(self):
        """Test removing a nonexistent boundary association."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to remove a nonexistent association
        result = self.manager.remove_domain_boundary_association(
            domain_id=domain_id,
            boundary_id="nonexistent-boundary"
        )
        
        # Verify the operation failed
        self.assertFalse(result)

    def test_get_domain_boundaries(self):
        """Test getting boundaries for a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Associate multiple boundaries
        self.manager.associate_domain_with_boundary(
            domain_id=domain_id,
            boundary_id="boundary-1",
            relationship="defines"
        )
        
        self.manager.associate_domain_with_boundary(
            domain_id=domain_id,
            boundary_id="boundary-2",
            relationship="contains"
        )
        
        # Get boundaries for the domain
        boundaries = self.manager.get_domain_boundaries(domain_id)
        
        # Verify the boundaries were returned
        self.assertEqual(len(boundaries), 2)
        boundary_ids = [b["boundary_id"] for b in boundaries]
        self.assertIn("boundary-1", boundary_ids)
        self.assertIn("boundary-2", boundary_ids)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_boundaries_nonexistent_domain(self):
        """Test getting boundaries for a nonexistent domain."""
        # Attempt to get boundaries for a nonexistent domain
        boundaries = self.manager.get_domain_boundaries("nonexistent-domain")
        
        # Verify an empty list was returned
        self.assertEqual(len(boundaries), 0)

    def test_get_domain_evolution_history(self):
        """Test getting evolution history for a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Perform various operations to generate evolution events
        self.manager.update_domain(domain_id, {"name": "Updated Domain"})
        self.manager.add_domain_component(domain_id, "test-component", "service")
        self.manager.associate_domain_with_boundary(domain_id, "test-boundary", "defines")
        
        # Get evolution history for the domain
        history = self.manager.get_domain_evolution_history(domain_id)
        
        # Verify the history was returned
        self.assertGreaterEqual(len(history), 4)  # Created + 3 operations
        
        # Verify the history contains the expected events
        event_types = [e["evolution_type"] for e in history]
        self.assertIn("created", event_types)
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()

    def test_get_history_nonexistent_domain(self):
        """Test getting evolution history for a nonexistent domain."""
        # Attempt to get history for a nonexistent domain
        history = self.manager.get_domain_evolution_history("nonexistent-domain")
        
        # Verify an empty list was returned
        self.assertEqual(len(history), 0)

    def test_merge_domains(self):
        """Test merging multiple domains."""
        # Register source domains
        domain1_id = self.manager.register_domain(self.sample_domain)
        
        domain2 = self.sample_domain.copy()
        domain2["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain2_id = self.manager.register_domain(domain2)
        
        # Add components to the domains
        self.manager.add_domain_component(domain1_id, "component-1", "service")
        self.manager.add_domain_component(domain2_id, "component-2", "database")
        
        # Create a new domain definition for the merged domain
        merged_domain = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Merged Domain",
            "description": "A merged domain",
            "domain_type": "application",
            "classification": "confidential",
            "status": "active"
        }
        
        # Merge the domains
        merged_domain_id = self.manager.merge_domains(
            source_domain_ids=[domain1_id, domain2_id],
            new_domain_definition=merged_domain
        )
        
        # Verify the merged domain was created
        self.assertIsNotNone(merged_domain_id)
        self.assertEqual(merged_domain_id, merged_domain["domain_id"])
        
        # Get the merged domain
        merged = self.manager.get_domain(merged_domain_id)
        
        # Verify the merged domain contains components from both source domains
        self.assertIn("components", merged)
        self.assertEqual(len(merged["components"]), 2)
        component_ids = [c["component_id"] for c in merged["components"]]
        self.assertIn("component-1", component_ids)
        self.assertIn("component-2", component_ids)
        
        # Verify the source domains were deprecated
        domain1 = self.manager.get_domain(domain1_id)
        domain2 = self.manager.get_domain(domain2_id)
        self.assertEqual(domain1["status"], "deprecated")
        self.assertEqual(domain2["status"], "deprecated")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_merge_nonexistent_domains(self):
        """Test merging nonexistent domains."""
        # Create a new domain definition
        merged_domain = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Merged Domain",
            "description": "A merged domain",
            "domain_type": "application",
            "classification": "confidential",
            "status": "active"
        }
        
        # Attempt to merge nonexistent domains
        with self.assertRaises(ValueError):
            self.manager.merge_domains(
                source_domain_ids=["nonexistent-domain-1", "nonexistent-domain-2"],
                new_domain_definition=merged_domain
            )

    def test_split_domain(self):
        """Test splitting a domain."""
        # Register a domain with components
        domain_id = self.manager.register_domain(self.sample_domain)
        self.manager.add_domain_component(domain_id, "component-1", "service")
        self.manager.add_domain_component(domain_id, "component-2", "database")
        
        # Create new domain definitions for the split domains
        domain1 = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Split Domain 1",
            "description": "First split domain",
            "domain_type": "application",
            "classification": "confidential",
            "status": "active"
        }
        
        domain2 = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Split Domain 2",
            "description": "Second split domain",
            "domain_type": "security",
            "classification": "restricted",
            "status": "active"
        }
        
        # Split the domain
        new_domain_ids = self.manager.split_domain(
            source_domain_id=domain_id,
            new_domain_definitions=[domain1, domain2]
        )
        
        # Verify the new domains were created
        self.assertEqual(len(new_domain_ids), 2)
        self.assertEqual(new_domain_ids[0], domain1["domain_id"])
        self.assertEqual(new_domain_ids[1], domain2["domain_id"])
        
        # Verify the source domain was deprecated
        source_domain = self.manager.get_domain(domain_id)
        self.assertEqual(source_domain["status"], "deprecated")
        
        # Verify contract tether verification was called
        self.seal_verification_service.verify_contract_tether.assert_called()
        
        # Verify evolution protocol was used
        self.evolution_protocol.record_evolution.assert_called()

    def test_split_nonexistent_domain(self):
        """Test splitting a nonexistent domain."""
        # Create new domain definitions
        domain1 = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Split Domain 1",
            "description": "First split domain",
            "domain_type": "application",
            "classification": "confidential",
            "status": "active"
        }
        
        # Attempt to split a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.split_domain(
                source_domain_id="nonexistent-domain",
                new_domain_definitions=[domain1]
            )

    def test_file_operations(self):
        """Test file operations (load and save)."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Create a new manager instance with the same file path
        new_manager = TrustDomainManager(
            boundary_detection_engine=self.boundary_detection_engine,
            governance_primitive_manager=self.governance_primitive_manager,
            attestation_service=self.attestation_service,
            evolution_protocol=self.evolution_protocol,
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            domains_file_path=self.test_domains_file
        )
        
        # Verify the domain was loaded from the file
        self.assertIn(domain_id, new_manager.domains)
        self.assertEqual(new_manager.domains[domain_id]["name"], self.sample_domain["name"])

    def test_contract_tether_verification_failure(self):
        """Test behavior when contract tether verification fails."""
        # Configure mock to fail contract tether verification
        self.seal_verification_service.verify_contract_tether.return_value = False
        
        # Attempt to register a domain
        with self.assertRaises(ValueError):
            self.manager.register_domain(self.sample_domain)

if __name__ == '__main__':
    unittest.main()
