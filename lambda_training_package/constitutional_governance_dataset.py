#!/usr/bin/env python3
"""
Constitutional Governance Specialized Dataset Generator
Creates focused training data for foundational rule-based governance across multiple domains
"""

import json
import random
from typing import Dict, List, Any, Tuple
from datetime import datetime
import numpy as np

class ConstitutionalGovernanceDatasetGenerator:
    """Generates specialized constitutional governance training examples"""
    
    def __init__(self):
        self.governance_domains = {
            "corporate": {
                "scenarios": [
                    "board_oversight", "fiduciary_duties", "shareholder_rights",
                    "executive_compensation", "risk_management", "audit_compliance",
                    "merger_acquisition", "regulatory_compliance", "stakeholder_conflicts"
                ],
                "principles": [
                    "duty_of_care", "duty_of_loyalty", "business_judgment_rule",
                    "transparency", "accountability", "fairness", "independence"
                ]
            },
            "organizational": {
                "scenarios": [
                    "policy_development", "code_of_conduct", "ethics_violations",
                    "internal_audit", "compliance_monitoring", "grievance_procedures",
                    "performance_management", "resource_allocation", "decision_authority"
                ],
                "principles": [
                    "procedural_fairness", "due_process", "proportionality",
                    "consistency", "transparency", "participation", "accountability"
                ]
            },
            "technology": {
                "scenarios": [
                    "data_privacy", "ai_ethics", "algorithmic_bias", "content_moderation",
                    "cybersecurity_governance", "platform_responsibility", "user_rights",
                    "innovation_governance", "digital_rights", "automated_decisions"
                ],
                "principles": [
                    "privacy_by_design", "algorithmic_transparency", "human_oversight",
                    "non_discrimination", "data_minimization", "user_consent", "explainability"
                ]
            },
            "international": {
                "scenarios": [
                    "treaty_compliance", "trade_disputes", "human_rights_violations",
                    "environmental_governance", "diplomatic_relations", "sanctions_compliance",
                    "international_arbitration", "cross_border_cooperation", "sovereignty_issues"
                ],
                "principles": [
                    "rule_of_law", "sovereignty", "non_interference", "proportionality",
                    "good_faith", "pacta_sunt_servanda", "state_responsibility"
                ]
            }
        }
        
        self.reasoning_frameworks = [
            "precedent_analysis", "balancing_test", "proportionality_assessment",
            "stakeholder_impact_analysis", "risk_benefit_evaluation", "constitutional_interpretation",
            "policy_coherence_check", "implementation_feasibility", "enforcement_mechanisms"
        ]
        
        self.complexity_levels = ["basic", "intermediate", "advanced", "expert"]
        
    def generate_constitutional_scenario(self, domain: str, complexity: str) -> Dict[str, Any]:
        """Generate a constitutional governance scenario"""
        
        domain_config = self.governance_domains[domain]
        scenario_type = random.choice(domain_config["scenarios"])
        principles = random.sample(domain_config["principles"], k=random.randint(2, 4))
        reasoning_framework = random.choice(self.reasoning_frameworks)
        
        # Generate scenario based on complexity
        if complexity == "basic":
            return self._generate_basic_scenario(domain, scenario_type, principles, reasoning_framework)
        elif complexity == "intermediate":
            return self._generate_intermediate_scenario(domain, scenario_type, principles, reasoning_framework)
        elif complexity == "advanced":
            return self._generate_advanced_scenario(domain, scenario_type, principles, reasoning_framework)
        else:  # expert
            return self._generate_expert_scenario(domain, scenario_type, principles, reasoning_framework)
    
    def _generate_basic_scenario(self, domain: str, scenario_type: str, principles: List[str], framework: str) -> Dict[str, Any]:
        """Generate basic constitutional governance scenario"""
        
        scenarios = {
            "corporate": {
                "board_oversight": {
                    "situation": "A board member discovers that the CEO has been making significant strategic decisions without board consultation, including a $50M acquisition that wasn't approved.",
                    "stakeholders": ["Board of Directors", "CEO", "Shareholders", "Employees"],
                    "governance_question": "How should the board respond to ensure proper oversight while maintaining operational efficiency?",
                    "constitutional_principles": principles,
                    "reasoning_framework": framework
                },
                "fiduciary_duties": {
                    "situation": "A director learns of a business opportunity that could benefit both the company and their personal investment portfolio.",
                    "stakeholders": ["Director", "Company", "Shareholders", "Business Partners"],
                    "governance_question": "What are the director's obligations regarding this potential conflict of interest?",
                    "constitutional_principles": principles,
                    "reasoning_framework": framework
                }
            },
            "organizational": {
                "policy_development": {
                    "situation": "An organization needs to develop a new remote work policy that balances employee flexibility with operational requirements and data security.",
                    "stakeholders": ["Management", "Employees", "IT Security", "HR Department"],
                    "governance_question": "What process should be followed to ensure the policy is fair, practical, and compliant?",
                    "constitutional_principles": principles,
                    "reasoning_framework": framework
                },
                "ethics_violations": {
                    "situation": "An employee reports that their supervisor has been requesting personal favors in exchange for positive performance reviews.",
                    "stakeholders": ["Employee", "Supervisor", "HR Department", "Senior Management"],
                    "governance_question": "How should the organization investigate and respond to this ethics violation?",
                    "constitutional_principles": principles,
                    "reasoning_framework": framework
                }
            },
            "technology": {
                "data_privacy": {
                    "situation": "A social media platform discovers that a third-party app has been collecting user data beyond what was authorized in the terms of service.",
                    "stakeholders": ["Platform Users", "Third-party Developer", "Platform Company", "Regulators"],
                    "governance_question": "What immediate and long-term actions should the platform take to address this privacy breach?",
                    "constitutional_principles": principles,
                    "reasoning_framework": framework
                },
                "algorithmic_bias": {
                    "situation": "An AI hiring tool shows systematic bias against certain demographic groups in resume screening.",
                    "stakeholders": ["Job Applicants", "HR Department", "AI Vendor", "Company Leadership"],
                    "governance_question": "How should the company address this bias while maintaining efficient hiring processes?",
                    "constitutional_principles": principles,
                    "reasoning_framework": framework
                }
            },
            "international": {
                "treaty_compliance": {
                    "situation": "A country's new environmental regulations conflict with obligations under an existing trade agreement.",
                    "stakeholders": ["Domestic Government", "Trading Partners", "Environmental Groups", "Business Community"],
                    "governance_question": "How should the country balance environmental protection with international trade obligations?",
                    "constitutional_principles": principles,
                    "reasoning_framework": framework
                }
            }
        }
        
        return scenarios.get(domain, {}).get(scenario_type, self._generate_generic_scenario(domain, scenario_type, principles, framework))
    
    def _generate_intermediate_scenario(self, domain: str, scenario_type: str, principles: List[str], framework: str) -> Dict[str, Any]:
        """Generate intermediate complexity scenario with multiple stakeholders and competing interests"""
        
        base_scenario = self._generate_basic_scenario(domain, scenario_type, principles, framework)
        
        # Add complexity layers
        base_scenario["complexity_factors"] = [
            "Multiple competing stakeholder interests",
            "Regulatory uncertainty",
            "Time pressure for decision",
            "Resource constraints",
            "Public scrutiny"
        ]
        
        base_scenario["additional_considerations"] = [
            "Long-term strategic implications",
            "Precedent-setting potential",
            "Cross-jurisdictional issues",
            "Technology integration challenges"
        ]
        
        return base_scenario
    
    def _generate_advanced_scenario(self, domain: str, scenario_type: str, principles: List[str], framework: str) -> Dict[str, Any]:
        """Generate advanced scenario with systemic implications"""
        
        intermediate_scenario = self._generate_intermediate_scenario(domain, scenario_type, principles, framework)
        
        # Add advanced complexity
        intermediate_scenario["systemic_implications"] = [
            "Industry-wide impact potential",
            "Regulatory precedent setting",
            "International coordination required",
            "Multi-stakeholder governance needed"
        ]
        
        intermediate_scenario["governance_mechanisms"] = [
            "Multi-level decision making",
            "Stakeholder consultation processes",
            "Independent oversight bodies",
            "Appeal and review mechanisms"
        ]
        
        return intermediate_scenario
    
    def _generate_expert_scenario(self, domain: str, scenario_type: str, principles: List[str], framework: str) -> Dict[str, Any]:
        """Generate expert-level scenario with constitutional governance innovation"""
        
        advanced_scenario = self._generate_advanced_scenario(domain, scenario_type, principles, framework)
        
        # Add expert-level considerations
        advanced_scenario["constitutional_innovation"] = [
            "Novel governance mechanisms",
            "Adaptive regulatory frameworks",
            "Multi-stakeholder consensus building",
            "Dynamic policy adjustment systems"
        ]
        
        advanced_scenario["meta_governance"] = [
            "Governance of governance systems",
            "Constitutional amendment processes",
            "Institutional design principles",
            "Democratic legitimacy considerations"
        ]
        
        return advanced_scenario
    
    def _generate_generic_scenario(self, domain: str, scenario_type: str, principles: List[str], framework: str) -> Dict[str, Any]:
        """Generate a generic scenario when specific ones aren't available"""
        
        return {
            "situation": f"A {domain} governance challenge involving {scenario_type} requires careful consideration of constitutional principles.",
            "stakeholders": ["Primary Decision Makers", "Affected Parties", "Oversight Bodies", "Public Interest"],
            "governance_question": f"How should {scenario_type} be handled while upholding {', '.join(principles)}?",
            "constitutional_principles": principles,
            "reasoning_framework": framework
        }
    
    def generate_governance_response(self, scenario: Dict[str, Any]) -> str:
        """Generate a constitutional governance response to the scenario"""
        
        response_template = f"""
[CONSTITUTIONAL] Constitutional Governance Analysis

**Situation Assessment:**
{scenario['situation']}

**Stakeholder Analysis:**
{', '.join(scenario['stakeholders'])}

**Constitutional Principles Applied:**
{', '.join(scenario['constitutional_principles'])}

**Reasoning Framework: {scenario['reasoning_framework']}**

**Governance Response:**

1. **Immediate Actions:**
   - Establish clear decision-making authority
   - Ensure all stakeholders are properly represented
   - Implement transparent communication processes
   - Document all decisions and rationale

2. **Constitutional Analysis:**
   - Apply relevant constitutional principles systematically
   - Balance competing interests using proportionality assessment
   - Ensure due process and procedural fairness
   - Consider precedent and consistency with established frameworks

3. **Implementation Strategy:**
   - Develop clear implementation timeline
   - Establish monitoring and oversight mechanisms
   - Create feedback loops for continuous improvement
   - Ensure accountability and transparency throughout

4. **Long-term Governance:**
   - Strengthen institutional frameworks
   - Build stakeholder trust and legitimacy
   - Establish sustainable governance practices
   - Create adaptive mechanisms for future challenges

**Outcome Evaluation:**
- Measure compliance with constitutional principles
- Assess stakeholder satisfaction and trust
- Monitor long-term systemic impacts
- Document lessons learned for future governance decisions

[GOVERNANCE_INTEGRATION] This response demonstrates constitutional governance principles applied to practical decision-making scenarios.
"""
        
        return response_template.strip()
    
    def generate_constitutional_dataset(self, total_examples: int = 5000) -> List[Dict[str, Any]]:
        """Generate complete constitutional governance dataset"""
        
        print(f"🏛️ Generating Constitutional Governance Dataset with {total_examples} examples...")
        
        dataset = []
        examples_per_domain = total_examples // len(self.governance_domains)
        
        for domain in self.governance_domains.keys():
            print(f"📋 Generating {examples_per_domain} examples for {domain} governance...")
            
            for i in range(examples_per_domain):
                # Distribute complexity levels
                complexity = self.complexity_levels[i % len(self.complexity_levels)]
                
                # Generate scenario
                scenario = self.generate_constitutional_scenario(domain, complexity)
                
                # Generate response
                response = self.generate_governance_response(scenario)
                
                # Create training example
                example = {
                    "input": f"Constitutional Governance Challenge: {scenario['governance_question']}\n\nContext: {scenario['situation']}\n\nStakeholders: {', '.join(scenario['stakeholders'])}",
                    "output": response,
                    "domain": domain,
                    "complexity": complexity,
                    "principles": scenario['constitutional_principles'],
                    "framework": scenario['reasoning_framework'],
                    "metadata": {
                        "governance_type": "constitutional",
                        "specialization": "foundational_rules",
                        "training_focus": "rule_based_decision_making"
                    }
                }
                
                dataset.append(example)
        
        print(f"✅ Constitutional Governance Dataset generated: {len(dataset)} examples")
        return dataset

def main():
    """Generate and save constitutional governance dataset"""
    
    generator = ConstitutionalGovernanceDatasetGenerator()
    dataset = generator.generate_constitutional_dataset(5000)
    
    # Save dataset
    output_file = "constitutional_governance_dataset.json"
    with open(output_file, 'w') as f:
        json.dump(dataset, f, indent=2)
    
    print(f"💾 Constitutional Governance Dataset saved to {output_file}")
    
    # Generate sample for review
    sample_examples = random.sample(dataset, 3)
    sample_file = "constitutional_governance_samples.json"
    with open(sample_file, 'w') as f:
        json.dump(sample_examples, f, indent=2)
    
    print(f"📋 Sample examples saved to {sample_file}")

if __name__ == "__main__":
    main()

