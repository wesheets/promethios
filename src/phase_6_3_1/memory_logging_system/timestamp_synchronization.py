"""
Timestamp Synchronization Service for the Memory Logging System.

This module implements consistent timestamp handling across all components
in the Promethios Memory Logging System.
"""

import time
import threading
import logging
import statistics
import uuid
import json
import os
import traceback
import sys
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import ntplib

from memory_event import TimestampMetadata

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("TimestampSynchronization")

# Constants
DEFAULT_SYNC_INTERVAL = 60  # seconds
DEFAULT_NTP_SERVERS = [
    "pool.ntp.org",
    "time.google.com",
    "time.cloudflare.com",
    "time.apple.com"
]
MAX_TIME_SOURCES = 5
TIME_SOURCE_TIMEOUT = 2.0  # seconds
MAX_SYNC_OFFSET = 1.0  # seconds
TIMESTAMP_PRECISION = 6  # decimal places


class TimeSource:
    """Represents a time source for synchronization."""
    
    def __init__(self, source_id: str, name: str):
        self.source_id = source_id
        self.name = name
        self.last_offset = 0.0
        self.confidence_score = 1.0
        self.last_sync_time = 0.0
        self.sync_count = 0
        self.error_count = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "source_id": self.source_id,
            "name": self.name,
            "last_offset": self.last_offset,
            "confidence_score": self.confidence_score,
            "last_sync_time": self.last_sync_time,
            "sync_count": self.sync_count,
            "error_count": self.error_count
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TimeSource':
        """Create from dictionary representation."""
        source = cls(data.get("source_id", str(uuid.uuid4())), data.get("name", "unknown"))
        source.last_offset = data.get("last_offset", 0.0)
        source.confidence_score = data.get("confidence_score", 1.0)
        source.last_sync_time = data.get("last_sync_time", 0.0)
        source.sync_count = data.get("sync_count", 0)
        source.error_count = data.get("error_count", 0)
        return source


class TimestampSynchronizationService:
    """
    Provides consistent timestamps across all components.
    
    This service synchronizes with external time sources and provides
    a unified time reference for all memory events.
    """
    
    def __init__(self, ntp_servers: List[str] = None, sync_interval: int = DEFAULT_SYNC_INTERVAL):
        """
        Initialize the TimestampSynchronizationService.
        
        Args:
            ntp_servers: List of NTP servers to use for synchronization
            sync_interval: Interval between synchronization attempts in seconds
        """
        logger.info("INIT: Starting TimestampSynchronizationService initialization")
        self.ntp_servers = ntp_servers or DEFAULT_NTP_SERVERS
        self.sync_interval = sync_interval
        
        # Initialize time sources
        self.time_sources: Dict[str, TimeSource] = {
            "system": TimeSource("system", "System Clock"),
            "monotonic": TimeSource("monotonic", "Monotonic Clock")
        }
        
        # Add NTP sources
        for i, server in enumerate(self.ntp_servers[:MAX_TIME_SOURCES-2]):
            source_id = f"ntp_{i}"
            self.time_sources[source_id] = TimeSource(source_id, f"NTP: {server}")
        
        # Initialize NTP client
        self.ntp_client = ntplib.NTPClient()
        
        # Initialize synchronization state
        self.last_sync_time = 0.0
        self.system_offset = 0.0
        self.primary_source_id = "system"
        
        # Initialize lock
        self.sync_lock = threading.Lock()
        
        # Initialize sequence context
        self.sequence_context: Dict[str, Any] = {
            "last_timestamp": 0.0,
            "counter": 0
        }
        
        # Initialize running flag for thread control
        self._running = True
        self._shutdown_event = threading.Event()
        
        # Thread state tracking
        self._thread_started = False
        self._thread_terminated = False
        
        # Start synchronization thread
        logger.info("INIT: Creating synchronization thread")
        self.sync_thread = threading.Thread(target=self._sync_thread_worker, name="TimestampSyncThread", daemon=False)
        logger.info(f"INIT: Thread created with ID: {self.sync_thread.ident}")
        self.sync_thread.start()
        self._thread_started = True
        logger.info(f"INIT: Thread started, is_alive={self.sync_thread.is_alive()}")
        
        logger.info(f"INIT: TimestampSynchronizationService initialized with {len(self.time_sources)} time sources")
    
    def get_synchronized_timestamp(self) -> Tuple[float, TimestampMetadata]:
        """
        Get a synchronized timestamp with metadata.
        
        Returns:
            Tuple of (timestamp, metadata)
        """
        # Get raw timestamp from system clock
        raw_timestamp = time.time()
        
        # Apply system offset
        synchronized_time = raw_timestamp + self.system_offset
        
        # Ensure monotonicity
        with self.sync_lock:
            if synchronized_time <= self.sequence_context["last_timestamp"]:
                # If timestamp would go backwards, increment by a small amount
                synchronized_time = self.sequence_context["last_timestamp"] + 0.000001
                self.sequence_context["counter"] += 1
            else:
                self.sequence_context["counter"] = 0
            
            # Update last timestamp
            self.sequence_context["last_timestamp"] = synchronized_time
        
        # Round to desired precision
        synchronized_time = round(synchronized_time, TIMESTAMP_PRECISION)
        
        # Create timestamp metadata
        metadata = TimestampMetadata()
        metadata.timestamp = synchronized_time
        metadata.source = self.primary_source_id
        metadata.synchronization_offset = self.system_offset
        metadata.confidence_score = self.time_sources[self.primary_source_id].confidence_score
        metadata.sequence_context = {
            "counter": self.sequence_context["counter"],
            "source": self.primary_source_id
        }
        
        return synchronized_time, metadata
    
    def validate_timestamp_sequence(self, event_sequence: List[Dict[str, Any]]) -> bool:
        """
        Validate that a sequence of events has consistent timestamps.
        
        Args:
            event_sequence: List of event dictionaries with timestamp fields
            
        Returns:
            True if sequence is valid, False otherwise
        """
        if not event_sequence:
            return True
        
        # Extract timestamps
        timestamps = [event.get("timestamp", 0.0) for event in event_sequence]
        
        # Check if timestamps are monotonically increasing
        for i in range(1, len(timestamps)):
            if timestamps[i] < timestamps[i-1]:
                logger.warning(f"Non-monotonic timestamps detected: {timestamps[i-1]} -> {timestamps[i]}")
                return False
        
        return True
    
    def resolve_timestamp_conflicts(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Resolve timestamp conflicts in a list of events.
        
        Args:
            events: List of event dictionaries with timestamp fields
            
        Returns:
            List of events with resolved timestamps
        """
        if not events:
            return []
        
        # Sort events by timestamp
        sorted_events = sorted(events, key=lambda e: e.get("timestamp", 0.0))
        
        # Ensure monotonicity
        last_timestamp = sorted_events[0].get("timestamp", 0.0)
        for i in range(1, len(sorted_events)):
            current_timestamp = sorted_events[i].get("timestamp", 0.0)
            
            if current_timestamp <= last_timestamp:
                # Adjust timestamp to ensure monotonicity
                new_timestamp = last_timestamp + 0.000001
                
                # Update event timestamp
                sorted_events[i]["timestamp"] = new_timestamp
                
                # Update metadata if present
                metadata = sorted_events[i].get("timestamp_metadata", {})
                if metadata:
                    metadata["timestamp"] = new_timestamp
                    metadata["sequence_context"] = metadata.get("sequence_context", {})
                    metadata["sequence_context"]["adjusted"] = True
                    sorted_events[i]["timestamp_metadata"] = metadata
                
                logger.debug(f"Resolved timestamp conflict: {current_timestamp} -> {new_timestamp}")
                
                # Update last timestamp
                last_timestamp = new_timestamp
            else:
                last_timestamp = current_timestamp
        
        return sorted_events
    
    def calibrate_time_sources(self) -> Dict[str, Any]:
        """
        Calibrate time sources and update synchronization state.
        
        Returns:
            Dictionary with calibration results
        """
        # Check if we're still running before calibrating
        if self._shutdown_event.is_set() or not self._running:
            logger.info("CALIBRATE: Skipping calibration as service is shutting down")
            return {"skipped": True, "reason": "shutting_down"}
            
        with self.sync_lock:
            # Get raw timestamps from all sources
            raw_timestamps = self._get_raw_timestamps_from_sources()
            
            # Calculate offsets
            offsets = self._calculate_synchronization_offsets(raw_timestamps)
            
            # Select primary time source
            self.primary_source_id = self._select_primary_time_source(raw_timestamps)
            
            # Update system offset
            if self.primary_source_id in offsets:
                self.system_offset = offsets[self.primary_source_id]
            
            # Update last sync time
            self.last_sync_time = time.time()
            
            # Prepare results
            results = {
                "primary_source": self.primary_source_id,
                "system_offset": self.system_offset,
                "sync_time": self.last_sync_time,
                "sources": {source_id: source.to_dict() for source_id, source in self.time_sources.items()}
            }
            
            logger.info(f"Time sources calibrated. Primary: {self.primary_source_id}, Offset: {self.system_offset:.6f}s")
            
            return results
    
    def shutdown(self) -> None:
        """
        Shutdown the timestamp synchronization service.
        
        This stops the synchronization thread and releases resources.
        """
        logger.info("SHUTDOWN: Starting TimestampSynchronizationService shutdown sequence")
        logger.info(f"SHUTDOWN: Current thread state - _running={self._running}, thread_alive={self.sync_thread.is_alive() if hasattr(self, 'sync_thread') else 'N/A'}")
        
        # Set shutdown event first to signal immediate termination
        logger.info("SHUTDOWN: Setting shutdown event")
        self._shutdown_event.set()
        
        # Set running flag to False to stop the sync thread
        logger.info("SHUTDOWN: Setting _running flag to False")
        self._running = False
        
        # Wait for sync thread to terminate (with timeout)
        if hasattr(self, 'sync_thread') and self.sync_thread and self.sync_thread.is_alive():
            logger.info(f"SHUTDOWN: Waiting for sync thread (id={self.sync_thread.ident}) to terminate...")
            
            # Join with timeout
            self.sync_thread.join(timeout=5.0)
            
            # Check if thread terminated
            if self.sync_thread.is_alive():
                logger.warning("SHUTDOWN: Sync thread did not terminate gracefully within timeout")
                logger.warning(f"SHUTDOWN: Thread state: is_alive={self.sync_thread.is_alive()}, daemon={self.sync_thread.daemon}")
                
                # Try to get thread stack trace
                try:
                    for th in threading.enumerate():
                        if th.ident == self.sync_thread.ident:
                            logger.warning(f"SHUTDOWN: Found thread in threading.enumerate(): {th.name}")
                except Exception as e:
                    logger.error(f"SHUTDOWN: Error getting thread info: {str(e)}")
                
                # Force thread termination if supported by platform
                try:
                    logger.warning("SHUTDOWN: Attempting to force thread termination")
                    import ctypes
                    thread_id = self.sync_thread.ident
                    if thread_id:
                        res = ctypes.pythonapi.PyThreadState_SetAsyncExc(
                            ctypes.c_long(thread_id),
                            ctypes.py_object(SystemExit)
                        )
                        logger.warning(f"SHUTDOWN: Force termination result: {res}")
                        if res > 1:
                            ctypes.pythonapi.PyThreadState_SetAsyncExc(ctypes.c_long(thread_id), 0)
                            logger.error("SHUTDOWN: Failed to terminate sync thread")
                except Exception as e:
                    logger.error(f"SHUTDOWN: Error attempting to force thread termination: {str(e)}")
                    logger.error(f"SHUTDOWN: {traceback.format_exc()}")
            else:
                logger.info("SHUTDOWN: Sync thread terminated successfully")
                self._thread_terminated = True
        else:
            logger.info("SHUTDOWN: No sync thread to terminate or thread already terminated")
            self._thread_terminated = True
        
        # Final assertion to verify thread state
        if hasattr(self, 'sync_thread') and self.sync_thread:
            thread_alive = self.sync_thread.is_alive()
            logger.info(f"SHUTDOWN: Final thread state check - is_alive={thread_alive}")
            if thread_alive:
                logger.error("SHUTDOWN: CRITICAL - Thread is still alive after shutdown sequence")
            else:
                logger.info("SHUTDOWN: Thread successfully terminated")
                self._thread_terminated = True
        
        logger.info("SHUTDOWN: TimestampSynchronizationService shutdown complete")
    
    def _sync_thread_worker(self) -> None:
        """
        Worker thread for periodic time synchronization.
        """
        thread_id = threading.get_ident()
        logger.info(f"THREAD: Synchronization thread started with ID {thread_id}")
        
        # Track iterations for debugging
        iteration = 0
        
        while self._running and not self._shutdown_event.is_set():
            iteration += 1
            try:
                logger.debug(f"THREAD: Iteration {iteration} starting")
                
                # Check shutdown flags at the beginning of each iteration
                if not self._running or self._shutdown_event.is_set():
                    logger.info(f"THREAD: Detected shutdown signal at iteration start {iteration}")
                    break
                
                # Check if it's time to sync
                current_time = time.time()
                if current_time - self.last_sync_time >= self.sync_interval:
                    # Calibrate time sources
                    self.calibrate_time_sources()
                
                # Use interruptible wait instead of time.sleep
                # This allows immediate response to shutdown signals
                logger.debug(f"THREAD: Starting interruptible wait in iteration {iteration}")
                wait_start = time.time()
                
                # Wait for sync_interval or until shutdown is signaled
                # Check every 0.1 seconds for shutdown signal
                for i in range(int(self.sync_interval * 10)):
                    # Exit immediately if shutdown is requested
                    if not self._running or self._shutdown_event.is_set():
                        logger.info(f"THREAD: Interrupted wait due to shutdown signal (iteration {iteration}, wait step {i})")
                        break
                    
                    # Wait for a short time, but allow interruption
                    # This is the key change - using Event.wait() instead of time.sleep()
                    interrupted = self._shutdown_event.wait(0.1)
                    if interrupted:
                        logger.info(f"THREAD: Wait interrupted by shutdown event (iteration {iteration}, wait step {i})")
                        break
                
                wait_duration = time.time() - wait_start
                logger.debug(f"THREAD: Wait completed after {wait_duration:.2f}s in iteration {iteration}")
                
                # Check shutdown flags after wait
                if not self._running or self._shutdown_event.is_set():
                    logger.info(f"THREAD: Detected shutdown signal after wait (iteration {iteration})")
                    break
                
            except Exception as e:
                logger.error(f"THREAD: Error in synchronization thread (iteration {iteration}): {str(e)}")
                logger.error(f"THREAD: {traceback.format_exc()}")
                
                # Use interruptible wait here too
                for i in range(10):  # Wait up to 1 second
                    if not self._running or self._shutdown_event.is_set():
                        break
                    interrupted = self._shutdown_event.wait(0.1)
                    if interrupted:
                        break
                
            # Check shutdown flags after exception handling
            if not self._running or self._shutdown_event.is_set():
                logger.info(f"THREAD: Detected shutdown signal after exception handling (iteration {iteration})")
                break
        
        # Log reason for termination
        if not self._running:
            logger.info("THREAD: Synchronization thread terminated due to _running=False")
        elif self._shutdown_event.is_set():
            logger.info("THREAD: Synchronization thread terminated due to shutdown event")
        else:
            logger.info("THREAD: Synchronization thread terminated for unknown reason")
        
        self._thread_terminated = True
        logger.info("THREAD: Synchronization thread terminated")
    
    def _get_raw_timestamps_from_sources(self) -> Dict[str, float]:
        """
        Get raw timestamps from all available time sources.
        
        Returns:
            Dictionary mapping source IDs to timestamps
        """
        # Check if we're still running before proceeding
        if not self._running or self._shutdown_event.is_set():
            logger.info("SOURCES: Skipping timestamp collection as service is shutting down")
            return {"system": time.time()}
            
        raw_timestamps = {}
        
        # System clock
        raw_timestamps["system"] = time.time()
        self.time_sources["system"].last_sync_time = raw_timestamps["system"]
        self.time_sources["system"].sync_count += 1
        
        # Monotonic clock (relative to system clock)
        monotonic_base = time.time() - time.monotonic()
        raw_timestamps["monotonic"] = monotonic_base + time.monotonic()
        self.time_sources["monotonic"].last_sync_time = raw_timestamps["system"]
        self.time_sources["monotonic"].sync_count += 1
        
        # NTP sources
        for i, server in enumerate(self.ntp_servers[:MAX_TIME_SOURCES-2]):
            # Check if we're still running before each NTP request
            if not self._running or self._shutdown_event.is_set():
                logger.info(f"SOURCES: Skipping NTP source {i} as service is shutting down")
                break
                
            source_id = f"ntp_{i}"
            try:
                # Query NTP server
                response = self.ntp_client.request(server, timeout=TIME_SOURCE_TIMEOUT)
                
                # Calculate NTP timestamp
                ntp_timestamp = response.tx_time
                
                # Store timestamp
                raw_timestamps[source_id] = ntp_timestamp
                
                # Update source stats
                self.time_sources[source_id].last_sync_time = raw_timestamps["system"]
                self.time_sources[source_id].sync_count += 1
                
            except Exception as e:
                logger.warning(f"Failed to get time from NTP server {server}: {str(e)}")
                self.time_sources[source_id].error_count += 1
        
        return raw_timestamps
    
    def _calculate_synchronization_offsets(self, raw_timestamps: Dict[str, float]) -> Dict[str, float]:
        """
        Calculate synchronization offsets for all time sources.
        
        Args:
            raw_timestamps: Dictionary mapping source IDs to timestamps
            
        Returns:
            Dictionary mapping source IDs to offsets
        """
        offsets = {}
        
        # System clock is reference (zero offset)
        system_time = raw_timestamps.get("system", time.time())
        offsets["system"] = 0.0
        self.time_sources["system"].last_offset = 0.0
        
        # Calculate offsets for other sources
        for source_id, timestamp in raw_timestamps.items():
            if source_id == "system":
                continue
            
            # Calculate offset (how much to add to system time)
            offset = timestamp - system_time
            
            # Store offset
            offsets[source_id] = offset
            
            # Update source stats
            if source_id in self.time_sources:
                self.time_sources[source_id].last_offset = offset
                
                # Update confidence score based on offset magnitude
                if abs(offset) > MAX_SYNC_OFFSET:
                    # Large offset reduces confidence
                    self.time_sources[source_id].confidence_score = max(
                        0.1, self.time_sources[source_id].confidence_score * 0.9
                    )
                else:
                    # Small offset increases confidence
                    self.time_sources[source_id].confidence_score = min(
                        1.0, self.time_sources[source_id].confidence_score * 1.1
                    )
        
        return offsets
    
    def _select_primary_time_source(self, raw_timestamps: Dict[str, float]) -> str:
        """
        Select the primary time source based on reliability and accuracy.
        
        Args:
            raw_timestamps: Dictionary mapping source IDs to timestamps
            
        Returns:
            ID of the selected primary source
        """
        # Prefer NTP sources if available and reliable
        ntp_sources = [source_id for source_id in raw_timestamps.keys() if source_id.startswith("ntp_")]
        
        if ntp_sources:
            # Filter sources by confidence score
            reliable_sources = [
                source_id for source_id in ntp_sources
                if self.time_sources[source_id].confidence_score >= 0.8
            ]
            
            if reliable_sources:
                # Select source with highest confidence score
                return max(
                    reliable_sources,
                    key=lambda source_id: self.time_sources[source_id].confidence_score
                )
        
        # Fall back to monotonic clock if reliable
        if "monotonic" in raw_timestamps and self.time_sources["monotonic"].confidence_score >= 0.9:
            return "monotonic"
        
        # Fall back to system clock
        return "system"
