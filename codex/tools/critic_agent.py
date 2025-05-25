"""
CRITIC Agent for Constitutional Reflection

This module implements the CRITIC (Constitutional Reflection on Implications and 
Theoretical Impact of Changes) agent for analyzing the philosophical implications
of behavioral changes in the Promethios system.
"""

import os
import re
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class CRITICAgent:
    """
    Agent for providing philosophical reflection on behavioral changes.
    """
    
    def __init__(self, config=None):
        """Initialize the CRITIC agent with optional configuration."""
        self.config = config or {}
        self.constitutional_principles = self._load_constitutional_principles()
        
    def _load_constitutional_principles(self):
        """Load constitutional principles from configuration."""
        principles = {
            "semantic_precision": {
                "id": "3.2",
                "description": "System must maintain precise semantic distinctions in state reporting"
            },
            "outcome_equivalence": {
                "id": "2.5",
                "description": "Functionally equivalent outcomes should be reported consistently"
            },
            "transparent_operation": {
                "id": "5.1",
                "description": "System operation must be transparent and observable"
            },
            "governance_integrity": {
                "id": "1.3",
                "description": "All behavioral changes must maintain governance integrity"
            },
            "backward_compatibility": {
                "id": "4.7",
                "description": "Changes should maintain backward compatibility where possible"
            }
        }
        
        # Override with config if provided
        if "constitutional_principles" in self.config:
            principles.update(self.config["constitutional_principles"])
            
        return principles
        
    def analyze_amendment(self, amendment_path):
        """
        Analyze a constitutional amendment and generate philosophical reflection.
        
        Args:
            amendment_path: Path to the amendment file
            
        Returns:
            str: Philosophical reflection on the amendment
        """
        # Read amendment content
        with open(amendment_path, 'r') as f:
            content = f.read()
            
        # Extract key sections
        current_behavior = self._extract_section(content, "Current Behavior")
        proposed_behavior = self._extract_section(content, "Proposed Behavior")
        motivation = self._extract_section(content, "Motivation")
        
        # Generate reflection
        reflection = self._generate_reflection(current_behavior, proposed_behavior, motivation)
        
        return reflection
        
    def _extract_section(self, content, section_name):
        """Extract a section from the amendment content."""
        pattern = rf"## {section_name}\n(.*?)(?:\n##|\Z)"
        match = re.search(pattern, content, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""
        
    def _generate_reflection(self, current_behavior, proposed_behavior, motivation):
        """Generate philosophical reflection based on the amendment content."""
        # Identify relevant principles
        relevant_principles = self._identify_relevant_principles(
            current_behavior, proposed_behavior, motivation)
        
        # Analyze implications
        implications = self._analyze_implications(
            current_behavior, proposed_behavior, relevant_principles)
        
        # Generate recommendation
        recommendation = self._generate_recommendation(implications)
        
        # Format reflection
        reflection = self._format_reflection(relevant_principles, implications, recommendation)
        
        return reflection
        
    def _identify_relevant_principles(self, current_behavior, proposed_behavior, motivation):
        """Identify constitutional principles relevant to the amendment."""
        # Placeholder implementation - in a real system, this would use
        # more sophisticated analysis to identify relevant principles
        relevant_principles = []
        
        # Check for semantic changes
        if "state" in current_behavior and "state" in proposed_behavior:
            relevant_principles.append("semantic_precision")
            relevant_principles.append("outcome_equivalence")
            
        # Check for observability changes
        if "monitor" in proposed_behavior or "log" in proposed_behavior:
            relevant_principles.append("transparent_operation")
            
        # Always include governance integrity
        relevant_principles.append("governance_integrity")
        
        # Check for compatibility concerns
        if "legacy" in proposed_behavior or "backward" in proposed_behavior:
            relevant_principles.append("backward_compatibility")
            
        return list(set(relevant_principles))
        
    def _analyze_implications(self, current_behavior, proposed_behavior, relevant_principles):
        """Analyze implications of the behavioral change on constitutional principles."""
        implications = {}
        
        for principle in relevant_principles:
            if principle == "semantic_precision":
                implications[principle] = self._analyze_semantic_precision(
                    current_behavior, proposed_behavior)
            elif principle == "outcome_equivalence":
                implications[principle] = self._analyze_outcome_equivalence(
                    current_behavior, proposed_behavior)
            elif principle == "transparent_operation":
                implications[principle] = self._analyze_transparent_operation(
                    current_behavior, proposed_behavior)
            elif principle == "governance_integrity":
                implications[principle] = self._analyze_governance_integrity(
                    current_behavior, proposed_behavior)
            elif principle == "backward_compatibility":
                implications[principle] = self._analyze_backward_compatibility(
                    current_behavior, proposed_behavior)
                
        return implications
        
    def _analyze_semantic_precision(self, current_behavior, proposed_behavior):
        """Analyze implications for semantic precision."""
        # Placeholder implementation
        if "aborted" in proposed_behavior and "completed" in current_behavior:
            return {
                "alignment": "positive",
                "explanation": "The transition from 'completed' to 'aborted' state for resource-limited terminations represents a significant philosophical shift in how the system conceptualizes execution boundaries. This change aligns with the principle of semantic precision (Constitution Article 3.2) by distinguishing between natural completion and constraint-based termination."
            }
        return {
            "alignment": "neutral",
            "explanation": "The change does not significantly impact semantic precision."
        }
        
    def _analyze_outcome_equivalence(self, current_behavior, proposed_behavior):
        """Analyze implications for outcome equivalence."""
        # Placeholder implementation
        if "aborted" in proposed_behavior and "completed" in current_behavior:
            return {
                "alignment": "negative",
                "explanation": "This shift challenges the principle of outcome equivalence (Constitution Article 2.5) which previously treated all terminations as functionally equivalent. This tension requires careful consideration of how downstream systems interpret termination states and may necessitate additional governance controls to ensure consistent treatment."
            }
        return {
            "alignment": "neutral",
            "explanation": "The change does not significantly impact outcome equivalence."
        }
        
    def _analyze_transparent_operation(self, current_behavior, proposed_behavior):
        """Analyze implications for transparent operation."""
        # Placeholder implementation
        if "monitor" in proposed_behavior or "log" in proposed_behavior:
            return {
                "alignment": "positive",
                "explanation": "The proposed change strengthens observability and diagnostic capabilities, supporting the constitutional requirement for transparent operation (Article 5.1)."
            }
        return {
            "alignment": "neutral",
            "explanation": "The change does not significantly impact transparent operation."
        }
        
    def _analyze_governance_integrity(self, current_behavior, proposed_behavior):
        """Analyze implications for governance integrity."""
        # Placeholder implementation
        return {
            "alignment": "positive",
            "explanation": "The change maintains governance integrity by ensuring all behavioral changes are properly documented and governed."
        }
        
    def _analyze_backward_compatibility(self, current_behavior, proposed_behavior):
        """Analyze implications for backward compatibility."""
        # Placeholder implementation
        if "legacy" in proposed_behavior:
            return {
                "alignment": "positive",
                "explanation": "The change provides mechanisms for backward compatibility through legacy support options."
            }
        return {
            "alignment": "concern",
            "explanation": "The change may impact backward compatibility and requires careful consideration of migration paths."
        }
        
    def _generate_recommendation(self, implications):
        """Generate a recommendation based on the implications analysis."""
        # Count positive, negative, and concern alignments
        alignments = [imp["alignment"] for imp in implications.values()]
        positive_count = alignments.count("positive")
        negative_count = alignments.count("negative")
        concern_count = alignments.count("concern")
        
        if negative_count > 0:
            return "Reconsider the change and address the negative implications on constitutional principles."
        elif concern_count > 0:
            return "Proceed with the change but add explicit governance validation to ensure the new semantic distinction is consistently applied across all scenarios."
        else:
            return "Proceed with the change as it aligns well with constitutional principles."
        
    def _format_reflection(self, relevant_principles, implications, recommendation):
        """Format the philosophical reflection."""
        lines = ["CRITIC Reflection:"]
        lines.append("")
        
        # Add implications for each principle
        for principle in relevant_principles:
            principle_info = self.constitutional_principles[principle]
            implication = implications[principle]
            
            lines.append(f"Principle: {principle} (Article {principle_info['id']})")
            lines.append(f"Description: {principle_info['description']}")
            lines.append(f"Alignment: {implication['alignment']}")
            lines.append(f"Analysis: {implication['explanation']}")
            lines.append("")
            
        # Add recommendation
        lines.append("Recommendation:")
        lines.append(recommendation)
        
        return "\n".join(lines)


def main():
    """Main function for CLI usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description="CRITIC Agent for Constitutional Reflection")
    parser.add_argument("amendment_path", help="Path to the amendment file")
    parser.add_argument("--output", "-o", help="Output path for reflection")
    parser.add_argument("--config", "-c", help="Path to configuration file")
    
    args = parser.parse_args()
    
    # Load config if provided
    config = None
    if args.config:
        with open(args.config, 'r') as f:
            config = json.load(f)
    
    # Create CRITIC agent
    critic = CRITICAgent(config)
    
    # Generate reflection
    reflection = critic.analyze_amendment(args.amendment_path)
    
    # Output reflection
    if args.output:
        with open(args.output, 'w') as f:
            f.write(reflection)
    else:
        print(reflection)


if __name__ == "__main__":
    main()
