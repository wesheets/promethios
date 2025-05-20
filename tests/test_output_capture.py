"""
Unit tests for Output Capture Mechanism implementation.

This module tests Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.20
Phase ID: 5.3
Clauses: 5.3, 11.0
"""

import unittest
import json
import sys
import os
from datetime import datetime
from unittest.mock import patch

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from output_capture import OutputCapture


class TestOutputCapture(unittest.TestCase):
    """Test cases for OutputCapture implementation."""
    
    def setUp(self):
        """Set up test environment."""
        # Create an OutputCapture instance
        self.output_capture = OutputCapture()
    
    def test_capture_output_string(self):
        """Test capturing a string output."""
        # Capture output
        output_obj = self.output_capture.capture_output(
            "Test output",
            "log",
            "test_source"
        )
        
        # Verify output object structure
        self.assertIn("id", output_obj)
        self.assertIn("timestamp", output_obj)
        self.assertIn("output_type", output_obj)
        self.assertIn("source", output_obj)
        self.assertIn("output", output_obj)
        self.assertIn("metadata", output_obj)
        self.assertIn("contract_version", output_obj)
        self.assertIn("phase_id", output_obj)
        
        # Verify output details
        self.assertEqual(output_obj["output_type"], "log")
        self.assertEqual(output_obj["source"], "test_source")
        self.assertEqual(output_obj["output"], "Test output")
        self.assertEqual(output_obj["contract_version"], "v2025.05.20")
        self.assertEqual(output_obj["phase_id"], "5.3")
    
    def test_capture_output_dict(self):
        """Test capturing a dictionary output."""
        # Sample dictionary output
        dict_output = {"key": "value", "number": 42}
        
        # Capture output
        output_obj = self.output_capture.capture_output(
            dict_output,
            "result",
            "test_source"
        )
        
        # Verify output
        self.assertEqual(output_obj["output_type"], "result")
        self.assertEqual(output_obj["output"], dict_output)
    
    def test_capture_output_with_metadata(self):
        """Test capturing output with metadata."""
        # Sample metadata
        metadata = {"execution_id": "test-execution", "timestamp": datetime.utcnow().isoformat()}
        
        # Capture output
        output_obj = self.output_capture.capture_output(
            "Test output",
            "log",
            "test_source",
            metadata
        )
        
        # Verify metadata
        self.assertEqual(output_obj["metadata"], metadata)
    
    def test_capture_output_error(self):
        """Test capturing an error output."""
        # Sample error
        error = ValueError("Test error")
        
        # Capture output
        output_obj = self.output_capture.capture_output(
            error,
            "error",
            "test_source"
        )
        
        # Verify error output
        self.assertEqual(output_obj["output_type"], "error")
        self.assertEqual(output_obj["output"]["error_type"], "ValueError")
        self.assertEqual(output_obj["output"]["error_message"], "Test error")
    
    def test_normalize_output_log(self):
        """Test normalizing a log output."""
        # Normalize log output
        normalized = self.output_capture._normalize_output(
            "Test log",
            "log"
        )
        
        # Verify normalization
        self.assertEqual(normalized, "Test log")
        
        # Normalize non-string log
        normalized = self.output_capture._normalize_output(
            123,
            "log"
        )
        
        # Verify conversion to string
        self.assertEqual(normalized, "123")
    
    def test_normalize_output_result(self):
        """Test normalizing a result output."""
        # Sample result
        result = {"key": "value", "number": 42}
        
        # Normalize result output
        normalized = self.output_capture._normalize_output(
            result,
            "result"
        )
        
        # Verify normalization
        self.assertEqual(normalized, result)
        
        # Test with non-serializable object
        class NonSerializable:
            def __str__(self):
                return "NonSerializable object"
        
        non_serializable = NonSerializable()
        
        # Normalize non-serializable result
        normalized = self.output_capture._normalize_output(
            non_serializable,
            "result"
        )
        
        # Verify conversion to string
        self.assertEqual(normalized, "NonSerializable object")
    
    def test_normalize_output_error(self):
        """Test normalizing an error output."""
        # Sample error
        error = ValueError("Test error")
        
        # Normalize error output
        normalized = self.output_capture._normalize_output(
            error,
            "error"
        )
        
        # Verify normalization
        self.assertEqual(normalized["error_type"], "ValueError")
        self.assertEqual(normalized["error_message"], "Test error")
        
        # Test with string error
        normalized = self.output_capture._normalize_output(
            "Error message",
            "error"
        )
        
        # Verify normalization
        self.assertEqual(normalized["error_type"], "unknown")
        self.assertEqual(normalized["error_message"], "Error message")
    
    def test_get_outputs(self):
        """Test getting all captured outputs."""
        # Capture multiple outputs
        output1 = self.output_capture.capture_output(
            "Test log",
            "log",
            "source1"
        )
        output2 = self.output_capture.capture_output(
            {"key": "value"},
            "result",
            "source2"
        )
        output3 = self.output_capture.capture_output(
            ValueError("Test error"),
            "error",
            "source1"
        )
        
        # Get all outputs
        all_outputs = self.output_capture.get_outputs()
        
        # Verify all outputs
        self.assertEqual(len(all_outputs), 3)
        self.assertIn(output1, all_outputs)
        self.assertIn(output2, all_outputs)
        self.assertIn(output3, all_outputs)
    
    def test_get_outputs_filtered_by_type(self):
        """Test getting outputs filtered by type."""
        # Capture multiple outputs
        output1 = self.output_capture.capture_output(
            "Test log",
            "log",
            "source1"
        )
        output2 = self.output_capture.capture_output(
            {"key": "value"},
            "result",
            "source2"
        )
        output3 = self.output_capture.capture_output(
            "Another log",
            "log",
            "source3"
        )
        
        # Get outputs filtered by type
        log_outputs = self.output_capture.get_outputs(output_type="log")
        
        # Verify filtered outputs
        self.assertEqual(len(log_outputs), 2)
        self.assertIn(output1, log_outputs)
        self.assertIn(output3, log_outputs)
    
    def test_get_outputs_filtered_by_source(self):
        """Test getting outputs filtered by source."""
        # Capture multiple outputs
        output1 = self.output_capture.capture_output(
            "Test log",
            "log",
            "source1"
        )
        output2 = self.output_capture.capture_output(
            {"key": "value"},
            "result",
            "source2"
        )
        output3 = self.output_capture.capture_output(
            ValueError("Test error"),
            "error",
            "source1"
        )
        
        # Get outputs filtered by source
        source1_outputs = self.output_capture.get_outputs(source="source1")
        
        # Verify filtered outputs
        self.assertEqual(len(source1_outputs), 2)
        self.assertIn(output1, source1_outputs)
        self.assertIn(output3, source1_outputs)
    
    def test_get_outputs_filtered_by_type_and_source(self):
        """Test getting outputs filtered by both type and source."""
        # Capture multiple outputs
        output1 = self.output_capture.capture_output(
            "Test log",
            "log",
            "source1"
        )
        output2 = self.output_capture.capture_output(
            {"key": "value"},
            "result",
            "source1"
        )
        output3 = self.output_capture.capture_output(
            "Another log",
            "log",
            "source2"
        )
        
        # Get outputs filtered by type and source
        filtered_outputs = self.output_capture.get_outputs(
            output_type="log",
            source="source1"
        )
        
        # Verify filtered outputs
        self.assertEqual(len(filtered_outputs), 1)
        self.assertIn(output1, filtered_outputs)
    
    def test_clear_outputs(self):
        """Test clearing all captured outputs."""
        # Capture outputs
        self.output_capture.capture_output(
            "Test log",
            "log",
            "source1"
        )
        self.output_capture.capture_output(
            {"key": "value"},
            "result",
            "source2"
        )
        
        # Verify outputs were captured
        self.assertEqual(len(self.output_capture.get_outputs()), 2)
        
        # Clear outputs
        self.output_capture.clear_outputs()
        
        # Verify outputs were cleared
        self.assertEqual(len(self.output_capture.get_outputs()), 0)
    
    def test_get_output_by_id(self):
        """Test getting a captured output by ID."""
        # Capture output
        output = self.output_capture.capture_output(
            "Test log",
            "log",
            "source1"
        )
        output_id = output["id"]
        
        # Get output by ID
        retrieved_output = self.output_capture.get_output_by_id(output_id)
        
        # Verify retrieved output
        self.assertEqual(retrieved_output, output)
        
        # Test with non-existent ID
        non_existent = self.output_capture.get_output_by_id("non-existent-id")
        self.assertIsNone(non_existent)


if __name__ == "__main__":
    unittest.main()
