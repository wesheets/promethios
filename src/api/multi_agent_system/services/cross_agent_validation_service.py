"""
Cross-Agent Validation Service

Validates agent-to-agent interactions, enforces system-wide policy compliance,
and ensures secure communication between agents in multi-agent systems.
Implements the "weakest link" protection model where system policy is the minimum requirement.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from pydantic import BaseModel, Field, validator
from datetime import datetime, timedelta
from enum import Enum
import json
import asyncio
from collections import defaultdict

class ComplianceStandard(str, Enum):
    HIPAA = "hipaa"
    SOC2 = "soc2"
    GDPR = "gdpr"
    PCI_DSS = "pci_dss"
    ISO_27001 = "iso_27001"
    NIST = "nist"
    CUSTOM = "custom"

class SecurityLevel(str, Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    TOP_SECRET = "top_secret"

class ValidationResult(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    CONDITIONAL = "conditional"
    REQUIRES_REVIEW = "requires_review"

class InteractionType(str, Enum):
    DATA_SHARING = "data_sharing"
    TASK_DELEGATION = "task_delegation"
    RESULT_AGGREGATION = "result_aggregation"
    COMMUNICATION = "communication"
    RESOURCE_ACCESS = "resource_access"

class AgentComplianceProfile(BaseModel):
    agent_id: str
    compliance_standards: List[ComplianceStandard] = Field(default_factory=list)
    security_level: SecurityLevel = Field(SecurityLevel.INTERNAL)
    trust_score: float = Field(ge=0.0, le=1.0, description="Trust score from 0-1")
    data_handling_capabilities: List[str] = Field(default_factory=list)
    encryption_support: List[str] = Field(default_factory=list)
    audit_logging_enabled: bool = Field(True)
    last_compliance_check: Optional[datetime] = None
    compliance_expiry: Optional[datetime] = None
    policy_violations: int = Field(0, ge=0)
    metadata: Optional[Dict[str, Any]] = None

class SystemPolicyRequirements(BaseModel):
    context_id: str
    required_compliance_standards: List[ComplianceStandard] = Field(default_factory=list)
    minimum_security_level: SecurityLevel = Field(SecurityLevel.INTERNAL)
    minimum_trust_score: float = Field(0.7, ge=0.0, le=1.0)
    required_capabilities: List[str] = Field(default_factory=list)
    data_classification_requirements: Dict[str, SecurityLevel] = Field(default_factory=dict)
    cross_agent_validation_enabled: bool = Field(True)
    audit_requirements: Dict[str, Any] = Field(default_factory=dict)
    custom_validation_rules: List[Dict[str, Any]] = Field(default_factory=list)

class CrossAgentInteraction(BaseModel):
    interaction_id: str
    from_agent_id: str
    to_agent_id: str
    interaction_type: InteractionType
    data_classification: SecurityLevel
    compliance_context: List[ComplianceStandard] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload_metadata: Optional[Dict[str, Any]] = None

class ValidationIssue(BaseModel):
    issue_id: str
    severity: str  # "low", "medium", "high", "critical"
    issue_type: str
    description: str
    affected_agents: List[str]
    compliance_standards: List[ComplianceStandard] = Field(default_factory=list)
    remediation_suggestions: List[str] = Field(default_factory=list)
    auto_resolvable: bool = Field(False)

class CrossAgentValidationResult(BaseModel):
    validation_id: str
    from_agent_id: str
    to_agent_id: str
    interaction_type: InteractionType
    result: ValidationResult
    compliance_check_passed: bool
    security_check_passed: bool
    trust_check_passed: bool
    issues: List[ValidationIssue] = Field(default_factory=list)
    conditions: List[str] = Field(default_factory=list)
    validation_timestamp: datetime = Field(default_factory=datetime.utcnow)
    expiry_timestamp: Optional[datetime] = None

class SystemComplianceReport(BaseModel):
    context_id: str
    overall_compliance_status: str
    system_policy_requirements: SystemPolicyRequirements
    agent_compliance_summary: Dict[str, Dict[str, Any]]
    compliance_gaps: List[ValidationIssue]
    interaction_validation_summary: Dict[str, int]
    recommendations: List[str]
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class CrossAgentValidationService:
    """Service for validating agent-to-agent interactions and enforcing system-wide policies."""
    
    def __init__(self):
        self.agent_profiles: Dict[str, AgentComplianceProfile] = {}
        self.system_policies: Dict[str, SystemPolicyRequirements] = {}
        self.validation_history: List[CrossAgentValidationResult] = []
        self.compliance_standards_requirements = self._initialize_compliance_requirements()
        
    def _initialize_compliance_requirements(self) -> Dict[ComplianceStandard, Dict[str, Any]]:
        """Initialize requirements for each compliance standard."""
        
        return {
            ComplianceStandard.HIPAA: {
                "required_capabilities": [
                    "data_encryption_at_rest",
                    "data_encryption_in_transit", 
                    "access_logging",
                    "audit_trail",
                    "data_minimization",
                    "breach_notification"
                ],
                "minimum_security_level": SecurityLevel.CONFIDENTIAL,
                "minimum_trust_score": 0.9,
                "data_retention_requirements": {"max_days": 2555},  # 7 years
                "encryption_requirements": ["AES-256", "TLS-1.3"],
                "audit_frequency_days": 30
            },
            ComplianceStandard.SOC2: {
                "required_capabilities": [
                    "access_controls",
                    "system_monitoring",
                    "incident_response",
                    "change_management",
                    "vendor_management"
                ],
                "minimum_security_level": SecurityLevel.CONFIDENTIAL,
                "minimum_trust_score": 0.8,
                "monitoring_requirements": ["real_time_alerts", "log_analysis"],
                "audit_frequency_days": 90
            },
            ComplianceStandard.GDPR: {
                "required_capabilities": [
                    "data_subject_rights",
                    "consent_management",
                    "data_portability",
                    "right_to_erasure",
                    "privacy_by_design"
                ],
                "minimum_security_level": SecurityLevel.CONFIDENTIAL,
                "minimum_trust_score": 0.85,
                "data_processing_lawfulness": ["consent", "contract", "legal_obligation"],
                "audit_frequency_days": 60
            },
            ComplianceStandard.PCI_DSS: {
                "required_capabilities": [
                    "payment_data_protection",
                    "secure_network",
                    "vulnerability_management",
                    "access_control_measures",
                    "network_monitoring"
                ],
                "minimum_security_level": SecurityLevel.RESTRICTED,
                "minimum_trust_score": 0.95,
                "encryption_requirements": ["AES-256", "RSA-2048"],
                "audit_frequency_days": 90
            },
            ComplianceStandard.ISO_27001: {
                "required_capabilities": [
                    "information_security_management",
                    "risk_assessment",
                    "security_controls",
                    "incident_management",
                    "business_continuity"
                ],
                "minimum_security_level": SecurityLevel.CONFIDENTIAL,
                "minimum_trust_score": 0.8,
                "audit_frequency_days": 365
            },
            ComplianceStandard.NIST: {
                "required_capabilities": [
                    "identify_assets",
                    "protect_systems",
                    "detect_threats",
                    "respond_incidents",
                    "recover_operations"
                ],
                "minimum_security_level": SecurityLevel.CONFIDENTIAL,
                "minimum_trust_score": 0.8,
                "framework_functions": ["identify", "protect", "detect", "respond", "recover"],
                "audit_frequency_days": 180
            }
        }
    
    async def register_agent_compliance_profile(self, profile: AgentComplianceProfile) -> Dict[str, Any]:
        """Register or update an agent's compliance profile."""
        
        # Validate compliance profile
        validation_issues = await self._validate_agent_compliance(profile)
        
        # Store the profile
        self.agent_profiles[profile.agent_id] = profile
        
        return {
            "success": True,
            "agent_id": profile.agent_id,
            "compliance_standards": [std.value for std in profile.compliance_standards],
            "validation_issues": [issue.dict() for issue in validation_issues],
            "trust_score": profile.trust_score,
            "security_level": profile.security_level.value
        }
    
    async def set_system_policy_requirements(self, requirements: SystemPolicyRequirements) -> Dict[str, Any]:
        """Set system-wide policy requirements for a multi-agent context."""
        
        self.system_policies[requirements.context_id] = requirements
        
        # Validate all registered agents against new requirements
        compliance_report = await self.generate_system_compliance_report(requirements.context_id)
        
        return {
            "success": True,
            "context_id": requirements.context_id,
            "policy_requirements": requirements.dict(),
            "compliance_report": compliance_report.dict()
        }
    
    async def validate_cross_agent_interaction(
        self, 
        interaction: CrossAgentInteraction,
        context_id: str
    ) -> CrossAgentValidationResult:
        """Validate if an interaction between two agents is allowed."""
        
        validation_id = f"{interaction.from_agent_id}_{interaction.to_agent_id}_{int(datetime.utcnow().timestamp())}"
        
        # Get agent profiles
        from_agent = self.agent_profiles.get(interaction.from_agent_id)
        to_agent = self.agent_profiles.get(interaction.to_agent_id)
        
        if not from_agent or not to_agent:
            return CrossAgentValidationResult(
                validation_id=validation_id,
                from_agent_id=interaction.from_agent_id,
                to_agent_id=interaction.to_agent_id,
                interaction_type=interaction.interaction_type,
                result=ValidationResult.REJECTED,
                compliance_check_passed=False,
                security_check_passed=False,
                trust_check_passed=False,
                issues=[ValidationIssue(
                    issue_id=f"missing_profile_{validation_id}",
                    severity="critical",
                    issue_type="missing_agent_profile",
                    description="One or both agents do not have registered compliance profiles",
                    affected_agents=[interaction.from_agent_id, interaction.to_agent_id],
                    remediation_suggestions=["Register agent compliance profiles before interaction"]
                )]
            )
        
        # Get system policy requirements
        system_policy = self.system_policies.get(context_id)
        if not system_policy:
            return CrossAgentValidationResult(
                validation_id=validation_id,
                from_agent_id=interaction.from_agent_id,
                to_agent_id=interaction.to_agent_id,
                interaction_type=interaction.interaction_type,
                result=ValidationResult.REJECTED,
                compliance_check_passed=False,
                security_check_passed=False,
                trust_check_passed=False,
                issues=[ValidationIssue(
                    issue_id=f"missing_system_policy_{validation_id}",
                    severity="critical",
                    issue_type="missing_system_policy",
                    description="No system policy requirements defined for this context",
                    affected_agents=[interaction.from_agent_id, interaction.to_agent_id],
                    remediation_suggestions=["Define system policy requirements for the context"]
                )]
            )
        
        # Perform validation checks
        compliance_result = await self._check_compliance_compatibility(from_agent, to_agent, system_policy, interaction)
        security_result = await self._check_security_compatibility(from_agent, to_agent, system_policy, interaction)
        trust_result = await self._check_trust_compatibility(from_agent, to_agent, system_policy, interaction)
        
        # Combine results
        all_issues = compliance_result["issues"] + security_result["issues"] + trust_result["issues"]
        conditions = compliance_result["conditions"] + security_result["conditions"] + trust_result["conditions"]
        
        # Determine overall result
        if compliance_result["passed"] and security_result["passed"] and trust_result["passed"]:
            if conditions:
                overall_result = ValidationResult.CONDITIONAL
            else:
                overall_result = ValidationResult.APPROVED
        elif any(issue.severity == "critical" for issue in all_issues):
            overall_result = ValidationResult.REJECTED
        else:
            overall_result = ValidationResult.REQUIRES_REVIEW
        
        validation_result = CrossAgentValidationResult(
            validation_id=validation_id,
            from_agent_id=interaction.from_agent_id,
            to_agent_id=interaction.to_agent_id,
            interaction_type=interaction.interaction_type,
            result=overall_result,
            compliance_check_passed=compliance_result["passed"],
            security_check_passed=security_result["passed"],
            trust_check_passed=trust_result["passed"],
            issues=all_issues,
            conditions=conditions,
            expiry_timestamp=datetime.utcnow() + timedelta(hours=24)  # Validation expires in 24 hours
        )
        
        # Store validation result
        self.validation_history.append(validation_result)
        
        return validation_result
    
    async def _check_compliance_compatibility(
        self, 
        from_agent: AgentComplianceProfile,
        to_agent: AgentComplianceProfile,
        system_policy: SystemPolicyRequirements,
        interaction: CrossAgentInteraction
    ) -> Dict[str, Any]:
        """Check if agents meet compliance requirements for interaction."""
        
        issues = []
        conditions = []
        
        # Check system-wide compliance requirements
        for required_standard in system_policy.required_compliance_standards:
            # Both agents must meet system-wide compliance requirements
            if required_standard not in from_agent.compliance_standards:
                issues.append(ValidationIssue(
                    issue_id=f"compliance_mismatch_{from_agent.agent_id}_{required_standard.value}",
                    severity="critical",
                    issue_type="compliance_standard_missing",
                    description=f"Agent {from_agent.agent_id} does not meet required {required_standard.value} compliance",
                    affected_agents=[from_agent.agent_id],
                    compliance_standards=[required_standard],
                    remediation_suggestions=[f"Ensure agent {from_agent.agent_id} is {required_standard.value} compliant"]
                ))
            
            if required_standard not in to_agent.compliance_standards:
                issues.append(ValidationIssue(
                    issue_id=f"compliance_mismatch_{to_agent.agent_id}_{required_standard.value}",
                    severity="critical",
                    issue_type="compliance_standard_missing",
                    description=f"Agent {to_agent.agent_id} does not meet required {required_standard.value} compliance",
                    affected_agents=[to_agent.agent_id],
                    compliance_standards=[required_standard],
                    remediation_suggestions=[f"Ensure agent {to_agent.agent_id} is {required_standard.value} compliant"]
                ))
        
        # Check interaction-specific compliance requirements
        for compliance_standard in interaction.compliance_context:
            if compliance_standard in self.compliance_standards_requirements:
                requirements = self.compliance_standards_requirements[compliance_standard]
                
                # Check required capabilities
                for capability in requirements.get("required_capabilities", []):
                    if capability not in from_agent.data_handling_capabilities:
                        issues.append(ValidationIssue(
                            issue_id=f"capability_missing_{from_agent.agent_id}_{capability}",
                            severity="high",
                            issue_type="missing_capability",
                            description=f"Agent {from_agent.agent_id} lacks required capability: {capability}",
                            affected_agents=[from_agent.agent_id],
                            compliance_standards=[compliance_standard],
                            remediation_suggestions=[f"Add {capability} capability to agent {from_agent.agent_id}"]
                        ))
                    
                    if capability not in to_agent.data_handling_capabilities:
                        issues.append(ValidationIssue(
                            issue_id=f"capability_missing_{to_agent.agent_id}_{capability}",
                            severity="high",
                            issue_type="missing_capability",
                            description=f"Agent {to_agent.agent_id} lacks required capability: {capability}",
                            affected_agents=[to_agent.agent_id],
                            compliance_standards=[compliance_standard],
                            remediation_suggestions=[f"Add {capability} capability to agent {to_agent.agent_id}"]
                        ))
        
        # Check compliance expiry
        current_time = datetime.utcnow()
        if from_agent.compliance_expiry and from_agent.compliance_expiry < current_time:
            issues.append(ValidationIssue(
                issue_id=f"compliance_expired_{from_agent.agent_id}",
                severity="high",
                issue_type="compliance_expired",
                description=f"Agent {from_agent.agent_id} compliance has expired",
                affected_agents=[from_agent.agent_id],
                remediation_suggestions=[f"Renew compliance certification for agent {from_agent.agent_id}"]
            ))
        
        if to_agent.compliance_expiry and to_agent.compliance_expiry < current_time:
            issues.append(ValidationIssue(
                issue_id=f"compliance_expired_{to_agent.agent_id}",
                severity="high",
                issue_type="compliance_expired",
                description=f"Agent {to_agent.agent_id} compliance has expired",
                affected_agents=[to_agent.agent_id],
                remediation_suggestions=[f"Renew compliance certification for agent {to_agent.agent_id}"]
            ))
        
        return {
            "passed": len([issue for issue in issues if issue.severity == "critical"]) == 0,
            "issues": issues,
            "conditions": conditions
        }
    
    async def _check_security_compatibility(
        self, 
        from_agent: AgentComplianceProfile,
        to_agent: AgentComplianceProfile,
        system_policy: SystemPolicyRequirements,
        interaction: CrossAgentInteraction
    ) -> Dict[str, Any]:
        """Check if agents meet security requirements for interaction."""
        
        issues = []
        conditions = []
        
        # Check minimum security levels
        security_levels_order = [
            SecurityLevel.PUBLIC,
            SecurityLevel.INTERNAL,
            SecurityLevel.CONFIDENTIAL,
            SecurityLevel.RESTRICTED,
            SecurityLevel.TOP_SECRET
        ]
        
        min_level_index = security_levels_order.index(system_policy.minimum_security_level)
        from_level_index = security_levels_order.index(from_agent.security_level)
        to_level_index = security_levels_order.index(to_agent.security_level)
        
        if from_level_index < min_level_index:
            issues.append(ValidationIssue(
                issue_id=f"security_level_insufficient_{from_agent.agent_id}",
                severity="critical",
                issue_type="insufficient_security_level",
                description=f"Agent {from_agent.agent_id} security level {from_agent.security_level.value} below required {system_policy.minimum_security_level.value}",
                affected_agents=[from_agent.agent_id],
                remediation_suggestions=[f"Upgrade agent {from_agent.agent_id} to {system_policy.minimum_security_level.value} security level"]
            ))
        
        if to_level_index < min_level_index:
            issues.append(ValidationIssue(
                issue_id=f"security_level_insufficient_{to_agent.agent_id}",
                severity="critical",
                issue_type="insufficient_security_level",
                description=f"Agent {to_agent.agent_id} security level {to_agent.security_level.value} below required {system_policy.minimum_security_level.value}",
                affected_agents=[to_agent.agent_id],
                remediation_suggestions=[f"Upgrade agent {to_agent.agent_id} to {system_policy.minimum_security_level.value} security level"]
            ))
        
        # Check data classification compatibility
        interaction_level_index = security_levels_order.index(interaction.data_classification)
        
        if from_level_index < interaction_level_index:
            issues.append(ValidationIssue(
                issue_id=f"data_classification_mismatch_{from_agent.agent_id}",
                severity="high",
                issue_type="data_classification_mismatch",
                description=f"Agent {from_agent.agent_id} cannot handle {interaction.data_classification.value} data",
                affected_agents=[from_agent.agent_id],
                remediation_suggestions=[f"Upgrade agent {from_agent.agent_id} security clearance or use lower classification data"]
            ))
        
        if to_level_index < interaction_level_index:
            issues.append(ValidationIssue(
                issue_id=f"data_classification_mismatch_{to_agent.agent_id}",
                severity="high",
                issue_type="data_classification_mismatch",
                description=f"Agent {to_agent.agent_id} cannot handle {interaction.data_classification.value} data",
                affected_agents=[to_agent.agent_id],
                remediation_suggestions=[f"Upgrade agent {to_agent.agent_id} security clearance or use lower classification data"]
            ))
        
        # Check encryption support for sensitive interactions
        if interaction.data_classification in [SecurityLevel.CONFIDENTIAL, SecurityLevel.RESTRICTED, SecurityLevel.TOP_SECRET]:
            required_encryption = ["AES-256", "TLS-1.3"]
            
            for encryption in required_encryption:
                if encryption not in from_agent.encryption_support:
                    conditions.append(f"Agent {from_agent.agent_id} should support {encryption} encryption for this interaction")
                
                if encryption not in to_agent.encryption_support:
                    conditions.append(f"Agent {to_agent.agent_id} should support {encryption} encryption for this interaction")
        
        return {
            "passed": len([issue for issue in issues if issue.severity == "critical"]) == 0,
            "issues": issues,
            "conditions": conditions
        }
    
    async def _check_trust_compatibility(
        self, 
        from_agent: AgentComplianceProfile,
        to_agent: AgentComplianceProfile,
        system_policy: SystemPolicyRequirements,
        interaction: CrossAgentInteraction
    ) -> Dict[str, Any]:
        """Check if agents meet trust requirements for interaction."""
        
        issues = []
        conditions = []
        
        # Check minimum trust scores
        if from_agent.trust_score < system_policy.minimum_trust_score:
            issues.append(ValidationIssue(
                issue_id=f"trust_score_insufficient_{from_agent.agent_id}",
                severity="medium",
                issue_type="insufficient_trust_score",
                description=f"Agent {from_agent.agent_id} trust score {from_agent.trust_score:.2f} below required {system_policy.minimum_trust_score:.2f}",
                affected_agents=[from_agent.agent_id],
                remediation_suggestions=[f"Improve trust score for agent {from_agent.agent_id} through successful interactions"]
            ))
        
        if to_agent.trust_score < system_policy.minimum_trust_score:
            issues.append(ValidationIssue(
                issue_id=f"trust_score_insufficient_{to_agent.agent_id}",
                severity="medium",
                issue_type="insufficient_trust_score",
                description=f"Agent {to_agent.agent_id} trust score {to_agent.trust_score:.2f} below required {system_policy.minimum_trust_score:.2f}",
                affected_agents=[to_agent.agent_id],
                remediation_suggestions=[f"Improve trust score for agent {to_agent.agent_id} through successful interactions"]
            ))
        
        # Check policy violations
        if from_agent.policy_violations > 5:
            issues.append(ValidationIssue(
                issue_id=f"policy_violations_high_{from_agent.agent_id}",
                severity="high",
                issue_type="high_policy_violations",
                description=f"Agent {from_agent.agent_id} has {from_agent.policy_violations} policy violations",
                affected_agents=[from_agent.agent_id],
                remediation_suggestions=[f"Review and address policy violations for agent {from_agent.agent_id}"]
            ))
        
        if to_agent.policy_violations > 5:
            issues.append(ValidationIssue(
                issue_id=f"policy_violations_high_{to_agent.agent_id}",
                severity="high",
                issue_type="high_policy_violations",
                description=f"Agent {to_agent.agent_id} has {to_agent.policy_violations} policy violations",
                affected_agents=[to_agent.agent_id],
                remediation_suggestions=[f"Review and address policy violations for agent {to_agent.agent_id}"]
            ))
        
        # Check audit logging requirements
        if not from_agent.audit_logging_enabled and system_policy.audit_requirements:
            conditions.append(f"Agent {from_agent.agent_id} should enable audit logging for compliance")
        
        if not to_agent.audit_logging_enabled and system_policy.audit_requirements:
            conditions.append(f"Agent {to_agent.agent_id} should enable audit logging for compliance")
        
        return {
            "passed": len([issue for issue in issues if issue.severity in ["critical", "high"]]) == 0,
            "issues": issues,
            "conditions": conditions
        }
    
    async def _validate_agent_compliance(self, profile: AgentComplianceProfile) -> List[ValidationIssue]:
        """Validate an agent's compliance profile against standards."""
        
        issues = []
        
        for standard in profile.compliance_standards:
            if standard in self.compliance_standards_requirements:
                requirements = self.compliance_standards_requirements[standard]
                
                # Check required capabilities
                missing_capabilities = []
                for capability in requirements.get("required_capabilities", []):
                    if capability not in profile.data_handling_capabilities:
                        missing_capabilities.append(capability)
                
                if missing_capabilities:
                    issues.append(ValidationIssue(
                        issue_id=f"missing_capabilities_{profile.agent_id}_{standard.value}",
                        severity="high",
                        issue_type="missing_compliance_capabilities",
                        description=f"Agent missing required {standard.value} capabilities: {', '.join(missing_capabilities)}",
                        affected_agents=[profile.agent_id],
                        compliance_standards=[standard],
                        remediation_suggestions=[f"Add missing capabilities: {', '.join(missing_capabilities)}"]
                    ))
                
                # Check minimum trust score
                min_trust = requirements.get("minimum_trust_score", 0.7)
                if profile.trust_score < min_trust:
                    issues.append(ValidationIssue(
                        issue_id=f"trust_score_low_{profile.agent_id}_{standard.value}",
                        severity="medium",
                        issue_type="insufficient_trust_for_compliance",
                        description=f"Agent trust score {profile.trust_score:.2f} below {standard.value} requirement {min_trust:.2f}",
                        affected_agents=[profile.agent_id],
                        compliance_standards=[standard],
                        remediation_suggestions=[f"Improve agent trust score to at least {min_trust:.2f}"]
                    ))
        
        return issues
    
    async def generate_system_compliance_report(self, context_id: str) -> SystemComplianceReport:
        """Generate a comprehensive compliance report for a multi-agent system."""
        
        system_policy = self.system_policies.get(context_id)
        if not system_policy:
            raise ValueError(f"No system policy found for context {context_id}")
        
        # Get all agents in the context (mock implementation - would integrate with context service)
        context_agent_ids = await self._get_context_agent_ids(context_id)
        
        agent_compliance_summary = {}
        compliance_gaps = []
        
        for agent_id in context_agent_ids:
            agent_profile = self.agent_profiles.get(agent_id)
            if not agent_profile:
                compliance_gaps.append(ValidationIssue(
                    issue_id=f"missing_profile_{agent_id}",
                    severity="critical",
                    issue_type="missing_agent_profile",
                    description=f"Agent {agent_id} does not have a registered compliance profile",
                    affected_agents=[agent_id],
                    remediation_suggestions=[f"Register compliance profile for agent {agent_id}"]
                ))
                continue
            
            # Check agent against system requirements
            agent_issues = []
            
            # Check compliance standards
            missing_standards = []
            for required_standard in system_policy.required_compliance_standards:
                if required_standard not in agent_profile.compliance_standards:
                    missing_standards.append(required_standard.value)
            
            if missing_standards:
                agent_issues.append(f"Missing compliance standards: {', '.join(missing_standards)}")
            
            # Check security level
            if agent_profile.security_level.value != system_policy.minimum_security_level.value:
                security_levels_order = ["public", "internal", "confidential", "restricted", "top_secret"]
                agent_level_index = security_levels_order.index(agent_profile.security_level.value)
                required_level_index = security_levels_order.index(system_policy.minimum_security_level.value)
                
                if agent_level_index < required_level_index:
                    agent_issues.append(f"Security level {agent_profile.security_level.value} below required {system_policy.minimum_security_level.value}")
            
            # Check trust score
            if agent_profile.trust_score < system_policy.minimum_trust_score:
                agent_issues.append(f"Trust score {agent_profile.trust_score:.2f} below required {system_policy.minimum_trust_score:.2f}")
            
            agent_compliance_summary[agent_id] = {
                "compliance_standards": [std.value for std in agent_profile.compliance_standards],
                "security_level": agent_profile.security_level.value,
                "trust_score": agent_profile.trust_score,
                "issues": agent_issues,
                "compliant": len(agent_issues) == 0
            }
        
        # Calculate interaction validation summary
        recent_validations = [
            v for v in self.validation_history 
            if (datetime.utcnow() - v.validation_timestamp).total_seconds() < 86400  # Last 24 hours
        ]
        
        interaction_validation_summary = {
            "total_validations": len(recent_validations),
            "approved": len([v for v in recent_validations if v.result == ValidationResult.APPROVED]),
            "rejected": len([v for v in recent_validations if v.result == ValidationResult.REJECTED]),
            "conditional": len([v for v in recent_validations if v.result == ValidationResult.CONDITIONAL]),
            "requires_review": len([v for v in recent_validations if v.result == ValidationResult.REQUIRES_REVIEW])
        }
        
        # Generate recommendations
        recommendations = []
        compliant_agents = len([summary for summary in agent_compliance_summary.values() if summary["compliant"]])
        total_agents = len(agent_compliance_summary)
        
        if compliant_agents < total_agents:
            recommendations.append(f"Address compliance issues for {total_agents - compliant_agents} agents")
        
        if interaction_validation_summary["rejected"] > 0:
            recommendations.append("Review and resolve rejected agent interactions")
        
        if len(compliance_gaps) > 0:
            recommendations.append("Register compliance profiles for all agents in the system")
        
        # Determine overall compliance status
        if compliant_agents == total_agents and len(compliance_gaps) == 0:
            overall_status = "compliant"
        elif compliant_agents > total_agents * 0.8:
            overall_status = "mostly_compliant"
        else:
            overall_status = "non_compliant"
        
        return SystemComplianceReport(
            context_id=context_id,
            overall_compliance_status=overall_status,
            system_policy_requirements=system_policy,
            agent_compliance_summary=agent_compliance_summary,
            compliance_gaps=compliance_gaps,
            interaction_validation_summary=interaction_validation_summary,
            recommendations=recommendations
        )
    
    async def _get_context_agent_ids(self, context_id: str) -> List[str]:
        """Get agent IDs for a context (mock implementation)."""
        # TODO: Integrate with actual context service
        # For now, return agents that have profiles registered
        return list(self.agent_profiles.keys())
    
    async def get_dashboard_data(self, context_id: Optional[str] = None) -> Dict[str, Any]:
        """Get cross-agent validation data for the governance dashboard."""
        
        # Get recent validation results
        recent_validations = [
            v for v in self.validation_history 
            if (datetime.utcnow() - v.validation_timestamp).total_seconds() < 86400  # Last 24 hours
        ]
        
        if context_id:
            # Filter by context if specified
            # TODO: Add context filtering when interaction model includes context_id
            pass
        
        # Calculate validation metrics
        total_validations = len(recent_validations)
        approved_count = len([v for v in recent_validations if v.result == ValidationResult.APPROVED])
        rejected_count = len([v for v in recent_validations if v.result == ValidationResult.REJECTED])
        
        # Get compliance overview
        total_agents = len(self.agent_profiles)
        compliant_agents = 0
        
        for agent_profile in self.agent_profiles.values():
            if agent_profile.trust_score >= 0.7 and len(agent_profile.compliance_standards) > 0:
                compliant_agents += 1
        
        # Get recent issues
        recent_issues = []
        for validation in recent_validations[-10:]:  # Last 10 validations
            recent_issues.extend(validation.issues)
        
        return {
            "overview": {
                "total_agents": total_agents,
                "compliant_agents": compliant_agents,
                "compliance_percentage": (compliant_agents / total_agents * 100) if total_agents > 0 else 0,
                "total_validations_24h": total_validations,
                "approval_rate": (approved_count / total_validations * 100) if total_validations > 0 else 0,
                "rejection_rate": (rejected_count / total_validations * 100) if total_validations > 0 else 0
            },
            "recent_validations": [v.dict() for v in recent_validations[-20:]],  # Last 20 validations
            "agent_profiles": {agent_id: profile.dict() for agent_id, profile in self.agent_profiles.items()},
            "recent_issues": [issue.dict() for issue in recent_issues[-10:]],  # Last 10 issues
            "system_policies": {context_id: policy.dict() for context_id, policy in self.system_policies.items()}
        }

# Global service instance
cross_agent_validation_service = CrossAgentValidationService()

