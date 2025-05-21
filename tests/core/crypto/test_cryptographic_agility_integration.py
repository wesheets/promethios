"""
Integration tests for the Cryptographic Agility Framework.

This module provides tests to validate the integration of all cryptographic components,
ensuring they work together correctly to provide cryptographic agility.
"""

import unittest
import json
import os
import tempfile
import time
from typing import Dict, List, Any

from src.core.crypto.crypto_manager import CryptoManager
from src.core.crypto.algorithm_provider import HashAlgorithmProvider, SymmetricAlgorithmProvider
from src.core.crypto.algorithm_provider import AsymmetricAlgorithmProvider, SignatureAlgorithmProvider
from src.core.crypto.key_provider import SymmetricKeyProvider, AsymmetricKeyProvider
from src.core.crypto.crypto_policy_manager import CryptoPolicyManager
from src.core.crypto.crypto_audit_logger import CryptoAuditLogger

class TestCryptographicAgilityIntegration(unittest.TestCase):
    """Integration tests for the Cryptographic Agility Framework."""
    
    def setUp(self):
        """Set up test environment."""
        # Create a temporary directory for test files
        self.test_dir = tempfile.mkdtemp()
        
        # Create subdirectories
        self.key_store_path = os.path.join(self.test_dir, 'keys')
        self.policy_store_path = os.path.join(self.test_dir, 'policies')
        self.log_directory = os.path.join(self.test_dir, 'logs')
        
        os.makedirs(self.key_store_path, exist_ok=True)
        os.makedirs(self.policy_store_path, exist_ok=True)
        os.makedirs(self.log_directory, exist_ok=True)
        
        # Create a temporary config file
        self.config_file = os.path.join(self.test_dir, 'crypto_config.json')
        config = {
            'crypto_domains': ['consensus', 'trust', 'governance', 'system'],
            'key_rotation_interval': 7776000,  # 90 days in seconds
            'algorithm_transition_period': 2592000,  # 30 days in seconds
            'default_hash_algorithm': 'SHA-256',
            'default_symmetric_algorithm': 'AES-256-GCM',
            'default_asymmetric_algorithm': 'RSA-2048',
            'default_signature_algorithm': 'ECDSA-P256',
            'key_store_path': self.key_store_path,
            'policy_store_path': self.policy_store_path,
            'log_directory': self.log_directory,
            'audit_level': 'detailed'
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(config, f)
        
        # Initialize components
        self.crypto_manager = CryptoManager(self.config_file)
        self.policy_manager = CryptoPolicyManager(config)
        self.audit_logger = CryptoAuditLogger(config)
        
        # Create default policies
        self.policy_manager.create_default_policies()
    
    def tearDown(self):
        """Clean up after tests."""
        # Remove test directory and all contents
        for root, dirs, files in os.walk(self.test_dir, topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))
        os.rmdir(self.test_dir)
    
    def test_algorithm_registration_and_transition(self):
        """Test algorithm registration and transition."""
        # Register a new algorithm
        new_algorithm = {
            'id': 'TEST-HASH',
            'name': 'Test Hash Algorithm',
            'strength': 256,
            'status': 'active'
        }
        
        result = self.crypto_manager.register_algorithm('hash', new_algorithm)
        self.assertTrue(result)
        
        # Get the algorithm
        algorithm = self.crypto_manager.get_algorithm('hash', 'TEST-HASH')
        self.assertIsNotNone(algorithm)
        self.assertEqual(algorithm['id'], 'TEST-HASH')
        
        # Set as active algorithm for a domain
        result = self.crypto_manager.set_active_algorithm('consensus', 'hash', 'TEST-HASH')
        self.assertTrue(result)
        
        # Get active algorithm
        active_algorithm = self.crypto_manager.get_active_algorithm('consensus', 'hash')
        self.assertEqual(active_algorithm, 'TEST-HASH')
        
        # Transition to another algorithm
        result = self.crypto_manager.transition_algorithm('hash', 'TEST-HASH', 'SHA-256')
        self.assertTrue(result)
        
        # Check that the active algorithm has changed
        active_algorithm = self.crypto_manager.get_active_algorithm('consensus', 'hash')
        self.assertEqual(active_algorithm, 'SHA-256')
    
    def test_key_generation_and_rotation(self):
        """Test key generation and rotation."""
        # Generate a symmetric key
        sym_key_id = self.crypto_manager.generate_key('symmetric', 'AES-256-GCM', 'consensus')
        self.assertIsNotNone(sym_key_id)
        
        # Get the key
        sym_key = self.crypto_manager.get_key('symmetric', sym_key_id)
        self.assertIsNotNone(sym_key)
        self.assertEqual(sym_key['algorithm_id'], 'AES-256-GCM')
        self.assertEqual(sym_key['domain'], 'consensus')
        
        # Generate an asymmetric key
        asym_key_id = self.crypto_manager.generate_key('asymmetric', 'RSA-2048', 'consensus')
        self.assertIsNotNone(asym_key_id)
        
        # Get the key
        asym_key = self.crypto_manager.get_key('asymmetric', asym_key_id)
        self.assertIsNotNone(asym_key)
        self.assertEqual(asym_key['algorithm_id'], 'RSA-2048')
        self.assertEqual(asym_key['domain'], 'consensus')
        
        # Rotate keys
        result = self.crypto_manager.rotate_keys('consensus')
        self.assertTrue(result)
        
        # Check that old keys are deprecated
        sym_key = self.crypto_manager.get_key('symmetric', sym_key_id)
        self.assertEqual(sym_key['status'], 'deprecated')
        
        asym_key = self.crypto_manager.get_key('asymmetric', asym_key_id)
        self.assertEqual(asym_key['status'], 'deprecated')
        
        # Check that new keys are active
        active_sym_keys = self.crypto_manager.list_keys('symmetric', 'active')
        active_sym_keys = [k for k in active_sym_keys if k['domain'] == 'consensus']
        self.assertGreaterEqual(len(active_sym_keys), 1)
        
        active_asym_keys = self.crypto_manager.list_keys('asymmetric', 'active')
        active_asym_keys = [k for k in active_asym_keys if k['domain'] == 'consensus']
        self.assertGreaterEqual(len(active_asym_keys), 1)
    
    def test_cryptographic_operations(self):
        """Test cryptographic operations."""
        # Generate keys
        sym_key_id = self.crypto_manager.generate_key('symmetric', 'AES-256-GCM', 'consensus')
        asym_key_id = self.crypto_manager.generate_key('asymmetric', 'RSA-2048', 'consensus')
        
        # Test data
        test_data = b'This is a test message'
        
        # Hash data
        hash_result = self.crypto_manager.hash_data(test_data, 'consensus')
        self.assertIsNotNone(hash_result)
        self.assertIn('hash', hash_result)
        
        # Encrypt data
        encryption_result = self.crypto_manager.encrypt_data(test_data, 'consensus', sym_key_id)
        self.assertIsNotNone(encryption_result)
        self.assertIn('ciphertext', encryption_result)
        
        # Decrypt data
        decrypted_data = self.crypto_manager.decrypt_data(encryption_result, 'consensus')
        self.assertEqual(decrypted_data, test_data)
        
        # Sign data
        signature_result = self.crypto_manager.sign_data(test_data, 'consensus', asym_key_id)
        self.assertIsNotNone(signature_result)
        self.assertIn('signature', signature_result)
        
        # Verify signature
        verification_result = self.crypto_manager.verify_signature(test_data, signature_result, 'consensus')
        self.assertTrue(verification_result)
    
    def test_policy_enforcement(self):
        """Test policy enforcement."""
        # Create a policy with strict requirements
        strict_policy = {
            'name': 'Strict Consensus Policy',
            'domain': 'consensus',
            'description': 'Strict cryptographic policy for consensus',
            'algorithm_requirements': {
                'hash': {
                    'min_strength': 192,
                    'allowed_algorithms': ['SHA-384', 'SHA-512', 'SHA3-384', 'SHA3-512']
                },
                'symmetric': {
                    'min_strength': 256,
                    'allowed_algorithms': ['AES-256-GCM', 'ChaCha20-Poly1305']
                },
                'asymmetric': {
                    'min_strength': 128,
                    'allowed_algorithms': ['RSA-3072', 'RSA-4096', 'ECDH-P256', 'ECDH-P384', 'ECDH-P521']
                },
                'signature': {
                    'min_strength': 128,
                    'allowed_algorithms': ['RSA-PSS-3072', 'RSA-PSS-4096', 'ECDSA-P256', 'ECDSA-P384', 'ECDSA-P521']
                }
            },
            'key_requirements': {
                'symmetric': {
                    'max_age': 2592000,  # 30 days
                    'allowed_algorithms': ['AES-256-GCM', 'ChaCha20-Poly1305']
                },
                'asymmetric': {
                    'max_age': 7776000,  # 90 days
                    'allowed_algorithms': ['RSA-3072', 'RSA-4096', 'ECDH-P256', 'ECDH-P384', 'ECDH-P521']
                }
            }
        }
        
        policy_id = self.policy_manager.create_policy(strict_policy)
        self.assertIsNotNone(policy_id)
        
        # Validate algorithms against policy
        # Should pass
        self.assertTrue(self.policy_manager.validate_algorithm('hash', 'SHA-384', 'consensus'))
        self.assertTrue(self.policy_manager.validate_algorithm('symmetric', 'AES-256-GCM', 'consensus'))
        
        # Should fail
        self.assertFalse(self.policy_manager.validate_algorithm('hash', 'SHA-256', 'consensus'))
        self.assertFalse(self.policy_manager.validate_algorithm('symmetric', 'AES-128-GCM', 'consensus'))
        
        # Generate keys with valid algorithms
        sym_key_id = self.crypto_manager.generate_key('symmetric', 'AES-256-GCM', 'consensus')
        asym_key_id = self.crypto_manager.generate_key('asymmetric', 'RSA-3072', 'consensus')
        
        # Get keys
        sym_key = self.crypto_manager.get_key('symmetric', sym_key_id)
        asym_key = self.crypto_manager.get_key('asymmetric', asym_key_id)
        
        # Validate keys against policy
        self.assertTrue(self.policy_manager.validate_key('symmetric', sym_key, 'consensus'))
        self.assertTrue(self.policy_manager.validate_key('asymmetric', asym_key, 'consensus'))
    
    def test_audit_logging(self):
        """Test audit logging."""
        # Generate a key
        key_id = self.crypto_manager.generate_key('symmetric', 'AES-256-GCM', 'consensus')
        
        # Log key generation
        key_data = self.crypto_manager.get_key('symmetric', key_id)
        self.audit_logger.log_key_generation(key_data)
        
        # Log algorithm registration
        algorithm_data = {
            'id': 'TEST-HASH',
            'name': 'Test Hash Algorithm',
            'strength': 256,
            'status': 'active'
        }
        self.audit_logger.log_algorithm_registration(algorithm_data)
        
        # Get logs
        logs = self.audit_logger.get_crypto_logs()
        self.assertGreaterEqual(len(logs), 2)
        
        # Check log types
        log_types = [log.get('event_type') for log in logs]
        self.assertIn('key_generation', log_types)
        self.assertIn('algorithm_registration', log_types)
        
        # Generate audit report
        report_file = os.path.join(self.test_dir, 'audit_report.json')
        result = self.audit_logger.generate_audit_report(report_file)
        self.assertTrue(result)
        self.assertTrue(os.path.exists(report_file))
    
    def test_crypto_manager_integration(self):
        """Test integration of all crypto components through the crypto manager."""
        # Register a new algorithm
        new_algorithm = {
            'id': 'TEST-SYM',
            'name': 'Test Symmetric Algorithm',
            'strength': 256,
            'status': 'active'
        }
        
        self.crypto_manager.register_algorithm('symmetric', new_algorithm)
        
        # Set as active algorithm
        self.crypto_manager.set_active_algorithm('consensus', 'symmetric', 'TEST-SYM')
        
        # Generate a key
        key_id = self.crypto_manager.generate_key('symmetric', 'TEST-SYM', 'consensus')
        
        # Transition to another algorithm
        self.crypto_manager.transition_algorithm('symmetric', 'TEST-SYM', 'AES-256-GCM')
        
        # Check that keys were rotated
        key = self.crypto_manager.get_key('symmetric', key_id)
        self.assertEqual(key['status'], 'deprecated')
        
        # Check active algorithm
        active_algorithm = self.crypto_manager.get_active_algorithm('consensus', 'symmetric')
        self.assertEqual(active_algorithm, 'AES-256-GCM')
        
        # Check that new keys were generated
        active_keys = self.crypto_manager.list_keys('symmetric', 'active')
        active_keys = [k for k in active_keys if k['domain'] == 'consensus']
        self.assertGreaterEqual(len(active_keys), 1)
        self.assertEqual(active_keys[0]['algorithm_id'], 'AES-256-GCM')

if __name__ == '__main__':
    unittest.main()
