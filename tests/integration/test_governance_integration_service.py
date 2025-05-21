"""
Integration tests for the GovernanceIntegrationService class.

This module contains tests for the GovernanceIntegrationService class, which is responsible
for integrating all governance components across phases 5.8, 5.9, 5.10, and 5.11.
"""

import os
import json
import unittest
from unittest.mock import MagicMock, patch

# Import the module to test
from src.integration.governance_integration_service import GovernanceIntegrationService

class TestGovernanceIntegrationService(unittest.TestCase):
    """Test cases for the GovernanceIntegrationService class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies for all phases
        # Phase 5.8 mocks
        self.mock_codex_lock = MagicMock()
        self.mock_contract_sealer = MagicMock()
        self.mock_evolution_protocol = MagicMock()
        
        # Phase 5.9 mocks
        self.mock_trust_decay_engine = MagicMock()
        self.mock_trust_regeneration_protocol = MagicMock()
        self.mock_trust_metrics_calculator = MagicMock()
        self.mock_trust_monitoring_service = MagicMock()
        
        # Phase 5.10 mocks
        self.mock_attestation_service = MagicMock()
        self.mock_claim_verification_protocol = MagicMock()
        self.mock_governance_audit_trail = MagicMock()
        self.mock_attestation_authority_manager = MagicMock()
        
        # Phase 5.11 mocks
        self.mock_governance_primitive_manager = MagicMock()
        self.mock_decision_framework_engine = MagicMock()
        self.mock_policy_management_module = MagicMock()
        self.mock_requirement_validation_module = MagicMock()
        
        # Configure mocks
        self.mock_codex_lock.verify_tether.return_value = True
        self.mock_codex_lock.verify_operation_tether.return_value = True
        
        # Create test configuration
        self.config = {
            'codex_lock': {'path': '/path/to/codex.lock'},
            'contract_sealer': {'key_path': '/path/to/keys'},
            'evolution_protocol': {'rules_path': '/path/to/rules'},
            'trust_decay_engine': {'decay_rate': 0.1},
            'trust_regeneration_protocol': {'regeneration_rate': 0.05},
            'trust_metrics_calculator': {'base_trust': 0.8},
            'trust_monitoring_service': {'interval': 300},
            'attestation_service': {'storage_path': '/path/to/attestations'},
            'claim_verification_protocol': {'verification_threshold': 0.7},
            'governance_audit_trail': {'storage_path': '/path/to/audit'},
            'attestation_authority_manager': {'authorities_path': '/path/to/authorities'},
            'governance_primitive_manager': {'primitives_path': '/path/to/primitives'},
            'decision_framework_engine': {'frameworks_path': '/path/to/frameworks'},
            'policy_management_module': {'policies_path': '/path/to/policies'},
            'requirement_validation_module': {'requirements_path': '/path/to/requirements'}
        }
        
        # Patch all the initialization methods
        with patch.object(GovernanceIntegrationService, '_init_codex_lock', return_value=self.mock_codex_lock), \
             patch.object(GovernanceIntegrationService, '_init_contract_sealer', return_value=self.mock_contract_sealer), \
             patch.object(GovernanceIntegrationService, '_init_evolution_protocol', return_value=self.mock_evolution_protocol), \
             patch.object(GovernanceIntegrationService, '_init_trust_decay_engine', return_value=self.mock_trust_decay_engine), \
             patch.object(GovernanceIntegrationService, '_init_trust_regeneration_protocol', return_value=self.mock_trust_regeneration_protocol), \
             patch.object(GovernanceIntegrationService, '_init_trust_metrics_calculator', return_value=self.mock_trust_metrics_calculator), \
             patch.object(GovernanceIntegrationService, '_init_trust_monitoring_service', return_value=self.mock_trust_monitoring_service), \
             patch.object(GovernanceIntegrationService, '_init_attestation_service', return_value=self.mock_attestation_service), \
             patch.object(GovernanceIntegrationService, '_init_claim_verification_protocol', return_value=self.mock_claim_verification_protocol), \
             patch.object(GovernanceIntegrationService, '_init_governance_audit_trail', return_value=self.mock_governance_audit_trail), \
             patch.object(GovernanceIntegrationService, '_init_attestation_authority_manager', return_value=self.mock_attestation_authority_manager), \
             patch.object(GovernanceIntegrationService, '_init_governance_primitive_manager', return_value=self.mock_governance_primitive_manager), \
             patch.object(GovernanceIntegrationService, '_init_decision_framework_engine', return_value=self.mock_decision_framework_engine), \
             patch.object(GovernanceIntegrationService, '_init_policy_management_module', return_value=self.mock_policy_management_module), \
             patch.object(GovernanceIntegrationService, '_init_requirement_validation_module', return_value=self.mock_requirement_validation_module), \
             patch.object(GovernanceIntegrationService, '_register_integration_points'):
            
            # Create test instance
            self.integration_service = GovernanceIntegrationService(self.config)
    
    def test_init(self):
        """Test initialization of GovernanceIntegrationService."""
        self.assertEqual(self.integration_service.config, self.config)
        self.assertEqual(self.integration_service.codex_lock, self.mock_codex_lock)
        self.assertEqual(self.integration_service.contract_sealer, self.mock_contract_sealer)
        self.assertEqual(self.integration_service.evolution_protocol, self.mock_evolution_protocol)
        self.assertEqual(self.integration_service.trust_decay_engine, self.mock_trust_decay_engine)
        self.assertEqual(self.integration_service.trust_regeneration_protocol, self.mock_trust_regeneration_protocol)
        self.assertEqual(self.integration_service.trust_metrics_calculator, self.mock_trust_metrics_calculator)
        self.assertEqual(self.integration_service.trust_monitoring_service, self.mock_trust_monitoring_service)
        self.assertEqual(self.integration_service.attestation_service, self.mock_attestation_service)
        self.assertEqual(self.integration_service.claim_verification_protocol, self.mock_claim_verification_protocol)
        self.assertEqual(self.integration_service.governance_audit_trail, self.mock_governance_audit_trail)
        self.assertEqual(self.integration_service.attestation_authority_manager, self.mock_attestation_authority_manager)
        self.assertEqual(self.integration_service.governance_primitive_manager, self.mock_governance_primitive_manager)
        self.assertEqual(self.integration_service.decision_framework_engine, self.mock_decision_framework_engine)
        self.assertEqual(self.integration_service.policy_management_module, self.mock_policy_management_module)
        self.assertEqual(self.integration_service.requirement_validation_module, self.mock_requirement_validation_module)
        
        # Verify pre-loop tether check was performed
        self.mock_codex_lock.verify_tether.assert_called_once()
    
    def test_register_with_attestation_service(self):
        """Test registering Phase 5.11 components with the attestation service."""
        # Create a new instance with a real _register_with_attestation_service method
        with patch.object(GovernanceIntegrationService, '_init_codex_lock', return_value=self.mock_codex_lock), \
             patch.object(GovernanceIntegrationService, '_init_contract_sealer', return_value=self.mock_contract_sealer), \
             patch.object(GovernanceIntegrationService, '_init_evolution_protocol', return_value=self.mock_evolution_protocol), \
             patch.object(GovernanceIntegrationService, '_init_trust_decay_engine', return_value=self.mock_trust_decay_engine), \
             patch.object(GovernanceIntegrationService, '_init_trust_regeneration_protocol', return_value=self.mock_trust_regeneration_protocol), \
             patch.object(GovernanceIntegrationService, '_init_trust_metrics_calculator', return_value=self.mock_trust_metrics_calculator), \
             patch.object(GovernanceIntegrationService, '_init_trust_monitoring_service', return_value=self.mock_trust_monitoring_service), \
             patch.object(GovernanceIntegrationService, '_init_attestation_service', return_value=self.mock_attestation_service), \
             patch.object(GovernanceIntegrationService, '_init_claim_verification_protocol', return_value=self.mock_claim_verification_protocol), \
             patch.object(GovernanceIntegrationService, '_init_governance_audit_trail', return_value=self.mock_governance_audit_trail), \
             patch.object(GovernanceIntegrationService, '_init_attestation_authority_manager', return_value=self.mock_attestation_authority_manager), \
             patch.object(GovernanceIntegrationService, '_init_governance_primitive_manager', return_value=self.mock_governance_primitive_manager), \
             patch.object(GovernanceIntegrationService, '_init_decision_framework_engine', return_value=self.mock_decision_framework_engine), \
             patch.object(GovernanceIntegrationService, '_init_policy_management_module', return_value=self.mock_policy_management_module), \
             patch.object(GovernanceIntegrationService, '_init_requirement_validation_module', return_value=self.mock_requirement_validation_module), \
             patch.object(GovernanceIntegrationService, '_register_with_trust_system'), \
             patch.object(GovernanceIntegrationService, '_register_with_codex_system'), \
             patch.object(GovernanceIntegrationService, '_register_event_handlers'):
            
            # Configure mock public keys
            self.mock_governance_primitive_manager.get_public_key.return_value = "primitive_public_key"
            self.mock_decision_framework_engine.get_public_key.return_value = "framework_public_key"
            self.mock_policy_management_module.get_public_key.return_value = "policy_public_key"
            self.mock_requirement_validation_module.get_public_key.return_value = "requirement_public_key"
            
            # Create test instance
            service = GovernanceIntegrationService(self.config)
            
            # Call the method under test
            service._register_with_attestation_service()
            
            # Verify attestation service registrations
            self.mock_attestation_service.register_attestable_entity_type.assert_any_call(
                entity_type="GOVERNANCE_PRIMITIVE",
                schema_path=os.path.join('schemas', 'governance', 'governance_primitive.schema.v1.json'),
                authority_ids=["governance_primitive_manager", "system"]
            )
            
            self.mock_attestation_service.register_attestable_entity_type.assert_any_call(
                entity_type="DECISION_FRAMEWORK",
                schema_path=os.path.join('schemas', 'governance', 'decision_framework.schema.v1.json'),
                authority_ids=["decision_framework_engine", "system"]
            )
            
            self.mock_attestation_service.register_attestable_entity_type.assert_any_call(
                entity_type="GOVERNANCE_POLICY",
                schema_path=os.path.join('schemas', 'governance', 'governance_policy.schema.v1.json'),
                authority_ids=["policy_management_module", "system"]
            )
            
            self.mock_attestation_service.register_attestable_entity_type.assert_any_call(
                entity_type="GOVERNANCE_REQUIREMENT",
                schema_path=os.path.join('schemas', 'governance', 'governance_requirement.schema.v1.json'),
                authority_ids=["requirement_validation_module", "system"]
            )
            
            # Verify authority registrations
            self.mock_attestation_authority_manager.register_authority.assert_any_call(
                authority_id="governance_primitive_manager",
                name="Governance Primitive Manager",
                description="Authority for governance primitives",
                public_key="primitive_public_key",
                trust_level="HIGH"
            )
            
            self.mock_attestation_authority_manager.register_authority.assert_any_call(
                authority_id="decision_framework_engine",
                name="Decision Framework Engine",
                description="Authority for decision frameworks",
                public_key="framework_public_key",
                trust_level="HIGH"
            )
            
            self.mock_attestation_authority_manager.register_authority.assert_any_call(
                authority_id="policy_management_module",
                name="Policy Management Module",
                description="Authority for governance policies",
                public_key="policy_public_key",
                trust_level="HIGH"
            )
            
            self.mock_attestation_authority_manager.register_authority.assert_any_call(
                authority_id="requirement_validation_module",
                name="Requirement Validation Module",
                description="Authority for governance requirements",
                public_key="requirement_public_key",
                trust_level="HIGH"
            )
    
    def test_register_with_trust_system(self):
        """Test registering Phase 5.11 components with the trust system."""
        # Create a new instance with a real _register_with_trust_system method
        with patch.object(GovernanceIntegrationService, '_init_codex_lock', return_value=self.mock_codex_lock), \
             patch.object(GovernanceIntegrationService, '_init_contract_sealer', return_value=self.mock_contract_sealer), \
             patch.object(GovernanceIntegrationService, '_init_evolution_protocol', return_value=self.mock_evolution_protocol), \
             patch.object(GovernanceIntegrationService, '_init_trust_decay_engine', return_value=self.mock_trust_decay_engine), \
             patch.object(GovernanceIntegrationService, '_init_trust_regeneration_protocol', return_value=self.mock_trust_regeneration_protocol), \
             patch.object(GovernanceIntegrationService, '_init_trust_metrics_calculator', return_value=self.mock_trust_metrics_calculator), \
             patch.object(GovernanceIntegrationService, '_init_trust_monitoring_service', return_value=self.mock_trust_monitoring_service), \
             patch.object(GovernanceIntegrationService, '_init_attestation_service', return_value=self.mock_attestation_service), \
             patch.object(GovernanceIntegrationService, '_init_claim_verification_protocol', return_value=self.mock_claim_verification_protocol), \
             patch.object(GovernanceIntegrationService, '_init_governance_audit_trail', return_value=self.mock_governance_audit_trail), \
             patch.object(GovernanceIntegrationService, '_init_attestation_authority_manager', return_value=self.mock_attestation_authority_manager), \
             patch.object(GovernanceIntegrationService, '_init_governance_primitive_manager', return_value=self.mock_governance_primitive_manager), \
             patch.object(GovernanceIntegrationService, '_init_decision_framework_engine', return_value=self.mock_decision_framework_engine), \
             patch.object(GovernanceIntegrationService, '_init_policy_management_module', return_value=self.mock_policy_management_module), \
             patch.object(GovernanceIntegrationService, '_init_requirement_validation_module', return_value=self.mock_requirement_validation_module), \
             patch.object(GovernanceIntegrationService, '_register_with_attestation_service'), \
             patch.object(GovernanceIntegrationService, '_register_with_codex_system'), \
             patch.object(GovernanceIntegrationService, '_register_event_handlers'):
            
            # Create test instance
            service = GovernanceIntegrationService(self.config)
            
            # Call the method under test
            service._register_with_trust_system()
            
            # Verify trust metrics registrations
            self.mock_trust_metrics_calculator.register_entity_type.assert_any_call(
                entity_type="GOVERNANCE_PRIMITIVE",
                base_trust_level=0.9,
                decay_rate=0.05,
                regeneration_rate=0.1,
                verification_weight=0.7,
                attestation_weight=0.8,
                history_weight=0.5
            )
            
            self.mock_trust_metrics_calculator.register_entity_type.assert_any_call(
                entity_type="DECISION_FRAMEWORK",
                base_trust_level=0.85,
                decay_rate=0.1,
                regeneration_rate=0.05,
                verification_weight=0.8,
                attestation_weight=0.7,
                history_weight=0.6
            )
            
            self.mock_trust_metrics_calculator.register_entity_type.assert_any_call(
                entity_type="GOVERNANCE_POLICY",
                base_trust_level=0.8,
                decay_rate=0.15,
                regeneration_rate=0.1,
                verification_weight=0.9,
                attestation_weight=0.8,
                history_weight=0.7
            )
            
            self.mock_trust_metrics_calculator.register_entity_type.assert_any_call(
                entity_type="GOVERNANCE_REQUIREMENT",
                base_trust_level=0.75,
                decay_rate=0.2,
                regeneration_rate=0.15,
                verification_weight=0.8,
                attestation_weight=0.7,
                history_weight=0.6
            )
            
            # Verify trust monitoring registrations
            self.mock_trust_monitoring_service.register_component.assert_any_call(
                component_id="governance_primitive_manager",
                component_type="CORE_GOVERNANCE",
                monitoring_interval=300,
                alert_threshold=0.6
            )
            
            self.mock_trust_monitoring_service.register_component.assert_any_call(
                component_id="decision_framework_engine",
                component_type="CORE_GOVERNANCE",
                monitoring_interval=300,
                alert_threshold=0.65
            )
            
            self.mock_trust_monitoring_service.register_component.assert_any_call(
                component_id="policy_management_module",
                component_type="CORE_GOVERNANCE",
                monitoring_interval=300,
                alert_threshold=0.7
            )
            
            self.mock_trust_monitoring_service.register_component.assert_any_call(
                component_id="requirement_validation_module",
                component_type="CORE_GOVERNANCE",
                monitoring_interval=300,
                alert_threshold=0.75
            )
    
    def test_register_with_codex_system(self):
        """Test registering Phase 5.11 components with the codex system."""
        # Create a new instance with a real _register_with_codex_system method
        with patch.object(GovernanceIntegrationService, '_init_codex_lock', return_value=self.mock_codex_lock), \
             patch.object(GovernanceIntegrationService, '_init_contract_sealer', return_value=self.mock_contract_sealer), \
             patch.object(GovernanceIntegrationService, '_init_evolution_protocol', return_value=self.mock_evolution_protocol), \
             patch.object(GovernanceIntegrationService, '_init_trust_decay_engine', return_value=self.mock_trust_decay_engine), \
             patch.object(GovernanceIntegrationService, '_init_trust_regeneration_protocol', return_value=self.mock_trust_regeneration_protocol), \
             patch.object(GovernanceIntegrationService, '_init_trust_metrics_calculator', return_value=self.mock_trust_metrics_calculator), \
             patch.object(GovernanceIntegrationService, '_init_trust_monitoring_service', return_value=self.mock_trust_monitoring_service), \
             patch.object(GovernanceIntegrationService, '_init_attestation_service', return_value=self.mock_attestation_service), \
             patch.object(GovernanceIntegrationService, '_init_claim_verification_protocol', return_value=self.mock_claim_verification_protocol), \
             patch.object(GovernanceIntegrationService, '_init_governance_audit_trail', return_value=self.mock_governance_audit_trail), \
             patch.object(GovernanceIntegrationService, '_init_attestation_authority_manager', return_value=self.mock_attestation_authority_manager), \
             patch.object(GovernanceIntegrationService, '_init_governance_primitive_manager', return_value=self.mock_governance_primitive_manager), \
             patch.object(GovernanceIntegrationService, '_init_decision_framework_engine', return_value=self.mock_decision_framework_engine), \
             patch.object(GovernanceIntegrationService, '_init_policy_management_module', return_value=self.mock_policy_management_module), \
             patch.object(GovernanceIntegrationService, '_init_requirement_validation_module', return_value=self.mock_requirement_validation_module), \
             patch.object(GovernanceIntegrationService, '_register_with_attestation_service'), \
             patch.object(GovernanceIntegrationService, '_register_with_trust_system'), \
             patch.object(GovernanceIntegrationService, '_register_event_handlers'):
            
            # Configure mock tether check hashes
            self.mock_governance_primitive_manager._generate_tether_check_hash.return_value = "primitive_hash"
            self.mock_decision_framework_engine._generate_tether_check_hash.return_value = "framework_hash"
            self.mock_policy_management_module._generate_tether_check_hash.return_value = "policy_hash"
            self.mock_requirement_validation_module._generate_tether_check_hash.return_value = "requirement_hash"
            
            # Configure mock contract versions
            self.mock_governance_primitive_manager.CODEX_CONTRACT_VERSION = "v1.0.0"
            self.mock_decision_framework_engine.CODEX_CONTRACT_VERSION = "v1.0.0"
            self.mock_policy_management_module.CODEX_CONTRACT_VERSION = "v1.0.0"
            self.mock_requirement_validation_module.CODEX_CONTRACT_VERSION = "v1.0.0"
            
            # Create test instance
            service = GovernanceIntegrationService(self.config)
            
            # Call the method under test
            service._register_with_codex_system()
            
            # Verify codex lock registrations
            self.mock_codex_lock.register_contract.assert_any_call(
                contract_id="governance.primitive_manager",
                contract_version="v1.0.0",
                tether_check_hash="primitive_hash"
            )
            
            self.mock_codex_lock.register_contract.assert_any_call(
                contract_id="governance.decision_framework",
                contract_version="v1.0.0",
                tether_check_hash="framework_hash"
            )
            
            self.mock_codex_lock.register_contract.assert_any_call(
                contract_id="governance.policy_management",
                contract_version="v1.0.0",
                tether_check_hash="policy_hash"
            )
            
            self.mock_codex_lock.register_contract.assert_any_call(
                contract_id="governance.requirement_validation",
                contract_version="v1.0.0",
                tether_check_hash="requirement_hash"
            )
            
            # Verify evolution protocol registrations
            self.mock_evolution_protocol.register_evolvable_contract.assert_any_call(
                contract_id="governance.primitive_manager",
                contract_version="v1.0.0",
                evolution_rules={
                    "allowed_evolution_paths": ["minor_version_update", "patch_update"],
                    "required_attestations": 3,
                    "minimum_trust_level": 0.8
                }
            )
            
            self.mock_evolution_protocol.register_evolvable_contract.assert_any_call(
                contract_id="governance.decision_framework",
                contract_version="v1.0.0",
                evolution_rules={
                    "allowed_evolution_paths": ["minor_version_update", "patch_update"],
                    "required_attestations": 3,
                    "minimum_trust_level": 0.8
                }
            )
            
            self.mock_evolution_protocol.register_evolvable_contract.assert_any_call(
                contract_id="governance.policy_management",
                contract_version="v1.0.0",
                evolution_rules={
                    "allowed_evolution_paths": ["minor_version_update", "patch_update"],
                    "required_attestations": 3,
                    "minimum_trust_level": 0.8
                }
            )
            
            self.mock_evolution_protocol.register_evolvable_contract.assert_any_call(
                contract_id="governance.requirement_validation",
                contract_version="v1.0.0",
                evolution_rules={
                    "allowed_evolution_paths": ["minor_version_update", "patch_update"],
                    "required_attestations": 3,
                    "minimum_trust_level": 0.8
                }
            )
    
    def test_register_event_handlers(self):
        """Test registering cross-component event handlers."""
        # Create a new instance with a real _register_event_handlers method
        with patch.object(GovernanceIntegrationService, '_init_codex_lock', return_value=self.mock_codex_lock), \
             patch.object(GovernanceIntegrationService, '_init_contract_sealer', return_value=self.mock_contract_sealer), \
             patch.object(GovernanceIntegrationService, '_init_evolution_protocol', return_value=self.mock_evolution_protocol), \
             patch.object(GovernanceIntegrationService, '_init_trust_decay_engine', return_value=self.mock_trust_decay_engine), \
             patch.object(GovernanceIntegrationService, '_init_trust_regeneration_protocol', return_value=self.mock_trust_regeneration_protocol), \
             patch.object(GovernanceIntegrationService, '_init_trust_metrics_calculator', return_value=self.mock_trust_metrics_calculator), \
             patch.object(GovernanceIntegrationService, '_init_trust_monitoring_service', return_value=self.mock_trust_monitoring_service), \
             patch.object(GovernanceIntegrationService, '_init_attestation_service', return_value=self.mock_attestation_service), \
             patch.object(GovernanceIntegrationService, '_init_claim_verification_protocol', return_value=self.mock_claim_verification_protocol), \
             patch.object(GovernanceIntegrationService, '_init_governance_audit_trail', return_value=self.mock_governance_audit_trail), \
             patch.object(GovernanceIntegrationService, '_init_attestation_authority_manager', return_value=self.mock_attestation_authority_manager), \
             patch.object(GovernanceIntegrationService, '_init_governance_primitive_manager', return_value=self.mock_governance_primitive_manager), \
             patch.object(GovernanceIntegrationService, '_init_decision_framework_engine', return_value=self.mock_decision_framework_engine), \
             patch.object(GovernanceIntegrationService, '_init_policy_management_module', return_value=self.mock_policy_management_module), \
             patch.object(GovernanceIntegrationService, '_init_requirement_validation_module', return_value=self.mock_requirement_validation_module), \
             patch.object(GovernanceIntegrationService, '_register_with_attestation_service'), \
             patch.object(GovernanceIntegrationService, '_register_with_trust_system'), \
             patch.object(GovernanceIntegrationService, '_register_with_codex_system'):
            
            # Create test instance
            service = GovernanceIntegrationService(self.config)
            
            # Call the method under test
            service._register_event_handlers()
            
            # Verify policy management event handlers
            self.mock_policy_management_module.register_event_handler.assert_any_call(
                event_type="POLICY_CREATED",
                handler=self.mock_governance_audit_trail.record_event
            )
            
            self.mock_policy_management_module.register_event_handler.assert_any_call(
                event_type="POLICY_UPDATED",
                handler=self.mock_governance_audit_trail.record_event
            )
            
            self.mock_policy_management_module.register_event_handler.assert_any_call(
                event_type="POLICY_DELETED",
                handler=self.mock_governance_audit_trail.record_event
            )
            
            # Verify requirement validation event handlers
            self.mock_requirement_validation_module.register_event_handler.assert_any_call(
                event_type="REQUIREMENT_CREATED",
                handler=self.mock_governance_audit_trail.record_event
            )
            
            self.mock_requirement_validation_module.register_event_handler.assert_any_call(
                event_type="REQUIREMENT_UPDATED",
                handler=self.mock_governance_audit_trail.record_event
            )
            
            self.mock_requirement_validation_module.register_event_handler.assert_any_call(
                event_type="REQUIREMENT_DELETED",
                handler=self.mock_governance_audit_trail.record_event
            )
            
            # Verify decision framework event handlers
            self.mock_decision_framework_engine.register_event_handler.assert_any_call(
                event_type="DECISION_RECORDED",
                handler=self.mock_governance_audit_trail.record_event
            )
            
            self.mock_decision_framework_engine.register_event_handler.assert_any_call(
                event_type="DECISION_EXECUTED",
                handler=self.mock_governance_audit_trail.record_event
            )
            
            # Verify primitive event handlers
            self.mock_governance_primitive_manager.register_event_handler.assert_any_call(
                event_type="PRIMITIVE_REGISTERED",
                handler=self.mock_governance_audit_trail.record_event
            )
            
            self.mock_governance_primitive_manager.register_event_handler.assert_any_call(
                event_type="PRIMITIVE_UPDATED",
                handler=self.mock_governance_audit_trail.record_event
            )
            
            # Verify trust decay event handlers
            self.mock_trust_decay_engine.register_event_handler.assert_any_call(
                event_type="TRUST_LEVEL_DECAYED",
                handler=service._handle_trust_decay_event
            )
            
            # Verify attestation event handlers
            self.mock_attestation_service.register_event_handler.assert_any_call(
                event_type="ATTESTATION_CREATED",
                handler=service._handle_attestation_event
            )
    
    def test_handle_trust_decay_event(self):
        """Test handling trust decay events."""
        # Create test event data
        event_data = {
            'entity_id': 'test-entity',
            'entity_type': 'GOVERNANCE_PRIMITIVE',
            'trust_level': 0.7
        }
        
        # Call the method under test
        self.integration_service._handle_trust_decay_event(event_data)
        
        # Verify primitive manager was updated
        self.mock_governance_primitive_manager.update_primitive_trust.assert_called_once_with('test-entity', 0.7)
        
        # Test with different entity type
        event_data['entity_type'] = 'DECISION_FRAMEWORK'
        self.integration_service._handle_trust_decay_event(event_data)
        self.mock_decision_framework_engine.update_framework_trust.assert_called_once_with('test-entity', 0.7)
        
        # Test with policy entity type
        event_data['entity_type'] = 'GOVERNANCE_POLICY'
        self.integration_service._handle_trust_decay_event(event_data)
        self.mock_policy_management_module.update_policy_trust.assert_called_once_with('test-entity', 0.7)
        
        # Test with requirement entity type
        event_data['entity_type'] = 'GOVERNANCE_REQUIREMENT'
        self.integration_service._handle_trust_decay_event(event_data)
        self.mock_requirement_validation_module.update_requirement_trust.assert_called_once_with('test-entity', 0.7)
    
    def test_handle_attestation_event(self):
        """Test handling attestation events."""
        # Create test event data for primitive
        event_data = {
            'claim_id': 'primitive:test-primitive',
            'attestation_data': {
                'primitive_id': 'test-primitive'
            }
        }
        
        # Call the method under test
        self.integration_service._handle_attestation_event(event_data)
        
        # Verify primitive manager was refreshed
        self.mock_governance_primitive_manager.refresh_primitive.assert_called_once_with('test-primitive')
        
        # Test with framework claim
        event_data = {
            'claim_id': 'framework:test-framework',
            'attestation_data': {
                'framework_id': 'test-framework'
            }
        }
        self.integration_service._handle_attestation_event(event_data)
        self.mock_decision_framework_engine.refresh_framework.assert_called_once_with('test-framework')
        
        # Test with policy claim
        event_data = {
            'claim_id': 'policy:test-policy',
            'attestation_data': {
                'policy_id': 'test-policy'
            }
        }
        self.integration_service._handle_attestation_event(event_data)
        self.mock_policy_management_module.refresh_policy.assert_called_once_with('test-policy')
        
        # Test with requirement claim
        event_data = {
            'claim_id': 'requirement:test-requirement',
            'attestation_data': {
                'requirement_id': 'test-requirement'
            }
        }
        self.integration_service._handle_attestation_event(event_data)
        self.mock_requirement_validation_module.refresh_requirement.assert_called_once_with('test-requirement')
    
    def test_get_governance_status(self):
        """Test getting the status of all governance components."""
        # Configure mock statuses
        self.mock_codex_lock.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_contract_sealer.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_evolution_protocol.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_trust_decay_engine.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_trust_regeneration_protocol.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_trust_metrics_calculator.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_trust_monitoring_service.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_attestation_service.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_claim_verification_protocol.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_governance_audit_trail.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_attestation_authority_manager.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_governance_primitive_manager.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_decision_framework_engine.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_policy_management_module.get_status.return_value = {'status': 'HEALTHY'}
        self.mock_requirement_validation_module.get_status.return_value = {'status': 'HEALTHY'}
        
        # Call the method under test
        result = self.integration_service.get_governance_status()
        
        # Verify the result
        self.assertEqual(result['integration_service_id'], self.integration_service.CODEX_CONTRACT_ID)
        self.assertEqual(result['integration_service_version'], self.integration_service.CODEX_CONTRACT_VERSION)
        self.assertEqual(result['overall_status'], 'HEALTHY')
        
        # Verify component statuses
        self.assertEqual(result['codex_components']['codex_lock'], {'status': 'HEALTHY'})
        self.assertEqual(result['codex_components']['contract_sealer'], {'status': 'HEALTHY'})
        self.assertEqual(result['codex_components']['evolution_protocol'], {'status': 'HEALTHY'})
        
        self.assertEqual(result['trust_components']['trust_decay_engine'], {'status': 'HEALTHY'})
        self.assertEqual(result['trust_components']['trust_regeneration_protocol'], {'status': 'HEALTHY'})
        self.assertEqual(result['trust_components']['trust_metrics_calculator'], {'status': 'HEALTHY'})
        self.assertEqual(result['trust_components']['trust_monitoring_service'], {'status': 'HEALTHY'})
        
        self.assertEqual(result['attestation_components']['attestation_service'], {'status': 'HEALTHY'})
        self.assertEqual(result['attestation_components']['claim_verification_protocol'], {'status': 'HEALTHY'})
        self.assertEqual(result['attestation_components']['governance_audit_trail'], {'status': 'HEALTHY'})
        self.assertEqual(result['attestation_components']['attestation_authority_manager'], {'status': 'HEALTHY'})
        
        self.assertEqual(result['mvg_components']['governance_primitive_manager'], {'status': 'HEALTHY'})
        self.assertEqual(result['mvg_components']['decision_framework_engine'], {'status': 'HEALTHY'})
        self.assertEqual(result['mvg_components']['policy_management_module'], {'status': 'HEALTHY'})
        self.assertEqual(result['mvg_components']['requirement_validation_module'], {'status': 'HEALTHY'})
        
        # Test with some degraded components
        self.mock_trust_decay_engine.get_status.return_value = {'status': 'DEGRADED'}
        self.mock_attestation_service.get_status.return_value = {'status': 'DEGRADED'}
        
        result = self.integration_service.get_governance_status()
        self.assertEqual(result['overall_status'], 'DEGRADED')
        
        # Test with some unhealthy components
        self.mock_policy_management_module.get_status.return_value = {'status': 'UNHEALTHY'}
        
        result = self.integration_service.get_governance_status()
        self.assertEqual(result['overall_status'], 'UNHEALTHY')

if __name__ == '__main__':
    unittest.main()
