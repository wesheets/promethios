"""
API Policy Engine for Promethios.

This module provides the policy engine for the API Governance Framework,
enforcing governance policies for API access and operations.
"""

import logging
import json
import os
import time
import uuid
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class APIPolicyEngine:
    """
    Policy engine for the API Governance Framework.
    
    Enforces governance policies for API access and operations,
    ensuring compliance with organizational requirements.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the API Policy Engine with the specified configuration.
        
        Args:
            config_path: Path to the configuration file
        """
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing API Policy Engine")
        
        # Load configuration
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        # Initialize policy store
        self.policy_store = {}
        
        # Initialize policy evaluation cache
        self.evaluation_cache = {}
        
        # Initialize policy directories
        os.makedirs(self.config.get('policy_directory', 'config/api_policies'), exist_ok=True)
        
        # Load policies from disk
        self._load_policies()
        
        self.logger.info("API Policy Engine initialized")
    
    def load_policy(self, policy_data: Dict[str, Any]) -> str:
        """
        Load a policy into the policy engine.
        
        Args:
            policy_data: Policy data to load
            
        Returns:
            str: Policy ID
        """
        self.logger.info(f"Loading policy: {policy_data.get('name')}")
        
        # Generate policy ID if not provided
        policy_id = policy_data.get('id', str(uuid.uuid4()))
        
        # Add timestamp
        policy_data['loaded_timestamp'] = time.time()
        policy_data['id'] = policy_id
        
        # Validate policy
        validation_result = self._validate_policy(policy_data)
        if not validation_result['valid']:
            self.logger.error(f"Policy validation failed: {validation_result['errors']}")
            return ""
        
        # Add to policy store
        self.policy_store[policy_id] = policy_data
        
        # Save policy to disk
        self._save_policy(policy_id, policy_data)
        
        # Clear evaluation cache
        self.evaluation_cache = {}
        
        return policy_id
    
    def unload_policy(self, policy_id: str) -> bool:
        """
        Unload a policy from the policy engine.
        
        Args:
            policy_id: ID of the policy to unload
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Unloading policy: {policy_id}")
        
        # Check if policy exists
        if policy_id not in self.policy_store:
            self.logger.error(f"Policy not found: {policy_id}")
            return False
        
        # Remove from policy store
        del self.policy_store[policy_id]
        
        # Remove from disk
        policy_path = os.path.join(
            self.config.get('policy_directory', 'config/api_policies'),
            f"{policy_id}.json"
        )
        if os.path.exists(policy_path):
            os.remove(policy_path)
        
        # Clear evaluation cache
        self.evaluation_cache = {}
        
        return True
    
    def get_policy(self, policy_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a policy from the policy engine.
        
        Args:
            policy_id: ID of the policy to retrieve
            
        Returns:
            dict: Policy data or None if not found
        """
        self.logger.info(f"Getting policy: {policy_id}")
        
        # Check if policy exists
        if policy_id not in self.policy_store:
            self.logger.error(f"Policy not found: {policy_id}")
            return None
        
        return self.policy_store[policy_id]
    
    def list_policies(self, filter_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List policies in the policy engine, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the policies by
            
        Returns:
            list: List of policy data
        """
        self.logger.info("Listing policies")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for policy_id, policy_data in self.policy_store.items():
                match = True
                for key, value in filter_params.items():
                    if key not in policy_data or policy_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(policy_data)
        else:
            result = list(self.policy_store.values())
        
        return result
    
    def evaluate_request(self, request_context: Dict[str, Any]) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Evaluate a request against applicable policies.
        
        Args:
            request_context: Context of the request to evaluate
            
        Returns:
            tuple: (allowed, violations)
        """
        self.logger.info(f"Evaluating request: {request_context.get('operation')} on {request_context.get('api_id')}")
        
        # Generate cache key
        cache_key = self._generate_cache_key(request_context)
        
        # Check cache
        if cache_key in self.evaluation_cache:
            return self.evaluation_cache[cache_key]
        
        # Find applicable policies
        applicable_policies = self._find_applicable_policies(request_context)
        
        # If no policies apply, allow by default
        if not applicable_policies:
            self.logger.info("No applicable policies found, allowing request")
            result = (True, [])
            self.evaluation_cache[cache_key] = result
            return result
        
        # Evaluate each policy
        violations = []
        for policy in applicable_policies:
            policy_result = self._evaluate_policy(policy, request_context)
            if not policy_result['allowed']:
                violations.append({
                    'policy_id': policy['id'],
                    'policy_name': policy.get('name', 'Unknown'),
                    'reason': policy_result['reason']
                })
        
        # Request is allowed if there are no violations
        allowed = len(violations) == 0
        
        # Cache result
        result = (allowed, violations)
        self.evaluation_cache[cache_key] = result
        
        return result
    
    def _load_policies(self):
        """Load policies from disk."""
        policy_directory = self.config.get('policy_directory', 'config/api_policies')
        if not os.path.exists(policy_directory):
            return
        
        for filename in os.listdir(policy_directory):
            if filename.endswith('.json'):
                policy_path = os.path.join(policy_directory, filename)
                try:
                    with open(policy_path, 'r') as f:
                        policy_data = json.load(f)
                    
                    # Validate policy
                    validation_result = self._validate_policy(policy_data)
                    if validation_result['valid']:
                        policy_id = policy_data.get('id')
                        if policy_id:
                            self.policy_store[policy_id] = policy_data
                    else:
                        self.logger.error(f"Policy validation failed for {filename}: {validation_result['errors']}")
                except Exception as e:
                    self.logger.error(f"Error loading policy from {filename}: {str(e)}")
    
    def _save_policy(self, policy_id: str, policy_data: Dict[str, Any]):
        """
        Save a policy to disk.
        
        Args:
            policy_id: ID of the policy
            policy_data: Policy data to save
        """
        policy_directory = self.config.get('policy_directory', 'config/api_policies')
        os.makedirs(policy_directory, exist_ok=True)
        
        policy_path = os.path.join(policy_directory, f"{policy_id}.json")
        with open(policy_path, 'w') as f:
            json.dump(policy_data, f, indent=2)
    
    def _validate_policy(self, policy_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate a policy.
        
        Args:
            policy_data: Policy data to validate
            
        Returns:
            dict: Validation result
        """
        errors = []
        
        # Check required fields
        required_fields = ['name', 'version', 'type', 'rules']
        for field in required_fields:
            if field not in policy_data:
                errors.append(f"Missing required field: {field}")
        
        # Check policy type
        valid_types = ['rate_limit', 'time_restriction', 'operation_restriction', 'scope_restriction', 'composite']
        if 'type' in policy_data and policy_data['type'] not in valid_types:
            errors.append(f"Invalid policy type: {policy_data['type']}")
        
        # Check rules
        if 'rules' in policy_data:
            rules = policy_data['rules']
            if not isinstance(rules, list):
                errors.append("Rules must be a list")
            else:
                for i, rule in enumerate(rules):
                    if not isinstance(rule, dict):
                        errors.append(f"Rule {i} must be an object")
                    elif 'condition' not in rule:
                        errors.append(f"Rule {i} missing required field: condition")
                    elif 'effect' not in rule:
                        errors.append(f"Rule {i} missing required field: effect")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def _generate_cache_key(self, request_context: Dict[str, Any]) -> str:
        """
        Generate a cache key for a request context.
        
        Args:
            request_context: Request context
            
        Returns:
            str: Cache key
        """
        # Extract relevant fields for cache key
        key_fields = {
            'api_id': request_context.get('api_id', ''),
            'operation': request_context.get('operation', ''),
            'developer_id': request_context.get('developer_id', ''),
            'application_id': request_context.get('application_id', '')
        }
        
        # Generate key
        return json.dumps(key_fields, sort_keys=True)
    
    def _find_applicable_policies(self, request_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find policies applicable to a request context.
        
        Args:
            request_context: Request context
            
        Returns:
            list: Applicable policies
        """
        applicable_policies = []
        
        api_id = request_context.get('api_id')
        operation = request_context.get('operation')
        
        for policy_id, policy in self.policy_store.items():
            # Skip inactive policies
            if policy.get('status') != 'active':
                continue
            
            # Check if policy applies to this API
            applicable_apis = policy.get('applicable_apis', [])
            if not applicable_apis or api_id in applicable_apis or '*' in applicable_apis:
                # Check if policy applies to this operation
                applicable_operations = policy.get('applicable_operations', [])
                if not applicable_operations or operation in applicable_operations or '*' in applicable_operations:
                    applicable_policies.append(policy)
        
        return applicable_policies
    
    def _evaluate_policy(self, policy: Dict[str, Any], request_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a policy against a request context.
        
        Args:
            policy: Policy to evaluate
            request_context: Request context
            
        Returns:
            dict: Evaluation result
        """
        policy_type = policy.get('type')
        
        # Evaluate based on policy type
        if policy_type == 'rate_limit':
            return self._evaluate_rate_limit_policy(policy, request_context)
        elif policy_type == 'time_restriction':
            return self._evaluate_time_restriction_policy(policy, request_context)
        elif policy_type == 'operation_restriction':
            return self._evaluate_operation_restriction_policy(policy, request_context)
        elif policy_type == 'scope_restriction':
            return self._evaluate_scope_restriction_policy(policy, request_context)
        elif policy_type == 'composite':
            return self._evaluate_composite_policy(policy, request_context)
        else:
            return {
                'allowed': True,
                'reason': f"Unknown policy type: {policy_type}"
            }
    
    def _evaluate_rate_limit_policy(self, policy: Dict[str, Any], request_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a rate limit policy.
        
        Args:
            policy: Policy to evaluate
            request_context: Request context
            
        Returns:
            dict: Evaluation result
        """
        # Extract rate limit parameters
        rate_limit = policy.get('rate_limit', {})
        limit = rate_limit.get('limit', 0)
        window = rate_limit.get('window', 3600)  # Default: 1 hour
        
        # Extract request metrics
        application_id = request_context.get('application_id')
        api_calls = request_context.get('metrics', {}).get('api_calls', 0)
        
        # Check if rate limit is exceeded
        if api_calls >= limit:
            return {
                'allowed': False,
                'reason': f"Rate limit exceeded: {api_calls}/{limit} in {window}s window"
            }
        
        return {
            'allowed': True,
            'reason': ""
        }
    
    def _evaluate_time_restriction_policy(self, policy: Dict[str, Any], request_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a time restriction policy.
        
        Args:
            policy: Policy to evaluate
            request_context: Request context
            
        Returns:
            dict: Evaluation result
        """
        # Extract time restriction parameters
        time_restrictions = policy.get('time_restrictions', [])
        
        # If no restrictions, allow
        if not time_restrictions:
            return {
                'allowed': True,
                'reason': ""
            }
        
        # Get current time
        current_time = time.time()
        
        # Check if current time is within any allowed window
        for window in time_restrictions:
            start_time = window.get('start', 0)
            end_time = window.get('end', 0)
            
            if start_time <= current_time <= end_time:
                return {
                    'allowed': True,
                    'reason': ""
                }
        
        return {
            'allowed': False,
            'reason': "Operation not allowed at current time"
        }
    
    def _evaluate_operation_restriction_policy(self, policy: Dict[str, Any], request_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate an operation restriction policy.
        
        Args:
            policy: Policy to evaluate
            request_context: Request context
            
        Returns:
            dict: Evaluation result
        """
        # Extract operation restriction parameters
        restricted_operations = policy.get('restricted_operations', [])
        
        # If no restrictions, allow
        if not restricted_operations:
            return {
                'allowed': True,
                'reason': ""
            }
        
        # Get operation
        operation = request_context.get('operation', '')
        
        # Check if operation is restricted
        if operation in restricted_operations:
            return {
                'allowed': False,
                'reason': f"Operation restricted: {operation}"
            }
        
        return {
            'allowed': True,
            'reason': ""
        }
    
    def _evaluate_scope_restriction_policy(self, policy: Dict[str, Any], request_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a scope restriction policy.
        
        Args:
            policy: Policy to evaluate
            request_context: Request context
            
        Returns:
            dict: Evaluation result
        """
        # Extract scope restriction parameters
        required_scopes = policy.get('required_scopes', [])
        
        # If no required scopes, allow
        if not required_scopes:
            return {
                'allowed': True,
                'reason': ""
            }
        
        # Get token scopes
        token_scopes = request_context.get('token_data', {}).get('scope', [])
        
        # Check if token has all required scopes
        for scope in required_scopes:
            if scope not in token_scopes and '*' not in token_scopes:
                return {
                    'allowed': False,
                    'reason': f"Missing required scope: {scope}"
                }
        
        return {
            'allowed': True,
            'reason': ""
        }
    
    def _evaluate_composite_policy(self, policy: Dict[str, Any], request_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a composite policy.
        
        Args:
            policy: Policy to evaluate
            request_context: Request context
            
        Returns:
            dict: Evaluation result
        """
        # Extract composite policy parameters
        rules = policy.get('rules', [])
        
        # If no rules, allow
        if not rules:
            return {
                'allowed': True,
                'reason': ""
            }
        
        # Evaluate each rule
        for rule in rules:
            condition = rule.get('condition', {})
            effect = rule.get('effect', 'allow')
            
            # Check if condition matches
            if self._evaluate_condition(condition, request_context):
                return {
                    'allowed': effect == 'allow',
                    'reason': rule.get('reason', "")
                }
        
        # Default to allow if no rules match
        return {
            'allowed': True,
            'reason': ""
        }
    
    def _evaluate_condition(self, condition: Dict[str, Any], request_context: Dict[str, Any]) -> bool:
        """
        Evaluate a condition against a request context.
        
        Args:
            condition: Condition to evaluate
            request_context: Request context
            
        Returns:
            bool: True if condition matches
        """
        # Extract condition parameters
        operator = condition.get('operator', 'eq')
        path = condition.get('path', '')
        value = condition.get('value')
        
        # Get context value
        context_value = self._get_context_value(path, request_context)
        
        # Evaluate based on operator
        if operator == 'eq':
            return context_value == value
        elif operator == 'ne':
            return context_value != value
        elif operator == 'gt':
            return context_value > value
        elif operator == 'lt':
            return context_value < value
        elif operator == 'gte':
            return context_value >= value
        elif operator == 'lte':
            return context_value <= value
        elif operator == 'in':
            return context_value in value
        elif operator == 'contains':
            return value in context_value
        elif operator == 'startswith':
            return context_value.startswith(value)
        elif operator == 'endswith':
            return context_value.endswith(value)
        else:
            return False
    
    def _get_context_value(self, path: str, request_context: Dict[str, Any]) -> Any:
        """
        Get a value from the request context using a path.
        
        Args:
            path: Path to the value
            request_context: Request context
            
        Returns:
            any: Value at the path
        """
        # Split path into parts
        parts = path.split('.')
        
        # Start with the full context
        value = request_context
        
        # Traverse the path
        for part in parts:
            if isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return None
        
        return value
