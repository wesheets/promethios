"""
Interoperability Manager for Promethios Governance System.

This module provides the central manager for cross-system governance interoperability,
coordinating interactions between Promethios and external governance systems.
"""

import logging
import time
import json
import os
import uuid
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger(__name__)

class InteroperabilityManager:
    """
    Manages cross-system governance interoperability for the Promethios system.
    
    Provides a framework for secure and standardized interoperability between
    Promethios and external governance systems, enabling cross-system governance
    operations while maintaining security and trust.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the interoperability manager with the specified configuration.
        
        Args:
            config_path: Path to the interoperability configuration file
        """
        self.config = self._load_config(config_path)
        self.connector_registry = {}
        self.protocol_registry = {}
        self.system_registry = {}
        self.transaction_history = {}
        self.active_transactions = {}
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
            required_params = ['supported_protocols', 'trust_threshold', 'max_transaction_timeout']
            for param in required_params:
                if param not in config:
                    raise ValueError(f"Missing required configuration parameter: {param}")
            
            return config
        except Exception as e:
            self.logger.error(f"Failed to load configuration: {str(e)}")
            # Provide sensible defaults for critical parameters
            return {
                'supported_protocols': ['promethios-native', 'governance-exchange-protocol'],
                'trust_threshold': 0.7,
                'max_transaction_timeout': 300,  # 5 minutes in seconds
                'transaction_log_directory': '/var/log/promethios/interop',
                'system_registry_path': '/var/lib/promethios/interop/systems'
            }
    
    def _initialize_components(self) -> None:
        """
        Initialize interoperability components based on configuration.
        """
        # Initialize connectors
        for protocol in self.config.get('supported_protocols', []):
            connector_class = self._get_connector_class(protocol)
            if connector_class:
                self.connector_registry[protocol] = connector_class(self.config)
                self.logger.info(f"Initialized connector for {protocol}")
        
        # Register protocols
        self._register_protocols()
        
        # Load system registry
        self._load_system_registry()
        
        # Ensure directories exist
        os.makedirs(self.config.get('transaction_log_directory', '/var/log/promethios/interop'), exist_ok=True)
        os.makedirs(os.path.dirname(self.config.get('system_registry_path', '/var/lib/promethios/interop/systems')), exist_ok=True)
    
    def _get_connector_class(self, protocol: str) -> Any:
        """
        Get the connector class for the specified protocol.
        
        Args:
            protocol: Protocol identifier
            
        Returns:
            class: Connector class
        """
        if protocol == 'promethios-native':
            from .connectors.promethios_native_connector import PromethiosNativeConnector
            return PromethiosNativeConnector
        elif protocol == 'governance-exchange-protocol':
            from .connectors.governance_exchange_connector import GovernanceExchangeConnector
            return GovernanceExchangeConnector
        elif protocol == 'open-governance-protocol':
            from .connectors.open_governance_connector import OpenGovernanceConnector
            return OpenGovernanceConnector
        elif protocol == 'enterprise-governance-bridge':
            from .connectors.enterprise_governance_connector import EnterpriseGovernanceConnector
            return EnterpriseGovernanceConnector
        else:
            self.logger.warning(f"Unsupported protocol: {protocol}")
            return None
    
    def _register_protocols(self) -> None:
        """
        Register supported interoperability protocols.
        """
        # Register Promethios Native Protocol
        self.protocol_registry['promethios-native'] = {
            'id': 'promethios-native',
            'name': 'Promethios Native Protocol',
            'version': '1.0',
            'description': 'Native protocol for Promethios governance systems',
            'security_level': 'high',
            'operations': [
                'governance_query',
                'governance_attestation',
                'governance_verification',
                'governance_expansion',
                'governance_delegation'
            ]
        }
        
        # Register Governance Exchange Protocol
        self.protocol_registry['governance-exchange-protocol'] = {
            'id': 'governance-exchange-protocol',
            'name': 'Governance Exchange Protocol',
            'version': '1.0',
            'description': 'Standard protocol for exchanging governance information between systems',
            'security_level': 'medium',
            'operations': [
                'governance_query',
                'governance_attestation',
                'governance_verification'
            ]
        }
        
        # Register Open Governance Protocol
        self.protocol_registry['open-governance-protocol'] = {
            'id': 'open-governance-protocol',
            'name': 'Open Governance Protocol',
            'version': '1.0',
            'description': 'Open protocol for governance interoperability',
            'security_level': 'medium',
            'operations': [
                'governance_query',
                'governance_attestation'
            ]
        }
        
        # Register Enterprise Governance Bridge
        self.protocol_registry['enterprise-governance-bridge'] = {
            'id': 'enterprise-governance-bridge',
            'name': 'Enterprise Governance Bridge',
            'version': '1.0',
            'description': 'Protocol for bridging with enterprise governance systems',
            'security_level': 'high',
            'operations': [
                'governance_query',
                'governance_attestation',
                'governance_verification',
                'governance_delegation'
            ]
        }
    
    def _load_system_registry(self) -> None:
        """
        Load the system registry from storage.
        """
        registry_path = self.config.get('system_registry_path', '/var/lib/promethios/interop/systems')
        
        try:
            if os.path.exists(registry_path):
                with open(registry_path, 'r') as f:
                    self.system_registry = json.load(f)
            else:
                self.system_registry = {}
        except Exception as e:
            self.logger.error(f"Failed to load system registry: {str(e)}")
            self.system_registry = {}
    
    def _save_system_registry(self) -> bool:
        """
        Save the system registry to storage.
        
        Returns:
            bool: True if save was successful
        """
        registry_path = self.config.get('system_registry_path', '/var/lib/promethios/interop/systems')
        
        try:
            with open(registry_path, 'w') as f:
                json.dump(self.system_registry, f, indent=2)
            
            return True
        except Exception as e:
            self.logger.error(f"Failed to save system registry: {str(e)}")
            return False
    
    def register_external_system(self, system_data: Dict[str, Any]) -> str:
        """
        Register an external governance system.
        
        Args:
            system_data: Data about the external system
            
        Returns:
            str: System identifier
        """
        # Validate required fields
        required_fields = ['name', 'protocol', 'endpoint', 'public_key']
        for field in required_fields:
            if field not in system_data:
                self.logger.error(f"Missing required field: {field}")
                return ""
        
        # Check if protocol is supported
        protocol = system_data.get('protocol')
        if protocol not in self.protocol_registry:
            self.logger.error(f"Unsupported protocol: {protocol}")
            return ""
        
        # Generate system ID if not provided
        system_id = system_data.get('id', str(uuid.uuid4()))
        
        # Add metadata
        system_data['id'] = system_id
        system_data['registered_at'] = time.time()
        system_data['trust_score'] = system_data.get('trust_score', 0.5)  # Default trust score
        system_data['status'] = 'registered'
        
        # Register system
        self.system_registry[system_id] = system_data
        
        # Save system registry
        self._save_system_registry()
        
        self.logger.info(f"Registered external system: {system_id}")
        return system_id
    
    def get_external_system(self, system_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered external system.
        
        Args:
            system_id: Identifier for the external system
            
        Returns:
            dict or None: System data
        """
        return self.system_registry.get(system_id)
    
    def list_external_systems(self, protocol: str = None, status: str = None) -> List[Dict[str, Any]]:
        """
        List registered external systems.
        
        Args:
            protocol: Protocol to filter by, or None for all protocols
            status: Status to filter by, or None for all statuses
            
        Returns:
            list: Registered external systems
        """
        systems = []
        
        for system_id, system_data in self.system_registry.items():
            # Filter by protocol
            if protocol and system_data.get('protocol') != protocol:
                continue
            
            # Filter by status
            if status and system_data.get('status') != status:
                continue
            
            systems.append(system_data)
        
        return systems
    
    def update_system_status(self, system_id: str, status: str) -> bool:
        """
        Update the status of a registered external system.
        
        Args:
            system_id: Identifier for the external system
            status: New status for the system
            
        Returns:
            bool: True if update was successful
        """
        if system_id not in self.system_registry:
            self.logger.error(f"System {system_id} not found")
            return False
        
        # Update status
        self.system_registry[system_id]['status'] = status
        self.system_registry[system_id]['updated_at'] = time.time()
        
        # Save system registry
        self._save_system_registry()
        
        self.logger.info(f"Updated system {system_id} status to {status}")
        return True
    
    def update_system_trust_score(self, system_id: str, trust_score: float) -> bool:
        """
        Update the trust score of a registered external system.
        
        Args:
            system_id: Identifier for the external system
            trust_score: New trust score for the system
            
        Returns:
            bool: True if update was successful
        """
        if system_id not in self.system_registry:
            self.logger.error(f"System {system_id} not found")
            return False
        
        # Validate trust score
        if trust_score < 0 or trust_score > 1:
            self.logger.error(f"Invalid trust score: {trust_score}")
            return False
        
        # Update trust score
        self.system_registry[system_id]['trust_score'] = trust_score
        self.system_registry[system_id]['updated_at'] = time.time()
        
        # Save system registry
        self._save_system_registry()
        
        self.logger.info(f"Updated system {system_id} trust score to {trust_score}")
        return True
    
    def verify_external_system(self, system_id: str) -> Dict[str, Any]:
        """
        Verify an external governance system.
        
        Args:
            system_id: Identifier for the external system
            
        Returns:
            dict: Verification result
        """
        system_data = self.get_external_system(system_id)
        if not system_data:
            self.logger.error(f"System {system_id} not found")
            return {
                'system_id': system_id,
                'success': False,
                'error': 'System not found',
                'timestamp': time.time()
            }
        
        protocol = system_data.get('protocol')
        if protocol not in self.connector_registry:
            self.logger.error(f"No connector found for protocol {protocol}")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'No connector found for protocol {protocol}',
                'timestamp': time.time()
            }
        
        connector = self.connector_registry[protocol]
        
        try:
            # Verify system
            result = connector.verify_system(system_data)
            
            # Update system status based on verification result
            if result.get('success', False):
                self.update_system_status(system_id, 'verified')
            else:
                self.update_system_status(system_id, 'verification_failed')
            
            return result
        except Exception as e:
            self.logger.error(f"Error verifying system {system_id}: {str(e)}")
            
            # Update system status
            self.update_system_status(system_id, 'verification_failed')
            
            return {
                'system_id': system_id,
                'success': False,
                'error': str(e),
                'timestamp': time.time()
            }
    
    def query_governance_state(self, system_id: str, query_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Query the governance state of an external system.
        
        Args:
            system_id: Identifier for the external system
            query_params: Parameters for the query
            
        Returns:
            dict: Query result
        """
        system_data = self.get_external_system(system_id)
        if not system_data:
            self.logger.error(f"System {system_id} not found")
            return {
                'system_id': system_id,
                'success': False,
                'error': 'System not found',
                'timestamp': time.time()
            }
        
        # Check system status
        status = system_data.get('status')
        if status != 'verified':
            self.logger.error(f"System {system_id} is not verified (status: {status})")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'System is not verified (status: {status})',
                'timestamp': time.time()
            }
        
        # Check trust score
        trust_score = system_data.get('trust_score', 0)
        trust_threshold = self.config.get('trust_threshold', 0.7)
        if trust_score < trust_threshold:
            self.logger.error(f"System {system_id} trust score ({trust_score}) is below threshold ({trust_threshold})")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'System trust score ({trust_score}) is below threshold ({trust_threshold})',
                'timestamp': time.time()
            }
        
        protocol = system_data.get('protocol')
        if protocol not in self.connector_registry:
            self.logger.error(f"No connector found for protocol {protocol}")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'No connector found for protocol {protocol}',
                'timestamp': time.time()
            }
        
        connector = self.connector_registry[protocol]
        
        # Create transaction ID
        transaction_id = f"query_{int(time.time())}_{system_id}"
        
        # Add to active transactions
        self.active_transactions[transaction_id] = {
            'id': transaction_id,
            'type': 'query',
            'system_id': system_id,
            'params': query_params,
            'started_at': time.time(),
            'status': 'running'
        }
        
        try:
            # Query governance state
            result = connector.query_governance_state(system_data, query_params)
            
            # Update active transaction
            self.active_transactions[transaction_id]['status'] = 'completed'
            self.active_transactions[transaction_id]['completed_at'] = time.time()
            self.active_transactions[transaction_id]['result'] = result
            
            # Add to transaction history
            self.transaction_history[transaction_id] = self.active_transactions[transaction_id]
            
            # Remove from active transactions
            del self.active_transactions[transaction_id]
            
            # Log transaction
            self._log_transaction(transaction_id, self.transaction_history[transaction_id])
            
            return result
        except Exception as e:
            self.logger.error(f"Error querying governance state from system {system_id}: {str(e)}")
            
            # Update active transaction
            self.active_transactions[transaction_id]['status'] = 'failed'
            self.active_transactions[transaction_id]['completed_at'] = time.time()
            self.active_transactions[transaction_id]['error'] = str(e)
            
            # Add to transaction history
            self.transaction_history[transaction_id] = self.active_transactions[transaction_id]
            
            # Remove from active transactions
            del self.active_transactions[transaction_id]
            
            # Log transaction
            self._log_transaction(transaction_id, self.transaction_history[transaction_id])
            
            return {
                'system_id': system_id,
                'success': False,
                'error': str(e),
                'timestamp': time.time()
            }
    
    def request_governance_attestation(self, system_id: str, attestation_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Request a governance attestation from an external system.
        
        Args:
            system_id: Identifier for the external system
            attestation_params: Parameters for the attestation request
            
        Returns:
            dict: Attestation result
        """
        system_data = self.get_external_system(system_id)
        if not system_data:
            self.logger.error(f"System {system_id} not found")
            return {
                'system_id': system_id,
                'success': False,
                'error': 'System not found',
                'timestamp': time.time()
            }
        
        # Check system status
        status = system_data.get('status')
        if status != 'verified':
            self.logger.error(f"System {system_id} is not verified (status: {status})")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'System is not verified (status: {status})',
                'timestamp': time.time()
            }
        
        # Check trust score
        trust_score = system_data.get('trust_score', 0)
        trust_threshold = self.config.get('trust_threshold', 0.7)
        if trust_score < trust_threshold:
            self.logger.error(f"System {system_id} trust score ({trust_score}) is below threshold ({trust_threshold})")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'System trust score ({trust_score}) is below threshold ({trust_threshold})',
                'timestamp': time.time()
            }
        
        protocol = system_data.get('protocol')
        if protocol not in self.connector_registry:
            self.logger.error(f"No connector found for protocol {protocol}")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'No connector found for protocol {protocol}',
                'timestamp': time.time()
            }
        
        # Check if protocol supports attestation
        protocol_data = self.protocol_registry.get(protocol, {})
        if 'governance_attestation' not in protocol_data.get('operations', []):
            self.logger.error(f"Protocol {protocol} does not support governance attestation")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'Protocol {protocol} does not support governance attestation',
                'timestamp': time.time()
            }
        
        connector = self.connector_registry[protocol]
        
        # Create transaction ID
        transaction_id = f"attestation_{int(time.time())}_{system_id}"
        
        # Add to active transactions
        self.active_transactions[transaction_id] = {
            'id': transaction_id,
            'type': 'attestation',
            'system_id': system_id,
            'params': attestation_params,
            'started_at': time.time(),
            'status': 'running'
        }
        
        try:
            # Request attestation
            result = connector.request_governance_attestation(system_data, attestation_params)
            
            # Update active transaction
            self.active_transactions[transaction_id]['status'] = 'completed'
            self.active_transactions[transaction_id]['completed_at'] = time.time()
            self.active_transactions[transaction_id]['result'] = result
            
            # Add to transaction history
            self.transaction_history[transaction_id] = self.active_transactions[transaction_id]
            
            # Remove from active transactions
            del self.active_transactions[transaction_id]
            
            # Log transaction
            self._log_transaction(transaction_id, self.transaction_history[transaction_id])
            
            return result
        except Exception as e:
            self.logger.error(f"Error requesting governance attestation from system {system_id}: {str(e)}")
            
            # Update active transaction
            self.active_transactions[transaction_id]['status'] = 'failed'
            self.active_transactions[transaction_id]['completed_at'] = time.time()
            self.active_transactions[transaction_id]['error'] = str(e)
            
            # Add to transaction history
            self.transaction_history[transaction_id] = self.active_transactions[transaction_id]
            
            # Remove from active transactions
            del self.active_transactions[transaction_id]
            
            # Log transaction
            self._log_transaction(transaction_id, self.transaction_history[transaction_id])
            
            return {
                'system_id': system_id,
                'success': False,
                'error': str(e),
                'timestamp': time.time()
            }
    
    def verify_governance_attestation(self, attestation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify a governance attestation from an external system.
        
        Args:
            attestation_data: Attestation data to verify
            
        Returns:
            dict: Verification result
        """
        # Validate required fields
        required_fields = ['system_id', 'attestation', 'signature']
        for field in required_fields:
            if field not in attestation_data:
                self.logger.error(f"Missing required field: {field}")
                return {
                    'success': False,
                    'error': f'Missing required field: {field}',
                    'timestamp': time.time()
                }
        
        system_id = attestation_data.get('system_id')
        system_data = self.get_external_system(system_id)
        if not system_data:
            self.logger.error(f"System {system_id} not found")
            return {
                'system_id': system_id,
                'success': False,
                'error': 'System not found',
                'timestamp': time.time()
            }
        
        protocol = system_data.get('protocol')
        if protocol not in self.connector_registry:
            self.logger.error(f"No connector found for protocol {protocol}")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'No connector found for protocol {protocol}',
                'timestamp': time.time()
            }
        
        connector = self.connector_registry[protocol]
        
        try:
            # Verify attestation
            result = connector.verify_governance_attestation(system_data, attestation_data)
            
            # Update system trust score based on verification result
            if result.get('success', False):
                # Increase trust score slightly for successful verification
                current_trust = system_data.get('trust_score', 0.5)
                new_trust = min(1.0, current_trust + 0.01)
                self.update_system_trust_score(system_id, new_trust)
            
            return result
        except Exception as e:
            self.logger.error(f"Error verifying governance attestation from system {system_id}: {str(e)}")
            return {
                'system_id': system_id,
                'success': False,
                'error': str(e),
                'timestamp': time.time()
            }
    
    def request_governance_expansion(self, system_id: str, expansion_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Request a governance expansion to an external system.
        
        Args:
            system_id: Identifier for the external system
            expansion_params: Parameters for the expansion request
            
        Returns:
            dict: Expansion result
        """
        system_data = self.get_external_system(system_id)
        if not system_data:
            self.logger.error(f"System {system_id} not found")
            return {
                'system_id': system_id,
                'success': False,
                'error': 'System not found',
                'timestamp': time.time()
            }
        
        # Check system status
        status = system_data.get('status')
        if status != 'verified':
            self.logger.error(f"System {system_id} is not verified (status: {status})")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'System is not verified (status: {status})',
                'timestamp': time.time()
            }
        
        # Check trust score
        trust_score = system_data.get('trust_score', 0)
        trust_threshold = self.config.get('trust_threshold', 0.7)
        if trust_score < trust_threshold:
            self.logger.error(f"System {system_id} trust score ({trust_score}) is below threshold ({trust_threshold})")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'System trust score ({trust_score}) is below threshold ({trust_threshold})',
                'timestamp': time.time()
            }
        
        protocol = system_data.get('protocol')
        if protocol not in self.connector_registry:
            self.logger.error(f"No connector found for protocol {protocol}")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'No connector found for protocol {protocol}',
                'timestamp': time.time()
            }
        
        # Check if protocol supports expansion
        protocol_data = self.protocol_registry.get(protocol, {})
        if 'governance_expansion' not in protocol_data.get('operations', []):
            self.logger.error(f"Protocol {protocol} does not support governance expansion")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'Protocol {protocol} does not support governance expansion',
                'timestamp': time.time()
            }
        
        connector = self.connector_registry[protocol]
        
        # Create transaction ID
        transaction_id = f"expansion_{int(time.time())}_{system_id}"
        
        # Add to active transactions
        self.active_transactions[transaction_id] = {
            'id': transaction_id,
            'type': 'expansion',
            'system_id': system_id,
            'params': expansion_params,
            'started_at': time.time(),
            'status': 'running'
        }
        
        try:
            # Request expansion
            result = connector.request_governance_expansion(system_data, expansion_params)
            
            # Update active transaction
            self.active_transactions[transaction_id]['status'] = 'completed'
            self.active_transactions[transaction_id]['completed_at'] = time.time()
            self.active_transactions[transaction_id]['result'] = result
            
            # Add to transaction history
            self.transaction_history[transaction_id] = self.active_transactions[transaction_id]
            
            # Remove from active transactions
            del self.active_transactions[transaction_id]
            
            # Log transaction
            self._log_transaction(transaction_id, self.transaction_history[transaction_id])
            
            return result
        except Exception as e:
            self.logger.error(f"Error requesting governance expansion to system {system_id}: {str(e)}")
            
            # Update active transaction
            self.active_transactions[transaction_id]['status'] = 'failed'
            self.active_transactions[transaction_id]['completed_at'] = time.time()
            self.active_transactions[transaction_id]['error'] = str(e)
            
            # Add to transaction history
            self.transaction_history[transaction_id] = self.active_transactions[transaction_id]
            
            # Remove from active transactions
            del self.active_transactions[transaction_id]
            
            # Log transaction
            self._log_transaction(transaction_id, self.transaction_history[transaction_id])
            
            return {
                'system_id': system_id,
                'success': False,
                'error': str(e),
                'timestamp': time.time()
            }
    
    def delegate_governance_authority(self, system_id: str, delegation_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Delegate governance authority to an external system.
        
        Args:
            system_id: Identifier for the external system
            delegation_params: Parameters for the delegation request
            
        Returns:
            dict: Delegation result
        """
        system_data = self.get_external_system(system_id)
        if not system_data:
            self.logger.error(f"System {system_id} not found")
            return {
                'system_id': system_id,
                'success': False,
                'error': 'System not found',
                'timestamp': time.time()
            }
        
        # Check system status
        status = system_data.get('status')
        if status != 'verified':
            self.logger.error(f"System {system_id} is not verified (status: {status})")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'System is not verified (status: {status})',
                'timestamp': time.time()
            }
        
        # Check trust score
        trust_score = system_data.get('trust_score', 0)
        trust_threshold = self.config.get('trust_threshold', 0.7)
        if trust_score < trust_threshold:
            self.logger.error(f"System {system_id} trust score ({trust_score}) is below threshold ({trust_threshold})")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'System trust score ({trust_score}) is below threshold ({trust_threshold})',
                'timestamp': time.time()
            }
        
        protocol = system_data.get('protocol')
        if protocol not in self.connector_registry:
            self.logger.error(f"No connector found for protocol {protocol}")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'No connector found for protocol {protocol}',
                'timestamp': time.time()
            }
        
        # Check if protocol supports delegation
        protocol_data = self.protocol_registry.get(protocol, {})
        if 'governance_delegation' not in protocol_data.get('operations', []):
            self.logger.error(f"Protocol {protocol} does not support governance delegation")
            return {
                'system_id': system_id,
                'success': False,
                'error': f'Protocol {protocol} does not support governance delegation',
                'timestamp': time.time()
            }
        
        connector = self.connector_registry[protocol]
        
        # Create transaction ID
        transaction_id = f"delegation_{int(time.time())}_{system_id}"
        
        # Add to active transactions
        self.active_transactions[transaction_id] = {
            'id': transaction_id,
            'type': 'delegation',
            'system_id': system_id,
            'params': delegation_params,
            'started_at': time.time(),
            'status': 'running'
        }
        
        try:
            # Delegate authority
            result = connector.delegate_governance_authority(system_data, delegation_params)
            
            # Update active transaction
            self.active_transactions[transaction_id]['status'] = 'completed'
            self.active_transactions[transaction_id]['completed_at'] = time.time()
            self.active_transactions[transaction_id]['result'] = result
            
            # Add to transaction history
            self.transaction_history[transaction_id] = self.active_transactions[transaction_id]
            
            # Remove from active transactions
            del self.active_transactions[transaction_id]
            
            # Log transaction
            self._log_transaction(transaction_id, self.transaction_history[transaction_id])
            
            return result
        except Exception as e:
            self.logger.error(f"Error delegating governance authority to system {system_id}: {str(e)}")
            
            # Update active transaction
            self.active_transactions[transaction_id]['status'] = 'failed'
            self.active_transactions[transaction_id]['completed_at'] = time.time()
            self.active_transactions[transaction_id]['error'] = str(e)
            
            # Add to transaction history
            self.transaction_history[transaction_id] = self.active_transactions[transaction_id]
            
            # Remove from active transactions
            del self.active_transactions[transaction_id]
            
            # Log transaction
            self._log_transaction(transaction_id, self.transaction_history[transaction_id])
            
            return {
                'system_id': system_id,
                'success': False,
                'error': str(e),
                'timestamp': time.time()
            }
    
    def _log_transaction(self, transaction_id: str, transaction_data: Dict[str, Any]) -> bool:
        """
        Log a transaction to the transaction log.
        
        Args:
            transaction_id: Identifier for the transaction
            transaction_data: Transaction data
            
        Returns:
            bool: True if logging was successful
        """
        log_directory = self.config.get('transaction_log_directory', '/var/log/promethios/interop')
        log_file = os.path.join(log_directory, f"transactions_{time.strftime('%Y%m%d')}.log")
        
        try:
            with open(log_file, 'a') as f:
                f.write(json.dumps(transaction_data) + '\n')
            
            return True
        except Exception as e:
            self.logger.error(f"Failed to log transaction: {str(e)}")
            return False
    
    def get_transaction_history(self, system_id: str = None, transaction_type: str = None) -> Dict[str, Dict[str, Any]]:
        """
        Get transaction history.
        
        Args:
            system_id: Identifier for the external system, or None for all systems
            transaction_type: Type of transaction, or None for all types
            
        Returns:
            dict: Transaction history
        """
        if system_id:
            # Filter by system ID
            return {
                transaction_id: transaction_data
                for transaction_id, transaction_data in self.transaction_history.items()
                if transaction_data.get('system_id') == system_id and
                   (transaction_type is None or transaction_data.get('type') == transaction_type)
            }
        elif transaction_type:
            # Filter by transaction type
            return {
                transaction_id: transaction_data
                for transaction_id, transaction_data in self.transaction_history.items()
                if transaction_data.get('type') == transaction_type
            }
        else:
            # Return all history
            return self.transaction_history
    
    def get_active_transactions(self, system_id: str = None, transaction_type: str = None) -> Dict[str, Dict[str, Any]]:
        """
        Get active transactions.
        
        Args:
            system_id: Identifier for the external system, or None for all systems
            transaction_type: Type of transaction, or None for all types
            
        Returns:
            dict: Active transactions
        """
        if system_id:
            # Filter by system ID
            return {
                transaction_id: transaction_data
                for transaction_id, transaction_data in self.active_transactions.items()
                if transaction_data.get('system_id') == system_id and
                   (transaction_type is None or transaction_data.get('type') == transaction_type)
            }
        elif transaction_type:
            # Filter by transaction type
            return {
                transaction_id: transaction_data
                for transaction_id, transaction_data in self.active_transactions.items()
                if transaction_data.get('type') == transaction_type
            }
        else:
            # Return all active transactions
            return self.active_transactions
    
    def cancel_transaction(self, transaction_id: str) -> bool:
        """
        Cancel an active transaction.
        
        Args:
            transaction_id: Identifier for the transaction
            
        Returns:
            bool: True if cancellation was successful
        """
        if transaction_id not in self.active_transactions:
            self.logger.error(f"Transaction {transaction_id} not found or not active")
            return False
        
        # Update active transaction
        self.active_transactions[transaction_id]['status'] = 'cancelled'
        self.active_transactions[transaction_id]['completed_at'] = time.time()
        
        # Add to transaction history
        self.transaction_history[transaction_id] = self.active_transactions[transaction_id]
        
        # Remove from active transactions
        del self.active_transactions[transaction_id]
        
        # Log transaction
        self._log_transaction(transaction_id, self.transaction_history[transaction_id])
        
        self.logger.info(f"Cancelled transaction {transaction_id}")
        return True
    
    def generate_transaction_report(self, output_file: str, system_id: str = None, transaction_type: str = None) -> bool:
        """
        Generate a transaction report.
        
        Args:
            output_file: Output file path
            system_id: Identifier for the external system, or None for all systems
            transaction_type: Type of transaction, or None for all types
            
        Returns:
            bool: True if report generation was successful
        """
        try:
            # Get transaction history
            history = self.get_transaction_history(system_id, transaction_type)
            
            # Generate report
            report = {
                'generated_at': time.time(),
                'system_id': system_id,
                'transaction_type': transaction_type,
                'transactions': history
            }
            
            # Write to output file
            with open(output_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            self.logger.info(f"Generated transaction report at {output_file}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to generate transaction report: {str(e)}")
            return False
