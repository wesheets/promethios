"""
Tests for the Health Check System.

This module contains unit tests for the Phase 3 health check system:
- ConstitutionalValidationScanner
- SystemIntegrityVerifier
- PerformanceTrendAnalyzer
- HealthCheckSystem
"""

import unittest
import os
import time
import json
import tempfile
import logging
from typing import Dict, Any, List

from health_check_system import (
    HealthCheckStatus,
    HealthCheckCategory,
    HealthCheckResult,
    BaseHealthCheck,
    ConstitutionalValidationScanner,
    SystemIntegrityVerifier,
    PerformanceTrendAnalyzer,
    HealthCheckSystem
)

# Configure logging for tests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class MockHealthCheck(BaseHealthCheck):
    """Mock health check for testing."""
    
    def __init__(self, check_id: str, category: HealthCheckCategory, description: str, 
                 status: HealthCheckStatus = HealthCheckStatus.PASSED):
        """Initialize the mock health check."""
        super().__init__(check_id, category, description)
        self.status = status
        self.execution_count = 0
    
    def _execute_check(self):
        """Execute the mock check."""
        self.execution_count += 1
        return self.status, {"execution_count": self.execution_count}, {"metric1": 0.95}


class BaseHealthCheckTests(unittest.TestCase):
    """Test cases for the BaseHealthCheck class."""
    
    def test_execute_success(self):
        """Test successful execution of a health check."""
        health_check = MockHealthCheck(
            "test_check", 
            HealthCheckCategory.SYSTEM_INTEGRITY, 
            "Test health check",
            HealthCheckStatus.PASSED
        )
        
        result = health_check.execute()
        
        self.assertEqual(result.check_id, "test_check")
        self.assertEqual(result.status, HealthCheckStatus.PASSED)
        self.assertEqual(result.category, HealthCheckCategory.SYSTEM_INTEGRITY)
        self.assertEqual(result.details["execution_count"], 1)
        self.assertEqual(result.metrics["metric1"], 0.95)
    
    def test_execute_error(self):
        """Test error handling during health check execution."""
        class ErrorHealthCheck(BaseHealthCheck):
            def _execute_check(self):
                raise ValueError("Test error")
        
        health_check = ErrorHealthCheck(
            "error_check", 
            HealthCheckCategory.SYSTEM_INTEGRITY, 
            "Error health check"
        )
        
        result = health_check.execute()
        
        self.assertEqual(result.check_id, "error_check")
        self.assertEqual(result.status, HealthCheckStatus.ERROR)
        self.assertEqual(result.category, HealthCheckCategory.SYSTEM_INTEGRITY)
        self.assertEqual(result.details["error_type"], "ValueError")
        self.assertEqual(result.details["error"], "Test error")


class ConstitutionalValidationScannerTests(unittest.TestCase):
    """Test cases for the ConstitutionalValidationScanner class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.scanner = ConstitutionalValidationScanner(
            "constitutional_scanner",
            "Constitutional validation scanner",
            {
                "principle1": {"name": "Principle 1"},
                "principle2": {"name": "Principle 2"}
            }
        )
    
    def test_execute_check(self):
        """Test execution of the constitutional validation scanner."""
        # Set baseline governance
        self.scanner.set_baseline_governance({
            "component1": {"setting1": "value1"},
            "component2": {"setting2": "value2"}
        })
        
        # Add memory integrity check
        def memory_check():
            return True
        
        self.scanner.add_memory_integrity_check(memory_check)
        
        # Add reflection check
        def reflection_check():
            return True
        
        self.scanner.add_reflection_check(reflection_check)
        
        # Execute the check
        result = self.scanner.execute()
        
        # Verify result
        self.assertEqual(result.check_id, "constitutional_scanner")
        self.assertEqual(result.category, HealthCheckCategory.CONSTITUTIONAL)
        self.assertIn("codex_compliance", result.details)
        self.assertIn("governance_drift", result.details)
        self.assertIn("memory_integrity", result.details)
        self.assertIn("reflection_capabilities", result.details)
        self.assertIn("compliance_score", result.metrics)
        self.assertIn("governance_drift_score", result.metrics)
        self.assertIn("memory_integrity_score", result.metrics)
        self.assertIn("reflection_capability_score", result.metrics)
        self.assertIn("overall_constitutional_score", result.metrics)
    
    def test_status_determination(self):
        """Test status determination based on scores."""
        # Test PASSED status
        self.scanner._calculate_compliance_score = lambda x: 1.0
        self.scanner._calculate_drift_score = lambda x: 1.0
        self.scanner._calculate_memory_score = lambda x: 1.0
        self.scanner._calculate_reflection_score = lambda x: 1.0
        
        result = self.scanner.execute()
        self.assertEqual(result.status, HealthCheckStatus.PASSED)
        
        # Test WARNING status
        self.scanner._calculate_compliance_score = lambda x: 0.7
        self.scanner._calculate_drift_score = lambda x: 0.7
        self.scanner._calculate_memory_score = lambda x: 0.7
        self.scanner._calculate_reflection_score = lambda x: 0.7
        
        result = self.scanner.execute()
        self.assertEqual(result.status, HealthCheckStatus.WARNING)
        
        # Test FAILED status
        self.scanner._calculate_compliance_score = lambda x: 0.5
        self.scanner._calculate_drift_score = lambda x: 0.5
        self.scanner._calculate_memory_score = lambda x: 0.5
        self.scanner._calculate_reflection_score = lambda x: 0.5
        
        result = self.scanner.execute()
        self.assertEqual(result.status, HealthCheckStatus.FAILED)


class SystemIntegrityVerifierTests(unittest.TestCase):
    """Test cases for the SystemIntegrityVerifier class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.verifier = SystemIntegrityVerifier(
            "integrity_verifier",
            "System integrity verifier"
        )
    
    def test_execute_check(self):
        """Test execution of the system integrity verifier."""
        # Set component checksums
        self.verifier.set_component_checksums({
            "component1": "checksum1",
            "component2": "checksum2"
        })
        
        # Set interface definitions
        self.verifier.set_interface_definitions({
            "interface1": {"method1": "signature1"},
            "interface2": {"method2": "signature2"}
        })
        
        # Set data structure schemas
        self.verifier.set_data_structure_schemas({
            "schema1": {"field1": "type1"},
            "schema2": {"field2": "type2"}
        })
        
        # Set configuration settings
        self.verifier.set_configuration_settings({
            "setting1": "value1",
            "setting2": "value2"
        })
        
        # Execute the check
        result = self.verifier.execute()
        
        # Verify result
        self.assertEqual(result.check_id, "integrity_verifier")
        self.assertEqual(result.category, HealthCheckCategory.SYSTEM_INTEGRITY)
        self.assertIn("component_checksums", result.details)
        self.assertIn("interface_compatibility", result.details)
        self.assertIn("data_structure_integrity", result.details)
        self.assertIn("configuration_settings", result.details)
        self.assertIn("checksum_match_rate", result.metrics)
        self.assertIn("interface_compatibility_rate", result.metrics)
        self.assertIn("data_structure_integrity_rate", result.metrics)
        self.assertIn("configuration_match_rate", result.metrics)
        self.assertIn("overall_integrity_score", result.metrics)
    
    def test_status_determination(self):
        """Test status determination based on scores."""
        # Test PASSED status
        self.verifier._calculate_checksum_match_rate = lambda x: 1.0
        self.verifier._calculate_interface_compatibility_rate = lambda x: 1.0
        self.verifier._calculate_data_structure_integrity_rate = lambda x: 1.0
        self.verifier._calculate_configuration_match_rate = lambda x: 1.0
        
        result = self.verifier.execute()
        self.assertEqual(result.status, HealthCheckStatus.PASSED)
        
        # Test WARNING status
        self.verifier._calculate_checksum_match_rate = lambda x: 0.8
        self.verifier._calculate_interface_compatibility_rate = lambda x: 0.8
        self.verifier._calculate_data_structure_integrity_rate = lambda x: 0.8
        self.verifier._calculate_configuration_match_rate = lambda x: 0.8
        
        result = self.verifier.execute()
        self.assertEqual(result.status, HealthCheckStatus.WARNING)
        
        # Test FAILED status
        self.verifier._calculate_checksum_match_rate = lambda x: 0.7
        self.verifier._calculate_interface_compatibility_rate = lambda x: 0.7
        self.verifier._calculate_data_structure_integrity_rate = lambda x: 0.7
        self.verifier._calculate_configuration_match_rate = lambda x: 0.7
        
        result = self.verifier.execute()
        self.assertEqual(result.status, HealthCheckStatus.FAILED)


class PerformanceTrendAnalyzerTests(unittest.TestCase):
    """Test cases for the PerformanceTrendAnalyzer class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.analyzer = PerformanceTrendAnalyzer(
            "performance_analyzer",
            "Performance trend analyzer"
        )
    
    def test_execute_check_with_no_data(self):
        """Test execution with no data."""
        # Execute the check
        result = self.analyzer.execute()
        
        # Verify result
        self.assertEqual(result.check_id, "performance_analyzer")
        self.assertEqual(result.category, HealthCheckCategory.PERFORMANCE)
        self.assertEqual(result.status, HealthCheckStatus.PASSED)
        self.assertIn("response_time_trends", result.details)
        self.assertIn("resource_usage_trends", result.details)
        self.assertIn("throughput_trends", result.details)
        self.assertIn("error_rate_trends", result.details)
        self.assertIn("response_time_score", result.metrics)
        self.assertIn("resource_usage_score", result.metrics)
        self.assertIn("throughput_score", result.metrics)
        self.assertIn("error_rate_score", result.metrics)
        self.assertIn("overall_performance_score", result.metrics)
    
    def test_execute_check_with_data(self):
        """Test execution with data."""
        # Add response time data
        now = time.time()
        self.analyzer.add_response_time_data(now - 3600, {"api1": 100.0, "api2": 200.0})
        self.analyzer.add_response_time_data(now - 1800, {"api1": 110.0, "api2": 190.0})
        self.analyzer.add_response_time_data(now, {"api1": 120.0, "api2": 180.0})
        
        # Add resource usage data
        self.analyzer.add_resource_usage_data(now - 3600, {"cpu": 0.5, "memory": 0.6})
        self.analyzer.add_resource_usage_data(now - 1800, {"cpu": 0.6, "memory": 0.7})
        self.analyzer.add_resource_usage_data(now, {"cpu": 0.7, "memory": 0.8})
        
        # Add throughput data
        self.analyzer.add_throughput_data(now - 3600, {"api1": 1000.0, "api2": 2000.0})
        self.analyzer.add_throughput_data(now - 1800, {"api1": 950.0, "api2": 1900.0})
        self.analyzer.add_throughput_data(now, {"api1": 900.0, "api2": 1800.0})
        
        # Add error rate data
        self.analyzer.add_error_rate_data(now - 3600, {"error1": 0.01, "error2": 0.02})
        self.analyzer.add_error_rate_data(now - 1800, {"error1": 0.02, "error2": 0.03})
        self.analyzer.add_error_rate_data(now, {"error1": 0.03, "error2": 0.04})
        
        # Execute the check
        result = self.analyzer.execute()
        
        # Verify result
        self.assertEqual(result.check_id, "performance_analyzer")
        self.assertEqual(result.category, HealthCheckCategory.PERFORMANCE)
        
        # Verify response time trends
        response_time_trends = result.details["response_time_trends"]
        self.assertEqual(response_time_trends["metrics_analyzed"], 2)
        self.assertIn("api1", response_time_trends["metric_details"])
        self.assertIn("api2", response_time_trends["metric_details"])
        
        # Verify resource usage trends
        resource_usage_trends = result.details["resource_usage_trends"]
        self.assertEqual(resource_usage_trends["resources_analyzed"], 2)
        self.assertIn("cpu", resource_usage_trends["resource_details"])
        self.assertIn("memory", resource_usage_trends["resource_details"])
        
        # Verify throughput trends
        throughput_trends = result.details["throughput_trends"]
        self.assertEqual(throughput_trends["metrics_analyzed"], 2)
        self.assertIn("api1", throughput_trends["metric_details"])
        self.assertIn("api2", throughput_trends["metric_details"])
        
        # Verify error rate trends
        error_rate_trends = result.details["error_rate_trends"]
        self.assertEqual(error_rate_trends["error_types_analyzed"], 2)
        self.assertIn("error1", error_rate_trends["error_type_details"])
        self.assertIn("error2", error_rate_trends["error_type_details"])
    
    def test_trend_calculation(self):
        """Test trend calculation."""
        # Test increasing trend
        increasing_values = [1.0, 2.0, 3.0, 4.0, 5.0]
        trend = self.analyzer._calculate_trend(increasing_values)
        self.assertGreater(trend, 0)
        
        # Test decreasing trend
        decreasing_values = [5.0, 4.0, 3.0, 2.0, 1.0]
        trend = self.analyzer._calculate_trend(decreasing_values)
        self.assertLess(trend, 0)
        
        # Test stable trend
        stable_values = [3.0, 3.0, 3.0, 3.0, 3.0]
        trend = self.analyzer._calculate_trend(stable_values)
        self.assertEqual(trend, 0)


class HealthCheckSystemTests(unittest.TestCase):
    """Test cases for the HealthCheckSystem class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.system = HealthCheckSystem()
        
        # Register mock health checks
        self.passed_check = MockHealthCheck(
            "passed_check",
            HealthCheckCategory.CONSTITUTIONAL,
            "Passed health check",
            HealthCheckStatus.PASSED
        )
        
        self.warning_check = MockHealthCheck(
            "warning_check",
            HealthCheckCategory.SYSTEM_INTEGRITY,
            "Warning health check",
            HealthCheckStatus.WARNING
        )
        
        self.failed_check = MockHealthCheck(
            "failed_check",
            HealthCheckCategory.PERFORMANCE,
            "Failed health check",
            HealthCheckStatus.FAILED
        )
        
        self.system.register_health_check(self.passed_check)
        self.system.register_health_check(self.warning_check)
        self.system.register_health_check(self.failed_check)
    
    def test_register_health_check(self):
        """Test registering a health check."""
        # Register a new health check
        new_check = MockHealthCheck(
            "new_check",
            HealthCheckCategory.SECURITY,
            "New health check"
        )
        
        self.system.register_health_check(new_check)
        
        # Verify it was registered
        self.assertIn("new_check", self.system.health_checks)
        self.assertEqual(self.system.health_checks["new_check"], new_check)
    
    def test_execute_health_check(self):
        """Test executing a specific health check."""
        # Execute a health check
        result = self.system.execute_health_check("passed_check")
        
        # Verify result
        self.assertEqual(result.check_id, "passed_check")
        self.assertEqual(result.status, HealthCheckStatus.PASSED)
        self.assertEqual(result.category, HealthCheckCategory.CONSTITUTIONAL)
        
        # Verify it was stored in history
        self.assertIn("passed_check", self.system.results_history)
        self.assertEqual(len(self.system.results_history["passed_check"]), 1)
        self.assertEqual(self.system.results_history["passed_check"][0], result)
        
        # Execute again to test history
        result2 = self.system.execute_health_check("passed_check")
        self.assertEqual(len(self.system.results_history["passed_check"]), 2)
        self.assertEqual(self.system.results_history["passed_check"][1], result2)
    
    def test_execute_all_health_checks(self):
        """Test executing all health checks."""
        # Execute all health checks
        results = self.system.execute_all_health_checks()
        
        # Verify results
        self.assertEqual(len(results), 3)
        self.assertIn("passed_check", results)
        self.assertIn("warning_check", results)
        self.assertIn("failed_check", results)
        
        # Verify execution counts
        self.assertEqual(self.passed_check.execution_count, 1)
        self.assertEqual(self.warning_check.execution_count, 1)
        self.assertEqual(self.failed_check.execution_count, 1)
    
    def test_execute_category_health_checks(self):
        """Test executing health checks by category."""
        # Execute constitutional health checks
        results = self.system.execute_category_health_checks(HealthCheckCategory.CONSTITUTIONAL)
        
        # Verify results
        self.assertEqual(len(results), 1)
        self.assertIn("passed_check", results)
        
        # Verify execution counts
        self.assertEqual(self.passed_check.execution_count, 1)
        self.assertEqual(self.warning_check.execution_count, 0)
        self.assertEqual(self.failed_check.execution_count, 0)
    
    def test_get_latest_result(self):
        """Test getting the latest result for a health check."""
        # Execute a health check multiple times
        self.system.execute_health_check("passed_check")
        result2 = self.system.execute_health_check("passed_check")
        
        # Get latest result
        latest = self.system.get_latest_result("passed_check")
        
        # Verify it's the most recent one
        self.assertEqual(latest, result2)
        
        # Test with non-existent check
        self.assertIsNone(self.system.get_latest_result("non_existent"))
    
    def test_get_result_history(self):
        """Test getting the result history for a health check."""
        # Execute a health check multiple times
        result1 = self.system.execute_health_check("passed_check")
        result2 = self.system.execute_health_check("passed_check")
        
        # Get result history
        history = self.system.get_result_history("passed_check")
        
        # Verify history
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0], result2)  # Newest first
        self.assertEqual(history[1], result1)
        
        # Test with non-existent check
        self.assertEqual(self.system.get_result_history("non_existent"), [])
    
    def test_get_system_health_summary(self):
        """Test getting the system health summary."""
        # Execute all health checks
        self.system.execute_all_health_checks()
        
        # Get system health summary
        summary = self.system.get_system_health_summary()
        
        # Verify summary
        self.assertEqual(summary["total_checks"], 3)
        self.assertEqual(summary["checks_with_results"], 3)
        self.assertEqual(summary["status_counts"][HealthCheckStatus.PASSED.value], 1)
        self.assertEqual(summary["status_counts"][HealthCheckStatus.WARNING.value], 1)
        self.assertEqual(summary["status_counts"][HealthCheckStatus.FAILED.value], 1)
        
        # Verify category summaries
        self.assertEqual(summary["category_summaries"][HealthCheckCategory.CONSTITUTIONAL.value]["total_checks"], 1)
        self.assertEqual(summary["category_summaries"][HealthCheckCategory.SYSTEM_INTEGRITY.value]["total_checks"], 1)
        self.assertEqual(summary["category_summaries"][HealthCheckCategory.PERFORMANCE.value]["total_checks"], 1)
        
        # Verify overall status
        self.assertEqual(summary["overall_status"], HealthCheckStatus.FAILED.value)
    
    def test_save_and_load_results(self):
        """Test saving and loading results to/from a file."""
        # Execute all health checks
        self.system.execute_all_health_checks()
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp:
            temp_filename = temp.name
        
        try:
            # Save results to file
            self.system.save_results_to_file(temp_filename)
            
            # Create a new system
            new_system = HealthCheckSystem()
            
            # Load results from file
            new_system.load_results_from_file(temp_filename)
            
            # Verify loaded results
            self.assertEqual(len(new_system.results_history), 3)
            self.assertIn("passed_check", new_system.results_history)
            self.assertIn("warning_check", new_system.results_history)
            self.assertIn("failed_check", new_system.results_history)
            
            # Verify result details
            loaded_result = new_system.results_history["passed_check"][0]
            self.assertEqual(loaded_result.check_id, "passed_check")
            self.assertEqual(loaded_result.status, HealthCheckStatus.PASSED)
            self.assertEqual(loaded_result.category, HealthCheckCategory.CONSTITUTIONAL)
            
        finally:
            # Clean up
            if os.path.exists(temp_filename):
                os.unlink(temp_filename)


class HealthReportGeneratorTests(unittest.TestCase):
    """Test cases for the health report generation functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.system = HealthCheckSystem()
        
        # Register mock health checks
        self.passed_check = MockHealthCheck(
            "passed_check",
            HealthCheckCategory.CONSTITUTIONAL,
            "Passed health check",
            HealthCheckStatus.PASSED
        )
        
        self.warning_check = MockHealthCheck(
            "warning_check",
            HealthCheckCategory.SYSTEM_INTEGRITY,
            "Warning health check",
            HealthCheckStatus.WARNING
        )
        
        self.failed_check = MockHealthCheck(
            "failed_check",
            HealthCheckCategory.PERFORMANCE,
            "Failed health check",
            HealthCheckStatus.FAILED
        )
        
        self.system.register_health_check(self.passed_check)
        self.system.register_health_check(self.warning_check)
        self.system.register_health_check(self.failed_check)
        
        # Execute all health checks
        self.system.execute_all_health_checks()
    
    def test_generate_health_report(self):
        """Test generating a health report."""
        # Get system health summary
        summary = self.system.get_system_health_summary()
        
        # Verify summary contains expected data
        self.assertIn("timestamp", summary)
        self.assertIn("total_checks", summary)
        self.assertIn("checks_with_results", summary)
        self.assertIn("status_counts", summary)
        self.assertIn("category_summaries", summary)
        self.assertIn("overall_status", summary)
        
        # Verify category summaries
        for category in HealthCheckCategory:
            self.assertIn(category.value, summary["category_summaries"])
            category_summary = summary["category_summaries"][category.value]
            self.assertIn("total_checks", category_summary)
            self.assertIn("checks_with_results", category_summary)
            self.assertIn("status_counts", category_summary)
            self.assertIn("status", category_summary)


if __name__ == "__main__":
    unittest.main()
