"""
Unit tests for Trust Surface Dashboard UI component.

This module contains tests for the TrustSurfaceDashboard class.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import uuid
import datetime
import pytest
from unittest.mock import MagicMock, patch

from src.ui.trust_surface_dashboard.trust_surface_dashboard import TrustSurfaceDashboard

# Mark all tests in this file as belonging to Phase 5.7
pytestmark = pytest.mark.phase_5_7

class TestTrustSurfaceDashboard:
    """Test suite for TrustSurfaceDashboard class."""
    
    @pytest.fixture
    def dashboard(self):
        """Fixture to create a TrustSurfaceDashboard instance for testing."""
        # Mock the dependencies
        with patch('src.ui.trust_surface_dashboard.trust_surface_dashboard.TrustSurfaceAnalytics'), \
             patch('src.ui.trust_surface_dashboard.trust_surface_dashboard.TrustMetricsAggregator'), \
             patch('src.ui.trust_surface_dashboard.trust_surface_dashboard.VisualizationDataTransformer'), \
             patch('src.ui.trust_surface_dashboard.trust_surface_dashboard.SurfaceView'), \
             patch('src.ui.trust_surface_dashboard.trust_surface_dashboard.MetricsPanel'), \
             patch('src.ui.trust_surface_dashboard.trust_surface_dashboard.BoundaryAlerts'), \
             patch('src.ui.trust_surface_dashboard.trust_surface_dashboard.TrendCharts'), \
             patch('src.ui.trust_surface_dashboard.trust_surface_dashboard.DashboardLayout'):
            dashboard = TrustSurfaceDashboard()
            return dashboard
    
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
    
    def test_initialization(self, dashboard):
        """Test that the dashboard initializes correctly."""
        assert dashboard is not None
        assert dashboard.dashboard_id is not None
        assert dashboard.last_update is not None
        assert dashboard.active_surface_id is None
        assert isinstance(dashboard.visualization_cache, dict)
        assert isinstance(dashboard.time_series_cache, dict)
        assert isinstance(dashboard.alert_history, list)
    
    def test_pre_loop_tether_check(self, dashboard):
        """Test the pre_loop_tether_check method."""
        success, message = dashboard.pre_loop_tether_check()
        assert success is True
        assert message == "Tether check passed"
    
    def test_render(self, dashboard):
        """Test rendering the dashboard."""
        # Mock the layout render method
        dashboard.layout.render = MagicMock(return_value="<html>Dashboard</html>")
        
        # Call render
        result = dashboard.render()
        
        # Verify the result
        assert result is not None
        assert isinstance(result, str)
        assert dashboard.layout.render.called
    
    def test_update_data(self, dashboard, sample_surface_data):
        """Test updating the dashboard with new data."""
        # Mock the analytics pipeline
        dashboard.analytics.analyze_surface = MagicMock(return_value={
            "metrics": {},
            "alerts": []
        })
        dashboard.aggregator.collect_metrics = MagicMock(return_value={})
        dashboard.aggregator.aggregate_metrics = MagicMock(return_value={})
        dashboard.aggregator.get_historical_metrics = MagicMock(return_value={})
        dashboard.transformer.transform_surface_to_visualization = MagicMock(return_value={})
        dashboard.transformer.generate_time_series_data = MagicMock(return_value={})
        
        # Mock UI components
        dashboard._update_ui_components = MagicMock()
        
        # Call update_data
        result = dashboard.update_data(sample_surface_data)
        
        # Verify the result
        assert result is not None
        assert "surface_id" in result
        assert result["surface_id"] == sample_surface_data["surface_id"]
        assert "dashboard_id" in result
        assert result["dashboard_id"] == dashboard.dashboard_id
        assert "status" in result
        assert result["status"] == "updated"
        
        # Verify analytics pipeline was called
        assert dashboard.analytics.analyze_surface.called
        assert dashboard.aggregator.collect_metrics.called
        assert dashboard.aggregator.aggregate_metrics.called
        assert dashboard.transformer.transform_surface_to_visualization.called
        
        # Verify UI components were updated
        assert dashboard._update_ui_components.called
    
    def test_update_data_invalid(self, dashboard):
        """Test updating the dashboard with invalid data."""
        # Call with invalid data
        result = dashboard.update_data(None)
        
        # Verify error result
        assert result is not None
        assert "error" in result
        
        # Call with missing surface_id
        result = dashboard.update_data({})
        
        # Verify error result
        assert result is not None
        assert "error" in result
    
    def test_get_surface_visualization(self, dashboard):
        """Test retrieving visualization data for a surface."""
        surface_id = str(uuid.uuid4())
        visualization_data = {"visualization_id": str(uuid.uuid4())}
        
        # Add to cache
        dashboard.visualization_cache[surface_id] = visualization_data
        
        # Call get_surface_visualization
        result = dashboard.get_surface_visualization(surface_id)
        
        # Verify the result
        assert result is not None
        assert result == visualization_data
        
        # Test with non-existent surface
        result = dashboard.get_surface_visualization("non-existent")
        
        # Verify error result
        assert result is not None
        assert "error" in result
    
    def test_get_alerts(self, dashboard):
        """Test retrieving alerts."""
        # Add some alerts to history
        dashboard.alert_history = [
            {"alert_id": "1", "severity": "warning", "timestamp": "2025-05-19T01:00:00Z"},
            {"alert_id": "2", "severity": "critical", "timestamp": "2025-05-19T02:00:00Z"},
            {"alert_id": "3", "severity": "warning", "timestamp": "2025-05-19T03:00:00Z"}
        ]
        
        # Call get_alerts
        result = dashboard.get_alerts()
        
        # Verify the result
        assert result is not None
        assert len(result) == 3
        
        # Test with severity filter
        result = dashboard.get_alerts(severity="warning")
        
        # Verify the result
        assert result is not None
        assert len(result) == 2
        assert all(alert["severity"] == "warning" for alert in result)
        
        # Test with limit
        result = dashboard.get_alerts(limit=1)
        
        # Verify the result
        assert result is not None
        assert len(result) == 1
    
    def test_get_dashboard_status(self, dashboard):
        """Test retrieving dashboard status."""
        # Set some values
        dashboard.active_surface_id = "test-surface"
        dashboard.visualization_cache = {"surface1": {}, "surface2": {}}
        dashboard.alert_history = [{}, {}]
        
        # Call get_dashboard_status
        result = dashboard.get_dashboard_status()
        
        # Verify the result
        assert result is not None
        assert "dashboard_id" in result
        assert result["dashboard_id"] == dashboard.dashboard_id
        assert "active_surface_id" in result
        assert result["active_surface_id"] == "test-surface"
        assert "surfaces_count" in result
        assert result["surfaces_count"] == 2
        assert "alert_count" in result
        assert result["alert_count"] == 2
    
    def test_set_theme(self, dashboard):
        """Test setting the dashboard theme."""
        # Call set_theme
        result = dashboard.set_theme("dark")
        
        # Verify the result
        assert result is not None
        assert "theme" in result
        assert result["theme"] == "dark"
        assert dashboard.theme == "dark"
        
        # Test with invalid theme
        result = dashboard.set_theme("invalid")
        
        # Verify default is used
        assert result is not None
        assert "theme" in result
        assert result["theme"] == "light"
        assert dashboard.theme == "light"
    
    def test_set_refresh_interval(self, dashboard):
        """Test setting the dashboard refresh interval."""
        # Call set_refresh_interval
        result = dashboard.set_refresh_interval(30)
        
        # Verify the result
        assert result is not None
        assert "refresh_interval" in result
        assert result["refresh_interval"] == 30
        assert dashboard.refresh_interval == 30
        
        # Test with too low interval
        result = dashboard.set_refresh_interval(1)
        
        # Verify minimum is enforced
        assert result is not None
        assert "refresh_interval" in result
        assert result["refresh_interval"] == 5
        assert dashboard.refresh_interval == 5
    
    def test_export_dashboard_data(self, dashboard):
        """Test exporting dashboard data."""
        # Set up some data
        dashboard.active_surface_id = "test-surface"
        dashboard.visualization_cache = {"test-surface": {"nodes": []}}
        dashboard.time_series_cache = {"test-surface": {"series": {}}}
        dashboard.alert_history = [{"alert_id": "1"}]
        
        # Call export_dashboard_data
        result = dashboard.export_dashboard_data()
        
        # Verify the result
        assert result is not None
        assert "format" in result
        assert result["format"] == "json"
        assert "data" in result
        assert "surfaces" in result["data"]
        assert "test-surface" in result["data"]["surfaces"]
        assert "alerts" in result["data"]
        
        # Test CSV format
        result = dashboard.export_dashboard_data(format="csv")
        
        # Verify the result
        assert result is not None
        assert "format" in result
        assert result["format"] == "csv"
