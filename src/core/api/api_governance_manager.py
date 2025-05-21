"""
API Governance Manager for Promethios.

This module provides the central management component for the API Governance Framework,
coordinating API access, policy enforcement, and compliance monitoring.
"""

import logging
import json
import os
import time
import uuid
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class APIGovernanceManager:
    """
    Central manager for the API Governance Framework.
    
    Coordinates API access, policy enforcement, and compliance monitoring
    for third-party developer access to Promethios.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the API Governance Manager with the specified configuration.
        
        Args:
            config_path: Path to the configuration file
        """
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing API Governance Manager")
        
        # Load configuration
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        # Initialize component registries
        self.api_registry = {}
        self.policy_registry = {}
        self.developer_registry = {}
        self.application_registry = {}
        self.token_registry = {}
        self.audit_log = []
        
        # Initialize directories
        os.makedirs(self.config.get('audit_log_directory', 'logs/api_audit'), exist_ok=True)
        os.makedirs(self.config.get('policy_directory', 'config/api_policies'), exist_ok=True)
        
        # Load registries from disk if they exist
        self._load_registries()
        
        # Initialize policy engine
        self._initialize_policy_engine()
        
        # Initialize compliance monitor
        self._initialize_compliance_monitor()
        
        self.logger.info("API Governance Manager initialized")
    
    def register_api(self, api_data: Dict[str, Any]) -> str:
        """
        Register a new API with the governance framework.
        
        Args:
            api_data: Data about the API to register
            
        Returns:
            str: API ID
        """
        self.logger.info(f"Registering API: {api_data.get('name')}")
        
        # Generate API ID
        api_id = str(uuid.uuid4())
        
        # Add timestamp
        api_data['registration_timestamp'] = time.time()
        api_data['last_updated_timestamp'] = time.time()
        api_data['id'] = api_id
        
        # Set default status
        api_data['status'] = api_data.get('status', 'pending_approval')
        
        # Add to registry
        self.api_registry[api_id] = api_data
        
        # Save registry
        self._save_registries()
        
        # Log action
        self._log_audit_event('api_registered', {
            'api_id': api_id,
            'api_name': api_data.get('name'),
            'api_version': api_data.get('version'),
            'status': api_data.get('status')
        })
        
        return api_id
    
    def update_api(self, api_id: str, api_data: Dict[str, Any]) -> bool:
        """
        Update an existing API in the governance framework.
        
        Args:
            api_id: ID of the API to update
            api_data: Updated API data
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Updating API: {api_id}")
        
        # Check if API exists
        if api_id not in self.api_registry:
            self.logger.error(f"API not found: {api_id}")
            return False
        
        # Update timestamp
        api_data['last_updated_timestamp'] = time.time()
        
        # Preserve ID and registration timestamp
        api_data['id'] = api_id
        api_data['registration_timestamp'] = self.api_registry[api_id]['registration_timestamp']
        
        # Update registry
        self.api_registry[api_id] = api_data
        
        # Save registry
        self._save_registries()
        
        # Log action
        self._log_audit_event('api_updated', {
            'api_id': api_id,
            'api_name': api_data.get('name'),
            'api_version': api_data.get('version'),
            'status': api_data.get('status')
        })
        
        return True
    
    def get_api(self, api_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered API.
        
        Args:
            api_id: ID of the API to retrieve
            
        Returns:
            dict: API data or None if not found
        """
        self.logger.info(f"Getting API: {api_id}")
        
        # Check if API exists
        if api_id not in self.api_registry:
            self.logger.error(f"API not found: {api_id}")
            return None
        
        # Log action
        self._log_audit_event('api_accessed', {
            'api_id': api_id
        })
        
        return self.api_registry[api_id]
    
    def list_apis(self, filter_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List registered APIs, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the APIs by
            
        Returns:
            list: List of API data
        """
        self.logger.info("Listing APIs")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for api_id, api_data in self.api_registry.items():
                match = True
                for key, value in filter_params.items():
                    if key not in api_data or api_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(api_data)
        else:
            result = list(self.api_registry.values())
        
        # Log action
        self._log_audit_event('apis_listed', {
            'filter_params': filter_params,
            'count': len(result)
        })
        
        return result
    
    def register_policy(self, policy_data: Dict[str, Any]) -> str:
        """
        Register a new API governance policy.
        
        Args:
            policy_data: Data about the policy to register
            
        Returns:
            str: Policy ID
        """
        self.logger.info(f"Registering policy: {policy_data.get('name')}")
        
        # Generate policy ID
        policy_id = str(uuid.uuid4())
        
        # Add timestamp
        policy_data['registration_timestamp'] = time.time()
        policy_data['last_updated_timestamp'] = time.time()
        policy_data['id'] = policy_id
        
        # Set default status
        policy_data['status'] = policy_data.get('status', 'active')
        
        # Add to registry
        self.policy_registry[policy_id] = policy_data
        
        # Save registry
        self._save_registries()
        
        # Log action
        self._log_audit_event('policy_registered', {
            'policy_id': policy_id,
            'policy_name': policy_data.get('name'),
            'policy_version': policy_data.get('version'),
            'status': policy_data.get('status')
        })
        
        return policy_id
    
    def update_policy(self, policy_id: str, policy_data: Dict[str, Any]) -> bool:
        """
        Update an existing API governance policy.
        
        Args:
            policy_id: ID of the policy to update
            policy_data: Updated policy data
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Updating policy: {policy_id}")
        
        # Check if policy exists
        if policy_id not in self.policy_registry:
            self.logger.error(f"Policy not found: {policy_id}")
            return False
        
        # Update timestamp
        policy_data['last_updated_timestamp'] = time.time()
        
        # Preserve ID and registration timestamp
        policy_data['id'] = policy_id
        policy_data['registration_timestamp'] = self.policy_registry[policy_id]['registration_timestamp']
        
        # Update registry
        self.policy_registry[policy_id] = policy_data
        
        # Save registry
        self._save_registries()
        
        # Log action
        self._log_audit_event('policy_updated', {
            'policy_id': policy_id,
            'policy_name': policy_data.get('name'),
            'policy_version': policy_data.get('version'),
            'status': policy_data.get('status')
        })
        
        return True
    
    def get_policy(self, policy_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered policy.
        
        Args:
            policy_id: ID of the policy to retrieve
            
        Returns:
            dict: Policy data or None if not found
        """
        self.logger.info(f"Getting policy: {policy_id}")
        
        # Check if policy exists
        if policy_id not in self.policy_registry:
            self.logger.error(f"Policy not found: {policy_id}")
            return None
        
        # Log action
        self._log_audit_event('policy_accessed', {
            'policy_id': policy_id
        })
        
        return self.policy_registry[policy_id]
    
    def list_policies(self, filter_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List registered policies, optionally filtered by parameters.
        
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
            for policy_id, policy_data in self.policy_registry.items():
                match = True
                for key, value in filter_params.items():
                    if key not in policy_data or policy_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(policy_data)
        else:
            result = list(self.policy_registry.values())
        
        # Log action
        self._log_audit_event('policies_listed', {
            'filter_params': filter_params,
            'count': len(result)
        })
        
        return result
    
    def register_developer(self, developer_data: Dict[str, Any]) -> str:
        """
        Register a new developer with the governance framework.
        
        Args:
            developer_data: Data about the developer to register
            
        Returns:
            str: Developer ID
        """
        self.logger.info(f"Registering developer: {developer_data.get('name')}")
        
        # Generate developer ID
        developer_id = str(uuid.uuid4())
        
        # Add timestamp
        developer_data['registration_timestamp'] = time.time()
        developer_data['last_updated_timestamp'] = time.time()
        developer_data['id'] = developer_id
        
        # Set default status
        developer_data['status'] = developer_data.get('status', 'pending_approval')
        
        # Initialize developer metrics
        developer_data['metrics'] = developer_data.get('metrics', {
            'api_calls': 0,
            'policy_violations': 0,
            'last_activity': time.time()
        })
        
        # Add to registry
        self.developer_registry[developer_id] = developer_data
        
        # Save registry
        self._save_registries()
        
        # Log action
        self._log_audit_event('developer_registered', {
            'developer_id': developer_id,
            'developer_name': developer_data.get('name'),
            'developer_email': developer_data.get('email'),
            'status': developer_data.get('status')
        })
        
        return developer_id
    
    def update_developer(self, developer_id: str, developer_data: Dict[str, Any]) -> bool:
        """
        Update an existing developer in the governance framework.
        
        Args:
            developer_id: ID of the developer to update
            developer_data: Updated developer data
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Updating developer: {developer_id}")
        
        # Check if developer exists
        if developer_id not in self.developer_registry:
            self.logger.error(f"Developer not found: {developer_id}")
            return False
        
        # Update timestamp
        developer_data['last_updated_timestamp'] = time.time()
        
        # Preserve ID, registration timestamp, and metrics
        developer_data['id'] = developer_id
        developer_data['registration_timestamp'] = self.developer_registry[developer_id]['registration_timestamp']
        developer_data['metrics'] = developer_data.get('metrics', self.developer_registry[developer_id]['metrics'])
        
        # Update registry
        self.developer_registry[developer_id] = developer_data
        
        # Save registry
        self._save_registries()
        
        # Log action
        self._log_audit_event('developer_updated', {
            'developer_id': developer_id,
            'developer_name': developer_data.get('name'),
            'developer_email': developer_data.get('email'),
            'status': developer_data.get('status')
        })
        
        return True
    
    def get_developer(self, developer_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered developer.
        
        Args:
            developer_id: ID of the developer to retrieve
            
        Returns:
            dict: Developer data or None if not found
        """
        self.logger.info(f"Getting developer: {developer_id}")
        
        # Check if developer exists
        if developer_id not in self.developer_registry:
            self.logger.error(f"Developer not found: {developer_id}")
            return None
        
        # Log action
        self._log_audit_event('developer_accessed', {
            'developer_id': developer_id
        })
        
        return self.developer_registry[developer_id]
    
    def list_developers(self, filter_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List registered developers, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the developers by
            
        Returns:
            list: List of developer data
        """
        self.logger.info("Listing developers")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for developer_id, developer_data in self.developer_registry.items():
                match = True
                for key, value in filter_params.items():
                    if key not in developer_data or developer_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(developer_data)
        else:
            result = list(self.developer_registry.values())
        
        # Log action
        self._log_audit_event('developers_listed', {
            'filter_params': filter_params,
            'count': len(result)
        })
        
        return result
    
    def register_application(self, application_data: Dict[str, Any]) -> str:
        """
        Register a new application with the governance framework.
        
        Args:
            application_data: Data about the application to register
            
        Returns:
            str: Application ID
        """
        self.logger.info(f"Registering application: {application_data.get('name')}")
        
        # Check if developer exists
        developer_id = application_data.get('developer_id')
        if developer_id not in self.developer_registry:
            self.logger.error(f"Developer not found: {developer_id}")
            return ""
        
        # Generate application ID
        application_id = str(uuid.uuid4())
        
        # Add timestamp
        application_data['registration_timestamp'] = time.time()
        application_data['last_updated_timestamp'] = time.time()
        application_data['id'] = application_id
        
        # Set default status
        application_data['status'] = application_data.get('status', 'pending_approval')
        
        # Initialize application metrics
        application_data['metrics'] = application_data.get('metrics', {
            'api_calls': 0,
            'policy_violations': 0,
            'last_activity': time.time()
        })
        
        # Add to registry
        self.application_registry[application_id] = application_data
        
        # Save registry
        self._save_registries()
        
        # Log action
        self._log_audit_event('application_registered', {
            'application_id': application_id,
            'application_name': application_data.get('name'),
            'developer_id': developer_id,
            'status': application_data.get('status')
        })
        
        return application_id
    
    def update_application(self, application_id: str, application_data: Dict[str, Any]) -> bool:
        """
        Update an existing application in the governance framework.
        
        Args:
            application_id: ID of the application to update
            application_data: Updated application data
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Updating application: {application_id}")
        
        # Check if application exists
        if application_id not in self.application_registry:
            self.logger.error(f"Application not found: {application_id}")
            return False
        
        # Update timestamp
        application_data['last_updated_timestamp'] = time.time()
        
        # Preserve ID, registration timestamp, and metrics
        application_data['id'] = application_id
        application_data['registration_timestamp'] = self.application_registry[application_id]['registration_timestamp']
        application_data['metrics'] = application_data.get('metrics', self.application_registry[application_id]['metrics'])
        
        # Update registry
        self.application_registry[application_id] = application_data
        
        # Save registry
        self._save_registries()
        
        # Log action
        self._log_audit_event('application_updated', {
            'application_id': application_id,
            'application_name': application_data.get('name'),
            'developer_id': application_data.get('developer_id'),
            'status': application_data.get('status')
        })
        
        return True
    
    def get_application(self, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered application.
        
        Args:
            application_id: ID of the application to retrieve
            
        Returns:
            dict: Application data or None if not found
        """
        self.logger.info(f"Getting application: {application_id}")
        
        # Check if application exists
        if application_id not in self.application_registry:
            self.logger.error(f"Application not found: {application_id}")
            return None
        
        # Log action
        self._log_audit_event('application_accessed', {
            'application_id': application_id
        })
        
        return self.application_registry[application_id]
    
    def list_applications(self, filter_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List registered applications, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the applications by
            
        Returns:
            list: List of application data
        """
        self.logger.info("Listing applications")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for application_id, application_data in self.application_registry.items():
                match = True
                for key, value in filter_params.items():
                    if key not in application_data or application_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(application_data)
        else:
            result = list(self.application_registry.values())
        
        # Log action
        self._log_audit_event('applications_listed', {
            'filter_params': filter_params,
            'count': len(result)
        })
        
        return result
    
    def issue_token(self, application_id: str, scope: List[str], expiration: int = 3600) -> Optional[Dict[str, Any]]:
        """
        Issue an API access token for an application.
        
        Args:
            application_id: ID of the application to issue a token for
            scope: List of API scopes the token is valid for
            expiration: Token expiration time in seconds
            
        Returns:
            dict: Token data or None if failed
        """
        self.logger.info(f"Issuing token for application: {application_id}")
        
        # Check if application exists
        if application_id not in self.application_registry:
            self.logger.error(f"Application not found: {application_id}")
            return None
        
        # Check if application is approved
        application = self.application_registry[application_id]
        if application['status'] != 'approved':
            self.logger.error(f"Application not approved: {application_id}")
            return None
        
        # Generate token ID
        token_id = str(uuid.uuid4())
        
        # Generate token value
        token_value = str(uuid.uuid4()) + str(uuid.uuid4())
        
        # Create token data
        token_data = {
            'id': token_id,
            'token': token_value,
            'application_id': application_id,
            'developer_id': application['developer_id'],
            'scope': scope,
            'issued_at': time.time(),
            'expires_at': time.time() + expiration,
            'status': 'active'
        }
        
        # Add to registry
        self.token_registry[token_id] = token_data
        
        # Save registry
        self._save_registries()
        
        # Log action
        self._log_audit_event('token_issued', {
            'token_id': token_id,
            'application_id': application_id,
            'developer_id': application['developer_id'],
            'scope': scope,
            'expiration': expiration
        })
        
        return token_data
    
    def revoke_token(self, token_id: str) -> bool:
        """
        Revoke an API access token.
        
        Args:
            token_id: ID of the token to revoke
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Revoking token: {token_id}")
        
        # Check if token exists
        if token_id not in self.token_registry:
            self.logger.error(f"Token not found: {token_id}")
            return False
        
        # Update token status
        self.token_registry[token_id]['status'] = 'revoked'
        
        # Save registry
        self._save_registries()
        
        # Log action
        self._log_audit_event('token_revoked', {
            'token_id': token_id,
            'application_id': self.token_registry[token_id]['application_id'],
            'developer_id': self.token_registry[token_id]['developer_id']
        })
        
        return True
    
    def validate_token(self, token_value: str, api_id: str, operation: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Validate an API access token for a specific API operation.
        
        Args:
            token_value: Token value to validate
            api_id: ID of the API being accessed
            operation: Operation being performed
            
        Returns:
            tuple: (is_valid, token_data)
        """
        self.logger.info(f"Validating token for API: {api_id}, operation: {operation}")
        
        # Find token by value
        token_data = None
        for token_id, data in self.token_registry.items():
            if data['token'] == token_value:
                token_data = data
                break
        
        # Check if token exists
        if not token_data:
            self.logger.error("Token not found")
            return False, None
        
        # Check if token is active
        if token_data['status'] != 'active':
            self.logger.error(f"Token not active: {token_data['id']}")
            return False, None
        
        # Check if token is expired
        if token_data['expires_at'] < time.time():
            self.logger.error(f"Token expired: {token_data['id']}")
            return False, None
        
        # Check if API exists
        if api_id not in self.api_registry:
            self.logger.error(f"API not found: {api_id}")
            return False, None
        
        # Check if API is active
        api_data = self.api_registry[api_id]
        if api_data['status'] != 'active':
            self.logger.error(f"API not active: {api_id}")
            return False, None
        
        # Check if operation is allowed for this API
        if operation not in api_data.get('operations', []):
            self.logger.error(f"Operation not allowed: {operation}")
            return False, None
        
        # Check if token scope includes this API
        if api_id not in token_data['scope'] and '*' not in token_data['scope']:
            self.logger.error(f"API not in token scope: {api_id}")
            return False, None
        
        # Check if application is still approved
        application_id = token_data['application_id']
        if application_id not in self.application_registry:
            self.logger.error(f"Application not found: {application_id}")
            return False, None
        
        application = self.application_registry[application_id]
        if application['status'] != 'approved':
            self.logger.error(f"Application not approved: {application_id}")
            return False, None
        
        # Check if developer is still approved
        developer_id = token_data['developer_id']
        if developer_id not in self.developer_registry:
            self.logger.error(f"Developer not found: {developer_id}")
            return False, None
        
        developer = self.developer_registry[developer_id]
        if developer['status'] != 'approved':
            self.logger.error(f"Developer not approved: {developer_id}")
            return False, None
        
        # Check policy compliance
        is_compliant, violations = self._check_policy_compliance(token_data, api_data, operation)
        if not is_compliant:
            self.logger.error(f"Policy violations: {violations}")
            
            # Update metrics
            self._update_metrics(developer_id, application_id, 'policy_violations')
            
            # Log violations
            self._log_audit_event('policy_violations', {
                'token_id': token_data['id'],
                'application_id': application_id,
                'developer_id': developer_id,
                'api_id': api_id,
                'operation': operation,
                'violations': violations
            })
            
            return False, None
        
        # Update metrics
        self._update_metrics(developer_id, application_id, 'api_calls')
        
        # Log successful validation
        self._log_audit_event('token_validated', {
            'token_id': token_data['id'],
            'application_id': application_id,
            'developer_id': developer_id,
            'api_id': api_id,
            'operation': operation
        })
        
        return True, token_data
    
    def get_audit_log(self, filter_params: Dict[str, Any] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get the API governance audit log, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the log entries by
            limit: Maximum number of entries to return
            
        Returns:
            list: List of audit log entries
        """
        self.logger.info("Getting audit log")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for entry in self.audit_log:
                match = True
                for key, value in filter_params.items():
                    if key not in entry or entry[key] != value:
                        match = False
                        break
                if match:
                    result.append(entry)
        else:
            result = self.audit_log.copy()
        
        # Sort by timestamp (newest first)
        result.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Apply limit
        result = result[:limit]
        
        return result
    
    def generate_compliance_report(self, report_type: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a compliance report for the API governance framework.
        
        Args:
            report_type: Type of report to generate
            params: Parameters for the report
            
        Returns:
            dict: Report data
        """
        self.logger.info(f"Generating compliance report: {report_type}")
        
        # Initialize report
        report = {
            'type': report_type,
            'timestamp': time.time(),
            'params': params or {},
            'data': {}
        }
        
        # Generate report based on type
        if report_type == 'policy_compliance':
            report['data'] = self._generate_policy_compliance_report(params)
        elif report_type == 'developer_activity':
            report['data'] = self._generate_developer_activity_report(params)
        elif report_type == 'api_usage':
            report['data'] = self._generate_api_usage_report(params)
        elif report_type == 'security_audit':
            report['data'] = self._generate_security_audit_report(params)
        else:
            self.logger.error(f"Unknown report type: {report_type}")
            return {}
        
        # Log action
        self._log_audit_event('compliance_report_generated', {
            'report_type': report_type,
            'params': params
        })
        
        return report
    
    def _load_registries(self):
        """Load registries from disk if they exist."""
        # API registry
        api_registry_path = self.config.get('api_registry_path', 'config/api_registry.json')
        if os.path.exists(api_registry_path):
            with open(api_registry_path, 'r') as f:
                self.api_registry = json.load(f)
        
        # Policy registry
        policy_registry_path = self.config.get('policy_registry_path', 'config/policy_registry.json')
        if os.path.exists(policy_registry_path):
            with open(policy_registry_path, 'r') as f:
                self.policy_registry = json.load(f)
        
        # Developer registry
        developer_registry_path = self.config.get('developer_registry_path', 'config/developer_registry.json')
        if os.path.exists(developer_registry_path):
            with open(developer_registry_path, 'r') as f:
                self.developer_registry = json.load(f)
        
        # Application registry
        application_registry_path = self.config.get('application_registry_path', 'config/application_registry.json')
        if os.path.exists(application_registry_path):
            with open(application_registry_path, 'r') as f:
                self.application_registry = json.load(f)
        
        # Token registry
        token_registry_path = self.config.get('token_registry_path', 'config/token_registry.json')
        if os.path.exists(token_registry_path):
            with open(token_registry_path, 'r') as f:
                self.token_registry = json.load(f)
        
        # Audit log
        audit_log_path = self.config.get('audit_log_path', 'logs/api_audit/audit_log.json')
        if os.path.exists(audit_log_path):
            with open(audit_log_path, 'r') as f:
                self.audit_log = json.load(f)
    
    def _save_registries(self):
        """Save registries to disk."""
        # API registry
        api_registry_path = self.config.get('api_registry_path', 'config/api_registry.json')
        os.makedirs(os.path.dirname(api_registry_path), exist_ok=True)
        with open(api_registry_path, 'w') as f:
            json.dump(self.api_registry, f, indent=2)
        
        # Policy registry
        policy_registry_path = self.config.get('policy_registry_path', 'config/policy_registry.json')
        os.makedirs(os.path.dirname(policy_registry_path), exist_ok=True)
        with open(policy_registry_path, 'w') as f:
            json.dump(self.policy_registry, f, indent=2)
        
        # Developer registry
        developer_registry_path = self.config.get('developer_registry_path', 'config/developer_registry.json')
        os.makedirs(os.path.dirname(developer_registry_path), exist_ok=True)
        with open(developer_registry_path, 'w') as f:
            json.dump(self.developer_registry, f, indent=2)
        
        # Application registry
        application_registry_path = self.config.get('application_registry_path', 'config/application_registry.json')
        os.makedirs(os.path.dirname(application_registry_path), exist_ok=True)
        with open(application_registry_path, 'w') as f:
            json.dump(self.application_registry, f, indent=2)
        
        # Token registry
        token_registry_path = self.config.get('token_registry_path', 'config/token_registry.json')
        os.makedirs(os.path.dirname(token_registry_path), exist_ok=True)
        with open(token_registry_path, 'w') as f:
            json.dump(self.token_registry, f, indent=2)
        
        # Audit log
        audit_log_path = self.config.get('audit_log_path', 'logs/api_audit/audit_log.json')
        os.makedirs(os.path.dirname(audit_log_path), exist_ok=True)
        with open(audit_log_path, 'w') as f:
            json.dump(self.audit_log, f, indent=2)
    
    def _initialize_policy_engine(self):
        """Initialize the policy engine."""
        self.logger.info("Initializing policy engine")
        # In a real implementation, this would initialize a policy engine
        # For this implementation, we'll use a simple policy check in _check_policy_compliance
    
    def _initialize_compliance_monitor(self):
        """Initialize the compliance monitor."""
        self.logger.info("Initializing compliance monitor")
        # In a real implementation, this would initialize a compliance monitor
        # For this implementation, we'll use simple compliance checks in the report generation methods
    
    def _check_policy_compliance(self, token_data: Dict[str, Any], api_data: Dict[str, Any], operation: str) -> Tuple[bool, List[str]]:
        """
        Check if an API operation complies with all applicable policies.
        
        Args:
            token_data: Token data
            api_data: API data
            operation: Operation being performed
            
        Returns:
            tuple: (is_compliant, violations)
        """
        # In a real implementation, this would use a policy engine to check compliance
        # For this implementation, we'll use a simple check
        
        violations = []
        
        # Check if any policies apply to this API
        applicable_policies = []
        for policy_id, policy_data in self.policy_registry.items():
            if policy_data['status'] != 'active':
                continue
            
            if api_data['id'] in policy_data.get('applicable_apis', []) or '*' in policy_data.get('applicable_apis', []):
                applicable_policies.append(policy_data)
        
        # If no policies apply, consider it compliant
        if not applicable_policies:
            return True, []
        
        # Check each applicable policy
        for policy in applicable_policies:
            # Check rate limits
            if 'rate_limit' in policy:
                rate_limit = policy['rate_limit']
                application_id = token_data['application_id']
                developer_id = token_data['developer_id']
                
                # Get application metrics
                application = self.application_registry[application_id]
                api_calls = application['metrics']['api_calls']
                
                # Check if rate limit is exceeded
                if api_calls > rate_limit:
                    violations.append(f"Rate limit exceeded: {api_calls} > {rate_limit}")
            
            # Check time restrictions
            if 'time_restrictions' in policy:
                time_restrictions = policy['time_restrictions']
                current_time = time.time()
                
                # Check if current time is within allowed times
                is_allowed_time = False
                for time_window in time_restrictions:
                    start_time = time_window['start']
                    end_time = time_window['end']
                    
                    if start_time <= current_time <= end_time:
                        is_allowed_time = True
                        break
                
                if not is_allowed_time:
                    violations.append("Operation not allowed at current time")
            
            # Check operation restrictions
            if 'operation_restrictions' in policy:
                operation_restrictions = policy['operation_restrictions']
                
                if operation in operation_restrictions:
                    violations.append(f"Operation restricted: {operation}")
        
        # If there are any violations, the operation is not compliant
        return len(violations) == 0, violations
    
    def _update_metrics(self, developer_id: str, application_id: str, metric_type: str):
        """
        Update metrics for a developer and application.
        
        Args:
            developer_id: Developer ID
            application_id: Application ID
            metric_type: Type of metric to update
        """
        # Update developer metrics
        if developer_id in self.developer_registry:
            developer = self.developer_registry[developer_id]
            if metric_type in developer['metrics']:
                developer['metrics'][metric_type] += 1
            developer['metrics']['last_activity'] = time.time()
        
        # Update application metrics
        if application_id in self.application_registry:
            application = self.application_registry[application_id]
            if metric_type in application['metrics']:
                application['metrics'][metric_type] += 1
            application['metrics']['last_activity'] = time.time()
        
        # Save registries
        self._save_registries()
    
    def _log_audit_event(self, event_type: str, event_data: Dict[str, Any]):
        """
        Log an audit event.
        
        Args:
            event_type: Type of event
            event_data: Event data
        """
        # Create audit log entry
        entry = {
            'id': str(uuid.uuid4()),
            'timestamp': time.time(),
            'type': event_type,
            'data': event_data
        }
        
        # Add to audit log
        self.audit_log.append(entry)
        
        # Trim audit log if it gets too large
        max_entries = self.config.get('max_audit_log_entries', 10000)
        if len(self.audit_log) > max_entries:
            self.audit_log = self.audit_log[-max_entries:]
        
        # Save audit log
        audit_log_path = self.config.get('audit_log_path', 'logs/api_audit/audit_log.json')
        os.makedirs(os.path.dirname(audit_log_path), exist_ok=True)
        with open(audit_log_path, 'w') as f:
            json.dump(self.audit_log, f, indent=2)
    
    def _generate_policy_compliance_report(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a policy compliance report.
        
        Args:
            params: Report parameters
            
        Returns:
            dict: Report data
        """
        params = params or {}
        
        # Initialize report data
        report_data = {
            'total_violations': 0,
            'violations_by_policy': {},
            'violations_by_developer': {},
            'violations_by_application': {},
            'violations_by_api': {}
        }
        
        # Count violations in audit log
        for entry in self.audit_log:
            if entry['type'] == 'policy_violations':
                data = entry['data']
                violations = data.get('violations', [])
                
                # Increment total violations
                report_data['total_violations'] += len(violations)
                
                # Group by policy
                for violation in violations:
                    policy_id = violation.get('policy_id', 'unknown')
                    if policy_id not in report_data['violations_by_policy']:
                        report_data['violations_by_policy'][policy_id] = 0
                    report_data['violations_by_policy'][policy_id] += 1
                
                # Group by developer
                developer_id = data.get('developer_id', 'unknown')
                if developer_id not in report_data['violations_by_developer']:
                    report_data['violations_by_developer'][developer_id] = 0
                report_data['violations_by_developer'][developer_id] += len(violations)
                
                # Group by application
                application_id = data.get('application_id', 'unknown')
                if application_id not in report_data['violations_by_application']:
                    report_data['violations_by_application'][application_id] = 0
                report_data['violations_by_application'][application_id] += len(violations)
                
                # Group by API
                api_id = data.get('api_id', 'unknown')
                if api_id not in report_data['violations_by_api']:
                    report_data['violations_by_api'][api_id] = 0
                report_data['violations_by_api'][api_id] += len(violations)
        
        return report_data
    
    def _generate_developer_activity_report(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a developer activity report.
        
        Args:
            params: Report parameters
            
        Returns:
            dict: Report data
        """
        params = params or {}
        
        # Initialize report data
        report_data = {
            'total_developers': len(self.developer_registry),
            'active_developers': 0,
            'inactive_developers': 0,
            'new_developers': 0,
            'developer_activity': {}
        }
        
        # Calculate activity metrics
        now = time.time()
        active_threshold = now - (params.get('active_threshold', 86400 * 7))  # Default: 7 days
        new_threshold = now - (params.get('new_threshold', 86400 * 30))  # Default: 30 days
        
        for developer_id, developer in self.developer_registry.items():
            # Check if developer is active
            last_activity = developer['metrics'].get('last_activity', 0)
            is_active = last_activity > active_threshold
            
            if is_active:
                report_data['active_developers'] += 1
            else:
                report_data['inactive_developers'] += 1
            
            # Check if developer is new
            registration_timestamp = developer.get('registration_timestamp', 0)
            is_new = registration_timestamp > new_threshold
            
            if is_new:
                report_data['new_developers'] += 1
            
            # Add to developer activity
            report_data['developer_activity'][developer_id] = {
                'name': developer.get('name', 'Unknown'),
                'status': developer.get('status', 'unknown'),
                'api_calls': developer['metrics'].get('api_calls', 0),
                'policy_violations': developer['metrics'].get('policy_violations', 0),
                'last_activity': last_activity,
                'is_active': is_active,
                'is_new': is_new
            }
        
        return report_data
    
    def _generate_api_usage_report(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate an API usage report.
        
        Args:
            params: Report parameters
            
        Returns:
            dict: Report data
        """
        params = params or {}
        
        # Initialize report data
        report_data = {
            'total_apis': len(self.api_registry),
            'active_apis': 0,
            'total_calls': 0,
            'calls_by_api': {},
            'calls_by_operation': {},
            'calls_by_developer': {},
            'calls_by_application': {}
        }
        
        # Count active APIs
        for api_id, api in self.api_registry.items():
            if api.get('status') == 'active':
                report_data['active_apis'] += 1
        
        # Count API calls in audit log
        for entry in self.audit_log:
            if entry['type'] == 'token_validated':
                data = entry['data']
                
                # Increment total calls
                report_data['total_calls'] += 1
                
                # Group by API
                api_id = data.get('api_id', 'unknown')
                if api_id not in report_data['calls_by_api']:
                    report_data['calls_by_api'][api_id] = 0
                report_data['calls_by_api'][api_id] += 1
                
                # Group by operation
                operation = data.get('operation', 'unknown')
                if operation not in report_data['calls_by_operation']:
                    report_data['calls_by_operation'][operation] = 0
                report_data['calls_by_operation'][operation] += 1
                
                # Group by developer
                developer_id = data.get('developer_id', 'unknown')
                if developer_id not in report_data['calls_by_developer']:
                    report_data['calls_by_developer'][developer_id] = 0
                report_data['calls_by_developer'][developer_id] += 1
                
                # Group by application
                application_id = data.get('application_id', 'unknown')
                if application_id not in report_data['calls_by_application']:
                    report_data['calls_by_application'][application_id] = 0
                report_data['calls_by_application'][application_id] += 1
        
        return report_data
    
    def _generate_security_audit_report(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a security audit report.
        
        Args:
            params: Report parameters
            
        Returns:
            dict: Report data
        """
        params = params or {}
        
        # Initialize report data
        report_data = {
            'total_tokens': len(self.token_registry),
            'active_tokens': 0,
            'expired_tokens': 0,
            'revoked_tokens': 0,
            'token_validations': 0,
            'token_validation_failures': 0,
            'security_events': []
        }
        
        # Count token status
        now = time.time()
        for token_id, token in self.token_registry.items():
            if token.get('status') == 'active':
                if token.get('expires_at', 0) > now:
                    report_data['active_tokens'] += 1
                else:
                    report_data['expired_tokens'] += 1
            elif token.get('status') == 'revoked':
                report_data['revoked_tokens'] += 1
        
        # Count token validations and failures
        for entry in self.audit_log:
            if entry['type'] == 'token_validated':
                report_data['token_validations'] += 1
            elif entry['type'] == 'policy_violations':
                report_data['token_validation_failures'] += 1
                
                # Add to security events
                report_data['security_events'].append({
                    'timestamp': entry['timestamp'],
                    'type': 'policy_violation',
                    'data': entry['data']
                })
        
        return report_data
