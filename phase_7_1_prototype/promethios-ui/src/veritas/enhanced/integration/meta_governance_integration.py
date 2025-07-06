"""
Enhanced Veritas 2 MetaGovernance Integration

Integrates Enhanced Veritas 2 uncertainty analysis with the existing MetaGovernanceManager.
Extends reflection loops with uncertainty triggers, enhances policy adaptation with uncertainty
insights, and provides uncertainty-driven governance decision support.

This integration preserves all existing MetaGovernance functionality while adding
revolutionary uncertainty analysis capabilities.
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
class UncertaintyTriggeredReflection:
    """Reflection loop triggered by uncertainty analysis."""
    reflection_id: str
    uncertainty_analysis: UncertaintyAnalysis
    trigger_threshold: float
    trigger_timestamp: str
    governance_context: Dict[str, Any]
    reflection_status: str  # initiated, in_progress, completed, failed
    uncertainty_resolution: Optional[Dict[str, Any]] = None
    policy_adaptations: List[Dict[str, Any]] = None

@dataclass
class GovernanceUncertaintyMetrics:
    """Metrics for governance uncertainty analysis."""
    governance_uncertainty_score: float
    policy_compliance_uncertainty: float
    decision_confidence_level: float
    intervention_recommendation: str
    uncertainty_trend: List[float]
    governance_stability_score: float
    adaptation_effectiveness: float

class MetaGovernanceUncertaintyAnalyzer:
    """
    Analyzes uncertainty in governance decisions and processes.
    Provides uncertainty insights for MetaGovernance reflection loops.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.UncertaintyAnalyzer")
        self.uncertainty_engine = UncertaintyAnalysisEngine()
        self.config = get_config()
        self.uncertainty_history = []
        
    def analyze_governance_uncertainty(
        self,
        governance_context: Dict[str, Any],
        decision_context: Dict[str, Any] = None
    ) -> GovernanceUncertaintyMetrics:
        """
        Analyze uncertainty in governance context.
        
        Args:
            governance_context: Current governance state and context
            decision_context: Specific decision being made
            
        Returns:
            Comprehensive governance uncertainty metrics
        """
        self.logger.info("Analyzing governance uncertainty")
        
        try:
            # Extract governance-specific uncertainty factors
            governance_factors = self._extract_governance_factors(governance_context)
            decision_factors = self._extract_decision_factors(decision_context or {})
            
            # Perform uncertainty analysis
            uncertainty_analysis = self.uncertainty_engine.analyze_uncertainty(
                context=governance_context,
                additional_factors={
                    "governance_factors": governance_factors,
                    "decision_factors": decision_factors,
                    "analysis_type": "governance"
                }
            )
            
            # Calculate governance-specific metrics
            governance_uncertainty = self._calculate_governance_uncertainty(
                uncertainty_analysis, governance_factors
            )
            
            policy_compliance_uncertainty = self._calculate_policy_compliance_uncertainty(
                governance_context, uncertainty_analysis
            )
            
            decision_confidence = self._calculate_decision_confidence(
                uncertainty_analysis, decision_factors
            )
            
            # Determine intervention recommendation
            intervention_recommendation = self._determine_intervention_recommendation(
                governance_uncertainty, policy_compliance_uncertainty, decision_confidence
            )
            
            # Calculate trend and stability
            uncertainty_trend = self._calculate_uncertainty_trend(governance_uncertainty)
            stability_score = self._calculate_governance_stability(uncertainty_trend)
            adaptation_effectiveness = self._calculate_adaptation_effectiveness(governance_context)
            
            metrics = GovernanceUncertaintyMetrics(
                governance_uncertainty_score=governance_uncertainty,
                policy_compliance_uncertainty=policy_compliance_uncertainty,
                decision_confidence_level=decision_confidence,
                intervention_recommendation=intervention_recommendation,
                uncertainty_trend=uncertainty_trend,
                governance_stability_score=stability_score,
                adaptation_effectiveness=adaptation_effectiveness
            )
            
            # Store in history
            self.uncertainty_history.append({
                "timestamp": datetime.utcnow().isoformat(),
                "metrics": asdict(metrics),
                "context": governance_context
            })
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Error analyzing governance uncertainty: {e}")
            # Return default metrics on error
            return GovernanceUncertaintyMetrics(
                governance_uncertainty_score=0.5,
                policy_compliance_uncertainty=0.5,
                decision_confidence_level=0.5,
                intervention_recommendation="monitor",
                uncertainty_trend=[0.5],
                governance_stability_score=0.5,
                adaptation_effectiveness=0.5
            )
    
    def _extract_governance_factors(self, governance_context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract governance-specific uncertainty factors."""
        return {
            "policy_complexity": self._assess_policy_complexity(governance_context),
            "stakeholder_alignment": self._assess_stakeholder_alignment(governance_context),
            "regulatory_compliance": self._assess_regulatory_compliance(governance_context),
            "decision_precedent": self._assess_decision_precedent(governance_context),
            "resource_availability": self._assess_resource_availability(governance_context),
            "time_pressure": self._assess_time_pressure(governance_context)
        }
    
    def _extract_decision_factors(self, decision_context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract decision-specific uncertainty factors."""
        return {
            "decision_scope": decision_context.get("scope", "medium"),
            "impact_level": decision_context.get("impact", "medium"),
            "reversibility": decision_context.get("reversible", True),
            "information_completeness": decision_context.get("information_completeness", 0.7),
            "expert_consensus": decision_context.get("expert_consensus", 0.8),
            "historical_success_rate": decision_context.get("historical_success", 0.75)
        }
    
    def _assess_policy_complexity(self, context: Dict[str, Any]) -> float:
        """Assess the complexity of policies involved."""
        # Simplified assessment - in practice, this would be more sophisticated
        policy_count = len(context.get("applicable_policies", []))
        interdependencies = len(context.get("policy_interdependencies", []))
        return min(1.0, (policy_count * 0.1) + (interdependencies * 0.15))
    
    def _assess_stakeholder_alignment(self, context: Dict[str, Any]) -> float:
        """Assess alignment among stakeholders."""
        stakeholders = context.get("stakeholders", [])
        if not stakeholders:
            return 0.5
        
        alignment_scores = [s.get("alignment_score", 0.5) for s in stakeholders]
        return sum(alignment_scores) / len(alignment_scores)
    
    def _assess_regulatory_compliance(self, context: Dict[str, Any]) -> float:
        """Assess regulatory compliance uncertainty."""
        compliance_status = context.get("compliance_status", {})
        if not compliance_status:
            return 0.5
        
        compliance_scores = list(compliance_status.values())
        return sum(compliance_scores) / len(compliance_scores) if compliance_scores else 0.5
    
    def _assess_decision_precedent(self, context: Dict[str, Any]) -> float:
        """Assess availability of decision precedents."""
        precedents = context.get("decision_precedents", [])
        if not precedents:
            return 0.3  # High uncertainty without precedents
        
        relevance_scores = [p.get("relevance", 0.5) for p in precedents]
        return sum(relevance_scores) / len(relevance_scores)
    
    def _assess_resource_availability(self, context: Dict[str, Any]) -> float:
        """Assess resource availability for decision implementation."""
        resources = context.get("available_resources", {})
        required_resources = context.get("required_resources", {})
        
        if not required_resources:
            return 0.8  # Low uncertainty if no specific resources required
        
        availability_ratio = 0.0
        for resource, required in required_resources.items():
            available = resources.get(resource, 0)
            if required > 0:
                availability_ratio += min(1.0, available / required)
        
        return availability_ratio / len(required_resources) if required_resources else 0.8
    
    def _assess_time_pressure(self, context: Dict[str, Any]) -> float:
        """Assess time pressure for decision making."""
        deadline = context.get("decision_deadline")
        if not deadline:
            return 0.2  # Low uncertainty with no deadline pressure
        
        try:
            deadline_dt = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
            time_remaining = (deadline_dt - datetime.utcnow()).total_seconds()
            
            if time_remaining <= 0:
                return 1.0  # Maximum uncertainty if deadline passed
            elif time_remaining < 3600:  # Less than 1 hour
                return 0.9
            elif time_remaining < 86400:  # Less than 1 day
                return 0.6
            elif time_remaining < 604800:  # Less than 1 week
                return 0.3
            else:
                return 0.1
        except:
            return 0.2  # Default low uncertainty
    
    def _calculate_governance_uncertainty(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        governance_factors: Dict[str, Any]
    ) -> float:
        """Calculate overall governance uncertainty score."""
        base_uncertainty = uncertainty_analysis.overall_uncertainty
        
        # Weight governance-specific factors
        governance_weight = (
            governance_factors.get("policy_complexity", 0.5) * 0.2 +
            (1 - governance_factors.get("stakeholder_alignment", 0.5)) * 0.2 +
            (1 - governance_factors.get("regulatory_compliance", 0.5)) * 0.15 +
            (1 - governance_factors.get("decision_precedent", 0.5)) * 0.15 +
            (1 - governance_factors.get("resource_availability", 0.5)) * 0.15 +
            governance_factors.get("time_pressure", 0.5) * 0.15
        )
        
        # Combine base uncertainty with governance factors
        return min(1.0, base_uncertainty * 0.7 + governance_weight * 0.3)
    
    def _calculate_policy_compliance_uncertainty(
        self,
        governance_context: Dict[str, Any],
        uncertainty_analysis: UncertaintyAnalysis
    ) -> float:
        """Calculate uncertainty in policy compliance."""
        compliance_status = governance_context.get("compliance_status", {})
        if not compliance_status:
            return 0.5
        
        # Calculate compliance uncertainty based on status and analysis
        compliance_scores = list(compliance_status.values())
        avg_compliance = sum(compliance_scores) / len(compliance_scores)
        
        # Factor in epistemic uncertainty (knowledge gaps)
        epistemic_uncertainty = uncertainty_analysis.uncertainty_breakdown.get("epistemic", 0.5)
        
        return min(1.0, (1 - avg_compliance) * 0.7 + epistemic_uncertainty * 0.3)
    
    def _calculate_decision_confidence(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        decision_factors: Dict[str, Any]
    ) -> float:
        """Calculate confidence level for governance decisions."""
        base_confidence = uncertainty_analysis.confidence_level
        
        # Factor in decision-specific elements
        information_completeness = decision_factors.get("information_completeness", 0.7)
        expert_consensus = decision_factors.get("expert_consensus", 0.8)
        historical_success = decision_factors.get("historical_success_rate", 0.75)
        
        decision_confidence = (
            information_completeness * 0.3 +
            expert_consensus * 0.3 +
            historical_success * 0.2 +
            base_confidence * 0.2
        )
        
        return min(1.0, decision_confidence)
    
    def _determine_intervention_recommendation(
        self,
        governance_uncertainty: float,
        policy_compliance_uncertainty: float,
        decision_confidence: float
    ) -> str:
        """Determine recommended intervention level."""
        if governance_uncertainty >= 0.8 or policy_compliance_uncertainty >= 0.8:
            return "immediate_intervention"
        elif governance_uncertainty >= 0.6 or policy_compliance_uncertainty >= 0.6:
            return "enhanced_oversight"
        elif decision_confidence < 0.4:
            return "expert_consultation"
        elif governance_uncertainty >= 0.4:
            return "increased_monitoring"
        else:
            return "standard_monitoring"
    
    def _calculate_uncertainty_trend(self, current_uncertainty: float) -> List[float]:
        """Calculate uncertainty trend over time."""
        # Get recent uncertainty scores from history
        recent_scores = []
        for entry in self.uncertainty_history[-10:]:  # Last 10 entries
            recent_scores.append(entry["metrics"]["governance_uncertainty_score"])
        
        # Add current score
        recent_scores.append(current_uncertainty)
        
        return recent_scores
    
    def _calculate_governance_stability(self, uncertainty_trend: List[float]) -> float:
        """Calculate governance stability based on uncertainty trend."""
        if len(uncertainty_trend) < 2:
            return 0.5
        
        # Calculate variance in uncertainty
        mean_uncertainty = sum(uncertainty_trend) / len(uncertainty_trend)
        variance = sum((x - mean_uncertainty) ** 2 for x in uncertainty_trend) / len(uncertainty_trend)
        
        # Stability is inverse of variance (normalized)
        stability = max(0.0, min(1.0, 1.0 - (variance * 2)))
        return stability
    
    def _calculate_adaptation_effectiveness(self, governance_context: Dict[str, Any]) -> float:
        """Calculate effectiveness of previous policy adaptations."""
        adaptations = governance_context.get("recent_adaptations", [])
        if not adaptations:
            return 0.5
        
        effectiveness_scores = [a.get("effectiveness_score", 0.5) for a in adaptations]
        return sum(effectiveness_scores) / len(effectiveness_scores)

class EnhancedMetaGovernanceIntegration:
    """
    Integration layer between Enhanced Veritas 2 and MetaGovernanceManager.
    
    Provides uncertainty-enhanced governance capabilities while preserving
    all existing MetaGovernance functionality.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.bridge = get_enhanced_veritas_bridge()
        self.data_transformer = get_data_transformer()
        self.uncertainty_analyzer = MetaGovernanceUncertaintyAnalyzer()
        self.config = get_config()
        
        # Integration state
        self.active_uncertainty_reflections = {}
        self.governance_enhancement_history = []
        
        self.logger.info("Enhanced MetaGovernance Integration initialized")
    
    def enhance_reflection_loop(
        self,
        reflection_context: Dict[str, Any],
        governance_context: Dict[str, Any] = None
    ) -> UncertaintyTriggeredReflection:
        """
        Enhance reflection loop with uncertainty analysis.
        
        Args:
            reflection_context: Original reflection loop context
            governance_context: Additional governance context
            
        Returns:
            Enhanced reflection with uncertainty insights
        """
        self.logger.info("Enhancing reflection loop with uncertainty analysis")
        
        try:
            # Check if uncertainty analysis is enabled
            if not is_feature_enabled(FeatureFlag.UNCERTAINTY_ANALYSIS):
                self.logger.info("Uncertainty analysis disabled, using standard reflection")
                return self._create_standard_reflection(reflection_context)
            
            # Analyze governance uncertainty
            uncertainty_metrics = self.uncertainty_analyzer.analyze_governance_uncertainty(
                governance_context or reflection_context,
                reflection_context.get("decision_context")
            )
            
            # Create uncertainty analysis object
            uncertainty_analysis = UncertaintyAnalysis(
                overall_uncertainty=uncertainty_metrics.governance_uncertainty_score,
                confidence_level=uncertainty_metrics.decision_confidence_level,
                uncertainty_sources=[
                    UncertaintySource(
                        source_type="governance",
                        uncertainty_level=uncertainty_metrics.governance_uncertainty_score,
                        description="Governance decision uncertainty",
                        resolution_approach="enhanced_oversight"
                    ),
                    UncertaintySource(
                        source_type="policy_compliance",
                        uncertainty_level=uncertainty_metrics.policy_compliance_uncertainty,
                        description="Policy compliance uncertainty",
                        resolution_approach="expert_consultation"
                    )
                ],
                uncertainty_breakdown={
                    "governance": uncertainty_metrics.governance_uncertainty_score,
                    "policy_compliance": uncertainty_metrics.policy_compliance_uncertainty,
                    "decision_confidence": uncertainty_metrics.decision_confidence_level
                },
                clarification_needed=ClarificationNeed(
                    needed=uncertainty_metrics.governance_uncertainty_score > self.config.uncertainty.uncertainty_threshold,
                    priority="high" if uncertainty_metrics.governance_uncertainty_score > 0.8 else "medium",
                    questions=[
                        "What are the key governance risks in this decision?",
                        "Are all stakeholders aligned on this approach?",
                        "What are the compliance implications?",
                        "What precedents exist for similar decisions?"
                    ],
                    context=governance_context or reflection_context
                ),
                recommended_actions=[
                    uncertainty_metrics.intervention_recommendation,
                    "enhanced_monitoring" if uncertainty_metrics.governance_uncertainty_score > 0.6 else "standard_monitoring"
                ],
                analysis_timestamp=datetime.utcnow().isoformat()
            )
            
            # Create uncertainty-triggered reflection
            reflection_id = str(uuid.uuid4())
            uncertainty_reflection = UncertaintyTriggeredReflection(
                reflection_id=reflection_id,
                uncertainty_analysis=uncertainty_analysis,
                trigger_threshold=self.config.uncertainty.uncertainty_threshold,
                trigger_timestamp=datetime.utcnow().isoformat(),
                governance_context=governance_context or reflection_context,
                reflection_status="initiated"
            )
            
            # Store active reflection
            self.active_uncertainty_reflections[reflection_id] = uncertainty_reflection
            
            # Integrate with existing MetaGovernance via bridge
            integration_result = self.bridge.integrate_uncertainty_analysis(
                asdict(uncertainty_analysis),
                {
                    "reflection_id": reflection_id,
                    "governance_context": governance_context or reflection_context,
                    "integration_type": "meta_governance_reflection"
                }
            )
            
            # Update reflection status
            uncertainty_reflection.reflection_status = "in_progress"
            
            self.logger.info(f"Enhanced reflection loop created: {reflection_id}")
            return uncertainty_reflection
            
        except Exception as e:
            self.logger.error(f"Error enhancing reflection loop: {e}")
            return self._create_standard_reflection(reflection_context)
    
    def complete_uncertainty_reflection(
        self,
        reflection_id: str,
        resolution_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Complete an uncertainty-triggered reflection loop.
        
        Args:
            reflection_id: ID of the reflection to complete
            resolution_data: Data about how uncertainty was resolved
            
        Returns:
            Completion results with policy adaptation recommendations
        """
        self.logger.info(f"Completing uncertainty reflection: {reflection_id}")
        
        try:
            # Get active reflection
            reflection = self.active_uncertainty_reflections.get(reflection_id)
            if not reflection:
                self.logger.warning(f"Reflection not found: {reflection_id}")
                return {"success": False, "error": "Reflection not found"}
            
            # Analyze uncertainty resolution
            uncertainty_resolution = self._analyze_uncertainty_resolution(
                reflection.uncertainty_analysis,
                resolution_data
            )
            
            # Generate policy adaptation recommendations
            policy_adaptations = self._generate_policy_adaptations(
                reflection,
                uncertainty_resolution
            )
            
            # Update reflection
            reflection.uncertainty_resolution = uncertainty_resolution
            reflection.policy_adaptations = policy_adaptations
            reflection.reflection_status = "completed"
            
            # Complete via bridge
            completion_result = self.bridge.meta_governance.complete_reflection_loop(
                reflection_id,
                {
                    "uncertainty_resolution": uncertainty_resolution,
                    "policy_adaptations": policy_adaptations,
                    "enhanced_veritas_2": True
                }
            )
            
            # Store in history
            self.governance_enhancement_history.append({
                "reflection_id": reflection_id,
                "completion_timestamp": datetime.utcnow().isoformat(),
                "uncertainty_resolution": uncertainty_resolution,
                "policy_adaptations": policy_adaptations,
                "completion_result": completion_result
            })
            
            # Remove from active reflections
            del self.active_uncertainty_reflections[reflection_id]
            
            return {
                "success": True,
                "reflection_id": reflection_id,
                "uncertainty_resolution": uncertainty_resolution,
                "policy_adaptations": policy_adaptations,
                "completion_result": completion_result
            }
            
        except Exception as e:
            self.logger.error(f"Error completing uncertainty reflection: {e}")
            return {"success": False, "error": str(e)}
    
    def get_governance_uncertainty_insights(
        self,
        governance_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Get uncertainty insights for governance decision support.
        
        Args:
            governance_context: Current governance context
            
        Returns:
            Comprehensive uncertainty insights for governance
        """
        self.logger.info("Generating governance uncertainty insights")
        
        try:
            # Analyze current uncertainty
            uncertainty_metrics = self.uncertainty_analyzer.analyze_governance_uncertainty(
                governance_context
            )
            
            # Get historical trends
            historical_trends = self._get_historical_uncertainty_trends()
            
            # Generate recommendations
            recommendations = self._generate_governance_recommendations(
                uncertainty_metrics,
                governance_context
            )
            
            # Calculate risk assessment
            risk_assessment = self._calculate_governance_risk_assessment(
                uncertainty_metrics,
                governance_context
            )
            
            return {
                "uncertainty_metrics": asdict(uncertainty_metrics),
                "historical_trends": historical_trends,
                "recommendations": recommendations,
                "risk_assessment": risk_assessment,
                "insights_timestamp": datetime.utcnow().isoformat(),
                "confidence_level": uncertainty_metrics.decision_confidence_level
            }
            
        except Exception as e:
            self.logger.error(f"Error generating governance insights: {e}")
            return {
                "error": str(e),
                "insights_timestamp": datetime.utcnow().isoformat()
            }
    
    def _create_standard_reflection(self, reflection_context: Dict[str, Any]) -> UncertaintyTriggeredReflection:
        """Create a standard reflection when uncertainty analysis is disabled."""
        return UncertaintyTriggeredReflection(
            reflection_id=str(uuid.uuid4()),
            uncertainty_analysis=None,
            trigger_threshold=0.0,
            trigger_timestamp=datetime.utcnow().isoformat(),
            governance_context=reflection_context,
            reflection_status="standard"
        )
    
    def _analyze_uncertainty_resolution(
        self,
        original_uncertainty: UncertaintyAnalysis,
        resolution_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze how uncertainty was resolved."""
        return {
            "original_uncertainty_score": original_uncertainty.overall_uncertainty,
            "resolved_uncertainty_score": resolution_data.get("final_uncertainty", 0.3),
            "uncertainty_reduction": original_uncertainty.overall_uncertainty - resolution_data.get("final_uncertainty", 0.3),
            "resolution_method": resolution_data.get("resolution_method", "standard"),
            "human_intervention_used": resolution_data.get("human_intervention", False),
            "expert_consultation_used": resolution_data.get("expert_consultation", False),
            "resolution_effectiveness": resolution_data.get("effectiveness", 0.8),
            "lessons_learned": resolution_data.get("lessons_learned", [])
        }
    
    def _generate_policy_adaptations(
        self,
        reflection: UncertaintyTriggeredReflection,
        uncertainty_resolution: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate policy adaptation recommendations based on uncertainty resolution."""
        adaptations = []
        
        # Adaptation based on uncertainty level
        if reflection.uncertainty_analysis.overall_uncertainty > 0.8:
            adaptations.append({
                "adaptation_type": "threshold_adjustment",
                "description": "Lower uncertainty threshold for similar decisions",
                "rationale": "High uncertainty detected, increase sensitivity",
                "priority": "high"
            })
        
        # Adaptation based on resolution method
        if uncertainty_resolution.get("human_intervention_used"):
            adaptations.append({
                "adaptation_type": "intervention_protocol",
                "description": "Establish human intervention protocol for similar cases",
                "rationale": "Human intervention was effective",
                "priority": "medium"
            })
        
        # Adaptation based on effectiveness
        if uncertainty_resolution.get("resolution_effectiveness", 0) > 0.9:
            adaptations.append({
                "adaptation_type": "best_practice",
                "description": "Document resolution approach as best practice",
                "rationale": "High effectiveness resolution method",
                "priority": "low"
            })
        
        return adaptations
    
    def _get_historical_uncertainty_trends(self) -> Dict[str, Any]:
        """Get historical uncertainty trends for governance."""
        history = self.uncertainty_analyzer.uncertainty_history
        if not history:
            return {"trend": "insufficient_data"}
        
        # Calculate trends over different time periods
        recent_scores = [entry["metrics"]["governance_uncertainty_score"] for entry in history[-10:]]
        
        return {
            "recent_average": sum(recent_scores) / len(recent_scores) if recent_scores else 0.5,
            "trend_direction": self._calculate_trend_direction(recent_scores),
            "volatility": self._calculate_volatility(recent_scores),
            "data_points": len(history)
        }
    
    def _calculate_trend_direction(self, scores: List[float]) -> str:
        """Calculate trend direction from uncertainty scores."""
        if len(scores) < 2:
            return "stable"
        
        recent_avg = sum(scores[-3:]) / len(scores[-3:]) if len(scores) >= 3 else scores[-1]
        earlier_avg = sum(scores[:-3]) / len(scores[:-3]) if len(scores) > 3 else scores[0]
        
        if recent_avg > earlier_avg + 0.1:
            return "increasing"
        elif recent_avg < earlier_avg - 0.1:
            return "decreasing"
        else:
            return "stable"
    
    def _calculate_volatility(self, scores: List[float]) -> float:
        """Calculate volatility in uncertainty scores."""
        if len(scores) < 2:
            return 0.0
        
        mean_score = sum(scores) / len(scores)
        variance = sum((score - mean_score) ** 2 for score in scores) / len(scores)
        return variance ** 0.5
    
    def _generate_governance_recommendations(
        self,
        uncertainty_metrics: GovernanceUncertaintyMetrics,
        governance_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate governance recommendations based on uncertainty analysis."""
        recommendations = []
        
        # High uncertainty recommendations
        if uncertainty_metrics.governance_uncertainty_score > 0.8:
            recommendations.append({
                "type": "immediate_action",
                "priority": "high",
                "recommendation": "Initiate emergency governance review",
                "rationale": "Extremely high governance uncertainty detected"
            })
        
        # Policy compliance recommendations
        if uncertainty_metrics.policy_compliance_uncertainty > 0.7:
            recommendations.append({
                "type": "compliance_review",
                "priority": "high",
                "recommendation": "Conduct comprehensive policy compliance audit",
                "rationale": "High policy compliance uncertainty"
            })
        
        # Decision confidence recommendations
        if uncertainty_metrics.decision_confidence_level < 0.4:
            recommendations.append({
                "type": "expert_consultation",
                "priority": "medium",
                "recommendation": "Engage domain experts for decision support",
                "rationale": "Low decision confidence level"
            })
        
        # Stability recommendations
        if uncertainty_metrics.governance_stability_score < 0.5:
            recommendations.append({
                "type": "stability_improvement",
                "priority": "medium",
                "recommendation": "Implement governance stability measures",
                "rationale": "Low governance stability detected"
            })
        
        return recommendations
    
    def _calculate_governance_risk_assessment(
        self,
        uncertainty_metrics: GovernanceUncertaintyMetrics,
        governance_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate comprehensive governance risk assessment."""
        # Calculate overall risk score
        risk_factors = [
            uncertainty_metrics.governance_uncertainty_score,
            uncertainty_metrics.policy_compliance_uncertainty,
            1 - uncertainty_metrics.decision_confidence_level,
            1 - uncertainty_metrics.governance_stability_score
        ]
        
        overall_risk = sum(risk_factors) / len(risk_factors)
        
        # Determine risk level
        if overall_risk >= 0.8:
            risk_level = "critical"
        elif overall_risk >= 0.6:
            risk_level = "high"
        elif overall_risk >= 0.4:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "overall_risk_score": overall_risk,
            "risk_level": risk_level,
            "risk_factors": {
                "governance_uncertainty": uncertainty_metrics.governance_uncertainty_score,
                "policy_compliance": uncertainty_metrics.policy_compliance_uncertainty,
                "decision_confidence": 1 - uncertainty_metrics.decision_confidence_level,
                "stability": 1 - uncertainty_metrics.governance_stability_score
            },
            "mitigation_priority": uncertainty_metrics.intervention_recommendation,
            "assessment_timestamp": datetime.utcnow().isoformat()
        }

# Global integration instance
_meta_governance_integration = None

def get_meta_governance_integration() -> EnhancedMetaGovernanceIntegration:
    """Get the global Enhanced MetaGovernance Integration instance."""
    global _meta_governance_integration
    if _meta_governance_integration is None:
        _meta_governance_integration = EnhancedMetaGovernanceIntegration()
    return _meta_governance_integration

# Convenience functions for external use
def enhance_reflection_loop(reflection_context: Dict[str, Any], governance_context: Dict[str, Any] = None) -> UncertaintyTriggeredReflection:
    """Enhance reflection loop with uncertainty analysis."""
    integration = get_meta_governance_integration()
    return integration.enhance_reflection_loop(reflection_context, governance_context)

def get_governance_uncertainty_insights(governance_context: Dict[str, Any]) -> Dict[str, Any]:
    """Get uncertainty insights for governance decision support."""
    integration = get_meta_governance_integration()
    return integration.get_governance_uncertainty_insights(governance_context)

