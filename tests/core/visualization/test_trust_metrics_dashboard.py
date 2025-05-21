"""
Unit tests for the Trust Metrics Dashboard module.

This test suite validates the functionality of the TrustMetricsDashboard class,
ensuring it correctly visualizes trust metrics and trends.
"""

import unittest
from unittest.mock import MagicMock, patch
import json
import os
import sys
from datetime import datetime, timedelta

# Add the src directory to the path so we can import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from src.core.visualization.trust_metrics_dashboard import TrustMetricsDashboard


class TestTrustMetricsDashboard(unittest.TestCase):
    """Test cases for the TrustMetricsDashboard class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Create a mock for the visualization data transformer
        self.data_transformer_mock = MagicMock()
        
        # Create a mock for the trust decay engine
        self.trust_decay_engine_mock = MagicMock()
        
        # Create a mock for the attestation service
        self.attestation_service_mock = MagicMock()
        
        # Create a mock for the schema validator
        self.schema_validator_mock = MagicMock()
        self.schema_validator_mock.validate.return_value = True
        
        # Create the dashboard with mocked dependencies
        self.dashboard = TrustMetricsDashboard(
            data_transformer=self.data_transformer_mock,
            trust_decay_engine=self.trust_decay_engine_mock,
            attestation_service=self.attestation_service_mock,
            schema_validator=self.schema_validator_mock
        )
        
        # Sample trust metrics data
        self.sample_trust_metrics = {
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
        self.data_transformer_mock.transform_trust_metrics_for_visualization.return_value = self.sample_trust_metrics

    def test_get_trust_metrics_dashboard(self):
        """Test getting trust metrics dashboard data."""
        # Call the method under test
        result = self.dashboard.get_trust_metrics_dashboard()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('metrics', result)
        self.assertIn('time_series', result)
        self.assertIn('aggregates', result)
        
        # Verify metrics
        self.assertEqual(len(result['metrics']), len(self.sample_trust_metrics['metrics']))
        for i, metric in enumerate(result['metrics']):
            self.assertIn('id', metric)
            self.assertIn('name', metric)
            self.assertIn('value', metric)
            self.assertIn('trend', metric)
            self.assertIn('category', metric)
        
        # Verify time series
        self.assertEqual(len(result['time_series']), len(self.sample_trust_metrics['time_series']))
        for i, series in enumerate(result['time_series']):
            self.assertIn('metric_id', series)
            self.assertIn('data', series)
            self.assertTrue(len(series['data']) > 0)
        
        # Verify aggregates
        self.assertIn('overall_trust', result['aggregates'])
        self.assertIn('trust_trend', result['aggregates'])
        self.assertIn('category_averages', result['aggregates'])
        
        # Verify the data transformer was called
        self.data_transformer_mock.transform_trust_metrics_for_visualization.assert_called_once()

    def test_get_trust_metrics_dashboard_with_options(self):
        """Test getting trust metrics dashboard data with custom options."""
        # Custom options
        options = {
            "time_range": "weekly",
            "categories": ["attestation", "verification"],
            "include_trends": True
        }
        
        # Call the method under test with custom options
        result = self.dashboard.get_trust_metrics_dashboard(options)
        
        # Verify the result
        self.assertIsNotNone(result)
        
        # Verify the data transformer was called with the options
        self.data_transformer_mock.transform_trust_metrics_for_visualization.assert_called_once_with(options)

    def test_get_metric_details(self):
        """Test getting details for a specific metric."""
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
        
        # Call the method under test
        result = self.dashboard.get_metric_details(metric_id)
        
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
        self.trust_decay_engine_mock.get_metric_details.assert_called_once_with(metric_id)

    def test_get_trust_metrics_history(self):
        """Test getting historical trust metrics data."""
        # Sample historical data parameters
        start_date = datetime.now() - timedelta(days=7)
        end_date = datetime.now()
        metrics = ["attestation_coverage", "trust_decay_rate"]
        interval = "daily"
        
        # Sample historical data
        historical_data = {
            "attestation_coverage": [
                {"timestamp": "2025-05-15T00:00:00Z", "value": 0.85},
                {"timestamp": "2025-05-16T00:00:00Z", "value": 0.85},
                {"timestamp": "2025-05-17T00:00:00Z", "value": 0.86},
                {"timestamp": "2025-05-18T00:00:00Z", "value": 0.86},
                {"timestamp": "2025-05-19T00:00:00Z", "value": 0.86},
                {"timestamp": "2025-05-20T00:00:00Z", "value": 0.87},
                {"timestamp": "2025-05-21T00:00:00Z", "value": 0.87}
            ],
            "trust_decay_rate": [
                {"timestamp": "2025-05-15T00:00:00Z", "value": 0.02},
                {"timestamp": "2025-05-16T00:00:00Z", "value": 0.02},
                {"timestamp": "2025-05-17T00:00:00Z", "value": 0.02},
                {"timestamp": "2025-05-18T00:00:00Z", "value": 0.02},
                {"timestamp": "2025-05-19T00:00:00Z", "value": 0.02},
                {"timestamp": "2025-05-20T00:00:00Z", "value": 0.02},
                {"timestamp": "2025-05-21T00:00:00Z", "value": 0.02}
            ]
        }
        
        # Configure the mock to return the sample historical data
        self.trust_decay_engine_mock.get_metrics_history.return_value = historical_data
        
        # Call the method under test
        result = self.dashboard.get_trust_metrics_history(start_date, end_date, metrics, interval)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(len(result), len(metrics))
        for metric_id in metrics:
            self.assertIn(metric_id, result)
            self.assertTrue(len(result[metric_id]) > 0)
        
        # Verify the trust decay engine was called
        self.trust_decay_engine_mock.get_metrics_history.assert_called_once_with(
            start_date, end_date, metrics, interval
        )

    def test_get_trust_metrics_by_component(self):
        """Test getting trust metrics data grouped by component."""
        # Sample component metrics data
        component_metrics = [
            {
                "component_id": "attestation_service",
                "component_name": "Attestation Service",
                "metrics": {
                    "attestation_coverage": 0.95,
                    "trust_decay_rate": 0.01,
                    "claim_verification_rate": 0.98
                }
            },
            {
                "component_id": "claim_verification_protocol",
                "component_name": "Claim Verification Protocol",
                "metrics": {
                    "attestation_coverage": 0.90,
                    "trust_decay_rate": 0.02,
                    "claim_verification_rate": 0.95
                }
            },
            {
                "component_id": "governance_audit_trail",
                "component_name": "Governance Audit Trail",
                "metrics": {
                    "attestation_coverage": 0.85,
                    "trust_decay_rate": 0.03,
                    "claim_verification_rate": 0.92
                }
            }
        ]
        
        # Configure the mock to return the sample component metrics data
        self.trust_decay_engine_mock.get_metrics_by_component.return_value = component_metrics
        
        # Call the method under test
        result = self.dashboard.get_trust_metrics_by_component()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(len(result), len(component_metrics))
        for i, component in enumerate(result):
            self.assertIn('component_id', component)
            self.assertIn('component_name', component)
            self.assertIn('metrics', component)
            self.assertTrue(len(component['metrics']) > 0)
        
        # Verify the trust decay engine was called
        self.trust_decay_engine_mock.get_metrics_by_component.assert_called_once()

    def test_get_attestation_trust_metrics(self):
        """Test getting attestation-specific trust metrics."""
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
        
        # Configure the mock to return the sample attestation metrics data
        self.attestation_service_mock.get_attestation_metrics.return_value = attestation_metrics
        
        # Call the method under test
        result = self.dashboard.get_attestation_trust_metrics()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('attestation_count', result)
        self.assertIn('valid_attestations', result)
        self.assertIn('expired_attestations', result)
        self.assertIn('revoked_attestations', result)
        self.assertIn('attestation_coverage', result)
        self.assertIn('attestation_freshness', result)
        self.assertIn('attestation_validity', result)
        self.assertIn('components_with_attestations', result)
        self.assertIn('total_components', result)
        
        # Verify the attestation service was called
        self.attestation_service_mock.get_attestation_metrics.assert_called_once()

    def test_get_trust_decay_metrics(self):
        """Test getting trust decay specific metrics."""
        # Sample trust decay metrics data
        trust_decay_metrics = {
            "average_decay_rate": 0.02,
            "max_decay_rate": 0.05,
            "min_decay_rate": 0.01,
            "components_with_high_decay": 1,
            "components_with_medium_decay": 3,
            "components_with_low_decay": 8,
            "decay_trend": "stable"
        }
        
        # Configure the mock to return the sample trust decay metrics data
        self.trust_decay_engine_mock.get_decay_metrics.return_value = trust_decay_metrics
        
        # Call the method under test
        result = self.dashboard.get_trust_decay_metrics()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('average_decay_rate', result)
        self.assertIn('max_decay_rate', result)
        self.assertIn('min_decay_rate', result)
        self.assertIn('components_with_high_decay', result)
        self.assertIn('components_with_medium_decay', result)
        self.assertIn('components_with_low_decay', result)
        self.assertIn('decay_trend', result)
        
        # Verify the trust decay engine was called
        self.trust_decay_engine_mock.get_decay_metrics.assert_called_once()

    def test_generate_trust_metrics_report(self):
        """Test generating a comprehensive trust metrics report."""
        # Sample report options
        options = {
            "include_component_breakdown": True,
            "include_historical_data": True,
            "time_range": "weekly",
            "format": "json"
        }
        
        # Call the method under test
        result = self.dashboard.generate_trust_metrics_report(options)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('timestamp', result)
        self.assertIn('overall_trust', result)
        self.assertIn('metrics', result)
        self.assertIn('components', result)
        self.assertIn('historical_data', result)
        
        # Verify the data transformer and other dependencies were called
        self.data_transformer_mock.transform_trust_metrics_for_visualization.assert_called()
        self.trust_decay_engine_mock.get_metrics_by_component.assert_called()
        if options.get('include_historical_data'):
            self.trust_decay_engine_mock.get_metrics_history.assert_called()

    def test_invalid_trust_metrics_data(self):
        """Test behavior when invalid trust metrics data is provided."""
        # Configure the mock to return invalid data
        self.data_transformer_mock.transform_trust_metrics_for_visualization.return_value = {"invalid": "data"}
        
        # Configure schema validator to reject the data
        self.schema_validator_mock.validate.return_value = False
        
        # Call the method under test and verify it raises an exception
        with self.assertRaises(ValueError):
            self.dashboard.get_trust_metrics_dashboard()


if __name__ == '__main__':
    unittest.main()
