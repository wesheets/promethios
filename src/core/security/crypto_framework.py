"""
Enhanced cryptographic framework for Promethios.

This module provides a robust cryptographic framework with key rotation,
algorithm agility, and secure defaults to ensure data confidentiality,
integrity, and authenticity throughout the system.
"""

import os
import time
import json
import base64
import logging
import hashlib
import secrets
import threading
from typing import Dict, List, Optional, Union, Callable, Any, Tuple
from enum import Enum
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, hmac, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding as asym_padding
from cryptography.hazmat.primitives.serialization import (
    load_pem_private_key, load_pem_public_key,
    Encoding, PrivateFormat, PublicFormat, NoEncryption
)
from cryptography.exceptions import InvalidSignature

# Configure logging
logger = logging.getLogger(__name__)

class CryptoAlgorithm(Enum):
    """Enumeration of supported cryptographic algorithms."""
    # Symmetric encryption
    AES_GCM_256 = "AES-GCM-256"
    AES_CBC_256 = "AES-CBC-256"
    CHACHA20_POLY1305 = "CHACHA20-POLY1305"
    
    # Asymmetric encryption
    RSA_OAEP_SHA256 = "RSA-OAEP-SHA256"
    
    # Digital signatures
    RSA_PSS_SHA256 = "RSA-PSS-SHA256"
    ED25519 = "ED25519"
    
    # Hashing
    SHA256 = "SHA-256"
    SHA384 = "SHA-384"
    SHA512 = "SHA-512"
    
    # Key derivation
    PBKDF2_HMAC_SHA256 = "PBKDF2-HMAC-SHA256"
    HKDF_SHA256 = "HKDF-SHA256"

class KeyType(Enum):
    """Enumeration of key types."""
    SYMMETRIC = "symmetric"
    ASYMMETRIC_PRIVATE = "asymmetric_private"
    ASYMMETRIC_PUBLIC = "asymmetric_public"
    HMAC = "hmac"

class KeyUsage(Enum):
    """Enumeration of key usage purposes."""
    ENCRYPTION = "encryption"
    DECRYPTION = "decryption"
    SIGNING = "signing"
    VERIFICATION = "verification"
    KEY_WRAPPING = "key_wrapping"
    KEY_UNWRAPPING = "key_unwrapping"
    KEY_DERIVATION = "key_derivation"

class KeyMetadata:
    """Metadata for cryptographic keys."""
    
    def __init__(self, 
                key_id: str,
                key_type: KeyType,
                algorithm: CryptoAlgorithm,
                usages: List[KeyUsage],
                created_at: datetime,
                expires_at: Optional[datetime] = None,
                rotation_policy: Optional[Dict[str, Any]] = None,
                tags: Optional[Dict[str, str]] = None):
        """
        Initialize key metadata.
        
        Args:
            key_id: Unique identifier for the key
            key_type: Type of key
            algorithm: Algorithm the key is used with
            usages: Allowed usages for the key
            created_at: Creation timestamp
            expires_at: Expiration timestamp
            rotation_policy: Policy for key rotation
            tags: Additional metadata tags
        """
        self.key_id = key_id
        self.key_type = key_type
        self.algorithm = algorithm
        self.usages = usages
        self.created_at = created_at
        self.expires_at = expires_at
        self.rotation_policy = rotation_policy or {}
        self.tags = tags or {}
        self.state = "active"
    
    def is_expired(self) -> bool:
        """Check if the key is expired."""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    def needs_rotation(self) -> bool:
        """Check if the key needs rotation based on policy."""
        if not self.rotation_policy:
            return False
        
        max_age_days = self.rotation_policy.get("max_age_days")
        if max_age_days is not None:
            age = datetime.utcnow() - self.created_at
            if age > timedelta(days=max_age_days):
                return True
        
        return False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metadata to dictionary for serialization."""
        return {
            "key_id": self.key_id,
            "key_type": self.key_type.value,
            "algorithm": self.algorithm.value,
            "usages": [usage.value for usage in self.usages],
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "rotation_policy": self.rotation_policy,
            "tags": self.tags,
            "state": self.state
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'KeyMetadata':
        """Create metadata from dictionary."""
        return cls(
            key_id=data["key_id"],
            key_type=KeyType(data["key_type"]),
            algorithm=CryptoAlgorithm(data["algorithm"]),
            usages=[KeyUsage(usage) for usage in data["usages"]],
            created_at=datetime.fromisoformat(data["created_at"]),
            expires_at=datetime.fromisoformat(data["expires_at"]) if data.get("expires_at") else None,
            rotation_policy=data.get("rotation_policy", {}),
            tags=data.get("tags", {})
        )

class CryptoKey:
    """Cryptographic key with metadata."""
    
    def __init__(self, key_material: bytes, metadata: KeyMetadata):
        """
        Initialize a cryptographic key.
        
        Args:
            key_material: Raw key material
            metadata: Key metadata
        """
        self.key_material = key_material
        self.metadata = metadata
    
    def to_dict(self, include_material: bool = False) -> Dict[str, Any]:
        """
        Convert key to dictionary for serialization.
        
        Args:
            include_material: Whether to include the key material
        """
        result = self.metadata.to_dict()
        if include_material:
            result["key_material"] = base64.b64encode(self.key_material).decode('utf-8')
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CryptoKey':
        """Create key from dictionary."""
        metadata = KeyMetadata.from_dict(data)
        key_material = base64.b64decode(data["key_material"])
        return cls(key_material, metadata)

class KeyStore:
    """
    Secure storage for cryptographic keys.
    
    This class provides a secure in-memory store for cryptographic keys
    with support for key rotation, versioning, and access control.
    """
    
    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize the key store.
        
        Args:
            storage_path: Path to persistent storage (optional)
        """
        self.keys: Dict[str, Dict[str, CryptoKey]] = {}  # key_id -> version -> key
        self.current_versions: Dict[str, str] = {}  # key_id -> current version
        self.lock = threading.RLock()
        self.storage_path = storage_path
        
        # Load keys from storage if available
        if storage_path:
            self._load_keys()
    
    def add_key(self, key: CryptoKey, version: str = "v1") -> None:
        """
        Add a key to the store.
        
        Args:
            key: Cryptographic key
            version: Version identifier
        """
        with self.lock:
            key_id = key.metadata.key_id
            
            # Initialize key versions if needed
            if key_id not in self.keys:
                self.keys[key_id] = {}
            
            # Add the key
            self.keys[key_id][version] = key
            
            # Update current version
            self.current_versions[key_id] = version
            
            # Save to storage if available
            if self.storage_path:
                self._save_keys()
    
    def get_key(self, key_id: str, version: Optional[str] = None) -> Optional[CryptoKey]:
        """
        Get a key from the store.
        
        Args:
            key_id: Key identifier
            version: Version identifier (uses current version if None)
            
        Returns:
            The key if found, None otherwise
        """
        with self.lock:
            if key_id not in self.keys:
                return None
            
            if version is None:
                version = self.current_versions.get(key_id)
                if version is None:
                    return None
            
            return self.keys[key_id].get(version)
    
    def rotate_key(self, key_id: str, new_key: CryptoKey) -> str:
        """
        Rotate a key to a new version.
        
        Args:
            key_id: Key identifier
            new_key: New key
            
        Returns:
            New version identifier
            
        Raises:
            ValueError: If the key doesn't exist
        """
        with self.lock:
            if key_id not in self.keys:
                raise ValueError(f"Key {key_id} not found")
            
            # Generate new version
            current_version = self.current_versions.get(key_id, "v0")
            version_num = int(current_version[1:])
            new_version = f"v{version_num + 1}"
            
            # Add new key
            self.add_key(new_key, new_version)
            
            return new_version
    
    def delete_key(self, key_id: str, version: Optional[str] = None) -> bool:
        """
        Delete a key from the store.
        
        Args:
            key_id: Key identifier
            version: Version identifier (deletes all versions if None)
            
        Returns:
            True if key was deleted, False otherwise
        """
        with self.lock:
            if key_id not in self.keys:
                return False
            
            if version is None:
                # Delete all versions
                del self.keys[key_id]
                if key_id in self.current_versions:
                    del self.current_versions[key_id]
            else:
                # Delete specific version
                if version in self.keys[key_id]:
                    del self.keys[key_id][version]
                    
                    # Update current version if needed
                    if self.current_versions.get(key_id) == version:
                        if self.keys[key_id]:
                            # Set current to latest remaining version
                            versions = sorted(self.keys[key_id].keys())
                            self.current_versions[key_id] = versions[-1]
                        else:
                            # No versions left
                            del self.current_versions[key_id]
            
            # Save to storage if available
            if self.storage_path:
                self._save_keys()
            
            return True
    
    def list_keys(self) -> List[Dict[str, Any]]:
        """
        List all keys in the store.
        
        Returns:
            List of key metadata
        """
        with self.lock:
            result = []
            
            for key_id, versions in self.keys.items():
                current_version = self.current_versions.get(key_id)
                
                for version, key in versions.items():
                    key_info = key.metadata.to_dict()
                    key_info["version"] = version
                    key_info["is_current"] = (version == current_version)
                    result.append(key_info)
            
            return result
    
    def _save_keys(self) -> None:
        """Save keys to persistent storage."""
        if not self.storage_path:
            return
        
        # Create directory if needed
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        
        # Serialize keys
        data = {
            "keys": {},
            "current_versions": self.current_versions
        }
        
        for key_id, versions in self.keys.items():
            data["keys"][key_id] = {}
            for version, key in versions.items():
                data["keys"][key_id][version] = key.to_dict(include_material=True)
        
        # Write to file
        with open(self.storage_path, 'w') as f:
            json.dump(data, f)
    
    def _load_keys(self) -> None:
        """Load keys from persistent storage."""
        if not self.storage_path or not os.path.exists(self.storage_path):
            return
        
        try:
            with open(self.storage_path, 'r') as f:
                data = json.load(f)
            
            # Load keys
            for key_id, versions in data["keys"].items():
                self.keys[key_id] = {}
                for version, key_data in versions.items():
                    self.keys[key_id][version] = CryptoKey.from_dict(key_data)
            
            # Load current versions
            self.current_versions = data["current_versions"]
        except Exception as e:
            logger.error(f"Failed to load keys: {e}")

class CryptoProvider:
    """
    Provider for cryptographic operations.
    
    This class provides a unified interface for cryptographic operations
    with support for algorithm agility and key management.
    """
    
    def __init__(self, key_store: KeyStore):
        """
        Initialize the crypto provider.
        
        Args:
            key_store: Key store for cryptographic keys
        """
        self.key_store = key_store
    
    def generate_key(self, 
                    algorithm: CryptoAlgorithm, 
                    key_type: KeyType,
                    usages: List[KeyUsage],
                    key_id: Optional[str] = None,
                    expires_in_days: Optional[int] = None,
                    rotation_policy: Optional[Dict[str, Any]] = None,
                    tags: Optional[Dict[str, str]] = None) -> CryptoKey:
        """
        Generate a new cryptographic key.
        
        Args:
            algorithm: Cryptographic algorithm
            key_type: Type of key
            usages: Allowed usages for the key
            key_id: Key identifier (generated if None)
            expires_in_days: Days until key expiration
            rotation_policy: Policy for key rotation
            tags: Additional metadata tags
            
        Returns:
            Generated key
        """
        # Generate key ID if not provided
        if key_id is None:
            key_id = f"key-{secrets.token_hex(8)}"
        
        # Calculate expiration
        created_at = datetime.utcnow()
        expires_at = None
        if expires_in_days is not None:
            expires_at = created_at + timedelta(days=expires_in_days)
        
        # Generate key material based on algorithm and type
        key_material = self._generate_key_material(algorithm, key_type)
        
        # Create metadata
        metadata = KeyMetadata(
            key_id=key_id,
            key_type=key_type,
            algorithm=algorithm,
            usages=usages,
            created_at=created_at,
            expires_at=expires_at,
            rotation_policy=rotation_policy,
            tags=tags
        )
        
        # Create key
        key = CryptoKey(key_material, metadata)
        
        # Add to key store
        self.key_store.add_key(key)
        
        return key
    
    def _generate_key_material(self, algorithm: CryptoAlgorithm, key_type: KeyType) -> bytes:
        """
        Generate key material for the specified algorithm and type.
        
        Args:
            algorithm: Cryptographic algorithm
            key_type: Type of key
            
        Returns:
            Generated key material
        """
        if key_type == KeyType.SYMMETRIC:
            if algorithm in [CryptoAlgorithm.AES_GCM_256, CryptoAlgorithm.AES_CBC_256]:
                return os.urandom(32)  # 256 bits
            elif algorithm == CryptoAlgorithm.CHACHA20_POLY1305:
                return os.urandom(32)  # 256 bits
        elif key_type == KeyType.HMAC:
            if algorithm in [CryptoAlgorithm.SHA256, CryptoAlgorithm.SHA384, CryptoAlgorithm.SHA512]:
                return os.urandom(64)  # 512 bits
        elif key_type == KeyType.ASYMMETRIC_PRIVATE:
            if algorithm == CryptoAlgorithm.RSA_OAEP_SHA256 or algorithm == CryptoAlgorithm.RSA_PSS_SHA256:
                private_key = rsa.generate_private_key(
                    public_exponent=65537,
                    key_size=2048
                )
                return private_key.private_bytes(
                    encoding=Encoding.PEM,
                    format=PrivateFormat.PKCS8,
                    encryption_algorithm=NoEncryption()
                )
        
        raise ValueError(f"Unsupported algorithm and key type combination: {algorithm}, {key_type}")
    
    def encrypt(self, 
               plaintext: bytes, 
               key_id: str,
               key_version: Optional[str] = None,
               aad: Optional[bytes] = None) -> Dict[str, Any]:
        """
        Encrypt data.
        
        Args:
            plaintext: Data to encrypt
            key_id: Key identifier
            key_version: Key version (uses current version if None)
            aad: Additional authenticated data
            
        Returns:
            Dictionary with encrypted data and metadata
            
        Raises:
            ValueError: If the key doesn't exist or can't be used for encryption
        """
        # Get key
        key = self.key_store.get_key(key_id, key_version)
        if key is None:
            raise ValueError(f"Key {key_id} not found")
        
        # Check key usage
        if KeyUsage.ENCRYPTION not in key.metadata.usages:
            raise ValueError(f"Key {key_id} cannot be used for encryption")
        
        # Check expiration
        if key.metadata.is_expired():
            raise ValueError(f"Key {key_id} is expired")
        
        # Encrypt based on algorithm
        algorithm = key.metadata.algorithm
        if algorithm == CryptoAlgorithm.AES_GCM_256:
            # Generate IV
            iv = os.urandom(12)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(key.key_material),
                modes.GCM(iv)
            )
            encryptor = cipher.encryptor()
            
            # Add AAD if provided
            if aad:
                encryptor.authenticate_additional_data(aad)
            
            # Encrypt
            ciphertext = encryptor.update(plaintext) + encryptor.finalize()
            
            # Get tag
            tag = encryptor.tag
            
            return {
                "algorithm": algorithm.value,
                "key_id": key_id,
                "key_version": key_version or self.key_store.current_versions.get(key_id),
                "iv": base64.b64encode(iv).decode('utf-8'),
                "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
                "tag": base64.b64encode(tag).decode('utf-8')
            }
        elif algorithm == CryptoAlgorithm.AES_CBC_256:
            # Generate IV
            iv = os.urandom(16)
            
            # Create padder
            padder = padding.PKCS7(algorithms.AES.block_size).padder()
            padded_data = padder.update(plaintext) + padder.finalize()
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(key.key_material),
                modes.CBC(iv)
            )
            encryptor = cipher.encryptor()
            
            # Encrypt
            ciphertext = encryptor.update(padded_data) + encryptor.finalize()
            
            return {
                "algorithm": algorithm.value,
                "key_id": key_id,
                "key_version": key_version or self.key_store.current_versions.get(key_id),
                "iv": base64.b64encode(iv).decode('utf-8'),
                "ciphertext": base64.b64encode(ciphertext).decode('utf-8')
            }
        elif algorithm == CryptoAlgorithm.RSA_OAEP_SHA256:
            # Load private key
            private_key = load_pem_private_key(key.key_material, password=None)
            
            # Get public key
            public_key = private_key.public_key()
            
            # Encrypt
            ciphertext = public_key.encrypt(
                plaintext,
                asym_padding.OAEP(
                    mgf=asym_padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            return {
                "algorithm": algorithm.value,
                "key_id": key_id,
                "key_version": key_version or self.key_store.current_versions.get(key_id),
                "ciphertext": base64.b64encode(ciphertext).decode('utf-8')
            }
        
        raise ValueError(f"Unsupported encryption algorithm: {algorithm}")
    
    def decrypt(self, 
               encrypted_data: Dict[str, Any],
               aad: Optional[bytes] = None) -> bytes:
        """
        Decrypt data.
        
        Args:
            encrypted_data: Encrypted data and metadata
            aad: Additional authenticated data
            
        Returns:
            Decrypted data
            
        Raises:
            ValueError: If the key doesn't exist or can't be used for decryption
        """
        # Get key info
        key_id = encrypted_data["key_id"]
        key_version = encrypted_data.get("key_version")
        algorithm = CryptoAlgorithm(encrypted_data["algorithm"])
        
        # Get key
        key = self.key_store.get_key(key_id, key_version)
        if key is None:
            raise ValueError(f"Key {key_id} not found")
        
        # Check key usage
        if KeyUsage.DECRYPTION not in key.metadata.usages:
            raise ValueError(f"Key {key_id} cannot be used for decryption")
        
        # Check algorithm
        if key.metadata.algorithm != algorithm:
            raise ValueError(f"Algorithm mismatch: {key.metadata.algorithm} vs {algorithm}")
        
        # Decrypt based on algorithm
        if algorithm == CryptoAlgorithm.AES_GCM_256:
            # Get parameters
            iv = base64.b64decode(encrypted_data["iv"])
            ciphertext = base64.b64decode(encrypted_data["ciphertext"])
            tag = base64.b64decode(encrypted_data["tag"])
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(key.key_material),
                modes.GCM(iv, tag)
            )
            decryptor = cipher.decryptor()
            
            # Add AAD if provided
            if aad:
                decryptor.authenticate_additional_data(aad)
            
            # Decrypt
            return decryptor.update(ciphertext) + decryptor.finalize()
        elif algorithm == CryptoAlgorithm.AES_CBC_256:
            # Get parameters
            iv = base64.b64decode(encrypted_data["iv"])
            ciphertext = base64.b64decode(encrypted_data["ciphertext"])
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(key.key_material),
                modes.CBC(iv)
            )
            decryptor = cipher.decryptor()
            
            # Decrypt
            padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            
            # Remove padding
            unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
            return unpadder.update(padded_plaintext) + unpadder.finalize()
        elif algorithm == CryptoAlgorithm.RSA_OAEP_SHA256:
            # Get parameters
            ciphertext = base64.b64decode(encrypted_data["ciphertext"])
            
            # Load private key
            private_key = load_pem_private_key(key.key_material, password=None)
            
            # Decrypt
            return private_key.decrypt(
                ciphertext,
                asym_padding.OAEP(
                    mgf=asym_padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
        
        raise ValueError(f"Unsupported decryption algorithm: {algorithm}")
    
    def sign(self, 
            data: bytes, 
            key_id: str,
            key_version: Optional[str] = None) -> Dict[str, Any]:
        """
        Sign data.
        
        Args:
            data: Data to sign
            key_id: Key identifier
            key_version: Key version (uses current version if None)
            
        Returns:
            Dictionary with signature and metadata
            
        Raises:
            ValueError: If the key doesn't exist or can't be used for signing
        """
        # Get key
        key = self.key_store.get_key(key_id, key_version)
        if key is None:
            raise ValueError(f"Key {key_id} not found")
        
        # Check key usage
        if KeyUsage.SIGNING not in key.metadata.usages:
            raise ValueError(f"Key {key_id} cannot be used for signing")
        
        # Check expiration
        if key.metadata.is_expired():
            raise ValueError(f"Key {key_id} is expired")
        
        # Sign based on algorithm
        algorithm = key.metadata.algorithm
        if algorithm == CryptoAlgorithm.RSA_PSS_SHA256:
            # Load private key
            private_key = load_pem_private_key(key.key_material, password=None)
            
            # Sign
            signature = private_key.sign(
                data,
                asym_padding.PSS(
                    mgf=asym_padding.MGF1(hashes.SHA256()),
                    salt_length=asym_padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return {
                "algorithm": algorithm.value,
                "key_id": key_id,
                "key_version": key_version or self.key_store.current_versions.get(key_id),
                "signature": base64.b64encode(signature).decode('utf-8')
            }
        elif algorithm in [CryptoAlgorithm.SHA256, CryptoAlgorithm.SHA384, CryptoAlgorithm.SHA512]:
            # Create HMAC
            if algorithm == CryptoAlgorithm.SHA256:
                h = hmac.HMAC(key.key_material, hashes.SHA256())
            elif algorithm == CryptoAlgorithm.SHA384:
                h = hmac.HMAC(key.key_material, hashes.SHA384())
            else:  # SHA512
                h = hmac.HMAC(key.key_material, hashes.SHA512())
            
            # Sign
            h.update(data)
            signature = h.finalize()
            
            return {
                "algorithm": algorithm.value,
                "key_id": key_id,
                "key_version": key_version or self.key_store.current_versions.get(key_id),
                "signature": base64.b64encode(signature).decode('utf-8')
            }
        
        raise ValueError(f"Unsupported signing algorithm: {algorithm}")
    
    def verify(self, 
              data: bytes, 
              signature_data: Dict[str, Any]) -> bool:
        """
        Verify a signature.
        
        Args:
            data: Data to verify
            signature_data: Signature and metadata
            
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            # Get key info
            key_id = signature_data["key_id"]
            key_version = signature_data.get("key_version")
            algorithm = CryptoAlgorithm(signature_data["algorithm"])
            signature = base64.b64decode(signature_data["signature"])
            
            # Get key
            key = self.key_store.get_key(key_id, key_version)
            if key is None:
                return False
            
            # Check key usage
            if KeyUsage.VERIFICATION not in key.metadata.usages:
                return False
            
            # Check algorithm
            if key.metadata.algorithm != algorithm:
                return False
            
            # Verify based on algorithm
            if algorithm == CryptoAlgorithm.RSA_PSS_SHA256:
                # Load private key
                private_key = load_pem_private_key(key.key_material, password=None)
                
                # Get public key
                public_key = private_key.public_key()
                
                # Verify
                try:
                    public_key.verify(
                        signature,
                        data,
                        asym_padding.PSS(
                            mgf=asym_padding.MGF1(hashes.SHA256()),
                            salt_length=asym_padding.PSS.MAX_LENGTH
                        ),
                        hashes.SHA256()
                    )
                    return True
                except InvalidSignature:
                    return False
            elif algorithm in [CryptoAlgorithm.SHA256, CryptoAlgorithm.SHA384, CryptoAlgorithm.SHA512]:
                # Create HMAC
                if algorithm == CryptoAlgorithm.SHA256:
                    h = hmac.HMAC(key.key_material, hashes.SHA256())
                elif algorithm == CryptoAlgorithm.SHA384:
                    h = hmac.HMAC(key.key_material, hashes.SHA384())
                else:  # SHA512
                    h = hmac.HMAC(key.key_material, hashes.SHA512())
                
                # Verify
                h.update(data)
                try:
                    h.verify(signature)
                    return True
                except InvalidSignature:
                    return False
            
            return False
        except Exception as e:
            logger.error(f"Signature verification failed: {e}")
            return False
    
    def hash(self, data: bytes, algorithm: CryptoAlgorithm = CryptoAlgorithm.SHA256) -> bytes:
        """
        Hash data.
        
        Args:
            data: Data to hash
            algorithm: Hashing algorithm
            
        Returns:
            Hash value
        """
        if algorithm == CryptoAlgorithm.SHA256:
            digest = hashes.Hash(hashes.SHA256())
        elif algorithm == CryptoAlgorithm.SHA384:
            digest = hashes.Hash(hashes.SHA384())
        elif algorithm == CryptoAlgorithm.SHA512:
            digest = hashes.Hash(hashes.SHA512())
        else:
            raise ValueError(f"Unsupported hashing algorithm: {algorithm}")
        
        digest.update(data)
        return digest.finalize()
    
    def derive_key(self, 
                  key_id: str, 
                  salt: bytes, 
                  info: bytes = b'',
                  key_version: Optional[str] = None) -> bytes:
        """
        Derive a key from another key.
        
        Args:
            key_id: Key identifier
            salt: Salt value
            info: Context information
            key_version: Key version (uses current version if None)
            
        Returns:
            Derived key material
            
        Raises:
            ValueError: If the key doesn't exist or can't be used for key derivation
        """
        # Get key
        key = self.key_store.get_key(key_id, key_version)
        if key is None:
            raise ValueError(f"Key {key_id} not found")
        
        # Check key usage
        if KeyUsage.KEY_DERIVATION not in key.metadata.usages:
            raise ValueError(f"Key {key_id} cannot be used for key derivation")
        
        # Check expiration
        if key.metadata.is_expired():
            raise ValueError(f"Key {key_id} is expired")
        
        # Derive based on algorithm
        algorithm = key.metadata.algorithm
        if algorithm == CryptoAlgorithm.PBKDF2_HMAC_SHA256:
            # Create KDF
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000
            )
            
            # Derive
            return kdf.derive(key.key_material)
        
        raise ValueError(f"Unsupported key derivation algorithm: {algorithm}")

# Create global instances
key_store = KeyStore(storage_path="/var/lib/promethios/keys.json")
crypto_provider = CryptoProvider(key_store)

def initialize():
    """Initialize the cryptographic framework."""
    # Generate default keys if needed
    if not key_store.get_key("default-encryption"):
        crypto_provider.generate_key(
            algorithm=CryptoAlgorithm.AES_GCM_256,
            key_type=KeyType.SYMMETRIC,
            usages=[KeyUsage.ENCRYPTION, KeyUsage.DECRYPTION],
            key_id="default-encryption",
            rotation_policy={"max_age_days": 90}
        )
    
    if not key_store.get_key("default-signing"):
        crypto_provider.generate_key(
            algorithm=CryptoAlgorithm.RSA_PSS_SHA256,
            key_type=KeyType.ASYMMETRIC_PRIVATE,
            usages=[KeyUsage.SIGNING, KeyUsage.VERIFICATION],
            key_id="default-signing",
            rotation_policy={"max_age_days": 180}
        )
    
    logger.info("Cryptographic framework initialized")
