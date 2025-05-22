"""
Test file for the Response Validator module.

This module contains unit tests for the ResponseValidator class.
"""

import unittest
import os
import json
import tempfile
import shutil
from src.test_harness.response_validator import ResponseValidator

class TestResponseValidator(unittest.TestCase):
    """Test cases for the ResponseValidator class."""
    
    def setUp(self):
        """Set up test environment before each test."""
        # Create a temporary directory for test schemas
        self.temp_dir = tempfile.mkdtemp()
        
        # Create a test schema file
        self.test_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "required": ["id", "status"],
            "properties": {
                "id": {"type": "string"},
                "status": {"type": "string", "enum": ["success", "failure", "pending"]},
                "data": {"type": "object"}
            }
        }
        
        with open(os.path.join(self.temp_dir, "test_schema.json"), "w") as f:
            json.dump(self.test_schema, f)
        
        # Initialize the validator with the temp directory
        self.validator = ResponseValidator(schema_path=self.temp_dir)
        
        # Sample response for testing
        self.test_response = {
            "id": "test-123",
            "status": "success",
            "data": {
                "value": 42
            }
        }
    
    def tearDown(self):
        """Clean up after each test."""
        # Remove the temporary directory
        shutil.rmtree(self.temp_dir)
    
    def test_load_schema(self):
        """Test loading a schema from file."""
        # Load the test schema
        schema = self.validator._load_schema("test_schema.json")
        
        # Verify the schema was loaded correctly
        self.assertEqual(schema["type"], "object")
        self.assertIn("id", schema["required"])
        self.assertIn("status", schema["required"])
    
    def test_load_nonexistent_schema(self):
        """Test loading a schema that doesn't exist."""
        with self.assertRaises(ValueError):
            self.validator._load_schema("nonexistent_schema.json")
    
    def test_validate_schema_valid(self):
        """Test validating a response against a schema (valid case)."""
        # Validate the test response against the test schema
        result = self.validator.validate_schema(self.test_response, "test_schema.json")
        
        # Verify the validation was successful
        self.assertTrue(result["valid"])
        self.assertEqual(len(result["errors"]), 0)
    
    def test_validate_schema_invalid(self):
        """Test validating a response against a schema (invalid case)."""
        # Create an invalid response (missing required field)
        invalid_response = {
            "id": "test-123",
            # Missing "status" field
            "data": {
                "value": 42
            }
        }
        
        # Validate the invalid response
        result = self.validator.validate_schema(invalid_response, "test_schema.json")
        
        # Verify the validation failed
        self.assertFalse(result["valid"])
        self.assertGreater(len(result["errors"]), 0)
    
    def test_validate_values_valid(self):
        """Test validating expected values in a response (valid case)."""
        # Define expected values
        expected_values = {
            "id": "test-123",
            "status": "success",
            "data.value": 42
        }
        
        # Validate the values
        result = self.validator.validate_values(self.test_response, expected_values)
        
        # Verify the validation was successful
        self.assertTrue(result["valid"])
        self.assertEqual(len(result["errors"]), 0)
    
    def test_validate_values_invalid(self):
        """Test validating expected values in a response (invalid case)."""
        # Define expected values with a mismatch
        expected_values = {
            "id": "test-123",
            "status": "success",
            "data.value": 43  # Actual value is 42
        }
        
        # Validate the values
        result = self.validator.validate_values(self.test_response, expected_values)
        
        # Verify the validation failed
        self.assertFalse(result["valid"])
        self.assertGreater(len(result["errors"]), 0)
    
    def test_validate_values_missing_path(self):
        """Test validating a value at a path that doesn't exist."""
        # Define expected values with a nonexistent path
        expected_values = {
            "data.nonexistent": "value"
        }
        
        # Validate the values
        result = self.validator.validate_values(self.test_response, expected_values)
        
        # Verify the validation failed
        self.assertFalse(result["valid"])
        self.assertGreater(len(result["errors"]), 0)
    
    def test_validate_response_all_valid(self):
        """Test validating a response with all validations passing."""
        # Create a response object with status code and body
        response = {
            "status_code": 200,
            "body": self.test_response,
            "timestamp": "2025-05-22T00:00:00Z"
        }
        
        # Validate the response
        result = self.validator.validate_response(
            response=response,
            endpoint="/api/test",
            expected_values={"id": "test-123", "status": "success"},
            schema="test_schema.json",
            status_code=200
        )
        
        # Verify all validations passed
        self.assertTrue(result["valid"])
        self.assertTrue(result["validations"]["status_code"]["valid"])
        self.assertTrue(result["validations"]["schema"]["valid"])
        self.assertTrue(result["validations"]["values"]["valid"])
    
    def test_validate_response_mixed_results(self):
        """Test validating a response with some validations failing."""
        # Create a response object with an unexpected status code
        response = {
            "status_code": 400,  # Expected 200
            "body": self.test_response,
            "timestamp": "2025-05-22T00:00:00Z"
        }
        
        # Validate the response
        result = self.validator.validate_response(
            response=response,
            endpoint="/api/test",
            expected_values={"id": "test-123", "status": "success"},
            schema="test_schema.json",
            status_code=200
        )
        
        # Verify overall validation failed
        self.assertFalse(result["valid"])
        
        # Verify individual validation results
        self.assertFalse(result["validations"]["status_code"]["valid"])
        self.assertTrue(result["validations"]["schema"]["valid"])
        self.assertTrue(result["validations"]["values"]["valid"])
    
    def test_validate_governance_compliance_valid(self):
        """Test validating governance compliance (valid case)."""
        # Create a response with governance headers and metrics
        response = {
            "headers": {
                "X-Governance-Trust": "0.95",
                "X-Governance-Policy": "standard"
            },
            "body": {
                "governance_metrics": {
                    "trust_score": 0.95,
                    "policy_enforcements": 3
                }
            }
        }
        
        # Define governance requirements
        governance_requirements = {
            "headers": ["X-Governance-Trust", "X-Governance-Policy"],
            "fields": ["governance_metrics.trust_score", "governance_metrics.policy_enforcements"],
            "metrics": {
                "trust_score": {"min": 0.9}
            }
        }
        
        # Validate governance compliance
        result = self.validator.validate_governance_compliance(response, governance_requirements)
        
        # Verify validation passed
        self.assertTrue(result["valid"])
        self.assertTrue(result["validations"]["headers"]["valid"])
        self.assertTrue(result["validations"]["fields"]["valid"])
        self.assertTrue(result["validations"]["metrics"]["valid"])
    
    def test_validate_governance_compliance_invalid(self):
        """Test validating governance compliance (invalid case)."""
        # Create a response with missing headers and low metrics
        response = {
            "headers": {
                # Missing X-Governance-Policy
                "X-Governance-Trust": "0.85"  # Below threshold
            },
            "body": {
                "governance_metrics": {
                    "trust_score": 0.85,  # Below threshold
                    "policy_enforcements": 3
                }
            }
        }
        
        # Define governance requirements
        governance_requirements = {
            "headers": ["X-Governance-Trust", "X-Governance-Policy"],
            "fields": ["governance_metrics.trust_score"],
            "metrics": {
                "trust_score": {"min": 0.9}
            }
        }
        
        # Validate governance compliance
        result = self.validator.validate_governance_compliance(response, governance_requirements)
        
        # Verify validation failed
        self.assertFalse(result["valid"])
        self.assertFalse(result["validations"]["headers"]["valid"])
        self.assertTrue(result["validations"]["fields"]["valid"])
        self.assertFalse(result["validations"]["metrics"]["valid"])


if __name__ == "__main__":
    unittest.main()
