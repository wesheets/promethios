"""
Integration tests for the Governance Visualization framework.

This test suite validates the integration between different components of the
Governance Visualization framework, ensuring they work together correctly.
"""

import unittest
from unittest.mock import MagicMock, patch
import json
import os
import sys
from datetime import datetime, timedelta

# Add the src directory to the path so we can import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer
from src.core.visualization.governance_state_visualizer import GovernanceStateVisualizer
from src.core.visualization.trust_metrics_dashboard import TrustMetricsDashboard
from src.core.visualization.governance_health_reporter import GovernanceHealthReporter
from src.integration.governance_visualization_api import GovernanceVisualizationAPI
from src.integration.visualization_integration_service import VisualizationIntegrationService


class TestGovernanceVisualizationIntegration(unittest.TestCase):
    """Integration tests for the Governance Visualization framework."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Create mocks for external dependencies
        self.governance_primitive_manager_mock = MagicMock()
        self.trust_decay_engine_mock = MagicMock()
        self.attestation_service_mock = MagicMock()
        self.boundary_detection_engine_mock = MagicMock()
        self.boundary_integrity_verifier_mock = MagicMock()
        self.schema_validator_mock = MagicMock()
        self.schema_validator_mock.validate.return_value = True
        
        # Create real instances of the visualization components
        self.data_transformer = VisualizationDataTransformer(
            schema_validator=self.schema_validator_mock,
            governance_state_provider=self.governance_primitive_manager_mock,
            trust_metrics_provider=self.trust_decay_engine_mock,
            health_data_provider=self.governance_primitive_manager_mock
        )
        
        self.governance_state_visualizer = GovernanceStateVisualizer(
            data_transformer=self.data_transformer,
            governance_primitive_manager=self.governance_primitive_manager_mock,
            attestation_service=self.attestation_service_mock,
            boundary_detection_engine=self.boundary_detection_engine_mock,
            schema_validator=self.schema_validator_mock
        )
        
        self.trust_metrics_dashboard = TrustMetricsDashboard(
            data_transformer=self.data_transformer,
            trust_decay_engine=self.trust_decay_engine_mock,
            attestation_service=self.attestation_service_mock,
            schema_validator=self.schema_validator_mock
        )
        
        self.governance_health_reporter = GovernanceHealthReporter(
            data_transformer=self.data_transformer,
            governance_primitive_manager=self.governance_primitive_manager_mock,
            attestation_service=self.attestation_service_mock,
            boundary_integrity_verifier=self.boundary_integrity_verifier_mock,
            schema_validator=self.schema_validator_mock
        )
        
        # Create the integration service
        self.visualization_integration_service = VisualizationIntegrationService(
            governance_state_visualizer=self.governance_state_visualizer,
            trust_metrics_dashboard=self.trust_metrics_dashboard,
            governance_health_reporter=self.governance_health_reporter,
            schema_validator=self.schema_validator_mock
        )
        
        # Create the API
        self.governance_visualization_api = GovernanceVisualizationAPI(
            integration_service=self.visualization_integration_service,
            schema_validator=self.schema_validator_mock
        )
        
        # Sample governance state data
        self.sample_governance_state = {
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
        
        # Sample trust metrics data
        self.sample_trust_metrics = {
            "metrics": [
                {
                    "id": "attestation_coverage",
                    "name": "Attestation Coverage",
                    "value": 0.87,
                    "trend": "increasing",
                    "history": [
                        {"timestamp": "2025-05-20T10:00:00Z", "value": 0.85},
                        {"timestamp": "2025-05-20T11:00:00Z", "value": 0.86},
                        {"timestamp": "2025-05-20T12:00:00Z", "value": 0.87}
                    ]
                },
                {
                    "id": "trust_decay_rate",
                    "name": "Trust Decay Rate",
                    "value": 0.02,
                    "trend": "stable",
                    "history": [
                        {"timestamp": "2025-05-20T10:00:00Z", "value": 0.02},
                        {"timestamp": "2025-05-20T11:00:00Z", "value": 0.02},
                        {"timestamp": "2025-05-20T12:00:00Z", "value": 0.02}
                    ]
                }
            ],
            "aggregates": {
                "overall_trust": 0.91,
                "trust_trend": "stable"
            }
        }
        
        # Sample health report data
        self.sample_health_report = {
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
        
        # Configure the mocks to return the sample data
        self.governance_primitive_manager_mock.get_current_state.return_value = self.sample_governance_state
        self.trust_decay_engine_mock.get_current_metrics.return_value = self.sample_trust_metrics
        self.governance_primitive_manager_mock.get_current_health_report.return_value = self.sample_health_report

    def test_data_flow_from_transformer_to_visualizer(self):
        """Test data flow from transformer to governance state visualizer."""
        # Call the visualizer to get governance state visualization
        result = self.governance_state_visualizer.get_governance_state_visualization()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('nodes', result)
        self.assertIn('edges', result)
        
        # Verify the data transformer was called
        self.governance_primitive_manager_mock.get_current_state.assert_called()

    def test_data_flow_from_transformer_to_dashboard(self):
        """Test data flow from transformer to trust metrics dashboard."""
        # Call the dashboard to get trust metrics
        result = self.trust_metrics_dashboard.get_trust_metrics_dashboard()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('metrics', result)
        self.assertIn('time_series', result)
        self.assertIn('aggregates', result)
        
        # Verify the data transformer was called
        self.trust_decay_engine_mock.get_current_metrics.assert_called()

    def test_data_flow_from_transformer_to_reporter(self):
        """Test data flow from transformer to governance health reporter."""
        # Call the reporter to get health report
        result = self.governance_health_reporter.get_health_report()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('overall_health', result)
        self.assertIn('components', result)
        
        # Verify the data transformer was called
        self.governance_primitive_manager_mock.get_current_health_report.assert_called()

    def test_integration_service_dashboard_data(self):
        """Test integration service provides dashboard data correctly."""
        # Call the integration service to get dashboard data
        result = self.visualization_integration_service.get_dashboard_data()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('governance_state', result)
        self.assertIn('trust_metrics', result)
        self.assertIn('health_report', result)
        
        # Verify the components were called
        self.governance_primitive_manager_mock.get_current_state.assert_called()
        self.trust_decay_engine_mock.get_current_metrics.assert_called()
        self.governance_primitive_manager_mock.get_current_health_report.assert_called()

    def test_api_get_governance_state(self):
        """Test API provides governance state visualization correctly."""
        # Call the API to get governance state
        result = self.governance_visualization_api.get_governance_state()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('nodes', result)
        self.assertIn('edges', result)
        
        # Verify the integration service was used
        self.governance_primitive_manager_mock.get_current_state.assert_called()

    def test_api_get_trust_metrics(self):
        """Test API provides trust metrics correctly."""
        # Call the API to get trust metrics
        result = self.governance_visualization_api.get_trust_metrics()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('metrics', result)
        self.assertIn('time_series', result)
        self.assertIn('aggregates', result)
        
        # Verify the integration service was used
        self.trust_decay_engine_mock.get_current_metrics.assert_called()

    def test_api_get_health_report(self):
        """Test API provides health report correctly."""
        # Call the API to get health report
        result = self.governance_visualization_api.get_health_report()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('overall_health', result)
        self.assertIn('components', result)
        
        # Verify the integration service was used
        self.governance_primitive_manager_mock.get_current_health_report.assert_called()

    def test_api_get_dashboard_data(self):
        """Test API provides complete dashboard data correctly."""
        # Call the API to get dashboard data
        result = self.governance_visualization_api.get_dashboard_data()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('governance_state', result)
        self.assertIn('trust_metrics', result)
        self.assertIn('health_report', result)
        
        # Verify the integration service was used
        self.governance_primitive_manager_mock.get_current_state.assert_called()
        self.trust_decay_engine_mock.get_current_metrics.assert_called()
        self.governance_primitive_manager_mock.get_current_health_report.assert_called()

    def test_api_get_component_details(self):
        """Test API provides component details correctly."""
        # Sample component details
        component_id = "attestation_service"
        component_details = {
            "id": component_id,
            "name": "Attestation Service",
            "description": "Service for managing attestations and claims",
            "status": "active",
            "health": 0.95,
            "metrics": {
                "attestation_count": 1250,
                "claim_verification_rate": 0.98,
                "average_response_time": 0.15
            },
            "dependencies": ["claim_verification_protocol", "governance_audit_trail"],
            "last_updated": "2025-05-21T15:00:00Z"
        }
        
        # Configure the mock to return the sample component details
        self.governance_primitive_manager_mock.get_component_details.return_value = component_details
        
        # Call the API to get component details
        result = self.governance_visualization_api.get_component_details(component_id)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(result['id'], component_id)
        self.assertIn('name', result)
        self.assertIn('description', result)
        self.assertIn('status', result)
        self.assertIn('health', result)
        self.assertIn('metrics', result)
        self.assertIn('dependencies', result)
        self.assertIn('last_updated', result)
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager_mock.get_component_details.assert_called_with(component_id)

    def test_api_get_metric_details(self):
        """Test API provides metric details correctly."""
        # Sample metric details
        metric_id = "attestation_coverage"
        metric_details = {
            "id": metric_id,
            "name": "Attestation Coverage",
            "description": "Percentage of components covered by valid attestations",
            "value": 0.87,
            "trend": "increasing",
            "category": "attestation",
            "history": [
                {"timestamp": "2025-05-15T00:00:00Z", "value": 0.85},
                {"timestamp": "2025-05-16T00:00:00Z", "value": 0.85},
                {"timestamp": "2025-05-17T00:00:00Z", "value": 0.86},
                {"timestamp": "2025-05-18T00:00:00Z", "value": 0.86},
                {"timestamp": "2025-05-19T00:00:00Z", "value": 0.86},
                {"timestamp": "2025-05-20T00:00:00Z", "value": 0.87},
                {"timestamp": "2025-05-21T00:00:00Z", "value": 0.87}
            ],
            "components": [
                {"id": "attestation_service", "coverage": 0.95},
                {"id": "claim_verification_protocol", "coverage": 0.90},
                {"id": "governance_audit_trail", "coverage": 0.85}
            ],
            "thresholds": {
                "warning": 0.75,
                "critical": 0.60
            },
            "last_updated": "2025-05-21T15:30:00Z"
        }
        
        # Configure the mock to return the sample metric details
        self.trust_decay_engine_mock.get_metric_details.return_value = metric_details
        
        # Call the API to get metric details
        result = self.governance_visualization_api.get_metric_details(metric_id)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(result['id'], metric_id)
        self.assertIn('name', result)
        self.assertIn('description', result)
        self.assertIn('value', result)
        self.assertIn('trend', result)
        self.assertIn('category', result)
        self.assertIn('history', result)
        self.assertIn('components', result)
        self.assertIn('thresholds', result)
        self.assertIn('last_updated', result)
        
        # Verify the trust decay engine was called
        self.trust_decay_engine_mock.get_metric_details.assert_called_with(metric_id)

    def test_api_get_issue_report(self):
        """Test API provides issue report correctly."""
        # Sample issue report
        issue_report = {
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
        
        # Configure the mock to return the sample issue report
        self.governance_primitive_manager_mock.get_issue_report.return_value = issue_report
        
        # Call the API to get issue report
        result = self.governance_visualization_api.get_issue_report()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('summary', result)
        self.assertIn('component_issues', result)
        self.assertIn('issues', result)
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager_mock.get_issue_report.assert_called()

    def test_integration_service_caching(self):
        """Test integration service caching functionality."""
        # Call the integration service to get dashboard data multiple times
        result1 = self.visualization_integration_service.get_dashboard_data()
        result2 = self.visualization_integration_service.get_dashboard_data()
        
        # Verify the results are the same
        self.assertEqual(result1, result2)
        
        # Verify the underlying components were only called once each
        self.governance_primitive_manager_mock.get_current_state.assert_called_once()
        self.trust_decay_engine_mock.get_current_metrics.assert_called_once()
        self.governance_primitive_manager_mock.get_current_health_report.assert_called_once()
        
        # Force refresh the cache
        result3 = self.visualization_integration_service.get_dashboard_data(force_refresh=True)
        
        # Verify the underlying components were called again
        self.assertEqual(self.governance_primitive_manager_mock.get_current_state.call_count, 2)
        self.assertEqual(self.trust_decay_engine_mock.get_current_metrics.call_count, 2)
        self.assertEqual(self.governance_primitive_manager_mock.get_current_health_report.call_count, 2)

    def test_api_error_handling(self):
        """Test API error handling."""
        # Configure the mock to raise an exception
        self.governance_primitive_manager_mock.get_current_state.side_effect = Exception("Test error")
        
        # Call the API and verify it handles the error gracefully
        with self.assertRaises(Exception) as context:
            self.governance_visualization_api.get_governance_state()
        
        # Verify the error message
        self.assertIn("Test error", str(context.exception))


if __name__ == '__main__':
    unittest.main()
