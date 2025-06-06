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
        
        # Configure mock behavior with proper object-like return values
        # Create a validation result object with is_valid attribute
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        validation_result.phase_id = "5.7"
        validation_result.codex_clauses = ["5.7", "5.6", "11.0", "11.1", "11.4", "12.25"]
        validation_result.timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Explicitly add validate method to schema_validator mock
        self.schema_validator.validate_object = MagicMock(return_value=validation_result)
        self.schema_validator.validate = MagicMock(return_value=validation_result)
        
        # Explicitly add methods to seal_verification_service mock
        self.seal_verification_service.create_seal = MagicMock(return_value="mock-seal")
        self.seal_verification_service.verify_seal = MagicMock(return_value=True)
        self.seal_verification_service.verify_contract_tether = MagicMock(return_value=True)
        
        # Explicitly add record_evolution method to evolution_protocol mock
        self.evolution_protocol.record_evolution = MagicMock(return_value={
            "evolution_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "previous_version": "1.0.0",
            "new_version": "1.0.1"
        })
        
        # Configure boundary detection engine mock
        self.boundary_detection_engine.get_boundary.return_value = {
            "boundary_id": "test-boundary",
            "name": "Test Boundary",
            "boundary_type": "process",
            "classification": "confidential",
            "status": "active"
        }
        
        # Create a temporary file for testing
        self.test_domains_file = "/tmp/test_domains.json"
        if os.path.exists(self.test_domains_file):
            os.remove(self.test_domains_file)
        
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
            "description": "A test domain",
            "domain_type": "application",
            "classification": "confidential",
            "status": "active"
        }
    
    def tearDown(self):
        """Clean up after tests."""
        if os.path.exists(self.test_domains_file):
            os.remove(self.test_domains_file)
    
    def test_initialization(self):
        """Test initialization of the TrustDomainManager."""
        self.assertIsInstance(self.manager, TrustDomainManager)
        self.assertEqual(self.manager.domains, {})
    
    def test_register_domain(self):
        """Test registering a domain."""
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Verify the domain was registered
        self.assertIn(domain_id, self.manager.domains)
        self.assertEqual(self.manager.domains[domain_id]["name"], self.sample_domain["name"])
    
    def test_register_domain_with_invalid_schema(self):
        """Test registering a domain with an invalid schema."""
        # Configure mock to fail validation
        invalid_result = MagicMock()
        invalid_result.is_valid = False
        invalid_result.errors = ["Invalid schema"]
        invalid_result.phase_id = "5.7"
        invalid_result.codex_clauses = ["5.7", "5.6", "11.0", "11.1", "11.4", "12.25"]
        invalid_result.timestamp = datetime.utcnow().isoformat() + "Z"
        
        self.schema_validator.validate_object.return_value = invalid_result
        
        # Attempt to register a domain with an invalid schema
        with self.assertRaises(ValueError):
            self.manager.register_domain(self.sample_domain)
    
    def test_get_domain(self):
        """Test getting a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Get the domain
        domain = self.manager.get_domain(domain_id)
        
        # Verify the domain was returned
        self.assertEqual(domain["name"], self.sample_domain["name"])
    
    def test_get_nonexistent_domain(self):
        """Test getting a nonexistent domain."""
        # Attempt to get a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.get_domain("nonexistent-domain")
    
    def test_update_domain(self):
        """Test updating a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Update the domain
        updated_domain = self.sample_domain.copy()
        updated_domain["name"] = "Updated Domain"
        self.manager.update_domain(domain_id, updated_domain)
        
        # Verify the domain was updated
        self.assertEqual(self.manager.domains[domain_id]["name"], "Updated Domain")
    
    def test_update_nonexistent_domain(self):
        """Test updating a nonexistent domain."""
        # Attempt to update a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.update_domain("nonexistent-domain", self.sample_domain)
    
    def test_delete_domain(self):
        """Test deleting a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Delete the domain
        self.manager.delete_domain(domain_id)
        
        # Verify the domain was deleted
        self.assertNotIn(domain_id, self.manager.domains)
    
    def test_delete_nonexistent_domain(self):
        """Test deleting a nonexistent domain."""
        # Attempt to delete a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.delete_domain("nonexistent-domain")
    
    def test_list_domains(self):
        """Test listing domains."""
        # Register domains
        domain1_id = self.manager.register_domain(self.sample_domain)
        
        domain2 = self.sample_domain.copy()
        domain2["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain2_id = self.manager.register_domain(domain2)
        
        # List domains
        domains = self.manager.list_domains()
        
        # Verify the domains were listed
        self.assertIn(domain1_id, domains)
        self.assertIn(domain2_id, domains)
    
    def test_add_domain_component(self):
        """Test adding a component to a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add a component
        component_id = "test-component"
        component_type = "service"
        self.manager.add_domain_component(domain_id, component_id, component_type)
        
        # Verify the component was added
        self.assertIn(component_id, self.manager.domains[domain_id]["components"])
        self.assertEqual(self.manager.domains[domain_id]["components"][component_id]["type"], component_type)
    
    def test_add_component_to_nonexistent_domain(self):
        """Test adding a component to a nonexistent domain."""
        # Attempt to add a component to a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.add_domain_component("nonexistent-domain", "test-component", "service")
    
    def test_update_domain_component(self):
        """Test updating a component in a domain."""
        # Register a domain and add a component
        domain_id = self.manager.register_domain(self.sample_domain)
        component_id = "test-component"
        component_type = "service"
        self.manager.add_domain_component(domain_id, component_id, component_type)
        
        # Update the component
        updated_component = {
            "type": "database",
            "description": "Updated component"
        }
        self.manager.update_domain_component(domain_id, component_id, updated_component)
        
        # Verify the component was updated
        self.assertEqual(self.manager.domains[domain_id]["components"][component_id]["type"], "database")
        self.assertEqual(self.manager.domains[domain_id]["components"][component_id]["description"], "Updated component")
    
    def test_update_nonexistent_component(self):
        """Test updating a nonexistent component."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to update a nonexistent component
        with self.assertRaises(ValueError):
            self.manager.update_domain_component(domain_id, "nonexistent-component", {"type": "service"})
    
    def test_remove_domain_component(self):
        """Test removing a component from a domain."""
        # Register a domain and add a component
        domain_id = self.manager.register_domain(self.sample_domain)
        component_id = "test-component"
        component_type = "service"
        self.manager.add_domain_component(domain_id, component_id, component_type)
        
        # Remove the component
        self.manager.remove_domain_component(domain_id, component_id)
        
        # Verify the component was removed
        self.assertNotIn(component_id, self.manager.domains[domain_id]["components"])
    
    def test_remove_nonexistent_component(self):
        """Test removing a nonexistent component."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to remove a nonexistent component
        with self.assertRaises(ValueError):
            self.manager.remove_domain_component(domain_id, "nonexistent-component")
    
    def test_add_domain_relationship(self):
        """Test adding a relationship between domains."""
        # Register domains
        domain1_id = self.manager.register_domain(self.sample_domain)
        
        domain2 = self.sample_domain.copy()
        domain2["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain2_id = self.manager.register_domain(domain2)
        
        # Add a relationship
        relationship_type = "depends-on"
        self.manager.add_domain_relationship(domain1_id, domain2_id, relationship_type)
        
        # Verify the relationship was added
        self.assertIn(domain2_id, self.manager.domains[domain1_id]["relationships"])
        self.assertEqual(self.manager.domains[domain1_id]["relationships"][domain2_id]["type"], relationship_type)
    
    def test_add_relationship_to_nonexistent_domain(self):
        """Test adding a relationship to a nonexistent domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to add a relationship to a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.add_domain_relationship(domain_id, "nonexistent-domain", "depends-on")
    
    def test_update_domain_relationship(self):
        """Test updating a relationship between domains."""
        # Register domains and add a relationship
        domain1_id = self.manager.register_domain(self.sample_domain)
        
        domain2 = self.sample_domain.copy()
        domain2["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain2_id = self.manager.register_domain(domain2)
        
        relationship_type = "depends-on"
        self.manager.add_domain_relationship(domain1_id, domain2_id, relationship_type)
        
        # Update the relationship
        updated_relationship = {
            "type": "contains",
            "description": "Updated relationship"
        }
        self.manager.update_domain_relationship(domain1_id, domain2_id, updated_relationship)
        
        # Verify the relationship was updated
        self.assertEqual(self.manager.domains[domain1_id]["relationships"][domain2_id]["type"], "contains")
        self.assertEqual(self.manager.domains[domain1_id]["relationships"][domain2_id]["description"], "Updated relationship")
    
    def test_update_nonexistent_relationship(self):
        """Test updating a nonexistent relationship."""
        # Register domains
        domain1_id = self.manager.register_domain(self.sample_domain)
        
        domain2 = self.sample_domain.copy()
        domain2["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain2_id = self.manager.register_domain(domain2)
        
        # Attempt to update a nonexistent relationship
        with self.assertRaises(ValueError):
            self.manager.update_domain_relationship(domain1_id, domain2_id, {"type": "contains"})
    
    def test_remove_domain_relationship(self):
        """Test removing a relationship between domains."""
        # Register domains and add a relationship
        domain1_id = self.manager.register_domain(self.sample_domain)
        
        domain2 = self.sample_domain.copy()
        domain2["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain2_id = self.manager.register_domain(domain2)
        
        relationship_type = "depends-on"
        self.manager.add_domain_relationship(domain1_id, domain2_id, relationship_type)
        
        # Remove the relationship
        self.manager.remove_domain_relationship(domain1_id, domain2_id)
        
        # Verify the relationship was removed
        self.assertNotIn(domain2_id, self.manager.domains[domain1_id]["relationships"])
    
    def test_remove_nonexistent_relationship(self):
        """Test removing a nonexistent relationship."""
        # Register domains
        domain1_id = self.manager.register_domain(self.sample_domain)
        
        domain2 = self.sample_domain.copy()
        domain2["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain2_id = self.manager.register_domain(domain2)
        
        # Attempt to remove a nonexistent relationship
        with self.assertRaises(ValueError):
            self.manager.remove_domain_relationship(domain1_id, domain2_id)
    
    def test_add_domain_boundary_association(self):
        """Test adding a boundary association to a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add a boundary association
        boundary_id = "test-boundary"
        self.manager.add_domain_boundary_association(domain_id, boundary_id)
        
        # Verify the boundary association was added
        self.assertIn(boundary_id, self.manager.domains[domain_id]["boundaries"])
    
    def test_add_boundary_association_to_nonexistent_domain(self):
        """Test adding a boundary association to a nonexistent domain."""
        # Attempt to add a boundary association to a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.add_domain_boundary_association("nonexistent-domain", "test-boundary")
    
    def test_update_domain_boundary_association(self):
        """Test updating a boundary association in a domain."""
        # Register a domain and add a boundary association
        domain_id = self.manager.register_domain(self.sample_domain)
        boundary_id = "test-boundary"
        self.manager.add_domain_boundary_association(domain_id, boundary_id)
        
        # Update the boundary association
        updated_association = {
            "description": "Updated boundary association"
        }
        self.manager.update_domain_boundary_association(domain_id, boundary_id, updated_association)
        
        # Verify the boundary association was updated
        self.assertEqual(self.manager.domains[domain_id]["boundaries"][boundary_id]["description"], "Updated boundary association")
    
    def test_update_nonexistent_boundary_association(self):
        """Test updating a nonexistent boundary association."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to update a nonexistent boundary association
        with self.assertRaises(ValueError):
            self.manager.update_domain_boundary_association(domain_id, "nonexistent-boundary", {"description": "Updated"})
    
    def test_remove_domain_boundary_association(self):
        """Test removing a boundary association from a domain."""
        # Register a domain and add a boundary association
        domain_id = self.manager.register_domain(self.sample_domain)
        boundary_id = "test-boundary"
        self.manager.add_domain_boundary_association(domain_id, boundary_id)
        
        # Remove the boundary association
        self.manager.remove_domain_boundary_association(domain_id, boundary_id)
        
        # Verify the boundary association was removed
        self.assertNotIn(boundary_id, self.manager.domains[domain_id]["boundaries"])
    
    def test_remove_nonexistent_boundary_association(self):
        """Test removing a nonexistent boundary association."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to remove a nonexistent boundary association
        with self.assertRaises(ValueError):
            self.manager.remove_domain_boundary_association(domain_id, "nonexistent-boundary")
    
    def test_add_domain_attestation(self):
        """Test adding an attestation to a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add an attestation
        attestation_id = "test-attestation"
        attestation_type = "compliance"
        self.manager.add_domain_attestation(domain_id, attestation_id, attestation_type)
        
        # Verify the attestation was added
        self.assertIn(attestation_id, self.manager.domains[domain_id]["attestations"])
        self.assertEqual(self.manager.domains[domain_id]["attestations"][attestation_id]["type"], attestation_type)
    
    def test_add_attestation_to_nonexistent_domain(self):
        """Test adding an attestation to a nonexistent domain."""
        # Attempt to add an attestation to a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.add_domain_attestation("nonexistent-domain", "test-attestation", "compliance")
    
    def test_remove_domain_attestation(self):
        """Test removing an attestation from a domain."""
        # Register a domain and add an attestation
        domain_id = self.manager.register_domain(self.sample_domain)
        attestation_id = "test-attestation"
        attestation_type = "compliance"
        self.manager.add_domain_attestation(domain_id, attestation_id, attestation_type)
        
        # Remove the attestation
        self.manager.remove_domain_attestation(domain_id, attestation_id)
        
        # Verify the attestation was removed
        self.assertNotIn(attestation_id, self.manager.domains[domain_id]["attestations"])
    
    def test_remove_nonexistent_attestation(self):
        """Test removing a nonexistent attestation."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to remove a nonexistent attestation
        with self.assertRaises(ValueError):
            self.manager.remove_domain_attestation(domain_id, "nonexistent-attestation")
    
    def test_add_governance_policy(self):
        """Test adding a governance policy to a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Add a governance policy
        policy_id = "test-policy"
        policy_type = "security"
        self.manager.add_governance_policy(domain_id, policy_id, policy_type)
        
        # Verify the policy was added
        self.assertIn(policy_id, self.manager.domains[domain_id]["governance_policies"])
        self.assertEqual(self.manager.domains[domain_id]["governance_policies"][policy_id]["type"], policy_type)
    
    def test_add_policy_to_nonexistent_domain(self):
        """Test adding a policy to a nonexistent domain."""
        # Attempt to add a policy to a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.add_governance_policy("nonexistent-domain", "test-policy", "security")
    
    def test_update_governance_policy(self):
        """Test updating a governance policy in a domain."""
        # Register a domain and add a policy
        domain_id = self.manager.register_domain(self.sample_domain)
        policy_id = "test-policy"
        policy_type = "security"
        self.manager.add_governance_policy(domain_id, policy_id, policy_type)
        
        # Update the policy
        updated_policy = {
            "type": "compliance",
            "description": "Updated policy"
        }
        self.manager.update_governance_policy(domain_id, policy_id, updated_policy)
        
        # Verify the policy was updated
        self.assertEqual(self.manager.domains[domain_id]["governance_policies"][policy_id]["type"], "compliance")
        self.assertEqual(self.manager.domains[domain_id]["governance_policies"][policy_id]["description"], "Updated policy")
    
    def test_update_nonexistent_policy(self):
        """Test updating a nonexistent policy."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to update a nonexistent policy
        with self.assertRaises(ValueError):
            self.manager.update_governance_policy(domain_id, "nonexistent-policy", {"type": "compliance"})
    
    def test_remove_governance_policy(self):
        """Test removing a governance policy from a domain."""
        # Register a domain and add a policy
        domain_id = self.manager.register_domain(self.sample_domain)
        policy_id = "test-policy"
        policy_type = "security"
        self.manager.add_governance_policy(domain_id, policy_id, policy_type)
        
        # Remove the policy
        self.manager.remove_governance_policy(domain_id, policy_id)
        
        # Verify the policy was removed
        self.assertNotIn(policy_id, self.manager.domains[domain_id]["governance_policies"])
    
    def test_remove_nonexistent_policy(self):
        """Test removing a nonexistent policy."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Attempt to remove a nonexistent policy
        with self.assertRaises(ValueError):
            self.manager.remove_governance_policy(domain_id, "nonexistent-policy")
    
    def test_get_domain_components(self):
        """Test getting components for a domain."""
        # Register a domain and add components
        domain_id = self.manager.register_domain(self.sample_domain)
        self.manager.add_domain_component(domain_id, "component-1", "service")
        self.manager.add_domain_component(domain_id, "component-2", "database")
        
        # Get the components
        components = self.manager.get_domain_components(domain_id)
        
        # Verify the components were returned
        self.assertIn("component-1", components)
        self.assertIn("component-2", components)
        self.assertEqual(components["component-1"]["type"], "service")
        self.assertEqual(components["component-2"]["type"], "database")
    
    def test_get_components_nonexistent_domain(self):
        """Test getting components for a nonexistent domain."""
        # Attempt to get components for a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.get_domain_components("nonexistent-domain")
    
    def test_get_domain_relationships(self):
        """Test getting relationships for a domain."""
        # Register domains and add relationships
        domain1_id = self.manager.register_domain(self.sample_domain)
        
        domain2 = self.sample_domain.copy()
        domain2["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain2_id = self.manager.register_domain(domain2)
        
        domain3 = self.sample_domain.copy()
        domain3["domain_id"] = f"domain-{str(uuid.uuid4())}"
        domain3_id = self.manager.register_domain(domain3)
        
        self.manager.add_domain_relationship(domain1_id, domain2_id, "depends-on")
        self.manager.add_domain_relationship(domain1_id, domain3_id, "contains")
        
        # Get the relationships
        relationships = self.manager.get_domain_relationships(domain1_id)
        
        # Verify the relationships were returned
        self.assertIn(domain2_id, relationships)
        self.assertIn(domain3_id, relationships)
        self.assertEqual(relationships[domain2_id]["type"], "depends-on")
        self.assertEqual(relationships[domain3_id]["type"], "contains")
    
    def test_get_relationships_nonexistent_domain(self):
        """Test getting relationships for a nonexistent domain."""
        # Attempt to get relationships for a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.get_domain_relationships("nonexistent-domain")
    
    def test_get_domain_boundaries(self):
        """Test getting boundaries for a domain."""
        # Register a domain and add boundary associations
        domain_id = self.manager.register_domain(self.sample_domain)
        self.manager.add_domain_boundary_association(domain_id, "boundary-1")
        self.manager.add_domain_boundary_association(domain_id, "boundary-2")
        
        # Get the boundaries
        boundaries = self.manager.get_domain_boundaries(domain_id)
        
        # Verify the boundaries were returned
        self.assertIn("boundary-1", boundaries)
        self.assertIn("boundary-2", boundaries)
    
    def test_get_boundaries_nonexistent_domain(self):
        """Test getting boundaries for a nonexistent domain."""
        # Attempt to get boundaries for a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.get_domain_boundaries("nonexistent-domain")
    
    def test_get_domain_attestations(self):
        """Test getting attestations for a domain."""
        # Register a domain and add attestations
        domain_id = self.manager.register_domain(self.sample_domain)
        self.manager.add_domain_attestation(domain_id, "attestation-1", "compliance")
        self.manager.add_domain_attestation(domain_id, "attestation-2", "security")
        
        # Get the attestations
        attestations = self.manager.get_domain_attestations(domain_id)
        
        # Verify the attestations were returned
        self.assertIn("attestation-1", attestations)
        self.assertIn("attestation-2", attestations)
        self.assertEqual(attestations["attestation-1"]["type"], "compliance")
        self.assertEqual(attestations["attestation-2"]["type"], "security")
    
    def test_get_attestations_nonexistent_domain(self):
        """Test getting attestations for a nonexistent domain."""
        # Attempt to get attestations for a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.get_domain_attestations("nonexistent-domain")
    
    def test_get_governance_policies(self):
        """Test getting governance policies for a domain."""
        # Register a domain and add policies
        domain_id = self.manager.register_domain(self.sample_domain)
        self.manager.add_governance_policy(domain_id, "policy-1", "security")
        self.manager.add_governance_policy(domain_id, "policy-2", "compliance")
        
        # Get the policies
        policies = self.manager.get_governance_policies(domain_id)
        
        # Verify the policies were returned
        self.assertIn("policy-1", policies)
        self.assertIn("policy-2", policies)
        self.assertEqual(policies["policy-1"]["type"], "security")
        self.assertEqual(policies["policy-2"]["type"], "compliance")
    
    def test_get_policies_nonexistent_domain(self):
        """Test getting policies for a nonexistent domain."""
        # Attempt to get policies for a nonexistent domain
        with self.assertRaises(ValueError):
            self.manager.get_governance_policies("nonexistent-domain")
    
    def test_get_domain_evolution_history(self):
        """Test getting evolution history for a domain."""
        # Register a domain
        domain_id = self.manager.register_domain(self.sample_domain)
        
        # Get the evolution history
        history = self.manager.get_domain_evolution_history(domain_id)
        
        # Verify the history was returned
        self.assertIsInstance(history, list)
        self.assertEqual(len(history), 1)  # Initial registration counts as an evolution event
    
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
        self.assertIn(merged_domain_id, self.manager.domains)
        self.assertEqual(self.manager.domains[merged_domain_id]["name"], "Merged Domain")
        
        # Verify components were merged
        components = self.manager.get_domain_components(merged_domain_id)
        self.assertIn("component-1", components)
        self.assertIn("component-2", components)
    
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
            "domain_type": "application",
            "classification": "confidential",
            "status": "active"
        }
        
        # Split the domain
        component_mapping = {
            "component-1": domain1["domain_id"],
            "component-2": domain2["domain_id"]
        }
        
        split_domain_ids = self.manager.split_domain(
            source_domain_id=domain_id,
            new_domain_definitions=[domain1, domain2],
            component_mapping=component_mapping
        )
        
        # Verify the split domains were created
        self.assertEqual(len(split_domain_ids), 2)
        self.assertIn(domain1["domain_id"], split_domain_ids)
        self.assertIn(domain2["domain_id"], split_domain_ids)
        
        # Verify components were split correctly
        components1 = self.manager.get_domain_components(domain1["domain_id"])
        self.assertIn("component-1", components1)
        self.assertNotIn("component-2", components1)
        
        components2 = self.manager.get_domain_components(domain2["domain_id"])
        self.assertIn("component-2", components2)
        self.assertNotIn("component-1", components2)
    
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
