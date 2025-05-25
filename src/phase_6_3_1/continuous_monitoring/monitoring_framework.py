"""
Continuous Risk Monitoring Framework - Core Implementation

This module provides the foundational framework for the Continuous Risk Monitoring
and Health Check System. It implements the core monitoring infrastructure and
data collection mechanisms as described in Phase 1 of the implementation approach.

The framework is designed to be extensible, allowing for the addition of specialized
monitors in subsequent phases.
"""

import logging
import time
import threading
import uuid
import json
import os
from datetime import datetime
from enum import Enum
from typing import Dict, List, Any, Optional, Callable, Union, Set

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class AlertSeverity(Enum):
    """Enumeration of alert severity levels."""
    INFO = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class MonitoringEvent:
    """Represents a monitoring event detected by the system."""
    
    def __init__(
        self,
        event_type: str,
        source: str,
        details: Dict[str, Any],
        severity: AlertSeverity = AlertSeverity.INFO,
        timestamp: Optional[float] = None,
        event_id: Optional[str] = None
    ):
        """
        Initialize a new monitoring event.
        
        Args:
            event_type: Type of the monitoring event
            source: Component that generated the event
            details: Additional information about the event
            severity: Severity level of the event
            timestamp: Event timestamp (defaults to current time)
            event_id: Unique identifier for the event (generated if not provided)
        """
        self.event_type = event_type
        self.source = source
        self.details = details
        self.severity = severity
        self.timestamp = timestamp if timestamp is not None else time.time()
        self.event_id = event_id if event_id is not None else str(uuid.uuid4())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the event to a dictionary representation."""
        return {
            'event_id': self.event_id,
            'event_type': self.event_type,
            'source': self.source,
            'details': self.details,
            'severity': self.severity.name,
            'severity_level': self.severity.value,
            'timestamp': self.timestamp,
            'formatted_time': datetime.fromtimestamp(self.timestamp).isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MonitoringEvent':
        """Create an event from a dictionary representation."""
        severity = AlertSeverity[data['severity']] if isinstance(data['severity'], str) else AlertSeverity(data['severity_level'])
        return cls(
            event_type=data['event_type'],
            source=data['source'],
            details=data['details'],
            severity=severity,
            timestamp=data['timestamp'],
            event_id=data['event_id']
        )
    
    def __str__(self) -> str:
        """Return a string representation of the event."""
        return (f"MonitoringEvent(id={self.event_id}, type={self.event_type}, "
                f"source={self.source}, severity={self.severity.name}, "
                f"time={datetime.fromtimestamp(self.timestamp).isoformat()})")


class BaseMonitor:
    """Base class for all monitoring components."""
    
    def __init__(self, name: str, framework: 'MonitoringFramework'):
        """
        Initialize a new monitor.
        
        Args:
            name: Name of the monitor
            framework: Reference to the monitoring framework
        """
        self.name = name
        self.framework = framework
        self.logger = logging.getLogger(f"Monitor.{name}")
        self.enabled = True
        self.last_execution = 0
        self.execution_count = 0
        self.configuration = {}
        self.logger.info(f"Initialized monitor: {name}")
    
    def emit_event(
        self,
        event_type: str,
        details: Dict[str, Any],
        severity: AlertSeverity = AlertSeverity.INFO
    ) -> MonitoringEvent:
        """
        Emit a monitoring event.
        
        Args:
            event_type: Type of the monitoring event
            details: Additional information about the event
            severity: Severity level of the event
            
        Returns:
            The created monitoring event
        """
        event = MonitoringEvent(
            event_type=event_type,
            source=self.name,
            details=details,
            severity=severity
        )
        self.framework.process_event(event)
        return event
    
    def configure(self, config: Dict[str, Any]) -> None:
        """
        Configure the monitor with specific settings.
        
        Args:
            config: Configuration dictionary
        """
        self.configuration.update(config)
        self.logger.info(f"Updated configuration for {self.name}")
    
    def execute(self) -> None:
        """
        Execute the monitor's check logic.
        
        This method should be overridden by subclasses.
        """
        self.last_execution = time.time()
        self.execution_count += 1
        self.logger.debug(f"Executed {self.name} (count: {self.execution_count})")


class EventHandler:
    """Base class for event handlers that process monitoring events."""
    
    def __init__(self, name: str):
        """
        Initialize a new event handler.
        
        Args:
            name: Name of the handler
        """
        self.name = name
        self.logger = logging.getLogger(f"Handler.{name}")
        self.enabled = True
        self.configuration = {}
        self.logger.info(f"Initialized event handler: {name}")
    
    def handle_event(self, event: MonitoringEvent) -> bool:
        """
        Handle a monitoring event.
        
        Args:
            event: The monitoring event to handle
            
        Returns:
            True if the event was handled successfully, False otherwise
        """
        if not self.enabled:
            return False
        
        self.logger.debug(f"Handling event: {event.event_id}")
        return self._process_event(event)
    
    def _process_event(self, event: MonitoringEvent) -> bool:
        """
        Process a monitoring event.
        
        This method should be overridden by subclasses.
        
        Args:
            event: The monitoring event to process
            
        Returns:
            True if the event was processed successfully, False otherwise
        """
        self.logger.debug(f"Default processing for event: {event.event_id}")
        return True
    
    def configure(self, config: Dict[str, Any]) -> None:
        """
        Configure the handler with specific settings.
        
        Args:
            config: Configuration dictionary
        """
        self.configuration.update(config)
        self.logger.info(f"Updated configuration for {self.name}")


class FileStorageHandler(EventHandler):
    """Event handler that stores events in JSON files."""
    
    def __init__(self, name: str, storage_dir: str):
        """
        Initialize a new file storage handler.
        
        Args:
            name: Name of the handler
            storage_dir: Directory to store event files
        """
        super().__init__(name)
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        self.logger.info(f"Using storage directory: {storage_dir}")
    
    def _process_event(self, event: MonitoringEvent) -> bool:
        """
        Store the event in a JSON file.
        
        Args:
            event: The monitoring event to store
            
        Returns:
            True if the event was stored successfully, False otherwise
        """
        try:
            filename = os.path.join(
                self.storage_dir,
                f"event_{event.event_id}_{int(event.timestamp)}.json"
            )
            with open(filename, 'w') as f:
                json.dump(event.to_dict(), f, indent=2)
            self.logger.debug(f"Stored event {event.event_id} to {filename}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to store event {event.event_id}: {e}")
            return False


class LoggingHandler(EventHandler):
    """Event handler that logs events to the logging system."""
    
    def _process_event(self, event: MonitoringEvent) -> bool:
        """
        Log the event using the logging system.
        
        Args:
            event: The monitoring event to log
            
        Returns:
            True if the event was logged successfully, False otherwise
        """
        try:
            log_level = {
                AlertSeverity.INFO: logging.INFO,
                AlertSeverity.LOW: logging.INFO,
                AlertSeverity.MEDIUM: logging.WARNING,
                AlertSeverity.HIGH: logging.ERROR,
                AlertSeverity.CRITICAL: logging.CRITICAL
            }.get(event.severity, logging.INFO)
            
            self.logger.log(
                log_level,
                f"[{event.source}] {event.event_type}: "
                f"{json.dumps(event.details, default=str)}"
            )
            return True
        except Exception as e:
            self.logger.error(f"Failed to log event {event.event_id}: {e}")
            return False


class DataCollector:
    """Base class for data collectors that gather monitoring data."""
    
    def __init__(self, name: str, framework: 'MonitoringFramework'):
        """
        Initialize a new data collector.
        
        Args:
            name: Name of the collector
            framework: Reference to the monitoring framework
        """
        self.name = name
        self.framework = framework
        self.logger = logging.getLogger(f"Collector.{name}")
        self.enabled = True
        self.collection_interval = 60  # Default: collect data every 60 seconds
        self.last_collection = 0
        self.collection_count = 0
        self.configuration = {}
        self.logger.info(f"Initialized data collector: {name}")
    
    def collect(self) -> Dict[str, Any]:
        """
        Collect monitoring data.
        
        This method should be overridden by subclasses.
        
        Returns:
            Dictionary containing collected data
        """
        self.last_collection = time.time()
        self.collection_count += 1
        self.logger.debug(f"Collected data from {self.name} (count: {self.collection_count})")
        return {}
    
    def should_collect(self) -> bool:
        """
        Determine if data should be collected based on the collection interval.
        
        Returns:
            True if data should be collected, False otherwise
        """
        return (time.time() - self.last_collection) >= self.collection_interval
    
    def configure(self, config: Dict[str, Any]) -> None:
        """
        Configure the collector with specific settings.
        
        Args:
            config: Configuration dictionary
        """
        if 'collection_interval' in config:
            self.collection_interval = config['collection_interval']
        self.configuration.update(config)
        self.logger.info(f"Updated configuration for {self.name}")


class MonitoringFramework:
    """
    Core framework for continuous risk monitoring and health checks.
    
    This class provides the central coordination point for all monitoring
    activities, including event processing, data collection, and monitor execution.
    """
    
    def __init__(self):
        """Initialize a new monitoring framework."""
        self.logger = logging.getLogger("MonitoringFramework")
        self.monitors: Dict[str, BaseMonitor] = {}
        self.collectors: Dict[str, DataCollector] = {}
        self.handlers: Dict[str, EventHandler] = {}
        self.event_history: List[MonitoringEvent] = []
        self.max_history_size = 1000
        self.running = False
        self.collection_thread = None
        self.monitor_thread = None
        self._stop_event = threading.Event()
        self.logger.info("Initialized monitoring framework")
    
    def register_monitor(self, monitor: BaseMonitor) -> None:
        """
        Register a monitor with the framework.
        
        Args:
            monitor: The monitor to register
        """
        self.monitors[monitor.name] = monitor
        self.logger.info(f"Registered monitor: {monitor.name}")
    
    def register_collector(self, collector: DataCollector) -> None:
        """
        Register a data collector with the framework.
        
        Args:
            collector: The collector to register
        """
        self.collectors[collector.name] = collector
        self.logger.info(f"Registered collector: {collector.name}")
    
    def register_handler(self, handler: EventHandler) -> None:
        """
        Register an event handler with the framework.
        
        Args:
            handler: The handler to register
        """
        self.handlers[handler.name] = handler
        self.logger.info(f"Registered handler: {handler.name}")
    
    def process_event(self, event: MonitoringEvent) -> None:
        """
        Process a monitoring event.
        
        Args:
            event: The event to process
        """
        self.logger.debug(f"Processing event: {event.event_id}")
        
        # Add to history, maintaining max size
        self.event_history.append(event)
        if len(self.event_history) > self.max_history_size:
            self.event_history = self.event_history[-self.max_history_size:]
        
        # Process through all handlers
        for handler in self.handlers.values():
            if handler.enabled:
                try:
                    handler.handle_event(event)
                except Exception as e:
                    self.logger.error(f"Handler {handler.name} failed to process event: {e}")
    
    def _collection_loop(self) -> None:
        """Run the data collection loop."""
        self.logger.info("Starting data collection loop")
        while not self._stop_event.is_set():
            for name, collector in self.collectors.items():
                if collector.enabled and collector.should_collect():
                    try:
                        data = collector.collect()
                        if data:
                            self.process_event(MonitoringEvent(
                                event_type="data_collection",
                                source=name,
                                details={"collected_data": data}
                            ))
                    except Exception as e:
                        self.logger.error(f"Collector {name} failed: {e}")
            
            # Sleep for a short interval to avoid high CPU usage
            self._stop_event.wait(1)
        
        self.logger.info("Data collection loop terminated")
    
    def _monitor_loop(self) -> None:
        """Run the monitor execution loop."""
        self.logger.info("Starting monitor execution loop")
        while not self._stop_event.is_set():
            for name, monitor in self.monitors.items():
                if monitor.enabled:
                    try:
                        monitor.execute()
                    except Exception as e:
                        self.logger.error(f"Monitor {name} execution failed: {e}")
            
            # Sleep for a short interval to avoid high CPU usage
            self._stop_event.wait(5)
        
        self.logger.info("Monitor execution loop terminated")
    
    def start(self) -> None:
        """Start the monitoring framework."""
        if self.running:
            self.logger.warning("Monitoring framework is already running")
            return
        
        self.logger.info("Starting monitoring framework")
        self._stop_event.clear()
        self.running = True
        
        # Start collection thread
        self.collection_thread = threading.Thread(
            target=self._collection_loop,
            name="MonitoringCollectionThread",
            daemon=True
        )
        self.collection_thread.start()
        
        # Start monitor thread
        self.monitor_thread = threading.Thread(
            target=self._monitor_loop,
            name="MonitoringExecutionThread",
            daemon=True
        )
        self.monitor_thread.start()
        
        self.logger.info("Monitoring framework started")
    
    def stop(self) -> None:
        """Stop the monitoring framework."""
        if not self.running:
            self.logger.warning("Monitoring framework is not running")
            return
        
        self.logger.info("Stopping monitoring framework")
        self._stop_event.set()
        self.running = False
        
        # Wait for threads to terminate
        if self.collection_thread and self.collection_thread.is_alive():
            self.collection_thread.join(timeout=5)
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=5)
        
        self.logger.info("Monitoring framework stopped")
    
    def get_recent_events(
        self,
        count: int = 10,
        severity_filter: Optional[Set[AlertSeverity]] = None,
        source_filter: Optional[Set[str]] = None
    ) -> List[MonitoringEvent]:
        """
        Get recent monitoring events with optional filtering.
        
        Args:
            count: Maximum number of events to return
            severity_filter: Set of severity levels to include
            source_filter: Set of source names to include
            
        Returns:
            List of recent events matching the filters
        """
        filtered_events = self.event_history
        
        if severity_filter:
            filtered_events = [e for e in filtered_events if e.severity in severity_filter]
        
        if source_filter:
            filtered_events = [e for e in filtered_events if e.source in source_filter]
        
        # Return most recent events first
        return sorted(filtered_events, key=lambda e: e.timestamp, reverse=True)[:count]
