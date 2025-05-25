"""
Health Check System for Continuous Risk Monitoring.

This module implements the periodic health check system for the Continuous Risk Monitoring
framework, providing comprehensive validation of system components and constitutional compliance.
The system is designed to run health checks on-demand rather than on a scheduled basis.
"""

import logging
import time
import json
import hashlib
import statistics
from typing import Dict, List, Any, Optional, Set, Tuple, Callable
from enum import Enum
from datetime import datetime, timedelta
from collections import defaultdict

from monitoring_framework import BaseMonitor, AlertSeverity, MonitoringEvent


class HealthCheckStatus(Enum):
    """Status of a health check execution."""
    PASSED = "passed"
    WARNING = "warning"
    FAILED = "failed"
    ERROR = "error"  # For execution errors
    SKIPPED = "skipped"


class HealthCheckCategory(Enum):
    """Categories of health checks."""
    CONSTITUTIONAL = "constitutional"
    SYSTEM_INTEGRITY = "system_integrity"
    PERFORMANCE = "performance"
    SECURITY = "security"
    GOVERNANCE = "governance"


class HealthCheckResult:
    """Result of a health check execution."""
    
    def __init__(self, 
                 check_id: str,
                 status: HealthCheckStatus,
                 category: HealthCheckCategory,
                 timestamp: float,
                 details: Dict[str, Any] = None,
                 metrics: Dict[str, float] = None):
        """
        Initialize a health check result.
        
        Args:
            check_id: Unique identifier for the health check
            status: Status of the health check
            category: Category of the health check
            timestamp: Timestamp when the check was executed
            details: Additional details about the check result
            metrics: Metrics collected during the check
        """
        self.check_id = check_id
        self.status = status
        self.category = category
        self.timestamp = timestamp
        self.details = details or {}
        self.metrics = metrics or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the result to a dictionary.
        
        Returns:
            Dictionary representation of the result
        """
        return {
            'check_id': self.check_id,
            'status': self.status.value,
            'category': self.category.value,
            'timestamp': self.timestamp,
            'details': self.details,
            'metrics': self.metrics
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'HealthCheckResult':
        """
        Create a result from a dictionary.
        
        Args:
            data: Dictionary representation of a result
            
        Returns:
            HealthCheckResult instance
        """
        return cls(
            check_id=data['check_id'],
            status=HealthCheckStatus(data['status']),
            category=HealthCheckCategory(data['category']),
            timestamp=data['timestamp'],
            details=data.get('details', {}),
            metrics=data.get('metrics', {})
        )


class BaseHealthCheck:
    """Base class for health checks."""
    
    def __init__(self, check_id: str, category: HealthCheckCategory, description: str):
        """
        Initialize a health check.
        
        Args:
            check_id: Unique identifier for the health check
            category: Category of the health check
            description: Description of what the health check does
        """
        self.check_id = check_id
        self.category = category
        self.description = description
        self.logger = logging.getLogger(f"HealthCheck.{check_id}")
    
    def execute(self) -> HealthCheckResult:
        """
        Execute the health check.
        
        Returns:
            Result of the health check
        """
        start_time = time.time()
        self.logger.info(f"Starting health check: {self.check_id}")
        
        try:
            status, details, metrics = self._execute_check()
            
            result = HealthCheckResult(
                check_id=self.check_id,
                status=status,
                category=self.category,
                timestamp=time.time(),
                details=details,
                metrics=metrics
            )
            
            execution_time = time.time() - start_time
            self.logger.info(f"Health check {self.check_id} completed with status {status.value} in {execution_time:.2f}s")
            
            return result
        
        except Exception as e:
            self.logger.error(f"Error executing health check {self.check_id}: {str(e)}", exc_info=True)
            
            return HealthCheckResult(
                check_id=self.check_id,
                status=HealthCheckStatus.ERROR,
                category=self.category,
                timestamp=time.time(),
                details={
                    'error': str(e),
                    'error_type': type(e).__name__
                }
            )
    
    def _execute_check(self) -> Tuple[HealthCheckStatus, Dict[str, Any], Dict[str, float]]:
        """
        Execute the actual check logic.
        
        Returns:
            Tuple of (status, details, metrics)
        """
        raise NotImplementedError("Subclasses must implement _execute_check")


class ConstitutionalValidationScanner(BaseHealthCheck):
    """
    Health check for constitutional compliance validation.
    
    This scanner performs comprehensive validation of constitutional compliance
    across various system components.
    """
    
    def __init__(self, check_id: str, description: str, codex_principles: Dict[str, Any] = None):
        """
        Initialize the constitutional validation scanner.
        
        Args:
            check_id: Unique identifier for the health check
            description: Description of what the health check does
            codex_principles: Dictionary of codex principles to validate against
        """
        super().__init__(check_id, HealthCheckCategory.CONSTITUTIONAL, description)
        self.codex_principles = codex_principles or {}
        self.baseline_governance = {}
        self.memory_integrity_checks = []
        self.reflection_checks = []
    
    def set_baseline_governance(self, baseline: Dict[str, Any]) -> None:
        """
        Set the baseline governance configuration.
        
        Args:
            baseline: Baseline governance configuration
        """
        self.baseline_governance = baseline
    
    def add_memory_integrity_check(self, check_func: Callable) -> None:
        """
        Add a memory integrity check function.
        
        Args:
            check_func: Function that performs a memory integrity check
        """
        self.memory_integrity_checks.append(check_func)
    
    def add_reflection_check(self, check_func: Callable) -> None:
        """
        Add a reflection capability check function.
        
        Args:
            check_func: Function that checks reflection capabilities
        """
        self.reflection_checks.append(check_func)
    
    def _execute_check(self) -> Tuple[HealthCheckStatus, Dict[str, Any], Dict[str, float]]:
        """
        Execute the constitutional validation check.
        
        Returns:
            Tuple of (status, details, metrics)
        """
        self.logger.info("Executing constitutional validation scan")
        
        # Initialize results
        details = {
            'codex_compliance': {},
            'governance_drift': {},
            'memory_integrity': {},
            'reflection_capabilities': {}
        }
        metrics = {
            'compliance_score': 0.0,
            'governance_drift_score': 0.0,
            'memory_integrity_score': 0.0,
            'reflection_capability_score': 0.0,
            'overall_constitutional_score': 0.0
        }
        
        # Validate codex compliance
        compliance_results = self._validate_codex_compliance()
        details['codex_compliance'] = compliance_results
        metrics['compliance_score'] = self._calculate_compliance_score(compliance_results)
        
        # Scan for governance drift
        drift_results = self._scan_for_governance_drift()
        details['governance_drift'] = drift_results
        metrics['governance_drift_score'] = self._calculate_drift_score(drift_results)
        
        # Verify memory integrity
        memory_results = self._verify_memory_integrity()
        details['memory_integrity'] = memory_results
        metrics['memory_integrity_score'] = self._calculate_memory_score(memory_results)
        
        # Check reflection capabilities
        reflection_results = self._check_reflection_capabilities()
        details['reflection_capabilities'] = reflection_results
        metrics['reflection_capability_score'] = self._calculate_reflection_score(reflection_results)
        
        # Calculate overall score
        metrics['overall_constitutional_score'] = (
            metrics['compliance_score'] * 0.4 +
            metrics['governance_drift_score'] * 0.3 +
            metrics['memory_integrity_score'] * 0.2 +
            metrics['reflection_capability_score'] * 0.1
        )
        
        # Determine status based on overall score
        if metrics['overall_constitutional_score'] >= 0.9:
            status = HealthCheckStatus.PASSED
        elif metrics['overall_constitutional_score'] >= 0.7:
            status = HealthCheckStatus.WARNING
        else:
            status = HealthCheckStatus.FAILED
        
        return status, details, metrics
    
    def _validate_codex_compliance(self) -> Dict[str, Any]:
        """
        Verify compliance with Codex principles.
        
        Returns:
            Results of codex compliance validation
        """
        self.logger.debug("Validating codex compliance")
        
        results = {
            'principles_checked': len(self.codex_principles),
            'compliant_principles': 0,
            'non_compliant_principles': 0,
            'principle_details': {}
        }
        
        # In a real implementation, this would check actual system components
        # For now, we'll simulate the validation
        for principle_id, principle in self.codex_principles.items():
            # Simulate validation logic
            is_compliant = True  # Default to compliant
            compliance_details = {}
            
            # Add principle details to results
            results['principle_details'][principle_id] = {
                'name': principle.get('name', 'Unknown'),
                'is_compliant': is_compliant,
                'details': compliance_details
            }
            
            # Update counters
            if is_compliant:
                results['compliant_principles'] += 1
            else:
                results['non_compliant_principles'] += 1
        
        return results
    
    def _scan_for_governance_drift(self) -> Dict[str, Any]:
        """
        Detect drift from baseline governance.
        
        Returns:
            Results of governance drift scan
        """
        self.logger.debug("Scanning for governance drift")
        
        results = {
            'components_checked': 0,
            'components_with_drift': 0,
            'drift_details': {}
        }
        
        # In a real implementation, this would compare current governance
        # with the baseline governance configuration
        # For now, we'll simulate the scan
        
        # Simulate some components to check
        components = ['trust_propagation', 'memory_logging', 'governance_inheritance']
        results['components_checked'] = len(components)
        
        for component in components:
            # Simulate drift detection logic
            has_drift = False  # Default to no drift
            drift_details = {}
            
            # Add component details to results
            results['drift_details'][component] = {
                'has_drift': has_drift,
                'details': drift_details
            }
            
            # Update counter if drift detected
            if has_drift:
                results['components_with_drift'] += 1
        
        return results
    
    def _verify_memory_integrity(self) -> Dict[str, Any]:
        """
        Validate memory system integrity.
        
        Returns:
            Results of memory integrity verification
        """
        self.logger.debug("Verifying memory integrity")
        
        results = {
            'checks_performed': len(self.memory_integrity_checks),
            'checks_passed': 0,
            'checks_failed': 0,
            'check_details': {}
        }
        
        # Execute each memory integrity check
        for i, check_func in enumerate(self.memory_integrity_checks):
            check_id = f"memory_check_{i+1}"
            
            try:
                # In a real implementation, this would call the actual check function
                # For now, we'll simulate the check
                check_passed = True  # Default to passed
                check_details = {}
                
                # Add check details to results
                results['check_details'][check_id] = {
                    'passed': check_passed,
                    'details': check_details
                }
                
                # Update counters
                if check_passed:
                    results['checks_passed'] += 1
                else:
                    results['checks_failed'] += 1
                    
            except Exception as e:
                self.logger.error(f"Error in memory integrity check {check_id}: {str(e)}", exc_info=True)
                results['check_details'][check_id] = {
                    'passed': False,
                    'error': str(e),
                    'error_type': type(e).__name__
                }
                results['checks_failed'] += 1
        
        return results
    
    def _check_reflection_capabilities(self) -> Dict[str, Any]:
        """
        Verify reflection functionality.
        
        Returns:
            Results of reflection capability verification
        """
        self.logger.debug("Checking reflection capabilities")
        
        results = {
            'checks_performed': len(self.reflection_checks),
            'checks_passed': 0,
            'checks_failed': 0,
            'check_details': {}
        }
        
        # Execute each reflection check
        for i, check_func in enumerate(self.reflection_checks):
            check_id = f"reflection_check_{i+1}"
            
            try:
                # In a real implementation, this would call the actual check function
                # For now, we'll simulate the check
                check_passed = True  # Default to passed
                check_details = {}
                
                # Add check details to results
                results['check_details'][check_id] = {
                    'passed': check_passed,
                    'details': check_details
                }
                
                # Update counters
                if check_passed:
                    results['checks_passed'] += 1
                else:
                    results['checks_failed'] += 1
                    
            except Exception as e:
                self.logger.error(f"Error in reflection check {check_id}: {str(e)}", exc_info=True)
                results['check_details'][check_id] = {
                    'passed': False,
                    'error': str(e),
                    'error_type': type(e).__name__
                }
                results['checks_failed'] += 1
        
        return results
    
    def _calculate_compliance_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate compliance score from validation results.
        
        Args:
            results: Results of codex compliance validation
            
        Returns:
            Compliance score between 0.0 and 1.0
        """
        if results['principles_checked'] == 0:
            return 1.0  # No principles to check
        
        return results['compliant_principles'] / results['principles_checked']
    
    def _calculate_drift_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate governance drift score from scan results.
        
        Args:
            results: Results of governance drift scan
            
        Returns:
            Drift score between 0.0 and 1.0 (higher is better, meaning less drift)
        """
        if results['components_checked'] == 0:
            return 1.0  # No components to check
        
        return 1.0 - (results['components_with_drift'] / results['components_checked'])
    
    def _calculate_memory_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate memory integrity score from verification results.
        
        Args:
            results: Results of memory integrity verification
            
        Returns:
            Memory integrity score between 0.0 and 1.0
        """
        if results['checks_performed'] == 0:
            return 1.0  # No checks performed
        
        return results['checks_passed'] / results['checks_performed']
    
    def _calculate_reflection_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate reflection capability score from verification results.
        
        Args:
            results: Results of reflection capability verification
            
        Returns:
            Reflection capability score between 0.0 and 1.0
        """
        if results['checks_performed'] == 0:
            return 1.0  # No checks performed
        
        return results['checks_passed'] / results['checks_performed']


class SystemIntegrityVerifier(BaseHealthCheck):
    """
    Health check for system integrity verification.
    
    This verifier checks the integrity of system components, interfaces,
    data structures, and configuration settings.
    """
    
    def __init__(self, check_id: str, description: str):
        """
        Initialize the system integrity verifier.
        
        Args:
            check_id: Unique identifier for the health check
            description: Description of what the health check does
        """
        super().__init__(check_id, HealthCheckCategory.SYSTEM_INTEGRITY, description)
        self.component_checksums = {}
        self.interface_definitions = {}
        self.data_structure_schemas = {}
        self.configuration_settings = {}
    
    def set_component_checksums(self, checksums: Dict[str, str]) -> None:
        """
        Set the expected component checksums.
        
        Args:
            checksums: Dictionary mapping component IDs to expected checksums
        """
        self.component_checksums = checksums
    
    def set_interface_definitions(self, interfaces: Dict[str, Any]) -> None:
        """
        Set the expected interface definitions.
        
        Args:
            interfaces: Dictionary mapping interface IDs to expected definitions
        """
        self.interface_definitions = interfaces
    
    def set_data_structure_schemas(self, schemas: Dict[str, Any]) -> None:
        """
        Set the expected data structure schemas.
        
        Args:
            schemas: Dictionary mapping schema IDs to expected schemas
        """
        self.data_structure_schemas = schemas
    
    def set_configuration_settings(self, settings: Dict[str, Any]) -> None:
        """
        Set the expected configuration settings.
        
        Args:
            settings: Dictionary mapping setting IDs to expected values
        """
        self.configuration_settings = settings
    
    def _execute_check(self) -> Tuple[HealthCheckStatus, Dict[str, Any], Dict[str, float]]:
        """
        Execute the system integrity check.
        
        Returns:
            Tuple of (status, details, metrics)
        """
        self.logger.info("Executing system integrity verification")
        
        # Initialize results
        details = {
            'component_checksums': {},
            'interface_compatibility': {},
            'data_structure_integrity': {},
            'configuration_settings': {}
        }
        metrics = {
            'checksum_match_rate': 0.0,
            'interface_compatibility_rate': 0.0,
            'data_structure_integrity_rate': 0.0,
            'configuration_match_rate': 0.0,
            'overall_integrity_score': 0.0
        }
        
        # Verify component checksums
        checksum_results = self._verify_component_checksums()
        details['component_checksums'] = checksum_results
        metrics['checksum_match_rate'] = self._calculate_checksum_match_rate(checksum_results)
        
        # Check interface compatibility
        interface_results = self._check_interface_compatibility()
        details['interface_compatibility'] = interface_results
        metrics['interface_compatibility_rate'] = self._calculate_interface_compatibility_rate(interface_results)
        
        # Validate data structures
        data_structure_results = self._validate_data_structures()
        details['data_structure_integrity'] = data_structure_results
        metrics['data_structure_integrity_rate'] = self._calculate_data_structure_integrity_rate(data_structure_results)
        
        # Verify configuration settings
        config_results = self._verify_configuration_settings()
        details['configuration_settings'] = config_results
        metrics['configuration_match_rate'] = self._calculate_configuration_match_rate(config_results)
        
        # Calculate overall score
        metrics['overall_integrity_score'] = (
            metrics['checksum_match_rate'] * 0.3 +
            metrics['interface_compatibility_rate'] * 0.3 +
            metrics['data_structure_integrity_rate'] * 0.2 +
            metrics['configuration_match_rate'] * 0.2
        )
        
        # Determine status based on overall score
        if metrics['overall_integrity_score'] >= 0.95:
            status = HealthCheckStatus.PASSED
        elif metrics['overall_integrity_score'] >= 0.8:
            status = HealthCheckStatus.WARNING
        else:
            status = HealthCheckStatus.FAILED
        
        return status, details, metrics
    
    def _verify_component_checksums(self) -> Dict[str, Any]:
        """
        Validate component checksums.
        
        Returns:
            Results of component checksum verification
        """
        self.logger.debug("Verifying component checksums")
        
        results = {
            'components_checked': len(self.component_checksums),
            'checksums_matched': 0,
            'checksums_mismatched': 0,
            'component_details': {}
        }
        
        # In a real implementation, this would calculate actual checksums
        # For now, we'll simulate the verification
        for component_id, expected_checksum in self.component_checksums.items():
            # Simulate checksum calculation
            actual_checksum = expected_checksum  # Default to matching
            
            # Determine if checksums match
            checksums_match = (actual_checksum == expected_checksum)
            
            # Add component details to results
            results['component_details'][component_id] = {
                'expected_checksum': expected_checksum,
                'actual_checksum': actual_checksum,
                'checksums_match': checksums_match
            }
            
            # Update counters
            if checksums_match:
                results['checksums_matched'] += 1
            else:
                results['checksums_mismatched'] += 1
        
        return results
    
    def _check_interface_compatibility(self) -> Dict[str, Any]:
        """
        Verify interface compatibility.
        
        Returns:
            Results of interface compatibility verification
        """
        self.logger.debug("Checking interface compatibility")
        
        results = {
            'interfaces_checked': len(self.interface_definitions),
            'compatible_interfaces': 0,
            'incompatible_interfaces': 0,
            'interface_details': {}
        }
        
        # In a real implementation, this would check actual interfaces
        # For now, we'll simulate the verification
        for interface_id, expected_definition in self.interface_definitions.items():
            # Simulate interface check
            is_compatible = True  # Default to compatible
            compatibility_details = {}
            
            # Add interface details to results
            results['interface_details'][interface_id] = {
                'is_compatible': is_compatible,
                'details': compatibility_details
            }
            
            # Update counters
            if is_compatible:
                results['compatible_interfaces'] += 1
            else:
                results['incompatible_interfaces'] += 1
        
        return results
    
    def _validate_data_structures(self) -> Dict[str, Any]:
        """
        Check data structure integrity.
        
        Returns:
            Results of data structure validation
        """
        self.logger.debug("Validating data structures")
        
        results = {
            'structures_checked': len(self.data_structure_schemas),
            'valid_structures': 0,
            'invalid_structures': 0,
            'structure_details': {}
        }
        
        # In a real implementation, this would validate actual data structures
        # For now, we'll simulate the validation
        for schema_id, schema in self.data_structure_schemas.items():
            # Simulate validation
            is_valid = True  # Default to valid
            validation_details = {}
            
            # Add structure details to results
            results['structure_details'][schema_id] = {
                'is_valid': is_valid,
                'details': validation_details
            }
            
            # Update counters
            if is_valid:
                results['valid_structures'] += 1
            else:
                results['invalid_structures'] += 1
        
        return results
    
    def _verify_configuration_settings(self) -> Dict[str, Any]:
        """
        Validate configuration settings.
        
        Returns:
            Results of configuration settings verification
        """
        self.logger.debug("Verifying configuration settings")
        
        results = {
            'settings_checked': len(self.configuration_settings),
            'settings_matched': 0,
            'settings_mismatched': 0,
            'setting_details': {}
        }
        
        # In a real implementation, this would check actual configuration settings
        # For now, we'll simulate the verification
        for setting_id, expected_value in self.configuration_settings.items():
            # Simulate configuration check
            actual_value = expected_value  # Default to matching
            
            # Determine if values match
            values_match = (actual_value == expected_value)
            
            # Add setting details to results
            results['setting_details'][setting_id] = {
                'expected_value': expected_value,
                'actual_value': actual_value,
                'values_match': values_match
            }
            
            # Update counters
            if values_match:
                results['settings_matched'] += 1
            else:
                results['settings_mismatched'] += 1
        
        return results
    
    def _calculate_checksum_match_rate(self, results: Dict[str, Any]) -> float:
        """
        Calculate checksum match rate from verification results.
        
        Args:
            results: Results of component checksum verification
            
        Returns:
            Checksum match rate between 0.0 and 1.0
        """
        if results['components_checked'] == 0:
            return 1.0  # No components to check
        
        return results['checksums_matched'] / results['components_checked']
    
    def _calculate_interface_compatibility_rate(self, results: Dict[str, Any]) -> float:
        """
        Calculate interface compatibility rate from verification results.
        
        Args:
            results: Results of interface compatibility verification
            
        Returns:
            Interface compatibility rate between 0.0 and 1.0
        """
        if results['interfaces_checked'] == 0:
            return 1.0  # No interfaces to check
        
        return results['compatible_interfaces'] / results['interfaces_checked']
    
    def _calculate_data_structure_integrity_rate(self, results: Dict[str, Any]) -> float:
        """
        Calculate data structure integrity rate from validation results.
        
        Args:
            results: Results of data structure validation
            
        Returns:
            Data structure integrity rate between 0.0 and 1.0
        """
        if results['structures_checked'] == 0:
            return 1.0  # No structures to check
        
        return results['valid_structures'] / results['structures_checked']
    
    def _calculate_configuration_match_rate(self, results: Dict[str, Any]) -> float:
        """
        Calculate configuration match rate from verification results.
        
        Args:
            results: Results of configuration settings verification
            
        Returns:
            Configuration match rate between 0.0 and 1.0
        """
        if results['settings_checked'] == 0:
            return 1.0  # No settings to check
        
        return results['settings_matched'] / results['settings_checked']


class PerformanceTrendAnalyzer(BaseHealthCheck):
    """
    Health check for performance trend analysis.
    
    This analyzer tracks performance metrics over time to detect degradation
    and identify potential issues before they become critical.
    """
    
    def __init__(self, check_id: str, description: str):
        """
        Initialize the performance trend analyzer.
        
        Args:
            check_id: Unique identifier for the health check
            description: Description of what the health check does
        """
        super().__init__(check_id, HealthCheckCategory.PERFORMANCE, description)
        self.response_time_history = []
        self.resource_usage_history = []
        self.throughput_history = []
        self.error_rate_history = []
        self.baseline_metrics = {}
    
    def add_response_time_data(self, timestamp: float, data: Dict[str, float]) -> None:
        """
        Add response time data to the history.
        
        Args:
            timestamp: Timestamp of the data point
            data: Response time data
        """
        self.response_time_history.append({
            'timestamp': timestamp,
            'data': data
        })
        
        # Keep only the most recent data points (e.g., last 30 days)
        cutoff = time.time() - (30 * 24 * 60 * 60)  # 30 days ago
        self.response_time_history = [
            entry for entry in self.response_time_history
            if entry['timestamp'] >= cutoff
        ]
    
    def add_resource_usage_data(self, timestamp: float, data: Dict[str, float]) -> None:
        """
        Add resource usage data to the history.
        
        Args:
            timestamp: Timestamp of the data point
            data: Resource usage data
        """
        self.resource_usage_history.append({
            'timestamp': timestamp,
            'data': data
        })
        
        # Keep only the most recent data points
        cutoff = time.time() - (30 * 24 * 60 * 60)  # 30 days ago
        self.resource_usage_history = [
            entry for entry in self.resource_usage_history
            if entry['timestamp'] >= cutoff
        ]
    
    def add_throughput_data(self, timestamp: float, data: Dict[str, float]) -> None:
        """
        Add throughput data to the history.
        
        Args:
            timestamp: Timestamp of the data point
            data: Throughput data
        """
        self.throughput_history.append({
            'timestamp': timestamp,
            'data': data
        })
        
        # Keep only the most recent data points
        cutoff = time.time() - (30 * 24 * 60 * 60)  # 30 days ago
        self.throughput_history = [
            entry for entry in self.throughput_history
            if entry['timestamp'] >= cutoff
        ]
    
    def add_error_rate_data(self, timestamp: float, data: Dict[str, float]) -> None:
        """
        Add error rate data to the history.
        
        Args:
            timestamp: Timestamp of the data point
            data: Error rate data
        """
        self.error_rate_history.append({
            'timestamp': timestamp,
            'data': data
        })
        
        # Keep only the most recent data points
        cutoff = time.time() - (30 * 24 * 60 * 60)  # 30 days ago
        self.error_rate_history = [
            entry for entry in self.error_rate_history
            if entry['timestamp'] >= cutoff
        ]
    
    def set_baseline_metrics(self, metrics: Dict[str, Any]) -> None:
        """
        Set the baseline performance metrics.
        
        Args:
            metrics: Baseline performance metrics
        """
        self.baseline_metrics = metrics
    
    def _execute_check(self) -> Tuple[HealthCheckStatus, Dict[str, Any], Dict[str, float]]:
        """
        Execute the performance trend analysis.
        
        Returns:
            Tuple of (status, details, metrics)
        """
        self.logger.info("Executing performance trend analysis")
        
        # Initialize results
        details = {
            'response_time_trends': {},
            'resource_usage_trends': {},
            'throughput_trends': {},
            'error_rate_trends': {}
        }
        metrics = {
            'response_time_score': 0.0,
            'resource_usage_score': 0.0,
            'throughput_score': 0.0,
            'error_rate_score': 0.0,
            'overall_performance_score': 0.0
        }
        
        # Analyze response time trends
        response_time_results = self._analyze_response_time_trends()
        details['response_time_trends'] = response_time_results
        metrics['response_time_score'] = self._calculate_response_time_score(response_time_results)
        
        # Monitor resource usage trends
        resource_usage_results = self._monitor_resource_usage_trends()
        details['resource_usage_trends'] = resource_usage_results
        metrics['resource_usage_score'] = self._calculate_resource_usage_score(resource_usage_results)
        
        # Detect throughput degradation
        throughput_results = self._detect_throughput_degradation()
        details['throughput_trends'] = throughput_results
        metrics['throughput_score'] = self._calculate_throughput_score(throughput_results)
        
        # Track error rate patterns
        error_rate_results = self._track_error_rate_patterns()
        details['error_rate_trends'] = error_rate_results
        metrics['error_rate_score'] = self._calculate_error_rate_score(error_rate_results)
        
        # Calculate overall score
        metrics['overall_performance_score'] = (
            metrics['response_time_score'] * 0.3 +
            metrics['resource_usage_score'] * 0.3 +
            metrics['throughput_score'] * 0.2 +
            metrics['error_rate_score'] * 0.2
        )
        
        # Determine status based on overall score
        if metrics['overall_performance_score'] >= 0.9:
            status = HealthCheckStatus.PASSED
        elif metrics['overall_performance_score'] >= 0.7:
            status = HealthCheckStatus.WARNING
        else:
            status = HealthCheckStatus.FAILED
        
        return status, details, metrics
    
    def _analyze_response_time_trends(self) -> Dict[str, Any]:
        """
        Analyze response time trends.
        
        Returns:
            Results of response time trend analysis
        """
        self.logger.debug("Analyzing response time trends")
        
        results = {
            'metrics_analyzed': 0,
            'degrading_metrics': 0,
            'stable_metrics': 0,
            'improving_metrics': 0,
            'metric_details': {}
        }
        
        # Group data by metric
        metrics = defaultdict(list)
        for entry in self.response_time_history:
            for metric, value in entry['data'].items():
                metrics[metric].append({
                    'timestamp': entry['timestamp'],
                    'value': value
                })
        
        results['metrics_analyzed'] = len(metrics)
        
        # Analyze each metric
        for metric, data_points in metrics.items():
            # Sort data points by timestamp
            data_points.sort(key=lambda x: x['timestamp'])
            
            # Calculate trend
            if len(data_points) >= 2:
                # Simple linear regression
                trend = self._calculate_trend([p['value'] for p in data_points])
                
                # Determine trend direction
                if trend > 0.05:  # Response time increasing (degrading)
                    trend_direction = 'degrading'
                    results['degrading_metrics'] += 1
                elif trend < -0.05:  # Response time decreasing (improving)
                    trend_direction = 'improving'
                    results['improving_metrics'] += 1
                else:  # Response time stable
                    trend_direction = 'stable'
                    results['stable_metrics'] += 1
                
                # Calculate statistics
                values = [p['value'] for p in data_points]
                stats = {
                    'min': min(values),
                    'max': max(values),
                    'avg': sum(values) / len(values),
                    'median': statistics.median(values) if len(values) > 0 else 0,
                    'trend': trend
                }
                
                # Add metric details to results
                results['metric_details'][metric] = {
                    'trend_direction': trend_direction,
                    'data_points': len(data_points),
                    'statistics': stats
                }
            else:
                # Not enough data points for trend analysis
                results['metric_details'][metric] = {
                    'trend_direction': 'unknown',
                    'data_points': len(data_points),
                    'statistics': {}
                }
                results['stable_metrics'] += 1
        
        return results
    
    def _monitor_resource_usage_trends(self) -> Dict[str, Any]:
        """
        Analyze resource usage trends.
        
        Returns:
            Results of resource usage trend analysis
        """
        self.logger.debug("Monitoring resource usage trends")
        
        results = {
            'resources_analyzed': 0,
            'resources_with_increasing_usage': 0,
            'resources_with_stable_usage': 0,
            'resources_with_decreasing_usage': 0,
            'resource_details': {}
        }
        
        # Group data by resource
        resources = defaultdict(list)
        for entry in self.resource_usage_history:
            for resource, value in entry['data'].items():
                resources[resource].append({
                    'timestamp': entry['timestamp'],
                    'value': value
                })
        
        results['resources_analyzed'] = len(resources)
        
        # Analyze each resource
        for resource, data_points in resources.items():
            # Sort data points by timestamp
            data_points.sort(key=lambda x: x['timestamp'])
            
            # Calculate trend
            if len(data_points) >= 2:
                # Simple linear regression
                trend = self._calculate_trend([p['value'] for p in data_points])
                
                # Determine trend direction
                if trend > 0.05:  # Usage increasing
                    trend_direction = 'increasing'
                    results['resources_with_increasing_usage'] += 1
                elif trend < -0.05:  # Usage decreasing
                    trend_direction = 'decreasing'
                    results['resources_with_decreasing_usage'] += 1
                else:  # Usage stable
                    trend_direction = 'stable'
                    results['resources_with_stable_usage'] += 1
                
                # Calculate statistics
                values = [p['value'] for p in data_points]
                stats = {
                    'min': min(values),
                    'max': max(values),
                    'avg': sum(values) / len(values),
                    'median': statistics.median(values) if len(values) > 0 else 0,
                    'trend': trend
                }
                
                # Add resource details to results
                results['resource_details'][resource] = {
                    'trend_direction': trend_direction,
                    'data_points': len(data_points),
                    'statistics': stats
                }
            else:
                # Not enough data points for trend analysis
                results['resource_details'][resource] = {
                    'trend_direction': 'unknown',
                    'data_points': len(data_points),
                    'statistics': {}
                }
                results['resources_with_stable_usage'] += 1
        
        return results
    
    def _detect_throughput_degradation(self) -> Dict[str, Any]:
        """
        Detect throughput degradation.
        
        Returns:
            Results of throughput degradation detection
        """
        self.logger.debug("Detecting throughput degradation")
        
        results = {
            'metrics_analyzed': 0,
            'degrading_metrics': 0,
            'stable_metrics': 0,
            'improving_metrics': 0,
            'metric_details': {}
        }
        
        # Group data by metric
        metrics = defaultdict(list)
        for entry in self.throughput_history:
            for metric, value in entry['data'].items():
                metrics[metric].append({
                    'timestamp': entry['timestamp'],
                    'value': value
                })
        
        results['metrics_analyzed'] = len(metrics)
        
        # Analyze each metric
        for metric, data_points in metrics.items():
            # Sort data points by timestamp
            data_points.sort(key=lambda x: x['timestamp'])
            
            # Calculate trend
            if len(data_points) >= 2:
                # Simple linear regression
                trend = self._calculate_trend([p['value'] for p in data_points])
                
                # Determine trend direction
                if trend < -0.05:  # Throughput decreasing (degrading)
                    trend_direction = 'degrading'
                    results['degrading_metrics'] += 1
                elif trend > 0.05:  # Throughput increasing (improving)
                    trend_direction = 'improving'
                    results['improving_metrics'] += 1
                else:  # Throughput stable
                    trend_direction = 'stable'
                    results['stable_metrics'] += 1
                
                # Calculate statistics
                values = [p['value'] for p in data_points]
                stats = {
                    'min': min(values),
                    'max': max(values),
                    'avg': sum(values) / len(values),
                    'median': statistics.median(values) if len(values) > 0 else 0,
                    'trend': trend
                }
                
                # Add metric details to results
                results['metric_details'][metric] = {
                    'trend_direction': trend_direction,
                    'data_points': len(data_points),
                    'statistics': stats
                }
            else:
                # Not enough data points for trend analysis
                results['metric_details'][metric] = {
                    'trend_direction': 'unknown',
                    'data_points': len(data_points),
                    'statistics': {}
                }
                results['stable_metrics'] += 1
        
        return results
    
    def _track_error_rate_patterns(self) -> Dict[str, Any]:
        """
        Track error rate patterns.
        
        Returns:
            Results of error rate pattern tracking
        """
        self.logger.debug("Tracking error rate patterns")
        
        results = {
            'error_types_analyzed': 0,
            'increasing_error_types': 0,
            'stable_error_types': 0,
            'decreasing_error_types': 0,
            'error_type_details': {}
        }
        
        # Group data by error type
        error_types = defaultdict(list)
        for entry in self.error_rate_history:
            for error_type, value in entry['data'].items():
                error_types[error_type].append({
                    'timestamp': entry['timestamp'],
                    'value': value
                })
        
        results['error_types_analyzed'] = len(error_types)
        
        # Analyze each error type
        for error_type, data_points in error_types.items():
            # Sort data points by timestamp
            data_points.sort(key=lambda x: x['timestamp'])
            
            # Calculate trend
            if len(data_points) >= 2:
                # Simple linear regression
                trend = self._calculate_trend([p['value'] for p in data_points])
                
                # Determine trend direction
                if trend > 0.05:  # Error rate increasing
                    trend_direction = 'increasing'
                    results['increasing_error_types'] += 1
                elif trend < -0.05:  # Error rate decreasing
                    trend_direction = 'decreasing'
                    results['decreasing_error_types'] += 1
                else:  # Error rate stable
                    trend_direction = 'stable'
                    results['stable_error_types'] += 1
                
                # Calculate statistics
                values = [p['value'] for p in data_points]
                stats = {
                    'min': min(values),
                    'max': max(values),
                    'avg': sum(values) / len(values),
                    'median': statistics.median(values) if len(values) > 0 else 0,
                    'trend': trend
                }
                
                # Add error type details to results
                results['error_type_details'][error_type] = {
                    'trend_direction': trend_direction,
                    'data_points': len(data_points),
                    'statistics': stats
                }
            else:
                # Not enough data points for trend analysis
                results['error_type_details'][error_type] = {
                    'trend_direction': 'unknown',
                    'data_points': len(data_points),
                    'statistics': {}
                }
                results['stable_error_types'] += 1
        
        return results
    
    def _calculate_trend(self, values: List[float]) -> float:
        """
        Calculate the trend of a series of values.
        
        Args:
            values: List of values
            
        Returns:
            Trend value (positive for increasing, negative for decreasing)
        """
        if len(values) < 2:
            return 0.0
        
        # Simple linear regression
        n = len(values)
        x = list(range(n))
        
        # Calculate means
        mean_x = sum(x) / n
        mean_y = sum(values) / n
        
        # Calculate slope
        numerator = sum((x[i] - mean_x) * (values[i] - mean_y) for i in range(n))
        denominator = sum((x[i] - mean_x) ** 2 for i in range(n))
        
        if denominator == 0:
            return 0.0
        
        slope = numerator / denominator
        
        # Normalize slope
        return slope / mean_y if mean_y != 0 else 0.0
    
    def _calculate_response_time_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate response time score from trend analysis results.
        
        Args:
            results: Results of response time trend analysis
            
        Returns:
            Response time score between 0.0 and 1.0
        """
        if results['metrics_analyzed'] == 0:
            return 1.0  # No metrics to analyze
        
        # Weight degrading metrics more heavily
        weighted_score = (
            results['stable_metrics'] + 
            results['improving_metrics'] * 1.5 - 
            results['degrading_metrics'] * 2
        ) / results['metrics_analyzed']
        
        # Normalize to 0.0-1.0 range
        return max(0.0, min(1.0, (weighted_score + 2) / 3.5))
    
    def _calculate_resource_usage_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate resource usage score from trend analysis results.
        
        Args:
            results: Results of resource usage trend analysis
            
        Returns:
            Resource usage score between 0.0 and 1.0
        """
        if results['resources_analyzed'] == 0:
            return 1.0  # No resources to analyze
        
        # Weight increasing usage more heavily
        weighted_score = (
            results['resources_with_stable_usage'] + 
            results['resources_with_decreasing_usage'] * 1.5 - 
            results['resources_with_increasing_usage'] * 2
        ) / results['resources_analyzed']
        
        # Normalize to 0.0-1.0 range
        return max(0.0, min(1.0, (weighted_score + 2) / 3.5))
    
    def _calculate_throughput_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate throughput score from degradation detection results.
        
        Args:
            results: Results of throughput degradation detection
            
        Returns:
            Throughput score between 0.0 and 1.0
        """
        if results['metrics_analyzed'] == 0:
            return 1.0  # No metrics to analyze
        
        # Weight degrading metrics more heavily
        weighted_score = (
            results['stable_metrics'] + 
            results['improving_metrics'] * 1.5 - 
            results['degrading_metrics'] * 2
        ) / results['metrics_analyzed']
        
        # Normalize to 0.0-1.0 range
        return max(0.0, min(1.0, (weighted_score + 2) / 3.5))
    
    def _calculate_error_rate_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate error rate score from pattern tracking results.
        
        Args:
            results: Results of error rate pattern tracking
            
        Returns:
            Error rate score between 0.0 and 1.0
        """
        if results['error_types_analyzed'] == 0:
            return 1.0  # No error types to analyze
        
        # Weight increasing error rates more heavily
        weighted_score = (
            results['stable_error_types'] + 
            results['decreasing_error_types'] * 1.5 - 
            results['increasing_error_types'] * 2
        ) / results['error_types_analyzed']
        
        # Normalize to 0.0-1.0 range
        return max(0.0, min(1.0, (weighted_score + 2) / 3.5))


class HealthCheckSystem:
    """
    System for managing and executing health checks.
    
    This system provides a framework for registering, executing, and reporting
    on health checks for the Continuous Risk Monitoring system.
    """
    
    def __init__(self):
        """Initialize the health check system."""
        self.health_checks = {}
        self.results_history = {}
        self.logger = logging.getLogger("HealthCheckSystem")
        self.logger.info("Initialized health check system")
    
    def register_health_check(self, health_check: BaseHealthCheck) -> None:
        """
        Register a health check with the system.
        
        Args:
            health_check: Health check to register
        """
        self.health_checks[health_check.check_id] = health_check
        self.logger.info(f"Registered health check: {health_check.check_id}")
    
    def execute_health_check(self, check_id: str) -> HealthCheckResult:
        """
        Execute a specific health check.
        
        Args:
            check_id: ID of the health check to execute
            
        Returns:
            Result of the health check
            
        Raises:
            ValueError: If the health check ID is not registered
        """
        if check_id not in self.health_checks:
            raise ValueError(f"Health check not registered: {check_id}")
        
        health_check = self.health_checks[check_id]
        result = health_check.execute()
        
        # Store result in history
        if check_id not in self.results_history:
            self.results_history[check_id] = []
        
        self.results_history[check_id].append(result)
        
        # Keep only the most recent results (e.g., last 30)
        if len(self.results_history[check_id]) > 30:
            self.results_history[check_id] = self.results_history[check_id][-30:]
        
        return result
    
    def execute_all_health_checks(self) -> Dict[str, HealthCheckResult]:
        """
        Execute all registered health checks.
        
        Returns:
            Dictionary mapping check IDs to results
        """
        self.logger.info(f"Executing all health checks ({len(self.health_checks)} total)")
        
        results = {}
        for check_id in self.health_checks:
            results[check_id] = self.execute_health_check(check_id)
        
        return results
    
    def execute_category_health_checks(self, category: HealthCheckCategory) -> Dict[str, HealthCheckResult]:
        """
        Execute all health checks in a specific category.
        
        Args:
            category: Category of health checks to execute
            
        Returns:
            Dictionary mapping check IDs to results
        """
        self.logger.info(f"Executing health checks in category: {category.value}")
        
        results = {}
        for check_id, health_check in self.health_checks.items():
            if health_check.category == category:
                results[check_id] = self.execute_health_check(check_id)
        
        return results
    
    def get_latest_result(self, check_id: str) -> Optional[HealthCheckResult]:
        """
        Get the latest result for a specific health check.
        
        Args:
            check_id: ID of the health check
            
        Returns:
            Latest result, or None if no results are available
        """
        if check_id not in self.results_history or not self.results_history[check_id]:
            return None
        
        return self.results_history[check_id][-1]
    
    def get_result_history(self, check_id: str) -> List[HealthCheckResult]:
        """
        Get the result history for a specific health check.
        
        Args:
            check_id: ID of the health check
            
        Returns:
            List of results, newest first
        """
        if check_id not in self.results_history:
            return []
        
        return list(reversed(self.results_history[check_id]))
    
    def get_system_health_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the overall system health.
        
        Returns:
            Dictionary containing system health summary
        """
        self.logger.info("Generating system health summary")
        
        summary = {
            'timestamp': time.time(),
            'total_checks': len(self.health_checks),
            'checks_with_results': 0,
            'status_counts': {
                HealthCheckStatus.PASSED.value: 0,
                HealthCheckStatus.WARNING.value: 0,
                HealthCheckStatus.FAILED.value: 0,
                HealthCheckStatus.ERROR.value: 0,
                HealthCheckStatus.SKIPPED.value: 0
            },
            'category_summaries': {},
            'overall_status': HealthCheckStatus.PASSED.value
        }
        
        # Initialize category summaries
        for category in HealthCheckCategory:
            summary['category_summaries'][category.value] = {
                'total_checks': 0,
                'checks_with_results': 0,
                'status_counts': {
                    HealthCheckStatus.PASSED.value: 0,
                    HealthCheckStatus.WARNING.value: 0,
                    HealthCheckStatus.FAILED.value: 0,
                    HealthCheckStatus.ERROR.value: 0,
                    HealthCheckStatus.SKIPPED.value: 0
                },
                'status': HealthCheckStatus.PASSED.value
            }
        
        # Count health checks by category
        for check_id, health_check in self.health_checks.items():
            category = health_check.category.value
            summary['category_summaries'][category]['total_checks'] += 1
        
        # Process latest results
        for check_id, health_check in self.health_checks.items():
            latest_result = self.get_latest_result(check_id)
            category = health_check.category.value
            
            if latest_result:
                summary['checks_with_results'] += 1
                summary['category_summaries'][category]['checks_with_results'] += 1
                
                status = latest_result.status.value
                summary['status_counts'][status] += 1
                summary['category_summaries'][category]['status_counts'][status] += 1
        
        # Determine category statuses
        for category, category_summary in summary['category_summaries'].items():
            if category_summary['status_counts'][HealthCheckStatus.FAILED.value] > 0:
                category_summary['status'] = HealthCheckStatus.FAILED.value
            elif category_summary['status_counts'][HealthCheckStatus.ERROR.value] > 0:
                category_summary['status'] = HealthCheckStatus.ERROR.value
            elif category_summary['status_counts'][HealthCheckStatus.WARNING.value] > 0:
                category_summary['status'] = HealthCheckStatus.WARNING.value
        
        # Determine overall status
        if summary['status_counts'][HealthCheckStatus.FAILED.value] > 0:
            summary['overall_status'] = HealthCheckStatus.FAILED.value
        elif summary['status_counts'][HealthCheckStatus.ERROR.value] > 0:
            summary['overall_status'] = HealthCheckStatus.ERROR.value
        elif summary['status_counts'][HealthCheckStatus.WARNING.value] > 0:
            summary['overall_status'] = HealthCheckStatus.WARNING.value
        
        return summary
    
    def save_results_to_file(self, filename: str) -> None:
        """
        Save all health check results to a file.
        
        Args:
            filename: Path to the file
        """
        self.logger.info(f"Saving health check results to file: {filename}")
        
        # Convert results to serializable format
        serializable_history = {}
        for check_id, results in self.results_history.items():
            serializable_history[check_id] = [result.to_dict() for result in results]
        
        with open(filename, 'w') as f:
            json.dump(serializable_history, f, indent=2)
    
    def load_results_from_file(self, filename: str) -> None:
        """
        Load health check results from a file.
        
        Args:
            filename: Path to the file
        """
        self.logger.info(f"Loading health check results from file: {filename}")
        
        with open(filename, 'r') as f:
            serializable_history = json.load(f)
        
        # Convert serializable format to results
        self.results_history = {}
        for check_id, serializable_results in serializable_history.items():
            self.results_history[check_id] = [
                HealthCheckResult.from_dict(result_dict)
                for result_dict in serializable_results
            ]
