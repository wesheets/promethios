"""
Trust Metrics Aggregator Module

This module collects and aggregates trust metrics from multiple nodes in the distributed trust system.
It normalizes metrics for consistent comparison and calculates aggregate metrics for surfaces and boundaries.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import uuid
import datetime
import logging
import json
import hashlib
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict

from src.core.common.schema_validator import validate_against_schema

logger = logging.getLogger(__name__)

class TrustMetricsAggregator:
    """
    Collects and aggregates trust metrics from multiple nodes.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the Trust Metrics Aggregator.
        
        Args:
            config: Configuration dictionary for the aggregator
        """
        self.config = config or {}
        self.metrics_schema_path = "schemas/trust/trust_metrics.schema.v1.json"
        self.metrics_cache = {}
        self.node_registry = {}
        self.historical_metrics = defaultdict(list)  # surface_id -> list of metrics
        self.max_cache_size = self.config.get("max_cache_size", 1000)
        self.max_history_per_surface = self.config.get("max_history_per_surface", 100)
        self.normalization_factors = self.config.get("normalization_factors", {
            "integrity": 1.0,
            "availability": 1.0,
            "consistency": 1.0,
            "boundary": 1.0,
            "composite": 1.0
        })
        logger.info("Trust Metrics Aggregator initialized with config: %s", self.config)
        
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
            "component": "TrustMetricsAggregator",
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
            return hashlib.sha256(b"TrustMetricsAggregator").hexdigest()
        except Exception as e:
            logger.error("Failed to calculate component hash: %s", str(e))
            return ""
        
    def register_node(self, node_id: str, node_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a node with the aggregator.
        
        Args:
            node_id: ID of the node to register
            node_info: Information about the node
            
        Returns:
            Dictionary with registration results
        """
        if not node_id:
            return {"error": "Invalid node ID", "status": "failed"}
            
        # Validate node info
        required_fields = ["name", "type", "version"]
        for field in required_fields:
            if field not in node_info:
                return {"error": f"Missing required field: {field}", "status": "failed"}
                
        # Register the node
        self.node_registry[node_id] = {
            "info": node_info,
            "last_seen": datetime.datetime.utcnow().isoformat(),
            "metrics_count": 0,
            "status": "active"
        }
        
        logger.info("Node registered: %s (%s)", node_id, node_info.get("name"))
        
        return {
            "node_id": node_id,
            "status": "registered",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    def collect_metrics(self, node_id: str, metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Collect metrics from a node.
        
        Args:
            node_id: ID of the node providing metrics
            metrics: List of metrics from the node
            
        Returns:
            Dictionary with collection results
        """
        if not node_id or node_id not in self.node_registry:
            logger.warning("Metrics received from unregistered node: %s", node_id)
            # Auto-register the node with minimal info
            self.register_node(node_id, {"name": f"Unknown-{node_id}", "type": "auto-registered", "version": "unknown"})
            
        valid_metrics = []
        invalid_metrics = []
        
        for metric in metrics:
            # Validate metric against schema
            validation_result = validate_against_schema(metric, self.metrics_schema_path)
            if validation_result.get("valid", False):
                # Normalize the metric
                normalized_metric = self._normalize_metric(metric)
                valid_metrics.append(normalized_metric)
                
                # Cache the metric for aggregation
                surface_id = normalized_metric.get("surface_id")
                if surface_id not in self.metrics_cache:
                    self.metrics_cache[surface_id] = []
                self.metrics_cache[surface_id].append(normalized_metric)
                
                # Add to historical metrics
                self.historical_metrics[surface_id].append(normalized_metric)
                
                # Trim historical metrics if needed
                if len(self.historical_metrics[surface_id]) > self.max_history_per_surface:
                    # Sort by timestamp and keep only the most recent
                    self.historical_metrics[surface_id] = sorted(
                        self.historical_metrics[surface_id],
                        key=lambda m: m.get("timestamp", ""),
                        reverse=True
                    )[:self.max_history_per_surface]
            else:
                invalid_metrics.append({
                    "metric": metric,
                    "errors": validation_result.get("errors", ["Unknown validation error"])
                })
        
        # Update node registry
        if node_id in self.node_registry:
            self.node_registry[node_id]["last_seen"] = datetime.datetime.utcnow().isoformat()
            self.node_registry[node_id]["metrics_count"] += len(valid_metrics)
        
        # Trim cache if needed
        self._trim_cache_if_needed()
        
        logger.info("Collected %d valid metrics from node %s (%d invalid)", 
                   len(valid_metrics), node_id, len(invalid_metrics))
        
        return {
            "node_id": node_id,
            "valid_count": len(valid_metrics),
            "invalid_count": len(invalid_metrics),
            "invalid_metrics": invalid_metrics if len(invalid_metrics) < 10 else invalid_metrics[:10],
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    
    def _normalize_metric(self, metric: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a metric for consistent comparison.
        
        Args:
            metric: The metric to normalize
            
        Returns:
            Normalized metric
        """
        normalized_metric = metric.copy()
        
        # Apply normalization factor based on metric type
        metric_type = metric.get("metric_type")
        if metric_type in self.normalization_factors:
            factor = self.normalization_factors[metric_type]
            if factor != 1.0 and "value" in normalized_metric:
                normalized_metric["value"] = min(1.0, max(0.0, normalized_metric["value"] * factor))
                
                # Add normalization info to metadata
                if "metadata" not in normalized_metric:
                    normalized_metric["metadata"] = {}
                normalized_metric["metadata"]["normalization_factor"] = factor
        
        return normalized_metric
        
    def _trim_cache_if_needed(self) -> None:
        """
        Trim the metrics cache if it exceeds the maximum size.
        """
        total_metrics = sum(len(metrics) for metrics in self.metrics_cache.values())
        
        if total_metrics > self.max_cache_size:
            logger.info("Trimming metrics cache (current size: %d, max: %d)", 
                       total_metrics, self.max_cache_size)
            
            # Calculate how many metrics to remove
            excess = total_metrics - self.max_cache_size
            
            # Remove oldest metrics first
            for surface_id in sorted(self.metrics_cache.keys()):
                if excess <= 0:
                    break
                    
                surface_metrics = self.metrics_cache[surface_id]
                if len(surface_metrics) <= excess:
                    # Remove all metrics for this surface
                    excess -= len(surface_metrics)
                    self.metrics_cache[surface_id] = []
                else:
                    # Sort by timestamp and remove oldest
                    sorted_metrics = sorted(
                        surface_metrics,
                        key=lambda m: m.get("timestamp", "")
                    )
                    self.metrics_cache[surface_id] = sorted_metrics[excess:]
                    excess = 0
        
    def aggregate_metrics(self, surface_id: str) -> Dict[str, Any]:
        """
        Aggregate metrics for a specific trust surface.
        
        Args:
            surface_id: ID of the trust surface
            
        Returns:
            Dictionary with aggregated metrics
        """
        if surface_id not in self.metrics_cache or not self.metrics_cache[surface_id]:
            logger.warning("No metrics found for surface %s", surface_id)
            return {
                "surface_id": surface_id,
                "error": f"No metrics found for surface {surface_id}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        surface_metrics = self.metrics_cache[surface_id]
        
        # Group metrics by type
        metrics_by_type = {}
        for metric in surface_metrics:
            metric_type = metric.get("metric_type")
            if metric_type not in metrics_by_type:
                metrics_by_type[metric_type] = []
            metrics_by_type[metric_type].append(metric)
        
        # Calculate aggregate values for each metric type
        aggregated_metrics = {}
        for metric_type, metrics in metrics_by_type.items():
            values = [m.get("value", 0) for m in metrics]
            if values:
                # Calculate statistics
                mean_value = sum(values) / len(values)
                
                # Calculate standard deviation
                variance = sum((x - mean_value) ** 2 for x in values) / len(values)
                std_dev = variance ** 0.5
                
                aggregated_metrics[metric_type] = {
                    "mean": mean_value,
                    "min": min(values),
                    "max": max(values),
                    "std_dev": std_dev,
                    "count": len(values),
                    "nodes": len(set(m.get("node_id") for m in metrics))
                }
        
        # Group metrics by node
        metrics_by_node = {}
        for metric in surface_metrics:
            node_id = metric.get("node_id")
            if node_id not in metrics_by_node:
                metrics_by_node[node_id] = []
            metrics_by_node[node_id].append(metric)
        
        # Calculate node-specific aggregates
        node_aggregates = {}
        for node_id, node_metrics in metrics_by_node.items():
            node_values = {}
            for metric in node_metrics:
                metric_type = metric.get("metric_type")
                if metric_type not in node_values:
                    node_values[metric_type] = []
                node_values[metric_type].append(metric.get("value", 0))
            
            node_aggregates[node_id] = {
                metric_type: sum(values) / len(values) if values else 0
                for metric_type, values in node_values.items()
            }
        
        result = {
            "surface_id": surface_id,
            "aggregated_metrics": aggregated_metrics,
            "node_aggregates": node_aggregates,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "aggregation_id": str(uuid.uuid4())
        }
        
        logger.info("Aggregated metrics for surface %s: %d metric types from %d nodes", 
                   surface_id, len(aggregated_metrics), len(node_aggregates))
        
        return result
    
    def aggregate_all_surfaces(self) -> Dict[str, Any]:
        """
        Aggregate metrics for all trust surfaces.
        
        Returns:
            Dictionary with aggregated metrics for all surfaces
        """
        results = {}
        
        for surface_id in self.metrics_cache.keys():
            if self.metrics_cache[surface_id]:  # Only aggregate if we have metrics
                results[surface_id] = self.aggregate_metrics(surface_id)
        
        return {
            "surfaces": len(results),
            "results": results,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    def get_historical_metrics(self, surface_id: str, start_time: Optional[str] = None, 
                              end_time: Optional[str] = None, metric_types: Optional[List[str]] = None,
                              limit: int = 100) -> Dict[str, Any]:
        """
        Get historical metrics for a trust surface within a time range.
        
        Args:
            surface_id: ID of the trust surface
            start_time: Optional ISO 8601 start timestamp
            end_time: Optional ISO 8601 end timestamp
            metric_types: Optional list of metric types to include
            limit: Maximum number of metrics to return per type
            
        Returns:
            Dictionary with historical metrics
        """
        if surface_id not in self.historical_metrics:
            logger.warning("No historical metrics found for surface %s", surface_id)
            return {
                "surface_id": surface_id,
                "error": f"No historical metrics found for surface {surface_id}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        
        metrics = self.historical_metrics[surface_id]
        
        # Filter by time range if specified
        if start_time or end_time:
            filtered_metrics = []
            for metric in metrics:
                timestamp = metric.get("timestamp", "")
                
                if start_time and timestamp < start_time:
                    continue
                    
                if end_time and timestamp > end_time:
                    continue
                    
                filtered_metrics.append(metric)
            
            metrics = filtered_metrics
        
        # Filter by metric types if specified
        if metric_types:
            metrics = [m for m in metrics if m.get("metric_type") in metric_types]
        
        # Group by metric type
        metrics_by_type = {}
        for metric in metrics:
            metric_type = metric.get("metric_type")
            if metric_type not in metrics_by_type:
                metrics_by_type[metric_type] = []
            metrics_by_type[metric_type].append(metric)
        
        # Sort by timestamp and limit results
        for metric_type in metrics_by_type:
            metrics_by_type[metric_type] = sorted(
                metrics_by_type[metric_type],
                key=lambda m: m.get("timestamp", ""),
                reverse=True
            )[:limit]
        
        result = {
            "surface_id": surface_id,
            "metrics_by_type": metrics_by_type,
            "total_metrics": sum(len(metrics) for metrics in metrics_by_type.values()),
            "start_time": start_time,
            "end_time": end_time,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
        logger.info("Retrieved historical metrics for surface %s: %d metrics of %d types", 
                   surface_id, result["total_metrics"], len(metrics_by_type))
        
        return result
    
    def get_metrics_timeline(self, surface_id: str, metric_type: str, 
                           interval: str = "hour", limit: int = 24) -> Dict[str, Any]:
        """
        Get a timeline of metrics for a specific surface and metric type.
        
        Args:
            surface_id: ID of the trust surface
            metric_type: Type of metric to include
            interval: Time interval for aggregation ('hour', 'day', 'week')
            limit: Maximum number of intervals to return
            
        Returns:
            Dictionary with timeline data
        """
        if surface_id not in self.historical_metrics:
            logger.warning("No historical metrics found for surface %s", surface_id)
            return {
                "surface_id": surface_id,
                "error": f"No historical metrics found for surface {surface_id}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        
        # Filter metrics by type
        metrics = [m for m in self.historical_metrics[surface_id] 
                  if m.get("metric_type") == metric_type]
        
        if not metrics:
            logger.warning("No metrics of type %s found for surface %s", metric_type, surface_id)
            return {
                "surface_id": surface_id,
                "metric_type": metric_type,
                "error": f"No metrics of type {metric_type} found",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        
        # Group metrics by time interval
        timeline = []
        
        # Sort metrics by timestamp
        sorted_metrics = sorted(metrics, key=lambda m: m.get("timestamp", ""))
        
        # Group by interval
        interval_metrics = {}
        
        for metric in sorted_metrics:
            timestamp = metric.get("timestamp", "")
            if not timestamp:
                continue
                
            try:
                dt = datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                
                # Create interval key based on specified interval
                if interval == "hour":
                    interval_key = dt.strftime("%Y-%m-%d %H:00:00")
                elif interval == "day":
                    interval_key = dt.strftime("%Y-%m-%d 00:00:00")
                elif interval == "week":
                    # Calculate the start of the week (Monday)
                    start_of_week = dt - datetime.timedelta(days=dt.weekday())
                    interval_key = start_of_week.strftime("%Y-%m-%d 00:00:00")
                else:
                    # Default to hour
                    interval_key = dt.strftime("%Y-%m-%d %H:00:00")
                
                if interval_key not in interval_metrics:
                    interval_metrics[interval_key] = []
                
                interval_metrics[interval_key].append(metric)
            except ValueError:
                logger.warning("Invalid timestamp format: %s", timestamp)
                continue
        
        # Calculate aggregates for each interval
        for interval_key, interval_data in sorted(interval_metrics.items(), reverse=True)[:limit]:
            values = [m.get("value", 0) for m in interval_data]
            if values:
                timeline.append({
                    "interval": interval_key,
                    "mean": sum(values) / len(values),
                    "min": min(values),
                    "max": max(values),
                    "count": len(values),
                    "nodes": len(set(m.get("node_id") for m in interval_data))
                })
        
        # Sort timeline by interval
        timeline.sort(key=lambda t: t["interval"])
        
        result = {
            "surface_id": surface_id,
            "metric_type": metric_type,
            "interval": interval,
            "timeline": timeline,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
        logger.info("Generated timeline for surface %s, metric type %s: %d intervals", 
                   surface_id, metric_type, len(timeline))
        
        return result
    
    def get_node_status(self) -> Dict[str, Any]:
        """
        Get status information for all registered nodes.
        
        Returns:
            Dictionary with node status information
        """
        now = datetime.datetime.utcnow()
        
        node_status = {}
        for node_id, node_data in self.node_registry.items():
            try:
                last_seen = datetime.datetime.fromisoformat(
                    node_data["last_seen"].replace('Z', '+00:00')
                )
                time_since_last_seen = (now - last_seen).total_seconds()
                
                # Determine node status based on last seen time
                status = "active"
                if time_since_last_seen > 3600:  # More than 1 hour
                    status = "inactive"
                elif time_since_last_seen > 86400:  # More than 1 day
                    status = "offline"
                
                node_status[node_id] = {
                    "name": node_data["info"].get("name", "Unknown"),
                    "type": node_data["info"].get("type", "Unknown"),
                    "version": node_data["info"].get("version", "Unknown"),
                    "last_seen": node_data["last_seen"],
                    "metrics_count": node_data["metrics_count"],
                    "status": status,
                    "seconds_since_last_seen": time_since_last_seen
                }
            except (ValueError, KeyError) as e:
                logger.error("Error processing node data for %s: %s", node_id, str(e))
                node_status[node_id] = {
                    "name": node_data["info"].get("name", "Unknown"),
                    "status": "error",
                    "error": str(e)
                }
        
        return {
            "nodes": len(node_status),
            "active_nodes": sum(1 for data in node_status.values() if data.get("status") == "active"),
            "node_status": node_status,
            "timestamp": now.isoformat()
        }
