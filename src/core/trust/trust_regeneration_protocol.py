#!/usr/bin/env python3
"""
Trust Regeneration Protocol for Promethios Phase 5.9

This module implements the core trust regeneration mechanisms for the Promethios system,
including verification-based, attestation-based, and time-based regeneration.

Codex Contract: v2025.05.21
Phase ID: 5.9
"""

import json
import os
import re
import logging
import math
from datetime import datetime, timedelta
import uuid

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrustRegenerationProtocol:
    """
    Implements trust regeneration mechanisms for the Promethios system.
    
    This component is responsible for calculating and applying trust regeneration
    based on successful verifications, attestations, and time-based recovery.
    It maintains regeneration history and provides configuration options for
    customizing regeneration behavior.
    
    Codex Contract: v2025.05.21
    Phase ID: 5.9
    """
    
    def __init__(self, config=None, contract_sealer=None):
        """
        Initialize the Trust Regeneration Protocol with optional configuration.
        
        Args:
            config (dict, optional): Configuration dictionary for regeneration parameters.
            contract_sealer (ContractSealer, optional): Instance of ContractSealer for sealing operations.
        """
        # Codex contract tethering
        self.contract_version = "v2025.05.21"
        self.phase_id = "5.9"
        self.codex_clauses = ["5.9", "11.3", "11.7"]
        
        # Initialize configuration
        self.config = config or self._load_default_config()
        
        # Initialize contract sealer
        self.contract_sealer = contract_sealer
        
        # Initialize regeneration history
        self.regeneration_history = []
        
        # Initialize verification success tracking
        self.verification_successes = {}
        
        # Perform pre-loop tether check
        if not self._pre_loop_tether_check():
            raise ValueError("Pre-loop tether check failed for TrustRegenerationProtocol")
        
        logger.info("TrustRegenerationProtocol initialized with contract version %s", self.contract_version)
    
    def _pre_loop_tether_check(self):
        """
        Perform pre-loop tether check to verify contract compliance.
        
        Returns:
            bool: True if tether check passes, False otherwise.
        """
        # Verify contract version format
        if not re.match(r"v\d{4}\.\d{2}\.\d{2}", self.contract_version):
            logger.error("Invalid contract version format: %s", self.contract_version)
            return False
            
        # Verify phase ID format
        if not re.match(r"5\.\d+", self.phase_id):
            logger.error("Invalid phase ID format: %s", self.phase_id)
            return False
            
        # Verify codex clauses
        if "5.9" not in self.codex_clauses:
            logger.error("Missing required codex clause 5.9")
            return False
            
        # Verify configuration structure
        if not self._validate_config_structure(self.config):
            logger.error("Invalid configuration structure")
            return False
            
        return True
    
    def _validate_config_structure(self, config):
        """
        Validate the configuration structure.
        
        Args:
            config (dict): Configuration dictionary to validate.
            
        Returns:
            bool: True if configuration is valid, False otherwise.
        """
        try:
            required_sections = ["verification_regeneration", "attestation_regeneration", "time_regeneration"]
            for section in required_sections:
                if section not in config:
                    logger.error("Missing required configuration section: %s", section)
                    return False
                    
            # Validate verification regeneration configuration
            verification_regeneration = config.get("verification_regeneration", {})
            if not isinstance(verification_regeneration, dict):
                logger.error("Invalid verification regeneration configuration: not a dictionary")
                return False
                
            if not isinstance(verification_regeneration.get("enabled"), bool) or not isinstance(verification_regeneration.get("base_factor"), (int, float)):
                logger.error("Invalid verification regeneration configuration: missing or invalid parameters")
                return False
                
            # Validate attestation regeneration configuration
            attestation_regeneration = config.get("attestation_regeneration", {})
            if not isinstance(attestation_regeneration, dict):
                logger.error("Invalid attestation regeneration configuration: not a dictionary")
                return False
                
            if not isinstance(attestation_regeneration.get("enabled"), bool) or not isinstance(attestation_regeneration.get("factors"), dict):
                logger.error("Invalid attestation regeneration configuration: missing or invalid parameters")
                return False
                
            # Validate time regeneration configuration
            time_regeneration = config.get("time_regeneration", {})
            if not isinstance(time_regeneration, dict):
                logger.error("Invalid time regeneration configuration: not a dictionary")
                return False
                
            if not isinstance(time_regeneration.get("enabled"), bool) or not isinstance(time_regeneration.get("daily_rate"), (int, float)):
                logger.error("Invalid time regeneration configuration: missing or invalid parameters")
                return False
                
            return True
        except Exception as e:
            logger.error("Error validating configuration structure: %s", str(e))
            return False
    
    def _load_default_config(self):
        """
        Load default configuration for the Trust Regeneration Protocol.
        
        Returns:
            dict: Default configuration dictionary.
        """
        return {
            "verification_regeneration": {
                "enabled": True,
                "base_factor": 0.05,
                "consecutive_bonus": 0.02,
                "max_consecutive_bonus": 0.2
            },
            "attestation_regeneration": {
                "enabled": True,
                "factors": {
                    "self_attestation": 0.05,
                    "peer_attestation": 0.1,
                    "authority_attestation": 0.3
                }
            },
            "time_regeneration": {
                "enabled": True,
                "daily_rate": 0.01,
                "maximum_trust": 0.7
            },
            "max_history_size": 1000
        }
    
    def apply_verification_regeneration(self, trust_level, verification_result, entity_id):
        """
        Apply verification-based regeneration to a trust level.
        
        Args:
            trust_level (float): Current trust level (0.0-1.0)
            verification_result (bool): Whether verification was successful
            entity_id (str): ID of the entity experiencing regeneration
            
        Returns:
            float: New trust level after regeneration
        """
        if not self.config["verification_regeneration"]["enabled"]:
            return trust_level
            
        # If verification failed, no regeneration
        if not verification_result:
            # Reset consecutive successes
            self.verification_successes[entity_id] = 0
            return trust_level
            
        # Get or initialize consecutive successes
        consecutive_successes = self.verification_successes.get(entity_id, 0) + 1
        self.verification_successes[entity_id] = consecutive_successes
        
        # Calculate regeneration factor
        base_factor = self.config["verification_regeneration"]["base_factor"]
        consecutive_bonus = self.config["verification_regeneration"]["consecutive_bonus"] * min(
            consecutive_successes - 1,
            self.config["verification_regeneration"]["max_consecutive_bonus"] / self.config["verification_regeneration"]["consecutive_bonus"]
        )
        regeneration_factor = base_factor + consecutive_bonus
        
        # Apply regeneration
        new_trust = min(trust_level + regeneration_factor, 1.0)
        
        # Record regeneration event
        self._record_regeneration_event(
            "verification",
            trust_level,
            new_trust,
            {
                "verification_result": verification_result,
                "consecutive_successes": consecutive_successes,
                "entity_id": entity_id
            }
        )
        
        return new_trust
    
    def apply_attestation_regeneration(self, trust_level, attestation_type, attestation_data):
        """
        Apply attestation-based regeneration to a trust level.
        
        Args:
            trust_level (float): Current trust level (0.0-1.0)
            attestation_type (str): Type of attestation
            attestation_data (dict): Data associated with the attestation
            
        Returns:
            float: New trust level after regeneration
        """
        if not self.config["attestation_regeneration"]["enabled"]:
            return trust_level
            
        # Get regeneration factor for attestation type
        regeneration_factor = self.config["attestation_regeneration"]["factors"].get(attestation_type, 0.0)
        
        # Apply regeneration
        new_trust = min(trust_level + regeneration_factor, 1.0)
        
        # Record regeneration event
        self._record_regeneration_event(
            "attestation",
            trust_level,
            new_trust,
            {
                "attestation_type": attestation_type,
                "attestation_data": attestation_data,
                "entity_id": attestation_data.get("entity_id", "unknown")
            }
        )
        
        return new_trust
    
    def apply_time_regeneration(self, trust_level, last_update, current_time=None, entity_id=None):
        """
        Apply time-based regeneration to a trust level.
        
        Args:
            trust_level (float): Current trust level (0.0-1.0)
            last_update (datetime): Time of last trust update
            current_time (datetime, optional): Current time, defaults to now
            entity_id (str, optional): ID of the entity experiencing regeneration
            
        Returns:
            float: New trust level after regeneration
        """
        if not self.config["time_regeneration"]["enabled"]:
            return trust_level
            
        current_time = current_time or datetime.now()
        
        # Calculate days elapsed
        days_elapsed = (current_time - last_update).total_seconds() / (24 * 3600)
        
        # If no time has passed, no regeneration
        if days_elapsed <= 0:
            return trust_level
            
        # Calculate regeneration amount
        daily_rate = self.config["time_regeneration"]["daily_rate"]
        regeneration_amount = daily_rate * days_elapsed
        
        # Apply regeneration
        new_trust = min(
            trust_level + regeneration_amount,
            self.config["time_regeneration"]["maximum_trust"]
        )
        
        # Record regeneration event
        self._record_regeneration_event(
            "time",
            trust_level,
            new_trust,
            {
                "days_elapsed": days_elapsed,
                "daily_rate": daily_rate,
                "entity_id": entity_id
            }
        )
        
        return new_trust
    
    def _record_regeneration_event(self, regeneration_type, old_trust, new_trust, details):
        """
        Record a regeneration event in the history and log.
        
        Args:
            regeneration_type (str): Type of regeneration (verification, attestation, time)
            old_trust (float): Trust level before regeneration
            new_trust (float): Trust level after regeneration
            details (dict): Additional details about the regeneration event
        """
        # Create event record
        event = {
            "timestamp": datetime.now().isoformat(),
            "regeneration_type": regeneration_type,
            "old_trust": old_trust,
            "new_trust": new_trust,
            "details": details
        }
        
        # Add to history
        self.regeneration_history.append(event)
        
        # Limit history size
        if len(self.regeneration_history) > self.config.get("max_history_size", 1000):
            self.regeneration_history = self.regeneration_history[-self.config.get("max_history_size", 1000):]
        
        # Log the event
        entity_id = details.get("entity_id", "unknown")
        logger.info(
            "Trust regeneration: %s, entity: %s, old: %.4f, new: %.4f",
            regeneration_type, entity_id, old_trust, new_trust
        )
        
        # If significant regeneration, log at info level with more details
        if (new_trust - old_trust) > 0.1:
            logger.info(
                "Significant trust regeneration: %s, entity: %s, old: %.4f, new: %.4f, regeneration amount: %.4f",
                regeneration_type, entity_id, old_trust, new_trust, new_trust - old_trust
            )
    
    def get_regeneration_history(self, entity_id=None, regeneration_type=None, limit=None):
        """
        Get regeneration history, optionally filtered by entity and type.
        
        Args:
            entity_id (str, optional): Filter by entity ID
            regeneration_type (str, optional): Filter by regeneration type
            limit (int, optional): Limit number of results
            
        Returns:
            list: Filtered regeneration history
        """
        filtered_history = self.regeneration_history
        
        # Filter by entity ID if provided
        if entity_id:
            filtered_history = [
                event for event in filtered_history
                if event.get("details", {}).get("entity_id") == entity_id
            ]
            
        # Filter by regeneration type if provided
        if regeneration_type:
            filtered_history = [
                event for event in filtered_history
                if event.get("regeneration_type") == regeneration_type
            ]
            
        # Apply limit if provided
        if limit and limit > 0:
            filtered_history = filtered_history[-limit:]
            
        return filtered_history
    
    def update_config(self, new_config, auth_context=None):
        """
        Update the regeneration protocol configuration.
        
        Args:
            new_config (dict): New configuration to apply
            auth_context (dict, optional): Authorization context
            
        Returns:
            dict: Updated configuration
        """
        # Create a merged config for validation
        merged_config = self.config.copy()
        merged_config.update(new_config)
        
        # Validate merged configuration
        if not self._validate_config_structure(merged_config):
            raise ValueError("Invalid configuration structure")
        
        # Log the change
        logger.info(
            "Configuration update by %s",
            auth_context.get("user_id", "unknown") if auth_context else "system"
        )
        
        # Apply the update
        self.config.update(new_config)
        
        return self.config
    
    def verify_contract_integrity(self):
        """
        Verify the integrity of the contract tethering.
        
        Returns:
            bool: True if contract integrity is verified, False otherwise
        """
        return self._pre_loop_tether_check()
