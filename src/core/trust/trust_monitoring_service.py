#!/usr/bin/env python3
"""
Trust Monitoring Service for Promethios Phase 5.9

This module implements the trust monitoring service for the Promethios system,
including threshold checking, alert generation, and alert management.

Codex Contract: v2025.05.21
Phase ID: 5.9
"""

import json
import os
import re
import logging
from datetime import datetime, timedelta
import uuid
import copy

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrustMonitoringService:
    """
    Implements trust monitoring service for the Promethios system.
    
    This component is responsible for monitoring trust levels, checking thresholds,
    generating alerts, and managing alert lifecycle.
    
    Codex Contract: v2025.05.21
    Phase ID: 5.9
    """
    
    def __init__(self, metrics_calculator, config=None, contract_sealer=None):
        """
        Initialize the Trust Monitoring Service with metrics calculator and optional configuration.
        
        Args:
            metrics_calculator (TrustMetricsCalculator): Instance of TrustMetricsCalculator
            config (dict, optional): Configuration dictionary for monitoring parameters
            contract_sealer (ContractSealer, optional): Instance of ContractSealer for sealing operations
        """
        # Codex contract tethering
        self.contract_version = "v2025.05.21"
        self.phase_id = "5.9"
        self.codex_clauses = ["5.9", "11.3", "11.7"]
        
        # Store metrics calculator
        self.metrics_calculator = metrics_calculator
        
        # Initialize configuration
        self.config = config or self._load_default_config()
        
        # Initialize contract sealer
        self.contract_sealer = contract_sealer
        
        # Initialize alerts storage
        self.alerts = {}
        self.alert_history = []
        
        # Initialize alert deduplication cache
        self.alert_deduplication = {}
        
        # Perform pre-loop tether check
        if not self._pre_loop_tether_check():
            raise ValueError("Pre-loop tether check failed for TrustMonitoringService")
        
        logger.info("TrustMonitoringService initialized with contract version %s", self.contract_version)
    
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
            
        # Verify metrics calculator
        if not self.metrics_calculator:
            logger.error("Missing metrics calculator")
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
        required_sections = ["thresholds", "monitoring", "alerts"]
        for section in required_sections:
            if section not in config:
                logger.error("Missing required configuration section: %s", section)
                return False
                
        # Validate thresholds configuration
        thresholds = config.get("thresholds", {})
        required_thresholds = ["critical", "warning", "notice"]
        for threshold in required_thresholds:
            if threshold not in thresholds:
                logger.error("Missing required threshold: %s", threshold)
                return False
                
        # Validate monitoring configuration
        monitoring = config.get("monitoring", {})
        if not isinstance(monitoring.get("check_interval_seconds"), int):
            logger.error("Invalid monitoring configuration")
            return False
            
        # Validate alerts configuration
        alerts = config.get("alerts", {})
        if not isinstance(alerts.get("deduplication_seconds"), int):
            logger.error("Invalid alerts configuration")
            return False
            
        return True
    
    def _load_default_config(self):
        """
        Load default configuration for the Trust Monitoring Service.
        
        Returns:
            dict: Default configuration dictionary.
        """
        return {
            "thresholds": {
                "critical": 0.2,
                "warning": 0.4,
                "notice": 0.6
            },
            "monitoring": {
                "check_interval_seconds": 300,
                "dimension_monitoring": True,
                "aggregate_monitoring": True
            },
            "alerts": {
                "deduplication_seconds": 3600,
                "max_history_size": 1000,
                "auto_resolve_improved": True
            }
        }
    
    def check_entity_thresholds(self, entity_id):
        """
        Check thresholds for an entity and generate alerts if needed.
        
        Args:
            entity_id (str): ID of the entity to check
            
        Returns:
            list: List of generated alerts, if any
        """
        # Get entity metrics
        metrics = self.metrics_calculator.get_entity_metrics(entity_id)
        if not metrics:
            logger.warning("Cannot check thresholds for unknown entity: %s", entity_id)
            return []
        
        generated_alerts = []
        
        # Check aggregate threshold if enabled
        if self.config["monitoring"]["aggregate_monitoring"] and metrics["current_aggregate"] is not None:
            aggregate_alerts = self._check_aggregate_threshold(entity_id, metrics["current_aggregate"])
            generated_alerts.extend(aggregate_alerts)
        
        # Check dimension thresholds if enabled
        if self.config["monitoring"]["dimension_monitoring"]:
            for dimension, value in metrics["dimensions"].items():
                dimension_alerts = self._check_dimension_threshold(entity_id, dimension, value)
                generated_alerts.extend(dimension_alerts)
        
        return generated_alerts
    
    def _check_aggregate_threshold(self, entity_id, aggregate_value):
        """
        Check aggregate threshold and generate alert if needed.
        
        Args:
            entity_id (str): ID of the entity
            aggregate_value (float): Aggregate trust value
            
        Returns:
            list: List of generated alerts, if any
        """
        thresholds = self.config["thresholds"]
        generated_alerts = []
        
        # Check each threshold level
        for level, threshold in sorted(thresholds.items(), key=lambda x: x[1]):
            if aggregate_value < threshold:
                # Check if we should generate an alert
                if self._should_generate_alert(entity_id, "aggregate", level):
                    alert = self._generate_alert(entity_id, "aggregate", level, aggregate_value, threshold)
                    generated_alerts.append(alert)
                break
        
        return generated_alerts
    
    def _check_dimension_threshold(self, entity_id, dimension, dimension_value):
        """
        Check dimension threshold and generate alert if needed.
        
        Args:
            entity_id (str): ID of the entity
            dimension (str): Dimension name
            dimension_value (float): Dimension trust value
            
        Returns:
            list: List of generated alerts, if any
        """
        thresholds = self.config["thresholds"]
        generated_alerts = []
        
        # Check each threshold level
        for level, threshold in sorted(thresholds.items(), key=lambda x: x[1]):
            if dimension_value < threshold:
                # Check if we should generate an alert
                if self._should_generate_alert(entity_id, dimension, level):
                    alert = self._generate_alert(entity_id, dimension, level, dimension_value, threshold)
                    generated_alerts.append(alert)
                break
        
        return generated_alerts
    
    def _should_generate_alert(self, entity_id, metric_type, level):
        """
        Determine if an alert should be generated based on deduplication rules.
        
        Args:
            entity_id (str): ID of the entity
            metric_type (str): Type of metric (aggregate or dimension name)
            level (str): Alert level (critical, warning, notice)
            
        Returns:
            bool: True if alert should be generated, False otherwise
        """
        # Create deduplication key
        dedup_key = f"{entity_id}:{metric_type}:{level}"
        
        # Check if we have a recent alert for this key
        now = datetime.now()
        if dedup_key in self.alert_deduplication:
            last_alert_time = self.alert_deduplication[dedup_key]
            dedup_seconds = self.config["alerts"]["deduplication_seconds"]
            
            if (now - last_alert_time).total_seconds() < dedup_seconds:
                logger.debug("Suppressing duplicate alert: %s", dedup_key)
                return False
        
        # Update deduplication cache
        self.alert_deduplication[dedup_key] = now
        
        return True
    
    def _generate_alert(self, entity_id, metric_type, level, value, threshold):
        """
        Generate a new alert.
        
        Args:
            entity_id (str): ID of the entity
            metric_type (str): Type of metric (aggregate or dimension name)
            level (str): Alert level (critical, warning, notice)
            value (float): Current metric value
            threshold (float): Threshold that was crossed
            
        Returns:
            dict: Generated alert
        """
        # Create alert ID
        alert_id = str(uuid.uuid4())
        
        # Create alert message
        if metric_type == "aggregate":
            message = f"Entity {entity_id} aggregate trust level ({value:.2f}) is below {level} threshold ({threshold:.2f})"
        else:
            message = f"Entity {entity_id} {metric_type} trust level ({value:.2f}) is below {level} threshold ({threshold:.2f})"
        
        # Create alert
        alert = {
            "alert_id": alert_id,
            "timestamp": datetime.now().isoformat(),
            "entity_id": entity_id,
            "level": level,
            "metric_type": metric_type,
            "value": value,
            "threshold": threshold,
            "message": message,
            "resolved": False
        }
        
        # Store alert
        self.alerts[alert_id] = alert
        
        # Add to history
        self.alert_history.append(copy.deepcopy(alert))
        
        # Prune history if needed
        if len(self.alert_history) > self.config["alerts"]["max_history_size"]:
            self.alert_history = self.alert_history[-self.config["alerts"]["max_history_size"]:]
        
        # Log the alert
        log_level = logging.CRITICAL if level == "critical" else (
            logging.WARNING if level == "warning" else logging.INFO
        )
        logger.log(log_level, "Trust alert: %s", message)
        
        return alert
    
    def resolve_alert(self, alert_id, resolution_message=None):
        """
        Resolve an alert.
        
        Args:
            alert_id (str): ID of the alert to resolve
            resolution_message (str, optional): Message explaining the resolution
            
        Returns:
            dict: Resolved alert, or None if alert not found
        """
        if alert_id not in self.alerts:
            logger.warning("Cannot resolve unknown alert: %s", alert_id)
            return None
        
        # Get the alert
        alert = self.alerts[alert_id]
        
        # Skip if already resolved
        if alert["resolved"]:
            return alert
        
        # Resolve the alert
        alert["resolved"] = True
        alert["resolved_at"] = datetime.now().isoformat()
        if resolution_message:
            alert["resolution_message"] = resolution_message
        
        # Update history
        for i, history_alert in enumerate(self.alert_history):
            if history_alert["alert_id"] == alert_id:
                self.alert_history[i] = copy.deepcopy(alert)
                break
        
        # Log the resolution
        logger.info("Alert resolved: %s - %s", alert_id, resolution_message or "No message provided")
        
        return alert
    
    def check_for_auto_resolution(self, entity_id):
        """
        Check if any alerts for an entity can be auto-resolved due to improved metrics.
        
        Args:
            entity_id (str): ID of the entity to check
            
        Returns:
            list: List of resolved alerts, if any
        """
        if not self.config["alerts"]["auto_resolve_improved"]:
            return []
        
        # Get entity metrics
        metrics = self.metrics_calculator.get_entity_metrics(entity_id)
        if not metrics:
            return []
        
        resolved_alerts = []
        
        # Get all unresolved alerts for this entity
        entity_alerts = [
            alert for alert in self.alerts.values()
            if alert["entity_id"] == entity_id and not alert["resolved"]
        ]
        
        for alert in entity_alerts:
            metric_type = alert["metric_type"]
            threshold = alert["threshold"]
            
            # Check if metric is now above threshold
            current_value = None
            if metric_type == "aggregate":
                current_value = metrics["current_aggregate"]
            else:
                current_value = metrics["dimensions"].get(metric_type)
            
            if current_value is not None and current_value >= threshold:
                # Resolve the alert
                resolution_message = f"Auto-resolved: {metric_type} trust level improved to {current_value:.2f} (threshold: {threshold:.2f})"
                resolved_alert = self.resolve_alert(alert["alert_id"], resolution_message)
                resolved_alerts.append(resolved_alert)
        
        return resolved_alerts
    
    def get_alerts(self, entity_id=None, level=None, resolved=None, limit=None):
        """
        Get alerts, optionally filtered by entity, level, and resolution status.
        
        Args:
            entity_id (str, optional): Filter by entity ID
            level (str, optional): Filter by alert level
            resolved (bool, optional): Filter by resolution status
            limit (int, optional): Limit number of results
            
        Returns:
            list: Filtered alerts
        """
        filtered_alerts = list(self.alerts.values())
        
        # Filter by entity ID if provided
        if entity_id:
            filtered_alerts = [
                alert for alert in filtered_alerts
                if alert["entity_id"] == entity_id
            ]
            
        # Filter by level if provided
        if level:
            filtered_alerts = [
                alert for alert in filtered_alerts
                if alert["level"] == level
            ]
            
        # Filter by resolution status if provided
        if resolved is not None:
            filtered_alerts = [
                alert for alert in filtered_alerts
                if alert["resolved"] == resolved
            ]
            
        # Sort by timestamp (newest first)
        filtered_alerts.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Apply limit if provided
        if limit and limit > 0:
            filtered_alerts = filtered_alerts[:limit]
            
        return filtered_alerts
    
    def get_alert_history(self, entity_id=None, level=None, limit=None):
        """
        Get alert history, optionally filtered by entity and level.
        
        Args:
            entity_id (str, optional): Filter by entity ID
            level (str, optional): Filter by alert level
            limit (int, optional): Limit number of results
            
        Returns:
            list: Filtered alert history
        """
        filtered_history = self.alert_history
        
        # Filter by entity ID if provided
        if entity_id:
            filtered_history = [
                alert for alert in filtered_history
                if alert["entity_id"] == entity_id
            ]
            
        # Filter by level if provided
        if level:
            filtered_history = [
                alert for alert in filtered_history
                if alert["level"] == level
            ]
            
        # Sort by timestamp (newest first)
        filtered_history.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Apply limit if provided
        if limit and limit > 0:
            filtered_history = filtered_history[:limit]
            
        return filtered_history
    
    def update_config(self, new_config, auth_context=None):
        """
        Update the monitoring service configuration.
        
        Args:
            new_config (dict): New configuration to apply
            auth_context (dict, optional): Authorization context
            
        Returns:
            dict: Updated configuration
        """
        # Validate new configuration
        if not self._validate_config_structure(new_config):
            raise ValueError("Invalid configuration structure")
        
        # Log the change
        logger.info(
            "Configuration update by %s",
            auth_context.get("user_id", "unknown") if auth_context else "system"
        )
        
        # Apply the update
        old_config = self.config.copy()
        self.config.update(new_config)
        
        return self.config
    
    def verify_contract_integrity(self):
        """
        Verify the integrity of the contract tethering.
        
        Returns:
            bool: True if contract integrity is verified, False otherwise
        """
        return self._pre_loop_tether_check()
