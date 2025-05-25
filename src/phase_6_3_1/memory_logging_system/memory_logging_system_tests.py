"""
Memory Logging System Test Suite.

This module provides comprehensive tests for the Memory Logging System.
"""

import os
import time
import logging
import unittest
import shutil
import threading
import json
import tempfile
import sys
from typing import Dict, Any, List, Optional

# Fix import path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from memory_logging_system import MemoryLoggingSystem
from memory_event import MemoryEvent, TimestampMetadata

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("MemoryLoggingSystemTests")

class TestMemoryLoggingSystem(unittest.TestCase):
    """Test suite for the Memory Logging System."""
    
    def setUp(self):
        """Set up test environment."""
        # Create temporary directory for test storage
        self.test_dir = "/tmp/memory_logging_system_test"
        
        # Clean up any existing test directory
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
        
        # Create test directory
        os.makedirs(self.test_dir, exist_ok=True)
        
        # Initialize Memory Logging System
        self.memory_logging_system = MemoryLoggingSystem(storage_path=self.test_dir)
    
    def tearDown(self):
        """Clean up after test."""
        # Ensure Memory Logging System is shut down
        if hasattr(self, 'memory_logging_system'):
            self.memory_logging_system.shutdown()
            
            # Add a small delay to ensure all threads have time to terminate
            time.sleep(0.5)
        
        # Clean up test directory
        if os.path.exists(self.test_dir):
            try:
                shutil.rmtree(self.test_dir)
            except Exception as e:
                logger.warning(f"Failed to clean up test directory: {str(e)}")
    
    def test_log_memory_event(self):
        """Test logging a memory event."""
        # Log a test event
        event_type = "test_event"
        event_data = {"test_key": "test_value"}
        
        event_id = self.memory_logging_system.log_memory_event(event_type, event_data)
        
        # Verify event ID is returned
        self.assertIsNotNone(event_id)
        self.assertTrue(len(event_id) > 0)
        
        # Allow time for event to be processed
        time.sleep(1)
        
        # Verify event file exists
        event_file = os.path.join(self.test_dir, f"{event_id}.json")
        self.assertTrue(os.path.exists(event_file))
        
        # Verify event content
        with open(event_file, 'r') as f:
            event_json = json.load(f)
        
        self.assertEqual(event_json["event_type"], event_type)
        self.assertEqual(event_json["data"]["test_key"], "test_value")
    
    def test_timestamp_synchronization(self):
        """Test timestamp synchronization."""
        # Log multiple events in quick succession
        event_ids = []
        for i in range(5):
            event_id = self.memory_logging_system.log_memory_event(
                "timestamp_test", {"sequence": i}
            )
            event_ids.append(event_id)
        
        # Allow time for events to be processed
        time.sleep(1)
        
        # Load events
        events = []
        for event_id in event_ids:
            event_file = os.path.join(self.test_dir, f"{event_id}.json")
            with open(event_file, 'r') as f:
                event_json = json.load(f)
            events.append(event_json)
        
        # Verify timestamps are monotonically increasing
        timestamps = [event["timestamp"] for event in events]
        for i in range(1, len(timestamps)):
            self.assertGreaterEqual(timestamps[i], timestamps[i-1])
    
    def test_guaranteed_delivery(self):
        """Test guaranteed delivery of events."""
        # Log a large number of events
        event_count = 20
        event_ids = []
        
        for i in range(event_count):
            event_id = self.memory_logging_system.log_memory_event(
                "delivery_test", {"sequence": i}
            )
            event_ids.append(event_id)
        
        # Allow time for events to be processed
        time.sleep(2)
        
        # Verify all events were delivered
        delivered_count = 0
        for event_id in event_ids:
            event_file = os.path.join(self.test_dir, f"{event_id}.json")
            if os.path.exists(event_file):
                delivered_count += 1
        
        self.assertEqual(delivered_count, event_count)
    
    def test_shutdown_and_cleanup(self):
        """Test proper shutdown and cleanup."""
        # Log some events
        for i in range(5):
            self.memory_logging_system.log_memory_event(
                "shutdown_test", {"sequence": i}
            )
        
        # Allow time for events to be processed
        time.sleep(1)
        
        # Shutdown the system
        self.memory_logging_system.shutdown()
        
        # Verify system components are properly shut down
        # This is primarily checking that no exceptions are raised during shutdown
        self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
