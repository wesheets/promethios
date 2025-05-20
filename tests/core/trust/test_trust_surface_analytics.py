"""
Unit tests for Trust Surface Analytics module.

This module contains tests for the TrustSurfaceAnalytics class.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import uuid
import datetime
import pytest
from unittest.mock import MagicMock, patch

from src.core.trust.trust_surface_analytics import TrustSurfaceAnalytics

# Mark all tests in this file as belonging to Phase 5.7
pytestmark = pytest.mark.phase_5_7

class TestTrustSurfaceAnalytics:
    """Test suite for TrustSurfaceAnalytics class."""
    
    @pytest.fixture
    def analytics_engine(self):
        """Fixture to create a TrustSurfaceAnalytics instance for testing."""
        return TrustSurfaceAnalytics()
    
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
    
    def test_initialization(self, analytics_engine):
        """Test that the analytics engine initializes correctly."""
        assert analytics_engine is not None
        assert analytics_engine.metrics_schema_path == "schemas/trust/trust_metrics.schema.v1.json"
        assert analytics_engine.alert_schema_path == "schemas/trust/trust_boundary_alert.schema.v1.json"
    
    def test_pre_loop_tether_check(self, analytics_engine):
        """Test the pre_loop_tether_check method."""
        success, message = analytics_engine.pre_loop_tether_check()
        assert success is True
        assert message == "Tether check passed"
    
    @patch('src.core.trust.trust_surface_analytics.validate_against_schema')
    def test_analyze_surface_valid_data(self, mock_validate, analytics_engine, sample_surface_data):
        """Test analyzing a valid trust surface."""
        # Mock the validation to return success
        mock_validate.return_value = {"valid": True}
        
        # Call the analyze_surface method
        result = analytics_engine.analyze_surface(sample_surface_data)
        
        # Verify the result
        assert result is not None
        assert "surface_id" in result
        assert result["surface_id"] == sample_surface_data["surface_id"]
        assert "metrics" in result
        assert "alerts" in result
        assert "timestamp" in result
    
    @patch('src.core.trust.trust_surface_analytics.validate_against_schema')
    def test_analyze_surface_invalid_data(self, mock_validate, analytics_engine):
        """Test analyzing an invalid trust surface."""
        # Mock the validation to simulate failure
        mock_validate.return_value = {"valid": False}
        
        # Create invalid data (missing required fields)
        invalid_data = {"surface_id": "invalid"}
        
        # Call the analyze_surface method
        result = analytics_engine.analyze_surface(invalid_data)
        
        # Verify the result indicates an error
        assert result is not None
        assert "error" in result
        assert result["error"] == "Invalid surface data"
    
    def test_generate_metrics(self, analytics_engine, sample_surface_data):
        """Test generating metrics for a trust surface."""
        # Use the non-public method directly for testing
        analytics_engine._validate_surface_data = MagicMock(return_value=True)
        
        # Mock validate_against_schema to always return valid
        with patch('src.core.trust.trust_surface_analytics.validate_against_schema', 
                  return_value={"valid": True}):
            metrics = analytics_engine._generate_metrics(sample_surface_data)
        
        # Verify metrics were generated
        assert metrics is not None
        assert len(metrics) > 0
        
        # Check the structure of the first metric
        metric = metrics[0]
        assert "metric_id" in metric
        assert "surface_id" in metric
        assert "node_id" in metric
        assert "metric_type" in metric
        assert "value" in metric
        assert "timestamp" in metric
        assert "contract_version" in metric
    
    def test_check_boundary_violations(self, analytics_engine, sample_surface_data):
        """Test checking for boundary violations."""
        # Use the non-public method directly for testing
        alerts = analytics_engine._check_boundary_violations(sample_surface_data)
        
        # Verify alerts structure (even if empty in this test case)
        assert isinstance(alerts, list)
