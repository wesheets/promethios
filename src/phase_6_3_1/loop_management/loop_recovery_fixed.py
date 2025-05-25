"""
Enhanced Loop Recovery Manager for Phase 6.3.1 remediation.

This module provides robust recovery mechanisms for loop failures,
including checkpoint-based recovery and automatic error handling.
"""

import os
import time
import json
import uuid
import logging
import threading
from enum import Enum
from typing import Dict, Any, List, Tuple, Optional, Set, Callable

from loop_controller import (
    LoopController, LoopState, TerminationReason, 
    StatePersistenceManager
)


class RecoveryStrategy(Enum):
    """Recovery strategy for loop failures."""
    CHECKPOINT = "checkpoint"
    RESTART = "restart"
    ROLLBACK = "rollback"
    TERMINATE = "terminate"


class RecoveryAction(Enum):
    """Action to take after recovery."""
    RETRY = "retry"
    NOTIFY = "notify"
    TERMINATE = "terminate"
    ESCALATE = "escalate"


class RecoveryResult:
    """Result of a recovery operation."""
    
    def __init__(self, success: bool, strategy: RecoveryStrategy, 
                actions: List[RecoveryAction], details: str = None):
        """
        Initialize a recovery result.
        
        Args:
            success: Whether recovery was successful
            strategy: Recovery strategy used
            actions: Actions to take
            details: Additional details
        """
        self.success = success
        self.strategy = strategy
        self.actions = actions
        self.details = details
        self.timestamp = time.time()


class Checkpoint:
    """Checkpoint for loop recovery."""
    
    def __init__(self, loop_id: str, checkpoint_id: str, state: Dict[str, Any], 
                metadata: Dict[str, Any] = None):
        """
        Initialize a checkpoint.
        
        Args:
            loop_id: Loop identifier
            checkpoint_id: Checkpoint identifier
            state: Loop state
            metadata: Additional metadata
        """
        self.loop_id = loop_id
        self.checkpoint_id = checkpoint_id
        self.state = state
        self.metadata = metadata or {}
        self.timestamp = time.time()
    
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
    def from_dict(cls, data: Dict[str, Any]) -> 'Checkpoint':
        """
        Create a checkpoint from a dictionary.
        
        Args:
            data: Dictionary representation of a checkpoint
            
        Returns:
            Checkpoint instance
        """
        return cls(
            loop_id=data['loop_id'],
            checkpoint_id=data['checkpoint_id'],
            state=data['state'],
            metadata=data.get('metadata', {}),
        )


class CheckpointManager:
    """
    Manages checkpoints for loop recovery.
    
    This class provides checkpoint creation, storage, and retrieval.
    """
    
    def __init__(self, storage_dir: str):
        """
        Initialize the checkpoint manager.
        
        Args:
            storage_dir: Directory for storing checkpoints
        """
        self.storage_dir = storage_dir
        self.logger = logging.getLogger(__name__)
        
        # Create storage directory
        os.makedirs(storage_dir, exist_ok=True)
    
    def create_checkpoint(self, loop_id: str, state: Dict[str, Any], 
                         metadata: Dict[str, Any] = None) -> Checkpoint:
        """
        Create a checkpoint.
        
        Args:
            loop_id: Loop identifier
            state: Loop state
            metadata: Additional metadata
            
        Returns:
            Created checkpoint
        """
        checkpoint_id = str(uuid.uuid4())
        checkpoint = Checkpoint(loop_id, checkpoint_id, state, metadata)
        
        # Create loop directory
        loop_dir = os.path.join(self.storage_dir, loop_id)
        os.makedirs(loop_dir, exist_ok=True)
        
        # Save checkpoint
        checkpoint_file = os.path.join(loop_dir, f"{checkpoint_id}.json")
        try:
            with open(checkpoint_file, 'w') as f:
                json.dump(checkpoint.to_dict(), f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving checkpoint {checkpoint_id}: {str(e)}", exc_info=True)
        
        return checkpoint
    
    def get_checkpoint(self, loop_id: str, checkpoint_id: str) -> Optional[Checkpoint]:
        """
        Get a checkpoint.
        
        Args:
            loop_id: Loop identifier
            checkpoint_id: Checkpoint identifier
            
        Returns:
            Checkpoint if found, None otherwise
        """
        checkpoint_file = os.path.join(self.storage_dir, loop_id, f"{checkpoint_id}.json")
        if not os.path.exists(checkpoint_file):
            return None
        
        try:
            with open(checkpoint_file, 'r') as f:
                data = json.load(f)
                return Checkpoint.from_dict(data)
        except Exception as e:
            self.logger.error(f"Error loading checkpoint {checkpoint_id}: {str(e)}", exc_info=True)
            return None
    
    def get_latest_checkpoint(self, loop_id: str) -> Optional[Checkpoint]:
        """
        Get the latest checkpoint for a loop.
        
        Args:
            loop_id: Loop identifier
            
        Returns:
            Latest checkpoint if found, None otherwise
        """
        loop_dir = os.path.join(self.storage_dir, loop_id)
        if not os.path.exists(loop_dir):
            return None
        
        checkpoints = []
        for filename in os.listdir(loop_dir):
            if not filename.endswith('.json'):
                continue
            
            checkpoint_id = filename[:-5]  # Remove .json
            checkpoint = self.get_checkpoint(loop_id, checkpoint_id)
            if checkpoint:
                checkpoints.append(checkpoint)
        
        if not checkpoints:
            return None
        
        # Sort by timestamp (newest first)
        checkpoints.sort(key=lambda c: c.timestamp, reverse=True)
        return checkpoints[0]
    
    def get_checkpoints(self, loop_id: str) -> List[Checkpoint]:
        """
        Get all checkpoints for a loop.
        
        Args:
            loop_id: Loop identifier
            
        Returns:
            List of checkpoints
        """
        loop_dir = os.path.join(self.storage_dir, loop_id)
        if not os.path.exists(loop_dir):
            return []
        
        checkpoints = []
        for filename in os.listdir(loop_dir):
            if not filename.endswith('.json'):
                continue
            
            checkpoint_id = filename[:-5]  # Remove .json
            checkpoint = self.get_checkpoint(loop_id, checkpoint_id)
            if checkpoint:
                checkpoints.append(checkpoint)
        
        # Sort by timestamp (newest first)
        checkpoints.sort(key=lambda c: c.timestamp, reverse=True)
        return checkpoints
    
    def delete_checkpoint(self, loop_id: str, checkpoint_id: str) -> bool:
        """
        Delete a checkpoint.
        
        Args:
            loop_id: Loop identifier
            checkpoint_id: Checkpoint identifier
            
        Returns:
            True if successful, False otherwise
        """
        checkpoint_file = os.path.join(self.storage_dir, loop_id, f"{checkpoint_id}.json")
        if not os.path.exists(checkpoint_file):
            return False
        
        try:
            os.remove(checkpoint_file)
            return True
        except Exception as e:
            self.logger.error(f"Error deleting checkpoint {checkpoint_id}: {str(e)}", exc_info=True)
            return False
    
    def cleanup_old_checkpoints(self, loop_id: str, max_checkpoints: int = 10) -> int:
        """
        Clean up old checkpoints.
        
        Args:
            loop_id: Loop identifier
            max_checkpoints: Maximum number of checkpoints to keep
            
        Returns:
            Number of checkpoints removed
        """
        checkpoints = self.get_checkpoints(loop_id)
        if len(checkpoints) <= max_checkpoints:
            return 0
        
        # Keep the newest max_checkpoints
        to_remove = checkpoints[max_checkpoints:]
        removed = 0
        
        for checkpoint in to_remove:
            if self.delete_checkpoint(loop_id, checkpoint.checkpoint_id):
                removed += 1
        
        return removed


class LoopRecoveryManager:
    """
    Manages recovery for loop failures.
    
    This class provides recovery strategies for different failure scenarios.
    """
    
    def __init__(self, storage_dir: str):
        """
        Initialize the recovery manager.
        
        Args:
            storage_dir: Directory for storing recovery data
        """
        self.storage_dir = storage_dir
        self.logger = logging.getLogger(__name__)
        self.checkpoint_manager = CheckpointManager(os.path.join(storage_dir, "checkpoints"))
        self.locks = {}
        self.recovery_handlers = {}
        
        # Create storage directories
        os.makedirs(storage_dir, exist_ok=True)
        os.makedirs(os.path.join(storage_dir, "recovery_history"), exist_ok=True)
    
    def get_lock(self, loop_id: str) -> threading.RLock:
        """
        Get a lock for a specific loop.
        
        Args:
            loop_id: Loop identifier
            
        Returns:
            Thread lock for the loop
        """
        if loop_id not in self.locks:
            self.locks[loop_id] = threading.RLock()
        return self.locks[loop_id]
    
    def register_recovery_handler(self, reason: TerminationReason, 
                                 handler: Callable[[LoopController, Dict[str, Any]], RecoveryResult]) -> None:
        """
        Register a recovery handler for a specific termination reason.
        
        Args:
            reason: Termination reason
            handler: Recovery handler function
        """
        self.recovery_handlers[reason] = handler
    
    def create_checkpoint(self, loop_controller: LoopController, 
                         metadata: Dict[str, Any] = None) -> Checkpoint:
        """
        Create a checkpoint for a loop.
        
        Args:
            loop_controller: Loop controller
            metadata: Additional metadata
            
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
        # Use a timeout to prevent deadlocks
        lock = self.get_lock(loop_controller.loop_id)
        if not lock.acquire(timeout=5.0):
            self.logger.error(f"Timeout acquiring lock for loop {loop_controller.loop_id}")
            return RecoveryResult(
                success=False,
                strategy=RecoveryStrategy.CHECKPOINT,
                actions=[RecoveryAction.NOTIFY],
                details="Timeout acquiring lock"
            )
        
        try:
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
                # Create a completely new state from the checkpoint
                state_file = os.path.join(loop_controller.state_manager.storage_dir, f"{loop_controller.loop_id}.state.json")
                if os.path.exists(state_file):
                    try:
                        os.remove(state_file)
                    except Exception as e:
                        self.logger.warning(f"Could not remove state file: {str(e)}")
                
                # Write the checkpoint state directly to avoid transaction issues
                try:
                    with open(state_file, 'w') as f:
                        json.dump(checkpoint.state, f, indent=2)
                except Exception as e:
                    self.logger.error(f"Error writing checkpoint state: {str(e)}")
                    raise
                
                # Clear any cached state
                if hasattr(loop_controller.state_manager, "clear_cache"):
                    loop_controller.state_manager.clear_cache(loop_controller.loop_id)
                
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
        finally:
            lock.release()
    
    def recover_from_failure(self, loop_controller: LoopController) -> RecoveryResult:
        """
        Recover a loop from failure.
        
        Args:
            loop_controller: Loop controller
            
        Returns:
            Recovery result
        """
        # Use a timeout to prevent deadlocks
        lock = self.get_lock(loop_controller.loop_id)
        if not lock.acquire(timeout=5.0):
            self.logger.error(f"Timeout acquiring lock for loop {loop_controller.loop_id}")
            return RecoveryResult(
                success=False,
                strategy=RecoveryStrategy.RESTART,
                actions=[RecoveryAction.NOTIFY],
                details="Timeout acquiring lock"
            )
        
        try:
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
            # Write directly to the state file to avoid transaction issues
            state_file = os.path.join(loop_controller.state_manager.storage_dir, f"{loop_controller.loop_id}.state.json")
            if os.path.exists(state_file):
                try:
                    with open(state_file, 'r') as f:
                        current_state = json.load(f)
                    
                    current_state['state'] = LoopState.INITIALIZED.value
                    
                    with open(state_file, 'w') as f:
                        json.dump(current_state, f, indent=2)
                    
                    # Clear any cached state
                    if hasattr(loop_controller.state_manager, "clear_cache"):
                        loop_controller.state_manager.clear_cache(loop_controller.loop_id)
                except Exception as e:
                    self.logger.error(f"Error updating state file: {str(e)}")
            
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
        finally:
            lock.release()
    
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
                try:
                    os.remove(state_file)
                except Exception as e:
                    self.logger.warning(f"Could not remove state file: {str(e)}")
            
            # Create a new state directly
            new_state = {
                'state': LoopState.INITIALIZED.value,
                'created_at': time.time(),
                'current_iteration': 0,
                'max_iterations': None,
                'start_time': None,
                'end_time': None,
                'termination_reason': None,
                'resource_usage': {},
                'execution_history': [],
                'error_count': 0,
                'metadata': {}
            }
            
            try:
                with open(state_file, 'w') as f:
                    json.dump(new_state, f, indent=2)
            except Exception as e:
                self.logger.error(f"Error writing new state: {str(e)}")
                raise
            
            # Clear any cached state
            if hasattr(loop_controller.state_manager, "clear_cache"):
                loop_controller.state_manager.clear_cache(loop_controller.loop_id)
            
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
        
        # If no checkpoint, restart
        try:
            # Reset state
            with loop_controller.state_manager.transaction(loop_controller.loop_id) as transaction:
                transaction.add_change('state', LoopState.INITIALIZED.value)
                transaction.add_change('current_iteration', 0)
                transaction.add_change('start_time', None)
                transaction.add_change('end_time', None)
                transaction.add_change('termination_reason', None)
            
            recovery_result = RecoveryResult(
                success=True,
                strategy=RecoveryStrategy.RESTART,
                actions=[RecoveryAction.RETRY],
                details="Restarted loop after timeout"
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
        
        # If no checkpoint, restart with resource monitoring
        try:
            # Reset state
            with loop_controller.state_manager.transaction(loop_controller.loop_id) as transaction:
                transaction.add_change('state', LoopState.INITIALIZED.value)
                transaction.add_change('current_iteration', 0)
                transaction.add_change('start_time', None)
                transaction.add_change('end_time', None)
                transaction.add_change('termination_reason', None)
                transaction.add_change('resource_usage', {})
            
            recovery_result = RecoveryResult(
                success=True,
                strategy=RecoveryStrategy.RESTART,
                actions=[RecoveryAction.RETRY, RecoveryAction.NOTIFY],
                details="Restarted loop after resource limit"
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
    
    def _recover_from_dependency_failure(self, loop_controller: LoopController, state: Dict[str, Any]) -> RecoveryResult:
        """
        Recover from a dependency failure.
        
        Args:
            loop_controller: Loop controller
            state: Current state
            
        Returns:
            Recovery result
        """
        # Dependency failures are more serious, notify and wait for manual intervention
        recovery_result = RecoveryResult(
            success=False,
            strategy=RecoveryStrategy.TERMINATE,
            actions=[RecoveryAction.NOTIFY, RecoveryAction.ESCALATE],
            details="Dependency failure requires manual intervention"
        )
        self._record_recovery(loop_controller.loop_id, recovery_result)
        return recovery_result
    
    def _record_recovery(self, loop_id: str, result: RecoveryResult) -> None:
        """
        Record a recovery operation.
        
        Args:
            loop_id: Loop identifier
            result: Recovery result
        """
        recovery_dir = os.path.join(self.storage_dir, "recovery_history", loop_id)
        os.makedirs(recovery_dir, exist_ok=True)
        
        recovery_id = str(uuid.uuid4())
        recovery_file = os.path.join(recovery_dir, f"{recovery_id}.json")
        
        try:
            with open(recovery_file, 'w') as f:
                json.dump({
                    'recovery_id': recovery_id,
                    'loop_id': loop_id,
                    'success': result.success,
                    'strategy': result.strategy.value,
                    'actions': [action.value for action in result.actions],
                    'details': result.details,
                    'timestamp': result.timestamp
                }, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error recording recovery {recovery_id}: {str(e)}", exc_info=True)
    
    def get_recovery_history(self, loop_id: str) -> List[RecoveryResult]:
        """
        Get the recovery history for a loop.
        
        Args:
            loop_id: Loop identifier
            
        Returns:
            List of recovery results in chronological order
        """
        recovery_dir = os.path.join(self.storage_dir, "recovery_history", loop_id)
        if not os.path.exists(recovery_dir):
            return []
        
        results = []
        for filename in os.listdir(recovery_dir):
            if not filename.endswith('.json'):
                continue
            
            try:
                with open(os.path.join(recovery_dir, filename), 'r') as f:
                    data = json.load(f)
                    result = RecoveryResult(
                        success=data['success'],
                        strategy=RecoveryStrategy(data['strategy']),
                        actions=[RecoveryAction(action) for action in data['actions']],
                        details=data.get('details')
                    )
                    result.timestamp = data.get('timestamp', 0)
                    results.append(result)
            except Exception as e:
                self.logger.error(f"Error loading recovery {filename}: {str(e)}", exc_info=True)
        
        # Sort by timestamp
        results.sort(key=lambda r: r.timestamp)
        return results


class RecoverableLoopController(LoopController):
    """
    Loop controller with automatic recovery capabilities.
    
    This class extends LoopController with checkpoint-based recovery
    and automatic error handling.
    """
    
    def __init__(self, loop_id: str, storage_dir: str = None):
        """
        Initialize a recoverable loop controller.
        
        Args:
            loop_id: Unique identifier for the loop
            storage_dir: Directory for storing state, defaults to /tmp/loop_state
        """
        super().__init__(loop_id, storage_dir)
        
        self.recovery_manager = LoopRecoveryManager(
            os.path.join(os.path.dirname(self.storage_dir), "recovery")
        )
        
        self.checkpoint_interval = 0  # 0 means no automatic checkpointing
        self.auto_recovery = False
        self.last_checkpoint_iteration = -1
    
    def set_checkpoint_interval(self, interval: int) -> None:
        """
        Set the checkpoint interval.
        
        Args:
            interval: Number of iterations between checkpoints
        """
        self.checkpoint_interval = interval
    
    def set_auto_recovery(self, enabled: bool) -> None:
        """
        Enable or disable automatic recovery.
        
        Args:
            enabled: Whether to enable automatic recovery
        """
        self.auto_recovery = enabled
    
    def create_checkpoint(self, metadata: Dict[str, Any] = None) -> Checkpoint:
        """
        Create a checkpoint.
        
        Args:
            metadata: Additional metadata
            
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
        Execute the loop function with automatic checkpointing and recovery.
        
        Args:
            loop_func: Function to execute in each iteration
        """
        try:
            while not self.stop_event.is_set():
                # Get current state
                with self.state_lock:
                    state = self.get_state()
                    current_iteration = state.get('current_iteration', 0)
                    
                    # Check termination conditions
                    for condition in self.termination_conditions.values():
                        is_met, reason = condition.check(state)
                        if is_met:
                            self._terminate(TerminationReason.CONDITION_MET, reason)
                            return
                
                # Create checkpoint if needed
                if (self.checkpoint_interval > 0 and 
                    current_iteration > 0 and 
                    current_iteration % self.checkpoint_interval == 0 and
                    current_iteration != self.last_checkpoint_iteration):
                    try:
                        self.create_checkpoint({"automatic": True})
                        self.last_checkpoint_iteration = current_iteration
                    except Exception as e:
                        self.logger.error(f"Error creating checkpoint: {str(e)}", exc_info=True)
                
                # Execute iteration
                try:
                    start_time = time.time()
                    result = loop_func(state)
                    execution_time = time.time() - start_time
                    
                    # Record execution
                    self._record_execution(current_iteration, True, execution_time, result)
                    
                    # Update iteration counter
                    with self.state_lock:
                        with self.state_manager.transaction(self.loop_id) as transaction:
                            transaction.add_change('current_iteration', current_iteration + 1)
                    
                    # Check max iterations
                    max_iterations = state.get('max_iterations')
                    if max_iterations is not None and current_iteration + 1 >= max_iterations:
                        self._terminate(TerminationReason.MAX_ITERATIONS)
                        return
                    
                except Exception as e:
                    self.logger.error(f"Error in loop {self.loop_id} iteration {current_iteration}: {str(e)}", exc_info=True)
                    
                    # Record error
                    self._record_execution(current_iteration, False, 0, None, str(e))
                    
                    # Update error count
                    with self.state_lock:
                        state = self.get_state()
                        error_count = state.get('error_count', 0) + 1
                        
                        with self.state_manager.transaction(self.loop_id) as transaction:
                            transaction.add_change('error_count', error_count)
                            transaction.add_change('last_error', str(e))
                        
                        # Check error threshold
                        if error_count >= 3:  # Configurable threshold
                            self._terminate(TerminationReason.ERROR, str(e))
                            
                            # Try automatic recovery if enabled
                            if self.auto_recovery:
                                try:
                                    recovery_result = self.recover_from_failure()
                                    if recovery_result.success:
                                        # Restart the loop
                                        self.start(loop_func)
                                    else:
                                        self.logger.error(f"Automatic recovery failed: {recovery_result.details}")
                                except Exception as recovery_error:
                                    self.logger.error(f"Error during automatic recovery: {str(recovery_error)}", exc_info=True)
                            
                            return
        
        except Exception as e:
            self.logger.error(f"Unhandled error in loop {self.loop_id}: {str(e)}", exc_info=True)
            self._terminate(TerminationReason.ERROR, str(e))
        
        finally:
            # Ensure state is updated if thread exits
            if not self.stop_event.is_set():
                self._terminate(TerminationReason.COMPLETED)
