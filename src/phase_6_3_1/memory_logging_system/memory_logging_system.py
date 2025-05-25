"""
Memory Logging System - Main integration module.

This module provides the main interface for the Memory Logging System,
integrating all components and providing a unified API.
"""

import os
import time
import logging
import threading
import json
import uuid
from typing import Dict, Any, List, Optional, Tuple

from memory_event import MemoryEvent, TimestampMetadata
from guaranteed_delivery import GuaranteedDeliveryManager
from timestamp_synchronization import TimestampSynchronizationService
from reflection_threading import ReflectionThreadManager

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("MemoryLoggingSystem")

class MemoryLoggingSystem:
    """
    Main interface for the Memory Logging System.
    
    This class integrates all components of the Memory Logging System
    and provides a unified API for logging memory events.
    """
    
    def __init__(self, storage_path: str = "/tmp/memory_logging_system"):
        """
        Initialize the Memory Logging System.
        
        Args:
            storage_path: Path to store memory logs and state
        """
        self.storage_path = storage_path
        
        # Create storage directory if it doesn't exist
        os.makedirs(storage_path, exist_ok=True)
        
        # Initialize components in the correct order
        # 1. First initialize the guaranteed delivery manager
        self.delivery_manager = GuaranteedDeliveryManager(
            storage_path=os.path.join(storage_path, "delivery_queue")
        )
        
        # 2. Then initialize the timestamp synchronization service
        self.timestamp_service = TimestampSynchronizationService()
        
        # 3. Finally initialize the reflection threading manager
        self.threading_manager = ReflectionThreadManager()
        
        # Register storage callback with delivery manager
        self.delivery_manager.register_storage_callback(self._store_event)
        
        logger.info(f"MemoryLoggingSystem initialized with storage path: {storage_path}")
    
    def log_memory_event(self, event_type: str, event_data: Dict[str, Any]) -> str:
        """
        Log a memory event with guaranteed delivery.
        
        Args:
            event_type: Type of memory event
            event_data: Event data dictionary
            
        Returns:
            Event ID
        """
        # Generate event ID
        event_id = str(uuid.uuid4())
        
        # Get synchronized timestamp
        timestamp, timestamp_metadata = self.timestamp_service.get_synchronized_timestamp()
        
        # Create memory event
        event = MemoryEvent(
            event_id=event_id,
            event_type=event_type,
            timestamp=timestamp,
            timestamp_metadata=timestamp_metadata,
            data=event_data
        )
        
        # Submit event for guaranteed delivery
        self.delivery_manager.queue_event(event)
        
        return event_id
    
    def query_events(self, event_type: Optional[str] = None, 
                    start_time: Optional[float] = None,
                    end_time: Optional[float] = None,
                    limit: int = 100) -> List[Dict[str, Any]]:
        """
        Query memory events based on criteria.
        
        Args:
            event_type: Filter by event type
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of events to return
            
        Returns:
            List of matching events
        """
        # Implement query logic
        # This is a placeholder for actual implementation
        return []
    
    def _store_event(self, event: MemoryEvent) -> bool:
        """
        Store a memory event in the storage backend.
        
        Args:
            event: Memory event to store
            
        Returns:
            True if storage was successful, False otherwise
        """
        try:
            # Convert event to dictionary
            event_dict = event.to_dict()
            
            # Generate filename
            filename = f"{event.event_id}.json"
            filepath = os.path.join(self.storage_path, filename)
            
            # Write event to file
            with open(filepath, 'w') as f:
                json.dump(event_dict, f, indent=2)
            
            return True
        except Exception as e:
            logger.error(f"Failed to store event {event.event_id}: {str(e)}")
            return False
    
    def shutdown(self) -> None:
        """
        Shutdown the Memory Logging System.
        
        This method ensures all components are properly shut down
        in the correct order to prevent resource leaks or data loss.
        """
        logger.info("Shutting down MemoryLoggingSystem")
        
        # Shutdown components in reverse order of initialization
        # 1. First shutdown delivery manager to stop accepting new events
        logger.info("Shutting down GuaranteedDeliveryManager")
        self.delivery_manager.shutdown()
        
        # 2. Then shutdown threading manager to stop processing operations
        logger.info("Shutting down ReflectionThreadingManager")
        self.threading_manager.shutdown()
        
        # 3. Finally shutdown timestamp service
        logger.info("Shutting down TimestampSynchronizationService")
        self.timestamp_service.shutdown()
        
        logger.info("MemoryLoggingSystem shutdown complete")
