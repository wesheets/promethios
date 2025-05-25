"""
Loop Recovery Manager for Phase 6.3.1 remediation.

This module implements robust recovery mechanisms for loop failures,
providing automatic state restoration and recovery strategies.
"""

import logging
import time
import json
import os
import uuid
import threading
import traceback
from enum import Enum
from typing import Dict, List, Any, Optional, Set, Tuple, Callable
from datetime import datetime, timedelta

# Import the loop controller components
from loop_controller import LoopController, LoopState, TerminationReason, StatePersistenceManager


class RecoveryStrategy(Enum):
    """Recovery strategies for failed loops."""
    RESTART = "restart"  # Restart the loop from the beginning
    RESUME = "resume"    # Resume from the last successful iteration
    CHECKPOINT = "checkpoint"  # Resume from the last checkpoint
    ROLLBACK = "rollback"  # Roll back to a stable state
    COMPENSATE = "compensate"  # Apply compensation actions


class RecoveryAction(Enum):
    """Actions to take during recovery."""
    RETRY = "retry"  # Retry the failed operation
    SKIP = "skip"    # Skip the failed operation
    ALTERNATE = "alternate"  # Use an alternate path
    NOTIFY = "notify"  # Notify administrators
    TERMINATE = "terminate"  # Terminate the loop


class RecoveryResult:
    """Result of a recovery operation."""
    
    def __init__(self, success: bool, strategy: RecoveryStrategy, actions: List[RecoveryAction], details: str = ""):
        """
        Initialize a recovery result.
        
        Args:
            success: Whether recovery was successful
            strategy: Recovery strategy used
            actions: Recovery actions taken
            details: Detailed information about the recovery
        """
        self.success = success
        self.strategy = strategy
        self.actions = actions
        self.details = details
        self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the recovery result to a dictionary.
        
        Returns:
            Dictionary representation of the recovery result
        """
        return {
            'success': self.success,
            'strategy': self.strategy.value,
            'actions': [action.value for action in self.actions],
            'details': self.details,
            'timestamp': self.timestamp
        }


class LoopCheckpoint:
    """Checkpoint for loop state recovery."""
    
    def __init__(self, loop_id: str, checkpoint_id: str = None):
        """
        Initialize a loop checkpoint.
        
        Args:
            loop_id: ID of the loop
            checkpoint_id: Optional checkpoint ID, generated if not provided
        """
        self.loop_id = loop_id
        self.checkpoint_id = checkpoint_id or str(uuid.uuid4())
        self.state = {}
        self.metadata = {}
        self.timestamp = time.time()
    
    def save_state(self, state: Dict[str, Any]) -> None:
        """
        Save the loop state.
        
        Args:
            state: Loop state to save
        """
        self.state = state.copy()
    
    def add_metadata(self, key: str, value: Any) -> None:
        """
        Add metadata to the checkpoint.
        
        Args:
            key: Metadata key
            value: Metadata value
        """
        self.metadata[key] = value
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the checkpoint to a dictionary.
        
        Returns:
            Dictionary representation of the checkpoint
        """
        return {
            'loop_id': self.loop_id,
            'checkpoint_id': self.checkpoint_id,
            'state': self.state,
            'metadata': self.metadata,
            'timestamp': self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'LoopCheckpoint':
        """
        Create a checkpoint from a dictionary.
        
        Args:
            data: Dictionary representation of a checkpoint
            
        Returns:
            LoopCheckpoint instance
        """
        checkpoint = cls(
            loop_id=data['loop_id'],
            checkpoint_id=data['checkpoint_id']
        )
        checkpoint.state = data['state']
        checkpoint.metadata = data['metadata']
        checkpoint.timestamp = data['timestamp']
        return checkpoint


class CheckpointManager:
    """
    Manager for loop checkpoints.
    
    This class provides functionality to create, store, and retrieve checkpoints
    for loop state recovery.
    """
    
    def __init__(self, storage_dir: str = None):
        """
        Initialize the checkpoint manager.
        
        Args:
            storage_dir: Directory for checkpoint storage
        """
        self.storage_dir = storage_dir or os.path.join(os.getcwd(), "loop_checkpoints")
        self.logger = logging.getLogger("CheckpointManager")
        self.locks = {}
        
        # Ensure storage directory exists
        os.makedirs(self.storage_dir, exist_ok=True)
        self.logger.info(f"Initialized checkpoint manager with storage at {self.storage_dir}")
    
    def get_lock(self, loop_id: str) -> threading.RLock:
        """
        Get a lock for a specific loop.
        
        Args:
            loop_id: ID of the loop
            
        Returns:
            Lock for the loop
        """
        if loop_id not in self.locks:
            self.locks[loop_id] = threading.RLock()
        return self.locks[loop_id]
    
    def create_checkpoint(self, loop_id: str, state: Dict[str, Any], metadata: Dict[str, Any] = None) -> LoopCheckpoint:
        """
        Create a checkpoint for a loop.
        
        Args:
            loop_id: ID of the loop
            state: Current state of the loop
            metadata: Optional metadata for the checkpoint
            
        Returns:
            Created checkpoint
        """
        with self.get_lock(loop_id):
            checkpoint = LoopCheckpoint(loop_id)
            checkpoint.save_state(state)
            
            if metadata:
                for key, value in metadata.items():
                    checkpoint.add_metadata(key, value)
            
            # Save checkpoint
            self.save_checkpoint(checkpoint)
            
            self.logger.info(f"Created checkpoint {checkpoint.checkpoint_id} for loop {loop_id}")
            return checkpoint
    
    def save_checkpoint(self, checkpoint: LoopCheckpoint) -> None:
        """
        Save a checkpoint to storage.
        
        Args:
            checkpoint: Checkpoint to save
        """
        checkpoint_dir = os.path.join(self.storage_dir, checkpoint.loop_id)
        os.makedirs(checkpoint_dir, exist_ok=True)
        
        checkpoint_file = os.path.join(checkpoint_dir, f"{checkpoint.checkpoint_id}.json")
        
        # Create a temporary file
        temp_file = f"{checkpoint_file}.tmp"
        try:
            with open(temp_file, 'w') as f:
                json.dump(checkpoint.to_dict(), f, indent=2)
            
            # Atomic rename for durability
            os.replace(temp_file, checkpoint_file)
            
        except Exception as e:
            self.logger.error(f"Error saving checkpoint {checkpoint.checkpoint_id}: {str(e)}")
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass
            raise
    
    def get_checkpoint(self, loop_id: str, checkpoint_id: str) -> Optional[LoopCheckpoint]:
        """
        Get a specific checkpoint.
        
        Args:
            loop_id: ID of the loop
            checkpoint_id: ID of the checkpoint
            
        Returns:
            Checkpoint if found, None otherwise
        """
        checkpoint_file = os.path.join(self.storage_dir, loop_id, f"{checkpoint_id}.json")
        if not os.path.exists(checkpoint_file):
            return None
        
        try:
            with open(checkpoint_file, 'r') as f:
                data = json.load(f)
                return LoopCheckpoint.from_dict(data)
        except Exception as e:
            self.logger.error(f"Error loading checkpoint {checkpoint_id}: {str(e)}")
            return None
    
    def get_latest_checkpoint(self, loop_id: str) -> Optional[LoopCheckpoint]:
        """
        Get the latest checkpoint for a loop.
        
        Args:
            loop_id: ID of the loop
            
        Returns:
            Latest checkpoint if found, None otherwise
        """
        checkpoints = self.get_checkpoints(loop_id)
        if not checkpoints:
            return None
        
        # Sort by timestamp (newest first)
        checkpoints.sort(key=lambda c: c.timestamp, reverse=True)
        return checkpoints[0]
    
    def get_checkpoints(self, loop_id: str) -> List[LoopCheckpoint]:
        """
        Get all checkpoints for a loop.
        
        Args:
            loop_id: ID of the loop
            
        Returns:
            List of checkpoints
        """
        checkpoint_dir = os.path.join(self.storage_dir, loop_id)
        if not os.path.exists(checkpoint_dir):
            return []
        
        checkpoints = []
        for filename in os.listdir(checkpoint_dir):
            if filename.endswith(".json"):
                try:
                    with open(os.path.join(checkpoint_dir, filename), 'r') as f:
                        data = json.load(f)
                        checkpoints.append(LoopCheckpoint.from_dict(data))
                except Exception as e:
                    self.logger.error(f"Error loading checkpoint from {filename}: {str(e)}")
        
        return checkpoints
    
    def delete_checkpoint(self, loop_id: str, checkpoint_id: str) -> bool:
        """
        Delete a checkpoint.
        
        Args:
            loop_id: ID of the loop
            checkpoint_id: ID of the checkpoint
            
        Returns:
            True if deleted, False otherwise
        """
        checkpoint_file = os.path.join(self.storage_dir, loop_id, f"{checkpoint_id}.json")
        if not os.path.exists(checkpoint_file):
            return False
        
        try:
            os.remove(checkpoint_file)
            self.logger.info(f"Deleted checkpoint {checkpoint_id} for loop {loop_id}")
            return True
        except Exception as e:
            self.logger.error(f"Error deleting checkpoint {checkpoint_id}: {str(e)}")
            return False
    
    def cleanup_old_checkpoints(self, loop_id: str, max_count: int = 10) -> int:
        """
        Clean up old checkpoints for a loop.
        
        Args:
            loop_id: ID of the loop
            max_count: Maximum number of checkpoints to keep
            
        Returns:
            Number of checkpoints removed
        """
        checkpoints = self.get_checkpoints(loop_id)
        if len(checkpoints) <= max_count:
            return 0
        
        # Sort by timestamp (newest first)
        checkpoints.sort(key=lambda c: c.timestamp, reverse=True)
        
        # Keep the newest max_count checkpoints
        checkpoints_to_remove = checkpoints[max_count:]
        removed_count = 0
        
        for checkpoint in checkpoints_to_remove:
            if self.delete_checkpoint(loop_id, checkpoint.checkpoint_id):
                removed_count += 1
        
        self.logger.info(f"Cleaned up {removed_count} old checkpoints for loop {loop_id}")
        return removed_count


class LoopRecoveryManager:
    """
    Manager for loop recovery operations.
    
    This class provides functionality to recover loops from failures,
    using various recovery strategies and actions.
    """
    
    def __init__(self, storage_dir: str = None):
        """
        Initialize the loop recovery manager.
        
        Args:
            storage_dir: Directory for recovery storage
        """
        self.storage_dir = storage_dir or os.path.join(os.getcwd(), "loop_recovery")
        self.logger = logging.getLogger("LoopRecoveryManager")
        self.checkpoint_manager = CheckpointManager(os.path.join(self.storage_dir, "checkpoints"))
        self.recovery_history = {}
        self.recovery_handlers = {}
        self.locks = {}
        
        # Ensure storage directory exists
        os.makedirs(self.storage_dir, exist_ok=True)
        self.logger.info(f"Initialized loop recovery manager with storage at {self.storage_dir}")
    
    def get_lock(self, loop_id: str) -> threading.RLock:
        """
        Get a lock for a specific loop.
        
        Args:
            loop_id: ID of the loop
            
        Returns:
            Lock for the loop
        """
        if loop_id not in self.locks:
            self.locks[loop_id] = threading.RLock()
        return self.locks[loop_id]
    
    def register_recovery_handler(self, termination_reason: TerminationReason, 
                                 handler: Callable[[LoopController, Dict[str, Any]], RecoveryResult]) -> None:
        """
        Register a recovery handler for a specific termination reason.
        
        Args:
            termination_reason: Termination reason to handle
            handler: Recovery handler function
        """
        self.recovery_handlers[termination_reason] = handler
        self.logger.info(f"Registered recovery handler for {termination_reason.value}")
    
    def create_checkpoint(self, loop_controller: LoopController, metadata: Dict[str, Any] = None) -> LoopCheckpoint:
        """
        Create a checkpoint for a loop.
        
        Args:
            loop_controller: Loop controller
            metadata: Optional metadata for the checkpoint
            
        Returns:
            Created checkpoint
        """
        state = loop_controller.get_state()
        return self.checkpoint_manager.create_checkpoint(loop_controller.loop_id, state, metadata)
    
    def recover_from_checkpoint(self, loop_controller: LoopController, 
                               checkpoint_id: str = None) -> RecoveryResult:
        """
        Recover a loop from a checkpoint.
        
        Args:
            loop_controller: Loop controller
            checkpoint_id: Optional checkpoint ID, uses latest if not provided
            
        Returns:
            Recovery result
        """
        with self.get_lock(loop_controller.loop_id):
            # Get checkpoint
            checkpoint = None
            if checkpoint_id:
                checkpoint = self.checkpoint_manager.get_checkpoint(loop_controller.loop_id, checkpoint_id)
            else:
                checkpoint = self.checkpoint_manager.get_latest_checkpoint(loop_controller.loop_id)
            
            if not checkpoint:
                self.logger.error(f"No checkpoint found for loop {loop_controller.loop_id}")
                return RecoveryResult(
                    success=False,
                    strategy=RecoveryStrategy.CHECKPOINT,
                    actions=[RecoveryAction.NOTIFY],
                    details="No checkpoint found"
                )
            
            try:
                # Clear current state first to ensure complete replacement
                current_state = loop_controller.get_state()
                keys_to_remove = list(current_state.keys())
                
                # Create a completely new state from the checkpoint
                with loop_controller.state_manager.transaction(loop_controller.loop_id) as transaction:
                    # First clear the entire state file
                    state_file = os.path.join(loop_controller.state_manager.storage_dir, f"{loop_controller.loop_id}.state.json")
                    if os.path.exists(state_file):
                        os.remove(state_file)
                    
                    # Then add all checkpoint state
                    for key, value in checkpoint.state.items():
                        transaction.add_change(key, value)
                
                self.logger.info(f"Recovered loop {loop_controller.loop_id} from checkpoint {checkpoint.checkpoint_id}")
                
                # Record recovery
                recovery_result = RecoveryResult(
                    success=True,
                    strategy=RecoveryStrategy.CHECKPOINT,
                    actions=[RecoveryAction.RETRY],
                    details=f"Recovered from checkpoint {checkpoint.checkpoint_id}"
                )
                self._record_recovery(loop_controller.loop_id, recovery_result)
                
                return recovery_result
                
            except Exception as e:
                self.logger.error(f"Error recovering loop {loop_controller.loop_id} from checkpoint: {str(e)}", exc_info=True)
                
                # Record recovery failure
                recovery_result = RecoveryResult(
                    success=False,
                    strategy=RecoveryStrategy.CHECKPOINT,
                    actions=[RecoveryAction.NOTIFY],
                    details=f"Recovery failed: {str(e)}"
                )
                self._record_recovery(loop_controller.loop_id, recovery_result)
                
                return recovery_result
    
    def recover_from_failure(self, loop_controller: LoopController) -> RecoveryResult:
        """
        Recover a loop from failure.
        
        Args:
            loop_controller: Loop controller
            
        Returns:
            Recovery result
        """
        with self.get_lock(loop_controller.loop_id):
            # Get current state
            state = loop_controller.get_state()
            termination_reason = state.get('termination_reason')
            
            if not termination_reason:
                self.logger.warning(f"Loop {loop_controller.loop_id} has no termination reason")
                return RecoveryResult(
                    success=False,
                    strategy=RecoveryStrategy.RESTART,
                    actions=[RecoveryAction.NOTIFY],
                    details="No termination reason found"
                )
            
            # Convert to enum
            try:
                reason_enum = TerminationReason(termination_reason)
            except ValueError:
                self.logger.error(f"Invalid termination reason: {termination_reason}")
                reason_enum = TerminationReason.ERROR
            
            # First, ensure we're not in a failed state anymore
            with loop_controller.state_manager.transaction(loop_controller.loop_id) as transaction:
                transaction.add_change('state', LoopState.INITIALIZED.value)
            
            # Check for specific handler
            if reason_enum in self.recovery_handlers:
                handler = self.recovery_handlers[reason_enum]
                self.logger.info(f"Using specific handler for {reason_enum.value}")
                recovery_result = handler(loop_controller, state)
                self._record_recovery(loop_controller.loop_id, recovery_result)
                return recovery_result
            
            # Default recovery strategy based on termination reason
            if reason_enum == TerminationReason.ERROR:
                return self._recover_from_error(loop_controller, state)
            elif reason_enum == TerminationReason.TIMEOUT:
                return self._recover_from_timeout(loop_controller, state)
            elif reason_enum == TerminationReason.RESOURCE_LIMIT:
                return self._recover_from_resource_limit(loop_controller, state)
            elif reason_enum == TerminationReason.DEPENDENCY_FAILURE:
                return self._recover_from_dependency_failure(loop_controller, state)
            else:
                # For other reasons, try checkpoint recovery
                return self.recover_from_checkpoint(loop_controller)
    
    def _recover_from_error(self, loop_controller: LoopController, state: Dict[str, Any]) -> RecoveryResult:
        """
        Recover from an error.
        
        Args:
            loop_controller: Loop controller
            state: Current state
            
        Returns:
            Recovery result
        """
        error_count = state.get('error_count', 0)
        
        # If too many errors, don't retry
        if error_count >= 5:  # Configurable threshold
            recovery_result = RecoveryResult(
                success=False,
                strategy=RecoveryStrategy.TERMINATE,
                actions=[RecoveryAction.NOTIFY, RecoveryAction.TERMINATE],
                details=f"Too many errors: {error_count}"
            )
            self._record_recovery(loop_controller.loop_id, recovery_result)
            return recovery_result
        
        # Try checkpoint recovery
        checkpoint = self.checkpoint_manager.get_latest_checkpoint(loop_controller.loop_id)
        if checkpoint:
            return self.recover_from_checkpoint(loop_controller)
        
        # If no checkpoint, restart
        try:
            # Create a completely new state file
            state_file = os.path.join(loop_controller.state_manager.storage_dir, f"{loop_controller.loop_id}.state.json")
            if os.path.exists(state_file):
                os.remove(state_file)
            
            # Reset error count and state
            with loop_controller.state_manager.transaction(loop_controller.loop_id) as transaction:
                transaction.add_change('state', LoopState.INITIALIZED.value)
                transaction.add_change('created_at', time.time())
                transaction.add_change('current_iteration', 0)
                transaction.add_change('max_iterations', None)
                transaction.add_change('start_time', None)
                transaction.add_change('end_time', None)
                transaction.add_change('termination_reason', None)
                transaction.add_change('resource_usage', {})
                transaction.add_change('execution_history', [])
                transaction.add_change('error_count', 0)
                transaction.add_change('metadata', {})
            
            recovery_result = RecoveryResult(
                success=True,
                strategy=RecoveryStrategy.RESTART,
                actions=[RecoveryAction.RETRY],
                details="Restarted loop after error"
            )
            self._record_recovery(loop_controller.loop_id, recovery_result)
            return recovery_result
            
        except Exception as e:
            self.logger.error(f"Error restarting loop {loop_controller.loop_id}: {str(e)}", exc_info=True)
            
            recovery_result = RecoveryResult(
                success=False,
                strategy=RecoveryStrategy.RESTART,
                actions=[RecoveryAction.NOTIFY],
                details=f"Restart failed: {str(e)}"
            )
            self._record_recovery(loop_controller.loop_id, recovery_result)
            return recovery_result
    
    def _recover_from_timeout(self, loop_controller: LoopController, state: Dict[str, Any]) -> RecoveryResult:
        """
        Recover from a timeout.
        
        Args:
            loop_controller: Loop controller
            state: Current state
            
        Returns:
            Recovery result
        """
        # Try checkpoint recovery
        checkpoint = self.checkpoint_manager.get_latest_checkpoint(loop_controller.loop_id)
        if checkpoint:
            return self.recover_from_checkpoint(loop_controller)
        
        # If no checkpoint, resume from current iteration
        try:
            current_iteration = state.get('current_iteration', 0)
            
            with loop_controller.state_manager.transaction(loop_controller.loop_id) as transaction:
                transaction.add_change('state', LoopState.INITIALIZED.value)
                transaction.add_change('end_time', None)
                transaction.add_change('termination_reason', None)
            
            recovery_result = RecoveryResult(
                success=True,
                strategy=RecoveryStrategy.RESUME,
                actions=[RecoveryAction.RETRY],
                details=f"Resumed from iteration {current_iteration} after timeout"
            )
            self._record_recovery(loop_controller.loop_id, recovery_result)
            return recovery_result
            
        except Exception as e:
            self.logger.error(f"Error resuming loop {loop_controller.loop_id}: {str(e)}", exc_info=True)
            
            recovery_result = RecoveryResult(
                success=False,
                strategy=RecoveryStrategy.RESUME,
                actions=[RecoveryAction.NOTIFY],
                details=f"Resume failed: {str(e)}"
            )
            self._record_recovery(loop_controller.loop_id, recovery_result)
            return recovery_result
    
    def _recover_from_resource_limit(self, loop_controller: LoopController, state: Dict[str, Any]) -> RecoveryResult:
        """
        Recover from a resource limit.
        
        Args:
            loop_controller: Loop controller
            state: Current state
            
        Returns:
            Recovery result
        """
        # Try checkpoint recovery
        checkpoint = self.checkpoint_manager.get_latest_checkpoint(loop_controller.loop_id)
        if checkpoint:
            return self.recover_from_checkpoint(loop_controller)
        
        # If no checkpoint, notify and terminate
        recovery_result = RecoveryResult(
            success=False,
            strategy=RecoveryStrategy.TERMINATE,
            actions=[RecoveryAction.NOTIFY, RecoveryAction.TERMINATE],
            details="Resource limit exceeded, manual intervention required"
        )
        self._record_recovery(loop_controller.loop_id, recovery_result)
        return recovery_result
    
    def _recover_from_dependency_failure(self, loop_controller: LoopController, state: Dict[str, Any]) -> RecoveryResult:
        """
        Recover from a dependency failure.
        
        Args:
            loop_controller: Loop controller
            state: Current state
            
        Returns:
            Recovery result
        """
        # Try checkpoint recovery
        checkpoint = self.checkpoint_manager.get_latest_checkpoint(loop_controller.loop_id)
        if checkpoint:
            return self.recover_from_checkpoint(loop_controller)
        
        # If no checkpoint, notify and terminate
        recovery_result = RecoveryResult(
            success=False,
            strategy=RecoveryStrategy.TERMINATE,
            actions=[RecoveryAction.NOTIFY, RecoveryAction.TERMINATE],
            details="Dependency failure, manual intervention required"
        )
        self._record_recovery(loop_controller.loop_id, recovery_result)
        return recovery_result
    
    def _record_recovery(self, loop_id: str, result: RecoveryResult) -> None:
        """
        Record a recovery operation.
        
        Args:
            loop_id: ID of the loop
            result: Recovery result
        """
        if loop_id not in self.recovery_history:
            self.recovery_history[loop_id] = []
        
        self.recovery_history[loop_id].append(result)
        
        # Save to file
        history_dir = os.path.join(self.storage_dir, "history", loop_id)
        os.makedirs(history_dir, exist_ok=True)
        
        history_file = os.path.join(history_dir, f"{int(result.timestamp)}.json")
        
        try:
            with open(history_file, 'w') as f:
                json.dump(result.to_dict(), f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving recovery history: {str(e)}")
    
    def get_recovery_history(self, loop_id: str) -> List[RecoveryResult]:
        """
        Get the recovery history for a loop.
        
        Args:
            loop_id: ID of the loop
            
        Returns:
            List of recovery results
        """
        return self.recovery_history.get(loop_id, [])


class RecoverableLoopController(LoopController):
    """
    Enhanced loop controller with recovery capabilities.
    
    This class extends the LoopController with automatic recovery
    and checkpoint functionality.
    """
    
    def __init__(self, loop_id: str = None, storage_dir: str = None):
        """
        Initialize the recoverable loop controller.
        
        Args:
            loop_id: ID of the loop, generated if not provided
            storage_dir: Directory for state storage
        """
        super().__init__(loop_id, storage_dir)
        
        # Initialize recovery manager
        recovery_dir = os.path.join(os.path.dirname(storage_dir or os.getcwd()), "loop_recovery")
        self.recovery_manager = LoopRecoveryManager(recovery_dir)
        
        # Checkpoint settings
        self.checkpoint_interval = 10  # Create checkpoint every 10 iterations
        self.auto_recovery = True  # Automatically recover from failures
        
        self.logger.info(f"Initialized recoverable loop controller for loop {self.loop_id}")
    
    def set_checkpoint_interval(self, interval: int) -> None:
        """
        Set the checkpoint interval.
        
        Args:
            interval: Number of iterations between checkpoints
        """
        self.checkpoint_interval = interval
        self.logger.info(f"Set checkpoint interval to {interval} iterations")
    
    def set_auto_recovery(self, enabled: bool) -> None:
        """
        Enable or disable automatic recovery.
        
        Args:
            enabled: Whether to enable automatic recovery
        """
        self.auto_recovery = enabled
        self.logger.info(f"{'Enabled' if enabled else 'Disabled'} automatic recovery")
    
    def create_checkpoint(self, metadata: Dict[str, Any] = None) -> LoopCheckpoint:
        """
        Create a checkpoint of the current state.
        
        Args:
            metadata: Optional metadata for the checkpoint
            
        Returns:
            Created checkpoint
        """
        return self.recovery_manager.create_checkpoint(self, metadata)
    
    def recover_from_checkpoint(self, checkpoint_id: str = None) -> RecoveryResult:
        """
        Recover from a checkpoint.
        
        Args:
            checkpoint_id: Optional checkpoint ID, uses latest if not provided
            
        Returns:
            Recovery result
        """
        return self.recovery_manager.recover_from_checkpoint(self, checkpoint_id)
    
    def recover_from_failure(self) -> RecoveryResult:
        """
        Recover from a failure.
        
        Returns:
            Recovery result
        """
        return self.recovery_manager.recover_from_failure(self)
    
    def _execute_loop(self, loop_func: Callable[[Dict[str, Any]], Any]) -> None:
        """
        Execute the loop function with checkpointing and recovery.
        
        Args:
            loop_func: Function to execute in the loop
        """
        try:
            while not self.stop_event.is_set():
                # Get current state
                current_state = self.get_state()
                current_iteration = current_state.get('current_iteration', 0)
                
                # Create checkpoint if needed
                if self.checkpoint_interval > 0 and current_iteration % self.checkpoint_interval == 0 and current_iteration > 0:
                    self.create_checkpoint({
                        'automatic': True,
                        'iteration': current_iteration
                    })
                
                # Check termination conditions
                should_terminate, reason, termination_reason = self.check_termination_conditions()
                if should_terminate:
                    self.logger.info(f"Loop {self.loop_id} terminating: {reason}")
                    self._terminate(termination_reason, reason)
                    break
                
                # Execute loop function
                try:
                    start_time = time.time()
                    result = loop_func(current_state)
                    execution_time = time.time() - start_time
                    
                    # Record execution
                    execution_history = current_state.get('execution_history', []).copy()
                    execution_history.append({
                        'iteration': current_iteration,
                        'timestamp': start_time,
                        'execution_time': execution_time,
                        'success': True
                    })
                    
                    # Update state
                    self.update_state({
                        'current_iteration': current_iteration + 1,
                        'last_execution_time': execution_time,
                        'last_execution_result': result,
                        'execution_history': execution_history[-100:]  # Keep last 100 executions
                    })
                    
                except Exception as e:
                    # Record error
                    error_count = current_state.get('error_count', 0) + 1
                    execution_history = current_state.get('execution_history', []).copy()
                    execution_history.append({
                        'iteration': current_iteration,
                        'timestamp': time.time(),
                        'success': False,
                        'error': str(e),
                        'traceback': traceback.format_exc()
                    })
                    
                    # Update state
                    self.update_state({
                        'error_count': error_count,
                        'last_error': str(e),
                        'last_error_traceback': traceback.format_exc(),
                        'execution_history': execution_history[-100:]  # Keep last 100 executions
                    })
                    
                    self.logger.error(f"Error in loop {self.loop_id} iteration {current_iteration}: {str(e)}")
                    
                    # Terminate if too many errors
                    if error_count >= 3:  # Configurable threshold
                        self._terminate(TerminationReason.ERROR, f"Too many errors: {error_count}")
                        
                        # Try to recover if auto-recovery is enabled
                        if self.auto_recovery:
                            recovery_result = self.recover_from_failure()
                            if recovery_result.success:
                                self.logger.info(f"Auto-recovery successful: {recovery_result.details}")
                                continue
                            else:
                                self.logger.error(f"Auto-recovery failed: {recovery_result.details}")
                        
                        break
            
            # Normal completion if not terminated for other reasons
            current_state = self.get_state()
            if current_state.get('state') == LoopState.RUNNING.value:
                self._terminate(TerminationReason.COMPLETED, "Loop completed normally")
                
        except Exception as e:
            self.logger.error(f"Unhandled exception in loop {self.loop_id}: {str(e)}", exc_info=True)
            self._terminate(TerminationReason.ERROR, f"Unhandled exception: {str(e)}")
            
            # Try to recover if auto-recovery is enabled
            if self.auto_recovery:
                recovery_result = self.recover_from_failure()
                if recovery_result.success:
                    self.logger.info(f"Auto-recovery successful: {recovery_result.details}")
                    # Restart execution
                    self._execute_loop(loop_func)
                else:
                    self.logger.error(f"Auto-recovery failed: {recovery_result.details}")
