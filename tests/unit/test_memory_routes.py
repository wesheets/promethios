"""
Unit tests for the API routes in the Memory module of Promethios.

This module contains comprehensive tests for the Memory API routes,
which provide access to the governance memory system.
"""

import unittest
import json
from unittest.mock import patch, MagicMock

# Import the module to test
from src.api.memory.routes import MemoryRouter, MemoryRecord, MemoryQuery, MemoryStats

class TestMemoryRoutes(unittest.TestCase):
    """Test cases for the Memory API routes."""
    
    def setUp(self):
        """Set up test environment before each test."""
        self.router = MemoryRouter()
        
        # Sample memory record for testing
        self.sample_record = MemoryRecord(
            record_id="mem-12345",
            timestamp="2025-05-22T10:30:00Z",
            source="governance-engine",
            record_type="decision",
            content={
                "decision_id": "dec-6789",
                "policy_id": "pol-1234",
                "action": "approve",
                "context": {
                    "user_id": "user-5678",
                    "resource_id": "res-9012",
                    "action_requested": "read"
                }
            },
            metadata={
                "priority": "high",
                "tags": ["governance", "access-control"]
            }
        )
    
    @patch('src.api.memory.routes.MemoryService')
    def test_get_memory_record(self, mock_memory_service):
        """Test retrieving a memory record by ID."""
        # Configure mock
        mock_instance = mock_memory_service.return_value
        mock_instance.get_record.return_value = self.sample_record
        
        # Call the API method
        record_id = "mem-12345"
        result = self.router.get_memory_record(record_id)
        
        # Verify the result
        self.assertEqual(result.record_id, record_id)
        self.assertEqual(result.source, "governance-engine")
        self.assertEqual(result.record_type, "decision")
        
        # Verify the mock was called correctly
        mock_instance.get_record.assert_called_once_with(record_id)
    
    @patch('src.api.memory.routes.MemoryService')
    def test_create_memory_record(self, mock_memory_service):
        """Test creating a new memory record."""
        # Configure mock
        mock_instance = mock_memory_service.return_value
        mock_instance.create_record.return_value = self.sample_record
        
        # Create record data
        record_data = {
            "source": "governance-engine",
            "record_type": "decision",
            "content": {
                "decision_id": "dec-6789",
                "policy_id": "pol-1234",
                "action": "approve",
                "context": {
                    "user_id": "user-5678",
                    "resource_id": "res-9012",
                    "action_requested": "read"
                }
            },
            "metadata": {
                "priority": "high",
                "tags": ["governance", "access-control"]
            }
        }
        
        # Call the API method
        result = self.router.create_memory_record(record_data)
        
        # Verify the result
        self.assertEqual(result.record_id, "mem-12345")
        self.assertEqual(result.source, record_data["source"])
        self.assertEqual(result.record_type, record_data["record_type"])
        
        # Verify the mock was called correctly
        mock_instance.create_record.assert_called_once()
    
    @patch('src.api.memory.routes.MemoryService')
    def test_query_memory(self, mock_memory_service):
        """Test querying memory records."""
        # Configure mock
        mock_instance = mock_memory_service.return_value
        mock_instance.query_records.return_value = [self.sample_record]
        
        # Create query parameters
        query = MemoryQuery(
            record_type="decision",
            time_range={
                "start": "2025-05-01T00:00:00Z",
                "end": "2025-05-30T23:59:59Z"
            },
            filters={
                "source": "governance-engine",
                "content.action": "approve"
            },
            limit=10,
            offset=0
        )
        
        # Call the API method
        results = self.router.query_memory(query)
        
        # Verify the results
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].record_id, "mem-12345")
        
        # Verify the mock was called correctly
        mock_instance.query_records.assert_called_once_with(query)
    
    @patch('src.api.memory.routes.MemoryService')
    def test_update_memory_record(self, mock_memory_service):
        """Test updating a memory record."""
        # Configure mock
        mock_instance = mock_memory_service.return_value
        
        updated_record = MemoryRecord(
            record_id="mem-12345",
            timestamp="2025-05-22T10:30:00Z",
            source="governance-engine",
            record_type="decision",
            content={
                "decision_id": "dec-6789",
                "policy_id": "pol-1234",
                "action": "deny",  # Changed from approve to deny
                "context": {
                    "user_id": "user-5678",
                    "resource_id": "res-9012",
                    "action_requested": "read"
                }
            },
            metadata={
                "priority": "critical",  # Changed from high to critical
                "tags": ["governance", "access-control", "security"]  # Added security tag
            }
        )
        
        mock_instance.update_record.return_value = updated_record
        
        # Update data
        update_data = {
            "content": {
                "action": "deny"
            },
            "metadata": {
                "priority": "critical",
                "tags": ["governance", "access-control", "security"]
            }
        }
        
        # Call the API method
        record_id = "mem-12345"
        result = self.router.update_memory_record(record_id, update_data)
        
        # Verify the result
        self.assertEqual(result.record_id, record_id)
        self.assertEqual(result.content["action"], "deny")
        self.assertEqual(result.metadata["priority"], "critical")
        self.assertIn("security", result.metadata["tags"])
        
        # Verify the mock was called correctly
        mock_instance.update_record.assert_called_once_with(record_id, update_data)
    
    @patch('src.api.memory.routes.MemoryService')
    def test_delete_memory_record(self, mock_memory_service):
        """Test deleting a memory record."""
        # Configure mock
        mock_instance = mock_memory_service.return_value
        mock_instance.delete_record.return_value = True
        
        # Call the API method
        record_id = "mem-12345"
        result = self.router.delete_memory_record(record_id)
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the mock was called correctly
        mock_instance.delete_record.assert_called_once_with(record_id)
    
    @patch('src.api.memory.routes.MemoryService')
    def test_get_memory_stats(self, mock_memory_service):
        """Test retrieving memory statistics."""
        # Configure mock
        mock_instance = mock_memory_service.return_value
        
        stats = MemoryStats(
            total_records=1000,
            records_by_type={
                "decision": 500,
                "event": 300,
                "observation": 200
            },
            records_by_source={
                "governance-engine": 600,
                "policy-engine": 300,
                "user-interface": 100
            },
            storage_usage_bytes=5242880,  # 5 MB
            oldest_record_timestamp="2025-01-01T00:00:00Z",
            newest_record_timestamp="2025-05-22T10:30:00Z"
        )
        
        mock_instance.get_stats.return_value = stats
        
        # Call the API method
        result = self.router.get_memory_stats()
        
        # Verify the result
        self.assertEqual(result.total_records, 1000)
        self.assertEqual(result.records_by_type["decision"], 500)
        self.assertEqual(result.records_by_source["governance-engine"], 600)
        self.assertEqual(result.storage_usage_bytes, 5242880)
        
        # Verify the mock was called correctly
        mock_instance.get_stats.assert_called_once()
    
    @patch('src.api.memory.routes.MemoryService')
    def test_search_memory(self, mock_memory_service):
        """Test searching memory records."""
        # Configure mock
        mock_instance = mock_memory_service.return_value
        mock_instance.search_records.return_value = [self.sample_record]
        
        # Call the API method
        search_term = "approve"
        result = self.router.search_memory(search_term)
        
        # Verify the result
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].record_id, "mem-12345")
        
        # Verify the mock was called correctly
        mock_instance.search_records.assert_called_once_with(search_term)
    
    @patch('src.api.memory.routes.MemoryService')
    def test_bulk_create_memory_records(self, mock_memory_service):
        """Test creating multiple memory records in bulk."""
        # Configure mock
        mock_instance = mock_memory_service.return_value
        
        record1 = MemoryRecord(
            record_id="mem-12345",
            timestamp="2025-05-22T10:30:00Z",
            source="governance-engine",
            record_type="decision",
            content={"action": "approve"},
            metadata={"priority": "high"}
        )
        
        record2 = MemoryRecord(
            record_id="mem-67890",
            timestamp="2025-05-22T10:35:00Z",
            source="policy-engine",
            record_type="event",
            content={"event_type": "policy_update"},
            metadata={"priority": "medium"}
        )
        
        mock_instance.bulk_create_records.return_value = [record1, record2]
        
        # Create bulk records data
        records_data = [
            {
                "source": "governance-engine",
                "record_type": "decision",
                "content": {"action": "approve"},
                "metadata": {"priority": "high"}
            },
            {
                "source": "policy-engine",
                "record_type": "event",
                "content": {"event_type": "policy_update"},
                "metadata": {"priority": "medium"}
            }
        ]
        
        # Call the API method
        results = self.router.bulk_create_memory_records(records_data)
        
        # Verify the results
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].record_id, "mem-12345")
        self.assertEqual(results[1].record_id, "mem-67890")
        
        # Verify the mock was called correctly
        mock_instance.bulk_create_records.assert_called_once_with(records_data)
    
    @patch('src.api.memory.routes.MemoryService')
    def test_export_memory_records(self, mock_memory_service):
        """Test exporting memory records."""
        # Configure mock
        mock_instance = mock_memory_service.return_value
        
        export_data = {
            "export_id": "exp-12345",
            "timestamp": "2025-05-22T10:40:00Z",
            "record_count": 1,
            "format": "json",
            "records": [self.sample_record.__dict__]
        }
        
        mock_instance.export_records.return_value = export_data
        
        # Create export parameters
        export_params = {
            "record_type": "decision",
            "time_range": {
                "start": "2025-05-01T00:00:00Z",
                "end": "2025-05-30T23:59:59Z"
            },
            "format": "json"
        }
        
        # Call the API method
        result = self.router.export_memory_records(export_params)
        
        # Verify the result
        self.assertEqual(result["export_id"], "exp-12345")
        self.assertEqual(result["record_count"], 1)
        self.assertEqual(result["format"], "json")
        
        # Verify the mock was called correctly
        mock_instance.export_records.assert_called_once_with(export_params)
    
    @patch('src.api.memory.routes.MemoryService')
    def test_get_memory_record_history(self, mock_memory_service):
        """Test retrieving the history of a memory record."""
        # Configure mock
        mock_instance = mock_memory_service.return_value
        
        original_record = MemoryRecord(
            record_id="mem-12345",
            timestamp="2025-05-22T10:30:00Z",
            source="governance-engine",
            record_type="decision",
            content={"action": "approve"},
            metadata={"priority": "high"},
            version=1
        )
        
        updated_record = MemoryRecord(
            record_id="mem-12345",
            timestamp="2025-05-22T10:35:00Z",
            source="governance-engine",
            record_type="decision",
            content={"action": "deny"},
            metadata={"priority": "critical"},
            version=2
        )
        
        mock_instance.get_record_history.return_value = [original_record, updated_record]
        
        # Call the API method
        record_id = "mem-12345"
        result = self.router.get_memory_record_history(record_id)
        
        # Verify the result
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0].version, 1)
        self.assertEqual(result[1].version, 2)
        self.assertEqual(result[0].content["action"], "approve")
        self.assertEqual(result[1].content["action"], "deny")
        
        # Verify the mock was called correctly
        mock_instance.get_record_history.assert_called_once_with(record_id)

if __name__ == "__main__":
    unittest.main()
