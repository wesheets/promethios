"""
Verification Manager for Promethios Governance System.

This module provides the central manager for formal verification operations, coordinating
the verification of cryptographic and governance properties across the system.
"""

import logging
import time
import json
import os
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger(__name__)

class VerificationManager:
    """
    Manages formal verification operations for the governance system.
    
    Provides a framework for verifying cryptographic and governance properties,
    ensuring the correctness and security of the Promethios system.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the verification manager with the specified configuration.
        
        Args:
            config_path: Path to the verification configuration file
        """
        self.config = self._load_config(config_path)
        self.verifier_registry = {}
        self.property_registry = {}
        self.verification_history = {}
        self.active_verifications = {}
        self.logger = logging.getLogger(__name__)
        
        # Initialize components
        self._initialize_components()
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """
        Load configuration from the specified path.
        
        Args:
            config_path: Path to the configuration file
            
        Returns:
            dict: Configuration data
        """
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Validate required configuration parameters
            required_params = ['verification_domains', 'verification_timeout', 'max_verification_retries']
            for param in required_params:
                if param not in config:
                    raise ValueError(f"Missing required configuration parameter: {param}")
            
            return config
        except Exception as e:
            self.logger.error(f"Failed to load configuration: {str(e)}")
            # Provide sensible defaults for critical parameters
            return {
                'verification_domains': ['consensus', 'trust', 'governance', 'crypto', 'system'],
                'verification_timeout': 300,  # 5 minutes in seconds
                'max_verification_retries': 3,
                'verification_log_directory': '/var/log/promethios/verification',
                'verification_result_directory': '/var/lib/promethios/verification_results'
            }
    
    def _initialize_components(self) -> None:
        """
        Initialize verification components based on configuration.
        """
        # Initialize verifiers
        for domain in self.config.get('verification_domains', []):
            verifier_class = self._get_verifier_class(domain)
            if verifier_class:
                self.verifier_registry[domain] = verifier_class(self.config)
                self.logger.info(f"Initialized verifier for {domain}")
        
        # Register default properties
        self._register_default_properties()
        
        # Ensure directories exist
        os.makedirs(self.config.get('verification_log_directory', '/var/log/promethios/verification'), exist_ok=True)
        os.makedirs(self.config.get('verification_result_directory', '/var/lib/promethios/verification_results'), exist_ok=True)
    
    def _get_verifier_class(self, domain: str) -> Any:
        """
        Get the verifier class for the specified domain.
        
        Args:
            domain: Verification domain
            
        Returns:
            class: Verifier class
        """
        if domain == 'consensus':
            from .consensus_verifier import ConsensusVerifier
            return ConsensusVerifier
        elif domain == 'trust':
            from .trust_verifier import TrustVerifier
            return TrustVerifier
        elif domain == 'governance':
            from .governance_verifier import GovernanceVerifier
            return GovernanceVerifier
        elif domain == 'crypto':
            from .crypto_verifier import CryptoVerifier
            return CryptoVerifier
        elif domain == 'system':
            from .system_verifier import SystemVerifier
            return SystemVerifier
        else:
            self.logger.warning(f"Unsupported verification domain: {domain}")
            return None
    
    def _register_default_properties(self) -> None:
        """
        Register default verification properties based on configuration.
        """
        # Register consensus properties
        consensus_properties = [
            {
                'id': 'consensus_safety',
                'name': 'Consensus Safety',
                'description': 'Verifies that the consensus protocol satisfies safety properties',
                'domain': 'consensus',
                'status': 'active'
            },
            {
                'id': 'consensus_liveness',
                'name': 'Consensus Liveness',
                'description': 'Verifies that the consensus protocol satisfies liveness properties',
                'domain': 'consensus',
                'status': 'active'
            },
            {
                'id': 'byzantine_fault_tolerance',
                'name': 'Byzantine Fault Tolerance',
                'description': 'Verifies that the consensus protocol is Byzantine fault tolerant',
                'domain': 'consensus',
                'status': 'active'
            }
        ]
        
        for property_data in consensus_properties:
            self.register_property(property_data)
        
        # Register trust properties
        trust_properties = [
            {
                'id': 'trust_boundary_integrity',
                'name': 'Trust Boundary Integrity',
                'description': 'Verifies that trust boundaries are properly enforced',
                'domain': 'trust',
                'status': 'active'
            },
            {
                'id': 'trust_metric_consistency',
                'name': 'Trust Metric Consistency',
                'description': 'Verifies that trust metrics are consistently calculated and applied',
                'domain': 'trust',
                'status': 'active'
            },
            {
                'id': 'trust_decay_correctness',
                'name': 'Trust Decay Correctness',
                'description': 'Verifies that trust decay is correctly implemented',
                'domain': 'trust',
                'status': 'active'
            }
        ]
        
        for property_data in trust_properties:
            self.register_property(property_data)
        
        # Register governance properties
        governance_properties = [
            {
                'id': 'governance_policy_consistency',
                'name': 'Governance Policy Consistency',
                'description': 'Verifies that governance policies are consistently applied',
                'domain': 'governance',
                'status': 'active'
            },
            {
                'id': 'governance_expansion_safety',
                'name': 'Governance Expansion Safety',
                'description': 'Verifies that governance expansion operations are safe',
                'domain': 'governance',
                'status': 'active'
            },
            {
                'id': 'governance_attestation_validity',
                'name': 'Governance Attestation Validity',
                'description': 'Verifies that governance attestations are valid',
                'domain': 'governance',
                'status': 'active'
            }
        ]
        
        for property_data in governance_properties:
            self.register_property(property_data)
        
        # Register crypto properties
        crypto_properties = [
            {
                'id': 'crypto_algorithm_correctness',
                'name': 'Cryptographic Algorithm Correctness',
                'description': 'Verifies that cryptographic algorithms are correctly implemented',
                'domain': 'crypto',
                'status': 'active'
            },
            {
                'id': 'crypto_key_management_security',
                'name': 'Cryptographic Key Management Security',
                'description': 'Verifies that cryptographic keys are securely managed',
                'domain': 'crypto',
                'status': 'active'
            },
            {
                'id': 'crypto_protocol_security',
                'name': 'Cryptographic Protocol Security',
                'description': 'Verifies that cryptographic protocols are secure',
                'domain': 'crypto',
                'status': 'active'
            }
        ]
        
        for property_data in crypto_properties:
            self.register_property(property_data)
        
        # Register system properties
        system_properties = [
            {
                'id': 'system_resource_bounds',
                'name': 'System Resource Bounds',
                'description': 'Verifies that system resource usage is within bounds',
                'domain': 'system',
                'status': 'active'
            },
            {
                'id': 'system_error_handling',
                'name': 'System Error Handling',
                'description': 'Verifies that system errors are properly handled',
                'domain': 'system',
                'status': 'active'
            },
            {
                'id': 'system_concurrency_safety',
                'name': 'System Concurrency Safety',
                'description': 'Verifies that concurrent operations are safe',
                'domain': 'system',
                'status': 'active'
            }
        ]
        
        for property_data in system_properties:
            self.register_property(property_data)
    
    def register_property(self, property_data: Dict[str, Any]) -> bool:
        """
        Register a verification property.
        
        Args:
            property_data: Data about the property
            
        Returns:
            bool: True if registration was successful
        """
        property_id = property_data.get('id')
        if not property_id:
            self.logger.error("Property ID is required")
            return False
        
        # Check if property already exists
        if property_id in self.property_registry:
            self.logger.warning(f"Property {property_id} already registered")
            return False
        
        # Add metadata
        property_data['registered_at'] = time.time()
        
        # Register property
        self.property_registry[property_id] = property_data
        
        self.logger.info(f"Registered property {property_id}")
        return True
    
    def get_property(self, property_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a registered property.
        
        Args:
            property_id: Identifier for the property
            
        Returns:
            dict or None: Property data
        """
        return self.property_registry.get(property_id)
    
    def list_properties(self, domain: str = None, status: str = None) -> List[Dict[str, Any]]:
        """
        List registered properties.
        
        Args:
            domain: Domain to filter by, or None for all domains
            status: Status to filter by, or None for all statuses
            
        Returns:
            list: Registered properties
        """
        properties = []
        
        for property_id, property_data in self.property_registry.items():
            # Filter by domain
            if domain and property_data.get('domain') != domain:
                continue
            
            # Filter by status
            if status and property_data.get('status') != status:
                continue
            
            properties.append(property_data)
        
        return properties
    
    def update_property_status(self, property_id: str, status: str) -> bool:
        """
        Update the status of a registered property.
        
        Args:
            property_id: Identifier for the property
            status: New status for the property
            
        Returns:
            bool: True if update was successful
        """
        if property_id not in self.property_registry:
            self.logger.error(f"Property {property_id} not found")
            return False
        
        # Update status
        self.property_registry[property_id]['status'] = status
        self.property_registry[property_id]['updated_at'] = time.time()
        
        self.logger.info(f"Updated property {property_id} status to {status}")
        return True
    
    def verify_property(self, property_id: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Verify a property.
        
        Args:
            property_id: Identifier for the property to verify
            context: Context data for verification
            
        Returns:
            dict: Verification result
        """
        property_data = self.get_property(property_id)
        if not property_data:
            self.logger.error(f"Property {property_id} not found")
            return {
                'property_id': property_id,
                'success': False,
                'error': 'Property not found',
                'timestamp': time.time()
            }
        
        domain = property_data.get('domain')
        if domain not in self.verifier_registry:
            self.logger.error(f"No verifier found for domain {domain}")
            return {
                'property_id': property_id,
                'success': False,
                'error': f'No verifier found for domain {domain}',
                'timestamp': time.time()
            }
        
        verifier = self.verifier_registry[domain]
        
        # Create verification ID
        verification_id = f"{property_id}_{int(time.time())}"
        
        # Add to active verifications
        self.active_verifications[verification_id] = {
            'property_id': property_id,
            'domain': domain,
            'context': context,
            'started_at': time.time(),
            'status': 'running'
        }
        
        try:
            # Verify property
            result = verifier.verify_property(property_id, context)
            
            # Update active verification
            self.active_verifications[verification_id]['status'] = 'completed'
            self.active_verifications[verification_id]['completed_at'] = time.time()
            self.active_verifications[verification_id]['result'] = result
            
            # Add to verification history
            self.verification_history[verification_id] = self.active_verifications[verification_id]
            
            # Remove from active verifications
            del self.active_verifications[verification_id]
            
            # Save result
            self._save_verification_result(verification_id, result)
            
            return result
        except Exception as e:
            self.logger.error(f"Error verifying property {property_id}: {str(e)}")
            
            # Update active verification
            self.active_verifications[verification_id]['status'] = 'failed'
            self.active_verifications[verification_id]['completed_at'] = time.time()
            self.active_verifications[verification_id]['error'] = str(e)
            
            # Add to verification history
            self.verification_history[verification_id] = self.active_verifications[verification_id]
            
            # Remove from active verifications
            del self.active_verifications[verification_id]
            
            return {
                'property_id': property_id,
                'success': False,
                'error': str(e),
                'timestamp': time.time()
            }
    
    def _save_verification_result(self, verification_id: str, result: Dict[str, Any]) -> bool:
        """
        Save a verification result.
        
        Args:
            verification_id: Identifier for the verification
            result: Verification result
            
        Returns:
            bool: True if save was successful
        """
        result_path = os.path.join(
            self.config.get('verification_result_directory', '/var/lib/promethios/verification_results'),
            f"{verification_id}.json"
        )
        
        try:
            with open(result_path, 'w') as f:
                json.dump(result, f, indent=2)
            
            return True
        except Exception as e:
            self.logger.error(f"Error saving verification result: {str(e)}")
            return False
    
    def verify_domain(self, domain: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Verify all properties for a domain.
        
        Args:
            domain: Domain to verify
            context: Context data for verification
            
        Returns:
            dict: Verification results
        """
        properties = self.list_properties(domain, 'active')
        
        results = {
            'domain': domain,
            'timestamp': time.time(),
            'properties': {}
        }
        
        for property_data in properties:
            property_id = property_data.get('id')
            result = self.verify_property(property_id, context)
            results['properties'][property_id] = result
        
        # Calculate overall success
        success = all(result.get('success', False) for result in results['properties'].values())
        results['success'] = success
        
        return results
    
    def verify_all(self, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Verify all properties for all domains.
        
        Args:
            context: Context data for verification
            
        Returns:
            dict: Verification results
        """
        domains = self.config.get('verification_domains', [])
        
        results = {
            'timestamp': time.time(),
            'domains': {}
        }
        
        for domain in domains:
            domain_results = self.verify_domain(domain, context)
            results['domains'][domain] = domain_results
        
        # Calculate overall success
        success = all(domain_result.get('success', False) for domain_result in results['domains'].values())
        results['success'] = success
        
        return results
    
    def get_verification_history(self, property_id: str = None, domain: str = None) -> Dict[str, Dict[str, Any]]:
        """
        Get verification history.
        
        Args:
            property_id: Identifier for the property, or None for all properties
            domain: Domain to filter by, or None for all domains
            
        Returns:
            dict: Verification history
        """
        if property_id:
            # Filter by property ID
            return {
                verification_id: verification_data
                for verification_id, verification_data in self.verification_history.items()
                if verification_data.get('property_id') == property_id
            }
        elif domain:
            # Filter by domain
            return {
                verification_id: verification_data
                for verification_id, verification_data in self.verification_history.items()
                if verification_data.get('domain') == domain
            }
        else:
            # Return all history
            return self.verification_history
    
    def get_active_verifications(self, property_id: str = None, domain: str = None) -> Dict[str, Dict[str, Any]]:
        """
        Get active verifications.
        
        Args:
            property_id: Identifier for the property, or None for all properties
            domain: Domain to filter by, or None for all domains
            
        Returns:
            dict: Active verifications
        """
        if property_id:
            # Filter by property ID
            return {
                verification_id: verification_data
                for verification_id, verification_data in self.active_verifications.items()
                if verification_data.get('property_id') == property_id
            }
        elif domain:
            # Filter by domain
            return {
                verification_id: verification_data
                for verification_id, verification_data in self.active_verifications.items()
                if verification_data.get('domain') == domain
            }
        else:
            # Return all active verifications
            return self.active_verifications
    
    def cancel_verification(self, verification_id: str) -> bool:
        """
        Cancel an active verification.
        
        Args:
            verification_id: Identifier for the verification
            
        Returns:
            bool: True if cancellation was successful
        """
        if verification_id not in self.active_verifications:
            self.logger.error(f"Verification {verification_id} not found or not active")
            return False
        
        # Update active verification
        self.active_verifications[verification_id]['status'] = 'cancelled'
        self.active_verifications[verification_id]['completed_at'] = time.time()
        
        # Add to verification history
        self.verification_history[verification_id] = self.active_verifications[verification_id]
        
        # Remove from active verifications
        del self.active_verifications[verification_id]
        
        self.logger.info(f"Cancelled verification {verification_id}")
        return True
    
    def generate_verification_report(self, output_file: str, property_id: str = None, domain: str = None) -> bool:
        """
        Generate a verification report.
        
        Args:
            output_file: Output file path
            property_id: Identifier for the property, or None for all properties
            domain: Domain to filter by, or None for all domains
            
        Returns:
            bool: True if report generation was successful
        """
        try:
            # Get verification history
            history = self.get_verification_history(property_id, domain)
            
            # Generate report
            report = {
                'generated_at': time.time(),
                'property_id': property_id,
                'domain': domain,
                'verifications': history
            }
            
            # Write to output file
            with open(output_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            self.logger.info(f"Generated verification report at {output_file}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to generate verification report: {str(e)}")
            return False
