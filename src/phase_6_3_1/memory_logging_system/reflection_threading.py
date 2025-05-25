"""
Reflection Threading Manager for the Memory Logging System.

This module implements an improved threading model for reflection operations
in the Promethios Memory Logging System.
"""

import time
import threading
import logging
import uuid
import os
from typing import Dict, Any, List, Optional, Callable, Set, Tuple
from concurrent.futures import ThreadPoolExecutor, Future
from enum import Enum
import queue

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ReflectionThreading")

# Constants
DEFAULT_MAX_THREADS = 8
DEFAULT_THREAD_TIMEOUT = 30.0  # seconds
DEFAULT_DEADLOCK_CHECK_INTERVAL = 5.0  # seconds
MAX_QUEUE_SIZE = 1000


class ThreadState(str, Enum):
    """Enum representing the state of a reflection thread."""
    PENDING = "pending"
    ALLOCATED = "allocated"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    DEADLOCKED = "deadlocked"


class ThreadPriority(int, Enum):
    """Enum representing the priority of a reflection thread."""
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3


class ReflectionOperation:
    """Represents a reflection operation to be executed."""
    
    def __init__(self, operation_type: str, func: Callable, args: tuple = (), kwargs: dict = None):
        """
        Initialize a reflection operation.
        
        Args:
            operation_type: Type of reflection operation
            func: Function to execute
            args: Positional arguments for the function
            kwargs: Keyword arguments for the function
        """
        self.operation_id = str(uuid.uuid4())
        self.operation_type = operation_type
        self.func = func
        self.args = args
        self.kwargs = kwargs or {}
        self.required_resources: List[str] = []
        self.priority = ThreadPriority.NORMAL
        self.timeout = DEFAULT_THREAD_TIMEOUT
        self.created_at = time.time()
    
    def add_required_resource(self, resource_id: str) -> None:
        """
        Add a required resource for this operation.
        
        Args:
            resource_id: ID of the required resource
        """
        if resource_id not in self.required_resources:
            self.required_resources.append(resource_id)
    
    def get_required_resources(self) -> List[str]:
        """
        Get the list of required resources.
        
        Returns:
            List of resource IDs
        """
        return self.required_resources
    
    def set_priority(self, priority: ThreadPriority) -> None:
        """
        Set the priority of this operation.
        
        Args:
            priority: Operation priority
        """
        self.priority = priority
    
    def set_timeout(self, timeout: float) -> None:
        """
        Set the timeout for this operation.
        
        Args:
            timeout: Timeout in seconds
        """
        self.timeout = timeout
    
    def execute(self) -> Any:
        """
        Execute the operation.
        
        Returns:
            Result of the operation
        """
        return self.func(*self.args, **self.kwargs)


class ReflectionThreadContext:
    """Context for a reflection thread."""
    
    def __init__(self):
        self.thread_id: str = str(uuid.uuid4())  # Thread identifier
        self.operation_id: str = None  # Operation identifier
        self.operation_type: str = None  # Operation type
        self.resource_locks: List[str] = []  # Held resource locks
        self.priority: ThreadPriority = ThreadPriority.NORMAL  # Thread priority
        self.state: ThreadState = ThreadState.PENDING  # Thread state
        self.dependencies: List[str] = []  # Thread dependencies
        self.timeout: float = DEFAULT_THREAD_TIMEOUT  # Operation timeout
        self.start_time: float = None  # Start time
        self.end_time: float = None  # End time
        self.result: Any = None  # Operation result
        self.error: Optional[Exception] = None  # Operation error
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "thread_id": self.thread_id,
            "operation_id": self.operation_id,
            "operation_type": self.operation_type,
            "resource_locks": self.resource_locks,
            "priority": self.priority.value if self.priority else None,
            "state": self.state.value if self.state else None,
            "dependencies": self.dependencies,
            "timeout": self.timeout,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "has_result": self.result is not None,
            "has_error": self.error is not None
        }


class ReflectionThreadManager:
    """
    Manages threading for reflection operations.
    
    This class implements an improved threading model that prevents deadlocks
    and race conditions during reflection operations.
    """
    
    def __init__(self, max_threads: int = DEFAULT_MAX_THREADS):
        """
        Initialize the ReflectionThreadManager.
        
        Args:
            max_threads: Maximum number of worker threads
        """
        self.max_threads = max_threads
        
        # Initialize thread pool
        self.thread_pool = ThreadPoolExecutor(max_workers=max_threads)
        
        # Initialize thread tracking
        self.active_threads: Dict[str, Tuple[ReflectionThreadContext, Future]] = {}
        self.completed_threads: Dict[str, ReflectionThreadContext] = {}
        
        # Initialize resource tracking
        self.resource_locks: Dict[str, Dict[str, Any]] = {}  # resource_id -> lock_info
        self.resource_waiters: Dict[str, List[str]] = {}  # resource_id -> [thread_id]
        
        # Initialize operation queue
        self.operation_queue = queue.PriorityQueue(maxsize=MAX_QUEUE_SIZE)
        
        # Initialize locks
        self.lock = threading.Lock()
        self.resource_lock = threading.Lock()
        
        # Initialize running flag for thread control
        self._running = True
        self._shutdown_event = threading.Event()
        
        # Initialize deadlock detection
        self.deadlock_check_interval = DEFAULT_DEADLOCK_CHECK_INTERVAL
        self.deadlock_check_thread = threading.Thread(target=self._deadlock_check_worker, daemon=True)
        self.deadlock_check_thread.start()
        logger.info("Deadlock check thread started")
        
        # Initialize queue processor
        self.queue_processor_thread = threading.Thread(target=self._queue_processor_worker, daemon=True)
        self.queue_processor_thread.start()
        logger.info("Queue processor thread started")
        
        logger.info(f"ReflectionThreadManager initialized with {max_threads} max threads")
    
    def allocate_reflection_thread(self, operation: ReflectionOperation) -> str:
        """
        Allocate a thread for a reflection operation.
        
        Args:
            operation: The reflection operation to execute
            
        Returns:
            Thread ID of the allocated thread
        """
        # Create thread context
        context = ReflectionThreadContext()
        context.operation_id = operation.operation_id
        context.operation_type = operation.operation_type
        context.priority = operation.priority
        context.timeout = operation.timeout
        context.state = ThreadState.PENDING
        
        # Check if resources are available
        required_resources = operation.get_required_resources()
        resources_available = self._check_resources_available(required_resources)
        
        if resources_available:
            # Resources are available, execute immediately
            return self._execute_operation(operation, context)
        else:
            # Resources not available, queue for later execution
            return self._queue_operation(operation, context)
    
    def get_thread_status(self, thread_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a thread.
        
        Args:
            thread_id: ID of the thread
            
        Returns:
            Dictionary with thread status or None if not found
        """
        with self.lock:
            # Check active threads
            if thread_id in self.active_threads:
                context, _ = self.active_threads[thread_id]
                return context.to_dict()
            
            # Check completed threads
            if thread_id in self.completed_threads:
                return self.completed_threads[thread_id].to_dict()
            
            return None
    
    def get_thread_result(self, thread_id: str, timeout: float = None) -> Tuple[bool, Any]:
        """
        Get the result of a thread, waiting if necessary.
        
        Args:
            thread_id: ID of the thread
            timeout: Maximum time to wait in seconds
            
        Returns:
            Tuple of (success, result)
        """
        with self.lock:
            # Check if thread is active
            if thread_id in self.active_threads:
                context, future = self.active_threads[thread_id]
                
                # Release lock while waiting
                self.lock.release()
                
                try:
                    # Wait for result
                    result = future.result(timeout=timeout)
                    success = True
                except Exception as e:
                    result = e
                    success = False
                
                # Reacquire lock
                self.lock.acquire()
                
                return success, result
            
            # Check if thread is completed
            if thread_id in self.completed_threads:
                context = self.completed_threads[thread_id]
                
                if context.error:
                    return False, context.error
                else:
                    return True, context.result
            
            # Thread not found
            return False, None
    
    def synchronize_reflection_operations(self, operations: List[ReflectionOperation]) -> List[str]:
        """
        Synchronize multiple reflection operations.
        
        Args:
            operations: List of reflection operations
            
        Returns:
            List of thread IDs
        """
        thread_ids = []
        
        # Allocate threads for all operations
        for operation in operations:
            thread_id = self.allocate_reflection_thread(operation)
            thread_ids.append(thread_id)
        
        return thread_ids
    
    def prevent_deadlocks(self, thread_operations: List[Tuple[str, List[str]]]) -> bool:
        """
        Prevent deadlocks by analyzing thread operations.
        
        Args:
            thread_operations: List of (thread_id, resource_ids) tuples
            
        Returns:
            True if deadlocks prevented, False otherwise
        """
        # Build resource allocation graph
        allocation_graph = {}
        
        with self.resource_lock:
            # Add current allocations
            for resource_id, lock_info in self.resource_locks.items():
                thread_id = lock_info.get("thread_id")
                if thread_id:
                    if thread_id not in allocation_graph:
                        allocation_graph[thread_id] = []
                    allocation_graph[thread_id].append(resource_id)
            
            # Add current waiters
            for resource_id, thread_ids in self.resource_waiters.items():
                for thread_id in thread_ids:
                    if thread_id not in allocation_graph:
                        allocation_graph[thread_id] = []
                    if resource_id not in allocation_graph[thread_id]:
                        allocation_graph[thread_id].append(resource_id)
            
            # Add proposed operations
            for thread_id, resource_ids in thread_operations:
                if thread_id not in allocation_graph:
                    allocation_graph[thread_id] = []
                for resource_id in resource_ids:
                    if resource_id not in allocation_graph[thread_id]:
                        allocation_graph[thread_id].append(resource_id)
        
        # Check for cycles in the graph
        visited = set()
        path = set()
        
        def has_cycle(node):
            visited.add(node)
            path.add(node)
            
            for neighbor in allocation_graph.get(node, []):
                if neighbor in self.resource_locks:
                    lock_info = self.resource_locks[neighbor]
                    owner = lock_info.get("thread_id")
                    if owner and owner not in visited:
                        if has_cycle(owner):
                            return True
                    elif owner and owner in path:
                        return True
            
            path.remove(node)
            return False
        
        # Check each node
        for node in allocation_graph:
            if node not in visited:
                if has_cycle(node):
                    logger.warning(f"Potential deadlock detected in thread operations")
                    return False
        
        return True
    
    def manage_thread_pool(self, pool_config: Dict[str, Any]) -> bool:
        """
        Manage the reflection thread pool.
        
        Args:
            pool_config: Thread pool configuration
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Update max threads if specified
            if "max_threads" in pool_config:
                new_max_threads = pool_config["max_threads"]
                
                # Validate
                if not isinstance(new_max_threads, int) or new_max_threads < 1:
                    logger.error(f"Invalid max_threads value: {new_max_threads}")
                    return False
                
                # Update thread pool
                old_pool = self.thread_pool
                self.max_threads = new_max_threads
                self.thread_pool = ThreadPoolExecutor(max_workers=new_max_threads)
                
                # Shutdown old pool
                old_pool.shutdown(wait=False)
                
                logger.info(f"Thread pool max_threads updated to {new_max_threads}")
            
            # Update deadlock check interval if specified
            if "deadlock_check_interval" in pool_config:
                new_interval = pool_config["deadlock_check_interval"]
                
                # Validate
                if not isinstance(new_interval, (int, float)) or new_interval < 0.1:
                    logger.error(f"Invalid deadlock_check_interval value: {new_interval}")
                    return False
                
                # Update interval
                self.deadlock_check_interval = new_interval
                
                logger.info(f"Deadlock check interval updated to {new_interval}s")
            
            return True
            
        except Exception as e:
            logger.error(f"Error managing thread pool: {str(e)}")
            return False
    
    def shutdown(self) -> None:
        """
        Shutdown the reflection threading manager.
        
        This stops all worker threads and releases resources.
        """
        logger.info("Shutting down ReflectionThreadManager")
        
        # Set running flag to False to stop worker threads
        self._running = False
        self._shutdown_event.set()
        
        # Wait for queue processor thread to terminate (with timeout)
        if hasattr(self, 'queue_processor_thread') and self.queue_processor_thread and self.queue_processor_thread.is_alive():
            logger.info("Waiting for queue processor thread to terminate")
            self.queue_processor_thread.join(timeout=2.0)
            if self.queue_processor_thread.is_alive():
                logger.warning("Queue processor thread did not terminate within timeout")
        
        # Wait for deadlock check thread to terminate (with timeout)
        if hasattr(self, 'deadlock_check_thread') and self.deadlock_check_thread and self.deadlock_check_thread.is_alive():
            logger.info("Waiting for deadlock check thread to terminate")
            self.deadlock_check_thread.join(timeout=2.0)
            if self.deadlock_check_thread.is_alive():
                logger.warning("Deadlock check thread did not terminate within timeout")
        
        # Shutdown thread pool with timeout
        if hasattr(self, 'thread_pool'):
            logger.info("Shutting down thread pool")
            self.thread_pool.shutdown(wait=True, cancel_futures=True)
        
        # Release all resource locks
        with self.resource_lock:
            logger.info(f"Releasing {len(self.resource_locks)} resource locks")
            self.resource_locks.clear()
            self.resource_waiters.clear()
        
        logger.info("ReflectionThreadManager shutdown complete")
    
    def _check_resources_available(self, required_resources: List[str]) -> bool:
        """
        Check if required resources are available.
        
        Args:
            required_resources: List of required resource IDs
            
        Returns:
            True if all resources are available, False otherwise
        """
        with self.resource_lock:
            for resource_id in required_resources:
                if resource_id in self.resource_locks:
                    return False
            return True
    
    def _execute_operation(self, operation: ReflectionOperation, context: ReflectionThreadContext) -> str:
        """
        Execute a reflection operation.
        
        Args:
            operation: The reflection operation to execute
            context: The thread context
            
        Returns:
            Thread ID
        """
        # Acquire resource locks
        required_resources = operation.get_required_resources()
        self._acquire_resource_locks(context.thread_id, required_resources)
        
        # Update context
        context.state = ThreadState.ALLOCATED
        context.start_time = time.time()
        
        # Submit operation to thread pool
        future = self.thread_pool.submit(self._execute_operation_wrapper, operation, context)
        
        # Store thread context and future
        with self.lock:
            self.active_threads[context.thread_id] = (context, future)
        
        return context.thread_id
    
    def _queue_operation(self, operation: ReflectionOperation, context: ReflectionThreadContext) -> str:
        """
        Queue a reflection operation for later execution.
        
        Args:
            operation: The reflection operation to queue
            context: The thread context
            
        Returns:
            Thread ID
        """
        # Add to waiters for required resources
        required_resources = operation.get_required_resources()
        with self.resource_lock:
            for resource_id in required_resources:
                if resource_id not in self.resource_waiters:
                    self.resource_waiters[resource_id] = []
                self.resource_waiters[resource_id].append(context.thread_id)
        
        # Create queue item
        queue_item = (
            -operation.priority.value,  # Negative priority for correct ordering
            operation.created_at,
            (operation, context)
        )
        
        # Add to queue
        try:
            self.operation_queue.put(queue_item, block=False)
        except queue.Full:
            logger.error(f"Operation queue is full, dropping operation {operation.operation_id}")
            return None
        
        return context.thread_id
    
    def _execute_operation_wrapper(self, operation: ReflectionOperation, context: ReflectionThreadContext) -> Any:
        """
        Wrapper for executing an operation in a thread.
        
        Args:
            operation: The reflection operation to execute
            context: The thread context
            
        Returns:
            Operation result
        """
        try:
            # Update context
            context.state = ThreadState.RUNNING
            
            # Execute operation
            result = operation.execute()
            
            # Update context
            context.state = ThreadState.COMPLETED
            context.end_time = time.time()
            context.result = result
            
            return result
        except Exception as e:
            # Update context
            context.state = ThreadState.FAILED
            context.end_time = time.time()
            context.error = e
            
            logger.error(f"Error executing operation {operation.operation_id}: {str(e)}")
            
            return None
        finally:
            # Release resource locks
            self._release_resource_locks(context.thread_id)
            
            # Move from active to completed
            with self.lock:
                if context.thread_id in self.active_threads:
                    self.completed_threads[context.thread_id] = context
                    del self.active_threads[context.thread_id]
    
    def _acquire_resource_locks(self, thread_id: str, resource_ids: List[str]) -> None:
        """
        Acquire locks for resources.
        
        Args:
            thread_id: ID of the thread
            resource_ids: List of resource IDs
        """
        with self.resource_lock:
            for resource_id in resource_ids:
                self.resource_locks[resource_id] = {
                    "thread_id": thread_id,
                    "acquired_at": time.time()
                }
    
    def _release_resource_locks(self, thread_id: str) -> None:
        """
        Release locks held by a thread.
        
        Args:
            thread_id: ID of the thread
        """
        with self.resource_lock:
            # Find resources locked by this thread
            resources_to_release = []
            for resource_id, lock_info in self.resource_locks.items():
                if lock_info.get("thread_id") == thread_id:
                    resources_to_release.append(resource_id)
            
            # Release locks
            for resource_id in resources_to_release:
                del self.resource_locks[resource_id]
            
            # Remove from waiters
            for resource_id, thread_ids in self.resource_waiters.items():
                if thread_id in thread_ids:
                    thread_ids.remove(thread_id)
    
    def _deadlock_check_worker(self) -> None:
        """
        Worker thread for deadlock detection.
        
        This thread periodically checks for deadlocks and resolves them.
        """
        while self._running and not self._shutdown_event.is_set():
            try:
                # Check for deadlocks
                self._check_for_deadlocks()
                
                # Check for timeouts
                self._check_for_timeouts()
                
                # Wait for next check interval or shutdown
                self._shutdown_event.wait(timeout=self.deadlock_check_interval)
            except Exception as e:
                logger.error(f"Error in deadlock check worker: {str(e)}")
                
                # Avoid tight loop in case of error
                time.sleep(1.0)
    
    def _queue_processor_worker(self) -> None:
        """
        Worker thread for processing the operation queue.
        
        This thread processes queued operations when resources become available.
        """
        while self._running and not self._shutdown_event.is_set():
            try:
                # Check if any queued operations can be executed
                self._process_operation_queue()
                
                # Wait a bit before next check
                self._shutdown_event.wait(timeout=0.1)
            except Exception as e:
                logger.error(f"Error in queue processor worker: {str(e)}")
                
                # Avoid tight loop in case of error
                time.sleep(1.0)
    
    def _check_for_deadlocks(self) -> None:
        """
        Check for deadlocks and resolve them.
        
        This method detects and resolves deadlocks by aborting operations.
        """
        # Build resource allocation graph
        allocation_graph = {}
        
        with self.resource_lock:
            # Add current allocations
            for resource_id, lock_info in self.resource_locks.items():
                thread_id = lock_info.get("thread_id")
                if thread_id:
                    if thread_id not in allocation_graph:
                        allocation_graph[thread_id] = []
                    allocation_graph[thread_id].append(resource_id)
            
            # Add current waiters
            for resource_id, thread_ids in self.resource_waiters.items():
                for thread_id in thread_ids:
                    if thread_id not in allocation_graph:
                        allocation_graph[thread_id] = []
                    if resource_id not in allocation_graph[thread_id]:
                        allocation_graph[thread_id].append(resource_id)
        
        # Check for cycles in the graph
        visited = set()
        path = set()
        deadlock_paths = []
        
        def find_cycles(node, current_path=None):
            if current_path is None:
                current_path = []
            
            visited.add(node)
            path.add(node)
            current_path.append(node)
            
            for neighbor in allocation_graph.get(node, []):
                if neighbor in self.resource_locks:
                    lock_info = self.resource_locks[neighbor]
                    owner = lock_info.get("thread_id")
                    if owner:
                        if owner not in visited:
                            if find_cycles(owner, current_path + [neighbor]):
                                return True
                        elif owner in path:
                            deadlock_path = current_path + [neighbor, owner]
                            deadlock_paths.append(deadlock_path)
                            return True
            
            path.remove(node)
            return False
        
        # Check each node
        for node in allocation_graph:
            if node not in visited:
                find_cycles(node)
        
        # Resolve deadlocks
        if deadlock_paths:
            logger.warning(f"Detected {len(deadlock_paths)} deadlocks")
            
            # Abort operations involved in deadlocks
            for deadlock_path in deadlock_paths:
                # Find thread with lowest priority
                thread_to_abort = None
                lowest_priority = ThreadPriority.CRITICAL
                
                for thread_id in set(deadlock_path):
                    with self.lock:
                        if thread_id in self.active_threads:
                            context, _ = self.active_threads[thread_id]
                            if context.priority.value < lowest_priority.value:
                                lowest_priority = context.priority
                                thread_to_abort = thread_id
                
                if thread_to_abort:
                    logger.warning(f"Aborting thread {thread_to_abort} to resolve deadlock")
                    self._abort_thread(thread_to_abort)
    
    def _check_for_timeouts(self) -> None:
        """
        Check for operation timeouts.
        
        This method detects and handles operations that have exceeded their timeout.
        """
        now = time.time()
        threads_to_abort = []
        
        with self.lock:
            for thread_id, (context, _) in self.active_threads.items():
                if context.state == ThreadState.RUNNING and context.start_time:
                    elapsed = now - context.start_time
                    if elapsed > context.timeout:
                        threads_to_abort.append(thread_id)
        
        for thread_id in threads_to_abort:
            logger.warning(f"Aborting thread {thread_id} due to timeout")
            self._abort_thread(thread_id)
    
    def _abort_thread(self, thread_id: str) -> None:
        """
        Abort a thread.
        
        Args:
            thread_id: ID of the thread to abort
        """
        with self.lock:
            if thread_id in self.active_threads:
                context, future = self.active_threads[thread_id]
                
                # Update context
                context.state = ThreadState.TIMEOUT
                context.end_time = time.time()
                
                # Cancel future
                future.cancel()
                
                # Move from active to completed
                self.completed_threads[thread_id] = context
                del self.active_threads[thread_id]
                
                # Release resource locks
                self._release_resource_locks(thread_id)
    
    def _process_operation_queue(self) -> None:
        """
        Process the operation queue.
        
        This method checks if any queued operations can be executed
        and executes them if resources are available.
        """
        if self.operation_queue.empty():
            return
        
        # Get all items from queue
        queue_items = []
        while not self.operation_queue.empty():
            try:
                item = self.operation_queue.get(block=False)
                queue_items.append(item)
            except queue.Empty:
                break
        
        # Process items
        for item in queue_items:
            _, _, (operation, context) = item
            
            # Check if resources are available
            required_resources = operation.get_required_resources()
            resources_available = self._check_resources_available(required_resources)
            
            if resources_available:
                # Resources are available, execute
                self._execute_operation(operation, context)
            else:
                # Resources not available, put back in queue
                queue_item = (
                    -operation.priority.value,
                    operation.created_at,
                    (operation, context)
                )
                try:
                    self.operation_queue.put(queue_item, block=False)
                except queue.Full:
                    logger.error(f"Operation queue is full, dropping operation {operation.operation_id}")
