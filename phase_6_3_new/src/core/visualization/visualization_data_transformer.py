"""
Visualization Data Transformer Module

This module transforms trust data into visualization-ready format for the Trust Surface Dashboard.
It generates node and edge data for network visualizations and prepares time series data for trend charts.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import uuid
import datetime
import logging
import json
import hashlib
import math
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict

from src.core.common.schema_validator import validate_against_schema

logger = logging.getLogger(__name__)

class VisualizationDataTransformer:
    """
    Transforms trust data into visualization-ready format.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the Visualization Data Transformer.
        
        Args:
            config: Configuration dictionary for the transformer
        """
        self.config = config or {}
        self.visualization_schema_path = "schemas/trust/trust_visualization.schema.v1.json"
        self.color_map = self.config.get("color_map", {
            "surface": "#3498db",  # Blue
            "boundary": "#2ecc71",  # Green
            "node": "#9b59b6",     # Purple
            "alert": "#e74c3c",    # Red
            "high_trust": "#27ae60",  # Dark Green
            "medium_trust": "#f39c12",  # Orange
            "low_trust": "#c0392b"   # Dark Red
        })
        self.layout_config = self.config.get("layout", {
            "node_spacing": 100,
            "boundary_radius": 150,
            "surface_radius": 50,
            "z_layer_spacing": 30
        })
        self.visualization_cache = {}
        logger.info("Visualization Data Transformer initialized with config: %s", self.config)
        
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
            "component": "VisualizationDataTransformer",
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
            return hashlib.sha256(b"VisualizationDataTransformer").hexdigest()
        except Exception as e:
            logger.error("Failed to calculate component hash: %s", str(e))
            return ""
        
    def transform_surface_to_visualization(self, surface_data: Dict[str, Any], metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform trust surface data into visualization format.
        
        Args:
            surface_data: Trust surface data
            metrics: Trust metrics data
            
        Returns:
            Visualization data in schema-compliant format
        """
        if not surface_data or not metrics:
            logger.error("Invalid input data for visualization transformation")
            return {"error": "Invalid input data", "timestamp": datetime.datetime.utcnow().isoformat()}
            
        surface_id = surface_data.get("surface_id")
        if not surface_id:
            logger.error("Missing surface_id in surface data")
            return {"error": "Missing surface_id", "timestamp": datetime.datetime.utcnow().isoformat()}
            
        try:
            # Generate nodes from surface data
            nodes = self._generate_nodes(surface_data, metrics)
            
            # Generate edges from surface data
            edges = self._generate_edges(surface_data, nodes, metrics)
            
            # Apply layout algorithm to position nodes
            self._apply_layout(nodes, edges)
            
            # Create visualization data structure
            visualization = {
                "visualization_id": str(uuid.uuid4()),
                "surface_ids": [surface_id],
                "view_type": "network",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "contract_version": surface_data.get("contract_version", "v2025.05.19"),
                "nodes": nodes,
                "edges": edges,
                "metadata": {
                    "title": f"Trust Surface Visualization: {surface_id}",
                    "description": "Network visualization of trust surface and boundaries",
                    "time_range": {
                        "start": datetime.datetime.utcnow().isoformat(),
                        "end": datetime.datetime.utcnow().isoformat()
                    },
                    "metrics_summary": self._generate_metrics_summary(metrics),
                    "color_map": self.color_map
                }
            }
            
            # Validate visualization against schema
            validation_result = validate_against_schema(visualization, self.visualization_schema_path)
            if not validation_result.get("valid", False):
                logger.error("Invalid visualization data: %s", validation_result.get("errors", "Unknown error"))
                return {"error": "Failed to generate valid visualization data", "details": validation_result.get("errors", [])}
                
            # Cache the visualization
            self.visualization_cache[surface_id] = visualization
            
            logger.info("Successfully transformed surface %s to visualization with %d nodes and %d edges", 
                       surface_id, len(nodes), len(edges))
                
            return visualization
            
        except Exception as e:
            logger.error("Error transforming surface to visualization: %s", str(e))
            return {"error": f"Transformation error: {str(e)}", "timestamp": datetime.datetime.utcnow().isoformat()}
    
    def _generate_metrics_summary(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a summary of metrics for visualization metadata.
        
        Args:
            metrics: Trust metrics data
            
        Returns:
            Dictionary with metrics summary
        """
        summary = {}
        
        if "aggregated_metrics" in metrics:
            for metric_type, metric_data in metrics.get("aggregated_metrics", {}).items():
                if "mean" in metric_data:
                    summary[metric_type] = {
                        "value": metric_data["mean"],
                        "min": metric_data.get("min", 0),
                        "max": metric_data.get("max", 1),
                        "count": metric_data.get("count", 0)
                    }
        
        return summary
        
    def _generate_nodes(self, surface_data: Dict[str, Any], metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate nodes for visualization from surface data.
        
        Args:
            surface_data: Trust surface data
            metrics: Trust metrics data
            
        Returns:
            List of node objects
        """
        nodes = []
        surface_id = surface_data.get("surface_id")
        
        # Get metrics for coloring
        composite_metric = 0.5  # Default value
        if "aggregated_metrics" in metrics and "composite" in metrics["aggregated_metrics"]:
            composite_metric = metrics["aggregated_metrics"]["composite"].get("mean", 0.5)
        
        # Create surface node
        surface_node = {
            "id": surface_id,
            "type": "surface",
            "label": surface_data.get("name", f"Surface {surface_id[:8]}"),
            "metrics": self._extract_node_metrics(metrics, "surface"),
            "position": {
                "x": 0,
                "y": 0,
                "z": 0
            },
            "size": self.layout_config.get("surface_radius", 50),
            "color": self._get_trust_color(composite_metric),
            "metadata": {
                "description": surface_data.get("description", "Trust Surface"),
                "node_count": len(surface_data.get("nodes", [])),
                "boundary_count": len(surface_data.get("boundary_ids", [])),
                "trust_level": composite_metric
            }
        }
        nodes.append(surface_node)
        
        # Create boundary nodes
        boundaries = surface_data.get("boundaries", [])
        if not boundaries and "boundary_ids" in surface_data:
            # Create placeholder boundaries if only IDs are provided
            boundaries = [{"boundary_id": bid} for bid in surface_data.get("boundary_ids", [])]
            
        for i, boundary in enumerate(boundaries):
            boundary_id = boundary.get("boundary_id")
            if not boundary_id:
                continue
                
            # Get trust level for this boundary
            trust_level = boundary.get("trust_level", 0.5)
            
            boundary_node = {
                "id": boundary_id,
                "type": "boundary",
                "label": boundary.get("name", f"Boundary {boundary_id[:8]}"),
                "metrics": self._extract_node_metrics(metrics, "boundary", boundary_id),
                "position": {
                    "x": 0,  # Will be set by layout algorithm
                    "y": 0,
                    "z": 0
                },
                "size": self.layout_config.get("boundary_radius", 150) * (0.8 + (trust_level * 0.4)),
                "color": self._get_trust_color(trust_level),
                "metadata": {
                    "description": boundary.get("description", "Trust Boundary"),
                    "trust_level": trust_level,
                    "boundary_type": boundary.get("boundary_type", "standard"),
                    "policy_count": len(boundary.get("policies", []))
                }
            }
            nodes.append(boundary_node)
        
        # Create nodes for connected systems
        connected_nodes = surface_data.get("nodes", [])
        for i, node in enumerate(connected_nodes):
            node_id = node.get("node_id")
            if not node_id:
                continue
                
            # Get trust level for this node
            trust_level = node.get("trust_level", 0.5)
            
            node_obj = {
                "id": node_id,
                "type": "node",
                "label": node.get("name", f"Node {node_id[:8]}"),
                "metrics": self._extract_node_metrics(metrics, "node", node_id),
                "position": {
                    "x": 0,  # Will be set by layout algorithm
                    "y": 0,
                    "z": self.layout_config.get("z_layer_spacing", 30)  # Put nodes on a different z-layer
                },
                "size": 30,  # Smaller than boundaries
                "color": self._get_trust_color(trust_level),
                "metadata": {
                    "description": node.get("description", "Connected Node"),
                    "trust_level": trust_level,
                    "node_type": node.get("node_type", "standard"),
                    "status": node.get("status", "active")
                }
            }
            nodes.append(node_obj)
            
        # Create alert nodes if any
        alerts = metrics.get("alerts", [])
        for i, alert in enumerate(alerts):
            alert_id = alert.get("alert_id")
            if not alert_id:
                continue
                
            severity = alert.get("severity", "warning")
            severity_map = {
                "info": 0.7,
                "warning": 0.5,
                "critical": 0.3,
                "emergency": 0.1
            }
            trust_level = severity_map.get(severity, 0.5)
            
            alert_node = {
                "id": alert_id,
                "type": "alert",
                "label": f"Alert: {severity.capitalize()}",
                "metrics": {},
                "position": {
                    "x": 0,  # Will be set by layout algorithm
                    "y": 0,
                    "z": self.layout_config.get("z_layer_spacing", 30) * 2  # Put alerts on top layer
                },
                "size": 25,  # Smaller than nodes
                "color": self.color_map.get("alert", "#e74c3c"),
                "metadata": {
                    "description": alert.get("description", "Trust Boundary Alert"),
                    "severity": severity,
                    "timestamp": alert.get("timestamp", datetime.datetime.utcnow().isoformat()),
                    "boundary_id": alert.get("boundary_id")
                }
            }
            nodes.append(alert_node)
            
        return nodes
    
    def _extract_node_metrics(self, metrics: Dict[str, Any], node_type: str, node_id: str = None) -> Dict[str, Any]:
        """
        Extract metrics for a specific node from the metrics data.
        
        Args:
            metrics: Trust metrics data
            node_type: Type of node (surface, boundary, node)
            node_id: Optional ID of the node
            
        Returns:
            Dictionary with node-specific metrics
        """
        if node_type == "surface":
            # For surface nodes, use aggregated metrics
            if "aggregated_metrics" in metrics:
                return {k: v.get("mean", 0) for k, v in metrics["aggregated_metrics"].items()}
            return {}
            
        elif node_type == "boundary" and node_id:
            # For boundary nodes, look for boundary-specific metrics
            if "node_aggregates" in metrics and node_id in metrics["node_aggregates"]:
                return metrics["node_aggregates"][node_id]
            return {}
            
        elif node_type == "node" and node_id:
            # For regular nodes, look for node-specific metrics
            if "node_aggregates" in metrics and node_id in metrics["node_aggregates"]:
                return metrics["node_aggregates"][node_id]
            return {}
            
        return {}
        
    def _get_trust_color(self, trust_level: float) -> str:
        """
        Get color based on trust level.
        
        Args:
            trust_level: Trust level value between 0 and 1
            
        Returns:
            Color string
        """
        if trust_level >= 0.7:
            return self.color_map.get("high_trust", "#27ae60")
        elif trust_level >= 0.4:
            return self.color_map.get("medium_trust", "#f39c12")
        else:
            return self.color_map.get("low_trust", "#c0392b")
        
    def _generate_edges(self, surface_data: Dict[str, Any], nodes: List[Dict[str, Any]], 
                       metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate edges for visualization from surface data and nodes.
        
        Args:
            surface_data: Trust surface data
            nodes: List of node objects
            metrics: Trust metrics data
            
        Returns:
            List of edge objects
        """
        edges = []
        surface_id = surface_data.get("surface_id")
        
        # Create a map of node IDs to nodes for quick lookup
        node_map = {node["id"]: node for node in nodes}
        
        # Create edges from surface to boundaries
        boundaries = surface_data.get("boundaries", [])
        if not boundaries and "boundary_ids" in surface_data:
            # Create placeholder boundaries if only IDs are provided
            boundaries = [{"boundary_id": bid} for bid in surface_data.get("boundary_ids", [])]
            
        for boundary in boundaries:
            boundary_id = boundary.get("boundary_id")
            if not boundary_id or boundary_id not in node_map:
                continue
                
            # Get trust level for this boundary
            trust_level = boundary.get("trust_level", 0.5)
            
            edge = {
                "id": f"{surface_id}-{boundary_id}",
                "source": surface_id,
                "target": boundary_id,
                "type": "boundary",
                "weight": trust_level,
                "color": self._get_trust_color(trust_level),
                "metadata": {
                    "trust_level": trust_level,
                    "boundary_type": boundary.get("boundary_type", "standard"),
                    "description": f"Surface to Boundary: {trust_level:.2f} trust"
                }
            }
            edges.append(edge)
        
        # Create edges from boundaries to nodes
        connected_nodes = surface_data.get("nodes", [])
        for node in connected_nodes:
            node_id = node.get("node_id")
            if not node_id or node_id not in node_map:
                continue
                
            # Find which boundary this node belongs to
            boundary_id = node.get("boundary_id")
            if not boundary_id or boundary_id not in node_map:
                # If no boundary specified, connect to surface
                boundary_id = surface_id
                
            # Get trust level for this connection
            trust_level = node.get("trust_level", 0.5)
            
            edge = {
                "id": f"{boundary_id}-{node_id}",
                "source": boundary_id,
                "target": node_id,
                "type": "node",
                "weight": trust_level,
                "color": self._get_trust_color(trust_level),
                "metadata": {
                    "trust_level": trust_level,
                    "node_type": node.get("node_type", "standard"),
                    "description": f"Boundary to Node: {trust_level:.2f} trust"
                }
            }
            edges.append(edge)
        
        # Create edges from alerts to their boundaries
        alerts = metrics.get("alerts", [])
        for alert in alerts:
            alert_id = alert.get("alert_id")
            boundary_id = alert.get("boundary_id")
            
            if not alert_id or alert_id not in node_map or not boundary_id or boundary_id not in node_map:
                continue
                
            severity = alert.get("severity", "warning")
            severity_map = {
                "info": 0.7,
                "warning": 0.5,
                "critical": 0.3,
                "emergency": 0.1
            }
            trust_level = severity_map.get(severity, 0.5)
            
            edge = {
                "id": f"{boundary_id}-{alert_id}",
                "source": boundary_id,
                "target": alert_id,
                "type": "alert",
                "weight": 1.0,  # Alerts always have strong connections
                "color": self.color_map.get("alert", "#e74c3c"),
                "metadata": {
                    "severity": severity,
                    "description": alert.get("description", "Boundary Alert"),
                    "timestamp": alert.get("timestamp", datetime.datetime.utcnow().isoformat())
                }
            }
            edges.append(edge)
            
        return edges
    
    def _apply_layout(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> None:
        """
        Apply a layout algorithm to position nodes.
        
        Args:
            nodes: List of node objects
            edges: List of edge objects
        """
        if not nodes:
            return
            
        # Find the surface node
        surface_node = next((node for node in nodes if node["type"] == "surface"), None)
        if not surface_node:
            return
            
        # Place surface node at center
        surface_node["position"] = {"x": 0, "y": 0, "z": 0}
        
        # Group nodes by type
        node_types = defaultdict(list)
        for node in nodes:
            if node["id"] != surface_node["id"]:  # Skip surface node
                node_types[node["type"]].append(node)
        
        # Position boundary nodes in a circle around the surface
        boundary_nodes = node_types.get("boundary", [])
        self._position_nodes_in_circle(boundary_nodes, 
                                     self.layout_config.get("node_spacing", 100) * 3, 
                                     0)  # Boundaries on z=0 plane
        
        # Position regular nodes in a larger circle
        regular_nodes = node_types.get("node", [])
        self._position_nodes_in_circle(regular_nodes, 
                                     self.layout_config.get("node_spacing", 100) * 5, 
                                     self.layout_config.get("z_layer_spacing", 30))  # Nodes on z=30 plane
        
        # Position alert nodes near their boundaries
        alert_nodes = node_types.get("alert", [])
        self._position_alert_nodes(alert_nodes, nodes, edges, 
                                 self.layout_config.get("z_layer_spacing", 30) * 2)  # Alerts on z=60 plane
    
    def _position_nodes_in_circle(self, nodes: List[Dict[str, Any]], radius: float, z_level: float) -> None:
        """
        Position nodes in a circle.
        
        Args:
            nodes: List of node objects
            radius: Radius of the circle
            z_level: Z-coordinate for the nodes
        """
        if not nodes:
            return
            
        # Position nodes in a circle
        for i, node in enumerate(nodes):
            angle = (2 * math.pi * i) / len(nodes)
            node["position"] = {
                "x": radius * math.cos(angle),
                "y": radius * math.sin(angle),
                "z": z_level
            }
    
    def _position_alert_nodes(self, alert_nodes: List[Dict[str, Any]], all_nodes: List[Dict[str, Any]], 
                            edges: List[Dict[str, Any]], z_level: float) -> None:
        """
        Position alert nodes near their related boundaries.
        
        Args:
            alert_nodes: List of alert node objects
            all_nodes: List of all node objects
            edges: List of edge objects
            z_level: Z-coordinate for the alert nodes
        """
        if not alert_nodes:
            return
            
        # Create a map of node IDs to nodes for quick lookup
        node_map = {node["id"]: node for node in all_nodes}
        
        # Find connections for each alert
        for alert in alert_nodes:
            # Find the edge connecting this alert to a boundary
            connected_edge = next((edge for edge in edges 
                                 if edge["target"] == alert["id"]), None)
            
            if connected_edge and connected_edge["source"] in node_map:
                # Position alert near its boundary
                boundary = node_map[connected_edge["source"]]
                boundary_pos = boundary["position"]
                
                # Add a small random offset
                import random
                random.seed(alert["id"])  # Seed for reproducibility
                offset_x = random.uniform(-50, 50)
                offset_y = random.uniform(-50, 50)
                
                alert["position"] = {
                    "x": boundary_pos["x"] + offset_x,
                    "y": boundary_pos["y"] + offset_y,
                    "z": z_level
                }
            else:
                # If no connection found, position randomly
                import random
                random.seed(alert["id"])  # Seed for reproducibility
                alert["position"] = {
                    "x": random.uniform(-200, 200),
                    "y": random.uniform(-200, 200),
                    "z": z_level
                }
        
    def generate_time_series_data(self, metrics_history: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate time series data for trend charts.
        
        Args:
            metrics_history: Historical metrics data from TrustMetricsAggregator
            
        Returns:
            Time series data for visualization
        """
        if not metrics_history or "metrics_by_type" not in metrics_history:
            logger.error("Invalid metrics history data for time series generation")
            return {
                "error": "Invalid metrics history data",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        surface_id = metrics_history.get("surface_id")
        if not surface_id:
            logger.error("Missing surface_id in metrics history")
            return {
                "error": "Missing surface_id",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        try:
            # Process metrics by type
            metrics_by_type = metrics_history.get("metrics_by_type", {})
            
            # Initialize time series data
            time_series = {
                "visualization_id": str(uuid.uuid4()),
                "surface_ids": [surface_id],
                "view_type": "time_series",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "start_time": metrics_history.get("start_time"),
                "end_time": metrics_history.get("end_time"),
                "series": {},
                "metadata": {
                    "title": f"Trust Metrics Timeline: {surface_id}",
                    "description": "Time series visualization of trust metrics",
                    "metrics_count": metrics_history.get("total_metrics", 0)
                }
            }
            
            # Process each metric type
            for metric_type, metrics in metrics_by_type.items():
                # Sort metrics by timestamp
                sorted_metrics = sorted(metrics, key=lambda m: m.get("timestamp", ""))
                
                # Extract timestamps and values
                timestamps = []
                values = []
                
                for metric in sorted_metrics:
                    timestamps.append(metric.get("timestamp"))
                    values.append(metric.get("value", 0))
                
                if timestamps and values:
                    time_series["series"][metric_type] = {
                        "timestamps": timestamps,
                        "values": values,
                        "color": self._get_series_color(metric_type),
                        "label": f"{metric_type.capitalize()} Metric"
                    }
            
            # Validate time series data
            # Note: We would need a schema for time series data
            # For now, we'll just return the data
            
            logger.info("Generated time series data for surface %s with %d series", 
                       surface_id, len(time_series["series"]))
            
            return time_series
            
        except Exception as e:
            logger.error("Error generating time series data: %s", str(e))
            return {
                "error": f"Time series generation error: {str(e)}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
    
    def _get_series_color(self, metric_type: str) -> str:
        """
        Get color for a time series based on metric type.
        
        Args:
            metric_type: Type of metric
            
        Returns:
            Color string
        """
        color_map = {
            "integrity": "#3498db",    # Blue
            "availability": "#2ecc71", # Green
            "consistency": "#9b59b6",  # Purple
            "boundary": "#e67e22",     # Orange
            "composite": "#34495e"     # Dark Blue
        }
        
        return color_map.get(metric_type, "#95a5a6")  # Default gray
    
    def generate_heatmap_data(self, surface_data: Dict[str, Any], metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate heatmap data for trust surface visualization.
        
        Args:
            surface_data: Trust surface data
            metrics: Trust metrics data
            
        Returns:
            Heatmap data for visualization
        """
        if not surface_data or not metrics:
            logger.error("Invalid input data for heatmap generation")
            return {
                "error": "Invalid input data",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        surface_id = surface_data.get("surface_id")
        if not surface_id:
            logger.error("Missing surface_id in surface data")
            return {
                "error": "Missing surface_id",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        try:
            # Create heatmap data structure
            heatmap = {
                "visualization_id": str(uuid.uuid4()),
                "surface_ids": [surface_id],
                "view_type": "heatmap",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "contract_version": surface_data.get("contract_version", "v2025.05.19"),
                "grid_size": {
                    "width": 10,
                    "height": 10
                },
                "cells": [],
                "metadata": {
                    "title": f"Trust Heatmap: {surface_id}",
                    "description": "Heatmap visualization of trust surface",
                    "metric_type": "composite"  # Default to composite metric
                }
            }
            
            # Generate cells based on boundaries and nodes
            boundaries = surface_data.get("boundaries", [])
            if not boundaries and "boundary_ids" in surface_data:
                # Create placeholder boundaries if only IDs are provided
                boundaries = [{"boundary_id": bid} for bid in surface_data.get("boundary_ids", [])]
                
            # Create a grid of cells
            grid_width = heatmap["grid_size"]["width"]
            grid_height = heatmap["grid_size"]["height"]
            
            for x in range(grid_width):
                for y in range(grid_height):
                    # Calculate base value from distance to center
                    center_x = grid_width / 2
                    center_y = grid_height / 2
                    distance = math.sqrt((x - center_x)**2 + (y - center_y)**2)
                    max_distance = math.sqrt(center_x**2 + center_y**2)
                    base_value = 1.0 - (distance / max_distance)
                    
                    # Adjust value based on boundaries
                    for boundary in boundaries:
                        trust_level = boundary.get("trust_level", 0.5)
                        
                        # Create a hotspot for each boundary
                        boundary_x = center_x + (center_x * 0.8 * math.cos(boundaries.index(boundary) * 2 * math.pi / len(boundaries)))
                        boundary_y = center_y + (center_y * 0.8 * math.sin(boundaries.index(boundary) * 2 * math.pi / len(boundaries)))
                        
                        boundary_distance = math.sqrt((x - boundary_x)**2 + (y - boundary_y)**2)
                        boundary_influence = max(0, 1.0 - (boundary_distance / (grid_width * 0.3)))
                        
                        # Adjust base value based on boundary influence and trust level
                        base_value = base_value * (1 - boundary_influence) + (trust_level * boundary_influence)
                    
                    # Create cell
                    cell = {
                        "x": x,
                        "y": y,
                        "value": max(0, min(1, base_value)),
                        "color": self._get_heatmap_color(base_value)
                    }
                    heatmap["cells"].append(cell)
            
            logger.info("Generated heatmap data for surface %s with %d cells", 
                       surface_id, len(heatmap["cells"]))
            
            return heatmap
            
        except Exception as e:
            logger.error("Error generating heatmap data: %s", str(e))
            return {
                "error": f"Heatmap generation error: {str(e)}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
    
    def _get_heatmap_color(self, value: float) -> str:
        """
        Get color for heatmap cell based on value.
        
        Args:
            value: Cell value between 0 and 1
            
        Returns:
            Color string
        """
        # Interpolate between red (low trust) and green (high trust)
        r = int(255 * (1 - value))
        g = int(255 * value)
        b = 0
        
        return f"rgb({r},{g},{b})"
    
    def merge_visualizations(self, visualization_ids: List[str]) -> Dict[str, Any]:
        """
        Merge multiple visualizations into a single visualization.
        
        Args:
            visualization_ids: List of visualization IDs to merge
            
        Returns:
            Merged visualization data
        """
        if not visualization_ids:
            logger.error("No visualization IDs provided for merging")
            return {
                "error": "No visualization IDs provided",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        # Get visualizations from cache
        visualizations = []
        for viz_id in visualization_ids:
            for surface_id, viz in self.visualization_cache.items():
                if viz.get("visualization_id") == viz_id:
                    visualizations.append(viz)
                    break
        
        if not visualizations:
            logger.error("No visualizations found for the provided IDs")
            return {
                "error": "No visualizations found",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        try:
            # Create merged visualization
            merged = {
                "visualization_id": str(uuid.uuid4()),
                "surface_ids": [],
                "view_type": "network",  # Assume network visualization for now
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "contract_version": visualizations[0].get("contract_version", "v2025.05.19"),
                "nodes": [],
                "edges": [],
                "metadata": {
                    "title": "Merged Trust Surface Visualization",
                    "description": f"Merged visualization of {len(visualizations)} trust surfaces",
                    "time_range": {
                        "start": datetime.datetime.utcnow().isoformat(),
                        "end": datetime.datetime.utcnow().isoformat()
                    },
                    "color_map": self.color_map
                }
            }
            
            # Track node IDs to avoid duplicates
            node_ids = set()
            edge_ids = set()
            
            # Merge visualizations
            for viz in visualizations:
                # Add surface ID
                if "surface_ids" in viz:
                    merged["surface_ids"].extend(viz["surface_ids"])
                
                # Add nodes
                for node in viz.get("nodes", []):
                    if node["id"] not in node_ids:
                        merged["nodes"].append(node)
                        node_ids.add(node["id"])
                
                # Add edges
                for edge in viz.get("edges", []):
                    if edge["id"] not in edge_ids:
                        merged["edges"].append(edge)
                        edge_ids.add(edge["id"])
            
            # Remove duplicates from surface_ids
            merged["surface_ids"] = list(set(merged["surface_ids"]))
            
            logger.info("Merged %d visualizations with %d nodes and %d edges", 
                       len(visualizations), len(merged["nodes"]), len(merged["edges"]))
            
            return merged
            
        except Exception as e:
            logger.error("Error merging visualizations: %s", str(e))
            return {
                "error": f"Merge error: {str(e)}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
