"""
Integration tests for TheAgentCompany integration for Promethios Phase 6.1

This module provides comprehensive integration tests for TheAgentCompany integration,
ensuring that benchmark scenarios, metrics collection, and compliance result analysis
work correctly with the Promethios governance system.
"""

import unittest
import json
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.integration.theagentcompany_integration import TheAgentCompanyIntegration, get_integration

class TestTheAgentCompanyIntegration(unittest.TestCase):
    """Integration tests for TheAgentCompany integration."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a temporary directory for test scenarios
        self.test_scenarios_dir = tempfile.mkdtemp()
        
        # Initialize integration with test scenarios directory
        self.integration = TheAgentCompanyIntegration(
            api_base_url="http://localhost:8000",
            api_key="test-api-key",
            scenarios_directory=self.test_scenarios_dir
        )
        
        # Create test scenarios
        self.create_test_scenarios()
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test scenario files
        for filename in os.listdir(self.test_scenarios_dir):
            os.remove(os.path.join(self.test_scenarios_dir, filename))
        os.rmdir(self.test_scenarios_dir)
    
    def create_test_scenarios(self):
        """Create test scenarios."""
        # Basic test scenario
        basic_scenario = {
            "scenario_id": "scn-test-basic",
            "name": "Basic Test Scenario",
            "description": "A basic test scenario for unit testing",
            "steps": [
                {
                    "id": "step-1",
                    "type": "api_call",
                    "method": "GET",
                    "endpoint": "/memory/records",
                    "context_key": "memory_list"
                },
                {
                    "id": "step-2",
                    "type": "wait",
                    "duration": 0.1
                },
                {
                    "id": "step-3",
                    "type": "api_call",
                    "method": "POST",
                    "endpoint": "/memory/records",
                    "body": {
                        "record_id": "mem-test123",
                        "timestamp": "2025-05-22T10:30:00Z",
                        "content": {"test": "data"}
                    },
                    "context_key": "memory_create"
                }
            ],
            "compliance_checks": [
                {
                    "id": "check-1",
                    "type": "response_field",
                    "criteria": {
                        "context_key": "memory_create",
                        "field_path": "record_id"
                    }
                }
            ]
        }
        
        # Security test scenario
        security_scenario = {
            "scenario_id": "scn-test-security",
            "name": "Security Test Scenario",
            "description": "A security test scenario for unit testing",
            "steps": [
                {
                    "id": "step-1",
                    "type": "api_call",
                    "method": "GET",
                    "endpoint": "/policy",
                    "headers": {"Authorization": "Bearer invalid"},
                    "context_key": "unauthenticated_access"
                }
            ],
            "security_checks": [
                {
                    "id": "check-1",
                    "type": "authentication",
                    "criteria": {
                        "context_key": "unauthenticated_access"
                    }
                }
            ]
        }
        
        # Write scenarios to files
        with open(os.path.join(self.test_scenarios_dir, "scn-test-basic.json"), "w") as f:
            json.dump(basic_scenario, f)
        
        with open(os.path.join(self.test_scenarios_dir, "scn-test-security.json"), "w") as f:
            json.dump(security_scenario, f)
    
    def test_load_scenarios(self):
        """Test loading scenarios from directory."""
        # Verify scenarios were loaded
        self.assertIn("scn-test-basic", self.integration.scenarios)
        self.assertIn("scn-test-security", self.integration.scenarios)
        
        # Verify scenario properties
        basic_scenario = self.integration.get_scenario("scn-test-basic")
        self.assertEqual(basic_scenario["name"], "Basic Test Scenario")
        self.assertEqual(len(basic_scenario["steps"]), 3)
        
        security_scenario = self.integration.get_scenario("scn-test-security")
        self.assertEqual(security_scenario["name"], "Security Test Scenario")
        self.assertEqual(len(security_scenario["steps"]), 1)
    
    def test_get_scenario(self):
        """Test getting a scenario by ID."""
        # Get existing scenario
        scenario = self.integration.get_scenario("scn-test-basic")
        self.assertIsNotNone(scenario)
        self.assertEqual(scenario["scenario_id"], "scn-test-basic")
        
        # Get non-existent scenario
        scenario = self.integration.get_scenario("nonexistent")
        self.assertIsNone(scenario)
    
    def test_get_all_scenarios(self):
        """Test getting all scenarios."""
        scenarios = self.integration.get_all_scenarios()
        self.assertEqual(len(scenarios), 2)
        
        # Verify scenario IDs
        scenario_ids = [s["scenario_id"] for s in scenarios]
        self.assertIn("scn-test-basic", scenario_ids)
        self.assertIn("scn-test-security", scenario_ids)
    
    def test_create_scenario(self):
        """Test creating a new scenario."""
        # Create new scenario
        new_scenario = {
            "name": "New Test Scenario",
            "description": "A new test scenario",
            "steps": [
                {
                    "id": "step-1",
                    "type": "api_call",
                    "method": "GET",
                    "endpoint": "/test",
                    "context_key": "test"
                }
            ]
        }
        
        scenario_id = self.integration.create_scenario(new_scenario)
        
        # Verify scenario was created
        self.assertIsNotNone(scenario_id)
        self.assertIn(scenario_id, self.integration.scenarios)
        
        # Verify scenario properties
        created_scenario = self.integration.get_scenario(scenario_id)
        self.assertEqual(created_scenario["name"], "New Test Scenario")
        self.assertEqual(len(created_scenario["steps"]), 1)
        
        # Verify file was created
        self.assertTrue(os.path.exists(os.path.join(self.test_scenarios_dir, f"{scenario_id}.json")))
    
    def test_update_scenario(self):
        """Test updating an existing scenario."""
        # Get existing scenario
        scenario = self.integration.get_scenario("scn-test-basic")
        
        # Update scenario
        scenario["name"] = "Updated Test Scenario"
        scenario["description"] = "An updated test scenario"
        
        result = self.integration.update_scenario("scn-test-basic", scenario)
        
        # Verify update was successful
        self.assertTrue(result)
        
        # Verify scenario was updated
        updated_scenario = self.integration.get_scenario("scn-test-basic")
        self.assertEqual(updated_scenario["name"], "Updated Test Scenario")
        self.assertEqual(updated_scenario["description"], "An updated test scenario")
    
    def test_delete_scenario(self):
        """Test deleting a scenario."""
        # Delete existing scenario
        result = self.integration.delete_scenario("scn-test-basic")
        
        # Verify deletion was successful
        self.assertTrue(result)
        
        # Verify scenario was deleted
        self.assertNotIn("scn-test-basic", self.integration.scenarios)
        
        # Verify file was deleted
        self.assertFalse(os.path.exists(os.path.join(self.test_scenarios_dir, "scn-test-basic.json")))
    
    @patch('requests.request')
    def test_run_scenario(self, mock_request):
        """Test running a scenario."""
        # Mock API responses
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"items": []}'
        mock_response.json.return_value = {"items": []}
        mock_request.return_value = mock_response
        
        # Run scenario
        run_id = self.integration.run_scenario("scn-test-basic")
        
        # Verify run was successful
        self.assertIsNotNone(run_id)
        self.assertIn(run_id, self.integration.results)
        
        # Verify run properties
        run = self.integration.get_run_result(run_id)
        self.assertEqual(run["scenario_id"], "scn-test-basic")
        self.assertEqual(run["status"], "completed")
        self.assertEqual(len(run["steps"]), 3)
        
        # Verify metrics were collected
        self.assertIn("metrics", run)
        self.assertEqual(run["metrics"]["total_steps"], 3)
        self.assertEqual(run["metrics"]["completed_steps"], 3)
        
        # Verify results were analyzed
        self.assertIn("results", run)
        self.assertTrue(run["results"]["success"])
    
    @patch('requests.request')
    def test_run_scenario_with_failure(self, mock_request):
        """Test running a scenario with a failure."""
        # Mock API responses
        def mock_api_call(*args, **kwargs):
            # Fail on the POST request
            if kwargs.get('method') == 'POST':
                mock_response = MagicMock()
                mock_response.status_code = 400
                mock_response.content = b'{"error": "Bad Request"}'
                mock_response.json.return_value = {"error": "Bad Request"}
                return mock_response
            else:
                mock_response = MagicMock()
                mock_response.status_code = 200
                mock_response.content = b'{"items": []}'
                mock_response.json.return_value = {"items": []}
                return mock_response
        
        mock_request.side_effect = mock_api_call
        
        # Run scenario
        run_id = self.integration.run_scenario("scn-test-basic")
        
        # Verify run was created
        self.assertIsNotNone(run_id)
        self.assertIn(run_id, self.integration.results)
        
        # Verify run properties
        run = self.integration.get_run_result(run_id)
        self.assertEqual(run["scenario_id"], "scn-test-basic")
        self.assertEqual(run["status"], "failed")
        self.assertGreater(len(run["errors"]), 0)
    
    def test_generate_benchmark_report(self):
        """Test generating a benchmark report."""
        # Add some mock run results
        self.integration.results["run-test1"] = {
            "run_id": "run-test1",
            "scenario_id": "scn-test-basic",
            "status": "completed",
            "start_time": "2025-05-22T10:30:00Z",
            "end_time": "2025-05-22T10:31:00Z",
            "steps": [
                {"step_id": "step-1", "type": "api_call", "status": "completed"},
                {"step_id": "step-2", "type": "wait", "status": "completed"},
                {"step_id": "step-3", "type": "api_call", "status": "completed"}
            ],
            "metrics": {
                "total_steps": 3,
                "completed_steps": 3,
                "failed_steps": 0,
                "api_calls": 2,
                "assertions": 0,
                "duration_seconds": 60
            },
            "results": {
                "success": True,
                "compliance": {"score": 0.8},
                "performance": {"score": 0.9},
                "reliability": {"score": 1.0},
                "security": {"score": 0.7}
            }
        }
        
        # Add metrics
        self.integration.metrics["scn-test-basic"] = {
            "runs": [
                {
                    "run_id": "run-test1",
                    "timestamp": "2025-05-22T10:31:00Z",
                    "duration": 60,
                    "success": True
                }
            ],
            "avg_duration": 60,
            "success_rate": 1.0,
            "total_runs": 1
        }
        
        # Generate report
        report = self.integration.generate_benchmark_report()
        
        # Verify report properties
        self.assertIn("scenarios", report)
        self.assertIn("overall", report)
        self.assertEqual(report["overall"]["total_scenarios"], 2)
        
        # Verify scenario metrics
        self.assertIn("scn-test-basic", report["scenarios"])
        self.assertEqual(report["scenarios"]["scn-test-basic"]["total_runs"], 1)
        self.assertEqual(report["scenarios"]["scn-test-basic"]["success_rate"], 1.0)
        
        # Verify scores
        self.assertIn("scores", report["scenarios"]["scn-test-basic"])
        self.assertEqual(report["scenarios"]["scn-test-basic"]["scores"]["compliance"], 0.8)
        self.assertEqual(report["scenarios"]["scn-test-basic"]["scores"]["performance"], 0.9)
        self.assertEqual(report["scenarios"]["scn-test-basic"]["scores"]["reliability"], 1.0)
        self.assertEqual(report["scenarios"]["scn-test-basic"]["scores"]["security"], 0.7)
    
    def test_save_benchmark_report(self):
        """Test saving a benchmark report."""
        # Create a simple report
        report = {
            "generated_at": "2025-05-22T10:30:00Z",
            "scenarios": {
                "scn-test-basic": {
                    "name": "Basic Test Scenario",
                    "total_runs": 1,
                    "success_rate": 1.0
                }
            },
            "overall": {
                "total_scenarios": 1,
                "total_runs": 1
            }
        }
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            filepath = temp_file.name
        
        # Save report
        result = self.integration.save_benchmark_report(report, filepath)
        
        # Verify save was successful
        self.assertTrue(result)
        
        # Verify file was created and contains the report
        with open(filepath, 'r') as f:
            saved_report = json.load(f)
        
        self.assertEqual(saved_report["generated_at"], "2025-05-22T10:30:00Z")
        self.assertIn("scn-test-basic", saved_report["scenarios"])
        
        # Clean up
        os.remove(filepath)
    
    def test_create_default_scenarios(self):
        """Test creating default scenarios."""
        # Delete existing scenarios
        self.integration.delete_scenario("scn-test-basic")
        self.integration.delete_scenario("scn-test-security")
        
        # Create default scenarios
        scenario_ids = self.integration.create_default_scenarios()
        
        # Verify scenarios were created
        self.assertEqual(len(scenario_ids), 2)
        
        # Verify scenario files were created
        for scenario_id in scenario_ids:
            self.assertTrue(os.path.exists(os.path.join(self.test_scenarios_dir, f"{scenario_id}.json")))
    
    def test_get_integration_singleton(self):
        """Test getting the singleton integration instance."""
        # Get singleton instance
        integration1 = get_integration()
        integration2 = get_integration()
        
        # Verify same instance
        self.assertIs(integration1, integration2)


if __name__ == "__main__":
    unittest.main()
