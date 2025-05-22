"""
Test file for the Scenario Registry module.

This module contains unit tests for the ScenarioRegistry class.
"""

import unittest
import os
import json
import tempfile
import shutil
from datetime import datetime
from src.test_harness.scenario_registry import ScenarioRegistry

class TestScenarioRegistry(unittest.TestCase):
    """Test cases for the ScenarioRegistry class."""
    
    def setUp(self):
        """Set up test environment before each test."""
        # Create a temporary directory for test scenarios
        self.temp_dir = tempfile.mkdtemp()
        self.registry = ScenarioRegistry(storage_path=self.temp_dir)
        
        # Sample test scenario
        self.test_scenario = {
            "id": "TS-0001",
            "name": "Test Scenario",
            "description": "A test scenario for unit testing",
            "category": "functional",
            "priority": 1,
            "steps": [
                {
                    "id": "STEP-0001",
                    "description": "Test step",
                    "endpoint": "/api/test",
                    "method": "GET",
                    "expected_status": 200
                }
            ]
        }
    
    def tearDown(self):
        """Clean up after each test."""
        # Remove the temporary directory
        shutil.rmtree(self.temp_dir)
    
    def test_register_scenario(self):
        """Test registering a new scenario."""
        # Register the scenario
        scenario_id = self.registry.register_scenario(self.test_scenario)
        
        # Verify the scenario was registered
        self.assertEqual(scenario_id, "TS-0001")
        
        # Verify the scenario was stored in memory
        self.assertIn(scenario_id, self.registry._scenarios)
        
        # Verify the scenario was stored on disk
        scenario_path = os.path.join(self.temp_dir, f"{scenario_id}.json")
        self.assertTrue(os.path.exists(scenario_path))
        
        # Verify the stored scenario matches the original
        with open(scenario_path, 'r') as f:
            stored_scenario = json.load(f)
        
        self.assertEqual(stored_scenario["id"], self.test_scenario["id"])
        self.assertEqual(stored_scenario["name"], self.test_scenario["name"])
        self.assertEqual(stored_scenario["description"], self.test_scenario["description"])
        
        # Verify metadata was added
        self.assertIn("metadata", stored_scenario)
        self.assertIn("created", stored_scenario["metadata"])
        self.assertIn("updated", stored_scenario["metadata"])
    
    def test_register_duplicate_scenario(self):
        """Test registering a scenario with a duplicate ID."""
        # Register the scenario
        self.registry.register_scenario(self.test_scenario)
        
        # Try to register a scenario with the same ID
        duplicate_scenario = self.test_scenario.copy()
        duplicate_scenario["name"] = "Duplicate Scenario"
        
        with self.assertRaises(ValueError):
            self.registry.register_scenario(duplicate_scenario)
    
    def test_get_scenario(self):
        """Test retrieving a scenario by ID."""
        # Register the scenario
        self.registry.register_scenario(self.test_scenario)
        
        # Retrieve the scenario
        scenario = self.registry.get_scenario("TS-0001")
        
        # Verify the retrieved scenario matches the original
        self.assertEqual(scenario["id"], self.test_scenario["id"])
        self.assertEqual(scenario["name"], self.test_scenario["name"])
        self.assertEqual(scenario["description"], self.test_scenario["description"])
    
    def test_get_nonexistent_scenario(self):
        """Test retrieving a scenario that doesn't exist."""
        scenario = self.registry.get_scenario("TS-9999")
        self.assertIsNone(scenario)
    
    def test_list_scenarios(self):
        """Test listing all scenarios."""
        # Register multiple scenarios
        self.registry.register_scenario(self.test_scenario)
        
        second_scenario = self.test_scenario.copy()
        second_scenario["id"] = "TS-0002"
        second_scenario["name"] = "Second Test Scenario"
        second_scenario["category"] = "security"
        self.registry.register_scenario(second_scenario)
        
        # List all scenarios
        scenarios = self.registry.list_scenarios()
        
        # Verify both scenarios are in the list
        self.assertEqual(len(scenarios), 2)
        scenario_ids = [s["id"] for s in scenarios]
        self.assertIn("TS-0001", scenario_ids)
        self.assertIn("TS-0002", scenario_ids)
    
    def test_list_scenarios_by_category(self):
        """Test listing scenarios filtered by category."""
        # Register multiple scenarios with different categories
        self.registry.register_scenario(self.test_scenario)  # functional
        
        second_scenario = self.test_scenario.copy()
        second_scenario["id"] = "TS-0002"
        second_scenario["name"] = "Second Test Scenario"
        second_scenario["category"] = "security"
        self.registry.register_scenario(second_scenario)
        
        # List scenarios filtered by category
        functional_scenarios = self.registry.list_scenarios(category="functional")
        security_scenarios = self.registry.list_scenarios(category="security")
        
        # Verify the filtered lists
        self.assertEqual(len(functional_scenarios), 1)
        self.assertEqual(functional_scenarios[0]["id"], "TS-0001")
        
        self.assertEqual(len(security_scenarios), 1)
        self.assertEqual(security_scenarios[0]["id"], "TS-0002")
    
    def test_update_scenario(self):
        """Test updating a scenario."""
        # Register the scenario
        self.registry.register_scenario(self.test_scenario)
        
        # Update the scenario
        updates = {
            "name": "Updated Test Scenario",
            "description": "Updated description"
        }
        
        updated_scenario = self.registry.update_scenario("TS-0001", updates)
        
        # Verify the updates were applied
        self.assertEqual(updated_scenario["name"], "Updated Test Scenario")
        self.assertEqual(updated_scenario["description"], "Updated description")
        
        # Verify the updates were stored
        stored_scenario = self.registry.get_scenario("TS-0001")
        self.assertEqual(stored_scenario["name"], "Updated Test Scenario")
        self.assertEqual(stored_scenario["description"], "Updated description")
    
    def test_update_nonexistent_scenario(self):
        """Test updating a scenario that doesn't exist."""
        updates = {
            "name": "Updated Test Scenario"
        }
        
        with self.assertRaises(ValueError):
            self.registry.update_scenario("TS-9999", updates)
    
    def test_delete_scenario(self):
        """Test deleting a scenario."""
        # Register the scenario
        self.registry.register_scenario(self.test_scenario)
        
        # Delete the scenario
        result = self.registry.delete_scenario("TS-0001")
        
        # Verify the deletion was successful
        self.assertTrue(result)
        
        # Verify the scenario is no longer in memory
        self.assertNotIn("TS-0001", self.registry._scenarios)
        
        # Verify the scenario is no longer on disk
        scenario_path = os.path.join(self.temp_dir, "TS-0001.json")
        self.assertFalse(os.path.exists(scenario_path))
    
    def test_delete_nonexistent_scenario(self):
        """Test deleting a scenario that doesn't exist."""
        result = self.registry.delete_scenario("TS-9999")
        self.assertFalse(result)
    
    def test_validate_dependencies(self):
        """Test validating scenario dependencies."""
        # Register the scenario
        self.registry.register_scenario(self.test_scenario)
        
        # Register a dependent scenario
        dependent_scenario = self.test_scenario.copy()
        dependent_scenario["id"] = "TS-0002"
        dependent_scenario["name"] = "Dependent Scenario"
        dependent_scenario["dependencies"] = ["TS-0001"]
        self.registry.register_scenario(dependent_scenario)
        
        # Validate dependencies
        result = self.registry.validate_dependencies("TS-0002")
        self.assertTrue(result)
    
    def test_validate_missing_dependencies(self):
        """Test validating scenario with missing dependencies."""
        # Register a scenario with a dependency that doesn't exist
        scenario = self.test_scenario.copy()
        scenario["dependencies"] = ["TS-9999"]
        self.registry.register_scenario(scenario)
        
        # Validate dependencies
        result = self.registry.validate_dependencies("TS-0001")
        self.assertFalse(result)
    
    def test_get_execution_order(self):
        """Test determining execution order based on dependencies."""
        # Register multiple scenarios with dependencies
        self.registry.register_scenario(self.test_scenario)  # TS-0001
        
        second_scenario = self.test_scenario.copy()
        second_scenario["id"] = "TS-0002"
        second_scenario["name"] = "Second Test Scenario"
        second_scenario["dependencies"] = ["TS-0001"]
        self.registry.register_scenario(second_scenario)
        
        third_scenario = self.test_scenario.copy()
        third_scenario["id"] = "TS-0003"
        third_scenario["name"] = "Third Test Scenario"
        third_scenario["dependencies"] = ["TS-0002"]
        self.registry.register_scenario(third_scenario)
        
        # Get execution order
        order = self.registry.get_execution_order(["TS-0001", "TS-0002", "TS-0003"])
        
        # Verify the order
        self.assertEqual(order, ["TS-0001", "TS-0002", "TS-0003"])
        
        # Try a different input order
        order = self.registry.get_execution_order(["TS-0003", "TS-0001", "TS-0002"])
        
        # Verify the order is still correct
        self.assertEqual(order, ["TS-0001", "TS-0002", "TS-0003"])
    
    def test_circular_dependencies(self):
        """Test detecting circular dependencies."""
        # Register scenarios with circular dependencies
        self.registry.register_scenario(self.test_scenario)  # TS-0001
        
        second_scenario = self.test_scenario.copy()
        second_scenario["id"] = "TS-0002"
        second_scenario["name"] = "Second Test Scenario"
        second_scenario["dependencies"] = ["TS-0003"]
        self.registry.register_scenario(second_scenario)
        
        third_scenario = self.test_scenario.copy()
        third_scenario["id"] = "TS-0003"
        third_scenario["name"] = "Third Test Scenario"
        third_scenario["dependencies"] = ["TS-0001"]
        self.registry.register_scenario(third_scenario)
        
        # Add circular dependency
        self.registry.update_scenario("TS-0001", {"dependencies": ["TS-0002"]})
        
        # Try to get execution order
        with self.assertRaises(ValueError):
            self.registry.get_execution_order(["TS-0001", "TS-0002", "TS-0003"])


if __name__ == "__main__":
    unittest.main()
