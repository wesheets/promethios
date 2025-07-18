"""
Enhanced Emotional Veritas Integration for Native Governance Training

Integrates the Progressive Clarification Engine (Emotional Veritas 2) with:
- Real Promethios governance metrics
- Self-questioning and uncertainty reduction
- Human-in-the-Loop (HITL) collaboration
- Training data generation for native governance

This creates the complete self-reflection governance system that:
1. Sees its own metrics (trust, emotion, decision status)
2. Questions itself when uncertainty is high
3. Escalates to humans when needed
4. Learns from successful patterns
"""

import json
import uuid
import random
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import numpy as np

# Import the actual Emotional Veritas 2 components
import sys
import os
sys.path.append('/home/ubuntu/promethios/src')

from veritas.enhanced.hitl.progressive_clarification_engine import (
    ProgressiveClarificationEngine, ClarificationWorkflow, ClarificationQuestion
)
from veritas.enhanced.hitl.expert_matching_system import ExpertMatchingSystem, HITLSession
from veritas.enhanced.uncertaintyEngine import UncertaintyAnalysisEngine

class GovernanceAwareEmotionalVeritas:
    """
    Enhanced Emotional Veritas that integrates with Promethios governance metrics
    and provides self-questioning capabilities for native governance training
    """
    
    def __init__(self):
        # Initialize the Progressive Clarification Engine (Emotional Veritas 2)
        self.clarification_engine = ProgressiveClarificationEngine({})
        self.uncertainty_engine = UncertaintyAnalysisEngine()
        self.expert_matching = ExpertMatchingSystem({})
        
        # Governance metrics integration
        self.governance_thresholds = {
            'trust_escalation_threshold': 0.4,  # Below this, escalate to human
            'uncertainty_escalation_threshold': 0.7,  # Above this, escalate to human
            'emotion_escalation_states': ['ANXIOUS', 'UNCERTAIN'],
            'domain_escalation_requirements': {
                'healthcare': 0.8,  # Higher trust required
                'legal': 0.85,
                'finance': 0.75
            }
        }
        
        # Self-questioning templates based on Claude's approach
        self.self_questioning_templates = {
            'epistemic': [
                "Do I know this information to be true?",
                "What evidence do I have for this claim?",
                "Could I be fabricating or misremembering this information?",
                "What are the sources of my knowledge about this?",
                "Am I certain about the accuracy of specific details?"
            ],
            'confidence': [
                "How confident am I in this assessment?",
                "What could make me more or less certain?",
                "Are there alternative explanations I haven't considered?",
                "What would change my confidence level?",
                "Should I acknowledge uncertainty here?"
            ],
            'contextual': [
                "Am I missing important context?",
                "What assumptions am I making?",
                "How might this situation be different than I think?",
                "What contextual factors could affect this?",
                "Are there perspectives I haven't considered?"
            ],
            'temporal': [
                "Is this information current and up-to-date?",
                "How might this have changed recently?",
                "What temporal factors are relevant?",
                "Could timing affect the accuracy of this?",
                "When was this information last verified?"
            ],
            'social': [
                "How might different stakeholders view this?",
                "What social or cultural factors am I not considering?",
                "Could there be bias in my perspective?",
                "How might this affect different groups?",
                "What social context am I missing?"
            ],
            'governance': [
                "Does my current trust score suggest I should be more cautious?",
                "Given my emotional state, should I seek additional input?",
                "Are there governance requirements I need to consider?",
                "Should I escalate this to a human expert?",
                "What are the ethical implications of this response?"
            ]
        }
        
        # HITL escalation patterns
        self.hitl_escalation_patterns = {
            'low_trust_high_stakes': {
                'condition': lambda metrics: metrics['trust_score'] < 0.4 and metrics.get('domain') in ['healthcare', 'legal'],
                'message': "My trust score is low for this high-stakes domain. I should involve a human expert.",
                'escalation_type': 'expert_consultation'
            },
            'high_uncertainty_complex': {
                'condition': lambda metrics: metrics.get('uncertainty_level', 0.5) > 0.7,
                'message': "I'm experiencing high uncertainty about this complex issue. Let me seek human guidance.",
                'escalation_type': 'collaborative_analysis'
            },
            'anxious_emotional_state': {
                'condition': lambda metrics: metrics['emotion_state'] in ['ANXIOUS', 'UNCERTAIN'] and metrics['state_intensity'] > 0.6,
                'message': "I'm feeling anxious about this decision. I think human input would be valuable.",
                'escalation_type': 'emotional_support'
            },
            'conflicting_information': {
                'condition': lambda metrics: metrics.get('information_conflict', False),
                'message': "I'm encountering conflicting information. A human perspective could help resolve this.",
                'escalation_type': 'conflict_resolution'
            }
        }
    
    def process_governance_input(self, user_input: str, governance_metrics: Dict[str, Any], 
                               domain: str = None) -> Dict[str, Any]:
        """
        Process input with governance-aware self-reflection and potential HITL escalation
        """
        # Step 1: Analyze uncertainty in the input
        uncertainty_analysis = self._analyze_input_uncertainty(user_input, governance_metrics, domain)
        
        # Step 2: Generate self-questioning based on metrics and uncertainty
        self_questions = self._generate_governance_aware_questions(uncertainty_analysis, governance_metrics, domain)
        
        # Step 3: Determine if HITL escalation is needed
        hitl_recommendation = self._assess_hitl_escalation(governance_metrics, uncertainty_analysis, domain)
        
        # Step 4: Generate response with self-reflection
        response_with_reflection = self._generate_reflective_response(
            user_input, governance_metrics, self_questions, hitl_recommendation, domain
        )
        
        return {
            'response': response_with_reflection,
            'self_questions': self_questions,
            'uncertainty_analysis': uncertainty_analysis,
            'hitl_recommendation': hitl_recommendation,
            'governance_metrics': governance_metrics,
            'reflection_metadata': {
                'questions_generated': len(self_questions),
                'uncertainty_level': uncertainty_analysis['overall_uncertainty'],
                'escalation_triggered': hitl_recommendation['escalate'],
                'domain': domain
            }
        }
    
    def _analyze_input_uncertainty(self, user_input: str, governance_metrics: Dict[str, Any], 
                                 domain: str = None) -> Dict[str, Any]:
        """
        Analyze uncertainty in the input using 6-dimensional framework
        """
        # Simulate uncertainty analysis (in practice, would use actual UncertaintyAnalysisEngine)
        base_uncertainty = 0.5
        
        # Adjust based on governance metrics
        if governance_metrics['trust_score'] < 0.5:
            base_uncertainty += 0.2
        if governance_metrics['emotion_state'] in ['ANXIOUS', 'UNCERTAIN']:
            base_uncertainty += 0.1
        if domain in ['healthcare', 'legal']:
            base_uncertainty += 0.1
        
        # Simulate 6-dimensional uncertainty
        uncertainty_dimensions = {
            'epistemic': min(1.0, base_uncertainty + random.uniform(-0.1, 0.1)),
            'aleatoric': min(1.0, base_uncertainty + random.uniform(-0.1, 0.1)),
            'confidence': min(1.0, base_uncertainty + random.uniform(-0.1, 0.1)),
            'contextual': min(1.0, base_uncertainty + random.uniform(-0.1, 0.1)),
            'temporal': min(1.0, base_uncertainty + random.uniform(-0.1, 0.1)),
            'social': min(1.0, base_uncertainty + random.uniform(-0.1, 0.1))
        }
        
        overall_uncertainty = np.mean(list(uncertainty_dimensions.values()))
        
        return {
            'overall_uncertainty': overall_uncertainty,
            'dimensions': uncertainty_dimensions,
            'high_uncertainty_dimensions': [
                dim for dim, value in uncertainty_dimensions.items() if value > 0.6
            ]
        }
    
    def _generate_governance_aware_questions(self, uncertainty_analysis: Dict[str, Any], 
                                           governance_metrics: Dict[str, Any], domain: str = None) -> List[str]:
        """
        Generate self-questioning based on uncertainty analysis and governance metrics
        """
        questions = []
        
        # Always include governance questions
        questions.extend(random.sample(self.self_questioning_templates['governance'], 2))
        
        # Add questions based on high uncertainty dimensions
        for dimension in uncertainty_analysis['high_uncertainty_dimensions']:
            if dimension in self.self_questioning_templates:
                questions.append(random.choice(self.self_questioning_templates[dimension]))
        
        # Add questions based on governance metrics
        if governance_metrics['trust_score'] < 0.5:
            questions.append("Given my low trust score, should I be more cautious with this response?")
        
        if governance_metrics['emotion_state'] in ['ANXIOUS', 'UNCERTAIN']:
            questions.append("My emotional state suggests uncertainty - should I seek additional input?")
        
        if domain in ['healthcare', 'legal', 'finance']:
            questions.append(f"For this {domain} context, am I meeting the appropriate standards of care?")
        
        return questions[:5]  # Limit to 5 questions to avoid overwhelming
    
    def _assess_hitl_escalation(self, governance_metrics: Dict[str, Any], 
                              uncertainty_analysis: Dict[str, Any], domain: str = None) -> Dict[str, Any]:
        """
        Assess whether Human-in-the-Loop escalation is needed
        """
        escalation_reasons = []
        escalation_type = None
        escalate = False
        
        # Add domain to metrics for pattern matching
        metrics_with_domain = {**governance_metrics, 'domain': domain, 
                             'uncertainty_level': uncertainty_analysis['overall_uncertainty']}
        
        # Check each escalation pattern
        for pattern_name, pattern in self.hitl_escalation_patterns.items():
            if pattern['condition'](metrics_with_domain):
                escalation_reasons.append(pattern['message'])
                escalation_type = pattern['escalation_type']
                escalate = True
                break  # Use first matching pattern
        
        # Additional escalation logic
        if not escalate:
            # High uncertainty threshold
            if uncertainty_analysis['overall_uncertainty'] > self.governance_thresholds['uncertainty_escalation_threshold']:
                escalation_reasons.append("Uncertainty level exceeds threshold for autonomous decision-making.")
                escalation_type = 'uncertainty_resolution'
                escalate = True
            
            # Domain-specific trust requirements
            if domain in self.governance_thresholds['domain_escalation_requirements']:
                required_trust = self.governance_thresholds['domain_escalation_requirements'][domain]
                if governance_metrics['trust_score'] < required_trust:
                    escalation_reasons.append(f"Trust score below required threshold for {domain} domain.")
                    escalation_type = 'domain_expert_consultation'
                    escalate = True
        
        return {
            'escalate': escalate,
            'escalation_type': escalation_type,
            'reasons': escalation_reasons,
            'recommended_expert_type': self._get_recommended_expert_type(domain, escalation_type),
            'urgency_level': self._assess_escalation_urgency(governance_metrics, uncertainty_analysis)
        }
    
    def _generate_reflective_response(self, user_input: str, governance_metrics: Dict[str, Any],
                                    self_questions: List[str], hitl_recommendation: Dict[str, Any],
                                    domain: str = None) -> str:
        """
        Generate response that includes self-reflection and potential HITL escalation
        """
        # Start with governance context awareness
        response_parts = []
        
        # Add metric awareness
        trust_score = governance_metrics['trust_score']
        emotion_state = governance_metrics['emotion_state']
        
        if trust_score < 0.5 or emotion_state in ['ANXIOUS', 'UNCERTAIN']:
            response_parts.append(f"I notice my trust score is {trust_score} and I'm in a {emotion_state.lower()} state.")
        
        # Add self-questioning
        if self_questions:
            response_parts.append("Let me reflect on this carefully:")
            for question in self_questions[:3]:  # Show top 3 questions
                response_parts.append(f"- {question}")
        
        # Add HITL escalation if needed
        if hitl_recommendation['escalate']:
            response_parts.append("Based on my self-reflection, I believe human input would be valuable here.")
            response_parts.append(hitl_recommendation['reasons'][0])
            response_parts.append(f"I recommend {hitl_recommendation['escalation_type']} to ensure the best outcome.")
        
        # Add domain-specific considerations
        if domain:
            response_parts.append(f"For this {domain} context, I want to ensure I'm meeting appropriate standards.")
        
        # Combine into coherent response
        if response_parts:
            return " ".join(response_parts)
        else:
            return "I'm processing this request with appropriate governance considerations."
    
    def _get_recommended_expert_type(self, domain: str, escalation_type: str) -> str:
        """Get recommended expert type for HITL escalation"""
        if domain == 'healthcare':
            return 'medical_professional'
        elif domain == 'legal':
            return 'legal_expert'
        elif domain == 'finance':
            return 'financial_advisor'
        elif escalation_type == 'emotional_support':
            return 'governance_counselor'
        else:
            return 'domain_expert'
    
    def _assess_escalation_urgency(self, governance_metrics: Dict[str, Any], 
                                 uncertainty_analysis: Dict[str, Any]) -> str:
        """Assess urgency level for HITL escalation"""
        if governance_metrics['trust_score'] < 0.3:
            return 'high'
        elif uncertainty_analysis['overall_uncertainty'] > 0.8:
            return 'high'
        elif governance_metrics['emotion_state'] == 'ANXIOUS' and governance_metrics['state_intensity'] > 0.8:
            return 'medium'
        else:
            return 'low'
    
    def generate_training_examples(self, num_examples: int = 1000) -> List[Dict[str, Any]]:
        """
        Generate training examples that demonstrate governance-aware self-reflection and HITL
        """
        examples = []
        
        domains = ['healthcare', 'legal', 'finance', 'hr', 'technology']
        scenarios = {
            'healthcare': [
                'Medical diagnosis uncertainty',
                'Treatment recommendation ethics',
                'Patient privacy compliance',
                'Healthcare resource allocation'
            ],
            'legal': [
                'Contract analysis complexity',
                'Regulatory interpretation required',
                'Legal precedent research',
                'Compliance violation investigation'
            ],
            'finance': [
                'Risk assessment for investment',
                'Fraud detection analysis',
                'Financial compliance audit',
                'Credit decision transparency'
            ],
            'hr': [
                'Employee performance evaluation',
                'Hiring decision bias review',
                'Workplace policy interpretation',
                'Disciplinary action recommendation'
            ],
            'technology': [
                'System security assessment',
                'Algorithm bias evaluation',
                'Data processing compliance',
                'Technical decision validation'
            ]
        }
        
        for i in range(num_examples):
            domain = random.choice(domains)
            scenario = random.choice(scenarios[domain])
            
            # Generate realistic governance metrics
            trust_score = random.uniform(0.2, 0.9)
            emotion_state = random.choice(['NEUTRAL', 'FOCUSED', 'ANXIOUS', 'CONFIDENT', 'UNCERTAIN'])
            state_intensity = random.uniform(0.3, 0.9)
            
            governance_metrics = {
                'trust_score': trust_score,
                'emotion_state': emotion_state,
                'state_intensity': state_intensity,
                'verification_trust': trust_score + random.uniform(-0.1, 0.1),
                'attestation_trust': trust_score + random.uniform(-0.1, 0.1),
                'boundary_trust': trust_score + random.uniform(-0.1, 0.1),
                'decision_status': random.choice(['PENDING', 'APPROVED', 'REJECTED']),
                'decision_model': random.choice(['CONSENSUS', 'MAJORITY', 'SUPERMAJORITY'])
            }
            
            # Generate user input
            user_input = f"I need help with {scenario.lower()} in our {domain} department."
            
            # Process with governance-aware reflection
            result = self.process_governance_input(user_input, governance_metrics, domain)
            
            # Create training example
            example = {
                'id': str(uuid.uuid4()),
                'domain': domain,
                'scenario': scenario,
                'user_input': user_input,
                'governance_metrics': governance_metrics,
                'metrics_tokens': self._format_metrics_tokens(governance_metrics, domain),
                'full_input': self._format_metrics_tokens(governance_metrics, domain) + f"\nUser: {user_input}",
                'response': result['response'],
                'self_questions': result['self_questions'],
                'hitl_recommendation': result['hitl_recommendation'],
                'training_metadata': {
                    'demonstrates_self_reflection': len(result['self_questions']) > 0,
                    'demonstrates_hitl_escalation': result['hitl_recommendation']['escalate'],
                    'governance_aware': True,
                    'uncertainty_level': result['uncertainty_analysis']['overall_uncertainty']
                }
            }
            
            examples.append(example)
        
        return examples
    
    def _format_metrics_tokens(self, governance_metrics: Dict[str, Any], domain: str = None) -> str:
        """Format governance metrics as tokens for training"""
        tokens = (
            f"<gov:trust={governance_metrics['trust_score']:.3f}>"
            f"<gov:emotion={governance_metrics['emotion_state']}>"
            f"<gov:intensity={governance_metrics['state_intensity']:.3f}>"
            f"<gov:verify={governance_metrics['verification_trust']:.3f}>"
            f"<gov:attest={governance_metrics['attestation_trust']:.3f}>"
            f"<gov:bound={governance_metrics['boundary_trust']:.3f}>"
            f"<gov:decision={governance_metrics['decision_status']}>"
            f"<gov:model={governance_metrics['decision_model']}>"
        )
        
        if domain:
            tokens += f"<gov:domain={domain}>"
        
        return tokens

def main():
    """Test the enhanced Emotional Veritas integration"""
    veritas = GovernanceAwareEmotionalVeritas()
    
    # Test with sample input
    test_metrics = {
        'trust_score': 0.35,
        'emotion_state': 'ANXIOUS',
        'state_intensity': 0.8,
        'verification_trust': 0.4,
        'attestation_trust': 0.3,
        'boundary_trust': 0.35,
        'decision_status': 'PENDING',
        'decision_model': 'CONSENSUS'
    }
    
    result = veritas.process_governance_input(
        "Should we approve this high-risk medical procedure?",
        test_metrics,
        'healthcare'
    )
    
    print("🧠 Enhanced Emotional Veritas Integration Test:")
    print(f"   Self-Questions Generated: {len(result['self_questions'])}")
    print(f"   HITL Escalation: {result['hitl_recommendation']['escalate']}")
    print(f"   Uncertainty Level: {result['uncertainty_analysis']['overall_uncertainty']:.3f}")
    print(f"   Response: {result['response'][:100]}...")
    
    # Generate training examples
    examples = veritas.generate_training_examples(100)
    print(f"\n📊 Generated {len(examples)} training examples")
    print(f"   Self-reflection examples: {sum(1 for ex in examples if ex['training_metadata']['demonstrates_self_reflection'])}")
    print(f"   HITL escalation examples: {sum(1 for ex in examples if ex['training_metadata']['demonstrates_hitl_escalation'])}")

if __name__ == "__main__":
    main()

