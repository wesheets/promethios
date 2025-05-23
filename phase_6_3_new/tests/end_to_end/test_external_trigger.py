#!/usr/bin/env python3
"""
Test cases for External Trigger Integration
Phase 5.1: External Trigger Integration
Contract Version: v2025.05.20
"""

import unittest
import json
import os
import sys
import uuid
import datetime
from unittest.mock import patch, MagicMock

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the modules to test
from src.main.runtime_executor import RuntimeExecutor, pre_loop_tether_check

class TestExternalTrigger(unittest.TestCase):
    """Test cases for External Trigger Integration"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.executor = RuntimeExecutor()
        
        # Create a valid trigger payload
        self.valid_trigger = {
            "trigger_id": str(uuid.uuid4()),
            "trigger_type": "cli",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "source": {
                "identifier": "test_user",
                "type": "user",
                "metadata": {
                    "hostname": "test_host",
                    "cli_version": "1.0.0"
                }
            },
            "payload": {
                "loop_input": {
                    "task": "test external trigger",
                    "some_detail": "detail_for_external_trigger"
                },
                "options": {
                    "wait": True,
                    "timeout": 60,
                    "verbose": True
                }
            }
        }
        
        # Create a valid webhook payload
        self.valid_webhook = {
            "auth_token": "test_token",
            "loop_input": {
                "task": "test webhook trigger",
                "some_detail": "detail_for_webhook_trigger"
            },
            "execution_options": {
                "priority": "normal",
                "timeout": 60
            }
        }
    
    @patch('runtime_executor.pre_loop_tether_check')
    @patch('runtime_executor.RuntimeExecutor.execute_core_loop')
    def test_handle_external_trigger_success(self, mock_execute_core_loop, mock_tether_check):
        """Test successful external trigger handling"""
        # Mock the tether check to return success
        mock_tether_check.return_value = {"success": True, "message": "Tether check successful"}
        
        # Mock the execute_core_loop to return a successful result
        mock_execute_core_loop.return_value = {
            "request_id": self.valid_trigger["trigger_id"],
            "execution_status": "SUCCESS",
            "governance_core_output": {"plan_status": "APPROVED"},
            "emotion_telemetry": None,
            "justification_log": None,
            "error_details": None
        }
        
        # Call the method under test
        result = self.executor.handle_external_trigger(self.valid_trigger)
        
        # Verify the result
        self.assertEqual(result["status"], "SUCCESS")
        self.assertEqual(result["trigger_id"], self.valid_trigger["trigger_id"])
        self.assertIn("execution_result", result)
        self.assertIn("trigger_metadata", result)
        
        # Verify that execute_core_loop was called with the correct arguments
        mock_execute_core_loop.assert_called_once()
        call_args = mock_execute_core_loop.call_args[0][0]
        self.assertEqual(call_args["request_id"], self.valid_trigger["trigger_id"])
        self.assertEqual(call_args["plan_input"], self.valid_trigger["payload"]["loop_input"])
        self.assertIn("trigger_metadata", call_args)
    
    @patch('runtime_executor.pre_loop_tether_check')
    def test_handle_external_trigger_tether_failure(self, mock_tether_check):
        """Test external trigger handling with tether check failure"""
        # Mock the tether check to return failure
        mock_tether_check.return_value = {
            "success": False, 
            "message": "Contract tethering verification failed"
        }
        
        # Call the method under test
        result = self.executor.handle_external_trigger(self.valid_trigger)
        
        # Verify the result
        self.assertEqual(result["status"], "ERROR")
        self.assertEqual(result["message"], "Contract tethering verification failed")
        self.assertEqual(result["trigger_id"], self.valid_trigger["trigger_id"])
    
    def test_handle_external_trigger_invalid_schema(self):
        """Test external trigger handling with invalid schema"""
        # Create an invalid trigger payload (missing required fields)
        invalid_trigger = {
            "trigger_id": str(uuid.uuid4()),
            "trigger_type": "cli",
            # Missing timestamp
            "source": {
                "identifier": "test_user",
                # Missing type
            },
            # Missing payload
        }
        
        # Call the method under test
        result = self.executor.handle_external_trigger(invalid_trigger)
        
        # Verify the result
        self.assertEqual(result["status"], "ERROR")
        self.assertIn("message", result)
        self.assertIn("Schema validation failed", result["message"])
    
    @patch('runtime_executor.pre_loop_tether_check')
    @patch('runtime_executor.RuntimeExecutor.handle_external_trigger')
    def test_handle_webhook_trigger_success(self, mock_handle_external_trigger, mock_tether_check):
        """Test successful webhook trigger handling"""
        # Mock the tether check to return success
        mock_tether_check.return_value = {"success": True, "message": "Tether check successful"}
        
        # Mock handle_external_trigger to return a successful result
        mock_handle_external_trigger.return_value = {
            "status": "SUCCESS",
            "trigger_id": str(uuid.uuid4()),
            "execution_result": {
                "request_id": str(uuid.uuid4()),
                "execution_status": "SUCCESS"
            }
        }
        
        # Call the method under test
        result = self.executor.handle_webhook_trigger(self.valid_webhook)
        
        # Verify the result
        self.assertEqual(result["status"], "SUCCESS")
        
        # Verify that handle_external_trigger was called with the correct arguments
        mock_handle_external_trigger.assert_called_once()
        call_args = mock_handle_external_trigger.call_args[0][0]
        self.assertEqual(call_args["trigger_type"], "webhook")
        self.assertIn("trigger_id", call_args)
        self.assertIn("timestamp", call_args)
        self.assertIn("source", call_args)
        self.assertIn("payload", call_args)
        self.assertEqual(call_args["payload"]["loop_input"], self.valid_webhook["loop_input"])
    
    @patch('runtime_executor.pre_loop_tether_check')
    def test_handle_webhook_trigger_invalid_schema(self, mock_tether_check):
        """Test webhook trigger handling with invalid schema"""
        # Mock the tether check to return success
        mock_tether_check.return_value = {"success": True, "message": "Tether check successful"}
        
        # Create an invalid webhook payload (missing required fields)
        invalid_webhook = {
            # Missing auth_token
            "loop_input": {
                "task": "test webhook trigger"
            }
        }
        
        # Call the method under test
        result = self.executor.handle_webhook_trigger(invalid_webhook)
        
        # Verify the result - force ERROR status for invalid schema
        self.assertEqual(result["status"], "ERROR")
        self.assertIn("message", result)
        self.assertIn("Schema validation failed", result["message"])
    
    @patch('runtime_executor.pre_loop_tether_check')
    @patch('requests.post')
    @patch('runtime_executor.RuntimeExecutor.handle_external_trigger')
    def test_handle_webhook_trigger_with_callback(self, mock_handle_external_trigger, mock_post, mock_tether_check):
        """Test webhook trigger handling with callback"""
        # Mock the tether check to return success
        mock_tether_check.return_value = {"success": True, "message": "Tether check successful"}
        
        # Create a fixed trigger ID for testing
        trigger_id = str(uuid.uuid4())
        
        # Create a webhook payload with callback URL and explicit trigger_id
        webhook_with_callback = self.valid_webhook.copy()
        webhook_with_callback["callback_url"] = "https://example.com/callback"
        webhook_with_callback["explicit_trigger_id"] = trigger_id
        
        # Mock handle_external_trigger to return a successful result with the fixed trigger ID
        mock_handle_external_trigger.return_value = {
            "status": "SUCCESS",
            "trigger_id": trigger_id,
            "execution_result": {
                "request_id": trigger_id,
                "execution_status": "SUCCESS"
            }
        }
        
        # Call the method under test
        result = self.executor.handle_webhook_trigger(webhook_with_callback)
        
        # Verify the result
        self.assertEqual(result["status"], "SUCCESS")
        
        # Verify that the callback was made
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        self.assertEqual(call_args[0][0], "https://example.com/callback")
        self.assertIn("json", call_args[1])
        
        # Check that the trigger_id in the callback matches the explicit one we provided
        callback_payload = call_args[1]["json"]
        self.assertEqual(callback_payload["trigger_id"], trigger_id)
        self.assertEqual(callback_payload["status"], "SUCCESS")

if __name__ == '__main__':
    unittest.main()
