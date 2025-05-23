"""
End-to-end tests for the Governance Visualization framework.

This test suite validates the complete functionality of the Governance Visualization
framework, from data collection to visualization rendering, ensuring all components
work together correctly in a real-world scenario.
"""

import unittest
from unittest.mock import MagicMock, patch
import json
import os
import sys
from datetime import datetime, timedelta
import time

# Add the src directory to the path so we can import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer
from src.core.visualization.governance_state_visualizer import GovernanceStateVisualizer
from src.core.visualization.trust_metrics_dashboard import TrustMetricsDashboard
from src.core.visualization.governance_health_reporter import GovernanceHealthReporter
from src.integration.governance_visualization_api import GovernanceVisualizationAPI
from src.integration.visualization_integration_service import VisualizationIntegrationService
from src.ui.governance_dashboard.components.governance_dashboard import GovernanceDashboard
from src.ui.governance_dashboard.components.trust_metrics_visualizer import TrustMetricsVisualizer
from src.ui.governance_dashboard.components.governance_health_reporter_ui import GovernanceHealthReporterUI


class TestGovernanceVisualizationE2E(unittest.TestCase):
    """End-to-end tests for the Governance Visualization framework."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures once for all test methods in the class."""
        # Create real instances of all required components
        # This is a more comprehensive setup than the integration tests
        # as we're testing the entire flow from data sources to UI rendering
        
        # First, set up the core governance components that provide data
        cls.setup_core_governance_components()
        
        # Then, set up the visualization components
        cls.setup_visualization_components()
        
        # Finally, set up the UI components
        cls.setup_ui_components()

    @classmethod
    def setup_core_governance_components(cls):
        """Set up the core governance components that provide data."""
        # In a real E2E test, we would use actual instances
        # For this test, we'll use mocks with realistic data
        
        # Create mocks for external dependencies
        cls.governance_primitive_manager = MagicMock()
        cls.trust_decay_engine = MagicMock()
        cls.attestation_service = MagicMock()
        cls.boundary_detection_engine = MagicMock()
        cls.boundary_integrity_verifier = MagicMock()
        cls.schema_validator = MagicMock()
        cls.schema_validator.validate.return_value = True
        
        # Configure the mocks with realistic data
        cls.configure_governance_primitive_manager()
        cls.configure_trust_decay_engine()
        cls.configure_attestation_service()
        cls.configure_boundary_components()

    @classmethod
    def configure_governance_primitive_manager(cls):
        """Configure the governance primitive manager with realistic data."""
        # Sample governance state data
        governance_state = {
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
                },
                {
                    "id": "boundary_detection_engine",
                    "name": "Boundary Detection Engine",
                    "status": "active",
                    "health": 0.94,
                    "connections": ["boundary_integrity_verifier"]
                },
                {
                    "id": "boundary_integrity_verifier",
                    "name": "Boundary Integrity Verifier",
                    "status": "active",
                    "health": 0.96,
                    "connections": ["boundary_detection_engine"]
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
                },
                {
                    "source": "boundary_detection_engine",
                    "target": "boundary_integrity_verifier",
                    "type": "validates",
                    "strength": 0.92
                }
            ]
        }
        
        # Sample health report data
        health_report = {
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
                },
                "boundary_detection_engine": {
                    "score": 0.94,
                    "status": "healthy",
                    "issues": {
                        "critical": 0,
                        "major": 0,
                        "minor": 1
                    },
                    "last_check": "2025-05-21T15:30:00Z"
                },
                "boundary_integrity_verifier": {
                    "score": 0.96,
                    "status": "healthy",
                    "issues": {
                        "critical": 0,
                        "major": 0,
                        "minor": 0
                    },
                    "last_check": "2025-05-21T15:30:00Z"
                }
            }
        }
        
        # Sample issue report data
        issue_report = {
            "summary": {
                "total_count": 5,
                "critical_count": 0,
                "major_count": 1,
                "minor_count": 4
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
                },
                {
                    "component": "boundary_detection_engine",
                    "total_count": 1,
                    "critical_count": 0,
                    "major_count": 0,
                    "minor_count": 1
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
                },
                {
                    "id": "issue-003",
                    "severity": "minor",
                    "component": "governance_audit_trail",
                    "description": "Audit trail storage approaching capacity threshold",
                    "detected_at": "2025-05-21T12:15:00Z",
                    "status": "open"
                },
                {
                    "id": "issue-004",
                    "severity": "minor",
                    "component": "governance_audit_trail",
                    "description": "Audit trail indexing performance degradation",
                    "detected_at": "2025-05-21T11:30:00Z",
                    "status": "open"
                },
                {
                    "id": "issue-005",
                    "severity": "minor",
                    "component": "boundary_detection_engine",
                    "description": "Boundary detection scan frequency below recommended level",
                    "detected_at": "2025-05-21T10:45:00Z",
                    "status": "open"
                }
            ]
        }
        
        # Configure the mock to return the sample data
        cls.governance_primitive_manager.get_current_state.return_value = governance_state
        cls.governance_primitive_manager.get_current_health_report.return_value = health_report
        cls.governance_primitive_manager.get_issue_report.return_value = issue_report
        
        # Add component details for each component
        component_details = {}
        for component in governance_state["components"]:
            component_id = component["id"]
            component_details[component_id] = {
                "id": component_id,
                "name": component["name"],
                "description": f"Description for {component['name']}",
                "status": component["status"],
                "health": component["health"],
                "metrics": {
                    "response_time": 0.15,
                    "error_rate": 0.02,
                    "throughput": 1000
                },
                "dependencies": component["connections"],
                "last_updated": "2025-05-21T15:00:00Z"
            }
        
        # Configure the mock to return component details
        cls.governance_primitive_manager.get_component_details.side_effect = lambda component_id: component_details.get(component_id)

    @classmethod
    def configure_trust_decay_engine(cls):
        """Configure the trust decay engine with realistic data."""
        # Sample trust metrics data
        trust_metrics = {
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
                },
                {
                    "id": "claim_verification_rate",
                    "name": "Claim Verification Rate",
                    "value": 0.95,
                    "trend": "stable",
                    "category": "verification"
                },
                {
                    "id": "boundary_integrity",
                    "name": "Boundary Integrity",
                    "value": 0.91,
                    "trend": "decreasing",
                    "category": "boundary"
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
                },
                {
                    "metric_id": "claim_verification_rate",
                    "data": [
                        {"timestamp": "2025-05-15T00:00:00Z", "value": 0.95},
                        {"timestamp": "2025-05-16T00:00:00Z", "value": 0.95},
                        {"timestamp": "2025-05-17T00:00:00Z", "value": 0.95},
                        {"timestamp": "2025-05-18T00:00:00Z", "value": 0.95},
                        {"timestamp": "2025-05-19T00:00:00Z", "value": 0.95},
                        {"timestamp": "2025-05-20T00:00:00Z", "value": 0.95},
                        {"timestamp": "2025-05-21T00:00:00Z", "value": 0.95}
                    ]
                },
                {
                    "metric_id": "boundary_integrity",
                    "data": [
                        {"timestamp": "2025-05-15T00:00:00Z", "value": 0.93},
                        {"timestamp": "2025-05-16T00:00:00Z", "value": 0.93},
                        {"timestamp": "2025-05-17T00:00:00Z", "value": 0.92},
                        {"timestamp": "2025-05-18T00:00:00Z", "value": 0.92},
                        {"timestamp": "2025-05-19T00:00:00Z", "value": 0.92},
                        {"timestamp": "2025-05-20T00:00:00Z", "value": 0.91},
                        {"timestamp": "2025-05-21T00:00:00Z", "value": 0.91}
                    ]
                }
            ],
            "aggregates": {
                "overall_trust": 0.91,
                "trust_trend": "stable",
                "category_averages": {
                    "attestation": 0.87,
                    "decay": 0.02,
                    "verification": 0.95,
                    "boundary": 0.91
                }
            }
        }
        
        # Configure the mock to return the sample data
        cls.trust_decay_engine.get_current_metrics.return_value = trust_metrics
        
        # Add metric details for each metric
        metric_details = {}
        for metric in trust_metrics["metrics"]:
            metric_id = metric["id"]
            metric_details[metric_id] = {
                "id": metric_id,
                "name": metric["name"],
                "description": f"Description for {metric['name']}",
                "value": metric["value"],
                "trend": metric["trend"],
                "category": metric["category"],
                "history": next((ts["data"] for ts in trust_metrics["time_series"] if ts["metric_id"] == metric_id), []),
                "components": [
                    {"id": "attestation_service", "value": 0.95},
                    {"id": "claim_verification_protocol", "value": 0.90},
                    {"id": "governance_audit_trail", "value": 0.85}
                ],
                "thresholds": {
                    "warning": 0.75,
                    "critical": 0.60
                },
                "last_updated": "2025-05-21T15:30:00Z"
            }
        
        # Configure the mock to return metric details
        cls.trust_decay_engine.get_metric_details.side_effect = lambda metric_id: metric_details.get(metric_id)

    @classmethod
    def configure_attestation_service(cls):
        """Configure the attestation service with realistic data."""
        # Sample attestation metrics data
        attestation_metrics = {
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
        
        # Configure the mock to return the sample data
        cls.attestation_service.get_attestation_metrics.return_value = attestation_metrics

    @classmethod
    def configure_boundary_components(cls):
        """Configure the boundary components with realistic data."""
        # Sample boundary metrics data
        boundary_metrics = {
            "boundary_count": 8,
            "active_boundaries": 8,
            "boundary_crossings_per_minute": 120,
            "average_crossing_latency": 0.05,
            "boundary_integrity": 0.96,
            "unauthorized_crossing_attempts": 2,
            "boundary_health": 0.94
        }
        
        # Configure the mocks to return the sample data
        cls.boundary_detection_engine.get_boundary_metrics.return_value = boundary_metrics
        cls.boundary_integrity_verifier.get_integrity_metrics.return_value = {
            "integrity_score": 0.96,
            "verification_count": 500,
            "failed_verifications": 5,
            "last_verification": "2025-05-21T15:15:00Z"
        }

    @classmethod
    def setup_visualization_components(cls):
        """Set up the visualization components."""
        # Create the data transformer
        cls.data_transformer = VisualizationDataTransformer(
            schema_validator=cls.schema_validator,
            governance_state_provider=cls.governance_primitive_manager,
            trust_metrics_provider=cls.trust_decay_engine,
            health_data_provider=cls.governance_primitive_manager
        )
        
        # Create the governance state visualizer
        cls.governance_state_visualizer = GovernanceStateVisualizer(
            data_transformer=cls.data_transformer,
            governance_primitive_manager=cls.governance_primitive_manager,
            attestation_service=cls.attestation_service,
            boundary_detection_engine=cls.boundary_detection_engine,
            schema_validator=cls.schema_validator
        )
        
        # Create the trust metrics dashboard
        cls.trust_metrics_dashboard = TrustMetricsDashboard(
            data_transformer=cls.data_transformer,
            trust_decay_engine=cls.trust_decay_engine,
            attestation_service=cls.attestation_service,
            schema_validator=cls.schema_validator
        )
        
        # Create the governance health reporter
        cls.governance_health_reporter = GovernanceHealthReporter(
            data_transformer=cls.data_transformer,
            governance_primitive_manager=cls.governance_primitive_manager,
            attestation_service=cls.attestation_service,
            boundary_integrity_verifier=cls.boundary_integrity_verifier,
            schema_validator=cls.schema_validator
        )
        
        # Create the integration service
        cls.visualization_integration_service = VisualizationIntegrationService(
            governance_state_visualizer=cls.governance_state_visualizer,
            trust_metrics_dashboard=cls.trust_metrics_dashboard,
            governance_health_reporter=cls.governance_health_reporter,
            schema_validator=cls.schema_validator
        )
        
        # Create the API
        cls.governance_visualization_api = GovernanceVisualizationAPI(
            integration_service=cls.visualization_integration_service,
            schema_validator=cls.schema_validator
        )

    @classmethod
    def setup_ui_components(cls):
        """Set up the UI components."""
        # Create the UI components
        cls.governance_dashboard = GovernanceDashboard(
            api=cls.governance_visualization_api,
            schema_validator=cls.schema_validator
        )
        
        cls.trust_metrics_visualizer = TrustMetricsVisualizer(
            api=cls.governance_visualization_api,
            schema_validator=cls.schema_validator
        )
        
        cls.governance_health_reporter_ui = GovernanceHealthReporterUI(
            api=cls.governance_visualization_api,
            schema_validator=cls.schema_validator
        )

    def test_e2e_dashboard_data_flow(self):
        """Test the end-to-end data flow from data sources to dashboard."""
        # Get the dashboard data from the UI component
        dashboard_data = self.governance_dashboard.get_dashboard_data()
        
        # Verify the result
        self.assertIsNotNone(dashboard_data)
        self.assertIn('governance_state', dashboard_data)
        self.assertIn('trust_metrics', dashboard_data)
        self.assertIn('health_report', dashboard_data)
        
        # Verify governance state
        self.assertIn('nodes', dashboard_data['governance_state'])
        self.assertIn('edges', dashboard_data['governance_state'])
        self.assertEqual(len(dashboard_data['governance_state']['nodes']), 5)  # 5 components
        self.assertEqual(len(dashboard_data['governance_state']['edges']), 3)  # 3 relationships
        
        # Verify trust metrics
        self.assertIn('metrics', dashboard_data['trust_metrics'])
        self.assertIn('time_series', dashboard_data['trust_metrics'])
        self.assertIn('aggregates', dashboard_data['trust_metrics'])
        self.assertEqual(len(dashboard_data['trust_metrics']['metrics']), 4)  # 4 metrics
        
        # Verify health report
        self.assertIn('overall_health', dashboard_data['health_report'])
        self.assertIn('components', dashboard_data['health_report'])
        self.assertEqual(len(dashboard_data['health_report']['components']), 5)  # 5 components
        
        # Verify the data flow through all layers
        self.governance_primitive_manager.get_current_state.assert_called()
        self.trust_decay_engine.get_current_metrics.assert_called()
        self.governance_primitive_manager.get_current_health_report.assert_called()

    def test_e2e_trust_metrics_visualization(self):
        """Test the end-to-end flow for trust metrics visualization."""
        # Get the trust metrics visualization data from the UI component
        visualization_data = self.trust_metrics_visualizer.get_visualization_data()
        
        # Verify the result
        self.assertIsNotNone(visualization_data)
        self.assertIn('metrics', visualization_data)
        self.assertIn('charts', visualization_data)
        self.assertIn('trends', visualization_data)
        
        # Verify metrics
        self.assertEqual(len(visualization_data['metrics']), 4)  # 4 metrics
        for metric in visualization_data['metrics']:
            self.assertIn('id', metric)
            self.assertIn('name', metric)
            self.assertIn('value', metric)
            self.assertIn('trend', metric)
        
        # Verify charts
        self.assertIn('time_series', visualization_data['charts'])
        self.assertIn('component_breakdown', visualization_data['charts'])
        
        # Verify trends
        self.assertIn('overall_trend', visualization_data['trends'])
        self.assertIn('category_trends', visualization_data['trends'])
        
        # Verify the data flow through all layers
        self.trust_decay_engine.get_current_metrics.assert_called()

    def test_e2e_health_report_visualization(self):
        """Test the end-to-end flow for health report visualization."""
        # Get the health report visualization data from the UI component
        visualization_data = self.governance_health_reporter_ui.get_visualization_data()
        
        # Verify the result
        self.assertIsNotNone(visualization_data)
        self.assertIn('overall_health', visualization_data)
        self.assertIn('component_health', visualization_data)
        self.assertIn('issues', visualization_data)
        
        # Verify overall health
        self.assertIn('score', visualization_data['overall_health'])
        self.assertIn('status', visualization_data['overall_health'])
        self.assertIn('issues', visualization_data['overall_health'])
        
        # Verify component health
        self.assertEqual(len(visualization_data['component_health']), 5)  # 5 components
        for component_id, component_data in visualization_data['component_health'].items():
            self.assertIn('score', component_data)
            self.assertIn('status', component_data)
            self.assertIn('issues', component_data)
        
        # Verify issues
        self.assertIn('summary', visualization_data['issues'])
        self.assertIn('component_issues', visualization_data['issues'])
        self.assertIn('issue_list', visualization_data['issues'])
        
        # Verify the data flow through all layers
        self.governance_primitive_manager.get_current_health_report.assert_called()
        self.governance_primitive_manager.get_issue_report.assert_called()

    def test_e2e_component_details_flow(self):
        """Test the end-to-end flow for component details."""
        # Component ID to test
        component_id = "attestation_service"
        
        # Get the component details from the UI component
        component_details = self.governance_dashboard.get_component_details(component_id)
        
        # Verify the result
        self.assertIsNotNone(component_details)
        self.assertEqual(component_details['id'], component_id)
        self.assertIn('name', component_details)
        self.assertIn('description', component_details)
        self.assertIn('status', component_details)
        self.assertIn('health', component_details)
        self.assertIn('metrics', component_details)
        self.assertIn('dependencies', component_details)
        
        # Verify the data flow through all layers
        self.governance_primitive_manager.get_component_details.assert_called_with(component_id)

    def test_e2e_metric_details_flow(self):
        """Test the end-to-end flow for metric details."""
        # Metric ID to test
        metric_id = "attestation_coverage"
        
        # Get the metric details from the UI component
        metric_details = self.trust_metrics_visualizer.get_metric_details(metric_id)
        
        # Verify the result
        self.assertIsNotNone(metric_details)
        self.assertEqual(metric_details['id'], metric_id)
        self.assertIn('name', metric_details)
        self.assertIn('description', metric_details)
        self.assertIn('value', metric_details)
        self.assertIn('trend', metric_details)
        self.assertIn('history', metric_details)
        self.assertIn('components', metric_details)
        
        # Verify the data flow through all layers
        self.trust_decay_engine.get_metric_details.assert_called_with(metric_id)

    def test_e2e_issue_details_flow(self):
        """Test the end-to-end flow for issue details."""
        # Get the issue report from the UI component
        issue_report = self.governance_health_reporter_ui.get_issue_report()
        
        # Verify the result
        self.assertIsNotNone(issue_report)
        self.assertIn('summary', issue_report)
        self.assertIn('component_issues', issue_report)
        self.assertIn('issues', issue_report)
        
        # Verify summary
        self.assertIn('total_count', issue_report['summary'])
        self.assertIn('critical_count', issue_report['summary'])
        self.assertIn('major_count', issue_report['summary'])
        self.assertIn('minor_count', issue_report['summary'])
        
        # Verify issues
        self.assertTrue(len(issue_report['issues']) > 0)
        for issue in issue_report['issues']:
            self.assertIn('id', issue)
            self.assertIn('severity', issue)
            self.assertIn('component', issue)
            self.assertIn('description', issue)
            self.assertIn('status', issue)
        
        # Verify the data flow through all layers
        self.governance_primitive_manager.get_issue_report.assert_called()

    def test_e2e_dashboard_refresh(self):
        """Test the end-to-end flow for dashboard refresh."""
        # Get the dashboard data
        dashboard_data_1 = self.governance_dashboard.get_dashboard_data()
        
        # Reset the call counts
        self.governance_primitive_manager.get_current_state.reset_mock()
        self.trust_decay_engine.get_current_metrics.reset_mock()
        self.governance_primitive_manager.get_current_health_report.reset_mock()
        
        # Get the dashboard data again (should use cached data)
        dashboard_data_2 = self.governance_dashboard.get_dashboard_data()
        
        # Verify the data is the same
        self.assertEqual(dashboard_data_1, dashboard_data_2)
        
        # Verify the underlying components were not called again
        self.governance_primitive_manager.get_current_state.assert_not_called()
        self.trust_decay_engine.get_current_metrics.assert_not_called()
        self.governance_primitive_manager.get_current_health_report.assert_not_called()
        
        # Refresh the dashboard
        dashboard_data_3 = self.governance_dashboard.get_dashboard_data(force_refresh=True)
        
        # Verify the underlying components were called again
        self.governance_primitive_manager.get_current_state.assert_called()
        self.trust_decay_engine.get_current_metrics.assert_called()
        self.governance_primitive_manager.get_current_health_report.assert_called()

    def test_e2e_performance(self):
        """Test the end-to-end performance of the visualization framework."""
        # Measure the time to get the dashboard data
        start_time = time.time()
        self.governance_dashboard.get_dashboard_data(force_refresh=True)
        end_time = time.time()
        
        # Verify the performance is acceptable (less than 1 second)
        self.assertLess(end_time - start_time, 1.0)
        
        # Measure the time to get the trust metrics visualization
        start_time = time.time()
        self.trust_metrics_visualizer.get_visualization_data(force_refresh=True)
        end_time = time.time()
        
        # Verify the performance is acceptable (less than 1 second)
        self.assertLess(end_time - start_time, 1.0)
        
        # Measure the time to get the health report visualization
        start_time = time.time()
        self.governance_health_reporter_ui.get_visualization_data(force_refresh=True)
        end_time = time.time()
        
        # Verify the performance is acceptable (less than 1 second)
        self.assertLess(end_time - start_time, 1.0)

    def test_e2e_error_handling(self):
        """Test the end-to-end error handling of the visualization framework."""
        # Configure the mock to raise an exception
        self.governance_primitive_manager.get_current_state.side_effect = Exception("Test error")
        
        # Verify the UI component handles the error gracefully
        with self.assertRaises(Exception) as context:
            self.governance_dashboard.get_dashboard_data(force_refresh=True)
        
        # Verify the error message
        self.assertIn("Test error", str(context.exception))
        
        # Reset the mock
        self.governance_primitive_manager.get_current_state.side_effect = None
        self.governance_primitive_manager.get_current_state.return_value = self.governance_primitive_manager.get_current_state.return_value


if __name__ == '__main__':
    unittest.main()
