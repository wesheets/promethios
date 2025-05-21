"""
Unit tests for the Visualization Data Transformer module.

This test suite validates the functionality of the VisualizationDataTransformer class,
ensuring it correctly transforms governance data into visualization-friendly formats.
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


class TestVisualizationDataTransformer(unittest.TestCase):
    """Test cases for the VisualizationDataTransformer class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Create a mock schema validator
        self.schema_validator_mock = MagicMock()
        self.schema_validator_mock.validate.return_value = True
        
        # Create a mock for the governance state provider
        self.governance_state_provider_mock = MagicMock()
        
        # Create a mock for the trust metrics provider
        self.trust_metrics_provider_mock = MagicMock()
        
        # Create a mock for the health data provider
        self.health_data_provider_mock = MagicMock()
        
        # Create the transformer with mocked dependencies
        self.transformer = VisualizationDataTransformer(
            schema_validator=self.schema_validator_mock,
            governance_state_provider=self.governance_state_provider_mock,
            trust_metrics_provider=self.trust_metrics_provider_mock,
            health_data_provider=self.health_data_provider_mock
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

    def test_transform_governance_state_for_visualization(self):
        """Test transforming governance state data for visualization."""
        # Configure the mock to return the sample data
        self.governance_state_provider_mock.get_current_state.return_value = self.sample_governance_state
        
        # Call the method under test
        result = self.transformer.transform_governance_state_for_visualization()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('nodes', result)
        self.assertIn('edges', result)
        
        # Verify nodes
        self.assertEqual(len(result['nodes']), len(self.sample_governance_state['components']))
        for node in result['nodes']:
            self.assertIn('id', node)
            self.assertIn('label', node)
            self.assertIn('status', node)
            self.assertIn('health', node)
        
        # Verify edges
        self.assertEqual(len(result['edges']), len(self.sample_governance_state['relationships']))
        for edge in result['edges']:
            self.assertIn('source', edge)
            self.assertIn('target', edge)
            self.assertIn('type', edge)
            self.assertIn('strength', edge)
        
        # Verify schema validation was called
        self.schema_validator_mock.validate.assert_called_once()

    def test_transform_trust_metrics_for_visualization(self):
        """Test transforming trust metrics data for visualization."""
        # Configure the mock to return the sample data
        self.trust_metrics_provider_mock.get_current_metrics.return_value = self.sample_trust_metrics
        
        # Call the method under test
        result = self.transformer.transform_trust_metrics_for_visualization()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('metrics', result)
        self.assertIn('time_series', result)
        self.assertIn('aggregates', result)
        
        # Verify metrics
        self.assertEqual(len(result['metrics']), len(self.sample_trust_metrics['metrics']))
        for metric in result['metrics']:
            self.assertIn('id', metric)
            self.assertIn('name', metric)
            self.assertIn('value', metric)
            self.assertIn('trend', metric)
        
        # Verify time series
        self.assertTrue(len(result['time_series']) > 0)
        for series in result['time_series']:
            self.assertIn('metric_id', series)
            self.assertIn('data', series)
            self.assertTrue(len(series['data']) > 0)
            for point in series['data']:
                self.assertIn('timestamp', point)
                self.assertIn('value', point)
        
        # Verify aggregates
        self.assertIn('overall_trust', result['aggregates'])
        self.assertIn('trust_trend', result['aggregates'])
        
        # Verify schema validation was called
        self.schema_validator_mock.validate.assert_called_once()

    def test_transform_health_report_for_visualization(self):
        """Test transforming health report data for visualization."""
        # Configure the mock to return the sample data
        self.health_data_provider_mock.get_current_health_report.return_value = self.sample_health_report
        
        # Call the method under test
        result = self.transformer.transform_health_report_for_visualization()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('overall', result)
        self.assertIn('components', result)
        self.assertIn('issues_summary', result)
        
        # Verify overall health
        self.assertIn('score', result['overall'])
        self.assertIn('status', result['overall'])
        self.assertIn('issues', result['overall'])
        
        # Verify components
        self.assertEqual(len(result['components']), len(self.sample_health_report['components']))
        for component_id, component_data in result['components'].items():
            self.assertIn('score', component_data)
            self.assertIn('status', component_data)
            self.assertIn('issues', component_data)
            self.assertIn('last_check', component_data)
        
        # Verify issues summary
        self.assertIn('critical', result['issues_summary'])
        self.assertIn('major', result['issues_summary'])
        self.assertIn('minor', result['issues_summary'])
        self.assertIn('total', result['issues_summary'])
        
        # Verify schema validation was called
        self.schema_validator_mock.validate.assert_called_once()

    def test_transform_time_series_data(self):
        """Test transforming time series data."""
        # Sample time series data
        time_series_data = [
            {"timestamp": "2025-05-20T10:00:00Z", "value": 0.85},
            {"timestamp": "2025-05-20T11:00:00Z", "value": 0.86},
            {"timestamp": "2025-05-20T12:00:00Z", "value": 0.87}
        ]
        
        # Call the method under test
        result = self.transformer._transform_time_series_data(time_series_data)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(len(result), len(time_series_data))
        for i, point in enumerate(result):
            self.assertIn('timestamp', point)
            self.assertIn('value', point)
            self.assertEqual(point['timestamp'], time_series_data[i]['timestamp'])
            self.assertEqual(point['value'], time_series_data[i]['value'])

    def test_transform_with_invalid_data(self):
        """Test behavior when invalid data is provided."""
        # Configure the mock to return invalid data
        invalid_data = {"invalid": "data"}
        self.governance_state_provider_mock.get_current_state.return_value = invalid_data
        
        # Configure schema validator to reject the data
        self.schema_validator_mock.validate.return_value = False
        
        # Call the method under test and verify it raises an exception
        with self.assertRaises(ValueError):
            self.transformer.transform_governance_state_for_visualization()

    def test_transform_with_empty_data(self):
        """Test behavior when empty data is provided."""
        # Configure the mock to return empty data
        empty_data = {}
        self.governance_state_provider_mock.get_current_state.return_value = empty_data
        
        # Call the method under test and verify it raises an exception
        with self.assertRaises(ValueError):
            self.transformer.transform_governance_state_for_visualization()

    def test_transform_with_missing_provider(self):
        """Test behavior when a provider is missing."""
        # Create a transformer with a missing provider
        transformer = VisualizationDataTransformer(
            schema_validator=self.schema_validator_mock,
            governance_state_provider=None,
            trust_metrics_provider=self.trust_metrics_provider_mock,
            health_data_provider=self.health_data_provider_mock
        )
        
        # Call the method under test and verify it raises an exception
        with self.assertRaises(ValueError):
            transformer.transform_governance_state_for_visualization()

    def test_transform_with_custom_options(self):
        """Test transforming data with custom options."""
        # Configure the mock to return the sample data
        self.governance_state_provider_mock.get_current_state.return_value = self.sample_governance_state
        
        # Custom options
        options = {
            "include_inactive": True,
            "min_health": 0.9,
            "max_components": 2
        }
        
        # Call the method under test with custom options
        result = self.transformer.transform_governance_state_for_visualization(options)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('nodes', result)
        self.assertIn('edges', result)
        
        # Verify options were applied (max_components should limit the number of nodes)
        self.assertLessEqual(len(result['nodes']), options['max_components'])
        
        # Verify schema validation was called
        self.schema_validator_mock.validate.assert_called_once()


if __name__ == '__main__':
    unittest.main()
