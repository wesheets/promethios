"""
End-to-end tests for the Trust Boundary Definition framework.

This module contains end-to-end tests for the Trust Boundary Definition framework,
validating complete workflows and system behavior.
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
from src.integration.governance_integration_service import GovernanceIntegrationService

class TestTrustBoundaryE2E(unittest.TestCase):
    """End-to-end tests for the Trust Boundary Definition framework."""

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
        self.governance_integration_service = MagicMock(spec=GovernanceIntegrationService)
        
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

    def test_e2e_microservice_architecture_boundaries(self):
        """Test end-to-end workflow for defining microservice architecture boundaries."""
        # Step 1: Create trust domains for different parts of the architecture
        frontend_domain_id = self.trust_domain_manager.register_domain({
            "domain_id": f"frontend-domain-{str(uuid.uuid4())}",
            "name": "Frontend Domain",
            "description": "Domain for frontend services",
            "domain_type": "application",
            "classification": "public",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "frontend-team",
                "name": "Frontend Team",
                "role": "development"
            }
        })
        
        backend_domain_id = self.trust_domain_manager.register_domain({
            "domain_id": f"backend-domain-{str(uuid.uuid4())}",
            "name": "Backend Domain",
            "description": "Domain for backend services",
            "domain_type": "application",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "backend-team",
                "name": "Backend Team",
                "role": "development"
            }
        })
        
        data_domain_id = self.trust_domain_manager.register_domain({
            "domain_id": f"data-domain-{str(uuid.uuid4())}",
            "name": "Data Domain",
            "description": "Domain for data services",
            "domain_type": "data",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "data-team",
                "name": "Data Team",
                "role": "data-engineering"
            }
        })
        
        # Step 2: Add components to each domain
        self.trust_domain_manager.add_domain_component(
            domain_id=frontend_domain_id,
            component_id="web-ui",
            component_type="service",
            description="Web UI service"
        )
        
        self.trust_domain_manager.add_domain_component(
            domain_id=frontend_domain_id,
            component_id="mobile-api",
            component_type="service",
            description="Mobile API service"
        )
        
        self.trust_domain_manager.add_domain_component(
            domain_id=backend_domain_id,
            component_id="user-service",
            component_type="service",
            description="User management service"
        )
        
        self.trust_domain_manager.add_domain_component(
            domain_id=backend_domain_id,
            component_id="order-service",
            component_type="service",
            description="Order processing service"
        )
        
        self.trust_domain_manager.add_domain_component(
            domain_id=data_domain_id,
            component_id="user-db",
            component_type="database",
            description="User database"
        )
        
        self.trust_domain_manager.add_domain_component(
            domain_id=data_domain_id,
            component_id="order-db",
            component_type="database",
            description="Order database"
        )
        
        # Step 3: Create trust boundaries for each domain
        frontend_boundary_id = self.boundary_detection_engine.register_boundary({
            "boundary_id": f"frontend-boundary-{str(uuid.uuid4())}",
            "name": "Frontend Boundary",
            "description": "Trust boundary for frontend services",
            "boundary_type": "network",
            "classification": "public",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        })
        
        backend_boundary_id = self.boundary_detection_engine.register_boundary({
            "boundary_id": f"backend-boundary-{str(uuid.uuid4())}",
            "name": "Backend Boundary",
            "description": "Trust boundary for backend services",
            "boundary_type": "network",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        })
        
        data_boundary_id = self.boundary_detection_engine.register_boundary({
            "boundary_id": f"data-boundary-{str(uuid.uuid4())}",
            "name": "Data Boundary",
            "description": "Trust boundary for data services",
            "boundary_type": "data",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        })
        
        # Step 4: Add entry and exit points to boundaries
        # Frontend boundary entry points
        self.boundary_detection_engine.add_entry_point(
            boundary_id=frontend_boundary_id,
            entry_point={
                "entry_point_id": f"entry-point-{str(uuid.uuid4())}",
                "name": "Web UI Entry Point",
                "description": "Entry point for web UI",
                "protocol": "HTTPS",
                "port": 443,
                "path": "/",
                "authentication_required": False,
                "authorization_required": False
            }
        )
        
        self.boundary_detection_engine.add_entry_point(
            boundary_id=frontend_boundary_id,
            entry_point={
                "entry_point_id": f"entry-point-{str(uuid.uuid4())}",
                "name": "Mobile API Entry Point",
                "description": "Entry point for mobile API",
                "protocol": "HTTPS",
                "port": 443,
                "path": "/api/mobile",
                "authentication_required": True,
                "authorization_required": True
            }
        )
        
        # Frontend boundary exit points
        self.boundary_detection_engine.add_exit_point(
            boundary_id=frontend_boundary_id,
            exit_point={
                "exit_point_id": f"exit-point-{str(uuid.uuid4())}",
                "name": "Backend API Exit Point",
                "description": "Exit point to backend API",
                "protocol": "HTTPS",
                "port": 443,
                "path": "/api/backend",
                "authentication_required": True,
                "encryption_required": True
            }
        )
        
        # Backend boundary entry points
        self.boundary_detection_engine.add_entry_point(
            boundary_id=backend_boundary_id,
            entry_point={
                "entry_point_id": f"entry-point-{str(uuid.uuid4())}",
                "name": "Backend API Entry Point",
                "description": "Entry point for backend API",
                "protocol": "HTTPS",
                "port": 443,
                "path": "/api",
                "authentication_required": True,
                "authorization_required": True
            }
        )
        
        # Backend boundary exit points
        self.boundary_detection_engine.add_exit_point(
            boundary_id=backend_boundary_id,
            exit_point={
                "exit_point_id": f"exit-point-{str(uuid.uuid4())}",
                "name": "Data API Exit Point",
                "description": "Exit point to data API",
                "protocol": "HTTPS",
                "port": 443,
                "path": "/api/data",
                "authentication_required": True,
                "encryption_required": True
            }
        )
        
        # Data boundary entry points
        self.boundary_detection_engine.add_entry_point(
            boundary_id=data_boundary_id,
            entry_point={
                "entry_point_id": f"entry-point-{str(uuid.uuid4())}",
                "name": "Data API Entry Point",
                "description": "Entry point for data API",
                "protocol": "HTTPS",
                "port": 443,
                "path": "/api/data",
                "authentication_required": True,
                "authorization_required": True
            }
        )
        
        # Step 5: Add controls to boundaries
        # Frontend boundary controls
        self.boundary_detection_engine.add_boundary_control(
            boundary_id=frontend_boundary_id,
            control={
                "control_id": f"control-{str(uuid.uuid4())}",
                "control_type": "authentication",
                "name": "JWT Authentication",
                "description": "JWT-based authentication for API access",
                "implementation": {
                    "type": "token-based",
                    "mechanism": "JWT"
                },
                "status": "active"
            }
        )
        
        # Backend boundary controls
        self.boundary_detection_engine.add_boundary_control(
            boundary_id=backend_boundary_id,
            control={
                "control_id": f"control-{str(uuid.uuid4())}",
                "control_type": "authorization",
                "name": "Role-Based Access Control",
                "description": "RBAC for API access",
                "implementation": {
                    "type": "role-based",
                    "mechanism": "RBAC"
                },
                "status": "active"
            }
        )
        
        # Data boundary controls
        self.boundary_detection_engine.add_boundary_control(
            boundary_id=data_boundary_id,
            control={
                "control_id": f"control-{str(uuid.uuid4())}",
                "control_type": "encryption",
                "name": "Data Encryption",
                "description": "Encryption for sensitive data",
                "implementation": {
                    "type": "data-at-rest",
                    "mechanism": "AES-256"
                },
                "status": "active"
            }
        )
        
        # Step 6: Associate domains with boundaries
        self.trust_domain_manager.associate_domain_with_boundary(
            domain_id=frontend_domain_id,
            boundary_id=frontend_boundary_id,
            relationship="defines"
        )
        
        self.trust_domain_manager.associate_domain_with_boundary(
            domain_id=backend_domain_id,
            boundary_id=backend_boundary_id,
            relationship="defines"
        )
        
        self.trust_domain_manager.associate_domain_with_boundary(
            domain_id=data_domain_id,
            boundary_id=data_boundary_id,
            relationship="defines"
        )
        
        # Step 7: Define boundary crossings
        frontend_to_backend_crossing_id = self.boundary_crossing_protocol.register_crossing({
            "crossing_id": f"crossing-{str(uuid.uuid4())}",
            "source_boundary_id": frontend_boundary_id,
            "target_boundary_id": backend_boundary_id,
            "crossing_type": "api-call",
            "direction": "outbound",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "status": "active",
            "protocol": "HTTPS",
            "port": 443,
            "path": "/api/backend",
            "authentication_required": True,
            "authorization_required": True,
            "encryption_required": True
        })
        
        backend_to_data_crossing_id = self.boundary_crossing_protocol.register_crossing({
            "crossing_id": f"crossing-{str(uuid.uuid4())}",
            "source_boundary_id": backend_boundary_id,
            "target_boundary_id": data_boundary_id,
            "crossing_type": "data-access",
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
        })
        
        # Step 8: Add controls to crossings
        self.boundary_crossing_protocol.add_crossing_control(
            crossing_id=frontend_to_backend_crossing_id,
            control={
                "control_id": f"control-{str(uuid.uuid4())}",
                "control_type": "authentication",
                "name": "Service Authentication",
                "description": "Service-to-service authentication",
                "implementation": {
                    "type": "token-based",
                    "mechanism": "JWT"
                },
                "status": "active"
            }
        )
        
        self.boundary_crossing_protocol.add_crossing_control(
            crossing_id=backend_to_data_crossing_id,
            control={
                "control_id": f"control-{str(uuid.uuid4())}",
                "control_type": "encryption",
                "name": "TLS Encryption",
                "description": "TLS encryption for data in transit",
                "implementation": {
                    "type": "transport-layer",
                    "mechanism": "TLS 1.3"
                },
                "status": "active"
            }
        )
        
        # Step 9: Define domain relationships
        self.trust_domain_manager.add_domain_relationship(
            source_domain_id=frontend_domain_id,
            target_domain_id=backend_domain_id,
            relationship_type="trusted",
            trust_direction="outbound",
            trust_level=0.8,
            description="Frontend trusts backend for API services"
        )
        
        self.trust_domain_manager.add_domain_relationship(
            source_domain_id=backend_domain_id,
            target_domain_id=data_domain_id,
            relationship_type="trusted",
            trust_direction="outbound",
            trust_level=0.9,
            description="Backend trusts data domain for data services"
        )
        
        # Step 10: Verify boundary integrity
        frontend_verification = self.boundary_integrity_verifier.verify_boundary_integrity(frontend_boundary_id)
        backend_verification = self.boundary_integrity_verifier.verify_boundary_integrity(backend_boundary_id)
        data_verification = self.boundary_integrity_verifier.verify_boundary_integrity(data_boundary_id)
        
        # Step 11: Validate boundary crossings
        frontend_to_backend_validation = self.boundary_crossing_protocol.validate_crossing(frontend_to_backend_crossing_id)
        backend_to_data_validation = self.boundary_crossing_protocol.validate_crossing(backend_to_data_crossing_id)
        
        # Step 12: Calculate trust levels for domains
        frontend_trust = self.trust_domain_manager.calculate_domain_trust_level(frontend_domain_id)
        backend_trust = self.trust_domain_manager.calculate_domain_trust_level(backend_domain_id)
        data_trust = self.trust_domain_manager.calculate_domain_trust_level(data_domain_id)
        
        # Verify all operations were successful
        # Verify boundary integrity verifications
        self.assertEqual(frontend_verification["result"]["integrity_status"], "intact")
        self.assertEqual(backend_verification["result"]["integrity_status"], "intact")
        self.assertEqual(data_verification["result"]["integrity_status"], "intact")
        
        # Verify crossing validations
        self.assertTrue(frontend_to_backend_validation.is_valid)
        self.assertTrue(backend_to_data_validation.is_valid)
        
        # Verify trust levels were calculated
        self.assertIsNotNone(frontend_trust["level"])
        self.assertIsNotNone(backend_trust["level"])
        self.assertIsNotNone(data_trust["level"])
        
        # Verify domain relationships
        frontend_relationships = self.trust_domain_manager.get_domain_relationships(frontend_domain_id)
        backend_relationships = self.trust_domain_manager.get_domain_relationships(backend_domain_id)
        
        self.assertEqual(len(frontend_relationships), 1)
        self.assertEqual(len(backend_relationships), 1)
        self.assertEqual(frontend_relationships[0]["related_domain_id"], backend_domain_id)
        self.assertEqual(backend_relationships[0]["related_domain_id"], data_domain_id)

    def test_e2e_boundary_violation_detection_and_remediation(self):
        """Test end-to-end workflow for detecting and remediating boundary violations."""
        # Step 1: Create a boundary
        boundary_id = self.boundary_detection_engine.register_boundary({
            "boundary_id": f"boundary-{str(uuid.uuid4())}",
            "name": "Secure Boundary",
            "description": "A secure boundary for testing violations",
            "boundary_type": "network",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        })
        
        # Step 2: Add controls to the boundary
        auth_control_id = f"control-{str(uuid.uuid4())}"
        self.boundary_detection_engine.add_boundary_control(
            boundary_id=boundary_id,
            control={
                "control_id": auth_control_id,
                "control_type": "authentication",
                "name": "Strong Authentication",
                "description": "Strong authentication for boundary access",
                "implementation": {
                    "type": "multi-factor",
                    "mechanism": "2FA"
                },
                "status": "active"
            }
        )
        
        # Step 3: Verify boundary integrity (should be intact)
        verification1 = self.boundary_integrity_verifier.verify_boundary_integrity(boundary_id)
        self.assertEqual(verification1["result"]["integrity_status"], "intact")
        
        # Step 4: Simulate a boundary violation
        # Configure mutation detector to return mutations
        self.mutation_detector.detect_mutations.return_value = [
            {
                "mutation_id": "mutation-1",
                "mutation_type": "boundary_control",
                "detection_timestamp": datetime.utcnow().isoformat(),
                "severity": "high",
                "details": "Authentication control bypassed",
                "evidence": "Unauthorized access detected"
            }
        ]
        
        # Step 5: Report a violation
        violation_verification_id = self.boundary_integrity_verifier.report_violation(
            boundary_id=boundary_id,
            violation_type="unauthorized_access",
            details="Unauthorized access detected bypassing authentication",
            severity="high"
        )
        
        # Step 6: Verify boundary integrity again (should be compromised)
        verification2 = self.boundary_integrity_verifier.verify_boundary_integrity(boundary_id, "mutation_detection")
        self.assertNotEqual(verification2["result"]["integrity_status"], "intact")
        
        # Step 7: Get boundary violations
        violations = self.boundary_integrity_verifier.get_boundary_violations(boundary_id)
        self.assertGreaterEqual(len(violations), 1)
        
        # Step 8: Get boundary recommendations
        recommendations = self.boundary_integrity_verifier.get_boundary_recommendations(boundary_id)
        self.assertGreaterEqual(len(recommendations), 1)
        
        # Step 9: Remediate the violation by updating the control
        self.boundary_detection_engine.add_boundary_control(
            boundary_id=boundary_id,
            control={
                "control_id": auth_control_id,
                "control_type": "authentication",
                "name": "Enhanced Authentication",
                "description": "Enhanced authentication for boundary access",
                "implementation": {
                    "type": "multi-factor",
                    "mechanism": "3FA"
                },
                "status": "active"
            }
        )
        
        # Step 10: Reset mutation detector (simulating fixed issue)
        self.mutation_detector.detect_mutations.return_value = []
        
        # Step 11: Verify boundary integrity again (should be intact)
        verification3 = self.boundary_integrity_verifier.verify_boundary_integrity(boundary_id)
        self.assertEqual(verification3["result"]["integrity_status"], "intact")
        
        # Verify the sequence of events
        verifications = self.boundary_integrity_verifier.list_verifications(boundary_id=boundary_id)
        self.assertGreaterEqual(len(verifications), 3)
        
        # Verify the violation was recorded
        violation_verification = self.boundary_integrity_verifier.get_verification(violation_verification_id)
        self.assertIsNotNone(violation_verification)
        self.assertIn("violations", violation_verification)
        self.assertGreaterEqual(len(violation_verification["violations"]), 1)
        self.assertEqual(violation_verification["violations"][0]["violation_type"], "unauthorized_access")
        self.assertEqual(violation_verification["violations"][0]["severity"], "high")

    def test_e2e_trust_domain_evolution(self):
        """Test end-to-end workflow for trust domain evolution."""
        # Step 1: Create initial domains
        service_domain_id = self.trust_domain_manager.register_domain({
            "domain_id": f"service-domain-{str(uuid.uuid4())}",
            "name": "Service Domain",
            "description": "Domain for all services",
            "domain_type": "application",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "service-team",
                "name": "Service Team",
                "role": "development"
            }
        })
        
        # Step 2: Add components to the domain
        self.trust_domain_manager.add_domain_component(
            domain_id=service_domain_id,
            component_id="user-service",
            component_type="service",
            description="User management service"
        )
        
        self.trust_domain_manager.add_domain_component(
            domain_id=service_domain_id,
            component_id="order-service",
            component_type="service",
            description="Order processing service"
        )
        
        self.trust_domain_manager.add_domain_component(
            domain_id=service_domain_id,
            component_id="payment-service",
            component_type="service",
            description="Payment processing service"
        )
        
        # Step 3: Create a boundary for the domain
        service_boundary_id = self.boundary_detection_engine.register_boundary({
            "boundary_id": f"service-boundary-{str(uuid.uuid4())}",
            "name": "Service Boundary",
            "description": "Trust boundary for all services",
            "boundary_type": "network",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        })
        
        # Step 4: Associate the domain with the boundary
        self.trust_domain_manager.associate_domain_with_boundary(
            domain_id=service_domain_id,
            boundary_id=service_boundary_id,
            relationship="defines"
        )
        
        # Step 5: Split the domain as the system evolves
        user_domain_def = {
            "domain_id": f"user-domain-{str(uuid.uuid4())}",
            "name": "User Domain",
            "description": "Domain for user services",
            "domain_type": "application",
            "classification": "confidential",
            "status": "active"
        }
        
        order_payment_domain_def = {
            "domain_id": f"order-payment-domain-{str(uuid.uuid4())}",
            "name": "Order and Payment Domain",
            "description": "Domain for order and payment services",
            "domain_type": "application",
            "classification": "restricted",
            "status": "active"
        }
        
        split_domain_ids = self.trust_domain_manager.split_domain(
            source_domain_id=service_domain_id,
            new_domain_definitions=[user_domain_def, order_payment_domain_def]
        )
        
        user_domain_id = split_domain_ids[0]
        order_payment_domain_id = split_domain_ids[1]
        
        # Step 6: Create new boundaries for the split domains
        user_boundary_id = self.boundary_detection_engine.register_boundary({
            "boundary_id": f"user-boundary-{str(uuid.uuid4())}",
            "name": "User Boundary",
            "description": "Trust boundary for user services",
            "boundary_type": "network",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        })
        
        order_payment_boundary_id = self.boundary_detection_engine.register_boundary({
            "boundary_id": f"order-payment-boundary-{str(uuid.uuid4())}",
            "name": "Order and Payment Boundary",
            "description": "Trust boundary for order and payment services",
            "boundary_type": "network",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        })
        
        # Step 7: Associate the new domains with their boundaries
        self.trust_domain_manager.associate_domain_with_boundary(
            domain_id=user_domain_id,
            boundary_id=user_boundary_id,
            relationship="defines"
        )
        
        self.trust_domain_manager.associate_domain_with_boundary(
            domain_id=order_payment_domain_id,
            boundary_id=order_payment_boundary_id,
            relationship="defines"
        )
        
        # Step 8: Add components to the new domains
        self.trust_domain_manager.add_domain_component(
            domain_id=user_domain_id,
            component_id="user-service",
            component_type="service",
            description="User management service"
        )
        
        self.trust_domain_manager.add_domain_component(
            domain_id=order_payment_domain_id,
            component_id="order-service",
            component_type="service",
            description="Order processing service"
        )
        
        self.trust_domain_manager.add_domain_component(
            domain_id=order_payment_domain_id,
            component_id="payment-service",
            component_type="service",
            description="Payment processing service"
        )
        
        # Step 9: Define a boundary crossing between the new domains
        crossing_id = self.boundary_crossing_protocol.register_crossing({
            "crossing_id": f"crossing-{str(uuid.uuid4())}",
            "source_boundary_id": user_boundary_id,
            "target_boundary_id": order_payment_boundary_id,
            "crossing_type": "api-call",
            "direction": "outbound",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "status": "active",
            "protocol": "HTTPS",
            "port": 443,
            "path": "/api/orders",
            "authentication_required": True,
            "authorization_required": True,
            "encryption_required": True
        })
        
        # Step 10: Define a relationship between the new domains
        self.trust_domain_manager.add_domain_relationship(
            source_domain_id=user_domain_id,
            target_domain_id=order_payment_domain_id,
            relationship_type="trusted",
            trust_direction="outbound",
            trust_level=0.8,
            description="User domain trusts order and payment domain for order processing"
        )
        
        # Step 11: Verify the evolution history of the domains
        service_domain_history = self.trust_domain_manager.get_domain_evolution_history(service_domain_id)
        user_domain_history = self.trust_domain_manager.get_domain_evolution_history(user_domain_id)
        order_payment_domain_history = self.trust_domain_manager.get_domain_evolution_history(order_payment_domain_id)
        
        # Step 12: Further evolve by splitting the order-payment domain
        order_domain_def = {
            "domain_id": f"order-domain-{str(uuid.uuid4())}",
            "name": "Order Domain",
            "description": "Domain for order services",
            "domain_type": "application",
            "classification": "confidential",
            "status": "active"
        }
        
        payment_domain_def = {
            "domain_id": f"payment-domain-{str(uuid.uuid4())}",
            "name": "Payment Domain",
            "description": "Domain for payment services",
            "domain_type": "application",
            "classification": "restricted",
            "status": "active"
        }
        
        split_domain_ids2 = self.trust_domain_manager.split_domain(
            source_domain_id=order_payment_domain_id,
            new_domain_definitions=[order_domain_def, payment_domain_def]
        )
        
        order_domain_id = split_domain_ids2[0]
        payment_domain_id = split_domain_ids2[1]
        
        # Verify the evolution
        # Verify original domain is deprecated
        service_domain = self.trust_domain_manager.get_domain(service_domain_id)
        self.assertEqual(service_domain["status"], "deprecated")
        
        # Verify new domains are active
        user_domain = self.trust_domain_manager.get_domain(user_domain_id)
        order_domain = self.trust_domain_manager.get_domain(order_domain_id)
        payment_domain = self.trust_domain_manager.get_domain(payment_domain_id)
        
        self.assertEqual(user_domain["status"], "active")
        self.assertEqual(order_domain["status"], "active")
        self.assertEqual(payment_domain["status"], "active")
        
        # Verify evolution history
        self.assertGreaterEqual(len(service_domain_history), 1)
        self.assertGreaterEqual(len(user_domain_history), 1)
        self.assertGreaterEqual(len(order_payment_domain_history), 1)
        
        # Verify the intermediate domain is now deprecated
        order_payment_domain = self.trust_domain_manager.get_domain(order_payment_domain_id)
        self.assertEqual(order_payment_domain["status"], "deprecated")

if __name__ == '__main__':
    unittest.main()
