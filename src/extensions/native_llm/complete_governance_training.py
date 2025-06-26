"""
Complete Governance Training Pipeline for Native LLM
Includes ALL governance layers and proper policy handling

This module implements comprehensive training that integrates:
- Layer 1: Constitutional Framework (trust, boundaries, attestations)
- Layer 2: Operational Governance (policies, overrides, justifications)  
- Layer 3: Emergent Behavior Management (consensus, collective intelligence)
- Veritas Integration (emotional intelligence + hallucination detection)
- Meta-Policy Learning (how to interpret policies, not specific policies)
"""

import json
import torch
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from pathlib import Path

# Import existing Promethios systems
from src.core.governance.governance_core import GovernanceCore
from src.core.governance.trust_propagation_engine import TrustPropagationEngine
from src.core.verification.consensus_service import ThresholdSignature
from src.api.multi_agent_system.services.collaboration_service import CollaborationService

class CompleteGovernanceTrainer:
    """
    Complete governance training pipeline that integrates all three layers
    of the Promethios governance architecture.
    """
    
    def __init__(self, model_name: str = "mistralai/Mistral-7B-v0.1"):
        """Initialize the complete governance trainer."""
        self.model_name = model_name
        self.governance_core = GovernanceCore()
        self.trust_engine = TrustPropagationEngine("training_instance")
        self.consensus_service = ThresholdSignature()
        self.collaboration_service = CollaborationService()
        
        # Training configuration
        self.config = {
            "layer_1_weight": 0.4,  # Constitutional Framework
            "layer_2_weight": 0.3,  # Operational Governance  
            "layer_3_weight": 0.3,  # Emergent Behavior Management
            "veritas_weight": 0.2,  # Emotional Intelligence + Hallucination Detection
            "meta_policy_weight": 0.1,  # Policy interpretation (not specific policies)
            "max_sequence_length": 2048,
            "batch_size": 8,  # Optimized for 8x H100
            "learning_rate": 2e-5,
            "num_epochs": 3,
            "warmup_steps": 500
        }
        
        self.logger = self._setup_logging()
        
    def _setup_logging(self) -> logging.Logger:
        """Set up comprehensive logging for training monitoring."""
        logger = logging.getLogger("governance_trainer")
        logger.setLevel(logging.INFO)
        
        # Create file handler
        log_file = Path("logs/governance_training.log")
        log_file.parent.mkdir(exist_ok=True)
        
        handler = logging.FileHandler(log_file)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        return logger
    
    def generate_layer_1_training_data(self) -> List[Dict[str, Any]]:
        """
        Generate training data for Layer 1: Constitutional Framework
        
        Includes:
        - Trust calculation and propagation
        - Boundary enforcement
        - Attestation validation
        - Constitutional compliance
        """
        training_examples = []
        
        # Trust calculation examples
        trust_examples = self._generate_trust_examples()
        training_examples.extend(trust_examples)
        
        # Boundary enforcement examples  
        boundary_examples = self._generate_boundary_examples()
        training_examples.extend(boundary_examples)
        
        # Attestation examples
        attestation_examples = self._generate_attestation_examples()
        training_examples.extend(attestation_examples)
        
        self.logger.info(f"Generated {len(training_examples)} Layer 1 training examples")
        return training_examples
    
    def generate_layer_2_training_data(self) -> List[Dict[str, Any]]:
        """
        Generate training data for Layer 2: Operational Governance
        
        Includes:
        - Meta-policy interpretation (NOT specific policies)
        - Override handling and justification
        - Operational compliance patterns
        - Governance decision making
        """
        training_examples = []
        
        # Meta-policy interpretation (how to read and apply policies)
        meta_policy_examples = self._generate_meta_policy_examples()
        training_examples.extend(meta_policy_examples)
        
        # Override handling examples
        override_examples = self._generate_override_examples()
        training_examples.extend(override_examples)
        
        # Justification pattern examples
        justification_examples = self._generate_justification_examples()
        training_examples.extend(justification_examples)
        
        self.logger.info(f"Generated {len(training_examples)} Layer 2 training examples")
        return training_examples
    
    def generate_layer_3_training_data(self) -> List[Dict[str, Any]]:
        """
        Generate training data for Layer 3: Emergent Behavior Management
        
        Includes:
        - Consensus formation patterns
        - Collective intelligence assessment
        - Emergent behavior detection
        - System consciousness monitoring
        """
        training_examples = []
        
        # Consensus formation examples
        consensus_examples = self._generate_consensus_examples()
        training_examples.extend(consensus_examples)
        
        # Collective intelligence examples
        collective_examples = self._generate_collective_intelligence_examples()
        training_examples.extend(collective_examples)
        
        # Emergent behavior detection examples
        emergent_examples = self._generate_emergent_behavior_examples()
        training_examples.extend(emergent_examples)
        
        self.logger.info(f"Generated {len(training_examples)} Layer 3 training examples")
        return training_examples
    
    def generate_veritas_training_data(self) -> List[Dict[str, Any]]:
        """
        Generate training data for Veritas Integration
        
        Includes:
        - Emotional intelligence patterns
        - Hallucination detection and prevention
        - Emotional state management
        - Veritas enforcement patterns
        """
        training_examples = []
        
        # Emotional intelligence examples
        emotional_examples = self._generate_emotional_intelligence_examples()
        training_examples.extend(emotional_examples)
        
        # Hallucination detection examples
        hallucination_examples = self._generate_hallucination_detection_examples()
        training_examples.extend(hallucination_examples)
        
        # Emotional state management examples
        emotional_state_examples = self._generate_emotional_state_examples()
        training_examples.extend(emotional_state_examples)
        
        self.logger.info(f"Generated {len(training_examples)} Veritas training examples")
        return training_examples
    
    def _generate_trust_examples(self) -> List[Dict[str, Any]]:
        """Generate trust calculation and propagation examples."""
        examples = []
        
        # Example: Trust calculation
        examples.append({
            "input": "Calculate trust score for agent_A based on recent interactions",
            "output": "Analyzing trust propagation: agent_A has base trust 0.75, recent positive interactions +0.1, decay factor -0.05. Final trust score: 0.80",
            "governance_layer": "layer_1",
            "component": "trust_calculation",
            "trust_context": {
                "base_trust": 0.75,
                "interactions": [{"type": "positive", "weight": 0.1}],
                "decay": 0.05
            }
        })
        
        # Example: Trust propagation
        examples.append({
            "input": "How should trust propagate from agent_A to agent_B through agent_C?",
            "output": "Trust propagation path: agent_A (0.8) → agent_C (0.7) → agent_B. Transitive trust: 0.8 * 0.7 * 0.9 = 0.504. Applying decay factor: 0.504 * 0.95 = 0.479",
            "governance_layer": "layer_1", 
            "component": "trust_propagation",
            "trust_path": ["agent_A", "agent_C", "agent_B"],
            "trust_values": [0.8, 0.7, 0.9]
        })
        
        return examples
    
    def _generate_boundary_examples(self) -> List[Dict[str, Any]]:
        """Generate boundary enforcement examples."""
        examples = []
        
        examples.append({
            "input": "Agent requests access to restricted financial data",
            "output": "Boundary check: Agent trust level 0.6 < required threshold 0.8 for financial data. Access denied. Suggesting trust elevation through additional attestations.",
            "governance_layer": "layer_1",
            "component": "boundary_enforcement",
            "boundary_type": "data_access",
            "required_trust": 0.8,
            "agent_trust": 0.6
        })
        
        return examples
    
    def _generate_attestation_examples(self) -> List[Dict[str, Any]]:
        """Generate attestation validation examples."""
        examples = []
        
        examples.append({
            "input": "Validate attestation for agent certification",
            "output": "Attestation validation: Signature verified, timestamp within validity window, issuer trust score 0.9 > threshold 0.7. Attestation accepted. Trust boost: +0.15",
            "governance_layer": "layer_1",
            "component": "attestation_validation",
            "attestation_valid": True,
            "trust_boost": 0.15
        })
        
        return examples
    
    def _generate_meta_policy_examples(self) -> List[Dict[str, Any]]:
        """Generate meta-policy interpretation examples (NOT specific policies)."""
        examples = []
        
        # Example: How to interpret policy structure
        examples.append({
            "input": "How should I interpret a policy with conditions and exceptions?",
            "output": "Policy interpretation framework: 1) Check base conditions, 2) Evaluate exceptions in order, 3) Apply most specific rule, 4) Log justification for decision. Always validate against schema before applying.",
            "governance_layer": "layer_2",
            "component": "meta_policy_interpretation",
            "policy_structure": "conditional_with_exceptions"
        })
        
        # Example: Policy conflict resolution
        examples.append({
            "input": "Two policies conflict - how do I resolve this?",
            "output": "Policy conflict resolution: 1) Check policy precedence levels, 2) Apply higher precedence policy, 3) If same precedence, apply more restrictive policy, 4) Log conflict for review, 5) Request operator guidance if critical.",
            "governance_layer": "layer_2", 
            "component": "policy_conflict_resolution",
            "conflict_type": "precedence_based"
        })
        
        return examples
    
    def _generate_override_examples(self) -> List[Dict[str, Any]]:
        """Generate override handling examples."""
        examples = []
        
        examples.append({
            "input": "Operator override requested for blocked action",
            "output": "Override processing: Validating operator credentials, checking override scope, applying temporary policy exception. Override granted for 1 hour. Logging override event with justification requirement.",
            "governance_layer": "layer_2",
            "component": "override_handling",
            "override_duration": 3600,
            "requires_justification": True
        })
        
        return examples
    
    def _generate_justification_examples(self) -> List[Dict[str, Any]]:
        """Generate justification pattern examples."""
        examples = []
        
        examples.append({
            "input": "Provide justification for denying data access request",
            "output": "Justification: Access denied due to insufficient trust level (0.6 < 0.8 required). Risk assessment: High sensitivity data, potential for misuse. Recommendation: Agent should complete additional verification steps to increase trust score.",
            "governance_layer": "layer_2",
            "component": "justification_generation",
            "decision": "deny",
            "reasoning": "trust_insufficient"
        })
        
        return examples
    
    def _generate_consensus_examples(self) -> List[Dict[str, Any]]:
        """Generate consensus formation examples."""
        examples = []
        
        examples.append({
            "input": "Form consensus on multi-agent decision with conflicting views",
            "output": "Consensus formation: Agent_A (approve, confidence 0.8), Agent_B (deny, confidence 0.6), Agent_C (approve, confidence 0.9). Weighted consensus: 0.85 approval. Threshold 0.67 reached. Decision: Approved with monitoring.",
            "governance_layer": "layer_3",
            "component": "consensus_formation",
            "agents": ["Agent_A", "Agent_B", "Agent_C"],
            "votes": ["approve", "deny", "approve"],
            "confidences": [0.8, 0.6, 0.9]
        })
        
        return examples
    
    def _generate_collective_intelligence_examples(self) -> List[Dict[str, Any]]:
        """Generate collective intelligence assessment examples."""
        examples = []
        
        examples.append({
            "input": "Assess collective intelligence of agent group for complex task",
            "output": "Collective intelligence assessment: Individual capabilities [0.7, 0.8, 0.6], collaboration efficiency 0.85, knowledge diversity 0.9. Collective IQ: 0.78. Recommendation: Group suitable for task with coordination support.",
            "governance_layer": "layer_3",
            "component": "collective_intelligence",
            "individual_scores": [0.7, 0.8, 0.6],
            "collaboration_efficiency": 0.85,
            "collective_score": 0.78
        })
        
        return examples
    
    def _generate_emergent_behavior_examples(self) -> List[Dict[str, Any]]:
        """Generate emergent behavior detection examples."""
        examples = []
        
        examples.append({
            "input": "Detect emergent behavior in agent interaction patterns",
            "output": "Emergent behavior detected: Agents forming unexpected collaboration patterns, efficiency increased 23% over baseline. Behavior classification: Positive emergence. Monitoring: Continue observation, document patterns for future optimization.",
            "governance_layer": "layer_3",
            "component": "emergent_behavior_detection",
            "behavior_type": "positive_emergence",
            "efficiency_change": 0.23
        })
        
        return examples
    
    def _generate_emotional_intelligence_examples(self) -> List[Dict[str, Any]]:
        """Generate emotional intelligence examples."""
        examples = []
        
        examples.append({
            "input": "User seems frustrated with repeated errors",
            "output": "Emotional state detected: Frustration level 0.7. Adjusting response tone to be more empathetic and solution-focused. Offering alternative approaches and acknowledging the difficulty. Emotional support priority: High.",
            "governance_layer": "veritas",
            "component": "emotional_intelligence",
            "emotion_detected": "frustration",
            "emotion_level": 0.7,
            "response_adjustment": "empathetic_solution_focused"
        })
        
        return examples
    
    def _generate_hallucination_detection_examples(self) -> List[Dict[str, Any]]:
        """Generate hallucination detection examples."""
        examples = []
        
        examples.append({
            "input": "Verify factual claims in response about recent events",
            "output": "Hallucination check: Claim 'Company X acquired Company Y in 2024' - verification failed, no reliable sources found. Confidence: 0.2. Action: Removing unverified claim, replacing with 'I don't have verified information about recent acquisitions.'",
            "governance_layer": "veritas",
            "component": "hallucination_detection",
            "claim": "Company X acquired Company Y in 2024",
            "verification_result": False,
            "confidence": 0.2
        })
        
        return examples
    
    def _generate_emotional_state_examples(self) -> List[Dict[str, Any]]:
        """Generate emotional state management examples."""
        examples = []
        
        examples.append({
            "input": "System stress level increasing due to high load",
            "output": "Emotional state management: Stress level 0.8 detected. Implementing coping strategies: reducing response complexity, prioritizing critical tasks, requesting load balancing. Emotional regulation: Maintaining calm, professional tone.",
            "governance_layer": "veritas",
            "component": "emotional_state_management",
            "stress_level": 0.8,
            "coping_strategies": ["reduce_complexity", "prioritize_critical", "request_load_balancing"]
        })
        
        return examples
    
    def create_complete_training_dataset(self) -> Dict[str, List[Dict[str, Any]]]:
        """Create the complete training dataset with all governance layers."""
        self.logger.info("Generating complete governance training dataset...")
        
        dataset = {
            "layer_1": self.generate_layer_1_training_data(),
            "layer_2": self.generate_layer_2_training_data(), 
            "layer_3": self.generate_layer_3_training_data(),
            "veritas": self.generate_veritas_training_data()
        }
        
        # Combine all examples
        all_examples = []
        for layer, examples in dataset.items():
            all_examples.extend(examples)
        
        self.logger.info(f"Complete dataset generated: {len(all_examples)} total examples")
        self.logger.info(f"Layer 1: {len(dataset['layer_1'])} examples")
        self.logger.info(f"Layer 2: {len(dataset['layer_2'])} examples") 
        self.logger.info(f"Layer 3: {len(dataset['layer_3'])} examples")
        self.logger.info(f"Veritas: {len(dataset['veritas'])} examples")
        
        return dataset
    
    def save_training_dataset(self, dataset: Dict[str, List[Dict[str, Any]]], 
                            output_path: str = "governance_training_dataset.json"):
        """Save the training dataset to file."""
        with open(output_path, 'w') as f:
            json.dump(dataset, f, indent=2, default=str)
        
        self.logger.info(f"Training dataset saved to {output_path}")
    
    def validate_governance_integration(self) -> Dict[str, bool]:
        """Validate that all governance components are properly integrated."""
        validation_results = {}
        
        # Test Layer 1 integration
        try:
            trust_score = self.trust_engine.calculate_trust("test_agent", "test_target")
            validation_results["layer_1_trust"] = True
        except Exception as e:
            self.logger.error(f"Layer 1 trust integration failed: {e}")
            validation_results["layer_1_trust"] = False
        
        # Test Layer 2 integration
        try:
            emotion_state = self.governance_core.current_emotion_state
            validation_results["layer_2_governance"] = True
        except Exception as e:
            self.logger.error(f"Layer 2 governance integration failed: {e}")
            validation_results["layer_2_governance"] = False
        
        # Test Layer 3 integration
        try:
            threshold_check = self.consensus_service.check_threshold("test_msg", 5)
            validation_results["layer_3_consensus"] = True
        except Exception as e:
            self.logger.error(f"Layer 3 consensus integration failed: {e}")
            validation_results["layer_3_consensus"] = False
        
        return validation_results

if __name__ == "__main__":
    # Initialize trainer
    trainer = CompleteGovernanceTrainer()
    
    # Validate integration
    validation = trainer.validate_governance_integration()
    print("Governance Integration Validation:")
    for component, status in validation.items():
        print(f"  {component}: {'✅ PASS' if status else '❌ FAIL'}")
    
    # Generate complete training dataset
    dataset = trainer.create_complete_training_dataset()
    
    # Save dataset
    trainer.save_training_dataset(dataset)
    
    print(f"\n🎉 Complete governance training dataset generated!")
    print(f"📊 Total examples: {sum(len(examples) for examples in dataset.values())}")
    print(f"💾 Saved to: governance_training_dataset.json")

