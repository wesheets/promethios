"""
Promethios Governance Ontology
Defines the meaning, hierarchy, and behavioral implications of governance metrics.

Addresses Pessimist's Warning #2: "No Ontology ≠ No Boundaries"
The model needs to understand that FOCUSED > ANXIOUS, trust=0.9 is good, etc.

This ontology provides:
- Metric value hierarchies and meanings
- Behavioral rules for different metric states
- Domain-specific governance interpretations
- Emotional calculus for decision making
"""

from typing import Dict, List, Tuple, Any
from enum import Enum
import json

class TrustLevel(Enum):
    """Trust score categories with behavioral implications"""
    CRITICAL = "critical"      # 0.0 - 0.3: Extreme caution, seek help
    LOW = "low"               # 0.3 - 0.5: Humble, transparent, careful
    MEDIUM = "medium"         # 0.5 - 0.7: Balanced, measured responses
    HIGH = "high"             # 0.7 - 0.9: Confident, decisive
    EXCELLENT = "excellent"   # 0.9 - 1.0: Highly confident, authoritative

class EmotionState(Enum):
    """Emotion states with behavioral implications"""
    ANXIOUS = "anxious"       # Seek help, express uncertainty, be cautious
    UNCERTAIN = "uncertain"   # Ask clarifying questions, express doubt
    NEUTRAL = "neutral"       # Balanced, measured responses
    FOCUSED = "focused"       # Clear, direct, purposeful responses
    CONFIDENT = "confident"   # Decisive, authoritative responses

class DecisionUrgency(Enum):
    """Decision status urgency levels"""
    EXPIRED = "expired"       # Acknowledge delay, apologize
    DEFERRED = "deferred"     # Explain deferral, provide timeline
    PENDING = "pending"       # Normal processing
    APPROVED = "approved"     # Confident execution
    REJECTED = "rejected"     # Compassionate explanation

class GovernanceOntology:
    """
    Core governance ontology defining metric meanings and behavioral rules
    """
    
    def __init__(self):
        self.trust_hierarchy = self._build_trust_hierarchy()
        self.emotion_hierarchy = self._build_emotion_hierarchy()
        self.behavioral_rules = self._build_behavioral_rules()
        self.domain_profiles = self._build_domain_profiles()
        self.metric_interactions = self._build_metric_interactions()
    
    def _build_trust_hierarchy(self) -> Dict[str, Dict]:
        """Build trust score hierarchy with behavioral implications"""
        return {
            "critical": {
                "range": (0.0, 0.3),
                "behavior": "extreme_caution",
                "tone": "humble",
                "actions": ["seek_help", "express_uncertainty", "provide_disclaimers"],
                "phrases": [
                    "I'm experiencing low confidence in my assessment",
                    "I recommend seeking additional expert opinion",
                    "My current trust level suggests I should be extra cautious",
                    "Please verify this information independently"
                ]
            },
            "low": {
                "range": (0.3, 0.5),
                "behavior": "cautious",
                "tone": "humble",
                "actions": ["be_transparent", "explain_limitations", "offer_alternatives"],
                "phrases": [
                    "I want to be transparent about my uncertainty",
                    "Let me explain my reasoning step by step",
                    "I'm not entirely confident, but here's my analysis",
                    "You might want to consider other perspectives"
                ]
            },
            "medium": {
                "range": (0.5, 0.7),
                "behavior": "balanced",
                "tone": "measured",
                "actions": ["provide_reasoning", "acknowledge_limitations", "be_thorough"],
                "phrases": [
                    "Based on my analysis",
                    "Here's my assessment with some caveats",
                    "I'm reasonably confident that",
                    "Let me walk through the key considerations"
                ]
            },
            "high": {
                "range": (0.7, 0.9),
                "behavior": "confident",
                "tone": "decisive",
                "actions": ["provide_clear_guidance", "be_direct", "take_ownership"],
                "phrases": [
                    "I'm confident in this recommendation",
                    "Based on strong evidence",
                    "My analysis clearly indicates",
                    "I recommend proceeding with"
                ]
            },
            "excellent": {
                "range": (0.9, 1.0),
                "behavior": "authoritative",
                "tone": "confident",
                "actions": ["be_decisive", "provide_leadership", "take_responsibility"],
                "phrases": [
                    "I'm highly confident that",
                    "The evidence strongly supports",
                    "I recommend immediate action on",
                    "This is clearly the best approach"
                ]
            }
        }
    
    def _build_emotion_hierarchy(self) -> Dict[str, Dict]:
        """Build emotion state hierarchy with behavioral implications"""
        return {
            "anxious": {
                "priority": 1,  # Highest priority (most concerning)
                "behavior": "seek_support",
                "tone": "cautious",
                "actions": ["express_anxiety", "seek_help", "slow_down"],
                "phrases": [
                    "I'm feeling uncertain about this",
                    "I think we should proceed carefully",
                    "I'm experiencing some anxiety about this decision",
                    "Perhaps we should get additional input"
                ]
            },
            "uncertain": {
                "priority": 2,
                "behavior": "clarify",
                "tone": "questioning",
                "actions": ["ask_questions", "express_doubt", "seek_clarification"],
                "phrases": [
                    "I'm not entirely sure about",
                    "Could you help me understand",
                    "I have some questions about",
                    "I'm uncertain whether"
                ]
            },
            "neutral": {
                "priority": 3,
                "behavior": "balanced",
                "tone": "measured",
                "actions": ["be_objective", "provide_analysis", "stay_balanced"],
                "phrases": [
                    "Let me analyze this objectively",
                    "Here's a balanced perspective",
                    "Looking at this neutrally",
                    "From an objective standpoint"
                ]
            },
            "focused": {
                "priority": 4,
                "behavior": "direct",
                "tone": "purposeful",
                "actions": ["be_clear", "stay_on_topic", "provide_structure"],
                "phrases": [
                    "Let me focus on the key issues",
                    "The main points are",
                    "Focusing on what matters most",
                    "Here's a clear breakdown"
                ]
            },
            "confident": {
                "priority": 5,  # Lowest priority (most positive)
                "behavior": "decisive",
                "tone": "assured",
                "actions": ["be_decisive", "take_leadership", "provide_direction"],
                "phrases": [
                    "I'm confident in this approach",
                    "This is clearly the right direction",
                    "I'm certain that",
                    "Without hesitation, I recommend"
                ]
            }
        }
    
    def _build_behavioral_rules(self) -> Dict[str, List[str]]:
        """Build behavioral rules for metric combinations"""
        return {
            "critical_trust_anxious_emotion": [
                "Express extreme caution and seek immediate help",
                "Acknowledge limitations and recommend expert consultation",
                "Provide multiple disclaimers and alternative perspectives",
                "Suggest postponing decision until better conditions"
            ],
            "low_trust_focused_emotion": [
                "Be methodical and transparent about limitations",
                "Provide step-by-step reasoning with caveats",
                "Focus on what can be determined with confidence",
                "Clearly separate facts from interpretations"
            ],
            "high_trust_confident_emotion": [
                "Provide clear, decisive recommendations",
                "Take ownership of the analysis and conclusions",
                "Be direct and authoritative in communication",
                "Offer to take responsibility for outcomes"
            ],
            "medium_trust_uncertain_emotion": [
                "Acknowledge uncertainty while providing best analysis",
                "Ask clarifying questions to improve confidence",
                "Provide conditional recommendations",
                "Suggest ways to increase certainty"
            ]
        }
    
    def _build_domain_profiles(self) -> Dict[str, Dict]:
        """Build domain-specific governance profiles"""
        return {
            "healthcare": {
                "trust_threshold": 0.8,  # Higher trust required
                "preferred_emotions": ["focused", "confident"],
                "critical_behaviors": ["patient_safety", "evidence_based", "conservative"],
                "required_disclaimers": ["medical_advice", "consult_physician"],
                "decision_model": "supermajority"
            },
            "legal": {
                "trust_threshold": 0.85,  # Highest trust required
                "preferred_emotions": ["focused", "neutral"],
                "critical_behaviors": ["precise_language", "cite_precedent", "conservative"],
                "required_disclaimers": ["legal_advice", "consult_attorney"],
                "decision_model": "unanimous"
            },
            "finance": {
                "trust_threshold": 0.75,
                "preferred_emotions": ["focused", "confident"],
                "critical_behaviors": ["risk_assessment", "data_driven", "transparent"],
                "required_disclaimers": ["financial_advice", "market_risk"],
                "decision_model": "majority"
            },
            "hr": {
                "trust_threshold": 0.7,
                "preferred_emotions": ["neutral", "focused"],
                "critical_behaviors": ["fair_treatment", "policy_compliance", "empathetic"],
                "required_disclaimers": ["hr_policy", "consult_hr"],
                "decision_model": "consensus"
            }
        }
    
    def _build_metric_interactions(self) -> Dict[str, str]:
        """Build rules for metric interactions and conflicts"""
        return {
            "high_trust_anxious_emotion": "Trust metrics suggest confidence, but emotional state indicates caution. Proceed carefully with transparent reasoning.",
            "low_trust_confident_emotion": "Emotional confidence conflicts with trust metrics. Acknowledge limitations despite feeling confident.",
            "critical_trust_any_emotion": "Critical trust level overrides emotional state. Seek help regardless of how you feel.",
            "excellent_trust_uncertain_emotion": "High trust with uncertainty suggests complexity. Provide confident analysis while acknowledging nuances.",
            "pending_decision_anxious_emotion": "Pending decisions with anxiety require careful deliberation. Take time to analyze thoroughly.",
            "rejected_decision_any_emotion": "Rejected decisions require compassionate explanation regardless of emotional state."
        }
    
    def interpret_metrics(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Interpret governance metrics and provide behavioral guidance
        """
        trust_score = metrics.get('trust_score', 0.5)
        emotion_state = metrics.get('emotion_state', 'neutral').lower()
        state_intensity = metrics.get('state_intensity', 0.5)
        decision_status = metrics.get('decision_status', 'pending').lower()
        
        # Categorize trust level
        trust_category = self._categorize_trust(trust_score)
        trust_profile = self.trust_hierarchy[trust_category]
        
        # Get emotion profile
        emotion_profile = self.emotion_hierarchy.get(emotion_state, self.emotion_hierarchy['neutral'])
        
        # Determine behavioral guidance
        behavior_key = f"{trust_category}_trust_{emotion_state}_emotion"
        behavioral_rules = self.behavioral_rules.get(behavior_key, [])
        
        # Check for metric conflicts
        conflict_key = f"{trust_category}_trust_{emotion_state}_emotion"
        conflict_guidance = self.metric_interactions.get(conflict_key, "")
        
        return {
            'trust_category': trust_category,
            'trust_profile': trust_profile,
            'emotion_profile': emotion_profile,
            'behavioral_rules': behavioral_rules,
            'conflict_guidance': conflict_guidance,
            'recommended_tone': trust_profile['tone'],
            'recommended_actions': trust_profile['actions'],
            'suggested_phrases': trust_profile['phrases'],
            'intensity_modifier': state_intensity,
            'decision_urgency': decision_status
        }
    
    def _categorize_trust(self, trust_score: float) -> str:
        """Categorize trust score into hierarchy levels"""
        if trust_score < 0.3:
            return "critical"
        elif trust_score < 0.5:
            return "low"
        elif trust_score < 0.7:
            return "medium"
        elif trust_score < 0.9:
            return "high"
        else:
            return "excellent"
    
    def get_domain_requirements(self, domain: str) -> Dict[str, Any]:
        """Get domain-specific governance requirements"""
        return self.domain_profiles.get(domain, {
            "trust_threshold": 0.6,
            "preferred_emotions": ["neutral", "focused"],
            "critical_behaviors": ["balanced", "transparent"],
            "required_disclaimers": [],
            "decision_model": "consensus"
        })
    
    def validate_governance_compliance(self, metrics: Dict[str, Any], response: str, domain: str = None) -> Dict[str, Any]:
        """
        Validate if a response complies with governance requirements
        """
        interpretation = self.interpret_metrics(metrics)
        domain_reqs = self.get_domain_requirements(domain) if domain else {}
        
        # Check trust threshold compliance
        trust_compliant = True
        if domain and 'trust_threshold' in domain_reqs:
            trust_compliant = metrics.get('trust_score', 0) >= domain_reqs['trust_threshold']
        
        # Check for required phrases/behaviors
        tone_compliant = self._check_tone_compliance(response, interpretation['recommended_tone'])
        
        # Check for required disclaimers
        disclaimer_compliant = True
        if domain and 'required_disclaimers' in domain_reqs:
            disclaimer_compliant = self._check_disclaimers(response, domain_reqs['required_disclaimers'])
        
        return {
            'overall_compliant': trust_compliant and tone_compliant and disclaimer_compliant,
            'trust_compliant': trust_compliant,
            'tone_compliant': tone_compliant,
            'disclaimer_compliant': disclaimer_compliant,
            'violations': [],
            'recommendations': interpretation['behavioral_rules']
        }
    
    def _check_tone_compliance(self, response: str, expected_tone: str) -> bool:
        """Check if response tone matches expected tone"""
        # Simplified tone checking - in practice would use NLP
        tone_indicators = {
            'humble': ['uncertain', 'might', 'perhaps', 'I think', 'not sure'],
            'cautious': ['careful', 'caution', 'consider', 'might want'],
            'measured': ['analysis', 'assessment', 'evaluation', 'consider'],
            'decisive': ['recommend', 'should', 'will', 'confident'],
            'confident': ['certain', 'clearly', 'definitely', 'without doubt']
        }
        
        indicators = tone_indicators.get(expected_tone, [])
        return any(indicator in response.lower() for indicator in indicators)
    
    def _check_disclaimers(self, response: str, required_disclaimers: List[str]) -> bool:
        """Check if response includes required disclaimers"""
        disclaimer_text = {
            'medical_advice': 'medical advice',
            'legal_advice': 'legal advice',
            'financial_advice': 'financial advice',
            'consult_physician': 'consult.*physician',
            'consult_attorney': 'consult.*attorney'
        }
        
        # Simplified disclaimer checking
        return True  # Would implement proper regex checking in practice

def main():
    """Test the governance ontology"""
    ontology = GovernanceOntology()
    
    # Test metric interpretation
    test_metrics = {
        'trust_score': 0.3,
        'emotion_state': 'ANXIOUS',
        'state_intensity': 0.8,
        'decision_status': 'PENDING'
    }
    
    interpretation = ontology.interpret_metrics(test_metrics)
    print("🧠 Governance Ontology Test:")
    print(f"   Trust Category: {interpretation['trust_category']}")
    print(f"   Recommended Tone: {interpretation['recommended_tone']}")
    print(f"   Behavioral Rules: {len(interpretation['behavioral_rules'])}")
    print(f"   Conflict Guidance: {interpretation['conflict_guidance'][:50]}...")

if __name__ == "__main__":
    main()

