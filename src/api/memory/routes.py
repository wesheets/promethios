"""
Memory API Routes for Promethios Phase 6.1

This module provides API routes for memory management in the Promethios
governance system, including storage, retrieval, and querying of memory records.
"""

import json
import os
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import uuid
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define memory query class for backward compatibility
class MemoryQuery:
    """Query parameters for memory records."""
    
    def __init__(self, record_type=None, time_range=None, filters=None, limit=None, offset=None, **kwargs):
        """
        Initialize a memory query.
        
        Args:
            record_type: Type of records to query
            time_range: Time range for filtering
            filters: Additional filters
            limit: Maximum number of records to return
            offset: Offset for pagination
            **kwargs: Additional keyword arguments for backward compatibility
        """
        self.record_type = record_type
        self.time_range = time_range or {}
        self.filters = filters or {}
        self.limit = limit
        self.offset = offset or 0
        
        # Store any additional kwargs for backward compatibility
        for key, value in kwargs.items():
            setattr(self, key, value)

# Define memory stats class for backward compatibility
class MemoryStats:
    """Statistics about the memory store."""
    
    def __init__(self, total_records=0, records_by_type=None, records_by_source=None, 
                 storage_usage_bytes=0, oldest_record_timestamp=None, newest_record_timestamp=None, **kwargs):
        """
        Initialize memory statistics.
        
        Args:
            total_records: Total number of records
            records_by_type: Count of records by type
            records_by_source: Count of records by source
            storage_usage_bytes: Storage usage in bytes
            oldest_record_timestamp: Timestamp of oldest record
            newest_record_timestamp: Timestamp of newest record
            **kwargs: Additional keyword arguments for backward compatibility
        """
        self.total_records = total_records
        self.records_by_type = records_by_type or {}
        self.records_by_source = records_by_source or {}
        self.storage_usage_bytes = storage_usage_bytes
        self.oldest_record_timestamp = oldest_record_timestamp
        self.newest_record_timestamp = newest_record_timestamp
        
        # Store any additional kwargs for backward compatibility
        for key, value in kwargs.items():
            setattr(self, key, value)

# Define memory record class for backward compatibility
class MemoryRecord:
    """Memory record for the Promethios governance system."""
    
    def __init__(self, record_id=None, content=None, metadata=None, timestamp=None, 
                 tags=None, source=None, agent_id=None, session_id=None, record_type=None, version=None, **kwargs):
        """
        Initialize a memory record.
        
        Args:
            record_id: Unique identifier for the record
            content: Content of the memory record
            metadata: Additional metadata for the record
            timestamp: Creation timestamp
            tags: Tags for categorization and search
            source: Source of the memory record (for backward compatibility)
            agent_id: ID of the agent that created the record
            session_id: ID of the session in which the record was created
            record_type: Type of memory record (for backward compatibility)
            version: Version of the record (for backward compatibility)
            **kwargs: Additional keyword arguments for backward compatibility
        """
        self.record_id = record_id or str(uuid.uuid4())
        self.content = content or {}
        self.metadata = metadata or {}
        self.timestamp = timestamp or datetime.now().isoformat()
        self.tags = tags or []
        self.source = source  # For backward compatibility
        self.agent_id = agent_id
        self.session_id = session_id
        self.record_type = record_type  # For backward compatibility
        self.version = version  # For backward compatibility
        
        # Store any additional kwargs for backward compatibility
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "record_id": self.record_id,
            "content": self.content,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
            "tags": self.tags,
            "agent_id": self.agent_id,
            "session_id": self.session_id,
            "source": self.source,
            "record_type": self.record_type,
            "version": self.version
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create a memory record from a dictionary."""
        return cls(
            record_id=data.get("record_id"),
            content=data.get("content"),
            metadata=data.get("metadata"),
            timestamp=data.get("timestamp"),
            tags=data.get("tags"),
            agent_id=data.get("agent_id"),
            session_id=data.get("session_id"),
            source=data.get("source"),  # For backward compatibility
            record_type=data.get("record_type"),  # For backward compatibility
            version=data.get("version")  # For backward compatibility
        )

# Define memory router class for backward compatibility
class MemoryRouter:
    """Router for memory API endpoints."""
    
    def __init__(self, memory_service=None, **kwargs):
        """
        Initialize the memory router.
        
        Args:
            memory_service: Memory service instance
            **kwargs: Additional keyword arguments for backward compatibility
        """
        self.memory_service = memory_service or MemoryStore()
        
        # Store any additional kwargs for backward compatibility
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def get_memory_record(self, record_id):
        """
        Get a memory record by ID.
        
        Args:
            record_id: ID of the record
            
        Returns:
            Memory record, or None if not found
        """
        return get_memory_record(record_id)
    
    def create_memory_record(self, record_data):
        """
        Create a new memory record.
        
        Args:
            record_data: Data for the new record
            
        Returns:
            Created record
        """
        return create_memory_record(record_data)
    
    def update_memory_record(self, record_id, update_data):
        """
        Update a memory record.
        
        Args:
            record_id: ID of the record to update
            update_data: New data for the record
            
        Returns:
            Updated record, or None if not found
        """
        return update_memory_record(record_id, update_data)
    
    def delete_memory_record(self, record_id):
        """
        Delete a memory record.
        
        Args:
            record_id: ID of the record to delete
            
        Returns:
            True if successful, False otherwise
        """
        return delete_memory_record(record_id)
    
    def query_memory(self, query):
        """
        Query memory records.
        
        Args:
            query: Query parameters
            
        Returns:
            List of matching records
        """
        # Convert query to dict if it's an object
        query_params = query
        if hasattr(query, '__dict__'):
            query_params = {k: v for k, v in query.__dict__.items() if v is not None}
        
        return query_memory(query_params)
    
    def search_memory(self, search_term):
        """
        Search memory records.
        
        Args:
            search_term: Search term
            
        Returns:
            List of matching records
        """
        return search_memory(search_term)
    
    def get_memory_stats(self):
        """
        Get statistics about the memory store.
        
        Returns:
            Memory statistics
        """
        stats_dict = get_memory_stats()
        return MemoryStats(**stats_dict)
    
    def get_memory_record_history(self, record_id):
        """
        Get the history of a memory record.
        
        Args:
            record_id: ID of the record
            
        Returns:
            List of historical versions of the record
        """
        return get_memory_record_history(record_id)
    
    def export_memory_records(self, export_params):
        """
        Export memory records.
        
        Args:
            export_params: Export parameters
            
        Returns:
            Export data
        """
        # Mock export data for compatibility
        return {
            "export_id": f"exp-{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now().isoformat(),
            "record_count": 1,
            "format": export_params.get("format", "json"),
            "records": []
        }
    
    def bulk_create_memory_records(self, records_data):
        """
        Create multiple memory records in bulk.
        
        Args:
            records_data: List of record data
            
        Returns:
            List of created records
        """
        # Mock implementation for compatibility
        return [create_memory_record(record_data) for record_data in records_data]

# Define memory store class for backward compatibility
class MemoryStore:
    """Memory storage for the Promethios governance system."""
    
    def __init__(self, storage_dir=None, **kwargs):
        """
        Initialize the memory store.
        
        Args:
            storage_dir: Directory for storing memory records
            **kwargs: Additional keyword arguments for backward compatibility
        """
        self.storage_dir = storage_dir or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "memory"
        )
        self.records = {}
        
        # Ensure storage directory exists
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Load existing records
        self.load_records()
    
    def load_records(self):
        """Load memory records from storage."""
        for filename in os.listdir(self.storage_dir):
            if filename.endswith(".json"):
                record_path = os.path.join(self.storage_dir, filename)
                try:
                    with open(record_path, 'r') as f:
                        record_data = json.load(f)
                    
                    record = MemoryRecord.from_dict(record_data)
                    self.records[record.record_id] = record
                except Exception as e:
                    logger.error(f"Error loading record {filename}: {str(e)}")
    
    def save_record(self, record):
        """
        Save a memory record to storage.
        
        Args:
            record: Memory record to save
            
        Returns:
            Record ID
        """
        # Ensure record has an ID
        if not hasattr(record, 'record_id') or not record.record_id:
            record.record_id = str(uuid.uuid4())
        
        # Store in memory
        self.records[record.record_id] = record
        
        # Save to file
        filename = f"{record.record_id}.json"
        filepath = os.path.join(self.storage_dir, filename)
        
        try:
            with open(filepath, 'w') as f:
                json.dump(record.to_dict(), f, indent=2)
            logger.info(f"Saved memory record: {record.record_id}")
        except Exception as e:
            logger.error(f"Error saving record {filename}: {str(e)}")
        
        return record.record_id
    
    def get_record(self, record_id):
        """
        Get a memory record by ID.
        
        Args:
            record_id: ID of the record to retrieve
            
        Returns:
            Memory record, or None if not found
        """
        return self.records.get(record_id)
    
    def delete_record(self, record_id):
        """
        Delete a memory record.
        
        Args:
            record_id: ID of the record to delete
            
        Returns:
            True if successful, False otherwise
        """
        if record_id not in self.records:
            logger.error(f"Record {record_id} not found")
            return False
        
        # Remove from memory
        del self.records[record_id]
        
        # Remove file
        filename = f"{record_id}.json"
        filepath = os.path.join(self.storage_dir, filename)
        
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
            logger.info(f"Deleted memory record: {record_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting record {filename}: {str(e)}")
            return False
    
    def query_records(self, query=None, tags=None, start_time=None, end_time=None, limit=None):
        """
        Query memory records.
        
        Args:
            query: Text query to search in content
            tags: Tags to filter by
            start_time: Start time for filtering
            end_time: End time for filtering
            limit: Maximum number of records to return
            
        Returns:
            List of matching memory records
        """
        results = list(self.records.values())
        
        # Filter by tags
        if tags:
            results = [r for r in results if any(tag in r.tags for tag in tags)]
        
        # Filter by time range
        if start_time:
            start_dt = datetime.fromisoformat(start_time)
            results = [r for r in results if datetime.fromisoformat(r.timestamp) >= start_dt]
        
        if end_time:
            end_dt = datetime.fromisoformat(end_time)
            results = [r for r in results if datetime.fromisoformat(r.timestamp) <= end_dt]
        
        # Filter by content query (simple contains check)
        if query:
            results = [r for r in results if query.lower() in json.dumps(r.content).lower()]
        
        # Sort by timestamp (newest first)
        results.sort(key=lambda r: r.timestamp, reverse=True)
        
        # Apply limit
        if limit and isinstance(limit, int):
            results = results[:limit]
        
        return results
    
    def search_records(self, query, **kwargs):
        """
        Search memory records (alias for query_records).
        
        Args:
            query: Text query to search in content
            **kwargs: Additional query parameters
            
        Returns:
            List of matching memory records
        """
        return self.query_records(query=query, **kwargs)
    
    def get_record_history(self, record_id):
        """
        Get the history of a memory record.
        
        Args:
            record_id: ID of the record
            
        Returns:
            List of historical versions of the record
        """
        # In a real implementation, this would retrieve historical versions
        # For now, we just return the current version in a list
        record = self.get_record(record_id)
        if not record:
            return []
        return [record]
    
    def export_records(self, format="json", records=None):
        """
        Export memory records.
        
        Args:
            format: Export format ("json" or "csv")
            records: Specific records to export, or None for all
            
        Returns:
            Export data as a string
        """
        records_to_export = records or list(self.records.values())
        
        if format.lower() == "json":
            return json.dumps([r.to_dict() for r in records_to_export], indent=2)
        elif format.lower() == "csv":
            # Simple CSV export
            header = "record_id,timestamp,tags\n"
            rows = [f"{r.record_id},{r.timestamp},{','.join(r.tags)}" for r in records_to_export]
            return header + "\n".join(rows)
        else:
            logger.error(f"Unsupported export format: {format}")
            return ""
    
    def get_stats(self):
        """
        Get statistics about the memory store.
        
        Returns:
            Dictionary of statistics
        """
        total_records = len(self.records)
        
        # Count records by tag
        tag_counts = {}
        for record in self.records.values():
            for tag in record.tags:
                if tag not in tag_counts:
                    tag_counts[tag] = 0
                tag_counts[tag] += 1
        
        # Get time range
        timestamps = [datetime.fromisoformat(r.timestamp) for r in self.records.values()]
        oldest = min(timestamps).isoformat() if timestamps else None
        newest = max(timestamps).isoformat() if timestamps else None
        
        return {
            "total_records": total_records,
            "tag_counts": tag_counts,
            "oldest_record_timestamp": oldest,
            "newest_record_timestamp": newest,
            "records_by_type": {},  # For backward compatibility
            "records_by_source": {},  # For backward compatibility
            "storage_usage_bytes": 0  # For backward compatibility
        }

# Create a singleton instance for global access
_memory_store = None

def get_memory_store():
    """Get the singleton instance of the memory store."""
    global _memory_store
    if _memory_store is None:
        _memory_store = MemoryStore()
    return _memory_store

# API route handlers for backward compatibility
def create_memory_record(record_data):
    """
    Create a new memory record.
    
    Args:
        record_data: Data for the new record
        
    Returns:
        Created record
    """
    store = get_memory_store()
    record = MemoryRecord.from_dict(record_data)
    store.save_record(record)
    return record

def get_memory_record(record_id):
    """
    Get a memory record by ID.
    
    Args:
        record_id: ID of the record
        
    Returns:
        Memory record, or None if not found
    """
    store = get_memory_store()
    return store.get_record(record_id)

def update_memory_record(record_id, record_data):
    """
    Update a memory record.
    
    Args:
        record_id: ID of the record to update
        record_data: New data for the record
        
    Returns:
        Updated record, or None if not found
    """
    store = get_memory_store()
    record = store.get_record(record_id)
    if not record:
        return None
    
    # Update record fields
    for key, value in record_data.items():
        if key != "record_id":  # Don't change the ID
            setattr(record, key, value)
    
    # Save the updated record
    store.save_record(record)
    return record

def delete_memory_record(record_id):
    """
    Delete a memory record.
    
    Args:
        record_id: ID of the record to delete
        
    Returns:
        True if successful, False otherwise
    """
    store = get_memory_store()
    return store.delete_record(record_id)

def query_memory(query_params):
    """
    Query memory records.
    
    Args:
        query_params: Query parameters
        
    Returns:
        List of matching records
    """
    store = get_memory_store()
    return store.query_records(**query_params)

def search_memory(query):
    """
    Search memory records.
    
    Args:
        query: Search query
        
    Returns:
        List of matching records
    """
    store = get_memory_store()
    return store.search_records(query)

def get_memory_record_history(record_id):
    """
    Get the history of a memory record.
    
    Args:
        record_id: ID of the record
        
    Returns:
        List of historical versions of the record
    """
    store = get_memory_store()
    return store.get_record_history(record_id)

def export_memory_records(format="json", records=None):
    """
    Export memory records.
    
    Args:
        format: Export format
        records: Specific records to export, or None for all
        
    Returns:
        Export data as a string
    """
    store = get_memory_store()
    return store.export_records(format, records)

def get_memory_stats():
    """
    Get statistics about the memory store.
    
    Returns:
        Dictionary of statistics
    """
    store = get_memory_store()
    return store.get_stats()

# Mock memory service for backward compatibility
class MemoryService:
    """Service for memory operations."""
    
    def __init__(self, **kwargs):
        """Initialize the memory service."""
        self.store = get_memory_store()
    
    def get_record(self, record_id):
        """Get a memory record by ID."""
        return self.store.get_record(record_id)
    
    def create_record(self, record_data):
        """Create a new memory record."""
        record = MemoryRecord.from_dict(record_data)
        self.store.save_record(record)
        return record
    
    def update_record(self, record_id, update_data):
        """Update a memory record."""
        record = self.store.get_record(record_id)
        if not record:
            return None
        
        # Update record fields
        for key, value in update_data.items():
            if key != "record_id":  # Don't change the ID
                setattr(record, key, value)
        
        # Save the updated record
        self.store.save_record(record)
        return record
    
    def delete_record(self, record_id):
        """Delete a memory record."""
        return self.store.delete_record(record_id)
    
    def query_records(self, query):
        """Query memory records."""
        # Convert query to dict if it's an object
        query_params = query
        if hasattr(query, '__dict__'):
            query_params = {k: v for k, v in query.__dict__.items() if v is not None}
        
        return self.store.query_records(**query_params)
    
    def search_records(self, query):
        """Search memory records."""
        return self.store.search_records(query)
    
    def get_record_history(self, record_id):
        """Get the history of a memory record."""
        return self.store.get_record_history(record_id)
    
    def export_records(self, export_params):
        """Export memory records."""
        # Mock export data for compatibility
        return {
            "export_id": f"exp-{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now().isoformat(),
            "record_count": 1,
            "format": export_params.get("format", "json"),
            "records": []
        }
    
    def bulk_create_records(self, records_data):
        """Create multiple memory records in bulk."""
        return [self.create_record(record_data) for record_data in records_data]
    
    def get_stats(self):
        """Get statistics about the memory store."""
        stats_dict = self.store.get_stats()
        return MemoryStats(**stats_dict)

# Export all symbols for backward compatibility
__all__ = [
    'MemoryRecord', 'MemoryStore', 'MemoryRouter', 'MemoryQuery', 'MemoryStats', 'MemoryService',
    'get_memory_store', 'create_memory_record', 'get_memory_record', 'update_memory_record', 
    'delete_memory_record', 'query_memory', 'search_memory', 'get_memory_record_history',
    'export_memory_records', 'get_memory_stats'
]
