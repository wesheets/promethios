#!/usr/bin/env python3
"""
Unit tests for Trust Decay Engine in Promethios Phase 5.9

This module contains unit tests for the TrustDecayEngine class.

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
from core.trust.trust_decay_engine import TrustDecayEngine

class TestTrustDecayEngine(unittest.TestCase):
    """Test cases for TrustDecayEngine."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Disable logging during tests
        logging.disable(logging.CRITICAL)
        
        # Create a mock contract sealer
        self.mock_contract_sealer = MagicMock()
        
        # Create test configuration
        self.test_config = {
            "time_decay": {
                "enabled": True,
                "half_life_days": 10,
                "minimum_trust": 0.1
            },
            "event_decay": {
                "enabled": True,
                "factors": {
                    "verification_failure": 0.2,
                    "attestation_failure": 0.3,
                    "boundary_violation": 0.4,
                    "mutation_detected": 0.5,
                    "seal_verification_failure": 0.6
                }
            },
            "context_decay": {
                "enabled": True,
                "boundary_factors": {
                    "high_trust:medium_trust": 0.1,
                    "medium_trust:low_trust": 0.2,
                    "low_trust:untrusted": 0.5
                }
            },
            "max_history_size": 10
        }
        
        # Create instance of TrustDecayEngine
        self.decay_engine = TrustDecayEngine(
            config=self.test_config,
            contract_sealer=self.mock_contract_sealer
        )
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Re-enable logging
        logging.disable(logging.NOTSET)
    
    def test_initialization(self):
        """Test initialization of TrustDecayEngine."""
        # Verify contract tethering
        self.assertEqual(self.decay_engine.contract_version, "v2025.05.21")
        self.assertEqual(self.decay_engine.phase_id, "5.9")
        self.assertIn("5.9", self.decay_engine.codex_clauses)
        
        # Verify configuration
        self.assertEqual(self.decay_engine.config, self.test_config)
        
        # Verify contract sealer
        self.assertEqual(self.decay_engine.contract_sealer, self.mock_contract_sealer)
        
        # Verify decay history
        self.assertEqual(self.decay_engine.decay_history, [])
    
    def test_pre_loop_tether_check(self):
        """Test pre-loop tether check."""
        # Valid tether should pass
        self.assertTrue(self.decay_engine._pre_loop_tether_check())
        
        # Invalid contract version
        with patch.object(self.decay_engine, 'contract_version', "invalid"):
            self.assertFalse(self.decay_engine._pre_loop_tether_check())
        
        # Invalid phase ID
        with patch.object(self.decay_engine, 'phase_id', "invalid"):
            self.assertFalse(self.decay_engine._pre_loop_tether_check())
        
        # Missing required codex clause
        with patch.object(self.decay_engine, 'codex_clauses', ["11.3", "11.7"]):
            self.assertFalse(self.decay_engine._pre_loop_tether_check())
    
    def test_validate_config_structure(self):
        """Test configuration validation."""
        # Valid config should pass
        self.assertTrue(self.decay_engine._validate_config_structure(self.test_config))
        
        # Missing required section
        invalid_config = self.test_config.copy()
        del invalid_config["time_decay"]
        self.assertFalse(self.decay_engine._validate_config_structure(invalid_config))
        
        # Invalid time decay configuration
        invalid_config = self.test_config.copy()
        invalid_config["time_decay"]["enabled"] = "not_a_bool"
        self.assertFalse(self.decay_engine._validate_config_structure(invalid_config))
        
        # Invalid event decay configuration
        invalid_config = self.test_config.copy()
        invalid_config["event_decay"]["factors"] = "not_a_dict"
        self.assertFalse(self.decay_engine._validate_config_structure(invalid_config))
        
        # Invalid context decay configuration
        invalid_config = self.test_config.copy()
        invalid_config["context_decay"]["boundary_factors"] = "not_a_dict"
        self.assertFalse(self.decay_engine._validate_config_structure(invalid_config))
    
    def test_load_default_config(self):
        """Test loading default configuration."""
        default_config = self.decay_engine._load_default_config()
        
        # Verify default config structure
        self.assertIn("time_decay", default_config)
        self.assertIn("event_decay", default_config)
        self.assertIn("context_decay", default_config)
        
        # Verify time decay defaults
        self.assertTrue(default_config["time_decay"]["enabled"])
        self.assertIsInstance(default_config["time_decay"]["half_life_days"], (int, float))
        
        # Verify event decay defaults
        self.assertTrue(default_config["event_decay"]["enabled"])
        self.assertIsInstance(default_config["event_decay"]["factors"], dict)
        
        # Verify context decay defaults
        self.assertTrue(default_config["context_decay"]["enabled"])
        self.assertIsInstance(default_config["context_decay"]["boundary_factors"], dict)
    
    def test_calculate_time_decay(self):
        """Test time-based decay calculation."""
        # Test with no time elapsed
        current_time = datetime.now()
        last_update = current_time
        trust_level = 0.8
        
        new_trust = self.decay_engine.calculate_time_decay(
            trust_level, last_update, current_time
        )
        
        # No time elapsed should result in no decay
        self.assertEqual(new_trust, trust_level)
        
        # Test with half-life elapsed
        half_life_days = self.test_config["time_decay"]["half_life_days"]
        last_update = current_time - timedelta(days=half_life_days)
        
        new_trust = self.decay_engine.calculate_time_decay(
            trust_level, last_update, current_time
        )
        
        # Half-life elapsed should result in trust level halved
        self.assertAlmostEqual(new_trust, trust_level * 0.5, places=2)
        
        # Test with disabled time decay
        with patch.dict(self.decay_engine.config, {"time_decay": {"enabled": False}}):
            new_trust = self.decay_engine.calculate_time_decay(
                trust_level, last_update, current_time
            )
            
            # Disabled time decay should result in no change
            self.assertEqual(new_trust, trust_level)
        
        # Test minimum trust level
        last_update = current_time - timedelta(days=half_life_days * 10)
        minimum_trust = self.test_config["time_decay"]["minimum_trust"]
        
        new_trust = self.decay_engine.calculate_time_decay(
            trust_level, last_update, current_time
        )
        
        # Long time elapsed should result in minimum trust level
        self.assertEqual(new_trust, minimum_trust)
        
        # Verify decay event was recorded
        self.assertEqual(len(self.decay_engine.decay_history), 2)
        self.assertEqual(self.decay_engine.decay_history[0]["decay_type"], "time")
    
    def test_apply_event_decay(self):
        """Test event-based decay application."""
        # Test with verification failure
        trust_level = 0.8
        event_type = "verification_failure"
        entity_id = "test_entity"
        
        decay_factor = self.test_config["event_decay"]["factors"][event_type]
        expected_trust = trust_level * (1.0 - decay_factor)
        
        new_trust = self.decay_engine.apply_event_decay(
            trust_level, event_type, entity_id
        )
        
        # Verify decay was applied correctly
        self.assertAlmostEqual(new_trust, expected_trust, places=2)
        
        # Test with unknown event type
        event_type = "unknown_event"
        
        new_trust = self.decay_engine.apply_event_decay(
            trust_level, event_type, entity_id
        )
        
        # Unknown event type should result in no decay
        self.assertEqual(new_trust, trust_level)
        
        # Test with disabled event decay
        with patch.dict(self.decay_engine.config, {"event_decay": {"enabled": False}}):
            new_trust = self.decay_engine.apply_event_decay(
                trust_level, "verification_failure", entity_id
            )
            
            # Disabled event decay should result in no change
            self.assertEqual(new_trust, trust_level)
        
        # Verify decay event was recorded
        self.assertEqual(len(self.decay_engine.decay_history), 2)
        self.assertEqual(self.decay_engine.decay_history[0]["decay_type"], "event")
    
    def test_apply_context_decay(self):
        """Test context-based decay application."""
        # Test with high to medium trust transition
        trust_level = 0.8
        source_context = "high_trust"
        target_context = "medium_trust"
        entity_id = "test_entity"
        
        context_key = f"{source_context}:{target_context}"
        decay_factor = self.test_config["context_decay"]["boundary_factors"][context_key]
        expected_trust = trust_level * (1.0 - decay_factor)
        
        new_trust = self.decay_engine.apply_context_decay(
            trust_level, source_context, target_context, entity_id
        )
        
        # Verify decay was applied correctly
        self.assertAlmostEqual(new_trust, expected_trust, places=2)
        
        # Test with unknown context transition
        source_context = "unknown"
        target_context = "unknown"
        
        new_trust = self.decay_engine.apply_context_decay(
            trust_level, source_context, target_context, entity_id
        )
        
        # Unknown context transition should result in no decay
        self.assertEqual(new_trust, trust_level)
        
        # Test with disabled context decay
        with patch.dict(self.decay_engine.config, {"context_decay": {"enabled": False}}):
            new_trust = self.decay_engine.apply_context_decay(
                trust_level, "high_trust", "medium_trust", entity_id
            )
            
            # Disabled context decay should result in no change
            self.assertEqual(new_trust, trust_level)
        
        # Verify decay event was recorded
        self.assertEqual(len(self.decay_engine.decay_history), 2)
        self.assertEqual(self.decay_engine.decay_history[0]["decay_type"], "context")
    
    def test_record_decay_event(self):
        """Test recording of decay events."""
        # Record a decay event
        old_trust = 0.8
        new_trust = 0.6
        decay_type = "test_decay"
        details = {"test_key": "test_value"}
        
        self.decay_engine._record_decay_event(
            decay_type, old_trust, new_trust, details
        )
        
        # Verify event was recorded
        self.assertEqual(len(self.decay_engine.decay_history), 1)
        event = self.decay_engine.decay_history[0]
        
        self.assertEqual(event["decay_type"], decay_type)
        self.assertEqual(event["old_trust"], old_trust)
        self.assertEqual(event["new_trust"], new_trust)
        self.assertEqual(event["details"], details)
        
        # Test history size limit
        for i in range(self.test_config["max_history_size"] * 2):
            self.decay_engine._record_decay_event(
                decay_type, old_trust, new_trust, details
            )
        
        # Verify history size is limited
        self.assertEqual(
            len(self.decay_engine.decay_history),
            self.test_config["max_history_size"]
        )
    
    def test_get_decay_history(self):
        """Test retrieval of decay history."""
        # Add some decay events
        entity_ids = ["entity1", "entity2"]
        decay_types = ["time", "event", "context"]
        
        for entity_id in entity_ids:
            for decay_type in decay_types:
                self.decay_engine._record_decay_event(
                    decay_type,
                    0.8,
                    0.6,
                    {"entity_id": entity_id}
                )
        
        # Test unfiltered history
        history = self.decay_engine.get_decay_history()
        self.assertEqual(len(history), 6)
        
        # Test filtering by entity
        history = self.decay_engine.get_decay_history(entity_id="entity1")
        self.assertEqual(len(history), 3)
        for event in history:
            self.assertEqual(event["details"]["entity_id"], "entity1")
        
        # Test filtering by decay type
        history = self.decay_engine.get_decay_history(decay_type="time")
        self.assertEqual(len(history), 2)
        for event in history:
            self.assertEqual(event["decay_type"], "time")
        
        # Test combined filtering
        history = self.decay_engine.get_decay_history(
            entity_id="entity1", decay_type="time"
        )
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]["details"]["entity_id"], "entity1")
        self.assertEqual(history[0]["decay_type"], "time")
        
        # Test limit
        history = self.decay_engine.get_decay_history(limit=2)
        self.assertEqual(len(history), 2)
    
    def test_update_config(self):
        """Test configuration update."""
        # Create new configuration
        new_config = {
            "time_decay": {
                "enabled": False,
                "half_life_days": 20
            }
        }
        
        # Update configuration
        updated_config = self.decay_engine.update_config(new_config)
        
        # Verify configuration was updated
        self.assertFalse(updated_config["time_decay"]["enabled"])
        self.assertEqual(updated_config["time_decay"]["half_life_days"], 20)
        
        # Verify other configuration sections were preserved
        self.assertTrue("event_decay" in updated_config)
        self.assertTrue("context_decay" in updated_config)
        
        # Test with invalid configuration
        invalid_config = {"time_decay": "not_a_dict"}
        
        with self.assertRaises(ValueError):
            self.decay_engine.update_config(invalid_config)
    
    def test_verify_contract_integrity(self):
        """Test contract integrity verification."""
        # Valid contract should pass
        self.assertTrue(self.decay_engine.verify_contract_integrity())
        
        # Invalid contract should fail
        with patch.object(self.decay_engine, 'contract_version', "invalid"):
            self.assertFalse(self.decay_engine.verify_contract_integrity())

if __name__ == '__main__':
    unittest.main()
