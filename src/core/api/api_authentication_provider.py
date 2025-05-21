"""
API Authentication Provider for Promethios.

This module provides authentication services for the API Governance Framework,
handling developer and application authentication, token issuance, and validation.
"""

import logging
import json
import os
import time
import uuid
import hashlib
import base64
import secrets
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class APIAuthenticationProvider:
    """
    Authentication provider for the API Governance Framework.
    
    Handles developer and application authentication, token issuance,
    and validation for secure API access.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the API Authentication Provider with the specified configuration.
        
        Args:
            config_path: Path to the configuration file
        """
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing API Authentication Provider")
        
        # Load configuration
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        # Initialize credential store
        self.credential_store = {}
        
        # Initialize token store
        self.token_store = {}
        
        # Initialize directories
        os.makedirs(self.config.get('credential_directory', 'config/api_credentials'), exist_ok=True)
        os.makedirs(self.config.get('token_directory', 'config/api_tokens'), exist_ok=True)
        
        # Load credentials and tokens from disk
        self._load_credentials()
        self._load_tokens()
        
        # Initialize crypto provider
        self._initialize_crypto_provider()
        
        self.logger.info("API Authentication Provider initialized")
    
    def register_developer_credentials(self, developer_id: str, credentials: Dict[str, Any]) -> bool:
        """
        Register credentials for a developer.
        
        Args:
            developer_id: ID of the developer
            credentials: Credential data
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Registering credentials for developer: {developer_id}")
        
        # Check if developer already has credentials
        if developer_id in self.credential_store:
            self.logger.error(f"Developer already has credentials: {developer_id}")
            return False
        
        # Hash password if provided
        if 'password' in credentials:
            credentials['password_hash'] = self._hash_password(credentials['password'])
            del credentials['password']
        
        # Add timestamp
        credentials['registration_timestamp'] = time.time()
        credentials['last_updated_timestamp'] = time.time()
        credentials['developer_id'] = developer_id
        
        # Generate API key if requested
        if credentials.get('generate_api_key', False):
            api_key = self._generate_api_key()
            api_secret = self._generate_api_secret()
            
            credentials['api_key'] = api_key
            credentials['api_secret_hash'] = self._hash_api_secret(api_secret)
            credentials['api_key_created'] = time.time()
            
            # Return API secret to caller (will not be stored)
            credentials['api_secret'] = api_secret
        
        # Add to credential store (without API secret)
        store_credentials = credentials.copy()
        if 'api_secret' in store_credentials:
            del store_credentials['api_secret']
        
        self.credential_store[developer_id] = store_credentials
        
        # Save credentials to disk
        self._save_credentials(developer_id, store_credentials)
        
        return True
    
    def update_developer_credentials(self, developer_id: str, credentials: Dict[str, Any]) -> bool:
        """
        Update credentials for a developer.
        
        Args:
            developer_id: ID of the developer
            credentials: Updated credential data
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Updating credentials for developer: {developer_id}")
        
        # Check if developer has credentials
        if developer_id not in self.credential_store:
            self.logger.error(f"Developer does not have credentials: {developer_id}")
            return False
        
        # Get existing credentials
        existing_credentials = self.credential_store[developer_id]
        
        # Update credentials
        updated_credentials = existing_credentials.copy()
        
        # Hash password if provided
        if 'password' in credentials:
            updated_credentials['password_hash'] = self._hash_password(credentials['password'])
            del credentials['password']
        
        # Update fields
        for key, value in credentials.items():
            if key != 'password' and key != 'api_secret':
                updated_credentials[key] = value
        
        # Update timestamp
        updated_credentials['last_updated_timestamp'] = time.time()
        
        # Generate new API key if requested
        if credentials.get('generate_api_key', False):
            api_key = self._generate_api_key()
            api_secret = self._generate_api_secret()
            
            updated_credentials['api_key'] = api_key
            updated_credentials['api_secret_hash'] = self._hash_api_secret(api_secret)
            updated_credentials['api_key_created'] = time.time()
            
            # Return API secret to caller (will not be stored)
            updated_credentials['api_secret'] = api_secret
        
        # Add to credential store (without API secret)
        store_credentials = updated_credentials.copy()
        if 'api_secret' in store_credentials:
            del store_credentials['api_secret']
        
        self.credential_store[developer_id] = store_credentials
        
        # Save credentials to disk
        self._save_credentials(developer_id, store_credentials)
        
        return True
    
    def authenticate_developer(self, username: str, password: str) -> Optional[str]:
        """
        Authenticate a developer using username and password.
        
        Args:
            username: Developer username
            password: Developer password
            
        Returns:
            str: Developer ID if authentication successful, None otherwise
        """
        self.logger.info(f"Authenticating developer: {username}")
        
        # Find developer by username
        developer_id = None
        for dev_id, credentials in self.credential_store.items():
            if credentials.get('username') == username:
                developer_id = dev_id
                break
        
        # Check if developer found
        if not developer_id:
            self.logger.error(f"Developer not found: {username}")
            return None
        
        # Get credentials
        credentials = self.credential_store[developer_id]
        
        # Check password
        password_hash = credentials.get('password_hash')
        if not password_hash or not self._verify_password(password, password_hash):
            self.logger.error(f"Invalid password for developer: {username}")
            return None
        
        return developer_id
    
    def authenticate_with_api_key(self, api_key: str, api_secret: str) -> Optional[str]:
        """
        Authenticate a developer using API key and secret.
        
        Args:
            api_key: API key
            api_secret: API secret
            
        Returns:
            str: Developer ID if authentication successful, None otherwise
        """
        self.logger.info(f"Authenticating with API key")
        
        # Find developer by API key
        developer_id = None
        for dev_id, credentials in self.credential_store.items():
            if credentials.get('api_key') == api_key:
                developer_id = dev_id
                break
        
        # Check if developer found
        if not developer_id:
            self.logger.error(f"API key not found")
            return None
        
        # Get credentials
        credentials = self.credential_store[developer_id]
        
        # Check API secret
        api_secret_hash = credentials.get('api_secret_hash')
        if not api_secret_hash or not self._verify_api_secret(api_secret, api_secret_hash):
            self.logger.error(f"Invalid API secret")
            return None
        
        return developer_id
    
    def issue_token(self, developer_id: str, application_id: str, scope: List[str], expiration: int = 3600) -> Optional[Dict[str, Any]]:
        """
        Issue an access token for an application.
        
        Args:
            developer_id: ID of the developer
            application_id: ID of the application
            scope: List of API scopes the token is valid for
            expiration: Token expiration time in seconds
            
        Returns:
            dict: Token data or None if failed
        """
        self.logger.info(f"Issuing token for developer: {developer_id}, application: {application_id}")
        
        # Check if developer has credentials
        if developer_id not in self.credential_store:
            self.logger.error(f"Developer does not have credentials: {developer_id}")
            return None
        
        # Generate token ID
        token_id = str(uuid.uuid4())
        
        # Generate access token
        access_token = self._generate_access_token()
        
        # Generate refresh token
        refresh_token = self._generate_refresh_token()
        
        # Create token data
        token_data = {
            'id': token_id,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'developer_id': developer_id,
            'application_id': application_id,
            'scope': scope,
            'issued_at': time.time(),
            'expires_at': time.time() + expiration,
            'status': 'active'
        }
        
        # Add to token store
        self.token_store[token_id] = token_data
        
        # Save token to disk
        self._save_token(token_id, token_data)
        
        return token_data
    
    def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Refresh an access token using a refresh token.
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            dict: New token data or None if failed
        """
        self.logger.info(f"Refreshing token")
        
        # Find token by refresh token
        token_id = None
        token_data = None
        for t_id, data in self.token_store.items():
            if data.get('refresh_token') == refresh_token:
                token_id = t_id
                token_data = data
                break
        
        # Check if token found
        if not token_id or not token_data:
            self.logger.error(f"Refresh token not found")
            return None
        
        # Check if token is active
        if token_data.get('status') != 'active':
            self.logger.error(f"Token not active: {token_id}")
            return None
        
        # Check if token is expired
        if token_data.get('expires_at', 0) < time.time():
            self.logger.error(f"Token expired: {token_id}")
            return None
        
        # Generate new token ID
        new_token_id = str(uuid.uuid4())
        
        # Generate new access token
        new_access_token = self._generate_access_token()
        
        # Generate new refresh token
        new_refresh_token = self._generate_refresh_token()
        
        # Create new token data
        new_token_data = {
            'id': new_token_id,
            'access_token': new_access_token,
            'refresh_token': new_refresh_token,
            'developer_id': token_data.get('developer_id'),
            'application_id': token_data.get('application_id'),
            'scope': token_data.get('scope', []),
            'issued_at': time.time(),
            'expires_at': time.time() + (token_data.get('expires_at', 0) - token_data.get('issued_at', 0)),
            'status': 'active',
            'previous_token_id': token_id
        }
        
        # Update old token status
        token_data['status'] = 'refreshed'
        token_data['refreshed_at'] = time.time()
        token_data['new_token_id'] = new_token_id
        
        # Update token store
        self.token_store[token_id] = token_data
        self.token_store[new_token_id] = new_token_data
        
        # Save tokens to disk
        self._save_token(token_id, token_data)
        self._save_token(new_token_id, new_token_data)
        
        return new_token_data
    
    def revoke_token(self, token_id: str) -> bool:
        """
        Revoke an access token.
        
        Args:
            token_id: ID of the token to revoke
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Revoking token: {token_id}")
        
        # Check if token exists
        if token_id not in self.token_store:
            self.logger.error(f"Token not found: {token_id}")
            return False
        
        # Update token status
        token_data = self.token_store[token_id]
        token_data['status'] = 'revoked'
        token_data['revoked_at'] = time.time()
        
        # Update token store
        self.token_store[token_id] = token_data
        
        # Save token to disk
        self._save_token(token_id, token_data)
        
        return True
    
    def validate_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Validate an access token.
        
        Args:
            access_token: Access token to validate
            
        Returns:
            dict: Token data if valid, None otherwise
        """
        self.logger.info(f"Validating token")
        
        # Find token by access token
        token_id = None
        token_data = None
        for t_id, data in self.token_store.items():
            if data.get('access_token') == access_token:
                token_id = t_id
                token_data = data
                break
        
        # Check if token found
        if not token_id or not token_data:
            self.logger.error(f"Access token not found")
            return None
        
        # Check if token is active
        if token_data.get('status') != 'active':
            self.logger.error(f"Token not active: {token_id}")
            return None
        
        # Check if token is expired
        if token_data.get('expires_at', 0) < time.time():
            self.logger.error(f"Token expired: {token_id}")
            return None
        
        return token_data
    
    def _load_credentials(self):
        """Load credentials from disk."""
        credential_directory = self.config.get('credential_directory', 'config/api_credentials')
        if not os.path.exists(credential_directory):
            return
        
        for filename in os.listdir(credential_directory):
            if filename.endswith('.json'):
                credential_path = os.path.join(credential_directory, filename)
                try:
                    with open(credential_path, 'r') as f:
                        credentials = json.load(f)
                    
                    developer_id = credentials.get('developer_id')
                    if developer_id:
                        self.credential_store[developer_id] = credentials
                except Exception as e:
                    self.logger.error(f"Error loading credentials from {filename}: {str(e)}")
    
    def _save_credentials(self, developer_id: str, credentials: Dict[str, Any]):
        """
        Save credentials to disk.
        
        Args:
            developer_id: ID of the developer
            credentials: Credential data to save
        """
        credential_directory = self.config.get('credential_directory', 'config/api_credentials')
        os.makedirs(credential_directory, exist_ok=True)
        
        credential_path = os.path.join(credential_directory, f"{developer_id}.json")
        with open(credential_path, 'w') as f:
            json.dump(credentials, f, indent=2)
    
    def _load_tokens(self):
        """Load tokens from disk."""
        token_directory = self.config.get('token_directory', 'config/api_tokens')
        if not os.path.exists(token_directory):
            return
        
        for filename in os.listdir(token_directory):
            if filename.endswith('.json'):
                token_path = os.path.join(token_directory, filename)
                try:
                    with open(token_path, 'r') as f:
                        token_data = json.load(f)
                    
                    token_id = token_data.get('id')
                    if token_id:
                        self.token_store[token_id] = token_data
                except Exception as e:
                    self.logger.error(f"Error loading token from {filename}: {str(e)}")
    
    def _save_token(self, token_id: str, token_data: Dict[str, Any]):
        """
        Save token to disk.
        
        Args:
            token_id: ID of the token
            token_data: Token data to save
        """
        token_directory = self.config.get('token_directory', 'config/api_tokens')
        os.makedirs(token_directory, exist_ok=True)
        
        token_path = os.path.join(token_directory, f"{token_id}.json")
        with open(token_path, 'w') as f:
            json.dump(token_data, f, indent=2)
    
    def _initialize_crypto_provider(self):
        """Initialize the crypto provider."""
        self.logger.info("Initializing crypto provider")
        # In a real implementation, this would initialize a crypto provider
        # For this implementation, we'll use simple crypto functions
    
    def _hash_password(self, password: str) -> str:
        """
        Hash a password.
        
        Args:
            password: Password to hash
            
        Returns:
            str: Password hash
        """
        # In a real implementation, this would use a secure password hashing algorithm
        # For this implementation, we'll use a simple hash
        salt = secrets.token_hex(16)
        hash_obj = hashlib.sha256()
        hash_obj.update((password + salt).encode('utf-8'))
        password_hash = hash_obj.hexdigest()
        
        return f"{salt}:{password_hash}"
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """
        Verify a password against a hash.
        
        Args:
            password: Password to verify
            password_hash: Password hash to verify against
            
        Returns:
            bool: True if password is valid
        """
        # In a real implementation, this would use a secure password verification algorithm
        # For this implementation, we'll use a simple verification
        try:
            salt, hash_value = password_hash.split(':')
            hash_obj = hashlib.sha256()
            hash_obj.update((password + salt).encode('utf-8'))
            calculated_hash = hash_obj.hexdigest()
            
            return calculated_hash == hash_value
        except Exception as e:
            self.logger.error(f"Error verifying password: {str(e)}")
            return False
    
    def _generate_api_key(self) -> str:
        """
        Generate an API key.
        
        Returns:
            str: API key
        """
        # In a real implementation, this would use a secure key generation algorithm
        # For this implementation, we'll use a simple key generation
        return f"pk_{secrets.token_hex(16)}"
    
    def _generate_api_secret(self) -> str:
        """
        Generate an API secret.
        
        Returns:
            str: API secret
        """
        # In a real implementation, this would use a secure secret generation algorithm
        # For this implementation, we'll use a simple secret generation
        return f"sk_{secrets.token_hex(32)}"
    
    def _hash_api_secret(self, api_secret: str) -> str:
        """
        Hash an API secret.
        
        Args:
            api_secret: API secret to hash
            
        Returns:
            str: API secret hash
        """
        # In a real implementation, this would use a secure hashing algorithm
        # For this implementation, we'll use a simple hash
        hash_obj = hashlib.sha256()
        hash_obj.update(api_secret.encode('utf-8'))
        return hash_obj.hexdigest()
    
    def _verify_api_secret(self, api_secret: str, api_secret_hash: str) -> bool:
        """
        Verify an API secret against a hash.
        
        Args:
            api_secret: API secret to verify
            api_secret_hash: API secret hash to verify against
            
        Returns:
            bool: True if API secret is valid
        """
        # In a real implementation, this would use a secure verification algorithm
        # For this implementation, we'll use a simple verification
        try:
            hash_obj = hashlib.sha256()
            hash_obj.update(api_secret.encode('utf-8'))
            calculated_hash = hash_obj.hexdigest()
            
            return calculated_hash == api_secret_hash
        except Exception as e:
            self.logger.error(f"Error verifying API secret: {str(e)}")
            return False
    
    def _generate_access_token(self) -> str:
        """
        Generate an access token.
        
        Returns:
            str: Access token
        """
        # In a real implementation, this would use a secure token generation algorithm
        # For this implementation, we'll use a simple token generation
        return f"at_{secrets.token_hex(32)}"
    
    def _generate_refresh_token(self) -> str:
        """
        Generate a refresh token.
        
        Returns:
            str: Refresh token
        """
        # In a real implementation, this would use a secure token generation algorithm
        # For this implementation, we'll use a simple token generation
        return f"rt_{secrets.token_hex(32)}"
