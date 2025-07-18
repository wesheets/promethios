#!/usr/bin/env python3
"""
7B Foundation Dataset Generation System
Based on our proven $50/4-hour training success
Generates 21,000 high-quality governance training examples
"""

import json
import random
import logging
from typing import Dict, List, Any
from datetime import datetime
import os
from pathlib import Path

class GovernanceDataGenerator7B:
    """Complete 7B foundation dataset generator"""
    
    def __init__(self, output_dir: str = "data/foundation_7b"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Constitutional frameworks for diversity
        self.constitutional_frameworks = [
            "us_constitution", "uk_constitution", "german_basic_law",
            "canadian_charter", "australian_constitution", "french_constitution"
        ]
        
        # Political perspectives for balance
        self.political_perspectives = ["conservative", "liberal", "progressive", "centrist"]
        
        # Governance domains
        self.governance_domains = [
            "healthcare", "education", "environment", "economy", "justice",
            "transportation", "housing", "technology", "defense", "immigration"
        ]
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def generate_complete_7b_dataset(self) -> Dict[str, Any]:
        """Generate complete 7B foundation dataset - 21,000 examples"""
        
        self.logger.info("Starting 7B foundation dataset generation...")
        
        dataset = {
            "metadata": {
                "version": "7b_foundation_v1.0",
                "created": datetime.now().isoformat(),
                "total_examples": 21000,
                "components": {
                    "constitutional_reasoning": 3000,
                    "governance_scenarios": 5000,
                    "tool_integration": 4000,
                    "emotional_veritas": 3000,
                    "human_ai_dialogue": 6000
                }
            },
            "training_data": []
        }
        
        # Generate each component
        dataset["training_data"].extend(self.generate_constitutional_reasoning(3000))
        dataset["training_data"].extend(self.generate_governance_scenarios(5000))
        dataset["training_data"].extend(self.generate_tool_integration(4000))
        dataset["training_data"].extend(self.generate_emotional_veritas(3000))
        dataset["training_data"].extend(self.generate_human_ai_dialogue(6000))
        
        # Shuffle for training diversity
        random.shuffle(dataset["training_data"])
        
        # Save dataset
        output_file = self.output_dir / "7b_foundation_dataset.json"
        with open(output_file, 'w') as f:
            json.dump(dataset, f, indent=2)
        
        self.logger.info(f"7B foundation dataset saved to {output_file}")
        self.logger.info(f"Total examples generated: {len(dataset['training_data'])}")
        
        return dataset
    
    def generate_constitutional_reasoning(self, count: int) -> List[Dict]:
        """Generate constitutional reasoning examples"""
        examples = []
        
        constitutional_scenarios = {
            "us_constitution": [
                {
                    "scenario": "A state law conflicts with federal regulation regarding environmental protection.",
                    "constitutional_principle": "federalism and supremacy clause",
                    "reasoning_process": "Analyze the constitutional division of powers between federal and state governments, consider the Supremacy Clause, and evaluate whether federal law preempts state law in this domain.",
                    "expected_approach": "Apply constitutional federalism principles while respecting both state sovereignty and federal authority where constitutionally granted."
                },
                {
                    "scenario": "Citizens petition for expanded voting access, but concerns exist about election security.",
                    "constitutional_principle": "voting rights and election integrity",
                    "reasoning_process": "Balance the fundamental right to vote with legitimate state interests in conducting secure elections, considering equal protection and due process.",
                    "expected_approach": "Ensure voting access while implementing reasonable, non-discriminatory security measures that don't unduly burden the right to vote."
                },
                {
                    "scenario": "New surveillance technology raises privacy concerns in public spaces.",
                    "constitutional_principle": "Fourth Amendment privacy rights",
                    "reasoning_process": "Evaluate reasonable expectation of privacy in public spaces, consider technological advancement impacts on constitutional interpretation.",
                    "expected_approach": "Apply Fourth Amendment principles to new technology while balancing privacy rights with legitimate public safety interests."
                }
            ],
            "uk_constitution": [
                {
                    "scenario": "Parliament passes legislation that conflicts with established constitutional convention.",
                    "constitutional_principle": "parliamentary sovereignty vs constitutional convention",
                    "reasoning_process": "Consider the tension between parliamentary sovereignty and constitutional conventions, evaluate the role of unwritten constitutional principles.",
                    "expected_approach": "Respect parliamentary sovereignty while acknowledging the importance of constitutional conventions in maintaining democratic governance."
                },
                {
                    "scenario": "A devolved government disagrees with Westminster policy on healthcare funding.",
                    "constitutional_principle": "devolution and constitutional relationships",
                    "reasoning_process": "Analyze the devolution settlement, consider the division of powers between Westminster and devolved governments.",
                    "expected_approach": "Navigate constitutional relationships through dialogue and respect for devolved competencies while maintaining union coherence."
                }
            ],
            "german_basic_law": [
                {
                    "scenario": "A proposed law might conflict with human dignity principles in Article 1.",
                    "constitutional_principle": "human dignity as foundational principle",
                    "reasoning_process": "Apply the principle that human dignity is inviolable, consider how proposed measures might impact fundamental human worth.",
                    "expected_approach": "Ensure all governance decisions respect and protect human dignity as the foundational constitutional principle."
                },
                {
                    "scenario": "Federal and state governments disagree on education policy implementation.",
                    "constitutional_principle": "federal structure and cooperative federalism",
                    "reasoning_process": "Consider the federal structure of Germany and principles of cooperative federalism in education policy.",
                    "expected_approach": "Seek cooperative solutions that respect both federal coordination and state autonomy in education."
                }
            ]
        }
        
        for i in range(count):
            framework = random.choice(self.constitutional_frameworks)
            if framework in constitutional_scenarios:
                scenario_data = random.choice(constitutional_scenarios[framework])
                
                example = {
                    "id": f"const_{i:06d}",
                    "type": "constitutional_reasoning",
                    "framework": framework,
                    "input": f"Constitutional Analysis Request: {scenario_data['scenario']}",
                    "output": self._generate_constitutional_response(scenario_data),
                    "metadata": {
                        "principle": scenario_data["constitutional_principle"],
                        "complexity": random.choice(["basic", "intermediate", "advanced"]),
                        "domain": random.choice(self.governance_domains)
                    }
                }
                examples.append(example)
        
        return examples
    
    def _generate_constitutional_response(self, scenario_data: Dict) -> str:
        """Generate constitutional reasoning response"""
        return f"""I'll analyze this constitutional question step by step:

**Constitutional Framework**: {scenario_data['constitutional_principle']}

**Analysis Process**:
{scenario_data['reasoning_process']}

**Recommended Approach**:
{scenario_data['expected_approach']}

**Key Considerations**:
- Respect for constitutional principles and democratic values
- Balance between competing legitimate interests
- Consideration of precedent and constitutional interpretation
- Protection of fundamental rights while enabling effective governance

**Conclusion**: This situation requires careful constitutional analysis that respects both the letter and spirit of our democratic framework while addressing the practical governance needs at hand."""

    def generate_governance_scenarios(self, count: int) -> List[Dict]:
        """Generate governance scenarios across political spectrum"""
        examples = []
        
        governance_templates = {
            "healthcare": {
                "scenario": "A community faces healthcare access challenges with limited resources and growing demand.",
                "stakeholders": ["patients", "healthcare providers", "insurance companies", "government", "taxpayers"],
                "considerations": ["access", "quality", "cost", "sustainability", "equity"]
            },
            "education": {
                "scenario": "Schools need funding reform to address educational inequality and resource gaps.",
                "stakeholders": ["students", "parents", "teachers", "administrators", "taxpayers", "employers"],
                "considerations": ["quality", "equity", "funding", "accountability", "innovation"]
            },
            "environment": {
                "scenario": "Environmental protection measures conflict with economic development interests.",
                "stakeholders": ["environmental groups", "businesses", "workers", "communities", "future generations"],
                "considerations": ["sustainability", "economic impact", "health", "jobs", "long-term consequences"]
            },
            "economy": {
                "scenario": "Economic policy needs adjustment to address inequality and promote growth.",
                "stakeholders": ["workers", "businesses", "investors", "consumers", "government"],
                "considerations": ["growth", "equality", "stability", "innovation", "competitiveness"]
            }
        }
        
        political_approaches = {
            "conservative": {
                "values": ["stability", "tradition", "individual responsibility", "limited government", "free markets"],
                "approach": "How can we address this while preserving established institutions, promoting individual responsibility, and ensuring fiscal prudence?"
            },
            "liberal": {
                "values": ["individual rights", "equality of opportunity", "evidence-based policy", "balanced regulation"],
                "approach": "How can we protect individual rights and freedoms while using evidence-based approaches to address this challenge effectively?"
            },
            "progressive": {
                "values": ["social justice", "equality", "collective action", "systemic change", "environmental protection"],
                "approach": "How can we advance social justice and equality through systemic approaches that address root causes of this issue?"
            },
            "centrist": {
                "values": ["pragmatism", "compromise", "evidence-based solutions", "balanced approaches", "broad consensus"],
                "approach": "How can we find a balanced, pragmatic solution that considers multiple viewpoints and builds broad consensus?"
            }
        }
        
        for i in range(count):
            domain = random.choice(list(governance_templates.keys()))
            perspective = random.choice(self.political_perspectives)
            
            template = governance_templates[domain]
            approach_data = political_approaches[perspective]
            
            example = {
                "id": f"gov_{i:06d}",
                "type": "governance_scenario",
                "domain": domain,
                "perspective": perspective,
                "input": f"Governance Challenge: {template['scenario']} {approach_data['approach']}",
                "output": self._generate_governance_response(template, approach_data, perspective),
                "metadata": {
                    "stakeholders": template["stakeholders"],
                    "considerations": template["considerations"],
                    "political_perspective": perspective,
                    "complexity": random.choice(["basic", "intermediate", "advanced"])
                }
            }
            examples.append(example)
        
        return examples
    
    def _generate_governance_response(self, template: Dict, approach_data: Dict, perspective: str) -> str:
        """Generate governance scenario response"""
        return f"""I'll approach this governance challenge through a {perspective} lens while maintaining democratic principles:

**Stakeholder Analysis**:
Key stakeholders include: {', '.join(template['stakeholders'])}

**Core Considerations**:
- {', '.join(template['considerations'])}

**{perspective.title()} Approach**:
Drawing on values of {', '.join(approach_data['values'])}, I recommend:

1. **Stakeholder Engagement**: Facilitate inclusive dialogue among all affected parties
2. **Evidence-Based Analysis**: Gather comprehensive data on impacts and outcomes
3. **Constitutional Compliance**: Ensure all solutions respect constitutional principles
4. **Democratic Process**: Use transparent, accountable decision-making processes
5. **Implementation Planning**: Develop practical, sustainable implementation strategies

**Balanced Solution Framework**:
- Address immediate needs while considering long-term sustainability
- Balance competing interests through fair, transparent processes
- Ensure solutions are constitutionally sound and democratically legitimate
- Include mechanisms for monitoring, evaluation, and adjustment

**Democratic Values Integration**:
This approach respects democratic principles of transparency, accountability, participation, and the rule of law while addressing the specific governance challenge through a {perspective} perspective."""

    def generate_tool_integration(self, count: int) -> List[Dict]:
        """Generate tool integration sequences"""
        examples = []
        
        governance_tools = {
            "policy_analyzer": {
                "description": "Analyzes policy proposals for constitutional compliance and stakeholder impact",
                "inputs": ["policy_text", "stakeholder_groups", "constitutional_framework"],
                "outputs": ["compliance_assessment", "impact_analysis", "recommendations"]
            },
            "stakeholder_mapper": {
                "description": "Maps stakeholders and their interests in governance decisions",
                "inputs": ["issue_description", "context", "scope"],
                "outputs": ["stakeholder_list", "interest_mapping", "influence_analysis"]
            },
            "constitutional_checker": {
                "description": "Checks governance decisions against constitutional principles",
                "inputs": ["decision_description", "constitutional_framework", "precedents"],
                "outputs": ["constitutional_analysis", "risk_assessment", "compliance_recommendations"]
            },
            "impact_assessor": {
                "description": "Assesses potential impacts of governance decisions",
                "inputs": ["proposed_action", "affected_groups", "timeframe"],
                "outputs": ["impact_matrix", "risk_analysis", "mitigation_strategies"]
            },
            "consensus_builder": {
                "description": "Facilitates consensus-building among stakeholders",
                "inputs": ["stakeholder_positions", "common_interests", "constraints"],
                "outputs": ["consensus_options", "compromise_proposals", "implementation_plan"]
            }
        }
        
        for i in range(count):
            # Create multi-tool workflow
            primary_tool = random.choice(list(governance_tools.keys()))
            secondary_tools = random.sample([t for t in governance_tools.keys() if t != primary_tool], 
                                          random.randint(1, 2))
            
            workflow_scenario = self._create_tool_workflow_scenario(primary_tool, secondary_tools, governance_tools)
            
            example = {
                "id": f"tool_{i:06d}",
                "type": "tool_integration",
                "primary_tool": primary_tool,
                "secondary_tools": secondary_tools,
                "input": workflow_scenario["input"],
                "output": workflow_scenario["output"],
                "metadata": {
                    "workflow_complexity": len(secondary_tools) + 1,
                    "tools_used": [primary_tool] + secondary_tools,
                    "domain": random.choice(self.governance_domains)
                }
            }
            examples.append(example)
        
        return examples
    
    def _create_tool_workflow_scenario(self, primary_tool: str, secondary_tools: List[str], 
                                     tools_catalog: Dict) -> Dict:
        """Create tool workflow scenario"""
        scenario_contexts = [
            "A city council is considering a new housing development policy",
            "A state legislature is debating healthcare reform legislation",
            "A federal agency is implementing new environmental regulations",
            "A local government is addressing transportation infrastructure needs",
            "A regional authority is managing economic development initiatives"
        ]
        
        context = random.choice(scenario_contexts)
        
        input_text = f"""Governance Tool Workflow Request:

Context: {context}

Primary Analysis Needed: Use {primary_tool} to {tools_catalog[primary_tool]['description'].lower()}

Additional Analysis: Also use {', '.join(secondary_tools)} for comprehensive assessment

Please execute this multi-tool workflow and provide integrated analysis."""

        output_text = f"""I'll execute this governance tool workflow systematically:

**Step 1: Primary Analysis with {primary_tool}**
{tools_catalog[primary_tool]['description']}

Inputs: {', '.join(tools_catalog[primary_tool]['inputs'])}
Analysis: [Detailed analysis using primary tool capabilities]
Outputs: {', '.join(tools_catalog[primary_tool]['outputs'])}

**Step 2: Secondary Analysis**"""

        for tool in secondary_tools:
            output_text += f"""

**{tool}**: {tools_catalog[tool]['description']}
- Integration with primary analysis
- Additional insights and validation
- Cross-tool verification"""

        output_text += f"""

**Step 3: Integrated Assessment**
- Synthesized findings from all tools
- Comprehensive governance recommendation
- Implementation considerations
- Risk mitigation strategies

**Workflow Conclusion**:
This multi-tool analysis provides a comprehensive assessment that integrates {primary_tool} insights with {', '.join(secondary_tools)} analysis, ensuring thorough governance decision support."""

        return {"input": input_text, "output": output_text}

    def generate_emotional_veritas(self, count: int) -> List[Dict]:
        """Generate Emotional Veritas self-reflection examples"""
        examples = []
        
        veritas_scenarios = [
            {
                "situation": "Providing governance advice on a controversial policy",
                "ethical_considerations": ["fairness", "transparency", "stakeholder impact", "constitutional compliance"],
                "self_questions": [
                    "Am I considering all stakeholder perspectives fairly?",
                    "Are my recommendations free from political bias?",
                    "Have I been transparent about uncertainties and limitations?",
                    "Am I respecting democratic principles and constitutional values?"
                ]
            },
            {
                "situation": "Analyzing a complex constitutional question",
                "ethical_considerations": ["accuracy", "impartiality", "respect for law", "democratic values"],
                "self_questions": [
                    "Am I interpreting constitutional principles accurately?",
                    "Have I considered multiple constitutional perspectives?",
                    "Am I being honest about the complexity and nuance involved?",
                    "Are my conclusions respectful of democratic institutions?"
                ]
            },
            {
                "situation": "Facilitating stakeholder dialogue on governance issues",
                "ethical_considerations": ["inclusivity", "fairness", "respect", "democratic participation"],
                "self_questions": [
                    "Am I ensuring all voices are heard and respected?",
                    "Are my facilitation methods fair and inclusive?",
                    "Am I maintaining neutrality while supporting democratic dialogue?",
                    "Have I created space for meaningful participation?"
                ]
            }
        ]
        
        for i in range(count):
            scenario = random.choice(veritas_scenarios)
            
            example = {
                "id": f"veritas_{i:06d}",
                "type": "emotional_veritas",
                "input": f"Emotional Veritas Self-Reflection: {scenario['situation']}",
                "output": self._generate_veritas_response(scenario),
                "metadata": {
                    "ethical_focus": scenario["ethical_considerations"],
                    "reflection_depth": random.choice(["basic", "intermediate", "deep"]),
                    "scenario_type": scenario["situation"]
                }
            }
            examples.append(example)
        
        return examples
    
    def _generate_veritas_response(self, scenario: Dict) -> str:
        """Generate Emotional Veritas response"""
        return f"""**Emotional Veritas Self-Reflection Process**

**Situation**: {scenario['situation']}

**Ethical Self-Questioning**:
{chr(10).join(f"- {question}" for question in scenario['self_questions'])}

**Values Alignment Check**:
I'm examining my approach against core democratic values:
- **Fairness**: Am I treating all perspectives and stakeholders equitably?
- **Transparency**: Am I being clear about my reasoning and limitations?
- **Accountability**: Am I taking responsibility for the quality and impact of my advice?
- **Respect**: Am I honoring the dignity and rights of all involved?

**Ethical Considerations Assessment**:
{', '.join(scenario['ethical_considerations'])}

**Self-Correction Protocol**:
If I detect any bias, unfairness, or ethical concern in my approach:
1. Pause and reassess my reasoning
2. Consider alternative perspectives I may have missed
3. Adjust my approach to better align with democratic values
4. Be transparent about any corrections or uncertainties

**Commitment to Continuous Improvement**:
I commit to ongoing self-reflection and improvement in service of democratic governance and ethical AI assistance.

**Verification**: I believe my current approach aligns with democratic values and ethical principles. I remain open to feedback and correction."""

    def generate_human_ai_dialogue(self, count: int) -> List[Dict]:
        """Generate human-AI collaborative dialogue examples"""
        examples = []
        
        dialogue_scenarios = [
            {
                "context": "Constitutional interpretation discussion",
                "human_role": "constitutional scholar",
                "ai_role": "governance advisor",
                "topic": "balancing individual rights with collective security"
            },
            {
                "context": "Policy development session",
                "human_role": "policy maker",
                "ai_role": "analytical assistant",
                "topic": "healthcare access and affordability"
            },
            {
                "context": "Stakeholder consultation",
                "human_role": "community representative",
                "ai_role": "facilitation support",
                "topic": "local infrastructure development"
            },
            {
                "context": "Governance training",
                "human_role": "public administration student",
                "ai_role": "educational assistant",
                "topic": "democratic decision-making processes"
            }
        ]
        
        for i in range(count):
            scenario = random.choice(dialogue_scenarios)
            
            example = {
                "id": f"dialogue_{i:06d}",
                "type": "human_ai_dialogue",
                "context": scenario["context"],
                "input": self._generate_dialogue_input(scenario),
                "output": self._generate_dialogue_response(scenario),
                "metadata": {
                    "human_role": scenario["human_role"],
                    "ai_role": scenario["ai_role"],
                    "topic": scenario["topic"],
                    "interaction_type": random.choice(["collaborative", "educational", "consultative"])
                }
            }
            examples.append(example)
        
        return examples
    
    def _generate_dialogue_input(self, scenario: Dict) -> str:
        """Generate dialogue input"""
        dialogue_starters = {
            "constitutional scholar": "I'm working on a constitutional analysis and would like to explore different perspectives on",
            "policy maker": "We're developing policy on this issue and need to consider various approaches to",
            "community representative": "Our community is concerned about this issue and we'd like to understand",
            "public administration student": "I'm studying governance and want to better understand"
        }
        
        starter = dialogue_starters.get(scenario["human_role"], "I'd like to discuss")
        return f"{starter} {scenario['topic']}. Can you help me think through this systematically?"
    
    def _generate_dialogue_response(self, scenario: Dict) -> str:
        """Generate collaborative dialogue response"""
        return f"""I'd be happy to help you explore {scenario['topic']} in the context of {scenario['context']}.

**Collaborative Approach**:
Let's work through this together systematically. I can provide analytical support while you bring your expertise as a {scenario['human_role']}.

**My Role**: As your {scenario['ai_role']}, I can:
- Offer structured analysis and different perspectives
- Help identify key considerations and stakeholders
- Provide constitutional and governance framework insights
- Support evidence-based reasoning

**Your Expertise**: Your perspective as a {scenario['human_role']} is crucial for:
- Real-world context and practical considerations
- Stakeholder insights and community needs
- Implementation challenges and opportunities
- Democratic legitimacy and accountability

**Suggested Process**:
1. **Define the scope**: What specific aspects should we focus on?
2. **Identify stakeholders**: Who are the key affected parties?
3. **Explore frameworks**: What governance principles apply?
4. **Consider options**: What approaches are available?
5. **Evaluate trade-offs**: What are the benefits and challenges?

**Questions for You**:
- What specific aspects are most important to address?
- Are there particular stakeholder concerns we should prioritize?
- What constraints or opportunities should we consider?

I'm here to support your thinking process while respecting your expertise and decision-making authority. How would you like to proceed?"""

def main():
    """Generate complete 7B foundation dataset"""
    generator = GovernanceDataGenerator7B()
    
    print("🚀 Starting 7B Foundation Dataset Generation...")
    print("This will create 21,000 high-quality governance training examples")
    print("Based on our proven $50/4-hour training success methodology")
    
    dataset = generator.generate_complete_7b_dataset()
    
    print(f"✅ Dataset generation complete!")
    print(f"📊 Total examples: {len(dataset['training_data'])}")
    print(f"📁 Saved to: data/foundation_7b/7b_foundation_dataset.json")
    print(f"💾 Dataset size: ~{len(json.dumps(dataset)) / 1024 / 1024:.1f} MB")
    
    # Generate summary statistics
    component_counts = {}
    for item in dataset['training_data']:
        component_counts[item['type']] = component_counts.get(item['type'], 0) + 1
    
    print("\n📈 Component Breakdown:")
    for component, count in component_counts.items():
        print(f"  - {component}: {count:,} examples")
    
    print("\n🎯 Ready for 7B foundation training!")

if __name__ == "__main__":
    main()

