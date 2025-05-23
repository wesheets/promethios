import unittest
import json
import os
import sys
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.feedback.feedback_telemetry import TelemetryCollector, FeedbackManager


class TestTelemetryCollector(unittest.TestCase):
    """Test cases for the TelemetryCollector class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
            'enabled': True,
            'batch_size': 10,
            'flush_interval': 5,
            'storage_path': 'test_telemetry_data',
            'anonymize': True
        }
        
        # Create a temporary directory for testing
        os.makedirs(self.config['storage_path'], exist_ok=True)
        
        # Initialize the TelemetryCollector with the test configuration
        self.collector = TelemetryCollector(self.config)
    
    def tearDown(self):
        """Clean up after tests."""
        # Shutdown the collector
        self.collector.shutdown()
        
        # Clean up the temporary directory
        import shutil
        if os.path.exists(self.config['storage_path']):
            shutil.rmtree(self.config['storage_path'])
    
    def test_initialization(self):
        """Test that the TelemetryCollector initializes correctly."""
        self.assertEqual(self.collector.enabled, self.config['enabled'])
        self.assertEqual(self.collector.batch_size, self.config['batch_size'])
        self.assertEqual(self.collector.flush_interval, self.config['flush_interval'])
        self.assertEqual(self.collector.storage_path, self.config['storage_path'])
        self.assertEqual(self.collector.anonymize, self.config['anonymize'])
        self.assertTrue(hasattr(self.collector, 'telemetry_queue'))
        self.assertTrue(hasattr(self.collector, 'current_batch'))
        self.assertTrue(hasattr(self.collector, 'last_flush_time'))
    
    def test_track(self):
        """Test tracking a telemetry event."""
        # Track an event
        event_type = "api_request"
        data = {
            "user_id": "test-user",
            "endpoint": "/users",
            "method": "GET",
            "status_code": 200,
            "response_time": 150
        }
        
        self.collector.track(event_type, data)
        
        # Check that the event was added to the queue
        self.assertEqual(self.collector.telemetry_queue.qsize(), 1)
        
        # Track another event
        self.collector.track("api_error", {
            "user_id": "test-user",
            "endpoint": "/resources",
            "method": "POST",
            "status_code": 400,
            "error": "Invalid request"
        })
        
        # Check that the event was added to the queue
        self.assertEqual(self.collector.telemetry_queue.qsize(), 2)
    
    def test_anonymize_event(self):
        """Test anonymizing a telemetry event."""
        # Create an event with sensitive data
        event = {
            "id": "event-123",
            "timestamp": "2025-05-23T10:00:00Z",
            "type": "api_request",
            "data": {
                "user_id": "user-456",
                "email": "user@example.com",
                "ip_address": "192.168.1.1",
                "api_key": "secret-api-key",
                "token": "secret-token",
                "request": {
                    "headers": {
                        "Authorization": "Bearer secret-token",
                        "Cookie": "session=abc123",
                        "X-API-Key": "secret-api-key"
                    }
                }
            }
        }
        
        # Anonymize the event
        anonymized = self.collector._anonymize_event(event)
        
        # Check that sensitive data was anonymized
        self.assertNotEqual(anonymized["data"]["user_id"], "user-456")
        self.assertNotEqual(anonymized["data"]["email"], "user@example.com")
        self.assertNotEqual(anonymized["data"]["ip_address"], "192.168.1.1")
        self.assertEqual(anonymized["data"]["api_key"], "[REDACTED]")
        self.assertEqual(anonymized["data"]["token"], "[REDACTED]")
        self.assertEqual(anonymized["data"]["request"]["headers"]["Authorization"], "[REDACTED]")
        self.assertEqual(anonymized["data"]["request"]["headers"]["Cookie"], "[REDACTED]")
        self.assertEqual(anonymized["data"]["request"]["headers"]["X-API-Key"], "[REDACTED]")
    
    @patch('src.feedback.feedback_telemetry.time.sleep', return_value=None)
    def test_process_queue(self, mock_sleep):
        """Test processing events from the queue."""
        # Add some events to the queue
        self.collector.track("api_request", {"endpoint": "/users", "method": "GET"})
        self.collector.track("api_request", {"endpoint": "/resources", "method": "POST"})
        
        # Process the queue (this happens in a background thread, but we'll call it directly for testing)
        self.collector._process_queue()
        
        # Check that the events were moved from the queue to the current batch
        self.assertEqual(self.collector.telemetry_queue.qsize(), 0)
        self.assertEqual(len(self.collector.current_batch), 2)
    
    def test_flush_batch(self):
        """Test flushing the current batch of events to storage."""
        # Add some events to the current batch
        self.collector.current_batch = [
            {
                "id": "event-1",
                "timestamp": "2025-05-23T10:00:00Z",
                "type": "api_request",
                "data": {"endpoint": "/users", "method": "GET"}
            },
            {
                "id": "event-2",
                "timestamp": "2025-05-23T10:01:00Z",
                "type": "api_request",
                "data": {"endpoint": "/resources", "method": "POST"}
            }
        ]
        
        # Flush the batch
        self.collector._flush_batch()
        
        # Check that the batch was cleared
        self.assertEqual(len(self.collector.current_batch), 0)
        
        # Check that a file was created in the storage directory
        files = os.listdir(self.config['storage_path'])
        self.assertEqual(len(files), 1)
        self.assertTrue(files[0].startswith('telemetry_'))
        self.assertTrue(files[0].endswith('.json'))
        
        # Check the content of the file
        with open(os.path.join(self.config['storage_path'], files[0]), 'r') as f:
            saved_events = json.load(f)
            self.assertEqual(len(saved_events), 2)
            self.assertEqual(saved_events[0]["id"], "event-1")
            self.assertEqual(saved_events[1]["id"], "event-2")
    
    def test_get_stats(self):
        """Test getting statistics about the telemetry collector."""
        # Add some events to the queue and current batch
        self.collector.track("api_request", {"endpoint": "/users", "method": "GET"})
        self.collector.current_batch.append({
            "id": "event-1",
            "timestamp": "2025-05-23T10:00:00Z",
            "type": "api_request",
            "data": {"endpoint": "/resources", "method": "POST"}
        })
        
        # Get stats
        stats = self.collector.get_stats()
        
        # Check the stats
        self.assertTrue(stats["enabled"])
        self.assertEqual(stats["queue_size"], 1)
        self.assertEqual(stats["current_batch_size"], 1)
        self.assertEqual(stats["storage_path"], self.config['storage_path'])


class TestFeedbackManager(unittest.TestCase):
    """Test cases for the FeedbackManager class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
            'storage_path': 'test_feedback_data',
            'notify_email': 'feedback@example.com',
            'auto_categorize': True
        }
        
        # Create a temporary directory for testing
        os.makedirs(self.config['storage_path'], exist_ok=True)
        
        # Initialize the FeedbackManager with the test configuration
        self.manager = FeedbackManager(self.config)
    
    def tearDown(self):
        """Clean up after tests."""
        # Clean up the temporary directory
        import shutil
        if os.path.exists(self.config['storage_path']):
            shutil.rmtree(self.config['storage_path'])
    
    def test_initialization(self):
        """Test that the FeedbackManager initializes correctly."""
        self.assertEqual(self.manager.storage_path, self.config['storage_path'])
        self.assertEqual(self.manager.notify_email, self.config['notify_email'])
        self.assertEqual(self.manager.auto_categorize, self.config['auto_categorize'])
        self.assertIsInstance(self.manager.feedback, dict)
    
    def test_submit_feedback(self):
        """Test submitting feedback."""
        # Submit feedback
        user_id = "test-user"
        feedback_type = "suggestion"
        content = "I think it would be great to add feature X."
        metadata = {"browser": "Chrome", "version": "100.0.0"}
        
        result = self.manager.submit_feedback(user_id, feedback_type, content, metadata)
        
        # Check the result
        self.assertIn("id", result)
        self.assertIn("submitted_at", result)
        self.assertEqual(result["status"], "new")
        
        # Check that the feedback was added to the manager
        feedback_id = result["id"]
        self.assertIn(feedback_id, self.manager.feedback)
        
        # Check that the feedback was saved to a file
        file_path = os.path.join(self.config['storage_path'], f"feedback_{feedback_id}.json")
        self.assertTrue(os.path.exists(file_path))
        
        # Check the content of the file
        with open(file_path, 'r') as f:
            saved_feedback = json.load(f)
            self.assertEqual(saved_feedback["id"], feedback_id)
            self.assertEqual(saved_feedback["user_id"], user_id)
            self.assertEqual(saved_feedback["type"], feedback_type)
            self.assertEqual(saved_feedback["content"], content)
            self.assertEqual(saved_feedback["metadata"], metadata)
            self.assertEqual(saved_feedback["status"], "new")
            
            # Check that the feedback was auto-categorized
            self.assertIn("category", saved_feedback)
    
    def test_categorize_feedback(self):
        """Test automatically categorizing feedback."""
        # Test different types of feedback
        self.assertEqual(self.manager._categorize_feedback("I found a bug in the API.", {}), "bug")
        self.assertEqual(self.manager._categorize_feedback("Please add feature X.", {}), "feature_request")
        self.assertEqual(self.manager._categorize_feedback("How do I use the API?", {}), "question")
        self.assertEqual(self.manager._categorize_feedback("Thank you for the great service!", {}), "praise")
        self.assertEqual(self.manager._categorize_feedback("Just some feedback.", {}), "general")
    
    def test_get_feedback(self):
        """Test getting a feedback item."""
        # Submit feedback
        result = self.manager.submit_feedback("test-user", "suggestion", "Test content")
        feedback_id = result["id"]
        
        # Get the feedback
        feedback = self.manager.get_feedback(feedback_id)
        
        # Check the feedback
        self.assertEqual(feedback["id"], feedback_id)
        self.assertEqual(feedback["user_id"], "test-user")
        self.assertEqual(feedback["type"], "suggestion")
        self.assertEqual(feedback["content"], "Test content")
        
        # Try to get non-existent feedback
        non_existent = self.manager.get_feedback("non-existent-id")
        self.assertIn("error", non_existent)
        self.assertEqual(non_existent["error"]["code"], 404)
    
    def test_list_feedback(self):
        """Test listing feedback items."""
        # Submit some feedback
        self.manager.submit_feedback("user1", "bug", "Bug report 1")
        self.manager.submit_feedback("user2", "feature_request", "Feature request 1")
        self.manager.submit_feedback("user1", "bug", "Bug report 2")
        
        # List all feedback
        all_feedback = self.manager.list_feedback()
        self.assertEqual(all_feedback["count"], 3)
        
        # List feedback with filters
        bug_feedback = self.manager.list_feedback({"type": "bug"})
        self.assertEqual(bug_feedback["count"], 2)
        
        user1_feedback = self.manager.list_feedback({"user_id": "user1"})
        self.assertEqual(user1_feedback["count"], 2)
        
        user2_feature_feedback = self.manager.list_feedback({"user_id": "user2", "type": "feature_request"})
        self.assertEqual(user2_feature_feedback["count"], 1)
    
    def test_update_feedback_status(self):
        """Test updating the status of a feedback item."""
        # Submit feedback
        result = self.manager.submit_feedback("test-user", "bug", "Test bug report")
        feedback_id = result["id"]
        
        # Update the status
        updated = self.manager.update_feedback_status(feedback_id, "in_progress", "Working on it")
        
        # Check the updated feedback
        self.assertEqual(updated["id"], feedback_id)
        self.assertEqual(updated["status"], "in_progress")
        self.assertIn("status_history", updated)
        self.assertEqual(len(updated["status_history"]), 1)
        self.assertEqual(updated["status_history"][0]["status"], "in_progress")
        self.assertEqual(updated["status_history"][0]["comment"], "Working on it")
        
        # Try to update non-existent feedback
        non_existent = self.manager.update_feedback_status("non-existent-id", "resolved")
        self.assertIn("error", non_existent)
        self.assertEqual(non_existent["error"]["code"], 404)


if __name__ == '__main__':
    unittest.main()
