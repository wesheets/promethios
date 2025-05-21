"""
Integration module for the Minimal Viable Governance framework.

This module provides integration between the Minimal Viable Governance components
and previous phases, including:
- Phase 5.8: Codex Mutation Lock
- Phase 5.9: Trust Decay Engine
- Phase 5.10: Governance Attestation Framework

The integration ensures proper communication, data flow, and contract tethering
between all components of the Promethios governance system.
"""

import os
import json
import logging
import hashlib
from typing import Dict, List, Any, Optional, Tuple

# Import dependencies from previous phases
from src.core.governance.codex_lock import CodexLock
from src.core.governance.contract_sealer import ContractSealer
from src.core.governance.evolution_protocol import EvolutionProtocol
from src.core.trust.trust_decay_engine import TrustDecayEngine
from src.core.trust.trust_regeneration_protocol import TrustRegenerationProtocol
from src.core.trust.trust_metrics_calculator import TrustMetricsCalculator
from src.core.trust.trust_monitoring_service import TrustMonitoringService
from src.core.governance.attestation_service import AttestationService
from src.core.governance.claim_verification_protocol import ClaimVerificationProtocol
from src.core.governance.governance_audit_trail import GovernanceAuditTrail
from src.core.governance.attestation_authority_manager import AttestationAuthorityManager

# Import Phase 5.11 components
from src.core.governance.governance_primitive_manager import GovernancePrimitiveManager
from src.core.governance.decision_framework_engine import DecisionFrameworkEngine
from src.core.governance.policy_management_module import PolicyManagementModule
from src.core.governance.requirement_validation_module import RequirementValidationModule

# Configure logging
logger = logging.getLogger(__name__)

class GovernanceIntegrationService:
    """
    Service for integrating all governance components across phases 5.8, 5.9, 5.10, and 5.11.
    
    This service ensures proper communication, data flow, and contract tethering
    between all components of the Promethios governance system.
    """
    
    # Codex contract constants
    CODEX_CONTRACT_ID = "governance.integration_service"
    CODEX_CONTRACT_VERSION = "v2025.05.21"
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the GovernanceIntegrationService.
        
        Args:
            config: Configuration dictionary for the integration service
        """
        self.config = config
        
        # Initialize Phase 5.8 components
        self.codex_lock = self._init_codex_lock()
        self.contract_sealer = self._init_contract_sealer()
        self.evolution_protocol = self._init_evolution_protocol()
        
        # Initialize Phase 5.9 components
        self.trust_decay_engine = self._init_trust_decay_engine()
        self.trust_regeneration_protocol = self._init_trust_regeneration_protocol()
        self.trust_metrics_calculator = self._init_trust_metrics_calculator()
        self.trust_monitoring_service = self._init_trust_monitoring_service()
        
        # Initialize Phase 5.10 components
        self.attestation_service = self._init_attestation_service()
        self.claim_verification_protocol = self._init_claim_verification_protocol()
        self.governance_audit_trail = self._init_governance_audit_trail()
        self.attestation_authority_manager = self._init_attestation_authority_manager()
        
        # Initialize Phase 5.11 components
        self.governance_primitive_manager = self._init_governance_primitive_manager()
        self.decision_framework_engine = self._init_decision_framework_engine()
        self.policy_management_module = self._init_policy_management_module()
        self.requirement_validation_module = self._init_requirement_validation_module()
        
        # Perform pre-loop tether check for Codex contract
        self._perform_pre_loop_tether_check()
        
        # Register integration points
        self._register_integration_points()
        
        logger.info("GovernanceIntegrationService initialized successfully")
    
    def _perform_pre_loop_tether_check(self) -> None:
        """
        Perform pre-loop tether check for Codex contract.
        
        This method verifies the integrity of the Codex contract before any operations
        are performed, ensuring that the contract has not been tampered with.
        
        Raises:
            RuntimeError: If the tether check fails
        """
        # Generate tether check hash
        tether_check_hash = self._generate_tether_check_hash()
        
        # Verify tether with Codex Lock
        if not self.codex_lock.verify_tether(
            contract_id=self.CODEX_CONTRACT_ID,
            contract_version=self.CODEX_CONTRACT_VERSION,
            tether_check_hash=tether_check_hash
        ):
            error_msg = f"Pre-loop tether check failed for {self.CODEX_CONTRACT_ID} {self.CODEX_CONTRACT_VERSION}"
            logger.critical(error_msg)
            raise RuntimeError(error_msg)
        
        logger.info(f"Pre-loop tether check passed for {self.CODEX_CONTRACT_ID} {self.CODEX_CONTRACT_VERSION}")
    
    def _generate_tether_check_hash(self) -> str:
        """
        Generate a hash for the pre-loop tether check.
        
        Returns:
            str: The generated hash
        """
        # Combine critical class attributes and methods for hashing
        critical_components = [
            self.__class__.__name__,
            self.CODEX_CONTRACT_ID,
            self.CODEX_CONTRACT_VERSION,
            str(self.__init__.__code__.co_code),
            str(self._register_integration_points.__code__.co_code),
            str(self.get_governance_status.__code__.co_code)
        ]
        
        # Generate hash
        hash_input = ":".join(critical_components).encode('utf-8')
        return hashlib.sha256(hash_input).hexdigest()
    
    def _init_codex_lock(self) -> CodexLock:
        """
        Initialize the CodexLock component from Phase 5.8.
        
        Returns:
            CodexLock: The initialized CodexLock instance
        """
        codex_config = self.config.get('codex_lock', {})
        return CodexLock(codex_config)
    
    def _init_contract_sealer(self) -> ContractSealer:
        """
        Initialize the ContractSealer component from Phase 5.8.
        
        Returns:
            ContractSealer: The initialized ContractSealer instance
        """
        sealer_config = self.config.get('contract_sealer', {})
        return ContractSealer(sealer_config, self.codex_lock)
    
    def _init_evolution_protocol(self) -> EvolutionProtocol:
        """
        Initialize the EvolutionProtocol component from Phase 5.8.
        
        Returns:
            EvolutionProtocol: The initialized EvolutionProtocol instance
        """
        evolution_config = self.config.get('evolution_protocol', {})
        return EvolutionProtocol(evolution_config, self.codex_lock, self.contract_sealer)
    
    def _init_trust_decay_engine(self) -> TrustDecayEngine:
        """
        Initialize the TrustDecayEngine component from Phase 5.9.
        
        Returns:
            TrustDecayEngine: The initialized TrustDecayEngine instance
        """
        decay_config = self.config.get('trust_decay_engine', {})
        return TrustDecayEngine(decay_config, self.codex_lock)
    
    def _init_trust_regeneration_protocol(self) -> TrustRegenerationProtocol:
        """
        Initialize the TrustRegenerationProtocol component from Phase 5.9.
        
        Returns:
            TrustRegenerationProtocol: The initialized TrustRegenerationProtocol instance
        """
        regeneration_config = self.config.get('trust_regeneration_protocol', {})
        return TrustRegenerationProtocol(regeneration_config, self.trust_decay_engine, self.codex_lock)
    
    def _init_trust_metrics_calculator(self) -> TrustMetricsCalculator:
        """
        Initialize the TrustMetricsCalculator component from Phase 5.9.
        
        Returns:
            TrustMetricsCalculator: The initialized TrustMetricsCalculator instance
        """
        metrics_config = self.config.get('trust_metrics_calculator', {})
        return TrustMetricsCalculator(metrics_config, self.trust_decay_engine, self.codex_lock)
    
    def _init_trust_monitoring_service(self) -> TrustMonitoringService:
        """
        Initialize the TrustMonitoringService component from Phase 5.9.
        
        Returns:
            TrustMonitoringService: The initialized TrustMonitoringService instance
        """
        monitoring_config = self.config.get('trust_monitoring_service', {})
        return TrustMonitoringService(
            monitoring_config, 
            self.trust_decay_engine, 
            self.trust_metrics_calculator, 
            self.codex_lock
        )
    
    def _init_attestation_service(self) -> AttestationService:
        """
        Initialize the AttestationService component from Phase 5.10.
        
        Returns:
            AttestationService: The initialized AttestationService instance
        """
        attestation_config = self.config.get('attestation_service', {})
        return AttestationService(
            attestation_config, 
            self.codex_lock, 
            self.trust_metrics_calculator
        )
    
    def _init_claim_verification_protocol(self) -> ClaimVerificationProtocol:
        """
        Initialize the ClaimVerificationProtocol component from Phase 5.10.
        
        Returns:
            ClaimVerificationProtocol: The initialized ClaimVerificationProtocol instance
        """
        claim_config = self.config.get('claim_verification_protocol', {})
        return ClaimVerificationProtocol(
            claim_config, 
            self.attestation_service, 
            self.codex_lock, 
            self.trust_metrics_calculator
        )
    
    def _init_governance_audit_trail(self) -> GovernanceAuditTrail:
        """
        Initialize the GovernanceAuditTrail component from Phase 5.10.
        
        Returns:
            GovernanceAuditTrail: The initialized GovernanceAuditTrail instance
        """
        audit_config = self.config.get('governance_audit_trail', {})
        return GovernanceAuditTrail(
            audit_config, 
            self.codex_lock, 
            self.attestation_service
        )
    
    def _init_attestation_authority_manager(self) -> AttestationAuthorityManager:
        """
        Initialize the AttestationAuthorityManager component from Phase 5.10.
        
        Returns:
            AttestationAuthorityManager: The initialized AttestationAuthorityManager instance
        """
        authority_config = self.config.get('attestation_authority_manager', {})
        return AttestationAuthorityManager(
            authority_config, 
            self.attestation_service, 
            self.trust_metrics_calculator, 
            self.codex_lock
        )
    
    def _init_governance_primitive_manager(self) -> GovernancePrimitiveManager:
        """
        Initialize the GovernancePrimitiveManager component from Phase 5.11.
        
        Returns:
            GovernancePrimitiveManager: The initialized GovernancePrimitiveManager instance
        """
        primitive_config = self.config.get('governance_primitive_manager', {})
        return GovernancePrimitiveManager(
            primitive_config, 
            self.codex_lock, 
            self.attestation_service, 
            self.governance_audit_trail
        )
    
    def _init_decision_framework_engine(self) -> DecisionFrameworkEngine:
        """
        Initialize the DecisionFrameworkEngine component from Phase 5.11.
        
        Returns:
            DecisionFrameworkEngine: The initialized DecisionFrameworkEngine instance
        """
        decision_config = self.config.get('decision_framework_engine', {})
        return DecisionFrameworkEngine(
            decision_config, 
            self.codex_lock, 
            self.attestation_service, 
            self.governance_audit_trail, 
            self.trust_metrics_calculator
        )
    
    def _init_policy_management_module(self) -> PolicyManagementModule:
        """
        Initialize the PolicyManagementModule component from Phase 5.11.
        
        Returns:
            PolicyManagementModule: The initialized PolicyManagementModule instance
        """
        policy_config = self.config.get('policy_management_module', {})
        return PolicyManagementModule(
            policy_config, 
            self.codex_lock, 
            self.attestation_service, 
            self.governance_audit_trail, 
            self.governance_primitive_manager, 
            self.decision_framework_engine
        )
    
    def _init_requirement_validation_module(self) -> RequirementValidationModule:
        """
        Initialize the RequirementValidationModule component from Phase 5.11.
        
        Returns:
            RequirementValidationModule: The initialized RequirementValidationModule instance
        """
        from src.core.common.schema_validator import SchemaValidator
        from src.core.verification.seal_verification import SealVerificationService
        
        requirement_config = self.config.get('requirement_validation_module', {})
        schema_validator = SchemaValidator()
        seal_verification_service = SealVerificationService(self.config.get('seal_verification', {}))
        
        return RequirementValidationModule(
            requirement_config,
            schema_validator,
            seal_verification_service,
            self.attestation_service,
            self.governance_audit_trail,
            self.governance_primitive_manager,
            self.decision_framework_engine,
            self.policy_management_module,
            self.codex_lock,
            self.trust_metrics_calculator,
            self.trust_decay_engine
        )
    
    def _register_integration_points(self) -> None:
        """
        Register integration points between components.
        
        This method establishes the connections and dependencies between
        components across different phases.
        """
        # Register Phase 5.11 components with Phase 5.10 attestation service
        self._register_with_attestation_service()
        
        # Register Phase 5.11 components with Phase 5.9 trust system
        self._register_with_trust_system()
        
        # Register Phase 5.11 components with Phase 5.8 codex system
        self._register_with_codex_system()
        
        # Register cross-component event handlers
        self._register_event_handlers()
        
        logger.info("Integration points registered successfully")
    
    def _register_with_attestation_service(self) -> None:
        """
        Register Phase 5.11 components with the Phase 5.10 attestation service.
        """
        # Register governance primitives as attestable entities
        self.attestation_service.register_attestable_entity_type(
            entity_type="GOVERNANCE_PRIMITIVE",
            schema_path=os.path.join('schemas', 'governance', 'governance_primitive.schema.v1.json'),
            authority_ids=["governance_primitive_manager", "system"]
        )
        
        # Register decision frameworks as attestable entities
        self.attestation_service.register_attestable_entity_type(
            entity_type="DECISION_FRAMEWORK",
            schema_path=os.path.join('schemas', 'governance', 'decision_framework.schema.v1.json'),
            authority_ids=["decision_framework_engine", "system"]
        )
        
        # Register policies as attestable entities
        self.attestation_service.register_attestable_entity_type(
            entity_type="GOVERNANCE_POLICY",
            schema_path=os.path.join('schemas', 'governance', 'governance_policy.schema.v1.json'),
            authority_ids=["policy_management_module", "system"]
        )
        
        # Register requirements as attestable entities
        self.attestation_service.register_attestable_entity_type(
            entity_type="GOVERNANCE_REQUIREMENT",
            schema_path=os.path.join('schemas', 'governance', 'governance_requirement.schema.v1.json'),
            authority_ids=["requirement_validation_module", "system"]
        )
        
        # Register the Phase 5.11 components as attestation authorities
        self.attestation_authority_manager.register_authority(
            authority_id="governance_primitive_manager",
            name="Governance Primitive Manager",
            description="Authority for governance primitives",
            public_key=self.governance_primitive_manager.get_public_key(),
            trust_level="HIGH"
        )
        
        self.attestation_authority_manager.register_authority(
            authority_id="decision_framework_engine",
            name="Decision Framework Engine",
            description="Authority for decision frameworks",
            public_key=self.decision_framework_engine.get_public_key(),
            trust_level="HIGH"
        )
        
        self.attestation_authority_manager.register_authority(
            authority_id="policy_management_module",
            name="Policy Management Module",
            description="Authority for governance policies",
            public_key=self.policy_management_module.get_public_key(),
            trust_level="HIGH"
        )
        
        self.attestation_authority_manager.register_authority(
            authority_id="requirement_validation_module",
            name="Requirement Validation Module",
            description="Authority for governance requirements",
            public_key=self.requirement_validation_module.get_public_key(),
            trust_level="HIGH"
        )
    
    def _register_with_trust_system(self) -> None:
        """
        Register Phase 5.11 components with the Phase 5.9 trust system.
        """
        # Register trust metrics for governance primitives
        self.trust_metrics_calculator.register_entity_type(
            entity_type="GOVERNANCE_PRIMITIVE",
            base_trust_level=0.9,
            decay_rate=0.05,
            regeneration_rate=0.1,
            verification_weight=0.7,
            attestation_weight=0.8,
            history_weight=0.5
        )
        
        # Register trust metrics for decision frameworks
        self.trust_metrics_calculator.register_entity_type(
            entity_type="DECISION_FRAMEWORK",
            base_trust_level=0.85,
            decay_rate=0.1,
            regeneration_rate=0.05,
            verification_weight=0.8,
            attestation_weight=0.7,
            history_weight=0.6
        )
        
        # Register trust metrics for governance policies
        self.trust_metrics_calculator.register_entity_type(
            entity_type="GOVERNANCE_POLICY",
            base_trust_level=0.8,
            decay_rate=0.15,
            regeneration_rate=0.1,
            verification_weight=0.9,
            attestation_weight=0.8,
            history_weight=0.7
        )
        
        # Register trust metrics for governance requirements
        self.trust_metrics_calculator.register_entity_type(
            entity_type="GOVERNANCE_REQUIREMENT",
            base_trust_level=0.75,
            decay_rate=0.2,
            regeneration_rate=0.15,
            verification_weight=0.8,
            attestation_weight=0.7,
            history_weight=0.6
        )
        
        # Register trust monitoring for Phase 5.11 components
        self.trust_monitoring_service.register_component(
            component_id="governance_primitive_manager",
            component_type="CORE_GOVERNANCE",
            monitoring_interval=300,  # 5 minutes
            alert_threshold=0.6
        )
        
        self.trust_monitoring_service.register_component(
            component_id="decision_framework_engine",
            component_type="CORE_GOVERNANCE",
            monitoring_interval=300,  # 5 minutes
            alert_threshold=0.65
        )
        
        self.trust_monitoring_service.register_component(
            component_id="policy_management_module",
            component_type="CORE_GOVERNANCE",
            monitoring_interval=300,  # 5 minutes
            alert_threshold=0.7
        )
        
        self.trust_monitoring_service.register_component(
            component_id="requirement_validation_module",
            component_type="CORE_GOVERNANCE",
            monitoring_interval=300,  # 5 minutes
            alert_threshold=0.75
        )
    
    def _register_with_codex_system(self) -> None:
        """
        Register Phase 5.11 components with the Phase 5.8 codex system.
        """
        # Register governance primitives with the codex lock
        self.codex_lock.register_contract(
            contract_id="governance.primitive_manager",
            contract_version=self.governance_primitive_manager.CODEX_CONTRACT_VERSION,
            tether_check_hash=self.governance_primitive_manager._generate_tether_check_hash()
        )
        
        # Register decision framework with the codex lock
        self.codex_lock.register_contract(
            contract_id="governance.decision_framework",
            contract_version=self.decision_framework_engine.CODEX_CONTRACT_VERSION,
            tether_check_hash=self.decision_framework_engine._generate_tether_check_hash()
        )
        
        # Register policy management with the codex lock
        self.codex_lock.register_contract(
            contract_id="governance.policy_management",
            contract_version=self.policy_management_module.CODEX_CONTRACT_VERSION,
            tether_check_hash=self.policy_management_module._generate_tether_check_hash()
        )
        
        # Register requirement validation with the codex lock
        self.codex_lock.register_contract(
            contract_id="governance.requirement_validation",
            contract_version=self.requirement_validation_module.CODEX_CONTRACT_VERSION,
            tether_check_hash=self.requirement_validation_module._generate_tether_check_hash()
        )
        
        # Register this integration service with the codex lock
        self.codex_lock.register_contract(
            contract_id=self.CODEX_CONTRACT_ID,
            contract_version=self.CODEX_CONTRACT_VERSION,
            tether_check_hash=self._generate_tether_check_hash()
        )
        
        # Register with evolution protocol for contract evolution
        self.evolution_protocol.register_evolvable_contract(
            contract_id="governance.primitive_manager",
            contract_version=self.governance_primitive_manager.CODEX_CONTRACT_VERSION,
            evolution_rules={
                "allowed_evolution_paths": ["minor_version_update", "patch_update"],
                "required_attestations": 3,
                "minimum_trust_level": 0.8
            }
        )
        
        self.evolution_protocol.register_evolvable_contract(
            contract_id="governance.decision_framework",
            contract_version=self.decision_framework_engine.CODEX_CONTRACT_VERSION,
            evolution_rules={
                "allowed_evolution_paths": ["minor_version_update", "patch_update"],
                "required_attestations": 3,
                "minimum_trust_level": 0.8
            }
        )
        
        self.evolution_protocol.register_evolvable_contract(
            contract_id="governance.policy_management",
            contract_version=self.policy_management_module.CODEX_CONTRACT_VERSION,
            evolution_rules={
                "allowed_evolution_paths": ["minor_version_update", "patch_update"],
                "required_attestations": 3,
                "minimum_trust_level": 0.8
            }
        )
        
        self.evolution_protocol.register_evolvable_contract(
            contract_id="governance.requirement_validation",
            contract_version=self.requirement_validation_module.CODEX_CONTRACT_VERSION,
            evolution_rules={
                "allowed_evolution_paths": ["minor_version_update", "patch_update"],
                "required_attestations": 3,
                "minimum_trust_level": 0.8
            }
        )
    
    def _register_event_handlers(self) -> None:
        """
        Register cross-component event handlers.
        """
        # Register policy management events with governance audit trail
        self.policy_management_module.register_event_handler(
            event_type="POLICY_CREATED",
            handler=self.governance_audit_trail.record_event
        )
        
        self.policy_management_module.register_event_handler(
            event_type="POLICY_UPDATED",
            handler=self.governance_audit_trail.record_event
        )
        
        self.policy_management_module.register_event_handler(
            event_type="POLICY_DELETED",
            handler=self.governance_audit_trail.record_event
        )
        
        # Register requirement validation events with governance audit trail
        self.requirement_validation_module.register_event_handler(
            event_type="REQUIREMENT_CREATED",
            handler=self.governance_audit_trail.record_event
        )
        
        self.requirement_validation_module.register_event_handler(
            event_type="REQUIREMENT_UPDATED",
            handler=self.governance_audit_trail.record_event
        )
        
        self.requirement_validation_module.register_event_handler(
            event_type="REQUIREMENT_DELETED",
            handler=self.governance_audit_trail.record_event
        )
        
        # Register decision framework events with governance audit trail
        self.decision_framework_engine.register_event_handler(
            event_type="DECISION_RECORDED",
            handler=self.governance_audit_trail.record_event
        )
        
        self.decision_framework_engine.register_event_handler(
            event_type="DECISION_EXECUTED",
            handler=self.governance_audit_trail.record_event
        )
        
        # Register primitive events with governance audit trail
        self.governance_primitive_manager.register_event_handler(
            event_type="PRIMITIVE_REGISTERED",
            handler=self.governance_audit_trail.record_event
        )
        
        self.governance_primitive_manager.register_event_handler(
            event_type="PRIMITIVE_UPDATED",
            handler=self.governance_audit_trail.record_event
        )
        
        # Register trust decay events with governance components
        self.trust_decay_engine.register_event_handler(
            event_type="TRUST_LEVEL_DECAYED",
            handler=self._handle_trust_decay_event
        )
        
        # Register attestation events with governance components
        self.attestation_service.register_event_handler(
            event_type="ATTESTATION_CREATED",
            handler=self._handle_attestation_event
        )
    
    def _handle_trust_decay_event(self, event_data: Dict[str, Any]) -> None:
        """
        Handle trust decay events from the trust decay engine.
        
        Args:
            event_data: Event data from the trust decay engine
        """
        entity_id = event_data.get('entity_id')
        entity_type = event_data.get('entity_type')
        trust_level = event_data.get('trust_level')
        
        if entity_type == "GOVERNANCE_PRIMITIVE":
            self.governance_primitive_manager.update_primitive_trust(entity_id, trust_level)
        elif entity_type == "DECISION_FRAMEWORK":
            self.decision_framework_engine.update_framework_trust(entity_id, trust_level)
        elif entity_type == "GOVERNANCE_POLICY":
            self.policy_management_module.update_policy_trust(entity_id, trust_level)
        elif entity_type == "GOVERNANCE_REQUIREMENT":
            self.requirement_validation_module.update_requirement_trust(entity_id, trust_level)
    
    def _handle_attestation_event(self, event_data: Dict[str, Any]) -> None:
        """
        Handle attestation events from the attestation service.
        
        Args:
            event_data: Event data from the attestation service
        """
        claim_id = event_data.get('claim_id')
        attestation_data = event_data.get('attestation_data', {})
        
        # Handle different types of attestations
        if claim_id.startswith("primitive:"):
            primitive_id = attestation_data.get('primitive_id')
            if primitive_id:
                self.governance_primitive_manager.refresh_primitive(primitive_id)
        
        elif claim_id.startswith("framework:"):
            framework_id = attestation_data.get('framework_id')
            if framework_id:
                self.decision_framework_engine.refresh_framework(framework_id)
        
        elif claim_id.startswith("policy:"):
            policy_id = attestation_data.get('policy_id')
            if policy_id:
                self.policy_management_module.refresh_policy(policy_id)
        
        elif claim_id.startswith("requirement:"):
            requirement_id = attestation_data.get('requirement_id')
            if requirement_id:
                self.requirement_validation_module.refresh_requirement(requirement_id)
    
    def get_governance_status(self) -> Dict[str, Any]:
        """
        Get the status of all governance components.
        
        Returns:
            Dict[str, Any]: Status of all governance components
        """
        # Verify Codex contract tether before operation
        self._verify_operation_tether("get_governance_status")
        
        # Get status from Phase 5.8 components
        codex_status = {
            "codex_lock": self.codex_lock.get_status(),
            "contract_sealer": self.contract_sealer.get_status(),
            "evolution_protocol": self.evolution_protocol.get_status()
        }
        
        # Get status from Phase 5.9 components
        trust_status = {
            "trust_decay_engine": self.trust_decay_engine.get_status(),
            "trust_regeneration_protocol": self.trust_regeneration_protocol.get_status(),
            "trust_metrics_calculator": self.trust_metrics_calculator.get_status(),
            "trust_monitoring_service": self.trust_monitoring_service.get_status()
        }
        
        # Get status from Phase 5.10 components
        attestation_status = {
            "attestation_service": self.attestation_service.get_status(),
            "claim_verification_protocol": self.claim_verification_protocol.get_status(),
            "governance_audit_trail": self.governance_audit_trail.get_status(),
            "attestation_authority_manager": self.attestation_authority_manager.get_status()
        }
        
        # Get status from Phase 5.11 components
        mvg_status = {
            "governance_primitive_manager": self.governance_primitive_manager.get_status(),
            "decision_framework_engine": self.decision_framework_engine.get_status(),
            "policy_management_module": self.policy_management_module.get_status(),
            "requirement_validation_module": self.requirement_validation_module.get_status()
        }
        
        # Combine all statuses
        return {
            "integration_service_id": self.CODEX_CONTRACT_ID,
            "integration_service_version": self.CODEX_CONTRACT_VERSION,
            "timestamp": self._get_current_timestamp(),
            "codex_components": codex_status,
            "trust_components": trust_status,
            "attestation_components": attestation_status,
            "mvg_components": mvg_status,
            "overall_status": self._calculate_overall_status(
                codex_status, trust_status, attestation_status, mvg_status
            )
        }
    
    def _get_current_timestamp(self) -> str:
        """
        Get the current timestamp in ISO format.
        
        Returns:
            str: Current timestamp
        """
        import datetime
        return datetime.datetime.now().isoformat()
    
    def _calculate_overall_status(self,
                                 codex_status: Dict[str, Any],
                                 trust_status: Dict[str, Any],
                                 attestation_status: Dict[str, Any],
                                 mvg_status: Dict[str, Any]) -> str:
        """
        Calculate the overall status of the governance system.
        
        Args:
            codex_status: Status of Phase 5.8 components
            trust_status: Status of Phase 5.9 components
            attestation_status: Status of Phase 5.10 components
            mvg_status: Status of Phase 5.11 components
            
        Returns:
            str: Overall status
        """
        # Extract individual component statuses
        component_statuses = []
        
        for component_group in [codex_status, trust_status, attestation_status, mvg_status]:
            for component_status in component_group.values():
                if isinstance(component_status, dict) and 'status' in component_status:
                    component_statuses.append(component_status['status'])
        
        # Count statuses
        total_components = len(component_statuses)
        healthy_components = component_statuses.count('HEALTHY')
        degraded_components = component_statuses.count('DEGRADED')
        
        # Calculate overall status
        if healthy_components == total_components:
            return 'HEALTHY'
        elif healthy_components + degraded_components == total_components:
            return 'DEGRADED'
        else:
            return 'UNHEALTHY'
    
    def _verify_operation_tether(self, operation_name: str) -> None:
        """
        Verify the Codex contract tether before performing an operation.
        
        Args:
            operation_name: The name of the operation to verify
            
        Raises:
            RuntimeError: If the tether check fails
        """
        # Generate operation-specific tether check hash
        tether_check_hash = self._generate_operation_tether_hash(operation_name)
        
        # Verify tether with Codex Lock
        if not self.codex_lock.verify_operation_tether(
            contract_id=self.CODEX_CONTRACT_ID,
            contract_version=self.CODEX_CONTRACT_VERSION,
            operation_name=operation_name,
            tether_check_hash=tether_check_hash
        ):
            error_msg = f"Operation tether check failed for {operation_name}"
            logger.critical(error_msg)
            raise RuntimeError(error_msg)
    
    def _generate_operation_tether_hash(self, operation_name: str) -> str:
        """
        Generate a hash for an operation-specific tether check.
        
        Args:
            operation_name: The name of the operation
            
        Returns:
            str: The generated hash
        """
        # Get the method object for the operation
        method = getattr(self, operation_name, None)
        if not method:
            raise ValueError(f"Unknown operation: {operation_name}")
        
        # Combine operation-specific components for hashing
        critical_components = [
            self.__class__.__name__,
            self.CODEX_CONTRACT_ID,
            self.CODEX_CONTRACT_VERSION,
            operation_name,
            str(method.__code__.co_code)
        ]
        
        # Generate hash
        hash_input = ":".join(critical_components).encode('utf-8')
        return hashlib.sha256(hash_input).hexdigest()
