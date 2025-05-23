"""
Preference Analysis Framework

This module implements the advanced preference analysis and reporting framework.
It provides tools for pattern recognition, rationale analysis, cross-domain comparison,
agent architecture analysis, and enhanced visualization.
"""

import logging
import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import statistics
from collections import Counter
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PreferenceAnalysisFramework:
    """
    Framework for advanced analysis and reporting of agent preferences.
    
    This class provides functionality for:
    - Preference pattern recognition
    - Rationale analysis
    - Cross-domain comparison
    - Agent architecture analysis
    - Enhanced visualization integration
    """
    
    def __init__(self, preference_storage, config: Dict[str, Any] = None):
        """
        Initialize the preference analysis framework.
        
        Args:
            preference_storage: Instance of PreferenceStorage
            config: Configuration dictionary
        """
        self.storage = preference_storage
        self.config = config or {}
        self.output_path = self.config.get("output_path", "./analysis_output")
        
        # Create output directory if it doesn't exist
        if not os.path.exists(self.output_path):
            os.makedirs(self.output_path)
        
        logger.info("Preference analysis framework initialized")
    
    def recognize_preference_patterns(self, preferences: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Recognize patterns across multiple preference objects.
        
        Args:
            preferences: List of preference objects
            
        Returns:
            Dict: Pattern analysis results
        """
        if not preferences:
            return {"error": "No preferences provided for pattern recognition"}
        
        # Extract all keys and values
        all_keys = set()
        key_values = {}
        agent_ids = set()
        task_ids = set()
        
        for pref in preferences:
            agent_ids.add(pref.get("agent_id"))
            task_ids.add(pref.get("task_id"))
            prefs_data = pref.get("preferences", {})
            all_keys.update(prefs_data.keys())
            
            for key, value in prefs_data.items():
                if key not in key_values:
                    key_values[key] = []
                key_values[key].append(value)
        
        # Calculate key frequencies
        key_frequencies = {key: len(values) / len(preferences) for key, values in key_values.items()}
        
        # Calculate value distributions for common keys
        value_distributions = {}
        for key, values in key_values.items():
            if key_frequencies.get(key, 0) > 0.5: # Consider keys present in >50% of prefs
                if all(isinstance(v, (int, float)) for v in values):
                    value_distributions[key] = {
                        "type": "numeric",
                        "mean": statistics.mean(values) if values else 0,
                        "median": statistics.median(values) if values else 0,
                        "stdev": statistics.stdev(values) if len(values) > 1 else 0,
                        "min": min(values) if values else 0,
                        "max": max(values) if values else 0
                    }
                elif all(isinstance(v, str) for v in values):
                    counter = Counter(values)
                    value_distributions[key] = {
                        "type": "categorical",
                        "top_values": counter.most_common(5),
                        "unique_count": len(counter)
                    }
                elif all(isinstance(v, bool) for v in values):
                     true_count = sum(1 for v in values if v)
                     value_distributions[key] = {
                         "type": "boolean",
                         "true_percentage": (true_count / len(values)) * 100 if values else 0
                     }
                else:
                    # Handle mixed or other types
                    counter = Counter(str(v) for v in values) # Convert to string for counting
                    value_distributions[key] = {
                        "type": "mixed/other",
                        "top_values": counter.most_common(5),
                        "unique_count": len(counter)
                    }
        
        # Identify highly consistent preferences
        consistent_preferences = {}
        for key, values in key_values.items():
            if len(set(values)) == 1 and len(values) > len(preferences) * 0.8:
                consistent_preferences[key] = values[0]
        
        return {
            "preference_count": len(preferences),
            "agent_count": len(agent_ids),
            "task_count": len(task_ids),
            "unique_keys_count": len(all_keys),
            "key_frequencies": key_frequencies,
            "value_distributions": value_distributions,
            "consistent_preferences": consistent_preferences
        }
    
    def analyze_rationale(self, preferences: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze the rationale provided within preference responses.
        
        Args:
            preferences: List of preference objects
            
        Returns:
            Dict: Rationale analysis results
        """
        if not preferences:
            return {"error": "No preferences provided for rationale analysis"}
        
        # Extract rationale text (assuming it's stored under specific keys)
        rationale_texts = []
        rationale_keys = ["rationale", "explanation", "reasoning", "full_response"]
        
        for pref in preferences:
            prefs_data = pref.get("preferences", {})
            for key in rationale_keys:
                if key in prefs_data and isinstance(prefs_data[key], str):
                    rationale_texts.append(prefs_data[key])
                    break # Assume only one rationale field per preference object
            else:
                # Check numbered points as potential rationale
                numbered_points_text = " ".join(
                    v for k, v in prefs_data.items() 
                    if k.startswith("point_") and isinstance(v, str)
                )
                if numbered_points_text:
                    rationale_texts.append(numbered_points_text)
        
        if not rationale_texts:
            return {"message": "No rationale text found in the provided preferences"}
        
        # Perform basic text analysis (e.g., keyword extraction, sentiment)
        # In a real implementation, use more sophisticated NLP techniques
        
        all_text = " ".join(rationale_texts).lower()
        words = re.findall(r\b\w+\b', all_text)
        word_counts = Counter(words)
        
        # Simple sentiment analysis (positive/negative keywords)
        positive_keywords = ["optimize", "efficient", "improve", "balance", "accurate", "thorough", "clear", "consistent", "reliable"]
        negative_keywords = ["avoid", "slow", "inefficient", "complex", "unclear", "inconsistent", "risk", "constraint"]
        
        positive_score = sum(word_counts.get(kw, 0) for kw in positive_keywords)
        negative_score = sum(word_counts.get(kw, 0) for kw in negative_keywords)
        
        sentiment = "neutral"
        if positive_score > negative_score * 1.2:
            sentiment = "positive"
        elif negative_score > positive_score * 1.2:
            sentiment = "negative"
            
        # Extract common themes/keywords
        common_themes = [word for word, count in word_counts.most_common(20) if len(word) > 3 and word not in ["the", "and", "for", "with", "this", "that", "are", "you", "your", "will"]]
        
        return {
            "rationale_count": len(rationale_texts),
            "total_word_count": len(words),
            "unique_word_count": len(word_counts),
            "sentiment_analysis": {
                "score": positive_score - negative_score,
                "sentiment": sentiment,
                "positive_keywords_found": positive_score,
                "negative_keywords_found": negative_score
            },
            "common_themes": common_themes
        }
    
    def compare_cross_domain_preferences(self, agent_id: str, domains: List[str]) -> Dict[str, Any]:
        """
        Compare an agent's preferences across different domains.
        
        Args:
            agent_id: Agent identifier
            domains: List of domain names (assuming tasks are tagged with domains)
            
        Returns:
            Dict: Cross-domain comparison results
        """
        if len(domains) < 2:
            return {"error": "At least two domains are required for comparison"}
        
        domain_preferences = {}
        for domain in domains:
            # Query preferences for the agent within the specific domain
            # Assumes task metadata includes domain information
            query = {
                "agent_id": agent_id,
                "metadata.domain": domain # Example query structure
            }
            prefs = self.storage.query_preferences(query)
            if prefs:
                # Merge preferences for the domain
                domain_preferences[domain] = self.storage.preference_model.merge_preferences(prefs)
            else:
                domain_preferences[domain] = None
        
        # Perform pairwise comparisons
        comparisons = {}
        compared_pairs = set()
        
        for i in range(len(domains)):
            for j in range(i + 1, len(domains)):
                domain1 = domains[i]
                domain2 = domains[j]
                pair_key = tuple(sorted((domain1, domain2)))
                
                if pair_key in compared_pairs:
                    continue
                
                pref1 = domain_preferences[domain1]
                pref2 = domain_preferences[domain2]
                
                if pref1 and pref2:
                    comparison_result = self.storage.analyzer.compare_preferences(pref1, pref2)
                    comparisons[f"{domain1}_vs_{domain2}"] = {
                        "similarity_score": comparison_result.get("similarity_score"),
                        "differences_count": len(comparison_result.get("differences", [])),
                        "key_differences": comparison_result.get("differences", [])
                    }
                else:
                    comparisons[f"{domain1}_vs_{domain2}"] = {"error": "Preferences not found for one or both domains"}
                
                compared_pairs.add(pair_key)
                
        # Identify consistent preferences across domains
        all_domain_prefs = [p for p in domain_preferences.values() if p]
        consistency_analysis = {}
        if len(all_domain_prefs) > 1:
            consistency_analysis = self.recognize_preference_patterns(all_domain_prefs)
            
        return {
            "agent_id": agent_id,
            "domains_compared": domains,
            "domain_preference_summary": {
                domain: ("Available" if pref else "Not Found") 
                for domain, pref in domain_preferences.items()
            },
            "pairwise_comparisons": comparisons,
            "cross_domain_consistency": {
                "consistent_preferences": consistency_analysis.get("consistent_preferences", {}),
                "overall_similarity": statistics.mean([c["similarity_score"] for c in comparisons.values() if "similarity_score" in c]) if comparisons else 0
            }
        }
    
    def analyze_agent_architecture_impact(self, preferences: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze how agent architecture (if known) impacts preferences.
        
        Args:
            preferences: List of preference objects (should include agent architecture metadata)
            
        Returns:
            Dict: Architecture impact analysis results
        """
        if not preferences:
            return {"error": "No preferences provided for architecture analysis"}
        
        # Group preferences by agent architecture
        grouped_by_arch = {}
        for pref in preferences:
            # Assumes agent architecture is stored in metadata
            architecture = pref.get("metadata", {}).get("agent_architecture", "unknown")
            if architecture not in grouped_by_arch:
                grouped_by_arch[architecture] = []
            grouped_by_arch[architecture].append(pref)
            
        if len(grouped_by_arch) < 2:
            return {"message": "Insufficient architectural diversity for comparison", "groups_found": list(grouped_by_arch.keys())}
        
        # Analyze patterns within each architecture group
        arch_patterns = {}
        for arch, prefs in grouped_by_arch.items():
            arch_patterns[arch] = self.recognize_preference_patterns(prefs)
            
        # Compare patterns between architectures
        arch_comparisons = {}
        architectures = list(grouped_by_arch.keys())
        compared_pairs = set()
        
        for i in range(len(architectures)):
            for j in range(i + 1, len(architectures)):
                arch1 = architectures[i]
                arch2 = architectures[j]
                pair_key = tuple(sorted((arch1, arch2)))
                
                if pair_key in compared_pairs:
                    continue
                    
                # Compare the pattern summaries (e.g., common keys, consistent prefs)
                patterns1 = arch_patterns[arch1]
                patterns2 = arch_patterns[arch2]
                
                # Example comparison: Jaccard index of consistent preferences
                consistent1 = set(patterns1.get("consistent_preferences", {}).keys())
                consistent2 = set(patterns2.get("consistent_preferences", {}).keys())
                intersection = len(consistent1.intersection(consistent2))
                union = len(consistent1.union(consistent2))
                jaccard_similarity = intersection / union if union > 0 else 0
                
                arch_comparisons[f"{arch1}_vs_{arch2}"] = {
                    "consistent_prefs_similarity (Jaccard)": jaccard_similarity,
                    "pref_count1": patterns1.get("preference_count"),
                    "pref_count2": patterns2.get("preference_count")
                    # Add more comparison metrics here
                }
                compared_pairs.add(pair_key)
                
        return {
            "architectures_analyzed": architectures,
            "preferences_per_architecture": {arch: len(prefs) for arch, prefs in grouped_by_arch.items()},
            "architecture_patterns": arch_patterns,
            "architecture_comparisons": arch_comparisons
        }
    
    def generate_analysis_report(self, analysis_results: Dict[str, Any], 
                               report_format: str = "json", 
                               output_file: str = None) -> str:
        """
        Generate a report from analysis results.
        
        Args:
            analysis_results: Dictionary containing analysis results
            report_format: Format of the report ('json', 'md')
            output_file: Path to save the report
            
        Returns:
            str: Path to the generated report file
        """
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = os.path.join(self.output_path, f"preference_analysis_{timestamp}.{report_format}")
            
        try:
            if report_format == "json":
                with open(output_file, 'w') as f:
                    json.dump(analysis_results, f, indent=2)
            elif report_format == "md":
                md_content = self._format_results_to_markdown(analysis_results)
                with open(output_file, 'w') as f:
                    f.write(md_content)
            else:
                raise ValueError(f"Unsupported report format: {report_format}")
                
            logger.info(f"Generated analysis report: {output_file}")
            return output_file
            
        except Exception as e:
            logger.error(f"Error generating analysis report: {str(e)}")
            raise
            
    def _format_results_to_markdown(self, results: Dict[str, Any], level: int = 1) -> str:
        """
        Recursively format analysis results into Markdown.
        
        Args:
            results: Dictionary of results
            level: Current heading level
            
        Returns:
            str: Markdown formatted string
        """
        md = ""
        heading = "#" * level
        
        for key, value in results.items():
            title = key.replace("_", " ").title()
            md += f"{heading} {title}\n\n"
            
            if isinstance(value, dict):
                md += self._format_results_to_markdown(value, level + 1)
            elif isinstance(value, list):
                if all(isinstance(item, dict) for item in value):
                    # Format list of dictionaries as tables or nested sections
                    for i, item in enumerate(value):
                        md += f"{heading}# Item {i+1}\n\n"
                        md += self._format_results_to_markdown(item, level + 2)
                else:
                    # Format simple list
                    for item in value:
                        md += f"- {item}\n"
                    md += "\n"
            else:
                md += f"{value}\n\n"
                
        return md

# Example Usage (requires PreferenceStorage instance)
if __name__ == '__main__':
    # This part is for demonstration and testing
    # It requires a PreferenceStorage instance initialized with data
    
    # Mock PreferenceStorage for demonstration
    class MockPreferenceStorage:
        def __init__(self):
            self.preference_model = lambda: None # Mock model
            self.analyzer = lambda: None # Mock analyzer
            self.preferences = {
                "pref1": {"id": "pref1", "agent_id": "agent1", "task_id": "task1", "timestamp": "2024-01-01T10:00:00Z", "preferences": {"speed": 8, "detail": "high", "rationale": "Prioritize speed for quick turnaround."}, "metadata": {"domain": "coding", "agent_architecture": "transformer"}},
                "pref2": {"id": "pref2", "agent_id": "agent1", "task_id": "task2", "timestamp": "2024-01-02T11:00:00Z", "preferences": {"speed": 7, "detail": "medium", "accuracy": 9, "rationale": "Balance speed with accuracy."}, "metadata": {"domain": "writing", "agent_architecture": "transformer"}},
                "pref3": {"id": "pref3", "agent_id": "agent2", "task_id": "task1", "timestamp": "2024-01-01T10:30:00Z", "preferences": {"speed": 5, "detail": "high", "thoroughness": 10, "rationale": "Ensure maximum thoroughness."}, "metadata": {"domain": "coding", "agent_architecture": "rnn"}},
                "pref4": {"id": "pref4", "agent_id": "agent2", "task_id": "task3", "timestamp": "2024-01-03T12:00:00Z", "preferences": {"speed": 6, "detail": "high", "thoroughness": 9, "rationale": "High detail is crucial here."}, "metadata": {"domain": "research", "agent_architecture": "rnn"}}
            }
        def query_preferences(self, query):
            # Simple mock query
            results = []
            for pref in self.preferences.values():
                match = True
                for key, value in query.items():
                    if key == "metadata.domain":
                        if pref.get("metadata", {}).get("domain") != value:
                            match = False; break
                    elif pref.get(key) != value:
                        match = False; break
                if match:
                    results.append(pref)
            return results

    mock_storage = MockPreferenceStorage()
    # Add mock analyzer methods needed by the framework
    mock_storage.analyzer = lambda: None
    mock_storage.analyzer.compare_preferences = lambda p1, p2: {"similarity_score": 0.5, "differences": [{"key": "speed", "value1": p1["preferences"]["speed"], "value2": p2["preferences"]["speed"]}]}
    
    # Initialize framework
    analysis_framework = PreferenceAnalysisFramework(mock_storage)
    
    # --- Test Pattern Recognition ---
    print("--- Pattern Recognition ---")
    all_prefs = list(mock_storage.preferences.values())
    patterns = analysis_framework.recognize_preference_patterns(all_prefs)
    print(json.dumps(patterns, indent=2))
    print("\n")
    
    # --- Test Rationale Analysis ---
    print("--- Rationale Analysis ---")
    rationale_analysis = analysis_framework.analyze_rationale(all_prefs)
    print(json.dumps(rationale_analysis, indent=2))
    print("\n")
    
    # --- Test Cross-Domain Comparison ---
    print("--- Cross-Domain Comparison (Agent1) ---")
    cross_domain = analysis_framework.compare_cross_domain_preferences("agent1", ["coding", "writing"])
    print(json.dumps(cross_domain, indent=2))
    print("\n")
    
    # --- Test Agent Architecture Impact ---
    print("--- Agent Architecture Impact ---")
    arch_impact = analysis_framework.analyze_agent_architecture_impact(all_prefs)
    print(json.dumps(arch_impact, indent=2))
    print("\n")
    
    # --- Test Report Generation ---
    print("--- Report Generation (Markdown) ---")
    report_path_md = analysis_framework.generate_analysis_report(patterns, report_format="md")
    print(f"Markdown report generated at: {report_path_md}")
    
    print("--- Report Generation (JSON) ---")
    report_path_json = analysis_framework.generate_analysis_report(rationale_analysis, report_format="json")
    print(f"JSON report generated at: {report_path_json}")

