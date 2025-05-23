"""
Schema Validation Module for Phase 6.3

This module provides schema validation functionality for all components
of the Phase 6.3 Phased API Exposure framework and Agent Preference Elicitation.
"""

import json
import os
import logging
from typing import Dict, Any, List, Union, Optional
from jsonschema import validate, ValidationError, Draft7Validator, FormatChecker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SchemaValidator:
    """
    Schema validator for Phase 6.3 components.
    
    Provides functionality to:
    - Load and validate JSON schemas
    - Validate objects against schemas
    - Report validation errors
    """
    
    def __init__(self, schema_dir: str):
        """
        Initialize the schema validator.
        
        Args:
            schema_dir: Directory containing schema files
        """
        self.schema_dir = schema_dir
        self.schemas = {}
        self.load_schemas()
        
    def load_schemas(self):
        """Load all schema files from the schema directory."""
        if not os.path.exists(self.schema_dir):
            logger.error(f"Schema directory not found: {self.schema_dir}")
            raise FileNotFoundError(f"Schema directory not found: {self.schema_dir}")
            
        for root, _, files in os.walk(self.schema_dir):
            for file in files:
                if file.endswith('.json'):
                    schema_path = os.path.join(root, file)
                    schema_name = os.path.splitext(file)[0]
                    
                    # Include subdirectory in schema name for organization
                    rel_path = os.path.relpath(root, self.schema_dir)
                    if rel_path != '.':
                        schema_name = f"{rel_path.replace(os.path.sep, '.')}.{schema_name}"
                    
                    try:
                        with open(schema_path, 'r') as f:
                            schema = json.load(f)
                            # Validate the schema itself
                            Draft7Validator.check_schema(schema)
                            self.schemas[schema_name] = schema
                            logger.info(f"Loaded schema: {schema_name}")
                    except json.JSONDecodeError as e:
                        logger.error(f"Error parsing schema file {schema_path}: {str(e)}")
                    except Exception as e:
                        logger.error(f"Error loading schema {schema_path}: {str(e)}")
        
        logger.info(f"Loaded {len(self.schemas)} schemas")
    
    def validate_object(self, obj: Dict[str, Any], schema_name: str) -> Dict[str, Any]:
        """
        Validate an object against a named schema.
        
        Args:
            obj: Object to validate
            schema_name: Name of the schema to validate against
            
        Returns:
            Dict: Validation result with status and errors if any
        """
        if schema_name not in self.schemas:
            return {
                "valid": False,
                "errors": [f"Schema '{schema_name}' not found"]
            }
            
        schema = self.schemas[schema_name]
        validator = Draft7Validator(schema, format_checker=FormatChecker())
        errors = list(validator.iter_errors(obj))
        
        if not errors:
            return {"valid": True}
        
        # Format validation errors
        formatted_errors = []
        for error in errors:
            formatted_errors.append({
                "path": ".".join(str(p) for p in error.path) if error.path else "(root)",
                "message": error.message,
                "schema_path": ".".join(str(p) for p in error.schema_path)
            })
            
        return {
            "valid": False,
            "errors": formatted_errors
        }
    
    def validate_file(self, file_path: str, schema_name: str) -> Dict[str, Any]:
        """
        Validate a JSON file against a named schema.
        
        Args:
            file_path: Path to the JSON file
            schema_name: Name of the schema to validate against
            
        Returns:
            Dict: Validation result with status and errors if any
        """
        try:
            with open(file_path, 'r') as f:
                obj = json.load(f)
                return self.validate_object(obj, schema_name)
        except json.JSONDecodeError as e:
            return {
                "valid": False,
                "errors": [f"Invalid JSON in file {file_path}: {str(e)}"]
            }
        except FileNotFoundError:
            return {
                "valid": False,
                "errors": [f"File not found: {file_path}"]
            }
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Error validating file {file_path}: {str(e)}"]
            }
    
    def get_schema(self, schema_name: str) -> Optional[Dict[str, Any]]:
        """
        Get a schema by name.
        
        Args:
            schema_name: Name of the schema
            
        Returns:
            Dict: The schema or None if not found
        """
        return self.schemas.get(schema_name)
    
    def list_schemas(self) -> List[str]:
        """
        List all available schemas.
        
        Returns:
            List: Names of all available schemas
        """
        return list(self.schemas.keys())
    
    def validate_directory(self, dir_path: str, schema_mapping: Dict[str, str]) -> Dict[str, Any]:
        """
        Validate all JSON files in a directory against specified schemas.
        
        Args:
            dir_path: Directory containing JSON files
            schema_mapping: Mapping of file patterns to schema names
            
        Returns:
            Dict: Validation results for each file
        """
        if not os.path.exists(dir_path):
            return {
                "valid": False,
                "errors": [f"Directory not found: {dir_path}"]
            }
            
        results = {}
        for root, _, files in os.walk(dir_path):
            for file in files:
                if file.endswith('.json'):
                    file_path = os.path.join(root, file)
                    
                    # Find matching schema
                    matching_schema = None
                    for pattern, schema in schema_mapping.items():
                        if pattern in file:
                            matching_schema = schema
                            break
                    
                    if matching_schema:
                        results[file_path] = self.validate_file(file_path, matching_schema)
                    else:
                        results[file_path] = {
                            "valid": False,
                            "errors": [f"No matching schema found for {file}"]
                        }
        
        # Aggregate results
        all_valid = all(result["valid"] for result in results.values())
        return {
            "valid": all_valid,
            "file_count": len(results),
            "valid_count": sum(1 for result in results.values() if result["valid"]),
            "invalid_count": sum(1 for result in results.values() if not result["valid"]),
            "file_results": results
        }


class ConfigurationManager:
    """
    Configuration manager for Phase 6.3 components.
    
    Provides functionality to:
    - Load and validate configuration files
    - Merge configurations from multiple sources
    - Provide access to configuration values
    """
    
    def __init__(self, config_dir: str, schema_validator: SchemaValidator = None):
        """
        Initialize the configuration manager.
        
        Args:
            config_dir: Directory containing configuration files
            schema_validator: Optional schema validator for configuration validation
        """
        self.config_dir = config_dir
        self.validator = schema_validator
        self.configs = {}
        self.load_configs()
        
    def load_configs(self):
        """Load all configuration files from the config directory."""
        if not os.path.exists(self.config_dir):
            logger.error(f"Configuration directory not found: {self.config_dir}")
            raise FileNotFoundError(f"Configuration directory not found: {self.config_dir}")
            
        for root, _, files in os.walk(self.config_dir):
            for file in files:
                if file.endswith('.json'):
                    config_path = os.path.join(root, file)
                    config_name = os.path.splitext(file)[0]
                    
                    # Include subdirectory in config name for organization
                    rel_path = os.path.relpath(root, self.config_dir)
                    if rel_path != '.':
                        config_name = f"{rel_path.replace(os.path.sep, '.')}.{config_name}"
                    
                    try:
                        with open(config_path, 'r') as f:
                            config = json.load(f)
                            self.configs[config_name] = config
                            logger.info(f"Loaded configuration: {config_name}")
                    except json.JSONDecodeError as e:
                        logger.error(f"Error parsing configuration file {config_path}: {str(e)}")
                    except Exception as e:
                        logger.error(f"Error loading configuration {config_path}: {str(e)}")
        
        logger.info(f"Loaded {len(self.configs)} configurations")
    
    def get_config(self, config_name: str) -> Optional[Dict[str, Any]]:
        """
        Get a configuration by name.
        
        Args:
            config_name: Name of the configuration
            
        Returns:
            Dict: The configuration or None if not found
        """
        return self.configs.get(config_name)
    
    def list_configs(self) -> List[str]:
        """
        List all available configurations.
        
        Returns:
            List: Names of all available configurations
        """
        return list(self.configs.keys())
    
    def validate_configs(self, schema_mapping: Dict[str, str]) -> Dict[str, Any]:
        """
        Validate all configurations against specified schemas.
        
        Args:
            schema_mapping: Mapping of configuration names to schema names
            
        Returns:
            Dict: Validation results for each configuration
        """
        if not self.validator:
            return {
                "valid": False,
                "errors": ["No schema validator provided"]
            }
            
        results = {}
        for config_name, config in self.configs.items():
            # Find matching schema
            matching_schema = None
            for pattern, schema in schema_mapping.items():
                if pattern in config_name:
                    matching_schema = schema
                    break
            
            if matching_schema:
                results[config_name] = self.validator.validate_object(config, matching_schema)
            else:
                results[config_name] = {
                    "valid": False,
                    "errors": [f"No matching schema found for {config_name}"]
                }
        
        # Aggregate results
        all_valid = all(result["valid"] for result in results.values())
        return {
            "valid": all_valid,
            "config_count": len(results),
            "valid_count": sum(1 for result in results.values() if result["valid"]),
            "invalid_count": sum(1 for result in results.values() if not result["valid"]),
            "config_results": results
        }
    
    def merge_configs(self, base_config_name: str, override_config_name: str) -> Dict[str, Any]:
        """
        Merge two configurations, with the override taking precedence.
        
        Args:
            base_config_name: Name of the base configuration
            override_config_name: Name of the configuration to override with
            
        Returns:
            Dict: Merged configuration
        """
        base_config = self.get_config(base_config_name) or {}
        override_config = self.get_config(override_config_name) or {}
        
        return self._deep_merge(base_config, override_config)
    
    def _deep_merge(self, base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deep merge two dictionaries.
        
        Args:
            base: Base dictionary
            override: Dictionary to override with
            
        Returns:
            Dict: Merged dictionary
        """
        result = base.copy()
        
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
                
        return result
    
    def save_config(self, config_name: str, config: Dict[str, Any], validate: bool = True, schema_name: str = None) -> Dict[str, Any]:
        """
        Save a configuration to file.
        
        Args:
            config_name: Name of the configuration
            config: Configuration to save
            validate: Whether to validate the configuration before saving
            schema_name: Name of the schema to validate against
            
        Returns:
            Dict: Result of the operation
        """
        # Validate if requested
        if validate and self.validator and schema_name:
            validation_result = self.validator.validate_object(config, schema_name)
            if not validation_result["valid"]:
                return {
                    "success": False,
                    "errors": validation_result["errors"]
                }
        
        # Determine file path
        parts = config_name.split('.')
        if len(parts) > 1:
            # Config name includes subdirectories
            subdir = os.path.join(self.config_dir, *parts[:-1])
            filename = f"{parts[-1]}.json"
            os.makedirs(subdir, exist_ok=True)
            file_path = os.path.join(subdir, filename)
        else:
            file_path = os.path.join(self.config_dir, f"{config_name}.json")
        
        try:
            with open(file_path, 'w') as f:
                json.dump(config, f, indent=2)
                
            # Update in-memory config
            self.configs[config_name] = config
            
            return {
                "success": True,
                "file_path": file_path
            }
        except Exception as e:
            return {
                "success": False,
                "errors": [f"Error saving configuration: {str(e)}"]
            }


# Example usage
if __name__ == "__main__":
    # Example schema directory
    schema_dir = "../schemas"
    
    # Initialize schema validator
    validator = SchemaValidator(schema_dir)
    
    # List available schemas
    print("Available schemas:")
    for schema_name in validator.list_schemas():
        print(f"- {schema_name}")
    
    # Example configuration directory
    config_dir = "../config"
    
    # Initialize configuration manager
    config_manager = ConfigurationManager(config_dir, validator)
    
    # List available configurations
    print("\nAvailable configurations:")
    for config_name in config_manager.list_configs():
        print(f"- {config_name}")
    
    # Example schema mapping for validation
    schema_mapping = {
        "access_tier": "access_tier.access_tier_schema",
        "api": "api.api_schema",
        "preference": "agent_preference.preference_schema",
        "feedback": "feedback.feedback_schema"
    }
    
    # Validate configurations
    validation_results = config_manager.validate_configs(schema_mapping)
    
    print(f"\nValidation results: {'PASS' if validation_results['valid'] else 'FAIL'}")
    print(f"Total configs: {validation_results['config_count']}")
    print(f"Valid configs: {validation_results['valid_count']}")
    print(f"Invalid configs: {validation_results['invalid_count']}")
    
    # Example of merging configurations
    if "default" in config_manager.list_configs() and "development" in config_manager.list_configs():
        merged_config = config_manager.merge_configs("default", "development")
        print("\nMerged configuration (default + development):")
        print(json.dumps(merged_config, indent=2))
