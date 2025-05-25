"""
Tests for the Continuous Risk Monitoring Framework.

This module contains unit tests for the core monitoring framework and its components.
"""

import unittest
import os
import time
import json
import tempfile
import threading
import logging
from typing import Dict, Any, List

from monitoring_framework import (
    MonitoringFramework,
    BaseMonitor,
    EventHandler,
    DataCollector,
    MonitoringEvent,
    AlertSeverity,
    FileStorageHandler,
    LoggingHandler
)

# Configure logging for tests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class TestMonitor(BaseMonitor):
    """Test monitor implementation for testing."""
    
    def __init__(self, name: str, framework: MonitoringFramework):
        super().__init__(name, framework)
        self.execution_results = []
    
    def execute(self) -> None:
        """Execute the test monitor and record the execution."""
        super().execute()
        self.execution_results.append(time.time())
        
        # Emit a test event
        self.emit_event(
            event_type="test_execution",
            details={"execution_count": self.execution_count},
            severity=AlertSeverity.INFO
        )


class TestCollector(DataCollector):
    """Test data collector implementation for testing."""
    
    def __init__(self, name: str, framework: MonitoringFramework):
        super().__init__(name, framework)
        self.collection_results = []
        self.test_data = {"value": 0}
    
    def collect(self) -> Dict[str, Any]:
        """Collect test data and record the collection."""
        super().collect()
        self.test_data["value"] += 1
        self.test_data["timestamp"] = time.time()
        self.collection_results.append(self.test_data.copy())
        return self.test_data


class TestHandler(EventHandler):
    """Test event handler implementation for testing."""
    
    def __init__(self, name: str):
        super().__init__(name)
        self.handled_events = []
    
    def _process_event(self, event: MonitoringEvent) -> bool:
        """Process a test event and record it."""
        self.handled_events.append(event)
        return True


class MonitoringFrameworkTests(unittest.TestCase):
    """Test cases for the MonitoringFramework class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.framework = MonitoringFramework()
        
        # Create a temporary directory for file storage
        self.temp_dir = tempfile.mkdtemp()
        
        # Register handlers
        self.test_handler = TestHandler("test_handler")
        self.file_handler = FileStorageHandler("file_handler", self.temp_dir)
        self.log_handler = LoggingHandler("log_handler")
        
        self.framework.register_handler(self.test_handler)
        self.framework.register_handler(self.file_handler)
        self.framework.register_handler(self.log_handler)
        
        # Register a test monitor
        self.test_monitor = TestMonitor("test_monitor", self.framework)
        self.framework.register_monitor(self.test_monitor)
        
        # Register a test collector
        self.test_collector = TestCollector("test_collector", self.framework)
        self.test_collector.collection_interval = 0.1  # Collect frequently for testing
        self.framework.register_collector(self.test_collector)
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Stop the framework if it's running
        if self.framework.running:
            self.framework.stop()
        
        # Clean up temporary files
        for filename in os.listdir(self.temp_dir):
            os.remove(os.path.join(self.temp_dir, filename))
        os.rmdir(self.temp_dir)
    
    def test_framework_initialization(self):
        """Test that the framework initializes correctly."""
        self.assertFalse(self.framework.running)
        self.assertEqual(len(self.framework.monitors), 1)
        self.assertEqual(len(self.framework.collectors), 1)
        self.assertEqual(len(self.framework.handlers), 3)
        self.assertEqual(len(self.framework.event_history), 0)
    
    def test_event_processing(self):
        """Test that events are processed correctly."""
        # Create and process a test event
        event = MonitoringEvent(
            event_type="test_event",
            source="test_source",
            details={"test_key": "test_value"},
            severity=AlertSeverity.MEDIUM
        )
        self.framework.process_event(event)
        
        # Check that the event was added to history
        self.assertEqual(len(self.framework.event_history), 1)
        self.assertEqual(self.framework.event_history[0].event_id, event.event_id)
        
        # Check that the event was handled by the test handler
        self.assertEqual(len(self.test_handler.handled_events), 1)
        self.assertEqual(self.test_handler.handled_events[0].event_id, event.event_id)
        
        # Check that the event was stored by the file handler
        files = os.listdir(self.temp_dir)
        self.assertEqual(len(files), 1)
        
        # Verify file content
        with open(os.path.join(self.temp_dir, files[0]), 'r') as f:
            stored_event = json.load(f)
        self.assertEqual(stored_event['event_id'], event.event_id)
        self.assertEqual(stored_event['event_type'], "test_event")
        self.assertEqual(stored_event['severity'], "MEDIUM")
    
    def test_framework_start_stop(self):
        """Test that the framework starts and stops correctly."""
        # Start the framework
        self.framework.start()
        self.assertTrue(self.framework.running)
        self.assertIsNotNone(self.framework.collection_thread)
        self.assertIsNotNone(self.framework.monitor_thread)
        self.assertTrue(self.framework.collection_thread.is_alive())
        self.assertTrue(self.framework.monitor_thread.is_alive())
        
        # Let it run for a short time
        time.sleep(0.5)
        
        # Stop the framework
        self.framework.stop()
        self.assertFalse(self.framework.running)
        
        # Wait for threads to terminate
        time.sleep(0.1)
        self.assertFalse(self.framework.collection_thread.is_alive())
        self.assertFalse(self.framework.monitor_thread.is_alive())
    
    def test_monitor_execution(self):
        """Test that monitors are executed correctly."""
        # Start the framework
        self.framework.start()
        
        # Let it run for a short time to allow monitor execution
        time.sleep(0.5)
        
        # Stop the framework
        self.framework.stop()
        
        # Check that the monitor was executed
        self.assertGreater(len(self.test_monitor.execution_results), 0)
        
        # Check that events were generated
        events = [e for e in self.framework.event_history if e.event_type == "test_execution"]
        self.assertGreater(len(events), 0)
    
    def test_data_collection(self):
        """Test that data collection works correctly."""
        # Start the framework
        self.framework.start()
        
        # Let it run for a short time to allow data collection
        time.sleep(0.5)
        
        # Stop the framework
        self.framework.stop()
        
        # Check that data was collected
        self.assertGreater(len(self.test_collector.collection_results), 0)
        
        # Check that events were generated
        events = [e for e in self.framework.event_history if e.event_type == "data_collection"]
        self.assertGreater(len(events), 0)
    
    def test_event_filtering(self):
        """Test that event filtering works correctly."""
        # Create and process events with different severities
        severities = [
            AlertSeverity.INFO,
            AlertSeverity.LOW,
            AlertSeverity.MEDIUM,
            AlertSeverity.HIGH,
            AlertSeverity.CRITICAL
        ]
        
        for severity in severities:
            event = MonitoringEvent(
                event_type="test_event",
                source=f"source_{severity.name}",
                details={"severity": severity.name},
                severity=severity
            )
            self.framework.process_event(event)
        
        # Test filtering by severity
        high_events = self.framework.get_recent_events(
            severity_filter={AlertSeverity.HIGH, AlertSeverity.CRITICAL}
        )
        self.assertEqual(len(high_events), 2)
        self.assertIn(high_events[0].severity, {AlertSeverity.HIGH, AlertSeverity.CRITICAL})
        self.assertIn(high_events[1].severity, {AlertSeverity.HIGH, AlertSeverity.CRITICAL})
        
        # Test filtering by source
        source_events = self.framework.get_recent_events(
            source_filter={"source_INFO", "source_LOW"}
        )
        self.assertEqual(len(source_events), 2)
        self.assertIn(source_events[0].source, {"source_INFO", "source_LOW"})
        self.assertIn(source_events[1].source, {"source_INFO", "source_LOW"})
    
    def test_history_limit(self):
        """Test that the event history size is limited correctly."""
        # Set a small history size
        self.framework.max_history_size = 5
        
        # Create and process more events than the limit
        for i in range(10):
            event = MonitoringEvent(
                event_type="test_event",
                source="test_source",
                details={"index": i},
                severity=AlertSeverity.INFO
            )
            self.framework.process_event(event)
        
        # Check that only the most recent events are kept
        self.assertEqual(len(self.framework.event_history), 5)
        
        # Check that the events are the most recent ones
        indices = [e.details["index"] for e in self.framework.event_history]
        self.assertEqual(sorted(indices), [5, 6, 7, 8, 9])


class MonitoringEventTests(unittest.TestCase):
    """Test cases for the MonitoringEvent class."""
    
    def test_event_creation(self):
        """Test that events are created correctly."""
        event = MonitoringEvent(
            event_type="test_event",
            source="test_source",
            details={"test_key": "test_value"},
            severity=AlertSeverity.HIGH
        )
        
        self.assertEqual(event.event_type, "test_event")
        self.assertEqual(event.source, "test_source")
        self.assertEqual(event.details, {"test_key": "test_value"})
        self.assertEqual(event.severity, AlertSeverity.HIGH)
        self.assertIsNotNone(event.timestamp)
        self.assertIsNotNone(event.event_id)
    
    def test_event_serialization(self):
        """Test that events can be serialized and deserialized."""
        original_event = MonitoringEvent(
            event_type="test_event",
            source="test_source",
            details={"test_key": "test_value"},
            severity=AlertSeverity.MEDIUM,
            timestamp=1621234567.89,
            event_id="test-id-123"
        )
        
        # Convert to dictionary
        event_dict = original_event.to_dict()
        
        # Check dictionary values
        self.assertEqual(event_dict["event_id"], "test-id-123")
        self.assertEqual(event_dict["event_type"], "test_event")
        self.assertEqual(event_dict["source"], "test_source")
        self.assertEqual(event_dict["details"], {"test_key": "test_value"})
        self.assertEqual(event_dict["severity"], "MEDIUM")
        self.assertEqual(event_dict["severity_level"], 2)
        self.assertEqual(event_dict["timestamp"], 1621234567.89)
        
        # Recreate from dictionary
        recreated_event = MonitoringEvent.from_dict(event_dict)
        
        # Check recreated event
        self.assertEqual(recreated_event.event_id, "test-id-123")
        self.assertEqual(recreated_event.event_type, "test_event")
        self.assertEqual(recreated_event.source, "test_source")
        self.assertEqual(recreated_event.details, {"test_key": "test_value"})
        self.assertEqual(recreated_event.severity, AlertSeverity.MEDIUM)
        self.assertEqual(recreated_event.timestamp, 1621234567.89)


if __name__ == "__main__":
    unittest.main()
