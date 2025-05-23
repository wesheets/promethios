"""
API Compliance Monitor for Promethios.

This module provides compliance monitoring for the API Governance Framework,
ensuring API operations adhere to governance policies and compliance requirements.
"""

import logging
import json
import os
import time
import uuid
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class APIComplianceMonitor:
    """
    Compliance monitor for the API Governance Framework.
    
    Monitors API operations for compliance with governance policies
    and regulatory requirements, generating compliance reports and alerts.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the API Compliance Monitor with the specified configuration.
        
        Args:
            config_path: Path to the configuration file
        """
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing API Compliance Monitor")
        
        # Load configuration
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        # Initialize compliance registry
        self.compliance_registry = {}
        
        # Initialize compliance log
        self.compliance_log = []
        
        # Initialize directories
        os.makedirs(self.config.get('compliance_directory', 'logs/api_compliance'), exist_ok=True)
        
        # Load compliance registry from disk
        self._load_compliance_registry()
        
        # Load compliance log from disk
        self._load_compliance_log()
        
        # Initialize compliance frameworks
        self._initialize_compliance_frameworks()
        
        self.logger.info("API Compliance Monitor initialized")
    
    def register_compliance_framework(self, framework_data: Dict[str, Any]) -> str:
        """
        Register a compliance framework with the monitor.
        
        Args:
            framework_data: Data about the compliance framework
            
        Returns:
            str: Framework ID
        """
        self.logger.info(f"Registering compliance framework: {framework_data.get('name')}")
        
        # Generate framework ID
        framework_id = framework_data.get('id', str(uuid.uuid4()))
        
        # Add timestamp
        framework_data['registration_timestamp'] = time.time()
        framework_data['last_updated_timestamp'] = time.time()
        framework_data['id'] = framework_id
        
        # Add to registry
        self.compliance_registry[framework_id] = framework_data
        
        # Save registry
        self._save_compliance_registry()
        
        # Log action
        self._log_compliance_event('framework_registered', {
            'framework_id': framework_id,
            'framework_name': framework_data.get('name'),
            'framework_version': framework_data.get('version')
        })
        
        return framework_id
    
    def update_compliance_framework(self, framework_id: str, framework_data: Dict[str, Any]) -> bool:
        """
        Update a compliance framework in the monitor.
        
        Args:
            framework_id: ID of the framework to update
            framework_data: Updated framework data
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Updating compliance framework: {framework_id}")
        
        # Check if framework exists
        if framework_id not in self.compliance_registry:
            self.logger.error(f"Compliance framework not found: {framework_id}")
            return False
        
        # Update timestamp
        framework_data['last_updated_timestamp'] = time.time()
        
        # Preserve ID and registration timestamp
        framework_data['id'] = framework_id
        framework_data['registration_timestamp'] = self.compliance_registry[framework_id]['registration_timestamp']
        
        # Update registry
        self.compliance_registry[framework_id] = framework_data
        
        # Save registry
        self._save_compliance_registry()
        
        # Log action
        self._log_compliance_event('framework_updated', {
            'framework_id': framework_id,
            'framework_name': framework_data.get('name'),
            'framework_version': framework_data.get('version')
        })
        
        return True
    
    def get_compliance_framework(self, framework_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered compliance framework.
        
        Args:
            framework_id: ID of the framework to retrieve
            
        Returns:
            dict: Framework data or None if not found
        """
        self.logger.info(f"Getting compliance framework: {framework_id}")
        
        # Check if framework exists
        if framework_id not in self.compliance_registry:
            self.logger.error(f"Compliance framework not found: {framework_id}")
            return None
        
        return self.compliance_registry[framework_id]
    
    def list_compliance_frameworks(self, filter_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List registered compliance frameworks, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the frameworks by
            
        Returns:
            list: List of framework data
        """
        self.logger.info("Listing compliance frameworks")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for framework_id, framework_data in self.compliance_registry.items():
                match = True
                for key, value in filter_params.items():
                    if key not in framework_data or framework_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(framework_data)
        else:
            result = list(self.compliance_registry.values())
        
        return result
    
    def monitor_api_operation(self, operation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Monitor an API operation for compliance.
        
        Args:
            operation_data: Data about the API operation
            
        Returns:
            dict: Compliance result
        """
        self.logger.info(f"Monitoring API operation: {operation_data.get('operation')} on {operation_data.get('api_id')}")
        
        # Initialize result
        result = {
            'operation_id': operation_data.get('operation_id', str(uuid.uuid4())),
            'timestamp': time.time(),
            'compliant': True,
            'violations': [],
            'frameworks': {}
        }
        
        # Check compliance for each framework
        for framework_id, framework in self.compliance_registry.items():
            if framework.get('status') != 'active':
                continue
            
            framework_result = self._check_framework_compliance(framework, operation_data)
            result['frameworks'][framework_id] = framework_result
            
            # If any framework is non-compliant, the operation is non-compliant
            if not framework_result['compliant']:
                result['compliant'] = False
                result['violations'].extend(framework_result['violations'])
        
        # Log compliance event
        self._log_compliance_event('operation_monitored', {
            'operation_id': result['operation_id'],
            'api_id': operation_data.get('api_id'),
            'operation': operation_data.get('operation'),
            'developer_id': operation_data.get('developer_id'),
            'application_id': operation_data.get('application_id'),
            'compliant': result['compliant'],
            'violations_count': len(result['violations'])
        })
        
        return result
    
    def generate_compliance_report(self, report_type: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a compliance report.
        
        Args:
            report_type: Type of report to generate
            params: Parameters for the report
            
        Returns:
            dict: Report data
        """
        self.logger.info(f"Generating compliance report: {report_type}")
        
        # Initialize report
        report = {
            'id': str(uuid.uuid4()),
            'type': report_type,
            'timestamp': time.time(),
            'params': params or {},
            'data': {}
        }
        
        # Generate report based on type
        if report_type == 'framework_compliance':
            report['data'] = self._generate_framework_compliance_report(params)
        elif report_type == 'api_compliance':
            report['data'] = self._generate_api_compliance_report(params)
        elif report_type == 'developer_compliance':
            report['data'] = self._generate_developer_compliance_report(params)
        elif report_type == 'application_compliance':
            report['data'] = self._generate_application_compliance_report(params)
        elif report_type == 'violation_summary':
            report['data'] = self._generate_violation_summary_report(params)
        else:
            self.logger.error(f"Unknown report type: {report_type}")
            return {}
        
        # Log action
        self._log_compliance_event('report_generated', {
            'report_id': report['id'],
            'report_type': report_type,
            'params': params
        })
        
        # Save report to disk
        self._save_report(report)
        
        return report
    
    def get_compliance_log(self, filter_params: Dict[str, Any] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get the compliance log, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the log entries by
            limit: Maximum number of entries to return
            
        Returns:
            list: List of log entries
        """
        self.logger.info("Getting compliance log")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for entry in self.compliance_log:
                match = True
                for key, value in filter_params.items():
                    if key not in entry or entry[key] != value:
                        match = False
                        break
                if match:
                    result.append(entry)
        else:
            result = self.compliance_log.copy()
        
        # Sort by timestamp (newest first)
        result.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Apply limit
        result = result[:limit]
        
        return result
    
    def _load_compliance_registry(self):
        """Load compliance registry from disk."""
        registry_path = self.config.get('compliance_registry_path', 'config/compliance_registry.json')
        if os.path.exists(registry_path):
            try:
                with open(registry_path, 'r') as f:
                    self.compliance_registry = json.load(f)
            except Exception as e:
                self.logger.error(f"Error loading compliance registry: {str(e)}")
    
    def _save_compliance_registry(self):
        """Save compliance registry to disk."""
        registry_path = self.config.get('compliance_registry_path', 'config/compliance_registry.json')
        os.makedirs(os.path.dirname(registry_path), exist_ok=True)
        
        with open(registry_path, 'w') as f:
            json.dump(self.compliance_registry, f, indent=2)
    
    def _load_compliance_log(self):
        """Load compliance log from disk."""
        log_path = self.config.get('compliance_log_path', 'logs/api_compliance/compliance_log.json')
        if os.path.exists(log_path):
            try:
                with open(log_path, 'r') as f:
                    self.compliance_log = json.load(f)
            except Exception as e:
                self.logger.error(f"Error loading compliance log: {str(e)}")
    
    def _save_compliance_log(self):
        """Save compliance log to disk."""
        log_path = self.config.get('compliance_log_path', 'logs/api_compliance/compliance_log.json')
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        
        with open(log_path, 'w') as f:
            json.dump(self.compliance_log, f, indent=2)
    
    def _initialize_compliance_frameworks(self):
        """Initialize compliance frameworks."""
        self.logger.info("Initializing compliance frameworks")
        
        # Check if we need to initialize default frameworks
        if not self.compliance_registry:
            # Initialize SOC2 framework
            self._initialize_soc2_framework()
            
            # Initialize ISO27001 framework
            self._initialize_iso27001_framework()
            
            # Initialize GDPR framework
            self._initialize_gdpr_framework()
            
            # Initialize HIPAA framework
            self._initialize_hipaa_framework()
    
    def _initialize_soc2_framework(self):
        """Initialize SOC2 compliance framework."""
        framework_data = {
            'id': 'soc2',
            'name': 'SOC2',
            'version': '2017',
            'description': 'Service Organization Control 2',
            'status': 'active',
            'controls': {
                'CC1.1': {
                    'name': 'Management establishes responsibility and accountability',
                    'description': 'Management establishes responsibility and accountability for the design, development, implementation, operation, maintenance, and monitoring of the system.',
                    'requirements': [
                        'API operations must be authenticated',
                        'API operations must be authorized',
                        'API operations must be logged'
                    ]
                },
                'CC5.1': {
                    'name': 'Logical access security software',
                    'description': 'Logical access security software, infrastructure, and architectures have been implemented to support secure authentication, authorization, and access to the system.',
                    'requirements': [
                        'API authentication must use secure methods',
                        'API authorization must enforce least privilege',
                        'API access must be restricted by scope'
                    ]
                },
                'CC5.2': {
                    'name': 'Identification and authentication',
                    'description': 'New internal and external users are registered and authorized prior to being issued access credentials, and upon provisioning of credentials are granted access to the system.',
                    'requirements': [
                        'Developers must be registered and approved',
                        'Applications must be registered and approved',
                        'API keys must be securely stored'
                    ]
                },
                'CC7.1': {
                    'name': 'Security policies',
                    'description': 'Security policies are established, communicated, and made available to internal and external users.',
                    'requirements': [
                        'API policies must be documented',
                        'API policies must be communicated to developers',
                        'API policies must be enforced'
                    ]
                }
            }
        }
        
        self.register_compliance_framework(framework_data)
    
    def _initialize_iso27001_framework(self):
        """Initialize ISO27001 compliance framework."""
        framework_data = {
            'id': 'iso27001',
            'name': 'ISO 27001',
            'version': '2013',
            'description': 'Information Security Management System',
            'status': 'active',
            'controls': {
                'A.9.2': {
                    'name': 'User access management',
                    'description': 'To ensure authorized user access and to prevent unauthorized access to systems and services.',
                    'requirements': [
                        'API access must be provisioned through formal process',
                        'API access must be reviewed regularly',
                        'API access must be revoked when no longer needed'
                    ]
                },
                'A.9.4': {
                    'name': 'System and application access control',
                    'description': 'To prevent unauthorized access to systems and applications.',
                    'requirements': [
                        'API access must be restricted by policy',
                        'API access must use secure authentication',
                        'API access must be logged and monitored'
                    ]
                },
                'A.12.4': {
                    'name': 'Logging and monitoring',
                    'description': 'To record events and generate evidence.',
                    'requirements': [
                        'API operations must be logged',
                        'API logs must be protected from tampering',
                        'API logs must be retained for compliance purposes'
                    ]
                },
                'A.14.2': {
                    'name': 'Security in development and support processes',
                    'description': 'To ensure that information security is designed and implemented within the development lifecycle of information systems.',
                    'requirements': [
                        'API changes must follow secure development process',
                        'API changes must be tested for security',
                        'API changes must be approved before deployment'
                    ]
                }
            }
        }
        
        self.register_compliance_framework(framework_data)
    
    def _initialize_gdpr_framework(self):
        """Initialize GDPR compliance framework."""
        framework_data = {
            'id': 'gdpr',
            'name': 'GDPR',
            'version': '2018',
            'description': 'General Data Protection Regulation',
            'status': 'active',
            'controls': {
                'Art5': {
                    'name': 'Principles relating to processing of personal data',
                    'description': 'Personal data shall be processed lawfully, fairly and in a transparent manner.',
                    'requirements': [
                        'API operations must have legal basis for processing',
                        'API operations must be transparent to data subjects',
                        'API operations must be limited to stated purpose'
                    ]
                },
                'Art25': {
                    'name': 'Data protection by design and by default',
                    'description': 'Implement appropriate technical and organisational measures for ensuring that, by default, only personal data which are necessary for each specific purpose of the processing are processed.',
                    'requirements': [
                        'API must implement data minimization',
                        'API must implement privacy by design',
                        'API must implement privacy by default'
                    ]
                },
                'Art30': {
                    'name': 'Records of processing activities',
                    'description': 'Each controller and, where applicable, the controller's representative, shall maintain a record of processing activities under its responsibility.',
                    'requirements': [
                        'API operations must be logged',
                        'API logs must include purpose of processing',
                        'API logs must include categories of data processed'
                    ]
                },
                'Art32': {
                    'name': 'Security of processing',
                    'description': 'Implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk.',
                    'requirements': [
                        'API must implement encryption of personal data',
                        'API must implement access controls',
                        'API must implement security testing'
                    ]
                }
            }
        }
        
        self.register_compliance_framework(framework_data)
    
    def _initialize_hipaa_framework(self):
        """Initialize HIPAA compliance framework."""
        framework_data = {
            'id': 'hipaa',
            'name': 'HIPAA',
            'version': '2013',
            'description': 'Health Insurance Portability and Accountability Act',
            'status': 'active',
            'controls': {
                '164.308': {
                    'name': 'Administrative safeguards',
                    'description': 'Security measures to manage the selection, development, implementation, and maintenance of security measures to protect electronic protected health information.',
                    'requirements': [
                        'API must implement security management process',
                        'API must implement access authorization',
                        'API must implement security incident procedures'
                    ]
                },
                '164.312': {
                    'name': 'Technical safeguards',
                    'description': 'Technology and policy and procedures for its use that protect electronic protected health information and control access to it.',
                    'requirements': [
                        'API must implement access controls',
                        'API must implement audit controls',
                        'API must implement transmission security'
                    ]
                },
                '164.314': {
                    'name': 'Organizational requirements',
                    'description': 'Requirements for business associate contracts or other arrangements.',
                    'requirements': [
                        'API must implement business associate agreements',
                        'API must implement requirements for group health plans',
                        'API must implement requirements for other arrangements'
                    ]
                },
                '164.316': {
                    'name': 'Policies and procedures and documentation requirements',
                    'description': 'Implement reasonable and appropriate policies and procedures to comply with the standards, implementation specifications, or other requirements.',
                    'requirements': [
                        'API must implement policies and procedures',
                        'API must implement documentation',
                        'API must implement time limit for documentation'
                    ]
                }
            }
        }
        
        self.register_compliance_framework(framework_data)
    
    def _check_framework_compliance(self, framework: Dict[str, Any], operation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if an API operation complies with a compliance framework.
        
        Args:
            framework: Compliance framework
            operation_data: API operation data
            
        Returns:
            dict: Compliance result
        """
        # Initialize result
        result = {
            'framework_id': framework['id'],
            'framework_name': framework['name'],
            'compliant': True,
            'violations': []
        }
        
        # Check each control
        for control_id, control in framework.get('controls', {}).items():
            control_result = self._check_control_compliance(control, operation_data)
            
            # If control is non-compliant, add violations
            if not control_result['compliant']:
                result['compliant'] = False
                for violation in control_result['violations']:
                    result['violations'].append({
                        'control_id': control_id,
                        'control_name': control['name'],
                        'requirement': violation['requirement'],
                        'reason': violation['reason']
                    })
        
        return result
    
    def _check_control_compliance(self, control: Dict[str, Any], operation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if an API operation complies with a control.
        
        Args:
            control: Compliance control
            operation_data: API operation data
            
        Returns:
            dict: Compliance result
        """
        # Initialize result
        result = {
            'compliant': True,
            'violations': []
        }
        
        # Check each requirement
        for requirement in control.get('requirements', []):
            # In a real implementation, this would use a more sophisticated compliance check
            # For this implementation, we'll use a simple check based on the requirement text
            
            if 'authenticated' in requirement.lower() and not operation_data.get('authenticated', False):
                result['compliant'] = False
                result['violations'].append({
                    'requirement': requirement,
                    'reason': 'Operation not authenticated'
                })
            
            if 'authorized' in requirement.lower() and not operation_data.get('authorized', False):
                result['compliant'] = False
                result['violations'].append({
                    'requirement': requirement,
                    'reason': 'Operation not authorized'
                })
            
            if 'logged' in requirement.lower() and not operation_data.get('logged', False):
                result['compliant'] = False
                result['violations'].append({
                    'requirement': requirement,
                    'reason': 'Operation not logged'
                })
            
            if 'encrypted' in requirement.lower() and not operation_data.get('encrypted', False):
                result['compliant'] = False
                result['violations'].append({
                    'requirement': requirement,
                    'reason': 'Operation not encrypted'
                })
        
        return result
    
    def _log_compliance_event(self, event_type: str, event_data: Dict[str, Any]):
        """
        Log a compliance event.
        
        Args:
            event_type: Type of event
            event_data: Event data
        """
        # Create log entry
        entry = {
            'id': str(uuid.uuid4()),
            'timestamp': time.time(),
            'type': event_type,
            'data': event_data
        }
        
        # Add to log
        self.compliance_log.append(entry)
        
        # Trim log if it gets too large
        max_entries = self.config.get('max_compliance_log_entries', 10000)
        if len(self.compliance_log) > max_entries:
            self.compliance_log = self.compliance_log[-max_entries:]
        
        # Save log
        self._save_compliance_log()
    
    def _save_report(self, report: Dict[str, Any]):
        """
        Save a compliance report to disk.
        
        Args:
            report: Report data
        """
        report_directory = self.config.get('report_directory', 'logs/api_compliance/reports')
        os.makedirs(report_directory, exist_ok=True)
        
        report_path = os.path.join(report_directory, f"{report['id']}.json")
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
    
    def _generate_framework_compliance_report(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a framework compliance report.
        
        Args:
            params: Report parameters
            
        Returns:
            dict: Report data
        """
        params = params or {}
        
        # Get framework ID
        framework_id = params.get('framework_id')
        if not framework_id:
            self.logger.error("Missing framework_id parameter")
            return {}
        
        # Get framework
        framework = self.get_compliance_framework(framework_id)
        if not framework:
            self.logger.error(f"Framework not found: {framework_id}")
            return {}
        
        # Initialize report data
        report_data = {
            'framework_id': framework_id,
            'framework_name': framework['name'],
            'framework_version': framework['version'],
            'total_operations': 0,
            'compliant_operations': 0,
            'non_compliant_operations': 0,
            'compliance_percentage': 0,
            'violations_by_control': {},
            'violations_by_api': {},
            'violations_by_developer': {},
            'violations_by_application': {}
        }
        
        # Count operations and violations in compliance log
        for entry in self.compliance_log:
            if entry['type'] == 'operation_monitored':
                data = entry['data']
                
                # Check if this operation was checked against this framework
                if framework_id in data.get('frameworks', {}):
                    # Increment total operations
                    report_data['total_operations'] += 1
                    
                    # Check if operation was compliant with this framework
                    framework_result = data['frameworks'][framework_id]
                    if framework_result['compliant']:
                        report_data['compliant_operations'] += 1
                    else:
                        report_data['non_compliant_operations'] += 1
                        
                        # Count violations by control
                        for violation in framework_result['violations']:
                            control_id = violation['control_id']
                            if control_id not in report_data['violations_by_control']:
                                report_data['violations_by_control'][control_id] = 0
                            report_data['violations_by_control'][control_id] += 1
                        
                        # Count violations by API
                        api_id = data.get('api_id', 'unknown')
                        if api_id not in report_data['violations_by_api']:
                            report_data['violations_by_api'][api_id] = 0
                        report_data['violations_by_api'][api_id] += 1
                        
                        # Count violations by developer
                        developer_id = data.get('developer_id', 'unknown')
                        if developer_id not in report_data['violations_by_developer']:
                            report_data['violations_by_developer'][developer_id] = 0
                        report_data['violations_by_developer'][developer_id] += 1
                        
                        # Count violations by application
                        application_id = data.get('application_id', 'unknown')
                        if application_id not in report_data['violations_by_application']:
                            report_data['violations_by_application'][application_id] = 0
                        report_data['violations_by_application'][application_id] += 1
        
        # Calculate compliance percentage
        if report_data['total_operations'] > 0:
            report_data['compliance_percentage'] = (report_data['compliant_operations'] / report_data['total_operations']) * 100
        
        return report_data
    
    def _generate_api_compliance_report(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate an API compliance report.
        
        Args:
            params: Report parameters
            
        Returns:
            dict: Report data
        """
        params = params or {}
        
        # Get API ID
        api_id = params.get('api_id')
        if not api_id:
            self.logger.error("Missing api_id parameter")
            return {}
        
        # Initialize report data
        report_data = {
            'api_id': api_id,
            'total_operations': 0,
            'compliant_operations': 0,
            'non_compliant_operations': 0,
            'compliance_percentage': 0,
            'compliance_by_framework': {},
            'violations_by_operation': {},
            'violations_by_developer': {},
            'violations_by_application': {}
        }
        
        # Count operations and violations in compliance log
        for entry in self.compliance_log:
            if entry['type'] == 'operation_monitored':
                data = entry['data']
                
                # Check if this operation was for this API
                if data.get('api_id') == api_id:
                    # Increment total operations
                    report_data['total_operations'] += 1
                    
                    # Check if operation was compliant
                    if data.get('compliant', False):
                        report_data['compliant_operations'] += 1
                    else:
                        report_data['non_compliant_operations'] += 1
                        
                        # Count violations by framework
                        for framework_id, framework_result in data.get('frameworks', {}).items():
                            if not framework_result.get('compliant', True):
                                if framework_id not in report_data['compliance_by_framework']:
                                    report_data['compliance_by_framework'][framework_id] = {
                                        'total_operations': 0,
                                        'compliant_operations': 0,
                                        'non_compliant_operations': 0,
                                        'compliance_percentage': 0
                                    }
                                
                                report_data['compliance_by_framework'][framework_id]['total_operations'] += 1
                                report_data['compliance_by_framework'][framework_id]['non_compliant_operations'] += 1
                        
                        # Count violations by operation
                        operation = data.get('operation', 'unknown')
                        if operation not in report_data['violations_by_operation']:
                            report_data['violations_by_operation'][operation] = 0
                        report_data['violations_by_operation'][operation] += 1
                        
                        # Count violations by developer
                        developer_id = data.get('developer_id', 'unknown')
                        if developer_id not in report_data['violations_by_developer']:
                            report_data['violations_by_developer'][developer_id] = 0
                        report_data['violations_by_developer'][developer_id] += 1
                        
                        # Count violations by application
                        application_id = data.get('application_id', 'unknown')
                        if application_id not in report_data['violations_by_application']:
                            report_data['violations_by_application'][application_id] = 0
                        report_data['violations_by_application'][application_id] += 1
                    
                    # Update framework compliance counts
                    for framework_id, framework_result in data.get('frameworks', {}).items():
                        if framework_id not in report_data['compliance_by_framework']:
                            report_data['compliance_by_framework'][framework_id] = {
                                'total_operations': 0,
                                'compliant_operations': 0,
                                'non_compliant_operations': 0,
                                'compliance_percentage': 0
                            }
                        
                        report_data['compliance_by_framework'][framework_id]['total_operations'] += 1
                        if framework_result.get('compliant', False):
                            report_data['compliance_by_framework'][framework_id]['compliant_operations'] += 1
                        else:
                            report_data['compliance_by_framework'][framework_id]['non_compliant_operations'] += 1
        
        # Calculate compliance percentages
        if report_data['total_operations'] > 0:
            report_data['compliance_percentage'] = (report_data['compliant_operations'] / report_data['total_operations']) * 100
        
        for framework_id, framework_data in report_data['compliance_by_framework'].items():
            if framework_data['total_operations'] > 0:
                framework_data['compliance_percentage'] = (framework_data['compliant_operations'] / framework_data['total_operations']) * 100
        
        return report_data
    
    def _generate_developer_compliance_report(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a developer compliance report.
        
        Args:
            params: Report parameters
            
        Returns:
            dict: Report data
        """
        params = params or {}
        
        # Get developer ID
        developer_id = params.get('developer_id')
        if not developer_id:
            self.logger.error("Missing developer_id parameter")
            return {}
        
        # Initialize report data
        report_data = {
            'developer_id': developer_id,
            'total_operations': 0,
            'compliant_operations': 0,
            'non_compliant_operations': 0,
            'compliance_percentage': 0,
            'compliance_by_framework': {},
            'violations_by_api': {},
            'violations_by_operation': {},
            'violations_by_application': {}
        }
        
        # Count operations and violations in compliance log
        for entry in self.compliance_log:
            if entry['type'] == 'operation_monitored':
                data = entry['data']
                
                # Check if this operation was for this developer
                if data.get('developer_id') == developer_id:
                    # Increment total operations
                    report_data['total_operations'] += 1
                    
                    # Check if operation was compliant
                    if data.get('compliant', False):
                        report_data['compliant_operations'] += 1
                    else:
                        report_data['non_compliant_operations'] += 1
                        
                        # Count violations by API
                        api_id = data.get('api_id', 'unknown')
                        if api_id not in report_data['violations_by_api']:
                            report_data['violations_by_api'][api_id] = 0
                        report_data['violations_by_api'][api_id] += 1
                        
                        # Count violations by operation
                        operation = data.get('operation', 'unknown')
                        if operation not in report_data['violations_by_operation']:
                            report_data['violations_by_operation'][operation] = 0
                        report_data['violations_by_operation'][operation] += 1
                        
                        # Count violations by application
                        application_id = data.get('application_id', 'unknown')
                        if application_id not in report_data['violations_by_application']:
                            report_data['violations_by_application'][application_id] = 0
                        report_data['violations_by_application'][application_id] += 1
                    
                    # Update framework compliance counts
                    for framework_id, framework_result in data.get('frameworks', {}).items():
                        if framework_id not in report_data['compliance_by_framework']:
                            report_data['compliance_by_framework'][framework_id] = {
                                'total_operations': 0,
                                'compliant_operations': 0,
                                'non_compliant_operations': 0,
                                'compliance_percentage': 0
                            }
                        
                        report_data['compliance_by_framework'][framework_id]['total_operations'] += 1
                        if framework_result.get('compliant', False):
                            report_data['compliance_by_framework'][framework_id]['compliant_operations'] += 1
                        else:
                            report_data['compliance_by_framework'][framework_id]['non_compliant_operations'] += 1
        
        # Calculate compliance percentages
        if report_data['total_operations'] > 0:
            report_data['compliance_percentage'] = (report_data['compliant_operations'] / report_data['total_operations']) * 100
        
        for framework_id, framework_data in report_data['compliance_by_framework'].items():
            if framework_data['total_operations'] > 0:
                framework_data['compliance_percentage'] = (framework_data['compliant_operations'] / framework_data['total_operations']) * 100
        
        return report_data
    
    def _generate_application_compliance_report(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate an application compliance report.
        
        Args:
            params: Report parameters
            
        Returns:
            dict: Report data
        """
        params = params or {}
        
        # Get application ID
        application_id = params.get('application_id')
        if not application_id:
            self.logger.error("Missing application_id parameter")
            return {}
        
        # Initialize report data
        report_data = {
            'application_id': application_id,
            'total_operations': 0,
            'compliant_operations': 0,
            'non_compliant_operations': 0,
            'compliance_percentage': 0,
            'compliance_by_framework': {},
            'violations_by_api': {},
            'violations_by_operation': {}
        }
        
        # Count operations and violations in compliance log
        for entry in self.compliance_log:
            if entry['type'] == 'operation_monitored':
                data = entry['data']
                
                # Check if this operation was for this application
                if data.get('application_id') == application_id:
                    # Increment total operations
                    report_data['total_operations'] += 1
                    
                    # Check if operation was compliant
                    if data.get('compliant', False):
                        report_data['compliant_operations'] += 1
                    else:
                        report_data['non_compliant_operations'] += 1
                        
                        # Count violations by API
                        api_id = data.get('api_id', 'unknown')
                        if api_id not in report_data['violations_by_api']:
                            report_data['violations_by_api'][api_id] = 0
                        report_data['violations_by_api'][api_id] += 1
                        
                        # Count violations by operation
                        operation = data.get('operation', 'unknown')
                        if operation not in report_data['violations_by_operation']:
                            report_data['violations_by_operation'][operation] = 0
                        report_data['violations_by_operation'][operation] += 1
                    
                    # Update framework compliance counts
                    for framework_id, framework_result in data.get('frameworks', {}).items():
                        if framework_id not in report_data['compliance_by_framework']:
                            report_data['compliance_by_framework'][framework_id] = {
                                'total_operations': 0,
                                'compliant_operations': 0,
                                'non_compliant_operations': 0,
                                'compliance_percentage': 0
                            }
                        
                        report_data['compliance_by_framework'][framework_id]['total_operations'] += 1
                        if framework_result.get('compliant', False):
                            report_data['compliance_by_framework'][framework_id]['compliant_operations'] += 1
                        else:
                            report_data['compliance_by_framework'][framework_id]['non_compliant_operations'] += 1
        
        # Calculate compliance percentages
        if report_data['total_operations'] > 0:
            report_data['compliance_percentage'] = (report_data['compliant_operations'] / report_data['total_operations']) * 100
        
        for framework_id, framework_data in report_data['compliance_by_framework'].items():
            if framework_data['total_operations'] > 0:
                framework_data['compliance_percentage'] = (framework_data['compliant_operations'] / framework_data['total_operations']) * 100
        
        return report_data
    
    def _generate_violation_summary_report(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a violation summary report.
        
        Args:
            params: Report parameters
            
        Returns:
            dict: Report data
        """
        params = params or {}
        
        # Get time range
        start_time = params.get('start_time', 0)
        end_time = params.get('end_time', time.time())
        
        # Initialize report data
        report_data = {
            'start_time': start_time,
            'end_time': end_time,
            'total_operations': 0,
            'compliant_operations': 0,
            'non_compliant_operations': 0,
            'compliance_percentage': 0,
            'violations_by_framework': {},
            'violations_by_api': {},
            'violations_by_operation': {},
            'violations_by_developer': {},
            'violations_by_application': {},
            'top_violations': []
        }
        
        # Count operations and violations in compliance log
        for entry in self.compliance_log:
            if entry['type'] == 'operation_monitored':
                data = entry['data']
                timestamp = entry.get('timestamp', 0)
                
                # Check if this operation is within the time range
                if start_time <= timestamp <= end_time:
                    # Increment total operations
                    report_data['total_operations'] += 1
                    
                    # Check if operation was compliant
                    if data.get('compliant', False):
                        report_data['compliant_operations'] += 1
                    else:
                        report_data['non_compliant_operations'] += 1
                        
                        # Count violations by framework
                        for framework_id, framework_result in data.get('frameworks', {}).items():
                            if not framework_result.get('compliant', True):
                                if framework_id not in report_data['violations_by_framework']:
                                    report_data['violations_by_framework'][framework_id] = 0
                                report_data['violations_by_framework'][framework_id] += 1
                        
                        # Count violations by API
                        api_id = data.get('api_id', 'unknown')
                        if api_id not in report_data['violations_by_api']:
                            report_data['violations_by_api'][api_id] = 0
                        report_data['violations_by_api'][api_id] += 1
                        
                        # Count violations by operation
                        operation = data.get('operation', 'unknown')
                        if operation not in report_data['violations_by_operation']:
                            report_data['violations_by_operation'][operation] = 0
                        report_data['violations_by_operation'][operation] += 1
                        
                        # Count violations by developer
                        developer_id = data.get('developer_id', 'unknown')
                        if developer_id not in report_data['violations_by_developer']:
                            report_data['violations_by_developer'][developer_id] = 0
                        report_data['violations_by_developer'][developer_id] += 1
                        
                        # Count violations by application
                        application_id = data.get('application_id', 'unknown')
                        if application_id not in report_data['violations_by_application']:
                            report_data['violations_by_application'][application_id] = 0
                        report_data['violations_by_application'][application_id] += 1
                        
                        # Add to top violations
                        for framework_id, framework_result in data.get('frameworks', {}).items():
                            for violation in framework_result.get('violations', []):
                                report_data['top_violations'].append({
                                    'timestamp': timestamp,
                                    'api_id': api_id,
                                    'operation': operation,
                                    'developer_id': developer_id,
                                    'application_id': application_id,
                                    'framework_id': framework_id,
                                    'control_id': violation.get('control_id', 'unknown'),
                                    'control_name': violation.get('control_name', 'Unknown'),
                                    'requirement': violation.get('requirement', 'Unknown'),
                                    'reason': violation.get('reason', 'Unknown')
                                })
        
        # Calculate compliance percentage
        if report_data['total_operations'] > 0:
            report_data['compliance_percentage'] = (report_data['compliant_operations'] / report_data['total_operations']) * 100
        
        # Sort top violations by timestamp (newest first)
        report_data['top_violations'].sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Limit top violations to 100
        report_data['top_violations'] = report_data['top_violations'][:100]
        
        return report_data
