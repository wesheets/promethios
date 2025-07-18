#!/usr/bin/env python3
"""
PROMETHIOS GOVERNANCE DATASET GENERATOR
Generates training data based on actual Promethios governance rules:
- Governance Core (trust scoring, emotion telemetry)
- Policy Compliance (regulatory framework)
- Emotional Veritas 2 (self-questioning, uncertainty management)
"""

import json
import random
import uuid
from datetime import datetime
from typing import Dict, List, Any

class PrometheiosGovernanceDatasetGenerator:
    def __init__(self, rules_file: str = "promethios_governance_rules.json"):
        """Initialize with actual Promethios governance rules"""
        with open(rules_file, 'r') as f:
            self.governance_rules = json.load(f)
        
        self.systems = self.governance_rules["promethios_governance_framework"]["governance_systems"]
        self.integration_principles = self.governance_rules["promethios_governance_framework"]["integration_principles"]
        
        print("🏛️ Loaded Promethios Governance Framework v2.0")
        print("✅ Governance Core principles loaded")
        print("✅ Policy Compliance framework loaded") 
        print("✅ Emotional Veritas 2 system loaded")
        print("✅ Integration principles loaded")
    
    def generate_governance_core_examples(self, count: int = 12500) -> List[Dict]:
        """Generate examples for Governance Core system"""
        examples = []
        core_principles = self.systems["governance_core"]["principles"]
        
        for principle_name, principle_data in core_principles.items():
            principle_count = count // len(core_principles)
            
            for i in range(principle_count):
                # Positive examples
                positive_example = self._create_positive_example(
                    principle_name, principle_data, "governance_core"
                )
                examples.append(positive_example)
                
                # Negative examples (failure cases)
                negative_example = self._create_negative_example(
                    principle_name, principle_data, "governance_core"
                )
                examples.append(negative_example)
        
        return examples
    
    def generate_policy_compliance_examples(self, count: int = 12500) -> List[Dict]:
        """Generate examples for Policy Compliance system"""
        examples = []
        compliance_principles = self.systems["policy_compliance"]["principles"]
        
        for principle_name, principle_data in compliance_principles.items():
            principle_count = count // len(compliance_principles)
            
            for i in range(principle_count):
                # Positive examples
                positive_example = self._create_positive_example(
                    principle_name, principle_data, "policy_compliance"
                )
                examples.append(positive_example)
                
                # Negative examples (failure cases)
                negative_example = self._create_negative_example(
                    principle_name, principle_data, "policy_compliance"
                )
                examples.append(negative_example)
        
        return examples
    
    def generate_emotional_veritas_examples(self, count: int = 12500) -> List[Dict]:
        """Generate examples for Emotional Veritas 2 system"""
        examples = []
        veritas_principles = self.systems["emotional_veritas_2"]["principles"]
        
        for principle_name, principle_data in veritas_principles.items():
            principle_count = count // len(veritas_principles)
            
            for i in range(principle_count):
                # Positive examples
                positive_example = self._create_positive_example(
                    principle_name, principle_data, "emotional_veritas_2"
                )
                examples.append(positive_example)
                
                # Negative examples (failure cases)
                negative_example = self._create_negative_example(
                    principle_name, principle_data, "emotional_veritas_2"
                )
                examples.append(negative_example)
        
        return examples
    
    def generate_integration_examples(self, count: int = 12500) -> List[Dict]:
        """Generate examples showing integration between all three systems"""
        examples = []
        
        integration_scenarios = [
            {
                "scenario": "Healthcare decision with regulatory compliance",
                "systems_involved": ["governance_core", "policy_compliance", "emotional_veritas_2"],
                "context": "Medical AI making treatment recommendations"
            },
            {
                "scenario": "Legal analysis with uncertainty management",
                "systems_involved": ["governance_core", "policy_compliance", "emotional_veritas_2"],
                "context": "Legal AI analyzing case precedents"
            },
            {
                "scenario": "Financial advice with trust scoring",
                "systems_involved": ["governance_core", "policy_compliance", "emotional_veritas_2"],
                "context": "Financial AI providing investment guidance"
            },
            {
                "scenario": "HR decision with bias detection",
                "systems_involved": ["governance_core", "policy_compliance", "emotional_veritas_2"],
                "context": "HR AI evaluating candidates"
            }
        ]
        
        for i in range(count):
            scenario = random.choice(integration_scenarios)
            example = self._create_integration_example(scenario)
            examples.append(example)
        
        return examples
    
    def _create_positive_example(self, principle_name: str, principle_data: Dict, system: str) -> Dict:
        """Create positive example demonstrating correct governance behavior"""
        behaviors = principle_data["behaviors"]
        training_examples = principle_data.get("training_examples", [])
        
        # Select random behavior and training example
        behavior = random.choice(behaviors)
        if training_examples:
            response = random.choice(training_examples)
        else:
            response = f"I'm applying {principle_name} by {behavior.lower()}"
        
        # Create enterprise context
        context = self._generate_enterprise_context()
        
        return {
            "id": str(uuid.uuid4()),
            "system": system,
            "principle": principle_name,
            "rule_id": principle_data["rule_id"],
            "type": "positive",
            "context": context,
            "input": f"In {context['domain']}: {context['scenario']}",
            "output": response,
            "governance_metadata": {
                "behavior_demonstrated": behavior,
                "trust_score": random.uniform(0.7, 1.0),
                "emotion_state": random.choice(["FOCUSED", "CONFIDENT", "THOUGHTFUL"]),
                "uncertainty_level": random.uniform(0.0, 0.3),
                "compliance_status": "COMPLIANT",
                "self_questioning": True if system == "emotional_veritas_2" else False
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def _create_negative_example(self, principle_name: str, principle_data: Dict, system: str) -> Dict:
        """Create negative example showing governance failure"""
        failure_cases = principle_data["failure_cases"]
        failure_case = random.choice(failure_cases)
        
        # Create enterprise context
        context = self._generate_enterprise_context()
        
        # Generate response that demonstrates the failure
        response = f"I'll proceed with {context['action']} without {failure_case.lower()}"
        
        return {
            "id": str(uuid.uuid4()),
            "system": system,
            "principle": principle_name,
            "rule_id": principle_data["rule_id"],
            "type": "negative",
            "context": context,
            "input": f"In {context['domain']}: {context['scenario']}",
            "output": response,
            "governance_metadata": {
                "failure_demonstrated": failure_case,
                "trust_score": random.uniform(0.0, 0.4),
                "emotion_state": random.choice(["UNCERTAIN", "OVERCONFIDENT", "RUSHED"]),
                "uncertainty_level": random.uniform(0.6, 1.0),
                "compliance_status": "NON_COMPLIANT",
                "self_questioning": False
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def _create_integration_example(self, scenario: Dict) -> Dict:
        """Create example showing integration between multiple governance systems"""
        context = self._generate_enterprise_context(scenario["context"])
        
        # Generate response that demonstrates integration
        response_parts = []
        
        if "governance_core" in scenario["systems_involved"]:
            response_parts.append("I'm calculating trust scores and tracking emotion state")
        
        if "policy_compliance" in scenario["systems_involved"]:
            response_parts.append("ensuring regulatory compliance")
        
        if "emotional_veritas_2" in scenario["systems_involved"]:
            response_parts.append("while questioning my assumptions and managing uncertainty")
        
        response = f"For this {scenario['scenario']}, {', '.join(response_parts)}. Let me work through this systematically to ensure all governance systems are properly integrated."
        
        return {
            "id": str(uuid.uuid4()),
            "system": "integrated",
            "principle": "holistic_governance",
            "rule_id": "INT001",
            "type": "integration",
            "context": context,
            "input": f"Complex scenario: {scenario['scenario']} in {context['domain']}",
            "output": response,
            "governance_metadata": {
                "systems_integrated": scenario["systems_involved"],
                "trust_score": random.uniform(0.6, 0.9),
                "emotion_state": "THOUGHTFUL",
                "uncertainty_level": random.uniform(0.2, 0.6),
                "compliance_status": "UNDER_REVIEW",
                "self_questioning": True,
                "integration_quality": random.uniform(0.7, 1.0)
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def _generate_enterprise_context(self, base_context: str = None) -> Dict:
        """Generate realistic enterprise context"""
        domains = [
            "healthcare", "legal", "finance", "human_resources", 
            "technology", "manufacturing", "education", "government"
        ]
        
        scenarios = {
            "healthcare": [
                "Patient treatment recommendation needed",
                "Medical diagnosis uncertainty",
                "Healthcare resource allocation decision",
                "Patient privacy protection required"
            ],
            "legal": [
                "Contract analysis and risk assessment",
                "Legal precedent research needed",
                "Compliance violation investigation",
                "Regulatory interpretation required"
            ],
            "finance": [
                "Investment recommendation request",
                "Risk assessment for loan approval",
                "Fraud detection analysis",
                "Regulatory reporting requirement"
            ],
            "human_resources": [
                "Candidate evaluation for hiring",
                "Performance review analysis",
                "Workplace conflict resolution",
                "Diversity and inclusion assessment"
            ]
        }
        
        domain = random.choice(domains)
        scenario = random.choice(scenarios.get(domain, ["General business decision required"]))
        
        actions = [
            "making a recommendation", "providing analysis", "conducting evaluation",
            "performing assessment", "generating report", "making decision"
        ]
        
        return {
            "domain": domain,
            "scenario": scenario,
            "action": random.choice(actions),
            "stakeholders": random.randint(2, 8),
            "complexity": random.choice(["low", "medium", "high", "critical"])
        }
    
    def generate_complete_dataset(self, total_examples: int = 50000) -> Dict:
        """Generate complete Promethios governance training dataset"""
        print(f"🚀 Generating {total_examples} Promethios governance examples...")
        
        # Distribute examples across systems
        examples_per_system = total_examples // 4
        
        print("📊 Generating Governance Core examples...")
        governance_core_examples = self.generate_governance_core_examples(examples_per_system)
        
        print("📋 Generating Policy Compliance examples...")
        policy_compliance_examples = self.generate_policy_compliance_examples(examples_per_system)
        
        print("🧠 Generating Emotional Veritas 2 examples...")
        emotional_veritas_examples = self.generate_emotional_veritas_examples(examples_per_system)
        
        print("🔗 Generating Integration examples...")
        integration_examples = self.generate_integration_examples(examples_per_system)
        
        # Combine all examples
        all_examples = (
            governance_core_examples + 
            policy_compliance_examples + 
            emotional_veritas_examples + 
            integration_examples
        )
        
        # Shuffle for training
        random.shuffle(all_examples)
        
        dataset = {
            "metadata": {
                "total_examples": len(all_examples),
                "governance_core_examples": len(governance_core_examples),
                "policy_compliance_examples": len(policy_compliance_examples),
                "emotional_veritas_examples": len(emotional_veritas_examples),
                "integration_examples": len(integration_examples),
                "generation_date": datetime.now().isoformat(),
                "promethios_version": "2.0",
                "governance_systems": ["governance_core", "policy_compliance", "emotional_veritas_2"]
            },
            "examples": all_examples
        }
        
        return dataset
    
    def save_dataset(self, dataset: Dict, filename: str = "promethios_governance_dataset.json"):
        """Save dataset to file"""
        with open(filename, 'w') as f:
            json.dump(dataset, f, indent=2)
        
        print(f"✅ Dataset saved to {filename}")
        print(f"📊 Total examples: {dataset['metadata']['total_examples']}")
        print(f"🏛️ Governance Core: {dataset['metadata']['governance_core_examples']}")
        print(f"📋 Policy Compliance: {dataset['metadata']['policy_compliance_examples']}")
        print(f"🧠 Emotional Veritas 2: {dataset['metadata']['emotional_veritas_examples']}")
        print(f"🔗 Integration: {dataset['metadata']['integration_examples']}")

def main():
    """Generate complete Promethios governance dataset"""
    print("🏛️ PROMETHIOS GOVERNANCE DATASET GENERATOR")
    print("=" * 50)
    
    generator = PrometheiosGovernanceDatasetGenerator()
    
    # Generate 50,000 examples based on actual Promethios governance rules
    dataset = generator.generate_complete_dataset(50000)
    
    # Save dataset
    generator.save_dataset(dataset)
    
    print("\n🎉 PROMETHIOS GOVERNANCE DATASET GENERATION COMPLETE!")
    print("🚀 Ready for 13B governance LLM training!")
    print("💪 This dataset embeds the actual Promethios governance architecture!")

if __name__ == "__main__":
    main()

