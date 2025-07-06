"""
Enhanced Veritas 2 MultiAgentGovernance Integration

Integrates Enhanced Veritas 2 uncertainty analysis with the existing MultiAgentGovernance system.
Enhances trust scoring with uncertainty insights, improves compliance verification with uncertainty
analysis, and provides uncertainty-driven multi-agent collaboration governance.

This integration preserves all existing MultiAgentGovernance functionality while adding
revolutionary uncertainty-enhanced trust and compliance capabilities.
"""

import logging
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import uuid
import asyncio
from dataclasses import dataclass, asdict

# Import bridge services
from ..bridges.enhanced_veritas_bridge import get_enhanced_veritas_bridge
from ..bridges.data_transformer import get_data_transformer, DataFormat
from ..bridges.unified_config import get_config, is_feature_enabled, FeatureFlag

# Import uncertainty analysis
from ..uncertaintyEngine import UncertaintyAnalysisEngine
from ..types import UncertaintyAnalysis, UncertaintySource, ClarificationNeed

logger = logging.getLogger(__name__)

@dataclass
class EnhancedTrustScore:
    """Enhanced trust score with uncertainty analysis."""
    agent_id: str
    base_trust_score: float
    uncertainty_adjusted_score: float
    uncertainty_factors: Dict[str, float]
    confidence_level: float
    trust_volatility: float
    uncertainty_trend: List[float]
    last_updated: str
    trust_breakdown: Dict[str, float]
    risk_assessment: Dict[str, Any]

@dataclass
class UncertaintyEnhancedCompliance:
    """Compliance verification enhanced with uncertainty analysis."""
    compliance_id: str
    base_compliance_score: float
    uncertainty_adjusted_compliance: float
    compliance_uncertainty: float
    verification_confidence: float
    uncertainty_sources: List[UncertaintySource]
    compliance_risks: List[Dict[str, Any]]
    recommended_actions: List[str]
    verification_timestamp: str

@dataclass
class MultiAgentCollaborationGovernance:
    """Governance for multi-agent collaboration with uncertainty insights."""
    collaboration_id: str
    participating_agents: List[str]
    collaboration_uncertainty: float
    trust_network_stability: float
    governance_compliance: float
    uncertainty_propagation: Dict[str, float]
    collective_confidence: float
    governance_recommendations: List[Dict[str, Any]]
    monitoring_alerts: List[Dict[str, Any]]

class UncertaintyEnhancedTrustCalculator:
    """
    Calculates trust scores enhanced with uncertainty analysis.
    Provides multidimensional trust assessment with uncertainty insights.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.TrustCalculator")
        self.uncertainty_engine = UncertaintyAnalysisEngine()
        self.config = get_config()
        self.trust_history = {}
        
    def calculate_enhanced_trust_score(
        self,
        agent_id: str,
        base_trust_data: Dict[str, Any],
        interaction_context: Dict[str, Any] = None
    ) -> EnhancedTrustScore:
        """
        Calculate enhanced trust score with uncertainty analysis.
        
        Args:
            agent_id: ID of the agent being evaluated
            base_trust_data: Existing trust calculation data
            interaction_context: Context of current interaction
            
        Returns:
            Enhanced trust score with uncertainty insights
        """
        self.logger.info(f"Calculating enhanced trust score for agent: {agent_id}")
        
        try:
            # Extract base trust score
            base_trust_score = base_trust_data.get("trust_score", 0.5)
            
            # Analyze uncertainty in trust assessment
            trust_uncertainty_analysis = self._analyze_trust_uncertainty(
                agent_id, base_trust_data, interaction_context
            )
            
            # Calculate uncertainty factors
            uncertainty_factors = self._calculate_uncertainty_factors(
                agent_id, base_trust_data, trust_uncertainty_analysis
            )
            
            # Adjust trust score based on uncertainty
            uncertainty_adjusted_score = self._adjust_trust_for_uncertainty(
                base_trust_score, uncertainty_factors
            )
            
            # Calculate confidence level
            confidence_level = self._calculate_trust_confidence(
                trust_uncertainty_analysis, uncertainty_factors
            )
            
            # Calculate trust volatility
            trust_volatility = self._calculate_trust_volatility(agent_id)
            
            # Get uncertainty trend
            uncertainty_trend = self._get_uncertainty_trend(agent_id)
            
            # Calculate trust breakdown
            trust_breakdown = self._calculate_trust_breakdown(
                base_trust_data, uncertainty_factors
            )
            
            # Perform risk assessment
            risk_assessment = self._perform_trust_risk_assessment(
                agent_id, uncertainty_adjusted_score, uncertainty_factors
            )
            
            enhanced_trust = EnhancedTrustScore(
                agent_id=agent_id,
                base_trust_score=base_trust_score,
                uncertainty_adjusted_score=uncertainty_adjusted_score,
                uncertainty_factors=uncertainty_factors,
                confidence_level=confidence_level,
                trust_volatility=trust_volatility,
                uncertainty_trend=uncertainty_trend,
                last_updated=datetime.utcnow().isoformat(),
                trust_breakdown=trust_breakdown,
                risk_assessment=risk_assessment
            )
            
            # Store in history
            if agent_id not in self.trust_history:
                self.trust_history[agent_id] = []
            
            self.trust_history[agent_id].append({
                "timestamp": datetime.utcnow().isoformat(),
                "enhanced_trust": asdict(enhanced_trust),
                "context": interaction_context
            })
            
            return enhanced_trust
            
        except Exception as e:
            self.logger.error(f"Error calculating enhanced trust score: {e}")
            # Return default enhanced trust on error
            return EnhancedTrustScore(
                agent_id=agent_id,
                base_trust_score=base_trust_data.get("trust_score", 0.5),
                uncertainty_adjusted_score=base_trust_data.get("trust_score", 0.5),
                uncertainty_factors={},
                confidence_level=0.5,
                trust_volatility=0.5,
                uncertainty_trend=[0.5],
                last_updated=datetime.utcnow().isoformat(),
                trust_breakdown={},
                risk_assessment={}
            )
    
    def _analyze_trust_uncertainty(
        self,
        agent_id: str,
        base_trust_data: Dict[str, Any],
        interaction_context: Dict[str, Any]
    ) -> UncertaintyAnalysis:
        """Analyze uncertainty in trust assessment."""
        # Prepare context for uncertainty analysis
        trust_context = {
            "agent_id": agent_id,
            "trust_data": base_trust_data,
            "interaction_context": interaction_context or {},
            "analysis_type": "trust_assessment"
        }
        
        # Perform uncertainty analysis
        return self.uncertainty_engine.analyze_uncertainty(
            context=trust_context,
            additional_factors={
                "trust_history_length": len(self.trust_history.get(agent_id, [])),
                "interaction_frequency": base_trust_data.get("interaction_frequency", 0),
                "performance_consistency": base_trust_data.get("performance_consistency", 0.5),
                "behavioral_predictability": base_trust_data.get("behavioral_predictability", 0.5)
            }
        )
    
    def _calculate_uncertainty_factors(
        self,
        agent_id: str,
        base_trust_data: Dict[str, Any],
        uncertainty_analysis: UncertaintyAnalysis
    ) -> Dict[str, float]:
        """Calculate specific uncertainty factors affecting trust."""
        return {
            "behavioral_uncertainty": self._assess_behavioral_uncertainty(agent_id, base_trust_data),
            "performance_uncertainty": self._assess_performance_uncertainty(base_trust_data),
            "interaction_uncertainty": self._assess_interaction_uncertainty(base_trust_data),
            "temporal_uncertainty": self._assess_temporal_uncertainty(agent_id),
            "context_uncertainty": uncertainty_analysis.uncertainty_breakdown.get("contextual", 0.5),
            "epistemic_uncertainty": uncertainty_analysis.uncertainty_breakdown.get("epistemic", 0.5)
        }
    
    def _assess_behavioral_uncertainty(self, agent_id: str, trust_data: Dict[str, Any]) -> float:
        """Assess uncertainty in agent behavioral patterns."""
        behavioral_consistency = trust_data.get("behavioral_consistency", 0.5)
        behavioral_predictability = trust_data.get("behavioral_predictability", 0.5)
        
        # Higher consistency and predictability = lower uncertainty
        behavioral_uncertainty = 1.0 - ((behavioral_consistency + behavioral_predictability) / 2.0)
        return max(0.0, min(1.0, behavioral_uncertainty))
    
    def _assess_performance_uncertainty(self, trust_data: Dict[str, Any]) -> float:
        """Assess uncertainty in agent performance."""
        performance_variance = trust_data.get("performance_variance", 0.5)
        success_rate_stability = trust_data.get("success_rate_stability", 0.5)
        
        # Higher variance and lower stability = higher uncertainty
        performance_uncertainty = (performance_variance + (1.0 - success_rate_stability)) / 2.0
        return max(0.0, min(1.0, performance_uncertainty))
    
    def _assess_interaction_uncertainty(self, trust_data: Dict[str, Any]) -> float:
        """Assess uncertainty in agent interactions."""
        interaction_frequency = trust_data.get("interaction_frequency", 0)
        interaction_quality = trust_data.get("interaction_quality", 0.5)
        
        # Low frequency or quality = higher uncertainty
        if interaction_frequency == 0:
            return 1.0
        
        frequency_factor = min(1.0, interaction_frequency / 100.0)  # Normalize to 0-1
        interaction_uncertainty = 1.0 - ((frequency_factor + interaction_quality) / 2.0)
        return max(0.0, min(1.0, interaction_uncertainty))
    
    def _assess_temporal_uncertainty(self, agent_id: str) -> float:
        """Assess temporal uncertainty based on trust history."""
        history = self.trust_history.get(agent_id, [])
        if len(history) < 2:
            return 0.8  # High uncertainty with limited history
        
        # Calculate temporal variance in trust scores
        recent_scores = [entry["enhanced_trust"]["uncertainty_adjusted_score"] for entry in history[-10:]]
        if len(recent_scores) < 2:
            return 0.6
        
        mean_score = sum(recent_scores) / len(recent_scores)
        variance = sum((score - mean_score) ** 2 for score in recent_scores) / len(recent_scores)
        
        # Normalize variance to 0-1 scale
        temporal_uncertainty = min(1.0, variance * 4.0)  # Scale factor for normalization
        return temporal_uncertainty
    
    def _adjust_trust_for_uncertainty(
        self,
        base_trust_score: float,
        uncertainty_factors: Dict[str, float]
    ) -> float:
        """Adjust trust score based on uncertainty factors."""
        # Calculate weighted uncertainty
        uncertainty_weights = {
            "behavioral_uncertainty": 0.25,
            "performance_uncertainty": 0.25,
            "interaction_uncertainty": 0.20,
            "temporal_uncertainty": 0.15,
            "context_uncertainty": 0.10,
            "epistemic_uncertainty": 0.05
        }
        
        weighted_uncertainty = sum(
            uncertainty_factors.get(factor, 0.5) * weight
            for factor, weight in uncertainty_weights.items()
        )
        
        # Adjust trust score (higher uncertainty = lower adjusted trust)
        uncertainty_adjustment = 1.0 - (weighted_uncertainty * 0.3)  # Max 30% reduction
        adjusted_score = base_trust_score * uncertainty_adjustment
        
        return max(0.0, min(1.0, adjusted_score))
    
    def _calculate_trust_confidence(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        uncertainty_factors: Dict[str, float]
    ) -> float:
        """Calculate confidence level in trust assessment."""
        base_confidence = uncertainty_analysis.confidence_level
        
        # Factor in specific trust uncertainties
        avg_uncertainty = sum(uncertainty_factors.values()) / len(uncertainty_factors)
        trust_confidence = base_confidence * (1.0 - avg_uncertainty * 0.5)
        
        return max(0.0, min(1.0, trust_confidence))
    
    def _calculate_trust_volatility(self, agent_id: str) -> float:
        """Calculate trust score volatility over time."""
        history = self.trust_history.get(agent_id, [])
        if len(history) < 3:
            return 0.5  # Default volatility for limited history
        
        # Get recent trust scores
        recent_scores = [entry["enhanced_trust"]["uncertainty_adjusted_score"] for entry in history[-10:]]
        
        # Calculate volatility as standard deviation
        mean_score = sum(recent_scores) / len(recent_scores)
        variance = sum((score - mean_score) ** 2 for score in recent_scores) / len(recent_scores)
        volatility = variance ** 0.5
        
        return min(1.0, volatility * 2.0)  # Normalize to 0-1 scale
    
    def _get_uncertainty_trend(self, agent_id: str) -> List[float]:
        """Get uncertainty trend for the agent."""
        history = self.trust_history.get(agent_id, [])
        
        # Extract uncertainty scores from history
        uncertainty_scores = []
        for entry in history[-10:]:  # Last 10 entries
            factors = entry["enhanced_trust"]["uncertainty_factors"]
            avg_uncertainty = sum(factors.values()) / len(factors) if factors else 0.5
            uncertainty_scores.append(avg_uncertainty)
        
        return uncertainty_scores if uncertainty_scores else [0.5]
    
    def _calculate_trust_breakdown(
        self,
        base_trust_data: Dict[str, Any],
        uncertainty_factors: Dict[str, float]
    ) -> Dict[str, float]:
        """Calculate detailed trust breakdown."""
        return {
            "competence": base_trust_data.get("competence_score", 0.5) * (1 - uncertainty_factors.get("performance_uncertainty", 0.5) * 0.3),
            "reliability": base_trust_data.get("reliability_score", 0.5) * (1 - uncertainty_factors.get("behavioral_uncertainty", 0.5) * 0.3),
            "benevolence": base_trust_data.get("benevolence_score", 0.5) * (1 - uncertainty_factors.get("interaction_uncertainty", 0.5) * 0.2),
            "predictability": base_trust_data.get("predictability_score", 0.5) * (1 - uncertainty_factors.get("temporal_uncertainty", 0.5) * 0.4),
            "transparency": base_trust_data.get("transparency_score", 0.5) * (1 - uncertainty_factors.get("epistemic_uncertainty", 0.5) * 0.3)
        }
    
    def _perform_trust_risk_assessment(
        self,
        agent_id: str,
        adjusted_trust_score: float,
        uncertainty_factors: Dict[str, float]
    ) -> Dict[str, Any]:
        """Perform comprehensive trust risk assessment."""
        # Calculate overall risk
        avg_uncertainty = sum(uncertainty_factors.values()) / len(uncertainty_factors)
        trust_risk = (1 - adjusted_trust_score) * 0.6 + avg_uncertainty * 0.4
        
        # Determine risk level
        if trust_risk >= 0.8:
            risk_level = "critical"
        elif trust_risk >= 0.6:
            risk_level = "high"
        elif trust_risk >= 0.4:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Identify primary risk factors
        risk_factors = []
        for factor, uncertainty in uncertainty_factors.items():
            if uncertainty > 0.7:
                risk_factors.append({
                    "factor": factor,
                    "uncertainty_level": uncertainty,
                    "impact": "high" if uncertainty > 0.8 else "medium"
                })
        
        return {
            "overall_risk_score": trust_risk,
            "risk_level": risk_level,
            "primary_risk_factors": risk_factors,
            "trust_threshold_breach": adjusted_trust_score < self.config.uncertainty.confidence_threshold,
            "recommended_monitoring": "enhanced" if trust_risk > 0.6 else "standard",
            "assessment_timestamp": datetime.utcnow().isoformat()
        }

class EnhancedMultiAgentGovernanceIntegration:
    """
    Integration layer between Enhanced Veritas 2 and MultiAgentGovernance.
    
    Provides uncertainty-enhanced governance capabilities for multi-agent systems
    while preserving all existing MultiAgentGovernance functionality.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.bridge = get_enhanced_veritas_bridge()
        self.data_transformer = get_data_transformer()
        self.trust_calculator = UncertaintyEnhancedTrustCalculator()
        self.config = get_config()
        
        # Integration state
        self.active_collaborations = {}
        self.compliance_monitoring = {}
        self.governance_history = []
        
        self.logger.info("Enhanced MultiAgentGovernance Integration initialized")
    
    def enhance_trust_scoring(
        self,
        agent_id: str,
        base_trust_data: Dict[str, Any],
        interaction_context: Dict[str, Any] = None
    ) -> EnhancedTrustScore:
        """
        Enhance trust scoring with uncertainty analysis.
        
        Args:
            agent_id: ID of the agent being evaluated
            base_trust_data: Existing trust calculation data
            interaction_context: Context of current interaction
            
        Returns:
            Enhanced trust score with uncertainty insights
        """
        self.logger.info(f"Enhancing trust scoring for agent: {agent_id}")
        
        try:
            # Check if uncertainty analysis is enabled
            if not is_feature_enabled(FeatureFlag.UNCERTAINTY_ANALYSIS):
                self.logger.info("Uncertainty analysis disabled, using base trust score")
                return self._create_basic_enhanced_trust(agent_id, base_trust_data)
            
            # Calculate enhanced trust score
            enhanced_trust = self.trust_calculator.calculate_enhanced_trust_score(
                agent_id, base_trust_data, interaction_context
            )
            
            # Integrate with existing MultiAgentGovernance via bridge
            integration_result = self.bridge.integrate_uncertainty_analysis(
                {
                    "enhanced_trust": asdict(enhanced_trust),
                    "agent_id": agent_id,
                    "integration_type": "trust_enhancement"
                },
                {
                    "agent_id": agent_id,
                    "trust_data": base_trust_data,
                    "context": interaction_context
                }
            )
            
            self.logger.info(f"Enhanced trust scoring completed for agent: {agent_id}")
            return enhanced_trust
            
        except Exception as e:
            self.logger.error(f"Error enhancing trust scoring: {e}")
            return self._create_basic_enhanced_trust(agent_id, base_trust_data)
    
    def enhance_compliance_verification(
        self,
        compliance_context: Dict[str, Any],
        verification_data: Dict[str, Any]
    ) -> UncertaintyEnhancedCompliance:
        """
        Enhance compliance verification with uncertainty analysis.
        
        Args:
            compliance_context: Context for compliance verification
            verification_data: Base compliance verification data
            
        Returns:
            Enhanced compliance verification with uncertainty insights
        """
        self.logger.info("Enhancing compliance verification with uncertainty analysis")
        
        try:
            # Check if uncertainty analysis is enabled
            if not is_feature_enabled(FeatureFlag.UNCERTAINTY_ANALYSIS):
                self.logger.info("Uncertainty analysis disabled, using base compliance")
                return self._create_basic_enhanced_compliance(compliance_context, verification_data)
            
            # Analyze compliance uncertainty
            compliance_uncertainty_analysis = self._analyze_compliance_uncertainty(
                compliance_context, verification_data
            )
            
            # Calculate enhanced compliance metrics
            base_compliance_score = verification_data.get("compliance_score", 0.5)
            compliance_uncertainty = compliance_uncertainty_analysis.overall_uncertainty
            
            # Adjust compliance score for uncertainty
            uncertainty_adjusted_compliance = self._adjust_compliance_for_uncertainty(
                base_compliance_score, compliance_uncertainty
            )
            
            # Calculate verification confidence
            verification_confidence = compliance_uncertainty_analysis.confidence_level
            
            # Identify compliance risks
            compliance_risks = self._identify_compliance_risks(
                compliance_context, compliance_uncertainty_analysis
            )
            
            # Generate recommended actions
            recommended_actions = self._generate_compliance_actions(
                compliance_uncertainty_analysis, compliance_risks
            )
            
            enhanced_compliance = UncertaintyEnhancedCompliance(
                compliance_id=str(uuid.uuid4()),
                base_compliance_score=base_compliance_score,
                uncertainty_adjusted_compliance=uncertainty_adjusted_compliance,
                compliance_uncertainty=compliance_uncertainty,
                verification_confidence=verification_confidence,
                uncertainty_sources=compliance_uncertainty_analysis.uncertainty_sources,
                compliance_risks=compliance_risks,
                recommended_actions=recommended_actions,
                verification_timestamp=datetime.utcnow().isoformat()
            )
            
            # Store in monitoring
            self.compliance_monitoring[enhanced_compliance.compliance_id] = enhanced_compliance
            
            # Integrate with existing system via bridge
            integration_result = self.bridge.multi_agent_governance.enhance_compliance_verification(
                asdict(enhanced_compliance)
            )
            
            return enhanced_compliance
            
        except Exception as e:
            self.logger.error(f"Error enhancing compliance verification: {e}")
            return self._create_basic_enhanced_compliance(compliance_context, verification_data)
    
    def govern_multi_agent_collaboration(
        self,
        collaboration_context: Dict[str, Any],
        participating_agents: List[str]
    ) -> MultiAgentCollaborationGovernance:
        """
        Provide governance for multi-agent collaboration with uncertainty insights.
        
        Args:
            collaboration_context: Context of the collaboration
            participating_agents: List of agent IDs participating
            
        Returns:
            Governance recommendations with uncertainty analysis
        """
        self.logger.info(f"Governing multi-agent collaboration with {len(participating_agents)} agents")
        
        try:
            collaboration_id = str(uuid.uuid4())
            
            # Analyze collaboration uncertainty
            collaboration_uncertainty = self._analyze_collaboration_uncertainty(
                collaboration_context, participating_agents
            )
            
            # Calculate trust network stability
            trust_network_stability = self._calculate_trust_network_stability(
                participating_agents
            )
            
            # Assess governance compliance
            governance_compliance = self._assess_governance_compliance(
                collaboration_context, participating_agents
            )
            
            # Analyze uncertainty propagation
            uncertainty_propagation = self._analyze_uncertainty_propagation(
                participating_agents, collaboration_uncertainty
            )
            
            # Calculate collective confidence
            collective_confidence = self._calculate_collective_confidence(
                participating_agents, collaboration_uncertainty
            )
            
            # Generate governance recommendations
            governance_recommendations = self._generate_governance_recommendations(
                collaboration_uncertainty, trust_network_stability, governance_compliance
            )
            
            # Generate monitoring alerts
            monitoring_alerts = self._generate_monitoring_alerts(
                collaboration_uncertainty, uncertainty_propagation
            )
            
            collaboration_governance = MultiAgentCollaborationGovernance(
                collaboration_id=collaboration_id,
                participating_agents=participating_agents,
                collaboration_uncertainty=collaboration_uncertainty,
                trust_network_stability=trust_network_stability,
                governance_compliance=governance_compliance,
                uncertainty_propagation=uncertainty_propagation,
                collective_confidence=collective_confidence,
                governance_recommendations=governance_recommendations,
                monitoring_alerts=monitoring_alerts
            )
            
            # Store active collaboration
            self.active_collaborations[collaboration_id] = collaboration_governance
            
            # Integrate with existing system via bridge
            integration_result = self.bridge.multi_agent_governance.govern_collaboration(
                asdict(collaboration_governance)
            )
            
            return collaboration_governance
            
        except Exception as e:
            self.logger.error(f"Error governing multi-agent collaboration: {e}")
            return self._create_basic_collaboration_governance(
                collaboration_context, participating_agents
            )
    
    def _create_basic_enhanced_trust(self, agent_id: str, base_trust_data: Dict[str, Any]) -> EnhancedTrustScore:
        """Create basic enhanced trust when uncertainty analysis is disabled."""
        base_score = base_trust_data.get("trust_score", 0.5)
        return EnhancedTrustScore(
            agent_id=agent_id,
            base_trust_score=base_score,
            uncertainty_adjusted_score=base_score,
            uncertainty_factors={},
            confidence_level=0.8,
            trust_volatility=0.2,
            uncertainty_trend=[0.2],
            last_updated=datetime.utcnow().isoformat(),
            trust_breakdown={},
            risk_assessment={"risk_level": "low"}
        )
    
    def _analyze_compliance_uncertainty(
        self,
        compliance_context: Dict[str, Any],
        verification_data: Dict[str, Any]
    ) -> UncertaintyAnalysis:
        """Analyze uncertainty in compliance verification."""
        context = {
            "compliance_context": compliance_context,
            "verification_data": verification_data,
            "analysis_type": "compliance_verification"
        }
        
        return self.trust_calculator.uncertainty_engine.analyze_uncertainty(
            context=context,
            additional_factors={
                "policy_complexity": len(compliance_context.get("applicable_policies", [])),
                "verification_completeness": verification_data.get("verification_completeness", 0.8),
                "regulatory_clarity": compliance_context.get("regulatory_clarity", 0.7)
            }
        )
    
    def _adjust_compliance_for_uncertainty(
        self,
        base_compliance: float,
        compliance_uncertainty: float
    ) -> float:
        """Adjust compliance score based on uncertainty."""
        # Higher uncertainty reduces confidence in compliance
        uncertainty_adjustment = 1.0 - (compliance_uncertainty * 0.2)  # Max 20% reduction
        adjusted_compliance = base_compliance * uncertainty_adjustment
        return max(0.0, min(1.0, adjusted_compliance))
    
    def _identify_compliance_risks(
        self,
        compliance_context: Dict[str, Any],
        uncertainty_analysis: UncertaintyAnalysis
    ) -> List[Dict[str, Any]]:
        """Identify compliance risks based on uncertainty analysis."""
        risks = []
        
        for source in uncertainty_analysis.uncertainty_sources:
            if source.uncertainty_level > 0.6:
                risks.append({
                    "risk_type": source.source_type,
                    "risk_level": "high" if source.uncertainty_level > 0.8 else "medium",
                    "description": source.description,
                    "mitigation": source.resolution_approach
                })
        
        return risks
    
    def _generate_compliance_actions(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        compliance_risks: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate recommended actions for compliance."""
        actions = []
        
        if uncertainty_analysis.overall_uncertainty > 0.8:
            actions.append("immediate_compliance_review")
        
        if uncertainty_analysis.overall_uncertainty > 0.6:
            actions.append("enhanced_monitoring")
        
        for risk in compliance_risks:
            if risk["risk_level"] == "high":
                actions.append(f"mitigate_{risk['risk_type']}")
        
        if uncertainty_analysis.clarification_needed.needed:
            actions.append("expert_consultation")
        
        return list(set(actions))  # Remove duplicates
    
    def _create_basic_enhanced_compliance(
        self,
        compliance_context: Dict[str, Any],
        verification_data: Dict[str, Any]
    ) -> UncertaintyEnhancedCompliance:
        """Create basic enhanced compliance when uncertainty analysis is disabled."""
        base_score = verification_data.get("compliance_score", 0.5)
        return UncertaintyEnhancedCompliance(
            compliance_id=str(uuid.uuid4()),
            base_compliance_score=base_score,
            uncertainty_adjusted_compliance=base_score,
            compliance_uncertainty=0.2,
            verification_confidence=0.8,
            uncertainty_sources=[],
            compliance_risks=[],
            recommended_actions=["standard_monitoring"],
            verification_timestamp=datetime.utcnow().isoformat()
        )
    
    def _analyze_collaboration_uncertainty(
        self,
        collaboration_context: Dict[str, Any],
        participating_agents: List[str]
    ) -> float:
        """Analyze uncertainty in multi-agent collaboration."""
        # Simplified collaboration uncertainty calculation
        agent_count_factor = min(1.0, len(participating_agents) / 10.0)  # More agents = more uncertainty
        complexity_factor = collaboration_context.get("complexity", 0.5)
        coordination_difficulty = collaboration_context.get("coordination_difficulty", 0.5)
        
        collaboration_uncertainty = (agent_count_factor + complexity_factor + coordination_difficulty) / 3.0
        return min(1.0, collaboration_uncertainty)
    
    def _calculate_trust_network_stability(self, participating_agents: List[str]) -> float:
        """Calculate stability of trust network among agents."""
        if len(participating_agents) < 2:
            return 1.0
        
        # Get trust scores for all agents
        trust_scores = []
        for agent_id in participating_agents:
            history = self.trust_calculator.trust_history.get(agent_id, [])
            if history:
                latest_trust = history[-1]["enhanced_trust"]["uncertainty_adjusted_score"]
                trust_scores.append(latest_trust)
            else:
                trust_scores.append(0.5)  # Default trust
        
        # Calculate stability as inverse of variance
        if len(trust_scores) < 2:
            return 0.8
        
        mean_trust = sum(trust_scores) / len(trust_scores)
        variance = sum((score - mean_trust) ** 2 for score in trust_scores) / len(trust_scores)
        stability = max(0.0, min(1.0, 1.0 - variance))
        
        return stability
    
    def _assess_governance_compliance(
        self,
        collaboration_context: Dict[str, Any],
        participating_agents: List[str]
    ) -> float:
        """Assess governance compliance for the collaboration."""
        # Simplified governance compliance assessment
        policy_adherence = collaboration_context.get("policy_adherence", 0.8)
        regulatory_compliance = collaboration_context.get("regulatory_compliance", 0.8)
        ethical_compliance = collaboration_context.get("ethical_compliance", 0.9)
        
        governance_compliance = (policy_adherence + regulatory_compliance + ethical_compliance) / 3.0
        return governance_compliance
    
    def _analyze_uncertainty_propagation(
        self,
        participating_agents: List[str],
        collaboration_uncertainty: float
    ) -> Dict[str, float]:
        """Analyze how uncertainty propagates through the agent network."""
        propagation = {}
        
        for agent_id in participating_agents:
            # Get agent's individual uncertainty
            history = self.trust_calculator.trust_history.get(agent_id, [])
            if history:
                agent_uncertainty = sum(
                    history[-1]["enhanced_trust"]["uncertainty_factors"].values()
                ) / len(history[-1]["enhanced_trust"]["uncertainty_factors"])
            else:
                agent_uncertainty = 0.5
            
            # Calculate propagation effect
            propagation_effect = (agent_uncertainty + collaboration_uncertainty) / 2.0
            propagation[agent_id] = propagation_effect
        
        return propagation
    
    def _calculate_collective_confidence(
        self,
        participating_agents: List[str],
        collaboration_uncertainty: float
    ) -> float:
        """Calculate collective confidence in collaboration outcome."""
        # Get individual confidence levels
        confidence_levels = []
        for agent_id in participating_agents:
            history = self.trust_calculator.trust_history.get(agent_id, [])
            if history:
                agent_confidence = history[-1]["enhanced_trust"]["confidence_level"]
                confidence_levels.append(agent_confidence)
            else:
                confidence_levels.append(0.5)
        
        # Calculate collective confidence
        if confidence_levels:
            avg_confidence = sum(confidence_levels) / len(confidence_levels)
            # Reduce by collaboration uncertainty
            collective_confidence = avg_confidence * (1.0 - collaboration_uncertainty * 0.3)
        else:
            collective_confidence = 0.5
        
        return max(0.0, min(1.0, collective_confidence))
    
    def _generate_governance_recommendations(
        self,
        collaboration_uncertainty: float,
        trust_network_stability: float,
        governance_compliance: float
    ) -> List[Dict[str, Any]]:
        """Generate governance recommendations for collaboration."""
        recommendations = []
        
        if collaboration_uncertainty > 0.8:
            recommendations.append({
                "type": "risk_mitigation",
                "priority": "high",
                "action": "Implement enhanced collaboration monitoring",
                "rationale": "High collaboration uncertainty detected"
            })
        
        if trust_network_stability < 0.5:
            recommendations.append({
                "type": "trust_building",
                "priority": "medium",
                "action": "Initiate trust-building activities",
                "rationale": "Low trust network stability"
            })
        
        if governance_compliance < 0.7:
            recommendations.append({
                "type": "compliance_improvement",
                "priority": "high",
                "action": "Review and improve governance compliance",
                "rationale": "Below acceptable governance compliance threshold"
            })
        
        return recommendations
    
    def _generate_monitoring_alerts(
        self,
        collaboration_uncertainty: float,
        uncertainty_propagation: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """Generate monitoring alerts for collaboration."""
        alerts = []
        
        if collaboration_uncertainty > 0.8:
            alerts.append({
                "alert_type": "high_uncertainty",
                "severity": "critical",
                "message": "Critical collaboration uncertainty level detected",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        for agent_id, propagation_level in uncertainty_propagation.items():
            if propagation_level > 0.8:
                alerts.append({
                    "alert_type": "uncertainty_propagation",
                    "severity": "high",
                    "message": f"High uncertainty propagation detected for agent {agent_id}",
                    "agent_id": agent_id,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        return alerts
    
    def _create_basic_collaboration_governance(
        self,
        collaboration_context: Dict[str, Any],
        participating_agents: List[str]
    ) -> MultiAgentCollaborationGovernance:
        """Create basic collaboration governance when uncertainty analysis is disabled."""
        return MultiAgentCollaborationGovernance(
            collaboration_id=str(uuid.uuid4()),
            participating_agents=participating_agents,
            collaboration_uncertainty=0.3,
            trust_network_stability=0.8,
            governance_compliance=0.8,
            uncertainty_propagation={agent: 0.3 for agent in participating_agents},
            collective_confidence=0.7,
            governance_recommendations=[],
            monitoring_alerts=[]
        )

# Global integration instance
_multi_agent_governance_integration = None

def get_multi_agent_governance_integration() -> EnhancedMultiAgentGovernanceIntegration:
    """Get the global Enhanced MultiAgentGovernance Integration instance."""
    global _multi_agent_governance_integration
    if _multi_agent_governance_integration is None:
        _multi_agent_governance_integration = EnhancedMultiAgentGovernanceIntegration()
    return _multi_agent_governance_integration

# Convenience functions for external use
def enhance_trust_scoring(agent_id: str, base_trust_data: Dict[str, Any], interaction_context: Dict[str, Any] = None) -> EnhancedTrustScore:
    """Enhance trust scoring with uncertainty analysis."""
    integration = get_multi_agent_governance_integration()
    return integration.enhance_trust_scoring(agent_id, base_trust_data, interaction_context)

def enhance_compliance_verification(compliance_context: Dict[str, Any], verification_data: Dict[str, Any]) -> UncertaintyEnhancedCompliance:
    """Enhance compliance verification with uncertainty analysis."""
    integration = get_multi_agent_governance_integration()
    return integration.enhance_compliance_verification(compliance_context, verification_data)

def govern_multi_agent_collaboration(collaboration_context: Dict[str, Any], participating_agents: List[str]) -> MultiAgentCollaborationGovernance:
    """Provide governance for multi-agent collaboration with uncertainty insights."""
    integration = get_multi_agent_governance_integration()
    return integration.govern_multi_agent_collaboration(collaboration_context, participating_agents)

