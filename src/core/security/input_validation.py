"""
Input validation framework for Promethios.

This module provides a centralized input validation framework to ensure all data
entering the system is properly validated and sanitized. It implements defense-in-depth
strategies to prevent injection attacks and other security vulnerabilities.
"""

import re
import json
import logging
from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class ValidationSeverity(Enum):
    """Enumeration of validation issue severities."""
    INFO = 0
    WARNING = 1
    ERROR = 2
    CRITICAL = 3

class ValidationResult:
    """Result of a validation operation."""
    
    def __init__(self, is_valid: bool = True, errors: List[Dict[str, Any]] = None):
        """
        Initialize a validation result.
        
        Args:
            is_valid: Whether the validation passed
            errors: List of validation errors if any
        """
        self.is_valid = is_valid
        self.errors = errors or []
    
    def add_error(self, message: str, field: str = None, severity: ValidationSeverity = ValidationSeverity.ERROR):
        """
        Add an error to the validation result.
        
        Args:
            message: Error message
            field: Field that failed validation
            severity: Severity of the validation issue
        """
        self.errors.append({
            "message": message,
            "field": field,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Any error or critical severity makes the validation invalid
        if severity in [ValidationSeverity.ERROR, ValidationSeverity.CRITICAL]:
            self.is_valid = False
    
    def merge(self, other_result: 'ValidationResult'):
        """
        Merge another validation result into this one.
        
        Args:
            other_result: Another ValidationResult to merge
        """
        if not other_result.is_valid:
            self.is_valid = False
        
        self.errors.extend(other_result.errors)
    
    def __bool__(self):
        """Allow using the validation result in boolean context."""
        return self.is_valid

class InputValidator:
    """
    Core input validation class that provides methods to validate different types of input.
    Implements defense-in-depth strategies with multiple validation layers.
    """
    
    # Common regex patterns for validation
    PATTERNS = {
        "email": r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        "uuid": r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        "alphanumeric": r'^[a-zA-Z0-9]+$',
        "numeric": r'^[0-9]+$',
        "date_iso": r'^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
        "datetime_iso": r'^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})?$',
        "extension_point_id": r'^[a-z][a-z0-9_\.]{2,63}$',
        "implementation_id": r'^[a-z][a-z0-9_\.]{2,63}$',
        "module_id": r'^[a-z][a-z0-9_\.]{2,63}$',
        "version": r'^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9\.]+)?$',
    }
    
    # Maximum sizes for different input types (in bytes/chars)
    MAX_SIZES = {
        "string": 1024,         # 1KB for general strings
        "large_string": 10240,  # 10KB for larger text fields
        "name": 128,            # Names should be reasonably short
        "id": 64,               # IDs should be compact
        "description": 2048,    # Descriptions can be longer
        "json": 102400,         # 100KB for JSON payloads
        "metadata": 5120,       # 5KB for metadata
    }
    
    @staticmethod
    def validate_string(value: str, 
                        field_name: str = None, 
                        min_length: int = 1, 
                        max_length: int = None, 
                        pattern: str = None,
                        allow_none: bool = False) -> ValidationResult:
        """
        Validate a string value.
        
        Args:
            value: String to validate
            field_name: Name of the field being validated
            min_length: Minimum allowed length
            max_length: Maximum allowed length
            pattern: Regex pattern to match
            allow_none: Whether None is an acceptable value
            
        Returns:
            ValidationResult indicating if validation passed
        """
        result = ValidationResult()
        
        # Check for None if not allowed
        if value is None:
            if allow_none:
                return result
            else:
                result.add_error(f"Field '{field_name}' cannot be None", field_name)
                return result
        
        # Type checking
        if not isinstance(value, str):
            result.add_error(
                f"Field '{field_name}' must be a string, got {type(value).__name__}", 
                field_name, 
                ValidationSeverity.ERROR
            )
            return result
        
        # Length validation
        if min_length is not None and len(value) < min_length:
            result.add_error(
                f"Field '{field_name}' must be at least {min_length} characters", 
                field_name
            )
        
        if max_length is not None and len(value) > max_length:
            result.add_error(
                f"Field '{field_name}' exceeds maximum length of {max_length} characters", 
                field_name
            )
        
        # Pattern validation
        if pattern is not None:
            if not re.match(pattern, value):
                result.add_error(
                    f"Field '{field_name}' does not match required pattern", 
                    field_name
                )
        
        return result
    
    @staticmethod
    def validate_number(value: Union[int, float], 
                       field_name: str = None, 
                       min_value: Union[int, float] = None, 
                       max_value: Union[int, float] = None,
                       allow_none: bool = False) -> ValidationResult:
        """
        Validate a numeric value.
        
        Args:
            value: Number to validate
            field_name: Name of the field being validated
            min_value: Minimum allowed value
            max_value: Maximum allowed value
            allow_none: Whether None is an acceptable value
            
        Returns:
            ValidationResult indicating if validation passed
        """
        result = ValidationResult()
        
        # Check for None if not allowed
        if value is None:
            if allow_none:
                return result
            else:
                result.add_error(f"Field '{field_name}' cannot be None", field_name)
                return result
        
        # Type checking
        if not isinstance(value, (int, float)):
            result.add_error(
                f"Field '{field_name}' must be a number, got {type(value).__name__}", 
                field_name, 
                ValidationSeverity.ERROR
            )
            return result
        
        # Range validation
        if min_value is not None and value < min_value:
            result.add_error(
                f"Field '{field_name}' must be at least {min_value}", 
                field_name
            )
        
        if max_value is not None and value > max_value:
            result.add_error(
                f"Field '{field_name}' exceeds maximum value of {max_value}", 
                field_name
            )
        
        return result
    
    @staticmethod
    def validate_boolean(value: bool, 
                        field_name: str = None,
                        allow_none: bool = False) -> ValidationResult:
        """
        Validate a boolean value.
        
        Args:
            value: Boolean to validate
            field_name: Name of the field being validated
            allow_none: Whether None is an acceptable value
            
        Returns:
            ValidationResult indicating if validation passed
        """
        result = ValidationResult()
        
        # Check for None if not allowed
        if value is None:
            if allow_none:
                return result
            else:
                result.add_error(f"Field '{field_name}' cannot be None", field_name)
                return result
        
        # Type checking
        if not isinstance(value, bool):
            result.add_error(
                f"Field '{field_name}' must be a boolean, got {type(value).__name__}", 
                field_name, 
                ValidationSeverity.ERROR
            )
        
        return result
    
    @staticmethod
    def validate_list(value: List[Any], 
                     field_name: str = None, 
                     min_length: int = 0, 
                     max_length: int = None,
                     item_validator: Callable[[Any, str], ValidationResult] = None,
                     allow_none: bool = False) -> ValidationResult:
        """
        Validate a list value.
        
        Args:
            value: List to validate
            field_name: Name of the field being validated
            min_length: Minimum allowed length
            max_length: Maximum allowed length
            item_validator: Function to validate each item in the list
            allow_none: Whether None is an acceptable value
            
        Returns:
            ValidationResult indicating if validation passed
        """
        result = ValidationResult()
        
        # Check for None if not allowed
        if value is None:
            if allow_none:
                return result
            else:
                result.add_error(f"Field '{field_name}' cannot be None", field_name)
                return result
        
        # Type checking
        if not isinstance(value, list):
            result.add_error(
                f"Field '{field_name}' must be a list, got {type(value).__name__}", 
                field_name, 
                ValidationSeverity.ERROR
            )
            return result
        
        # Length validation
        if min_length is not None and len(value) < min_length:
            result.add_error(
                f"Field '{field_name}' must contain at least {min_length} items", 
                field_name
            )
        
        if max_length is not None and len(value) > max_length:
            result.add_error(
                f"Field '{field_name}' exceeds maximum length of {max_length} items", 
                field_name
            )
        
        # Item validation
        if item_validator is not None:
            for i, item in enumerate(value):
                item_result = item_validator(item, f"{field_name}[{i}]")
                result.merge(item_result)
        
        return result
    
    @staticmethod
    def validate_dict(value: Dict[str, Any], 
                     field_name: str = None, 
                     required_keys: List[str] = None,
                     optional_keys: List[str] = None,
                     key_validators: Dict[str, Callable[[Any, str], ValidationResult]] = None,
                     allow_none: bool = False,
                     allow_extra_keys: bool = True) -> ValidationResult:
        """
        Validate a dictionary value.
        
        Args:
            value: Dictionary to validate
            field_name: Name of the field being validated
            required_keys: List of keys that must be present
            optional_keys: List of keys that may be present
            key_validators: Dictionary of validators for specific keys
            allow_none: Whether None is an acceptable value
            allow_extra_keys: Whether extra keys are allowed
            
        Returns:
            ValidationResult indicating if validation passed
        """
        result = ValidationResult()
        
        # Check for None if not allowed
        if value is None:
            if allow_none:
                return result
            else:
                result.add_error(f"Field '{field_name}' cannot be None", field_name)
                return result
        
        # Type checking
        if not isinstance(value, dict):
            result.add_error(
                f"Field '{field_name}' must be a dictionary, got {type(value).__name__}", 
                field_name, 
                ValidationSeverity.ERROR
            )
            return result
        
        # Required keys validation
        if required_keys is not None:
            for key in required_keys:
                if key not in value:
                    result.add_error(
                        f"Required key '{key}' missing from '{field_name}'", 
                        field_name
                    )
        
        # Extra keys validation
        if not allow_extra_keys:
            allowed_keys = set()
            if required_keys is not None:
                allowed_keys.update(required_keys)
            if optional_keys is not None:
                allowed_keys.update(optional_keys)
            
            for key in value:
                if key not in allowed_keys:
                    result.add_error(
                        f"Unexpected key '{key}' in '{field_name}'", 
                        field_name, 
                        ValidationSeverity.WARNING
                    )
        
        # Key validation
        if key_validators is not None:
            for key, validator in key_validators.items():
                if key in value:
                    key_result = validator(value[key], f"{field_name}.{key}")
                    result.merge(key_result)
        
        return result
    
    @staticmethod
    def validate_json_string(value: str, 
                           field_name: str = None,
                           schema: Dict[str, Any] = None,
                           max_size: int = MAX_SIZES["json"],
                           allow_none: bool = False) -> ValidationResult:
        """
        Validate a JSON string.
        
        Args:
            value: JSON string to validate
            field_name: Name of the field being validated
            schema: JSON schema to validate against
            max_size: Maximum allowed size in bytes
            allow_none: Whether None is an acceptable value
            
        Returns:
            ValidationResult indicating if validation passed
        """
        result = ValidationResult()
        
        # Check for None if not allowed
        if value is None:
            if allow_none:
                return result
            else:
                result.add_error(f"Field '{field_name}' cannot be None", field_name)
                return result
        
        # String validation
        string_result = InputValidator.validate_string(
            value, field_name, max_length=max_size
        )
        result.merge(string_result)
        
        if not string_result.is_valid:
            return result
        
        # JSON parsing
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as e:
            result.add_error(
                f"Field '{field_name}' contains invalid JSON: {str(e)}", 
                field_name, 
                ValidationSeverity.ERROR
            )
            return result
        
        # Schema validation
        if schema is not None:
            # This would use a JSON schema validator like jsonschema
            # For now, we'll just check if it's a dict
            if not isinstance(parsed, dict):
                result.add_error(
                    f"Field '{field_name}' must be a JSON object", 
                    field_name
                )
        
        return result
    
    @staticmethod
    def validate_extension_point_id(value: str, field_name: str = "extension_point_id") -> ValidationResult:
        """
        Validate an extension point ID.
        
        Args:
            value: Extension point ID to validate
            field_name: Name of the field being validated
            
        Returns:
            ValidationResult indicating if validation passed
        """
        return InputValidator.validate_string(
            value, 
            field_name, 
            min_length=3, 
            max_length=InputValidator.MAX_SIZES["id"],
            pattern=InputValidator.PATTERNS["extension_point_id"]
        )
    
    @staticmethod
    def validate_implementation_id(value: str, field_name: str = "implementation_id") -> ValidationResult:
        """
        Validate an implementation ID.
        
        Args:
            value: Implementation ID to validate
            field_name: Name of the field being validated
            
        Returns:
            ValidationResult indicating if validation passed
        """
        return InputValidator.validate_string(
            value, 
            field_name, 
            min_length=3, 
            max_length=InputValidator.MAX_SIZES["id"],
            pattern=InputValidator.PATTERNS["implementation_id"]
        )
    
    @staticmethod
    def validate_module_id(value: str, field_name: str = "module_id") -> ValidationResult:
        """
        Validate a module ID.
        
        Args:
            value: Module ID to validate
            field_name: Name of the field being validated
            
        Returns:
            ValidationResult indicating if validation passed
        """
        return InputValidator.validate_string(
            value, 
            field_name, 
            min_length=3, 
            max_length=InputValidator.MAX_SIZES["id"],
            pattern=InputValidator.PATTERNS["module_id"]
        )
    
    @staticmethod
    def validate_version(value: str, field_name: str = "version") -> ValidationResult:
        """
        Validate a version string.
        
        Args:
            value: Version string to validate
            field_name: Name of the field being validated
            
        Returns:
            ValidationResult indicating if validation passed
        """
        return InputValidator.validate_string(
            value, 
            field_name, 
            min_length=5, 
            max_length=InputValidator.MAX_SIZES["id"],
            pattern=InputValidator.PATTERNS["version"]
        )
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = None) -> str:
        """
        Sanitize a string by removing potentially dangerous characters.
        
        Args:
            value: String to sanitize
            max_length: Maximum allowed length
            
        Returns:
            Sanitized string
        """
        if value is None:
            return None
        
        # Convert to string if not already
        if not isinstance(value, str):
            value = str(value)
        
        # Truncate if needed
        if max_length is not None and len(value) > max_length:
            value = value[:max_length]
        
        # Remove control characters
        value = ''.join(c for c in value if ord(c) >= 32 or c in '\n\r\t')
        
        return value
    
    @staticmethod
    def sanitize_html(value: str, max_length: int = None) -> str:
        """
        Sanitize HTML content by removing potentially dangerous tags and attributes.
        
        Args:
            value: HTML string to sanitize
            max_length: Maximum allowed length
            
        Returns:
            Sanitized HTML string
        """
        if value is None:
            return None
        
        # Convert to string if not already
        if not isinstance(value, str):
            value = str(value)
        
        # Truncate if needed
        if max_length is not None and len(value) > max_length:
            value = value[:max_length]
        
        # Remove potentially dangerous tags
        # This is a very basic implementation - in production, use a proper HTML sanitizer
        dangerous_tags = ['script', 'iframe', 'object', 'embed', 'style']
        for tag in dangerous_tags:
            value = re.sub(f'<{tag}[^>]*>.*?</{tag}>', '', value, flags=re.DOTALL | re.IGNORECASE)
            value = re.sub(f'<{tag}[^>]*/?>', '', value, flags=re.IGNORECASE)
        
        # Remove on* attributes
        value = re.sub(r' on\w+="[^"]*"', '', value, flags=re.IGNORECASE)
        value = re.sub(r" on\w+='[^']*'", '', value, flags=re.IGNORECASE)
        
        return value
    
    @staticmethod
    def sanitize_json(value: str) -> str:
        """
        Sanitize a JSON string by parsing and re-serializing it.
        
        Args:
            value: JSON string to sanitize
            
        Returns:
            Sanitized JSON string
        """
        if value is None:
            return None
        
        try:
            parsed = json.loads(value)
            return json.dumps(parsed)
        except json.JSONDecodeError:
            # If it's not valid JSON, return None
            return None
