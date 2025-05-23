#!/usr/bin/env python3
"""
Unit tests for Trust Regeneration Protocol in Promethios Phase 5.9

This module contains unit tests for the TrustRegenerationProtocol class.

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
from core.trust.trust_regeneration_protocol import TrustRegenerationProtocol

class TestTrustRegenerationProtocol(unittest.TestCase):
    """Test cases for TrustRegenerationProtocol."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Disable logging during tests
        logging.disable(logging.CRITICAL)
        
        # Create a mock contract sealer
        self.mock_contract_sealer = MagicMock()
        
        # Create test configuration
        self.test_config = {
            "verification_regeneration": {
                "enabled": True,
                "base_factor": 0.05,
                "consecutive_bonus": 0.02,
                "max_consecutive_bonus": 0.2
            },
            "attestation_regeneration": {
                "enabled": True,
                "factors": {
                    "self_attestation": 0.05,
                    "peer_attestation": 0.1,
                    "authority_attestation": 0.3
                }
            },
            "time_regeneration": {
                "enabled": True,
                "daily_rate": 0.01,
                "maximum_trust": 0.7
            },
            "max_history_size": 10
        }
        
        # Create instance of TrustRegenerationProtocol
        self.regeneration_protocol = TrustRegenerationProtocol(
            config=self.test_config,
            contract_sealer=self.mock_contract_sealer
        )
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Re-enable logging
        logging.disable(logging.NOTSET)
    
    def test_initialization(self):
        """Test initialization of TrustRegenerationProtocol."""
        # Verify contract tethering
        self.assertEqual(self.regeneration_protocol.contract_version, "v2025.05.21")
        self.assertEqual(self.regeneration_protocol.phase_id, "5.9")
        self.assertIn("5.9", self.regeneration_protocol.codex_clauses)
        
        # Verify configuration
        self.assertEqual(self.regeneration_protocol.config, self.test_config)
        
        # Verify contract sealer
        self.assertEqual(self.regeneration_protocol.contract_sealer, self.mock_contract_sealer)
        
        # Verify regeneration history
        self.assertEqual(self.regeneration_protocol.regeneration_history, [])
        
        # Verify verification successes
        self.assertEqual(self.regeneration_protocol.verification_successes, {})
    
    def test_pre_loop_tether_check(self):
        """Test pre-loop tether check."""
        # Valid tether should pass
        self.assertTrue(self.regeneration_protocol._pre_loop_tether_check())
        
        # Invalid contract version
        with patch.object(self.regeneration_protocol, 'contract_version', "invalid"):
            self.assertFalse(self.regeneration_protocol._pre_loop_tether_check())
        
        # Invalid phase ID
        with patch.object(self.regeneration_protocol, 'phase_id', "invalid"):
            self.assertFalse(self.regeneration_protocol._pre_loop_tether_check())
        
        # Missing required codex clause
        with patch.object(self.regeneration_protocol, 'codex_clauses', ["11.3", "11.7"]):
            self.assertFalse(self.regeneration_protocol._pre_loop_tether_check())
    
    def test_validate_config_structure(self):
        """Test configuration validation."""
        # Valid config should pass
        self.assertTrue(self.regeneration_protocol._validate_config_structure(self.test_config))
        
        # Missing required section
        invalid_config = self.test_config.copy()
        del invalid_config["verification_regeneration"]
        self.assertFalse(self.regeneration_protocol._validate_config_structure(invalid_config))
        
        # Invalid verification regeneration configuration
        invalid_config = self.test_config.copy()
        invalid_config["verification_regeneration"]["enabled"] = "not_a_bool"
        self.assertFalse(self.regeneration_protocol._validate_config_structure(invalid_config))
        
        # Invalid attestation regeneration configuration
        invalid_config = self.test_config.copy()
        invalid_config["attestation_regeneration"]["factors"] = "not_a_dict"
        self.assertFalse(self.regeneration_protocol._validate_config_structure(invalid_config))
        
        # Invalid time regeneration configuration
        invalid_config = self.test_config.copy()
        invalid_config["time_regeneration"]["daily_rate"] = "not_a_number"
        self.assertFalse(self.regeneration_protocol._validate_config_structure(invalid_config))
    
    def test_load_default_config(self):
        """Test loading default configuration."""
        default_config = self.regeneration_protocol._load_default_config()
        
        # Verify default config structure
        self.assertIn("verification_regeneration", default_config)
        self.assertIn("attestation_regeneration", default_config)
        self.assertIn("time_regeneration", default_config)
        
        # Verify verification regeneration defaults
        self.assertTrue(default_config["verification_regeneration"]["enabled"])
        self.assertIsInstance(default_config["verification_regeneration"]["base_factor"], (int, float))
        
        # Verify attestation regeneration defaults
        self.assertTrue(default_config["attestation_regeneration"]["enabled"])
        self.assertIsInstance(default_config["attestation_regeneration"]["factors"], dict)
        
        # Verify time regeneration defaults
        self.assertTrue(default_config["time_regeneration"]["enabled"])
        self.assertIsInstance(default_config["time_regeneration"]["daily_rate"], (int, float))
    
    def test_apply_verification_regeneration(self):
        """Test verification-based regeneration application."""
        # Test with successful verification
        trust_level = 0.5
        verification_result = True
        entity_id = "test_entity"
        
        base_factor = self.test_config["verification_regeneration"]["base_factor"]
        expected_trust = trust_level + base_factor
        
        new_trust = self.regeneration_protocol.apply_verification_regeneration(
            trust_level, verification_result, entity_id
        )
        
        # Verify regeneration was applied correctly
        self.assertAlmostEqual(new_trust, expected_trust, places=2)
        
        # Verify consecutive successes were tracked
        self.assertEqual(self.regeneration_protocol.verification_successes[entity_id], 1)
        
        # Test with consecutive successful verifications
        new_trust = self.regeneration_protocol.apply_verification_regeneration(
            trust_level, verification_result, entity_id
        )
        
        # Verify bonus was applied
        consecutive_bonus = self.test_config["verification_regeneration"]["consecutive_bonus"]
        expected_trust = trust_level + base_factor + consecutive_bonus
        self.assertAlmostEqual(new_trust, expected_trust, places=2)
        
        # Verify consecutive successes were incremented
        self.assertEqual(self.regeneration_protocol.verification_successes[entity_id], 2)
        
        # Test with failed verification
        verification_result = False
        
        new_trust = self.regeneration_protocol.apply_verification_regeneration(
            trust_level, verification_result, entity_id
        )
        
        # Failed verification should result in no regeneration
        self.assertEqual(new_trust, trust_level)
        
        # Verify consecutive successes were reset
        self.assertEqual(self.regeneration_protocol.verification_successes[entity_id], 0)
        
        # Test with disabled verification regeneration
        with patch.dict(self.regeneration_protocol.config, {"verification_regeneration": {"enabled": False}}):
            new_trust = self.regeneration_protocol.apply_verification_regeneration(
                trust_level, True, entity_id
            )
            
            # Disabled verification regeneration should result in no change
            self.assertEqual(new_trust, trust_level)
        
        # Verify regeneration event was recorded
        self.assertEqual(len(self.regeneration_protocol.regeneration_history), 2)
        self.assertEqual(self.regeneration_protocol.regeneration_history[0]["regeneration_type"], "verification")
    
    def test_apply_attestation_regeneration(self):
        """Test attestation-based regeneration application."""
        # Test with authority attestation
        trust_level = 0.5
        attestation_type = "authority_attestation"
        attestation_data = {"entity_id": "test_entity", "authority": "central_authority"}
        
        regeneration_factor = self.test_config["attestation_regeneration"]["factors"][attestation_type]
        expected_trust = trust_level + regeneration_factor
        
        new_trust = self.regeneration_protocol.apply_attestation_regeneration(
            trust_level, attestation_type, attestation_data
        )
        
        # Verify regeneration was applied correctly
        self.assertAlmostEqual(new_trust, expected_trust, places=2)
        
        # Test with unknown attestation type
        attestation_type = "unknown_attestation"
        
        new_trust = self.regeneration_protocol.apply_attestation_regeneration(
            trust_level, attestation_type, attestation_data
        )
        
        # Unknown attestation type should result in no regeneration
        self.assertEqual(new_trust, trust_level)
        
        # Test with disabled attestation regeneration
        with patch.dict(self.regeneration_protocol.config, {"attestation_regeneration": {"enabled": False}}):
            new_trust = self.regeneration_protocol.apply_attestation_regeneration(
                trust_level, "authority_attestation", attestation_data
            )
            
            # Disabled attestation regeneration should result in no change
            self.assertEqual(new_trust, trust_level)
        
        # Verify regeneration event was recorded
        self.assertEqual(len(self.regeneration_protocol.regeneration_history), 2)
        self.assertEqual(self.regeneration_protocol.regeneration_history[0]["regeneration_type"], "attestation")
    
    def test_apply_time_regeneration(self):
        """Test time-based regeneration application."""
        # Test with time elapsed
        trust_level = 0.5
        current_time = datetime.now()
        last_update = current_time - timedelta(days=10)
        entity_id = "test_entity"
        
        daily_rate = self.test_config["time_regeneration"]["daily_rate"]
        days_elapsed = 10
        expected_regeneration = daily_rate * days_elapsed
        expected_trust = trust_level + expected_regeneration
        
        new_trust = self.regeneration_protocol.apply_time_regeneration(
            trust_level, last_update, current_time, entity_id
        )
        
        # Verify regeneration was applied correctly
        self.assertAlmostEqual(new_trust, expected_trust, places=2)
        
        # Test with no time elapsed
        last_update = current_time
        
        new_trust = self.regeneration_protocol.apply_time_regeneration(
            trust_level, last_update, current_time, entity_id
        )
        
        # No time elapsed should result in no regeneration
        self.assertEqual(new_trust, trust_level)
        
        # Test with maximum trust limit
        trust_level = 0.65
        last_update = current_time - timedelta(days=10)
        maximum_trust = self.test_config["time_regeneration"]["maximum_trust"]
        
        new_trust = self.regeneration_protocol.apply_time_regeneration(
            trust_level, last_update, current_time, entity_id
        )
        
        # Regeneration should be limited by maximum trust
        self.assertEqual(new_trust, maximum_trust)
        
        # Test with disabled time regeneration
        with patch.dict(self.regeneration_protocol.config, {"time_regeneration": {"enabled": False}}):
            new_trust = self.regeneration_protocol.apply_time_regeneration(
                trust_level, last_update, current_time, entity_id
            )
            
            # Disabled time regeneration should result in no change
            self.assertEqual(new_trust, trust_level)
        
        # Verify regeneration event was recorded
        self.assertEqual(len(self.regeneration_protocol.regeneration_history), 2)
        self.assertEqual(self.regeneration_protocol.regeneration_history[0]["regeneration_type"], "time")
    
    def test_record_regeneration_event(self):
        """Test recording of regeneration events."""
        # Record a regeneration event
        old_trust = 0.5
        new_trust = 0.6
        regeneration_type = "test_regeneration"
        details = {"test_key": "test_value"}
        
        self.regeneration_protocol._record_regeneration_event(
            regeneration_type, old_trust, new_trust, details
        )
        
        # Verify event was recorded
        self.assertEqual(len(self.regeneration_protocol.regeneration_history), 1)
        event = self.regeneration_protocol.regeneration_history[0]
        
        self.assertEqual(event["regeneration_type"], regeneration_type)
        self.assertEqual(event["old_trust"], old_trust)
        self.assertEqual(event["new_trust"], new_trust)
        self.assertEqual(event["details"], details)
        
        # Test history size limit
        for i in range(self.test_config["max_history_size"] * 2):
            self.regeneration_protocol._record_regeneration_event(
                regeneration_type, old_trust, new_trust, details
            )
        
        # Verify history size is limited
        self.assertEqual(
            len(self.regeneration_protocol.regeneration_history),
            self.test_config["max_history_size"]
        )
    
    def test_get_regeneration_history(self):
        """Test retrieval of regeneration history."""
        # Add some regeneration events
        entity_ids = ["entity1", "entity2"]
        regeneration_types = ["verification", "attestation", "time"]
        
        for entity_id in entity_ids:
            for regeneration_type in regeneration_types:
                self.regeneration_protocol._record_regeneration_event(
                    regeneration_type,
                    0.5,
                    0.6,
                    {"entity_id": entity_id}
                )
        
        # Test unfiltered history
        history = self.regeneration_protocol.get_regeneration_history()
        self.assertEqual(len(history), 6)
        
        # Test filtering by entity
        history = self.regeneration_protocol.get_regeneration_history(entity_id="entity1")
        self.assertEqual(len(history), 3)
        for event in history:
            self.assertEqual(event["details"]["entity_id"], "entity1")
        
        # Test filtering by regeneration type
        history = self.regeneration_protocol.get_regeneration_history(regeneration_type="verification")
        self.assertEqual(len(history), 2)
        for event in history:
            self.assertEqual(event["regeneration_type"], "verification")
        
        # Test combined filtering
        history = self.regeneration_protocol.get_regeneration_history(
            entity_id="entity1", regeneration_type="verification"
        )
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]["details"]["entity_id"], "entity1")
        self.assertEqual(history[0]["regeneration_type"], "verification")
        
        # Test limit
        history = self.regeneration_protocol.get_regeneration_history(limit=2)
        self.assertEqual(len(history), 2)
    
    def test_update_config(self):
        """Test configuration update."""
        # Create new configuration
        new_config = {
            "verification_regeneration": {
                "enabled": False,
                "base_factor": 0.1
            }
        }
        
        # Update configuration
        updated_config = self.regeneration_protocol.update_config(new_config)
        
        # Verify configuration was updated
        self.assertFalse(updated_config["verification_regeneration"]["enabled"])
        self.assertEqual(updated_config["verification_regeneration"]["base_factor"], 0.1)
        
        # Verify other configuration sections were preserved
        self.assertTrue("attestation_regeneration" in updated_config)
        self.assertTrue("time_regeneration" in updated_config)
        
        # Test with invalid configuration
        invalid_config = {"verification_regeneration": "not_a_dict"}
        
        with self.assertRaises(ValueError):
            self.regeneration_protocol.update_config(invalid_config)
    
    def test_verify_contract_integrity(self):
        """Test contract integrity verification."""
        # Valid contract should pass
        self.assertTrue(self.regeneration_protocol.verify_contract_integrity())
        
        # Invalid contract should fail
        with patch.object(self.regeneration_protocol, 'contract_version', "invalid"):
            self.assertFalse(self.regeneration_protocol.verify_contract_integrity())

if __name__ == '__main__':
    unittest.main()
