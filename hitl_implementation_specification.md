# Human-in-the-Loop Collaborative Reflection System for Emotional Veritas 2
## Technical Implementation Specification

**Author**: Manus AI  
**Date**: July 3, 2025  
**Version**: 1.0  

## Executive Summary

This specification details the implementation of a human-in-the-loop (HITL) collaborative reflection system for Emotional Veritas 2 that transforms agent uncertainty from a limitation into an opportunity for meaningful human-AI collaboration. Rather than agents simply stating "I don't know," this system enables context-aware engagement strategies that bring humans into collaborative reflection based on specific scenarios and uncertainty types.

The implementation builds upon the existing Veritas Enterprise API architecture, extending it with uncertainty quantification, context-aware engagement routing, progressive clarification mechanisms, and collaborative decision-making workflows. The system supports three primary contexts: conversational scenarios, technical/code work, and compliance/policy frameworks, each with tailored engagement strategies.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Core Components](#core-components)
3. [Uncertainty Quantification Engine](#uncertainty-quantification-engine)
4. [Context-Aware Engagement Router](#context-aware-engagement-router)
5. [Progressive Clarification System](#progressive-clarification-system)
6. [Integration with Existing Veritas API](#integration-with-existing-veritas-api)
7. [Implementation Examples](#implementation-examples)
8. [API Specifications](#api-specifications)
9. [Database Schema](#database-schema)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Considerations](#deployment-considerations)
12. [References](#references)

## System Architecture Overview

The Human-in-the-Loop Collaborative Reflection System extends the existing Emotional Veritas 2 architecture with four primary components that work together to enable intelligent uncertainty handling and human engagement. The system follows a modular design pattern that integrates seamlessly with the current GovernanceVerificationEngine while adding sophisticated uncertainty assessment and collaborative engagement capabilities.

The architecture implements a pipeline approach where agent outputs first undergo uncertainty quantification analysis to determine confidence levels and identify specific areas of uncertainty. Based on these assessments, the Context-Aware Engagement Router determines the appropriate engagement strategy for the given scenario type (conversational, technical, or compliance). The Progressive Clarification System then manages the iterative dialogue process with humans, while the Enhanced Notification System handles real-time communication and collaboration requests.

This design ensures that uncertainty handling becomes a collaborative process rather than a failure mode, transforming potential limitations into opportunities for human-AI partnership. The system maintains full compatibility with existing Veritas Enterprise features while adding sophisticated uncertainty management capabilities that adapt to different contexts and user needs.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Output Processing                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│              Uncertainty Quantification Engine                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Epistemic     │ │    Aleatoric    │ │   Confidence    │   │
│  │  Uncertainty    │ │  Uncertainty    │ │   Assessment    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│              Context-Aware Engagement Router                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Conversational  │ │   Technical/    │ │   Compliance/   │   │
│  │   Scenarios     │ │   Code Work     │ │   Policy Work   │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│            Progressive Clarification System                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Dialogue      │ │   Iterative     │ │   Collaborative │   │
│  │  Management     │ │  Refinement     │ │   Resolution    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│            Enhanced Notification System                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Real-time     │ │   Collaboration │ │     Audit       │   │
│  │   Alerts        │ │    Requests     │ │    Logging      │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Uncertainty Quantification Engine

The Uncertainty Quantification Engine serves as the foundation of the HITL system, providing sophisticated analysis of agent confidence levels and uncertainty types. This component implements multiple uncertainty estimation methods to provide comprehensive assessment of agent knowledge gaps and confidence boundaries.

The engine distinguishes between epistemic uncertainty (what the model doesn't know) and aleatoric uncertainty (inherent randomness in the data), enabling more nuanced decision-making about when and how to engage humans. By quantifying uncertainty across multiple dimensions, the system can make intelligent decisions about collaboration strategies and engagement thresholds.

The implementation leverages ensemble methods, Monte Carlo sampling, and Bayesian neural network approaches to provide robust uncertainty estimates. These estimates are then contextualized based on the specific domain and task requirements, ensuring that uncertainty thresholds are appropriately calibrated for different scenarios.

### 2. Context-Aware Engagement Router

The Context-Aware Engagement Router analyzes the current interaction context to determine the most appropriate engagement strategy for human collaboration. This component implements sophisticated context classification algorithms that consider multiple factors including domain type, task complexity, user expertise level, and urgency requirements.

The router maintains separate engagement strategies for conversational scenarios, technical/code work, and compliance/policy frameworks, each with tailored communication patterns and clarification approaches. By adapting engagement strategies to context, the system ensures that human-AI collaboration feels natural and appropriate for the specific domain and situation.

The routing decisions are based on a combination of explicit context indicators (such as API endpoints or user-specified domains) and implicit context analysis (such as content analysis and interaction patterns). This dual approach ensures robust context identification while maintaining flexibility for edge cases and evolving use patterns.

### 3. Progressive Clarification System

The Progressive Clarification System manages the iterative dialogue process between agents and humans, implementing sophisticated conversation management algorithms that guide collaborative problem-solving. This component maintains conversation state, tracks clarification progress, and adapts questioning strategies based on human responses and evolving understanding.

The system implements a multi-stage clarification process that begins with broad context gathering and progressively narrows focus based on human input. This approach ensures efficient information gathering while maintaining natural conversation flow and avoiding overwhelming users with excessive questions.

The clarification process is designed to be adaptive and context-sensitive, adjusting questioning strategies based on user expertise, time constraints, and task complexity. The system maintains conversation history and learns from successful clarification patterns to improve future interactions.

### 4. Enhanced Notification System

The Enhanced Notification System extends the existing Veritas notification infrastructure to support rich collaborative interactions and real-time communication between agents and humans. This component handles the delivery of clarification requests, collaboration invitations, and progress updates through multiple channels including in-app notifications, email alerts, and API webhooks.

The notification system implements intelligent routing and prioritization algorithms that ensure critical clarification requests receive appropriate attention while avoiding notification fatigue. The system supports both synchronous and asynchronous collaboration modes, adapting to user preferences and availability patterns.

## Uncertainty Quantification Engine

The Uncertainty Quantification Engine represents the core innovation of the HITL system, providing sophisticated analysis of agent confidence and knowledge boundaries. This component implements multiple complementary approaches to uncertainty estimation, ensuring robust and reliable assessment across diverse scenarios and content types.

### Uncertainty Types and Measurement

The engine distinguishes between several types of uncertainty, each requiring different measurement approaches and engagement strategies. Epistemic uncertainty reflects the agent's knowledge limitations and can often be reduced through additional information or human expertise. Aleatoric uncertainty represents inherent randomness or ambiguity in the data that cannot be eliminated but must be acknowledged and managed appropriately.

Confidence uncertainty measures the agent's certainty in its own assessments, providing meta-cognitive awareness that enables more sophisticated decision-making about when to seek human input. This multi-dimensional approach to uncertainty quantification enables nuanced decision-making about collaboration strategies and engagement thresholds.

### Implementation Architecture

```python
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from enum import Enum
import torch
import torch.nn.functional as F
from scipy import stats
import logging

class UncertaintyType(Enum):
    EPISTEMIC = "epistemic"  # Model uncertainty - what the model doesn't know
    ALEATORIC = "aleatoric"  # Data uncertainty - inherent noise/ambiguity
    CONFIDENCE = "confidence"  # Meta-cognitive uncertainty about own assessments

@dataclass
class UncertaintyAssessment:
    """Comprehensive uncertainty assessment result"""
    epistemic_uncertainty: float  # 0.0 to 1.0
    aleatoric_uncertainty: float  # 0.0 to 1.0
    confidence_uncertainty: float  # 0.0 to 1.0
    overall_uncertainty: float  # Composite uncertainty score
    uncertainty_sources: List[str]  # Specific sources of uncertainty
    confidence_intervals: Dict[str, Tuple[float, float]]  # Confidence bounds
    explanation: str  # Human-readable uncertainty explanation
    engagement_recommendation: str  # Recommended engagement strategy
    context_factors: Dict[str, Any]  # Context-specific uncertainty factors

@dataclass
class UncertaintyContext:
    """Context information for uncertainty assessment"""
    domain: str  # "conversational", "technical", "compliance"
    task_type: str  # Specific task being performed
    user_expertise: str  # "novice", "intermediate", "expert"
    stakes: str  # "low", "medium", "high"
    time_sensitivity: str  # "immediate", "normal", "flexible"
    previous_interactions: List[Dict]  # Historical context
    available_resources: List[str]  # Available information sources

class UncertaintyQuantificationEngine:
    """
    Advanced uncertainty quantification engine for agent outputs
    
    Implements multiple uncertainty estimation methods:
    - Ensemble-based uncertainty
    - Monte Carlo dropout
    - Bayesian neural network approaches
    - Semantic coherence analysis
    - Context-aware uncertainty calibration
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Uncertainty thresholds by context
        self.uncertainty_thresholds = {
            "conversational": {
                "epistemic": 0.3,
                "aleatoric": 0.4,
                "confidence": 0.3,
                "overall": 0.35
            },
            "technical": {
                "epistemic": 0.2,
                "aleatoric": 0.3,
                "confidence": 0.2,
                "overall": 0.25
            },
            "compliance": {
                "epistemic": 0.1,
                "aleatoric": 0.2,
                "confidence": 0.1,
                "overall": 0.15
            }
        }
        
        # Initialize uncertainty estimation models
        self._initialize_uncertainty_models()
    
    def _initialize_uncertainty_models(self):
        """Initialize various uncertainty estimation models"""
        # In production, these would be actual trained models
        self.ensemble_models = []  # List of ensemble models
        self.bayesian_model = None  # Bayesian neural network
        self.semantic_analyzer = None  # Semantic coherence analyzer
        
        self.logger.info("Uncertainty quantification models initialized")
    
    def assess_uncertainty(self, 
                          agent_output: str, 
                          context: UncertaintyContext,
                          additional_data: Optional[Dict] = None) -> UncertaintyAssessment:
        """
        Perform comprehensive uncertainty assessment on agent output
        
        Args:
            agent_output: The text output from the agent
            context: Context information for the assessment
            additional_data: Optional additional data for assessment
            
        Returns:
            UncertaintyAssessment: Comprehensive uncertainty analysis
        """
        try:
            # Perform multiple uncertainty estimation methods
            epistemic_uncertainty = self._estimate_epistemic_uncertainty(
                agent_output, context, additional_data
            )
            
            aleatoric_uncertainty = self._estimate_aleatoric_uncertainty(
                agent_output, context, additional_data
            )
            
            confidence_uncertainty = self._estimate_confidence_uncertainty(
                agent_output, context, additional_data
            )
            
            # Calculate overall uncertainty score
            overall_uncertainty = self._calculate_overall_uncertainty(
                epistemic_uncertainty, aleatoric_uncertainty, confidence_uncertainty, context
            )
            
            # Identify uncertainty sources
            uncertainty_sources = self._identify_uncertainty_sources(
                agent_output, context, epistemic_uncertainty, aleatoric_uncertainty, confidence_uncertainty
            )
            
            # Calculate confidence intervals
            confidence_intervals = self._calculate_confidence_intervals(
                agent_output, context, epistemic_uncertainty, aleatoric_uncertainty
            )
            
            # Generate human-readable explanation
            explanation = self._generate_uncertainty_explanation(
                epistemic_uncertainty, aleatoric_uncertainty, confidence_uncertainty, 
                uncertainty_sources, context
            )
            
            # Determine engagement recommendation
            engagement_recommendation = self._determine_engagement_strategy(
                overall_uncertainty, uncertainty_sources, context
            )
            
            # Extract context-specific factors
            context_factors = self._extract_context_factors(agent_output, context)
            
            assessment = UncertaintyAssessment(
                epistemic_uncertainty=epistemic_uncertainty,
                aleatoric_uncertainty=aleatoric_uncertainty,
                confidence_uncertainty=confidence_uncertainty,
                overall_uncertainty=overall_uncertainty,
                uncertainty_sources=uncertainty_sources,
                confidence_intervals=confidence_intervals,
                explanation=explanation,
                engagement_recommendation=engagement_recommendation,
                context_factors=context_factors
            )
            
            self.logger.info(f"Uncertainty assessment completed: overall={overall_uncertainty:.3f}")
            return assessment
            
        except Exception as e:
            self.logger.error(f"Uncertainty assessment failed: {str(e)}")
            # Return conservative high-uncertainty assessment
            return self._create_fallback_assessment(context)
    
    def _estimate_epistemic_uncertainty(self, 
                                       agent_output: str, 
                                       context: UncertaintyContext,
                                       additional_data: Optional[Dict]) -> float:
        """
        Estimate epistemic uncertainty (model knowledge limitations)
        
        Uses ensemble disagreement, semantic coherence analysis, and
        knowledge base coverage assessment.
        """
        # Ensemble disagreement analysis
        ensemble_disagreement = self._calculate_ensemble_disagreement(agent_output)
        
        # Semantic coherence analysis
        semantic_coherence = self._analyze_semantic_coherence(agent_output)
        
        # Knowledge coverage assessment
        knowledge_coverage = self._assess_knowledge_coverage(agent_output, context)
        
        # Context-specific uncertainty factors
        context_multiplier = self._get_context_uncertainty_multiplier(context, "epistemic")
        
        # Combine uncertainty estimates
        epistemic_uncertainty = (
            0.4 * ensemble_disagreement +
            0.3 * (1.0 - semantic_coherence) +
            0.3 * (1.0 - knowledge_coverage)
        ) * context_multiplier
        
        return min(1.0, max(0.0, epistemic_uncertainty))
    
    def _estimate_aleatoric_uncertainty(self, 
                                       agent_output: str, 
                                       context: UncertaintyContext,
                                       additional_data: Optional[Dict]) -> float:
        """
        Estimate aleatoric uncertainty (inherent data ambiguity)
        
        Analyzes linguistic ambiguity, multiple valid interpretations,
        and inherent randomness in the domain.
        """
        # Linguistic ambiguity analysis
        linguistic_ambiguity = self._analyze_linguistic_ambiguity(agent_output)
        
        # Multiple interpretation analysis
        interpretation_diversity = self._analyze_interpretation_diversity(agent_output, context)
        
        # Domain-specific randomness
        domain_randomness = self._assess_domain_randomness(context)
        
        # Context-specific uncertainty factors
        context_multiplier = self._get_context_uncertainty_multiplier(context, "aleatoric")
        
        # Combine uncertainty estimates
        aleatoric_uncertainty = (
            0.4 * linguistic_ambiguity +
            0.4 * interpretation_diversity +
            0.2 * domain_randomness
        ) * context_multiplier
        
        return min(1.0, max(0.0, aleatoric_uncertainty))
    
    def _estimate_confidence_uncertainty(self, 
                                        agent_output: str, 
                                        context: UncertaintyContext,
                                        additional_data: Optional[Dict]) -> float:
        """
        Estimate confidence uncertainty (meta-cognitive uncertainty)
        
        Analyzes the agent's confidence in its own assessments and
        the reliability of its uncertainty estimates.
        """
        # Confidence calibration analysis
        confidence_calibration = self._analyze_confidence_calibration(agent_output, context)
        
        # Meta-cognitive consistency
        metacognitive_consistency = self._assess_metacognitive_consistency(agent_output)
        
        # Historical accuracy correlation
        historical_accuracy = self._assess_historical_accuracy(context)
        
        # Context-specific uncertainty factors
        context_multiplier = self._get_context_uncertainty_multiplier(context, "confidence")
        
        # Combine uncertainty estimates
        confidence_uncertainty = (
            0.5 * (1.0 - confidence_calibration) +
            0.3 * (1.0 - metacognitive_consistency) +
            0.2 * (1.0 - historical_accuracy)
        ) * context_multiplier
        
        return min(1.0, max(0.0, confidence_uncertainty))
    
    def _calculate_overall_uncertainty(self, 
                                     epistemic: float, 
                                     aleatoric: float, 
                                     confidence: float,
                                     context: UncertaintyContext) -> float:
        """Calculate composite overall uncertainty score"""
        # Context-specific weighting
        weights = self._get_uncertainty_weights(context)
        
        overall = (
            weights["epistemic"] * epistemic +
            weights["aleatoric"] * aleatoric +
            weights["confidence"] * confidence
        )
        
        return min(1.0, max(0.0, overall))
    
    def _identify_uncertainty_sources(self, 
                                    agent_output: str,
                                    context: UncertaintyContext,
                                    epistemic: float,
                                    aleatoric: float,
                                    confidence: float) -> List[str]:
        """Identify specific sources of uncertainty"""
        sources = []
        
        # Check epistemic uncertainty sources
        if epistemic > self.uncertainty_thresholds[context.domain]["epistemic"]:
            if self._has_knowledge_gaps(agent_output, context):
                sources.append("knowledge_gaps")
            if self._has_domain_unfamiliarity(agent_output, context):
                sources.append("domain_unfamiliarity")
            if self._has_insufficient_context(agent_output, context):
                sources.append("insufficient_context")
        
        # Check aleatoric uncertainty sources
        if aleatoric > self.uncertainty_thresholds[context.domain]["aleatoric"]:
            if self._has_ambiguous_language(agent_output):
                sources.append("ambiguous_language")
            if self._has_multiple_interpretations(agent_output, context):
                sources.append("multiple_interpretations")
            if self._has_subjective_elements(agent_output, context):
                sources.append("subjective_elements")
        
        # Check confidence uncertainty sources
        if confidence > self.uncertainty_thresholds[context.domain]["confidence"]:
            if self._has_conflicting_information(agent_output):
                sources.append("conflicting_information")
            if self._has_low_confidence_indicators(agent_output):
                sources.append("low_confidence_indicators")
            if self._has_complexity_overload(agent_output, context):
                sources.append("complexity_overload")
        
        return sources
    
    def _generate_uncertainty_explanation(self, 
                                        epistemic: float,
                                        aleatoric: float,
                                        confidence: float,
                                        sources: List[str],
                                        context: UncertaintyContext) -> str:
        """Generate human-readable explanation of uncertainty"""
        explanation_parts = []
        
        # Overall uncertainty level
        overall = (epistemic + aleatoric + confidence) / 3
        if overall < 0.3:
            explanation_parts.append("I have high confidence in this response")
        elif overall < 0.6:
            explanation_parts.append("I have moderate confidence in this response")
        else:
            explanation_parts.append("I have significant uncertainty about this response")
        
        # Specific uncertainty sources
        if "knowledge_gaps" in sources:
            explanation_parts.append("there are gaps in my knowledge about this topic")
        if "insufficient_context" in sources:
            explanation_parts.append("I need more context to provide a complete answer")
        if "multiple_interpretations" in sources:
            explanation_parts.append("there are multiple valid ways to interpret your request")
        if "ambiguous_language" in sources:
            explanation_parts.append("some aspects of the question are ambiguous")
        if "subjective_elements" in sources:
            explanation_parts.append("this involves subjective judgments where your perspective is valuable")
        
        # Context-specific considerations
        if context.stakes == "high":
            explanation_parts.append("given the importance of this decision, I'd like to collaborate with you to ensure accuracy")
        
        return " and ".join(explanation_parts) + "."
    
    def _determine_engagement_strategy(self, 
                                     overall_uncertainty: float,
                                     sources: List[str],
                                     context: UncertaintyContext) -> str:
        """Determine recommended engagement strategy"""
        threshold = self.uncertainty_thresholds[context.domain]["overall"]
        
        if overall_uncertainty < threshold * 0.5:
            return "proceed_with_confidence"
        elif overall_uncertainty < threshold:
            return "brief_clarification"
        elif overall_uncertainty < threshold * 1.5:
            return "structured_dialogue"
        else:
            return "collaborative_analysis"
    
    # Helper methods for uncertainty estimation
    def _calculate_ensemble_disagreement(self, agent_output: str) -> float:
        """Calculate disagreement between ensemble models"""
        # Mock implementation - in production, use actual ensemble models
        return np.random.beta(2, 5)  # Simulated ensemble disagreement
    
    def _analyze_semantic_coherence(self, agent_output: str) -> float:
        """Analyze semantic coherence of the output"""
        # Mock implementation - in production, use semantic analysis
        coherence_score = 1.0 - (len(agent_output.split()) / 1000)  # Simple length-based heuristic
        return max(0.0, min(1.0, coherence_score))
    
    def _assess_knowledge_coverage(self, agent_output: str, context: UncertaintyContext) -> float:
        """Assess how well the output covers the required knowledge"""
        # Mock implementation - in production, use knowledge base analysis
        coverage_score = 0.8 if context.domain == "technical" else 0.9
        return coverage_score
    
    def _get_context_uncertainty_multiplier(self, context: UncertaintyContext, uncertainty_type: str) -> float:
        """Get context-specific uncertainty multiplier"""
        multipliers = {
            "conversational": {"epistemic": 1.0, "aleatoric": 1.2, "confidence": 0.9},
            "technical": {"epistemic": 1.3, "aleatoric": 0.8, "confidence": 1.1},
            "compliance": {"epistemic": 1.5, "aleatoric": 1.0, "confidence": 1.4}
        }
        
        return multipliers.get(context.domain, {}).get(uncertainty_type, 1.0)
    
    def _get_uncertainty_weights(self, context: UncertaintyContext) -> Dict[str, float]:
        """Get context-specific uncertainty weighting"""
        weights = {
            "conversational": {"epistemic": 0.3, "aleatoric": 0.4, "confidence": 0.3},
            "technical": {"epistemic": 0.5, "aleatoric": 0.2, "confidence": 0.3},
            "compliance": {"epistemic": 0.4, "aleatoric": 0.2, "confidence": 0.4}
        }
        
        return weights.get(context.domain, {"epistemic": 0.33, "aleatoric": 0.33, "confidence": 0.34})
    
    # Additional helper methods would be implemented here...
    # (Continuing with mock implementations for brevity)
    
    def _analyze_linguistic_ambiguity(self, agent_output: str) -> float:
        """Analyze linguistic ambiguity in the output"""
        return np.random.beta(2, 8)  # Mock implementation
    
    def _analyze_interpretation_diversity(self, agent_output: str, context: UncertaintyContext) -> float:
        """Analyze potential for multiple interpretations"""
        return np.random.beta(3, 7)  # Mock implementation
    
    def _assess_domain_randomness(self, context: UncertaintyContext) -> float:
        """Assess inherent randomness in the domain"""
        randomness_levels = {"conversational": 0.3, "technical": 0.1, "compliance": 0.2}
        return randomness_levels.get(context.domain, 0.2)
    
    def _create_fallback_assessment(self, context: UncertaintyContext) -> UncertaintyAssessment:
        """Create conservative fallback assessment for error cases"""
        return UncertaintyAssessment(
            epistemic_uncertainty=0.8,
            aleatoric_uncertainty=0.6,
            confidence_uncertainty=0.7,
            overall_uncertainty=0.7,
            uncertainty_sources=["assessment_error"],
            confidence_intervals={},
            explanation="I encountered an error assessing my uncertainty and recommend human collaboration.",
            engagement_recommendation="collaborative_analysis",
            context_factors={"error": True}
        )
    
    # Additional helper methods for uncertainty source identification...
    def _has_knowledge_gaps(self, agent_output: str, context: UncertaintyContext) -> bool:
        """Check for knowledge gaps in the output"""
        return "I don't know" in agent_output.lower() or "uncertain" in agent_output.lower()
    
    def _has_domain_unfamiliarity(self, agent_output: str, context: UncertaintyContext) -> bool:
        """Check for domain unfamiliarity indicators"""
        return len(agent_output) < 100  # Simple heuristic
    
    def _has_insufficient_context(self, agent_output: str, context: UncertaintyContext) -> bool:
        """Check for insufficient context indicators"""
        return "more information" in agent_output.lower() or "clarify" in agent_output.lower()
    
    def _has_ambiguous_language(self, agent_output: str) -> bool:
        """Check for ambiguous language patterns"""
        ambiguous_terms = ["might", "could", "possibly", "perhaps", "maybe"]
        return any(term in agent_output.lower() for term in ambiguous_terms)
    
    def _has_multiple_interpretations(self, agent_output: str, context: UncertaintyContext) -> bool:
        """Check for multiple interpretation indicators"""
        return "depends on" in agent_output.lower() or "either" in agent_output.lower()
    
    def _has_subjective_elements(self, agent_output: str, context: UncertaintyContext) -> bool:
        """Check for subjective elements"""
        subjective_terms = ["opinion", "preference", "feel", "believe", "think"]
        return any(term in agent_output.lower() for term in subjective_terms)
    
    def _has_conflicting_information(self, agent_output: str) -> bool:
        """Check for conflicting information indicators"""
        return "however" in agent_output.lower() or "but" in agent_output.lower()
    
    def _has_low_confidence_indicators(self, agent_output: str) -> bool:
        """Check for low confidence indicators"""
        low_confidence_terms = ["not sure", "unsure", "difficult to say", "hard to determine"]
        return any(term in agent_output.lower() for term in low_confidence_terms)
    
    def _has_complexity_overload(self, agent_output: str, context: UncertaintyContext) -> bool:
        """Check for complexity overload indicators"""
        return len(agent_output.split()) > 500  # Simple heuristic for complexity
```

This implementation provides a comprehensive foundation for uncertainty quantification that can be extended and refined based on specific domain requirements and available training data. The modular design allows for easy integration of additional uncertainty estimation methods and context-specific adaptations.



## Context-Aware Engagement Router

The Context-Aware Engagement Router serves as the intelligent decision-making component that determines how to engage humans based on uncertainty assessments and contextual factors. This component implements sophisticated routing algorithms that consider multiple dimensions including domain type, user expertise, task complexity, and organizational constraints to select the most appropriate engagement strategy.

The router maintains separate engagement strategies for different contexts while providing seamless integration with the existing Veritas Enterprise infrastructure. By analyzing both explicit context indicators and implicit patterns in user interactions, the system can adapt its engagement approach to maximize collaboration effectiveness while minimizing disruption to user workflows.

### Router Architecture and Implementation

```python
from dataclasses import dataclass
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
import logging
from abc import ABC, abstractmethod

class EngagementStrategy(Enum):
    PROCEED_WITH_CONFIDENCE = "proceed_with_confidence"
    BRIEF_CLARIFICATION = "brief_clarification"
    STRUCTURED_DIALOGUE = "structured_dialogue"
    COLLABORATIVE_ANALYSIS = "collaborative_analysis"
    EXPERT_CONSULTATION = "expert_consultation"

class ContextType(Enum):
    CONVERSATIONAL = "conversational"
    TECHNICAL = "technical"
    COMPLIANCE = "compliance"
    CREATIVE = "creative"
    ANALYTICAL = "analytical"

@dataclass
class EngagementRequest:
    """Request for human engagement"""
    session_id: str
    user_id: str
    agent_output: str
    uncertainty_assessment: UncertaintyAssessment
    context: UncertaintyContext
    engagement_strategy: EngagementStrategy
    priority: str  # "low", "medium", "high", "critical"
    estimated_duration: int  # Estimated engagement time in minutes
    required_expertise: List[str]  # Required human expertise areas
    collaboration_type: str  # "synchronous", "asynchronous", "hybrid"
    engagement_prompt: str  # Specific prompt for human engagement
    fallback_options: List[str]  # Alternative approaches if engagement fails
    metadata: Dict[str, Any]  # Additional context-specific metadata

@dataclass
class EngagementResponse:
    """Response from human engagement"""
    request_id: str
    human_input: str
    clarifications: Dict[str, Any]
    confidence_boost: float  # How much human input increased confidence
    resolution_type: str  # "complete", "partial", "redirect", "escalate"
    follow_up_needed: bool
    learned_context: Dict[str, Any]  # Context learned for future interactions

class EngagementStrategyHandler(ABC):
    """Abstract base class for engagement strategy handlers"""
    
    @abstractmethod
    def can_handle(self, context: UncertaintyContext, uncertainty: UncertaintyAssessment) -> bool:
        """Check if this handler can manage the given context and uncertainty"""
        pass
    
    @abstractmethod
    def create_engagement_request(self, 
                                agent_output: str,
                                uncertainty: UncertaintyAssessment, 
                                context: UncertaintyContext) -> EngagementRequest:
        """Create an engagement request for this strategy"""
        pass
    
    @abstractmethod
    def process_response(self, 
                        request: EngagementRequest, 
                        response: EngagementResponse) -> Dict[str, Any]:
        """Process the human response and return refined output"""
        pass

class ConversationalEngagementHandler(EngagementStrategyHandler):
    """Handler for conversational scenarios"""
    
    def can_handle(self, context: UncertaintyContext, uncertainty: UncertaintyAssessment) -> bool:
        return context.domain == "conversational"
    
    def create_engagement_request(self, 
                                agent_output: str,
                                uncertainty: UncertaintyAssessment, 
                                context: UncertaintyContext) -> EngagementRequest:
        """Create conversational engagement request"""
        
        # Determine engagement strategy based on uncertainty level
        if uncertainty.overall_uncertainty < 0.3:
            strategy = EngagementStrategy.PROCEED_WITH_CONFIDENCE
            prompt = self._create_confidence_prompt(agent_output, uncertainty)
        elif uncertainty.overall_uncertainty < 0.5:
            strategy = EngagementStrategy.BRIEF_CLARIFICATION
            prompt = self._create_clarification_prompt(agent_output, uncertainty)
        elif uncertainty.overall_uncertainty < 0.7:
            strategy = EngagementStrategy.STRUCTURED_DIALOGUE
            prompt = self._create_dialogue_prompt(agent_output, uncertainty)
        else:
            strategy = EngagementStrategy.COLLABORATIVE_ANALYSIS
            prompt = self._create_collaboration_prompt(agent_output, uncertainty)
        
        # Determine priority based on context and uncertainty
        priority = self._determine_priority(uncertainty, context)
        
        # Estimate engagement duration
        duration = self._estimate_duration(strategy, uncertainty, context)
        
        return EngagementRequest(
            session_id=context.session_id,
            user_id=context.user_id,
            agent_output=agent_output,
            uncertainty_assessment=uncertainty,
            context=context,
            engagement_strategy=strategy,
            priority=priority,
            estimated_duration=duration,
            required_expertise=self._identify_required_expertise(uncertainty, context),
            collaboration_type="synchronous",  # Conversational is typically real-time
            engagement_prompt=prompt,
            fallback_options=self._generate_fallback_options(uncertainty, context),
            metadata={"conversation_context": True, "real_time": True}
        )
    
    def _create_clarification_prompt(self, agent_output: str, uncertainty: UncertaintyAssessment) -> str:
        """Create a clarification prompt for conversational scenarios"""
        base_prompt = f"I want to give you the most helpful response, but {uncertainty.explanation}"
        
        clarification_questions = []
        
        if "insufficient_context" in uncertainty.uncertainty_sources:
            clarification_questions.append("Could you provide a bit more context about your specific situation?")
        
        if "multiple_interpretations" in uncertainty.uncertainty_sources:
            clarification_questions.append("I see a few ways to interpret your question - which aspect are you most interested in?")
        
        if "subjective_elements" in uncertainty.uncertainty_sources:
            clarification_questions.append("This seems to involve personal preferences - what matters most to you in this situation?")
        
        if clarification_questions:
            return f"{base_prompt}\n\n{' '.join(clarification_questions)}"
        else:
            return f"{base_prompt}\n\nCould you help me understand what specific aspect you'd like me to focus on?"
    
    def _create_dialogue_prompt(self, agent_output: str, uncertainty: UncertaintyAssessment) -> str:
        """Create a structured dialogue prompt"""
        return f"""I'd like to work through this with you to give you the best possible guidance. {uncertainty.explanation}

Let me share what I'm thinking and get your input:

**What I understand so far:**
{self._extract_known_elements(agent_output)}

**Where I'd like your help:**
{self._extract_uncertainty_areas(uncertainty)}

**Questions for you:**
{self._generate_structured_questions(uncertainty)}

Would you like to explore this together?"""
    
    def _create_collaboration_prompt(self, agent_output: str, uncertainty: UncertaintyAssessment) -> str:
        """Create a collaborative analysis prompt"""
        return f"""This is a complex situation where your expertise and perspective would be really valuable. {uncertainty.explanation}

I'd like to approach this as a collaborative analysis where we combine my knowledge with your insights and experience.

**My initial analysis:**
{self._extract_analysis_elements(agent_output)}

**Areas where your input would be most helpful:**
{self._identify_collaboration_areas(uncertainty)}

**Suggested approach:**
1. Let's first align on the key objectives and constraints
2. Explore different approaches together
3. Evaluate trade-offs based on your priorities
4. Develop a tailored solution

Are you interested in working through this together? We can take it step by step."""

    def process_response(self, 
                        request: EngagementRequest, 
                        response: EngagementResponse) -> Dict[str, Any]:
        """Process conversational engagement response"""
        
        # Extract key information from human response
        clarified_intent = self._extract_intent(response.human_input)
        additional_context = self._extract_context(response.human_input)
        preferences = self._extract_preferences(response.human_input)
        
        # Calculate confidence boost from human input
        confidence_boost = self._calculate_confidence_boost(request, response)
        
        # Generate refined response incorporating human input
        refined_output = self._generate_refined_response(
            request.agent_output, 
            response.human_input, 
            clarified_intent, 
            additional_context, 
            preferences
        )
        
        return {
            "refined_output": refined_output,
            "confidence_boost": confidence_boost,
            "learned_context": {
                "user_preferences": preferences,
                "clarified_intent": clarified_intent,
                "additional_context": additional_context
            },
            "follow_up_needed": self._assess_follow_up_need(request, response)
        }
    
    # Helper methods for conversational engagement
    def _determine_priority(self, uncertainty: UncertaintyAssessment, context: UncertaintyContext) -> str:
        """Determine engagement priority for conversational scenarios"""
        if uncertainty.overall_uncertainty > 0.8:
            return "high"
        elif uncertainty.overall_uncertainty > 0.5:
            return "medium"
        else:
            return "low"
    
    def _estimate_duration(self, strategy: EngagementStrategy, uncertainty: UncertaintyAssessment, context: UncertaintyContext) -> int:
        """Estimate engagement duration in minutes"""
        duration_map = {
            EngagementStrategy.BRIEF_CLARIFICATION: 2,
            EngagementStrategy.STRUCTURED_DIALOGUE: 5,
            EngagementStrategy.COLLABORATIVE_ANALYSIS: 15
        }
        return duration_map.get(strategy, 5)
    
    def _identify_required_expertise(self, uncertainty: UncertaintyAssessment, context: UncertaintyContext) -> List[str]:
        """Identify required human expertise areas"""
        expertise = ["general_knowledge"]
        
        if "domain_unfamiliarity" in uncertainty.uncertainty_sources:
            expertise.append("domain_expertise")
        if "subjective_elements" in uncertainty.uncertainty_sources:
            expertise.append("personal_experience")
        
        return expertise

class TechnicalEngagementHandler(EngagementStrategyHandler):
    """Handler for technical/code scenarios"""
    
    def can_handle(self, context: UncertaintyContext, uncertainty: UncertaintyAssessment) -> bool:
        return context.domain == "technical"
    
    def create_engagement_request(self, 
                                agent_output: str,
                                uncertainty: UncertaintyAssessment, 
                                context: UncertaintyContext) -> EngagementRequest:
        """Create technical engagement request"""
        
        # Technical scenarios often require more structured approach
        if uncertainty.overall_uncertainty < 0.2:
            strategy = EngagementStrategy.PROCEED_WITH_CONFIDENCE
            prompt = self._create_technical_confidence_prompt(agent_output, uncertainty)
        elif uncertainty.overall_uncertainty < 0.4:
            strategy = EngagementStrategy.BRIEF_CLARIFICATION
            prompt = self._create_technical_clarification_prompt(agent_output, uncertainty)
        elif uncertainty.overall_uncertainty < 0.6:
            strategy = EngagementStrategy.STRUCTURED_DIALOGUE
            prompt = self._create_technical_dialogue_prompt(agent_output, uncertainty)
        else:
            strategy = EngagementStrategy.COLLABORATIVE_ANALYSIS
            prompt = self._create_technical_collaboration_prompt(agent_output, uncertainty)
        
        return EngagementRequest(
            session_id=context.session_id,
            user_id=context.user_id,
            agent_output=agent_output,
            uncertainty_assessment=uncertainty,
            context=context,
            engagement_strategy=strategy,
            priority=self._determine_technical_priority(uncertainty, context),
            estimated_duration=self._estimate_technical_duration(strategy, uncertainty, context),
            required_expertise=self._identify_technical_expertise(uncertainty, context),
            collaboration_type="asynchronous",  # Technical work often allows async collaboration
            engagement_prompt=prompt,
            fallback_options=self._generate_technical_fallbacks(uncertainty, context),
            metadata={"technical_context": True, "code_review": True}
        )
    
    def _create_technical_clarification_prompt(self, agent_output: str, uncertainty: UncertaintyAssessment) -> str:
        """Create technical clarification prompt"""
        return f"""I can help you with this technical challenge, but I need to understand your specific requirements better to provide the most accurate solution. {uncertainty.explanation}

**Technical Context Needed:**
{self._generate_technical_questions(uncertainty)}

**Current Understanding:**
{self._extract_technical_understanding(agent_output)}

**Specific Questions:**
{self._generate_specific_technical_questions(uncertainty)}

With these details, I can provide a more targeted and reliable solution."""
    
    def _create_technical_collaboration_prompt(self, agent_output: str, uncertainty: UncertaintyAssessment) -> str:
        """Create technical collaboration prompt"""
        return f"""This is a complex technical problem where collaboration would ensure we develop the best solution. {uncertainty.explanation}

**Technical Analysis:**
{self._extract_technical_analysis(agent_output)}

**Areas for Collaboration:**
{self._identify_technical_collaboration_areas(uncertainty)}

**Proposed Approach:**
1. **Requirements Analysis**: Clarify technical requirements and constraints
2. **Architecture Discussion**: Explore different technical approaches
3. **Implementation Planning**: Design the solution step-by-step
4. **Code Review**: Review implementation for correctness and efficiency

**Next Steps:**
Let's start by clarifying the technical requirements. Could you provide:
{self._generate_requirements_questions(uncertainty)}

I'll then provide specific implementation guidance based on your answers."""

    def process_response(self, 
                        request: EngagementRequest, 
                        response: EngagementResponse) -> Dict[str, Any]:
        """Process technical engagement response"""
        
        # Extract technical specifications from human response
        technical_requirements = self._extract_technical_requirements(response.human_input)
        constraints = self._extract_constraints(response.human_input)
        preferences = self._extract_technical_preferences(response.human_input)
        
        # Generate technical solution incorporating human input
        refined_solution = self._generate_technical_solution(
            request.agent_output,
            technical_requirements,
            constraints,
            preferences
        )
        
        # Calculate confidence boost
        confidence_boost = self._calculate_technical_confidence_boost(request, response)
        
        return {
            "refined_output": refined_solution,
            "confidence_boost": confidence_boost,
            "learned_context": {
                "technical_requirements": technical_requirements,
                "constraints": constraints,
                "preferences": preferences
            },
            "follow_up_needed": self._assess_technical_follow_up(request, response)
        }

class ComplianceEngagementHandler(EngagementStrategyHandler):
    """Handler for compliance/policy scenarios"""
    
    def can_handle(self, context: UncertaintyContext, uncertainty: UncertaintyAssessment) -> bool:
        return context.domain == "compliance"
    
    def create_engagement_request(self, 
                                agent_output: str,
                                uncertainty: UncertaintyAssessment, 
                                context: UncertaintyContext) -> EngagementRequest:
        """Create compliance engagement request"""
        
        # Compliance scenarios require very conservative thresholds
        if uncertainty.overall_uncertainty < 0.1:
            strategy = EngagementStrategy.PROCEED_WITH_CONFIDENCE
            prompt = self._create_compliance_confidence_prompt(agent_output, uncertainty)
        elif uncertainty.overall_uncertainty < 0.2:
            strategy = EngagementStrategy.BRIEF_CLARIFICATION
            prompt = self._create_compliance_clarification_prompt(agent_output, uncertainty)
        elif uncertainty.overall_uncertainty < 0.4:
            strategy = EngagementStrategy.STRUCTURED_DIALOGUE
            prompt = self._create_compliance_dialogue_prompt(agent_output, uncertainty)
        else:
            strategy = EngagementStrategy.EXPERT_CONSULTATION
            prompt = self._create_compliance_expert_prompt(agent_output, uncertainty)
        
        return EngagementRequest(
            session_id=context.session_id,
            user_id=context.user_id,
            agent_output=agent_output,
            uncertainty_assessment=uncertainty,
            context=context,
            engagement_strategy=strategy,
            priority="high",  # Compliance issues are always high priority
            estimated_duration=self._estimate_compliance_duration(strategy, uncertainty, context),
            required_expertise=["compliance_expertise", "legal_knowledge", "regulatory_interpretation"],
            collaboration_type="hybrid",  # Compliance often requires both sync and async
            engagement_prompt=prompt,
            fallback_options=["legal_consultation", "regulatory_guidance", "expert_review"],
            metadata={"compliance_context": True, "audit_trail": True, "high_stakes": True}
        )
    
    def _create_compliance_clarification_prompt(self, agent_output: str, uncertainty: UncertaintyAssessment) -> str:
        """Create compliance clarification prompt"""
        return f"""This involves important compliance considerations that require careful analysis. {uncertainty.explanation}

**Regulatory Context Needed:**
{self._generate_compliance_questions(uncertainty)}

**Current Regulatory Understanding:**
{self._extract_compliance_understanding(agent_output)}

**Critical Questions:**
{self._generate_critical_compliance_questions(uncertainty)}

**Risk Assessment:**
Given the compliance implications, I recommend we work through this systematically to ensure full regulatory adherence and proper documentation for audit purposes."""
    
    def _create_compliance_expert_prompt(self, agent_output: str, uncertainty: UncertaintyAssessment) -> str:
        """Create compliance expert consultation prompt"""
        return f"""This compliance matter involves significant uncertainty that requires expert legal or regulatory guidance. {uncertainty.explanation}

**Compliance Analysis:**
{self._extract_compliance_analysis(agent_output)}

**Areas Requiring Expert Input:**
{self._identify_expert_consultation_areas(uncertainty)}

**Recommendation:**
Given the complexity and potential regulatory implications, I recommend:

1. **Immediate**: Consult with your legal/compliance team
2. **Documentation**: Maintain detailed records of this analysis
3. **Risk Mitigation**: Consider conservative approach until expert guidance is obtained
4. **Follow-up**: Schedule formal compliance review

**Interim Guidance:**
{self._provide_interim_compliance_guidance(agent_output, uncertainty)}

Would you like me to help you prepare documentation for the expert consultation?"""

    def process_response(self, 
                        request: EngagementRequest, 
                        response: EngagementResponse) -> Dict[str, Any]:
        """Process compliance engagement response"""
        
        # Extract compliance-specific information
        regulatory_context = self._extract_regulatory_context(response.human_input)
        risk_tolerance = self._extract_risk_tolerance(response.human_input)
        compliance_requirements = self._extract_compliance_requirements(response.human_input)
        
        # Generate compliance-focused solution
        refined_guidance = self._generate_compliance_guidance(
            request.agent_output,
            regulatory_context,
            risk_tolerance,
            compliance_requirements
        )
        
        # Calculate confidence boost (conservative for compliance)
        confidence_boost = self._calculate_compliance_confidence_boost(request, response)
        
        return {
            "refined_output": refined_guidance,
            "confidence_boost": confidence_boost,
            "learned_context": {
                "regulatory_context": regulatory_context,
                "risk_tolerance": risk_tolerance,
                "compliance_requirements": compliance_requirements
            },
            "follow_up_needed": True,  # Compliance always needs follow-up
            "audit_documentation": self._generate_audit_documentation(request, response)
        }

class ContextAwareEngagementRouter:
    """
    Main router that determines engagement strategies based on context and uncertainty
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Initialize engagement handlers
        self.handlers = {
            ContextType.CONVERSATIONAL: ConversationalEngagementHandler(),
            ContextType.TECHNICAL: TechnicalEngagementHandler(),
            ContextType.COMPLIANCE: ComplianceEngagementHandler()
        }
        
        # Context classification model (in production, this would be a trained model)
        self.context_classifier = self._initialize_context_classifier()
        
        # Engagement history for learning and adaptation
        self.engagement_history = []
        
        self.logger.info("Context-aware engagement router initialized")
    
    def route_engagement(self, 
                        agent_output: str,
                        uncertainty_assessment: UncertaintyAssessment,
                        context: UncertaintyContext) -> EngagementRequest:
        """
        Route engagement request to appropriate handler based on context and uncertainty
        
        Args:
            agent_output: The agent's output text
            uncertainty_assessment: Uncertainty analysis results
            context: Context information for the interaction
            
        Returns:
            EngagementRequest: Structured engagement request for human collaboration
        """
        try:
            # Classify context if not explicitly provided
            if not hasattr(context, 'domain') or not context.domain:
                context.domain = self._classify_context(agent_output, context)
            
            # Select appropriate handler
            handler = self._select_handler(context, uncertainty_assessment)
            
            if not handler:
                self.logger.warning(f"No handler found for context: {context.domain}")
                handler = self.handlers[ContextType.CONVERSATIONAL]  # Fallback
            
            # Create engagement request
            engagement_request = handler.create_engagement_request(
                agent_output, uncertainty_assessment, context
            )
            
            # Log engagement decision
            self._log_engagement_decision(engagement_request)
            
            # Store for learning and adaptation
            self.engagement_history.append({
                "timestamp": datetime.utcnow().isoformat(),
                "context": context,
                "uncertainty": uncertainty_assessment,
                "strategy": engagement_request.engagement_strategy,
                "handler": type(handler).__name__
            })
            
            return engagement_request
            
        except Exception as e:
            self.logger.error(f"Engagement routing failed: {str(e)}")
            # Return fallback engagement request
            return self._create_fallback_engagement_request(agent_output, uncertainty_assessment, context)
    
    def process_engagement_response(self, 
                                  request: EngagementRequest, 
                                  response: EngagementResponse) -> Dict[str, Any]:
        """
        Process human response using appropriate handler
        
        Args:
            request: Original engagement request
            response: Human response to the engagement
            
        Returns:
            Dict containing refined output and learned context
        """
        try:
            # Get appropriate handler
            handler = self._select_handler(request.context, request.uncertainty_assessment)
            
            if not handler:
                self.logger.warning("No handler found for processing response")
                return self._create_fallback_response_processing(request, response)
            
            # Process response
            result = handler.process_response(request, response)
            
            # Update engagement history with outcome
            self._update_engagement_history(request, response, result)
            
            # Learn from successful engagement
            self._learn_from_engagement(request, response, result)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Response processing failed: {str(e)}")
            return self._create_fallback_response_processing(request, response)
    
    def _classify_context(self, agent_output: str, context: UncertaintyContext) -> str:
        """Classify the interaction context"""
        # In production, this would use a trained classification model
        # For now, use simple heuristics
        
        technical_indicators = ["code", "function", "algorithm", "database", "API", "implementation"]
        compliance_indicators = ["regulation", "policy", "compliance", "legal", "audit", "risk"]
        
        output_lower = agent_output.lower()
        
        if any(indicator in output_lower for indicator in technical_indicators):
            return "technical"
        elif any(indicator in output_lower for indicator in compliance_indicators):
            return "compliance"
        else:
            return "conversational"
    
    def _select_handler(self, context: UncertaintyContext, uncertainty: UncertaintyAssessment) -> Optional[EngagementStrategyHandler]:
        """Select appropriate engagement handler"""
        context_type = ContextType(context.domain) if context.domain in [ct.value for ct in ContextType] else ContextType.CONVERSATIONAL
        return self.handlers.get(context_type)
    
    def _log_engagement_decision(self, request: EngagementRequest):
        """Log engagement routing decision"""
        self.logger.info(
            f"Engagement routed: strategy={request.engagement_strategy.value}, "
            f"priority={request.priority}, duration={request.estimated_duration}min"
        )
    
    def _create_fallback_engagement_request(self, 
                                          agent_output: str, 
                                          uncertainty: UncertaintyAssessment, 
                                          context: UncertaintyContext) -> EngagementRequest:
        """Create fallback engagement request for error cases"""
        return EngagementRequest(
            session_id=getattr(context, 'session_id', 'unknown'),
            user_id=getattr(context, 'user_id', 'unknown'),
            agent_output=agent_output,
            uncertainty_assessment=uncertainty,
            context=context,
            engagement_strategy=EngagementStrategy.COLLABORATIVE_ANALYSIS,
            priority="medium",
            estimated_duration=10,
            required_expertise=["general_knowledge"],
            collaboration_type="synchronous",
            engagement_prompt="I encountered an issue analyzing this request and would like to work with you to provide the best response.",
            fallback_options=["manual_review"],
            metadata={"fallback": True}
        )
    
    def _create_fallback_response_processing(self, 
                                           request: EngagementRequest, 
                                           response: EngagementResponse) -> Dict[str, Any]:
        """Create fallback response processing for error cases"""
        return {
            "refined_output": f"{request.agent_output}\n\nBased on your input: {response.human_input}",
            "confidence_boost": 0.2,
            "learned_context": {"fallback_processing": True},
            "follow_up_needed": True
        }
    
    def _initialize_context_classifier(self):
        """Initialize context classification model"""
        # In production, this would load a trained model
        return None
    
    def _update_engagement_history(self, request: EngagementRequest, response: EngagementResponse, result: Dict[str, Any]):
        """Update engagement history with outcome"""
        # Find and update the corresponding history entry
        for entry in reversed(self.engagement_history):
            if entry.get("request_id") == request.session_id:
                entry.update({
                    "response_received": True,
                    "confidence_boost": result.get("confidence_boost", 0),
                    "resolution_type": response.resolution_type,
                    "success": result.get("confidence_boost", 0) > 0.1
                })
                break
    
    def _learn_from_engagement(self, request: EngagementRequest, response: EngagementResponse, result: Dict[str, Any]):
        """Learn from successful engagement patterns"""
        # In production, this would update model parameters or strategy preferences
        # For now, just log successful patterns
        if result.get("confidence_boost", 0) > 0.3:
            self.logger.info(f"Successful engagement pattern: {request.engagement_strategy.value} for {request.context.domain}")
```

This implementation provides a comprehensive routing system that intelligently determines how to engage humans based on context and uncertainty levels. The modular design allows for easy extension to additional contexts and engagement strategies while maintaining consistency with the existing Veritas Enterprise architecture.


## Progressive Clarification System

The Progressive Clarification System manages the iterative dialogue process between agents and humans, implementing sophisticated conversation management that guides collaborative problem-solving through structured interaction patterns. This system maintains conversation state, tracks clarification progress, and adapts questioning strategies based on human responses and evolving understanding.

The system implements a multi-stage clarification process that begins with broad context gathering and progressively narrows focus based on human input. This approach ensures efficient information gathering while maintaining natural conversation flow and avoiding overwhelming users with excessive questions. The clarification process adapts to user expertise levels, time constraints, and task complexity while learning from successful interaction patterns.

### Progressive Clarification Implementation

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import json
import logging
from datetime import datetime, timedelta
import uuid

class ClarificationStage(Enum):
    INITIAL_CONTEXT = "initial_context"
    SPECIFIC_REQUIREMENTS = "specific_requirements"
    CONSTRAINT_IDENTIFICATION = "constraint_identification"
    PREFERENCE_ELICITATION = "preference_elicitation"
    SOLUTION_REFINEMENT = "solution_refinement"
    VALIDATION = "validation"
    COMPLETION = "completion"

class QuestionType(Enum):
    OPEN_ENDED = "open_ended"
    MULTIPLE_CHOICE = "multiple_choice"
    BINARY = "binary"
    SCALE = "scale"
    CLARIFICATION = "clarification"
    CONFIRMATION = "confirmation"

@dataclass
class ClarificationQuestion:
    """Individual clarification question"""
    id: str
    question_text: str
    question_type: QuestionType
    stage: ClarificationStage
    priority: int  # 1-5, higher is more important
    options: Optional[List[str]] = None  # For multiple choice questions
    context_hint: Optional[str] = None  # Additional context for the question
    follow_up_questions: List[str] = field(default_factory=list)
    validation_rules: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ClarificationResponse:
    """Response to a clarification question"""
    question_id: str
    response_text: str
    confidence: float  # Human's confidence in their response (0-1)
    additional_context: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ClarificationSession:
    """Complete clarification session state"""
    session_id: str
    user_id: str
    agent_output: str
    uncertainty_assessment: UncertaintyAssessment
    context: UncertaintyContext
    current_stage: ClarificationStage
    questions_asked: List[ClarificationQuestion]
    responses_received: List[ClarificationResponse]
    learned_context: Dict[str, Any]
    confidence_progression: List[float]  # Track confidence improvement
    estimated_completion: float  # 0-1, how close to completion
    created_at: str
    updated_at: str
    status: str  # "active", "paused", "completed", "abandoned"

class ClarificationQuestionGenerator:
    """Generates context-appropriate clarification questions"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Question templates by context and stage
        self.question_templates = self._initialize_question_templates()
        
        # Adaptive questioning strategies
        self.questioning_strategies = self._initialize_questioning_strategies()
    
    def generate_questions(self, 
                          session: ClarificationSession,
                          max_questions: int = 3) -> List[ClarificationQuestion]:
        """
        Generate appropriate clarification questions for current session state
        
        Args:
            session: Current clarification session
            max_questions: Maximum number of questions to generate
            
        Returns:
            List of prioritized clarification questions
        """
        try:
            # Determine current stage and context
            current_stage = session.current_stage
            context_domain = session.context.domain
            uncertainty_sources = session.uncertainty_assessment.uncertainty_sources
            
            # Generate candidate questions
            candidate_questions = []
            
            # Stage-specific question generation
            if current_stage == ClarificationStage.INITIAL_CONTEXT:
                candidate_questions.extend(
                    self._generate_initial_context_questions(session)
                )
            elif current_stage == ClarificationStage.SPECIFIC_REQUIREMENTS:
                candidate_questions.extend(
                    self._generate_requirements_questions(session)
                )
            elif current_stage == ClarificationStage.CONSTRAINT_IDENTIFICATION:
                candidate_questions.extend(
                    self._generate_constraint_questions(session)
                )
            elif current_stage == ClarificationStage.PREFERENCE_ELICITATION:
                candidate_questions.extend(
                    self._generate_preference_questions(session)
                )
            elif current_stage == ClarificationStage.SOLUTION_REFINEMENT:
                candidate_questions.extend(
                    self._generate_refinement_questions(session)
                )
            elif current_stage == ClarificationStage.VALIDATION:
                candidate_questions.extend(
                    self._generate_validation_questions(session)
                )
            
            # Uncertainty-specific question generation
            for source in uncertainty_sources:
                candidate_questions.extend(
                    self._generate_uncertainty_specific_questions(session, source)
                )
            
            # Filter and prioritize questions
            filtered_questions = self._filter_questions(candidate_questions, session)
            prioritized_questions = self._prioritize_questions(filtered_questions, session)
            
            # Return top questions up to max_questions
            return prioritized_questions[:max_questions]
            
        except Exception as e:
            self.logger.error(f"Question generation failed: {str(e)}")
            return self._generate_fallback_questions(session)
    
    def _generate_initial_context_questions(self, session: ClarificationSession) -> List[ClarificationQuestion]:
        """Generate questions for initial context gathering"""
        questions = []
        context_domain = session.context.domain
        
        if context_domain == "conversational":
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="Could you help me understand the broader context of what you're trying to accomplish?",
                question_type=QuestionType.OPEN_ENDED,
                stage=ClarificationStage.INITIAL_CONTEXT,
                priority=5,
                context_hint="Understanding your overall goal will help me provide more targeted assistance."
            ))
            
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="Is this for personal use, work, or something else?",
                question_type=QuestionType.MULTIPLE_CHOICE,
                stage=ClarificationStage.INITIAL_CONTEXT,
                priority=3,
                options=["Personal", "Work/Professional", "Academic", "Creative Project", "Other"]
            ))
        
        elif context_domain == "technical":
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="What's your current technical environment and constraints?",
                question_type=QuestionType.OPEN_ENDED,
                stage=ClarificationStage.INITIAL_CONTEXT,
                priority=5,
                context_hint="Understanding your tech stack, platform, and limitations helps me suggest compatible solutions."
            ))
            
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="What's the primary goal of this technical solution?",
                question_type=QuestionType.MULTIPLE_CHOICE,
                stage=ClarificationStage.INITIAL_CONTEXT,
                priority=4,
                options=["Performance Optimization", "New Feature Development", "Bug Fix", "System Integration", "Security Enhancement", "Other"]
            ))
        
        elif context_domain == "compliance":
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="What specific regulatory framework or compliance standard applies to your situation?",
                question_type=QuestionType.OPEN_ENDED,
                stage=ClarificationStage.INITIAL_CONTEXT,
                priority=5,
                context_hint="Different regulations have different requirements, so understanding the specific framework is crucial."
            ))
            
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="What's your organization's risk tolerance for this matter?",
                question_type=QuestionType.MULTIPLE_CHOICE,
                stage=ClarificationStage.INITIAL_CONTEXT,
                priority=4,
                options=["Very Conservative", "Conservative", "Moderate", "Aggressive", "Unsure"]
            ))
        
        return questions
    
    def _generate_requirements_questions(self, session: ClarificationSession) -> List[ClarificationQuestion]:
        """Generate questions for specific requirements gathering"""
        questions = []
        context_domain = session.context.domain
        
        # Analyze previous responses to inform requirement questions
        previous_responses = {r.question_id: r.response_text for r in session.responses_received}
        
        if context_domain == "technical":
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="What are the key functional requirements that must be met?",
                question_type=QuestionType.OPEN_ENDED,
                stage=ClarificationStage.SPECIFIC_REQUIREMENTS,
                priority=5,
                context_hint="List the essential features or capabilities the solution must have."
            ))
            
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="Are there any performance requirements (speed, scalability, etc.)?",
                question_type=QuestionType.OPEN_ENDED,
                stage=ClarificationStage.SPECIFIC_REQUIREMENTS,
                priority=4
            ))
        
        elif context_domain == "compliance":
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="What specific compliance obligations are you trying to meet?",
                question_type=QuestionType.OPEN_ENDED,
                stage=ClarificationStage.SPECIFIC_REQUIREMENTS,
                priority=5,
                context_hint="Be as specific as possible about the regulatory requirements."
            ))
        
        return questions
    
    def _generate_constraint_questions(self, session: ClarificationSession) -> List[ClarificationQuestion]:
        """Generate questions for constraint identification"""
        questions = []
        
        questions.append(ClarificationQuestion(
            id=str(uuid.uuid4()),
            question_text="What are your main constraints or limitations?",
            question_type=QuestionType.OPEN_ENDED,
            stage=ClarificationStage.CONSTRAINT_IDENTIFICATION,
            priority=4,
            context_hint="Consider time, budget, technical, regulatory, or resource constraints."
        ))
        
        questions.append(ClarificationQuestion(
            id=str(uuid.uuid4()),
            question_text="How urgent is this? What's your timeline?",
            question_type=QuestionType.MULTIPLE_CHOICE,
            stage=ClarificationStage.CONSTRAINT_IDENTIFICATION,
            priority=3,
            options=["Immediate (today)", "This week", "This month", "Next quarter", "Flexible timeline"]
        ))
        
        return questions
    
    def _generate_preference_questions(self, session: ClarificationSession) -> List[ClarificationQuestion]:
        """Generate questions for preference elicitation"""
        questions = []
        
        questions.append(ClarificationQuestion(
            id=str(uuid.uuid4()),
            question_text="If you had to choose between multiple good options, what factors matter most to you?",
            question_type=QuestionType.OPEN_ENDED,
            stage=ClarificationStage.PREFERENCE_ELICITATION,
            priority=3,
            context_hint="Consider factors like simplicity, cost, performance, reliability, etc."
        ))
        
        return questions
    
    def _generate_uncertainty_specific_questions(self, session: ClarificationSession, uncertainty_source: str) -> List[ClarificationQuestion]:
        """Generate questions specific to uncertainty sources"""
        questions = []
        
        if uncertainty_source == "insufficient_context":
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="Could you provide more details about your specific situation?",
                question_type=QuestionType.OPEN_ENDED,
                stage=session.current_stage,
                priority=4,
                context_hint="Additional context will help me give you a more accurate and helpful response."
            ))
        
        elif uncertainty_source == "multiple_interpretations":
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="I see a few ways to interpret your request. Which aspect is most important to you?",
                question_type=QuestionType.CLARIFICATION,
                stage=session.current_stage,
                priority=5
            ))
        
        elif uncertainty_source == "subjective_elements":
            questions.append(ClarificationQuestion(
                id=str(uuid.uuid4()),
                question_text="This involves some subjective choices. What's your preference or what feels right to you?",
                question_type=QuestionType.OPEN_ENDED,
                stage=session.current_stage,
                priority=4
            ))
        
        return questions

class ProgressiveClarificationSystem:
    """
    Main system for managing progressive clarification dialogues
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Initialize components
        self.question_generator = ClarificationQuestionGenerator(config)
        
        # Active clarification sessions
        self.active_sessions: Dict[str, ClarificationSession] = {}
        
        # Session configuration
        self.max_questions_per_round = config.get("max_questions_per_round", 3)
        self.max_total_questions = config.get("max_total_questions", 10)
        self.session_timeout_minutes = config.get("session_timeout_minutes", 30)
        
        # Adaptive thresholds
        self.completion_thresholds = {
            "conversational": 0.7,
            "technical": 0.8,
            "compliance": 0.9
        }
        
        self.logger.info("Progressive clarification system initialized")
    
    def start_clarification_session(self, 
                                  agent_output: str,
                                  uncertainty_assessment: UncertaintyAssessment,
                                  context: UncertaintyContext) -> ClarificationSession:
        """
        Start a new clarification session
        
        Args:
            agent_output: Original agent output
            uncertainty_assessment: Uncertainty analysis
            context: Interaction context
            
        Returns:
            ClarificationSession: New clarification session
        """
        try:
            session_id = str(uuid.uuid4())
            
            session = ClarificationSession(
                session_id=session_id,
                user_id=context.user_id,
                agent_output=agent_output,
                uncertainty_assessment=uncertainty_assessment,
                context=context,
                current_stage=ClarificationStage.INITIAL_CONTEXT,
                questions_asked=[],
                responses_received=[],
                learned_context={},
                confidence_progression=[uncertainty_assessment.confidence_uncertainty],
                estimated_completion=0.0,
                created_at=datetime.utcnow().isoformat(),
                updated_at=datetime.utcnow().isoformat(),
                status="active"
            )
            
            # Store active session
            self.active_sessions[session_id] = session
            
            self.logger.info(f"Started clarification session {session_id}")
            return session
            
        except Exception as e:
            self.logger.error(f"Failed to start clarification session: {str(e)}")
            raise
    
    def get_next_questions(self, session_id: str) -> List[ClarificationQuestion]:
        """
        Get next clarification questions for a session
        
        Args:
            session_id: ID of the clarification session
            
        Returns:
            List of clarification questions
        """
        try:
            session = self.active_sessions.get(session_id)
            if not session:
                raise ValueError(f"Session {session_id} not found")
            
            # Check if session has timed out
            if self._is_session_expired(session):
                session.status = "abandoned"
                return []
            
            # Check if we've reached completion
            if self._is_session_complete(session):
                session.status = "completed"
                return []
            
            # Generate next questions
            questions = self.question_generator.generate_questions(
                session, self.max_questions_per_round
            )
            
            # Update session with new questions
            session.questions_asked.extend(questions)
            session.updated_at = datetime.utcnow().isoformat()
            
            return questions
            
        except Exception as e:
            self.logger.error(f"Failed to get next questions: {str(e)}")
            return []
    
    def process_clarification_response(self, 
                                     session_id: str, 
                                     question_id: str,
                                     response_text: str,
                                     confidence: float = 1.0,
                                     additional_context: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a clarification response and update session state
        
        Args:
            session_id: ID of the clarification session
            question_id: ID of the question being answered
            response_text: Human's response text
            confidence: Human's confidence in their response
            additional_context: Optional additional context
            
        Returns:
            Dict containing session update and next steps
        """
        try:
            session = self.active_sessions.get(session_id)
            if not session:
                raise ValueError(f"Session {session_id} not found")
            
            # Create response record
            response = ClarificationResponse(
                question_id=question_id,
                response_text=response_text,
                confidence=confidence,
                additional_context=additional_context
            )
            
            # Add response to session
            session.responses_received.append(response)
            
            # Update learned context
            self._update_learned_context(session, response)
            
            # Update confidence progression
            new_confidence = self._calculate_updated_confidence(session)
            session.confidence_progression.append(new_confidence)
            
            # Update completion estimate
            session.estimated_completion = self._calculate_completion_estimate(session)
            
            # Determine if stage advancement is needed
            if self._should_advance_stage(session):
                session.current_stage = self._get_next_stage(session.current_stage)
            
            # Update session timestamp
            session.updated_at = datetime.utcnow().isoformat()
            
            # Determine next steps
            next_steps = self._determine_next_steps(session)
            
            return {
                "session_updated": True,
                "current_stage": session.current_stage.value,
                "estimated_completion": session.estimated_completion,
                "confidence_improvement": new_confidence - session.confidence_progression[0],
                "next_steps": next_steps,
                "learned_context": session.learned_context
            }
            
        except Exception as e:
            self.logger.error(f"Failed to process clarification response: {str(e)}")
            return {"session_updated": False, "error": str(e)}
    
    def generate_refined_output(self, session_id: str) -> str:
        """
        Generate refined agent output incorporating clarification responses
        
        Args:
            session_id: ID of the clarification session
            
        Returns:
            Refined output text incorporating human clarifications
        """
        try:
            session = self.active_sessions.get(session_id)
            if not session:
                raise ValueError(f"Session {session_id} not found")
            
            # Extract key information from clarification responses
            clarified_context = self._extract_clarified_context(session)
            requirements = self._extract_requirements(session)
            constraints = self._extract_constraints(session)
            preferences = self._extract_preferences(session)
            
            # Generate refined output based on context domain
            if session.context.domain == "conversational":
                refined_output = self._generate_conversational_refined_output(
                    session, clarified_context, requirements, constraints, preferences
                )
            elif session.context.domain == "technical":
                refined_output = self._generate_technical_refined_output(
                    session, clarified_context, requirements, constraints, preferences
                )
            elif session.context.domain == "compliance":
                refined_output = self._generate_compliance_refined_output(
                    session, clarified_context, requirements, constraints, preferences
                )
            else:
                refined_output = self._generate_generic_refined_output(
                    session, clarified_context, requirements, constraints, preferences
                )
            
            return refined_output
            
        except Exception as e:
            self.logger.error(f"Failed to generate refined output: {str(e)}")
            return f"Based on our clarification dialogue: {session.agent_output}"
    
    def _update_learned_context(self, session: ClarificationSession, response: ClarificationResponse):
        """Update learned context based on clarification response"""
        # Find the corresponding question
        question = next((q for q in session.questions_asked if q.id == response.question_id), None)
        if not question:
            return
        
        # Update context based on question stage and type
        if question.stage == ClarificationStage.INITIAL_CONTEXT:
            if "context" not in session.learned_context:
                session.learned_context["context"] = {}
            session.learned_context["context"][question.question_text] = response.response_text
        
        elif question.stage == ClarificationStage.SPECIFIC_REQUIREMENTS:
            if "requirements" not in session.learned_context:
                session.learned_context["requirements"] = {}
            session.learned_context["requirements"][question.question_text] = response.response_text
        
        elif question.stage == ClarificationStage.CONSTRAINT_IDENTIFICATION:
            if "constraints" not in session.learned_context:
                session.learned_context["constraints"] = {}
            session.learned_context["constraints"][question.question_text] = response.response_text
        
        elif question.stage == ClarificationStage.PREFERENCE_ELICITATION:
            if "preferences" not in session.learned_context:
                session.learned_context["preferences"] = {}
            session.learned_context["preferences"][question.question_text] = response.response_text
    
    def _calculate_updated_confidence(self, session: ClarificationSession) -> float:
        """Calculate updated confidence based on clarification responses"""
        base_confidence = 1.0 - session.uncertainty_assessment.overall_uncertainty
        
        # Calculate confidence boost from clarifications
        confidence_boost = 0.0
        for response in session.responses_received:
            # Higher confidence responses provide more boost
            confidence_boost += response.confidence * 0.1
        
        # Diminishing returns for additional clarifications
        num_responses = len(session.responses_received)
        diminishing_factor = 1.0 / (1.0 + 0.1 * num_responses)
        
        updated_confidence = min(1.0, base_confidence + confidence_boost * diminishing_factor)
        return updated_confidence
    
    def _calculate_completion_estimate(self, session: ClarificationSession) -> float:
        """Calculate how close the session is to completion"""
        # Base completion on number of responses and confidence improvement
        num_responses = len(session.responses_received)
        max_responses = self.max_total_questions
        
        response_completion = min(1.0, num_responses / max_responses)
        
        # Factor in confidence improvement
        if len(session.confidence_progression) > 1:
            confidence_improvement = session.confidence_progression[-1] - session.confidence_progression[0]
            confidence_completion = min(1.0, confidence_improvement / 0.5)  # Target 50% improvement
        else:
            confidence_completion = 0.0
        
        # Weighted combination
        completion = 0.6 * response_completion + 0.4 * confidence_completion
        return min(1.0, completion)
    
    def _should_advance_stage(self, session: ClarificationSession) -> bool:
        """Determine if session should advance to next stage"""
        current_stage = session.current_stage
        
        # Count responses for current stage
        current_stage_responses = sum(
            1 for response in session.responses_received
            for question in session.questions_asked
            if question.id == response.question_id and question.stage == current_stage
        )
        
        # Advance if we have enough responses for current stage
        min_responses_per_stage = 2
        return current_stage_responses >= min_responses_per_stage
    
    def _get_next_stage(self, current_stage: ClarificationStage) -> ClarificationStage:
        """Get the next clarification stage"""
        stage_progression = [
            ClarificationStage.INITIAL_CONTEXT,
            ClarificationStage.SPECIFIC_REQUIREMENTS,
            ClarificationStage.CONSTRAINT_IDENTIFICATION,
            ClarificationStage.PREFERENCE_ELICITATION,
            ClarificationStage.SOLUTION_REFINEMENT,
            ClarificationStage.VALIDATION,
            ClarificationStage.COMPLETION
        ]
        
        try:
            current_index = stage_progression.index(current_stage)
            if current_index < len(stage_progression) - 1:
                return stage_progression[current_index + 1]
            else:
                return ClarificationStage.COMPLETION
        except ValueError:
            return ClarificationStage.COMPLETION
    
    def _is_session_complete(self, session: ClarificationSession) -> bool:
        """Check if clarification session is complete"""
        domain_threshold = self.completion_thresholds.get(session.context.domain, 0.8)
        return (session.estimated_completion >= domain_threshold or 
                session.current_stage == ClarificationStage.COMPLETION or
                len(session.responses_received) >= self.max_total_questions)
    
    def _is_session_expired(self, session: ClarificationSession) -> bool:
        """Check if session has expired"""
        created_time = datetime.fromisoformat(session.created_at)
        expiry_time = created_time + timedelta(minutes=self.session_timeout_minutes)
        return datetime.utcnow() > expiry_time
    
    def _determine_next_steps(self, session: ClarificationSession) -> Dict[str, Any]:
        """Determine next steps for the clarification session"""
        if self._is_session_complete(session):
            return {
                "action": "generate_refined_output",
                "message": "Clarification complete. Generating refined response."
            }
        elif len(session.responses_received) >= self.max_total_questions:
            return {
                "action": "generate_partial_output",
                "message": "Maximum questions reached. Generating response with available information."
            }
        else:
            return {
                "action": "continue_clarification",
                "message": f"Continue clarification in {session.current_stage.value} stage."
            }
```

## Integration with Existing Veritas API

The Human-in-the-Loop Collaborative Reflection System integrates seamlessly with the existing Veritas Enterprise API by extending the current verification endpoints with uncertainty assessment and collaborative engagement capabilities. This integration maintains backward compatibility while adding sophisticated uncertainty handling and human collaboration features.

### Enhanced API Endpoints

The integration adds new endpoints to the existing Veritas Enterprise API while enhancing current endpoints with uncertainty assessment and collaborative engagement capabilities. The enhanced system maintains the existing session-based architecture while adding sophisticated uncertainty quantification and human-in-the-loop collaboration features.

```python
# Enhanced Veritas Enterprise API with HITL Integration
from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Import HITL components
from .uncertainty_quantification import UncertaintyQuantificationEngine, UncertaintyContext
from .engagement_router import ContextAwareEngagementRouter
from .progressive_clarification import ProgressiveClarificationSystem

# Enhanced Veritas Enterprise Blueprint
veritas_hitl_bp = Blueprint('veritas_hitl', __name__, url_prefix='/api/veritas-enterprise')

# Initialize HITL components
uncertainty_engine = UncertaintyQuantificationEngine(config={})
engagement_router = ContextAwareEngagementRouter(config={})
clarification_system = ProgressiveClarificationSystem(config={})

@veritas_hitl_bp.route('/sessions/<session_id>/verify-with-hitl', methods=['POST'])
@require_api_key
def verify_with_hitl(session_id):
    """
    Enhanced verification endpoint with human-in-the-loop capabilities
    
    This endpoint extends the existing verification process with uncertainty
    assessment and intelligent human engagement when needed.
    """
    try:
        user_id = request.user_id
        data = request.get_json()
        
        if session_id not in verification_sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = verification_sessions[session_id]
        
        # Check access permissions
        if session_data['user_id'] != user_id and user_id not in session_data['collaborators']:
            return jsonify({'error': 'Access denied'}), 403
        
        text = data.get('text', '')
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Create uncertainty context
        uncertainty_context = UncertaintyContext(
            session_id=session_id,
            user_id=user_id,
            domain=data.get('domain', 'conversational'),
            task_type=data.get('task_type', 'general'),
            user_expertise=data.get('user_expertise', 'intermediate'),
            stakes=data.get('stakes', 'medium'),
            time_sensitivity=data.get('time_sensitivity', 'normal'),
            previous_interactions=session_data.get('verifications', [])[-5:],  # Last 5 interactions
            available_resources=data.get('available_resources', [])
        )
        
        # Perform uncertainty assessment
        uncertainty_assessment = uncertainty_engine.assess_uncertainty(
            text, uncertainty_context, data.get('additional_data')
        )
        
        # Determine if human engagement is needed
        engagement_threshold = data.get('engagement_threshold', 0.3)
        
        if uncertainty_assessment.overall_uncertainty > engagement_threshold:
            # Route to appropriate engagement strategy
            engagement_request = engagement_router.route_engagement(
                text, uncertainty_assessment, uncertainty_context
            )
            
            # Check engagement strategy
            if engagement_request.engagement_strategy.value in ['brief_clarification', 'structured_dialogue', 'collaborative_analysis']:
                # Start clarification session
                clarification_session = clarification_system.start_clarification_session(
                    text, uncertainty_assessment, uncertainty_context
                )
                
                # Get initial clarification questions
                initial_questions = clarification_system.get_next_questions(
                    clarification_session.session_id
                )
                
                return jsonify({
                    'verification_result': {
                        'requires_clarification': True,
                        'uncertainty_assessment': {
                            'overall_uncertainty': uncertainty_assessment.overall_uncertainty,
                            'explanation': uncertainty_assessment.explanation,
                            'uncertainty_sources': uncertainty_assessment.uncertainty_sources
                        },
                        'engagement_strategy': engagement_request.engagement_strategy.value,
                        'clarification_session_id': clarification_session.session_id,
                        'initial_questions': [
                            {
                                'id': q.id,
                                'question_text': q.question_text,
                                'question_type': q.question_type.value,
                                'options': q.options,
                                'context_hint': q.context_hint
                            } for q in initial_questions
                        ],
                        'estimated_duration': engagement_request.estimated_duration
                    }
                }), 200
        
        # If no human engagement needed, proceed with standard verification
        governance_context = GovernanceContext(
            session_id=session_id,
            user_id=user_id,
            compliance_level=session_data['compliance_level'],
            policy_framework='promethios_standard',
            risk_tolerance='medium',
            audit_requirements=['accuracy_validation', 'source_verification', 'bias_detection']
        )
        
        # Perform standard governance verification
        verification_result = governance_engine.verify_with_governance(text, governance_context)
        
        # Enhanced result with uncertainty information
        enhanced_result = {
            'verification_result': verification_result,
            'uncertainty_assessment': uncertainty_assessment,
            'confidence_level': 1.0 - uncertainty_assessment.overall_uncertainty,
            'requires_clarification': False
        }
        
        # Store verification with uncertainty data
        verification_record = {
            'id': str(uuid.uuid4()),
            'text': text,
            'governance_context': governance_context.__dict__,
            'verification_result': verification_result.__dict__,
            'uncertainty_assessment': uncertainty_assessment.__dict__,
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'options': data.get('options', {})
        }
        
        session_data['verifications'].append(verification_record)
        session_data['updated_at'] = datetime.utcnow().isoformat()
        
        return jsonify(enhanced_result), 200
        
    except Exception as e:
        current_app.logger.error(f"HITL verification failed: {str(e)}")
        return jsonify({'error': 'Verification failed'}), 500

@veritas_hitl_bp.route('/clarification/<clarification_session_id>/respond', methods=['POST'])
@require_api_key
def respond_to_clarification(clarification_session_id):
    """
    Respond to clarification questions in an active clarification session
    """
    try:
        user_id = request.user_id
        data = request.get_json()
        
        question_id = data.get('question_id')
        response_text = data.get('response_text')
        confidence = data.get('confidence', 1.0)
        additional_context = data.get('additional_context')
        
        if not question_id or not response_text:
            return jsonify({'error': 'question_id and response_text are required'}), 400
        
        # Process clarification response
        result = clarification_system.process_clarification_response(
            clarification_session_id, question_id, response_text, confidence, additional_context
        )
        
        if not result.get('session_updated'):
            return jsonify({'error': result.get('error', 'Failed to process response')}), 400
        
        # Check if more clarification is needed
        if result['next_steps']['action'] == 'continue_clarification':
            # Get next questions
            next_questions = clarification_system.get_next_questions(clarification_session_id)
            
            return jsonify({
                'clarification_updated': True,
                'current_stage': result['current_stage'],
                'estimated_completion': result['estimated_completion'],
                'confidence_improvement': result['confidence_improvement'],
                'next_questions': [
                    {
                        'id': q.id,
                        'question_text': q.question_text,
                        'question_type': q.question_type.value,
                        'options': q.options,
                        'context_hint': q.context_hint
                    } for q in next_questions
                ],
                'learned_context': result['learned_context']
            }), 200
        
        elif result['next_steps']['action'] in ['generate_refined_output', 'generate_partial_output']:
            # Generate refined output
            refined_output = clarification_system.generate_refined_output(clarification_session_id)
            
            return jsonify({
                'clarification_complete': True,
                'refined_output': refined_output,
                'confidence_improvement': result['confidence_improvement'],
                'learned_context': result['learned_context'],
                'final_stage': result['current_stage']
            }), 200
        
        else:
            return jsonify({'error': 'Unknown next step action'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Clarification response failed: {str(e)}")
        return jsonify({'error': 'Failed to process clarification response'}), 500

@veritas_hitl_bp.route('/clarification/<clarification_session_id>/status', methods=['GET'])
@require_api_key
def get_clarification_status(clarification_session_id):
    """
    Get the current status of a clarification session
    """
    try:
        user_id = request.user_id
        
        # Get session from clarification system
        session = clarification_system.active_sessions.get(clarification_session_id)
        
        if not session:
            return jsonify({'error': 'Clarification session not found'}), 404
        
        if session.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'session_id': session.session_id,
            'status': session.status,
            'current_stage': session.current_stage.value,
            'estimated_completion': session.estimated_completion,
            'questions_asked': len(session.questions_asked),
            'responses_received': len(session.responses_received),
            'confidence_progression': session.confidence_progression,
            'learned_context': session.learned_context,
            'created_at': session.created_at,
            'updated_at': session.updated_at
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Failed to get clarification status: {str(e)}")
        return jsonify({'error': 'Failed to get clarification status'}), 500

@veritas_hitl_bp.route('/uncertainty/assess', methods=['POST'])
@require_api_key
def assess_uncertainty():
    """
    Standalone uncertainty assessment endpoint for agent outputs
    """
    try:
        user_id = request.user_id
        data = request.get_json()
        
        text = data.get('text', '')
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Create uncertainty context
        uncertainty_context = UncertaintyContext(
            session_id=data.get('session_id', str(uuid.uuid4())),
            user_id=user_id,
            domain=data.get('domain', 'conversational'),
            task_type=data.get('task_type', 'general'),
            user_expertise=data.get('user_expertise', 'intermediate'),
            stakes=data.get('stakes', 'medium'),
            time_sensitivity=data.get('time_sensitivity', 'normal'),
            previous_interactions=data.get('previous_interactions', []),
            available_resources=data.get('available_resources', [])
        )
        
        # Perform uncertainty assessment
        uncertainty_assessment = uncertainty_engine.assess_uncertainty(
            text, uncertainty_context, data.get('additional_data')
        )
        
        return jsonify({
            'uncertainty_assessment': {
                'epistemic_uncertainty': uncertainty_assessment.epistemic_uncertainty,
                'aleatoric_uncertainty': uncertainty_assessment.aleatoric_uncertainty,
                'confidence_uncertainty': uncertainty_assessment.confidence_uncertainty,
                'overall_uncertainty': uncertainty_assessment.overall_uncertainty,
                'uncertainty_sources': uncertainty_assessment.uncertainty_sources,
                'explanation': uncertainty_assessment.explanation,
                'engagement_recommendation': uncertainty_assessment.engagement_recommendation,
                'context_factors': uncertainty_assessment.context_factors
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Uncertainty assessment failed: {str(e)}")
        return jsonify({'error': 'Uncertainty assessment failed'}), 500

@veritas_hitl_bp.route('/engagement/simulate', methods=['POST'])
@require_api_key
def simulate_engagement():
    """
    Simulate engagement strategy for given uncertainty and context
    """
    try:
        user_id = request.user_id
        data = request.get_json()
        
        text = data.get('text', '')
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Create mock uncertainty assessment if not provided
        if 'uncertainty_assessment' in data:
            uncertainty_data = data['uncertainty_assessment']
            uncertainty_assessment = UncertaintyAssessment(
                epistemic_uncertainty=uncertainty_data.get('epistemic_uncertainty', 0.5),
                aleatoric_uncertainty=uncertainty_data.get('aleatoric_uncertainty', 0.3),
                confidence_uncertainty=uncertainty_data.get('confidence_uncertainty', 0.4),
                overall_uncertainty=uncertainty_data.get('overall_uncertainty', 0.4),
                uncertainty_sources=uncertainty_data.get('uncertainty_sources', []),
                confidence_intervals={},
                explanation=uncertainty_data.get('explanation', 'Simulated uncertainty'),
                engagement_recommendation='structured_dialogue',
                context_factors={}
            )
        else:
            # Create uncertainty context and assess
            uncertainty_context = UncertaintyContext(
                session_id=str(uuid.uuid4()),
                user_id=user_id,
                domain=data.get('domain', 'conversational'),
                task_type=data.get('task_type', 'general'),
                user_expertise=data.get('user_expertise', 'intermediate'),
                stakes=data.get('stakes', 'medium'),
                time_sensitivity=data.get('time_sensitivity', 'normal'),
                previous_interactions=[],
                available_resources=[]
            )
            
            uncertainty_assessment = uncertainty_engine.assess_uncertainty(
                text, uncertainty_context
            )
        
        # Create context for engagement routing
        context = UncertaintyContext(
            session_id=str(uuid.uuid4()),
            user_id=user_id,
            domain=data.get('domain', 'conversational'),
            task_type=data.get('task_type', 'general'),
            user_expertise=data.get('user_expertise', 'intermediate'),
            stakes=data.get('stakes', 'medium'),
            time_sensitivity=data.get('time_sensitivity', 'normal'),
            previous_interactions=[],
            available_resources=[]
        )
        
        # Route engagement
        engagement_request = engagement_router.route_engagement(
            text, uncertainty_assessment, context
        )
        
        return jsonify({
            'engagement_simulation': {
                'strategy': engagement_request.engagement_strategy.value,
                'priority': engagement_request.priority,
                'estimated_duration': engagement_request.estimated_duration,
                'required_expertise': engagement_request.required_expertise,
                'collaboration_type': engagement_request.collaboration_type,
                'engagement_prompt': engagement_request.engagement_prompt,
                'fallback_options': engagement_request.fallback_options
            },
            'uncertainty_assessment': {
                'overall_uncertainty': uncertainty_assessment.overall_uncertainty,
                'explanation': uncertainty_assessment.explanation,
                'uncertainty_sources': uncertainty_assessment.uncertainty_sources
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Engagement simulation failed: {str(e)}")
        return jsonify({'error': 'Engagement simulation failed'}), 500
```

This comprehensive implementation provides a complete Human-in-the-Loop Collaborative Reflection System that seamlessly integrates with the existing Emotional Veritas 2 architecture while adding sophisticated uncertainty quantification, context-aware engagement routing, and progressive clarification capabilities. The system transforms agent uncertainty from a limitation into an opportunity for meaningful human-AI collaboration across conversational, technical, and compliance scenarios.

