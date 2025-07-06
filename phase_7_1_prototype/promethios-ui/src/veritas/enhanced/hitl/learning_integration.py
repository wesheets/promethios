"""
Enhanced Veritas 2 Learning Integration System

Advanced learning system that continuously improves HITL collaboration through
pattern recognition, success analysis, and adaptive optimization. Learns from
human expert interactions to enhance future uncertainty resolution.

Key Capabilities:
- Pattern Recognition - Identify successful collaboration patterns
- Success Analysis - Analyze what makes HITL sessions effective
- Adaptive Optimization - Continuously improve strategies and approaches
- Expert Learning - Learn from individual expert preferences and effectiveness
- Quantum Learning - Incorporate quantum insights into learning processes
"""

import logging
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import uuid
import asyncio
from dataclasses import dataclass, asdict
import math
import numpy as np
from collections import defaultdict

# Import bridge services
from ..bridges.enhanced_veritas_bridge import get_enhanced_veritas_bridge
from ..bridges.unified_config import get_config, is_feature_enabled, FeatureFlag

# Import uncertainty analysis
from ..uncertaintyEngine import UncertaintyAnalysisEngine
from ..types import UncertaintyAnalysis, UncertaintySource

# Import quantum integration
from ..quantum.quantum_integration import get_quantum_integration

# Import HITL components
from .expert_matching_system import get_expert_matching_system, ExpertProfile, HITLSession
from .progressive_clarification_engine import get_progressive_clarification_engine, ClarificationWorkflow
from .context_aware_engagement import get_context_aware_engagement, EngagementStrategy

logger = logging.getLogger(__name__)

@dataclass
class LearningPattern:
    """Identified learning pattern from successful HITL sessions."""
    pattern_id: str
    pattern_name: str
    pattern_type: str  # strategy, question, engagement, expert_matching
    pattern_context: Dict[str, Any]  # Context where pattern is effective
    pattern_elements: Dict[str, Any]  # Elements that make up the pattern
    success_indicators: Dict[str, Any]  # What indicates success for this pattern
    effectiveness_score: float  # How effective this pattern is
    confidence_level: float  # Confidence in pattern validity
    usage_count: int  # How many times pattern has been applied
    quantum_insights: Dict[str, Any]  # Quantum-enhanced pattern insights
    created_timestamp: str
    last_updated: str

@dataclass
class ExpertLearningProfile:
    """Learning profile for individual experts."""
    expert_id: str
    learning_insights: Dict[str, Any]  # Insights about expert effectiveness
    preferred_patterns: List[str]  # Pattern IDs that work well with this expert
    collaboration_preferences: Dict[str, Any]  # Learned collaboration preferences
    effectiveness_trends: List[Dict[str, Any]]  # Historical effectiveness trends
    uncertainty_specialization: Dict[str, float]  # Learned uncertainty specializations
    quantum_collaboration_insights: Dict[str, Any]  # Quantum-enhanced insights
    learning_confidence: float  # Confidence in learned insights
    last_updated: str

@dataclass
class SessionLearningData:
    """Learning data extracted from HITL session."""
    session_id: str
    uncertainty_reduction: float
    expert_effectiveness: float
    strategy_effectiveness: float
    question_effectiveness: Dict[str, float]  # question_id -> effectiveness
    engagement_effectiveness: float
    quantum_utilization: float
    success_factors: List[str]  # Factors that contributed to success
    failure_factors: List[str]  # Factors that hindered success
    learned_insights: Dict[str, Any]  # Key insights from session
    pattern_matches: List[str]  # Patterns that were applied
    pattern_effectiveness: Dict[str, float]  # pattern_id -> effectiveness
    session_timestamp: str

class LearningIntegrationSystem:
    """
    Advanced learning system for continuous HITL improvement.
    
    Learns from every HITL session to:
    - Identify successful collaboration patterns
    - Optimize expert matching algorithms
    - Improve engagement strategies
    - Enhance question generation
    - Adapt to expert preferences
    - Incorporate quantum insights
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.bridge = get_enhanced_veritas_bridge()
        self.quantum_integration = get_quantum_integration()
        self.expert_matching = get_expert_matching_system()
        self.clarification_engine = get_progressive_clarification_engine()
        self.engagement_system = get_context_aware_engagement()
        self.config = get_config()
        
        # Learning data storage
        self.learning_patterns = {}  # pattern_id -> LearningPattern
        self.expert_learning_profiles = {}  # expert_id -> ExpertLearningProfile
        self.session_learning_data = {}  # session_id -> SessionLearningData
        
        # Pattern categorization
        self.strategy_patterns = defaultdict(list)  # strategy_type -> [pattern_ids]
        self.domain_patterns = defaultdict(list)  # domain -> [pattern_ids]
        self.uncertainty_patterns = defaultdict(list)  # uncertainty_type -> [pattern_ids]
        
        # Learning algorithms
        self.pattern_recognition_threshold = 0.7
        self.learning_confidence_threshold = 0.6
        self.pattern_usage_threshold = 3  # Minimum usage before considering pattern valid
        
        self.logger.info("Learning Integration System initialized")
    
    def extract_session_learning(
        self,
        hitl_session: HITLSession,
        clarification_workflow: ClarificationWorkflow,
        engagement_strategy: EngagementStrategy,
        session_metrics: Dict[str, Any]
    ) -> SessionLearningData:
        """
        Extract learning data from completed HITL session.
        
        Args:
            hitl_session: Completed HITL session
            clarification_workflow: Clarification workflow used
            engagement_strategy: Engagement strategy used
            session_metrics: Session performance metrics
            
        Returns:
            Extracted learning data
        """
        self.logger.info(f"Extracting learning data from session: {hitl_session.session_id}")
        
        try:
            # Calculate uncertainty reduction
            initial_uncertainty = hitl_session.uncertainty_reduction_progress[0][1]
            final_uncertainty = hitl_session.uncertainty_reduction_progress[-1][1]
            uncertainty_reduction = (initial_uncertainty - final_uncertainty) / initial_uncertainty
            
            # Calculate expert effectiveness
            expert_effectiveness = session_metrics.get("expert_effectiveness", 0.5)
            
            # Calculate strategy effectiveness
            strategy_effectiveness = session_metrics.get("strategy_effectiveness", 0.5)
            
            # Calculate question effectiveness
            question_effectiveness = {}
            for interaction in hitl_session.interaction_history:
                if "question_id" in interaction and "effectiveness" in interaction:
                    question_effectiveness[interaction["question_id"]] = interaction["effectiveness"]
            
            # Calculate engagement effectiveness
            engagement_effectiveness = session_metrics.get("engagement_effectiveness", 0.5)
            
            # Calculate quantum utilization
            quantum_utilization = session_metrics.get("quantum_utilization", 0.0)
            
            # Identify success factors
            success_factors = self._identify_success_factors(
                hitl_session, clarification_workflow, engagement_strategy, session_metrics
            )
            
            # Identify failure factors
            failure_factors = self._identify_failure_factors(
                hitl_session, clarification_workflow, engagement_strategy, session_metrics
            )
            
            # Extract learned insights
            learned_insights = self._extract_learned_insights(
                hitl_session, clarification_workflow, engagement_strategy, session_metrics
            )
            
            # Identify pattern matches
            pattern_matches = self._identify_pattern_matches(
                hitl_session, clarification_workflow, engagement_strategy
            )
            
            # Calculate pattern effectiveness
            pattern_effectiveness = self._calculate_pattern_effectiveness(
                pattern_matches, session_metrics
            )
            
            session_learning = SessionLearningData(
                session_id=hitl_session.session_id,
                uncertainty_reduction=uncertainty_reduction,
                expert_effectiveness=expert_effectiveness,
                strategy_effectiveness=strategy_effectiveness,
                question_effectiveness=question_effectiveness,
                engagement_effectiveness=engagement_effectiveness,
                quantum_utilization=quantum_utilization,
                success_factors=success_factors,
                failure_factors=failure_factors,
                learned_insights=learned_insights,
                pattern_matches=pattern_matches,
                pattern_effectiveness=pattern_effectiveness,
                session_timestamp=datetime.utcnow().isoformat()
            )
            
            # Store learning data
            self.session_learning_data[hitl_session.session_id] = session_learning
            
            self.logger.info(f"Learning data extracted for session: {hitl_session.session_id}")
            return session_learning
            
        except Exception as e:
            self.logger.error(f"Error extracting session learning: {e}")
            return None
    
    def identify_learning_patterns(
        self,
        min_sessions: int = 5,
        min_effectiveness: float = 0.7
    ) -> List[LearningPattern]:
        """
        Identify new learning patterns from session data.
        
        Args:
            min_sessions: Minimum sessions required to identify pattern
            min_effectiveness: Minimum effectiveness threshold for patterns
            
        Returns:
            List of newly identified learning patterns
        """
        self.logger.info("Identifying new learning patterns")
        
        try:
            new_patterns = []
            
            # Get successful sessions
            successful_sessions = [
                session for session in self.session_learning_data.values()
                if session.uncertainty_reduction >= min_effectiveness
            ]
            
            if len(successful_sessions) < min_sessions:
                self.logger.info(f"Insufficient successful sessions ({len(successful_sessions)}) for pattern identification")
                return new_patterns
            
            # Identify strategy patterns
            strategy_patterns = self._identify_strategy_patterns(successful_sessions)
            new_patterns.extend(strategy_patterns)
            
            # Identify question patterns
            question_patterns = self._identify_question_patterns(successful_sessions)
            new_patterns.extend(question_patterns)
            
            # Identify engagement patterns
            engagement_patterns = self._identify_engagement_patterns(successful_sessions)
            new_patterns.extend(engagement_patterns)
            
            # Identify expert matching patterns
            expert_patterns = self._identify_expert_matching_patterns(successful_sessions)
            new_patterns.extend(expert_patterns)
            
            # Identify quantum patterns if available
            if is_feature_enabled(FeatureFlag.QUANTUM_UNCERTAINTY):
                quantum_patterns = self._identify_quantum_patterns(successful_sessions)
                new_patterns.extend(quantum_patterns)
            
            # Validate and store patterns
            validated_patterns = []
            for pattern in new_patterns:
                if self._validate_learning_pattern(pattern):
                    self.learning_patterns[pattern.pattern_id] = pattern
                    self._categorize_pattern(pattern)
                    validated_patterns.append(pattern)
            
            self.logger.info(f"Identified {len(validated_patterns)} new learning patterns")
            return validated_patterns
            
        except Exception as e:
            self.logger.error(f"Error identifying learning patterns: {e}")
            return []
    
    def update_expert_learning_profile(
        self,
        expert_id: str,
        session_learning: SessionLearningData
    ) -> ExpertLearningProfile:
        """
        Update expert learning profile based on session data.
        
        Args:
            expert_id: ID of the expert
            session_learning: Learning data from session
            
        Returns:
            Updated expert learning profile
        """
        self.logger.info(f"Updating expert learning profile: {expert_id}")
        
        try:
            # Get or create expert learning profile
            if expert_id not in self.expert_learning_profiles:
                self.expert_learning_profiles[expert_id] = ExpertLearningProfile(
                    expert_id=expert_id,
                    learning_insights={},
                    preferred_patterns=[],
                    collaboration_preferences={},
                    effectiveness_trends=[],
                    uncertainty_specialization={},
                    quantum_collaboration_insights={},
                    learning_confidence=0.5,
                    last_updated=datetime.utcnow().isoformat()
                )
            
            profile = self.expert_learning_profiles[expert_id]
            
            # Update learning insights
            self._update_expert_insights(profile, session_learning)
            
            # Update preferred patterns
            self._update_preferred_patterns(profile, session_learning)
            
            # Update collaboration preferences
            self._update_collaboration_preferences(profile, session_learning)
            
            # Update effectiveness trends
            self._update_effectiveness_trends(profile, session_learning)
            
            # Update uncertainty specialization
            self._update_uncertainty_specialization(profile, session_learning)
            
            # Update quantum collaboration insights
            if is_feature_enabled(FeatureFlag.QUANTUM_UNCERTAINTY):
                self._update_quantum_insights(profile, session_learning)
            
            # Update learning confidence
            profile.learning_confidence = self._calculate_learning_confidence(profile)
            profile.last_updated = datetime.utcnow().isoformat()
            
            self.logger.info(f"Expert learning profile updated: {expert_id}")
            return profile
            
        except Exception as e:
            self.logger.error(f"Error updating expert learning profile: {e}")
            return self.expert_learning_profiles.get(expert_id)
    
    def get_learning_recommendations(
        self,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Get learning-based recommendations for HITL optimization.
        
        Args:
            context: Context for recommendations
            
        Returns:
            Learning-based recommendations
        """
        self.logger.info("Generating learning-based recommendations")
        
        try:
            recommendations = {
                "strategy_recommendations": [],
                "expert_matching_recommendations": [],
                "engagement_recommendations": [],
                "question_recommendations": [],
                "quantum_recommendations": [],
                "general_recommendations": [],
                "confidence_level": 0.0,
                "recommendations_timestamp": datetime.utcnow().isoformat()
            }
            
            # Get strategy recommendations
            strategy_recs = self._get_strategy_recommendations(context)
            recommendations["strategy_recommendations"] = strategy_recs
            
            # Get expert matching recommendations
            expert_recs = self._get_expert_matching_recommendations(context)
            recommendations["expert_matching_recommendations"] = expert_recs
            
            # Get engagement recommendations
            engagement_recs = self._get_engagement_recommendations(context)
            recommendations["engagement_recommendations"] = engagement_recs
            
            # Get question recommendations
            question_recs = self._get_question_recommendations(context)
            recommendations["question_recommendations"] = question_recs
            
            # Get quantum recommendations
            if is_feature_enabled(FeatureFlag.QUANTUM_UNCERTAINTY):
                quantum_recs = self._get_quantum_recommendations(context)
                recommendations["quantum_recommendations"] = quantum_recs
            
            # Get general recommendations
            general_recs = self._get_general_recommendations(context)
            recommendations["general_recommendations"] = general_recs
            
            # Calculate overall confidence
            recommendations["confidence_level"] = self._calculate_recommendation_confidence(
                recommendations
            )
            
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Error generating learning recommendations: {e}")
            return {"error": str(e)}
    
    def optimize_hitl_components(
        self,
        optimization_target: str = "uncertainty_reduction"
    ) -> Dict[str, Any]:
        """
        Optimize HITL components based on learning insights.
        
        Args:
            optimization_target: Target metric for optimization
            
        Returns:
            Optimization results and recommendations
        """
        self.logger.info(f"Optimizing HITL components for: {optimization_target}")
        
        try:
            optimization_results = {
                "optimization_target": optimization_target,
                "component_optimizations": {},
                "performance_improvements": {},
                "implementation_recommendations": [],
                "optimization_confidence": 0.0,
                "optimization_timestamp": datetime.utcnow().isoformat()
            }
            
            # Optimize expert matching
            expert_optimization = self._optimize_expert_matching(optimization_target)
            optimization_results["component_optimizations"]["expert_matching"] = expert_optimization
            
            # Optimize engagement strategies
            engagement_optimization = self._optimize_engagement_strategies(optimization_target)
            optimization_results["component_optimizations"]["engagement_strategies"] = engagement_optimization
            
            # Optimize clarification workflows
            workflow_optimization = self._optimize_clarification_workflows(optimization_target)
            optimization_results["component_optimizations"]["clarification_workflows"] = workflow_optimization
            
            # Optimize question generation
            question_optimization = self._optimize_question_generation(optimization_target)
            optimization_results["component_optimizations"]["question_generation"] = question_optimization
            
            # Calculate performance improvements
            optimization_results["performance_improvements"] = self._calculate_performance_improvements(
                optimization_results["component_optimizations"]
            )
            
            # Generate implementation recommendations
            optimization_results["implementation_recommendations"] = self._generate_implementation_recommendations(
                optimization_results["component_optimizations"]
            )
            
            # Calculate optimization confidence
            optimization_results["optimization_confidence"] = self._calculate_optimization_confidence(
                optimization_results
            )
            
            return optimization_results
            
        except Exception as e:
            self.logger.error(f"Error optimizing HITL components: {e}")
            return {"error": str(e)}
    
    def _identify_success_factors(
        self,
        hitl_session: HITLSession,
        clarification_workflow: ClarificationWorkflow,
        engagement_strategy: EngagementStrategy,
        session_metrics: Dict[str, Any]
    ) -> List[str]:
        """Identify factors that contributed to session success."""
        
        success_factors = []
        
        # High uncertainty reduction
        if session_metrics.get("uncertainty_reduction", 0.0) > 0.7:
            success_factors.append("high_uncertainty_reduction")
        
        # Effective expert matching
        if session_metrics.get("expert_effectiveness", 0.0) > 0.8:
            success_factors.append("effective_expert_matching")
        
        # Good engagement strategy
        if session_metrics.get("engagement_effectiveness", 0.0) > 0.7:
            success_factors.append("effective_engagement_strategy")
        
        # Efficient workflow
        if clarification_workflow.overall_progress >= 0.9:
            success_factors.append("efficient_workflow_completion")
        
        # High expert satisfaction
        if session_metrics.get("expert_satisfaction", 0.0) > 0.8:
            success_factors.append("high_expert_satisfaction")
        
        # Quantum enhancement utilization
        if session_metrics.get("quantum_utilization", 0.0) > 0.5:
            success_factors.append("quantum_enhancement_utilization")
        
        return success_factors
    
    def _identify_failure_factors(
        self,
        hitl_session: HITLSession,
        clarification_workflow: ClarificationWorkflow,
        engagement_strategy: EngagementStrategy,
        session_metrics: Dict[str, Any]
    ) -> List[str]:
        """Identify factors that hindered session success."""
        
        failure_factors = []
        
        # Low uncertainty reduction
        if session_metrics.get("uncertainty_reduction", 0.0) < 0.3:
            failure_factors.append("low_uncertainty_reduction")
        
        # Poor expert matching
        if session_metrics.get("expert_effectiveness", 0.0) < 0.4:
            failure_factors.append("poor_expert_matching")
        
        # Ineffective engagement
        if session_metrics.get("engagement_effectiveness", 0.0) < 0.4:
            failure_factors.append("ineffective_engagement_strategy")
        
        # Incomplete workflow
        if clarification_workflow.overall_progress < 0.5:
            failure_factors.append("incomplete_workflow")
        
        # Low expert satisfaction
        if session_metrics.get("expert_satisfaction", 0.0) < 0.4:
            failure_factors.append("low_expert_satisfaction")
        
        # Long resolution time
        if session_metrics.get("resolution_time_minutes", 0.0) > 120:
            failure_factors.append("excessive_resolution_time")
        
        return failure_factors
    
    def _extract_learned_insights(
        self,
        hitl_session: HITLSession,
        clarification_workflow: ClarificationWorkflow,
        engagement_strategy: EngagementStrategy,
        session_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract key insights from session."""
        
        insights = {}
        
        # Strategy insights
        insights["strategy_effectiveness"] = {
            "strategy_name": engagement_strategy.strategy_name,
            "domain_match": engagement_strategy.domain == hitl_session.session_context.get("domain", "general"),
            "effectiveness_score": session_metrics.get("strategy_effectiveness", 0.5)
        }
        
        # Expert insights
        insights["expert_performance"] = {
            "expert_id": hitl_session.active_expert,
            "response_time": session_metrics.get("expert_response_time", 0.0),
            "effectiveness": session_metrics.get("expert_effectiveness", 0.5),
            "satisfaction": session_metrics.get("expert_satisfaction", 0.5)
        }
        
        # Workflow insights
        insights["workflow_performance"] = {
            "completion_rate": clarification_workflow.overall_progress,
            "stages_completed": clarification_workflow.workflow_metrics.get("stages_completed", 0),
            "questions_asked": clarification_workflow.workflow_metrics.get("questions_asked", 0),
            "information_gained": clarification_workflow.workflow_metrics.get("information_gained", 0.0)
        }
        
        # Uncertainty insights
        insights["uncertainty_resolution"] = {
            "initial_uncertainty": hitl_session.uncertainty_reduction_progress[0][1],
            "final_uncertainty": hitl_session.uncertainty_reduction_progress[-1][1],
            "reduction_rate": session_metrics.get("uncertainty_reduction", 0.0),
            "target_achieved": session_metrics.get("target_achieved", False)
        }
        
        return insights
    
    # Additional helper methods would continue here...
    # (Implementation continues with pattern identification algorithms,
    # optimization methods, recommendation generation, etc.)

# Global learning integration system instance
_learning_integration = None

def get_learning_integration() -> LearningIntegrationSystem:
    """Get the global Learning Integration System instance."""
    global _learning_integration
    if _learning_integration is None:
        _learning_integration = LearningIntegrationSystem()
    return _learning_integration

# Convenience functions for external use
def extract_session_learning(hitl_session: HITLSession, clarification_workflow: ClarificationWorkflow, engagement_strategy: EngagementStrategy, session_metrics: Dict[str, Any]) -> SessionLearningData:
    """Extract learning data from completed HITL session."""
    system = get_learning_integration()
    return system.extract_session_learning(hitl_session, clarification_workflow, engagement_strategy, session_metrics)

def get_learning_recommendations(context: Dict[str, Any]) -> Dict[str, Any]:
    """Get learning-based recommendations for HITL optimization."""
    system = get_learning_integration()
    return system.get_learning_recommendations(context)

