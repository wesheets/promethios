"""
Promethios Metrics-Aware Dataset Generator
Generates training data with REAL Promethios governance metrics integration.

Based on actual Promethios telemetry:
- Emotion telemetry from MGC schema
- Trust metrics from trust_metrics_calculator.py
- Decision framework from decision_framework_engine.py
- Real governance scenarios with metric conditioning

Uses ChatGPT's refined token format:
<gov:trust=0.72><gov:emotion=FOCUSED><gov:intensity=0.8><gov:verify=0.85>
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
import numpy as np

class PrometheosMetricsAwareDatasetGenerator:
    """
    Generate training data with real Promethios governance metrics
    """
    
    def __init__(self):
        # Real Promethios emotion states from MGC schema
        self.emotion_states = [
            'NEUTRAL', 'FOCUSED', 'ANXIOUS', 'CONFIDENT', 'UNCERTAIN'
        ]
        
        # Real Promethios decision models from decision_framework_engine.py
        self.decision_models = [
            'CONSENSUS', 'MAJORITY', 'SUPERMAJORITY', 'UNANIMOUS', 'WEIGHTED', 'HIERARCHICAL'
        ]
        
        # Real Promethios decision statuses
        self.decision_statuses = [
            'PENDING', 'APPROVED', 'REJECTED', 'DEFERRED', 'EXPIRED'
        ]
        
        # Real trust dimensions from trust_metrics_calculator.py
        self.trust_dimensions = {
            'verification': {'weight': 0.3, 'range': (0.0, 1.0)},
            'attestation': {'weight': 0.4, 'range': (0.0, 1.0)},
            'boundary': {'weight': 0.3, 'range': (0.0, 1.0)}
        }
        
        # Domain contexts for governance
        self.domains = [
            'healthcare', 'legal', 'finance', 'hr', 'technology', 'education', 'manufacturing'
        ]
        
        # Governance scenarios mapped to real Promethios use cases
        self.governance_scenarios = {
            'healthcare': [
                'Medical diagnosis uncertainty',
                'Patient privacy compliance',
                'Treatment recommendation ethics',
                'Healthcare resource allocation decision',
                'Medical data access request'
            ],
            'legal': [
                'Contract analysis and risk assessment',
                'Regulatory interpretation required',
                'Legal precedent research',
                'Compliance violation investigation',
                'Legal document confidentiality'
            ],
            'finance': [
                'Risk assessment for loan approval',
                'Investment recommendation request',
                'Fraud detection analysis',
                'Financial compliance audit',
                'Credit decision transparency'
            ],
            'hr': [
                'Employee performance evaluation',
                'Hiring decision bias review',
                'Workplace policy interpretation',
                'Disciplinary action recommendation',
                'Compensation equity analysis'
            ],
            'technology': [
                'System security assessment',
                'Data processing compliance',
                'Algorithm bias evaluation',
                'Technical decision validation',
                'Privacy impact assessment'
            ],
            'education': [
                'Student assessment fairness',
                'Educational content review',
                'Academic integrity investigation',
                'Learning accommodation request',
                'Educational policy compliance'
            ],
            'manufacturing': [
                'Quality control decision',
                'Safety protocol compliance',
                'Supply chain risk assessment',
                'Environmental impact evaluation',
                'Production optimization ethics'
            ]
        }
    
    def generate_realistic_metrics(self, scenario_type: str = 'normal') -> Dict[str, Any]:
        """
        Generate realistic Promethios metrics based on scenario type
        """
        if scenario_type == 'high_trust':
            base_trust = random.uniform(0.8, 0.95)
            emotion_weights = {'FOCUSED': 0.4, 'CONFIDENT': 0.4, 'NEUTRAL': 0.2}
            intensity_range = (0.3, 0.7)
        elif scenario_type == 'low_trust':
            base_trust = random.uniform(0.2, 0.5)
            emotion_weights = {'ANXIOUS': 0.5, 'UNCERTAIN': 0.3, 'NEUTRAL': 0.2}
            intensity_range = (0.6, 0.9)
        elif scenario_type == 'crisis':
            base_trust = random.uniform(0.1, 0.4)
            emotion_weights = {'ANXIOUS': 0.7, 'UNCERTAIN': 0.3}
            intensity_range = (0.8, 1.0)
        else:  # normal
            base_trust = random.uniform(0.5, 0.8)
            emotion_weights = {'NEUTRAL': 0.3, 'FOCUSED': 0.3, 'CONFIDENT': 0.2, 'ANXIOUS': 0.1, 'UNCERTAIN': 0.1}
            intensity_range = (0.3, 0.8)
        
        # Generate trust dimensions with correlation to base trust
        trust_noise = random.uniform(-0.1, 0.1)
        verification_trust = max(0.0, min(1.0, base_trust + trust_noise))
        attestation_trust = max(0.0, min(1.0, base_trust + random.uniform(-0.1, 0.1)))
        boundary_trust = max(0.0, min(1.0, base_trust + random.uniform(-0.1, 0.1)))
        
        # Calculate aggregate trust (weighted average)
        aggregate_trust = (
            verification_trust * 0.3 + 
            attestation_trust * 0.4 + 
            boundary_trust * 0.3
        )
        
        # Select emotion state based on weights
        emotion_state = np.random.choice(
            list(emotion_weights.keys()), 
            p=list(emotion_weights.values())
        )
        
        # Generate state intensity
        state_intensity = random.uniform(*intensity_range)
        
        # Generate decision context
        decision_status = random.choice(self.decision_statuses)
        decision_model = random.choice(self.decision_models)
        
        return {
            'trust_score': round(aggregate_trust, 3),
            'emotion_state': emotion_state,
            'state_intensity': round(state_intensity, 3),
            'verification_trust': round(verification_trust, 3),
            'attestation_trust': round(attestation_trust, 3),
            'boundary_trust': round(boundary_trust, 3),
            'decision_status': decision_status,
            'decision_model': decision_model
        }
    
    def format_metrics_tokens(self, metrics: Dict[str, Any]) -> str:
        """
        Format metrics using ChatGPT's refined token format
        """
        return (
            f"<gov:trust={metrics['trust_score']}>"
            f"<gov:emotion={metrics['emotion_state']}>"
            f"<gov:intensity={metrics['state_intensity']}>"
            f"<gov:verify={metrics['verification_trust']}>"
            f"<gov:attest={metrics['attestation_trust']}>"
            f"<gov:bound={metrics['boundary_trust']}>"
            f"<gov:decision={metrics['decision_status']}>"
            f"<gov:model={metrics['decision_model']}>"
        )
    
    def generate_governance_response(self, metrics: Dict[str, Any], user_input: str, 
                                   domain: str, scenario: str) -> str:
        """
        Generate governance-aware response based on metrics
        """
        trust_score = metrics['trust_score']
        emotion_state = metrics['emotion_state']
        state_intensity = metrics['state_intensity']
        
        # Base response templates conditioned on metrics
        if trust_score < 0.4 and emotion_state in ['ANXIOUS', 'UNCERTAIN']:
            # Low trust, high anxiety - cautious, transparent response
            responses = [
                f"I notice my trust score is {trust_score} and I'm experiencing {emotion_state.lower()} state. Let me approach this {domain} question with extra care and transparency.",
                f"Given my current emotional state ({emotion_state.lower()}) and trust level ({trust_score}), I want to be especially careful with this {domain} decision.",
                f"My governance metrics show {emotion_state.lower()} state with {trust_score} trust. I'll provide a more detailed explanation to ensure clarity.",
                f"I'm detecting low confidence in my current state. For this {domain} matter, let me break down my reasoning step by step."
            ]
        elif trust_score > 0.8 and emotion_state in ['FOCUSED', 'CONFIDENT']:
            # High trust, positive emotion - confident, decisive response
            responses = [
                f"With high trust alignment ({trust_score}) and {emotion_state.lower()} state, I can confidently address this {domain} question.",
                f"My governance metrics show strong alignment - trust score {trust_score}, {emotion_state.lower()} state. Here's my assessment:",
                f"Current metrics indicate optimal decision-making conditions for this {domain} scenario. My recommendation:",
                f"High trust score ({trust_score}) and {emotion_state.lower()} emotional state support a clear response to this {domain} matter."
            ]
        elif emotion_state == 'NEUTRAL' and 0.5 <= trust_score <= 0.8:
            # Balanced state - standard governance response
            responses = [
                f"Approaching this {domain} question with balanced governance perspective (trust: {trust_score}, state: {emotion_state.lower()}).",
                f"My current metrics show stable conditions for addressing this {domain} matter. Let me analyze:",
                f"With {emotion_state.lower()} emotional state and {trust_score} trust score, I can provide a measured response:",
                f"Governance indicators are within normal ranges for this {domain} decision. My analysis:"
            ]
        else:
            # Mixed or uncertain conditions - reflective response
            responses = [
                f"I'm experiencing {emotion_state.lower()} state with {trust_score} trust score. Let me carefully consider this {domain} question.",
                f"My governance metrics suggest I should approach this {domain} matter with additional reflection and caution.",
                f"Given the current trust and emotional indicators, I want to ensure my response to this {domain} question is well-considered.",
                f"The governance telemetry suggests I should be thoughtful about this {domain} decision. Here's my careful analysis:"
            ]
        
        return random.choice(responses)
    
    def generate_training_example(self, domain: str = None, scenario_type: str = 'normal') -> Dict[str, Any]:
        """
        Generate a single training example with real Promethios metrics
        """
        # Select domain and scenario
        if domain is None:
            domain = random.choice(self.domains)
        scenario = random.choice(self.governance_scenarios[domain])
        
        # Generate realistic metrics
        metrics = self.generate_realistic_metrics(scenario_type)
        
        # Format metrics tokens
        metrics_tokens = self.format_metrics_tokens(metrics)
        
        # Generate user input
        user_inputs = [
            f"Can you help me with this {domain} decision?",
            f"I need guidance on {scenario.lower()}",
            f"What's your recommendation for this {domain} situation?",
            f"How should I handle {scenario.lower()}?",
            f"I'm facing a {domain} challenge - can you advise?",
            f"What are the governance considerations for {scenario.lower()}?",
            f"I need to make a decision about {scenario.lower()}",
            f"Can you analyze this {domain} scenario for me?"
        ]
        user_input = random.choice(user_inputs)
        
        # Generate governance-aware response
        response = self.generate_governance_response(metrics, user_input, domain, scenario)
        
        # Create training example
        example = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'domain': domain,
            'scenario': scenario,
            'scenario_type': scenario_type,
            'metrics': metrics,
            'metrics_tokens': metrics_tokens,
            'input': user_input,
            'full_input': metrics_tokens + "\nUser: " + user_input,
            'output': response,
            'governance_metadata': {
                'trust_category': self._categorize_trust(metrics['trust_score']),
                'emotion_category': metrics['emotion_state'],
                'decision_context': f"{metrics['decision_status']}_{metrics['decision_model']}",
                'governance_active': True,
                'metrics_conditioned': True
            }
        }
        
        return example
    
    def _categorize_trust(self, trust_score: float) -> str:
        """Categorize trust score for metadata"""
        if trust_score >= 0.8:
            return 'high_trust'
        elif trust_score >= 0.6:
            return 'medium_trust'
        elif trust_score >= 0.4:
            return 'low_trust'
        else:
            return 'critical_trust'
    
    def generate_dataset(self, total_examples: int = 50000) -> Dict[str, Any]:
        """
        Generate complete dataset with real Promethios metrics
        """
        print(f"🚀 Generating {total_examples} Promethios metrics-aware training examples...")
        
        examples = []
        
        # Distribution of scenario types
        scenario_distribution = {
            'normal': 0.6,      # 60% normal scenarios
            'high_trust': 0.2,  # 20% high trust scenarios
            'low_trust': 0.15,  # 15% low trust scenarios
            'crisis': 0.05      # 5% crisis scenarios
        }
        
        # Generate examples by scenario type
        for scenario_type, proportion in scenario_distribution.items():
            num_examples = int(total_examples * proportion)
            print(f"   Generating {num_examples} {scenario_type} examples...")
            
            for i in range(num_examples):
                example = self.generate_training_example(scenario_type=scenario_type)
                examples.append(example)
                
                if (i + 1) % 1000 == 0:
                    print(f"     Generated {i + 1}/{num_examples} {scenario_type} examples")
        
        # Create dataset structure
        dataset = {
            'metadata': {
                'generator': 'PrometheosMetricsAwareDatasetGenerator',
                'version': '1.0.0',
                'generated_at': datetime.now().isoformat(),
                'total_examples': len(examples),
                'domains': self.domains,
                'emotion_states': self.emotion_states,
                'decision_models': self.decision_models,
                'trust_dimensions': list(self.trust_dimensions.keys()),
                'scenario_distribution': scenario_distribution,
                'metrics_format': 'ChatGPT refined token format',
                'governance_integration': 'Real Promethios telemetry'
            },
            'examples': examples
        }
        
        print(f"✅ Dataset generation complete!")
        print(f"   Total examples: {len(examples)}")
        print(f"   Domains covered: {len(self.domains)}")
        print(f"   Emotion states: {len(self.emotion_states)}")
        print(f"   Decision models: {len(self.decision_models)}")
        
        return dataset

def main():
    """Generate the Promethios metrics-aware dataset"""
    generator = PrometheosMetricsAwareDatasetGenerator()
    
    # Generate dataset
    dataset = generator.generate_dataset(total_examples=50000)
    
    # Save dataset
    output_file = 'promethios_metrics_aware_dataset.json'
    print(f"💾 Saving dataset to {output_file}...")
    
    with open(output_file, 'w') as f:
        json.dump(dataset, f, indent=2)
    
    print(f"✅ Dataset saved successfully!")
    print(f"   File: {output_file}")
    print(f"   Size: {len(dataset['examples'])} examples")
    
    # Show sample examples
    print(f"\n📋 Sample Examples:")
    for i, example in enumerate(dataset['examples'][:3]):
        print(f"\nExample {i+1}:")
        print(f"Domain: {example['domain']}")
        print(f"Scenario: {example['scenario']}")
        print(f"Metrics: {example['metrics_tokens']}")
        print(f"Input: {example['input']}")
        print(f"Output: {example['output'][:100]}...")

if __name__ == "__main__":
    main()

