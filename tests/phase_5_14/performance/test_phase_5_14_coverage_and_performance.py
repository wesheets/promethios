"""
Test coverage and performance validation for Phase 5.14 (Governance Visualization).

This module validates that the test coverage meets the required thresholds
and that performance benchmarks are satisfied for the Governance Visualization framework.
"""

import unittest
import time
import os
import sys
import coverage
import cProfile
import pstats
import io
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

# Add the src directory to the path so we can import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

# Import core visualization modules
from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer
from src.core.visualization.governance_state_visualizer import GovernanceStateVisualizer
from src.core.visualization.trust_metrics_dashboard import TrustMetricsDashboard
from src.core.visualization.governance_health_reporter import GovernanceHealthReporter
from src.integration.governance_visualization_api import GovernanceVisualizationAPI
from src.integration.visualization_integration_service import VisualizationIntegrationService
from src.ui.governance_dashboard.components.governance_dashboard import GovernanceDashboard
from src.ui.governance_dashboard.components.trust_metrics_visualizer import TrustMetricsVisualizer
from src.ui.governance_dashboard.components.governance_health_reporter_ui import GovernanceHealthReporterUI


class TestPhase514CoverageAndPerformance(unittest.TestCase):
    """Test coverage and performance validation for Phase 5.14."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures once for all test methods in the class."""
        # Create mocks for external dependencies
        cls.schema_validator_mock = MagicMock()
        cls.schema_validator_mock.validate.return_value = True
        cls.governance_primitive_manager_mock = MagicMock()
        cls.trust_decay_engine_mock = MagicMock()
        cls.attestation_service_mock = MagicMock()
        cls.boundary_detection_engine_mock = MagicMock()
        cls.boundary_integrity_verifier_mock = MagicMock()
        
        # Configure the mocks with realistic data
        cls.configure_mocks()
        
        # Create instances of the visualization components
        cls.data_transformer = VisualizationDataTransformer(
            schema_validator=cls.schema_validator_mock,
            governance_state_provider=cls.governance_primitive_manager_mock,
            trust_metrics_provider=cls.trust_decay_engine_mock,
            health_data_provider=cls.governance_primitive_manager_mock
        )
        
        cls.governance_state_visualizer = GovernanceStateVisualizer(
            data_transformer=cls.data_transformer,
            governance_primitive_manager=cls.governance_primitive_manager_mock,
            attestation_service=cls.attestation_service_mock,
            boundary_detection_engine=cls.boundary_detection_engine_mock,
            schema_validator=cls.schema_validator_mock
        )
        
        cls.trust_metrics_dashboard = TrustMetricsDashboard(
            data_transformer=cls.data_transformer,
            trust_decay_engine=cls.trust_decay_engine_mock,
            attestation_service=cls.attestation_service_mock,
            schema_validator=cls.schema_validator_mock
        )
        
        cls.governance_health_reporter = GovernanceHealthReporter(
            data_transformer=cls.data_transformer,
            governance_primitive_manager=cls.governance_primitive_manager_mock,
            attestation_service=cls.attestation_service_mock,
            boundary_integrity_verifier=cls.boundary_integrity_verifier_mock,
            schema_validator=cls.schema_validator_mock
        )
        
        cls.visualization_integration_service = VisualizationIntegrationService(
            governance_state_visualizer=cls.governance_state_visualizer,
            trust_metrics_dashboard=cls.trust_metrics_dashboard,
            governance_health_reporter=cls.governance_health_reporter,
            schema_validator=cls.schema_validator_mock
        )
        
        cls.governance_visualization_api = GovernanceVisualizationAPI(
            integration_service=cls.visualization_integration_service,
            schema_validator=cls.schema_validator_mock
        )
        
        cls.governance_dashboard = GovernanceDashboard(
            api=cls.governance_visualization_api,
            schema_validator=cls.schema_validator_mock
        )
        
        cls.trust_metrics_visualizer = TrustMetricsVisualizer(
            api=cls.governance_visualization_api,
            schema_validator=cls.schema_validator_mock
        )
        
        cls.governance_health_reporter_ui = GovernanceHealthReporterUI(
            api=cls.governance_visualization_api,
            schema_validator=cls.schema_validator_mock
        )

    @classmethod
    def configure_mocks(cls):
        """Configure the mocks with realistic data."""
        # Configure governance_primitive_manager_mock
        cls.governance_primitive_manager_mock.get_current_state.return_value = {
            "components": [
                {
                    "id": "attestation_service",
                    "name": "Attestation Service",
                    "status": "active",
                    "health": 0.95,
                    "connections": ["claim_verification_protocol", "governance_audit_trail"]
                },
                {
                    "id": "claim_verification_protocol",
                    "name": "Claim Verification Protocol",
                    "status": "active",
                    "health": 0.92,
                    "connections": ["attestation_service"]
                },
                {
                    "id": "governance_audit_trail",
                    "name": "Governance Audit Trail",
                    "status": "active",
                    "health": 0.98,
                    "connections": ["attestation_service"]
                }
            ],
            "relationships": [
                {
                    "source": "attestation_service",
                    "target": "claim_verification_protocol",
                    "type": "depends_on",
                    "strength": 0.9
                },
                {
                    "source": "attestation_service",
                    "target": "governance_audit_trail",
                    "type": "logs_to",
                    "strength": 0.95
                }
            ]
        }
        
        cls.governance_primitive_manager_mock.get_current_health_report.return_value = {
            "overall_health": {
                "score": 0.94,
                "status": "healthy",
                "issues": {
                    "critical": 0,
                    "major": 1,
                    "minor": 3
                }
            },
            "components": {
                "attestation_service": {
                    "score": 0.95,
                    "status": "healthy",
                    "issues": {
                        "critical": 0,
                        "major": 0,
                        "minor": 1
                    },
                    "last_check": "2025-05-21T15:30:00Z"
                },
                "claim_verification_protocol": {
                    "score": 0.92,
                    "status": "warning",
                    "issues": {
                        "critical": 0,
                        "major": 1,
                        "minor": 0
                    },
                    "last_check": "2025-05-21T15:30:00Z"
                },
                "governance_audit_trail": {
                    "score": 0.98,
                    "status": "healthy",
                    "issues": {
                        "critical": 0,
                        "major": 0,
                        "minor": 2
                    },
                    "last_check": "2025-05-21T15:30:00Z"
                }
            }
        }
        
        cls.governance_primitive_manager_mock.get_issue_report.return_value = {
            "summary": {
                "total_count": 4,
                "critical_count": 0,
                "major_count": 1,
                "minor_count": 3
            },
            "component_issues": [
                {
                    "component": "attestation_service",
                    "total_count": 1,
                    "critical_count": 0,
                    "major_count": 0,
                    "minor_count": 1
                },
                {
                    "component": "claim_verification_protocol",
                    "total_count": 1,
                    "critical_count": 0,
                    "major_count": 1,
                    "minor_count": 0
                },
                {
                    "component": "governance_audit_trail",
                    "total_count": 2,
                    "critical_count": 0,
                    "major_count": 0,
                    "minor_count": 2
                }
            ],
            "issues": [
                {
                    "id": "issue-001",
                    "severity": "minor",
                    "component": "attestation_service",
                    "description": "Attestation refresh rate below optimal threshold",
                    "detected_at": "2025-05-21T14:30:00Z",
                    "status": "open"
                },
                {
                    "id": "issue-002",
                    "severity": "major",
                    "component": "claim_verification_protocol",
                    "description": "Increased latency in claim verification process",
                    "detected_at": "2025-05-21T13:45:00Z",
                    "status": "in_progress"
                }
            ]
        }
        
        # Configure trust_decay_engine_mock
        cls.trust_decay_engine_mock.get_current_metrics.return_value = {
            "metrics": [
                {
                    "id": "attestation_coverage",
                    "name": "Attestation Coverage",
                    "value": 0.87,
                    "trend": "increasing",
                    "category": "attestation"
                },
                {
                    "id": "trust_decay_rate",
                    "name": "Trust Decay Rate",
                    "value": 0.02,
                    "trend": "stable",
                    "category": "decay"
                }
            ],
            "time_series": [
                {
                    "metric_id": "attestation_coverage",
                    "data": [
                        {"timestamp": "2025-05-15T00:00:00Z", "value": 0.85},
                        {"timestamp": "2025-05-16T00:00:00Z", "value": 0.85},
                        {"timestamp": "2025-05-17T00:00:00Z", "value": 0.86},
                        {"timestamp": "2025-05-18T00:00:00Z", "value": 0.86},
                        {"timestamp": "2025-05-19T00:00:00Z", "value": 0.86},
                        {"timestamp": "2025-05-20T00:00:00Z", "value": 0.87},
                        {"timestamp": "2025-05-21T00:00:00Z", "value": 0.87}
                    ]
                },
                {
                    "metric_id": "trust_decay_rate",
                    "data": [
                        {"timestamp": "2025-05-15T00:00:00Z", "value": 0.02},
                        {"timestamp": "2025-05-16T00:00:00Z", "value": 0.02},
                        {"timestamp": "2025-05-17T00:00:00Z", "value": 0.02},
                        {"timestamp": "2025-05-18T00:00:00Z", "value": 0.02},
                        {"timestamp": "2025-05-19T00:00:00Z", "value": 0.02},
                        {"timestamp": "2025-05-20T00:00:00Z", "value": 0.02},
                        {"timestamp": "2025-05-21T00:00:00Z", "value": 0.02}
                    ]
                }
            ],
            "aggregates": {
                "overall_trust": 0.91,
                "trust_trend": "stable",
                "category_averages": {
                    "attestation": 0.87,
                    "decay": 0.02
                }
            }
        }
        
        # Configure attestation_service_mock
        cls.attestation_service_mock.get_attestation_metrics.return_value = {
            "attestation_count": 1250,
            "valid_attestations": 1200,
            "expired_attestations": 25,
            "revoked_attestations": 25,
            "attestation_coverage": 0.87,
            "attestation_freshness": 0.95,
            "attestation_validity": 0.96,
            "components_with_attestations": 11,
            "total_components": 12
        }
        
        # Configure boundary_detection_engine_mock
        cls.boundary_detection_engine_mock.get_boundary_metrics.return_value = {
            "boundary_count": 8,
            "active_boundaries": 8,
            "boundary_crossings_per_minute": 120,
            "average_crossing_latency": 0.05,
            "boundary_integrity": 0.96,
            "unauthorized_crossing_attempts": 2,
            "boundary_health": 0.94
        }
        
        # Configure boundary_integrity_verifier_mock
        cls.boundary_integrity_verifier_mock.get_integrity_metrics.return_value = {
            "integrity_score": 0.96,
            "verification_count": 500,
            "failed_verifications": 5,
            "last_verification": "2025-05-21T15:15:00Z"
        }

    def test_code_coverage(self):
        """Test that code coverage meets the required threshold."""
        # Define the modules to measure coverage for
        modules_to_cover = [
            VisualizationDataTransformer,
            GovernanceStateVisualizer,
            TrustMetricsDashboard,
            GovernanceHealthReporter,
            GovernanceVisualizationAPI,
            VisualizationIntegrationService,
            GovernanceDashboard,
            TrustMetricsVisualizer,
            GovernanceHealthReporterUI
        ]
        
        # Initialize coverage measurement
        cov = coverage.Coverage()
        cov.start()
        
        # Execute all methods to measure coverage
        self.execute_all_methods()
        
        # Stop coverage measurement
        cov.stop()
        
        # Get coverage data
        coverage_data = cov.get_data()
        
        # Calculate coverage percentage for each module
        total_statements = 0
        covered_statements = 0
        
        for module in modules_to_cover:
            module_file = module.__module__
            if module_file in coverage_data.measured_files():
                file_coverage = coverage_data.get_file_coverage(module_file)
                total_statements += len(file_coverage)
                covered_statements += sum(1 for covered in file_coverage.values() if covered)
        
        # Calculate overall coverage percentage
        if total_statements > 0:
            coverage_percentage = (covered_statements / total_statements) * 100
        else:
            coverage_percentage = 0
        
        # Print coverage information
        print(f"Code coverage: {coverage_percentage:.2f}% ({covered_statements}/{total_statements} statements)")
        
        # Verify coverage meets the required threshold (85%)
        self.assertGreaterEqual(coverage_percentage, 85.0, "Code coverage is below the required threshold of 85%")

    def execute_all_methods(self):
        """Execute all methods to measure coverage."""
        # Execute methods on VisualizationDataTransformer
        self.data_transformer.transform_governance_state_for_visualization()
        self.data_transformer.transform_trust_metrics_for_visualization()
        self.data_transformer.transform_health_report_for_visualization()
        
        # Execute methods on GovernanceStateVisualizer
        self.governance_state_visualizer.get_governance_state_visualization()
        self.governance_state_visualizer.get_component_relationships()
        self.governance_state_visualizer.get_component_details("attestation_service")
        self.governance_state_visualizer.get_boundary_metrics()
        
        # Execute methods on TrustMetricsDashboard
        self.trust_metrics_dashboard.get_trust_metrics_dashboard()
        self.trust_metrics_dashboard.get_metric_details("attestation_coverage")
        self.trust_metrics_dashboard.get_attestation_trust_metrics()
        self.trust_metrics_dashboard.get_trust_decay_metrics()
        self.trust_metrics_dashboard.generate_trust_metrics_report({"format": "json"})
        
        # Execute methods on GovernanceHealthReporter
        self.governance_health_reporter.get_health_report()
        self.governance_health_reporter.get_issue_report()
        self.governance_health_reporter.get_component_health("attestation_service")
        self.governance_health_reporter.get_boundary_integrity_metrics()
        self.governance_health_reporter.generate_health_report({"format": "json"})
        
        # Execute methods on VisualizationIntegrationService
        self.visualization_integration_service.get_dashboard_data()
        self.visualization_integration_service.get_governance_state()
        self.visualization_integration_service.get_trust_metrics()
        self.visualization_integration_service.get_health_report()
        
        # Execute methods on GovernanceVisualizationAPI
        self.governance_visualization_api.get_dashboard_data()
        self.governance_visualization_api.get_governance_state()
        self.governance_visualization_api.get_trust_metrics()
        self.governance_visualization_api.get_health_report()
        self.governance_visualization_api.get_component_details("attestation_service")
        self.governance_visualization_api.get_metric_details("attestation_coverage")
        self.governance_visualization_api.get_issue_report()
        
        # Execute methods on UI components
        self.governance_dashboard.get_dashboard_data()
        self.governance_dashboard.get_component_details("attestation_service")
        self.governance_dashboard.render_dashboard()
        
        self.trust_metrics_visualizer.get_visualization_data()
        self.trust_metrics_visualizer.get_metric_details("attestation_coverage")
        self.trust_metrics_visualizer.render_visualization()
        
        self.governance_health_reporter_ui.get_visualization_data()
        self.governance_health_reporter_ui.get_issue_report()
        self.governance_health_reporter_ui.render_visualization()

    def test_performance_data_transformer(self):
        """Test the performance of the VisualizationDataTransformer."""
        # Define the performance threshold in seconds
        threshold = 0.1
        
        # Measure the performance of transform_governance_state_for_visualization
        start_time = time.time()
        self.data_transformer.transform_governance_state_for_visualization()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"VisualizationDataTransformer.transform_governance_state_for_visualization: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")
        
        # Measure the performance of transform_trust_metrics_for_visualization
        start_time = time.time()
        self.data_transformer.transform_trust_metrics_for_visualization()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"VisualizationDataTransformer.transform_trust_metrics_for_visualization: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")
        
        # Measure the performance of transform_health_report_for_visualization
        start_time = time.time()
        self.data_transformer.transform_health_report_for_visualization()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"VisualizationDataTransformer.transform_health_report_for_visualization: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")

    def test_performance_governance_state_visualizer(self):
        """Test the performance of the GovernanceStateVisualizer."""
        # Define the performance threshold in seconds
        threshold = 0.2
        
        # Measure the performance of get_governance_state_visualization
        start_time = time.time()
        self.governance_state_visualizer.get_governance_state_visualization()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"GovernanceStateVisualizer.get_governance_state_visualization: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")

    def test_performance_trust_metrics_dashboard(self):
        """Test the performance of the TrustMetricsDashboard."""
        # Define the performance threshold in seconds
        threshold = 0.2
        
        # Measure the performance of get_trust_metrics_dashboard
        start_time = time.time()
        self.trust_metrics_dashboard.get_trust_metrics_dashboard()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"TrustMetricsDashboard.get_trust_metrics_dashboard: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")

    def test_performance_governance_health_reporter(self):
        """Test the performance of the GovernanceHealthReporter."""
        # Define the performance threshold in seconds
        threshold = 0.2
        
        # Measure the performance of get_health_report
        start_time = time.time()
        self.governance_health_reporter.get_health_report()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"GovernanceHealthReporter.get_health_report: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")

    def test_performance_visualization_integration_service(self):
        """Test the performance of the VisualizationIntegrationService."""
        # Define the performance threshold in seconds
        threshold = 0.5
        
        # Measure the performance of get_dashboard_data
        start_time = time.time()
        self.visualization_integration_service.get_dashboard_data()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"VisualizationIntegrationService.get_dashboard_data: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")

    def test_performance_governance_visualization_api(self):
        """Test the performance of the GovernanceVisualizationAPI."""
        # Define the performance threshold in seconds
        threshold = 0.5
        
        # Measure the performance of get_dashboard_data
        start_time = time.time()
        self.governance_visualization_api.get_dashboard_data()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"GovernanceVisualizationAPI.get_dashboard_data: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")

    def test_performance_ui_components(self):
        """Test the performance of the UI components."""
        # Define the performance threshold in seconds
        threshold = 0.5
        
        # Measure the performance of GovernanceDashboard.get_dashboard_data
        start_time = time.time()
        self.governance_dashboard.get_dashboard_data()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"GovernanceDashboard.get_dashboard_data: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")
        
        # Measure the performance of TrustMetricsVisualizer.get_visualization_data
        start_time = time.time()
        self.trust_metrics_visualizer.get_visualization_data()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"TrustMetricsVisualizer.get_visualization_data: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")
        
        # Measure the performance of GovernanceHealthReporterUI.get_visualization_data
        start_time = time.time()
        self.governance_health_reporter_ui.get_visualization_data()
        end_time = time.time()
        
        # Calculate the execution time
        execution_time = end_time - start_time
        
        # Print performance information
        print(f"GovernanceHealthReporterUI.get_visualization_data: {execution_time:.6f} seconds")
        
        # Verify performance meets the required threshold
        self.assertLess(execution_time, threshold, f"Performance is below the required threshold of {threshold} seconds")

    def test_performance_profiling(self):
        """Test the performance profiling of the Governance Visualization framework."""
        # Create a profiler
        pr = cProfile.Profile()
        
        # Start profiling
        pr.enable()
        
        # Execute the dashboard data retrieval
        self.governance_dashboard.get_dashboard_data(force_refresh=True)
        
        # Stop profiling
        pr.disable()
        
        # Create a string buffer to capture the profiling output
        s = io.StringIO()
        
        # Sort the profiling results by cumulative time
        ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
        
        # Print the top 10 functions by cumulative time
        ps.print_stats(10)
        
        # Print the profiling output
        print(s.getvalue())
        
        # Verify that the profiling output contains the expected functions
        self.assertIn('get_dashboard_data', s.getvalue())
        
        # Verify that the total time is within the expected range
        # This is a more flexible check since the exact time will vary
        self.assertLess(ps.total_tt, 1.0, "Total profiling time is above the expected range")

    def test_memory_usage(self):
        """Test the memory usage of the Governance Visualization framework."""
        # This is a simplified memory usage test
        # In a real environment, we would use tools like memory_profiler
        
        # Import the resource module if available (Unix-like systems)
        try:
            import resource
            
            # Get the memory usage before
            mem_before = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
            
            # Execute the dashboard data retrieval
            self.governance_dashboard.get_dashboard_data(force_refresh=True)
            
            # Get the memory usage after
            mem_after = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
            
            # Calculate the memory usage difference in KB
            mem_diff = mem_after - mem_before
            
            # Print memory usage information
            print(f"Memory usage: {mem_diff} KB")
            
            # Verify memory usage is within the expected range
            # This is a more flexible check since the exact memory usage will vary
            self.assertLess(mem_diff, 10000, "Memory usage is above the expected range")
        except ImportError:
            # Skip the test on systems where resource module is not available
            self.skipTest("Resource module not available")

    def test_scalability(self):
        """Test the scalability of the Governance Visualization framework."""
        # Define the number of components to test with
        component_counts = [10, 50, 100]
        
        # Define the performance threshold in seconds for each component count
        thresholds = {
            10: 0.5,
            50: 1.0,
            100: 2.0
        }
        
        for count in component_counts:
            # Generate a large governance state with the specified number of components
            large_state = self.generate_large_governance_state(count)
            
            # Configure the mock to return the large state
            self.governance_primitive_manager_mock.get_current_state.return_value = large_state
            
            # Measure the performance of get_governance_state_visualization
            start_time = time.time()
            self.governance_state_visualizer.get_governance_state_visualization()
            end_time = time.time()
            
            # Calculate the execution time
            execution_time = end_time - start_time
            
            # Print performance information
            print(f"GovernanceStateVisualizer.get_governance_state_visualization with {count} components: {execution_time:.6f} seconds")
            
            # Verify performance meets the required threshold for this component count
            self.assertLess(execution_time, thresholds[count], f"Performance with {count} components is below the required threshold of {thresholds[count]} seconds")

    def generate_large_governance_state(self, component_count):
        """Generate a large governance state with the specified number of components."""
        components = []
        relationships = []
        
        # Generate components
        for i in range(component_count):
            component_id = f"component_{i}"
            component = {
                "id": component_id,
                "name": f"Component {i}",
                "status": "active",
                "health": 0.9 + (i % 10) / 100,  # Vary health between 0.9 and 0.99
                "connections": []
            }
            components.append(component)
        
        # Generate relationships (each component connects to up to 3 others)
        for i in range(component_count):
            source_id = f"component_{i}"
            
            # Connect to up to 3 other components
            for j in range(1, 4):
                target_index = (i + j) % component_count
                target_id = f"component_{target_index}"
                
                # Add the connection to the source component
                components[i]["connections"].append(target_id)
                
                # Add the relationship
                relationship = {
                    "source": source_id,
                    "target": target_id,
                    "type": "depends_on",
                    "strength": 0.8 + (i % 20) / 100  # Vary strength between 0.8 and 0.99
                }
                relationships.append(relationship)
        
        # Return the large governance state
        return {
            "components": components,
            "relationships": relationships
        }


if __name__ == '__main__':
    unittest.main()
