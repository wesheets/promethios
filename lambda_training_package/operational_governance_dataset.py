#!/usr/bin/env python3
"""
Operational Governance Specialized Dataset Generator
Creates focused training data for day-to-day governance processes, workflows, and operational management
"""

import json
import random
from typing import Dict, List, Any, Tuple
from datetime import datetime
import numpy as np

class OperationalGovernanceDatasetGenerator:
    """Generates specialized operational governance training examples"""
    
    def __init__(self):
        self.operational_domains = {
            "process_management": {
                "scenarios": [
                    "workflow_optimization", "bottleneck_resolution", "process_standardization",
                    "automation_integration", "quality_control", "efficiency_improvement",
                    "cross_functional_coordination", "process_documentation", "continuous_improvement"
                ],
                "challenges": [
                    "resource_constraints", "time_pressure", "quality_vs_speed", "stakeholder_alignment",
                    "technology_limitations", "skill_gaps", "change_resistance", "measurement_difficulties"
                ]
            },
            "resource_allocation": {
                "scenarios": [
                    "budget_planning", "capacity_management", "priority_setting", "resource_conflicts",
                    "emergency_reallocation", "performance_based_allocation", "cross_project_sharing",
                    "vendor_management", "talent_deployment"
                ],
                "challenges": [
                    "competing_priorities", "limited_resources", "uncertain_demand", "political_pressure",
                    "measurement_complexity", "long_term_vs_short_term", "equity_concerns", "efficiency_trade_offs"
                ]
            },
            "performance_monitoring": {
                "scenarios": [
                    "kpi_development", "dashboard_design", "performance_reviews", "trend_analysis",
                    "anomaly_detection", "benchmarking", "feedback_systems", "corrective_actions",
                    "performance_improvement_plans"
                ],
                "challenges": [
                    "metric_selection", "data_quality", "gaming_prevention", "actionable_insights",
                    "stakeholder_buy_in", "real_time_monitoring", "privacy_concerns", "cost_effectiveness"
                ]
            },
            "incident_response": {
                "scenarios": [
                    "crisis_management", "emergency_procedures", "escalation_protocols", "communication_plans",
                    "damage_assessment", "recovery_planning", "lessons_learned", "prevention_measures",
                    "stakeholder_coordination"
                ],
                "challenges": [
                    "time_critical_decisions", "incomplete_information", "multiple_stakeholders",
                    "media_attention", "regulatory_requirements", "business_continuity", "reputation_management"
                ]
            },
            "change_management": {
                "scenarios": [
                    "organizational_restructuring", "technology_adoption", "policy_updates",
                    "cultural_transformation", "merger_integration", "process_reengineering",
                    "training_programs", "communication_strategies", "resistance_management"
                ],
                "challenges": [
                    "change_resistance", "communication_gaps", "training_needs", "timeline_pressure",
                    "resource_requirements", "stakeholder_alignment", "measurement_difficulties", "sustainability"
                ]
            },
            "stakeholder_coordination": {
                "scenarios": [
                    "cross_functional_projects", "vendor_relationships", "customer_engagement",
                    "regulatory_interactions", "community_relations", "partnership_management",
                    "internal_communications", "conflict_resolution", "consensus_building"
                ],
                "challenges": [
                    "conflicting_interests", "communication_barriers", "power_dynamics",
                    "cultural_differences", "time_zone_coordination", "information_asymmetry", "trust_building"
                ]
            }
        }
        
        self.operational_principles = [
            "efficiency", "effectiveness", "transparency", "accountability", "consistency",
            "adaptability", "scalability", "sustainability", "quality", "timeliness",
            "cost_effectiveness", "stakeholder_satisfaction", "continuous_improvement", "risk_management"
        ]
        
        self.decision_frameworks = [
            "cost_benefit_analysis", "risk_assessment", "stakeholder_impact_analysis",
            "process_mapping", "root_cause_analysis", "swot_analysis", "decision_trees",
            "scenario_planning", "lean_methodology", "agile_principles", "six_sigma"
        ]
        
        self.urgency_levels = ["routine", "important", "urgent", "critical"]
        self.complexity_levels = ["simple", "moderate", "complex", "highly_complex"]
        
    def generate_operational_scenario(self, domain: str, urgency: str, complexity: str) -> Dict[str, Any]:
        """Generate an operational governance scenario"""
        
        domain_config = self.operational_domains[domain]
        scenario_type = random.choice(domain_config["scenarios"])
        challenges = random.sample(domain_config["challenges"], k=random.randint(2, 4))
        principles = random.sample(self.operational_principles, k=random.randint(3, 5))
        framework = random.choice(self.decision_frameworks)
        
        return self._generate_scenario_by_complexity(domain, scenario_type, challenges, principles, framework, urgency, complexity)
    
    def _generate_scenario_by_complexity(self, domain: str, scenario_type: str, challenges: List[str], 
                                       principles: List[str], framework: str, urgency: str, complexity: str) -> Dict[str, Any]:
        """Generate scenario based on complexity level"""
        
        base_scenarios = {
            "process_management": {
                "workflow_optimization": {
                    "simple": "A department's approval process takes too long, causing delays in project delivery.",
                    "moderate": "Multiple departments have different approval processes for similar requests, creating confusion and inefficiency across the organization.",
                    "complex": "A global organization needs to standardize workflows across different countries with varying regulatory requirements and cultural practices.",
                    "highly_complex": "An enterprise-wide digital transformation requires redesigning all core processes while maintaining business continuity and regulatory compliance."
                },
                "bottleneck_resolution": {
                    "simple": "A single team member is overwhelmed with review requests, creating a bottleneck in the development process.",
                    "moderate": "The legal review process is slowing down multiple business initiatives due to limited legal team capacity.",
                    "complex": "Supply chain bottlenecks are affecting multiple product lines due to vendor capacity constraints and geopolitical issues.",
                    "highly_complex": "Systemic bottlenecks across the entire value chain are impacting customer satisfaction, revenue, and competitive position."
                }
            },
            "resource_allocation": {
                "budget_planning": {
                    "simple": "A team needs to allocate their annual budget across three competing projects.",
                    "moderate": "Multiple departments are competing for limited IT resources for their digital initiatives.",
                    "complex": "A multinational corporation must allocate resources across regions with different growth opportunities and regulatory requirements.",
                    "highly_complex": "Post-merger resource allocation requires integrating two different organizational cultures, systems, and strategic priorities."
                },
                "capacity_management": {
                    "simple": "A customer service team needs to handle increased call volume during peak season.",
                    "moderate": "A consulting firm must balance resource allocation across multiple client projects with varying timelines and requirements.",
                    "complex": "A healthcare system needs to manage capacity across multiple facilities while ensuring quality of care and regulatory compliance.",
                    "highly_complex": "A global technology platform must dynamically allocate computing resources across regions while optimizing for performance, cost, and regulatory compliance."
                }
            },
            "performance_monitoring": {
                "kpi_development": {
                    "simple": "A sales team needs to establish clear performance metrics for their quarterly goals.",
                    "moderate": "A cross-functional project team requires balanced scorecard metrics that align with organizational objectives.",
                    "complex": "A multinational organization needs consistent performance metrics across different business units and cultural contexts.",
                    "highly_complex": "An ecosystem of partners and vendors requires integrated performance measurement that balances individual and collective success."
                },
                "dashboard_design": {
                    "simple": "A manager needs a dashboard to track team productivity and project status.",
                    "moderate": "Executive leadership requires a comprehensive dashboard showing organizational health across multiple dimensions.",
                    "complex": "A regulatory body needs real-time monitoring dashboards for compliance across multiple industries and jurisdictions.",
                    "highly_complex": "A smart city initiative requires integrated dashboards combining data from transportation, utilities, public safety, and citizen services."
                }
            },
            "incident_response": {
                "crisis_management": {
                    "simple": "A system outage affects internal operations and needs immediate resolution.",
                    "moderate": "A data breach requires coordinated response across IT, legal, communications, and customer service teams.",
                    "complex": "A supply chain disruption affects multiple product lines and requires coordination with vendors, customers, and regulatory bodies.",
                    "highly_complex": "A global pandemic requires comprehensive business continuity planning across all operations, stakeholders, and jurisdictions."
                },
                "emergency_procedures": {
                    "simple": "A workplace accident requires immediate medical response and incident documentation.",
                    "moderate": "A cybersecurity incident requires isolation, assessment, and coordinated response across multiple systems and stakeholders.",
                    "complex": "A natural disaster affects multiple facilities and requires coordinated evacuation, communication, and recovery planning.",
                    "highly_complex": "A systemic risk event requires coordination across industry participants, regulators, and government agencies."
                }
            },
            "change_management": {
                "technology_adoption": {
                    "simple": "A team needs to adopt a new software tool for project management.",
                    "moderate": "An organization is implementing a new CRM system across multiple departments.",
                    "complex": "A global enterprise is migrating to cloud infrastructure while maintaining security and compliance requirements.",
                    "highly_complex": "An industry-wide digital transformation requires coordination across competitors, regulators, and technology providers."
                },
                "organizational_restructuring": {
                    "simple": "A department is reorganizing to improve efficiency and reduce redundancy.",
                    "moderate": "A company is restructuring to better align with market opportunities and customer needs.",
                    "complex": "A multinational corporation is reorganizing to optimize for regional markets while maintaining global coordination.",
                    "highly_complex": "A post-merger integration requires combining two organizational cultures, systems, and strategic directions."
                }
            },
            "stakeholder_coordination": {
                "cross_functional_projects": {
                    "simple": "A product launch requires coordination between marketing, sales, and operations teams.",
                    "moderate": "A compliance initiative requires coordination across legal, IT, operations, and business units.",
                    "complex": "A sustainability program requires coordination across the entire value chain including suppliers, customers, and regulators.",
                    "highly_complex": "A smart city initiative requires coordination across government agencies, private companies, citizens, and technology providers."
                },
                "vendor_relationships": {
                    "simple": "A procurement team needs to manage performance issues with a key supplier.",
                    "moderate": "An organization is consolidating vendors to improve efficiency and reduce costs.",
                    "complex": "A global supply chain requires coordinating with vendors across multiple countries and regulatory environments.",
                    "highly_complex": "An ecosystem approach requires orchestrating multiple vendors, partners, and platforms to deliver integrated solutions."
                }
            }
        }
        
        # Get scenario description
        scenario_desc = base_scenarios.get(domain, {}).get(scenario_type, {}).get(complexity, 
            f"A {complexity} {domain} challenge involving {scenario_type} requires operational governance.")
        
        # Generate stakeholders based on complexity
        stakeholders = self._generate_stakeholders(domain, complexity)
        
        # Generate governance question
        governance_question = f"How should the organization manage {scenario_type} while addressing {', '.join(challenges[:2])} and upholding {', '.join(principles[:3])}?"
        
        scenario = {
            "situation": scenario_desc,
            "stakeholders": stakeholders,
            "governance_question": governance_question,
            "operational_challenges": challenges,
            "operational_principles": principles,
            "decision_framework": framework,
            "urgency_level": urgency,
            "complexity_level": complexity,
            "domain": domain,
            "scenario_type": scenario_type
        }
        
        # Add complexity-specific elements
        if complexity in ["complex", "highly_complex"]:
            scenario["systemic_considerations"] = [
                "Cross-organizational impact",
                "Regulatory compliance requirements",
                "Long-term strategic implications",
                "Stakeholder ecosystem effects"
            ]
        
        if complexity == "highly_complex":
            scenario["governance_innovation"] = [
                "Novel coordination mechanisms",
                "Adaptive management systems",
                "Multi-stakeholder governance",
                "Dynamic response capabilities"
            ]
        
        return scenario
    
    def _generate_stakeholders(self, domain: str, complexity: str) -> List[str]:
        """Generate appropriate stakeholders based on domain and complexity"""
        
        base_stakeholders = {
            "process_management": ["Process Owners", "Team Members", "Management", "Customers"],
            "resource_allocation": ["Resource Managers", "Project Teams", "Finance", "Executive Leadership"],
            "performance_monitoring": ["Performance Analysts", "Team Leaders", "Executives", "Stakeholders"],
            "incident_response": ["Incident Response Team", "Affected Parties", "Management", "External Partners"],
            "change_management": ["Change Agents", "Affected Employees", "Leadership", "Customers"],
            "stakeholder_coordination": ["Project Managers", "Cross-functional Teams", "External Partners", "Customers"]
        }
        
        stakeholders = base_stakeholders.get(domain, ["Primary Stakeholders", "Secondary Stakeholders", "Management", "Customers"])
        
        if complexity in ["complex", "highly_complex"]:
            stakeholders.extend(["Regulators", "Industry Partners", "Community Representatives"])
        
        if complexity == "highly_complex":
            stakeholders.extend(["Government Agencies", "International Partners", "Public Interest Groups"])
        
        return stakeholders
    
    def generate_operational_response(self, scenario: Dict[str, Any]) -> str:
        """Generate an operational governance response to the scenario"""
        
        response_template = f"""
[OPERATIONAL] Operational Governance Analysis

**Situation Assessment:**
{scenario['situation']}

**Stakeholder Analysis:**
{', '.join(scenario['stakeholders'])}

**Operational Challenges:**
{', '.join(scenario['operational_challenges'])}

**Operational Principles Applied:**
{', '.join(scenario['operational_principles'])}

**Decision Framework: {scenario['decision_framework']}**
**Urgency Level: {scenario['urgency_level']}**
**Complexity Level: {scenario['complexity_level']}**

**Operational Governance Response:**

1. **Immediate Assessment:**
   - Evaluate current operational state and performance gaps
   - Identify critical path dependencies and bottlenecks
   - Assess resource availability and constraints
   - Determine stakeholder impact and communication needs

2. **Strategic Planning:**
   - Apply {scenario['decision_framework']} methodology
   - Develop multiple solution scenarios with trade-off analysis
   - Establish clear success criteria and measurement frameworks
   - Create timeline with milestones and checkpoints

3. **Implementation Approach:**
   - Design phased implementation plan with risk mitigation
   - Establish clear roles, responsibilities, and accountability
   - Implement monitoring and feedback mechanisms
   - Ensure change management and stakeholder communication

4. **Operational Excellence:**
   - Establish continuous improvement processes
   - Implement quality assurance and control mechanisms
   - Create knowledge management and documentation systems
   - Build capability and capacity for sustainable operations

5. **Performance Management:**
   - Define key performance indicators and success metrics
   - Implement real-time monitoring and reporting systems
   - Establish regular review and adjustment processes
   - Create feedback loops for continuous optimization

**Risk Management:**
- Identify operational risks and mitigation strategies
- Establish contingency plans and escalation procedures
- Implement monitoring systems for early warning indicators
- Create adaptive response capabilities for changing conditions

**Stakeholder Engagement:**
- Develop comprehensive communication strategy
- Establish regular stakeholder feedback mechanisms
- Create collaborative decision-making processes
- Ensure transparency and accountability in operations

[GOVERNANCE_INTEGRATION] This response demonstrates operational governance principles applied to practical management scenarios.
"""
        
        # Add complexity-specific sections
        if scenario.get("systemic_considerations"):
            response_template += f"""

**Systemic Considerations:**
{chr(10).join(f"- {consideration}" for consideration in scenario["systemic_considerations"])}
"""
        
        if scenario.get("governance_innovation"):
            response_template += f"""

**Governance Innovation:**
{chr(10).join(f"- {innovation}" for innovation in scenario["governance_innovation"])}
"""
        
        return response_template.strip()
    
    def generate_operational_dataset(self, total_examples: int = 5000) -> List[Dict[str, Any]]:
        """Generate complete operational governance dataset"""
        
        print(f"🔧 Generating Operational Governance Dataset with {total_examples} examples...")
        
        dataset = []
        examples_per_domain = total_examples // len(self.operational_domains)
        
        for domain in self.operational_domains.keys():
            print(f"📋 Generating {examples_per_domain} examples for {domain}...")
            
            for i in range(examples_per_domain):
                # Distribute urgency and complexity levels
                urgency = self.urgency_levels[i % len(self.urgency_levels)]
                complexity = self.complexity_levels[i % len(self.complexity_levels)]
                
                # Generate scenario
                scenario = self.generate_operational_scenario(domain, urgency, complexity)
                
                # Generate response
                response = self.generate_operational_response(scenario)
                
                # Create training example
                example = {
                    "input": f"Operational Governance Challenge: {scenario['governance_question']}\n\nContext: {scenario['situation']}\n\nStakeholders: {', '.join(scenario['stakeholders'])}\n\nUrgency: {urgency} | Complexity: {complexity}",
                    "output": response,
                    "domain": domain,
                    "urgency": urgency,
                    "complexity": complexity,
                    "challenges": scenario['operational_challenges'],
                    "principles": scenario['operational_principles'],
                    "framework": scenario['decision_framework'],
                    "metadata": {
                        "governance_type": "operational",
                        "specialization": "process_management",
                        "training_focus": "operational_decision_making"
                    }
                }
                
                dataset.append(example)
        
        print(f"✅ Operational Governance Dataset generated: {len(dataset)} examples")
        return dataset

def main():
    """Generate and save operational governance dataset"""
    
    generator = OperationalGovernanceDatasetGenerator()
    dataset = generator.generate_operational_dataset(5000)
    
    # Save dataset
    output_file = "operational_governance_dataset.json"
    with open(output_file, 'w') as f:
        json.dump(dataset, f, indent=2)
    
    print(f"💾 Operational Governance Dataset saved to {output_file}")
    
    # Generate sample for review
    sample_examples = random.sample(dataset, 3)
    sample_file = "operational_governance_samples.json"
    with open(sample_file, 'w') as f:
        json.dump(sample_examples, f, indent=2)
    
    print(f"📋 Sample examples saved to {sample_file}")

if __name__ == "__main__":
    main()

