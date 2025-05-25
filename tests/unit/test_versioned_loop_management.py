"""
Test module for versioned loop management behaviors.

This module contains tests for the loop management system with both pre-6.4 and 6.4.0
behavior versions, ensuring backward compatibility and proper semantic versioning.
"""

import unittest
import time
import tempfile
import shutil
from unittest.mock import MagicMock

# Import versioned behavior components
from src.versioned_behavior.core import BehaviorVersion, register_behavior, set_current_behavior_version
from src.versioned_behavior.adapters.loop_state_behavior import LoopStateBehavior
from src.versioned_behavior.adapters.recovery_behavior import RecoveryBehavior
from src.versioned_behavior.adapters.monitoring_event_behavior import MonitoringEventBehavior
from src.versioned_behavior.test_fixtures import with_behavior_version, with_loop_state_behavior


class TestLoopStateBehavior(unittest.TestCase):
    """Tests for the LoopStateBehavior adapter."""
    
    def test_pre_6_4_resource_limit(self):
        """Test pre-6.4 behavior for resource limit termination."""
        with with_behavior_version("pre_6.4"):
            state = LoopStateBehavior.get_termination_state("resource_limit_exceeded")
            self.assertEqual(state, "completed")
    
    def test_6_4_0_resource_limit(self):
        """Test 6.4.0 behavior for resource limit termination."""
        with with_behavior_version("6.4.0"):
            state = LoopStateBehavior.get_termination_state("resource_limit_exceeded")
            self.assertEqual(state, "aborted")
    
    def test_pre_6_4_timeout(self):
        """Test pre-6.4 behavior for timeout termination."""
        with with_behavior_version("pre_6.4"):
            state = LoopStateBehavior.get_termination_state("timeout")
            self.assertEqual(state, "completed")
    
    def test_6_4_0_timeout(self):
        """Test 6.4.0 behavior for timeout termination."""
        with with_behavior_version("6.4.0"):
            state = LoopStateBehavior.get_termination_state("timeout")
            self.assertEqual(state, "aborted")
    
    def test_normal_completion_both_versions(self):
        """Test that normal completion is 'completed' in both versions."""
        with with_behavior_version("pre_6.4"):
            state = LoopStateBehavior.get_termination_state("max_iterations")
            self.assertEqual(state, "completed")
        
        with with_behavior_version("6.4.0"):
            state = LoopStateBehavior.get_termination_state("max_iterations")
            self.assertEqual(state, "completed")
    
    def test_error_both_versions(self):
        """Test that error is 'failed' in both versions."""
        with with_behavior_version("pre_6.4"):
            state = LoopStateBehavior.get_termination_state("error")
            self.assertEqual(state, "failed")
        
        with with_behavior_version("6.4.0"):
            state = LoopStateBehavior.get_termination_state("error")
            self.assertEqual(state, "failed")


class TestRecoveryBehavior(unittest.TestCase):
    """Tests for the RecoveryBehavior adapter."""
    
    def test_pre_6_4_checkpoint_recovery(self):
        """Test pre-6.4 behavior for checkpoint recovery."""
        with with_behavior_version("pre_6.4"):
            checkpoint_state = {"key1": "value1", "key2": 42}
            current_state = {"key1": "old", "key2": 0, "key3": "new"}
            
            recovered_state = RecoveryBehavior.recover_from_checkpoint(
                checkpoint_state, current_state
            )
            
            # Pre-6.4: Only checkpoint state is preserved
            self.assertEqual(recovered_state["key1"], "value1")
            self.assertEqual(recovered_state["key2"], 42)
            self.assertNotIn("key3", recovered_state)
    
    def test_6_4_0_checkpoint_recovery(self):
        """Test 6.4.0 behavior for checkpoint recovery."""
        with with_behavior_version("6.4.0"):
            checkpoint_state = {"key1": "value1", "key2": 42}
            current_state = {"key1": "old", "key2": 0, "key3": "new"}
            
            recovered_state = RecoveryBehavior.recover_from_checkpoint(
                checkpoint_state, current_state
            )
            
            # 6.4.0: Full state context is preserved
            self.assertEqual(recovered_state["key1"], "value1")
            self.assertEqual(recovered_state["key2"], 42)
            self.assertEqual(recovered_state["key3"], "new")
    
    def test_pre_6_4_error_recovery(self):
        """Test pre-6.4 behavior for error recovery."""
        with with_behavior_version("pre_6.4"):
            # Successful recovery
            state = RecoveryBehavior.get_post_recovery_state(True, "failed")
            self.assertEqual(state, "recovered")
            
            # Unsuccessful recovery
            state = RecoveryBehavior.get_post_recovery_state(False, "failed")
            self.assertEqual(state, "recovered")  # Always transitions in pre-6.4
    
    def test_6_4_0_error_recovery(self):
        """Test 6.4.0 behavior for error recovery."""
        with with_behavior_version("6.4.0"):
            # Successful recovery
            state = RecoveryBehavior.get_post_recovery_state(True, "failed")
            self.assertEqual(state, "recovered")
            
            # Unsuccessful recovery
            state = RecoveryBehavior.get_post_recovery_state(False, "failed")
            self.assertEqual(state, "failed")  # Maintains failed state in 6.4.0


class TestMonitoringEventBehavior(unittest.TestCase):
    """Tests for the MonitoringEventBehavior adapter."""
    
    def setUp(self):
        """Set up test environment."""
        self.monitor = MagicMock()
        self.monitor.emit_event = MagicMock()
    
    def test_pre_6_4_checkpoint_events(self):
        """Test pre-6.4 behavior for checkpoint events."""
        with with_behavior_version("pre_6.4"):
            checkpoint_id = "test-checkpoint-123"
            state = {"key1": "value1", "key2": 42}
            
            event_count = MonitoringEventBehavior.generate_checkpoint_events(
                self.monitor, checkpoint_id, state
            )
            
            # Pre-6.4: Only one event is generated
            self.assertEqual(event_count, 1)
            self.monitor.emit_event.assert_called_once()
            event = self.monitor.emit_event.call_args[0][0]
            self.assertEqual(event["type"], "checkpoint_created")
            self.assertEqual(event["checkpoint_id"], checkpoint_id)
            self.assertEqual(event["behavior_version"], "pre_6.4")
    
    def test_6_4_0_checkpoint_events(self):
        """Test 6.4.0 behavior for checkpoint events."""
        with with_behavior_version("6.4.0"):
            checkpoint_id = "test-checkpoint-123"
            state = {"key1": "value1", "key2": 42}
            
            event_count = MonitoringEventBehavior.generate_checkpoint_events(
                self.monitor, checkpoint_id, state
            )
            
            # 6.4.0: Two events are generated
            self.assertEqual(event_count, 2)
            self.assertEqual(self.monitor.emit_event.call_count, 2)
            
            # First event: checkpoint_created
            event1 = self.monitor.emit_event.call_args_list[0][0][0]
            self.assertEqual(event1["type"], "checkpoint_created")
            self.assertEqual(event1["checkpoint_id"], checkpoint_id)
            self.assertEqual(event1["behavior_version"], "6.4.0")
            
            # Second event: state_snapshot
            event2 = self.monitor.emit_event.call_args_list[1][0][0]
            self.assertEqual(event2["type"], "state_snapshot")
            self.assertEqual(event2["checkpoint_id"], checkpoint_id)
            self.assertEqual(event2["state_size"], 2)
            self.assertEqual(event2["behavior_version"], "6.4.0")
    
    def test_pre_6_4_recovery_events(self):
        """Test pre-6.4 behavior for recovery events."""
        with with_behavior_version("pre_6.4"):
            checkpoint_id = "test-checkpoint-123"
            checkpoint_state = {"key1": "value1", "key2": 42}
            current_state = {"key1": "old", "key2": 0, "key3": "new"}
            
            # Reset mock
            self.monitor.emit_event.reset_mock()
            
            event_count = MonitoringEventBehavior.generate_recovery_events(
                self.monitor, checkpoint_id, checkpoint_state, current_state
            )
            
            # Pre-6.4: Only one event is generated
            self.assertEqual(event_count, 1)
            self.monitor.emit_event.assert_called_once()
            event = self.monitor.emit_event.call_args[0][0]
            self.assertEqual(event["type"], "checkpoint_recovered")
            self.assertEqual(event["checkpoint_id"], checkpoint_id)
            self.assertEqual(event["behavior_version"], "pre_6.4")
    
    def test_6_4_0_recovery_events(self):
        """Test 6.4.0 behavior for recovery events."""
        with with_behavior_version("6.4.0"):
            checkpoint_id = "test-checkpoint-123"
            checkpoint_state = {"key1": "value1", "key2": 42}
            current_state = {"key1": "old", "key2": 0, "key3": "new"}
            
            # Reset mock
            self.monitor.emit_event.reset_mock()
            
            event_count = MonitoringEventBehavior.generate_recovery_events(
                self.monitor, checkpoint_id, checkpoint_state, current_state
            )
            
            # 6.4.0: Two events are generated
            self.assertEqual(event_count, 2)
            self.assertEqual(self.monitor.emit_event.call_count, 2)
            
            # First event: recovery_initiated
            event1 = self.monitor.emit_event.call_args_list[0][0][0]
            self.assertEqual(event1["type"], "recovery_initiated")
            self.assertEqual(event1["checkpoint_id"], checkpoint_id)
            self.assertEqual(event1["behavior_version"], "6.4.0")
            
            # Second event: recovery_completed
            event2 = self.monitor.emit_event.call_args_list[1][0][0]
            self.assertEqual(event2["type"], "recovery_completed")
            self.assertEqual(event2["checkpoint_id"], checkpoint_id)
            self.assertEqual(event2["state_delta"], 1)  # 3 - 2 = 1
            self.assertEqual(event2["behavior_version"], "6.4.0")
    
    def test_total_recovery_events(self):
        """Test total event count for recovery operations."""
        # Pre-6.4: 2 events total (1 for checkpoint + 1 for recovery)
        with with_behavior_version("pre_6.4"):
            self.assertEqual(MonitoringEventBehavior.get_total_recovery_events(), 2)
        
        # 6.4.0: 4 events total (2 for checkpoint + 2 for recovery)
        with with_behavior_version("6.4.0"):
            self.assertEqual(MonitoringEventBehavior.get_total_recovery_events(), 4)


if __name__ == "__main__":
    unittest.main()
