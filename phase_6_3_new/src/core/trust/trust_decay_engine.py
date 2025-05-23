#!/usr/bin/env python3
"""
Trust Decay Engine for Promethios Phase 5.9

This module implements the core trust decay mechanisms for the Promethios system,
including time-based decay, event-based decay, and context-based decay.

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

class TrustDecayEngine:
    """
    Implements trust decay mechanisms for the Promethios system.
    
    This component is responsible for calculating and applying trust decay
    based on time elapsed, events, and context changes. It maintains decay
    history and provides configuration options for customizing decay behavior.
    
    Codex Contract: v2025.05.21
    Phase ID: 5.9
    """
    
    def __init__(self, config=None, contract_sealer=None):
        """
        Initialize the Trust Decay Engine with optional configuration.
        
        Args:
            config (dict, optional): Configuration dictionary for decay parameters.
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
        
        # Initialize decay history
        self.decay_history = []
        
        # Perform pre-loop tether check
        if not self._pre_loop_tether_check():
            raise ValueError("Pre-loop tether check failed for TrustDecayEngine")
        
        logger.info("TrustDecayEngine initialized with contract version %s", self.contract_version)
    
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
            required_sections = ["time_decay", "event_decay", "context_decay"]
            for section in required_sections:
                if section not in config:
                    logger.error("Missing required configuration section: %s", section)
                    return False
                    
            # Validate time decay configuration
            time_decay = config.get("time_decay", {})
            if not isinstance(time_decay, dict):
                logger.error("Invalid time decay configuration: not a dictionary")
                return False
                
            if not isinstance(time_decay.get("enabled"), bool) or not isinstance(time_decay.get("half_life_days"), (int, float)):
                logger.error("Invalid time decay configuration: missing or invalid parameters")
                return False
                
            # Validate event decay configuration
            event_decay = config.get("event_decay", {})
            if not isinstance(event_decay, dict):
                logger.error("Invalid event decay configuration: not a dictionary")
                return False
                
            if not isinstance(event_decay.get("enabled"), bool) or not isinstance(event_decay.get("factors"), dict):
                logger.error("Invalid event decay configuration: missing or invalid parameters")
                return False
                
            # Validate context decay configuration
            context_decay = config.get("context_decay", {})
            if not isinstance(context_decay, dict):
                logger.error("Invalid context decay configuration: not a dictionary")
                return False
                
            if not isinstance(context_decay.get("enabled"), bool) or not isinstance(context_decay.get("boundary_factors"), dict):
                logger.error("Invalid context decay configuration: missing or invalid parameters")
                return False
                
            return True
        except Exception as e:
            logger.error("Error validating configuration structure: %s", str(e))
            return False
    
    def _load_default_config(self):
        """
        Load default configuration for the Trust Decay Engine.
        
        Returns:
            dict: Default configuration dictionary.
        """
        return {
            "time_decay": {
                "enabled": True,
                "half_life_days": 30,
                "minimum_trust": 0.1
            },
            "event_decay": {
                "enabled": True,
                "factors": {
                    "verification_failure": 0.2,
                    "attestation_failure": 0.3,
                    "boundary_violation": 0.4,
                    "mutation_detected": 0.5,
                    "seal_verification_failure": 0.6
                }
            },
            "context_decay": {
                "enabled": True,
                "boundary_factors": {
                    "high_trust:medium_trust": 0.1,
                    "medium_trust:low_trust": 0.2,
                    "low_trust:untrusted": 0.5
                }
            },
            "max_history_size": 1000
        }
    
    def calculate_time_decay(self, trust_level, last_update, current_time=None):
        """
        Calculate time-based decay for a trust level.
        
        Args:
            trust_level (float): Current trust level (0.0-1.0)
            last_update (datetime): Time of last trust update
            current_time (datetime, optional): Current time, defaults to now
            
        Returns:
            float: New trust level after decay
        """
        if not self.config["time_decay"]["enabled"]:
            return trust_level
            
        current_time = current_time or datetime.now()
        
        # Calculate days elapsed
        days_elapsed = (current_time - last_update).total_seconds() / (24 * 3600)
        
        # If no time has passed, no decay
        if days_elapsed <= 0:
            return trust_level
            
        # Calculate decay factor using half-life formula
        half_life = self.config["time_decay"]["half_life_days"]
        decay_factor = math.pow(0.5, days_elapsed / half_life)
        
        # Apply decay
        new_trust = trust_level * decay_factor
        
        # Enforce minimum trust level
        minimum_trust = self.config["time_decay"]["minimum_trust"]
        new_trust = max(new_trust, minimum_trust)
        
        # Record decay event
        self._record_decay_event(
            "time",
            trust_level,
            new_trust,
            {
                "days_elapsed": days_elapsed,
                "half_life": half_life
            }
        )
        
        return new_trust
    
    def apply_event_decay(self, trust_level, event_type, entity_id=None):
        """
        Apply event-based decay to a trust level.
        
        Args:
            trust_level (float): Current trust level (0.0-1.0)
            event_type (str): Type of event triggering decay
            entity_id (str, optional): ID of the entity experiencing decay
            
        Returns:
            float: New trust level after decay
        """
        if not self.config["event_decay"]["enabled"]:
            return trust_level
            
        # Get decay factor for event type
        decay_factor = self.config["event_decay"]["factors"].get(event_type, 0.0)
        
        # Apply decay
        new_trust = trust_level * (1.0 - decay_factor)
        
        # Record decay event
        self._record_decay_event(
            "event",
            trust_level,
            new_trust,
            {
                "event_type": event_type,
                "entity_id": entity_id
            }
        )
        
        return new_trust
    
    def apply_context_decay(self, trust_level, source_context, target_context, entity_id=None):
        """
        Apply context-based decay to a trust level.
        
        Args:
            trust_level (float): Current trust level (0.0-1.0)
            source_context (str): Source trust context
            target_context (str): Target trust context
            entity_id (str, optional): ID of the entity experiencing decay
            
        Returns:
            float: New trust level after decay
        """
        if not self.config["context_decay"]["enabled"]:
            return trust_level
            
        # Get decay factor for context transition
        context_key = f"{source_context}:{target_context}"
        decay_factor = self.config["context_decay"]["boundary_factors"].get(context_key, 0.0)
        
        # Apply decay
        new_trust = trust_level * (1.0 - decay_factor)
        
        # Record decay event
        self._record_decay_event(
            "context",
            trust_level,
            new_trust,
            {
                "source_context": source_context,
                "target_context": target_context,
                "entity_id": entity_id
            }
        )
        
        return new_trust
    
    def _record_decay_event(self, decay_type, old_trust, new_trust, details):
        """
        Record a decay event in the history and log.
        
        Args:
            decay_type (str): Type of decay (time, event, context)
            old_trust (float): Trust level before decay
            new_trust (float): Trust level after decay
            details (dict): Additional details about the decay event
        """
        # Create event record
        event = {
            "timestamp": datetime.now().isoformat(),
            "decay_type": decay_type,
            "old_trust": old_trust,
            "new_trust": new_trust,
            "details": details
        }
        
        # Add to history
        self.decay_history.append(event)
        
        # Limit history size
        if len(self.decay_history) > self.config.get("max_history_size", 1000):
            self.decay_history = self.decay_history[-self.config.get("max_history_size", 1000):]
        
        # Log the event
        entity_id = details.get("entity_id", "unknown")
        logger.info(
            "Trust decay: %s, entity: %s, old: %.4f, new: %.4f",
            decay_type, entity_id, old_trust, new_trust
        )
        
        # If significant decay, log at warning level
        if (old_trust - new_trust) > 0.3:
            logger.warning(
                "Significant trust decay: %s, entity: %s, old: %.4f, new: %.4f, decay amount: %.4f",
                decay_type, entity_id, old_trust, new_trust, old_trust - new_trust
            )
    
    def get_decay_history(self, entity_id=None, decay_type=None, limit=None):
        """
        Get decay history, optionally filtered by entity and type.
        
        Args:
            entity_id (str, optional): Filter by entity ID
            decay_type (str, optional): Filter by decay type
            limit (int, optional): Limit number of results
            
        Returns:
            list: Filtered decay history
        """
        filtered_history = self.decay_history
        
        # Filter by entity ID if provided
        if entity_id:
            filtered_history = [
                event for event in filtered_history
                if event.get("details", {}).get("entity_id") == entity_id
            ]
            
        # Filter by decay type if provided
        if decay_type:
            filtered_history = [
                event for event in filtered_history
                if event.get("decay_type") == decay_type
            ]
            
        # Apply limit if provided
        if limit and limit > 0:
            filtered_history = filtered_history[-limit:]
            
        return filtered_history
    
    def update_config(self, new_config, auth_context=None):
        """
        Update the decay engine configuration.
        
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
