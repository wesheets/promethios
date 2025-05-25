"""
Tests for the Loop Management improvements in Phase 6.3.1 remediation.

This module contains comprehensive tests for the enhanced loop control,
transactional state persistence, and recovery mechanisms.
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
from loop_controller import (
    LoopController, LoopState, TerminationReason, 
    StatePersistenceManager, StateTransaction,
    MaxIterationsCondition, TimeoutCondition, ResourceLimitCondition
)
from loop_recovery import (
    RecoverableLoopController, LoopRecoveryManager, 
    CheckpointManager, RecoveryStrategy, RecoveryAction
)


class TestStatePersistenceManager(unittest.TestCase):
    """Tests for the StatePersistenceManager class."""
    
    def setUp(self):
        """Set up test environment."""
        self.test_dir = tempfile.mkdtemp()
        self.state_manager = StatePersistenceManager(self.test_dir)
        self.loop_id = "test_loop"
    
    def tearDown(self):
        """Clean up test environment."""
        shutil.rmtree(self.test_dir)
    
    def test_transaction_create(self):
        """Test creating a transaction."""
        with self.state_manager.transaction(self.loop_id) as transaction:
            self.assertEqual(transaction.loop_id, self.loop_id)
            self.assertIsNotNone(transaction.transaction_id)
    
    def test_transaction_commit(self):
        """Test committing a transaction."""
        # Create and commit a transaction
        with self.state_manager.transaction(self.loop_id) as transaction:
            transaction.add_change("key1", "value1")
            transaction.add_change("key2", 42)
        
        # Verify state was saved
        state = self.state_manager.load_state(self.loop_id)
        self.assertEqual(state["key1"], "value1")
        self.assertEqual(state["key2"], 42)
    
    def test_transaction_rollback(self):
        """Test rolling back a transaction."""
        # Create initial state
        with self.state_manager.transaction(self.loop_id) as transaction:
            transaction.add_change("key1", "initial")
        
        # Create a transaction that will be rolled back
        try:
            with self.state_manager.transaction(self.loop_id) as transaction:
                transaction.add_change("key1", "changed")
                raise ValueError("Test exception")
        except ValueError:
            pass
        
        # Verify state was not changed
        state = self.state_manager.load_state(self.loop_id)
        self.assertEqual(state["key1"], "initial")
    
    def test_transaction_history(self):
        """Test transaction history."""
        # Create multiple transactions
        with self.state_manager.transaction(self.loop_id) as t1:
            t1.add_change("key1", "value1")
        
        with self.state_manager.transaction(self.loop_id) as t2:
            t2.add_change("key2", "value2")
        
        # Verify transaction history
        history = self.state_manager.get_transaction_history(self.loop_id)
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0].changes["key1"], "value1")
        self.assertEqual(history[1].changes["key2"], "value2")
    
    def test_recover_state(self):
        """Test recovering state from transaction history."""
        # Create multiple transactions
        with self.state_manager.transaction(self.loop_id) as t1:
            t1.add_change("key1", "value1")
        
        with self.state_manager.transaction(self.loop_id) as t2:
            t2.add_change("key2", "value2")
            t2.add_change("key1", "updated")
        
        # Delete the state file to simulate corruption
        os.remove(os.path.join(self.test_dir, f"{self.loop_id}.state.json"))
        
        # Recover state
        recovered_state = self.state_manager.recover_state(self.loop_id)
        
        # Verify recovered state
        self.assertEqual(recovered_state["key1"], "updated")
        self.assertEqual(recovered_state["key2"], "value2")
    
    def test_cleanup_old_transactions(self):
        """Test cleaning up old transactions."""
        # Create transactions
        with self.state_manager.transaction(self.loop_id) as t1:
            t1.add_change("key1", "value1")
        
        # Modify timestamp to make it old
        transactions = self.state_manager.get_transaction_history(self.loop_id)
        transaction_file = os.path.join(self.test_dir, "transactions", self.loop_id, f"{transactions[0].transaction_id}.json")
        with open(transaction_file, 'r') as f:
            data = json.load(f)
        
        # Set timestamp to 8 days ago
        data['timestamp'] = time.time() - (8 * 24 * 60 * 60)
        
        with open(transaction_file, 'w') as f:
            json.dump(data, f)
        
        # Create a new transaction
        with self.state_manager.transaction(self.loop_id) as t2:
            t2.add_change("key2", "value2")
        
        # Clean up old transactions
        removed = self.state_manager.cleanup_old_transactions(self.loop_id, 7)
        
        # Verify cleanup
        self.assertEqual(removed, 1)
        transactions = self.state_manager.get_transaction_history(self.loop_id)
        self.assertEqual(len(transactions), 1)
        self.assertEqual(transactions[0].changes["key2"], "value2")


class TestLoopController(unittest.TestCase):
    """Tests for the LoopController class."""
    
    def setUp(self):
        """Set up test environment."""
        self.test_dir = tempfile.mkdtemp()
        self.loop_controller = LoopController(loop_id="test_loop", storage_dir=self.test_dir)
    
    def tearDown(self):
        """Clean up test environment."""
        if hasattr(self, 'loop_controller'):
            self.loop_controller.stop("Test cleanup")
        shutil.rmtree(self.test_dir)
    
    def test_initialization(self):
        """Test controller initialization."""
        state = self.loop_controller.get_state()
        self.assertEqual(state["state"], LoopState.INITIALIZED.value)
        self.assertEqual(state["current_iteration"], 0)
    
    def test_update_state(self):
        """Test updating state."""
        self.loop_controller.update_state({"test_key": "test_value"})
        state = self.loop_controller.get_state()
        self.assertEqual(state["test_key"], "test_value")
    
    def test_max_iterations_condition(self):
        """Test max iterations termination condition."""
        self.loop_controller.set_max_iterations(3)
        
        # Execute loop function that increments iteration
        def loop_func(state):
            return "Iteration " + str(state["current_iteration"])
        
        self.loop_controller.start(loop_func)
        
        # Wait for termination
        time.sleep(0.5)
        
        # Verify state
        state = self.loop_controller.get_state()
        self.assertEqual(state["state"], LoopState.COMPLETED.value)
        self.assertEqual(state["current_iteration"], 3)
        self.assertEqual(state["termination_reason"], TerminationReason.MAX_ITERATIONS.value)
    
    def test_timeout_condition(self):
        """Test timeout termination condition."""
        self.loop_controller.set_timeout(0.5)
        
        # Execute loop function that sleeps
        def loop_func(state):
            time.sleep(0.2)
            return "Iteration " + str(state["current_iteration"])
        
        self.loop_controller.start(loop_func)
        
        # Wait for termination
        time.sleep(1.0)
        
        # Verify state
        state = self.loop_controller.get_state()
        self.assertEqual(state["state"], LoopState.COMPLETED.value)
        self.assertEqual(state["termination_reason"], TerminationReason.TIMEOUT.value)
    
    def test_resource_limit_condition(self):
        """Test resource limit termination condition."""
        self.loop_controller.set_resource_limit("memory", 0.8)
        
        # Execute loop function that increases resource usage
        def loop_func(state):
            iteration = state["current_iteration"]
            # Simulate increasing memory usage
            memory_usage = 0.5 + (iteration * 0.1)
            self.loop_controller.update_resource_usage("memory", memory_usage)
            return f"Memory usage: {memory_usage}"
        
        self.loop_controller.start(loop_func)
        
        # Wait for termination
        time.sleep(1.0)
        
        # Verify state
        state = self.loop_controller.get_state()
        self.assertEqual(state["state"], LoopState.COMPLETED.value)
        self.assertEqual(state["termination_reason"], TerminationReason.RESOURCE_LIMIT.value)
        self.assertGreaterEqual(state["resource_usage"]["memory"], 0.8)
    
    def test_custom_condition(self):
        """Test custom termination condition."""
        # Define custom condition
        def custom_check(state):
            iteration = state.get("current_iteration", 0)
            if iteration >= 5:
                return True, "Reached 5 iterations"
            return False, None
        
        self.loop_controller.add_custom_condition("custom_5_iterations", custom_check)
        
        # Execute loop function
        def loop_func(state):
            return "Iteration " + str(state["current_iteration"])
        
        self.loop_controller.start(loop_func)
        
        # Wait for termination
        time.sleep(0.5)
        
        # Verify state
        state = self.loop_controller.get_state()
        self.assertEqual(state["state"], LoopState.COMPLETED.value)
        self.assertEqual(state["current_iteration"], 5)
        self.assertEqual(state["termination_reason"], TerminationReason.CONDITION_MET.value)
    
    def test_error_handling(self):
        """Test error handling in loop execution."""
        # Execute loop function that raises an error after a few iterations
        def loop_func(state):
            iteration = state["current_iteration"]
            if iteration >= 2:
                raise ValueError(f"Test error at iteration {iteration}")
            return f"Iteration {iteration}"
        
        self.loop_controller.start(loop_func)
        
        # Wait for termination
        time.sleep(0.5)
        
        # Verify state
        state = self.loop_controller.get_state()
        self.assertEqual(state["state"], LoopState.FAILED.value)
        self.assertEqual(state["termination_reason"], TerminationReason.ERROR.value)
        self.assertEqual(state["error_count"], 3)  # Default threshold is 3 errors
        self.assertIn("Test error at iteration 2", state["last_error"])
    
    def test_manual_stop(self):
        """Test manually stopping the loop."""
        # Execute loop function
        def loop_func(state):
            time.sleep(0.1)
            return "Iteration " + str(state["current_iteration"])
        
        self.loop_controller.start(loop_func)
        
        # Let it run for a bit
        time.sleep(0.3)
        
        # Stop the loop
        self.loop_controller.stop("Manual test stop")
        
        # Verify state
        state = self.loop_controller.get_state()
        self.assertEqual(state["state"], LoopState.ABORTED.value)
        self.assertEqual(state["termination_reason"], TerminationReason.MANUAL.value)
        self.assertEqual(state["termination_details"], "Manual test stop")
    
    def test_execution_history(self):
        """Test execution history tracking."""
        # Execute loop function
        def loop_func(state):
            time.sleep(0.1)
            return "Iteration " + str(state["current_iteration"])
        
        self.loop_controller.set_max_iterations(5)
        self.loop_controller.start(loop_func)
        
        # Wait for termination
        time.sleep(1.0)
        
        # Verify execution history
        history = self.loop_controller.get_execution_history()
        self.assertEqual(len(history), 5)
        for i, entry in enumerate(history):
            self.assertEqual(entry["iteration"], i)
            self.assertTrue(entry["success"])
            self.assertGreater(entry["execution_time"], 0.0)


class TestCheckpointManager(unittest.TestCase):
    """Tests for the CheckpointManager class."""
    
    def setUp(self):
        """Set up test environment."""
        self.test_dir = tempfile.mkdtemp()
        self.checkpoint_manager = CheckpointManager(self.test_dir)
        self.loop_id = "test_loop"
    
    def tearDown(self):
        """Clean up test environment."""
        shutil.rmtree(self.test_dir)
    
    def test_create_checkpoint(self):
        """Test creating a checkpoint."""
        state = {"key1": "value1", "key2": 42}
        checkpoint = self.checkpoint_manager.create_checkpoint(self.loop_id, state)
        
        self.assertEqual(checkpoint.loop_id, self.loop_id)
        self.assertEqual(checkpoint.state, state)
    
    def test_get_checkpoint(self):
        """Test retrieving a checkpoint."""
        state = {"key1": "value1", "key2": 42}
        checkpoint = self.checkpoint_manager.create_checkpoint(self.loop_id, state)
        
        retrieved = self.checkpoint_manager.get_checkpoint(self.loop_id, checkpoint.checkpoint_id)
        
        self.assertEqual(retrieved.loop_id, self.loop_id)
        self.assertEqual(retrieved.state, state)
        self.assertEqual(retrieved.checkpoint_id, checkpoint.checkpoint_id)
    
    def test_get_latest_checkpoint(self):
        """Test retrieving the latest checkpoint."""
        # Create multiple checkpoints
        self.checkpoint_manager.create_checkpoint(self.loop_id, {"iteration": 1})
        time.sleep(0.1)
        self.checkpoint_manager.create_checkpoint(self.loop_id, {"iteration": 2})
        time.sleep(0.1)
        latest = self.checkpoint_manager.create_checkpoint(self.loop_id, {"iteration": 3})
        
        # Get latest checkpoint
        retrieved = self.checkpoint_manager.get_latest_checkpoint(self.loop_id)
        
        self.assertEqual(retrieved.checkpoint_id, latest.checkpoint_id)
        self.assertEqual(retrieved.state["iteration"], 3)
    
    def test_get_checkpoints(self):
        """Test retrieving all checkpoints."""
        # Create multiple checkpoints
        self.checkpoint_manager.create_checkpoint(self.loop_id, {"iteration": 1})
        self.checkpoint_manager.create_checkpoint(self.loop_id, {"iteration": 2})
        self.checkpoint_manager.create_checkpoint(self.loop_id, {"iteration": 3})
        
        # Get all checkpoints
        checkpoints = self.checkpoint_manager.get_checkpoints(self.loop_id)
        
        self.assertEqual(len(checkpoints), 3)
        iterations = [cp.state["iteration"] for cp in checkpoints]
        self.assertIn(1, iterations)
        self.assertIn(2, iterations)
        self.assertIn(3, iterations)
    
    def test_delete_checkpoint(self):
        """Test deleting a checkpoint."""
        checkpoint = self.checkpoint_manager.create_checkpoint(self.loop_id, {"key": "value"})
        
        # Delete the checkpoint
        result = self.checkpoint_manager.delete_checkpoint(self.loop_id, checkpoint.checkpoint_id)
        
        self.assertTrue(result)
        self.assertIsNone(self.checkpoint_manager.get_checkpoint(self.loop_id, checkpoint.checkpoint_id))
    
    def test_cleanup_old_checkpoints(self):
        """Test cleaning up old checkpoints."""
        # Create multiple checkpoints
        for i in range(15):
            self.checkpoint_manager.create_checkpoint(self.loop_id, {"iteration": i})
        
        # Clean up old checkpoints
        removed = self.checkpoint_manager.cleanup_old_checkpoints(self.loop_id, 10)
        
        self.assertEqual(removed, 5)
        checkpoints = self.checkpoint_manager.get_checkpoints(self.loop_id)
        self.assertEqual(len(checkpoints), 10)


class TestLoopRecoveryManager(unittest.TestCase):
    """Tests for the LoopRecoveryManager class."""
    
    def setUp(self):
        """Set up test environment."""
        self.test_dir = tempfile.mkdtemp()
        self.recovery_manager = LoopRecoveryManager(self.test_dir)
        self.loop_id = "test_loop"
        self.loop_controller = LoopController(loop_id=self.loop_id, storage_dir=os.path.join(self.test_dir, "state"))
    
    def tearDown(self):
        """Clean up test environment."""
        if hasattr(self, 'loop_controller'):
            self.loop_controller.stop("Test cleanup")
        shutil.rmtree(self.test_dir)
    
    def test_create_checkpoint(self):
        """Test creating a checkpoint through the recovery manager."""
        # Set up initial state
        self.loop_controller.update_state({"key1": "value1", "key2": 42})
        
        # Create checkpoint
        checkpoint = self.recovery_manager.create_checkpoint(self.loop_controller)
        
        # Verify checkpoint
        self.assertEqual(checkpoint.loop_id, self.loop_id)
        self.assertEqual(checkpoint.state["key1"], "value1")
        self.assertEqual(checkpoint.state["key2"], 42)
    
    def test_recover_from_checkpoint(self):
        """Test recovering from a checkpoint."""
        # Set up initial state
        self.loop_controller.update_state({"key1": "value1", "key2": 42})
        
        # Create checkpoint
        checkpoint = self.recovery_manager.create_checkpoint(self.loop_controller)
        
        # Change state
        self.loop_controller.update_state({"key1": "changed", "key3": "new"})
        
        # Recover from checkpoint
        result = self.recovery_manager.recover_from_checkpoint(self.loop_controller, checkpoint.checkpoint_id)
        
        # Verify recovery
        self.assertTrue(result.success)
        self.assertEqual(result.strategy, RecoveryStrategy.CHECKPOINT)
        
        # Verify state
        state = self.loop_controller.get_state()
        self.assertEqual(state["key1"], "value1")
        self.assertEqual(state["key2"], 42)
        self.assertNotIn("key3", state)
    
    def test_recover_from_error(self):
        """Test recovering from an error."""
        # Set up initial state with error
        self.loop_controller.update_state({
            "state": LoopState.FAILED.value,
            "termination_reason": TerminationReason.ERROR.value,
            "error_count": 3,
            "last_error": "Test error"
        })
        
        # Create checkpoint before error
        checkpoint = self.recovery_manager.create_checkpoint(self.loop_controller)
        
        # Recover from error
        result = self.recovery_manager.recover_from_failure(self.loop_controller)
        
        # Verify recovery
        self.assertTrue(result.success)
        
        # Force reload state from disk to ensure we get the latest state
        # This is needed because the recovery might have updated the state file directly
        self.loop_controller.state_manager.clear_cache(self.loop_controller.loop_id)
        
        # Verify state
        state = self.loop_controller.get_state()
        self.assertNotEqual(state["state"], LoopState.FAILED.value)
    
    def test_recovery_history(self):
        """Test recovery history tracking."""
        # Set up initial state with error
        self.loop_controller.update_state({
            "state": LoopState.FAILED.value,
            "termination_reason": TerminationReason.ERROR.value,
            "error_count": 3,
            "last_error": "Test error"
        })
        
        # Create checkpoint
        self.recovery_manager.create_checkpoint(self.loop_controller)
        
        # Perform recovery
        self.recovery_manager.recover_from_failure(self.loop_controller)
        
        # Verify history
        history = self.recovery_manager.get_recovery_history(self.loop_id)
        self.assertEqual(len(history), 1)
        self.assertTrue(history[0].success)


class TestRecoverableLoopController(unittest.TestCase):
    """Tests for the RecoverableLoopController class."""
    
    def setUp(self):
        """Set up test environment."""
        self.test_dir = tempfile.mkdtemp()
        self.loop_controller = RecoverableLoopController(
            loop_id="test_loop", 
            storage_dir=os.path.join(self.test_dir, "state")
        )
    
    def tearDown(self):
        """Clean up test environment."""
        if hasattr(self, 'loop_controller'):
            self.loop_controller.stop("Test cleanup")
        shutil.rmtree(self.test_dir)
    
    def test_automatic_checkpointing(self):
        """Test automatic checkpointing."""
        # Set checkpoint interval
        self.loop_controller.set_checkpoint_interval(2)
        
        # Execute loop function
        def loop_func(state):
            time.sleep(0.1)
            return "Iteration " + str(state["current_iteration"])
        
        self.loop_controller.set_max_iterations(5)
        self.loop_controller.start(loop_func)
        
        # Wait for termination
        time.sleep(1.0)
        
        # Verify checkpoints were created
        checkpoints = self.loop_controller.recovery_manager.checkpoint_manager.get_checkpoints(self.loop_controller.loop_id)
        self.assertGreaterEqual(len(checkpoints), 2)  # Should have checkpoints at iterations 2 and 4
    
    def test_auto_recovery(self):
        """Test automatic recovery from failure."""
        # Set up controller with auto-recovery
        self.loop_controller.set_auto_recovery(True)
        self.loop_controller.set_checkpoint_interval(2)
        
        # Counter for tracking recovery attempts
        recovery_counter = {"count": 0}
        
        # Execute loop function that fails after a few iterations
        def loop_func(state):
            iteration = state["current_iteration"]
            
            # If we've recovered, don't fail again
            if recovery_counter["count"] > 0:
                return f"Recovered iteration {iteration}"
            
            # Fail on iteration 3
            if iteration == 3:
                recovery_counter["count"] += 1
                raise ValueError(f"Test error at iteration {iteration}")
            
            return f"Iteration {iteration}"
        
        self.loop_controller.set_max_iterations(5)
        self.loop_controller.start(loop_func)
        
        # Wait for termination
        time.sleep(2.0)
        
        # Verify recovery happened
        self.assertGreater(recovery_counter["count"], 0)
        
        # Verify loop completed
        state = self.loop_controller.get_state()
        self.assertEqual(state["state"], LoopState.COMPLETED.value)
        self.assertEqual(state["termination_reason"], TerminationReason.MAX_ITERATIONS.value)
    
    def test_manual_checkpoint_and_recovery(self):
        """Test manual checkpoint creation and recovery."""
        # Set up initial state
        self.loop_controller.update_state({"test_key": "test_value"})
        
        # Create manual checkpoint
        checkpoint = self.loop_controller.create_checkpoint({"manual": True})
        
        # Change state
        self.loop_controller.update_state({"test_key": "changed"})
        
        # Recover from checkpoint
        result = self.loop_controller.recover_from_checkpoint(checkpoint.checkpoint_id)
        
        # Verify recovery
        self.assertTrue(result.success)
        
        # Verify state
        state = self.loop_controller.get_state()
        self.assertEqual(state["test_key"], "test_value")


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
    
    def tearDown(self):
        """Clean up test environment."""
        if hasattr(self, 'loop_controller'):
            self.loop_controller.stop("Test cleanup")
        shutil.rmtree(self.test_dir)
    
    def test_monitor_loop_execution(self):
        """Test monitoring loop execution."""
        # Set up monitoring
        def mock_monitor(loop_id, event_type, details):
            self.monitoring_events.append({
                "loop_id": loop_id,
                "event_type": event_type,
                "details": details
            })
        
        # Execute loop function with monitoring
        def loop_func(state):
            iteration = state["current_iteration"]
            
            # Simulate monitoring
            if iteration == 2:
                mock_monitor(
                    self.loop_controller.loop_id,
                    "loop_execution",
                    {"iteration": iteration, "status": "running"}
                )
            
            return f"Iteration {iteration}"
        
        self.loop_controller.set_max_iterations(5)
        self.loop_controller.start(loop_func)
        
        # Wait for termination
        time.sleep(1.0)
        
        # Verify monitoring events
        self.assertEqual(len(self.monitoring_events), 1)
        self.assertEqual(self.monitoring_events[0]["event_type"], "loop_execution")
        self.assertEqual(self.monitoring_events[0]["details"]["iteration"], 2)
    
    def test_monitor_recovery(self):
        """Test monitoring recovery operations."""
        # Set up monitoring
        def mock_monitor(loop_id, event_type, details):
            self.monitoring_events.append({
                "loop_id": loop_id,
                "event_type": event_type,
                "details": details
            })
        
        # Set up controller with auto-recovery
        self.loop_controller.set_auto_recovery(True)
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
        
        # Verify monitoring events
        self.assertEqual(len(self.monitoring_events), 2)
        self.assertEqual(self.monitoring_events[0]["event_type"], "checkpoint_created")
        self.assertEqual(self.monitoring_events[1]["event_type"], "loop_failure")


if __name__ == "__main__":
    unittest.main()
