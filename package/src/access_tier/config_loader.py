"""
Access Tier Management System - Configuration Loader

This module provides functionality for loading and validating access tier configurations.
"""

import json
import logging
import os
from typing import Dict, Any, List, Optional

from .models import TierDefinition, RateLimits, ProgressionCriteria

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ConfigurationError(Exception):
    """Exception raised for configuration errors."""
    pass


class ConfigLoader:
    """
    Loads and validates access tier configurations from JSON files.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the config loader with a configuration file path.
        
        Args:
            config_path: Path to the configuration file
        """
        self.config_path = config_path
        self._config = None
    
    def load_config(self) -> Dict[str, Any]:
        """
        Load configuration from the JSON file.
        
        Returns:
            Dict: The loaded configuration
            
        Raises:
            ConfigurationError: If the configuration is invalid or cannot be loaded
        """
        if not os.path.exists(self.config_path):
            raise ConfigurationError(f"Configuration file not found: {self.config_path}")
        
        try:
            with open(self.config_path, 'r') as f:
                self._config = json.load(f)
            
            logger.info(f"Loaded configuration from {self.config_path}")
            return self._config
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in configuration file: {str(e)}")
        except Exception as e:
            raise ConfigurationError(f"Failed to load configuration: {str(e)}")
    
    def get_setting(self, key: str, default: Any = None) -> Any:
        """
        Get a specific setting from the configuration.
        
        Args:
            key: The setting key
            default: Default value if the key is not found
            
        Returns:
            The setting value or default if not found
        """
        if self._config is None:
            self.load_config()
        
        return self._config.get("settings", {}).get(key, default)
    
    def save_config(self, config: Dict[str, Any]) -> None:
        """
        Save configuration to the JSON file.
        
        Args:
            config: The configuration to save
            
        Raises:
            ConfigurationError: If the configuration cannot be saved
        """
        try:
            with open(self.config_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            self._config = config
            logger.info(f"Saved configuration to {self.config_path}")
        except Exception as e:
            raise ConfigurationError(f"Failed to save configuration: {str(e)}")
    
    def load_tiers(self) -> List[TierDefinition]:
        """
        Load tier definitions from the configuration file.
        
        Returns:
            List[TierDefinition]: List of tier definitions
            
        Raises:
            ConfigurationError: If the configuration is invalid or cannot be loaded
        """
        config = self.load_config()
        
        if 'tiers' not in config:
            raise ConfigurationError("Configuration does not contain 'tiers' section")
        
        tiers = []
        for tier_data in config['tiers']:
            try:
                # Extract nested objects to create properly
                rate_limits_data = tier_data.pop('rate_limits', {})
                progression_criteria_data = tier_data.pop('progression_criteria', None)
                
                # Create the rate limits object
                rate_limits = RateLimits(**rate_limits_data)
                
                # Create the progression criteria object if provided
                progression_criteria = None
                if progression_criteria_data:
                    progression_criteria = ProgressionCriteria(**progression_criteria_data)
                
                # Create the tier definition
                tier = TierDefinition(
                    **tier_data,
                    rate_limits=rate_limits,
                    progression_criteria=progression_criteria
                )
                tiers.append(tier)
            except Exception as e:
                logger.error(f"Failed to load tier definition: {str(e)}")
                # Continue loading other tiers even if one fails
        
        logger.info(f"Loaded {len(tiers)} tier definitions")
        return tiers
    
    def validate_config(self, config: Dict[str, Any] = None) -> List[str]:
        """
        Validate a configuration dictionary.
        
        Args:
            config: The configuration to validate, uses loaded config if None
            
        Returns:
            List[str]: List of validation errors, empty if valid
        """
        if config is None:
            if self._config is None:
                self.load_config()
            config = self._config
        
        errors = []
        
        # Check for required sections
        if 'tiers' not in config:
            errors.append("Configuration missing required 'tiers' section")
            return errors  # Can't continue validation without tiers
        
        # Validate tiers
        tier_ids = set()
        for i, tier_data in enumerate(config.get('tiers', [])):
            # Check for required tier fields
            if 'id' not in tier_data:
                errors.append(f"Tier at index {i} missing required 'id' field")
            else:
                # Check for duplicate tier IDs
                if tier_data['id'] in tier_ids:
                    errors.append(f"Duplicate tier ID: {tier_data['id']}")
                tier_ids.add(tier_data['id'])
            
            if 'name' not in tier_data:
                errors.append(f"Tier at index {i} missing required 'name' field")
            
            if 'permissions' not in tier_data:
                errors.append(f"Tier at index {i} missing required 'permissions' field")
            elif not isinstance(tier_data['permissions'], list):
                errors.append(f"Tier at index {i} 'permissions' must be a list")
            
            # Validate rate limits
            if 'rate_limits' not in tier_data:
                errors.append(f"Tier at index {i} missing required 'rate_limits' field")
            else:
                rate_limits = tier_data['rate_limits']
                if not isinstance(rate_limits, dict):
                    errors.append(f"Tier at index {i} 'rate_limits' must be an object")
                else:
                    if 'requests_per_minute' not in rate_limits:
                        errors.append(f"Tier at index {i} 'rate_limits' missing required 'requests_per_minute' field")
                    elif not isinstance(rate_limits['requests_per_minute'], int) or rate_limits['requests_per_minute'] < 1:
                        errors.append(f"Tier at index {i} 'requests_per_minute' must be a positive integer")
        
        # Validate gateway integration if present
        if 'gateway_integration' in config:
            gateway = config['gateway_integration']
            if not isinstance(gateway, dict):
                errors.append("'gateway_integration' must be an object")
        
        # Validate progression if present
        if 'progression' in config:
            progression = config['progression']
            if not isinstance(progression, dict):
                errors.append("'progression' must be an object")
            else:
                if 'automatic_evaluation_interval' in progression:
                    if not isinstance(progression['automatic_evaluation_interval'], int) or progression['automatic_evaluation_interval'] < 1:
                        errors.append("'automatic_evaluation_interval' must be a positive integer")
        
        return errors


# For backward compatibility, provide AccessTierConfigLoader as an alias
AccessTierConfigLoader = ConfigLoader
