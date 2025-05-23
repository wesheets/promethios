"""
Developer Experience Portal - Authentication System

This module implements the authentication system for the Developer Experience Portal,
providing user registration, login, and session management.
"""

import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import os
import json
import hashlib
import secrets
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AuthenticationService:
    """
    Authentication service for the Developer Experience Portal.
    
    This class provides functionality for:
    - User registration and management
    - Authentication and authorization
    - Session management
    - Integration with external auth providers
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the authentication service.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.providers = self.config.get('providers', ['local'])
        self.session_timeout_hours = self.config.get('session_timeout_hours', 24)
        self.require_email_verification = self.config.get('require_email_verification', True)
        self.password_min_length = self.config.get('password_min_length', 8)
        self.password_require_special = self.config.get('password_require_special', True)
        
        # Store user data
        self.users = {}
        
        # Store sessions
        self.sessions = {}
        
        # Store verification tokens
        self.verification_tokens = {}
        
        # Store password reset tokens
        self.reset_tokens = {}
        
        logger.info(f"Initialized authentication service with providers: {', '.join(self.providers)}")
    
    def register_user(self, username: str, email: str, password: str, 
                     user_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Register a new user.
        
        Args:
            username: Username
            email: Email address
            password: Password
            user_data: Additional user data
            
        Returns:
            Dict: Registration result
        """
        # Check if username or email already exists
        for user_id, user in self.users.items():
            if user.get('username') == username:
                return {
                    "success": False,
                    "error": "username_exists",
                    "message": "Username already exists"
                }
            
            if user.get('email') == email:
                return {
                    "success": False,
                    "error": "email_exists",
                    "message": "Email already exists"
                }
        
        # Validate password
        password_validation = self._validate_password(password)
        if not password_validation["valid"]:
            return {
                "success": False,
                "error": "invalid_password",
                "message": password_validation["message"]
            }
        
        # Generate user ID
        import uuid
        user_id = str(uuid.uuid4())
        
        # Hash password
        password_hash = self._hash_password(password)
        
        # Create user
        user = {
            "id": user_id,
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "created_at": datetime.now().isoformat(),
            "verified": not self.require_email_verification,
            "active": True,
            "roles": ["user"],
            "data": user_data or {}
        }
        
        # Store user
        self.users[user_id] = user
        
        # Generate verification token if required
        verification_token = None
        if self.require_email_verification:
            verification_token = self._generate_verification_token(user_id)
            
            # In a real implementation, this would send an email
            logger.info(f"Verification token for user {username}: {verification_token}")
        
        logger.info(f"Registered user: {username} ({user_id})")
        
        return {
            "success": True,
            "user_id": user_id,
            "username": username,
            "email": email,
            "verified": user["verified"],
            "verification_required": self.require_email_verification,
            "verification_token": verification_token
        }
    
    def authenticate(self, username_or_email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate a user.
        
        Args:
            username_or_email: Username or email
            password: Password
            
        Returns:
            Dict: Authentication result
        """
        # Find user by username or email
        user = None
        for user_id, u in self.users.items():
            if u.get('username') == username_or_email or u.get('email') == username_or_email:
                user = u
                break
        
        if not user:
            return {
                "success": False,
                "error": "invalid_credentials",
                "message": "Invalid username/email or password"
            }
        
        # Check if user is active
        if not user.get('active', True):
            return {
                "success": False,
                "error": "account_inactive",
                "message": "Account is inactive"
            }
        
        # Check if user is verified
        if self.require_email_verification and not user.get('verified', False):
            return {
                "success": False,
                "error": "account_not_verified",
                "message": "Account is not verified"
            }
        
        # Verify password
        if not self._verify_password(password, user.get('password_hash', '')):
            return {
                "success": False,
                "error": "invalid_credentials",
                "message": "Invalid username/email or password"
            }
        
        # Generate session
        session_id = self._create_session(user["id"])
        
        logger.info(f"Authenticated user: {user.get('username')} ({user.get('id')})")
        
        return {
            "success": True,
            "user_id": user["id"],
            "username": user.get('username'),
            "email": user.get('email'),
            "roles": user.get('roles', []),
            "session_id": session_id
        }
    
    def verify_email(self, token: str) -> Dict[str, Any]:
        """
        Verify a user's email address.
        
        Args:
            token: Verification token
            
        Returns:
            Dict: Verification result
        """
        # Check if token exists
        if token not in self.verification_tokens:
            return {
                "success": False,
                "error": "invalid_token",
                "message": "Invalid verification token"
            }
        
        # Get user ID from token
        user_id = self.verification_tokens[token]["user_id"]
        
        # Check if user exists
        if user_id not in self.users:
            return {
                "success": False,
                "error": "user_not_found",
                "message": "User not found"
            }
        
        # Check if token is expired
        token_data = self.verification_tokens[token]
        try:
            expiry = datetime.fromisoformat(token_data["expires_at"])
            if expiry < datetime.now():
                return {
                    "success": False,
                    "error": "token_expired",
                    "message": "Verification token has expired"
                }
        except (ValueError, KeyError):
            return {
                "success": False,
                "error": "invalid_token",
                "message": "Invalid verification token"
            }
        
        # Mark user as verified
        self.users[user_id]["verified"] = True
        
        # Remove token
        del self.verification_tokens[token]
        
        logger.info(f"Verified email for user {user_id}")
        
        return {
            "success": True,
            "user_id": user_id,
            "username": self.users[user_id].get('username'),
            "email": self.users[user_id].get('email')
        }
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a session by ID.
        
        Args:
            session_id: Session ID
            
        Returns:
            Dict: Session data or None if not found
        """
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        
        # Check if session is expired
        try:
            expiry = datetime.fromisoformat(session["expires_at"])
            if expiry < datetime.now():
                # Remove expired session
                del self.sessions[session_id]
                return None
        except (ValueError, KeyError):
            return None
        
        # Update last active time
        session["last_active"] = datetime.now().isoformat()
        
        # Get user data
        user_id = session["user_id"]
        user = self.users.get(user_id)
        
        if not user:
            # User not found, invalidate session
            del self.sessions[session_id]
            return None
        
        return {
            "session_id": session_id,
            "user_id": user_id,
            "username": user.get('username'),
            "email": user.get('email'),
            "roles": user.get('roles', []),
            "expires_at": session["expires_at"]
        }
    
    def end_session(self, session_id: str) -> bool:
        """
        End a session.
        
        Args:
            session_id: Session ID
            
        Returns:
            bool: True if session was ended, False if not found
        """
        if session_id in self.sessions:
            user_id = self.sessions[session_id]["user_id"]
            del self.sessions[session_id]
            logger.info(f"Ended session for user {user_id}: {session_id}")
            return True
        
        return False
    
    def request_password_reset(self, email: str) -> Dict[str, Any]:
        """
        Request a password reset.
        
        Args:
            email: Email address
            
        Returns:
            Dict: Reset request result
        """
        # Find user by email
        user = None
        for user_id, u in self.users.items():
            if u.get('email') == email:
                user = u
                break
        
        if not user:
            # Don't reveal that email doesn't exist
            return {
                "success": True,
                "message": "If your email is registered, you will receive a password reset link"
            }
        
        # Generate reset token
        token = self._generate_reset_token(user["id"])
        
        # In a real implementation, this would send an email
        logger.info(f"Password reset token for user {user.get('username')}: {token}")
        
        return {
            "success": True,
            "message": "If your email is registered, you will receive a password reset link"
        }
    
    def reset_password(self, token: str, new_password: str) -> Dict[str, Any]:
        """
        Reset a user's password.
        
        Args:
            token: Reset token
            new_password: New password
            
        Returns:
            Dict: Reset result
        """
        # Check if token exists
        if token not in self.reset_tokens:
            return {
                "success": False,
                "error": "invalid_token",
                "message": "Invalid reset token"
            }
        
        # Get user ID from token
        user_id = self.reset_tokens[token]["user_id"]
        
        # Check if user exists
        if user_id not in self.users:
            return {
                "success": False,
                "error": "user_not_found",
                "message": "User not found"
            }
        
        # Check if token is expired
        token_data = self.reset_tokens[token]
        try:
            expiry = datetime.fromisoformat(token_data["expires_at"])
            if expiry < datetime.now():
                return {
                    "success": False,
                    "error": "token_expired",
                    "message": "Reset token has expired"
                }
        except (ValueError, KeyError):
            return {
                "success": False,
                "error": "invalid_token",
                "message": "Invalid reset token"
            }
        
        # Validate new password
        password_validation = self._validate_password(new_password)
        if not password_validation["valid"]:
            return {
                "success": False,
                "error": "invalid_password",
                "message": password_validation["message"]
            }
        
        # Update password
        self.users[user_id]["password_hash"] = self._hash_password(new_password)
        
        # Remove token
        del self.reset_tokens[token]
        
        # End all sessions for this user
        for session_id, session in list(self.sessions.items()):
            if session.get("user_id") == user_id:
                del self.sessions[session_id]
        
        logger.info(f"Reset password for user {user_id}")
        
        return {
            "success": True,
            "user_id": user_id,
            "username": self.users[user_id].get('username'),
            "email": self.users[user_id].get('email')
        }
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict: User data or None if not found
        """
        if user_id not in self.users:
            return None
        
        user = self.users[user_id]
        
        # Don't return sensitive data
        return {
            "id": user["id"],
            "username": user.get('username'),
            "email": user.get('email'),
            "verified": user.get('verified', False),
            "active": user.get('active', True),
            "roles": user.get('roles', []),
            "created_at": user.get('created_at'),
            "data": user.get('data', {})
        }
    
    def update_user(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a user's data.
        
        Args:
            user_id: User ID
            user_data: User data to update
            
        Returns:
            Dict: Update result
        """
        if user_id not in self.users:
            return {
                "success": False,
                "error": "user_not_found",
                "message": "User not found"
            }
        
        # Don't allow updating sensitive fields
        sensitive_fields = ['id', 'password_hash', 'created_at']
        update_data = {k: v for k, v in user_data.items() if k not in sensitive_fields}
        
        # Update user data
        self.users[user_id].update(update_data)
        
        logger.info(f"Updated user {user_id}")
        
        return {
            "success": True,
            "user_id": user_id,
            "updated_fields": list(update_data.keys())
        }
    
    def _hash_password(self, password: str) -> str:
        """
        Hash a password.
        
        Args:
            password: Password to hash
            
        Returns:
            str: Hashed password
        """
        # In a real implementation, this would use a proper password hashing algorithm
        # like bcrypt or Argon2. For simplicity, we use a basic hash here.
        salt = secrets.token_hex(16)
        hash_obj = hashlib.sha256((password + salt).encode())
        return f"{salt}:{hash_obj.hexdigest()}"
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """
        Verify a password against a hash.
        
        Args:
            password: Password to verify
            password_hash: Hashed password
            
        Returns:
            bool: True if password matches hash, False otherwise
        """
        try:
            salt, hash_value = password_hash.split(':')
            hash_obj = hashlib.sha256((password + salt).encode())
            return hash_obj.hexdigest() == hash_value
        except (ValueError, AttributeError):
            return False
    
    def _validate_password(self, password: str) -> Dict[str, Any]:
        """
        Validate a password.
        
        Args:
            password: Password to validate
            
        Returns:
            Dict: Validation result
        """
        if len(password) < self.password_min_length:
            return {
                "valid": False,
                "message": f"Password must be at least {self.password_min_length} characters long"
            }
        
        if self.password_require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return {
                "valid": False,
                "message": "Password must contain at least one special character"
            }
        
        return {
            "valid": True
        }
    
    def _create_session(self, user_id: str) -> str:
        """
        Create a new session for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            str: Session ID
        """
        # Generate session ID
        session_id = secrets.token_urlsafe(32)
        
        # Calculate expiry time
        expiry = datetime.now() + timedelta(hours=self.session_timeout_hours)
        
        # Create session
        session = {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "expires_at": expiry.isoformat(),
            "last_active": datetime.now().isoformat()
        }
        
        # Store session
        self.sessions[session_id] = session
        
        return session_id
    
    def _generate_verification_token(self, user_id: str) -> str:
        """
        Generate a verification token for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            str: Verification token
        """
        # Generate token
        token = secrets.token_urlsafe(32)
        
        # Calculate expiry time (24 hours)
        expiry = datetime.now() + timedelta(hours=24)
        
        # Store token
        self.verification_tokens[token] = {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "expires_at": expiry.isoformat()
        }
        
        return token
    
    def _generate_reset_token(self, user_id: str) -> str:
        """
        Generate a password reset token for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            str: Reset token
        """
        # Generate token
        token = secrets.token_urlsafe(32)
        
        # Calculate expiry time (1 hour)
        expiry = datetime.now() + timedelta(hours=1)
        
        # Store token
        self.reset_tokens[token] = {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "expires_at": expiry.isoformat()
        }
        
        return token


# For backward compatibility, keep the original AuthenticationSystem class
# but make it an alias of AuthenticationService
AuthenticationSystem = AuthenticationService
