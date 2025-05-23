"""
Integration tests for Phase 5.7 implementation.

This module contains integration tests for the Trust Surface Visualization and Analytics components.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import uuid
import datetime
import pytest
from unittest.mock import MagicMock, patch

from src.core.trust.trust_surface_analytics import TrustSurfaceAnalytics
from src.core.trust.trust_metrics_aggregator import TrustMetricsAggregator
from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer
from src.ui.trust_surface_dashboard.trust_surface_dashboard import TrustSurfaceDashboard

# Mark all tests in this file as belonging to Phase 5.7
pytestmark = pytest.mark.phase_5_7

class TestPhase57Integration:
    """Integration test suite for Phase 5.7 components."""
    
    @pytest.fixture
    def analytics_engine(self):
        """Fixture to create a TrustSurfaceAnalytics instance for testing."""
        return TrustSurfaceAnalytics()
    
    @pytest.fixture
    def metrics_aggregator(self):
        """Fixture to create a TrustMetricsAggregator instance for testing."""
        return TrustMetricsAggregator()
    
    @pytest.fixture
    def visualization_transformer(self):
        """Fixture to create a VisualizationDataTransformer instance for testing."""
        return VisualizationDataTransformer()
    
    @pytest.fixture
    def dashboard(self):
        """Fixture to create a TrustSurfaceDashboard instance for testing."""
        return TrustSurfaceDashboard()
    
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
    
    def test_end_to_end_analytics_to_visualization(self, analytics_engine, metrics_aggregator, 
                                                visualization_transformer, dashboard, sample_surface_data):
        """Test the end-to-end flow from analytics to visualization."""
        # Step 1: Analyze the trust surface
        with patch('src.core.trust.trust_surface_analytics.validate_against_schema', 
                  return_value={"valid": True}):
            analytics_result = analytics_engine.analyze_surface(sample_surface_data)
        
        # Verify analytics result
        assert analytics_result is not None
        assert "surface_id" in analytics_result
        assert "metrics" in analytics_result
        
        # Step 2: Collect and aggregate metrics
        node_id = sample_surface_data["node_id"]
        metrics = analytics_result["metrics"]
        
        with patch('src.core.trust.trust_metrics_aggregator.validate_against_schema', 
                  return_value={"valid": True}):
            collection_result = metrics_aggregator.collect_metrics(node_id, metrics)
        
        # Verify collection result
        assert collection_result is not None
        assert "node_id" in collection_result
        assert collection_result["node_id"] == node_id
        
        # Step 3: Aggregate metrics for the surface
        surface_id = sample_surface_data["surface_id"]
        
        # Mock the metrics cache for testing
        metrics_aggregator.metrics_cache = {
            surface_id: metrics
        }
        
        aggregation_result = metrics_aggregator.aggregate_metrics(surface_id)
        
        # Verify aggregation result
        assert aggregation_result is not None
        assert "surface_id" in aggregation_result
        assert aggregation_result["surface_id"] == surface_id
        
        # Step 4: Transform data for visualization
        with patch('src.core.visualization.visualization_data_transformer.validate_against_schema', 
                  return_value={"valid": True}):
            visualization_data = visualization_transformer.transform_surface_to_visualization(
                sample_surface_data, aggregation_result
            )
        
        # Verify visualization data
        assert visualization_data is not None
        assert "visualization_id" in visualization_data
        assert "nodes" in visualization_data
        assert "edges" in visualization_data
        
        # Step 5: Update the dashboard with visualization data
        # Create a complete test visualization data structure
        test_visualization_data = {
            "surface_id": sample_surface_data["surface_id"],
            "visualization_id": str(uuid.uuid4()),
            "surface_ids": [sample_surface_data["surface_id"]],
            "view_type": "network",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "contract_version": "v2025.05.19",
            "nodes": [{"id": "test-node", "type": "surface", "label": "Test Surface"}],
            "edges": [{"id": "test-edge", "source": "test-node", "target": "test-node"}],
            "metadata": {
                "title": "Test Visualization",
                "description": "Test visualization for integration test"
            }
        }
        
        # Mock the dashboard components
        dashboard.surface_view = MagicMock()
        dashboard.metrics_panel = MagicMock()
        dashboard.boundary_alerts = MagicMock()
        dashboard.trend_charts = MagicMock()
        
        # Mock the analytics pipeline to avoid actual processing
        dashboard.analytics = MagicMock()
        dashboard.aggregator = MagicMock()
        dashboard.transformer = MagicMock()
        
        # Update the dashboard with test data
        dashboard.update_data(test_visualization_data)
        
        # Verify dashboard components were updated
        dashboard.surface_view.update_data.assert_called_once()
        dashboard.metrics_panel.update_data.assert_called_once()
        dashboard.boundary_alerts.update_data.assert_called_once()
        dashboard.trend_charts.update_data.assert_called_once()
    
    def test_schema_validation_throughout_pipeline(self, analytics_engine, metrics_aggregator, 
                                               visualization_transformer, sample_surface_data):
        """Test that schema validation is performed throughout the pipeline."""
        # Mock the validate_against_schema function to track calls
        with patch('src.core.trust.trust_surface_analytics.validate_against_schema') as mock_validate:
            mock_validate.return_value = {"valid": True}
            
            # Call analyze_surface
            analytics_engine.analyze_surface(sample_surface_data)
            
            # Verify schema validation was called
            assert mock_validate.called
        
        # Test metrics aggregator validation
        with patch('src.core.trust.trust_metrics_aggregator.validate_against_schema') as mock_validate:
            mock_validate.return_value = {"valid": True}
            
            # Call collect_metrics
            metrics_aggregator.collect_metrics(sample_surface_data["node_id"], [{"metric_id": "test"}])
            
            # Verify schema validation was called
            assert mock_validate.called
        
        # Test visualization transformer validation
        with patch('src.core.visualization.visualization_data_transformer.validate_against_schema') as mock_validate:
            mock_validate.return_value = {"valid": True}
            
            # Call transform_surface_to_visualization with valid data
            # Add required fields to ensure validation is triggered
            metrics_data = {
                "surface_id": sample_surface_data["surface_id"],
                "aggregated_metrics": {
                    "integrity": {"mean": 0.8, "min": 0.6, "max": 0.9, "count": 5},
                    "availability": {"mean": 0.7, "min": 0.5, "max": 0.9, "count": 5},
                    "composite": {"mean": 0.75, "min": 0.6, "max": 0.9, "count": 5}
                }
            }
            
            visualization_transformer.transform_surface_to_visualization(sample_surface_data, metrics_data)
            
            # Verify schema validation was called
            assert mock_validate.called
