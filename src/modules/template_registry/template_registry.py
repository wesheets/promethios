"""
Template Registry for Promethios.

This module provides comprehensive template management within the Promethios
governance system. It enables templates to be defined, versioned, instantiated,
and optimized across the multi-agent ecosystem.
"""

import os
import json
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, NamedTuple
from enum import Enum
import uuid
import re

# Configure logging
logger = logging.getLogger(__name__)

class TemplateType(Enum):
    """Template type enumeration."""
    AGENT_TEMPLATE = "agent_template"
    WORKFLOW_TEMPLATE = "workflow_template"
    PROMPT_TEMPLATE = "prompt_template"
    CONFIGURATION_TEMPLATE = "configuration_template"
    RESPONSE_TEMPLATE = "response_template"
    PERSONA_TEMPLATE = "persona_template"
    CAPABILITY_TEMPLATE = "capability_template"
    SERVICE_TEMPLATE = "service_template"

class TemplateStatus(Enum):
    """Template status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPRECATED = "deprecated"
    EXPERIMENTAL = "experimental"
    DRAFT = "draft"

class TemplateFormat(Enum):
    """Template format enumeration."""
    JSON = "json"
    YAML = "yaml"
    JINJA2 = "jinja2"
    MUSTACHE = "mustache"
    HANDLEBARS = "handlebars"
    CUSTOM = "custom"

class TemplateVariable(NamedTuple):
    """Template variable definition."""
    name: str
    type: str
    required: bool
    default_value: Any
    description: str
    validation_rules: Dict[str, Any]

class TemplateRegistrationResult(NamedTuple):
    """Result of template registration."""
    success: bool
    template_id: Optional[str] = None
    error: Optional[str] = None
    registration_timestamp: Optional[str] = None

class TemplateInstantiationResult(NamedTuple):
    """Result of template instantiation."""
    success: bool
    instance_data: Optional[Any] = None
    error: Optional[str] = None
    instantiation_time: float = 0.0
    governance_score: float = 0.0

class TemplateRegistry:
    """Registry for managing template lifecycle and instantiation."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        registry_path: str,
        governance_integration=None
    ):
        """Initialize the template registry.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            registry_path: Path to the registry JSON file.
            governance_integration: Optional governance integration service.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.registry_path = registry_path
        self.governance_integration = governance_integration
        self.templates = {}
        self.template_versions = {}
        self.template_instances = {}
        self.template_usage_stats = {}
        
        # Load existing registry if available
        self._load_registry()
    
    def _load_registry(self):
        """Load the registry from the JSON file."""
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r') as f:
                    data = json.load(f)
                
                # Verify the seal
                if not self.seal_verification_service.verify_seal(data):
                    logger.error("Template registry file seal verification failed")
                    raise ValueError("Template registry file seal verification failed")
                
                # Load registry data
                self.templates = data.get("templates", {})
                self.template_versions = data.get("template_versions", {})
                self.template_instances = data.get("template_instances", {})
                self.template_usage_stats = data.get("template_usage_stats", {})
                
                logger.info(f"Loaded {len(self.templates)} templates from registry")
            except Exception as e:
                logger.error(f"Error loading template registry: {str(e)}")
                self._initialize_empty_registry()
    
    def _initialize_empty_registry(self):
        """Initialize empty registry structures."""
        self.templates = {}
        self.template_versions = {}
        self.template_instances = {}
        self.template_usage_stats = {}
    
    def _save_registry(self):
        """Save the registry to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.registry_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        # Prepare data for serialization
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_template_registry",
            "templates": self.templates,
            "template_versions": self.template_versions,
            "template_instances": self.template_instances,
            "template_usage_stats": self.template_usage_stats
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.templates)} templates to registry")
    
    def _get_registry_state_hash(self) -> str:
        """Get a hash of the current registry state.
        
        Returns:
            Hash of the current registry state.
        """
        # Create a string representation of the registry state
        state_data = {
            "templates": self.templates,
            "template_versions": self.template_versions,
            "template_instances": self.template_instances,
            "template_usage_stats": self.template_usage_stats
        }
        state_str = json.dumps(state_data, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def register_template(self, template_data: Dict[str, Any]) -> TemplateRegistrationResult:
        """Register a new template.
        
        Args:
            template_data: Data for the template to register.
                Must include template_id, name, description, template_type,
                template_format, content, variables, and governance configuration.
                
        Returns:
            TemplateRegistrationResult with success status and details.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "register_template",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return TemplateRegistrationResult(
                    success=False,
                    error="Pre-loop tether verification failed"
                )
            
            # Validate the template data
            validation_result = self.schema_validator.validate(template_data, "template_registration.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Template validation failed: {validation_result.errors}")
                return TemplateRegistrationResult(
                    success=False,
                    error=f"Template validation failed: {validation_result.errors}"
                )
            
            # Check if the template already exists
            template_id = template_data["template_id"]
            if template_id in self.templates:
                logger.error(f"Template {template_id} already exists")
                return TemplateRegistrationResult(
                    success=False,
                    error=f"Template {template_id} already exists"
                )
            
            # Validate template content
            content_validation = self._validate_template_content(template_data)
            if not content_validation["valid"]:
                return TemplateRegistrationResult(
                    success=False,
                    error=f"Template content validation failed: {content_validation['error']}"
                )
            
            # Prepare the template data
            registration_timestamp = datetime.utcnow().isoformat()
            template = {
                "template_id": template_id,
                "name": template_data["name"],
                "description": template_data["description"],
                "template_type": template_data["template_type"],
                "template_format": template_data["template_format"],
                "version": template_data.get("version", "1.0.0"),
                "author": template_data.get("author", "unknown"),
                "content": template_data["content"],
                "variables": template_data.get("variables", []),
                "inheritance": template_data.get("inheritance", {}),
                "governance_config": template_data.get("governance_config", {}),
                "metadata": template_data.get("metadata", {}),
                "registration_timestamp": registration_timestamp,
                "status": TemplateStatus.ACTIVE.value,
                "usage_count": 0,
                "last_used": None
            }
            
            # Create a seal for the template
            template["seal"] = self.seal_verification_service.create_seal(template)
            
            # Add the template to the registry
            self.templates[template_id] = template
            
            # Initialize template versioning
            self.template_versions[template_id] = {
                "current_version": template["version"],
                "version_history": [{
                    "version": template["version"],
                    "timestamp": registration_timestamp,
                    "changes": "Initial registration",
                    "author": template["author"]
                }]
            }
            
            # Initialize template usage statistics
            self.template_usage_stats[template_id] = {
                "total_instantiations": 0,
                "successful_instantiations": 0,
                "failed_instantiations": 0,
                "average_instantiation_time": 0.0,
                "average_governance_score": 0.0,
                "variable_usage_frequency": {},
                "instantiation_history": []
            }
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Registered template {template_id}")
            return TemplateRegistrationResult(
                success=True,
                template_id=template_id,
                registration_timestamp=registration_timestamp
            )
            
        except Exception as e:
            logger.error(f"Error registering template: {str(e)}")
            return TemplateRegistrationResult(
                success=False,
                error=f"Error registering template: {str(e)}"
            )
    
    def _validate_template_content(self, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate template content based on format.
        
        Args:
            template_data: Template data to validate.
            
        Returns:
            Validation result with success status and error details.
        """
        try:
            template_format = template_data["template_format"]
            content = template_data["content"]
            variables = template_data.get("variables", [])
            
            if template_format == TemplateFormat.JSON.value:
                # Validate JSON format
                if isinstance(content, str):
                    json.loads(content)
                elif not isinstance(content, (dict, list)):
                    return {"valid": False, "error": "JSON content must be a valid JSON string, dict, or list"}
            
            elif template_format == TemplateFormat.JINJA2.value:
                # Validate Jinja2 template syntax
                try:
                    from jinja2 import Template, TemplateSyntaxError
                    Template(content)
                except ImportError:
                    logger.warning("Jinja2 not available for template validation")
                except TemplateSyntaxError as e:
                    return {"valid": False, "error": f"Jinja2 syntax error: {str(e)}"}
            
            elif template_format == TemplateFormat.MUSTACHE.value:
                # Basic mustache validation (check for balanced braces)
                if not self._validate_mustache_syntax(content):
                    return {"valid": False, "error": "Mustache template has unbalanced braces"}
            
            # Validate that all declared variables are used in the template
            variable_names = [var["name"] for var in variables if isinstance(var, dict)]
            unused_variables = self._find_unused_variables(content, variable_names, template_format)
            if unused_variables:
                logger.warning(f"Template has unused variables: {unused_variables}")
            
            return {"valid": True}
            
        except Exception as e:
            return {"valid": False, "error": f"Template content validation error: {str(e)}"}
    
    def _validate_mustache_syntax(self, content: str) -> bool:
        """Validate basic Mustache template syntax.
        
        Args:
            content: Template content to validate.
            
        Returns:
            True if syntax is valid.
        """
        # Simple validation for balanced braces
        open_count = content.count("{{")
        close_count = content.count("}}")
        return open_count == close_count
    
    def _find_unused_variables(self, content: str, variable_names: List[str], template_format: str) -> List[str]:
        """Find variables that are declared but not used in the template.
        
        Args:
            content: Template content.
            variable_names: List of declared variable names.
            template_format: Template format.
            
        Returns:
            List of unused variable names.
        """
        unused = []
        
        for var_name in variable_names:
            if template_format == TemplateFormat.JINJA2.value:
                # Look for Jinja2 variable syntax: {{ var_name }}
                if f"{{{{{var_name}}}}}" not in content and f"{{{{{var_name}|" not in content:
                    unused.append(var_name)
            elif template_format == TemplateFormat.MUSTACHE.value:
                # Look for Mustache variable syntax: {{var_name}}
                if f"{{{{{var_name}}}}}" not in content:
                    unused.append(var_name)
            elif template_format == TemplateFormat.JSON.value:
                # Look for JSON placeholder syntax: "${var_name}"
                if f'"${{{var_name}}}"' not in content and f"${{{var_name}}}" not in content:
                    unused.append(var_name)
        
        return unused
    
    def instantiate_template(self, template_id: str, variables: Dict[str, Any], 
                           instantiation_config: Optional[Dict[str, Any]] = None) -> TemplateInstantiationResult:
        """Instantiate a template with provided variables.
        
        Args:
            template_id: ID of the template to instantiate.
            variables: Variables to use for template instantiation.
            instantiation_config: Optional instantiation configuration.
            
        Returns:
            TemplateInstantiationResult with success status and instance data.
        """
        start_time = datetime.utcnow()
        
        try:
            # Check if the template exists
            if template_id not in self.templates:
                return TemplateInstantiationResult(
                    success=False,
                    error=f"Template {template_id} does not exist"
                )
            
            template = self.templates[template_id]
            
            # Check if template is active
            if template.get("status") != TemplateStatus.ACTIVE.value:
                return TemplateInstantiationResult(
                    success=False,
                    error=f"Template {template_id} is not active (status: {template.get('status')})"
                )
            
            # Validate provided variables
            validation_result = self._validate_template_variables(template, variables)
            if not validation_result["valid"]:
                return TemplateInstantiationResult(
                    success=False,
                    error=f"Variable validation failed: {validation_result['error']}"
                )
            
            # Check governance requirements
            governance_score = 1.0
            if self.governance_integration:
                governance_result = self.governance_integration.evaluate_template_instantiation(
                    template_id, variables
                )
                governance_score = governance_result.get("overall_score", 1.0)
                if not governance_result.get("approved", True):
                    return TemplateInstantiationResult(
                        success=False,
                        error=f"Template instantiation not approved by governance: {governance_result.get('reason', 'Unknown')}"
                    )
            
            # Perform template instantiation
            instance_data = self._perform_template_instantiation(template, variables, instantiation_config)
            
            # Calculate instantiation time
            end_time = datetime.utcnow()
            instantiation_time = (end_time - start_time).total_seconds()
            
            # Create instance record
            instance_id = str(uuid.uuid4())
            instance_record = {
                "instance_id": instance_id,
                "template_id": template_id,
                "variables": variables,
                "instance_data": instance_data,
                "instantiation_timestamp": end_time.isoformat(),
                "instantiation_time": instantiation_time,
                "governance_score": governance_score
            }
            
            self.template_instances[instance_id] = instance_record
            
            # Update template usage statistics
            self._update_template_usage_stats(template_id, True, instantiation_time, governance_score, variables)
            
            return TemplateInstantiationResult(
                success=True,
                instance_data=instance_data,
                instantiation_time=instantiation_time,
                governance_score=governance_score
            )
            
        except Exception as e:
            end_time = datetime.utcnow()
            instantiation_time = (end_time - start_time).total_seconds()
            
            # Update template usage statistics for failure
            if template_id in self.templates:
                self._update_template_usage_stats(template_id, False, instantiation_time, 0.0, variables)
            
            logger.error(f"Error instantiating template {template_id}: {str(e)}")
            return TemplateInstantiationResult(
                success=False,
                error=f"Error instantiating template: {str(e)}",
                instantiation_time=instantiation_time
            )
    
    def _validate_template_variables(self, template: Dict[str, Any], variables: Dict[str, Any]) -> Dict[str, Any]:
        """Validate variables against template requirements.
        
        Args:
            template: Template definition.
            variables: Variables to validate.
            
        Returns:
            Validation result with success status and error details.
        """
        try:
            template_variables = template.get("variables", [])
            
            # Check required variables
            for var_def in template_variables:
                if isinstance(var_def, dict):
                    var_name = var_def.get("name")
                    required = var_def.get("required", False)
                    var_type = var_def.get("type", "string")
                    validation_rules = var_def.get("validation_rules", {})
                    
                    if required and var_name not in variables:
                        return {"valid": False, "error": f"Required variable '{var_name}' is missing"}
                    
                    if var_name in variables:
                        # Type validation
                        value = variables[var_name]
                        if not self._validate_variable_type(value, var_type):
                            return {"valid": False, "error": f"Variable '{var_name}' has invalid type. Expected: {var_type}"}
                        
                        # Custom validation rules
                        rule_validation = self._validate_variable_rules(value, validation_rules)
                        if not rule_validation["valid"]:
                            return {"valid": False, "error": f"Variable '{var_name}' validation failed: {rule_validation['error']}"}
            
            return {"valid": True}
            
        except Exception as e:
            return {"valid": False, "error": f"Variable validation error: {str(e)}"}
    
    def _validate_variable_type(self, value: Any, expected_type: str) -> bool:
        """Validate variable type.
        
        Args:
            value: Variable value.
            expected_type: Expected type string.
            
        Returns:
            True if type is valid.
        """
        type_mapping = {
            "string": str,
            "integer": int,
            "float": float,
            "boolean": bool,
            "list": list,
            "dict": dict,
            "any": object
        }
        
        expected_python_type = type_mapping.get(expected_type, str)
        
        if expected_type == "any":
            return True
        elif expected_type == "integer":
            return isinstance(value, int) and not isinstance(value, bool)
        elif expected_type == "float":
            return isinstance(value, (int, float)) and not isinstance(value, bool)
        else:
            return isinstance(value, expected_python_type)
    
    def _validate_variable_rules(self, value: Any, rules: Dict[str, Any]) -> Dict[str, Any]:
        """Validate variable against custom rules.
        
        Args:
            value: Variable value.
            rules: Validation rules.
            
        Returns:
            Validation result.
        """
        try:
            # String length validation
            if "min_length" in rules and isinstance(value, str):
                if len(value) < rules["min_length"]:
                    return {"valid": False, "error": f"String too short. Minimum length: {rules['min_length']}"}
            
            if "max_length" in rules and isinstance(value, str):
                if len(value) > rules["max_length"]:
                    return {"valid": False, "error": f"String too long. Maximum length: {rules['max_length']}"}
            
            # Numeric range validation
            if "min_value" in rules and isinstance(value, (int, float)):
                if value < rules["min_value"]:
                    return {"valid": False, "error": f"Value too small. Minimum: {rules['min_value']}"}
            
            if "max_value" in rules and isinstance(value, (int, float)):
                if value > rules["max_value"]:
                    return {"valid": False, "error": f"Value too large. Maximum: {rules['max_value']}"}
            
            # Pattern validation
            if "pattern" in rules and isinstance(value, str):
                pattern = rules["pattern"]
                if not re.match(pattern, value):
                    return {"valid": False, "error": f"Value does not match pattern: {pattern}"}
            
            # Allowed values validation
            if "allowed_values" in rules:
                allowed = rules["allowed_values"]
                if value not in allowed:
                    return {"valid": False, "error": f"Value not in allowed list: {allowed}"}
            
            return {"valid": True}
            
        except Exception as e:
            return {"valid": False, "error": f"Rule validation error: {str(e)}"}
    
    def _perform_template_instantiation(self, template: Dict[str, Any], variables: Dict[str, Any], 
                                      instantiation_config: Optional[Dict[str, Any]]) -> Any:
        """Perform the actual template instantiation.
        
        Args:
            template: Template definition.
            variables: Variables for instantiation.
            instantiation_config: Optional instantiation configuration.
            
        Returns:
            Instantiated template data.
        """
        template_format = template["template_format"]
        content = template["content"]
        
        # Add default values for missing optional variables
        complete_variables = variables.copy()
        for var_def in template.get("variables", []):
            if isinstance(var_def, dict):
                var_name = var_def.get("name")
                default_value = var_def.get("default_value")
                if var_name not in complete_variables and default_value is not None:
                    complete_variables[var_name] = default_value
        
        if template_format == TemplateFormat.JSON.value:
            return self._instantiate_json_template(content, complete_variables)
        elif template_format == TemplateFormat.JINJA2.value:
            return self._instantiate_jinja2_template(content, complete_variables)
        elif template_format == TemplateFormat.MUSTACHE.value:
            return self._instantiate_mustache_template(content, complete_variables)
        else:
            # For other formats, perform simple string substitution
            return self._instantiate_string_template(content, complete_variables)
    
    def _instantiate_json_template(self, content: Any, variables: Dict[str, Any]) -> Any:
        """Instantiate a JSON template.
        
        Args:
            content: Template content.
            variables: Variables for substitution.
            
        Returns:
            Instantiated JSON data.
        """
        if isinstance(content, str):
            # String-based JSON template with variable substitution
            result = content
            for var_name, var_value in variables.items():
                placeholder = f"${{{var_name}}}"
                if isinstance(var_value, str):
                    result = result.replace(placeholder, var_value)
                else:
                    result = result.replace(f'"{placeholder}"', json.dumps(var_value))
            
            try:
                return json.loads(result)
            except json.JSONDecodeError:
                return result
        else:
            # Structured JSON template
            return self._substitute_json_variables(content, variables)
    
    def _substitute_json_variables(self, data: Any, variables: Dict[str, Any]) -> Any:
        """Recursively substitute variables in JSON data.
        
        Args:
            data: JSON data structure.
            variables: Variables for substitution.
            
        Returns:
            Data with variables substituted.
        """
        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                new_key = self._substitute_string_variables(key, variables) if isinstance(key, str) else key
                result[new_key] = self._substitute_json_variables(value, variables)
            return result
        elif isinstance(data, list):
            return [self._substitute_json_variables(item, variables) for item in data]
        elif isinstance(data, str):
            return self._substitute_string_variables(data, variables)
        else:
            return data
    
    def _substitute_string_variables(self, text: str, variables: Dict[str, Any]) -> str:
        """Substitute variables in a string.
        
        Args:
            text: Text with variable placeholders.
            variables: Variables for substitution.
            
        Returns:
            Text with variables substituted.
        """
        result = text
        for var_name, var_value in variables.items():
            placeholder = f"${{{var_name}}}"
            if placeholder in result:
                result = result.replace(placeholder, str(var_value))
        return result
    
    def _instantiate_jinja2_template(self, content: str, variables: Dict[str, Any]) -> str:
        """Instantiate a Jinja2 template.
        
        Args:
            content: Template content.
            variables: Variables for rendering.
            
        Returns:
            Rendered template.
        """
        try:
            from jinja2 import Template
            template = Template(content)
            return template.render(**variables)
        except ImportError:
            logger.warning("Jinja2 not available, falling back to string substitution")
            return self._instantiate_string_template(content, variables)
    
    def _instantiate_mustache_template(self, content: str, variables: Dict[str, Any]) -> str:
        """Instantiate a Mustache template.
        
        Args:
            content: Template content.
            variables: Variables for rendering.
            
        Returns:
            Rendered template.
        """
        # Simple Mustache-style substitution
        result = content
        for var_name, var_value in variables.items():
            placeholder = f"{{{{{var_name}}}}}"
            result = result.replace(placeholder, str(var_value))
        return result
    
    def _instantiate_string_template(self, content: str, variables: Dict[str, Any]) -> str:
        """Instantiate a string template with simple substitution.
        
        Args:
            content: Template content.
            variables: Variables for substitution.
            
        Returns:
            Template with variables substituted.
        """
        return self._substitute_string_variables(content, variables)
    
    def _update_template_usage_stats(self, template_id: str, success: bool, instantiation_time: float, 
                                   governance_score: float, variables: Dict[str, Any]):
        """Update template usage statistics.
        
        Args:
            template_id: ID of the template.
            success: Whether the instantiation was successful.
            instantiation_time: Instantiation time in seconds.
            governance_score: Governance score for the instantiation.
            variables: Variables used in instantiation.
        """
        if template_id not in self.template_usage_stats:
            return
        
        stats = self.template_usage_stats[template_id]
        
        # Update counters
        stats["total_instantiations"] += 1
        if success:
            stats["successful_instantiations"] += 1
        else:
            stats["failed_instantiations"] += 1
        
        # Update average instantiation time
        total_time = stats["average_instantiation_time"] * (stats["total_instantiations"] - 1) + instantiation_time
        stats["average_instantiation_time"] = total_time / stats["total_instantiations"]
        
        # Update average governance score
        total_governance = stats["average_governance_score"] * (stats["total_instantiations"] - 1) + governance_score
        stats["average_governance_score"] = total_governance / stats["total_instantiations"]
        
        # Update variable usage frequency
        for var_name in variables.keys():
            if var_name not in stats["variable_usage_frequency"]:
                stats["variable_usage_frequency"][var_name] = 0
            stats["variable_usage_frequency"][var_name] += 1
        
        # Update template's usage count
        self.templates[template_id]["usage_count"] = stats["total_instantiations"]
        self.templates[template_id]["last_used"] = datetime.utcnow().isoformat()
        
        # Add to instantiation history (keep last 100 entries)
        stats["instantiation_history"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "success": success,
            "instantiation_time": instantiation_time,
            "governance_score": governance_score,
            "variable_count": len(variables)
        })
        if len(stats["instantiation_history"]) > 100:
            stats["instantiation_history"] = stats["instantiation_history"][-100:]
    
    def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a template.
        
        Args:
            template_id: ID of the template to get.
            
        Returns:
            Information about the template, or None if it doesn't exist.
        """
        return self.templates.get(template_id)
    
    def get_template_versions(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get template version information.
        
        Args:
            template_id: ID of the template.
            
        Returns:
            Template version information, or None if it doesn't exist.
        """
        return self.template_versions.get(template_id)
    
    def get_template_usage_stats(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get template usage statistics.
        
        Args:
            template_id: ID of the template.
            
        Returns:
            Template usage statistics, or None if it doesn't exist.
        """
        return self.template_usage_stats.get(template_id)
    
    def list_templates(self, template_type_filter: Optional[TemplateType] = None,
                      status_filter: Optional[TemplateStatus] = None,
                      format_filter: Optional[TemplateFormat] = None) -> Dict[str, Dict[str, Any]]:
        """List all registered templates with optional filtering.
        
        Args:
            template_type_filter: Optional template type filter.
            status_filter: Optional status filter.
            format_filter: Optional format filter.
            
        Returns:
            Dictionary mapping template IDs to template information.
        """
        filtered_templates = {}
        
        for template_id, template in self.templates.items():
            # Apply template type filter
            if template_type_filter and template.get("template_type") != template_type_filter.value:
                continue
            
            # Apply status filter
            if status_filter and template.get("status") != status_filter.value:
                continue
            
            # Apply format filter
            if format_filter and template.get("template_format") != format_filter.value:
                continue
            
            filtered_templates[template_id] = template
        
        return filtered_templates
    
    def get_active_templates(self) -> List[str]:
        """Get list of currently active templates.
        
        Returns:
            List of active template IDs.
        """
        active_templates = []
        
        for template_id, template in self.templates.items():
            if template.get("status") == TemplateStatus.ACTIVE.value:
                active_templates.append(template_id)
        
        return active_templates
    
    def get_registry_statistics(self) -> Dict[str, Any]:
        """Get registry statistics.
        
        Returns:
            Dictionary containing registry statistics.
        """
        stats = {
            "total_templates": len(self.templates),
            "templates_by_type": {},
            "templates_by_status": {},
            "templates_by_format": {},
            "total_instantiations": sum(usage.get("total_instantiations", 0) for usage in self.template_usage_stats.values()),
            "average_instantiation_times": {},
            "most_used_variables": {}
        }
        
        # Count templates by type
        for template in self.templates.values():
            template_type = template.get("template_type", "unknown")
            stats["templates_by_type"][template_type] = stats["templates_by_type"].get(template_type, 0) + 1
        
        # Count templates by status
        for template in self.templates.values():
            status = template.get("status", "unknown")
            stats["templates_by_status"][status] = stats["templates_by_status"].get(status, 0) + 1
        
        # Count templates by format
        for template in self.templates.values():
            template_format = template.get("template_format", "unknown")
            stats["templates_by_format"][template_format] = stats["templates_by_format"].get(template_format, 0) + 1
        
        # Calculate average instantiation times
        if self.template_usage_stats:
            instantiation_times = [usage.get("average_instantiation_time", 0.0) for usage in self.template_usage_stats.values()]
            stats["average_instantiation_times"]["overall"] = sum(instantiation_times) / len(instantiation_times) if instantiation_times else 0.0
        
        # Find most used variables
        all_variable_usage = {}
        for usage in self.template_usage_stats.values():
            var_usage = usage.get("variable_usage_frequency", {})
            for var_name, count in var_usage.items():
                all_variable_usage[var_name] = all_variable_usage.get(var_name, 0) + count
        
        # Get top 10 most used variables
        sorted_variables = sorted(all_variable_usage.items(), key=lambda x: x[1], reverse=True)
        stats["most_used_variables"] = dict(sorted_variables[:10])
        
        return stats
    
    def check_template_exists(self, template_id: str) -> bool:
        """Check if a template exists.
        
        Args:
            template_id: ID of the template to check.
            
        Returns:
            True if the template exists, False otherwise.
        """
        return template_id in self.templates
    
    def update_template_status(self, template_id: str, status: TemplateStatus) -> bool:
        """Update a template's status.
        
        Args:
            template_id: ID of the template to update.
            status: New status for the template.
            
        Returns:
            True if the status was updated successfully.
        """
        try:
            if template_id not in self.templates:
                logger.error(f"Template {template_id} does not exist")
                return False
            
            # Update template status
            self.templates[template_id]["status"] = status.value
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Updated template {template_id} status to {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating template {template_id} status: {str(e)}")
            return False

