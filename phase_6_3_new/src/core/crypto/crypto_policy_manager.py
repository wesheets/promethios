"""
Crypto Policy Manager for Promethios Governance System.

This module provides functionality for managing cryptographic policies,
enabling the system to enforce security requirements across different domains.
"""

import logging
import time
import json
import os
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger(__name__)

class CryptoPolicyManager:
    """
    Manager for cryptographic policies.
    
    Provides mechanisms to define, enforce, and audit cryptographic policies
    across different domains in the governance system.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the crypto policy manager with the specified configuration.
        
        Args:
            config: Configuration parameters for the manager
        """
        self.config = config or {}
        self.policy_store_path = self.config.get('policy_store_path', '/var/lib/promethios/policies')
        self.logger = logging.getLogger(__name__)
        self.policies = {}
        
        # Ensure policy store directory exists
        os.makedirs(self.policy_store_path, exist_ok=True)
        
        # Load policies
        self._load_policies()
    
    def _load_policies(self) -> None:
        """
        Load policies from the policy store.
        """
        try:
            for filename in os.listdir(self.policy_store_path):
                if filename.endswith('.json'):
                    policy_path = os.path.join(self.policy_store_path, filename)
                    with open(policy_path, 'r') as f:
                        policy = json.load(f)
                    
                    policy_id = policy.get('id')
                    if policy_id:
                        self.policies[policy_id] = policy
        except Exception as e:
            self.logger.error(f"Error loading policies: {str(e)}")
    
    def create_policy(self, policy_data: Dict[str, Any]) -> str:
        """
        Create a new cryptographic policy.
        
        Args:
            policy_data: Data for the new policy
            
        Returns:
            str: Policy ID
        """
        # Validate policy data
        required_fields = ['name', 'domain', 'algorithm_requirements', 'key_requirements']
        for field in required_fields:
            if field not in policy_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Generate policy ID
        policy_id = f"{policy_data['domain']}_{int(time.time())}"
        
        # Add metadata
        policy_data['id'] = policy_id
        policy_data['created_at'] = time.time()
        policy_data['updated_at'] = time.time()
        policy_data['status'] = 'active'
        
        # Save policy
        self.policies[policy_id] = policy_data
        self._save_policy(policy_id)
        
        self.logger.info(f"Created policy {policy_id}")
        return policy_id
    
    def _save_policy(self, policy_id: str) -> bool:
        """
        Save a policy to the policy store.
        
        Args:
            policy_id: Identifier for the policy
            
        Returns:
            bool: True if save was successful
        """
        policy = self.policies.get(policy_id)
        if not policy:
            self.logger.error(f"Policy {policy_id} not found")
            return False
        
        policy_path = os.path.join(self.policy_store_path, f"{policy_id}.json")
        
        try:
            with open(policy_path, 'w') as f:
                json.dump(policy, f, indent=2)
            
            return True
        except Exception as e:
            self.logger.error(f"Error saving policy {policy_id}: {str(e)}")
            return False
    
    def get_policy(self, policy_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a policy by ID.
        
        Args:
            policy_id: Identifier for the policy
            
        Returns:
            dict or None: Policy data
        """
        return self.policies.get(policy_id)
    
    def get_domain_policy(self, domain: str) -> Optional[Dict[str, Any]]:
        """
        Get the active policy for a domain.
        
        Args:
            domain: Domain to get the policy for
            
        Returns:
            dict or None: Policy data
        """
        # Find active policy for the domain
        for policy_id, policy in self.policies.items():
            if policy.get('domain') == domain and policy.get('status') == 'active':
                return policy
        
        return None
    
    def update_policy(self, policy_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a policy.
        
        Args:
            policy_id: Identifier for the policy
            updates: Updates to apply to the policy
            
        Returns:
            bool: True if update was successful
        """
        policy = self.policies.get(policy_id)
        if not policy:
            self.logger.error(f"Policy {policy_id} not found")
            return False
        
        # Apply updates
        for key, value in updates.items():
            if key not in ['id', 'created_at']:
                policy[key] = value
        
        # Update metadata
        policy['updated_at'] = time.time()
        
        # Save policy
        self._save_policy(policy_id)
        
        self.logger.info(f"Updated policy {policy_id}")
        return True
    
    def deactivate_policy(self, policy_id: str) -> bool:
        """
        Deactivate a policy.
        
        Args:
            policy_id: Identifier for the policy
            
        Returns:
            bool: True if deactivation was successful
        """
        return self.update_policy(policy_id, {'status': 'inactive'})
    
    def validate_algorithm(self, algorithm_type: str, algorithm_id: str, domain: str) -> bool:
        """
        Validate an algorithm against the policy for a domain.
        
        Args:
            algorithm_type: Type of algorithm
            algorithm_id: Identifier for the algorithm
            domain: Domain to validate against
            
        Returns:
            bool: True if algorithm is valid
        """
        # Get policy for the domain
        policy = self.get_domain_policy(domain)
        if not policy:
            self.logger.warning(f"No policy found for domain {domain}")
            return True  # No policy means no restrictions
        
        # Get algorithm requirements
        algorithm_requirements = policy.get('algorithm_requirements', {})
        type_requirements = algorithm_requirements.get(algorithm_type, {})
        
        # Check if algorithm is allowed
        allowed_algorithms = type_requirements.get('allowed_algorithms', [])
        if allowed_algorithms and algorithm_id not in allowed_algorithms:
            self.logger.warning(f"Algorithm {algorithm_id} not allowed for {domain}/{algorithm_type}")
            return False
        
        # Check minimum strength
        min_strength = type_requirements.get('min_strength', 0)
        algorithm_strength = self._get_algorithm_strength(algorithm_id)
        if algorithm_strength < min_strength:
            self.logger.warning(
                f"Algorithm {algorithm_id} strength ({algorithm_strength}) below minimum ({min_strength}) "
                f"for {domain}/{algorithm_type}"
            )
            return False
        
        return True
    
    def validate_key(self, key_type: str, key_data: Dict[str, Any], domain: str) -> bool:
        """
        Validate a key against the policy for a domain.
        
        Args:
            key_type: Type of key
            key_data: Key data
            domain: Domain to validate against
            
        Returns:
            bool: True if key is valid
        """
        # Get policy for the domain
        policy = self.get_domain_policy(domain)
        if not policy:
            self.logger.warning(f"No policy found for domain {domain}")
            return True  # No policy means no restrictions
        
        # Get key requirements
        key_requirements = policy.get('key_requirements', {})
        type_requirements = key_requirements.get(key_type, {})
        
        # Check if algorithm is allowed
        algorithm_id = key_data.get('algorithm_id')
        allowed_algorithms = type_requirements.get('allowed_algorithms', [])
        if allowed_algorithms and algorithm_id not in allowed_algorithms:
            self.logger.warning(f"Algorithm {algorithm_id} not allowed for {domain}/{key_type} keys")
            return False
        
        # Check key expiration
        max_age = type_requirements.get('max_age', 0)
        if max_age > 0:
            created_at = key_data.get('created_at', 0)
            age = time.time() - created_at
            if age > max_age:
                self.logger.warning(
                    f"Key {key_data.get('id')} age ({age} seconds) exceeds maximum ({max_age} seconds) "
                    f"for {domain}/{key_type}"
                )
                return False
        
        return True
    
    def _get_algorithm_strength(self, algorithm_id: str) -> int:
        """
        Get the strength of an algorithm.
        
        Args:
            algorithm_id: Identifier for the algorithm
            
        Returns:
            int: Algorithm strength in bits
        """
        # This is a simplified mapping; in a real implementation, this would be more comprehensive
        strength_map = {
            'SHA-256': 128,
            'SHA-384': 192,
            'SHA-512': 256,
            'SHA3-256': 128,
            'SHA3-384': 192,
            'SHA3-512': 256,
            'AES-256-GCM': 256,
            'AES-192-GCM': 192,
            'AES-128-GCM': 128,
            'ChaCha20-Poly1305': 256,
            'RSA-2048': 112,
            'RSA-3072': 128,
            'RSA-4096': 152,
            'ECDH-P256': 128,
            'ECDH-P384': 192,
            'ECDH-P521': 256,
            'X25519': 128,
            'X448': 224,
            'RSA-PSS-2048': 112,
            'RSA-PSS-3072': 128,
            'RSA-PSS-4096': 152,
            'ECDSA-P256': 128,
            'ECDSA-P384': 192,
            'ECDSA-P521': 256,
            'Ed25519': 128,
            'Ed448': 224
        }
        
        return strength_map.get(algorithm_id, 0)
    
    def create_default_policies(self) -> List[str]:
        """
        Create default policies for all domains.
        
        Returns:
            list: Policy IDs
        """
        domains = self.config.get('crypto_domains', [])
        policy_ids = []
        
        for domain in domains:
            # Check if domain already has an active policy
            if self.get_domain_policy(domain):
                continue
            
            # Create default policy
            policy_data = {
                'name': f"{domain.capitalize()} Cryptographic Policy",
                'domain': domain,
                'description': f"Default cryptographic policy for {domain}",
                'algorithm_requirements': {
                    'hash': {
                        'min_strength': 128,
                        'allowed_algorithms': ['SHA-256', 'SHA-384', 'SHA-512', 'SHA3-256', 'SHA3-384', 'SHA3-512']
                    },
                    'symmetric': {
                        'min_strength': 128,
                        'allowed_algorithms': ['AES-256-GCM', 'AES-192-GCM', 'AES-128-GCM', 'ChaCha20-Poly1305']
                    },
                    'asymmetric': {
                        'min_strength': 128,
                        'allowed_algorithms': [
                            'RSA-3072', 'RSA-4096', 'ECDH-P256', 'ECDH-P384', 'ECDH-P521', 'X25519', 'X448'
                        ]
                    },
                    'signature': {
                        'min_strength': 128,
                        'allowed_algorithms': [
                            'RSA-PSS-3072', 'RSA-PSS-4096', 'ECDSA-P256', 'ECDSA-P384', 'ECDSA-P521',
                            'Ed25519', 'Ed448'
                        ]
                    }
                },
                'key_requirements': {
                    'symmetric': {
                        'max_age': 7776000,  # 90 days
                        'allowed_algorithms': ['AES-256-GCM', 'AES-192-GCM', 'AES-128-GCM', 'ChaCha20-Poly1305']
                    },
                    'asymmetric': {
                        'max_age': 31536000,  # 1 year
                        'allowed_algorithms': [
                            'RSA-3072', 'RSA-4096', 'ECDH-P256', 'ECDH-P384', 'ECDH-P521', 'X25519', 'X448',
                            'ECDSA-P256', 'ECDSA-P384', 'ECDSA-P521', 'Ed25519', 'Ed448'
                        ]
                    }
                }
            }
            
            policy_id = self.create_policy(policy_data)
            policy_ids.append(policy_id)
        
        return policy_ids
    
    def audit_policy_compliance(self, domain: str = None) -> Dict[str, Any]:
        """
        Audit compliance with cryptographic policies.
        
        Args:
            domain: Domain to audit, or None for all domains
            
        Returns:
            dict: Audit results
        """
        # This is a placeholder for a real audit implementation
        # In a real system, this would check all algorithms and keys against policies
        
        domains = [domain] if domain else self.config.get('crypto_domains', [])
        audit_results = {
            'timestamp': time.time(),
            'domains': {}
        }
        
        for domain in domains:
            policy = self.get_domain_policy(domain)
            if not policy:
                audit_results['domains'][domain] = {
                    'has_policy': False,
                    'compliant': False,
                    'issues': ['No active policy']
                }
                continue
            
            # In a real implementation, this would check actual algorithms and keys
            audit_results['domains'][domain] = {
                'has_policy': True,
                'policy_id': policy.get('id'),
                'compliant': True,
                'issues': []
            }
        
        return audit_results
