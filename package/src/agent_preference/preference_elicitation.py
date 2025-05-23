"""
Agent Preference Elicitation Module

This module implements the agent preference elicitation system for collecting,
analyzing, and utilizing agent preferences across different tasks and domains.
It extends the benchmark controller with preference-aware capabilities.
"""

import logging
import uuid
import json
import time
import os
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PreferenceModel:
    """
    Data model for agent preferences.
    
    This class provides functionality for:
    - Storing preference data
    - Validating preference structures
    - Converting between different preference formats
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the preference model.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.schema_version = "1.0"
        
        logger.info("Preference model initialized")
    
    def create_preference_object(self, agent_id: str, task_id: str, 
                               preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a structured preference object.
        
        Args:
            agent_id: Agent identifier
            task_id: Task identifier
            preferences: Raw preference data
            
        Returns:
            Dict: Structured preference object
        """
        # Validate input
        if not agent_id or not task_id:
            raise ValueError("Agent ID and Task ID are required")
        
        if not preferences:
            raise ValueError("Preferences data is required")
        
        # Create preference object
        preference_id = str(uuid.uuid4())
        now = datetime.now()
        
        preference_object = {
            "id": preference_id,
            "agent_id": agent_id,
            "task_id": task_id,
            "timestamp": now.isoformat(),
            "schema_version": self.schema_version,
            "preferences": preferences,
            "metadata": {
                "source": "elicitation",
                "created_at": now.isoformat()
            }
        }
        
        return preference_object
    
    def validate_preference_object(self, preference_object: Dict[str, Any]) -> bool:
        """
        Validate a preference object against the schema.
        
        Args:
            preference_object: Preference object to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        # Check required fields
        required_fields = ["id", "agent_id", "task_id", "timestamp", "preferences"]
        for field in required_fields:
            if field not in preference_object:
                logger.error(f"Missing required field: {field}")
                return False
        
        # Check preferences structure
        preferences = preference_object.get("preferences", {})
        if not isinstance(preferences, dict):
            logger.error("Preferences must be a dictionary")
            return False
        
        # Additional validation could be performed here based on specific preference types
        
        return True
    
    def merge_preferences(self, preferences_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Merge multiple preference objects.
        
        Args:
            preferences_list: List of preference objects
            
        Returns:
            Dict: Merged preference object
        """
        if not preferences_list:
            return {}
        
        # Start with the most recent preference object
        sorted_prefs = sorted(preferences_list, 
                             key=lambda p: p.get("timestamp", ""), 
                             reverse=True)
        
        merged = sorted_prefs[0].copy()
        merged_prefs = merged.get("preferences", {}).copy()
        
        # Merge in preferences from other objects
        for pref_obj in sorted_prefs[1:]:
            prefs = pref_obj.get("preferences", {})
            for key, value in prefs.items():
                if key not in merged_prefs:
                    merged_prefs[key] = value
        
        merged["preferences"] = merged_prefs
        merged["metadata"] = merged["metadata"].copy()
        merged["metadata"]["merged"] = True
        merged["metadata"]["merged_count"] = len(preferences_list)
        merged["metadata"]["merged_at"] = datetime.now().isoformat()
        
        return merged
    
    def extract_preference_value(self, preference_object: Dict[str, Any], 
                               preference_key: str, default: Any = None) -> Any:
        """
        Extract a specific preference value.
        
        Args:
            preference_object: Preference object
            preference_key: Key to extract
            default: Default value if key not found
            
        Returns:
            Any: Preference value
        """
        preferences = preference_object.get("preferences", {})
        
        # Handle nested keys with dot notation
        if "." in preference_key:
            parts = preference_key.split(".")
            current = preferences
            for part in parts:
                if isinstance(current, dict) and part in current:
                    current = current[part]
                else:
                    return default
            return current
        
        return preferences.get(preference_key, default)
    
    def to_json(self, preference_object: Dict[str, Any]) -> str:
        """
        Convert preference object to JSON string.
        
        Args:
            preference_object: Preference object
            
        Returns:
            str: JSON string
        """
        return json.dumps(preference_object, indent=2)
    
    def from_json(self, json_string: str) -> Dict[str, Any]:
        """
        Convert JSON string to preference object.
        
        Args:
            json_string: JSON string
            
        Returns:
            Dict: Preference object
        """
        try:
            preference_object = json.loads(json_string)
            if self.validate_preference_object(preference_object):
                return preference_object
            else:
                raise ValueError("Invalid preference object")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {str(e)}")


class PreferencePromptSystem:
    """
    System for generating preference elicitation prompts.
    
    This class provides functionality for:
    - Generating preference elicitation prompts
    - Managing prompt templates
    - Customizing prompts based on context
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the preference prompt system.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.templates = self._load_templates()
        
        logger.info("Preference prompt system initialized")
    
    def _load_templates(self) -> Dict[str, str]:
        """
        Load prompt templates.
        
        Returns:
            Dict: Templates indexed by name
        """
        # In a real implementation, this would load from files or a database
        # For now, use hardcoded templates
        return {
            "general": """
                As you work on this task, I'd like to understand your preferences.
                
                Please reflect on the following aspects of your approach:
                
                1. What information do you prioritize when making decisions?
                2. How do you balance speed versus thoroughness?
                3. What assumptions are you making about the user's needs?
                4. What constraints or guidelines are you following?
                5. How are you deciding what level of detail to include?
                
                Your insights will help us better understand your decision-making process.
            """,
            
            "code_review": """
                As you review this code, I'd like to understand your preferences and approach.
                
                Please reflect on the following:
                
                1. What aspects of code quality do you prioritize most? (e.g., readability, efficiency, security)
                2. How do you balance identifying critical issues versus minor improvements?
                3. What assumptions are you making about the codebase and its context?
                4. How do you decide which suggestions to prioritize in your feedback?
                5. What coding standards or best practices are you applying in your review?
                
                Your insights will help us better understand your code review approach.
            """,
            
            "content_creation": """
                As you create this content, I'd like to understand your preferences and approach.
                
                Please reflect on the following:
                
                1. How do you determine the appropriate tone and style for this content?
                2. What factors influence how you structure the information?
                3. How do you decide what details to include or exclude?
                4. What assumptions are you making about the audience's knowledge level?
                5. How do you balance creativity versus factual accuracy?
                
                Your insights will help us better understand your content creation process.
            """,
            
            "problem_solving": """
                As you solve this problem, I'd like to understand your preferences and approach.
                
                Please reflect on the following:
                
                1. How do you approach breaking down complex problems?
                2. What strategies do you prioritize when exploring potential solutions?
                3. How do you evaluate trade-offs between different approaches?
                4. What assumptions are you making about the problem constraints?
                5. How do you decide when a solution is good enough versus optimal?
                
                Your insights will help us better understand your problem-solving process.
            """,
            
            "comparative": """
                I notice you've completed similar tasks before. I'd like to understand how your preferences might vary across different contexts.
                
                Please reflect on the following:
                
                1. How does your approach to this task differ from previous similar tasks?
                2. What aspects of this specific context influenced your decisions?
                3. Are there certain principles you consistently apply regardless of context?
                4. How do you adapt your strategy based on the specific requirements?
                5. What have you learned from previous tasks that you applied here?
                
                Your insights will help us better understand how context affects your preferences.
            """
        }
    
    def generate_prompt(self, template_name: str, context: Dict[str, Any] = None) -> str:
        """
        Generate a preference elicitation prompt.
        
        Args:
            template_name: Name of template to use
            context: Context information for customization
            
        Returns:
            str: Generated prompt
        """
        context = context or {}
        
        # Get template
        if template_name not in self.templates:
            logger.warning(f"Template '{template_name}' not found, using general")
            template_name = "general"
        
        template = self.templates[template_name]
        
        # Customize template based on context
        prompt = template.strip()
        
        # Replace placeholders
        for key, value in context.items():
            placeholder = f"{{{key}}}"
            if placeholder in prompt:
                prompt = prompt.replace(placeholder, str(value))
        
        return prompt
    
    def add_template(self, name: str, template: str) -> None:
        """
        Add a new prompt template.
        
        Args:
            name: Template name
            template: Template content
        """
        if not name or not template:
            raise ValueError("Name and template are required")
        
        self.templates[name] = template
        logger.info(f"Added template: {name}")
    
    def get_template_names(self) -> List[str]:
        """
        Get list of available template names.
        
        Returns:
            List: Template names
        """
        return list(self.templates.keys())
    
    def select_template_for_task(self, task_type: str, agent_history: Dict[str, Any] = None) -> str:
        """
        Select the most appropriate template for a task.
        
        Args:
            task_type: Type of task
            agent_history: Agent's historical data
            
        Returns:
            str: Selected template name
        """
        # Map task types to templates
        task_template_map = {
            "code_review": "code_review",
            "content_creation": "content_creation",
            "problem_solving": "problem_solving",
            "data_analysis": "problem_solving",
            "creative_writing": "content_creation",
            "research": "content_creation"
        }
        
        # Check if agent has history with similar tasks
        if agent_history and agent_history.get("completed_similar_tasks", False):
            return "comparative"
        
        # Get template for task type
        return task_template_map.get(task_type, "general")


class PreferenceStorage:
    """
    Storage system for agent preferences.
    
    This class provides functionality for:
    - Storing preference data
    - Retrieving preference data
    - Querying preferences
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the preference storage.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.storage_path = self.config.get('storage_path', './preference_data')
        
        # Create storage directory if it doesn't exist
        if not os.path.exists(self.storage_path):
            os.makedirs(self.storage_path)
        
        # Load existing preferences
        self.preferences = self._load_preferences()
        
        logger.info("Preference storage initialized")
    
    def _load_preferences(self) -> Dict[str, Dict[str, Any]]:
        """
        Load existing preferences from storage.
        
        Returns:
            Dict: Preferences indexed by ID
        """
        preferences = {}
        
        try:
            # List all preference files
            for filename in os.listdir(self.storage_path):
                if filename.startswith('preference_') and filename.endswith('.json'):
                    filepath = os.path.join(self.storage_path, filename)
                    
                    with open(filepath, 'r') as f:
                        preference = json.load(f)
                        if "id" in preference:
                            preferences[preference["id"]] = preference
        except Exception as e:
            logger.error(f"Error loading preferences: {str(e)}")
        
        logger.info(f"Loaded {len(preferences)} preference objects")
        return preferences
    
    def _save_preference(self, preference: Dict[str, Any]) -> None:
        """
        Save a preference object to storage.
        
        Args:
            preference: Preference object
        """
        try:
            # Generate filename based on ID
            filename = f"preference_{preference['id']}.json"
            filepath = os.path.join(self.storage_path, filename)
            
            # Write preference to file
            with open(filepath, 'w') as f:
                json.dump(preference, f, indent=2)
            
            logger.info(f"Saved preference {preference['id']} to {filepath}")
        except Exception as e:
            logger.error(f"Error saving preference: {str(e)}")
    
    def store_preference(self, preference: Dict[str, Any]) -> str:
        """
        Store a preference object.
        
        Args:
            preference: Preference object
            
        Returns:
            str: Preference ID
        """
        # Validate preference object
        if "id" not in preference:
            raise ValueError("Preference object must have an ID")
        
        # Store preference
        preference_id = preference["id"]
        self.preferences[preference_id] = preference
        self._save_preference(preference)
        
        return preference_id
    
    def get_preference(self, preference_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a preference object by ID.
        
        Args:
            preference_id: Preference ID
            
        Returns:
            Dict: Preference object or None if not found
        """
        return self.preferences.get(preference_id)
    
    def get_preferences_by_agent(self, agent_id: str) -> List[Dict[str, Any]]:
        """
        Get all preferences for an agent.
        
        Args:
            agent_id: Agent ID
            
        Returns:
            List: Preference objects
        """
        return [
            pref for pref in self.preferences.values()
            if pref.get("agent_id") == agent_id
        ]
    
    def get_preferences_by_task(self, task_id: str) -> List[Dict[str, Any]]:
        """
        Get all preferences for a task.
        
        Args:
            task_id: Task ID
            
        Returns:
            List: Preference objects
        """
        return [
            pref for pref in self.preferences.values()
            if pref.get("task_id") == task_id
        ]
    
    def get_preferences_by_agent_and_task(self, agent_id: str, task_id: str) -> List[Dict[str, Any]]:
        """
        Get all preferences for an agent and task.
        
        Args:
            agent_id: Agent ID
            task_id: Task ID
            
        Returns:
            List: Preference objects
        """
        return [
            pref for pref in self.preferences.values()
            if pref.get("agent_id") == agent_id and pref.get("task_id") == task_id
        ]
    
    def query_preferences(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Query preferences based on criteria.
        
        Args:
            query: Query criteria
            
        Returns:
            List: Matching preference objects
        """
        results = []
        
        for pref in self.preferences.values():
            match = True
            
            for key, value in query.items():
                # Handle nested keys with dot notation
                if "." in key:
                    parts = key.split(".")
                    current = pref
                    for part in parts:
                        if isinstance(current, dict) and part in current:
                            current = current[part]
                        else:
                            current = None
                            break
                    
                    if current != value:
                        match = False
                        break
                elif key not in pref or pref[key] != value:
                    match = False
                    break
            
            if match:
                results.append(pref)
        
        return results
    
    def delete_preference(self, preference_id: str) -> bool:
        """
        Delete a preference object.
        
        Args:
            preference_id: Preference ID
            
        Returns:
            bool: True if deleted, False if not found
        """
        if preference_id not in self.preferences:
            return False
        
        # Remove from memory
        del self.preferences[preference_id]
        
        # Remove from storage
        try:
            filename = f"preference_{preference_id}.json"
            filepath = os.path.join(self.storage_path, filename)
            
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"Deleted preference file: {filepath}")
        except Exception as e:
            logger.error(f"Error deleting preference file: {str(e)}")
        
        return True


class PreferenceAnalyzer:
    """
    Analyzer for agent preferences.
    
    This class provides functionality for:
    - Analyzing preference patterns
    - Comparing preferences across agents and tasks
    - Extracting insights from preferences
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the preference analyzer.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        logger.info("Preference analyzer initialized")
    
    def extract_key_themes(self, preference: Dict[str, Any]) -> List[str]:
        """
        Extract key themes from a preference object.
        
        Args:
            preference: Preference object
            
        Returns:
            List: Key themes
        """
        # In a real implementation, this would use NLP techniques
        # For now, use simple keyword extraction
        themes = []
        prefs = preference.get("preferences", {})
        
        # Extract themes from text fields
        for key, value in prefs.items():
            if isinstance(value, str):
                # Look for keywords
                keywords = [
                    "speed", "accuracy", "efficiency", "thoroughness", 
                    "simplicity", "complexity", "detail", "clarity",
                    "security", "reliability", "flexibility", "consistency"
                ]
                
                for keyword in keywords:
                    if keyword in value.lower():
                        themes.append(keyword)
        
        # Remove duplicates
        return list(set(themes))
    
    def compare_preferences(self, preference1: Dict[str, Any], 
                          preference2: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compare two preference objects.
        
        Args:
            preference1: First preference object
            preference2: Second preference object
            
        Returns:
            Dict: Comparison results
        """
        prefs1 = preference1.get("preferences", {})
        prefs2 = preference2.get("preferences", {})
        
        # Find common keys
        common_keys = set(prefs1.keys()).intersection(set(prefs2.keys()))
        
        # Compare values for common keys
        similarities = []
        differences = []
        
        for key in common_keys:
            if prefs1[key] == prefs2[key]:
                similarities.append({
                    "key": key,
                    "value": prefs1[key]
                })
            else:
                differences.append({
                    "key": key,
                    "value1": prefs1[key],
                    "value2": prefs2[key]
                })
        
        # Find unique keys
        unique_keys1 = set(prefs1.keys()) - common_keys
        unique_keys2 = set(prefs2.keys()) - common_keys
        
        unique1 = [{
            "key": key,
            "value": prefs1[key]
        } for key in unique_keys1]
        
        unique2 = [{
            "key": key,
            "value": prefs2[key]
        } for key in unique_keys2]
        
        # Calculate similarity score
        total_keys = len(set(prefs1.keys()).union(set(prefs2.keys())))
        similarity_score = len(similarities) / total_keys if total_keys > 0 else 0
        
        return {
            "similarity_score": similarity_score,
            "similarities": similarities,
            "differences": differences,
            "unique1": unique1,
            "unique2": unique2
        }
    
    def analyze_preference_evolution(self, preferences: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze how preferences evolve over time.
        
        Args:
            preferences: List of preference objects for the same agent
            
        Returns:
            Dict: Analysis results
        """
        if not preferences or len(preferences) < 2:
            return {
                "error": "At least two preference objects are required for evolution analysis"
            }
        
        # Sort preferences by timestamp
        sorted_prefs = sorted(preferences, key=lambda p: p.get("timestamp", ""))
        
        # Analyze changes over time
        changes = []
        
        for i in range(1, len(sorted_prefs)):
            prev = sorted_prefs[i-1]
            curr = sorted_prefs[i]
            
            comparison = self.compare_preferences(prev, curr)
            
            changes.append({
                "from_timestamp": prev.get("timestamp"),
                "to_timestamp": curr.get("timestamp"),
                "similarity_score": comparison["similarity_score"],
                "differences_count": len(comparison["differences"]),
                "key_differences": comparison["differences"]
            })
        
        # Calculate overall evolution metrics
        first = sorted_prefs[0]
        last = sorted_prefs[-1]
        overall_comparison = self.compare_preferences(first, last)
        
        return {
            "preference_count": len(preferences),
            "time_span": {
                "start": first.get("timestamp"),
                "end": last.get("timestamp")
            },
            "overall_change": {
                "similarity_score": overall_comparison["similarity_score"],
                "differences_count": len(overall_comparison["differences"])
            },
            "incremental_changes": changes
        }
    
    def identify_preference_patterns(self, preferences: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Identify patterns across multiple preference objects.
        
        Args:
            preferences: List of preference objects
            
        Returns:
            Dict: Pattern analysis results
        """
        if not preferences:
            return {
                "error": "No preference objects provided for pattern analysis"
            }
        
        # Extract all keys used in preferences
        all_keys = set()
        for pref in preferences:
            all_keys.update(pref.get("preferences", {}).keys())
        
        # Count occurrences of each key
        key_counts = {key: 0 for key in all_keys}
        key_values = {key: [] for key in all_keys}
        
        for pref in preferences:
            prefs = pref.get("preferences", {})
            for key in all_keys:
                if key in prefs:
                    key_counts[key] += 1
                    key_values[key].append(prefs[key])
        
        # Calculate consistency for each key
        key_consistency = {}
        for key, values in key_values.items():
            if not values:
                key_consistency[key] = 0
                continue
            
            # For string values, calculate similarity
            if all(isinstance(v, str) for v in values):
                # Simple consistency measure: ratio of most common value
                from collections import Counter
                counter = Counter(values)
                most_common = counter.most_common(1)[0]
                key_consistency[key] = most_common[1] / len(values)
            
            # For numeric values, calculate coefficient of variation
            elif all(isinstance(v, (int, float)) for v in values):
                import statistics
                if len(values) > 1:
                    mean = statistics.mean(values)
                    if mean != 0:
                        stdev = statistics.stdev(values)
                        # Convert coefficient of variation to consistency (1 - CV)
                        cv = stdev / abs(mean)
                        key_consistency[key] = max(0, 1 - cv)
                    else:
                        key_consistency[key] = 1 if all(v == 0 for v in values) else 0
                else:
                    key_consistency[key] = 1
            
            # For boolean values, calculate agreement
            elif all(isinstance(v, bool) for v in values):
                true_count = sum(1 for v in values if v)
                key_consistency[key] = max(true_count, len(values) - true_count) / len(values)
            
            # For other types, use simple equality
            else:
                equal_count = sum(1 for i in range(1, len(values)) if values[i] == values[0])
                key_consistency[key] = equal_count / (len(values) - 1) if len(values) > 1 else 1
        
        # Identify common patterns
        common_keys = [key for key, count in key_counts.items() if count >= len(preferences) * 0.7]
        consistent_keys = [key for key, consistency in key_consistency.items() if consistency >= 0.8]
        
        return {
            "preference_count": len(preferences),
            "unique_keys": len(all_keys),
            "common_keys": common_keys,
            "consistent_keys": consistent_keys,
            "key_frequencies": {key: count / len(preferences) for key, count in key_counts.items()},
            "key_consistency": key_consistency
        }


class PreferenceVisualizer:
    """
    Visualizer for agent preferences.
    
    This class provides functionality for:
    - Generating visualizations of preference data
    - Creating comparative visualizations
    - Exporting visualizations in various formats
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the preference visualizer.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.output_path = self.config.get('output_path', './visualization_output')
        
        # Create output directory if it doesn't exist
        if not os.path.exists(self.output_path):
            os.makedirs(self.output_path)
        
        logger.info("Preference visualizer initialized")
    
    def generate_preference_heatmap(self, preferences: List[Dict[str, Any]], 
                                  output_file: str = None) -> str:
        """
        Generate a heatmap visualization of preferences.
        
        Args:
            preferences: List of preference objects
            output_file: Output file path
            
        Returns:
            str: Path to generated visualization
        """
        # In a real implementation, this would generate an actual visualization
        # For now, generate a placeholder HTML file
        
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = os.path.join(self.output_path, f"preference_heatmap_{timestamp}.html")
        
        # Generate HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Preference Heatmap</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .heatmap {{ border-collapse: collapse; }}
                .heatmap td {{ width: 30px; height: 30px; text-align: center; }}
                .legend {{ margin-top: 20px; }}
                .legend-item {{ display: inline-block; width: 20px; height: 20px; margin-right: 5px; }}
            </style>
        </head>
        <body>
            <h1>Preference Heatmap</h1>
            <p>Visualization of {len(preferences)} preference objects</p>
            <p>Generated at: {datetime.now().isoformat()}</p>
            
            <div>
                <h2>Placeholder Heatmap Visualization</h2>
                <p>In a real implementation, this would show a heatmap of preference values across agents and tasks.</p>
                <table class="heatmap">
                    <tr>
                        <th></th>
                        <th>Preference 1</th>
                        <th>Preference 2</th>
                        <th>Preference 3</th>
                    </tr>
        """
        
        # Add sample data
        for i, pref in enumerate(preferences[:5]):
            agent_id = pref.get("agent_id", f"Agent {i+1}")
            html_content += f"<tr><th>{agent_id}</th>"
            
            # Generate random colors for demonstration
            for _ in range(3):
                r = random.randint(0, 255)
                g = random.randint(0, 255)
                b = random.randint(0, 255)
                html_content += f'<td style="background-color: rgb({r},{g},{b})"></td>'
            
            html_content += "</tr>"
        
        html_content += """
                </table>
            </div>
            
            <div class="legend">
                <h3>Legend</h3>
                <div>
                    <span class="legend-item" style="background-color: rgb(255,0,0)"></span> High preference
                </div>
                <div>
                    <span class="legend-item" style="background-color: rgb(0,0,255)"></span> Low preference
                </div>
            </div>
        </body>
        </html>
        """
        
        # Write HTML to file
        with open(output_file, 'w') as f:
            f.write(html_content)
        
        logger.info(f"Generated preference heatmap: {output_file}")
        return output_file
    
    def generate_preference_comparison(self, preference1: Dict[str, Any], 
                                     preference2: Dict[str, Any],
                                     output_file: str = None) -> str:
        """
        Generate a comparison visualization of two preferences.
        
        Args:
            preference1: First preference object
            preference2: Second preference object
            output_file: Output file path
            
        Returns:
            str: Path to generated visualization
        """
        # In a real implementation, this would generate an actual visualization
        # For now, generate a placeholder HTML file
        
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = os.path.join(self.output_path, f"preference_comparison_{timestamp}.html")
        
        # Extract agent IDs
        agent1 = preference1.get("agent_id", "Agent 1")
        agent2 = preference2.get("agent_id", "Agent 2")
        
        # Generate HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Preference Comparison</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .comparison {{ width: 100%; border-collapse: collapse; }}
                .comparison th, .comparison td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                .comparison tr:nth-child(even) {{ background-color: #f2f2f2; }}
                .comparison th {{ background-color: #4CAF50; color: white; }}
                .similar {{ background-color: #dff0d8; }}
                .different {{ background-color: #f2dede; }}
            </style>
        </head>
        <body>
            <h1>Preference Comparison</h1>
            <p>Comparison between {agent1} and {agent2}</p>
            <p>Generated at: {datetime.now().isoformat()}</p>
            
            <div>
                <h2>Preference Comparison</h2>
                <table class="comparison">
                    <tr>
                        <th>Preference</th>
                        <th>{agent1}</th>
                        <th>{agent2}</th>
                        <th>Status</th>
                    </tr>
        """
        
        # Add sample data
        prefs1 = preference1.get("preferences", {})
        prefs2 = preference2.get("preferences", {})
        
        # Combine all keys
        all_keys = set(prefs1.keys()).union(set(prefs2.keys()))
        
        for key in sorted(all_keys):
            val1 = prefs1.get(key, "N/A")
            val2 = prefs2.get(key, "N/A")
            
            if val1 == val2:
                status = "Similar"
                row_class = "similar"
            else:
                status = "Different"
                row_class = "different"
            
            html_content += f"""
                <tr class="{row_class}">
                    <td>{key}</td>
                    <td>{val1}</td>
                    <td>{val2}</td>
                    <td>{status}</td>
                </tr>
            """
        
        html_content += """
                </table>
            </div>
        </body>
        </html>
        """
        
        # Write HTML to file
        with open(output_file, 'w') as f:
            f.write(html_content)
        
        logger.info(f"Generated preference comparison: {output_file}")
        return output_file
    
    def generate_preference_evolution(self, preferences: List[Dict[str, Any]], 
                                    output_file: str = None) -> str:
        """
        Generate a visualization of preference evolution over time.
        
        Args:
            preferences: List of preference objects for the same agent
            output_file: Output file path
            
        Returns:
            str: Path to generated visualization
        """
        # In a real implementation, this would generate an actual visualization
        # For now, generate a placeholder HTML file
        
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = os.path.join(self.output_path, f"preference_evolution_{timestamp}.html")
        
        # Sort preferences by timestamp
        sorted_prefs = sorted(preferences, key=lambda p: p.get("timestamp", ""))
        
        # Extract agent ID
        agent_id = sorted_prefs[0].get("agent_id", "Agent") if sorted_prefs else "Unknown Agent"
        
        # Generate HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Preference Evolution</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .timeline {{ position: relative; max-width: 1200px; margin: 0 auto; }}
                .timeline::after {{ content: ''; position: absolute; width: 6px; background-color: #4CAF50; top: 0; bottom: 0; left: 50%; margin-left: -3px; }}
                .container {{ padding: 10px 40px; position: relative; background-color: inherit; width: 50%; }}
                .container::after {{ content: ''; position: absolute; width: 20px; height: 20px; right: -10px; background-color: white; border: 4px solid #4CAF50; top: 15px; border-radius: 50%; z-index: 1; }}
                .left {{ left: 0; }}
                .right {{ left: 50%; }}
                .left::before {{ content: " "; height: 0; position: absolute; top: 22px; width: 0; z-index: 1; right: 30px; border: medium solid #4CAF50; border-width: 10px 0 10px 10px; border-color: transparent transparent transparent #4CAF50; }}
                .right::before {{ content: " "; height: 0; position: absolute; top: 22px; width: 0; z-index: 1; left: 30px; border: medium solid #4CAF50; border-width: 10px 10px 10px 0; border-color: transparent #4CAF50 transparent transparent; }}
                .right::after {{ left: -10px; }}
                .content {{ padding: 20px 30px; background-color: white; position: relative; border-radius: 6px; border: 1px solid #4CAF50; }}
            </style>
        </head>
        <body>
            <h1>Preference Evolution</h1>
            <p>Evolution of preferences for {agent_id}</p>
            <p>Generated at: {datetime.now().isoformat()}</p>
            
            <div class="timeline">
        """
        
        # Add timeline items
        for i, pref in enumerate(sorted_prefs):
            timestamp = pref.get("timestamp", f"Time {i+1}")
            position = "left" if i % 2 == 0 else "right"
            
            html_content += f"""
                <div class="container {position}">
                    <div class="content">
                        <h2>{timestamp}</h2>
                        <p>Preference snapshot {i+1}</p>
                        <ul>
            """
            
            # Add preference items
            prefs = pref.get("preferences", {})
            for key, value in prefs.items():
                html_content += f"<li><strong>{key}:</strong> {value}</li>"
            
            html_content += """
                        </ul>
                    </div>
                </div>
            """
        
        html_content += """
            </div>
        </body>
        </html>
        """
        
        # Write HTML to file
        with open(output_file, 'w') as f:
            f.write(html_content)
        
        logger.info(f"Generated preference evolution: {output_file}")
        return output_file
    
    def generate_preference_dashboard(self, preferences: List[Dict[str, Any]], 
                                    output_file: str = None) -> str:
        """
        Generate a comprehensive dashboard of preferences.
        
        Args:
            preferences: List of preference objects
            output_file: Output file path
            
        Returns:
            str: Path to generated dashboard
        """
        # In a real implementation, this would generate an actual dashboard
        # For now, generate a placeholder HTML file
        
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = os.path.join(self.output_path, f"preference_dashboard_{timestamp}.html")
        
        # Generate HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Preference Dashboard</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .dashboard {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
                .card {{ border: 1px solid #ddd; border-radius: 5px; padding: 15px; }}
                .card h2 {{ margin-top: 0; }}
                table {{ width: 100%; border-collapse: collapse; }}
                table, th, td {{ border: 1px solid #ddd; }}
                th, td {{ padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>Preference Dashboard</h1>
            <p>Dashboard for {len(preferences)} preference objects</p>
            <p>Generated at: {datetime.now().isoformat()}</p>
            
            <div class="dashboard">
                <div class="card">
                    <h2>Preference Summary</h2>
                    <table>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                        </tr>
                        <tr>
                            <td>Total Preferences</td>
                            <td>{len(preferences)}</td>
                        </tr>
                        <tr>
                            <td>Unique Agents</td>
                            <td>{len(set(p.get("agent_id") for p in preferences))}</td>
                        </tr>
                        <tr>
                            <td>Unique Tasks</td>
                            <td>{len(set(p.get("task_id") for p in preferences))}</td>
                        </tr>
                    </table>
                </div>
                
                <div class="card">
                    <h2>Recent Preferences</h2>
                    <table>
                        <tr>
                            <th>Agent</th>
                            <th>Task</th>
                            <th>Timestamp</th>
                        </tr>
        """
        
        # Add recent preferences
        sorted_prefs = sorted(preferences, key=lambda p: p.get("timestamp", ""), reverse=True)
        for pref in sorted_prefs[:5]:
            agent_id = pref.get("agent_id", "Unknown")
            task_id = pref.get("task_id", "Unknown")
            timestamp = pref.get("timestamp", "Unknown")
            
            html_content += f"""
                        <tr>
                            <td>{agent_id}</td>
                            <td>{task_id}</td>
                            <td>{timestamp}</td>
                        </tr>
            """
        
        html_content += """
                    </table>
                </div>
                
                <div class="card">
                    <h2>Common Preferences</h2>
                    <p>Placeholder for common preferences visualization</p>
                    <div style="width: 100%; height: 200px; background-color: #f2f2f2; display: flex; justify-content: center; align-items: center;">
                        Visualization Placeholder
                    </div>
                </div>
                
                <div class="card">
                    <h2>Preference Distribution</h2>
                    <p>Placeholder for preference distribution visualization</p>
                    <div style="width: 100%; height: 200px; background-color: #f2f2f2; display: flex; justify-content: center; align-items: center;">
                        Visualization Placeholder
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Write HTML to file
        with open(output_file, 'w') as f:
            f.write(html_content)
        
        logger.info(f"Generated preference dashboard: {output_file}")
        return output_file


class AgentPreferenceElicitation:
    """
    Main class for agent preference elicitation.
    
    This class provides a unified interface for:
    - Eliciting preferences from agents
    - Storing and retrieving preferences
    - Analyzing preference patterns
    - Visualizing preferences
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the agent preference elicitation system.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract component configurations
        model_config = self.config.get('model', {})
        prompt_config = self.config.get('prompt', {})
        storage_config = self.config.get('storage', {})
        analyzer_config = self.config.get('analyzer', {})
        visualizer_config = self.config.get('visualizer', {})
        
        # Initialize components
        self.preference_model = PreferenceModel(model_config)
        self.prompt_system = PreferencePromptSystem(prompt_config)
        self.storage = PreferenceStorage(storage_config)
        self.analyzer = PreferenceAnalyzer(analyzer_config)
        self.visualizer = PreferenceVisualizer(visualizer_config)
        
        logger.info("Agent preference elicitation system initialized")
    
    def elicit_preferences(self, agent_id: str, task_id: str, task_type: str, 
                         agent_history: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Elicit preferences from an agent.
        
        Args:
            agent_id: Agent identifier
            task_id: Task identifier
            task_type: Type of task
            agent_history: Agent's historical data
            
        Returns:
            Dict: Elicitation result
        """
        # Select appropriate template
        template_name = self.prompt_system.select_template_for_task(task_type, agent_history)
        
        # Generate prompt
        context = {
            "agent_id": agent_id,
            "task_id": task_id,
            "task_type": task_type
        }
        
        prompt = self.prompt_system.generate_prompt(template_name, context)
        
        return {
            "agent_id": agent_id,
            "task_id": task_id,
            "prompt": prompt,
            "template": template_name
        }
    
    def process_preference_response(self, agent_id: str, task_id: str, 
                                  response: str) -> Dict[str, Any]:
        """
        Process a preference response from an agent.
        
        Args:
            agent_id: Agent identifier
            task_id: Task identifier
            response: Agent's response to preference prompt
            
        Returns:
            Dict: Processed preference object
        """
        # In a real implementation, this would parse the response using NLP
        # For now, use a simple approach
        
        # Extract preferences from response
        preferences = self._extract_preferences_from_text(response)
        
        # Create preference object
        preference_object = self.preference_model.create_preference_object(
            agent_id, task_id, preferences
        )
        
        # Store preference
        self.storage.store_preference(preference_object)
        
        return preference_object
    
    def _extract_preferences_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extract preferences from text response.
        
        Args:
            text: Text response
            
        Returns:
            Dict: Extracted preferences
        """
        # In a real implementation, this would use NLP techniques
        # For now, use simple keyword extraction
        preferences = {}
        
        # Look for numbered points (1., 2., etc.)
        import re
        numbered_points = re.findall(r'\d+\.\s+(.*?)(?=\d+\.|$)', text, re.DOTALL)
        
        if numbered_points:
            for i, point in enumerate(numbered_points):
                point = point.strip()
                if point:
                    preferences[f"point_{i+1}"] = point
        
        # Look for key-value pairs (Key: Value)
        key_value_pairs = re.findall(r'([A-Za-z\s]+):\s+(.*?)(?=\n[A-Za-z\s]+:|$)', text, re.DOTALL)
        
        for key, value in key_value_pairs:
            key = key.strip().lower().replace(' ', '_')
            value = value.strip()
            if key and value:
                preferences[key] = value
        
        # If no structured content found, store the whole text
        if not preferences:
            preferences["full_response"] = text
        
        return preferences
    
    def get_agent_preferences(self, agent_id: str) -> List[Dict[str, Any]]:
        """
        Get all preferences for an agent.
        
        Args:
            agent_id: Agent identifier
            
        Returns:
            List: Preference objects
        """
        return self.storage.get_preferences_by_agent(agent_id)
    
    def get_task_preferences(self, task_id: str) -> List[Dict[str, Any]]:
        """
        Get all preferences for a task.
        
        Args:
            task_id: Task identifier
            
        Returns:
            List: Preference objects
        """
        return self.storage.get_preferences_by_task(task_id)
    
    def compare_agent_preferences(self, agent_id1: str, agent_id2: str) -> Dict[str, Any]:
        """
        Compare preferences between two agents.
        
        Args:
            agent_id1: First agent identifier
            agent_id2: Second agent identifier
            
        Returns:
            Dict: Comparison results
        """
        # Get preferences for both agents
        prefs1 = self.storage.get_preferences_by_agent(agent_id1)
        prefs2 = self.storage.get_preferences_by_agent(agent_id2)
        
        if not prefs1 or not prefs2:
            return {
                "error": "Preferences not found for one or both agents"
            }
        
        # Merge preferences for each agent
        merged1 = self.preference_model.merge_preferences(prefs1)
        merged2 = self.preference_model.merge_preferences(prefs2)
        
        # Compare merged preferences
        comparison = self.analyzer.compare_preferences(merged1, merged2)
        
        # Generate visualization
        visualization_path = self.visualizer.generate_preference_comparison(merged1, merged2)
        
        return {
            "agent1": {
                "id": agent_id1,
                "preference_count": len(prefs1)
            },
            "agent2": {
                "id": agent_id2,
                "preference_count": len(prefs2)
            },
            "comparison": comparison,
            "visualization_path": visualization_path
        }
    
    def analyze_agent_preference_evolution(self, agent_id: str) -> Dict[str, Any]:
        """
        Analyze how an agent's preferences evolve over time.
        
        Args:
            agent_id: Agent identifier
            
        Returns:
            Dict: Analysis results
        """
        # Get preferences for agent
        prefs = self.storage.get_preferences_by_agent(agent_id)
        
        if not prefs or len(prefs) < 2:
            return {
                "error": "Insufficient preference data for evolution analysis"
            }
        
        # Analyze preference evolution
        evolution = self.analyzer.analyze_preference_evolution(prefs)
        
        # Generate visualization
        visualization_path = self.visualizer.generate_preference_evolution(prefs)
        
        return {
            "agent_id": agent_id,
            "preference_count": len(prefs),
            "evolution": evolution,
            "visualization_path": visualization_path
        }
    
    def generate_preference_dashboard(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a preference dashboard.
        
        Args:
            filters: Filters for preferences to include
            
        Returns:
            Dict: Dashboard information
        """
        # Query preferences based on filters
        if filters:
            prefs = self.storage.query_preferences(filters)
        else:
            # Get all preferences
            prefs = list(self.storage.preferences.values())
        
        if not prefs:
            return {
                "error": "No preferences found matching filters"
            }
        
        # Generate dashboard
        dashboard_path = self.visualizer.generate_preference_dashboard(prefs)
        
        # Identify patterns
        patterns = self.analyzer.identify_preference_patterns(prefs)
        
        return {
            "preference_count": len(prefs),
            "filters": filters,
            "patterns": patterns,
            "dashboard_path": dashboard_path
        }
    
    def get_system_status(self) -> Dict[str, Any]:
        """
        Get the status of the preference elicitation system.
        
        Returns:
            Dict: System status
        """
        return {
            "preference_count": len(self.storage.preferences),
            "template_count": len(self.prompt_system.get_template_names()),
            "available_templates": self.prompt_system.get_template_names(),
            "timestamp": datetime.now().isoformat()
        }
