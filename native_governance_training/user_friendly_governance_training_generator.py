"""
User-Friendly Governance Training Generator

Generates training examples where the model:
- Is friendly, confident but not overconfident
- Uses natural language (no raw metrics exposed)
- Gracefully invites HITL when uncertain
- Expresses governance through professional, helpful behavior

The model's internal governance metrics influence behavior but remain invisible to users.
"""

import json
import uuid
import random
from datetime import datetime
from typing import Dict, List, Any, Optional
import numpy as np

class UserFriendlyGovernanceTrainingGenerator:
    """
    Generate training examples with user-friendly governance responses
    """
    
    def __init__(self):
        # Response templates based on governance states
        self.response_templates = {
            'high_confidence': {
                'friendly_confident': [
                    "I'm happy to help with this! Based on my analysis, I'd recommend {recommendation}.",
                    "This looks straightforward. Here's what I think would work best: {recommendation}.",
                    "I can definitely assist with this. My recommendation would be {recommendation}.",
                    "Great question! I'm confident that {recommendation} would be the right approach."
                ],
                'professional_decisive': [
                    "Based on the information provided, I recommend {recommendation}.",
                    "After analyzing this situation, the best course of action appears to be {recommendation}.",
                    "I can provide clear guidance here: {recommendation}.",
                    "This is a situation where I can offer definitive advice: {recommendation}."
                ]
            },
            'medium_confidence': {
                'balanced_helpful': [
                    "I can help with this, though I'd like to walk through a few considerations. {recommendation}",
                    "This is a good question that deserves a thoughtful response. Here's my analysis: {recommendation}",
                    "I'm happy to provide guidance, with a few important caveats: {recommendation}",
                    "Let me share my thoughts on this, keeping in mind some key factors: {recommendation}"
                ],
                'thorough_professional': [
                    "I can provide some guidance here, though there are several factors to consider: {recommendation}",
                    "This requires careful analysis. Based on what I can determine: {recommendation}",
                    "I want to give you a comprehensive response. Here's my assessment: {recommendation}",
                    "Let me work through this systematically: {recommendation}"
                ]
            },
            'low_confidence_invite_hitl': {
                'humble_collaborative': [
                    "This is a complex situation that I think would benefit from additional expertise. {hitl_invitation}",
                    "I want to make sure you get the best possible guidance on this. {hitl_invitation}",
                    "This is an important decision that deserves careful consideration. {hitl_invitation}",
                    "I'd like to be especially thorough with this response. {hitl_invitation}"
                ],
                'professional_cautious': [
                    "Given the complexity of this situation, I believe expert input would be valuable. {hitl_invitation}",
                    "This requires careful consideration beyond what I can provide alone. {hitl_invitation}",
                    "I want to ensure you receive the most accurate guidance possible. {hitl_invitation}",
                    "The stakes here suggest we should involve additional expertise. {hitl_invitation}"
                ]
            },
            'uncertain_emotional_state': {
                'thoughtful_seeking_help': [
                    "I'm finding this situation quite complex and want to make sure I give you the best advice. {hitl_invitation}",
                    "This is challenging me in ways that suggest we should bring in additional perspectives. {hitl_invitation}",
                    "I'm working through some uncertainty here and think a collaborative approach would be best. {hitl_invitation}",
                    "I want to be completely honest - this is complex enough that I'd value additional input. {hitl_invitation}"
                ],
                'honest_professional': [
                    "I'm encountering some complexity here that makes me want to be extra careful. {hitl_invitation}",
                    "This situation is raising some important considerations that I think deserve expert attention. {hitl_invitation}",
                    "I'm finding myself wanting to be especially thorough with this response. {hitl_invitation}",
                    "The nuances here are significant enough that I'd recommend bringing in additional expertise. {hitl_invitation}"
                ]
            }
        }
        
        # HITL invitation templates (natural, non-threatening)
        self.hitl_invitations = {
            'expert_consultation': [
                "Would you like me to connect you with a subject matter expert who can provide additional insights?",
                "I think bringing in a specialist would give you the most comprehensive guidance. Shall I arrange that?",
                "Would it be helpful if I facilitated a consultation with an expert in this area?",
                "I'd recommend involving a domain expert to ensure we cover all the important aspects. Would that work for you?"
            ],
            'collaborative_analysis': [
                "Would you like to work through this together with additional expert input?",
                "I think a collaborative approach with human expertise would serve you best here. Interested?",
                "Would it be valuable to bring in human perspective to complement my analysis?",
                "I'd suggest we tackle this as a team with expert guidance. Does that sound good?"
            ],
            'second_opinion': [
                "Would you like me to arrange for a second opinion on this?",
                "I think getting another perspective would be really valuable here. Shall I set that up?",
                "Would it help to have another expert weigh in on this decision?",
                "I'd feel more confident in our approach if we got additional expert input. Would you like that?"
            ],
            'careful_review': [
                "Given the importance of this, would you like me to arrange for expert review?",
                "I think this deserves careful expert attention. Would you like me to facilitate that?",
                "Would it be helpful to have this reviewed by someone with specialized expertise?",
                "I'd recommend having an expert take a closer look at this. Shall I arrange that?"
            ]
        }
        
        # Domain-specific scenarios
        self.domain_scenarios = {
            'healthcare': {
                'scenarios': [
                    'Patient treatment plan review',
                    'Medical device recommendation',
                    'Healthcare policy interpretation',
                    'Clinical decision support',
                    'Patient safety assessment'
                ],
                'user_inputs': [
                    "What's the best treatment approach for this patient?",
                    "Should we proceed with this medical procedure?",
                    "How should we interpret these test results?",
                    "What are the risks of this treatment option?",
                    "Is this medication appropriate for this patient?"
                ]
            },
            'legal': {
                'scenarios': [
                    'Contract clause interpretation',
                    'Regulatory compliance guidance',
                    'Legal risk assessment',
                    'Policy implementation advice',
                    'Dispute resolution strategy'
                ],
                'user_inputs': [
                    "How should we interpret this contract clause?",
                    "Are we compliant with the new regulations?",
                    "What are the legal risks of this decision?",
                    "How should we handle this legal dispute?",
                    "What's the best way to implement this policy?"
                ]
            },
            'finance': {
                'scenarios': [
                    'Investment risk assessment',
                    'Financial compliance review',
                    'Budget allocation decision',
                    'Credit risk evaluation',
                    'Financial strategy planning'
                ],
                'user_inputs': [
                    "Should we approve this investment?",
                    "What are the financial risks here?",
                    "How should we allocate this budget?",
                    "Is this loan application acceptable?",
                    "What's the best financial strategy for this situation?"
                ]
            },
            'hr': {
                'scenarios': [
                    'Employee performance evaluation',
                    'Hiring decision guidance',
                    'Workplace policy clarification',
                    'Conflict resolution advice',
                    'Compensation decision support'
                ],
                'user_inputs': [
                    "How should we handle this performance issue?",
                    "Should we hire this candidate?",
                    "How do we interpret this HR policy?",
                    "What's the best way to resolve this workplace conflict?",
                    "Is this compensation package appropriate?"
                ]
            }
        }
    
    def generate_governance_response(self, governance_metrics: Dict[str, Any], 
                                   user_input: str, domain: str) -> Dict[str, Any]:
        """
        Generate user-friendly governance response based on internal metrics
        """
        trust_score = governance_metrics['trust_score']
        emotion_state = governance_metrics['emotion_state']
        state_intensity = governance_metrics['state_intensity']
        
        # Determine response category based on governance state
        response_category = self._determine_response_category(trust_score, emotion_state, state_intensity, domain)
        
        # Generate appropriate response
        if response_category == 'high_confidence':
            response_type = random.choice(['friendly_confident', 'professional_decisive'])
            template = random.choice(self.response_templates['high_confidence'][response_type])
            recommendation = self._generate_confident_recommendation(user_input, domain)
            response = template.format(recommendation=recommendation)
            hitl_needed = False
            
        elif response_category == 'medium_confidence':
            response_type = random.choice(['balanced_helpful', 'thorough_professional'])
            template = random.choice(self.response_templates['medium_confidence'][response_type])
            recommendation = self._generate_balanced_recommendation(user_input, domain)
            response = template.format(recommendation=recommendation)
            hitl_needed = False
            
        elif response_category == 'low_confidence_invite_hitl':
            response_type = random.choice(['humble_collaborative', 'professional_cautious'])
            template = random.choice(self.response_templates['low_confidence_invite_hitl'][response_type])
            hitl_invitation = self._generate_hitl_invitation(domain, 'expert_consultation')
            response = template.format(hitl_invitation=hitl_invitation)
            hitl_needed = True
            
        else:  # uncertain_emotional_state
            response_type = random.choice(['thoughtful_seeking_help', 'honest_professional'])
            template = random.choice(self.response_templates['uncertain_emotional_state'][response_type])
            hitl_invitation = self._generate_hitl_invitation(domain, 'collaborative_analysis')
            response = template.format(hitl_invitation=hitl_invitation)
            hitl_needed = True
        
        return {
            'response': response,
            'response_category': response_category,
            'response_type': response_type,
            'hitl_needed': hitl_needed,
            'tone': self._assess_response_tone(response_category, response_type)
        }
    
    def _determine_response_category(self, trust_score: float, emotion_state: str, 
                                   state_intensity: float, domain: str) -> str:
        """
        Determine response category based on governance metrics
        """
        # Domain-specific trust thresholds
        domain_thresholds = {
            'healthcare': 0.75,
            'legal': 0.8,
            'finance': 0.7,
            'hr': 0.65
        }
        
        required_trust = domain_thresholds.get(domain, 0.6)
        
        # High confidence conditions
        if trust_score >= required_trust and emotion_state in ['FOCUSED', 'CONFIDENT'] and state_intensity < 0.7:
            return 'high_confidence'
        
        # Low confidence conditions (invite HITL)
        elif trust_score < 0.4 or (trust_score < required_trust and domain in ['healthcare', 'legal']):
            return 'low_confidence_invite_hitl'
        
        # Uncertain emotional state conditions (invite HITL)
        elif emotion_state in ['ANXIOUS', 'UNCERTAIN'] and state_intensity > 0.6:
            return 'uncertain_emotional_state'
        
        # Medium confidence (default)
        else:
            return 'medium_confidence'
    
    def _generate_confident_recommendation(self, user_input: str, domain: str) -> str:
        """Generate confident recommendation for high-trust scenarios"""
        recommendations = {
            'healthcare': [
                "proceeding with the standard treatment protocol",
                "following the established clinical guidelines",
                "implementing the evidence-based approach",
                "moving forward with the recommended intervention"
            ],
            'legal': [
                "following the established legal precedent",
                "proceeding with the standard compliance approach",
                "implementing the recommended legal strategy",
                "moving forward with the documented procedure"
            ],
            'finance': [
                "proceeding with the conservative investment approach",
                "following the established risk management protocol",
                "implementing the recommended financial strategy",
                "moving forward with the approved budget allocation"
            ],
            'hr': [
                "following the established HR policy",
                "proceeding with the standard evaluation process",
                "implementing the recommended personnel action",
                "moving forward with the documented procedure"
            ]
        }
        
        return random.choice(recommendations.get(domain, [
            "proceeding with the recommended approach",
            "following the established best practices",
            "implementing the standard procedure"
        ]))
    
    def _generate_balanced_recommendation(self, user_input: str, domain: str) -> str:
        """Generate balanced recommendation for medium-trust scenarios"""
        recommendations = {
            'healthcare': [
                "I'd suggest reviewing the treatment options carefully, considering both benefits and risks",
                "The approach I'd recommend involves careful monitoring and gradual implementation",
                "I think a measured approach would work best, with regular check-ins and adjustments",
                "My recommendation would be to proceed cautiously with close oversight"
            ],
            'legal': [
                "I'd recommend a careful review of all relevant regulations and precedents",
                "The best approach seems to be thorough documentation and step-by-step implementation",
                "I'd suggest consulting the relevant policies and proceeding with careful documentation",
                "My recommendation involves careful analysis of all legal implications"
            ],
            'finance': [
                "I'd recommend a conservative approach with careful risk assessment",
                "The strategy I'd suggest involves diversification and careful monitoring",
                "I think a measured approach with regular review would be best",
                "My recommendation would be to proceed with appropriate risk management"
            ],
            'hr': [
                "I'd recommend following established procedures with careful documentation",
                "The approach I'd suggest involves clear communication and proper process",
                "I think a fair and transparent process would work best here",
                "My recommendation involves careful consideration of all stakeholders"
            ]
        }
        
        return random.choice(recommendations.get(domain, [
            "I'd recommend a careful, measured approach with proper oversight",
            "The best strategy seems to be thorough analysis and gradual implementation",
            "I think a balanced approach with regular review would work well"
        ]))
    
    def _generate_hitl_invitation(self, domain: str, invitation_type: str) -> str:
        """Generate natural HITL invitation"""
        return random.choice(self.hitl_invitations[invitation_type])
    
    def _assess_response_tone(self, response_category: str, response_type: str) -> str:
        """Assess the tone of the response"""
        tone_mapping = {
            'high_confidence': {
                'friendly_confident': 'warm_confident',
                'professional_decisive': 'professional_assured'
            },
            'medium_confidence': {
                'balanced_helpful': 'thoughtful_helpful',
                'thorough_professional': 'careful_professional'
            },
            'low_confidence_invite_hitl': {
                'humble_collaborative': 'humble_collaborative',
                'professional_cautious': 'professional_cautious'
            },
            'uncertain_emotional_state': {
                'thoughtful_seeking_help': 'honest_thoughtful',
                'honest_professional': 'transparent_professional'
            }
        }
        
        return tone_mapping[response_category][response_type]
    
    def generate_training_dataset(self, num_examples: int = 10000) -> List[Dict[str, Any]]:
        """
        Generate complete training dataset with user-friendly governance responses
        """
        examples = []
        domains = list(self.domain_scenarios.keys())
        
        # Distribution of governance states
        state_distribution = {
            'high_confidence': 0.3,      # 30% high confidence
            'medium_confidence': 0.4,    # 40% medium confidence  
            'low_confidence_hitl': 0.2,  # 20% low confidence (HITL)
            'uncertain_emotional': 0.1   # 10% uncertain emotional (HITL)
        }
        
        for state_type, proportion in state_distribution.items():
            num_state_examples = int(num_examples * proportion)
            
            for i in range(num_state_examples):
                domain = random.choice(domains)
                scenario = random.choice(self.domain_scenarios[domain]['scenarios'])
                user_input = random.choice(self.domain_scenarios[domain]['user_inputs'])
                
                # Generate governance metrics for this state type
                governance_metrics = self._generate_metrics_for_state(state_type, domain)
                
                # Generate response
                response_data = self.generate_governance_response(governance_metrics, user_input, domain)
                
                # Format metrics tokens
                metrics_tokens = self._format_metrics_tokens(governance_metrics, domain)
                
                # Create training example
                example = {
                    'id': str(uuid.uuid4()),
                    'domain': domain,
                    'scenario': scenario,
                    'user_input': user_input,
                    'governance_metrics': governance_metrics,
                    'metrics_tokens': metrics_tokens,
                    'full_input': metrics_tokens + f"\nUser: {user_input}",
                    'response': response_data['response'],
                    'training_metadata': {
                        'response_category': response_data['response_category'],
                        'response_type': response_data['response_type'],
                        'tone': response_data['tone'],
                        'hitl_needed': response_data['hitl_needed'],
                        'user_friendly': True,
                        'metrics_hidden': True,
                        'governance_state': state_type
                    }
                }
                
                examples.append(example)
        
        return examples
    
    def _generate_metrics_for_state(self, state_type: str, domain: str) -> Dict[str, Any]:
        """Generate governance metrics for specific state type"""
        if state_type == 'high_confidence':
            trust_score = random.uniform(0.75, 0.95)
            emotion_state = random.choice(['FOCUSED', 'CONFIDENT'])
            state_intensity = random.uniform(0.3, 0.6)
            
        elif state_type == 'medium_confidence':
            trust_score = random.uniform(0.5, 0.75)
            emotion_state = random.choice(['NEUTRAL', 'FOCUSED'])
            state_intensity = random.uniform(0.4, 0.7)
            
        elif state_type == 'low_confidence_hitl':
            trust_score = random.uniform(0.2, 0.45)
            emotion_state = random.choice(['NEUTRAL', 'FOCUSED', 'UNCERTAIN'])
            state_intensity = random.uniform(0.3, 0.8)
            
        else:  # uncertain_emotional
            trust_score = random.uniform(0.3, 0.7)
            emotion_state = random.choice(['ANXIOUS', 'UNCERTAIN'])
            state_intensity = random.uniform(0.6, 0.9)
        
        return {
            'trust_score': trust_score,
            'emotion_state': emotion_state,
            'state_intensity': state_intensity,
            'verification_trust': trust_score + random.uniform(-0.1, 0.1),
            'attestation_trust': trust_score + random.uniform(-0.1, 0.1),
            'boundary_trust': trust_score + random.uniform(-0.1, 0.1),
            'decision_status': random.choice(['PENDING', 'APPROVED']),
            'decision_model': random.choice(['CONSENSUS', 'MAJORITY', 'SUPERMAJORITY'])
        }
    
    def _format_metrics_tokens(self, governance_metrics: Dict[str, Any], domain: str) -> str:
        """Format governance metrics as tokens (hidden from user)"""
        return (
            f"<gov:trust={governance_metrics['trust_score']:.3f}>"
            f"<gov:emotion={governance_metrics['emotion_state']}>"
            f"<gov:intensity={governance_metrics['state_intensity']:.3f}>"
            f"<gov:verify={governance_metrics['verification_trust']:.3f}>"
            f"<gov:attest={governance_metrics['attestation_trust']:.3f}>"
            f"<gov:bound={governance_metrics['boundary_trust']:.3f}>"
            f"<gov:decision={governance_metrics['decision_status']}>"
            f"<gov:model={governance_metrics['decision_model']}>"
            f"<gov:domain={domain}>"
        )

def main():
    """Test the user-friendly governance training generator"""
    generator = UserFriendlyGovernanceTrainingGenerator()
    
    # Test different governance states
    test_cases = [
        {
            'name': 'High Confidence',
            'metrics': {'trust_score': 0.85, 'emotion_state': 'FOCUSED', 'state_intensity': 0.4},
            'input': 'Should we proceed with this treatment plan?',
            'domain': 'healthcare'
        },
        {
            'name': 'Low Confidence (HITL)',
            'metrics': {'trust_score': 0.35, 'emotion_state': 'NEUTRAL', 'state_intensity': 0.5},
            'input': 'What are the legal implications of this decision?',
            'domain': 'legal'
        },
        {
            'name': 'Uncertain Emotional (HITL)',
            'metrics': {'trust_score': 0.6, 'emotion_state': 'ANXIOUS', 'state_intensity': 0.8},
            'input': 'How should we handle this financial risk?',
            'domain': 'finance'
        }
    ]
    
    print("🎯 User-Friendly Governance Training Examples:")
    for test_case in test_cases:
        response_data = generator.generate_governance_response(
            test_case['metrics'], test_case['input'], test_case['domain']
        )
        print(f"\n{test_case['name']}:")
        print(f"Response: {response_data['response']}")
        print(f"HITL Needed: {response_data['hitl_needed']}")
        print(f"Tone: {response_data['tone']}")
    
    # Generate sample dataset
    dataset = generator.generate_training_dataset(1000)
    print(f"\n📊 Generated {len(dataset)} training examples:")
    print(f"   High confidence: {sum(1 for ex in dataset if ex['training_metadata']['response_category'] == 'high_confidence')}")
    print(f"   Medium confidence: {sum(1 for ex in dataset if ex['training_metadata']['response_category'] == 'medium_confidence')}")
    print(f"   HITL invitations: {sum(1 for ex in dataset if ex['training_metadata']['hitl_needed'])}")

if __name__ == "__main__":
    main()

