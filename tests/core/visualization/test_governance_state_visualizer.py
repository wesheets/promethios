"""
Unit tests for the Governance State Visualizer module.

This test suite validates the functionality of the GovernanceStateVisualizer class,
ensuring it correctly visualizes the current state of governance components and their relationships.
"""

import unittest
from unittest.mock import MagicMock, patch
import json
import os
import sys
from datetime import datetime, timedelta

# Add the src directory to the path so we can import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from src.core.visualization.governance_state_visualizer import GovernanceStateVisualizer


class TestGovernanceStateVisualizer(unittest.TestCase):
    """Test cases for the GovernanceStateVisualizer class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Create a mock for the visualization data transformer
        self.data_transformer_mock = MagicMock()
        
        # Create a mock for the governance primitive manager
        self.governance_primitive_manager_mock = MagicMock()
        
        # Create a mock for the attestation service
        self.attestation_service_mock = MagicMock()
        
        # Create a mock for the boundary detection engine
        self.boundary_detection_engine_mock = MagicMock()
        
        # Create a mock for the schema validator
        self.schema_validator_mock = MagicMock()
        self.schema_validator_mock.validate.return_value = True
        
        # Create the visualizer with mocked dependencies
        self.visualizer = GovernanceStateVisualizer(
            data_transformer=self.data_transformer_mock,
            governance_primitive_manager=self.governance_primitive_manager_mock,
            attestation_service=self.attestation_service_mock,
            boundary_detection_engine=self.boundary_detection_engine_mock,
            schema_validator=self.schema_validator_mock
        )
        
        # Sample visualization data
        self.sample_visualization_data = {
            "nodes": [
                {
                    "id": "attestation_service",
                    "label": "Attestation Service",
                    "status": "active",
                    "health": 0.95,
                    "type": "service",
                    "x": 100,
                    "y": 100
                },
                {
                    "id": "claim_verification_protocol",
                    "label": "Claim Verification Protocol",
                    "status": "active",
                    "health": 0.92,
                    "type": "protocol",
                    "x": 200,
                    "y": 100
                },
                {
                    "id": "governance_audit_trail",
                    "label": "Governance Audit Trail",
                    "status": "active",
                    "health": 0.98,
                    "type": "service",
                    "x": 100,
                    "y": 200
                }
            ],
            "edges": [
                {
                    "source": "attestation_service",
                    "target": "claim_verification_protocol",
                    "type": "depends_on",
                    "strength": 0.9,
                    "label": "Depends On"
                },
                {
                    "source": "attestation_service",
                    "target": "governance_audit_trail",
                    "type": "logs_to",
                    "strength": 0.95,
                    "label": "Logs To"
                }
            ]
        }
        
        # Configure the mock to return the sample data
        self.data_transformer_mock.transform_governance_state_for_visualization.return_value = self.sample_visualization_data

    def test_get_governance_state_visualization(self):
        """Test getting governance state visualization data."""
        # Call the method under test
        result = self.visualizer.get_governance_state_visualization()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('nodes', result)
        self.assertIn('edges', result)
        self.assertEqual(len(result['nodes']), len(self.sample_visualization_data['nodes']))
        self.assertEqual(len(result['edges']), len(self.sample_visualization_data['edges']))
        
        # Verify the data transformer was called
        self.data_transformer_mock.transform_governance_state_for_visualization.assert_called_once()

    def test_get_governance_state_visualization_with_options(self):
        """Test getting governance state visualization data with custom options."""
        # Custom options
        options = {
            "include_inactive": True,
            "min_health": 0.9,
            "max_components": 2,
            "layout": "force-directed"
        }
        
        # Call the method under test with custom options
        result = self.visualizer.get_governance_state_visualization(options)
        
        # Verify the result
        self.assertIsNotNone(result)
        
        # Verify the data transformer was called with the options
        self.data_transformer_mock.transform_governance_state_for_visualization.assert_called_once_with(options)

    def test_get_component_details(self):
        """Test getting details for a specific component."""
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
        
        # Call the method under test
        result = self.visualizer.get_component_details(component_id)
        
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
        self.governance_primitive_manager_mock.get_component_details.assert_called_once_with(component_id)

    def test_get_relationship_details(self):
        """Test getting details for a specific relationship."""
        # Sample relationship details
        source_id = "attestation_service"
        target_id = "claim_verification_protocol"
        relationship_details = {
            "source": source_id,
            "target": target_id,
            "type": "depends_on",
            "strength": 0.9,
            "description": "Attestation Service depends on Claim Verification Protocol for claim validation",
            "metrics": {
                "interaction_count": 5280,
                "average_latency": 0.05,
                "error_rate": 0.001
            },
            "last_updated": "2025-05-21T15:00:00Z"
        }
        
        # Configure the mock to return the sample relationship details
        self.governance_primitive_manager_mock.get_relationship_details.return_value = relationship_details
        
        # Call the method under test
        result = self.visualizer.get_relationship_details(source_id, target_id)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(result['source'], source_id)
        self.assertEqual(result['target'], target_id)
        self.assertIn('type', result)
        self.assertIn('strength', result)
        self.assertIn('description', result)
        self.assertIn('metrics', result)
        self.assertIn('last_updated', result)
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager_mock.get_relationship_details.assert_called_once_with(source_id, target_id)

    def test_get_governance_state_history(self):
        """Test getting historical governance state data."""
        # Sample historical data
        start_date = datetime.now() - timedelta(days=7)
        end_date = datetime.now()
        interval = "daily"
        
        historical_data = [
            {
                "timestamp": "2025-05-15T00:00:00Z",
                "nodes": 10,
                "edges": 15,
                "overall_health": 0.93
            },
            {
                "timestamp": "2025-05-16T00:00:00Z",
                "nodes": 10,
                "edges": 15,
                "overall_health": 0.94
            },
            {
                "timestamp": "2025-05-17T00:00:00Z",
                "nodes": 11,
                "edges": 16,
                "overall_health": 0.92
            },
            {
                "timestamp": "2025-05-18T00:00:00Z",
                "nodes": 11,
                "edges": 16,
                "overall_health": 0.93
            },
            {
                "timestamp": "2025-05-19T00:00:00Z",
                "nodes": 11,
                "edges": 16,
                "overall_health": 0.94
            },
            {
                "timestamp": "2025-05-20T00:00:00Z",
                "nodes": 11,
                "edges": 17,
                "overall_health": 0.95
            },
            {
                "timestamp": "2025-05-21T00:00:00Z",
                "nodes": 11,
                "edges": 17,
                "overall_health": 0.95
            }
        ]
        
        # Configure the mock to return the sample historical data
        self.governance_primitive_manager_mock.get_governance_state_history.return_value = historical_data
        
        # Call the method under test
        result = self.visualizer.get_governance_state_history(start_date, end_date, interval)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(len(result), len(historical_data))
        for i, entry in enumerate(result):
            self.assertIn('timestamp', entry)
            self.assertIn('nodes', entry)
            self.assertIn('edges', entry)
            self.assertIn('overall_health', entry)
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager_mock.get_governance_state_history.assert_called_once_with(
            start_date, end_date, interval
        )

    def test_get_governance_state_snapshot(self):
        """Test getting a snapshot of the governance state at a specific point in time."""
        # Sample snapshot data
        timestamp = "2025-05-15T00:00:00Z"
        snapshot_data = {
            "nodes": [
                {
                    "id": "attestation_service",
                    "label": "Attestation Service",
                    "status": "active",
                    "health": 0.93,
                    "type": "service",
                    "x": 100,
                    "y": 100
                },
                {
                    "id": "claim_verification_protocol",
                    "label": "Claim Verification Protocol",
                    "status": "active",
                    "health": 0.90,
                    "type": "protocol",
                    "x": 200,
                    "y": 100
                },
                {
                    "id": "governance_audit_trail",
                    "label": "Governance Audit Trail",
                    "status": "active",
                    "health": 0.95,
                    "type": "service",
                    "x": 100,
                    "y": 200
                }
            ],
            "edges": [
                {
                    "source": "attestation_service",
                    "target": "claim_verification_protocol",
                    "type": "depends_on",
                    "strength": 0.9,
                    "label": "Depends On"
                },
                {
                    "source": "attestation_service",
                    "target": "governance_audit_trail",
                    "type": "logs_to",
                    "strength": 0.95,
                    "label": "Logs To"
                }
            ]
        }
        
        # Configure the mock to return the sample snapshot data
        self.governance_primitive_manager_mock.get_governance_state_snapshot.return_value = snapshot_data
        
        # Call the method under test
        result = self.visualizer.get_governance_state_snapshot(timestamp)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('nodes', result)
        self.assertIn('edges', result)
        self.assertEqual(len(result['nodes']), len(snapshot_data['nodes']))
        self.assertEqual(len(result['edges']), len(snapshot_data['edges']))
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager_mock.get_governance_state_snapshot.assert_called_once_with(timestamp)

    def test_get_trust_boundaries_overlay(self):
        """Test getting trust boundaries overlay for the governance state visualization."""
        # Sample trust boundaries data
        trust_boundaries = [
            {
                "id": "boundary_1",
                "name": "Core Services Boundary",
                "type": "security",
                "components": ["attestation_service", "governance_audit_trail"],
                "color": "#ff0000",
                "opacity": 0.2
            },
            {
                "id": "boundary_2",
                "name": "Protocol Boundary",
                "type": "functional",
                "components": ["claim_verification_protocol"],
                "color": "#00ff00",
                "opacity": 0.2
            }
        ]
        
        # Configure the mock to return the sample trust boundaries data
        self.boundary_detection_engine_mock.get_trust_boundaries.return_value = trust_boundaries
        
        # Call the method under test
        result = self.visualizer.get_trust_boundaries_overlay()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(len(result), len(trust_boundaries))
        for i, boundary in enumerate(result):
            self.assertIn('id', boundary)
            self.assertIn('name', boundary)
            self.assertIn('type', boundary)
            self.assertIn('components', boundary)
            self.assertIn('color', boundary)
            self.assertIn('opacity', boundary)
        
        # Verify the boundary detection engine was called
        self.boundary_detection_engine_mock.get_trust_boundaries.assert_called_once()

    def test_get_attestation_overlay(self):
        """Test getting attestation overlay for the governance state visualization."""
        # Sample attestation data
        attestations = [
            {
                "id": "attestation_1",
                "source": "attestation_service",
                "target": "claim_verification_protocol",
                "type": "integrity",
                "status": "valid",
                "timestamp": "2025-05-21T14:30:00Z",
                "color": "#0000ff",
                "opacity": 0.5
            },
            {
                "id": "attestation_2",
                "source": "attestation_service",
                "target": "governance_audit_trail",
                "type": "compliance",
                "status": "valid",
                "timestamp": "2025-05-21T14:35:00Z",
                "color": "#0000ff",
                "opacity": 0.5
            }
        ]
        
        # Configure the mock to return the sample attestation data
        self.attestation_service_mock.get_active_attestations.return_value = attestations
        
        # Call the method under test
        result = self.visualizer.get_attestation_overlay()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(len(result), len(attestations))
        for i, attestation in enumerate(result):
            self.assertIn('id', attestation)
            self.assertIn('source', attestation)
            self.assertIn('target', attestation)
            self.assertIn('type', attestation)
            self.assertIn('status', attestation)
            self.assertIn('timestamp', attestation)
            self.assertIn('color', attestation)
            self.assertIn('opacity', attestation)
        
        # Verify the attestation service was called
        self.attestation_service_mock.get_active_attestations.assert_called_once()

    def test_generate_visualization_config(self):
        """Test generating visualization configuration."""
        # Call the method under test
        result = self.visualizer.generate_visualization_config()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('layout', result)
        self.assertIn('theme', result)
        self.assertIn('node_styles', result)
        self.assertIn('edge_styles', result)
        self.assertIn('interaction_options', result)

    def test_invalid_visualization_data(self):
        """Test behavior when invalid visualization data is provided."""
        # Configure the mock to return invalid data
        self.data_transformer_mock.transform_governance_state_for_visualization.return_value = {"invalid": "data"}
        
        # Configure schema validator to reject the data
        self.schema_validator_mock.validate.return_value = False
        
        # Call the method under test and verify it raises an exception
        with self.assertRaises(ValueError):
            self.visualizer.get_governance_state_visualization()


if __name__ == '__main__':
    unittest.main()
