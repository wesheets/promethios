"""
Feedback and Telemetry System

This module implements the feedback collection and telemetry tracking system
for monitoring API usage, collecting user feedback, and analyzing usage patterns.
"""

import logging
import uuid
import json
import time
import os
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import threading
import queue

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TelemetryCollector:
    """
    Telemetry collector for API usage tracking.
    
    This class provides functionality for:
    - Collecting API usage telemetry
    - Tracking performance metrics
    - Monitoring error rates
    - Analyzing usage patterns
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the telemetry collector.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.enabled = self.config.get('enabled', True)
        self.batch_size = self.config.get('batch_size', 100)
        self.flush_interval = self.config.get('flush_interval', 60)  # seconds
        self.storage_path = self.config.get('storage_path', './telemetry_data')
        self.anonymize = self.config.get('anonymize', True)
        
        # Initialize storage
        self.telemetry_queue = queue.Queue()
        self.last_flush_time = datetime.now()
        self.current_batch = []
        
        # Create storage directory if it doesn't exist
        if not os.path.exists(self.storage_path):
            os.makedirs(self.storage_path)
        
        # Start background processing thread if enabled
        if self.enabled:
            self.running = True
            self.processing_thread = threading.Thread(target=self._process_queue)
            self.processing_thread.daemon = True
            self.processing_thread.start()
            
            logger.info("Telemetry collector initialized and started")
        else:
            logger.info("Telemetry collector initialized but disabled")
    
    def track(self, event_type: str, data: Dict[str, Any]) -> None:
        """
        Track a telemetry event.
        
        Args:
            event_type: Type of event
            data: Event data
        """
        if not self.enabled:
            return
        
        # Create event record
        event = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "data": data
        }
        
        # Anonymize data if configured
        if self.anonymize:
            event = self._anonymize_event(event)
        
        # Add to queue for processing
        self.telemetry_queue.put(event)
    
    def _anonymize_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Anonymize sensitive data in an event.
        
        Args:
            event: Event to anonymize
            
        Returns:
            Dict: Anonymized event
        """
        # Create a copy to avoid modifying the original
        anonymized = event.copy()
        data = anonymized["data"].copy()
        
        # Anonymize user identifiers
        if "user_id" in data:
            data["user_id"] = self._hash_identifier(data["user_id"])
        
        if "email" in data:
            data["email"] = self._hash_identifier(data["email"])
        
        if "ip_address" in data:
            data["ip_address"] = self._hash_identifier(data["ip_address"])
        
        # Remove API keys and tokens
        if "api_key" in data:
            data["api_key"] = "[REDACTED]"
        
        if "token" in data:
            data["token"] = "[REDACTED]"
        
        # Handle nested data
        if "request" in data and isinstance(data["request"], dict):
            request = data["request"].copy()
            
            # Anonymize headers
            if "headers" in request and isinstance(request["headers"], dict):
                headers = request["headers"].copy()
                for sensitive_header in ["Authorization", "Cookie", "X-API-Key"]:
                    if sensitive_header in headers:
                        headers[sensitive_header] = "[REDACTED]"
                request["headers"] = headers
            
            data["request"] = request
        
        anonymized["data"] = data
        return anonymized
    
    def _hash_identifier(self, identifier: str) -> str:
        """
        Hash an identifier for anonymization.
        
        Args:
            identifier: Identifier to hash
            
        Returns:
            str: Hashed identifier
        """
        # In a real implementation, this would use a secure hashing method
        # with a salt that is consistent within a session but varies across sessions
        import hashlib
        return hashlib.sha256(identifier.encode()).hexdigest()[:16]
    
    def _process_queue(self) -> None:
        """Process telemetry events from the queue."""
        while self.running:
            try:
                # Check if it's time to flush the current batch
                if len(self.current_batch) >= self.batch_size or \
                   (datetime.now() - self.last_flush_time).total_seconds() >= self.flush_interval:
                    if self.current_batch:
                        self._flush_batch()
                
                # Get next event from queue with timeout
                try:
                    event = self.telemetry_queue.get(timeout=1.0)
                    self.current_batch.append(event)
                    self.telemetry_queue.task_done()
                except queue.Empty:
                    # No events in queue, continue
                    continue
                
            except Exception as e:
                logger.error(f"Error processing telemetry queue: {str(e)}")
                time.sleep(1)  # Avoid tight loop in case of persistent errors
    
    def _flush_batch(self) -> None:
        """Flush the current batch of events to storage."""
        if not self.current_batch:
            return
        
        try:
            # Generate filename based on timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"telemetry_{timestamp}_{uuid.uuid4().hex[:8]}.json"
            filepath = os.path.join(self.storage_path, filename)
            
            # Write batch to file
            with open(filepath, 'w') as f:
                json.dump(self.current_batch, f)
            
            logger.info(f"Flushed {len(self.current_batch)} telemetry events to {filepath}")
            
            # Clear batch and update last flush time
            self.current_batch = []
            self.last_flush_time = datetime.now()
        except Exception as e:
            logger.error(f"Error flushing telemetry batch: {str(e)}")
    
    def shutdown(self) -> None:
        """Shutdown the telemetry collector."""
        if not self.enabled or not self.running:
            return
        
        logger.info("Shutting down telemetry collector")
        self.running = False
        
        # Flush any remaining events
        if self.current_batch:
            self._flush_batch()
        
        # Wait for processing thread to finish
        if hasattr(self, 'processing_thread') and self.processing_thread.is_alive():
            self.processing_thread.join(timeout=5.0)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the telemetry collector.
        
        Returns:
            Dict: Statistics
        """
        return {
            "enabled": self.enabled,
            "queue_size": self.telemetry_queue.qsize(),
            "current_batch_size": len(self.current_batch),
            "last_flush_time": self.last_flush_time.isoformat(),
            "storage_path": self.storage_path
        }


class FeedbackManager:
    """
    Feedback manager for collecting and processing user feedback.
    
    This class provides functionality for:
    - Collecting user feedback
    - Categorizing feedback
    - Tracking feedback status
    - Generating feedback reports
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the feedback manager.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.storage_path = self.config.get('storage_path', './feedback_data')
        self.notify_email = self.config.get('notify_email')
        self.auto_categorize = self.config.get('auto_categorize', True)
        
        # Create storage directory if it doesn't exist
        if not os.path.exists(self.storage_path):
            os.makedirs(self.storage_path)
        
        # Load existing feedback
        self.feedback = self._load_feedback()
        
        logger.info("Feedback manager initialized")
    
    def _load_feedback(self) -> Dict[str, Dict[str, Any]]:
        """
        Load existing feedback from storage.
        
        Returns:
            Dict: Feedback items indexed by ID
        """
        feedback = {}
        
        try:
            # List all feedback files
            for filename in os.listdir(self.storage_path):
                if filename.startswith('feedback_') and filename.endswith('.json'):
                    filepath = os.path.join(self.storage_path, filename)
                    
                    with open(filepath, 'r') as f:
                        item = json.load(f)
                        if "id" in item:
                            feedback[item["id"]] = item
        except Exception as e:
            logger.error(f"Error loading feedback: {str(e)}")
        
        logger.info(f"Loaded {len(feedback)} feedback items")
        return feedback
    
    def _save_feedback_item(self, item: Dict[str, Any]) -> None:
        """
        Save a feedback item to storage.
        
        Args:
            item: Feedback item
        """
        try:
            # Generate filename based on ID
            filename = f"feedback_{item['id']}.json"
            filepath = os.path.join(self.storage_path, filename)
            
            # Write item to file
            with open(filepath, 'w') as f:
                json.dump(item, f)
            
            logger.info(f"Saved feedback item {item['id']} to {filepath}")
        except Exception as e:
            logger.error(f"Error saving feedback item: {str(e)}")
    
    def _categorize_feedback(self, content: str, metadata: Dict[str, Any]) -> str:
        """
        Automatically categorize feedback based on content and metadata.
        
        Args:
            content: Feedback content
            metadata: Feedback metadata
            
        Returns:
            str: Category
        """
        # In a real implementation, this would use NLP or ML techniques
        # For now, use simple keyword matching
        content_lower = content.lower()
        
        if "error" in content_lower or "bug" in content_lower or "issue" in content_lower:
            return "bug"
        elif "feature" in content_lower or "enhancement" in content_lower or "request" in content_lower:
            return "feature_request"
        elif "question" in content_lower or "how" in content_lower or "?" in content_lower:
            return "question"
        elif "thank" in content_lower or "great" in content_lower or "awesome" in content_lower:
            return "praise"
        else:
            return "general"
    
    def submit_feedback(self, user_id: str, feedback_type: str, content: str, 
                       metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Submit feedback.
        
        Args:
            user_id: User ID
            feedback_type: Type of feedback
            content: Feedback content
            metadata: Additional metadata
            
        Returns:
            Dict: Feedback submission result
        """
        # Validate input
        if not content:
            return {
                "error": {
                    "code": 400,
                    "message": "Feedback content is required"
                }
            }
        
        # Create feedback item
        feedback_id = str(uuid.uuid4())
        now = datetime.now()
        
        item = {
            "id": feedback_id,
            "user_id": user_id,
            "type": feedback_type,
            "content": content,
            "metadata": metadata or {},
            "submitted_at": now.isoformat(),
            "status": "new",
            "status_history": [],  # Initialize status history as empty list
            "updated_at": now.isoformat()
        }
        
        # Auto-categorize if enabled
        if self.auto_categorize:
            item["category"] = self._categorize_feedback(content, item["metadata"])
        
        # Save feedback
        self.feedback[feedback_id] = item
        self._save_feedback_item(item)
        
        # Send notification if configured
        if self.notify_email:
            self._send_notification(item)
        
        return {
            "id": feedback_id,
            "submitted_at": now.isoformat(),
            "status": "new"
        }
    
    def _send_notification(self, item: Dict[str, Any]) -> None:
        """
        Send notification about new feedback.
        
        Args:
            item: Feedback item
        """
        # In a real implementation, this would send an email or other notification
        logger.info(f"Would send notification about feedback {item['id']} to {self.notify_email}")
    
    def get_feedback(self, feedback_id: str) -> Dict[str, Any]:
        """
        Get a feedback item.
        
        Args:
            feedback_id: Feedback ID
            
        Returns:
            Dict: Feedback item
        """
        if feedback_id not in self.feedback:
            return {
                "error": {
                    "code": 404,
                    "message": f"Feedback with ID '{feedback_id}' not found"
                }
            }
        
        return self.feedback[feedback_id]
    
    def list_feedback(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        List feedback items with optional filtering.
        
        Args:
            filters: Filter criteria
            
        Returns:
            Dict: List of feedback items
        """
        filters = filters or {}
        results = []
        
        for item in self.feedback.values():
            # Apply filters
            include = True
            
            for key, value in filters.items():
                if key in item:
                    if isinstance(item[key], str) and isinstance(value, str):
                        if value.lower() not in item[key].lower():
                            include = False
                            break
                    elif item[key] != value:
                        include = False
                        break
            
            if include:
                results.append(item)
        
        return {
            "items": results,
            "count": len(results),
            "filters": filters
        }
    
    def update_feedback_status(self, feedback_id: str, status: str, 
                              comment: str = None) -> Dict[str, Any]:
        """
        Update the status of a feedback item.
        
        Args:
            feedback_id: Feedback ID
            status: New status
            comment: Optional comment
            
        Returns:
            Dict: Updated feedback item
        """
        if feedback_id not in self.feedback:
            return {
                "error": {
                    "code": 404,
                    "message": f"Feedback with ID '{feedback_id}' not found"
                }
            }
        
        # Validate status
        valid_statuses = ["new", "in_progress", "resolved", "closed", "reopened"]
        if status not in valid_statuses:
            return {
                "error": {
                    "code": 400,
                    "message": f"Invalid status: {status}. Valid statuses are: {', '.join(valid_statuses)}"
                }
            }
        
        # Update item
        item = self.feedback[feedback_id]
        old_status = item["status"]
        
        # Skip if status hasn't changed
        if old_status == status:
            return item
        
        # Update status and timestamp
        item["status"] = status
        item["updated_at"] = datetime.now().isoformat()
        
        # Initialize status_history if it doesn't exist
        if "status_history" not in item:
            item["status_history"] = []
        
        # Add status change to history
        status_change = {
            "from": old_status,
            "to": status,
            "timestamp": item["updated_at"]
        }
        
        if comment:
            status_change["comment"] = comment
        
        item["status_history"].append(status_change)
        
        # Save updated item
        self._save_feedback_item(item)
        
        return item
    
    def add_feedback_comment(self, feedback_id: str, user_id: str, 
                            content: str) -> Dict[str, Any]:
        """
        Add a comment to a feedback item.
        
        Args:
            feedback_id: Feedback ID
            user_id: User ID
            content: Comment content
            
        Returns:
            Dict: Updated feedback item
        """
        if feedback_id not in self.feedback:
            return {
                "error": {
                    "code": 404,
                    "message": f"Feedback with ID '{feedback_id}' not found"
                }
            }
        
        if not content:
            return {
                "error": {
                    "code": 400,
                    "message": "Comment content is required"
                }
            }
        
        # Update item
        item = self.feedback[feedback_id]
        
        # Add comments if not present
        if "comments" not in item:
            item["comments"] = []
        
        # Add comment
        comment = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        
        item["comments"].append(comment)
        item["updated_at"] = comment["timestamp"]
        
        # Save updated item
        self._save_feedback_item(item)
        
        return item
    
    def generate_report(self, start_date: str = None, end_date: str = None, 
                       group_by: str = "category") -> Dict[str, Any]:
        """
        Generate a feedback report.
        
        Args:
            start_date: Start date (ISO format)
            end_date: End date (ISO format)
            group_by: Field to group by
            
        Returns:
            Dict: Report data
        """
        # Parse dates
        start = None
        end = None
        
        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
            except ValueError:
                return {
                    "error": {
                        "code": 400,
                        "message": f"Invalid start_date format: {start_date}"
                    }
                }
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
            except ValueError:
                return {
                    "error": {
                        "code": 400,
                        "message": f"Invalid end_date format: {end_date}"
                    }
                }
        
        # Filter feedback by date
        filtered_feedback = []
        
        for item in self.feedback.values():
            # Parse submitted_at
            try:
                submitted_at = datetime.fromisoformat(item["submitted_at"])
            except (ValueError, KeyError):
                # Skip items with invalid dates
                continue
            
            # Apply date filters
            if start and submitted_at < start:
                continue
            
            if end and submitted_at > end:
                continue
            
            filtered_feedback.append(item)
        
        # Group feedback
        grouped = {}
        
        for item in filtered_feedback:
            # Get group key
            if group_by in item:
                key = item[group_by]
            else:
                key = "unknown"
            
            # Add to group
            if key not in grouped:
                grouped[key] = []
            
            grouped[key].append(item)
        
        # Generate report
        report = {
            "total_items": len(filtered_feedback),
            "group_by": group_by,
            "groups": {},
            "generated_at": datetime.now().isoformat()
        }
        
        if start_date:
            report["start_date"] = start_date
        
        if end_date:
            report["end_date"] = end_date
        
        # Add group data
        for key, items in grouped.items():
            report["groups"][key] = {
                "count": len(items),
                "percentage": round(len(items) / len(filtered_feedback) * 100, 2) if filtered_feedback else 0
            }
        
        return report
