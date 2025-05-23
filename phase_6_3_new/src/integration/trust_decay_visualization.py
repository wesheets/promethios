#!/usr/bin/env python3
"""
Trust Surface Dashboard Integration for Promethios Phase 5.9

This module implements the integration between the Trust Decay Engine and
the Trust Surface Dashboard, providing visualization data transformations
and UI component extensions.

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

class TrustDecayVisualization:
    """
    Implements visualization integration for the Trust Decay Engine.
    
    This component is responsible for transforming trust decay data into
    visualization-friendly formats and extending the Trust Surface Dashboard
    with decay-specific visualizations.
    
    Codex Contract: v2025.05.21
    Phase ID: 5.9
    """
    
    def __init__(self, decay_engine, regeneration_protocol, metrics_calculator, monitoring_service, config=None):
        """
        Initialize the Trust Decay Visualization with required components.
        
        Args:
            decay_engine (TrustDecayEngine): Instance of TrustDecayEngine
            regeneration_protocol (TrustRegenerationProtocol): Instance of TrustRegenerationProtocol
            metrics_calculator (TrustMetricsCalculator): Instance of TrustMetricsCalculator
            monitoring_service (TrustMonitoringService): Instance of TrustMonitoringService
            config (dict, optional): Configuration dictionary for visualization parameters
        """
        # Codex contract tethering
        self.contract_version = "v2025.05.21"
        self.phase_id = "5.9"
        self.codex_clauses = ["5.9", "11.3", "11.7"]
        
        # Store component instances
        self.decay_engine = decay_engine
        self.regeneration_protocol = regeneration_protocol
        self.metrics_calculator = metrics_calculator
        self.monitoring_service = monitoring_service
        
        # Initialize configuration
        self.config = config or self._load_default_config()
        
        # Perform pre-loop tether check
        if not self._pre_loop_tether_check():
            raise ValueError("Pre-loop tether check failed for TrustDecayVisualization")
        
        logger.info("TrustDecayVisualization initialized with contract version %s", self.contract_version)
    
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
            
        # Verify required components
        if not self.decay_engine or not self.regeneration_protocol or not self.metrics_calculator or not self.monitoring_service:
            logger.error("Missing required components")
            return False
            
        return True
    
    def _load_default_config(self):
        """
        Load default configuration for the Trust Decay Visualization.
        
        Returns:
            dict: Default configuration dictionary.
        """
        return {
            "visualization": {
                "color_scheme": {
                    "high_trust": "#4CAF50",  # Green
                    "medium_trust": "#FFC107",  # Amber
                    "low_trust": "#FF5722",  # Deep Orange
                    "critical": "#F44336"  # Red
                },
                "thresholds": {
                    "high_trust": 0.7,
                    "medium_trust": 0.4,
                    "low_trust": 0.2
                },
                "history_points": 30,
                "trend_smoothing": True
            }
        }
    
    def get_entity_trust_data(self, entity_id):
        """
        Get comprehensive trust data for an entity, formatted for visualization.
        
        Args:
            entity_id (str): ID of the entity
            
        Returns:
            dict: Trust data for visualization, or None if entity not found
        """
        # Get entity metrics
        metrics = self.metrics_calculator.get_entity_metrics(entity_id)
        if not metrics:
            logger.warning("Visualization data requested for unknown entity: %s", entity_id)
            return None
            
        # Get aggregate history
        aggregate_history = self.metrics_calculator.get_aggregate_history(
            entity_id, 
            self.config["visualization"]["history_points"]
        ) or []
        
        # Get dimension histories
        dimension_histories = {}
        for dimension in metrics["dimensions"].keys():
            dimension_history = self.metrics_calculator.get_dimension_history(
                entity_id, 
                dimension, 
                self.config["visualization"]["history_points"]
            ) or []
            dimension_histories[dimension] = dimension_history
        
        # Get active alerts
        active_alerts = self.monitoring_service.get_alerts(entity_id, resolved=False)
        
        # Get recent decay events
        decay_history = self.decay_engine.get_decay_history(entity_id, limit=10)
        
        # Get recent regeneration events
        regeneration_history = self.regeneration_protocol.get_regeneration_history(entity_id, limit=10)
        
        # Calculate trust level category
        trust_level = metrics["current_aggregate"] or 0.0
        trust_category = self._get_trust_category(trust_level)
        
        # Calculate trend
        trend = self._calculate_trend(aggregate_history)
        
        # Format data for visualization
        visualization_data = {
            "entity_id": entity_id,
            "trust_level": trust_level,
            "trust_category": trust_category,
            "color": self.config["visualization"]["color_scheme"][trust_category],
            "dimensions": metrics["dimensions"],
            "trend": trend,
            "first_seen": metrics["first_seen"],
            "aggregate_history": self._format_history_for_visualization(aggregate_history),
            "dimension_histories": {
                dimension: self._format_history_for_visualization(history)
                for dimension, history in dimension_histories.items()
            },
            "active_alerts": self._format_alerts_for_visualization(active_alerts),
            "recent_events": self._format_events_for_visualization(decay_history, regeneration_history)
        }
        
        return visualization_data
    
    def get_trust_surface_overlay(self, entity_ids=None):
        """
        Get trust data for overlaying on the trust surface visualization.
        
        Args:
            entity_ids (list, optional): List of entity IDs to include, or None for all
            
        Returns:
            dict: Trust surface overlay data
        """
        # If no entity IDs provided, use all entities with metrics
        if entity_ids is None:
            entity_ids = list(self.metrics_calculator.entity_metrics.keys())
        
        # Get trust data for each entity
        entity_data = {}
        for entity_id in entity_ids:
            metrics = self.metrics_calculator.get_entity_metrics(entity_id)
            if metrics:
                trust_level = metrics["current_aggregate"] or 0.0
                trust_category = self._get_trust_category(trust_level)
                
                entity_data[entity_id] = {
                    "trust_level": trust_level,
                    "trust_category": trust_category,
                    "color": self.config["visualization"]["color_scheme"][trust_category],
                    "has_alerts": any(
                        alert["entity_id"] == entity_id and not alert["resolved"]
                        for alert in self.monitoring_service.get_alerts()
                    )
                }
        
        # Get global statistics
        stats = self._calculate_global_statistics(entity_data)
        
        # Format data for visualization
        overlay_data = {
            "entities": entity_data,
            "statistics": stats,
            "thresholds": self.config["visualization"]["thresholds"],
            "color_scheme": self.config["visualization"]["color_scheme"]
        }
        
        return overlay_data
    
    def get_trust_decay_dashboard_data(self):
        """
        Get comprehensive data for the trust decay dashboard.
        
        Returns:
            dict: Dashboard data
        """
        # Get all entities with metrics
        entity_ids = list(self.metrics_calculator.entity_metrics.keys())
        
        # Get active alerts
        active_alerts = self.monitoring_service.get_alerts(resolved=False)
        
        # Get recent decay and regeneration events
        all_decay_history = self.decay_engine.get_decay_history(limit=20)
        all_regeneration_history = self.regeneration_protocol.get_regeneration_history(limit=20)
        
        # Calculate entity statistics
        entity_stats = self._calculate_entity_statistics(entity_ids)
        
        # Format data for dashboard
        dashboard_data = {
            "entity_count": len(entity_ids),
            "alert_count": len(active_alerts),
            "critical_entities": entity_stats["critical_count"],
            "low_trust_entities": entity_stats["low_trust_count"],
            "medium_trust_entities": entity_stats["medium_trust_count"],
            "high_trust_entities": entity_stats["high_trust_count"],
            "trust_distribution": entity_stats["distribution"],
            "recent_alerts": self._format_alerts_for_visualization(active_alerts[:10]),
            "recent_events": self._format_events_for_visualization(
                all_decay_history, 
                all_regeneration_history
            )
        }
        
        return dashboard_data
    
    def _get_trust_category(self, trust_level):
        """
        Get trust category based on trust level.
        
        Args:
            trust_level (float): Trust level (0.0-1.0)
            
        Returns:
            str: Trust category (high_trust, medium_trust, low_trust, critical)
        """
        thresholds = self.config["visualization"]["thresholds"]
        
        if trust_level >= thresholds["high_trust"]:
            return "high_trust"
        elif trust_level >= thresholds["medium_trust"]:
            return "medium_trust"
        elif trust_level >= thresholds["low_trust"]:
            return "low_trust"
        else:
            return "critical"
    
    def _calculate_trend(self, history):
        """
        Calculate trend from history data.
        
        Args:
            history (list): History data
            
        Returns:
            dict: Trend information
        """
        if not history or len(history) < 2:
            return {"direction": "stable", "percentage": 0.0}
        
        # Get first and last values
        first_value = history[0]["value"]
        last_value = history[-1]["value"]
        
        # Calculate change
        change = last_value - first_value
        percentage = (change / max(first_value, 0.01)) * 100
        
        # Determine direction
        if abs(percentage) < 1.0:
            direction = "stable"
        elif percentage > 0:
            direction = "improving"
        else:
            direction = "declining"
        
        return {
            "direction": direction,
            "percentage": abs(percentage)
        }
    
    def _format_history_for_visualization(self, history):
        """
        Format history data for visualization.
        
        Args:
            history (list): History data
            
        Returns:
            dict: Formatted history data
        """
        timestamps = []
        values = []
        
        for entry in history:
            timestamps.append(entry["timestamp"])
            values.append(entry["value"])
        
        # Apply smoothing if configured
        if self.config["visualization"]["trend_smoothing"] and len(values) > 3:
            smoothed_values = self._apply_smoothing(values)
        else:
            smoothed_values = values
        
        return {
            "timestamps": timestamps,
            "values": values,
            "smoothed_values": smoothed_values
        }
    
    def _apply_smoothing(self, values):
        """
        Apply simple moving average smoothing to values.
        
        Args:
            values (list): Values to smooth
            
        Returns:
            list: Smoothed values
        """
        window_size = 3
        smoothed = []
        
        for i in range(len(values)):
            if i < window_size - 1:
                # Not enough previous values, use original
                smoothed.append(values[i])
            else:
                # Calculate moving average
                window = values[i-(window_size-1):i+1]
                smoothed.append(sum(window) / window_size)
        
        return smoothed
    
    def _format_alerts_for_visualization(self, alerts):
        """
        Format alerts for visualization.
        
        Args:
            alerts (list): Alerts to format
            
        Returns:
            list: Formatted alerts
        """
        formatted_alerts = []
        
        for alert in alerts:
            formatted_alert = {
                "alert_id": alert["alert_id"],
                "entity_id": alert["entity_id"],
                "level": alert["level"],
                "message": alert["message"],
                "timestamp": alert["timestamp"],
                "color": self._get_alert_color(alert["level"])
            }
            formatted_alerts.append(formatted_alert)
        
        return formatted_alerts
    
    def _get_alert_color(self, level):
        """
        Get color for alert level.
        
        Args:
            level (str): Alert level
            
        Returns:
            str: Color code
        """
        if level == "critical":
            return self.config["visualization"]["color_scheme"]["critical"]
        elif level == "warning":
            return self.config["visualization"]["color_scheme"]["low_trust"]
        else:
            return self.config["visualization"]["color_scheme"]["medium_trust"]
    
    def _format_events_for_visualization(self, decay_events, regeneration_events):
        """
        Format decay and regeneration events for visualization.
        
        Args:
            decay_events (list): Decay events
            regeneration_events (list): Regeneration events
            
        Returns:
            list: Formatted events
        """
        formatted_events = []
        
        # Format decay events
        for event in decay_events:
            formatted_event = {
                "event_type": "decay",
                "decay_type": event["decay_type"],
                "entity_id": event["details"].get("entity_id", "unknown"),
                "old_trust": event["old_trust"],
                "new_trust": event["new_trust"],
                "change": event["old_trust"] - event["new_trust"],
                "timestamp": event["timestamp"],
                "details": event["details"],
                "color": self.config["visualization"]["color_scheme"]["low_trust"]
            }
            formatted_events.append(formatted_event)
        
        # Format regeneration events
        for event in regeneration_events:
            formatted_event = {
                "event_type": "regeneration",
                "regeneration_type": event["regeneration_type"],
                "entity_id": event["details"].get("entity_id", "unknown"),
                "old_trust": event["old_trust"],
                "new_trust": event["new_trust"],
                "change": event["new_trust"] - event["old_trust"],
                "timestamp": event["timestamp"],
                "details": event["details"],
                "color": self.config["visualization"]["color_scheme"]["high_trust"]
            }
            formatted_events.append(formatted_event)
        
        # Sort by timestamp (newest first)
        formatted_events.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return formatted_events
    
    def _calculate_entity_statistics(self, entity_ids):
        """
        Calculate statistics for entities.
        
        Args:
            entity_ids (list): List of entity IDs
            
        Returns:
            dict: Entity statistics
        """
        stats = {
            "critical_count": 0,
            "low_trust_count": 0,
            "medium_trust_count": 0,
            "high_trust_count": 0,
            "distribution": {
                "labels": ["Critical", "Low Trust", "Medium Trust", "High Trust"],
                "values": [0, 0, 0, 0],
                "colors": [
                    self.config["visualization"]["color_scheme"]["critical"],
                    self.config["visualization"]["color_scheme"]["low_trust"],
                    self.config["visualization"]["color_scheme"]["medium_trust"],
                    self.config["visualization"]["color_scheme"]["high_trust"]
                ]
            }
        }
        
        for entity_id in entity_ids:
            metrics = self.metrics_calculator.get_entity_metrics(entity_id)
            if metrics and metrics["current_aggregate"] is not None:
                trust_category = self._get_trust_category(metrics["current_aggregate"])
                
                if trust_category == "critical":
                    stats["critical_count"] += 1
                    stats["distribution"]["values"][0] += 1
                elif trust_category == "low_trust":
                    stats["low_trust_count"] += 1
                    stats["distribution"]["values"][1] += 1
                elif trust_category == "medium_trust":
                    stats["medium_trust_count"] += 1
                    stats["distribution"]["values"][2] += 1
                elif trust_category == "high_trust":
                    stats["high_trust_count"] += 1
                    stats["distribution"]["values"][3] += 1
        
        return stats
    
    def _calculate_global_statistics(self, entity_data):
        """
        Calculate global statistics from entity data.
        
        Args:
            entity_data (dict): Entity data
            
        Returns:
            dict: Global statistics
        """
        stats = {
            "entity_count": len(entity_data),
            "average_trust": 0.0,
            "critical_percentage": 0.0,
            "alert_count": 0
        }
        
        if not entity_data:
            return stats
        
        # Calculate average trust and counts
        total_trust = 0.0
        critical_count = 0
        alert_count = 0
        
        for entity_info in entity_data.values():
            total_trust += entity_info["trust_level"]
            if entity_info["trust_category"] == "critical":
                critical_count += 1
            if entity_info.get("has_alerts", False):
                alert_count += 1
        
        stats["average_trust"] = total_trust / len(entity_data)
        stats["critical_percentage"] = (critical_count / len(entity_data)) * 100
        stats["alert_count"] = alert_count
        
        return stats
    
    def verify_contract_integrity(self):
        """
        Verify the integrity of the contract tethering.
        
        Returns:
            bool: True if contract integrity is verified, False otherwise
        """
        return self._pre_loop_tether_check()
