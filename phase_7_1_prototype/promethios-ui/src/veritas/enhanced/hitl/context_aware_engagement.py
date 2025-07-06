"""
Enhanced Veritas 2 Context-Aware Engagement System

Advanced engagement system that adapts human-AI collaboration strategies based on
domain context, expert expertise, uncertainty characteristics, and quantum insights.
Provides personalized and optimized engagement for maximum uncertainty resolution.

Key Capabilities:
- Domain-Specific Strategies - Tailored approaches for different domains
- Expert Adaptation - Personalized engagement based on expert profiles
- Uncertainty-Driven Adaptation - Strategies adapted to uncertainty characteristics
- Quantum-Enhanced Engagement - Quantum insights for optimal collaboration
- Learning-Based Optimization - Continuous improvement from successful patterns
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

# Import expert matching and clarification
from .expert_matching_system import get_expert_matching_system, ExpertProfile, HITLSession
from .progressive_clarification_engine import get_progressive_clarification_engine, ClarificationWorkflow

logger = logging.getLogger(__name__)

@dataclass
class EngagementStrategy:
    """Context-aware engagement strategy definition."""
    strategy_id: str
    strategy_name: str
    domain: str  # technical, medical, financial, legal, general
    uncertainty_profile: Dict[str, float]  # Uncertainty characteristics this strategy handles
    expert_profile_match: Dict[str, Any]  # Expert characteristics this strategy works with
    engagement_approach: str  # collaborative, directive, exploratory, analytical
    communication_style: str  # formal, conversational, technical, empathetic
    question_patterns: List[str]  # Question patterns for this strategy
    interaction_flow: List[Dict[str, Any]]  # Interaction flow steps
    success_indicators: Dict[str, Any]  # Indicators of successful engagement
    quantum_enhancements: Dict[str, Any]  # Quantum-specific enhancements
    effectiveness_score: float  # Historical effectiveness
    created_timestamp: str

@dataclass
class EngagementContext:
    """Context for engagement strategy selection and adaptation."""
    context_id: str
    domain: str
    uncertainty_analysis: UncertaintyAnalysis
    expert_profile: ExpertProfile
    session_context: Dict[str, Any]
    quantum_insights: Dict[str, Any]
    urgency_level: str  # low, medium, high, critical
    complexity_level: str  # simple, moderate, complex, highly_complex
    stakeholder_context: Dict[str, Any]  # Information about stakeholders
    cultural_context: Dict[str, Any]  # Cultural considerations
    regulatory_context: Dict[str, Any]  # Regulatory/compliance considerations
    created_timestamp: str

@dataclass
class EngagementAdaptation:
    """Real-time adaptation of engagement strategy."""
    adaptation_id: str
    original_strategy: EngagementStrategy
    adapted_strategy: EngagementStrategy
    adaptation_triggers: List[str]  # What triggered the adaptation
    adaptation_rationale: Dict[str, Any]  # Why adaptation was made
    effectiveness_prediction: float  # Predicted effectiveness of adaptation
    quantum_enhancement: Dict[str, Any]  # Quantum insights for adaptation
    adaptation_timestamp: str

class ContextAwareEngagementSystem:
    """
    Advanced system for context-aware human-AI engagement.
    
    Adapts engagement strategies based on:
    - Domain expertise requirements
    - Expert personality and preferences
    - Uncertainty characteristics
    - Cultural and regulatory context
    - Quantum uncertainty insights
    - Real-time collaboration effectiveness
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.bridge = get_enhanced_veritas_bridge()
        self.quantum_integration = get_quantum_integration()
        self.expert_matching = get_expert_matching_system()
        self.clarification_engine = get_progressive_clarification_engine()
        self.config = get_config()
        
        # Strategy management
        self.engagement_strategies = {}  # strategy_id -> EngagementStrategy
        self.domain_strategies = {}  # domain -> List[strategy_id]
        self.active_engagements = {}  # session_id -> current engagement context
        
        # Learning and adaptation
        self.strategy_effectiveness = {}  # strategy_id -> effectiveness metrics
        self.adaptation_patterns = {}  # Pattern learning from successful adaptations
        self.cultural_adaptations = {}  # Cultural context adaptations
        
        # Initialize engagement strategies
        self._initialize_engagement_strategies()
        
        self.logger.info("Context-Aware Engagement System initialized")
    
    def select_engagement_strategy(
        self,
        engagement_context: EngagementContext
    ) -> EngagementStrategy:
        """
        Select optimal engagement strategy based on context.
        
        Args:
            engagement_context: Context for engagement strategy selection
            
        Returns:
            Selected engagement strategy
        """
        self.logger.info(f"Selecting engagement strategy for domain: {engagement_context.domain}")
        
        try:
            # Get candidate strategies for domain
            candidate_strategies = self._get_candidate_strategies(engagement_context)
            
            if not candidate_strategies:
                self.logger.warning(f"No strategies found for domain: {engagement_context.domain}")
                return self._get_default_strategy()
            
            # Score each candidate strategy
            strategy_scores = []
            for strategy in candidate_strategies:
                score = self._score_strategy_for_context(strategy, engagement_context)
                strategy_scores.append((strategy, score))
            
            # Sort by score and select best
            strategy_scores.sort(key=lambda x: x[1], reverse=True)
            selected_strategy = strategy_scores[0][0]
            
            # Apply quantum enhancements if available
            if is_feature_enabled(FeatureFlag.QUANTUM_UNCERTAINTY):
                selected_strategy = self._apply_quantum_enhancements(
                    selected_strategy, engagement_context
                )
            
            # Apply cultural adaptations
            selected_strategy = self._apply_cultural_adaptations(
                selected_strategy, engagement_context
            )
            
            self.logger.info(f"Selected engagement strategy: {selected_strategy.strategy_name}")
            return selected_strategy
            
        except Exception as e:
            self.logger.error(f"Error selecting engagement strategy: {e}")
            return self._get_default_strategy()
    
    def adapt_engagement_strategy(
        self,
        session_id: str,
        current_strategy: EngagementStrategy,
        adaptation_triggers: List[str],
        context_updates: Dict[str, Any] = None
    ) -> EngagementAdaptation:
        """
        Adapt engagement strategy based on real-time feedback.
        
        Args:
            session_id: ID of the HITL session
            current_strategy: Current engagement strategy
            adaptation_triggers: Triggers that prompted adaptation
            context_updates: Updates to engagement context
            
        Returns:
            Engagement strategy adaptation
        """
        self.logger.info(f"Adapting engagement strategy for session: {session_id}")
        
        try:
            # Get current engagement context
            engagement_context = self.active_engagements.get(session_id)
            if not engagement_context:
                self.logger.warning(f"No engagement context found for session: {session_id}")
                return None
            
            # Update context if provided
            if context_updates:
                self._update_engagement_context(engagement_context, context_updates)
            
            # Analyze adaptation needs
            adaptation_needs = self._analyze_adaptation_needs(
                current_strategy, engagement_context, adaptation_triggers
            )
            
            # Generate adapted strategy
            adapted_strategy = self._generate_adapted_strategy(
                current_strategy, adaptation_needs, engagement_context
            )
            
            # Predict effectiveness of adaptation
            effectiveness_prediction = self._predict_adaptation_effectiveness(
                current_strategy, adapted_strategy, engagement_context
            )
            
            # Get quantum enhancement for adaptation
            quantum_enhancement = self._get_quantum_enhancement_for_adaptation(
                current_strategy, adapted_strategy, engagement_context
            )
            
            # Create adaptation record
            adaptation = EngagementAdaptation(
                adaptation_id=str(uuid.uuid4()),
                original_strategy=current_strategy,
                adapted_strategy=adapted_strategy,
                adaptation_triggers=adaptation_triggers,
                adaptation_rationale=adaptation_needs,
                effectiveness_prediction=effectiveness_prediction,
                quantum_enhancement=quantum_enhancement,
                adaptation_timestamp=datetime.utcnow().isoformat()
            )
            
            # Update active engagement
            self.active_engagements[session_id] = engagement_context
            
            self.logger.info(f"Engagement strategy adapted: {adaptation.adaptation_id}")
            return adaptation
            
        except Exception as e:
            self.logger.error(f"Error adapting engagement strategy: {e}")
            return None
    
    def generate_contextual_questions(
        self,
        engagement_strategy: EngagementStrategy,
        engagement_context: EngagementContext,
        uncertainty_focus: str,
        question_count: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Generate contextual questions based on engagement strategy.
        
        Args:
            engagement_strategy: Current engagement strategy
            engagement_context: Engagement context
            uncertainty_focus: Specific uncertainty area to focus on
            question_count: Number of questions to generate
            
        Returns:
            List of contextual questions
        """
        self.logger.info(f"Generating contextual questions for focus: {uncertainty_focus}")
        
        try:
            questions = []
            
            # Get question patterns for strategy
            question_patterns = engagement_strategy.question_patterns
            
            # Generate questions based on domain and strategy
            if engagement_context.domain == "technical":
                questions.extend(self._generate_technical_questions(
                    engagement_strategy, engagement_context, uncertainty_focus
                ))
            elif engagement_context.domain == "medical":
                questions.extend(self._generate_medical_questions(
                    engagement_strategy, engagement_context, uncertainty_focus
                ))
            elif engagement_context.domain == "financial":
                questions.extend(self._generate_financial_questions(
                    engagement_strategy, engagement_context, uncertainty_focus
                ))
            elif engagement_context.domain == "legal":
                questions.extend(self._generate_legal_questions(
                    engagement_strategy, engagement_context, uncertainty_focus
                ))
            else:
                questions.extend(self._generate_general_questions(
                    engagement_strategy, engagement_context, uncertainty_focus
                ))
            
            # Apply communication style adaptations
            questions = self._adapt_questions_for_communication_style(
                questions, engagement_strategy.communication_style
            )
            
            # Apply cultural adaptations
            questions = self._adapt_questions_for_culture(
                questions, engagement_context.cultural_context
            )
            
            # Apply quantum enhancements
            if is_feature_enabled(FeatureFlag.QUANTUM_UNCERTAINTY):
                questions = self._apply_quantum_question_enhancements(
                    questions, engagement_context.quantum_insights
                )
            
            # Limit to requested count
            questions = questions[:question_count]
            
            self.logger.info(f"Generated {len(questions)} contextual questions")
            return questions
            
        except Exception as e:
            self.logger.error(f"Error generating contextual questions: {e}")
            return []
    
    def track_engagement_effectiveness(
        self,
        session_id: str,
        engagement_metrics: Dict[str, Any]
    ) -> None:
        """
        Track engagement effectiveness for learning and optimization.
        
        Args:
            session_id: ID of the HITL session
            engagement_metrics: Metrics about engagement effectiveness
        """
        self.logger.info(f"Tracking engagement effectiveness for session: {session_id}")
        
        try:
            engagement_context = self.active_engagements.get(session_id)
            if not engagement_context:
                self.logger.warning(f"No engagement context found for session: {session_id}")
                return
            
            # Extract key metrics
            uncertainty_reduction = engagement_metrics.get("uncertainty_reduction", 0.0)
            expert_satisfaction = engagement_metrics.get("expert_satisfaction", 0.5)
            collaboration_efficiency = engagement_metrics.get("collaboration_efficiency", 0.5)
            question_effectiveness = engagement_metrics.get("question_effectiveness", 0.5)
            quantum_utilization = engagement_metrics.get("quantum_utilization", 0.0)
            
            # Update strategy effectiveness
            strategy_id = engagement_metrics.get("strategy_id")
            if strategy_id and strategy_id in self.strategy_effectiveness:
                effectiveness = self.strategy_effectiveness[strategy_id]
                
                # Update running averages
                effectiveness["uncertainty_reduction"] = (
                    effectiveness["uncertainty_reduction"] * 0.8 + uncertainty_reduction * 0.2
                )
                effectiveness["expert_satisfaction"] = (
                    effectiveness["expert_satisfaction"] * 0.8 + expert_satisfaction * 0.2
                )
                effectiveness["collaboration_efficiency"] = (
                    effectiveness["collaboration_efficiency"] * 0.8 + collaboration_efficiency * 0.2
                )
                effectiveness["question_effectiveness"] = (
                    effectiveness["question_effectiveness"] * 0.8 + question_effectiveness * 0.2
                )
                effectiveness["quantum_utilization"] = (
                    effectiveness["quantum_utilization"] * 0.8 + quantum_utilization * 0.2
                )
                
                # Update session count
                effectiveness["session_count"] += 1
                
                # Calculate overall effectiveness
                effectiveness["overall_effectiveness"] = (
                    effectiveness["uncertainty_reduction"] * 0.3 +
                    effectiveness["expert_satisfaction"] * 0.25 +
                    effectiveness["collaboration_efficiency"] * 0.25 +
                    effectiveness["question_effectiveness"] * 0.15 +
                    effectiveness["quantum_utilization"] * 0.05
                )
            
            # Learn adaptation patterns
            self._learn_adaptation_patterns(session_id, engagement_metrics)
            
            # Update cultural adaptation patterns
            self._update_cultural_patterns(engagement_context, engagement_metrics)
            
            self.logger.info(f"Engagement effectiveness tracked for session: {session_id}")
            
        except Exception as e:
            self.logger.error(f"Error tracking engagement effectiveness: {e}")
    
    def _initialize_engagement_strategies(self):
        """Initialize predefined engagement strategies for different domains."""
        
        # Technical Domain Strategy
        technical_strategy = EngagementStrategy(
            strategy_id="technical_analytical",
            strategy_name="Technical Analytical Engagement",
            domain="technical",
            uncertainty_profile={"epistemic": 0.8, "aleatoric": 0.6, "confidence": 0.7},
            expert_profile_match={"technical_expertise": True, "analytical_preference": True},
            engagement_approach="analytical",
            communication_style="technical",
            question_patterns=[
                "What specific technical factors contribute to this uncertainty?",
                "Can you provide more detailed technical specifications?",
                "What are the technical constraints or limitations?",
                "How do the technical requirements impact the uncertainty?"
            ],
            interaction_flow=[
                {"step": "technical_assessment", "focus": "technical_details"},
                {"step": "constraint_analysis", "focus": "limitations"},
                {"step": "solution_exploration", "focus": "technical_solutions"},
                {"step": "validation", "focus": "technical_validation"}
            ],
            success_indicators={
                "technical_clarity": 0.8,
                "constraint_identification": 0.7,
                "solution_feasibility": 0.6
            },
            quantum_enhancements={},
            effectiveness_score=0.75,
            created_timestamp=datetime.utcnow().isoformat()
        )
        
        # Medical Domain Strategy
        medical_strategy = EngagementStrategy(
            strategy_id="medical_empathetic",
            strategy_name="Medical Empathetic Engagement",
            domain="medical",
            uncertainty_profile={"epistemic": 0.7, "social": 0.8, "contextual": 0.9},
            expert_profile_match={"medical_expertise": True, "empathetic_approach": True},
            engagement_approach="collaborative",
            communication_style="empathetic",
            question_patterns=[
                "What clinical factors are most concerning in this situation?",
                "How might this uncertainty affect patient care?",
                "What additional clinical information would be helpful?",
                "Are there patient safety considerations we should address?"
            ],
            interaction_flow=[
                {"step": "clinical_assessment", "focus": "patient_impact"},
                {"step": "safety_evaluation", "focus": "risk_factors"},
                {"step": "care_planning", "focus": "treatment_options"},
                {"step": "outcome_validation", "focus": "patient_outcomes"}
            ],
            success_indicators={
                "patient_safety": 0.9,
                "clinical_clarity": 0.8,
                "care_quality": 0.8
            },
            quantum_enhancements={},
            effectiveness_score=0.8,
            created_timestamp=datetime.utcnow().isoformat()
        )
        
        # Financial Domain Strategy
        financial_strategy = EngagementStrategy(
            strategy_id="financial_risk_focused",
            strategy_name="Financial Risk-Focused Engagement",
            domain="financial",
            uncertainty_profile={"aleatoric": 0.9, "temporal": 0.8, "confidence": 0.7},
            expert_profile_match={"financial_expertise": True, "risk_analysis": True},
            engagement_approach="directive",
            communication_style="formal",
            question_patterns=[
                "What are the primary financial risks associated with this uncertainty?",
                "How might market conditions affect this situation?",
                "What is the potential financial impact range?",
                "Are there regulatory compliance considerations?"
            ],
            interaction_flow=[
                {"step": "risk_assessment", "focus": "financial_risks"},
                {"step": "market_analysis", "focus": "market_factors"},
                {"step": "impact_evaluation", "focus": "financial_impact"},
                {"step": "compliance_check", "focus": "regulatory_requirements"}
            ],
            success_indicators={
                "risk_identification": 0.8,
                "impact_quantification": 0.7,
                "compliance_assurance": 0.9
            },
            quantum_enhancements={},
            effectiveness_score=0.72,
            created_timestamp=datetime.utcnow().isoformat()
        )
        
        # Legal Domain Strategy
        legal_strategy = EngagementStrategy(
            strategy_id="legal_systematic",
            strategy_name="Legal Systematic Engagement",
            domain="legal",
            uncertainty_profile={"epistemic": 0.8, "contextual": 0.9, "social": 0.7},
            expert_profile_match={"legal_expertise": True, "systematic_approach": True},
            engagement_approach="exploratory",
            communication_style="formal",
            question_patterns=[
                "What are the key legal precedents relevant to this uncertainty?",
                "Are there jurisdictional considerations that affect this situation?",
                "What legal risks or liabilities should we consider?",
                "How do current regulations impact this uncertainty?"
            ],
            interaction_flow=[
                {"step": "legal_research", "focus": "precedents_regulations"},
                {"step": "risk_analysis", "focus": "legal_risks"},
                {"step": "compliance_review", "focus": "regulatory_compliance"},
                {"step": "recommendation", "focus": "legal_recommendations"}
            ],
            success_indicators={
                "legal_clarity": 0.8,
                "risk_mitigation": 0.7,
                "compliance_confidence": 0.9
            },
            quantum_enhancements={},
            effectiveness_score=0.78,
            created_timestamp=datetime.utcnow().isoformat()
        )
        
        # General Domain Strategy
        general_strategy = EngagementStrategy(
            strategy_id="general_adaptive",
            strategy_name="General Adaptive Engagement",
            domain="general",
            uncertainty_profile={"epistemic": 0.6, "confidence": 0.6, "contextual": 0.6},
            expert_profile_match={"general_expertise": True, "adaptive_approach": True},
            engagement_approach="collaborative",
            communication_style="conversational",
            question_patterns=[
                "Can you help me understand the key aspects of this uncertainty?",
                "What information would be most helpful to clarify this situation?",
                "Are there any important factors we haven't considered?",
                "How confident are you in the current understanding?"
            ],
            interaction_flow=[
                {"step": "exploration", "focus": "general_understanding"},
                {"step": "clarification", "focus": "key_factors"},
                {"step": "validation", "focus": "confidence_building"},
                {"step": "synthesis", "focus": "comprehensive_understanding"}
            ],
            success_indicators={
                "understanding_clarity": 0.7,
                "factor_identification": 0.6,
                "confidence_improvement": 0.6
            },
            quantum_enhancements={},
            effectiveness_score=0.65,
            created_timestamp=datetime.utcnow().isoformat()
        )
        
        # Store strategies
        strategies = [technical_strategy, medical_strategy, financial_strategy, legal_strategy, general_strategy]
        
        for strategy in strategies:
            self.engagement_strategies[strategy.strategy_id] = strategy
            
            # Index by domain
            if strategy.domain not in self.domain_strategies:
                self.domain_strategies[strategy.domain] = []
            self.domain_strategies[strategy.domain].append(strategy.strategy_id)
            
            # Initialize effectiveness tracking
            self.strategy_effectiveness[strategy.strategy_id] = {
                "uncertainty_reduction": 0.5,
                "expert_satisfaction": 0.5,
                "collaboration_efficiency": 0.5,
                "question_effectiveness": 0.5,
                "quantum_utilization": 0.0,
                "overall_effectiveness": 0.5,
                "session_count": 0
            }
    
    def _get_candidate_strategies(self, engagement_context: EngagementContext) -> List[EngagementStrategy]:
        """Get candidate strategies for the given context."""
        
        # Start with domain-specific strategies
        candidate_strategy_ids = self.domain_strategies.get(engagement_context.domain, [])
        
        # Add general strategies as fallback
        if "general" in self.domain_strategies:
            candidate_strategy_ids.extend(self.domain_strategies["general"])
        
        # Convert to strategy objects
        candidates = []
        for strategy_id in candidate_strategy_ids:
            if strategy_id in self.engagement_strategies:
                candidates.append(self.engagement_strategies[strategy_id])
        
        return candidates
    
    def _score_strategy_for_context(
        self,
        strategy: EngagementStrategy,
        context: EngagementContext
    ) -> float:
        """Score how well a strategy matches the given context."""
        
        score = 0.0
        
        # Domain match (40% weight)
        if strategy.domain == context.domain:
            score += 0.4
        elif strategy.domain == "general":
            score += 0.2  # General strategies get partial credit
        
        # Uncertainty profile match (30% weight)
        uncertainty_match = self._calculate_uncertainty_profile_match(
            strategy.uncertainty_profile, context.uncertainty_analysis.uncertainty_breakdown
        )
        score += uncertainty_match * 0.3
        
        # Expert profile match (20% weight)
        expert_match = self._calculate_expert_profile_match(
            strategy.expert_profile_match, context.expert_profile
        )
        score += expert_match * 0.2
        
        # Historical effectiveness (10% weight)
        effectiveness = self.strategy_effectiveness.get(strategy.strategy_id, {}).get("overall_effectiveness", 0.5)
        score += effectiveness * 0.1
        
        return min(1.0, score)
    
    def _calculate_uncertainty_profile_match(
        self,
        strategy_profile: Dict[str, float],
        uncertainty_breakdown: Dict[str, float]
    ) -> float:
        """Calculate how well strategy uncertainty profile matches actual uncertainty."""
        
        if not strategy_profile or not uncertainty_breakdown:
            return 0.5
        
        matches = []
        for uncertainty_type, strategy_weight in strategy_profile.items():
            actual_level = uncertainty_breakdown.get(uncertainty_type, 0.0)
            
            # Higher match if strategy weight aligns with actual uncertainty level
            match = 1.0 - abs(strategy_weight - actual_level)
            matches.append(match)
        
        return sum(matches) / len(matches) if matches else 0.5
    
    def _calculate_expert_profile_match(
        self,
        strategy_requirements: Dict[str, Any],
        expert_profile: ExpertProfile
    ) -> float:
        """Calculate how well expert profile matches strategy requirements."""
        
        if not strategy_requirements:
            return 0.5
        
        matches = []
        
        # Check domain expertise
        if "technical_expertise" in strategy_requirements:
            has_technical = "technical" in expert_profile.expertise_domains
            matches.append(1.0 if has_technical else 0.3)
        
        if "medical_expertise" in strategy_requirements:
            has_medical = "medical" in expert_profile.expertise_domains
            matches.append(1.0 if has_medical else 0.3)
        
        if "financial_expertise" in strategy_requirements:
            has_financial = "financial" in expert_profile.expertise_domains
            matches.append(1.0 if has_financial else 0.3)
        
        if "legal_expertise" in strategy_requirements:
            has_legal = "legal" in expert_profile.expertise_domains
            matches.append(1.0 if has_legal else 0.3)
        
        # Check interaction style preferences
        if "analytical_preference" in strategy_requirements:
            is_analytical = expert_profile.preferred_interaction_style in ["direct", "progressive"]
            matches.append(1.0 if is_analytical else 0.6)
        
        if "empathetic_approach" in strategy_requirements:
            is_empathetic = expert_profile.preferred_interaction_style == "contextual"
            matches.append(1.0 if is_empathetic else 0.6)
        
        return sum(matches) / len(matches) if matches else 0.5
    
    def _get_default_strategy(self) -> EngagementStrategy:
        """Get default engagement strategy."""
        return self.engagement_strategies.get("general_adaptive", list(self.engagement_strategies.values())[0])
    
    # Additional helper methods would continue here...
    # (Implementation continues with question generation for each domain,
    # adaptation logic, cultural considerations, quantum enhancements, etc.)

# Global context-aware engagement system instance
_context_aware_engagement = None

def get_context_aware_engagement() -> ContextAwareEngagementSystem:
    """Get the global Context-Aware Engagement System instance."""
    global _context_aware_engagement
    if _context_aware_engagement is None:
        _context_aware_engagement = ContextAwareEngagementSystem()
    return _context_aware_engagement

# Convenience functions for external use
def select_engagement_strategy(engagement_context: EngagementContext) -> EngagementStrategy:
    """Select optimal engagement strategy based on context."""
    system = get_context_aware_engagement()
    return system.select_engagement_strategy(engagement_context)

def generate_contextual_questions(engagement_strategy: EngagementStrategy, engagement_context: EngagementContext, uncertainty_focus: str, question_count: int = 3) -> List[Dict[str, Any]]:
    """Generate contextual questions based on engagement strategy."""
    system = get_context_aware_engagement()
    return system.generate_contextual_questions(engagement_strategy, engagement_context, uncertainty_focus, question_count)

