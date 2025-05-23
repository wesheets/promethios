#!/usr/bin/env python3
"""
Integration tests for Trust Decay Engine components in Promethios Phase 5.9

This module contains integration tests for the Trust Decay Engine components,
testing their interactions and combined functionality.

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

# Import the modules to test
from core.trust.trust_decay_engine import TrustDecayEngine
from core.trust.trust_regeneration_protocol import TrustRegenerationProtocol
from core.trust.trust_metrics_calculator import TrustMetricsCalculator
from core.trust.trust_monitoring_service import TrustMonitoringService

class TestTrustDecayEngineIntegration(unittest.TestCase):
    """Integration tests for Trust Decay Engine components."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Disable logging during tests
        logging.disable(logging.CRITICAL)
        
        # Create a mock contract sealer
        self.mock_contract_sealer = MagicMock()
        
        # Create instances of all components
        self.decay_engine = TrustDecayEngine(
            contract_sealer=self.mock_contract_sealer
        )
        
        self.regeneration_protocol = TrustRegenerationProtocol(
            contract_sealer=self.mock_contract_sealer
        )
        
        self.metrics_calculator = TrustMetricsCalculator(
            contract_sealer=self.mock_contract_sealer
        )
        
        self.monitoring_service = TrustMonitoringService(
            metrics_calculator=self.metrics_calculator,
            contract_sealer=self.mock_contract_sealer
        )
        
        # Set up test entity
        self.test_entity_id = "test_integration_entity"
        
        # Initialize entity metrics
        self.metrics_calculator.update_dimension_metric(
            self.test_entity_id, "verification", 0.8
        )
        self.metrics_calculator.update_dimension_metric(
            self.test_entity_id, "attestation", 0.7
        )
        self.metrics_calculator.update_dimension_metric(
            self.test_entity_id, "boundary", 0.9
        )
        
        # Calculate initial aggregate
        self.metrics_calculator.calculate_aggregate_metric(self.test_entity_id)
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Re-enable logging
        logging.disable(logging.NOTSET)
    
    def test_decay_and_metrics_integration(self):
        """Test integration between decay engine and metrics calculator."""
        # Get initial metrics
        initial_metrics = self.metrics_calculator.get_entity_metrics(self.test_entity_id)
        initial_aggregate = initial_metrics["current_aggregate"]
        initial_verification = initial_metrics["dimensions"]["verification"]
        
        # Apply event-based decay
        new_verification = self.decay_engine.apply_event_decay(
            initial_verification, "verification_failure", self.test_entity_id
        )
        
        # Update metrics
        self.metrics_calculator.update_dimension_metric(
            self.test_entity_id, "verification", new_verification
        )
        
        # Recalculate aggregate
        new_aggregate = self.metrics_calculator.calculate_aggregate_metric(self.test_entity_id)
        
        # Verify metrics were updated
        updated_metrics = self.metrics_calculator.get_entity_metrics(self.test_entity_id)
        
        self.assertEqual(updated_metrics["dimensions"]["verification"], new_verification)
        self.assertEqual(updated_metrics["current_aggregate"], new_aggregate)
        
        # Verify decay was applied correctly
        self.assertLess(new_verification, initial_verification)
        self.assertLess(new_aggregate, initial_aggregate)
        
        # Verify decay history was recorded
        decay_history = self.decay_engine.get_decay_history(entity_id=self.test_entity_id)
        self.assertEqual(len(decay_history), 1)
        self.assertEqual(decay_history[0]["decay_type"], "event")
    
    def test_regeneration_and_metrics_integration(self):
        """Test integration between regeneration protocol and metrics calculator."""
        # Get initial metrics
        initial_metrics = self.metrics_calculator.get_entity_metrics(self.test_entity_id)
        initial_aggregate = initial_metrics["current_aggregate"]
        initial_attestation = initial_metrics["dimensions"]["attestation"]
        
        # Apply attestation-based regeneration
        new_attestation = self.regeneration_protocol.apply_attestation_regeneration(
            initial_attestation, 
            "authority_attestation", 
            {"entity_id": self.test_entity_id, "authority": "test_authority"}
        )
        
        # Update metrics
        self.metrics_calculator.update_dimension_metric(
            self.test_entity_id, "attestation", new_attestation
        )
        
        # Recalculate aggregate
        new_aggregate = self.metrics_calculator.calculate_aggregate_metric(self.test_entity_id)
        
        # Verify metrics were updated
        updated_metrics = self.metrics_calculator.get_entity_metrics(self.test_entity_id)
        
        self.assertEqual(updated_metrics["dimensions"]["attestation"], new_attestation)
        self.assertEqual(updated_metrics["current_aggregate"], new_aggregate)
        
        # Verify regeneration was applied correctly
        self.assertGreater(new_attestation, initial_attestation)
        self.assertGreater(new_aggregate, initial_aggregate)
        
        # Verify regeneration history was recorded
        regeneration_history = self.regeneration_protocol.get_regeneration_history(entity_id=self.test_entity_id)
        self.assertEqual(len(regeneration_history), 1)
        self.assertEqual(regeneration_history[0]["regeneration_type"], "attestation")
    
    def test_monitoring_and_metrics_integration(self):
        """Test integration between monitoring service and metrics calculator."""
        # Get initial metrics
        initial_metrics = self.metrics_calculator.get_entity_metrics(self.test_entity_id)
        initial_aggregate = initial_metrics["current_aggregate"]
        
        # Set critical threshold higher than current aggregate
        self.monitoring_service.config["thresholds"]["aggregate"]["critical"] = initial_aggregate + 0.1
        
        # Check entity trust
        alerts = self.monitoring_service.check_entity_trust(self.test_entity_id)
        
        # Verify alert was generated
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["level"], "critical")
        self.assertEqual(alerts[0]["entity_id"], self.test_entity_id)
        
        # Apply regeneration to increase trust above threshold
        new_aggregate = initial_aggregate + 0.2
        
        # Update all dimensions to achieve desired aggregate
        for dimension in initial_metrics["dimensions"]:
            self.metrics_calculator.update_dimension_metric(
                self.test_entity_id, dimension, new_aggregate
            )
        
        # Recalculate aggregate
        self.metrics_calculator.calculate_aggregate_metric(self.test_entity_id)
        
        # Check for auto-resolution
        resolved_count = self.monitoring_service.check_for_auto_resolution()
        
        # Verify alert was auto-resolved
        self.assertEqual(resolved_count, 1)
        
        # Get alerts
        alerts = self.monitoring_service.get_alerts(entity_id=self.test_entity_id)
        
        # Verify alert was resolved
        self.assertEqual(len(alerts), 1)
        self.assertTrue(alerts[0]["resolved"])
    
    def test_full_trust_lifecycle(self):
        """Test full trust lifecycle with all components."""
        # Get initial metrics
        initial_metrics = self.metrics_calculator.get_entity_metrics(self.test_entity_id)
        initial_aggregate = initial_metrics["current_aggregate"]
        
        # 1. Apply decay
        verification_value = initial_metrics["dimensions"]["verification"]
        new_verification = self.decay_engine.apply_event_decay(
            verification_value, "verification_failure", self.test_entity_id
        )
        
        self.metrics_calculator.update_dimension_metric(
            self.test_entity_id, "verification", new_verification
        )
        
        # 2. Recalculate aggregate
        self.metrics_calculator.calculate_aggregate_metric(self.test_entity_id)
        
        # 3. Check for alerts
        alerts = self.monitoring_service.check_entity_trust(self.test_entity_id)
        
        # 4. Apply regeneration
        attestation_value = initial_metrics["dimensions"]["attestation"]
        new_attestation = self.regeneration_protocol.apply_attestation_regeneration(
            attestation_value, 
            "authority_attestation", 
            {"entity_id": self.test_entity_id, "authority": "test_authority"}
        )
        
        self.metrics_calculator.update_dimension_metric(
            self.test_entity_id, "attestation", new_attestation
        )
        
        # 5. Recalculate aggregate
        final_aggregate = self.metrics_calculator.calculate_aggregate_metric(self.test_entity_id)
        
        # 6. Check for auto-resolution
        self.monitoring_service.check_for_auto_resolution()
        
        # Verify final state
        final_metrics = self.metrics_calculator.get_entity_metrics(self.test_entity_id)
        
        # Verify dimension updates
        self.assertEqual(final_metrics["dimensions"]["verification"], new_verification)
        self.assertEqual(final_metrics["dimensions"]["attestation"], new_attestation)
        
        # Verify aggregate update
        self.assertEqual(final_metrics["current_aggregate"], final_aggregate)
        
        # Verify history records
        decay_history = self.decay_engine.get_decay_history(entity_id=self.test_entity_id)
        regeneration_history = self.regeneration_protocol.get_regeneration_history(entity_id=self.test_entity_id)
        
        self.assertEqual(len(decay_history), 1)
        self.assertEqual(len(regeneration_history), 1)
        
        # Verify metrics history
        verification_history = self.metrics_calculator.get_dimension_history(
            self.test_entity_id, "verification"
        )
        attestation_history = self.metrics_calculator.get_dimension_history(
            self.test_entity_id, "attestation"
        )
        aggregate_history = self.metrics_calculator.get_aggregate_history(self.test_entity_id)
        
        self.assertGreaterEqual(len(verification_history), 2)  # Initial + decay
        self.assertGreaterEqual(len(attestation_history), 2)  # Initial + regeneration
        self.assertGreaterEqual(len(aggregate_history), 3)  # Initial + after decay + after regeneration

if __name__ == '__main__':
    unittest.main()
