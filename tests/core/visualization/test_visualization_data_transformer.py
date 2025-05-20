"""
Unit tests for Visualization Data Transformer module.

This module contains tests for the VisualizationDataTransformer class.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import uuid
import datetime
import pytest
from unittest.mock import MagicMock, patch

from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer

# Mark all tests in this file as belonging to Phase 5.7
pytestmark = pytest.mark.phase_5_7

class TestVisualizationDataTransformer:
    """Test suite for VisualizationDataTransformer class."""
    
    @pytest.fixture
    def transformer(self):
        """Fixture to create a VisualizationDataTransformer instance for testing."""
        return VisualizationDataTransformer()
    
    @pytest.fixture
    def sample_surface_data(self):
        """Fixture to create sample trust surface data for testing."""
        return {
            "surface_id": str(uuid.uuid4()),
            "node_id": str(uuid.uuid4()),
            "boundary_ids": [str(uuid.uuid4()), str(uuid.uuid4())],
            "surface_type": "standard",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "contract_version": "v2025.05.19",
            "phase_id": "5.6",
            "codex_clauses": ["5.6", "11.0", "11.1"],
            "metadata": {
                "visibility": "public",
                "description": "Test surface"
            },
            "status": "active"
        }
    
    @pytest.fixture
    def sample_metrics(self):
        """Fixture to create sample metrics data for testing."""
        return {
            "aggregated_metrics": {
                "integrity": {
                    "mean": 0.85,
                    "min": 0.8,
                    "max": 0.9,
                    "count": 2
                },
                "availability": {
                    "mean": 0.9,
                    "min": 0.85,
                    "max": 0.95,
                    "count": 2
                },
                "consistency": {
                    "mean": 0.8,
                    "min": 0.75,
                    "max": 0.85,
                    "count": 2
                },
                "composite": {
                    "mean": 0.85,
                    "min": 0.8,
                    "max": 0.9,
                    "count": 2
                }
            },
            "node_aggregates": {
                "node1": {
                    "integrity": 0.85,
                    "availability": 0.9
                },
                "node2": {
                    "integrity": 0.8,
                    "availability": 0.85
                }
            }
        }
    
    def test_initialization(self, transformer):
        """Test that the transformer initializes correctly."""
        assert transformer is not None
        assert transformer.visualization_schema_path == "schemas/trust/trust_visualization.schema.v1.json"
        assert isinstance(transformer.color_map, dict)
        assert isinstance(transformer.layout_config, dict)
    
    def test_pre_loop_tether_check(self, transformer):
        """Test the pre_loop_tether_check method."""
        success, message = transformer.pre_loop_tether_check()
        assert success is True
        assert message == "Tether check passed"
    
    @patch('src.core.visualization.visualization_data_transformer.validate_against_schema')
    def test_transform_surface_to_visualization(self, mock_validate, transformer, sample_surface_data, sample_metrics):
        """Test transforming surface data to visualization format."""
        # Mock the validation to return success
        mock_validate.return_value = {"valid": True}
        
        # Call transform_surface_to_visualization
        result = transformer.transform_surface_to_visualization(sample_surface_data, sample_metrics)
        
        # Verify the result
        assert result is not None
        assert "visualization_id" in result
        assert "surface_ids" in result
        assert result["surface_ids"] == [sample_surface_data["surface_id"]]
        assert "nodes" in result
        assert "edges" in result
        assert "metadata" in result
        
        # Verify nodes were generated
        assert len(result["nodes"]) > 0
        
        # Verify the surface node
        surface_node = next((node for node in result["nodes"] if node["type"] == "surface"), None)
        assert surface_node is not None
        assert surface_node["id"] == sample_surface_data["surface_id"]
        
        # Verify boundary nodes
        boundary_nodes = [node for node in result["nodes"] if node["type"] == "boundary"]
        assert len(boundary_nodes) == len(sample_surface_data["boundary_ids"])
        
        # Verify edges were generated
        assert len(result["edges"]) > 0
    
    @patch('src.core.visualization.visualization_data_transformer.validate_against_schema')
    def test_transform_surface_invalid_data(self, mock_validate, transformer):
        """Test transforming invalid surface data."""
        # Mock the validation to return failure
        mock_validate.return_value = {"valid": False, "errors": ["Invalid visualization data"]}
        
        # Call with invalid data
        result = transformer.transform_surface_to_visualization({"surface_id": "invalid"}, {})
        
        # Verify error result
        assert result is not None
        assert "error" in result
    
    def test_generate_time_series_data(self, transformer):
        """Test generating time series data."""
        # Create sample metrics history
        metrics_history = {
            "surface_id": str(uuid.uuid4()),
            "metrics_by_type": {
                "integrity": [
                    {
                        "metric_id": str(uuid.uuid4()),
                        "timestamp": "2025-05-19T01:00:00Z",
                        "value": 0.85
                    },
                    {
                        "metric_id": str(uuid.uuid4()),
                        "timestamp": "2025-05-19T02:00:00Z",
                        "value": 0.9
                    }
                ],
                "availability": [
                    {
                        "metric_id": str(uuid.uuid4()),
                        "timestamp": "2025-05-19T01:00:00Z",
                        "value": 0.8
                    },
                    {
                        "metric_id": str(uuid.uuid4()),
                        "timestamp": "2025-05-19T02:00:00Z",
                        "value": 0.85
                    }
                ]
            },
            "total_metrics": 4
        }
        
        # Call generate_time_series_data
        result = transformer.generate_time_series_data(metrics_history)
        
        # Verify the result
        assert result is not None
        assert "visualization_id" in result
        assert "surface_ids" in result
        assert result["surface_ids"] == [metrics_history["surface_id"]]
        assert "view_type" in result
        assert result["view_type"] == "time_series"
        assert "series" in result
        assert "integrity" in result["series"]
        assert "availability" in result["series"]
        
        # Verify series data
        integrity_series = result["series"]["integrity"]
        assert "timestamps" in integrity_series
        assert "values" in integrity_series
        assert len(integrity_series["timestamps"]) == 2
        assert len(integrity_series["values"]) == 2
    
    def test_generate_heatmap_data(self, transformer, sample_surface_data, sample_metrics):
        """Test generating heatmap data."""
        # Call generate_heatmap_data
        result = transformer.generate_heatmap_data(sample_surface_data, sample_metrics)
        
        # Verify the result
        assert result is not None
        assert "visualization_id" in result
        assert "surface_ids" in result
        assert result["surface_ids"] == [sample_surface_data["surface_id"]]
        assert "view_type" in result
        assert result["view_type"] == "heatmap"
        assert "grid_size" in result
        assert "cells" in result
        assert len(result["cells"]) > 0
        
        # Verify cell structure
        cell = result["cells"][0]
        assert "x" in cell
        assert "y" in cell
        assert "value" in cell
        assert "color" in cell
    
    def test_merge_visualizations(self, transformer, sample_surface_data, sample_metrics):
        """Test merging multiple visualizations."""
        # Create two visualizations
        with patch('src.core.visualization.visualization_data_transformer.validate_against_schema', 
                  return_value={"valid": True}):
            viz1 = transformer.transform_surface_to_visualization(
                sample_surface_data,
                sample_metrics
            )
            
            # Create a second surface
            surface2 = {**sample_surface_data, "surface_id": str(uuid.uuid4())}
            viz2 = transformer.transform_surface_to_visualization(
                surface2,
                sample_metrics
            )
        
        # Add to cache
        transformer.visualization_cache[sample_surface_data["surface_id"]] = viz1
        transformer.visualization_cache[surface2["surface_id"]] = viz2
        
        # Call merge_visualizations
        result = transformer.merge_visualizations([viz1["visualization_id"], viz2["visualization_id"]])
        
        # Verify the result
        assert result is not None
        assert "visualization_id" in result
        assert "surface_ids" in result
        assert len(result["surface_ids"]) == 2
        assert "nodes" in result
        assert len(result["nodes"]) > 0
        assert "edges" in result
        assert len(result["edges"]) > 0
