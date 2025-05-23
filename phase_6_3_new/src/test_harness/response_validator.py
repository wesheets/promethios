"""
Response Validator for the Promethios Test Harness.

This module provides functionality for validating API responses against expected schemas and values.
"""

import json
import logging
import jsonschema
from typing import Dict, Any, List, Optional, Union
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResponseValidator:
    """
    Validator for API responses in the Promethios test harness.
    
    The ResponseValidator provides functionality for validating API responses
    against expected schemas and values.
    """
    
    def __init__(self, schema_path: str = None):
        """
        Initialize the ResponseValidator.
        
        Args:
            schema_path: Path to the directory containing schema files.
                         If None, uses the default path.
        """
        self.schema_path = schema_path or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 
            "..", "..", "schemas"
        )
        
        # Cache for loaded schemas
        self._schemas = {}
        
        logger.info(f"ResponseValidator initialized with schema path: {self.schema_path}")
    
    def _load_schema(self, schema_name: str) -> Dict:
        """
        Load a schema from file.
        
        Args:
            schema_name: Name of the schema file.
            
        Returns:
            The loaded schema.
            
        Raises:
            ValueError: If the schema cannot be loaded.
        """
        if schema_name in self._schemas:
            return self._schemas[schema_name]
        
        # If schema_name doesn't end with .json, add it
        if not schema_name.endswith('.json'):
            schema_name = f"{schema_name}.json"
        
        schema_path = os.path.join(self.schema_path, schema_name)
        
        try:
            with open(schema_path, 'r') as f:
                schema = json.load(f)
                self._schemas[schema_name] = schema
                return schema
        except Exception as e:
            logger.error(f"Error loading schema {schema_name}: {e}")
            raise ValueError(f"Error loading schema {schema_name}: {e}")
    
    def validate_schema(self, response: Dict, schema: Union[str, Dict]) -> Dict:
        """
        Validate a response against a schema.
        
        Args:
            response: The response to validate.
            schema: Either a schema name or a schema object.
            
        Returns:
            Validation results.
        """
        # Load schema if a name was provided
        if isinstance(schema, str):
            try:
                schema = self._load_schema(schema)
            except ValueError as e:
                return {
                    'valid': False,
                    'errors': [str(e)]
                }
        
        # Validate against schema
        try:
            jsonschema.validate(instance=response, schema=schema)
            logger.info("Schema validation successful")
            return {
                'valid': True,
                'errors': []
            }
        except jsonschema.exceptions.ValidationError as e:
            logger.warning(f"Schema validation failed: {e}")
            return {
                'valid': False,
                'errors': [str(e)]
            }
    
    def validate_values(self, response: Dict, expected_values: Dict) -> Dict:
        """
        Validate that a response contains expected values.
        
        Args:
            response: The response to validate.
            expected_values: Dictionary of expected values.
            
        Returns:
            Validation results.
        """
        errors = []
        
        for path, expected_value in expected_values.items():
            # Split the path into components
            components = path.split('.')
            
            # Navigate to the target value
            actual_value = response
            for component in components:
                if component.isdigit():  # Array index
                    index = int(component)
                    if not isinstance(actual_value, list) or index >= len(actual_value):
                        errors.append(f"Path {path} not found in response")
                        actual_value = None
                        break
                    actual_value = actual_value[index]
                else:  # Object property
                    if not isinstance(actual_value, dict) or component not in actual_value:
                        errors.append(f"Path {path} not found in response")
                        actual_value = None
                        break
                    actual_value = actual_value[component]
            
            # Compare values if the path was found
            if actual_value is not None:
                if actual_value != expected_value:
                    errors.append(f"Value at path {path} is {actual_value}, expected {expected_value}")
        
        valid = len(errors) == 0
        if valid:
            logger.info("Value validation successful")
        else:
            logger.warning(f"Value validation failed with {len(errors)} errors")
        
        return {
            'valid': valid,
            'errors': errors
        }
    
    def validate_response(self, response: Dict, endpoint: str, expected_values: Dict = None,
                         schema: Union[str, Dict] = None, status_code: int = None) -> Dict:
        """
        Validate a response against expected schema, values, and status code.
        
        Args:
            response: The response to validate.
            endpoint: The API endpoint that was called.
            expected_values: Dictionary of expected values.
            schema: Either a schema name or a schema object.
            status_code: Expected HTTP status code.
            
        Returns:
            Validation results.
        """
        results = {
            'endpoint': endpoint,
            'timestamp': response.get('timestamp'),
            'valid': True,
            'validations': {}
        }
        
        # Validate status code if specified
        if status_code is not None:
            actual_status = response.get('status_code')
            status_valid = actual_status == status_code
            results['validations']['status_code'] = {
                'valid': status_valid,
                'expected': status_code,
                'actual': actual_status,
                'errors': [] if status_valid else [f"Expected status {status_code}, got {actual_status}"]
            }
            results['valid'] &= status_valid
        
        # Validate schema if specified
        if schema is not None:
            schema_result = self.validate_schema(response.get('body', {}), schema)
            results['validations']['schema'] = schema_result
            results['valid'] &= schema_result['valid']
        
        # Validate expected values if specified
        if expected_values is not None:
            values_result = self.validate_values(response.get('body', {}), expected_values)
            results['validations']['values'] = values_result
            results['valid'] &= values_result['valid']
        
        # Log validation result
        if results['valid']:
            logger.info(f"Response validation successful for {endpoint}")
        else:
            logger.warning(f"Response validation failed for {endpoint}")
        
        return results
    
    def validate_governance_compliance(self, response: Dict, governance_requirements: Dict) -> Dict:
        """
        Validate that a response complies with governance requirements.
        
        Args:
            response: The response to validate.
            governance_requirements: Dictionary of governance requirements.
            
        Returns:
            Validation results.
        """
        results = {
            'valid': True,
            'validations': {}
        }
        
        # Check for required governance headers
        if 'headers' in governance_requirements:
            required_headers = governance_requirements['headers']
            actual_headers = response.get('headers', {})
            
            missing_headers = []
            for header in required_headers:
                if header not in actual_headers:
                    missing_headers.append(header)
            
            headers_valid = len(missing_headers) == 0
            results['validations']['headers'] = {
                'valid': headers_valid,
                'missing': missing_headers,
                'errors': [] if headers_valid else [f"Missing required governance headers: {', '.join(missing_headers)}"]
            }
            results['valid'] &= headers_valid
        
        # Check for required governance fields in body
        if 'fields' in governance_requirements:
            required_fields = governance_requirements['fields']
            body = response.get('body', {})
            
            missing_fields = []
            for field_path in required_fields:
                # Split the path into components
                components = field_path.split('.')
                
                # Navigate to the target field
                value = body
                field_found = True
                for component in components:
                    if component.isdigit():  # Array index
                        index = int(component)
                        if not isinstance(value, list) or index >= len(value):
                            missing_fields.append(field_path)
                            field_found = False
                            break
                        value = value[index]
                    else:  # Object property
                        if not isinstance(value, dict) or component not in value:
                            missing_fields.append(field_path)
                            field_found = False
                            break
                        value = value[component]
            
            fields_valid = len(missing_fields) == 0
            results['validations']['fields'] = {
                'valid': fields_valid,
                'missing': missing_fields,
                'errors': [] if fields_valid else [f"Missing required governance fields: {', '.join(missing_fields)}"]
            }
            results['valid'] &= fields_valid
        
        # Check for governance metrics
        if 'metrics' in governance_requirements:
            required_metrics = governance_requirements['metrics']
            body = response.get('body', {})
            
            metrics_errors = []
            for metric_name, threshold in required_metrics.items():
                # Extract the metric value
                metric_path = f"governance_metrics.{metric_name}"
                components = metric_path.split('.')
                
                value = body
                metric_found = True
                for component in components:
                    if not isinstance(value, dict) or component not in value:
                        metrics_errors.append(f"Metric {metric_name} not found")
                        metric_found = False
                        break
                    value = value[component]
                
                # Check threshold if metric was found
                if metric_found:
                    if isinstance(threshold, dict):
                        # Complex threshold with min/max
                        if 'min' in threshold and value < threshold['min']:
                            metrics_errors.append(f"Metric {metric_name} value {value} is below minimum {threshold['min']}")
                        if 'max' in threshold and value > threshold['max']:
                            metrics_errors.append(f"Metric {metric_name} value {value} is above maximum {threshold['max']}")
                    else:
                        # Simple threshold (minimum value)
                        if value < threshold:
                            metrics_errors.append(f"Metric {metric_name} value {value} is below threshold {threshold}")
            
            metrics_valid = len(metrics_errors) == 0
            results['validations']['metrics'] = {
                'valid': metrics_valid,
                'errors': metrics_errors
            }
            results['valid'] &= metrics_valid
        
        # Log validation result
        if results['valid']:
            logger.info("Governance compliance validation successful")
        else:
            logger.warning("Governance compliance validation failed")
        
        return results


# Example usage
if __name__ == "__main__":
    validator = ResponseValidator()
    
    # Example response
    response = {
        'status_code': 200,
        'headers': {
            'Content-Type': 'application/json',
            'X-Governance-Trust': '0.95'
        },
        'body': {
            'id': 'OR-123456',
            'status': 'approved',
            'timestamp': '2025-05-21T12:34:56Z',
            'governance_metrics': {
                'trust_score': 0.95,
                'policy_enforcements': 3
            }
        },
        'timestamp': '2025-05-21T12:34:56Z'
    }
    
    # Validate against schema
    schema_result = validator.validate_schema(response['body'], 'override_response.schema.v1')
    print(f"Schema validation: {schema_result['valid']}")
    
    # Validate expected values
    values_result = validator.validate_values(response['body'], {
        'status': 'approved',
        'governance_metrics.trust_score': 0.95
    })
    print(f"Values validation: {values_result['valid']}")
    
    # Validate governance compliance
    governance_result = validator.validate_governance_compliance(response, {
        'headers': ['X-Governance-Trust'],
        'fields': ['governance_metrics.trust_score'],
        'metrics': {
            'trust_score': {'min': 0.9}
        }
    })
    print(f"Governance validation: {governance_result['valid']}")
