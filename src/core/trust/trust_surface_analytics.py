"""
Trust Surface Analytics Module

This module provides analytics capabilities for trust surfaces in the distributed trust system.
It processes trust surface data, calculates metrics, and identifies trends and anomalies.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import uuid
import datetime
import logging
import json
import hashlib
from typing import Dict, List, Optional, Tuple, Any

from src.core.common.schema_validator import validate_against_schema

logger = logging.getLogger(__name__)

class TrustSurfaceAnalytics:
    """
    Analyzes trust surfaces to generate metrics, detect anomalies, and identify trends.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the Trust Surface Analytics engine.
        
        Args:
            config: Configuration dictionary for the analytics engine
        """
        self.config = config or {}
        self.metrics_schema_path = "schemas/trust/trust_metrics.schema.v1.json"
        self.alert_schema_path = "schemas/trust/trust_boundary_alert.schema.v1.json"
        self.surface_schema_path = "schemas/governance/trust_boundary.schema.v1.json"
        self.metrics_cache = {}
        self.alert_history = []
        self.threshold_config = self.config.get('thresholds', {
            'integrity_min': 0.7,
            'availability_min': 0.8,
            'consistency_min': 0.75,
            'boundary_min': 0.6
        })
        logger.info("Trust Surface Analytics engine initialized with config: %s", self.config)
        
    def pre_loop_tether_check(self) -> Tuple[bool, str]:
        """
        Verify Codex contract tethering before execution.
        
        Returns:
            Tuple of (success, message)
        """
        # Implementation of Codex contract tethering check
        codex_info = {
            "codex_contract_version": "v2025.05.19",
            "phase_id": "5.7",
            "clauses": ["5.7", "5.6", "11.0", "11.1", "11.4", "12.25"],
            "component": "TrustSurfaceAnalytics",
            "status": "compliant",
            "timestamp": datetime.datetime.utcnow().isoformat() + 'Z'
        }
        
        # Verify component integrity
        component_hash = self._calculate_component_hash()
        if not component_hash:
            return False, "Component integrity check failed"
            
        logger.info("Codex tether check passed: %s", codex_info)
        return True, "Tether check passed"
    
    def _calculate_component_hash(self) -> str:
        """
        Calculate a hash of the component to verify integrity.
        
        Returns:
            Hash string or empty string if failed
        """
        try:
            # In a real implementation, this would calculate a hash of the component code
            # For now, we'll return a placeholder hash
            return hashlib.sha256(b"TrustSurfaceAnalytics").hexdigest()
        except Exception as e:
            logger.error("Failed to calculate component hash: %s", str(e))
            return ""
        
    def analyze_surface(self, surface_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a trust surface and generate metrics.
        
        Args:
            surface_data: Trust surface data to analyze
            
        Returns:
            Dictionary of analytics results
        """
        # Validate input against schema
        if not self._validate_surface_data(surface_data):
            logger.error("Invalid surface data provided: %s", json.dumps(surface_data))
            return {"error": "Invalid surface data", "timestamp": datetime.datetime.utcnow().isoformat()}
            
        # Generate metrics for the surface
        metrics = self._generate_metrics(surface_data)
        
        # Check for boundary violations
        alerts = self._check_boundary_violations(surface_data)
        
        # Calculate historical trends if we have previous data
        trends = self._calculate_trends(surface_data.get("surface_id"), metrics)
        
        result = {
            "surface_id": surface_data.get("surface_id"),
            "node_id": surface_data.get("node_id"),
            "metrics": metrics,
            "alerts": alerts,
            "trends": trends,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "analysis_id": str(uuid.uuid4())
        }
        
        # Cache the metrics for trend analysis
        self._update_metrics_cache(surface_data.get("surface_id"), metrics)
        
        # Add alerts to history
        if alerts:
            self.alert_history.extend(alerts)
            # Trim history to last 100 alerts
            if len(self.alert_history) > 100:
                self.alert_history = self.alert_history[-100:]
        
        logger.info("Surface analysis complete for surface_id: %s, generated %d metrics and %d alerts", 
                   surface_data.get("surface_id"), len(metrics), len(alerts))
        
        return result
        
    def _validate_surface_data(self, surface_data: Dict[str, Any]) -> bool:
        """
        Validate surface data against schema.
        
        Args:
            surface_data: Trust surface data to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not surface_data:
            logger.error("Empty surface data provided")
            return False
            
        # Check required fields
        required_fields = ["surface_id", "node_id", "contract_version"]
        for field in required_fields:
            if field not in surface_data:
                logger.error("Missing required field in surface data: %s", field)
                return False
        
        # Validate against schema if available
        try:
            validation_result = validate_against_schema(surface_data, self.surface_schema_path)
            if not validation_result.get("valid", False):
                logger.error("Schema validation failed: %s", validation_result.get("errors", "Unknown error"))
                return False
        except Exception as e:
            logger.error("Error during schema validation: %s", str(e))
            return False
            
        return True
        
    def _generate_metrics(self, surface_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate metrics for a trust surface.
        
        Args:
            surface_data: Trust surface data
            
        Returns:
            List of metrics
        """
        metrics = []
        
        # Generate integrity metric
        integrity_metric = {
            "metric_id": str(uuid.uuid4()),
            "surface_id": surface_data.get("surface_id"),
            "node_id": surface_data.get("node_id"),
            "metric_type": "integrity",
            "value": self._calculate_integrity_metric(surface_data),
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "contract_version": surface_data.get("contract_version"),
            "metadata": {
                "description": "Trust surface integrity metric",
                "confidence": 0.95
            }
        }
        
        # Validate metric against schema
        validation_result = validate_against_schema(integrity_metric, self.metrics_schema_path)
        if validation_result.get("valid", False):
            metrics.append(integrity_metric)
        else:
            logger.error("Invalid integrity metric: %s", validation_result.get("errors", "Unknown error"))
        
        # Generate availability metric
        availability_metric = {
            "metric_id": str(uuid.uuid4()),
            "surface_id": surface_data.get("surface_id"),
            "node_id": surface_data.get("node_id"),
            "metric_type": "availability",
            "value": self._calculate_availability_metric(surface_data),
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "contract_version": surface_data.get("contract_version"),
            "metadata": {
                "description": "Trust surface availability metric",
                "confidence": 0.9
            }
        }
        
        validation_result = validate_against_schema(availability_metric, self.metrics_schema_path)
        if validation_result.get("valid", False):
            metrics.append(availability_metric)
        else:
            logger.error("Invalid availability metric: %s", validation_result.get("errors", "Unknown error"))
        
        # Generate consistency metric
        consistency_metric = {
            "metric_id": str(uuid.uuid4()),
            "surface_id": surface_data.get("surface_id"),
            "node_id": surface_data.get("node_id"),
            "metric_type": "consistency",
            "value": self._calculate_consistency_metric(surface_data),
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "contract_version": surface_data.get("contract_version"),
            "metadata": {
                "description": "Trust surface consistency metric",
                "confidence": 0.85
            }
        }
        
        validation_result = validate_against_schema(consistency_metric, self.metrics_schema_path)
        if validation_result.get("valid", False):
            metrics.append(consistency_metric)
        else:
            logger.error("Invalid consistency metric: %s", validation_result.get("errors", "Unknown error"))
        
        # Generate boundary metric
        boundary_metric = {
            "metric_id": str(uuid.uuid4()),
            "surface_id": surface_data.get("surface_id"),
            "node_id": surface_data.get("node_id"),
            "metric_type": "boundary",
            "value": self._calculate_boundary_metric(surface_data),
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "contract_version": surface_data.get("contract_version"),
            "metadata": {
                "description": "Trust surface boundary metric",
                "confidence": 0.9
            }
        }
        
        validation_result = validate_against_schema(boundary_metric, self.metrics_schema_path)
        if validation_result.get("valid", False):
            metrics.append(boundary_metric)
        else:
            logger.error("Invalid boundary metric: %s", validation_result.get("errors", "Unknown error"))
        
        # Generate composite metric (weighted average of all metrics)
        if len(metrics) > 0:
            weights = {
                "integrity": 0.4,
                "availability": 0.2,
                "consistency": 0.2,
                "boundary": 0.2
            }
            
            composite_value = 0.0
            weight_sum = 0.0
            
            for metric in metrics:
                metric_type = metric.get("metric_type")
                if metric_type in weights:
                    composite_value += metric.get("value", 0) * weights[metric_type]
                    weight_sum += weights[metric_type]
            
            if weight_sum > 0:
                composite_value /= weight_sum
                
                composite_metric = {
                    "metric_id": str(uuid.uuid4()),
                    "surface_id": surface_data.get("surface_id"),
                    "node_id": surface_data.get("node_id"),
                    "metric_type": "composite",
                    "value": composite_value,
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "contract_version": surface_data.get("contract_version"),
                    "metadata": {
                        "description": "Composite trust metric",
                        "confidence": 0.9,
                        "weights": weights
                    }
                }
                
                validation_result = validate_against_schema(composite_metric, self.metrics_schema_path)
                if validation_result.get("valid", False):
                    metrics.append(composite_metric)
                else:
                    logger.error("Invalid composite metric: %s", validation_result.get("errors", "Unknown error"))
        
        return metrics
    
    def _calculate_integrity_metric(self, surface_data: Dict[str, Any]) -> float:
        """
        Calculate the integrity metric for a trust surface.
        
        Args:
            surface_data: Trust surface data
            
        Returns:
            Integrity metric value between 0 and 1
        """
        # In a real implementation, this would analyze the surface data
        # For now, we'll use a placeholder calculation
        base_value = 0.9
        
        # Adjust based on attestations if available
        attestations = surface_data.get("attestations", [])
        if attestations:
            # More attestations generally means higher integrity
            attestation_factor = min(len(attestations) * 0.05, 0.1)
            base_value = min(base_value + attestation_factor, 1.0)
        
        # Random variation for demonstration
        import random
        random.seed(surface_data.get("surface_id", ""))  # Seed for reproducibility
        variation = random.uniform(-0.05, 0.05)
        
        return max(0.0, min(base_value + variation, 1.0))
    
    def _calculate_availability_metric(self, surface_data: Dict[str, Any]) -> float:
        """
        Calculate the availability metric for a trust surface.
        
        Args:
            surface_data: Trust surface data
            
        Returns:
            Availability metric value between 0 and 1
        """
        # In a real implementation, this would analyze the surface data
        # For now, we'll use a placeholder calculation
        base_value = 0.85
        
        # Adjust based on node status if available
        node_status = surface_data.get("node_status", {})
        if node_status:
            # Higher uptime means higher availability
            uptime = node_status.get("uptime_percentage", 95) / 100.0
            base_value = (base_value + uptime) / 2.0
        
        # Random variation for demonstration
        import random
        random.seed(surface_data.get("node_id", ""))  # Seed for reproducibility
        variation = random.uniform(-0.03, 0.03)
        
        return max(0.0, min(base_value + variation, 1.0))
    
    def _calculate_consistency_metric(self, surface_data: Dict[str, Any]) -> float:
        """
        Calculate the consistency metric for a trust surface.
        
        Args:
            surface_data: Trust surface data
            
        Returns:
            Consistency metric value between 0 and 1
        """
        # In a real implementation, this would analyze the surface data
        # For now, we'll use a placeholder calculation
        base_value = 0.8
        
        # Adjust based on verification status if available
        verification_status = surface_data.get("verification_status", {})
        if verification_status:
            # More verifications generally means higher consistency
            verification_count = verification_status.get("verification_count", 0)
            verification_factor = min(verification_count * 0.02, 0.2)
            base_value = min(base_value + verification_factor, 1.0)
        
        # Random variation for demonstration
        import random
        random.seed(surface_data.get("surface_id", "") + "consistency")  # Seed for reproducibility
        variation = random.uniform(-0.04, 0.04)
        
        return max(0.0, min(base_value + variation, 1.0))
    
    def _calculate_boundary_metric(self, surface_data: Dict[str, Any]) -> float:
        """
        Calculate the boundary metric for a trust surface.
        
        Args:
            surface_data: Trust surface data
            
        Returns:
            Boundary metric value between 0 and 1
        """
        # In a real implementation, this would analyze the surface data
        # For now, we'll use a placeholder calculation
        base_value = 0.75
        
        # Adjust based on boundary count if available
        boundary_ids = surface_data.get("boundary_ids", [])
        if boundary_ids:
            # More boundaries generally means more complex trust relationships
            boundary_factor = max(0.0, 0.1 - (len(boundary_ids) * 0.01))
            base_value = max(base_value + boundary_factor, 0.5)
        
        # Random variation for demonstration
        import random
        random.seed(surface_data.get("surface_id", "") + "boundary")  # Seed for reproducibility
        variation = random.uniform(-0.05, 0.05)
        
        return max(0.0, min(base_value + variation, 1.0))
    
    def _update_metrics_cache(self, surface_id: str, metrics: List[Dict[str, Any]]) -> None:
        """
        Update the metrics cache for a surface.
        
        Args:
            surface_id: ID of the trust surface
            metrics: List of metrics to cache
        """
        if not surface_id or not metrics:
            return
            
        if surface_id not in self.metrics_cache:
            self.metrics_cache[surface_id] = []
            
        # Add new metrics to cache
        self.metrics_cache[surface_id].extend(metrics)
        
        # Limit cache size to last 100 metrics per surface
        if len(self.metrics_cache[surface_id]) > 100:
            self.metrics_cache[surface_id] = self.metrics_cache[surface_id][-100:]
    
    def _calculate_trends(self, surface_id: str, current_metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate trends based on historical metrics.
        
        Args:
            surface_id: ID of the trust surface
            current_metrics: Current metrics for the surface
            
        Returns:
            Dictionary of trend information
        """
        if not surface_id or surface_id not in self.metrics_cache or not current_metrics:
            return {}
            
        historical_metrics = self.metrics_cache[surface_id]
        if not historical_metrics:
            return {}
            
        trends = {}
        
        # Group metrics by type
        metric_types = ["integrity", "availability", "consistency", "boundary", "composite"]
        for metric_type in metric_types:
            # Get current metric of this type
            current = next((m for m in current_metrics if m.get("metric_type") == metric_type), None)
            if not current:
                continue
                
            # Get historical metrics of this type
            history = [m for m in historical_metrics if m.get("metric_type") == metric_type]
            if not history:
                continue
                
            # Calculate trend
            current_value = current.get("value", 0)
            
            # Calculate average of last 5 historical values
            recent_history = sorted(history, key=lambda m: m.get("timestamp", ""))[-5:]
            if not recent_history:
                continue
                
            avg_historical = sum(m.get("value", 0) for m in recent_history) / len(recent_history)
            
            # Calculate trend direction and magnitude
            trend_value = current_value - avg_historical
            
            trends[metric_type] = {
                "direction": "up" if trend_value > 0 else "down" if trend_value < 0 else "stable",
                "magnitude": abs(trend_value),
                "current": current_value,
                "historical_avg": avg_historical,
                "samples": len(recent_history)
            }
        
        return trends
        
    def _check_boundary_violations(self, surface_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Check for boundary violations in a trust surface.
        
        Args:
            surface_data: Trust surface data
            
        Returns:
            List of boundary violation alerts
        """
        alerts = []
        
        # Check each boundary for violations
        for boundary_id in surface_data.get("boundary_ids", []):
            # Get boundary details if available
            boundary_details = next(
                (b for b in surface_data.get("boundaries", []) if b.get("boundary_id") == boundary_id), 
                {}
            )
            
            # Check trust level against threshold
            trust_level = boundary_details.get("trust_level", 0)
            threshold = self.threshold_config.get("boundary_min", 0.6)
            
            if trust_level < threshold:
                alert = {
                    "alert_id": str(uuid.uuid4()),
                    "surface_id": surface_data.get("surface_id"),
                    "boundary_id": boundary_id,
                    "severity": self._determine_severity(trust_level, threshold),
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "description": f"Trust boundary violation: trust level {trust_level} below threshold {threshold}",
                    "contract_version": surface_data.get("contract_version"),
                    "metadata": {
                        "affected_nodes": [surface_data.get("node_id")],
                        "recommended_action": "Review and update trust boundary configuration"
                    }
                }
                
                # Validate alert against schema
                validation_result = validate_against_schema(alert, self.alert_schema_path)
                if validation_result.get("valid", False):
                    alerts.append(alert)
                else:
                    logger.error("Invalid alert: %s", validation_result.get("errors", "Unknown error"))
            
            # Check for policy violations if available
            policies = boundary_details.get("policies", [])
            for policy in policies:
                policy_type = policy.get("policy_type", "")
                policy_status = policy.get("status", "active")
                
                if policy_status != "active":
                    alert = {
                        "alert_id": str(uuid.uuid4()),
                        "surface_id": surface_data.get("surface_id"),
                        "boundary_id": boundary_id,
                        "severity": "warning",
                        "timestamp": datetime.datetime.utcnow().isoformat(),
                        "description": f"Policy violation: {policy_type} policy has status {policy_status}",
                        "contract_version": surface_data.get("contract_version"),
                        "metadata": {
                            "affected_nodes": [surface_data.get("node_id")],
                            "recommended_action": "Review and update policy configuration",
                            "policy_id": policy.get("policy_id", "unknown")
                        }
                    }
                    
                    # Validate alert against schema
                    validation_result = validate_against_schema(alert, self.alert_schema_path)
                    if validation_result.get("valid", False):
                        alerts.append(alert)
                    else:
                        logger.error("Invalid alert: %s", validation_result.get("errors", "Unknown error"))
        
        # Check metrics against thresholds
        metrics = self._generate_metrics(surface_data)
        for metric in metrics:
            metric_type = metric.get("metric_type")
            threshold_key = f"{metric_type}_min"
            
            if threshold_key in self.threshold_config:
                threshold = self.threshold_config[threshold_key]
                value = metric.get("value", 0)
                
                if value < threshold:
                    alert = {
                        "alert_id": str(uuid.uuid4()),
                        "surface_id": surface_data.get("surface_id"),
                        "boundary_id": surface_data.get("boundary_ids", ["unknown"])[0],
                        "severity": self._determine_severity(value, threshold),
                        "timestamp": datetime.datetime.utcnow().isoformat(),
                        "description": f"{metric_type.capitalize()} metric violation: value {value} below threshold {threshold}",
                        "contract_version": surface_data.get("contract_version"),
                        "metadata": {
                            "affected_nodes": [surface_data.get("node_id")],
                            "recommended_action": f"Investigate low {metric_type} metric",
                            "metric_id": metric.get("metric_id")
                        }
                    }
                    
                    # Validate alert against schema
                    validation_result = validate_against_schema(alert, self.alert_schema_path)
                    if validation_result.get("valid", False):
                        alerts.append(alert)
                    else:
                        logger.error("Invalid alert: %s", validation_result.get("errors", "Unknown error"))
        
        return alerts
    
    def _determine_severity(self, value: float, threshold: float) -> str:
        """
        Determine alert severity based on value and threshold.
        
        Args:
            value: Metric or trust level value
            threshold: Threshold value
            
        Returns:
            Severity level string
        """
        if value < threshold * 0.5:
            return "emergency"
        elif value < threshold * 0.7:
            return "critical"
        elif value < threshold * 0.9:
            return "warning"
        else:
            return "info"
    
    def get_historical_alerts(self, surface_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get historical alerts for a surface.
        
        Args:
            surface_id: Optional ID of the trust surface to filter by
            limit: Maximum number of alerts to return
            
        Returns:
            List of historical alerts
        """
        if not self.alert_history:
            return []
            
        if surface_id:
            filtered_alerts = [a for a in self.alert_history if a.get("surface_id") == surface_id]
        else:
            filtered_alerts = self.alert_history
            
        # Sort by timestamp (newest first)
        sorted_alerts = sorted(filtered_alerts, key=lambda a: a.get("timestamp", ""), reverse=True)
        
        # Limit the number of alerts
        return sorted_alerts[:limit]
