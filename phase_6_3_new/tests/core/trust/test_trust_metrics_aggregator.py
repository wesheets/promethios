"""
Unit tests for Trust Metrics Aggregator module.

This module contains tests for the TrustMetricsAggregator class.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import uuid
import datetime
import pytest
from unittest.mock import MagicMock, patch

from src.core.trust.trust_metrics_aggregator import TrustMetricsAggregator

# Mark all tests in this file as belonging to Phase 5.7
pytestmark = pytest.mark.phase_5_7

class TestTrustMetricsAggregator:
    """Test suite for TrustMetricsAggregator class."""
    
    @pytest.fixture
    def metrics_aggregator(self):
        """Fixture to create a TrustMetricsAggregator instance for testing."""
        return TrustMetricsAggregator()
    
    @pytest.fixture
    def sample_metric(self):
        """Fixture to create a sample metric for testing."""
        return {
            "metric_id": str(uuid.uuid4()),
            "surface_id": str(uuid.uuid4()),
            "node_id": str(uuid.uuid4()),
            "metric_type": "integrity",
            "value": 0.85,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "contract_version": "v2025.05.19",
            "metadata": {
                "description": "Test metric",
                "confidence": 0.95
            }
        }
    
    def test_initialization(self, metrics_aggregator):
        """Test that the metrics aggregator initializes correctly."""
        assert metrics_aggregator is not None
        assert metrics_aggregator.metrics_schema_path == "schemas/trust/trust_metrics.schema.v1.json"
        assert isinstance(metrics_aggregator.metrics_cache, dict)
        assert isinstance(metrics_aggregator.node_registry, dict)
    
    def test_pre_loop_tether_check(self, metrics_aggregator):
        """Test the pre_loop_tether_check method."""
        success, message = metrics_aggregator.pre_loop_tether_check()
        assert success is True
        assert message == "Tether check passed"
    
    def test_register_node(self, metrics_aggregator):
        """Test registering a node with the aggregator."""
        node_id = str(uuid.uuid4())
        node_info = {
            "name": "Test Node",
            "type": "test",
            "version": "1.0.0"
        }
        
        result = metrics_aggregator.register_node(node_id, node_info)
        
        assert result is not None
        assert "node_id" in result
        assert result["node_id"] == node_id
        assert "status" in result
        assert result["status"] == "registered"
        
        # Verify node was added to registry
        assert node_id in metrics_aggregator.node_registry
        assert metrics_aggregator.node_registry[node_id]["info"] == node_info
    
    @patch('src.core.trust.trust_metrics_aggregator.validate_against_schema')
    def test_collect_metrics_valid(self, mock_validate, metrics_aggregator, sample_metric):
        """Test collecting valid metrics."""
        # Mock the validation to return success
        mock_validate.return_value = {"valid": True}
        
        node_id = "test-node"
        metrics = [sample_metric]
        
        # Register the node first
        metrics_aggregator.register_node(node_id, {
            "name": "Test Node",
            "type": "test",
            "version": "1.0.0"
        })
        
        # Call collect_metrics
        result = metrics_aggregator.collect_metrics(node_id, metrics)
        
        # Verify the result
        assert result is not None
        assert "node_id" in result
        assert result["node_id"] == node_id
        assert "valid_count" in result
        assert result["valid_count"] == 1
        assert "invalid_count" in result
        assert result["invalid_count"] == 0
        
        # Verify metric was added to cache
        surface_id = sample_metric["surface_id"]
        assert surface_id in metrics_aggregator.metrics_cache
        assert len(metrics_aggregator.metrics_cache[surface_id]) == 1
    
    @patch('src.core.trust.trust_metrics_aggregator.validate_against_schema')
    def test_collect_metrics_invalid(self, mock_validate, metrics_aggregator):
        """Test collecting invalid metrics."""
        # Mock the validation to return failure
        mock_validate.return_value = {"valid": False, "errors": ["Invalid metric"]}
        
        node_id = "test-node"
        invalid_metric = {"metric_id": "invalid"}
        
        # Register the node first
        metrics_aggregator.register_node(node_id, {
            "name": "Test Node",
            "type": "test",
            "version": "1.0.0"
        })
        
        # Call collect_metrics
        result = metrics_aggregator.collect_metrics(node_id, [invalid_metric])
        
        # Verify the result
        assert result is not None
        assert "node_id" in result
        assert result["node_id"] == node_id
        assert "valid_count" in result
        assert result["valid_count"] == 0
        assert "invalid_count" in result
        assert result["invalid_count"] == 1
        assert "invalid_metrics" in result
        assert len(result["invalid_metrics"]) == 1
    
    def test_normalize_metric(self, metrics_aggregator, sample_metric):
        """Test normalizing a metric."""
        # Set custom normalization factors
        metrics_aggregator.normalization_factors = {
            "integrity": 0.9,  # Reduce integrity values by 10%
            "availability": 1.0,
            "consistency": 1.0,
            "boundary": 1.0,
            "composite": 1.0
        }
        
        # Call _normalize_metric
        normalized = metrics_aggregator._normalize_metric(sample_metric)
        
        # Verify normalization
        assert normalized is not None
        assert normalized["value"] == sample_metric["value"] * 0.9
        assert "metadata" in normalized
        assert "normalization_factor" in normalized["metadata"]
        assert normalized["metadata"]["normalization_factor"] == 0.9
    
    def test_aggregate_metrics(self, metrics_aggregator, sample_metric):
        """Test aggregating metrics for a surface."""
        surface_id = sample_metric["surface_id"]
        
        # Add metrics to cache
        metrics_aggregator.metrics_cache[surface_id] = [
            {**sample_metric, "value": 0.8},
            {**sample_metric, "value": 0.9}
        ]
        
        # Call aggregate_metrics
        result = metrics_aggregator.aggregate_metrics(surface_id)
        
        # Verify the result
        assert result is not None
        assert "surface_id" in result
        assert result["surface_id"] == surface_id
        assert "aggregated_metrics" in result
        assert "integrity" in result["aggregated_metrics"]
        assert "mean" in result["aggregated_metrics"]["integrity"]
        assert pytest.approx(0.85) == result["aggregated_metrics"]["integrity"]["mean"]  # Average of 0.8 and 0.9
    
    def test_get_historical_metrics(self, metrics_aggregator, sample_metric):
        """Test retrieving historical metrics."""
        surface_id = sample_metric["surface_id"]
        
        # Add metrics to historical cache
        metrics_aggregator.historical_metrics[surface_id] = [
            {**sample_metric, "timestamp": "2025-05-18T00:00:00Z"},
            {**sample_metric, "timestamp": "2025-05-19T00:00:00Z"}
        ]
        
        # Call get_historical_metrics
        result = metrics_aggregator.get_historical_metrics(
            surface_id,
            start_time="2025-05-17T00:00:00Z",
            end_time="2025-05-20T00:00:00Z"
        )
        
        # Verify the result
        assert result is not None
        assert "surface_id" in result
        assert result["surface_id"] == surface_id
        assert "metrics_by_type" in result
        assert "integrity" in result["metrics_by_type"]
        assert len(result["metrics_by_type"]["integrity"]) == 2
    
    def test_get_metrics_timeline(self, metrics_aggregator, sample_metric):
        """Test generating a metrics timeline."""
        surface_id = sample_metric["surface_id"]
        
        # Add metrics to historical cache with different timestamps
        metrics_aggregator.historical_metrics[surface_id] = [
            {**sample_metric, "timestamp": "2025-05-19T01:00:00Z"},
            {**sample_metric, "timestamp": "2025-05-19T02:00:00Z"},
            {**sample_metric, "timestamp": "2025-05-19T03:00:00Z"}
        ]
        
        # Call get_metrics_timeline
        result = metrics_aggregator.get_metrics_timeline(
            surface_id,
            "integrity",
            interval="hour"
        )
        
        # Verify the result
        assert result is not None
        assert "surface_id" in result
        assert result["surface_id"] == surface_id
        assert "metric_type" in result
        assert result["metric_type"] == "integrity"
        assert "timeline" in result
        assert len(result["timeline"]) == 3  # One entry per hour
