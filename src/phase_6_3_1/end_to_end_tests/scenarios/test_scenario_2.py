"""
Scenario 2: Memory Logging with Continuous Monitoring

This test scenario validates that memory logging works correctly with
continuous monitoring from Phase 2.3 through Phase 6.3.1.
"""

import os
import sys
import time
import unittest
import logging
from typing import Dict, List, Any, Optional

# Import base test case
from base_test_case import EndToEndTestCase
from test_fixtures import TestFixtures

# Configure logger
logger = logging.getLogger(__name__)


class TestMemoryLoggingMonitoring(EndToEndTestCase):
    """Test memory logging with continuous monitoring."""
    
    def setUp(self):
        """Set up test fixtures."""
        super().setUp()
        
        # Import required components
        self.memory_event = self.load_component(
            'phase_6_3_1_implementation.memory_logging_system.memory_event',
            'MemoryEvent'
        )
        
        self.memory_logging_system = self.load_component(
            'phase_6_3_1_implementation.memory_logging_system.memory_logging_system',
            'MemoryLoggingSystem'
        )
        
        self.monitoring_framework = self.load_component(
            'phase_6_3_1_implementation.continuous_monitoring.monitoring_framework',
            'MonitoringFramework'
        )
        
        self.memory_logging_monitor = self.load_component(
            'phase_6_3_1_implementation.continuous_monitoring.memory_logging_monitor',
            'MemoryLoggingMonitor'
        )
        
        # Create test directory
        self.test_dir = TestFixtures.create_temp_directory()
        
        # Initialize components if they were loaded successfully
        if all([self.memory_event, self.memory_logging_system, self.monitoring_framework, self.memory_logging_monitor]):
            self.logging_system = self.memory_logging_system(
                storage_dir=os.path.join(self.test_dir, "memory_logs"),
                max_queue_size=100,
                flush_interval=1
            )
            
            self.monitoring = self.monitoring_framework(
                storage_dir=os.path.join(self.test_dir, "monitoring"),
                config={
                    "collection_interval": 1,
                    "alert_threshold": "warning"
                }
            )
            
            self.memory_monitor = self.memory_logging_monitor(
                monitoring_framework=self.monitoring,
                memory_logging_system=self.logging_system,
                config={
                    "latency_threshold": 0.5,
                    "completeness_threshold": 0.95,
                    "sequence_gap_threshold": 2
                }
            )
            
            # Register with the system under test
            self.system.components.update({
                'logging_system': self.logging_system,
                'monitoring': self.monitoring,
                'memory_monitor': self.memory_monitor
            })
    
    def tearDown(self):
        """Tear down test fixtures."""
        if hasattr(self, 'logging_system'):
            self.logging_system.shutdown()
        
        if hasattr(self, 'monitoring'):
            self.monitoring.shutdown()
        
        super().tearDown()
    
    def test_event_logging_and_monitoring(self):
        """Test that events are properly logged and monitored."""
        # Skip if components weren't loaded
        if not hasattr(self, 'logging_system'):
            self.skipTest("Required components could not be loaded")
        
        try:
            # Start the monitoring system
            self.monitoring.start()
            self.memory_monitor.start()
            
            # Create and log memory events
            events = []
            for i in range(10):
                event = self.memory_event(
                    event_type=f"test_event_{i}",
                    source="test_source",
                    data={"index": i, "value": f"test_value_{i}"}
                )
                events.append(event)
                self.logging_system.log_event(event)
            
            # Wait for events to be processed
            time.sleep(3)
            
            # Verify events were logged
            logged_events = self.logging_system.get_events_by_type("test_event")
            
            self.assert_with_result(
                len(logged_events) >= 10,
                f"Expected at least 10 logged events, got {len(logged_events)}",
                {"logged_events_count": len(logged_events)}
            )
            
            # Verify monitoring detected the events
            monitor_events = self.memory_monitor.get_collected_data()
            
            self.assert_with_result(
                len(monitor_events) > 0,
                "Expected monitoring events to be collected",
                {"monitor_events_count": len(monitor_events)}
            )
            
            # Check monitoring metrics
            metrics = self.memory_monitor.get_metrics()
            
            self.assert_with_result(
                "event_count" in metrics,
                "Expected event_count in metrics",
                {"metrics": metrics}
            )
            
            self.assert_with_result(
                metrics["event_count"] >= 10,
                f"Expected at least 10 events counted, got {metrics.get('event_count')}",
                {"event_count": metrics.get("event_count")}
            )
            
        except Exception as e:
            logger.error(f"Error in test_event_logging_and_monitoring: {e}")
            self.record_result(False, {"error": str(e)})
            raise
    
    def test_timestamp_synchronization(self):
        """Test timestamp synchronization in memory logging."""
        # Skip if components weren't loaded
        if not hasattr(self, 'logging_system'):
            self.skipTest("Required components could not be loaded")
        
        try:
            # Import timestamp synchronization
            timestamp_sync = self.load_component(
                'phase_6_3_1_implementation.memory_logging_system.timestamp_synchronization',
                'TimestampSynchronizationService'
            )
            
            if not timestamp_sync:
                self.skipTest("TimestampSynchronizationService could not be loaded")
            
            # Create synchronization service
            sync_service = timestamp_sync(
                storage_dir=os.path.join(self.test_dir, "timestamp_sync")
            )
            
            # Register time sources
            sync_service.register_time_source("system", lambda: time.time())
            sync_service.register_time_source("offset", lambda: time.time() + 0.1)
            
            # Create events with synchronized timestamps
            events = []
            for i in range(5):
                timestamp = sync_service.get_synchronized_timestamp()
                event = self.memory_event(
                    event_type="sync_test_event",
                    source="test_source",
                    data={"index": i},
                    timestamp=timestamp
                )
                events.append(event)
                self.logging_system.log_event(event)
            
            # Wait for events to be processed
            time.sleep(2)
            
            # Verify events were logged with synchronized timestamps
            logged_events = self.logging_system.get_events_by_type("sync_test_event")
            
            self.assert_with_result(
                len(logged_events) >= 5,
                f"Expected at least 5 logged events, got {len(logged_events)}",
                {"logged_events_count": len(logged_events)}
            )
            
            # Check timestamp sequence
            timestamps = [event.timestamp for event in logged_events]
            is_sorted = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))
            
            self.assert_with_result(
                is_sorted,
                "Expected timestamps to be in ascending order",
                {"timestamps": timestamps}
            )
            
            # Check monitoring for timestamp issues
            time.sleep(2)  # Wait for monitoring to process
            monitor_events = self.memory_monitor.get_collected_data()
            
            # There should be no timestamp sequence anomalies
            timestamp_anomalies = [e for e in monitor_events if "timestamp_sequence" in e.event_type.lower()]
            
            self.assert_with_result(
                len(timestamp_anomalies) == 0,
                f"Expected no timestamp sequence anomalies, got {len(timestamp_anomalies)}",
                {"timestamp_anomalies": [e.to_dict() for e in timestamp_anomalies]}
            )
            
        except Exception as e:
            logger.error(f"Error in test_timestamp_synchronization: {e}")
            self.record_result(False, {"error": str(e)})
            raise
    
    def test_guaranteed_delivery(self):
        """Test guaranteed delivery of memory events."""
        # Skip if components weren't loaded
        if not hasattr(self, 'logging_system'):
            self.skipTest("Required components could not be loaded")
        
        try:
            # Import guaranteed delivery
            guaranteed_delivery = self.load_component(
                'phase_6_3_1_implementation.memory_logging_system.guaranteed_delivery',
                'GuaranteedDeliveryManager'
            )
            
            if not guaranteed_delivery:
                self.skipTest("GuaranteedDeliveryManager could not be loaded")
            
            # Create a delivery manager
            delivery_manager = guaranteed_delivery(
                storage_dir=os.path.join(self.test_dir, "delivery_queue")
            )
            
            # Create a new logging system with the delivery manager
            test_logging_system = self.memory_logging_system(
                storage_dir=os.path.join(self.test_dir, "guaranteed_logs"),
                max_queue_size=100,
                flush_interval=1,
                delivery_manager=delivery_manager
            )
            
            # Log events
            for i in range(20):
                event = self.memory_event(
                    event_type="guaranteed_event",
                    source="test_source",
                    data={"index": i, "value": f"guaranteed_value_{i}"}
                )
                test_logging_system.log_event(event)
            
            # Wait for events to be processed
            time.sleep(2)
            
            # Verify events were logged
            logged_events = test_logging_system.get_events_by_type("guaranteed_event")
            
            self.assert_with_result(
                len(logged_events) >= 20,
                f"Expected at least 20 logged events, got {len(logged_events)}",
                {"logged_events_count": len(logged_events)}
            )
            
            # Simulate system failure and recovery
            test_logging_system.shutdown()
            
            # Create a new logging system with the same delivery manager
            recovered_logging_system = self.memory_logging_system(
                storage_dir=os.path.join(self.test_dir, "guaranteed_logs"),
                max_queue_size=100,
                flush_interval=1,
                delivery_manager=delivery_manager
            )
            
            # Wait for recovery
            time.sleep(2)
            
            # Verify events were recovered
            recovered_events = recovered_logging_system.get_events_by_type("guaranteed_event")
            
            self.assert_with_result(
                len(recovered_events) >= 20,
                f"Expected at least 20 recovered events, got {len(recovered_events)}",
                {"recovered_events_count": len(recovered_events)}
            )
            
            # Clean up
            recovered_logging_system.shutdown()
            
        except Exception as e:
            logger.error(f"Error in test_guaranteed_delivery: {e}")
            self.record_result(False, {"error": str(e)})
            raise


if __name__ == "__main__":
    unittest.main()
