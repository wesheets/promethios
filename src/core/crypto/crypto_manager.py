"""
Crypto Manager for Promethios Governance System.

This module provides the central manager for cryptographic operations, coordinating
the selection, rotation, and verification of cryptographic algorithms and keys.
"""

import logging
import time
import json
import os
import uuid
import tempfile
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger(__name__)

class CryptoManager:
    """
    Manages cryptographic operations for the governance system.
    
    Provides a framework for cryptographic agility, allowing the system to adapt
    to evolving cryptographic standards and threats.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the crypto manager with the specified configuration.
        
        Args:
            config_path: Path to the crypto configuration file
        """
        self.config = self._load_config(config_path)
        self.algorithm_registry = {}
        self.key_registry = {}
        self.active_algorithms = {}
        self.algorithm_providers = {}
        self.key_providers = {}
        self.logger = logging.getLogger(__name__)
        
        # Create a temporary directory for key storage
        self.temp_dir = tempfile.mkdtemp()
        self.config['key_store_path'] = self.temp_dir
        
        # Initialize audit logger
        from .crypto_audit_logger import CryptoAuditLogger
        self.audit_logger = CryptoAuditLogger(self.config)
        
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
            required_params = ['crypto_domains', 'key_rotation_interval', 'algorithm_transition_period']
            for param in required_params:
                if param not in config:
                    raise ValueError(f"Missing required configuration parameter: {param}")
            
            return config
        except Exception as e:
            self.logger.error(f"Failed to load configuration: {str(e)}")
            # Provide sensible defaults for critical parameters
            return {
                'crypto_domains': ['consensus', 'trust', 'governance', 'system'],
                'key_rotation_interval': 7776000,  # 90 days in seconds
                'algorithm_transition_period': 2592000,  # 30 days in seconds
                'default_hash_algorithm': 'SHA-256',
                'default_symmetric_algorithm': 'AES-256-GCM',
                'default_asymmetric_algorithm': 'RSA-2048',
                'default_signature_algorithm': 'ECDSA-P256'
            }
    
    def _initialize_components(self) -> None:
        """
        Initialize crypto components based on configuration.
        """
        # Initialize algorithm providers
        for algorithm_type in ['hash', 'symmetric', 'asymmetric', 'signature']:
            provider_class = self._get_algorithm_provider_class(algorithm_type)
            if provider_class:
                self.algorithm_providers[algorithm_type] = provider_class(self.config)
                self.logger.info(f"Initialized algorithm provider for {algorithm_type}")
        
        # Initialize key providers
        for key_type in ['symmetric', 'asymmetric']:
            provider_class = self._get_key_provider_class(key_type)
            if provider_class:
                self.key_providers[key_type] = provider_class(self.config)
                self.logger.info(f"Initialized key provider for {key_type}")
        
        # Register default algorithms
        self._register_default_algorithms()
        
        # Set active algorithms
        self._set_active_algorithms()
    
    def _get_algorithm_provider_class(self, algorithm_type: str) -> Any:
        """
        Get the algorithm provider class for the specified algorithm type.
        
        Args:
            algorithm_type: Type of algorithm
            
        Returns:
            class: Algorithm provider class
        """
        if algorithm_type == 'hash':
            from .algorithm_provider import HashAlgorithmProvider
            return HashAlgorithmProvider
        elif algorithm_type == 'symmetric':
            from .algorithm_provider import SymmetricAlgorithmProvider
            return SymmetricAlgorithmProvider
        elif algorithm_type == 'asymmetric':
            from .algorithm_provider import AsymmetricAlgorithmProvider
            return AsymmetricAlgorithmProvider
        elif algorithm_type == 'signature':
            from .algorithm_provider import SignatureAlgorithmProvider
            return SignatureAlgorithmProvider
        else:
            self.logger.warning(f"Unsupported algorithm type: {algorithm_type}")
            return None
    
    def _get_key_provider_class(self, key_type: str) -> Any:
        """
        Get the key provider class for the specified key type.
        
        Args:
            key_type: Type of key
            
        Returns:
            class: Key provider class
        """
        if key_type == 'symmetric':
            from .key_provider import SymmetricKeyProvider
            return SymmetricKeyProvider
        elif key_type == 'asymmetric':
            from .key_provider import AsymmetricKeyProvider
            return AsymmetricKeyProvider
        else:
            self.logger.warning(f"Unsupported key type: {key_type}")
            return None
    
    def _register_default_algorithms(self) -> None:
        """
        Register default algorithms based on configuration.
        """
        # Register hash algorithms
        hash_algorithms = [
            {
                'id': 'SHA-256',
                'name': 'SHA-256',
                'strength': 128,
                'status': 'active'
            },
            {
                'id': 'SHA-384',
                'name': 'SHA-384',
                'strength': 192,
                'status': 'active'
            },
            {
                'id': 'SHA-512',
                'name': 'SHA-512',
                'strength': 256,
                'status': 'active'
            },
            {
                'id': 'SHA3-256',
                'name': 'SHA3-256',
                'strength': 128,
                'status': 'active'
            },
            {
                'id': 'SHA3-384',
                'name': 'SHA3-384',
                'strength': 192,
                'status': 'active'
            },
            {
                'id': 'SHA3-512',
                'name': 'SHA3-512',
                'strength': 256,
                'status': 'active'
            }
        ]
        
        for algorithm in hash_algorithms:
            self.register_algorithm('hash', algorithm)
        
        # Register symmetric algorithms
        symmetric_algorithms = [
            {
                'id': 'AES-256-GCM',
                'name': 'AES-256-GCM',
                'strength': 256,
                'status': 'active'
            },
            {
                'id': 'AES-192-GCM',
                'name': 'AES-192-GCM',
                'strength': 192,
                'status': 'active'
            },
            {
                'id': 'AES-128-GCM',
                'name': 'AES-128-GCM',
                'strength': 128,
                'status': 'active'
            },
            {
                'id': 'ChaCha20-Poly1305',
                'name': 'ChaCha20-Poly1305',
                'strength': 256,
                'status': 'active'
            }
        ]
        
        for algorithm in symmetric_algorithms:
            self.register_algorithm('symmetric', algorithm)
        
        # Register asymmetric algorithms
        asymmetric_algorithms = [
            {
                'id': 'RSA-2048',
                'name': 'RSA-2048',
                'strength': 112,
                'status': 'active'
            },
            {
                'id': 'RSA-3072',
                'name': 'RSA-3072',
                'strength': 128,
                'status': 'active'
            },
            {
                'id': 'RSA-4096',
                'name': 'RSA-4096',
                'strength': 152,
                'status': 'active'
            },
            {
                'id': 'ECDH-P256',
                'name': 'ECDH-P256',
                'strength': 128,
                'status': 'active'
            },
            {
                'id': 'ECDH-P384',
                'name': 'ECDH-P384',
                'strength': 192,
                'status': 'active'
            },
            {
                'id': 'ECDH-P521',
                'name': 'ECDH-P521',
                'strength': 256,
                'status': 'active'
            },
            {
                'id': 'X25519',
                'name': 'X25519',
                'strength': 128,
                'status': 'active'
            },
            {
                'id': 'X448',
                'name': 'X448',
                'strength': 224,
                'status': 'active'
            }
        ]
        
        for algorithm in asymmetric_algorithms:
            self.register_algorithm('asymmetric', algorithm)
        
        # Register signature algorithms
        signature_algorithms = [
            {
                'id': 'RSA-PSS-2048',
                'name': 'RSA-PSS-2048',
                'strength': 112,
                'status': 'active'
            },
            {
                'id': 'RSA-PSS-3072',
                'name': 'RSA-PSS-3072',
                'strength': 128,
                'status': 'active'
            },
            {
                'id': 'RSA-PSS-4096',
                'name': 'RSA-PSS-4096',
                'strength': 152,
                'status': 'active'
            },
            {
                'id': 'ECDSA-P256',
                'name': 'ECDSA-P256',
                'strength': 128,
                'status': 'active'
            },
            {
                'id': 'ECDSA-P384',
                'name': 'ECDSA-P384',
                'strength': 192,
                'status': 'active'
            },
            {
                'id': 'ECDSA-P521',
                'name': 'ECDSA-P521',
                'strength': 256,
                'status': 'active'
            },
            {
                'id': 'Ed25519',
                'name': 'Ed25519',
                'strength': 128,
                'status': 'active'
            },
            {
                'id': 'Ed448',
                'name': 'Ed448',
                'strength': 224,
                'status': 'active'
            }
        ]
        
        for algorithm in signature_algorithms:
            self.register_algorithm('signature', algorithm)
    
    def _set_active_algorithms(self) -> None:
        """
        Set active algorithms for each domain and algorithm type.
        """
        domains = self.config.get('crypto_domains', [])
        algorithm_types = ['hash', 'symmetric', 'asymmetric', 'signature']
        
        for domain in domains:
            if domain not in self.active_algorithms:
                self.active_algorithms[domain] = {}
            
            for algorithm_type in algorithm_types:
                default_algorithm = self.config.get(f'default_{algorithm_type}_algorithm')
                if default_algorithm:
                    self.active_algorithms[domain][algorithm_type] = default_algorithm
    
    def register_algorithm(self, algorithm_type: str, algorithm_data: Dict[str, Any]) -> bool:
        """
        Register a cryptographic algorithm.
        
        Args:
            algorithm_type: Type of algorithm
            algorithm_data: Data about the algorithm
            
        Returns:
            bool: True if registration was successful
        """
        algorithm_id = algorithm_data.get('id')
        if not algorithm_id:
            self.logger.error("Algorithm ID is required")
            return False
        
        # Create registry key
        registry_key = f"{algorithm_type}:{algorithm_id}"
        
        # Check if algorithm already exists
        if registry_key in self.algorithm_registry:
            self.logger.warning(f"Algorithm {registry_key} already registered")
            return False
        
        # Add metadata
        algorithm_data['registered_at'] = time.time()
        algorithm_data['algorithm_type'] = algorithm_type
        
        # Register algorithm
        self.algorithm_registry[registry_key] = algorithm_data
        
        # Log algorithm registration
        self.audit_logger.log_algorithm_registration(algorithm_data)
        
        self.logger.info(f"Registered algorithm {registry_key}")
        return True
    
    def get_algorithm(self, algorithm_type: str, algorithm_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a registered algorithm.
        
        Args:
            algorithm_type: Type of algorithm
            algorithm_id: Identifier for the algorithm
            
        Returns:
            dict or None: Algorithm data
        """
        registry_key = f"{algorithm_type}:{algorithm_id}"
        return self.algorithm_registry.get(registry_key)
    
    def list_algorithms(self, algorithm_type: str = None, status: str = None) -> List[Dict[str, Any]]:
        """
        List registered algorithms.
        
        Args:
            algorithm_type: Type of algorithm to filter by, or None for all types
            status: Status to filter by, or None for all statuses
            
        Returns:
            list: Registered algorithms
        """
        algorithms = []
        
        for registry_key, algorithm_data in self.algorithm_registry.items():
            # Filter by algorithm type
            if algorithm_type and algorithm_data.get('algorithm_type') != algorithm_type:
                continue
            
            # Filter by status
            if status and algorithm_data.get('status') != status:
                continue
            
            algorithms.append(algorithm_data)
        
        return algorithms
    
    def update_algorithm_status(self, algorithm_type: str, algorithm_id: str, status: str) -> bool:
        """
        Update the status of a registered algorithm.
        
        Args:
            algorithm_type: Type of algorithm
            algorithm_id: Identifier for the algorithm
            status: New status for the algorithm
            
        Returns:
            bool: True if update was successful
        """
        registry_key = f"{algorithm_type}:{algorithm_id}"
        
        if registry_key not in self.algorithm_registry:
            self.logger.error(f"Algorithm {registry_key} not found")
            return False
        
        # Update status
        self.algorithm_registry[registry_key]['status'] = status
        self.algorithm_registry[registry_key]['updated_at'] = time.time()
        
        self.logger.info(f"Updated algorithm {registry_key} status to {status}")
        return True
    
    def set_active_algorithm(self, domain: str, algorithm_type: str, algorithm_id: str) -> bool:
        """
        Set the active algorithm for a domain and algorithm type.
        
        Args:
            domain: Domain to set the active algorithm for
            algorithm_type: Type of algorithm
            algorithm_id: Identifier for the algorithm
            
        Returns:
            bool: True if setting was successful
        """
        # Check if algorithm exists
        registry_key = f"{algorithm_type}:{algorithm_id}"
        if registry_key not in self.algorithm_registry:
            self.logger.error(f"Algorithm {registry_key} not found")
            return False
        
        # Check if algorithm is active
        algorithm_data = self.algorithm_registry[registry_key]
        if algorithm_data.get('status') != 'active':
            self.logger.error(f"Algorithm {registry_key} is not active")
            return False
        
        # Set active algorithm
        if domain not in self.active_algorithms:
            self.active_algorithms[domain] = {}
        
        self.active_algorithms[domain][algorithm_type] = algorithm_id
        
        self.logger.info(f"Set active algorithm for {domain}/{algorithm_type} to {algorithm_id}")
        return True
    
    def get_active_algorithm(self, domain: str, algorithm_type: str) -> Optional[str]:
        """
        Get the active algorithm for a domain and algorithm type.
        
        Args:
            domain: Domain to get the active algorithm for
            algorithm_type: Type of algorithm
            
        Returns:
            str or None: Identifier for the active algorithm
        """
        if domain not in self.active_algorithms:
            return None
        
        return self.active_algorithms[domain].get(algorithm_type)
    
    def register_key(self, key_type: str, key_data: Dict[str, Any]) -> bool:
        """
        Register a cryptographic key.
        
        Args:
            key_type: Type of key
            key_data: Data about the key
            
        Returns:
            bool: True if registration was successful
        """
        key_id = key_data.get('id')
        if not key_id:
            self.logger.error("Key ID is required")
            return False
        
        # Create registry key
        registry_key = f"{key_type}:{key_id}"
        
        # Check if key already exists
        if registry_key in self.key_registry:
            self.logger.warning(f"Key {registry_key} already registered")
            return False
        
        # Add metadata
        key_data['registered_at'] = time.time()
        key_data['key_type'] = key_type
        
        # Register key
        self.key_registry[registry_key] = key_data
        
        # Log key generation
        self.audit_logger.log_key_generation(key_data)
        
        self.logger.info(f"Registered key {registry_key}")
        return True
    
    def get_key(self, key_type: str, key_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a registered key.
        
        Args:
            key_type: Type of key
            key_id: Identifier for the key
            
        Returns:
            dict or None: Key data
        """
        registry_key = f"{key_type}:{key_id}"
        return self.key_registry.get(registry_key)
    
    def list_keys(self, key_type: str = None, status: str = None) -> List[Dict[str, Any]]:
        """
        List registered keys.
        
        Args:
            key_type: Type of key to filter by, or None for all types
            status: Status to filter by, or None for all statuses
            
        Returns:
            list: Registered keys
        """
        keys = []
        
        for registry_key, key_data in self.key_registry.items():
            # Filter by key type
            if key_type and key_data.get('key_type') != key_type:
                continue
            
            # Filter by status
            if status and key_data.get('status') != status:
                continue
            
            keys.append(key_data)
        
        return keys
    
    def update_key_status(self, key_type: str, key_id: str, status: str) -> bool:
        """
        Update the status of a registered key.
        
        Args:
            key_type: Type of key
            key_id: Identifier for the key
            status: New status for the key
            
        Returns:
            bool: True if update was successful
        """
        registry_key = f"{key_type}:{key_id}"
        
        if registry_key not in self.key_registry:
            self.logger.error(f"Key {registry_key} not found")
            return False
        
        # Update status
        self.key_registry[registry_key]['status'] = status
        self.key_registry[registry_key]['updated_at'] = time.time()
        
        self.logger.info(f"Updated key {registry_key} status to {status}")
        return True
    
    def generate_key(self, key_type: str, algorithm_id: str, domain: str = None) -> Optional[str]:
        """
        Generate a new cryptographic key.
        
        Args:
            key_type: Type of key
            algorithm_id: Identifier for the algorithm to use
            domain: Domain to generate the key for, or None for general use
            
        Returns:
            str or None: Identifier for the generated key
        """
        if key_type not in self.key_providers:
            self.logger.error(f"No key provider found for {key_type}")
            return None
        
        provider = self.key_providers[key_type]
        
        try:
            # Generate key
            key_data = provider.generate_key(algorithm_id, domain)
            if not key_data:
                self.logger.error(f"Failed to generate {key_type} key")
                return None
            
            # Ensure key has an ID
            if 'id' not in key_data:
                key_data['id'] = str(uuid.uuid4())
            
            # Ensure key has status
            if 'status' not in key_data:
                key_data['status'] = 'active'
            
            # Register key
            if not self.register_key(key_type, key_data):
                self.logger.error(f"Failed to register {key_type} key")
                return None
            
            return key_data.get('id')
        except Exception as e:
            self.logger.error(f"Error generating {key_type} key: {str(e)}")
            return None
    
    def rotate_keys(self, domain: str = None, key_type: str = None) -> bool:
        """
        Rotate cryptographic keys.
        
        Args:
            domain: Domain to rotate keys for, or None for all domains
            key_type: Type of key to rotate, or None for all types
            
        Returns:
            bool: True if rotation was successful
        """
        domains = [domain] if domain else self.config.get('crypto_domains', [])
        key_types = [key_type] if key_type else ['symmetric', 'asymmetric']
        
        success = True
        
        for domain in domains:
            for key_type in key_types:
                if key_type not in self.key_providers:
                    self.logger.error(f"No key provider found for {key_type}")
                    success = False
                    continue
                
                provider = self.key_providers[key_type]
                
                try:
                    # Get active algorithm for the domain and key type
                    algorithm_type = 'symmetric' if key_type == 'symmetric' else 'asymmetric'
                    algorithm_id = self.get_active_algorithm(domain, algorithm_type)
                    if not algorithm_id:
                        self.logger.error(f"No active algorithm found for {domain}/{algorithm_type}")
                        success = False
                        continue
                    
                    # Generate new key first
                    key_id = self.generate_key(key_type, algorithm_id, domain)
                    if not key_id:
                        self.logger.error(f"Failed to generate new key for {domain}/{key_type}")
                        success = False
                        continue
                    
                    # Ensure the new key is marked as active
                    new_key = self.get_key(key_type, key_id)
                    if new_key and new_key.get('status') != 'active':
                        new_key['status'] = 'active'
                        registry_key = f"{key_type}:{key_id}"
                        self.key_registry[registry_key] = new_key
                    
                    # Now deprecate old keys
                    old_keys = self.list_keys(key_type, 'active')
                    old_keys = [k for k in old_keys if k.get('domain') == domain and k.get('id') != key_id]
                    
                    for old_key in old_keys:
                        old_key_id = old_key.get('id')
                        self.update_key_status(key_type, old_key_id, 'deprecated')
                    
                    # Log key rotation
                    rotation_data = {
                        'domain': domain,
                        'key_type': key_type,
                        'new_key_id': key_id,
                        'timestamp': time.time()
                    }
                    self.audit_logger.log_key_rotation(rotation_data)
                    
                    self.logger.info(f"Rotated keys for {domain}/{key_type}")
                except Exception as e:
                    self.logger.error(f"Error rotating keys for {domain}/{key_type}: {str(e)}")
                    success = False
        
        return success
    
    def transition_algorithm(self, algorithm_type: str, old_algorithm_id: str, new_algorithm_id: str) -> bool:
        """
        Transition from one algorithm to another.
        
        Args:
            algorithm_type: Type of algorithm
            old_algorithm_id: Identifier for the old algorithm
            new_algorithm_id: Identifier for the new algorithm
            
        Returns:
            bool: True if transition was successful
        """
        # Check if algorithms exist
        old_registry_key = f"{algorithm_type}:{old_algorithm_id}"
        new_registry_key = f"{algorithm_type}:{new_algorithm_id}"
        
        if old_registry_key not in self.algorithm_registry:
            self.logger.error(f"Algorithm {old_registry_key} not found")
            return False
        
        if new_registry_key not in self.algorithm_registry:
            self.logger.error(f"Algorithm {new_registry_key} not found")
            return False
        
        # Check if new algorithm is active
        new_algorithm_data = self.algorithm_registry[new_registry_key]
        if new_algorithm_data.get('status') != 'active':
            self.logger.error(f"Algorithm {new_registry_key} is not active")
            return False
        
        # Update algorithm status
        self.update_algorithm_status(algorithm_type, old_algorithm_id, 'deprecated')
        
        # Update active algorithms
        for domain, algorithms in self.active_algorithms.items():
            if algorithms.get(algorithm_type) == old_algorithm_id:
                self.set_active_algorithm(domain, algorithm_type, new_algorithm_id)
        
        # Rotate keys if necessary
        if algorithm_type == 'symmetric':
            self.rotate_keys(key_type='symmetric')
        elif algorithm_type == 'asymmetric':
            self.rotate_keys(key_type='asymmetric')
        
        # Log algorithm transition
        transition_data = {
            'algorithm_type': algorithm_type,
            'old_algorithm_id': old_algorithm_id,
            'new_algorithm_id': new_algorithm_id,
            'timestamp': time.time()
        }
        self.audit_logger.log_algorithm_transition(transition_data)
        
        self.logger.info(f"Transitioned from {old_algorithm_id} to {new_algorithm_id} for {algorithm_type}")
        return True
    
    def get_crypto_provider(self, domain: str, operation_type: str) -> Optional[Tuple[str, Any]]:
        """
        Get the appropriate crypto provider for a domain and operation type.
        
        Args:
            domain: Domain to get the provider for
            operation_type: Type of operation (hash, encrypt, decrypt, sign, verify)
            
        Returns:
            tuple or None: (algorithm_id, provider) for the operation
        """
        # Map operation type to algorithm type
        if operation_type == 'hash':
            algorithm_type = 'hash'
        elif operation_type in ['encrypt', 'decrypt']:
            algorithm_type = 'symmetric'
        elif operation_type in ['sign', 'verify']:
            algorithm_type = 'signature'
        else:
            self.logger.error(f"Unsupported operation type: {operation_type}")
            return None
        
        # Get active algorithm for the domain and algorithm type
        algorithm_id = self.get_active_algorithm(domain, algorithm_type)
        if not algorithm_id:
            # Use default algorithm if no active algorithm is set
            algorithm_id = self.config.get(f'default_{algorithm_type}_algorithm')
            if not algorithm_id:
                self.logger.error(f"No active algorithm found for {domain}/{algorithm_type}")
                return None
        
        # Get provider for the algorithm type
        if algorithm_type not in self.algorithm_providers:
            self.logger.error(f"No provider found for {algorithm_type}")
            return None
        
        provider = self.algorithm_providers[algorithm_type]
        
        return (algorithm_id, provider)
    
    def hash_data(self, data: bytes, domain: str) -> Optional[Dict[str, Any]]:
        """
        Hash data using the active hash algorithm for a domain.
        
        Args:
            data: Data to hash
            domain: Domain to use the hash algorithm for
            
        Returns:
            dict or None: Hash result
        """
        provider_info = self.get_crypto_provider(domain, 'hash')
        if not provider_info:
            return None
        
        algorithm_id, provider = provider_info
        
        try:
            # Hash data
            hash_result = provider.hash_data(data, algorithm_id)
            
            # Log hash operation
            hash_data = {
                'domain': domain,
                'algorithm_id': algorithm_id,
                'data_size': len(data),
                'timestamp': time.time()
            }
            self.audit_logger.log_crypto_event('hash', hash_data)
            
            return hash_result
        except Exception as e:
            self.logger.error(f"Error hashing data: {str(e)}")
            return None
    
    def encrypt_data(self, data: bytes, domain: str, key_id: str = None) -> Optional[Dict[str, Any]]:
        """
        Encrypt data using the active symmetric algorithm for a domain.
        
        Args:
            data: Data to encrypt
            domain: Domain to use the symmetric algorithm for
            key_id: Identifier for the key to use, or None to use the active key
            
        Returns:
            dict or None: Encryption result
        """
        provider_info = self.get_crypto_provider(domain, 'encrypt')
        if not provider_info:
            return None
        
        algorithm_id, provider = provider_info
        
        try:
            # Get key
            if key_id:
                key_data = self.get_key('symmetric', key_id)
                if not key_data:
                    self.logger.error(f"Key {key_id} not found")
                    return None
            else:
                # Get active key for the domain
                active_keys = self.list_keys('symmetric', 'active')
                active_keys = [k for k in active_keys if k.get('domain') == domain]
                if not active_keys:
                    self.logger.error(f"No active key found for {domain}")
                    # Generate a new key
                    key_id = self.generate_key('symmetric', algorithm_id, domain)
                    if key_id:
                        key_data = self.get_key('symmetric', key_id)
                    else:
                        return None
                else:
                    key_data = active_keys[0]
                    key_id = key_data.get('id')
            
            # Encrypt data
            encryption_result = provider.encrypt_data(data, algorithm_id, key_data)
            
            # Add key ID to result
            encryption_result['key_id'] = key_id
            
            # Log encryption operation
            encryption_data = {
                'domain': domain,
                'algorithm_id': algorithm_id,
                'key_id': key_id,
                'data_size': len(data),
                'timestamp': time.time()
            }
            self.audit_logger.log_encryption(encryption_data)
            
            return encryption_result
        except Exception as e:
            self.logger.error(f"Error encrypting data: {str(e)}")
            return None
    
    def decrypt_data(self, encryption_result: Dict[str, Any], domain: str) -> Optional[bytes]:
        """
        Decrypt data using the appropriate key.
        
        Args:
            encryption_result: Result from encrypt_data
            domain: Domain to use the symmetric algorithm for
            
        Returns:
            bytes or None: Decrypted data
        """
        key_id = encryption_result.get('key_id')
        if not key_id:
            self.logger.error("Key ID not found in encryption result")
            return None
        
        # Get key
        key_data = self.get_key('symmetric', key_id)
        if not key_data:
            self.logger.error(f"Key {key_id} not found")
            return None
        
        # Get algorithm
        algorithm_id = key_data.get('algorithm_id')
        if not algorithm_id:
            self.logger.error(f"Algorithm ID not found in key {key_id}")
            return None
        
        # Get provider
        algorithm_type = 'symmetric'
        if algorithm_type not in self.algorithm_providers:
            self.logger.error(f"No provider found for {algorithm_type}")
            return None
        
        provider = self.algorithm_providers[algorithm_type]
        
        try:
            # Decrypt data
            decrypted_data = provider.decrypt_data(encryption_result, key_data)
            
            # Log decryption operation
            decryption_data = {
                'domain': domain,
                'algorithm_id': algorithm_id,
                'key_id': key_id,
                'timestamp': time.time()
            }
            self.audit_logger.log_decryption(decryption_data)
            
            return decrypted_data
        except Exception as e:
            self.logger.error(f"Error decrypting data: {str(e)}")
            return None
    
    def sign_data(self, data: bytes, domain: str, key_id: str = None) -> Optional[Dict[str, Any]]:
        """
        Sign data using the active signature algorithm for a domain.
        
        Args:
            data: Data to sign
            domain: Domain to use the signature algorithm for
            key_id: Identifier for the key to use, or None to use the active key
            
        Returns:
            dict or None: Signature result
        """
        provider_info = self.get_crypto_provider(domain, 'sign')
        if not provider_info:
            return None
        
        algorithm_id, provider = provider_info
        
        try:
            # Get key
            if key_id:
                key_data = self.get_key('asymmetric', key_id)
                if not key_data:
                    self.logger.error(f"Key {key_id} not found")
                    return None
            else:
                # Get active key for the domain
                active_keys = self.list_keys('asymmetric', 'active')
                active_keys = [k for k in active_keys if k.get('domain') == domain]
                if not active_keys:
                    self.logger.error(f"No active key found for {domain}")
                    # Generate a new key
                    key_id = self.generate_key('asymmetric', algorithm_id, domain)
                    if key_id:
                        key_data = self.get_key('asymmetric', key_id)
                    else:
                        return None
                else:
                    key_data = active_keys[0]
                    key_id = key_data.get('id')
            
            # Sign data
            signature_result = provider.sign_data(data, algorithm_id, key_data)
            
            # Add key ID to result
            signature_result['key_id'] = key_id
            
            # Log signature operation
            signature_data = {
                'domain': domain,
                'algorithm_id': algorithm_id,
                'key_id': key_id,
                'data_size': len(data),
                'timestamp': time.time()
            }
            self.audit_logger.log_signature(signature_data)
            
            return signature_result
        except Exception as e:
            self.logger.error(f"Error signing data: {str(e)}")
            return None
    
    def verify_signature(self, data: bytes, signature_result: Dict[str, Any], domain: str) -> bool:
        """
        Verify a signature.
        
        Args:
            data: Data that was signed
            signature_result: Result from sign_data
            domain: Domain to use the signature algorithm for
            
        Returns:
            bool: True if signature is valid
        """
        key_id = signature_result.get('key_id')
        if not key_id:
            self.logger.error("Key ID not found in signature result")
            return False
        
        # Get key
        key_data = self.get_key('asymmetric', key_id)
        if not key_data:
            self.logger.error(f"Key {key_id} not found")
            return False
        
        # Get algorithm
        algorithm_id = key_data.get('algorithm_id')
        if not algorithm_id:
            self.logger.error(f"Algorithm ID not found in key {key_id}")
            return False
        
        # Get provider
        algorithm_type = 'signature'
        if algorithm_type not in self.algorithm_providers:
            self.logger.error(f"No provider found for {algorithm_type}")
            return False
        
        provider = self.algorithm_providers[algorithm_type]
        
        try:
            # Verify signature
            is_valid = provider.verify_signature(data, signature_result, key_data)
            
            # Log verification operation
            verification_data = {
                'domain': domain,
                'algorithm_id': algorithm_id,
                'key_id': key_id,
                'is_valid': is_valid,
                'timestamp': time.time()
            }
            self.audit_logger.log_verification(verification_data)
            
            return is_valid
        except Exception as e:
            self.logger.error(f"Error verifying signature: {str(e)}")
            return False
