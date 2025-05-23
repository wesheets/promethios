"""
TheAgentCompany Integration Testing Module for Promethios Phase 6.1

This module provides integration with TheAgentCompany benchmark for testing
the Promethios governance API, including scenario management, metrics collection,
and compliance result analysis.
"""

import json
import os
import logging
import requests
import time
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime
import uuid
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TheAgentCompanyIntegration:
    """
    Integration with TheAgentCompany benchmark for testing Promethios governance API.
    
    This class provides functionality to run benchmark scenarios, collect metrics,
    and analyze compliance results from TheAgentCompany benchmark.
    """
    
    def __init__(self, api_base_url: str = None, api_key: str = None, 
                 scenarios_directory: str = None):
        """
        Initialize TheAgentCompany integration.
        
        Args:
            api_base_url: Base URL for Promethios API
            api_key: API key for authentication
            scenarios_directory: Directory containing benchmark scenarios
        """
        self.api_base_url = api_base_url or os.environ.get("PROMETHIOS_API_URL", "http://localhost:8000")
        self.api_key = api_key or os.environ.get("PROMETHIOS_API_KEY", "")
        self.scenarios_directory = scenarios_directory or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "benchmark_scenarios"
        )
        self.scenarios: Dict[str, Dict[str, Any]] = {}
        self.results: Dict[str, Dict[str, Any]] = {}
        self.metrics: Dict[str, Dict[str, Any]] = {}
        
        # Ensure scenarios directory exists
        os.makedirs(self.scenarios_directory, exist_ok=True)
        
        # Load scenarios
        self.load_scenarios()
    
    def load_scenarios(self) -> None:
        """
        Load benchmark scenarios from the scenarios directory.
        """
        logger.info(f"Loading benchmark scenarios from {self.scenarios_directory}")
        if not os.path.exists(self.scenarios_directory):
            logger.warning(f"Scenarios directory {self.scenarios_directory} does not exist")
            return
            
        for filename in os.listdir(self.scenarios_directory):
            if filename.endswith(".json"):
                scenario_path = os.path.join(self.scenarios_directory, filename)
                try:
                    with open(scenario_path, 'r') as f:
                        scenario = json.load(f)
                    
                    # Extract scenario ID
                    scenario_id = scenario.get("scenario_id")
                    
                    if not scenario_id:
                        logger.warning(f"Skipping scenario file {filename}: missing scenario_id")
                        continue
                    
                    self.scenarios[scenario_id] = scenario
                    logger.info(f"Loaded benchmark scenario: {scenario_id}")
                except Exception as e:
                    logger.error(f"Error loading scenario {filename}: {str(e)}")
    
    def get_scenario(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a benchmark scenario by ID.
        
        Args:
            scenario_id: ID of the scenario
            
        Returns:
            Scenario as a dictionary, or None if not found
        """
        return self.scenarios.get(scenario_id)
    
    def get_all_scenarios(self) -> List[Dict[str, Any]]:
        """
        Get all benchmark scenarios.
        
        Returns:
            List of scenarios
        """
        return list(self.scenarios.values())
    
    def create_scenario(self, scenario: Dict[str, Any]) -> str:
        """
        Create a new benchmark scenario.
        
        Args:
            scenario: Scenario definition as a dictionary
            
        Returns:
            ID of the created scenario
        """
        # Generate scenario ID if not provided
        if "scenario_id" not in scenario:
            scenario_id = f"scn-{uuid.uuid4().hex[:8]}"
            scenario["scenario_id"] = scenario_id
        else:
            scenario_id = scenario["scenario_id"]
        
        # Add metadata
        if "metadata" not in scenario:
            scenario["metadata"] = {}
        
        scenario["metadata"]["created_at"] = datetime.now().isoformat()
        scenario["metadata"]["created_by"] = "theagentcompany_integration"
        
        # Store scenario
        self.scenarios[scenario_id] = scenario
        
        # Save to file
        filename = f"{scenario_id}.json"
        filepath = os.path.join(self.scenarios_directory, filename)
        
        try:
            with open(filepath, 'w') as f:
                json.dump(scenario, f, indent=2)
            logger.info(f"Created benchmark scenario: {scenario_id}")
        except Exception as e:
            logger.error(f"Error saving scenario {filename}: {str(e)}")
        
        return scenario_id
    
    def update_scenario(self, scenario_id: str, scenario: Dict[str, Any]) -> bool:
        """
        Update an existing benchmark scenario.
        
        Args:
            scenario_id: ID of the scenario to update
            scenario: Updated scenario definition
            
        Returns:
            True if successful, False otherwise
        """
        if scenario_id not in self.scenarios:
            logger.error(f"Scenario {scenario_id} not found")
            return False
        
        # Ensure scenario ID is consistent
        scenario["scenario_id"] = scenario_id
        
        # Update metadata
        if "metadata" not in scenario:
            scenario["metadata"] = {}
        
        scenario["metadata"]["updated_at"] = datetime.now().isoformat()
        scenario["metadata"]["updated_by"] = "theagentcompany_integration"
        
        # Store scenario
        self.scenarios[scenario_id] = scenario
        
        # Save to file
        filename = f"{scenario_id}.json"
        filepath = os.path.join(self.scenarios_directory, filename)
        
        try:
            with open(filepath, 'w') as f:
                json.dump(scenario, f, indent=2)
            logger.info(f"Updated benchmark scenario: {scenario_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving scenario {filename}: {str(e)}")
            return False
    
    def delete_scenario(self, scenario_id: str) -> bool:
        """
        Delete a benchmark scenario.
        
        Args:
            scenario_id: ID of the scenario to delete
            
        Returns:
            True if successful, False otherwise
        """
        if scenario_id not in self.scenarios:
            logger.error(f"Scenario {scenario_id} not found")
            return False
        
        # Remove from memory
        del self.scenarios[scenario_id]
        
        # Remove file
        filename = f"{scenario_id}.json"
        filepath = os.path.join(self.scenarios_directory, filename)
        
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
            logger.info(f"Deleted benchmark scenario: {scenario_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting scenario {filename}: {str(e)}")
            return False
    
    def run_scenario(self, scenario_id: str, params: Dict[str, Any] = None) -> Optional[str]:
        """
        Run a benchmark scenario.
        
        Args:
            scenario_id: ID of the scenario to run
            params: Additional parameters for the scenario
            
        Returns:
            Run ID if successful, None otherwise
        """
        scenario = self.get_scenario(scenario_id)
        if not scenario:
            logger.error(f"Scenario {scenario_id} not found")
            return None
        
        # Generate run ID
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        
        # Initialize run
        run = {
            "run_id": run_id,
            "scenario_id": scenario_id,
            "status": "running",
            "start_time": datetime.now().isoformat(),
            "params": params or {},
            "steps": [],
            "metrics": {},
            "results": {},
            "errors": []
        }
        
        # Store run
        self.results[run_id] = run
        
        try:
            # Execute scenario steps
            self._execute_scenario_steps(run, scenario)
            
            # Collect metrics
            self._collect_metrics(run, scenario)
            
            # Analyze results
            self._analyze_results(run, scenario)
            
            # Mark as completed
            run["status"] = "completed"
            run["end_time"] = datetime.now().isoformat()
            
            logger.info(f"Completed benchmark run: {run_id}")
            return run_id
        except Exception as e:
            # Mark as failed
            run["status"] = "failed"
            run["end_time"] = datetime.now().isoformat()
            run["errors"].append(str(e))
            
            logger.error(f"Error running benchmark scenario {scenario_id}: {str(e)}")
            return run_id
    
    def _execute_scenario_steps(self, run: Dict[str, Any], scenario: Dict[str, Any]) -> None:
        """
        Execute the steps in a benchmark scenario.
        
        Args:
            run: Run data
            scenario: Scenario definition
        """
        steps = scenario.get("steps", [])
        
        for i, step in enumerate(steps):
            step_type = step.get("type")
            step_id = step.get("id", f"step-{i+1}")
            
            # Initialize step result
            step_result = {
                "step_id": step_id,
                "type": step_type,
                "status": "running",
                "start_time": datetime.now().isoformat()
            }
            
            run["steps"].append(step_result)
            
            try:
                # Execute step based on type
                if step_type == "api_call":
                    self._execute_api_call_step(step_result, step, run)
                elif step_type == "wait":
                    self._execute_wait_step(step_result, step)
                elif step_type == "assertion":
                    self._execute_assertion_step(step_result, step, run)
                else:
                    raise ValueError(f"Unknown step type: {step_type}")
                
                # Mark step as completed
                step_result["status"] = "completed"
            except Exception as e:
                # Mark step as failed
                step_result["status"] = "failed"
                step_result["error"] = str(e)
                
                # Add to run errors
                run["errors"].append(f"Step {step_id} failed: {str(e)}")
                
                # Stop execution if step is critical
                if step.get("critical", False):
                    raise Exception(f"Critical step {step_id} failed: {str(e)}")
            finally:
                step_result["end_time"] = datetime.now().isoformat()
    
    def _execute_api_call_step(self, step_result: Dict[str, Any], step: Dict[str, Any], 
                              run: Dict[str, Any]) -> None:
        """
        Execute an API call step.
        
        Args:
            step_result: Step result data
            step: Step definition
            run: Run data
        """
        # Get API call details
        method = step.get("method", "GET")
        endpoint = step.get("endpoint")
        params = step.get("params", {})
        headers = step.get("headers", {})
        body = step.get("body", {})
        
        if not endpoint:
            raise ValueError("Missing endpoint in API call step")
        
        # Add API key to headers if available
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        # Build URL
        url = f"{self.api_base_url}{endpoint}"
        
        # Make API call
        step_result["request"] = {
            "method": method,
            "url": url,
            "params": params,
            "headers": {k: v for k, v in headers.items() if k != "Authorization"},
            "body": body
        }
        
        try:
            response = requests.request(
                method=method,
                url=url,
                params=params,
                headers=headers,
                json=body if method in ["POST", "PUT", "PATCH"] else None
            )
            
            # Store response
            step_result["response"] = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.json() if response.content else None
            }
            
            # Store response in run context for assertions
            context_key = step.get("context_key")
            if context_key:
                if "context" not in run:
                    run["context"] = {}
                run["context"][context_key] = response.json() if response.content else None
            
            # Check if response is successful
            if response.status_code >= 400:
                raise ValueError(f"API call failed with status code {response.status_code}")
        except requests.RequestException as e:
            raise ValueError(f"API call failed: {str(e)}")
    
    def _execute_wait_step(self, step_result: Dict[str, Any], step: Dict[str, Any]) -> None:
        """
        Execute a wait step.
        
        Args:
            step_result: Step result data
            step: Step definition
        """
        # Get wait duration
        duration = step.get("duration", 1)
        
        # Wait
        step_result["duration"] = duration
        time.sleep(duration)
    
    def _execute_assertion_step(self, step_result: Dict[str, Any], step: Dict[str, Any], 
                               run: Dict[str, Any]) -> None:
        """
        Execute an assertion step.
        
        Args:
            step_result: Step result data
            step: Step definition
            run: Run data
        """
        # Get assertion details
        assertion_type = step.get("assertion_type")
        context_key = step.get("context_key")
        expected = step.get("expected")
        
        if not assertion_type:
            raise ValueError("Missing assertion_type in assertion step")
        
        if not context_key:
            raise ValueError("Missing context_key in assertion step")
        
        # Get actual value from context
        if "context" not in run:
            raise ValueError(f"Context not found for key {context_key}")
        
        context = run["context"]
        if context_key not in context:
            raise ValueError(f"Context key {context_key} not found")
        
        actual = context[context_key]
        
        # Execute assertion based on type
        if assertion_type == "equals":
            if actual != expected:
                raise ValueError(f"Assertion failed: {actual} != {expected}")
        elif assertion_type == "contains":
            if expected not in actual:
                raise ValueError(f"Assertion failed: {expected} not in {actual}")
        elif assertion_type == "status_code":
            if actual["status_code"] != expected:
                raise ValueError(f"Assertion failed: status code {actual['status_code']} != {expected}")
        else:
            raise ValueError(f"Unknown assertion type: {assertion_type}")
        
        # Store assertion result
        step_result["assertion"] = {
            "type": assertion_type,
            "expected": expected,
            "actual": actual,
            "result": "passed"
        }
    
    def _collect_metrics(self, run: Dict[str, Any], scenario: Dict[str, Any]) -> None:
        """
        Collect metrics from a benchmark run.
        
        Args:
            run: Run data
            scenario: Scenario definition
        """
        # Calculate basic metrics
        metrics = {
            "total_steps": len(run["steps"]),
            "completed_steps": sum(1 for step in run["steps"] if step["status"] == "completed"),
            "failed_steps": sum(1 for step in run["steps"] if step["status"] == "failed"),
            "api_calls": sum(1 for step in run["steps"] if step.get("type") == "api_call"),
            "assertions": sum(1 for step in run["steps"] if step.get("type") == "assertion"),
            "duration_seconds": 0
        }
        
        # Calculate duration
        if "start_time" in run and "end_time" in run:
            start_time = datetime.fromisoformat(run["start_time"])
            end_time = datetime.fromisoformat(run["end_time"])
            metrics["duration_seconds"] = (end_time - start_time).total_seconds()
        
        # Calculate API call metrics
        api_calls = [step for step in run["steps"] if step.get("type") == "api_call"]
        if api_calls:
            # Calculate response time statistics
            response_times = []
            for call in api_calls:
                if "start_time" in call and "end_time" in call:
                    start_time = datetime.fromisoformat(call["start_time"])
                    end_time = datetime.fromisoformat(call["end_time"])
                    response_times.append((end_time - start_time).total_seconds())
            
            if response_times:
                metrics["api_call_metrics"] = {
                    "min_response_time": min(response_times),
                    "max_response_time": max(response_times),
                    "avg_response_time": sum(response_times) / len(response_times),
                    "total_response_time": sum(response_times)
                }
            
            # Calculate status code distribution
            status_codes = {}
            for call in api_calls:
                if "response" in call and "status_code" in call["response"]:
                    status_code = call["response"]["status_code"]
                    status_codes[status_code] = status_codes.get(status_code, 0) + 1
            
            if status_codes:
                metrics["status_code_distribution"] = status_codes
        
        # Store metrics
        run["metrics"] = metrics
        
        # Add to metrics history
        scenario_id = scenario["scenario_id"]
        if scenario_id not in self.metrics:
            self.metrics[scenario_id] = {
                "runs": [],
                "avg_duration": 0,
                "success_rate": 0,
                "total_runs": 0
            }
        
        # Update scenario metrics
        self.metrics[scenario_id]["runs"].append({
            "run_id": run["run_id"],
            "timestamp": run["end_time"],
            "duration": metrics["duration_seconds"],
            "success": run["status"] == "completed"
        })
        
        # Recalculate aggregate metrics
        runs = self.metrics[scenario_id]["runs"]
        self.metrics[scenario_id]["total_runs"] = len(runs)
        self.metrics[scenario_id]["avg_duration"] = sum(r["duration"] for r in runs) / len(runs)
        self.metrics[scenario_id]["success_rate"] = sum(1 for r in runs if r["success"]) / len(runs)
    
    def _analyze_results(self, run: Dict[str, Any], scenario: Dict[str, Any]) -> None:
        """
        Analyze results from a benchmark run.
        
        Args:
            run: Run data
            scenario: Scenario definition
        """
        # Initialize results
        results = {
            "success": run["status"] == "completed" and not run["errors"],
            "compliance": {},
            "performance": {},
            "reliability": {},
            "security": {}
        }
        
        # Analyze compliance
        compliance_checks = scenario.get("compliance_checks", [])
        if compliance_checks:
            compliance_results = {}
            for check in compliance_checks:
                check_id = check.get("id")
                check_type = check.get("type")
                check_criteria = check.get("criteria")
                
                if not check_id or not check_type or not check_criteria:
                    continue
                
                # Evaluate compliance check
                try:
                    if check_type == "response_field":
                        # Check if a specific field exists in a response
                        context_key = check_criteria.get("context_key")
                        field_path = check_criteria.get("field_path")
                        
                        if not context_key or not field_path or "context" not in run:
                            compliance_results[check_id] = False
                            continue
                        
                        # Get response from context
                        response = run["context"].get(context_key)
                        if not response:
                            compliance_results[check_id] = False
                            continue
                        
                        # Check field path
                        parts = field_path.split(".")
                        value = response
                        for part in parts:
                            if isinstance(value, dict) and part in value:
                                value = value[part]
                            else:
                                value = None
                                break
                        
                        compliance_results[check_id] = value is not None
                    
                    elif check_type == "status_code":
                        # Check if status code matches expected
                        context_key = check_criteria.get("context_key")
                        expected_code = check_criteria.get("expected_code")
                        
                        if not context_key or not expected_code or "context" not in run:
                            compliance_results[check_id] = False
                            continue
                        
                        # Get response from context
                        response = run["context"].get(context_key)
                        if not response or "status_code" not in response:
                            compliance_results[check_id] = False
                            continue
                        
                        compliance_results[check_id] = response["status_code"] == expected_code
                    
                    else:
                        compliance_results[check_id] = False
                except Exception:
                    compliance_results[check_id] = False
            
            # Calculate overall compliance score
            if compliance_results:
                compliance_score = sum(1 for result in compliance_results.values() if result) / len(compliance_results)
                results["compliance"] = {
                    "checks": compliance_results,
                    "score": compliance_score,
                    "passed": sum(1 for result in compliance_results.values() if result),
                    "total": len(compliance_results)
                }
        
        # Analyze performance
        if "metrics" in run and "api_call_metrics" in run["metrics"]:
            api_metrics = run["metrics"]["api_call_metrics"]
            performance_score = 0.0
            
            # Define performance thresholds
            thresholds = scenario.get("performance_thresholds", {
                "excellent": 0.2,  # 200ms
                "good": 0.5,       # 500ms
                "acceptable": 1.0,  # 1s
                "poor": 2.0        # 2s
            })
            
            # Calculate performance score based on average response time
            avg_response_time = api_metrics.get("avg_response_time", 0)
            if avg_response_time <= thresholds.get("excellent", 0.2):
                performance_score = 1.0
            elif avg_response_time <= thresholds.get("good", 0.5):
                performance_score = 0.8
            elif avg_response_time <= thresholds.get("acceptable", 1.0):
                performance_score = 0.6
            elif avg_response_time <= thresholds.get("poor", 2.0):
                performance_score = 0.4
            else:
                performance_score = 0.2
            
            results["performance"] = {
                "score": performance_score,
                "avg_response_time": avg_response_time,
                "max_response_time": api_metrics.get("max_response_time", 0),
                "thresholds": thresholds
            }
        
        # Analyze reliability
        if "metrics" in run:
            metrics = run["metrics"]
            reliability_score = 0.0
            
            # Calculate reliability based on completed steps
            total_steps = metrics.get("total_steps", 0)
            completed_steps = metrics.get("completed_steps", 0)
            
            if total_steps > 0:
                reliability_score = completed_steps / total_steps
            
            results["reliability"] = {
                "score": reliability_score,
                "completed_steps": completed_steps,
                "total_steps": total_steps
            }
        
        # Analyze security
        security_checks = scenario.get("security_checks", [])
        if security_checks:
            security_results = {}
            for check in security_checks:
                check_id = check.get("id")
                check_type = check.get("type")
                check_criteria = check.get("criteria")
                
                if not check_id or not check_type or not check_criteria:
                    continue
                
                # Evaluate security check
                try:
                    if check_type == "authentication":
                        # Check if authentication is required
                        context_key = check_criteria.get("context_key")
                        
                        if not context_key or "context" not in run:
                            security_results[check_id] = False
                            continue
                        
                        # Get response from context
                        response = run["context"].get(context_key)
                        if not response or "status_code" not in response:
                            security_results[check_id] = False
                            continue
                        
                        # Check if unauthenticated request is rejected
                        security_results[check_id] = response["status_code"] == 401
                    
                    elif check_type == "input_validation":
                        # Check if input validation is working
                        context_key = check_criteria.get("context_key")
                        
                        if not context_key or "context" not in run:
                            security_results[check_id] = False
                            continue
                        
                        # Get response from context
                        response = run["context"].get(context_key)
                        if not response or "status_code" not in response:
                            security_results[check_id] = False
                            continue
                        
                        # Check if invalid input is rejected
                        security_results[check_id] = response["status_code"] == 400
                    
                    else:
                        security_results[check_id] = False
                except Exception:
                    security_results[check_id] = False
            
            # Calculate overall security score
            if security_results:
                security_score = sum(1 for result in security_results.values() if result) / len(security_results)
                results["security"] = {
                    "checks": security_results,
                    "score": security_score,
                    "passed": sum(1 for result in security_results.values() if result),
                    "total": len(security_results)
                }
        
        # Store results
        run["results"] = results
    
    def get_run_result(self, run_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the result of a benchmark run.
        
        Args:
            run_id: ID of the run
            
        Returns:
            Run result as a dictionary, or None if not found
        """
        return self.results.get(run_id)
    
    def get_scenario_metrics(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        """
        Get metrics for a benchmark scenario.
        
        Args:
            scenario_id: ID of the scenario
            
        Returns:
            Metrics as a dictionary, or None if not found
        """
        return self.metrics.get(scenario_id)
    
    def generate_benchmark_report(self, scenario_id: str = None) -> Dict[str, Any]:
        """
        Generate a benchmark report.
        
        Args:
            scenario_id: ID of the scenario to report on (if None, reports on all scenarios)
            
        Returns:
            Benchmark report as a dictionary
        """
        report = {
            "generated_at": datetime.now().isoformat(),
            "scenarios": {},
            "overall": {
                "total_scenarios": 0,
                "total_runs": 0,
                "avg_success_rate": 0,
                "avg_compliance_score": 0,
                "avg_performance_score": 0,
                "avg_reliability_score": 0,
                "avg_security_score": 0
            }
        }
        
        # Get scenarios to report on
        if scenario_id:
            scenarios = {scenario_id: self.scenarios.get(scenario_id)} if scenario_id in self.scenarios else {}
        else:
            scenarios = self.scenarios
        
        # Generate report for each scenario
        for scenario_id, scenario in scenarios.items():
            if not scenario:
                continue
            
            # Get metrics for scenario
            metrics = self.metrics.get(scenario_id, {})
            
            # Get latest run for scenario
            latest_run_id = None
            latest_timestamp = None
            
            for run in metrics.get("runs", []):
                run_timestamp = datetime.fromisoformat(run["timestamp"]) if "timestamp" in run else None
                if run_timestamp and (not latest_timestamp or run_timestamp > latest_timestamp):
                    latest_timestamp = run_timestamp
                    latest_run_id = run["run_id"]
            
            latest_run = self.results.get(latest_run_id, {}) if latest_run_id else {}
            
            # Extract scores from latest run
            compliance_score = latest_run.get("results", {}).get("compliance", {}).get("score", 0)
            performance_score = latest_run.get("results", {}).get("performance", {}).get("score", 0)
            reliability_score = latest_run.get("results", {}).get("reliability", {}).get("score", 0)
            security_score = latest_run.get("results", {}).get("security", {}).get("score", 0)
            
            # Add scenario to report
            report["scenarios"][scenario_id] = {
                "name": scenario.get("name", scenario_id),
                "description": scenario.get("description", ""),
                "total_runs": metrics.get("total_runs", 0),
                "success_rate": metrics.get("success_rate", 0),
                "avg_duration": metrics.get("avg_duration", 0),
                "latest_run": latest_run_id,
                "latest_run_timestamp": latest_timestamp.isoformat() if latest_timestamp else None,
                "scores": {
                    "compliance": compliance_score,
                    "performance": performance_score,
                    "reliability": reliability_score,
                    "security": security_score,
                    "overall": (compliance_score + performance_score + reliability_score + security_score) / 4
                }
            }
            
            # Update overall metrics
            report["overall"]["total_scenarios"] += 1
            report["overall"]["total_runs"] += metrics.get("total_runs", 0)
        
        # Calculate overall averages
        if report["overall"]["total_scenarios"] > 0:
            report["overall"]["avg_success_rate"] = sum(
                s["success_rate"] for s in report["scenarios"].values()
            ) / report["overall"]["total_scenarios"]
            
            report["overall"]["avg_compliance_score"] = sum(
                s["scores"]["compliance"] for s in report["scenarios"].values()
            ) / report["overall"]["total_scenarios"]
            
            report["overall"]["avg_performance_score"] = sum(
                s["scores"]["performance"] for s in report["scenarios"].values()
            ) / report["overall"]["total_scenarios"]
            
            report["overall"]["avg_reliability_score"] = sum(
                s["scores"]["reliability"] for s in report["scenarios"].values()
            ) / report["overall"]["total_scenarios"]
            
            report["overall"]["avg_security_score"] = sum(
                s["scores"]["security"] for s in report["scenarios"].values()
            ) / report["overall"]["total_scenarios"]
            
            report["overall"]["avg_overall_score"] = sum(
                s["scores"]["overall"] for s in report["scenarios"].values()
            ) / report["overall"]["total_scenarios"]
        
        return report
    
    def save_benchmark_report(self, report: Dict[str, Any], filepath: str) -> bool:
        """
        Save a benchmark report to file.
        
        Args:
            report: Benchmark report as a dictionary
            filepath: Path to save the report
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(filepath, 'w') as f:
                json.dump(report, f, indent=2)
            logger.info(f"Saved benchmark report to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error saving benchmark report to {filepath}: {str(e)}")
            return False
    
    def create_default_scenarios(self) -> List[str]:
        """
        Create default benchmark scenarios.
        
        Returns:
            List of created scenario IDs
        """
        scenario_ids = []
        
        # Basic API functionality scenario
        basic_scenario = {
            "name": "Basic API Functionality",
            "description": "Tests basic API functionality including memory, policy, and reflection endpoints",
            "steps": [
                {
                    "id": "memory-get",
                    "type": "api_call",
                    "method": "GET",
                    "endpoint": "/memory/records",
                    "context_key": "memory_list"
                },
                {
                    "id": "memory-post",
                    "type": "api_call",
                    "method": "POST",
                    "endpoint": "/memory/records",
                    "body": {
                        "record_id": f"mem-test{int(time.time())}",
                        "timestamp": datetime.now().isoformat(),
                        "source": "benchmark",
                        "record_type": "test",
                        "content": {"test": "data"}
                    },
                    "context_key": "memory_create"
                },
                {
                    "id": "policy-get",
                    "type": "api_call",
                    "method": "GET",
                    "endpoint": "/policy",
                    "context_key": "policy_list"
                }
            ],
            "compliance_checks": [
                {
                    "id": "memory-schema",
                    "type": "response_field",
                    "criteria": {
                        "context_key": "memory_create",
                        "field_path": "record_id"
                    }
                }
            ],
            "performance_thresholds": {
                "excellent": 0.2,
                "good": 0.5,
                "acceptable": 1.0,
                "poor": 2.0
            }
        }
        
        # Security testing scenario
        security_scenario = {
            "name": "Security Testing",
            "description": "Tests API security including authentication and input validation",
            "steps": [
                {
                    "id": "unauthenticated-access",
                    "type": "api_call",
                    "method": "GET",
                    "endpoint": "/policy",
                    "headers": {"Authorization": "Bearer invalid"},
                    "context_key": "unauthenticated_access"
                },
                {
                    "id": "invalid-input",
                    "type": "api_call",
                    "method": "POST",
                    "endpoint": "/memory/records",
                    "body": {
                        # Missing required fields
                        "content": {"test": "data"}
                    },
                    "context_key": "invalid_input"
                }
            ],
            "security_checks": [
                {
                    "id": "auth-required",
                    "type": "authentication",
                    "criteria": {
                        "context_key": "unauthenticated_access"
                    }
                },
                {
                    "id": "input-validation",
                    "type": "input_validation",
                    "criteria": {
                        "context_key": "invalid_input"
                    }
                }
            ]
        }
        
        # Create scenarios
        scenario_ids.append(self.create_scenario(basic_scenario))
        scenario_ids.append(self.create_scenario(security_scenario))
        
        return scenario_ids


# Singleton instance
_integration_instance = None

def get_integration() -> TheAgentCompanyIntegration:
    """
    Get the singleton instance of TheAgentCompany integration.
    
    Returns:
        TheAgentCompanyIntegration instance
    """
    global _integration_instance
    if _integration_instance is None:
        _integration_instance = TheAgentCompanyIntegration()
    return _integration_instance
