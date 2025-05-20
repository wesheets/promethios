#!/usr/bin/env python3
"""
Unit tests for Trust Metrics Calculator in Promethios Phase 5.9

This module contains unit tests for the TrustMetricsCalculator class.

Codex Contract: v2025.05.21
Phase ID: 5.9
"""

import unittest
import json
import os
import sys
import logging
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

# Add src directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../src')))

# Import the module to test
from core.trust.trust_metrics_calculator import TrustMetricsCalculator

class TestTrustMetricsCalculator(unittest.TestCase):
    """Test cases for TrustMetricsCalculator."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Disable logging during tests
        logging.disable(logging.CRITICAL)
        
        # Create a mock contract sealer
        self.mock_contract_sealer = MagicMock()
        
        # Create test configuration
        self.test_config = {
            "dimensions": {
                "verification": {
                    "weight": 0.3,
                    "history_size": 10
                },
                "attestation": {
                    "weight": 0.4,
                    "history_size": 10
                },
                "boundary": {
                    "weight": 0.3,
                    "history_size": 10
                }
            },
            "aggregation": {
                "method": "weighted_average",
                "history_size": 20,
                "retention_days": 30
            }
        }
        
        # Create instance of TrustMetricsCalculator
        self.metrics_calculator = TrustMetricsCalculator(
            config=self.test_config,
            contract_sealer=self.mock_contract_sealer
        )
        
        # Add test entity metrics
        self.test_entity_id = "test_entity"
        self.metrics_calculator.entity_metrics[self.test_entity_id] = {
            "current_aggregate": 0.7,
            "dimensions": {
                "verification": 0.8,
                "attestation": 0.6,
                "boundary": 0.7
            },
            "first_seen": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
        
        # Add test dimension history
        self.metrics_calculator.dimension_history[self.test_entity_id] = {
            "verification": [
                {"timestamp": datetime.now().isoformat(), "value": 0.8}
            ],
            "attestation": [
                {"timestamp": datetime.now().isoformat(), "value": 0.6}
            ],
            "boundary": [
                {"timestamp": datetime.now().isoformat(), "value": 0.7}
            ]
        }
        
        # Add test aggregate history
        self.metrics_calculator.aggregate_history[self.test_entity_id] = [
            {"timestamp": datetime.now().isoformat(), "value": 0.7}
        ]
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Re-enable logging
        logging.disable(logging.NOTSET)
    
    def test_initialization(self):
        """Test initialization of TrustMetricsCalculator."""
        # Verify contract tethering
        self.assertEqual(self.metrics_calculator.contract_version, "v2025.05.21")
        self.assertEqual(self.metrics_calculator.phase_id, "5.9")
        self.assertIn("5.9", self.metrics_calculator.codex_clauses)
        
        # Verify configuration
        self.assertEqual(self.metrics_calculator.config, self.test_config)
        
        # Verify contract sealer
        self.assertEqual(self.metrics_calculator.contract_sealer, self.mock_contract_sealer)
        
        # Verify entity metrics
        self.assertEqual(type(self.metrics_calculator.entity_metrics), dict)
        
        # Verify dimension history
        self.assertEqual(type(self.metrics_calculator.dimension_history), dict)
        
        # Verify aggregate history
        self.assertEqual(type(self.metrics_calculator.aggregate_history), dict)
    
    def test_pre_loop_tether_check(self):
        """Test pre-loop tether check."""
        # Valid tether should pass
        self.assertTrue(self.metrics_calculator._pre_loop_tether_check())
        
        # Invalid contract version
        with patch.object(self.metrics_calculator, 'contract_version', "invalid"):
            self.assertFalse(self.metrics_calculator._pre_loop_tether_check())
        
        # Invalid phase ID
        with patch.object(self.metrics_calculator, 'phase_id', "invalid"):
            self.assertFalse(self.metrics_calculator._pre_loop_tether_check())
        
        # Missing required codex clause
        with patch.object(self.metrics_calculator, 'codex_clauses', ["11.3", "11.7"]):
            self.assertFalse(self.metrics_calculator._pre_loop_tether_check())
    
    def test_validate_config_structure(self):
        """Test configuration validation."""
        # Valid config should pass
        self.assertTrue(self.metrics_calculator._validate_config_structure(self.test_config))
        
        # Missing required section
        invalid_config = self.test_config.copy()
        del invalid_config["dimensions"]
        self.assertFalse(self.metrics_calculator._validate_config_structure(invalid_config))
        
        # Invalid dimensions configuration
        invalid_config = self.test_config.copy()
        invalid_config["dimensions"] = "not_a_dict"
        self.assertFalse(self.metrics_calculator._validate_config_structure(invalid_config))
        
        # Invalid aggregation configuration
        invalid_config = self.test_config.copy()
        invalid_config["aggregation"]["method"] = "invalid_method"
        self.assertFalse(self.metrics_calculator._validate_config_structure(invalid_config))
    
    def test_load_default_config(self):
        """Test loading default configuration."""
        default_config = self.metrics_calculator._load_default_config()
        
        # Verify default config structure
        self.assertIn("dimensions", default_config)
        self.assertIn("aggregation", default_config)
        
        # Verify dimensions defaults
        self.assertIsInstance(default_config["dimensions"], dict)
        self.assertTrue(len(default_config["dimensions"]) > 0)
        
        # Verify aggregation defaults
        self.assertIn("method", default_config["aggregation"])
        self.assertIn("history_size", default_config["aggregation"])
    
    def test_update_dimension_metric(self):
        """Test updating dimension metric."""
        # Test updating existing dimension
        dimension = "verification"
        value = 0.9
        entity_id = self.test_entity_id
        
        self.metrics_calculator.update_dimension_metric(entity_id, dimension, value)
        
        # Verify dimension was updated
        self.assertEqual(self.metrics_calculator.entity_metrics[entity_id]["dimensions"][dimension], value)
        
        # Verify dimension history was updated
        dimension_history = self.metrics_calculator.dimension_history[entity_id][dimension]
        self.assertEqual(dimension_history[-1]["value"], value)
        
        # Test updating non-existent dimension
        dimension = "new_dimension"
        value = 0.5
        
        self.metrics_calculator.update_dimension_metric(entity_id, dimension, value)
        
        # Verify dimension was added
        self.assertEqual(self.metrics_calculator.entity_metrics[entity_id]["dimensions"][dimension], value)
        
        # Verify dimension history was created
        dimension_history = self.metrics_calculator.dimension_history[entity_id][dimension]
        self.assertEqual(dimension_history[0]["value"], value)
        
        # Test updating non-existent entity
        entity_id = "new_entity"
        dimension = "verification"
        value = 0.7
        
        self.metrics_calculator.update_dimension_metric(entity_id, dimension, value)
        
        # Verify entity was created
        self.assertIn(entity_id, self.metrics_calculator.entity_metrics)
        
        # Verify dimension was added
        self.assertEqual(self.metrics_calculator.entity_metrics[entity_id]["dimensions"][dimension], value)
        
        # Verify dimension history was created
        dimension_history = self.metrics_calculator.dimension_history[entity_id][dimension]
        self.assertEqual(dimension_history[0]["value"], value)
        
        # Verify first_seen and last_updated were set
        self.assertIsNotNone(self.metrics_calculator.entity_metrics[entity_id]["first_seen"])
        self.assertIsNotNone(self.metrics_calculator.entity_metrics[entity_id]["last_updated"])
        
        # Test history size limit
        dimension = "verification"
        entity_id = self.test_entity_id
        history_size = self.test_config["dimensions"][dimension]["history_size"]
        
        for i in range(history_size * 2):
            self.metrics_calculator.update_dimension_metric(entity_id, dimension, 0.5 + (i * 0.01))
        
        # Verify history size is limited
        dimension_history = self.metrics_calculator.dimension_history[entity_id][dimension]
        self.assertEqual(len(dimension_history), history_size)
    
    def test_calculate_aggregate_metric(self):
        """Test calculating aggregate metric."""
        # Test calculating aggregate for existing entity
        entity_id = self.test_entity_id
        
        # Calculate expected aggregate
        dimensions = self.metrics_calculator.entity_metrics[entity_id]["dimensions"]
        weights = {
            dim: self.test_config["dimensions"][dim]["weight"]
            for dim in dimensions.keys()
            if dim in self.test_config["dimensions"]
        }
        
        # Normalize weights
        total_weight = sum(weights.values())
        normalized_weights = {dim: weight / total_weight for dim, weight in weights.items()}
        
        # Calculate weighted average
        expected_aggregate = sum(
            dimensions[dim] * normalized_weights[dim]
            for dim in normalized_weights.keys()
        )
        
        # Calculate aggregate
        aggregate = self.metrics_calculator.calculate_aggregate_metric(entity_id)
        
        # Verify aggregate was calculated correctly
        self.assertAlmostEqual(aggregate, expected_aggregate, places=2)
        
        # Verify aggregate was stored
        self.assertEqual(self.metrics_calculator.entity_metrics[entity_id]["current_aggregate"], aggregate)
        
        # Verify aggregate history was updated
        aggregate_history = self.metrics_calculator.aggregate_history[entity_id]
        self.assertEqual(aggregate_history[-1]["value"], aggregate)
        
        # Test calculating aggregate for non-existent entity
        entity_id = "non_existent_entity"
        
        # Calculate aggregate
        aggregate = self.metrics_calculator.calculate_aggregate_metric(entity_id)
        
        # Non-existent entity should return None
        self.assertIsNone(aggregate)
        
        # Test history size limit
        entity_id = self.test_entity_id
        history_size = self.test_config["aggregation"]["history_size"]
        
        for i in range(history_size * 2):
            # Update a dimension to trigger aggregate recalculation
            self.metrics_calculator.update_dimension_metric(entity_id, "verification", 0.5 + (i * 0.01))
            self.metrics_calculator.calculate_aggregate_metric(entity_id)
        
        # Verify history size is limited
        aggregate_history = self.metrics_calculator.aggregate_history[entity_id]
        self.assertEqual(len(aggregate_history), history_size)
    
    def test_get_entity_metrics(self):
        """Test retrieving entity metrics."""
        # Test retrieving metrics for existing entity
        entity_id = self.test_entity_id
        
        metrics = self.metrics_calculator.get_entity_metrics(entity_id)
        
        # Verify metrics were retrieved
        self.assertEqual(metrics["current_aggregate"], self.metrics_calculator.entity_metrics[entity_id]["current_aggregate"])
        self.assertEqual(metrics["dimensions"], self.metrics_calculator.entity_metrics[entity_id]["dimensions"])
        
        # Test retrieving metrics for non-existent entity
        entity_id = "non_existent_entity"
        
        metrics = self.metrics_calculator.get_entity_metrics(entity_id)
        
        # Non-existent entity should return None
        self.assertIsNone(metrics)
    
    def test_get_dimension_history(self):
        """Test retrieving dimension history."""
        # Test retrieving history for existing dimension
        entity_id = self.test_entity_id
        dimension = "verification"
        
        history = self.metrics_calculator.get_dimension_history(entity_id, dimension)
        
        # Verify history was retrieved
        self.assertEqual(history, self.metrics_calculator.dimension_history[entity_id][dimension])
        
        # Test retrieving history for non-existent dimension
        dimension = "non_existent_dimension"
        
        history = self.metrics_calculator.get_dimension_history(entity_id, dimension)
        
        # Non-existent dimension should return None
        self.assertIsNone(history)
        
        # Test retrieving history for non-existent entity
        entity_id = "non_existent_entity"
        dimension = "verification"
        
        history = self.metrics_calculator.get_dimension_history(entity_id, dimension)
        
        # Non-existent entity should return None
        self.assertIsNone(history)
        
        # Test limit parameter
        entity_id = self.test_entity_id
        dimension = "verification"
        limit = 2
        
        # Add more history entries
        for i in range(5):
            self.metrics_calculator.update_dimension_metric(entity_id, dimension, 0.5 + (i * 0.1))
        
        history = self.metrics_calculator.get_dimension_history(entity_id, dimension, limit)
        
        # Verify history was limited
        self.assertEqual(len(history), limit)
        
        # Verify most recent entries were returned
        full_history = self.metrics_calculator.dimension_history[entity_id][dimension]
        self.assertEqual(history, full_history[-limit:])
    
    def test_get_aggregate_history(self):
        """Test retrieving aggregate history."""
        # Test retrieving history for existing entity
        entity_id = self.test_entity_id
        
        history = self.metrics_calculator.get_aggregate_history(entity_id)
        
        # Verify history was retrieved
        self.assertEqual(history, self.metrics_calculator.aggregate_history[entity_id])
        
        # Test retrieving history for non-existent entity
        entity_id = "non_existent_entity"
        
        history = self.metrics_calculator.get_aggregate_history(entity_id)
        
        # Non-existent entity should return None
        self.assertIsNone(history)
        
        # Test limit parameter
        entity_id = self.test_entity_id
        limit = 2
        
        # Add more history entries
        for i in range(5):
            # Update a dimension to trigger aggregate recalculation
            self.metrics_calculator.update_dimension_metric(entity_id, "verification", 0.5 + (i * 0.1))
            self.metrics_calculator.calculate_aggregate_metric(entity_id)
        
        history = self.metrics_calculator.get_aggregate_history(entity_id, limit)
        
        # Verify history was limited
        self.assertEqual(len(history), limit)
        
        # Verify most recent entries were returned
        full_history = self.metrics_calculator.aggregate_history[entity_id]
        self.assertEqual(history, full_history[-limit:])
    
    def test_prune_old_history(self):
        """Test pruning old history entries."""
        # Add old history entries
        entity_id = self.test_entity_id
        dimension = "verification"
        old_time = datetime.now() - timedelta(days=60)
        
        # Add old dimension history
        self.metrics_calculator.dimension_history[entity_id][dimension].append({
            "timestamp": old_time.isoformat(),
            "value": 0.5
        })
        
        # Add old aggregate history
        self.metrics_calculator.aggregate_history[entity_id].append({
            "timestamp": old_time.isoformat(),
            "value": 0.5
        })
        
        # Prune old history
        self.metrics_calculator.prune_old_history()
        
        # Verify old entries were removed
        for entry in self.metrics_calculator.dimension_history[entity_id][dimension]:
            entry_time = datetime.fromisoformat(entry["timestamp"])
            self.assertGreater(
                entry_time,
                datetime.now() - timedelta(days=self.test_config["aggregation"]["retention_days"])
            )
        
        for entry in self.metrics_calculator.aggregate_history[entity_id]:
            entry_time = datetime.fromisoformat(entry["timestamp"])
            self.assertGreater(
                entry_time,
                datetime.now() - timedelta(days=self.test_config["aggregation"]["retention_days"])
            )
    
    def test_update_config(self):
        """Test configuration update."""
        # Create new configuration
        new_config = {
            "dimensions": {
                "verification": {
                    "weight": 0.5,
                    "history_size": 20
                }
            }
        }
        
        # Update configuration
        updated_config = self.metrics_calculator.update_config(new_config)
        
        # Verify configuration was updated
        self.assertEqual(updated_config["dimensions"]["verification"]["weight"], 0.5)
        self.assertEqual(updated_config["dimensions"]["verification"]["history_size"], 20)
        
        # Verify other configuration sections were preserved
        self.assertTrue("attestation" in updated_config["dimensions"])
        self.assertTrue("boundary" in updated_config["dimensions"])
        self.assertTrue("aggregation" in updated_config)
        
        # Test with invalid configuration
        invalid_config = {"dimensions": "not_a_dict"}
        
        with self.assertRaises(ValueError):
            self.metrics_calculator.update_config(invalid_config)
    
    def test_verify_contract_integrity(self):
        """Test contract integrity verification."""
        # Valid contract should pass
        self.assertTrue(self.metrics_calculator.verify_contract_integrity())
        
        # Invalid contract should fail
        with patch.object(self.metrics_calculator, 'contract_version', "invalid"):
            self.assertFalse(self.metrics_calculator.verify_contract_integrity())

if __name__ == '__main__':
    unittest.main()
