"""
Regression tests for Phase 5.14 (Governance Visualization) to ensure compatibility
with previous phases (2.3 through 5.13).

This test suite validates that the Governance Visualization framework does not
introduce any regressions in the functionality of previous phases.
"""

import unittest
from unittest.mock import MagicMock, patch
import json
import os
import sys
from datetime import datetime, timedelta

# Add the src directory to the path so we can import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

# Import core modules from previous phases
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
from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.trust.boundary_crossing_protocol import BoundaryCrossingProtocol
from src.core.verification.boundary_integrity_verifier import BoundaryIntegrityVerifier
from src.core.trust.trust_domain_manager import TrustDomainManager

# Import visualization modules from Phase 5.14
from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer
from src.core.visualization.governance_state_visualizer import GovernanceStateVisualizer
from src.core.visualization.trust_metrics_dashboard import TrustMetricsDashboard
from src.core.visualization.governance_health_reporter import GovernanceHealthReporter
from src.integration.governance_visualization_api import GovernanceVisualizationAPI
from src.integration.visualization_integration_service import VisualizationIntegrationService


class TestPhase514Regression(unittest.TestCase):
    """Regression tests for Phase 5.14 (Governance Visualization)."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Create mocks for common dependencies
        self.schema_validator_mock = MagicMock()
        self.schema_validator_mock.validate.return_value = True
        
        # Set up previous phase components
        self.setup_phase_510_components()
        self.setup_phase_511_components()
        self.setup_phase_512_components()
        self.setup_phase_513_components()
        
        # Set up Phase 5.14 components
        self.setup_phase_514_components()

    def setup_phase_510_components(self):
        """Set up components from Phase 5.10 (Governance Attestation Framework)."""
        # Create mocks for dependencies
        self.crypto_service_mock = MagicMock()
        self.storage_service_mock = MagicMock()
        
        # Create instances of Phase 5.10 components
        self.attestation_service = AttestationService(
            schema_validator=self.schema_validator_mock,
            crypto_service=self.crypto_service_mock,
            storage_service=self.storage_service_mock
        )
        
        self.claim_verification_protocol = ClaimVerificationProtocol(
            schema_validator=self.schema_validator_mock,
            attestation_service=self.attestation_service
        )
        
        self.governance_audit_trail = GovernanceAuditTrail(
            schema_validator=self.schema_validator_mock,
            storage_service=self.storage_service_mock
        )
        
        self.attestation_authority_manager = AttestationAuthorityManager(
            schema_validator=self.schema_validator_mock,
            crypto_service=self.crypto_service_mock,
            storage_service=self.storage_service_mock
        )

    def setup_phase_511_components(self):
        """Set up components from Phase 5.11 (Minimal Viable Governance)."""
        # Create instances of Phase 5.11 components
        self.governance_primitive_manager = GovernancePrimitiveManager(
            schema_validator=self.schema_validator_mock,
            storage_service=self.storage_service_mock,
            audit_trail=self.governance_audit_trail
        )
        
        self.decision_framework_engine = DecisionFrameworkEngine(
            schema_validator=self.schema_validator_mock,
            governance_primitive_manager=self.governance_primitive_manager,
            attestation_service=self.attestation_service
        )
        
        self.policy_management_module = PolicyManagementModule(
            schema_validator=self.schema_validator_mock,
            governance_primitive_manager=self.governance_primitive_manager,
            decision_framework_engine=self.decision_framework_engine,
            audit_trail=self.governance_audit_trail
        )
        
        self.requirement_validation_module = RequirementValidationModule(
            schema_validator=self.schema_validator_mock,
            governance_primitive_manager=self.governance_primitive_manager,
            policy_management_module=self.policy_management_module,
            audit_trail=self.governance_audit_trail
        )

    def setup_phase_512_components(self):
        """Set up components from Phase 5.12 (Governance Expansion Protocol)."""
        # Create instances of Phase 5.12 components
        self.module_extension_registry = ModuleExtensionRegistry(
            schema_validator=self.schema_validator_mock,
            storage_service=self.storage_service_mock,
            audit_trail=self.governance_audit_trail
        )
        
        self.compatibility_verification_engine = CompatibilityVerificationEngine(
            schema_validator=self.schema_validator_mock,
            module_extension_registry=self.module_extension_registry,
            attestation_service=self.attestation_service
        )
        
        self.module_lifecycle_manager = ModuleLifecycleManager(
            schema_validator=self.schema_validator_mock,
            module_extension_registry=self.module_extension_registry,
            compatibility_verification_engine=self.compatibility_verification_engine,
            audit_trail=self.governance_audit_trail
        )
        
        self.extension_point_framework = ExtensionPointFramework(
            schema_validator=self.schema_validator_mock,
            module_extension_registry=self.module_extension_registry,
            module_lifecycle_manager=self.module_lifecycle_manager
        )

    def setup_phase_513_components(self):
        """Set up components from Phase 5.13 (Trust Boundary Definition)."""
        # Create instances of Phase 5.13 components
        self.boundary_detection_engine = BoundaryDetectionEngine(
            schema_validator=self.schema_validator_mock,
            storage_service=self.storage_service_mock,
            audit_trail=self.governance_audit_trail
        )
        
        self.boundary_crossing_protocol = BoundaryCrossingProtocol(
            schema_validator=self.schema_validator_mock,
            boundary_detection_engine=self.boundary_detection_engine,
            attestation_service=self.attestation_service
        )
        
        self.boundary_integrity_verifier = BoundaryIntegrityVerifier(
            schema_validator=self.schema_validator_mock,
            boundary_detection_engine=self.boundary_detection_engine,
            attestation_service=self.attestation_service,
            audit_trail=self.governance_audit_trail
        )
        
        self.trust_domain_manager = TrustDomainManager(
            schema_validator=self.schema_validator_mock,
            boundary_detection_engine=self.boundary_detection_engine,
            boundary_integrity_verifier=self.boundary_integrity_verifier,
            governance_primitive_manager=self.governance_primitive_manager
        )

    def setup_phase_514_components(self):
        """Set up components from Phase 5.14 (Governance Visualization)."""
        # Create instances of Phase 5.14 components
        self.visualization_data_transformer = VisualizationDataTransformer(
            schema_validator=self.schema_validator_mock,
            governance_state_provider=self.governance_primitive_manager,
            trust_metrics_provider=MagicMock(),  # Mock for trust decay engine
            health_data_provider=self.governance_primitive_manager
        )
        
        self.governance_state_visualizer = GovernanceStateVisualizer(
            data_transformer=self.visualization_data_transformer,
            governance_primitive_manager=self.governance_primitive_manager,
            attestation_service=self.attestation_service,
            boundary_detection_engine=self.boundary_detection_engine,
            schema_validator=self.schema_validator_mock
        )
        
        self.trust_metrics_dashboard = TrustMetricsDashboard(
            data_transformer=self.visualization_data_transformer,
            trust_decay_engine=MagicMock(),  # Mock for trust decay engine
            attestation_service=self.attestation_service,
            schema_validator=self.schema_validator_mock
        )
        
        self.governance_health_reporter = GovernanceHealthReporter(
            data_transformer=self.visualization_data_transformer,
            governance_primitive_manager=self.governance_primitive_manager,
            attestation_service=self.attestation_service,
            boundary_integrity_verifier=self.boundary_integrity_verifier,
            schema_validator=self.schema_validator_mock
        )
        
        self.visualization_integration_service = VisualizationIntegrationService(
            governance_state_visualizer=self.governance_state_visualizer,
            trust_metrics_dashboard=self.trust_metrics_dashboard,
            governance_health_reporter=self.governance_health_reporter,
            schema_validator=self.schema_validator_mock
        )
        
        self.governance_visualization_api = GovernanceVisualizationAPI(
            integration_service=self.visualization_integration_service,
            schema_validator=self.schema_validator_mock
        )

    def test_phase_510_attestation_service_regression(self):
        """Test that Phase 5.14 does not break AttestationService functionality."""
        # Configure mocks for AttestationService
        self.crypto_service_mock.sign.return_value = "test_signature"
        self.crypto_service_mock.verify.return_value = True
        
        # Sample attestation data
        attestation_data = {
            "id": "test-attestation-001",
            "issuer": "test-authority",
            "subject": "test-component",
            "claims": [
                {"id": "claim-001", "type": "security", "value": "compliant"}
            ],
            "timestamp": "2025-05-21T16:00:00Z",
            "expiration": "2025-06-21T16:00:00Z"
        }
        
        # Test creating an attestation
        attestation = self.attestation_service.create_attestation(attestation_data)
        
        # Verify the attestation was created correctly
        self.assertIsNotNone(attestation)
        self.assertEqual(attestation["id"], attestation_data["id"])
        self.assertEqual(attestation["issuer"], attestation_data["issuer"])
        self.assertEqual(attestation["subject"], attestation_data["subject"])
        
        # Test verifying the attestation
        verification_result = self.attestation_service.verify_attestation(attestation)
        
        # Verify the attestation was verified correctly
        self.assertTrue(verification_result)
        
        # Verify the crypto service was called
        self.crypto_service_mock.sign.assert_called()
        self.crypto_service_mock.verify.assert_called()

    def test_phase_510_claim_verification_protocol_regression(self):
        """Test that Phase 5.14 does not break ClaimVerificationProtocol functionality."""
        # Configure mocks for ClaimVerificationProtocol
        self.attestation_service.get_attestation.return_value = {
            "id": "test-attestation-001",
            "issuer": "test-authority",
            "subject": "test-component",
            "claims": [
                {"id": "claim-001", "type": "security", "value": "compliant"}
            ],
            "timestamp": "2025-05-21T16:00:00Z",
            "expiration": "2025-06-21T16:00:00Z",
            "signature": "test_signature"
        }
        self.attestation_service.verify_attestation.return_value = True
        
        # Sample claim data
        claim_data = {
            "id": "claim-001",
            "type": "security",
            "value": "compliant",
            "attestation_id": "test-attestation-001"
        }
        
        # Test verifying a claim
        verification_result = self.claim_verification_protocol.verify_claim(claim_data)
        
        # Verify the claim was verified correctly
        self.assertTrue(verification_result)
        
        # Verify the attestation service was called
        self.attestation_service.get_attestation.assert_called_with("test-attestation-001")
        self.attestation_service.verify_attestation.assert_called()

    def test_phase_511_governance_primitive_manager_regression(self):
        """Test that Phase 5.14 does not break GovernancePrimitiveManager functionality."""
        # Configure mocks for GovernancePrimitiveManager
        self.storage_service_mock.store.return_value = True
        self.storage_service_mock.retrieve.return_value = {
            "id": "primitive-001",
            "type": "policy",
            "name": "Test Policy",
            "description": "A test policy",
            "content": {"rule": "test rule"},
            "version": "1.0.0",
            "status": "active"
        }
        
        # Sample primitive data
        primitive_data = {
            "id": "primitive-001",
            "type": "policy",
            "name": "Test Policy",
            "description": "A test policy",
            "content": {"rule": "test rule"},
            "version": "1.0.0",
            "status": "active"
        }
        
        # Test registering a primitive
        registration_result = self.governance_primitive_manager.register_primitive(primitive_data)
        
        # Verify the primitive was registered correctly
        self.assertTrue(registration_result)
        
        # Test retrieving a primitive
        primitive = self.governance_primitive_manager.get_primitive("primitive-001")
        
        # Verify the primitive was retrieved correctly
        self.assertIsNotNone(primitive)
        self.assertEqual(primitive["id"], primitive_data["id"])
        self.assertEqual(primitive["type"], primitive_data["type"])
        self.assertEqual(primitive["name"], primitive_data["name"])
        
        # Verify the storage service was called
        self.storage_service_mock.store.assert_called()
        self.storage_service_mock.retrieve.assert_called_with("primitive-001")

    def test_phase_512_module_extension_registry_regression(self):
        """Test that Phase 5.14 does not break ModuleExtensionRegistry functionality."""
        # Configure mocks for ModuleExtensionRegistry
        self.storage_service_mock.store.return_value = True
        self.storage_service_mock.retrieve.return_value = {
            "id": "extension-001",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "entry_points": ["test_entry_point"],
            "dependencies": []
        }
        
        # Sample extension data
        extension_data = {
            "id": "extension-001",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "entry_points": ["test_entry_point"],
            "dependencies": []
        }
        
        # Test registering an extension
        registration_result = self.module_extension_registry.register_extension(extension_data)
        
        # Verify the extension was registered correctly
        self.assertTrue(registration_result)
        
        # Test retrieving an extension
        extension = self.module_extension_registry.get_extension("extension-001")
        
        # Verify the extension was retrieved correctly
        self.assertIsNotNone(extension)
        self.assertEqual(extension["id"], extension_data["id"])
        self.assertEqual(extension["name"], extension_data["name"])
        self.assertEqual(extension["version"], extension_data["version"])
        
        # Verify the storage service was called
        self.storage_service_mock.store.assert_called()
        self.storage_service_mock.retrieve.assert_called_with("extension-001")

    def test_phase_513_boundary_detection_engine_regression(self):
        """Test that Phase 5.14 does not break BoundaryDetectionEngine functionality."""
        # Configure mocks for BoundaryDetectionEngine
        self.storage_service_mock.store.return_value = True
        self.storage_service_mock.retrieve.return_value = {
            "id": "boundary-001",
            "name": "Test Boundary",
            "description": "A test boundary",
            "type": "security",
            "domains": ["domain-a", "domain-b"],
            "rules": [{"id": "rule-001", "description": "Test rule"}]
        }
        
        # Sample boundary data
        boundary_data = {
            "id": "boundary-001",
            "name": "Test Boundary",
            "description": "A test boundary",
            "type": "security",
            "domains": ["domain-a", "domain-b"],
            "rules": [{"id": "rule-001", "description": "Test rule"}]
        }
        
        # Test registering a boundary
        registration_result = self.boundary_detection_engine.register_boundary(boundary_data)
        
        # Verify the boundary was registered correctly
        self.assertTrue(registration_result)
        
        # Test retrieving a boundary
        boundary = self.boundary_detection_engine.get_boundary("boundary-001")
        
        # Verify the boundary was retrieved correctly
        self.assertIsNotNone(boundary)
        self.assertEqual(boundary["id"], boundary_data["id"])
        self.assertEqual(boundary["name"], boundary_data["name"])
        self.assertEqual(boundary["type"], boundary_data["type"])
        
        # Verify the storage service was called
        self.storage_service_mock.store.assert_called()
        self.storage_service_mock.retrieve.assert_called_with("boundary-001")

    def test_phase_514_visualization_with_phase_510(self):
        """Test that Phase 5.14 correctly integrates with Phase 5.10 components."""
        # Configure mocks for AttestationService
        self.attestation_service.get_attestation_metrics.return_value = {
            "attestation_count": 1250,
            "valid_attestations": 1200,
            "expired_attestations": 25,
            "revoked_attestations": 25,
            "attestation_coverage": 0.87,
            "attestation_freshness": 0.95,
            "attestation_validity": 0.96,
            "components_with_attestations": 11,
            "total_components": 12
        }
        
        # Test getting attestation metrics from the trust metrics dashboard
        attestation_metrics = self.trust_metrics_dashboard.get_attestation_trust_metrics()
        
        # Verify the metrics were retrieved correctly
        self.assertIsNotNone(attestation_metrics)
        self.assertIn("attestation_count", attestation_metrics)
        self.assertIn("valid_attestations", attestation_metrics)
        self.assertIn("attestation_coverage", attestation_metrics)
        
        # Verify the attestation service was called
        self.attestation_service.get_attestation_metrics.assert_called()

    def test_phase_514_visualization_with_phase_511(self):
        """Test that Phase 5.14 correctly integrates with Phase 5.11 components."""
        # Configure mocks for GovernancePrimitiveManager
        self.governance_primitive_manager.get_current_state.return_value = {
            "components": [
                {
                    "id": "attestation_service",
                    "name": "Attestation Service",
                    "status": "active",
                    "health": 0.95,
                    "connections": ["claim_verification_protocol", "governance_audit_trail"]
                },
                {
                    "id": "claim_verification_protocol",
                    "name": "Claim Verification Protocol",
                    "status": "active",
                    "health": 0.92,
                    "connections": ["attestation_service"]
                }
            ],
            "relationships": [
                {
                    "source": "attestation_service",
                    "target": "claim_verification_protocol",
                    "type": "depends_on",
                    "strength": 0.9
                }
            ]
        }
        
        # Test getting governance state visualization
        visualization = self.governance_state_visualizer.get_governance_state_visualization()
        
        # Verify the visualization was created correctly
        self.assertIsNotNone(visualization)
        self.assertIn("nodes", visualization)
        self.assertIn("edges", visualization)
        self.assertEqual(len(visualization["nodes"]), 2)  # 2 components
        self.assertEqual(len(visualization["edges"]), 1)  # 1 relationship
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager.get_current_state.assert_called()

    def test_phase_514_visualization_with_phase_513(self):
        """Test that Phase 5.14 correctly integrates with Phase 5.13 components."""
        # Configure mocks for BoundaryDetectionEngine and BoundaryIntegrityVerifier
        self.boundary_detection_engine.get_boundary_metrics.return_value = {
            "boundary_count": 8,
            "active_boundaries": 8,
            "boundary_crossings_per_minute": 120,
            "average_crossing_latency": 0.05,
            "boundary_integrity": 0.96,
            "unauthorized_crossing_attempts": 2,
            "boundary_health": 0.94
        }
        
        self.boundary_integrity_verifier.get_integrity_metrics.return_value = {
            "integrity_score": 0.96,
            "verification_count": 500,
            "failed_verifications": 5,
            "last_verification": "2025-05-21T15:15:00Z"
        }
        
        # Test getting boundary metrics from the governance state visualizer
        boundary_metrics = self.governance_state_visualizer.get_boundary_metrics()
        
        # Verify the metrics were retrieved correctly
        self.assertIsNotNone(boundary_metrics)
        self.assertIn("boundary_count", boundary_metrics)
        self.assertIn("active_boundaries", boundary_metrics)
        self.assertIn("boundary_integrity", boundary_metrics)
        
        # Verify the boundary detection engine was called
        self.boundary_detection_engine.get_boundary_metrics.assert_called()
        
        # Test getting integrity metrics from the governance health reporter
        integrity_metrics = self.governance_health_reporter.get_boundary_integrity_metrics()
        
        # Verify the metrics were retrieved correctly
        self.assertIsNotNone(integrity_metrics)
        self.assertIn("integrity_score", integrity_metrics)
        self.assertIn("verification_count", integrity_metrics)
        self.assertIn("failed_verifications", integrity_metrics)
        
        # Verify the boundary integrity verifier was called
        self.boundary_integrity_verifier.get_integrity_metrics.assert_called()

    def test_phase_514_api_integration_with_previous_phases(self):
        """Test that Phase 5.14 API correctly integrates with all previous phases."""
        # Configure mocks for all components
        self.governance_primitive_manager.get_current_state.return_value = {
            "components": [
                {
                    "id": "attestation_service",
                    "name": "Attestation Service",
                    "status": "active",
                    "health": 0.95,
                    "connections": ["claim_verification_protocol", "governance_audit_trail"]
                }
            ],
            "relationships": []
        }
        
        self.governance_primitive_manager.get_current_health_report.return_value = {
            "overall_health": {
                "score": 0.94,
                "status": "healthy",
                "issues": {
                    "critical": 0,
                    "major": 1,
                    "minor": 3
                }
            },
            "components": {
                "attestation_service": {
                    "score": 0.95,
                    "status": "healthy",
                    "issues": {
                        "critical": 0,
                        "major": 0,
                        "minor": 1
                    },
                    "last_check": "2025-05-21T15:30:00Z"
                }
            }
        }
        
        # Test getting dashboard data from the API
        dashboard_data = self.governance_visualization_api.get_dashboard_data()
        
        # Verify the dashboard data was retrieved correctly
        self.assertIsNotNone(dashboard_data)
        self.assertIn("governance_state", dashboard_data)
        self.assertIn("health_report", dashboard_data)
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager.get_current_state.assert_called()
        self.governance_primitive_manager.get_current_health_report.assert_called()


if __name__ == '__main__':
    unittest.main()
