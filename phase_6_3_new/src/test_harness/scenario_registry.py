"""
Scenario Registry for the Promethios Test Harness.

This module provides functionality for managing test scenarios with categorization,
dependencies, and prioritization.
"""

import json
import os
import logging
from typing import Dict, List, Optional, Union
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScenarioRegistry:
    """
    Registry for managing test scenarios in the Promethios test harness.
    
    The ScenarioRegistry provides functionality for registering, retrieving,
    and listing test scenarios with support for categorization, dependencies,
    and prioritization.
    """
    
    def __init__(self, storage_path: str = None):
        """
        Initialize the ScenarioRegistry.
        
        Args:
            storage_path: Path to the directory where scenarios are stored.
                          If None, uses the default path.
        """
        self.storage_path = storage_path or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 
            "..", "..", "data", "scenarios"
        )
        
        # Create the storage directory if it doesn't exist
        os.makedirs(self.storage_path, exist_ok=True)
        
        # In-memory cache of scenarios
        self._scenarios = {}
        
        # Load existing scenarios
        self._load_scenarios()
        
        logger.info(f"ScenarioRegistry initialized with storage path: {self.storage_path}")
    
    def _load_scenarios(self) -> None:
        """Load existing scenarios from storage."""
        try:
            for filename in os.listdir(self.storage_path):
                if filename.endswith(".json"):
                    scenario_path = os.path.join(self.storage_path, filename)
                    with open(scenario_path, 'r') as f:
                        scenario = json.load(f)
                        self._scenarios[scenario['id']] = scenario
            
            logger.info(f"Loaded {len(self._scenarios)} scenarios from storage")
        except Exception as e:
            logger.error(f"Error loading scenarios: {e}")
    
    def register_scenario(self, scenario: Dict) -> str:
        """
        Register a new test scenario.
        
        Args:
            scenario: The scenario to register. Must conform to the test_scenario schema.
            
        Returns:
            The ID of the registered scenario.
            
        Raises:
            ValueError: If the scenario is invalid or already exists.
        """
        # Validate scenario against schema (simplified for now)
        required_fields = ['id', 'name', 'description', 'category', 'priority', 'steps']
        for field in required_fields:
            if field not in scenario:
                raise ValueError(f"Scenario missing required field: {field}")
        
        # Check if scenario already exists
        if scenario['id'] in self._scenarios:
            raise ValueError(f"Scenario with ID {scenario['id']} already exists")
        
        # Add metadata if not present
        if 'metadata' not in scenario:
            scenario['metadata'] = {}
        
        scenario['metadata']['created'] = datetime.now().isoformat()
        scenario['metadata']['updated'] = scenario['metadata']['created']
        
        # Store the scenario
        self._scenarios[scenario['id']] = scenario
        
        # Persist to storage
        scenario_path = os.path.join(self.storage_path, f"{scenario['id']}.json")
        with open(scenario_path, 'w') as f:
            json.dump(scenario, f, indent=2)
        
        logger.info(f"Registered scenario: {scenario['id']}")
        return scenario['id']
    
    def get_scenario(self, scenario_id: str) -> Optional[Dict]:
        """
        Retrieve a scenario by ID.
        
        Args:
            scenario_id: The ID of the scenario to retrieve.
            
        Returns:
            The scenario if found, None otherwise.
        """
        scenario = self._scenarios.get(scenario_id)
        if not scenario:
            logger.warning(f"Scenario not found: {scenario_id}")
        return scenario
    
    def list_scenarios(self, category: str = None, priority: int = None) -> List[Dict]:
        """
        List scenarios, optionally filtered by category and/or priority.
        
        Args:
            category: Optional category to filter by.
            priority: Optional priority level to filter by.
            
        Returns:
            List of scenarios matching the filters.
        """
        scenarios = list(self._scenarios.values())
        
        if category:
            scenarios = [s for s in scenarios if s['category'] == category]
        
        if priority:
            scenarios = [s for s in scenarios if s['priority'] == priority]
        
        return scenarios
    
    def update_scenario(self, scenario_id: str, updates: Dict) -> Dict:
        """
        Update an existing scenario.
        
        Args:
            scenario_id: The ID of the scenario to update.
            updates: Dictionary of fields to update.
            
        Returns:
            The updated scenario.
            
        Raises:
            ValueError: If the scenario doesn't exist or updates are invalid.
        """
        if scenario_id not in self._scenarios:
            raise ValueError(f"Scenario not found: {scenario_id}")
        
        # Don't allow updating the ID
        if 'id' in updates and updates['id'] != scenario_id:
            raise ValueError("Cannot change scenario ID")
        
        # Update the scenario
        scenario = self._scenarios[scenario_id]
        for key, value in updates.items():
            if key != 'id':  # Skip ID updates
                scenario[key] = value
        
        # Update metadata
        if 'metadata' not in scenario:
            scenario['metadata'] = {}
        scenario['metadata']['updated'] = datetime.now().isoformat()
        
        # Persist to storage
        scenario_path = os.path.join(self.storage_path, f"{scenario_id}.json")
        with open(scenario_path, 'w') as f:
            json.dump(scenario, f, indent=2)
        
        logger.info(f"Updated scenario: {scenario_id}")
        return scenario
    
    def delete_scenario(self, scenario_id: str) -> bool:
        """
        Delete a scenario.
        
        Args:
            scenario_id: The ID of the scenario to delete.
            
        Returns:
            True if the scenario was deleted, False otherwise.
        """
        if scenario_id not in self._scenarios:
            logger.warning(f"Cannot delete: Scenario not found: {scenario_id}")
            return False
        
        # Remove from memory
        del self._scenarios[scenario_id]
        
        # Remove from storage
        scenario_path = os.path.join(self.storage_path, f"{scenario_id}.json")
        try:
            os.remove(scenario_path)
            logger.info(f"Deleted scenario: {scenario_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting scenario {scenario_id}: {e}")
            return False
    
    def get_dependent_scenarios(self, scenario_id: str) -> List[str]:
        """
        Get scenarios that depend on the given scenario.
        
        Args:
            scenario_id: The ID of the scenario to check dependencies for.
            
        Returns:
            List of scenario IDs that depend on the given scenario.
        """
        dependent_scenarios = []
        for s_id, scenario in self._scenarios.items():
            if 'dependencies' in scenario and scenario_id in scenario['dependencies']:
                dependent_scenarios.append(s_id)
        return dependent_scenarios
    
    def validate_dependencies(self, scenario_id: str) -> bool:
        """
        Validate that all dependencies of a scenario exist.
        
        Args:
            scenario_id: The ID of the scenario to validate dependencies for.
            
        Returns:
            True if all dependencies exist, False otherwise.
        """
        scenario = self.get_scenario(scenario_id)
        if not scenario:
            return False
        
        if 'dependencies' not in scenario:
            return True
        
        for dep_id in scenario['dependencies']:
            if dep_id not in self._scenarios:
                logger.warning(f"Scenario {scenario_id} has missing dependency: {dep_id}")
                return False
        
        return True
    
    def get_execution_order(self, scenario_ids: List[str]) -> List[str]:
        """
        Determine the execution order for a list of scenarios based on dependencies.
        
        Args:
            scenario_ids: List of scenario IDs to order.
            
        Returns:
            Ordered list of scenario IDs.
            
        Raises:
            ValueError: If there are circular dependencies.
        """
        # Build dependency graph
        graph = {}
        for s_id in scenario_ids:
            scenario = self.get_scenario(s_id)
            if not scenario:
                continue
            
            deps = scenario.get('dependencies', [])
            graph[s_id] = [d for d in deps if d in scenario_ids]
        
        # Topological sort
        result = []
        visited = set()
        temp_visited = set()
        
        def visit(node):
            if node in temp_visited:
                raise ValueError(f"Circular dependency detected involving scenario {node}")
            
            if node not in visited:
                temp_visited.add(node)
                for dep in graph.get(node, []):
                    visit(dep)
                temp_visited.remove(node)
                visited.add(node)
                result.append(node)
        
        for node in graph:
            if node not in visited:
                visit(node)
        
        # Reverse to get correct order
        return result[::-1]


# Example usage
if __name__ == "__main__":
    registry = ScenarioRegistry()
    
    # Example scenario
    example_scenario = {
        "id": "TS-0001",
        "name": "Basic API Authentication Test",
        "description": "Tests basic authentication flow for the API",
        "category": "security",
        "priority": 1,
        "steps": [
            {
                "id": "STEP-0001",
                "description": "Request authentication token",
                "endpoint": "/auth/token",
                "method": "POST",
                "payload": {
                    "username": "test_user",
                    "password": "test_password"
                },
                "expected_status": 200
            }
        ]
    }
    
    try:
        registry.register_scenario(example_scenario)
        print(f"Registered scenario: {example_scenario['id']}")
        
        scenarios = registry.list_scenarios()
        print(f"Total scenarios: {len(scenarios)}")
    except Exception as e:
        print(f"Error: {e}")
