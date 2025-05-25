"""
Memory Event Module for the Memory Logging System.

This module defines the core data structures for memory events in the
Promethios Memory Logging System.
"""

import uuid
import time
from enum import Enum
from typing import Dict, Any, Optional, List


class DeliveryStatus(str, Enum):
    """Enum representing the delivery status of a memory event."""
    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETRYING = "retrying"


class TimestampMetadata:
    """Metadata for synchronized timestamps."""
    
    def __init__(self):
        self.timestamp: float = None  # Timestamp value
        self.source: str = None  # Time source
        self.synchronization_offset: float = 0.0  # Synchronization offset
        self.confidence_score: float = 1.0  # Confidence score (0.0-1.0)
        self.sequence_context: Dict[str, Any] = {}  # Sequence context
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "timestamp": self.timestamp,
            "source": self.source,
            "synchronization_offset": self.synchronization_offset,
            "confidence_score": self.confidence_score,
            "sequence_context": self.sequence_context
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TimestampMetadata':
        """Create from dictionary representation."""
        metadata = cls()
        metadata.timestamp = data.get("timestamp")
        metadata.source = data.get("source")
        metadata.synchronization_offset = data.get("synchronization_offset", 0.0)
        metadata.confidence_score = data.get("confidence_score", 1.0)
        metadata.sequence_context = data.get("sequence_context", {})
        return metadata


class MemoryEvent:
    """Represents a memory event in the Promethios system."""
    
    def __init__(self, event_type: str = None, content: Dict[str, Any] = None, 
                 source_id: str = None, event_id: str = None, metadata: Dict[str, Any] = None,
                 timestamp: float = None, sequence_number: int = None, 
                 timestamp_metadata: TimestampMetadata = None, data: Dict[str, Any] = None):
        """
        Initialize a memory event.
        
        Args:
            event_type: Type of memory event
            content: Event content/data
            source_id: Source component identifier
            event_id: Unique event identifier (generated if not provided)
            metadata: Event metadata
            timestamp: Event timestamp (current time if not provided)
            sequence_number: Sequence number within source
            timestamp_metadata: Metadata for synchronized timestamps
            data: Alternative name for content/event data
        """
        self.event_id: str = event_id if event_id else str(uuid.uuid4())
        self.timestamp: float = timestamp if timestamp else time.time()
        self.source_id: str = source_id
        self.event_type: str = event_type
        self.content: Dict[str, Any] = content or data or {}
        self.metadata: Dict[str, Any] = metadata or {}
        self.sequence_number: int = sequence_number
        self.delivery_status: DeliveryStatus = DeliveryStatus.PENDING
        self.retry_count: int = 0
        self.timestamp_metadata: TimestampMetadata = timestamp_metadata or TimestampMetadata()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "source_id": self.source_id,
            "event_type": self.event_type,
            "content": self.content,
            "data": self.content,  # Add data key for backward compatibility
            "metadata": self.metadata,
            "sequence_number": self.sequence_number,
            "delivery_status": self.delivery_status.value if self.delivery_status else None,
            "retry_count": self.retry_count,
            "timestamp_metadata": self.timestamp_metadata.to_dict() if self.timestamp_metadata else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MemoryEvent':
        """Create from dictionary representation."""
        timestamp_metadata_dict = data.get("timestamp_metadata")
        timestamp_metadata = None
        if timestamp_metadata_dict:
            timestamp_metadata = TimestampMetadata.from_dict(timestamp_metadata_dict)
            
        event = cls(
            event_type=data.get("event_type"),
            content=data.get("content", {}),
            source_id=data.get("source_id"),
            event_id=data.get("event_id", str(uuid.uuid4())),
            metadata=data.get("metadata", {}),
            timestamp=data.get("timestamp", time.time()),
            sequence_number=data.get("sequence_number"),
            timestamp_metadata=timestamp_metadata
        )
        
        delivery_status = data.get("delivery_status")
        if delivery_status:
            try:
                event.delivery_status = DeliveryStatus(delivery_status)
            except ValueError:
                event.delivery_status = DeliveryStatus.PENDING
        
        event.retry_count = data.get("retry_count", 0)
        
        return event
    
    def update_delivery_status(self, status: DeliveryStatus) -> None:
        """Update the delivery status of the event."""
        self.delivery_status = status
        
        # Update metadata with delivery information
        self.metadata["delivery_updated_at"] = time.time()
        self.metadata["delivery_status_history"] = self.metadata.get("delivery_status_history", [])
        self.metadata["delivery_status_history"].append({
            "status": status.value,
            "timestamp": time.time()
        })
    
    def increment_retry_count(self) -> int:
        """Increment the retry count and return the new value."""
        self.retry_count += 1
        return self.retry_count
