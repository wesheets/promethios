"""
Algorithm Provider for Promethios Governance System.

This module provides implementations of various cryptographic algorithm providers,
enabling the system to use different algorithms for different cryptographic operations.
"""

import logging
import time
import hashlib
import os
import json
from typing import Dict, List, Optional, Any, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519, ed448, x25519, x448
from cryptography.hazmat.primitives.asymmetric import padding as asymmetric_padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.exceptions import InvalidSignature

logger = logging.getLogger(__name__)

class AlgorithmProvider:
    """
    Base class for algorithm providers.
    
    Provides common functionality for cryptographic algorithm providers.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the algorithm provider with the specified configuration.
        
        Args:
            config: Configuration parameters for the provider
        """
        self.config = config or {}
        self.logger = logging.getLogger(__name__)


class HashAlgorithmProvider(AlgorithmProvider):
    """
    Provider for hash algorithms.
    
    Implements various hash algorithms for data integrity.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the hash algorithm provider with the specified configuration.
        
        Args:
            config: Configuration parameters for the provider
        """
        super().__init__(config)
        self.algorithms = {
            'SHA-256': hashlib.sha256,
            'SHA-384': hashlib.sha384,
            'SHA-512': hashlib.sha512,
            'SHA3-256': hashlib.sha3_256,
            'SHA3-384': hashlib.sha3_384,
            'SHA3-512': hashlib.sha3_512
        }
    
    def hash_data(self, data: bytes, algorithm_id: str) -> Dict[str, Any]:
        """
        Hash data using the specified algorithm.
        
        Args:
            data: Data to hash
            algorithm_id: Identifier for the algorithm to use
            
        Returns:
            dict: Hash result
        """
        if algorithm_id not in self.algorithms:
            raise ValueError(f"Unsupported hash algorithm: {algorithm_id}")
        
        hash_function = self.algorithms[algorithm_id]
        hash_value = hash_function(data).hexdigest()
        
        return {
            'algorithm_id': algorithm_id,
            'hash': hash_value,
            'timestamp': time.time()
        }
    
    def verify_hash(self, data: bytes, hash_data: Dict[str, Any]) -> bool:
        """
        Verify a hash value.
        
        Args:
            data: Original data
            hash_data: Hash data
            
        Returns:
            bool: True if hash is valid
        """
        algorithm_id = hash_data.get('algorithm_id')
        expected_hash = hash_data.get('hash')
        
        if not algorithm_id or not expected_hash:
            self.logger.error("Algorithm ID and hash are required for verification")
            return False
        
        if algorithm_id not in self.algorithms:
            self.logger.error(f"Unsupported hash algorithm: {algorithm_id}")
            return False
        
        hash_function = self.algorithms[algorithm_id]
        actual_hash = hash_function(data).hexdigest()
        
        return actual_hash == expected_hash


class SymmetricAlgorithmProvider(AlgorithmProvider):
    """
    Provider for symmetric encryption algorithms.
    
    Implements various symmetric encryption algorithms for data confidentiality.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the symmetric algorithm provider with the specified configuration.
        
        Args:
            config: Configuration parameters for the provider
        """
        super().__init__(config)
        self.key_store_path = self.config.get('key_store_path', '/var/lib/promethios/keys')
        
        # Ensure key store directory exists
        os.makedirs(self.key_store_path, exist_ok=True)
    
    def encrypt_data(self, data: bytes, algorithm_id: str, key_id: str) -> Dict[str, Any]:
        """
        Encrypt data using the specified algorithm and key.
        
        Args:
            data: Data to encrypt
            algorithm_id: Identifier for the algorithm to use
            key_id: Identifier for the key to use
            
        Returns:
            dict: Encryption result
        """
        # Load key
        key_data = self._load_key(key_id)
        if not key_data:
            raise ValueError(f"Key not found: {key_id}")
        
        key = bytes.fromhex(key_data.get('key'))
        
        # Generate nonce/IV
        nonce = os.urandom(12)  # 96 bits
        
        # Encrypt data
        if algorithm_id.startswith('AES-'):
            cipher = AESGCM(key)
            ciphertext = cipher.encrypt(nonce, data, None)
        elif algorithm_id == 'ChaCha20-Poly1305':
            cipher = ChaCha20Poly1305(key)
            ciphertext = cipher.encrypt(nonce, data, None)
        else:
            raise ValueError(f"Unsupported symmetric algorithm: {algorithm_id}")
        
        return {
            'algorithm_id': algorithm_id,
            'key_id': key_id,
            'ciphertext': ciphertext.hex(),
            'nonce': nonce.hex(),
            'timestamp': time.time()
        }
    
    def decrypt_data(self, encrypted_data: Dict[str, Any], key_id: str) -> bytes:
        """
        Decrypt data using the specified algorithm and key.
        
        Args:
            encrypted_data: Encrypted data
            key_id: Identifier for the key to use
            
        Returns:
            bytes: Decrypted data
        """
        algorithm_id = encrypted_data.get('algorithm_id')
        ciphertext = bytes.fromhex(encrypted_data.get('ciphertext'))
        nonce = bytes.fromhex(encrypted_data.get('nonce'))
        
        # Load key
        key_data = self._load_key(key_id)
        if not key_data:
            raise ValueError(f"Key not found: {key_id}")
        
        key = bytes.fromhex(key_data.get('key'))
        
        # Decrypt data
        if algorithm_id.startswith('AES-'):
            cipher = AESGCM(key)
            plaintext = cipher.decrypt(nonce, ciphertext, None)
        elif algorithm_id == 'ChaCha20-Poly1305':
            cipher = ChaCha20Poly1305(key)
            plaintext = cipher.decrypt(nonce, ciphertext, None)
        else:
            raise ValueError(f"Unsupported symmetric algorithm: {algorithm_id}")
        
        return plaintext
    
    def _load_key(self, key_id: str) -> Optional[Dict[str, Any]]:
        """
        Load a key from the key store.
        
        Args:
            key_id: Identifier for the key
            
        Returns:
            dict or None: Key data
        """
        key_path = os.path.join(self.key_store_path, f"sym_{key_id}.json")
        
        try:
            with open(key_path, 'r') as f:
                key_data = json.load(f)
            
            return key_data
        except Exception as e:
            self.logger.error(f"Error loading key {key_id}: {str(e)}")
            return None


class AsymmetricAlgorithmProvider(AlgorithmProvider):
    """
    Provider for asymmetric encryption algorithms.
    
    Implements various asymmetric encryption algorithms for key exchange and encryption.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the asymmetric algorithm provider with the specified configuration.
        
        Args:
            config: Configuration parameters for the provider
        """
        super().__init__(config)
        self.key_store_path = self.config.get('key_store_path', '/var/lib/promethios/keys')
        
        # Ensure key store directory exists
        os.makedirs(self.key_store_path, exist_ok=True)
    
    def encrypt_data(self, data: bytes, algorithm_id: str, key_id: str) -> Dict[str, Any]:
        """
        Encrypt data using the specified algorithm and key.
        
        Args:
            data: Data to encrypt
            algorithm_id: Identifier for the algorithm to use
            key_id: Identifier for the key to use
            
        Returns:
            dict: Encryption result
        """
        # Load key
        key_data = self._load_key(key_id)
        if not key_data:
            raise ValueError(f"Key not found: {key_id}")
        
        public_key_pem = key_data.get('public_key')
        
        # Load public key
        if algorithm_id.startswith('RSA-'):
            public_key = serialization.load_pem_public_key(public_key_pem.encode())
            
            # Encrypt data
            padding = asymmetric_padding.OAEP(
                mgf=asymmetric_padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
            ciphertext = public_key.encrypt(data, padding)
        else:
            raise ValueError(f"Unsupported asymmetric encryption algorithm: {algorithm_id}")
        
        return {
            'algorithm_id': algorithm_id,
            'key_id': key_id,
            'ciphertext': ciphertext.hex(),
            'timestamp': time.time()
        }
    
    def decrypt_data(self, encrypted_data: Dict[str, Any], key_id: str) -> bytes:
        """
        Decrypt data using the specified algorithm and key.
        
        Args:
            encrypted_data: Encrypted data
            key_id: Identifier for the key to use
            
        Returns:
            bytes: Decrypted data
        """
        algorithm_id = encrypted_data.get('algorithm_id')
        ciphertext = bytes.fromhex(encrypted_data.get('ciphertext'))
        
        # Load key
        key_data = self._load_key(key_id)
        if not key_data:
            raise ValueError(f"Key not found: {key_id}")
        
        private_key_pem = key_data.get('private_key')
        
        # Load private key
        if algorithm_id.startswith('RSA-'):
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode(),
                password=None
            )
            
            # Decrypt data
            padding = asymmetric_padding.OAEP(
                mgf=asymmetric_padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
            plaintext = private_key.decrypt(ciphertext, padding)
        else:
            raise ValueError(f"Unsupported asymmetric decryption algorithm: {algorithm_id}")
        
        return plaintext
    
    def _load_key(self, key_id: str) -> Optional[Dict[str, Any]]:
        """
        Load a key from the key store.
        
        Args:
            key_id: Identifier for the key
            
        Returns:
            dict or None: Key data
        """
        key_path = os.path.join(self.key_store_path, f"asym_{key_id}.json")
        
        try:
            with open(key_path, 'r') as f:
                key_data = json.load(f)
            
            return key_data
        except Exception as e:
            self.logger.error(f"Error loading key {key_id}: {str(e)}")
            return None


class SignatureAlgorithmProvider(AlgorithmProvider):
    """
    Provider for signature algorithms.
    
    Implements various signature algorithms for data authenticity and integrity.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the signature algorithm provider with the specified configuration.
        
        Args:
            config: Configuration parameters for the provider
        """
        super().__init__(config)
        self.key_store_path = self.config.get('key_store_path', '/var/lib/promethios/keys')
        
        # Ensure key store directory exists
        os.makedirs(self.key_store_path, exist_ok=True)
    
    def sign_data(self, data: bytes, algorithm_id: str, key_id: str) -> Dict[str, Any]:
        """
        Sign data using the specified algorithm and key.
        
        Args:
            data: Data to sign
            algorithm_id: Identifier for the algorithm to use
            key_id: Identifier for the key to use
            
        Returns:
            dict: Signature result
        """
        # Load key
        key_data = self._load_key(key_id)
        if not key_data:
            raise ValueError(f"Key not found: {key_id}")
        
        private_key_pem = key_data.get('private_key')
        
        # Load private key and sign data
        if algorithm_id.startswith('RSA-PSS-'):
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode(),
                password=None
            )
            
            # Sign data
            padding = asymmetric_padding.PSS(
                mgf=asymmetric_padding.MGF1(hashes.SHA256()),
                salt_length=asymmetric_padding.PSS.MAX_LENGTH
            )
            signature = private_key.sign(
                data,
                padding,
                hashes.SHA256()
            )
        elif algorithm_id.startswith('ECDSA-'):
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode(),
                password=None
            )
            
            # Sign data
            signature = private_key.sign(
                data,
                ec.ECDSA(hashes.SHA256())
            )
        elif algorithm_id == 'Ed25519':
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode(),
                password=None
            )
            
            # Sign data
            signature = private_key.sign(data)
        elif algorithm_id == 'Ed448':
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode(),
                password=None
            )
            
            # Sign data
            signature = private_key.sign(data)
        else:
            raise ValueError(f"Unsupported signature algorithm: {algorithm_id}")
        
        return {
            'algorithm_id': algorithm_id,
            'key_id': key_id,
            'signature': signature.hex(),
            'timestamp': time.time()
        }
    
    def verify_signature(self, data: bytes, signature_data: Dict[str, Any], key_id: str) -> bool:
        """
        Verify a signature using the specified algorithm and key.
        
        Args:
            data: Original data
            signature_data: Signature data
            key_id: Identifier for the key to use
            
        Returns:
            bool: True if signature is valid
        """
        algorithm_id = signature_data.get('algorithm_id')
        signature = bytes.fromhex(signature_data.get('signature'))
        
        # Load key
        key_data = self._load_key(key_id)
        if not key_data:
            self.logger.error(f"Key not found: {key_id}")
            return False
        
        public_key_pem = key_data.get('public_key')
        
        try:
            # Load public key and verify signature
            if algorithm_id.startswith('RSA-PSS-'):
                public_key = serialization.load_pem_public_key(public_key_pem.encode())
                
                # Verify signature
                padding = asymmetric_padding.PSS(
                    mgf=asymmetric_padding.MGF1(hashes.SHA256()),
                    salt_length=asymmetric_padding.PSS.MAX_LENGTH
                )
                public_key.verify(
                    signature,
                    data,
                    padding,
                    hashes.SHA256()
                )
            elif algorithm_id.startswith('ECDSA-'):
                public_key = serialization.load_pem_public_key(public_key_pem.encode())
                
                # Verify signature
                public_key.verify(
                    signature,
                    data,
                    ec.ECDSA(hashes.SHA256())
                )
            elif algorithm_id == 'Ed25519':
                public_key = serialization.load_pem_public_key(public_key_pem.encode())
                
                # Verify signature
                public_key.verify(signature, data)
            elif algorithm_id == 'Ed448':
                public_key = serialization.load_pem_public_key(public_key_pem.encode())
                
                # Verify signature
                public_key.verify(signature, data)
            else:
                self.logger.error(f"Unsupported signature algorithm: {algorithm_id}")
                return False
            
            return True
        except InvalidSignature:
            self.logger.warning(f"Invalid signature for {algorithm_id}")
            return False
        except Exception as e:
            self.logger.error(f"Error verifying signature: {str(e)}")
            return False
    
    def _load_key(self, key_id: str) -> Optional[Dict[str, Any]]:
        """
        Load a key from the key store.
        
        Args:
            key_id: Identifier for the key
            
        Returns:
            dict or None: Key data
        """
        key_path = os.path.join(self.key_store_path, f"asym_{key_id}.json")
        
        try:
            with open(key_path, 'r') as f:
                key_data = json.load(f)
            
            return key_data
        except Exception as e:
            self.logger.error(f"Error loading key {key_id}: {str(e)}")
            return None
