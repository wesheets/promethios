"""
Guaranteed Delivery Manager for the Memory Logging System.

This module implements the guaranteed delivery mechanism for memory events
in the Promethios Memory Logging System.
"""

import time
import threading
import logging
import json
import os
import uuid
from typing import Dict, Any, List, Optional, Callable, Tuple
from concurrent.futures import ThreadPoolExecutor
from queue import Queue, PriorityQueue
import pickle

from memory_event import MemoryEvent, DeliveryStatus

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("GuaranteedDeliveryManager")

# Constants
MAX_RETRIES = 5
MAX_QUEUE_SIZE = 10000
RETRY_BACKOFF_BASE = 2.0  # seconds
CHECKPOINT_INTERVAL = 60  # seconds
DEFAULT_STORAGE_PATH = "/tmp/memory_logging_system/delivery_queue"


class GuaranteedDeliveryManager:
    """
    Ensures reliable delivery of memory events to storage.
    
    This class implements a persistent queue with delivery confirmation
    and automatic retry logic to guarantee that no memory events are lost.
    """
    
    def __init__(self, storage_path: str = DEFAULT_STORAGE_PATH, 
                 max_workers: int = 4, 
                 max_retries: int = MAX_RETRIES):
        """
        Initialize the GuaranteedDeliveryManager.
        
        Args:
            storage_path: Path to store persistent queue data
            max_workers: Maximum number of worker threads
            max_retries: Maximum number of delivery retry attempts
        """
        self.storage_path = storage_path
        self.max_retries = max_retries
        
        # Create storage directory if it doesn't exist
        os.makedirs(os.path.dirname(storage_path), exist_ok=True)
        
        # Initialize queues
        self.pending_queue = PriorityQueue(maxsize=MAX_QUEUE_SIZE)
        self.retry_queue = PriorityQueue(maxsize=MAX_QUEUE_SIZE)
        self.event_store: Dict[str, MemoryEvent] = {}
        
        # Initialize thread pool
        self.thread_pool = ThreadPoolExecutor(max_workers=max_workers)
        
        # Initialize locks
        self.queue_lock = threading.Lock()
        self.store_lock = threading.Lock()
        
        # Initialize storage callback
        self.storage_callback: Optional[Callable[[MemoryEvent], bool]] = None
        
        # Initialize checkpoint timer
        self.last_checkpoint_time = time.time()
        
        # Initialize shutdown control
        self._running = True
        self._shutdown_event = threading.Event()
        self._pending_worker_thread = None
        self._retry_worker_thread = None
        
        # Load persisted state if available
        self._load_persisted_state()
        
        # Start worker threads
        self._start_workers()
        
        logger.info(f"GuaranteedDeliveryManager initialized with storage path: {storage_path}")
    
    def register_storage_callback(self, callback: Callable[[MemoryEvent], bool]) -> None:
        """
        Register a callback function for storing events.
        
        Args:
            callback: Function that takes a MemoryEvent and returns success status
        """
        self.storage_callback = callback
        logger.info("Storage callback registered")
    
    def queue_event(self, event: MemoryEvent) -> str:
        """
        Queue an event for guaranteed delivery.
        
        Args:
            event: The memory event to queue
            
        Returns:
            The event ID
        """
        # Ensure event has an ID
        if not event.event_id:
            event.event_id = str(uuid.uuid4())
        
        # Set initial delivery status
        event.update_delivery_status(DeliveryStatus.PENDING)
        
        # Store event in event store
        with self.store_lock:
            self.event_store[event.event_id] = event
        
        # Add to pending queue with priority based on timestamp
        with self.queue_lock:
            self.pending_queue.put((event.timestamp, event.event_id))
        
        logger.debug(f"Event queued: {event.event_id}")
        
        # Checkpoint state if needed
        self._checkpoint_if_needed()
        
        return event.event_id
    
    def confirm_delivery(self, event_id: str) -> bool:
        """
        Confirm successful delivery of an event.
        
        Args:
            event_id: The ID of the event to confirm
            
        Returns:
            True if confirmation successful, False otherwise
        """
        with self.store_lock:
            if event_id not in self.event_store:
                logger.warning(f"Cannot confirm delivery: Event {event_id} not found")
                return False
            
            event = self.event_store[event_id]
            event.update_delivery_status(DeliveryStatus.DELIVERED)
            
            # We keep the event in the store for audit purposes
            # but could implement a cleanup policy here
            
            logger.debug(f"Delivery confirmed for event: {event_id}")
            
            # Checkpoint state if needed
            self._checkpoint_if_needed()
            
            return True
    
    def retry_failed_delivery(self, event_id: str) -> bool:
        """
        Retry delivery for a failed event.
        
        Args:
            event_id: The ID of the event to retry
            
        Returns:
            True if retry scheduled, False otherwise
        """
        with self.store_lock:
            if event_id not in self.event_store:
                logger.warning(f"Cannot retry delivery: Event {event_id} not found")
                return False
            
            event = self.event_store[event_id]
            
            # Check if max retries reached
            if event.retry_count >= self.max_retries:
                logger.error(f"Max retries reached for event: {event_id}")
                return False
            
            # Increment retry count
            event.increment_retry_count()
            
            # Update status
            event.update_delivery_status(DeliveryStatus.RETRYING)
            
            # Calculate retry delay with exponential backoff
            retry_delay = RETRY_BACKOFF_BASE ** event.retry_count
            retry_time = time.time() + retry_delay
            
            # Add to retry queue
            with self.queue_lock:
                self.retry_queue.put((retry_time, event_id))
            
            logger.info(f"Scheduled retry {event.retry_count}/{self.max_retries} for event {event_id} in {retry_delay:.2f}s")
            
            # Checkpoint state if needed
            self._checkpoint_if_needed()
            
            return True
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the delivery queues.
        
        Returns:
            Dictionary with queue statistics
        """
        with self.queue_lock, self.store_lock:
            stats = {
                "pending_queue_size": self.pending_queue.qsize(),
                "retry_queue_size": self.retry_queue.qsize(),
                "event_store_size": len(self.event_store),
                "delivery_status_counts": {
                    status.value: 0 for status in DeliveryStatus
                }
            }
            
            # Count events by status
            for event in self.event_store.values():
                if event.delivery_status:
                    stats["delivery_status_counts"][event.delivery_status.value] += 1
            
            return stats
    
    def shutdown(self) -> None:
        """
        Shutdown the delivery manager and persist state.
        """
        logger.info("Shutting down GuaranteedDeliveryManager")
        
        # Signal worker threads to stop
        logger.info("Setting shutdown flag for worker threads")
        self._running = False
        self._shutdown_event.set()
        
        # Wait for worker threads to terminate (with timeout)
        if self._pending_worker_thread and self._pending_worker_thread.is_alive():
            logger.info("Waiting for pending queue worker to terminate")
            self._pending_worker_thread.join(timeout=2.0)
            if self._pending_worker_thread.is_alive():
                logger.warning("Pending queue worker did not terminate within timeout")
        
        if self._retry_worker_thread and self._retry_worker_thread.is_alive():
            logger.info("Waiting for retry queue worker to terminate")
            self._retry_worker_thread.join(timeout=2.0)
            if self._retry_worker_thread.is_alive():
                logger.warning("Retry queue worker did not terminate within timeout")
        
        # Checkpoint state
        logger.info("Persisting state before shutdown")
        self._persist_state()
        
        # Shutdown thread pool
        logger.info("Shutting down thread pool")
        self.thread_pool.shutdown(wait=True)
        
        logger.info("GuaranteedDeliveryManager shutdown complete")
    
    def _start_workers(self) -> None:
        """
        Start worker threads for processing queues.
        """
        # Start pending queue worker
        self._pending_worker_thread = threading.Thread(
            target=self._pending_queue_worker,
            name="PendingQueueWorker",
            daemon=True
        )
        self._pending_worker_thread.start()
        logger.info("Pending queue worker started")
        
        # Start retry queue worker
        self._retry_worker_thread = threading.Thread(
            target=self._retry_queue_worker,
            name="RetryQueueWorker",
            daemon=True
        )
        self._retry_worker_thread.start()
        logger.info("Retry queue worker started")
    
    def _pending_queue_worker(self) -> None:
        """
        Worker thread for processing the pending queue.
        """
        logger.info(f"Pending queue worker started with thread ID {threading.get_ident()}")
        
        while self._running and not self._shutdown_event.is_set():
            try:
                # Get next event from pending queue with timeout
                try:
                    # Use a timeout to allow checking shutdown flag
                    item = self.pending_queue.get(timeout=0.1)
                    _, event_id = item
                    
                    # Process event
                    self._process_event(event_id)
                    
                    # Mark task as done
                    self.pending_queue.task_done()
                except Queue.Empty:
                    # No items in queue, just continue and check shutdown flag
                    continue
                
            except Exception as e:
                logger.error(f"Error in pending queue worker: {str(e)}")
                # Check shutdown flag before sleeping
                if not self._running or self._shutdown_event.is_set():
                    break
                # Sleep briefly to avoid tight loop in case of persistent errors
                time.sleep(0.1)
        
        logger.info("Pending queue worker shutting down")
    
    def _retry_queue_worker(self) -> None:
        """
        Worker thread for processing the retry queue.
        """
        logger.info(f"Retry queue worker started with thread ID {threading.get_ident()}")
        
        while self._running and not self._shutdown_event.is_set():
            try:
                # Get next event from retry queue with timeout
                try:
                    # Use a timeout to allow checking shutdown flag
                    item = self.retry_queue.get(timeout=0.1)
                    retry_time, event_id = item
                    
                    # Check if it's time to retry
                    current_time = time.time()
                    if retry_time > current_time:
                        # Not yet time to retry, put back in queue
                        self.retry_queue.put((retry_time, event_id))
                        # Use event wait instead of sleep to allow immediate shutdown
                        self._shutdown_event.wait(timeout=0.1)
                    else:
                        # Process event
                        self._process_event(event_id)
                    
                    # Mark task as done
                    self.retry_queue.task_done()
                except Queue.Empty:
                    # No items in queue, just continue and check shutdown flag
                    continue
                
            except Exception as e:
                logger.error(f"Error in retry queue worker: {str(e)}")
                # Check shutdown flag before sleeping
                if not self._running or self._shutdown_event.is_set():
                    break
                # Use event wait instead of sleep to allow immediate shutdown
                self._shutdown_event.wait(timeout=0.1)
        
        logger.info("Retry queue worker shutting down")
    
    def _process_event(self, event_id: str) -> None:
        """
        Process an event for delivery.
        
        Args:
            event_id: The ID of the event to process
        """
        # Check shutdown flag before processing
        if not self._running or self._shutdown_event.is_set():
            logger.info(f"Skipping event processing during shutdown: {event_id}")
            return
            
        # Get event from store
        with self.store_lock:
            if event_id not in self.event_store:
                logger.warning(f"Cannot process event: Event {event_id} not found")
                return
            
            event = self.event_store[event_id]
        
        # Check if we have a storage callback
        if not self.storage_callback:
            logger.error("No storage callback registered")
            return
        
        try:
            # Attempt to deliver event
            success = self.storage_callback(event)
            
            if success:
                # Confirm delivery
                self.confirm_delivery(event_id)
            else:
                # Retry delivery
                logger.warning(f"Delivery failed for event: {event_id}")
                self.retry_failed_delivery(event_id)
                
        except Exception as e:
            logger.error(f"Error delivering event {event_id}: {str(e)}")
            # Retry delivery
            self.retry_failed_delivery(event_id)
    
    def _checkpoint_if_needed(self) -> None:
        """
        Checkpoint state if enough time has passed since last checkpoint.
        """
        current_time = time.time()
        if current_time - self.last_checkpoint_time >= CHECKPOINT_INTERVAL:
            self._persist_state()
            self.last_checkpoint_time = current_time
    
    def _persist_state(self) -> None:
        """
        Persist the current state to disk.
        """
        try:
            # Create state to persist
            state = {
                "event_store": {k: v.to_dict() for k, v in self.event_store.items()},
                "pending_queue": list(self.pending_queue.queue),
                "retry_queue": list(self.retry_queue.queue),
                "timestamp": time.time()
            }
            
            # Write to temporary file first
            temp_path = f"{self.storage_path}.tmp"
            with open(temp_path, 'wb') as f:
                pickle.dump(state, f)
            
            # Rename to actual file (atomic operation)
            os.rename(temp_path, self.storage_path)
            
            logger.debug(f"State persisted to {self.storage_path}")
            
        except Exception as e:
            logger.error(f"Error persisting state: {str(e)}")
    
    def _load_persisted_state(self) -> None:
        """
        Load persisted state from disk if available.
        """
        if not os.path.exists(self.storage_path):
            logger.info("No persisted state found")
            return
        
        try:
            with open(self.storage_path, 'rb') as f:
                state = pickle.load(f)
            
            # Restore event store
            for event_dict in state.get("event_store", {}).values():
                event = MemoryEvent.from_dict(event_dict)
                self.event_store[event.event_id] = event
            
            # Restore pending queue
            for item in state.get("pending_queue", []):
                self.pending_queue.put(item)
            
            # Restore retry queue
            for item in state.get("retry_queue", []):
                self.retry_queue.put(item)
            
            logger.info(f"Loaded persisted state from {self.storage_path}")
            logger.info(f"Restored {len(self.event_store)} events, {self.pending_queue.qsize()} pending, {self.retry_queue.qsize()} retries")
            
        except Exception as e:
            logger.error(f"Error loading persisted state: {str(e)}")
