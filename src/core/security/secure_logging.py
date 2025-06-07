"""
Secure logging framework for Promethios.

This module provides a secure logging system with features like log integrity protection,
sensitive data redaction, and tamper-evident logging to ensure security events are
properly recorded and protected.
"""

import os
import re
import json
import time
import logging
import hashlib
import threading
from typing import Dict, List, Optional, Union, Any, Set, Pattern
from enum import Enum
from datetime import datetime
from logging.handlers import RotatingFileHandler

from src.core.security.crypto_framework import crypto_provider, CryptoAlgorithm

# Configure base logging
logger = logging.getLogger(__name__)

class LogLevel(Enum):
    """Enumeration of log levels with security context."""
    DEBUG = 10
    INFO = 20
    WARNING = 30
    ERROR = 40
    CRITICAL = 50
    SECURITY = 60  # Custom level for security events

class LogCategory(Enum):
    """Enumeration of log categories."""
    SYSTEM = "SYSTEM"
    SECURITY = "SECURITY"
    AUDIT = "AUDIT"
    USER = "USER"
    EXTENSION = "EXTENSION"
    PERFORMANCE = "PERFORMANCE"
    INTEGRATION = "INTEGRATION"

class SensitiveDataType(Enum):
    """Enumeration of sensitive data types for redaction."""
    API_KEY = "API_KEY"
    PASSWORD = "PASSWORD"
    TOKEN = "TOKEN"
    CREDENTIAL = "CREDENTIAL"
    PII = "PII"  # Personally Identifiable Information
    CUSTOM = "CUSTOM"

class SecureLogger:
    """
    Secure logging system with integrity protection and redaction.
    
    This class provides a secure logging system that ensures logs are
    properly protected against tampering and sensitive data is redacted.
    """
    
    # Patterns for sensitive data detection
    SENSITIVE_PATTERNS = {
        SensitiveDataType.API_KEY: [
            r'api[_-]?key["\s:=]+["\']?([a-zA-Z0-9]{16,64})["\']?',
            r'api[_-]?secret["\s:=]+["\']?([a-zA-Z0-9]{16,64})["\']?',
        ],
        SensitiveDataType.PASSWORD: [
            r'password["\s:=]+["\']?([^"\']{3,64})["\']?',
            r'passwd["\s:=]+["\']?([^"\']{3,64})["\']?',
            r'pass["\s:=]+["\']?([^"\']{3,64})["\']?',
        ],
        SensitiveDataType.TOKEN: [
            r'token["\s:=]+["\']?([a-zA-Z0-9_\-.]{16,256})["\']?',
            r'access[_-]?token["\s:=]+["\']?([a-zA-Z0-9_\-.]{16,256})["\']?',
            r'refresh[_-]?token["\s:=]+["\']?([a-zA-Z0-9_\-.]{16,256})["\']?',
            r'jwt["\s:=]+["\']?([a-zA-Z0-9_\-.]{16,256})["\']?',
        ],
        SensitiveDataType.CREDENTIAL: [
            r'credential["\s:=]+["\']?([^"\']{3,64})["\']?',
            r'secret["\s:=]+["\']?([^"\']{3,64})["\']?',
        ],
        SensitiveDataType.PII: [
            # Social Security Number (US)
            r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b',
            # Email
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            # Credit Card
            r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
            # Phone Number
            r'\b(?:\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b',
        ],
    }
    
    def __init__(self, 
                log_dir: str = "/var/log/promethios",
                max_log_size_mb: int = 10,
                backup_count: int = 5,
                integrity_check_interval: int = 3600,
                enable_console_logging: bool = True):
        """
        Initialize the secure logger.
        
        Args:
            log_dir: Directory for log files
            max_log_size_mb: Maximum size of each log file in MB
            backup_count: Number of backup files to keep
            integrity_check_interval: Interval for integrity checks in seconds
            enable_console_logging: Whether to enable console logging
        """
        self.log_dir = log_dir
        self.max_log_size_mb = max_log_size_mb
        self.backup_count = backup_count
        self.integrity_check_interval = integrity_check_interval
        self.enable_console_logging = enable_console_logging
        
        # Create log directory if it doesn't exist
        os.makedirs(log_dir, exist_ok=True)
        
        # Initialize loggers
        self.loggers = {}
        self.log_files = {}
        self.last_hashes = {}
        self.lock = threading.RLock()
        
        # Compile regex patterns
        self.compiled_patterns = {}
        for data_type, patterns in self.SENSITIVE_PATTERNS.items():
            self.compiled_patterns[data_type] = [re.compile(pattern) for pattern in patterns]
        
        # Custom patterns
        self.custom_patterns = []
        
        # Initialize system logger
        self._init_logger(LogCategory.SYSTEM.value)
        
        # Start integrity check thread
        if integrity_check_interval > 0:
            self._start_integrity_check()
    
    def _init_logger(self, category: str) -> logging.Logger:
        """
        Initialize a logger for a specific category.
        
        Args:
            category: Log category
            
        Returns:
            Configured logger
        """
        with self.lock:
            if category in self.loggers:
                return self.loggers[category]
            
            # Create logger
            logger = logging.getLogger(f"promethios.{category.lower()}")
            logger.setLevel(logging.DEBUG)
            logger.propagate = False
            
            # Create log file path
            log_file = os.path.join(self.log_dir, f"{category.lower()}.log")
            self.log_files[category] = log_file
            
            # Create file handler
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=self.max_log_size_mb * 1024 * 1024,
                backupCount=self.backup_count
            )
            file_handler.setLevel(logging.DEBUG)
            
            # Create formatter
            formatter = logging.Formatter(
                '%(asctime)s [%(levelname)s] [%(name)s] [%(process)d:%(thread)d] - %(message)s'
            )
            file_handler.setFormatter(formatter)
            
            # Add handler to logger
            logger.addHandler(file_handler)
            
            # Add console handler if enabled
            if self.enable_console_logging:
                console_handler = logging.StreamHandler()
                console_handler.setLevel(logging.INFO)
                console_handler.setFormatter(formatter)
                logger.addHandler(console_handler)
            
            # Store logger
            self.loggers[category] = logger
            
            # Initialize hash
            self._update_log_hash(category)
            
            return logger
    
    def _update_log_hash(self, category: str) -> str:
        """
        Update the hash for a log file.
        
        Args:
            category: Log category
            
        Returns:
            New hash value
        """
        log_file = self.log_files.get(category)
        if not log_file or not os.path.exists(log_file):
            self.last_hashes[category] = ""
            return ""
        
        try:
            with open(log_file, 'rb') as f:
                content = f.read()
                hash_value = hashlib.sha256(content).hexdigest()
                self.last_hashes[category] = hash_value
                return hash_value
        except Exception as e:
            logger.error(f"Failed to update log hash for {category}: {e}")
            return ""
    
    def _verify_log_integrity(self, category: str) -> bool:
        """
        Verify the integrity of a log file.
        
        Args:
            category: Log category
            
        Returns:
            True if integrity is verified, False otherwise
        """
        log_file = self.log_files.get(category)
        if not log_file or not os.path.exists(log_file):
            return True
        
        last_hash = self.last_hashes.get(category, "")
        if not last_hash:
            return True
        
        try:
            with open(log_file, 'rb') as f:
                content = f.read()
                current_hash = hashlib.sha256(content).hexdigest()
                return current_hash == last_hash
        except Exception as e:
            logger.error(f"Failed to verify log integrity for {category}: {e}")
            return False
    
    def _start_integrity_check(self):
        """Start a background thread for periodic integrity checks."""
        def check_integrity():
            while True:
                time.sleep(self.integrity_check_interval)
                self._check_all_logs_integrity()
        
        thread = threading.Thread(target=check_integrity, daemon=True)
        thread.start()
    
    def _check_all_logs_integrity(self):
        """Check integrity of all log files."""
        with self.lock:
            for category in self.log_files:
                if not self._verify_log_integrity(category):
                    # Log tampering detected
                    system_logger = self.loggers.get(LogCategory.SYSTEM.value)
                    if system_logger:
                        system_logger.critical(
                            f"LOG TAMPERING DETECTED: {category} log file has been modified"
                        )
                    
                    # Create a security event
                    self.log_security_event(
                        "LOG_TAMPERING_DETECTED",
                        f"Log file for category {category} has been modified",
                        {"category": category, "file": self.log_files[category]}
                    )
                
                # Update hash after check
                self._update_log_hash(category)
    
    def _redact_sensitive_data(self, message: str) -> str:
        """
        Redact sensitive data from a log message.
        
        Args:
            message: Log message
            
        Returns:
            Redacted message
        """
        if not message:
            return message
        
        redacted_message = message
        
        # Apply built-in patterns
        for data_type, patterns in self.compiled_patterns.items():
            for pattern in patterns:
                redacted_message = pattern.sub(
                    f'\\1="***REDACTED-{data_type.value}***"',
                    redacted_message
                )
        
        # Apply custom patterns
        for pattern, replacement in self.custom_patterns:
            redacted_message = pattern.sub(replacement, redacted_message)
        
        return redacted_message
    
    def add_custom_redaction_pattern(self, pattern: str, replacement: str = "***REDACTED***"):
        """
        Add a custom pattern for redaction.
        
        Args:
            pattern: Regex pattern to match
            replacement: Replacement string
        """
        with self.lock:
            compiled_pattern = re.compile(pattern)
            self.custom_patterns.append((compiled_pattern, replacement))
    
    def log(self, 
           level: LogLevel, 
           category: LogCategory, 
           message: str, 
           metadata: Optional[Dict[str, Any]] = None,
           redact: bool = True):
        """
        Log a message with the specified level and category.
        
        Args:
            level: Log level
            category: Log category
            message: Log message
            metadata: Additional metadata
            redact: Whether to redact sensitive data
        """
        # Get or create logger for category
        category_str = category.value
        logger = self._init_logger(category_str)
        
        # Redact sensitive data if enabled
        if redact:
            message = self._redact_sensitive_data(message)
            if metadata:
                metadata = self._redact_metadata(metadata)
        
        # Format message with metadata
        if metadata:
            formatted_message = f"{message} | {json.dumps(metadata)}"
        else:
            formatted_message = message
        
        # Log message
        log_level = level.value
        logger.log(log_level, formatted_message)
        
        # Update hash after logging
        self._update_log_hash(category_str)
    
    def _redact_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Redact sensitive data from metadata.
        
        Args:
            metadata: Metadata dictionary
            
        Returns:
            Redacted metadata
        """
        if not metadata:
            return metadata
        
        redacted = {}
        for key, value in metadata.items():
            if isinstance(value, str):
                redacted[key] = self._redact_sensitive_data(value)
            elif isinstance(value, dict):
                redacted[key] = self._redact_metadata(value)
            elif isinstance(value, list):
                redacted[key] = [
                    self._redact_metadata(item) if isinstance(item, dict)
                    else self._redact_sensitive_data(item) if isinstance(item, str)
                    else item
                    for item in value
                ]
            else:
                redacted[key] = value
        
        return redacted
    
    def log_security_event(self, 
                          event_type: str, 
                          description: str, 
                          details: Optional[Dict[str, Any]] = None,
                          redact: bool = True):
        """
        Log a security event.
        
        Args:
            event_type: Type of security event
            description: Description of the event
            details: Additional details
            redact: Whether to redact sensitive data
        """
        metadata = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "process_id": os.getpid(),
            "thread_id": threading.get_ident(),
        }
        
        if details:
            metadata["details"] = details
        
        # Create a signed security event
        try:
            event_data = json.dumps(metadata).encode('utf-8')
            signature = crypto_provider.sign(event_data, "default-signing")
            metadata["signature"] = signature
        except Exception as e:
            logger.error(f"Failed to sign security event: {e}")
        
        self.log(LogLevel.SECURITY, LogCategory.SECURITY, description, metadata, redact)
    
    def log_audit_event(self, 
                       action: str, 
                       resource: str, 
                       actor: str,
                       status: str,
                       details: Optional[Dict[str, Any]] = None,
                       redact: bool = True):
        """
        Log an audit event.
        
        Args:
            action: Action performed
            resource: Resource affected
            actor: Actor who performed the action
            status: Status of the action
            details: Additional details
            redact: Whether to redact sensitive data
        """
        metadata = {
            "action": action,
            "resource": resource,
            "actor": actor,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        if details:
            metadata["details"] = details
        
        description = f"AUDIT: {action} on {resource} by {actor} - {status}"
        self.log(LogLevel.INFO, LogCategory.AUDIT, description, metadata, redact)
    
    def debug(self, category: LogCategory, message: str, metadata: Optional[Dict[str, Any]] = None):
        """Log a debug message."""
        self.log(LogLevel.DEBUG, category, message, metadata)
    
    def info(self, category: LogCategory, message: str, metadata: Optional[Dict[str, Any]] = None):
        """Log an info message."""
        self.log(LogLevel.INFO, category, message, metadata)
    
    def warning(self, category: LogCategory, message: str, metadata: Optional[Dict[str, Any]] = None):
        """Log a warning message."""
        self.log(LogLevel.WARNING, category, message, metadata)
    
    def error(self, category: LogCategory, message: str, metadata: Optional[Dict[str, Any]] = None):
        """Log an error message."""
        self.log(LogLevel.ERROR, category, message, metadata)
    
    def critical(self, category: LogCategory, message: str, metadata: Optional[Dict[str, Any]] = None):
        """Log a critical message."""
        self.log(LogLevel.CRITICAL, category, message, metadata)
    
    def security(self, message: str, metadata: Optional[Dict[str, Any]] = None):
        """Log a security message."""
        self.log(LogLevel.SECURITY, LogCategory.SECURITY, message, metadata)
    
    def export_logs(self, 
                   category: LogCategory, 
                   start_time: Optional[datetime] = None,
                   end_time: Optional[datetime] = None,
                   filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Export logs for a specific category.
        
        Args:
            category: Log category
            start_time: Start time filter
            end_time: End time filter
            filters: Additional filters
            
        Returns:
            List of log entries
        """
        category_str = category.value
        log_file = self.log_files.get(category_str)
        if not log_file or not os.path.exists(log_file):
            return []
        
        result = []
        try:
            with open(log_file, 'r') as f:
                for line in f:
                    # Parse log entry
                    try:
                        entry = self._parse_log_entry(line)
                        if not entry:
                            continue
                        
                        # Apply time filters
                        if start_time and entry.get("timestamp") < start_time:
                            continue
                        if end_time and entry.get("timestamp") > end_time:
                            continue
                        
                        # Apply additional filters
                        if filters:
                            match = True
                            for key, value in filters.items():
                                if key not in entry or entry[key] != value:
                                    match = False
                                    break
                            if not match:
                                continue
                        
                        result.append(entry)
                    except Exception as e:
                        logger.error(f"Failed to parse log entry: {e}")
            
            return result
        except Exception as e:
            logger.error(f"Failed to export logs for {category}: {e}")
            return []
    
    def _parse_log_entry(self, line: str) -> Optional[Dict[str, Any]]:
        """
        Parse a log entry.
        
        Args:
            line: Log line
            
        Returns:
            Parsed log entry or None if parsing failed
        """
        try:
            # Basic parsing of log format
            # Format: '%(asctime)s [%(levelname)s] [%(name)s] [%(process)d:%(thread)d] - %(message)s'
            match = re.match(
                r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) \[(\w+)\] \[([^]]+)\] \[(\d+):(\d+)\] - (.*)',
                line
            )
            if not match:
                return None
            
            timestamp_str, level, name, process_id, thread_id, message = match.groups()
            
            # Parse timestamp
            timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S,%f')
            
            # Split message and metadata
            message_parts = message.split(' | ', 1)
            message_text = message_parts[0]
            metadata = {}
            
            if len(message_parts) > 1:
                try:
                    metadata = json.loads(message_parts[1])
                except json.JSONDecodeError:
                    pass
            
            return {
                "timestamp": timestamp,
                "level": level,
                "name": name,
                "process_id": int(process_id),
                "thread_id": int(thread_id),
                "message": message_text,
                "metadata": metadata
            }
        except Exception as e:
            logger.error(f"Failed to parse log entry: {e}")
            return None

# Create global instance
secure_logger = SecureLogger()

def initialize():
    """Initialize the secure logging framework."""
    # Add custom redaction patterns
    secure_logger.add_custom_redaction_pattern(
        r'(auth[_-]?token)["\s:=]+["\']?([a-zA-Z0-9_\-.]{16,256})["\']?',
        '\\1="***REDACTED-AUTH-TOKEN***"'
    )
    
    # Log initialization
    secure_logger.info(
        LogCategory.SYSTEM,
        "Secure logging framework initialized",
        {"log_dir": secure_logger.log_dir}
    )
