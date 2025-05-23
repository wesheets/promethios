"""
Developer Experience Portal - Core Application

This module implements the core application for the Developer Experience Portal,
providing the foundation for API documentation, account management, and tier progression.
"""

import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import os
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DeveloperPortal:
    """
    Core application for the Developer Experience Portal.
    
    This class provides functionality for:
    - Portal initialization and configuration
    - Integration with access tier management
    - Integration with API gateway
    - User authentication and session management
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the developer portal.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.portal_name = self.config.get('portal_name', 'API Developer Portal')
        self.portal_description = self.config.get('portal_description', 'Access and manage your API resources')
        self.theme = self.config.get('theme', 'default')
        self.features = self.config.get('features', {
            'documentation': True,
            'account_management': True,
            'api_keys': True,
            'usage_metrics': True,
            'tier_progression': True,
            'sandbox': True
        })
        
        # Store registered components
        self.components = {}
        
        # Store user sessions
        self.sessions = {}
        
        logger.info(f"Initialized developer portal: {self.portal_name}")
    
    def configure(self, config: Dict[str, Any]) -> None:
        """
        Update portal configuration.
        
        Args:
            config: Configuration dictionary
        """
        self.config.update(config)
        
        # Update extracted values
        self.portal_name = self.config.get('portal_name', self.portal_name)
        self.portal_description = self.config.get('portal_description', self.portal_description)
        self.theme = self.config.get('theme', self.theme)
        self.features.update(self.config.get('features', {}))
        
        logger.info("Updated developer portal configuration")
    
    def register_component(self, name: str, component: Any) -> None:
        """
        Register a component with the portal.
        
        Args:
            name: Component name
            component: Component instance
        """
        self.components[name] = component
        logger.info(f"Registered component: {name}")
    
    def get_component(self, name: str) -> Optional[Any]:
        """
        Get a registered component.
        
        Args:
            name: Component name
            
        Returns:
            Component instance or None if not found
        """
        return self.components.get(name)
    
    def get_portal_info(self) -> Dict[str, Any]:
        """
        Get portal information.
        
        Returns:
            Dict: Portal information
        """
        return {
            "name": self.portal_name,
            "description": self.portal_description,
            "theme": self.theme,
            "features": self.features,
            "components": list(self.components.keys())
        }
    
    def create_session(self, user_id: str, user_data: Dict[str, Any]) -> str:
        """
        Create a user session.
        
        Args:
            user_id: User ID
            user_data: User data
            
        Returns:
            str: Session ID
        """
        # Generate session ID
        import uuid
        session_id = str(uuid.uuid4())
        
        # Create session
        self.sessions[session_id] = {
            "user_id": user_id,
            "user_data": user_data,
            "created_at": datetime.now().isoformat(),
            "last_active": datetime.now().isoformat()
        }
        
        logger.info(f"Created session for user {user_id}: {session_id}")
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a user session.
        
        Args:
            session_id: Session ID
            
        Returns:
            Dict: Session data or None if not found
        """
        session = self.sessions.get(session_id)
        
        if session:
            # Update last active time
            session["last_active"] = datetime.now().isoformat()
        
        return session
    
    def end_session(self, session_id: str) -> bool:
        """
        End a user session.
        
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
    
    def clean_expired_sessions(self, max_age_hours: int = 24) -> int:
        """
        Clean expired sessions.
        
        Args:
            max_age_hours: Maximum session age in hours
            
        Returns:
            int: Number of sessions cleaned
        """
        now = datetime.now()
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            try:
                last_active = datetime.fromisoformat(session["last_active"])
                age = now - last_active
                
                if age.total_seconds() > max_age_hours * 3600:
                    expired_sessions.append(session_id)
            except (ValueError, KeyError):
                # Invalid session data, mark for cleanup
                expired_sessions.append(session_id)
        
        # Clean expired sessions
        for session_id in expired_sessions:
            del self.sessions[session_id]
        
        if expired_sessions:
            logger.info(f"Cleaned {len(expired_sessions)} expired sessions")
        
        return len(expired_sessions)


class PortalConfig:
    """
    Configuration manager for the Developer Experience Portal.
    
    This class provides functionality for:
    - Loading configuration from files
    - Validating configuration
    - Providing default values
    """
    
    def __init__(self, config_dir: str = None):
        """
        Initialize the configuration manager.
        
        Args:
            config_dir: Configuration directory
        """
        self.config_dir = config_dir or os.path.join(os.getcwd(), 'config')
        self.config = self._get_default_config()
        
        logger.info(f"Initialized portal configuration manager with directory: {self.config_dir}")
    
    def load_config(self, config_file: str = 'portal_config.json') -> Dict[str, Any]:
        """
        Load configuration from a file.
        
        Args:
            config_file: Configuration file name
            
        Returns:
            Dict: Loaded configuration
        """
        config_path = os.path.join(self.config_dir, config_file)
        
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    loaded_config = json.load(f)
                
                # Update config with loaded values
                self._update_config(loaded_config)
                logger.info(f"Loaded configuration from {config_path}")
            else:
                logger.warning(f"Configuration file not found: {config_path}")
        except Exception as e:
            logger.error(f"Error loading configuration: {str(e)}")
        
        return self.config
    
    def save_config(self, config_file: str = 'portal_config.json') -> bool:
        """
        Save configuration to a file.
        
        Args:
            config_file: Configuration file name
            
        Returns:
            bool: True if successful, False otherwise
        """
        config_path = os.path.join(self.config_dir, config_file)
        
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            
            with open(config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            
            logger.info(f"Saved configuration to {config_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving configuration: {str(e)}")
            return False
    
    def get_config(self) -> Dict[str, Any]:
        """
        Get the current configuration.
        
        Returns:
            Dict: Current configuration
        """
        return self.config
    
    def update_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update the configuration.
        
        Args:
            config: New configuration values
            
        Returns:
            Dict: Updated configuration
        """
        self._update_config(config)
        return self.config
    
    def _get_default_config(self) -> Dict[str, Any]:
        """
        Get the default configuration.
        
        Returns:
            Dict: Default configuration
        """
        return {
            "portal_name": "API Developer Portal",
            "portal_description": "Access and manage your API resources",
            "theme": "default",
            "features": {
                "documentation": True,
                "account_management": True,
                "api_keys": True,
                "usage_metrics": True,
                "tier_progression": True,
                "sandbox": True
            },
            "auth": {
                "providers": ["local"],
                "session_timeout_hours": 24,
                "require_email_verification": True
            },
            "integrations": {
                "access_tier_manager": True,
                "api_gateway": True,
                "progressive_access": True
            },
            "ui": {
                "logo_url": "/static/images/logo.png",
                "primary_color": "#4285F4",
                "secondary_color": "#34A853",
                "font_family": "Roboto, sans-serif"
            }
        }
    
    def _update_config(self, config: Dict[str, Any]) -> None:
        """
        Update configuration with new values.
        
        Args:
            config: New configuration values
        """
        def update_dict(target, source):
            for key, value in source.items():
                if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                    update_dict(target[key], value)
                else:
                    target[key] = value
        
        update_dict(self.config, config)
