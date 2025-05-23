#!/usr/bin/env python3
"""
Unit tests for Trust Monitoring Service in Promethios Phase 5.9

This module contains unit tests for the TrustMonitoringService class.

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
from core.trust.trust_monitoring_service import TrustMonitoringService

class TestTrustMonitoringService(unittest.TestCase):
    """Test cases for TrustMonitoringService."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Disable logging during tests
        logging.disable(logging.CRITICAL)
        
        # Create a mock contract sealer
        self.mock_contract_sealer = MagicMock()
        
        # Create a mock metrics calculator
        self.mock_metrics_calculator = MagicMock()
        
        # Configure mock metrics calculator
        self.mock_metrics_calculator.get_entity_metrics.return_value = {
            "current_aggregate": 0.3,
            "dimensions": {
                "verification": 0.4,
                "attestation": 0.2,
                "boundary": 0.3
            },
            "first_seen": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
        
        # Create test configuration
        self.test_config = {
            "thresholds": {
                "aggregate": {
                    "critical": 0.2,
                    "warning": 0.4
                },
                "dimensions": {
                    "verification": {
                        "critical": 0.3,
                        "warning": 0.5
                    },
                    "attestation": {
                        "critical": 0.3,
                        "warning": 0.5
                    },
                    "boundary": {
                        "critical": 0.3,
                        "warning": 0.5
                    }
                }
            },
            "alert_deduplication": {
                "enabled": True,
                "window_minutes": 60
            },
            "auto_resolution": {
                "enabled": True,
                "check_interval_minutes": 30
            },
            "max_alerts": 100
        }
        
        # Create instance of TrustMonitoringService
        self.monitoring_service = TrustMonitoringService(
            config=self.test_config,
            metrics_calculator=self.mock_metrics_calculator,
            contract_sealer=self.mock_contract_sealer
        )
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Re-enable logging
        logging.disable(logging.NOTSET)
    
    def test_initialization(self):
        """Test initialization of TrustMonitoringService."""
        # Verify contract tethering
        self.assertEqual(self.monitoring_service.contract_version, "v2025.05.21")
        self.assertEqual(self.monitoring_service.phase_id, "5.9")
        self.assertIn("5.9", self.monitoring_service.codex_clauses)
        
        # Verify configuration
        self.assertEqual(self.monitoring_service.config, self.test_config)
        
        # Verify contract sealer
        self.assertEqual(self.monitoring_service.contract_sealer, self.mock_contract_sealer)
        
        # Verify metrics calculator
        self.assertEqual(self.monitoring_service.metrics_calculator, self.mock_metrics_calculator)
        
        # Verify alerts
        self.assertEqual(self.monitoring_service.alerts, [])
    
    def test_pre_loop_tether_check(self):
        """Test pre-loop tether check."""
        # Valid tether should pass
        self.assertTrue(self.monitoring_service._pre_loop_tether_check())
        
        # Invalid contract version
        with patch.object(self.monitoring_service, 'contract_version', "invalid"):
            self.assertFalse(self.monitoring_service._pre_loop_tether_check())
        
        # Invalid phase ID
        with patch.object(self.monitoring_service, 'phase_id', "invalid"):
            self.assertFalse(self.monitoring_service._pre_loop_tether_check())
        
        # Missing required codex clause
        with patch.object(self.monitoring_service, 'codex_clauses', ["11.3", "11.7"]):
            self.assertFalse(self.monitoring_service._pre_loop_tether_check())
    
    def test_validate_config_structure(self):
        """Test configuration validation."""
        # Valid config should pass
        self.assertTrue(self.monitoring_service._validate_config_structure(self.test_config))
        
        # Missing required section
        invalid_config = self.test_config.copy()
        del invalid_config["thresholds"]
        self.assertFalse(self.monitoring_service._validate_config_structure(invalid_config))
        
        # Invalid thresholds configuration
        invalid_config = self.test_config.copy()
        invalid_config["thresholds"] = "not_a_dict"
        self.assertFalse(self.monitoring_service._validate_config_structure(invalid_config))
        
        # Invalid alert deduplication configuration
        invalid_config = self.test_config.copy()
        invalid_config["alert_deduplication"]["enabled"] = "not_a_bool"
        self.assertFalse(self.monitoring_service._validate_config_structure(invalid_config))
        
        # Invalid auto resolution configuration
        invalid_config = self.test_config.copy()
        invalid_config["auto_resolution"]["check_interval_minutes"] = "not_a_number"
        self.assertFalse(self.monitoring_service._validate_config_structure(invalid_config))
    
    def test_load_default_config(self):
        """Test loading default configuration."""
        default_config = self.monitoring_service._load_default_config()
        
        # Verify default config structure
        self.assertIn("thresholds", default_config)
        self.assertIn("alert_deduplication", default_config)
        self.assertIn("auto_resolution", default_config)
        
        # Verify thresholds defaults
        self.assertIn("aggregate", default_config["thresholds"])
        self.assertIn("dimensions", default_config["thresholds"])
        
        # Verify alert deduplication defaults
        self.assertIsInstance(default_config["alert_deduplication"]["enabled"], bool)
        self.assertIsInstance(default_config["alert_deduplication"]["window_minutes"], int)
        
        # Verify auto resolution defaults
        self.assertIsInstance(default_config["auto_resolution"]["enabled"], bool)
        self.assertIsInstance(default_config["auto_resolution"]["check_interval_minutes"], int)
    
    def test_check_entity_trust(self):
        """Test checking entity trust levels."""
        # Test with entity below critical threshold
        entity_id = "test_entity"
        
        # Configure mock metrics calculator
        self.mock_metrics_calculator.get_entity_metrics.return_value = {
            "current_aggregate": 0.1,  # Below critical threshold
            "dimensions": {
                "verification": 0.2,  # Below critical threshold
                "attestation": 0.4,  # Above critical, below warning
                "boundary": 0.6  # Above warning
            },
            "first_seen": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
        
        # Check entity trust
        alerts = self.monitoring_service.check_entity_trust(entity_id)
        
        # Verify alerts were generated
        self.assertEqual(len(alerts), 2)  # One for aggregate, one for verification dimension
        
        # Verify alert levels
        alert_levels = [alert["level"] for alert in alerts]
        self.assertIn("critical", alert_levels)
        
        # Test with entity above all thresholds
        # Configure mock metrics calculator
        self.mock_metrics_calculator.get_entity_metrics.return_value = {
            "current_aggregate": 0.6,  # Above warning threshold
            "dimensions": {
                "verification": 0.6,  # Above warning threshold
                "attestation": 0.6,  # Above warning threshold
                "boundary": 0.6  # Above warning threshold
            },
            "first_seen": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
        
        # Check entity trust
        alerts = self.monitoring_service.check_entity_trust(entity_id)
        
        # Verify no alerts were generated
        self.assertEqual(len(alerts), 0)
        
        # Test with non-existent entity
        self.mock_metrics_calculator.get_entity_metrics.return_value = None
        
        # Check entity trust
        alerts = self.monitoring_service.check_entity_trust(entity_id)
        
        # Verify no alerts were generated
        self.assertEqual(len(alerts), 0)
    
    def test_generate_alert(self):
        """Test alert generation."""
        # Generate an alert
        entity_id = "test_entity"
        level = "critical"
        metric_type = "aggregate"
        value = 0.1
        threshold = 0.2
        
        alert = self.monitoring_service._generate_alert(
            entity_id, level, metric_type, value, threshold
        )
        
        # Verify alert structure
        self.assertEqual(alert["entity_id"], entity_id)
        self.assertEqual(alert["level"], level)
        self.assertEqual(alert["metric_type"], metric_type)
        self.assertEqual(alert["value"], value)
        self.assertEqual(alert["threshold"], threshold)
        self.assertFalse(alert["resolved"])
        self.assertIsNotNone(alert["alert_id"])
        self.assertIsNotNone(alert["timestamp"])
        self.assertIsNone(alert["resolution_timestamp"])
        
        # Verify alert message
        self.assertIn(entity_id, alert["message"])
        self.assertIn(level, alert["message"])
        self.assertIn(metric_type, alert["message"])
    
    def test_is_duplicate_alert(self):
        """Test alert deduplication."""
        # Add an alert
        entity_id = "test_entity"
        level = "critical"
        metric_type = "aggregate"
        
        alert = self.monitoring_service._generate_alert(
            entity_id, level, metric_type, 0.1, 0.2
        )
        
        self.monitoring_service.alerts.append(alert)
        
        # Test with duplicate alert
        is_duplicate = self.monitoring_service._is_duplicate_alert(
            entity_id, level, metric_type
        )
        
        # Verify alert was detected as duplicate
        self.assertTrue(is_duplicate)
        
        # Test with different entity
        is_duplicate = self.monitoring_service._is_duplicate_alert(
            "different_entity", level, metric_type
        )
        
        # Verify alert was not detected as duplicate
        self.assertFalse(is_duplicate)
        
        # Test with different level
        is_duplicate = self.monitoring_service._is_duplicate_alert(
            entity_id, "warning", metric_type
        )
        
        # Verify alert was not detected as duplicate
        self.assertFalse(is_duplicate)
        
        # Test with different metric type
        is_duplicate = self.monitoring_service._is_duplicate_alert(
            entity_id, level, "dimension:verification"
        )
        
        # Verify alert was not detected as duplicate
        self.assertFalse(is_duplicate)
        
        # Test with old alert (outside deduplication window)
        old_alert = alert.copy()
        old_alert["timestamp"] = (
            datetime.now() - timedelta(minutes=self.test_config["alert_deduplication"]["window_minutes"] * 2)
        ).isoformat()
        
        self.monitoring_service.alerts = [old_alert]
        
        is_duplicate = self.monitoring_service._is_duplicate_alert(
            entity_id, level, metric_type
        )
        
        # Verify alert was not detected as duplicate (outside window)
        self.assertFalse(is_duplicate)
        
        # Test with resolved alert
        resolved_alert = alert.copy()
        resolved_alert["resolved"] = True
        
        self.monitoring_service.alerts = [resolved_alert]
        
        is_duplicate = self.monitoring_service._is_duplicate_alert(
            entity_id, level, metric_type
        )
        
        # Verify alert was not detected as duplicate (resolved)
        self.assertFalse(is_duplicate)
        
        # Test with disabled deduplication
        with patch.dict(self.monitoring_service.config, {"alert_deduplication": {"enabled": False}}):
            self.monitoring_service.alerts = [alert]
            
            is_duplicate = self.monitoring_service._is_duplicate_alert(
                entity_id, level, metric_type
            )
            
            # Verify alert was not detected as duplicate (deduplication disabled)
            self.assertFalse(is_duplicate)
    
    def test_resolve_alert(self):
        """Test alert resolution."""
        # Add an alert
        entity_id = "test_entity"
        alert_id = "test_alert_id"
        
        alert = {
            "alert_id": alert_id,
            "entity_id": entity_id,
            "level": "critical",
            "metric_type": "aggregate",
            "value": 0.1,
            "threshold": 0.2,
            "message": "Test alert",
            "timestamp": datetime.now().isoformat(),
            "resolved": False,
            "resolution_timestamp": None
        }
        
        self.monitoring_service.alerts.append(alert)
        
        # Resolve alert
        resolved = self.monitoring_service.resolve_alert(alert_id)
        
        # Verify alert was resolved
        self.assertTrue(resolved)
        self.assertTrue(self.monitoring_service.alerts[0]["resolved"])
        self.assertIsNotNone(self.monitoring_service.alerts[0]["resolution_timestamp"])
        
        # Test with non-existent alert
        resolved = self.monitoring_service.resolve_alert("non_existent_alert")
        
        # Verify resolution failed
        self.assertFalse(resolved)
    
    def test_check_for_auto_resolution(self):
        """Test auto-resolution of alerts."""
        # Add an alert for an entity that is now above threshold
        entity_id = "test_entity"
        
        alert = {
            "alert_id": "test_alert_id",
            "entity_id": entity_id,
            "level": "critical",
            "metric_type": "aggregate",
            "value": 0.1,
            "threshold": 0.2,
            "message": "Test alert",
            "timestamp": datetime.now().isoformat(),
            "resolved": False,
            "resolution_timestamp": None
        }
        
        self.monitoring_service.alerts.append(alert)
        
        # Configure mock metrics calculator to return values above threshold
        self.mock_metrics_calculator.get_entity_metrics.return_value = {
            "current_aggregate": 0.3,  # Above critical threshold
            "dimensions": {
                "verification": 0.4,
                "attestation": 0.4,
                "boundary": 0.4
            },
            "first_seen": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
        
        # Check for auto-resolution
        resolved_count = self.monitoring_service.check_for_auto_resolution()
        
        # Verify alert was auto-resolved
        self.assertEqual(resolved_count, 1)
        self.assertTrue(self.monitoring_service.alerts[0]["resolved"])
        
        # Test with disabled auto-resolution
        with patch.dict(self.monitoring_service.config, {"auto_resolution": {"enabled": False}}):
            # Reset alert
            self.monitoring_service.alerts[0]["resolved"] = False
            self.monitoring_service.alerts[0]["resolution_timestamp"] = None
            
            # Check for auto-resolution
            resolved_count = self.monitoring_service.check_for_auto_resolution()
            
            # Verify no alerts were auto-resolved
            self.assertEqual(resolved_count, 0)
            self.assertFalse(self.monitoring_service.alerts[0]["resolved"])
    
    def test_get_alerts(self):
        """Test retrieving alerts."""
        # Add some alerts
        entity_ids = ["entity1", "entity2"]
        levels = ["critical", "warning"]
        
        for entity_id in entity_ids:
            for level in levels:
                alert = self.monitoring_service._generate_alert(
                    entity_id, level, "aggregate", 0.1, 0.2
                )
                self.monitoring_service.alerts.append(alert)
        
        # Resolve one alert
        self.monitoring_service.alerts[0]["resolved"] = True
        self.monitoring_service.alerts[0]["resolution_timestamp"] = datetime.now().isoformat()
        
        # Test unfiltered alerts
        alerts = self.monitoring_service.get_alerts()
        self.assertEqual(len(alerts), 4)
        
        # Test filtering by entity
        alerts = self.monitoring_service.get_alerts(entity_id="entity1")
        self.assertEqual(len(alerts), 2)
        for alert in alerts:
            self.assertEqual(alert["entity_id"], "entity1")
        
        # Test filtering by level
        alerts = self.monitoring_service.get_alerts(level="critical")
        self.assertEqual(len(alerts), 2)
        for alert in alerts:
            self.assertEqual(alert["level"], "critical")
        
        # Test filtering by resolved status
        alerts = self.monitoring_service.get_alerts(resolved=True)
        self.assertEqual(len(alerts), 1)
        self.assertTrue(alerts[0]["resolved"])
        
        alerts = self.monitoring_service.get_alerts(resolved=False)
        self.assertEqual(len(alerts), 3)
        for alert in alerts:
            self.assertFalse(alert["resolved"])
        
        # Test combined filtering
        alerts = self.monitoring_service.get_alerts(
            entity_id="entity1", level="critical", resolved=False
        )
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["entity_id"], "entity1")
        self.assertEqual(alerts[0]["level"], "critical")
        self.assertFalse(alerts[0]["resolved"])
    
    def test_alert_limit(self):
        """Test alert limit enforcement."""
        # Generate alerts up to twice the limit
        for i in range(self.test_config["max_alerts"] * 2):
            alert = self.monitoring_service._generate_alert(
                f"entity{i}", "critical", "aggregate", 0.1, 0.2
            )
            self.monitoring_service._add_alert(alert)
        
        # Verify alert count is limited
        self.assertEqual(len(self.monitoring_service.alerts), self.test_config["max_alerts"])
    
    def test_update_config(self):
        """Test configuration update."""
        # Create new configuration
        new_config = {
            "thresholds": {
                "aggregate": {
                    "critical": 0.1,
                    "warning": 0.3
                }
            }
        }
        
        # Update configuration
        updated_config = self.monitoring_service.update_config(new_config)
        
        # Verify configuration was updated
        self.assertEqual(updated_config["thresholds"]["aggregate"]["critical"], 0.1)
        self.assertEqual(updated_config["thresholds"]["aggregate"]["warning"], 0.3)
        
        # Verify other configuration sections were preserved
        self.assertTrue("dimensions" in updated_config["thresholds"])
        self.assertTrue("alert_deduplication" in updated_config)
        self.assertTrue("auto_resolution" in updated_config)
        
        # Test with invalid configuration
        invalid_config = {"thresholds": "not_a_dict"}
        
        with self.assertRaises(ValueError):
            self.monitoring_service.update_config(invalid_config)
    
    def test_verify_contract_integrity(self):
        """Test contract integrity verification."""
        # Valid contract should pass
        self.assertTrue(self.monitoring_service.verify_contract_integrity())
        
        # Invalid contract should fail
        with patch.object(self.monitoring_service, 'contract_version', "invalid"):
            self.assertFalse(self.monitoring_service.verify_contract_integrity())

if __name__ == '__main__':
    unittest.main()
