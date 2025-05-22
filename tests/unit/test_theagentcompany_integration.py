"""
Unit tests for TheAgentCompany Integration in Promethios.

This module contains comprehensive tests for the TheAgentCompany integration wrapper,
which enables benchmark testing of the Promethios governance APIs.
"""

import unittest
import os
import json
import tempfile
import shutil
from datetime import datetime
from unittest.mock import patch, MagicMock

# Import the module to test
from src.integration.theagentcompany_integration import (
    TheAgentCompanyIntegration,
    BenchmarkType,
    AgentProfile,
    TaskCategory,
    BenchmarkScenario,
    BenchmarkTask,
    BenchmarkResult
)

class TestTheAgentCompanyIntegration(unittest.TestCase):
    """Test cases for the TheAgentCompanyIntegration class."""
    
    def setUp(self):
        """Set up test environment before each test."""
        # Create a temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        self.integration = TheAgentCompanyIntegration(storage_dir=self.test_dir)
        
        # Sample benchmark scenario for testing
        self.sample_scenario = BenchmarkScenario(
            scenario_id="test-scenario",
            name="Test Scenario",
            description="A test benchmark scenario",
            benchmark_type=BenchmarkType.STANDARD,
            agent_profiles=[
                AgentProfile.GENERAL_PURPOSE,
                AgentProfile.ENTERPRISE
            ],
            tasks=[
                BenchmarkTask(
                    task_id="task-1",
                    category=TaskCategory.INFORMATION_RETRIEVAL,
                    description="Retrieve information",
                    instructions="Find information about governance",
                    expected_outcomes=["Provide accurate information"],
                    governance_constraints=[
                        {
                            "id": "constraint-1",
                            "type": "data_source",
                            "description": "Use reputable sources",
                            "severity": "medium"
                        }
                    ],
                    timeout_seconds=300
                )
            ],
            governance_policies={
                "data_source": {
                    "allowed_sources": ["academic", "reputable_news"],
                    "prohibited_sources": ["unverified_social_media"]
                }
            },
            compliance_requirements={
                "SOC2": ["CC5.1", "CC7.1"],
                "GDPR": ["GDPR-5"]
            }
        )
    
    def tearDown(self):
        """Clean up test environment after each test."""
        # Remove the temporary directory
        shutil.rmtree(self.test_dir)
    
    def test_create_scenario(self):
        """Test creating a benchmark scenario."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Verify the scenario was created
        self.assertIn("test-scenario", self.integration.scenarios)
        
        # Verify scenario properties
        scenario = self.integration.scenarios["test-scenario"]
        self.assertEqual(scenario.name, "Test Scenario")
        self.assertEqual(scenario.benchmark_type, BenchmarkType.STANDARD)
        self.assertEqual(len(scenario.agent_profiles), 2)
        self.assertEqual(len(scenario.tasks), 1)
    
    def test_get_scenario(self):
        """Test retrieving a benchmark scenario by ID."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Retrieve the scenario
        scenario = self.integration.get_scenario("test-scenario")
        
        # Verify the scenario
        self.assertIsNotNone(scenario)
        self.assertEqual(scenario.scenario_id, "test-scenario")
        self.assertEqual(scenario.name, "Test Scenario")
        self.assertEqual(scenario.benchmark_type, BenchmarkType.STANDARD)
    
    def test_list_scenarios(self):
        """Test listing benchmark scenarios with optional filtering."""
        # Create multiple scenarios
        scenario1 = BenchmarkScenario(
            scenario_id="basic-scenario",
            name="Basic Scenario",
            description="A basic benchmark scenario",
            benchmark_type=BenchmarkType.BASIC,
            agent_profiles=[AgentProfile.GENERAL_PURPOSE],
            tasks=[],
            governance_policies={},
            compliance_requirements={}
        )
        
        scenario2 = BenchmarkScenario(
            scenario_id="advanced-scenario",
            name="Advanced Scenario",
            description="An advanced benchmark scenario",
            benchmark_type=BenchmarkType.ADVANCED,
            agent_profiles=[AgentProfile.ENTERPRISE, AgentProfile.AUTONOMOUS],
            tasks=[],
            governance_policies={},
            compliance_requirements={}
        )
        
        self.integration.create_scenario(scenario1)
        self.integration.create_scenario(scenario2)
        
        # List all scenarios
        scenarios = self.integration.list_scenarios()
        self.assertEqual(len(scenarios), 2)
        
        # List scenarios by benchmark type
        basic_scenarios = self.integration.list_scenarios(benchmark_type=BenchmarkType.BASIC)
        self.assertEqual(len(basic_scenarios), 1)
        self.assertEqual(basic_scenarios[0].scenario_id, "basic-scenario")
        
        # List scenarios by agent profile
        enterprise_scenarios = self.integration.list_scenarios(agent_profile=AgentProfile.ENTERPRISE)
        self.assertEqual(len(enterprise_scenarios), 1)
        self.assertEqual(enterprise_scenarios[0].scenario_id, "advanced-scenario")
    
    def test_delete_scenario(self):
        """Test deleting a benchmark scenario."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Verify the scenario exists
        self.assertIn("test-scenario", self.integration.scenarios)
        
        # Delete the scenario
        result = self.integration.delete_scenario("test-scenario")
        
        # Verify the deletion
        self.assertTrue(result)
        self.assertNotIn("test-scenario", self.integration.scenarios)
    
    def test_scenario_persistence(self):
        """Test persistence of benchmark scenarios."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Create a new integration instance with the same storage directory
        new_integration = TheAgentCompanyIntegration(storage_dir=self.test_dir)
        
        # Verify the scenario was loaded
        self.assertIn("test-scenario", new_integration.scenarios)
        scenario = new_integration.get_scenario("test-scenario")
        self.assertEqual(scenario.name, "Test Scenario")
    
    @patch('src.integration.theagentcompany_integration.requests')
    @patch('src.integration.theagentcompany_integration.time')
    def test_run_benchmark(self, mock_time, mock_requests):
        """Test running a benchmark against the governance API."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Configure mocks
        mock_time.sleep.return_value = None
        
        # Mock callback function
        callback_data = []
        def mock_callback(event_type, data):
            callback_data.append((event_type, data))
        
        # Run the benchmark
        result = self.integration.run_benchmark(
            scenario_id="test-scenario",
            agent_profile=AgentProfile.GENERAL_PURPOSE,
            governance_api_url="https://api.promethios.example/governance",
            governance_api_key="test-api-key",
            callback=mock_callback
        )
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(result.benchmark_type, BenchmarkType.STANDARD)
        self.assertEqual(result.agent_profile, AgentProfile.GENERAL_PURPOSE)
        self.assertEqual(result.tasks_completed, 1)
        self.assertEqual(result.tasks_total, 1)
        
        # Verify the result was saved
        self.assertIn(result.benchmark_id, self.integration.results)
        
        # Verify callback was called
        self.assertGreater(len(callback_data), 0)
        
        # Verify governance events were generated
        self.assertGreater(len(result.governance_events), 0)
    
    def test_get_result(self):
        """Test retrieving a benchmark result by ID."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Run a benchmark
        result = self.integration.run_benchmark(
            scenario_id="test-scenario",
            agent_profile=AgentProfile.GENERAL_PURPOSE,
            governance_api_url="https://api.promethios.example/governance"
        )
        
        # Retrieve the result
        retrieved_result = self.integration.get_result(result.benchmark_id)
        
        # Verify the result
        self.assertIsNotNone(retrieved_result)
        self.assertEqual(retrieved_result.benchmark_id, result.benchmark_id)
        self.assertEqual(retrieved_result.benchmark_type, BenchmarkType.STANDARD)
        self.assertEqual(retrieved_result.agent_profile, AgentProfile.GENERAL_PURPOSE)
    
    def test_list_results(self):
        """Test listing benchmark results with optional filtering."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Run multiple benchmarks
        result1 = self.integration.run_benchmark(
            scenario_id="test-scenario",
            agent_profile=AgentProfile.GENERAL_PURPOSE,
            governance_api_url="https://api.promethios.example/governance"
        )
        
        result2 = self.integration.run_benchmark(
            scenario_id="test-scenario",
            agent_profile=AgentProfile.ENTERPRISE,
            governance_api_url="https://api.promethios.example/governance"
        )
        
        # List all results
        results = self.integration.list_results()
        self.assertEqual(len(results), 2)
        
        # List results by agent profile
        enterprise_results = self.integration.list_results(agent_profile=AgentProfile.ENTERPRISE)
        self.assertEqual(len(enterprise_results), 1)
        self.assertEqual(enterprise_results[0].agent_profile, AgentProfile.ENTERPRISE)
    
    def test_delete_result(self):
        """Test deleting a benchmark result."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Run a benchmark
        result = self.integration.run_benchmark(
            scenario_id="test-scenario",
            agent_profile=AgentProfile.GENERAL_PURPOSE,
            governance_api_url="https://api.promethios.example/governance"
        )
        
        # Verify the result exists
        self.assertIn(result.benchmark_id, self.integration.results)
        
        # Delete the result
        delete_result = self.integration.delete_result(result.benchmark_id)
        
        # Verify the deletion
        self.assertTrue(delete_result)
        self.assertNotIn(result.benchmark_id, self.integration.results)
    
    def test_result_persistence(self):
        """Test persistence of benchmark results."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Run a benchmark
        result = self.integration.run_benchmark(
            scenario_id="test-scenario",
            agent_profile=AgentProfile.GENERAL_PURPOSE,
            governance_api_url="https://api.promethios.example/governance"
        )
        
        # Create a new integration instance with the same storage directory
        new_integration = TheAgentCompanyIntegration(storage_dir=self.test_dir)
        
        # Verify the result was loaded
        self.assertIn(result.benchmark_id, new_integration.results)
        loaded_result = new_integration.get_result(result.benchmark_id)
        self.assertEqual(loaded_result.benchmark_id, result.benchmark_id)
        self.assertEqual(loaded_result.benchmark_type, BenchmarkType.STANDARD)
    
    def test_compare_results(self):
        """Test comparing multiple benchmark results."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Run multiple benchmarks
        result1 = self.integration.run_benchmark(
            scenario_id="test-scenario",
            agent_profile=AgentProfile.GENERAL_PURPOSE,
            governance_api_url="https://api.promethios.example/governance"
        )
        
        result2 = self.integration.run_benchmark(
            scenario_id="test-scenario",
            agent_profile=AgentProfile.ENTERPRISE,
            governance_api_url="https://api.promethios.example/governance"
        )
        
        # Compare the results
        comparison = self.integration.compare_results([result1.benchmark_id, result2.benchmark_id])
        
        # Verify the comparison
        self.assertIn("benchmark_ids", comparison)
        self.assertIn("metrics_comparison", comparison)
        self.assertIn("governance_comparison", comparison)
        self.assertIn("compliance_comparison", comparison)
        self.assertIn("summary", comparison)
        
        # Verify benchmark IDs
        self.assertEqual(len(comparison["benchmark_ids"]), 2)
        self.assertIn(result1.benchmark_id, comparison["benchmark_ids"])
        self.assertIn(result2.benchmark_id, comparison["benchmark_ids"])
    
    def test_generate_default_scenarios(self):
        """Test generating default benchmark scenarios."""
        # Generate default scenarios
        scenario_ids = self.integration.generate_default_scenarios()
        
        # Verify scenarios were generated
        self.assertGreater(len(scenario_ids), 0)
        
        # Verify scenarios exist
        for scenario_id in scenario_ids:
            scenario = self.integration.get_scenario(scenario_id)
            self.assertIsNotNone(scenario)
    
    def test_analyze_governance_events(self):
        """Test analyzing governance events from a benchmark run."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Run a benchmark
        result = self.integration.run_benchmark(
            scenario_id="test-scenario",
            agent_profile=AgentProfile.GENERAL_PURPOSE,
            governance_api_url="https://api.promethios.example/governance"
        )
        
        # Analyze governance events
        analysis = self.integration.analyze_governance_events(result.benchmark_id)
        
        # Verify the analysis
        self.assertIn("benchmark_id", analysis)
        self.assertIn("total_events", analysis)
        self.assertIn("events_by_constraint_type", analysis)
        self.assertIn("events_by_decision", analysis)
        
        # Verify benchmark ID
        self.assertEqual(analysis["benchmark_id"], result.benchmark_id)
        
        # Verify total events
        self.assertEqual(analysis["total_events"], len(result.governance_events))
    
    def test_export_benchmark_data(self):
        """Test exporting benchmark data for analysis."""
        # Create a scenario
        self.integration.create_scenario(self.sample_scenario)
        
        # Run a benchmark
        result = self.integration.run_benchmark(
            scenario_id="test-scenario",
            agent_profile=AgentProfile.GENERAL_PURPOSE,
            governance_api_url="https://api.promethios.example/governance"
        )
        
        # Export benchmark data
        export_info = self.integration.export_benchmark_data(
            benchmark_ids=[result.benchmark_id],
            format="json",
            include_scenarios=True
        )
        
        # Verify export info
        self.assertIn("benchmark_ids", export_info)
        self.assertIn("format", export_info)
        self.assertIn("file_path", export_info)
        
        # Verify benchmark IDs
        self.assertEqual(len(export_info["benchmark_ids"]), 1)
        self.assertEqual(export_info["benchmark_ids"][0], result.benchmark_id)
        
        # Verify format
        self.assertEqual(export_info["format"], "json")
        
        # Verify file exists
        self.assertTrue(os.path.exists(export_info["file_path"]))
        
        # Verify file content
        with open(export_info["file_path"], 'r') as f:
            export_data = json.load(f)
            self.assertIn("results", export_data)
            self.assertIn("scenarios", export_data)
            self.assertEqual(len(export_data["results"]), 1)
            self.assertEqual(len(export_data["scenarios"]), 1)

if __name__ == "__main__":
    unittest.main()
