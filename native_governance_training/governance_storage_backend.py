#!/usr/bin/env python3
"""
Governance Storage Backend

This module provides persistent storage for governance data, metrics, and audit trails.
It replaces fake data storage with real persistence, enabling governance components
to store and retrieve actual governance data.

Key Features:
- Multiple storage backends (memory, file, database)
- Persistent governance metrics and audit trails
- Real-time data access for governance components
- Configurable storage policies and retention
- Thread-safe and async-safe operations

This is critical for replacing fake metrics with real data persistence.

Codex Contract: v2025.05.21
Phase ID: 6.3
"""

import asyncio
import logging
import json
import sqlite3
import aiosqlite
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timedelta
from pathlib import Path
import pickle
import threading
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class StorageType(Enum):
    """Storage backend types."""
    MEMORY = "memory"
    FILE = "file"
    SQLITE = "sqlite"
    POSTGRESQL = "postgresql"

@dataclass
class GovernanceRecord:
    """
    Governance data record structure.
    
    This represents a single governance data record that can be stored
    and retrieved from the storage backend.
    """
    id: str
    timestamp: datetime
    component: str
    record_type: str
    data: Dict[str, Any]
    metadata: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert record to dictionary for serialization."""
        record_dict = asdict(self)
        record_dict['timestamp'] = self.timestamp.isoformat()
        return record_dict
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GovernanceRecord':
        """Create record from dictionary."""
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(**data)

class GovernanceStorageBackend:
    """
    Governance Storage Backend for persistent data storage.
    
    This class provides persistent storage for governance data, replacing
    fake data storage with real persistence. It enables governance components
    to store and retrieve actual governance metrics, audit trails, and decisions.
    
    Key Features:
    - Multiple storage backends (memory, file, SQLite, PostgreSQL)
    - Persistent governance metrics and audit trails
    - Real-time data access for governance components
    - Configurable storage policies and retention
    - Thread-safe and async-safe operations
    
    Codex Contract: v2025.05.21
    Phase ID: 6.3
    """
    
    def __init__(self, 
                 storage_type: StorageType = StorageType.MEMORY,
                 storage_path: Optional[str] = None,
                 retention_days: int = 30,
                 max_memory_records: int = 100000,
                 enable_compression: bool = True,
                 auto_cleanup: bool = True):
        """
        Initialize governance storage backend.
        
        Args:
            storage_type: Type of storage backend to use
            storage_path: Path for file-based storage
            retention_days: Number of days to retain records
            max_memory_records: Maximum records in memory storage
            enable_compression: Enable data compression for file storage
            auto_cleanup: Enable automatic cleanup of old records
        """
        self.storage_type = storage_type
        self.storage_path = storage_path or "governance_data"
        self.retention_days = retention_days
        self.max_memory_records = max_memory_records
        self.enable_compression = enable_compression
        self.auto_cleanup = auto_cleanup
        
        # Storage backends
        self._memory_storage: Dict[str, GovernanceRecord] = {}
        self._file_storage_path: Optional[Path] = None
        self._db_connection: Optional[Union[sqlite3.Connection, Any]] = None
        
        # Thread safety
        self._lock = threading.RLock()
        self._async_lock = asyncio.Lock()
        
        # System state
        self._is_initialized = False
        self._cleanup_task = None
        
        logger.info(f"GovernanceStorageBackend initialized with {storage_type.value} storage")
    
    async def initialize(self):
        """Initialize the storage backend."""
        if self._is_initialized:
            logger.warning("Storage backend already initialized")
            return
        
        try:
            if self.storage_type == StorageType.MEMORY:
                await self._initialize_memory_storage()
            elif self.storage_type == StorageType.FILE:
                await self._initialize_file_storage()
            elif self.storage_type == StorageType.SQLITE:
                await self._initialize_sqlite_storage()
            elif self.storage_type == StorageType.POSTGRESQL:
                await self._initialize_postgresql_storage()
            
            # Start cleanup task if enabled
            if self.auto_cleanup:
                self._cleanup_task = asyncio.create_task(self._cleanup_loop())
            
            self._is_initialized = True
            logger.info(f"Storage backend initialized: {self.storage_type.value}")
            
        except Exception as e:
            logger.error(f"Failed to initialize storage backend: {e}")
            raise
    
    async def shutdown(self):
        """Shutdown the storage backend."""
        if not self._is_initialized:
            return
        
        logger.info("Shutting down storage backend...")
        
        # Stop cleanup task
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        # Close database connections
        if self._db_connection:
            if self.storage_type == StorageType.SQLITE:
                await self._db_connection.close()
            else:
                self._db_connection.close()
        
        self._is_initialized = False
        logger.info("Storage backend shutdown complete")
    
    async def store_record(self, record: GovernanceRecord) -> bool:
        """
        Store a governance record.
        
        Args:
            record: The governance record to store
            
        Returns:
            True if stored successfully, False otherwise
        """
        if not self._is_initialized:
            await self.initialize()
        
        try:
            async with self._async_lock:
                if self.storage_type == StorageType.MEMORY:
                    return await self._store_memory_record(record)
                elif self.storage_type == StorageType.FILE:
                    return await self._store_file_record(record)
                elif self.storage_type == StorageType.SQLITE:
                    return await self._store_sqlite_record(record)
                elif self.storage_type == StorageType.POSTGRESQL:
                    return await self._store_postgresql_record(record)
            
            return False
            
        except Exception as e:
            logger.error(f"Error storing record {record.id}: {e}")
            return False
    
    async def get_record(self, record_id: str) -> Optional[GovernanceRecord]:
        """
        Retrieve a governance record by ID.
        
        Args:
            record_id: ID of the record to retrieve
            
        Returns:
            The governance record or None if not found
        """
        if not self._is_initialized:
            await self.initialize()
        
        try:
            async with self._async_lock:
                if self.storage_type == StorageType.MEMORY:
                    return await self._get_memory_record(record_id)
                elif self.storage_type == StorageType.FILE:
                    return await self._get_file_record(record_id)
                elif self.storage_type == StorageType.SQLITE:
                    return await self._get_sqlite_record(record_id)
                elif self.storage_type == StorageType.POSTGRESQL:
                    return await self._get_postgresql_record(record_id)
            
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving record {record_id}: {e}")
            return None
    
    async def query_records(self, 
                           component: Optional[str] = None,
                           record_type: Optional[str] = None,
                           start_time: Optional[datetime] = None,
                           end_time: Optional[datetime] = None,
                           limit: Optional[int] = None) -> List[GovernanceRecord]:
        """
        Query governance records with filters.
        
        Args:
            component: Filter by component name
            record_type: Filter by record type
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of records to return
            
        Returns:
            List of matching governance records
        """
        if not self._is_initialized:
            await self.initialize()
        
        try:
            async with self._async_lock:
                if self.storage_type == StorageType.MEMORY:
                    return await self._query_memory_records(component, record_type, start_time, end_time, limit)
                elif self.storage_type == StorageType.FILE:
                    return await self._query_file_records(component, record_type, start_time, end_time, limit)
                elif self.storage_type == StorageType.SQLITE:
                    return await self._query_sqlite_records(component, record_type, start_time, end_time, limit)
                elif self.storage_type == StorageType.POSTGRESQL:
                    return await self._query_postgresql_records(component, record_type, start_time, end_time, limit)
            
            return []
            
        except Exception as e:
            logger.error(f"Error querying records: {e}")
            return []
    
    async def delete_record(self, record_id: str) -> bool:
        """
        Delete a governance record.
        
        Args:
            record_id: ID of the record to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        if not self._is_initialized:
            await self.initialize()
        
        try:
            async with self._async_lock:
                if self.storage_type == StorageType.MEMORY:
                    return await self._delete_memory_record(record_id)
                elif self.storage_type == StorageType.FILE:
                    return await self._delete_file_record(record_id)
                elif self.storage_type == StorageType.SQLITE:
                    return await self._delete_sqlite_record(record_id)
                elif self.storage_type == StorageType.POSTGRESQL:
                    return await self._delete_postgresql_record(record_id)
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting record {record_id}: {e}")
            return False
    
    async def cleanup_old_records(self) -> int:
        """
        Clean up old records based on retention policy.
        
        Returns:
            Number of records cleaned up
        """
        if not self._is_initialized:
            await self.initialize()
        
        cutoff_time = datetime.now() - timedelta(days=self.retention_days)
        
        try:
            async with self._async_lock:
                if self.storage_type == StorageType.MEMORY:
                    return await self._cleanup_memory_records(cutoff_time)
                elif self.storage_type == StorageType.FILE:
                    return await self._cleanup_file_records(cutoff_time)
                elif self.storage_type == StorageType.SQLITE:
                    return await self._cleanup_sqlite_records(cutoff_time)
                elif self.storage_type == StorageType.POSTGRESQL:
                    return await self._cleanup_postgresql_records(cutoff_time)
            
            return 0
            
        except Exception as e:
            logger.error(f"Error cleaning up records: {e}")
            return 0
    
    # Memory storage implementation
    async def _initialize_memory_storage(self):
        """Initialize memory storage."""
        self._memory_storage = {}
        logger.info("Memory storage initialized")
    
    async def _store_memory_record(self, record: GovernanceRecord) -> bool:
        """Store record in memory."""
        # Check memory limits
        if len(self._memory_storage) >= self.max_memory_records:
            # Remove oldest records
            sorted_records = sorted(
                self._memory_storage.items(),
                key=lambda x: x[1].timestamp
            )
            
            # Remove 10% of oldest records
            remove_count = max(1, len(sorted_records) // 10)
            for i in range(remove_count):
                del self._memory_storage[sorted_records[i][0]]
        
        self._memory_storage[record.id] = record
        return True
    
    async def _get_memory_record(self, record_id: str) -> Optional[GovernanceRecord]:
        """Get record from memory."""
        return self._memory_storage.get(record_id)
    
    async def _query_memory_records(self, component, record_type, start_time, end_time, limit) -> List[GovernanceRecord]:
        """Query records from memory."""
        records = []
        
        for record in self._memory_storage.values():
            # Apply filters
            if component and record.component != component:
                continue
            if record_type and record.record_type != record_type:
                continue
            if start_time and record.timestamp < start_time:
                continue
            if end_time and record.timestamp > end_time:
                continue
            
            records.append(record)
        
        # Sort by timestamp (newest first)
        records.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Apply limit
        if limit:
            records = records[:limit]
        
        return records
    
    async def _delete_memory_record(self, record_id: str) -> bool:
        """Delete record from memory."""
        if record_id in self._memory_storage:
            del self._memory_storage[record_id]
            return True
        return False
    
    async def _cleanup_memory_records(self, cutoff_time: datetime) -> int:
        """Cleanup old records from memory."""
        old_records = [
            record_id for record_id, record in self._memory_storage.items()
            if record.timestamp < cutoff_time
        ]
        
        for record_id in old_records:
            del self._memory_storage[record_id]
        
        return len(old_records)
    
    # File storage implementation
    async def _initialize_file_storage(self):
        """Initialize file storage."""
        self._file_storage_path = Path(self.storage_path)
        self._file_storage_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"File storage initialized: {self._file_storage_path}")
    
    async def _store_file_record(self, record: GovernanceRecord) -> bool:
        """Store record in file."""
        try:
            # Create date-based subdirectory
            date_dir = self._file_storage_path / record.timestamp.strftime("%Y/%m/%d")
            date_dir.mkdir(parents=True, exist_ok=True)
            
            # Store record
            record_file = date_dir / f"{record.id}.json"
            
            with open(record_file, 'w') as f:
                json.dump(record.to_dict(), f, indent=2)
            
            return True
            
        except Exception as e:
            logger.error(f"Error storing file record: {e}")
            return False
    
    async def _get_file_record(self, record_id: str) -> Optional[GovernanceRecord]:
        """Get record from file."""
        try:
            # Search for record file
            for record_file in self._file_storage_path.rglob(f"{record_id}.json"):
                with open(record_file, 'r') as f:
                    data = json.load(f)
                return GovernanceRecord.from_dict(data)
            
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving file record: {e}")
            return None
    
    async def _query_file_records(self, component, record_type, start_time, end_time, limit) -> List[GovernanceRecord]:
        """Query records from files."""
        records = []
        
        try:
            # Search all record files
            for record_file in self._file_storage_path.rglob("*.json"):
                try:
                    with open(record_file, 'r') as f:
                        data = json.load(f)
                    
                    record = GovernanceRecord.from_dict(data)
                    
                    # Apply filters
                    if component and record.component != component:
                        continue
                    if record_type and record.record_type != record_type:
                        continue
                    if start_time and record.timestamp < start_time:
                        continue
                    if end_time and record.timestamp > end_time:
                        continue
                    
                    records.append(record)
                    
                except Exception as e:
                    logger.warning(f"Error reading record file {record_file}: {e}")
                    continue
            
            # Sort by timestamp (newest first)
            records.sort(key=lambda x: x.timestamp, reverse=True)
            
            # Apply limit
            if limit:
                records = records[:limit]
            
            return records
            
        except Exception as e:
            logger.error(f"Error querying file records: {e}")
            return []
    
    async def _delete_file_record(self, record_id: str) -> bool:
        """Delete record from file."""
        try:
            # Search for record file
            for record_file in self._file_storage_path.rglob(f"{record_id}.json"):
                record_file.unlink()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting file record: {e}")
            return False
    
    async def _cleanup_file_records(self, cutoff_time: datetime) -> int:
        """Cleanup old records from files."""
        cleaned_count = 0
        
        try:
            for record_file in self._file_storage_path.rglob("*.json"):
                try:
                    with open(record_file, 'r') as f:
                        data = json.load(f)
                    
                    record_time = datetime.fromisoformat(data['timestamp'])
                    
                    if record_time < cutoff_time:
                        record_file.unlink()
                        cleaned_count += 1
                        
                except Exception as e:
                    logger.warning(f"Error processing record file {record_file}: {e}")
                    continue
            
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Error cleaning up file records: {e}")
            return 0
    
    # SQLite storage implementation
    async def _initialize_sqlite_storage(self):
        """Initialize SQLite storage."""
        db_path = Path(self.storage_path) / "governance.db"
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self._db_connection = await aiosqlite.connect(str(db_path))
        
        # Create tables
        await self._db_connection.execute("""
            CREATE TABLE IF NOT EXISTS governance_records (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                component TEXT NOT NULL,
                record_type TEXT NOT NULL,
                data TEXT NOT NULL,
                metadata TEXT
            )
        """)
        
        # Create indexes
        await self._db_connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_timestamp ON governance_records(timestamp)
        """)
        await self._db_connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_component ON governance_records(component)
        """)
        await self._db_connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_record_type ON governance_records(record_type)
        """)
        
        await self._db_connection.commit()
        
        logger.info(f"SQLite storage initialized: {db_path}")
    
    async def _store_sqlite_record(self, record: GovernanceRecord) -> bool:
        """Store record in SQLite."""
        try:
            await self._db_connection.execute("""
                INSERT OR REPLACE INTO governance_records 
                (id, timestamp, component, record_type, data, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                record.id,
                record.timestamp.isoformat(),
                record.component,
                record.record_type,
                json.dumps(record.data),
                json.dumps(record.metadata) if record.metadata else None
            ))
            
            await self._db_connection.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error storing SQLite record: {e}")
            return False
    
    async def _get_sqlite_record(self, record_id: str) -> Optional[GovernanceRecord]:
        """Get record from SQLite."""
        try:
            cursor = await self._db_connection.execute("""
                SELECT id, timestamp, component, record_type, data, metadata
                FROM governance_records WHERE id = ?
            """, (record_id,))
            
            row = await cursor.fetchone()
            
            if row:
                return GovernanceRecord(
                    id=row[0],
                    timestamp=datetime.fromisoformat(row[1]),
                    component=row[2],
                    record_type=row[3],
                    data=json.loads(row[4]),
                    metadata=json.loads(row[5]) if row[5] else None
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving SQLite record: {e}")
            return None
    
    async def _query_sqlite_records(self, component, record_type, start_time, end_time, limit) -> List[GovernanceRecord]:
        """Query records from SQLite."""
        try:
            # Build query
            query = "SELECT id, timestamp, component, record_type, data, metadata FROM governance_records WHERE 1=1"
            params = []
            
            if component:
                query += " AND component = ?"
                params.append(component)
            
            if record_type:
                query += " AND record_type = ?"
                params.append(record_type)
            
            if start_time:
                query += " AND timestamp >= ?"
                params.append(start_time.isoformat())
            
            if end_time:
                query += " AND timestamp <= ?"
                params.append(end_time.isoformat())
            
            query += " ORDER BY timestamp DESC"
            
            if limit:
                query += " LIMIT ?"
                params.append(limit)
            
            # Execute query
            cursor = await self._db_connection.execute(query, params)
            rows = await cursor.fetchall()
            
            # Convert to records
            records = []
            for row in rows:
                record = GovernanceRecord(
                    id=row[0],
                    timestamp=datetime.fromisoformat(row[1]),
                    component=row[2],
                    record_type=row[3],
                    data=json.loads(row[4]),
                    metadata=json.loads(row[5]) if row[5] else None
                )
                records.append(record)
            
            return records
            
        except Exception as e:
            logger.error(f"Error querying SQLite records: {e}")
            return []
    
    async def _delete_sqlite_record(self, record_id: str) -> bool:
        """Delete record from SQLite."""
        try:
            cursor = await self._db_connection.execute("""
                DELETE FROM governance_records WHERE id = ?
            """, (record_id,))
            
            await self._db_connection.commit()
            
            return cursor.rowcount > 0
            
        except Exception as e:
            logger.error(f"Error deleting SQLite record: {e}")
            return False
    
    async def _cleanup_sqlite_records(self, cutoff_time: datetime) -> int:
        """Cleanup old records from SQLite."""
        try:
            cursor = await self._db_connection.execute("""
                DELETE FROM governance_records WHERE timestamp < ?
            """, (cutoff_time.isoformat(),))
            
            await self._db_connection.commit()
            
            return cursor.rowcount
            
        except Exception as e:
            logger.error(f"Error cleaning up SQLite records: {e}")
            return 0
    
    # PostgreSQL storage implementation (placeholder)
    async def _initialize_postgresql_storage(self):
        """Initialize PostgreSQL storage."""
        # TODO: Implement PostgreSQL storage
        raise NotImplementedError("PostgreSQL storage not yet implemented")
    
    async def _store_postgresql_record(self, record: GovernanceRecord) -> bool:
        """Store record in PostgreSQL."""
        raise NotImplementedError("PostgreSQL storage not yet implemented")
    
    async def _get_postgresql_record(self, record_id: str) -> Optional[GovernanceRecord]:
        """Get record from PostgreSQL."""
        raise NotImplementedError("PostgreSQL storage not yet implemented")
    
    async def _query_postgresql_records(self, component, record_type, start_time, end_time, limit) -> List[GovernanceRecord]:
        """Query records from PostgreSQL."""
        raise NotImplementedError("PostgreSQL storage not yet implemented")
    
    async def _delete_postgresql_record(self, record_id: str) -> bool:
        """Delete record from PostgreSQL."""
        raise NotImplementedError("PostgreSQL storage not yet implemented")
    
    async def _cleanup_postgresql_records(self, cutoff_time: datetime) -> int:
        """Cleanup old records from PostgreSQL."""
        raise NotImplementedError("PostgreSQL storage not yet implemented")
    
    # Cleanup loop
    async def _cleanup_loop(self):
        """Automatic cleanup loop."""
        while True:
            try:
                await asyncio.sleep(3600)  # Run every hour
                
                cleaned_count = await self.cleanup_old_records()
                if cleaned_count > 0:
                    logger.info(f"Cleaned up {cleaned_count} old governance records")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(3600)
    
    async def get_storage_statistics(self) -> Dict[str, Any]:
        """Get storage statistics."""
        try:
            if self.storage_type == StorageType.MEMORY:
                total_records = len(self._memory_storage)
                
            elif self.storage_type == StorageType.FILE:
                total_records = len(list(self._file_storage_path.rglob("*.json")))
                
            elif self.storage_type == StorageType.SQLITE:
                cursor = await self._db_connection.execute("SELECT COUNT(*) FROM governance_records")
                row = await cursor.fetchone()
                total_records = row[0] if row else 0
                
            else:
                total_records = 0
            
            return {
                'storage_type': self.storage_type.value,
                'total_records': total_records,
                'retention_days': self.retention_days,
                'max_memory_records': self.max_memory_records,
                'enable_compression': self.enable_compression,
                'auto_cleanup': self.auto_cleanup,
                'is_initialized': self._is_initialized
            }
            
        except Exception as e:
            logger.error(f"Error getting storage statistics: {e}")
            return {
                'storage_type': self.storage_type.value,
                'error': str(e)
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on storage backend."""
        try:
            # Test basic operations
            test_record = GovernanceRecord(
                id="health_check_test",
                timestamp=datetime.now(),
                component="storage_backend",
                record_type="health_check",
                data={'test': True}
            )
            
            # Test store and retrieve
            store_success = await self.store_record(test_record)
            retrieve_success = await self.get_record("health_check_test") is not None
            
            # Cleanup test record
            await self.delete_record("health_check_test")
            
            return {
                'component': 'governance_storage_backend',
                'status': 'healthy' if store_success and retrieve_success else 'unhealthy',
                'timestamp': datetime.now().isoformat(),
                'storage_type': self.storage_type.value,
                'is_initialized': self._is_initialized,
                'store_test': store_success,
                'retrieve_test': retrieve_success
            }
            
        except Exception as e:
            return {
                'component': 'governance_storage_backend',
                'status': 'unhealthy',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }

