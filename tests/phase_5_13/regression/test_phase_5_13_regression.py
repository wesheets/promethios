"""
Regression tests for Phase 5.13 Trust Boundary Definition framework.

This module contains regression tests to ensure that the Trust Boundary Definition
framework does not break compatibility with previous phases (2.3 through 5.12).
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

# Import components from previous phases
from src.core.verification.seal_verification import SealVerificationService
from src.core.trust.mutation_detector import MutationDetector
from src.core.governance.evolution_protocol import EvolutionProtocol
from src.core.governance.attestation_service import AttestationService
from src.core.governance.claim_verification_protocol import ClaimVerificationProtocol
from src.core.governance.governance_audit_trail import GovernanceAuditTrail
from src.core.governance.attestation_authority_manager import AttestationAuthorityManager
from src.core.governance.governance_primitive_manager import GovernancePrimitiveManager
from src.core.governance.decision_framework_engine import DecisionFrameworkEngine
from src.core.governance.policy_management_module import PolicyManagementModule
from src.core.governance.requirement_validation_module import RequirementValidationModule
from src.core.governance.module_extension_registry import ModuleExtensionRegistry
from src.core.governance.compatibility_verification_engine import CompatibilityVerificationEngine
from src.core.governance.module_lifecycle_manager import ModuleLifecycleManager
from src.core.governance.extension_point_framework import ExtensionPointFramework

# Import new Phase 5.13 components
from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.trust.boundary_crossing_protocol import BoundaryCrossingProtocol
from src.core.verification.boundary_integrity_verifier import BoundaryIntegrityVerifier
from src.core.trust.trust_domain_manager import TrustDomainManager
from src.core.trust.sample_boundary_definitions import SampleBoundaryDefinitions

class TestPhase513RegressionWithPhase510(unittest.TestCase):
    """Regression tests for Phase 5.13 compatibility with Phase 5.10."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.schema_validator = MagicMock()
        self.seal_verification_service = MagicMock(spec=SealVerificationService)
        self.mutation_detector = MagicMock(spec=MutationDetector)
        self.evolution_protocol = MagicMock(spec=EvolutionProtocol)
        
        # Configure mock behavior
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        self.schema_validator.validate.return_value = validation_result
        
        self.seal_verification_service.create_seal.return_value = "mock-seal"
        self.seal_verification_service.verify_seal.return_value = True
        self.seal_verification_service.verify_contract_tether.return_value = True
        
        # Create Phase 5.10 components
        self.attestation_service = AttestationService(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )
        
        self.claim_verification_protocol = ClaimVerificationProtocol(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )
        
        self.governance_audit_trail = GovernanceAuditTrail(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )
        
        self.attestation_authority_manager = AttestationAuthorityManager(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            attestation_service=self.attestation_service
        )
        
        # Create Phase 5.13 components
        self.boundary_detection_engine = BoundaryDetectionEngine(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )
        
        self.boundary_crossing_protocol = BoundaryCrossingProtocol(
            boundary_detection_engine=self.boundary_detection_engine,
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )
        
        self.boundary_integrity_verifier = BoundaryIntegrityVerifier(
            boundary_detection_engine=self.boundary_detection_engine,
            boundary_crossing_protocol=self.boundary_crossing_protocol,
            seal_verification_service=self.seal_verification_service,
            mutation_detector=self.mutation_detector,
            attestation_service=self.attestation_service,
            schema_validator=self.schema_validator
        )

    def test_attestation_service_integration(self):
        """Test integration between Attestation Service and Boundary Integrity Verifier."""
        # Create a boundary
        boundary_def = {
            "boundary_id": f"boundary-{str(uuid.uuid4())}",
            "name": "Test Boundary",
            "description": "A test boundary for regression testing",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        }
        
        boundary_id = self.boundary_detection_engine.register_boundary(boundary_def)
        
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
        
        # Verify boundary integrity with attestation verification
        verification = self.boundary_integrity_verifier.verify_boundary_integrity(boundary_id, "attestation_verification")
        
        # Verify the attestation service was used
        self.attestation_service.verify_attestation.assert_called()
        
        # Verify the verification was successful
        self.assertEqual(verification["result"]["integrity_status"], "intact")

    def test_claim_verification_protocol_integration(self):
        """Test integration between Claim Verification Protocol and Boundary Integrity Verifier."""
        # Create a boundary
        boundary_def = {
            "boundary_id": f"boundary-{str(uuid.uuid4())}",
            "name": "Test Boundary",
            "description": "A test boundary for regression testing",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        }
        
        boundary_id = self.boundary_detection_engine.register_boundary(boundary_def)
        
        # Configure claim verification protocol mock
        self.claim_verification_protocol.verify_claim.return_value = True
        
        # Add a claim to the boundary
        boundary_with_claim = self.boundary_detection_engine.get_boundary(boundary_id)
        boundary_with_claim["claims"] = [
            {
                "claim_id": "test-claim",
                "claim_type": "compliance",
                "claim_value": "compliant"
            }
        ]
        self.boundary_detection_engine.update_boundary(boundary_id, boundary_with_claim)
        
        # Patch the boundary integrity verifier to use the claim verification protocol
        original_verify_claim = self.boundary_integrity_verifier._verify_claim
        self.boundary_integrity_verifier._verify_claim = lambda claim: self.claim_verification_protocol.verify_claim(claim)
        
        # Verify boundary integrity with claim verification
        verification = self.boundary_integrity_verifier.verify_boundary_integrity(boundary_id, "attestation_verification")
        
        # Restore the original method
        self.boundary_integrity_verifier._verify_claim = original_verify_claim
        
        # Verify the verification was successful
        self.assertEqual(verification["result"]["integrity_status"], "intact")

    def test_governance_audit_trail_integration(self):
        """Test integration between Governance Audit Trail and Boundary Integrity Verifier."""
        # Create a boundary
        boundary_def = {
            "boundary_id": f"boundary-{str(uuid.uuid4())}",
            "name": "Test Boundary",
            "description": "A test boundary for regression testing",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        }
        
        boundary_id = self.boundary_detection_engine.register_boundary(boundary_def)
        
        # Configure governance audit trail mock
        self.governance_audit_trail.record_event.return_value = "test-event-id"
        
        # Verify boundary integrity
        verification = self.boundary_integrity_verifier.verify_boundary_integrity(boundary_id)
        
        # Record the verification in the audit trail
        event_id = self.governance_audit_trail.record_event(
            event_type="boundary_verification",
            subject_id=boundary_id,
            subject_type="boundary",
            actor_id="test-verifier",
            action="verify",
            outcome="success",
            details={
                "verification_id": verification["verification_id"],
                "integrity_status": verification["result"]["integrity_status"]
            }
        )
        
        # Verify the event was recorded
        self.assertEqual(event_id, "test-event-id")
        self.governance_audit_trail.record_event.assert_called_once()


class TestPhase513RegressionWithPhase511(unittest.TestCase):
    """Regression tests for Phase 5.13 compatibility with Phase 5.11."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.schema_validator = MagicMock()
        self.seal_verification_service = MagicMock(spec=SealVerificationService)
        self.attestation_service = MagicMock(spec=AttestationService)
        self.evolution_protocol = MagicMock(spec=EvolutionProtocol)
        
        # Configure mock behavior
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        self.schema_validator.validate.return_value = validation_result
        
        self.seal_verification_service.create_seal.return_value = "mock-seal"
        self.seal_verification_service.verify_seal.return_value = True
        self.seal_verification_service.verify_contract_tether.return_value = True
        
        # Create Phase 5.11 components
        self.governance_primitive_manager = GovernancePrimitiveManager(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )
        
        self.decision_framework_engine = DecisionFrameworkEngine(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            governance_primitive_manager=self.governance_primitive_manager
        )
        
        self.policy_management_module = PolicyManagementModule(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            governance_primitive_manager=self.governance_primitive_manager,
            decision_framework_engine=self.decision_framework_engine
        )
        
        self.requirement_validation_module = RequirementValidationModule(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            governance_primitive_manager=self.governance_primitive_manager
        )
        
        # Create Phase 5.13 components
        self.boundary_detection_engine = BoundaryDetectionEngine(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )
        
        self.trust_domain_manager = TrustDomainManager(
            boundary_detection_engine=self.boundary_detection_engine,
            governance_primitive_manager=self.governance_primitive_manager,
            attestation_service=self.attestation_service,
            evolution_protocol=self.evolution_protocol,
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )

    def test_governance_primitive_manager_integration(self):
        """Test integration between Governance Primitive Manager and Trust Domain Manager."""
        # Configure governance primitive manager mock
        self.governance_primitive_manager.get_primitives_for_entity.return_value = [
            {
                "primitive_id": "primitive-1",
                "primitive_type": "policy",
                "status": "active"
            },
            {
                "primitive_id": "primitive-2",
                "primitive_type": "requirement",
                "status": "active"
            }
        ]
        
        # Create a domain
        domain_def = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Test Domain",
            "description": "A test domain for regression testing",
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
        
        # Associate a governance policy with the domain
        result = self.trust_domain_manager.associate_governance_policy(
            domain_id=domain_id,
            policy_id="test-policy",
            policy_type="access-control",
            enforcement_level="strict"
        )
        
        # Verify the policy was associated
        self.assertTrue(result)
        
        # Calculate trust level for the domain
        trust_level = self.trust_domain_manager.calculate_domain_trust_level(domain_id)
        
        # Verify the governance primitive manager was used
        self.governance_primitive_manager.get_primitives_for_entity.assert_called()
        
        # Verify the trust level was calculated
        self.assertIsNotNone(trust_level)
        self.assertIn("level", trust_level)
        self.assertIn("confidence", trust_level)
        self.assertIn("factors", trust_level)
        
        # Verify the governance factor was included
        governance_factor = next((f for f in trust_level["factors"] if f["factor_id"] == "governance_factor"), None)
        self.assertIsNotNone(governance_factor)

    def test_policy_management_module_integration(self):
        """Test integration between Policy Management Module and Trust Domain Manager."""
        # Configure policy management module mock
        self.policy_management_module.get_policy.return_value = {
            "policy_id": "test-policy",
            "policy_type": "access-control",
            "name": "Test Policy",
            "description": "A test policy",
            "status": "active"
        }
        self.policy_management_module.validate_policy_compliance.return_value = True
        
        # Create a domain
        domain_def = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Test Domain",
            "description": "A test domain for regression testing",
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
        
        # Associate a governance policy with the domain
        result = self.trust_domain_manager.associate_governance_policy(
            domain_id=domain_id,
            policy_id="test-policy",
            policy_type="access-control",
            enforcement_level="strict"
        )
        
        # Verify the policy was associated
        self.assertTrue(result)
        
        # Patch the trust domain manager to use the policy management module
        original_validate_policy = self.trust_domain_manager._validate_policy
        self.trust_domain_manager._validate_policy = lambda policy_id, domain_id: self.policy_management_module.validate_policy_compliance(
            policy_id=policy_id,
            entity_id=domain_id,
            entity_type="trust_domain"
        )
        
        # Calculate trust level for the domain
        trust_level = self.trust_domain_manager.calculate_domain_trust_level(domain_id)
        
        # Restore the original method
        self.trust_domain_manager._validate_policy = original_validate_policy
        
        # Verify the trust level was calculated
        self.assertIsNotNone(trust_level)


class TestPhase513RegressionWithPhase512(unittest.TestCase):
    """Regression tests for Phase 5.13 compatibility with Phase 5.12."""

    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.schema_validator = MagicMock()
        self.seal_verification_service = MagicMock(spec=SealVerificationService)
        self.attestation_service = MagicMock(spec=AttestationService)
        self.governance_primitive_manager = MagicMock(spec=GovernancePrimitiveManager)
        self.evolution_protocol = MagicMock(spec=EvolutionProtocol)
        
        # Configure mock behavior
        validation_result = MagicMock()
        validation_result.is_valid = True
        validation_result.errors = []
        self.schema_validator.validate.return_value = validation_result
        
        self.seal_verification_service.create_seal.return_value = "mock-seal"
        self.seal_verification_service.verify_seal.return_value = True
        self.seal_verification_service.verify_contract_tether.return_value = True
        
        # Create Phase 5.12 components
        self.module_extension_registry = ModuleExtensionRegistry(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )
        
        self.compatibility_verification_engine = CompatibilityVerificationEngine(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            module_extension_registry=self.module_extension_registry
        )
        
        self.module_lifecycle_manager = ModuleLifecycleManager(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            module_extension_registry=self.module_extension_registry,
            compatibility_verification_engine=self.compatibility_verification_engine
        )
        
        self.extension_point_framework = ExtensionPointFramework(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service,
            module_extension_registry=self.module_extension_registry
        )
        
        # Create Phase 5.13 components
        self.boundary_detection_engine = BoundaryDetectionEngine(
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )
        
        self.boundary_crossing_protocol = BoundaryCrossingProtocol(
            boundary_detection_engine=self.boundary_detection_engine,
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )
        
        self.trust_domain_manager = TrustDomainManager(
            boundary_detection_engine=self.boundary_detection_engine,
            governance_primitive_manager=self.governance_primitive_manager,
            attestation_service=self.attestation_service,
            evolution_protocol=self.evolution_protocol,
            schema_validator=self.schema_validator,
            seal_verification_service=self.seal_verification_service
        )

    def test_module_extension_registry_integration(self):
        """Test integration between Module Extension Registry and Boundary Detection Engine."""
        # Configure module extension registry mock
        self.module_extension_registry.register_extension.return_value = "test-extension-id"
        self.module_extension_registry.get_extension.return_value = {
            "extension_id": "test-extension-id",
            "extension_type": "boundary_type",
            "name": "Custom Boundary Type",
            "description": "A custom boundary type extension",
            "version": "1.0.0",
            "status": "active"
        }
        
        # Create a boundary with a custom type
        boundary_def = {
            "boundary_id": f"boundary-{str(uuid.uuid4())}",
            "name": "Custom Boundary",
            "description": "A custom boundary for regression testing",
            "boundary_type": "custom",  # Custom type that would be handled by an extension
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active"
        }
        
        # Register a boundary type extension
        extension_def = {
            "extension_id": "test-extension-id",
            "extension_point_id": "boundary_type_extension",
            "extension_type": "boundary_type",
            "name": "Custom Boundary Type",
            "description": "A custom boundary type extension",
            "version": "1.0.0",
            "implementation": {
                "module_path": "src.core.trust.extensions.custom_boundary_type",
                "class_name": "CustomBoundaryTypeExtension"
            },
            "status": "active"
        }
        
        extension_id = self.module_extension_registry.register_extension(extension_def)
        
        # Patch the boundary detection engine to use the module extension registry
        original_validate_boundary_type = self.boundary_detection_engine._validate_boundary_type
        self.boundary_detection_engine._validate_boundary_type = lambda boundary_type: (
            boundary_type in ["process", "network", "data", "governance"] or
            self.module_extension_registry.get_extension(
                extension_type="boundary_type",
                extension_filter=lambda ext: ext.get("name", "").lower() == boundary_type
            ) is not None
        )
        
        # Register the boundary
        boundary_id = self.boundary_detection_engine.register_boundary(boundary_def)
        
        # Restore the original method
        self.boundary_detection_engine._validate_boundary_type = original_validate_boundary_type
        
        # Verify the boundary was registered
        self.assertIsNotNone(boundary_id)
        self.assertEqual(boundary_id, boundary_def["boundary_id"])
        
        # Verify the module extension registry was used
        self.module_extension_registry.get_extension.assert_called()

    def test_extension_point_framework_integration(self):
        """Test integration between Extension Point Framework and Trust Domain Manager."""
        # Configure extension point framework mock
        self.extension_point_framework.register_extension_point.return_value = "test-extension-point-id"
        self.extension_point_framework.get_extension_point.return_value = {
            "extension_point_id": "trust_calculation_extension",
            "name": "Trust Calculation Extension",
            "description": "Extension point for custom trust calculation methods",
            "interface": "src.core.trust.trust_domain_manager.TrustCalculationExtension"
        }
        
        # Register an extension point for trust calculation
        extension_point_def = {
            "extension_point_id": "trust_calculation_extension",
            "name": "Trust Calculation Extension",
            "description": "Extension point for custom trust calculation methods",
            "interface": "src.core.trust.trust_domain_manager.TrustCalculationExtension"
        }
        
        extension_point_id = self.extension_point_framework.register_extension_point(extension_point_def)
        
        # Create a domain
        domain_def = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Test Domain",
            "description": "A test domain for regression testing",
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
        
        # Patch the trust domain manager to use the extension point framework
        original_get_trust_calculation_extensions = getattr(self.trust_domain_manager, "_get_trust_calculation_extensions", lambda: [])
        setattr(self.trust_domain_manager, "_get_trust_calculation_extensions", lambda: [
            {
                "extension_id": "test-extension-id",
                "calculate_trust": lambda domain: {"factor_id": "custom_factor", "weight": 0.5, "value": 0.8}
            }
        ] if self.extension_point_framework.get_extension_point("trust_calculation_extension") else [])
        
        # Calculate trust level for the domain
        trust_level = self.trust_domain_manager.calculate_domain_trust_level(domain_id)
        
        # Restore the original method
        setattr(self.trust_domain_manager, "_get_trust_calculation_extensions", original_get_trust_calculation_extensions)
        
        # Verify the trust level was calculated
        self.assertIsNotNone(trust_level)
        self.assertIn("level", trust_level)
        self.assertIn("confidence", trust_level)
        self.assertIn("factors", trust_level)
        
        # Verify the extension point framework was used
        self.extension_point_framework.get_extension_point.assert_called()


if __name__ == '__main__':
    unittest.main()
