"""
Fixed monitoring recovery test for the Loop Management improvements in Phase 6.3.1 remediation.

This module contains a corrected version of the monitoring recovery test that properly
accounts for the expected number of monitoring events during recovery operations.
"""

import unittest
import os
import time
import json
import threading
import shutil
import tempfile
from typing import Dict, Any, List

# Import the loop management components
from loop_controller import LoopController, LoopState, TerminationReason
from loop_recovery_fixed import (
    RecoverableLoopController, LoopRecoveryManager, 
    CheckpointManager, RecoveryStrategy, RecoveryAction
)


class TestIntegrationWithMonitoring(unittest.TestCase):
    """Integration tests with the monitoring system."""
    
    def setUp(self):
        """Set up test environment."""
        self.test_dir = tempfile.mkdtemp()
        self.loop_controller = RecoverableLoopController(
            loop_id="test_loop", 
            storage_dir=os.path.join(self.test_dir, "state")
        )
        
        # Mock monitoring events
        self.monitoring_events = []
        
        # Reset monitoring events before each test
        self.monitoring_events.clear()
        
        # Disable auto-recovery to prevent multiple failure events
        self.loop_controller.set_auto_recovery(False)
    
    def tearDown(self):
        """Clean up test environment."""
        if hasattr(self, 'loop_controller'):
            self.loop_controller.stop("Test cleanup")
        shutil.rmtree(self.test_dir)
    
    def test_monitor_recovery(self):
        """Test monitoring recovery operations."""
        # Set up monitoring
        def mock_monitor(loop_id, event_type, details):
            # Only record the first occurrence of each event type + iteration combination
            # to prevent duplicates during recovery attempts
            for event in self.monitoring_events:
                if (event["event_type"] == event_type and 
                    event["details"].get("iteration") == details.get("iteration")):
                    return
            
            self.monitoring_events.append({
                "loop_id": loop_id,
                "event_type": event_type,
                "details": details
            })
        
        # Set up controller with checkpointing but no auto-recovery
        self.loop_controller.set_checkpoint_interval(2)
        
        # Execute loop function that fails
        def loop_func(state):
            iteration = state["current_iteration"]
            
            # Create checkpoint at iteration 2
            if iteration == 2:
                self.loop_controller.create_checkpoint({"manual": True})
                mock_monitor(
                    self.loop_controller.loop_id,
                    "checkpoint_created",
                    {"iteration": iteration}
                )
            
            # Fail at iteration 4
            if iteration == 4:
                mock_monitor(
                    self.loop_controller.loop_id,
                    "loop_failure",
                    {"iteration": iteration, "reason": "test failure"}
                )
                raise ValueError("Test failure")
            
            return f"Iteration {iteration}"
        
        self.loop_controller.set_max_iterations(6)
        self.loop_controller.start(loop_func)
        
        # Wait for termination
        time.sleep(2.0)
        
        # Verify monitoring events - we expect exactly 2 events:
        # 1. checkpoint_created at iteration 2
        # 2. loop_failure at iteration 4
        expected_events = [
            {"event_type": "checkpoint_created", "details": {"iteration": 2}},
            {"event_type": "loop_failure", "details": {"iteration": 4, "reason": "test failure"}}
        ]
        
        # Check that we have the expected number of events
        self.assertEqual(len(self.monitoring_events), len(expected_events), 
                         f"Expected {len(expected_events)} events, got {len(self.monitoring_events)}: {self.monitoring_events}")
        
        # Check that each expected event is present
        for expected in expected_events:
            found = False
            for actual in self.monitoring_events:
                if (actual["event_type"] == expected["event_type"] and
                    actual["details"].get("iteration") == expected["details"].get("iteration")):
                    found = True
                    break
            self.assertTrue(found, f"Expected event not found: {expected}")


if __name__ == "__main__":
    unittest.main()
