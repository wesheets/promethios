"""
Enhanced Loop Controller for Phase 6.3.1 remediation.

This module provides robust loop control with transactional state persistence,
termination conditions, and execution tracking.
"""

import os
import time
import uuid
import json
import logging
import threading
from enum import Enum
from typing import Dict, Any, List, Tuple, Callable, Optional, Set


class LoopState(Enum):
    """Loop execution state."""
    INITIALIZED = "initialized"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    ABORTED = "aborted"


class TerminationReason(Enum):
    """Reason for loop termination."""
    COMPLETED = "completed"
    MAX_ITERATIONS = "max_iterations"
    TIMEOUT = "timeout"
    RESOURCE_LIMIT = "resource_limit"
    CONDITION_MET = "condition_met"
    ERROR = "error"
    DEPENDENCY_FAILURE = "dependency_failure"
    MANUAL = "manual"


class TransactionStatus(Enum):
    """Status of a state transaction."""
    PENDING = "pending"
    COMMITTED = "committed"
    ROLLED_BACK = "rolled_back"
    FAILED = "failed"


class StateTransaction:
    """
    Represents a transactional update to loop state.
    
    This class provides ACID properties for state updates:
    - Atomicity: All state changes are applied together or none at all
    - Consistency: State transitions follow defined rules
    - Isolation: Concurrent state changes don't interfere
    - Durability: Committed changes are persisted
    """
    
    def __init__(self, loop_id: str, transaction_id: str = None):
        """
        Initialize a state transaction.
        
        Args:
            loop_id: ID of the loop this transaction belongs to
            transaction_id: Optional transaction ID, generated if not provided
        """
        self.loop_id = loop_id
        self.transaction_id = transaction_id or str(uuid.uuid4())
        self.status = TransactionStatus.PENDING
        self.changes = {}
        self.previous_values = {}
        self.timestamp = time.time()
        self.commit_timestamp = None
        self.rollback_timestamp = None
        self.metadata = {}
    
    def add_change(self, key: str, value: Any, previous_value: Any = None) -> None:
        """
        Add a state change to the transaction.
        
        Args:
            key: State key to change
            value: New value
            previous_value: Previous value (for rollback)
        """
        self.changes[key] = value
        if previous_value is not None:
            self.previous_values[key] = previous_value
    
    def commit(self) -> None:
        """Commit the transaction."""
        self.status = TransactionStatus.COMMITTED
        self.commit_timestamp = time.time()
    
    def rollback(self) -> None:
        """Roll back the transaction."""
        self.status = TransactionStatus.ROLLED_BACK
        self.rollback_timestamp = time.time()
    
    def fail(self) -> None:
        """Mark the transaction as failed."""
        self.status = TransactionStatus.FAILED
        self.rollback_timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the transaction to a dictionary.
        
        Returns:
            Dictionary representation of the transaction
        """
        return {
            'loop_id': self.loop_id,
            'transaction_id': self.transaction_id,
            'status': self.status.value,
            'changes': self.changes,
            'previous_values': self.previous_values,
            'timestamp': self.timestamp,
            'commit_timestamp': self.commit_timestamp,
            'rollback_timestamp': self.rollback_timestamp,
            'metadata': self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StateTransaction':
        """
        Create a transaction from a dictionary.
        
        Args:
            data: Dictionary representation of a transaction
            
        Returns:
            StateTransaction instance
        """
        transaction = cls(
            loop_id=data['loop_id'],
            transaction_id=data['transaction_id']
        )
        transaction.status = TransactionStatus(data['status'])
        transaction.changes = data['changes']
        transaction.previous_values = data['previous_values']
        transaction.timestamp = data['timestamp']
        transaction.commit_timestamp = data.get('commit_timestamp')
        transaction.rollback_timestamp = data.get('rollback_timestamp')
        transaction.metadata = data.get('metadata', {})
        return transaction


class TerminationCondition:
    """Base class for loop termination conditions."""
    
    def __init__(self, name: str, description: str = ""):
        """
        Initialize a termination condition.
        
        Args:
            name: Name of the condition
            description: Description of the condition
        """
        self.name = name
        self.description = description
    
    def check(self, loop_state: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Check if the termination condition is met.
        
        Args:
            loop_state: Current state of the loop
            
        Returns:
            Tuple of (is_met, reason)
        """
        raise NotImplementedError("Subclasses must implement check")


class MaxIterationsCondition(TerminationCondition):
    """Termination condition based on maximum iterations."""
    
    def __init__(self, max_iterations: int):
        """
        Initialize a max iterations condition.
        
        Args:
            max_iterations: Maximum number of iterations
        """
        super().__init__(
            name="max_iterations",
            description=f"Maximum iterations: {max_iterations}"
        )
        self.max_iterations = max_iterations
    
    def check(self, loop_state: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Check if the maximum iterations condition is met.
        
        Args:
            loop_state: Current state of the loop
            
        Returns:
            Tuple of (is_met, reason)
        """
        current_iteration = loop_state.get('current_iteration', 0)
        if current_iteration >= self.max_iterations:
            return True, f"Reached maximum iterations: {self.max_iterations}"
        return False, None


class TimeoutCondition(TerminationCondition):
    """Termination condition based on timeout."""
    
    def __init__(self, timeout_seconds: float):
        """
        Initialize a timeout condition.
        
        Args:
            timeout_seconds: Timeout in seconds
        """
        super().__init__(
            name="timeout",
            description=f"Timeout: {timeout_seconds} seconds"
        )
        self.timeout_seconds = timeout_seconds
    
    def check(self, loop_state: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Check if the timeout condition is met.
        
        Args:
            loop_state: Current state of the loop
            
        Returns:
            Tuple of (is_met, reason)
        """
        start_time = loop_state.get('start_time')
        if start_time is None:
            return False, None
        
        elapsed = time.time() - start_time
        if elapsed >= self.timeout_seconds:
            return True, f"Timeout after {elapsed:.2f} seconds"
        return False, None


class ResourceLimitCondition(TerminationCondition):
    """Termination condition based on resource usage."""
    
    def __init__(self, resource_name: str, limit: float):
        """
        Initialize a resource limit condition.
        
        Args:
            resource_name: Name of the resource to monitor
            limit: Resource usage limit
        """
        super().__init__(
            name=f"resource_limit_{resource_name}",
            description=f"Resource limit: {resource_name} > {limit}"
        )
        self.resource_name = resource_name
        self.limit = limit
    
    def check(self, loop_state: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Check if the resource limit condition is met.
        
        Args:
            loop_state: Current state of the loop
            
        Returns:
            Tuple of (is_met, reason)
        """
        resource_usage = loop_state.get('resource_usage', {})
        usage = resource_usage.get(self.resource_name, 0)
        
        if usage > self.limit:
            return True, f"Resource {self.resource_name} usage ({usage}) exceeded limit ({self.limit})"
        return False, None


class StatePersistenceManager:
    """
    Manages persistent state for loop controllers.
    
    This class provides transactional state persistence with rollback capability
    and transaction history for recovery.
    """
    
    def __init__(self, storage_dir: str):
        """
        Initialize the state persistence manager.
        
        Args:
            storage_dir: Directory for storing state files
        """
        self.storage_dir = storage_dir
        self.locks = {}
        self.logger = logging.getLogger(__name__)
        self._state_cache = {}
        
        # Create storage directories
        os.makedirs(storage_dir, exist_ok=True)
        os.makedirs(os.path.join(storage_dir, "transactions"), exist_ok=True)
    
    def clear_cache(self, loop_id: str):
        """
        Clear the state cache for a specific loop.
        
        Args:
            loop_id: Loop identifier
        """
        if loop_id in self._state_cache:
            del self._state_cache[loop_id]
    
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
    
    def transaction(self, loop_id: str) -> StateTransaction:
        """
        Create a new transaction for a loop.
        
        Args:
            loop_id: Loop identifier
            
        Returns:
            StateTransaction instance
        """
        return _StateTransactionContext(self, loop_id)
    
    def load_state(self, loop_id: str) -> Dict[str, Any]:
        """
        Load the current state of a loop.
        
        Args:
            loop_id: Loop identifier
            
        Returns:
            Current state dictionary
        """
        # Check cache first
        if loop_id in self._state_cache:
            return self._state_cache[loop_id]
        
        state_file = os.path.join(self.storage_dir, f"{loop_id}.state.json")
        if not os.path.exists(state_file):
            return {}
        
        try:
            with open(state_file, 'r') as f:
                state = json.load(f)
                self._state_cache[loop_id] = state
                return state
        except Exception as e:
            self.logger.error(f"Error loading state for loop {loop_id}: {str(e)}", exc_info=True)
            return {}
    
    def save_state(self, loop_id: str, state: Dict[str, Any]) -> bool:
        """
        Save the state of a loop.
        
        Args:
            loop_id: Loop identifier
            state: State to save
            
        Returns:
            True if successful, False otherwise
        """
        state_file = os.path.join(self.storage_dir, f"{loop_id}.state.json")
        
        try:
            # Create a temporary file first
            temp_file = f"{state_file}.tmp"
            with open(temp_file, 'w') as f:
                json.dump(state, f, indent=2)
            
            # Rename to actual file (atomic operation)
            os.replace(temp_file, state_file)
            
            # Update cache
            self._state_cache[loop_id] = state
            
            return True
        except Exception as e:
            self.logger.error(f"Error saving state for loop {loop_id}: {str(e)}", exc_info=True)
            return False
    
    def save_transaction(self, transaction: StateTransaction) -> bool:
        """
        Save a transaction to disk.
        
        Args:
            transaction: Transaction to save
            
        Returns:
            True if successful, False otherwise
        """
        loop_id = transaction.loop_id
        transaction_dir = os.path.join(self.storage_dir, "transactions", loop_id)
        os.makedirs(transaction_dir, exist_ok=True)
        
        transaction_file = os.path.join(
            transaction_dir, 
            f"{transaction.transaction_id}.json"
        )
        
        try:
            with open(transaction_file, 'w') as f:
                json.dump(transaction.to_dict(), f, indent=2)
            return True
        except Exception as e:
            self.logger.error(
                f"Error saving transaction {transaction.transaction_id} for loop {loop_id}: {str(e)}",
                exc_info=True
            )
            return False
    
    def get_transaction_history(self, loop_id: str) -> List[StateTransaction]:
        """
        Get the transaction history for a loop.
        
        Args:
            loop_id: Loop identifier
            
        Returns:
            List of transactions in chronological order
        """
        transaction_dir = os.path.join(self.storage_dir, "transactions", loop_id)
        if not os.path.exists(transaction_dir):
            return []
        
        transactions = []
        for filename in os.listdir(transaction_dir):
            if not filename.endswith('.json'):
                continue
            
            try:
                with open(os.path.join(transaction_dir, filename), 'r') as f:
                    data = json.load(f)
                    transaction = StateTransaction.from_dict(data)
                    transactions.append(transaction)
            except Exception as e:
                self.logger.error(f"Error loading transaction {filename}: {str(e)}", exc_info=True)
        
        # Sort by timestamp
        transactions.sort(key=lambda t: t.timestamp)
        return transactions
    
    def recover_state(self, loop_id: str) -> Dict[str, Any]:
        """
        Recover state from transaction history.
        
        Args:
            loop_id: Loop identifier
            
        Returns:
            Recovered state
        """
        transactions = self.get_transaction_history(loop_id)
        if not transactions:
            return {}
        
        # Apply all committed transactions
        state = {}
        for transaction in transactions:
            if transaction.status == TransactionStatus.COMMITTED:
                for key, value in transaction.changes.items():
                    if value is None:
                        if key in state:
                            del state[key]
                    else:
                        state[key] = value
        
        # Save recovered state
        self.save_state(loop_id, state)
        return state
    
    def cleanup_old_transactions(self, loop_id: str, days: int = 7) -> int:
        """
        Clean up old transactions.
        
        Args:
            loop_id: Loop identifier
            days: Age threshold in days
            
        Returns:
            Number of transactions removed
        """
        transaction_dir = os.path.join(self.storage_dir, "transactions", loop_id)
        if not os.path.exists(transaction_dir):
            return 0
        
        threshold = time.time() - (days * 24 * 60 * 60)
        removed = 0
        
        for filename in os.listdir(transaction_dir):
            if not filename.endswith('.json'):
                continue
            
            try:
                file_path = os.path.join(transaction_dir, filename)
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                if data.get('timestamp', 0) < threshold:
                    os.remove(file_path)
                    removed += 1
            except Exception as e:
                self.logger.error(f"Error processing transaction {filename}: {str(e)}", exc_info=True)
        
        return removed


class _StateTransactionContext:
    """Context manager for state transactions."""
    
    def __init__(self, manager: StatePersistenceManager, loop_id: str):
        """
        Initialize a transaction context.
        
        Args:
            manager: State persistence manager
            loop_id: Loop identifier
        """
        self.manager = manager
        self.loop_id = loop_id
        self.transaction = None
        self.lock = manager.get_lock(loop_id)
    
    def __enter__(self) -> StateTransaction:
        """
        Enter the transaction context.
        
        Returns:
            StateTransaction instance
        """
        self.lock.acquire()
        self.transaction = StateTransaction(self.loop_id)
        return self.transaction
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Exit the transaction context.
        
        Args:
            exc_type: Exception type
            exc_val: Exception value
            exc_tb: Exception traceback
        """
        try:
            if exc_type is not None:
                # Exception occurred, roll back
                if self.transaction:
                    self.transaction.fail()
                    self.manager.save_transaction(self.transaction)
                    self.manager.logger.warning(
                        f"Transaction {self.transaction.transaction_id} failed: {str(exc_val)}"
                    )
                return False  # Re-raise exception
            
            # No exception, commit
            if self.transaction:
                # Load current state
                current_state = self.manager.load_state(self.loop_id)
                
                # Store previous values
                for key in self.transaction.changes:
                    if key in current_state:
                        self.transaction.previous_values[key] = current_state[key]
                
                # Apply changes
                for key, value in self.transaction.changes.items():
                    if value is None:
                        if key in current_state:
                            del current_state[key]
                    else:
                        current_state[key] = value
                
                # Save state
                self.manager.save_state(self.loop_id, current_state)
                
                # Commit transaction
                self.transaction.commit()
                self.manager.save_transaction(self.transaction)
            
            return True
        finally:
            self.lock.release()


class LoopController:
    """
    Enhanced loop controller with transactional state persistence.
    
    This class provides robust loop control with:
    - Transactional state persistence
    - Multiple termination conditions
    - Execution tracking
    - Resource usage monitoring
    """
    
    def __init__(self, loop_id: str, storage_dir: str = None):
        """
        Initialize a loop controller.
        
        Args:
            loop_id: Unique identifier for the loop
            storage_dir: Directory for storing state, defaults to /tmp/loop_state
        """
        self.loop_id = loop_id
        self.storage_dir = storage_dir or "/tmp/loop_state"
        self.state_manager = StatePersistenceManager(self.storage_dir)
        self.state_lock = threading.RLock()
        self.execution_thread = None
        self.stop_event = threading.Event()
        self.logger = logging.getLogger(__name__)
        
        # Termination conditions
        self.termination_conditions = {}
        
        # Initialize state if needed
        with self.state_lock:
            state = self.get_state()
            if not state:
                self._initialize_state()
    
    def _initialize_state(self) -> None:
        """Initialize the loop state."""
        with self.state_manager.transaction(self.loop_id) as transaction:
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
    
    def get_state(self) -> Dict[str, Any]:
        """
        Get the current state of the loop.
        
        Returns:
            Current state dictionary
        """
        return self.state_manager.load_state(self.loop_id)
    
    def update_state(self, updates: Dict[str, Any]) -> None:
        """
        Update the loop state.
        
        Args:
            updates: State updates
        """
        with self.state_lock:
            with self.state_manager.transaction(self.loop_id) as transaction:
                for key, value in updates.items():
                    transaction.add_change(key, value)
    
    def update_resource_usage(self, resource: str, usage: float) -> None:
        """
        Update resource usage.
        
        Args:
            resource: Resource name
            usage: Resource usage value
        """
        with self.state_lock:
            state = self.get_state()
            resource_usage = state.get('resource_usage', {})
            resource_usage[resource] = usage
            
            with self.state_manager.transaction(self.loop_id) as transaction:
                transaction.add_change('resource_usage', resource_usage)
    
    def set_max_iterations(self, max_iterations: int) -> None:
        """
        Set maximum iterations.
        
        Args:
            max_iterations: Maximum number of iterations
        """
        with self.state_lock:
            with self.state_manager.transaction(self.loop_id) as transaction:
                transaction.add_change('max_iterations', max_iterations)
            
            self.add_termination_condition(
                MaxIterationsCondition(max_iterations)
            )
    
    def set_timeout(self, timeout_seconds: float) -> None:
        """
        Set timeout.
        
        Args:
            timeout_seconds: Timeout in seconds
        """
        self.add_termination_condition(
            TimeoutCondition(timeout_seconds)
        )
    
    def set_resource_limit(self, resource: str, limit: float) -> None:
        """
        Set resource limit.
        
        Args:
            resource: Resource name
            limit: Resource usage limit
        """
        self.add_termination_condition(
            ResourceLimitCondition(resource, limit)
        )
    
    def add_termination_condition(self, condition: TerminationCondition) -> None:
        """
        Add a termination condition.
        
        Args:
            condition: Termination condition
        """
        self.termination_conditions[condition.name] = condition
    
    def add_custom_condition(self, name: str, check_func: Callable[[Dict[str, Any]], Tuple[bool, Optional[str]]]) -> None:
        """
        Add a custom termination condition.
        
        Args:
            name: Condition name
            check_func: Function that checks if the condition is met
        """
        class CustomCondition(TerminationCondition):
            def __init__(self, name: str, check_func: Callable):
                super().__init__(name=name, description=f"Custom condition: {name}")
                self.check_func = check_func
            
            def check(self, loop_state: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
                return self.check_func(loop_state)
        
        self.add_termination_condition(CustomCondition(name, check_func))
    
    def start(self, loop_func: Callable[[Dict[str, Any]], Any]) -> None:
        """
        Start the loop execution.
        
        Args:
            loop_func: Function to execute in each iteration
        """
        with self.state_lock:
            state = self.get_state()
            if state.get('state') == LoopState.RUNNING.value:
                self.logger.warning(f"Loop {self.loop_id} is already running")
                return
            
            # Update state
            with self.state_manager.transaction(self.loop_id) as transaction:
                transaction.add_change('state', LoopState.RUNNING.value)
                transaction.add_change('start_time', time.time())
                transaction.add_change('end_time', None)
                transaction.add_change('termination_reason', None)
                transaction.add_change('error_count', 0)
            
            # Start execution thread
            self.stop_event.clear()
            self.execution_thread = threading.Thread(
                target=self._execute_loop,
                args=(loop_func,),
                daemon=True
            )
            self.execution_thread.start()
    
    def stop(self, reason: str = "Manual stop") -> None:
        """
        Stop the loop execution.
        
        Args:
            reason: Reason for stopping
        """
        if self.execution_thread and self.execution_thread.is_alive():
            self.stop_event.set()
            self.execution_thread.join(timeout=5.0)
            
            # Update state
            with self.state_lock:
                with self.state_manager.transaction(self.loop_id) as transaction:
                    transaction.add_change('state', LoopState.ABORTED.value)
                    transaction.add_change('end_time', time.time())
                    transaction.add_change('termination_reason', TerminationReason.MANUAL.value)
                    transaction.add_change('termination_details', reason)
    
    def _execute_loop(self, loop_func: Callable[[Dict[str, Any]], Any]) -> None:
        """
        Execute the loop function.
        
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
                            return
        
        except Exception as e:
            self.logger.error(f"Unhandled error in loop {self.loop_id}: {str(e)}", exc_info=True)
            self._terminate(TerminationReason.ERROR, str(e))
        
        finally:
            # Ensure state is updated if thread exits
            if not self.stop_event.is_set():
                self._terminate(TerminationReason.COMPLETED)
    
    def _record_execution(self, iteration: int, success: bool, execution_time: float, 
                         result: Any = None, error: str = None) -> None:
        """
        Record execution details.
        
        Args:
            iteration: Iteration number
            success: Whether execution was successful
            execution_time: Execution time in seconds
            result: Execution result
            error: Error message if any
        """
        with self.state_lock:
            state = self.get_state()
            execution_history = state.get('execution_history', [])
            
            # Add execution record
            execution_record = {
                'iteration': iteration,
                'timestamp': time.time(),
                'success': success,
                'execution_time': execution_time
            }
            
            if result is not None:
                execution_record['result'] = str(result)
            
            if error is not None:
                execution_record['error'] = error
            
            # Limit history size
            if len(execution_history) >= 100:
                execution_history = execution_history[-99:]
            
            execution_history.append(execution_record)
            
            # Update state
            with self.state_manager.transaction(self.loop_id) as transaction:
                transaction.add_change('execution_history', execution_history)
    
    def _terminate(self, reason: TerminationReason, details: str = None) -> None:
        """
        Terminate the loop.
        
        Args:
            reason: Termination reason
            details: Additional details
        """
        with self.state_lock:
            # Determine final state
            if reason in [TerminationReason.COMPLETED, TerminationReason.MAX_ITERATIONS, TerminationReason.CONDITION_MET, 
                         TerminationReason.TIMEOUT, TerminationReason.RESOURCE_LIMIT]:
                final_state = LoopState.COMPLETED
            elif reason in [TerminationReason.ERROR, TerminationReason.DEPENDENCY_FAILURE]:
                final_state = LoopState.FAILED
            else:
                final_state = LoopState.ABORTED
            
            # Update state
            self.update_state({
                'state': final_state.value,
                'end_time': time.time(),
                'termination_reason': reason.value,
                'termination_details': details
            })
            
            # Signal stop
            self.stop_event.set()
    
    def get_execution_history(self) -> List[Dict[str, Any]]:
        """
        Get execution history.
        
        Returns:
            List of execution records
        """
        state = self.get_state()
        return state.get('execution_history', [])
    
    def is_running(self) -> bool:
        """
        Check if the loop is running.
        
        Returns:
            True if running, False otherwise
        """
        state = self.get_state()
        return state.get('state') == LoopState.RUNNING.value
