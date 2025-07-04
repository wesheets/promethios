"""
Enhanced Veritas 2 Expert Matching System

Intelligent system for matching human experts with uncertainty resolution needs.
Uses uncertainty analysis, domain expertise, and quantum insights to recommend
the most suitable human experts for collaborative problem-solving.

Key Capabilities:
- Expert Profile Management - Comprehensive expert capability modeling
- Intelligent Matching - AI-driven expert-uncertainty matching
- Quantum-Enhanced Selection - Quantum uncertainty insights for expert selection
- Performance Tracking - Expert effectiveness monitoring and optimization
- Dynamic Availability - Real-time expert availability and workload management
"""

import logging
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import uuid
import asyncio
from dataclasses import dataclass, asdict
import math

# Import bridge services
from ..bridges.enhanced_veritas_bridge import get_enhanced_veritas_bridge
from ..bridges.unified_config import get_config, is_feature_enabled, FeatureFlag

# Import uncertainty analysis
from ..uncertaintyEngine import UncertaintyAnalysisEngine
from ..types import UncertaintyAnalysis, UncertaintySource

# Import quantum integration
from ..quantum.quantum_integration import get_quantum_integration

logger = logging.getLogger(__name__)

@dataclass
class ExpertProfile:
    """Comprehensive expert profile for HITL collaboration."""
    expert_id: str
    name: str
    email: str
    expertise_domains: List[str]  # Technical, medical, financial, legal, etc.
    uncertainty_specialties: List[str]  # Epistemic, aleatoric, contextual, etc.
    skill_levels: Dict[str, float]  # Domain -> skill level (0-1)
    availability_schedule: Dict[str, Any]  # Availability patterns
    response_time_avg: float  # Average response time in minutes
    collaboration_effectiveness: float  # Historical effectiveness score
    quantum_collaboration_score: float  # Quantum-enhanced collaboration score
    preferred_interaction_style: str  # Direct, progressive, contextual
    language_preferences: List[str]
    timezone: str
    max_concurrent_sessions: int
    current_workload: int
    expert_metadata: Dict[str, Any]
    created_timestamp: str
    last_updated: str

@dataclass
class ExpertMatch:
    """Expert matching result with confidence and rationale."""
    match_id: str
    expert_id: str
    uncertainty_analysis: UncertaintyAnalysis
    match_confidence: float  # 0-1 confidence in match quality
    expertise_alignment: float  # How well expert expertise aligns
    availability_score: float  # Expert availability for this request
    quantum_enhancement_score: float  # Quantum uncertainty insights
    estimated_resolution_time: float  # Estimated time to resolve uncertainty
    collaboration_strategy: str  # Recommended collaboration approach
    match_rationale: Dict[str, Any]  # Detailed rationale for match
    priority_score: float  # Overall priority score for this match
    match_timestamp: str

@dataclass
class HITLSession:
    """Human-in-the-loop collaboration session."""
    session_id: str
    uncertainty_analysis: UncertaintyAnalysis
    matched_experts: List[ExpertMatch]
    active_expert: Optional[str]  # Currently active expert
    session_status: str  # pending, active, completed, escalated
    collaboration_strategy: str
    session_context: Dict[str, Any]
    interaction_history: List[Dict[str, Any]]
    uncertainty_reduction_progress: List[Tuple[float, float]]  # (time, uncertainty)
    quantum_insights: Dict[str, Any]
    session_metrics: Dict[str, Any]
    created_timestamp: str
    last_updated: str

class ExpertMatchingSystem:
    """
    Intelligent expert matching system for HITL collaboration.
    
    Matches human experts with uncertainty resolution needs using:
    - Domain expertise analysis
    - Uncertainty specialty matching
    - Quantum-enhanced selection
    - Performance-based optimization
    - Real-time availability management
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.bridge = get_enhanced_veritas_bridge()
        self.quantum_integration = get_quantum_integration()
        self.config = get_config()
        
        # Expert management
        self.expert_profiles = {}  # expert_id -> ExpertProfile
        self.active_sessions = {}  # session_id -> HITLSession
        self.expert_performance_history = {}  # expert_id -> performance data
        
        # Matching algorithms
        self.matching_algorithms = {
            "domain_expertise": self._match_by_domain_expertise,
            "uncertainty_specialty": self._match_by_uncertainty_specialty,
            "quantum_enhanced": self._match_by_quantum_insights,
            "performance_based": self._match_by_performance,
            "availability_optimized": self._match_by_availability
        }
        
        self.logger.info("Expert Matching System initialized")
    
    def register_expert(
        self,
        expert_data: Dict[str, Any]
    ) -> ExpertProfile:
        """
        Register a new expert in the system.
        
        Args:
            expert_data: Expert registration data
            
        Returns:
            Created expert profile
        """
        self.logger.info(f"Registering expert: {expert_data.get('name', 'Unknown')}")
        
        try:
            expert_id = str(uuid.uuid4())
            
            # Create expert profile
            expert_profile = ExpertProfile(
                expert_id=expert_id,
                name=expert_data.get("name", ""),
                email=expert_data.get("email", ""),
                expertise_domains=expert_data.get("expertise_domains", []),
                uncertainty_specialties=expert_data.get("uncertainty_specialties", []),
                skill_levels=expert_data.get("skill_levels", {}),
                availability_schedule=expert_data.get("availability_schedule", {}),
                response_time_avg=expert_data.get("response_time_avg", 30.0),
                collaboration_effectiveness=0.5,  # Initial neutral score
                quantum_collaboration_score=0.5,  # Initial neutral score
                preferred_interaction_style=expert_data.get("preferred_interaction_style", "progressive"),
                language_preferences=expert_data.get("language_preferences", ["en"]),
                timezone=expert_data.get("timezone", "UTC"),
                max_concurrent_sessions=expert_data.get("max_concurrent_sessions", 3),
                current_workload=0,
                expert_metadata=expert_data.get("metadata", {}),
                created_timestamp=datetime.utcnow().isoformat(),
                last_updated=datetime.utcnow().isoformat()
            )
            
            # Store expert profile
            self.expert_profiles[expert_id] = expert_profile
            
            # Initialize performance history
            self.expert_performance_history[expert_id] = {
                "sessions_completed": 0,
                "average_resolution_time": 0.0,
                "uncertainty_reduction_effectiveness": 0.5,
                "collaboration_satisfaction": 0.5,
                "quantum_enhancement_utilization": 0.0,
                "domain_success_rates": {},
                "performance_trends": []
            }
            
            self.logger.info(f"Expert registered successfully: {expert_id}")
            return expert_profile
            
        except Exception as e:
            self.logger.error(f"Error registering expert: {e}")
            raise
    
    def find_expert_matches(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        context: Dict[str, Any] = None,
        max_matches: int = 5
    ) -> List[ExpertMatch]:
        """
        Find expert matches for uncertainty resolution.
        
        Args:
            uncertainty_analysis: Uncertainty analysis requiring expert input
            context: Additional context for matching
            max_matches: Maximum number of matches to return
            
        Returns:
            List of expert matches ranked by suitability
        """
        self.logger.info("Finding expert matches for uncertainty resolution")
        
        try:
            context = context or {}
            matches = []
            
            # Get quantum insights if available
            quantum_insights = self._get_quantum_insights_for_matching(
                uncertainty_analysis, context
            )
            
            # Evaluate each expert
            for expert_id, expert_profile in self.expert_profiles.items():
                # Skip if expert is overloaded
                if expert_profile.current_workload >= expert_profile.max_concurrent_sessions:
                    continue
                
                # Calculate match scores
                match_scores = self._calculate_expert_match_scores(
                    expert_profile, uncertainty_analysis, context, quantum_insights
                )
                
                # Create expert match
                expert_match = ExpertMatch(
                    match_id=str(uuid.uuid4()),
                    expert_id=expert_id,
                    uncertainty_analysis=uncertainty_analysis,
                    match_confidence=match_scores["overall_confidence"],
                    expertise_alignment=match_scores["expertise_alignment"],
                    availability_score=match_scores["availability_score"],
                    quantum_enhancement_score=match_scores["quantum_enhancement"],
                    estimated_resolution_time=match_scores["estimated_resolution_time"],
                    collaboration_strategy=match_scores["recommended_strategy"],
                    match_rationale=match_scores["rationale"],
                    priority_score=match_scores["priority_score"],
                    match_timestamp=datetime.utcnow().isoformat()
                )
                
                matches.append(expert_match)
            
            # Sort by priority score and return top matches
            matches.sort(key=lambda m: m.priority_score, reverse=True)
            top_matches = matches[:max_matches]
            
            self.logger.info(f"Found {len(top_matches)} expert matches")
            return top_matches
            
        except Exception as e:
            self.logger.error(f"Error finding expert matches: {e}")
            return []
    
    def create_hitl_session(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        expert_matches: List[ExpertMatch],
        context: Dict[str, Any] = None
    ) -> HITLSession:
        """
        Create a new HITL collaboration session.
        
        Args:
            uncertainty_analysis: Uncertainty analysis for collaboration
            expert_matches: List of matched experts
            context: Session context
            
        Returns:
            Created HITL session
        """
        self.logger.info("Creating HITL collaboration session")
        
        try:
            session_id = str(uuid.uuid4())
            context = context or {}
            
            # Select collaboration strategy
            collaboration_strategy = self._select_collaboration_strategy(
                uncertainty_analysis, expert_matches, context
            )
            
            # Get quantum insights for session
            quantum_insights = self._get_quantum_insights_for_session(
                uncertainty_analysis, expert_matches, context
            )
            
            # Create session
            hitl_session = HITLSession(
                session_id=session_id,
                uncertainty_analysis=uncertainty_analysis,
                matched_experts=expert_matches,
                active_expert=expert_matches[0].expert_id if expert_matches else None,
                session_status="pending",
                collaboration_strategy=collaboration_strategy,
                session_context=context,
                interaction_history=[],
                uncertainty_reduction_progress=[(0.0, uncertainty_analysis.overall_uncertainty)],
                quantum_insights=quantum_insights,
                session_metrics={
                    "start_uncertainty": uncertainty_analysis.overall_uncertainty,
                    "target_uncertainty": context.get("target_uncertainty", 0.3),
                    "max_duration": context.get("max_duration_minutes", 60),
                    "interaction_count": 0
                },
                created_timestamp=datetime.utcnow().isoformat(),
                last_updated=datetime.utcnow().isoformat()
            )
            
            # Store session
            self.active_sessions[session_id] = hitl_session
            
            # Update expert workloads
            for match in expert_matches:
                expert = self.expert_profiles.get(match.expert_id)
                if expert:
                    expert.current_workload += 1
            
            self.logger.info(f"HITL session created: {session_id}")
            return hitl_session
            
        except Exception as e:
            self.logger.error(f"Error creating HITL session: {e}")
            raise
    
    def update_expert_performance(
        self,
        expert_id: str,
        session_data: Dict[str, Any]
    ) -> None:
        """
        Update expert performance based on session results.
        
        Args:
            expert_id: ID of the expert
            session_data: Session performance data
        """
        self.logger.info(f"Updating expert performance: {expert_id}")
        
        try:
            if expert_id not in self.expert_performance_history:
                self.logger.warning(f"Expert not found for performance update: {expert_id}")
                return
            
            performance = self.expert_performance_history[expert_id]
            
            # Update session count
            performance["sessions_completed"] += 1
            
            # Update average resolution time
            resolution_time = session_data.get("resolution_time_minutes", 0.0)
            current_avg = performance["average_resolution_time"]
            session_count = performance["sessions_completed"]
            performance["average_resolution_time"] = (
                (current_avg * (session_count - 1) + resolution_time) / session_count
            )
            
            # Update uncertainty reduction effectiveness
            uncertainty_reduction = session_data.get("uncertainty_reduction", 0.0)
            current_effectiveness = performance["uncertainty_reduction_effectiveness"]
            performance["uncertainty_reduction_effectiveness"] = (
                (current_effectiveness * 0.8) + (uncertainty_reduction * 0.2)
            )
            
            # Update collaboration satisfaction
            satisfaction = session_data.get("collaboration_satisfaction", 0.5)
            current_satisfaction = performance["collaboration_satisfaction"]
            performance["collaboration_satisfaction"] = (
                (current_satisfaction * 0.8) + (satisfaction * 0.2)
            )
            
            # Update quantum enhancement utilization
            quantum_utilization = session_data.get("quantum_enhancement_utilization", 0.0)
            current_quantum = performance["quantum_enhancement_utilization"]
            performance["quantum_enhancement_utilization"] = (
                (current_quantum * 0.8) + (quantum_utilization * 0.2)
            )
            
            # Update domain success rates
            domain = session_data.get("domain", "general")
            success = session_data.get("success", False)
            if domain not in performance["domain_success_rates"]:
                performance["domain_success_rates"][domain] = {"successes": 0, "total": 0}
            
            performance["domain_success_rates"][domain]["total"] += 1
            if success:
                performance["domain_success_rates"][domain]["successes"] += 1
            
            # Add performance trend data point
            performance["performance_trends"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "resolution_time": resolution_time,
                "uncertainty_reduction": uncertainty_reduction,
                "satisfaction": satisfaction,
                "quantum_utilization": quantum_utilization
            })
            
            # Limit trend history
            if len(performance["performance_trends"]) > 100:
                performance["performance_trends"] = performance["performance_trends"][-100:]
            
            # Update expert profile scores
            expert_profile = self.expert_profiles.get(expert_id)
            if expert_profile:
                expert_profile.collaboration_effectiveness = performance["uncertainty_reduction_effectiveness"]
                expert_profile.quantum_collaboration_score = performance["quantum_enhancement_utilization"]
                expert_profile.response_time_avg = performance["average_resolution_time"]
                expert_profile.last_updated = datetime.utcnow().isoformat()
            
            self.logger.info(f"Expert performance updated: {expert_id}")
            
        except Exception as e:
            self.logger.error(f"Error updating expert performance: {e}")
    
    def _calculate_expert_match_scores(
        self,
        expert_profile: ExpertProfile,
        uncertainty_analysis: UncertaintyAnalysis,
        context: Dict[str, Any],
        quantum_insights: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate comprehensive match scores for an expert."""
        
        # Domain expertise alignment
        expertise_alignment = self._calculate_expertise_alignment(
            expert_profile, uncertainty_analysis, context
        )
        
        # Uncertainty specialty matching
        uncertainty_specialty_score = self._calculate_uncertainty_specialty_score(
            expert_profile, uncertainty_analysis
        )
        
        # Availability score
        availability_score = self._calculate_availability_score(expert_profile, context)
        
        # Performance-based score
        performance_score = self._calculate_performance_score(expert_profile)
        
        # Quantum enhancement score
        quantum_enhancement = self._calculate_quantum_enhancement_score(
            expert_profile, quantum_insights
        )
        
        # Estimated resolution time
        estimated_resolution_time = self._estimate_resolution_time(
            expert_profile, uncertainty_analysis, context
        )
        
        # Overall confidence calculation
        overall_confidence = (
            expertise_alignment * 0.3 +
            uncertainty_specialty_score * 0.25 +
            performance_score * 0.2 +
            availability_score * 0.15 +
            quantum_enhancement * 0.1
        )
        
        # Priority score (confidence weighted by availability and performance)
        priority_score = overall_confidence * availability_score * performance_score
        
        # Recommended collaboration strategy
        recommended_strategy = self._recommend_collaboration_strategy(
            expert_profile, uncertainty_analysis, overall_confidence
        )
        
        # Match rationale
        rationale = {
            "expertise_domains_matched": self._get_matched_domains(expert_profile, uncertainty_analysis),
            "uncertainty_specialties_matched": self._get_matched_specialties(expert_profile, uncertainty_analysis),
            "performance_indicators": {
                "collaboration_effectiveness": expert_profile.collaboration_effectiveness,
                "response_time": expert_profile.response_time_avg,
                "quantum_score": expert_profile.quantum_collaboration_score
            },
            "availability_factors": {
                "current_workload": expert_profile.current_workload,
                "max_capacity": expert_profile.max_concurrent_sessions,
                "availability_score": availability_score
            },
            "quantum_insights": quantum_insights.get("expert_specific", {})
        }
        
        return {
            "overall_confidence": overall_confidence,
            "expertise_alignment": expertise_alignment,
            "uncertainty_specialty_score": uncertainty_specialty_score,
            "availability_score": availability_score,
            "performance_score": performance_score,
            "quantum_enhancement": quantum_enhancement,
            "estimated_resolution_time": estimated_resolution_time,
            "priority_score": priority_score,
            "recommended_strategy": recommended_strategy,
            "rationale": rationale
        }
    
    def _calculate_expertise_alignment(
        self,
        expert_profile: ExpertProfile,
        uncertainty_analysis: UncertaintyAnalysis,
        context: Dict[str, Any]
    ) -> float:
        """Calculate how well expert expertise aligns with uncertainty domain."""
        
        # Get domain from context or uncertainty sources
        required_domains = context.get("domains", [])
        
        # Extract domains from uncertainty sources
        for source in uncertainty_analysis.uncertainty_sources:
            if hasattr(source, 'domain') and source.domain:
                required_domains.append(source.domain)
        
        if not required_domains:
            required_domains = ["general"]
        
        # Calculate alignment score
        alignment_scores = []
        for domain in required_domains:
            if domain in expert_profile.expertise_domains:
                # Use skill level if available
                skill_level = expert_profile.skill_levels.get(domain, 0.7)
                alignment_scores.append(skill_level)
            else:
                # Check for related domains
                related_score = self._calculate_related_domain_score(
                    domain, expert_profile.expertise_domains, expert_profile.skill_levels
                )
                alignment_scores.append(related_score)
        
        # Return average alignment
        return sum(alignment_scores) / len(alignment_scores) if alignment_scores else 0.0
    
    def _calculate_uncertainty_specialty_score(
        self,
        expert_profile: ExpertProfile,
        uncertainty_analysis: UncertaintyAnalysis
    ) -> float:
        """Calculate expert's specialty in handling specific uncertainty types."""
        
        # Get uncertainty types from analysis
        uncertainty_breakdown = uncertainty_analysis.uncertainty_breakdown
        
        specialty_scores = []
        for uncertainty_type, level in uncertainty_breakdown.items():
            if uncertainty_type in expert_profile.uncertainty_specialties:
                # Expert has specialty in this uncertainty type
                specialty_scores.append(1.0 * level)  # Weight by uncertainty level
            else:
                # Expert doesn't specialize in this type
                specialty_scores.append(0.3 * level)  # Lower score
        
        # Return weighted average
        total_uncertainty = sum(uncertainty_breakdown.values())
        if total_uncertainty > 0:
            return sum(specialty_scores) / total_uncertainty
        else:
            return 0.5  # Default score
    
    def _calculate_availability_score(
        self,
        expert_profile: ExpertProfile,
        context: Dict[str, Any]
    ) -> float:
        """Calculate expert availability score."""
        
        # Workload factor
        workload_factor = 1.0 - (expert_profile.current_workload / expert_profile.max_concurrent_sessions)
        
        # Response time factor (faster response = higher score)
        response_time_factor = max(0.1, 1.0 - (expert_profile.response_time_avg / 120.0))  # 2 hours max
        
        # Time zone alignment (if specified in context)
        timezone_factor = 1.0  # Default
        if "preferred_timezone" in context:
            # Simple timezone alignment calculation
            timezone_factor = 0.8 if expert_profile.timezone != context["preferred_timezone"] else 1.0
        
        # Urgency factor
        urgency = context.get("urgency", "medium")
        urgency_factor = {
            "low": 0.8,
            "medium": 1.0,
            "high": 1.2,
            "critical": 1.5
        }.get(urgency, 1.0)
        
        availability_score = (
            workload_factor * 0.4 +
            response_time_factor * 0.3 +
            timezone_factor * 0.2 +
            min(1.0, urgency_factor * 0.1)
        )
        
        return max(0.0, min(1.0, availability_score))
    
    def _calculate_performance_score(self, expert_profile: ExpertProfile) -> float:
        """Calculate expert performance score."""
        
        performance = self.expert_performance_history.get(expert_profile.expert_id, {})
        
        # Collaboration effectiveness
        effectiveness = performance.get("uncertainty_reduction_effectiveness", expert_profile.collaboration_effectiveness)
        
        # Collaboration satisfaction
        satisfaction = performance.get("collaboration_satisfaction", 0.5)
        
        # Session completion rate (implied from having performance data)
        completion_rate = 1.0 if performance.get("sessions_completed", 0) > 0 else 0.5
        
        # Quantum utilization bonus
        quantum_bonus = performance.get("quantum_enhancement_utilization", 0.0) * 0.1
        
        performance_score = (
            effectiveness * 0.5 +
            satisfaction * 0.3 +
            completion_rate * 0.2 +
            quantum_bonus
        )
        
        return max(0.0, min(1.0, performance_score))
    
    def _calculate_quantum_enhancement_score(
        self,
        expert_profile: ExpertProfile,
        quantum_insights: Dict[str, Any]
    ) -> float:
        """Calculate quantum enhancement score for expert matching."""
        
        # Expert's quantum collaboration score
        expert_quantum_score = expert_profile.quantum_collaboration_score
        
        # Quantum insights relevance
        quantum_relevance = quantum_insights.get("relevance_score", 0.5)
        
        # Quantum advantage potential
        quantum_advantage = quantum_insights.get("quantum_advantage", 0.0)
        
        # Expert's quantum utilization history
        performance = self.expert_performance_history.get(expert_profile.expert_id, {})
        quantum_utilization = performance.get("quantum_enhancement_utilization", 0.0)
        
        quantum_enhancement_score = (
            expert_quantum_score * 0.4 +
            quantum_relevance * 0.3 +
            quantum_advantage * 0.2 +
            quantum_utilization * 0.1
        )
        
        return max(0.0, min(1.0, quantum_enhancement_score))
    
    def _estimate_resolution_time(
        self,
        expert_profile: ExpertProfile,
        uncertainty_analysis: UncertaintyAnalysis,
        context: Dict[str, Any]
    ) -> float:
        """Estimate time to resolve uncertainty with this expert."""
        
        # Base time from expert's average
        base_time = expert_profile.response_time_avg
        
        # Complexity factor based on uncertainty level
        complexity_factor = 1.0 + uncertainty_analysis.overall_uncertainty
        
        # Domain familiarity factor
        domain_familiarity = self._calculate_expertise_alignment(
            expert_profile, uncertainty_analysis, context
        )
        familiarity_factor = 2.0 - domain_familiarity  # Higher familiarity = lower time
        
        # Urgency factor
        urgency = context.get("urgency", "medium")
        urgency_factor = {
            "low": 1.2,
            "medium": 1.0,
            "high": 0.8,
            "critical": 0.6
        }.get(urgency, 1.0)
        
        estimated_time = base_time * complexity_factor * familiarity_factor * urgency_factor
        
        return max(5.0, estimated_time)  # Minimum 5 minutes
    
    def _recommend_collaboration_strategy(
        self,
        expert_profile: ExpertProfile,
        uncertainty_analysis: UncertaintyAnalysis,
        confidence: float
    ) -> str:
        """Recommend collaboration strategy for this expert."""
        
        # Use expert's preferred style as base
        preferred_style = expert_profile.preferred_interaction_style
        
        # Adjust based on uncertainty level and confidence
        if uncertainty_analysis.overall_uncertainty > 0.8:
            return "progressive"  # High uncertainty needs progressive approach
        elif confidence > 0.8:
            return "direct"  # High confidence allows direct approach
        elif uncertainty_analysis.overall_uncertainty < 0.3:
            return "contextual"  # Low uncertainty needs context
        else:
            return preferred_style  # Use expert's preference
    
    def _get_quantum_insights_for_matching(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get quantum insights for expert matching."""
        
        try:
            if not is_feature_enabled(FeatureFlag.QUANTUM_UNCERTAINTY):
                return {"quantum_enabled": False}
            
            # Get quantum insights from integration
            quantum_insights = self.quantum_integration.generate_quantum_insights(
                {"analysis_type": "expert_matching", **context}
            )
            
            return {
                "quantum_enabled": True,
                "relevance_score": 0.7,  # Default relevance
                "quantum_advantage": quantum_insights.get("quantum_advantage_summary", {}).get("overall", 0.0),
                "expert_specific": quantum_insights
            }
            
        except Exception as e:
            self.logger.error(f"Error getting quantum insights for matching: {e}")
            return {"quantum_enabled": False, "error": str(e)}
    
    # Additional helper methods would continue here...
    # (Implementation continues with collaboration strategy selection,
    # session management, performance tracking, etc.)

# Global expert matching system instance
_expert_matching_system = None

def get_expert_matching_system() -> ExpertMatchingSystem:
    """Get the global Expert Matching System instance."""
    global _expert_matching_system
    if _expert_matching_system is None:
        _expert_matching_system = ExpertMatchingSystem()
    return _expert_matching_system

# Convenience functions for external use
def find_expert_matches(uncertainty_analysis: UncertaintyAnalysis, context: Dict[str, Any] = None, max_matches: int = 5) -> List[ExpertMatch]:
    """Find expert matches for uncertainty resolution."""
    system = get_expert_matching_system()
    return system.find_expert_matches(uncertainty_analysis, context, max_matches)

def create_hitl_session(uncertainty_analysis: UncertaintyAnalysis, expert_matches: List[ExpertMatch], context: Dict[str, Any] = None) -> HITLSession:
    """Create a new HITL collaboration session."""
    system = get_expert_matching_system()
    return system.create_hitl_session(uncertainty_analysis, expert_matches, context)

