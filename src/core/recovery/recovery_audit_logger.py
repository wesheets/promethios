"""
Recovery Audit Logger for Promethios Governance System.

This module provides functionality for logging recovery operations,
ensuring that all recovery actions are properly audited for compliance and analysis.
"""

import logging
import time
import json
import os
from typing import Dict, List, Optional, Any, Set

logger = logging.getLogger(__name__)

class RecoveryAuditLogger:
    """
    Logger for recovery operations.
    
    Provides comprehensive audit logging for all recovery operations,
    ensuring compliance with regulatory requirements and enabling post-incident analysis.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the recovery audit logger with the specified configuration.
        
        Args:
            config: Configuration parameters for the logger
        """
        self.config = config or {}
        self.audit_level = self.config.get('audit_level', 'detailed')
        self.log_directory = self.config.get('log_directory', '/var/log/promethios/recovery')
        self.retention_period = self.config.get('retention_period', 90)  # Default to 90 days
        self.logger = logging.getLogger(__name__)
        
        # Ensure log directory exists
        os.makedirs(self.log_directory, exist_ok=True)
        
    def log_recovery_event(self, event_type: str, event_data: Dict[str, Any]) -> bool:
        """
        Log a recovery event.
        
        Args:
            event_type: Type of recovery event
            event_data: Data about the recovery event
            
        Returns:
            bool: True if logging was successful
        """
        try:
            # Create log entry
            log_entry = {
                'timestamp': time.time(),
                'event_type': event_type,
                'data': event_data
            }
            
            # Add audit metadata
            if self.audit_level == 'detailed':
                log_entry['metadata'] = self._get_audit_metadata()
            
            # Write to log file
            log_file = os.path.join(self.log_directory, f"recovery_{time.strftime('%Y%m%d')}.log")
            with open(log_file, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
            
            # Log to system logger
            self.logger.info(f"Recovery event logged: {event_type}")
            
            return True
        except Exception as e:
            self.logger.error(f"Failed to log recovery event: {str(e)}")
            return False
    
    def _get_audit_metadata(self) -> Dict[str, Any]:
        """
        Get audit metadata for a log entry.
        
        Returns:
            dict: Audit metadata
        """
        return {
            'hostname': os.uname().nodename,
            'process_id': os.getpid(),
            'user': os.getlogin() if hasattr(os, 'getlogin') else 'unknown'
        }
    
    def log_detection(self, failure_data: Dict[str, Any]) -> bool:
        """
        Log a failure detection event.
        
        Args:
            failure_data: Data about the detected failure
            
        Returns:
            bool: True if logging was successful
        """
        return self.log_recovery_event('detection', failure_data)
    
    def log_plan_creation(self, plan_data: Dict[str, Any]) -> bool:
        """
        Log a recovery plan creation event.
        
        Args:
            plan_data: Data about the recovery plan
            
        Returns:
            bool: True if logging was successful
        """
        return self.log_recovery_event('plan_creation', plan_data)
    
    def log_execution(self, execution_data: Dict[str, Any]) -> bool:
        """
        Log a recovery execution event.
        
        Args:
            execution_data: Data about the recovery execution
            
        Returns:
            bool: True if logging was successful
        """
        return self.log_recovery_event('execution', execution_data)
    
    def log_verification(self, verification_data: Dict[str, Any]) -> bool:
        """
        Log a recovery verification event.
        
        Args:
            verification_data: Data about the recovery verification
            
        Returns:
            bool: True if logging was successful
        """
        return self.log_recovery_event('verification', verification_data)
    
    def log_compensation(self, compensation_data: Dict[str, Any]) -> bool:
        """
        Log a recovery compensation event.
        
        Args:
            compensation_data: Data about the recovery compensation
            
        Returns:
            bool: True if logging was successful
        """
        return self.log_recovery_event('compensation', compensation_data)
    
    def get_recovery_logs(self, start_time: float = None, end_time: float = None, 
                         event_types: List[str] = None, plan_id: str = None) -> List[Dict[str, Any]]:
        """
        Get recovery logs based on specified filters.
        
        Args:
            start_time: Start time for log retrieval (Unix timestamp)
            end_time: End time for log retrieval (Unix timestamp)
            event_types: Types of events to retrieve
            plan_id: Recovery plan ID to filter by
            
        Returns:
            list: Filtered recovery logs
        """
        logs = []
        
        # Set default time range if not specified
        if start_time is None:
            start_time = time.time() - (86400 * 7)  # Default to 7 days ago
        if end_time is None:
            end_time = time.time()
        
        # Get log files in the time range
        log_files = self._get_log_files_in_range(start_time, end_time)
        
        # Read and filter logs
        for log_file in log_files:
            file_logs = self._read_logs_from_file(log_file, start_time, end_time, event_types, plan_id)
            logs.extend(file_logs)
        
        return logs
    
    def _get_log_files_in_range(self, start_time: float, end_time: float) -> List[str]:
        """
        Get log files in the specified time range.
        
        Args:
            start_time: Start time for log retrieval (Unix timestamp)
            end_time: End time for log retrieval (Unix timestamp)
            
        Returns:
            list: Log files in the time range
        """
        log_files = []
        
        # Convert timestamps to dates
        start_date = time.strftime('%Y%m%d', time.localtime(start_time))
        end_date = time.strftime('%Y%m%d', time.localtime(end_time))
        
        # Get all log files
        for filename in os.listdir(self.log_directory):
            if filename.startswith('recovery_') and filename.endswith('.log'):
                # Extract date from filename
                try:
                    file_date = filename[9:17]  # recovery_YYYYMMDD.log
                    if start_date <= file_date <= end_date:
                        log_files.append(os.path.join(self.log_directory, filename))
                except Exception:
                    continue
        
        return sorted(log_files)
    
    def _read_logs_from_file(self, log_file: str, start_time: float, end_time: float,
                            event_types: List[str] = None, plan_id: str = None) -> List[Dict[str, Any]]:
        """
        Read and filter logs from a file.
        
        Args:
            log_file: Log file to read
            start_time: Start time for log retrieval (Unix timestamp)
            end_time: End time for log retrieval (Unix timestamp)
            event_types: Types of events to retrieve
            plan_id: Recovery plan ID to filter by
            
        Returns:
            list: Filtered logs from the file
        """
        logs = []
        
        try:
            with open(log_file, 'r') as f:
                for line in f:
                    try:
                        log_entry = json.loads(line.strip())
                        
                        # Filter by timestamp
                        timestamp = log_entry.get('timestamp', 0)
                        if timestamp < start_time or timestamp > end_time:
                            continue
                        
                        # Filter by event type
                        if event_types and log_entry.get('event_type') not in event_types:
                            continue
                        
                        # Filter by plan ID
                        if plan_id:
                            data = log_entry.get('data', {})
                            if data.get('plan_id') != plan_id:
                                continue
                        
                        logs.append(log_entry)
                    except Exception:
                        continue
        except Exception as e:
            self.logger.error(f"Failed to read log file {log_file}: {str(e)}")
        
        return logs
    
    def cleanup_old_logs(self) -> bool:
        """
        Clean up old log files based on retention period.
        
        Returns:
            bool: True if cleanup was successful
        """
        try:
            # Calculate cutoff date
            cutoff_time = time.time() - (self.retention_period * 86400)
            cutoff_date = time.strftime('%Y%m%d', time.localtime(cutoff_time))
            
            # Get all log files
            for filename in os.listdir(self.log_directory):
                if filename.startswith('recovery_') and filename.endswith('.log'):
                    # Extract date from filename
                    try:
                        file_date = filename[9:17]  # recovery_YYYYMMDD.log
                        if file_date < cutoff_date:
                            # Delete old log file
                            os.remove(os.path.join(self.log_directory, filename))
                            self.logger.info(f"Deleted old log file: {filename}")
                    except Exception:
                        continue
            
            return True
        except Exception as e:
            self.logger.error(f"Failed to clean up old logs: {str(e)}")
            return False
    
    def export_logs(self, output_file: str, start_time: float = None, end_time: float = None,
                   event_types: List[str] = None, plan_id: str = None) -> bool:
        """
        Export recovery logs to a file.
        
        Args:
            output_file: Output file path
            start_time: Start time for log retrieval (Unix timestamp)
            end_time: End time for log retrieval (Unix timestamp)
            event_types: Types of events to retrieve
            plan_id: Recovery plan ID to filter by
            
        Returns:
            bool: True if export was successful
        """
        try:
            # Get logs
            logs = self.get_recovery_logs(start_time, end_time, event_types, plan_id)
            
            # Write to output file
            with open(output_file, 'w') as f:
                json.dump(logs, f, indent=2)
            
            self.logger.info(f"Exported {len(logs)} logs to {output_file}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to export logs: {str(e)}")
            return False
    
    def generate_audit_report(self, output_file: str, start_time: float = None, end_time: float = None,
                             plan_id: str = None) -> bool:
        """
        Generate an audit report for recovery operations.
        
        Args:
            output_file: Output file path
            start_time: Start time for report (Unix timestamp)
            end_time: End time for report (Unix timestamp)
            plan_id: Recovery plan ID to filter by
            
        Returns:
            bool: True if report generation was successful
        """
        try:
            # Get logs
            logs = self.get_recovery_logs(start_time, end_time, None, plan_id)
            
            # Group logs by plan ID
            plan_logs = {}
            for log in logs:
                data = log.get('data', {})
                plan_id = data.get('plan_id')
                if plan_id:
                    if plan_id not in plan_logs:
                        plan_logs[plan_id] = []
                    plan_logs[plan_id].append(log)
            
            # Generate report
            report = {
                'generated_at': time.time(),
                'time_range': {
                    'start': start_time,
                    'end': end_time
                },
                'summary': {
                    'total_plans': len(plan_logs),
                    'total_events': len(logs),
                    'event_types': self._count_event_types(logs)
                },
                'plans': []
            }
            
            # Add plan details
            for plan_id, plan_logs in plan_logs.items():
                plan_report = self._generate_plan_report(plan_id, plan_logs)
                report['plans'].append(plan_report)
            
            # Write to output file
            with open(output_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            self.logger.info(f"Generated audit report at {output_file}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to generate audit report: {str(e)}")
            return False
    
    def _count_event_types(self, logs: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Count events by type.
        
        Args:
            logs: List of log entries
            
        Returns:
            dict: Count of events by type
        """
        counts = {}
        for log in logs:
            event_type = log.get('event_type')
            if event_type:
                if event_type not in counts:
                    counts[event_type] = 0
                counts[event_type] += 1
        
        return counts
    
    def _generate_plan_report(self, plan_id: str, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate a report for a recovery plan.
        
        Args:
            plan_id: Recovery plan ID
            logs: List of log entries for the plan
            
        Returns:
            dict: Plan report
        """
        # Sort logs by timestamp
        sorted_logs = sorted(logs, key=lambda x: x.get('timestamp', 0))
        
        # Extract plan data
        plan_data = None
        for log in sorted_logs:
            if log.get('event_type') == 'plan_creation':
                plan_data = log.get('data', {})
                break
        
        # Extract execution data
        execution_logs = [log for log in sorted_logs if log.get('event_type') == 'execution']
        
        # Extract verification data
        verification_logs = [log for log in sorted_logs if log.get('event_type') == 'verification']
        
        # Determine plan status
        status = 'unknown'
        for log in reversed(sorted_logs):
            event_type = log.get('event_type')
            data = log.get('data', {})
            if event_type == 'verification':
                status = 'verified' if data.get('success') else 'verification_failed'
                break
            elif event_type == 'execution':
                status = 'executed'
                break
            elif event_type == 'compensation':
                status = 'compensated'
                break
            elif event_type == 'plan_creation':
                status = 'created'
                break
        
        # Generate plan report
        return {
            'plan_id': plan_id,
            'status': status,
            'timeline': {
                'created_at': self._get_event_timestamp(sorted_logs, 'plan_creation'),
                'execution_started_at': self._get_event_timestamp(sorted_logs, 'execution', 0),
                'execution_completed_at': self._get_event_timestamp(sorted_logs, 'execution', -1),
                'verification_started_at': self._get_event_timestamp(sorted_logs, 'verification', 0),
                'verification_completed_at': self._get_event_timestamp(sorted_logs, 'verification', -1)
            },
            'failure_type': plan_data.get('failure_type') if plan_data else None,
            'recovery_type': plan_data.get('recovery_type') if plan_data else None,
            'execution_steps': len(execution_logs),
            'verification_result': verification_logs[-1].get('data', {}).get('success') if verification_logs else None
        }
    
    def _get_event_timestamp(self, logs: List[Dict[str, Any]], event_type: str, index: int = 0) -> Optional[float]:
        """
        Get the timestamp of an event.
        
        Args:
            logs: List of log entries
            event_type: Type of event
            index: Index of the event (0 for first, -1 for last)
            
        Returns:
            float or None: Timestamp of the event
        """
        events = [log for log in logs if log.get('event_type') == event_type]
        if not events:
            return None
        
        if index < 0:
            index = len(events) + index
        
        if 0 <= index < len(events):
            return events[index].get('timestamp')
        
        return None
