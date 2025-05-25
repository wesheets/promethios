"""
Memory Logging Monitor for Continuous Risk Monitoring System.

This module implements real-time monitoring for memory logging operations,
detecting anomalies and issues in log completeness, timestamp sequence,
logging latency, and storage integrity.
"""

import logging
import time
from typing import Dict, List, Any, Optional, Set, Tuple
from enum import Enum
from datetime import datetime

from monitoring_framework import BaseMonitor, AlertSeverity, MonitoringEvent

class LoggingAnomalyType(Enum):
    """Types of anomalies that can be detected in memory logging."""
    MISSING_ENTRIES = "missing_entries"
    TIMESTAMP_DISORDER = "timestamp_disorder"
    EXCESSIVE_LATENCY = "excessive_latency"
    STORAGE_CORRUPTION = "storage_corruption"
    DUPLICATE_ENTRIES = "duplicate_entries"
    INCOMPLETE_METADATA = "incomplete_metadata"


class MemoryLoggingMonitor(BaseMonitor):
    """
    Monitor for memory logging operations.
    
    This monitor detects issues in log completeness, timestamp sequence,
    logging latency, and storage integrity.
    """
    
    def __init__(self, name: str, framework):
        """
        Initialize the memory logging monitor.
        
        Args:
            name: Name of the monitor
            framework: Reference to the monitoring framework
        """
        super().__init__(name, framework)
        self.log_sequence_history = {}
        self.latency_history = {}
        self.storage_checksums = {}
        self.expected_log_patterns = {}
        self.anomaly_thresholds = {
            LoggingAnomalyType.MISSING_ENTRIES: 0,  # Any missing entry is an anomaly
            LoggingAnomalyType.TIMESTAMP_DISORDER: 0,  # Any disorder is an anomaly
            LoggingAnomalyType.EXCESSIVE_LATENCY: 500.0,  # 500ms threshold
            LoggingAnomalyType.STORAGE_CORRUPTION: 0,  # Any corruption is an anomaly
            LoggingAnomalyType.DUPLICATE_ENTRIES: 0,  # Any duplicate is an anomaly
            LoggingAnomalyType.INCOMPLETE_METADATA: 0,  # Any incomplete metadata is an anomaly
        }
        self.logger.info(f"Initialized memory logging monitor: {name}")
    
    def configure(self, config: Dict[str, Any]) -> None:
        """
        Configure the monitor with specific settings.
        
        Args:
            config: Configuration dictionary
        """
        super().configure(config)
        
        # Update anomaly thresholds if provided
        if 'anomaly_thresholds' in config:
            for anomaly_type, threshold in config['anomaly_thresholds'].items():
                if isinstance(anomaly_type, str):
                    anomaly_type = LoggingAnomalyType(anomaly_type)
                self.anomaly_thresholds[anomaly_type] = threshold
        
        # Update expected log patterns if provided
        if 'expected_log_patterns' in config:
            self.expected_log_patterns.update(config['expected_log_patterns'])
        
        self.logger.info(f"Updated configuration for {self.name}")
    
    def execute(self) -> None:
        """Execute the monitor's check logic."""
        super().execute()
        
        # Run all monitoring functions
        self.verify_log_completeness()
        self.validate_timestamp_sequence()
        self.detect_logging_latency_issues()
        self.monitor_log_storage_integrity()
    
    def verify_log_completeness(self) -> None:
        """
        Check for missing log entries.
        
        This function analyzes log sequences to detect missing entries
        based on expected sequence numbers or patterns.
        """
        self.logger.debug("Verifying log completeness")
        
        # In a real implementation, this would hook into the memory logging system
        # For now, we'll simulate by checking if we have any log data to analyze
        if not hasattr(self, '_test_log_data'):
            self.logger.debug("No log data available")
            return
        
        # Process test log data
        for source_id, logs in self._test_log_data.items():
            # Sort logs by sequence number
            sorted_logs = sorted(logs, key=lambda x: x.get('sequence_number', 0))
            
            # Check for missing sequence numbers
            if sorted_logs:
                expected_sequences = self._get_expected_sequences(source_id, sorted_logs)
                actual_sequences = {log.get('sequence_number') for log in sorted_logs}
                missing_sequences = expected_sequences - actual_sequences
                
                if missing_sequences:
                    self.emit_event(
                        event_type="missing_log_entries",
                        details={
                            "source_id": source_id,
                            "missing_sequences": sorted(list(missing_sequences)),
                            "expected_count": len(expected_sequences),
                            "actual_count": len(actual_sequences),
                            "first_sequence": min(actual_sequences) if actual_sequences else None,
                            "last_sequence": max(actual_sequences) if actual_sequences else None
                        },
                        severity=AlertSeverity.HIGH
                    )
                    self.logger.warning(
                        f"Missing log entries detected for {source_id}: "
                        f"{len(missing_sequences)} entries missing"
                    )
            
            # Check for duplicate sequence numbers
            sequence_counts = {}
            for log in sorted_logs:
                seq = log.get('sequence_number')
                if seq in sequence_counts:
                    sequence_counts[seq] += 1
                else:
                    sequence_counts[seq] = 1
            
            duplicates = {seq: count for seq, count in sequence_counts.items() if count > 1}
            if duplicates:
                self.emit_event(
                    event_type="duplicate_log_entries",
                    details={
                        "source_id": source_id,
                        "duplicate_sequences": duplicates,
                        "total_duplicates": sum(count - 1 for count in duplicates.values())
                    },
                    severity=AlertSeverity.MEDIUM
                )
                self.logger.warning(
                    f"Duplicate log entries detected for {source_id}: "
                    f"{sum(count - 1 for count in duplicates.values())} duplicates"
                )
            
            # Update log sequence history
            self.log_sequence_history[source_id] = {
                'timestamp': time.time(),
                'sequences': {log.get('sequence_number') for log in sorted_logs},
                'count': len(sorted_logs)
            }
    
    def _get_expected_sequences(self, source_id: str, logs: List[Dict[str, Any]]) -> Set[int]:
        """
        Get the expected sequence numbers for a log source.
        
        Args:
            source_id: ID of the log source
            logs: List of log entries
            
        Returns:
            Set of expected sequence numbers
        """
        if not logs:
            return set()
        
        # Get the minimum and maximum sequence numbers
        sequences = [log.get('sequence_number', 0) for log in logs]
        min_seq = min(sequences)
        max_seq = max(sequences)
        
        # Generate the expected sequence range
        return set(range(min_seq, max_seq + 1))
    
    def validate_timestamp_sequence(self) -> None:
        """
        Verify timestamp ordering in log entries.
        
        This function checks that timestamps in log entries are properly ordered
        and detects any out-of-order entries.
        """
        self.logger.debug("Validating timestamp sequence")
        
        # In a real implementation, this would hook into the memory logging system
        # For now, we'll simulate by checking if we have any log data to analyze
        if not hasattr(self, '_test_log_data'):
            self.logger.debug("No log data available")
            return
        
        # Process test log data
        for source_id, logs in self._test_log_data.items():
            # Sort logs by sequence number
            sorted_logs = sorted(logs, key=lambda x: x.get('sequence_number', 0))
            
            # Check for timestamp disorder
            disorders = []
            prev_timestamp = None
            
            for i, log in enumerate(sorted_logs):
                current_timestamp = log.get('timestamp', 0)
                
                if prev_timestamp is not None and current_timestamp < prev_timestamp:
                    disorders.append({
                        'index': i,
                        'sequence': log.get('sequence_number'),
                        'current_timestamp': current_timestamp,
                        'previous_timestamp': prev_timestamp,
                        'difference_ms': (prev_timestamp - current_timestamp) * 1000
                    })
                
                prev_timestamp = current_timestamp
            
            if disorders:
                self.emit_event(
                    event_type="timestamp_disorder",
                    details={
                        "source_id": source_id,
                        "disorders": disorders,
                        "disorder_count": len(disorders),
                        "total_logs": len(sorted_logs)
                    },
                    severity=AlertSeverity.HIGH
                )
                self.logger.warning(
                    f"Timestamp disorder detected for {source_id}: "
                    f"{len(disorders)} out-of-order timestamps"
                )
    
    def detect_logging_latency_issues(self) -> None:
        """
        Alert on excessive logging delays.
        
        This function monitors the latency between event occurrence and logging,
        alerting when latency exceeds acceptable thresholds.
        """
        self.logger.debug("Detecting logging latency issues")
        
        # In a real implementation, this would hook into the memory logging system
        # For now, we'll simulate by checking if we have any latency data to analyze
        if not hasattr(self, '_test_latency_data'):
            self.logger.debug("No latency data available")
            return
        
        # Process test latency data
        for source_id, latency_data in self._test_latency_data.items():
            current_latency = latency_data.get('current_latency_ms', 0.0)
            average_latency = latency_data.get('average_latency_ms', 0.0)
            
            # Check if current latency exceeds threshold
            threshold = self.anomaly_thresholds[LoggingAnomalyType.EXCESSIVE_LATENCY]
            if current_latency > threshold:
                # Check if this is a new issue or worsening
                is_new_issue = True
                is_worsening = False
                
                if source_id in self.latency_history:
                    prev_latency = self.latency_history[source_id].get('current_latency_ms', 0.0)
                    is_new_issue = prev_latency <= threshold
                    is_worsening = current_latency > prev_latency * 1.2  # 20% worse
                
                severity = AlertSeverity.CRITICAL if is_worsening else AlertSeverity.HIGH
                
                self.emit_event(
                    event_type="excessive_logging_latency",
                    details={
                        "source_id": source_id,
                        "current_latency_ms": current_latency,
                        "average_latency_ms": average_latency,
                        "threshold_ms": threshold,
                        "excess_ms": current_latency - threshold,
                        "is_new_issue": is_new_issue,
                        "is_worsening": is_worsening
                    },
                    severity=severity
                )
                self.logger.warning(
                    f"Excessive logging latency detected for {source_id}: "
                    f"{current_latency:.2f}ms (threshold: {threshold:.2f}ms)"
                )
            
            # Update latency history
            self.latency_history[source_id] = {
                'timestamp': time.time(),
                'current_latency_ms': current_latency,
                'average_latency_ms': average_latency
            }
    
    def monitor_log_storage_integrity(self) -> None:
        """
        Verify log storage integrity.
        
        This function checks the integrity of stored logs by validating checksums
        and detecting any corruption or tampering.
        """
        self.logger.debug("Monitoring log storage integrity")
        
        # In a real implementation, this would hook into the memory logging system
        # For now, we'll simulate by checking if we have any storage data to analyze
        if not hasattr(self, '_test_storage_data'):
            self.logger.debug("No storage data available")
            return
        
        # Process test storage data
        for storage_id, storage_data in self._test_storage_data.items():
            current_checksum = storage_data.get('checksum', '')
            expected_checksum = storage_data.get('expected_checksum', '')
            
            # Check if checksums match
            if current_checksum != expected_checksum:
                self.emit_event(
                    event_type="log_storage_corruption",
                    details={
                        "storage_id": storage_id,
                        "current_checksum": current_checksum,
                        "expected_checksum": expected_checksum,
                        "storage_metadata": storage_data.get('metadata', {})
                    },
                    severity=AlertSeverity.CRITICAL
                )
                self.logger.error(
                    f"Log storage corruption detected for {storage_id}: "
                    f"checksum mismatch"
                )
            
            # Update storage checksums
            self.storage_checksums[storage_id] = {
                'timestamp': time.time(),
                'checksum': current_checksum,
                'expected': expected_checksum,
                'metadata': storage_data.get('metadata', {})
            }
    
    def set_test_data(self, 
                     log_data: Optional[Dict[str, List[Dict[str, Any]]]] = None,
                     latency_data: Optional[Dict[str, Dict[str, Any]]] = None,
                     storage_data: Optional[Dict[str, Dict[str, Any]]] = None) -> None:
        """
        Set test data for the monitor.
        
        This method is for testing purposes only and would not exist in a production system.
        
        Args:
            log_data: Test log entry data
            latency_data: Test logging latency data
            storage_data: Test storage integrity data
        """
        if log_data is not None:
            self._test_log_data = log_data
        
        if latency_data is not None:
            self._test_latency_data = latency_data
        
        if storage_data is not None:
            self._test_storage_data = storage_data
