"""
Visualization Data Transformer for the Governance Visualization framework.

This module provides functionality to transform governance and trust data
into formats optimized for visualization, ensuring efficient rendering and interaction.

It integrates with all core components to provide optimized data structures
for visualization rendering.
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union
import hashlib

# Import necessary components from previous phases
from src.core.verification.contract_sealer import ContractSealer
from src.core.verification.mutation_detector import MutationDetector

class VisualizationDataTransformer:
    """
    Transforms governance and trust data for visualization.
    
    Integrates with all core components to provide optimized data structures
    for visualization rendering.
    """
    
    def __init__(self, contract_sealer: Optional[ContractSealer] = None):
        """
        Initialize the VisualizationDataTransformer.
        
        Args:
            contract_sealer: Optional ContractSealer for data integrity verification
        """
        self.logger = logging.getLogger(__name__)
        self.contract_sealer = contract_sealer
        self.mutation_detector = MutationDetector() if contract_sealer else None
        
    def transform_governance_data(self, governance_data: Dict[str, Any], 
                                 visualization_type: str = "state") -> Dict[str, Any]:
        """
        Transforms governance data for visualization.
        
        Args:
            governance_data: Raw governance data
            visualization_type: Type of visualization to optimize for
            
        Returns:
            Dict: Transformed data optimized for visualization
        """
        self.logger.info(f"Transforming governance data for {visualization_type} visualization")
        
        # Validate input data
        if not governance_data:
            self.logger.error("Empty governance data provided")
            raise ValueError("Governance data cannot be empty")
        
        # Apply Codex contract tethering if available
        if self.contract_sealer:
            governance_data = self._apply_contract_tethering(governance_data)
        
        # Transform data based on visualization type
        if visualization_type == "state":
            return self._transform_for_state_visualization(governance_data)
        elif visualization_type == "metrics":
            return self._transform_for_metrics_visualization(governance_data)
        elif visualization_type == "health":
            return self._transform_for_health_visualization(governance_data)
        elif visualization_type == "combined":
            return self._transform_for_combined_visualization(governance_data)
        else:
            self.logger.error(f"Unsupported visualization type: {visualization_type}")
            raise ValueError(f"Unsupported visualization type: {visualization_type}")
    
    def transform_trust_metrics(self, trust_metrics: Dict[str, Any],
                               metric_type: str = "decay") -> Dict[str, Any]:
        """
        Transforms trust metrics for visualization.
        
        Args:
            trust_metrics: Raw trust metrics
            metric_type: Type of trust metric to optimize for
            
        Returns:
            Dict: Transformed metrics optimized for visualization
        """
        self.logger.info(f"Transforming trust metrics for {metric_type} visualization")
        
        # Validate input data
        if not trust_metrics:
            self.logger.error("Empty trust metrics provided")
            raise ValueError("Trust metrics cannot be empty")
        
        # Apply Codex contract tethering if available
        if self.contract_sealer:
            trust_metrics = self._apply_contract_tethering(trust_metrics)
        
        # Transform data based on metric type
        if metric_type == "decay":
            return self._transform_for_decay_visualization(trust_metrics)
        elif metric_type == "regeneration":
            return self._transform_for_regeneration_visualization(trust_metrics)
        elif metric_type == "boundary":
            return self._transform_for_boundary_visualization(trust_metrics)
        elif metric_type == "attestation":
            return self._transform_for_attestation_visualization(trust_metrics)
        elif metric_type == "combined":
            return self._transform_for_combined_metrics_visualization(trust_metrics)
        else:
            self.logger.error(f"Unsupported metric type: {metric_type}")
            raise ValueError(f"Unsupported metric type: {metric_type}")
    
    def transform_health_report(self, health_data: Dict[str, Any],
                               report_type: str = "compliance") -> Dict[str, Any]:
        """
        Transforms health report data for visualization.
        
        Args:
            health_data: Raw health report data
            report_type: Type of health report to optimize for
            
        Returns:
            Dict: Transformed health report data optimized for visualization
        """
        self.logger.info(f"Transforming health report data for {report_type} visualization")
        
        # Validate input data
        if not health_data:
            self.logger.error("Empty health report data provided")
            raise ValueError("Health report data cannot be empty")
        
        # Apply Codex contract tethering if available
        if self.contract_sealer:
            health_data = self._apply_contract_tethering(health_data)
        
        # Transform data based on report type
        if report_type == "compliance":
            return self._transform_for_compliance_visualization(health_data)
        elif report_type == "attestation":
            return self._transform_for_attestation_report_visualization(health_data)
        elif report_type == "boundary":
            return self._transform_for_boundary_report_visualization(health_data)
        elif report_type == "expansion":
            return self._transform_for_expansion_visualization(health_data)
        elif report_type == "combined":
            return self._transform_for_combined_report_visualization(health_data)
        else:
            self.logger.error(f"Unsupported report type: {report_type}")
            raise ValueError(f"Unsupported report type: {report_type}")
    
    def optimize_for_rendering(self, data: Dict[str, Any], 
                              chart_type: str,
                              max_data_points: int = 1000) -> Dict[str, Any]:
        """
        Optimizes data for efficient rendering based on chart type.
        
        Args:
            data: Data to optimize
            chart_type: Type of chart for optimization
            max_data_points: Maximum number of data points to include
            
        Returns:
            Dict: Optimized data for rendering
        """
        self.logger.info(f"Optimizing data for {chart_type} rendering")
        
        # Validate input data
        if not data:
            self.logger.error("Empty data provided for optimization")
            raise ValueError("Data cannot be empty")
        
        # Apply optimization based on chart type
        if chart_type in ["line", "area"]:
            return self._optimize_for_time_series(data, max_data_points)
        elif chart_type in ["bar", "pie"]:
            return self._optimize_for_categorical(data, max_data_points)
        elif chart_type == "heatmap":
            return self._optimize_for_heatmap(data, max_data_points)
        elif chart_type in ["network", "sankey"]:
            return self._optimize_for_relational(data, max_data_points)
        else:
            self.logger.error(f"Unsupported chart type for optimization: {chart_type}")
            raise ValueError(f"Unsupported chart type for optimization: {chart_type}")
    
    def _apply_contract_tethering(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies Codex contract tethering to the data.
        
        Args:
            data: Data to apply tethering to
            
        Returns:
            Dict: Data with contract tethering applied
        """
        if not self.contract_sealer:
            return data
        
        # Create a deep copy to avoid modifying the original
        tethered_data = json.loads(json.dumps(data))
        
        # Generate a hash of the data for the seal
        data_str = json.dumps(data, sort_keys=True)
        data_hash = hashlib.sha256(data_str.encode()).hexdigest()
        
        # Create a contract seal
        contract_id = self.contract_sealer.create_contract_id("visualization_data")
        seal = self.contract_sealer.seal_contract(contract_id, data_hash)
        
        # Add tethering information
        tethered_data["codex_tethering"] = {
            "contract_id": contract_id,
            "seal": seal,
            "verification_status": "verified"
        }
        
        return tethered_data
    
    def _transform_for_state_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms data for governance state visualization.
        
        Args:
            data: Raw governance state data
            
        Returns:
            Dict: Transformed data for state visualization
        """
        # Extract relevant state information
        transformed = {
            "visualization_type": "state",
            "data": [],
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process governance primitives
        if "primitives" in data:
            for primitive in data["primitives"]:
                transformed["data"].append({
                    "id": primitive.get("id", ""),
                    "type": primitive.get("type", ""),
                    "status": primitive.get("status", ""),
                    "metrics": primitive.get("metrics", {}),
                    "relationships": primitive.get("relationships", [])
                })
        
        # Process policies
        if "policies" in data:
            transformed["policies"] = []
            for policy in data["policies"]:
                transformed["policies"].append({
                    "id": policy.get("id", ""),
                    "name": policy.get("name", ""),
                    "status": policy.get("status", ""),
                    "enforcement_level": policy.get("enforcement_level", ""),
                    "coverage": policy.get("coverage", 0)
                })
        
        return transformed
    
    def _transform_for_metrics_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms data for governance metrics visualization.
        
        Args:
            data: Raw governance metrics data
            
        Returns:
            Dict: Transformed data for metrics visualization
        """
        # Extract relevant metrics information
        transformed = {
            "visualization_type": "metrics",
            "data": [],
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process metrics
        if "metrics" in data:
            for metric_key, metric_value in data["metrics"].items():
                transformed["data"].append({
                    "name": metric_key,
                    "value": metric_value,
                    "type": self._infer_metric_type(metric_key, metric_value)
                })
        
        return transformed
    
    def _transform_for_health_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms data for governance health visualization.
        
        Args:
            data: Raw governance health data
            
        Returns:
            Dict: Transformed data for health visualization
        """
        # Extract relevant health information
        transformed = {
            "visualization_type": "health",
            "data": {
                "overall_health": data.get("overall_health", 0),
                "issues": [],
                "recommendations": []
            },
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process issues
        if "issues" in data:
            for issue in data["issues"]:
                transformed["data"]["issues"].append({
                    "id": issue.get("id", ""),
                    "severity": issue.get("severity", ""),
                    "description": issue.get("description", ""),
                    "impact": issue.get("impact", 0)
                })
        
        # Process recommendations
        if "recommendations" in data:
            for recommendation in data["recommendations"]:
                transformed["data"]["recommendations"].append({
                    "id": recommendation.get("id", ""),
                    "priority": recommendation.get("priority", ""),
                    "description": recommendation.get("description", ""),
                    "benefit": recommendation.get("benefit", 0)
                })
        
        return transformed
    
    def _transform_for_combined_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms data for combined governance visualization.
        
        Args:
            data: Raw combined governance data
            
        Returns:
            Dict: Transformed data for combined visualization
        """
        # Create a combined visualization with state, metrics, and health
        transformed = {
            "visualization_type": "combined",
            "state": self._transform_for_state_visualization(data).get("data", []),
            "metrics": self._transform_for_metrics_visualization(data).get("data", []),
            "health": self._transform_for_health_visualization(data).get("data", {}),
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        return transformed
    
    def _transform_for_decay_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms trust metrics for decay visualization.
        
        Args:
            data: Raw trust decay metrics
            
        Returns:
            Dict: Transformed data for decay visualization
        """
        # Extract relevant decay information
        transformed = {
            "metric_type": "decay",
            "data": [],
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process decay metrics
        if "decay_metrics" in data:
            for component, metrics in data["decay_metrics"].items():
                transformed["data"].append({
                    "component": component,
                    "current_trust": metrics.get("current_trust", 0),
                    "decay_rate": metrics.get("decay_rate", 0),
                    "time_to_critical": metrics.get("time_to_critical", 0),
                    "history": metrics.get("history", [])
                })
        
        return transformed
    
    def _transform_for_regeneration_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms trust metrics for regeneration visualization.
        
        Args:
            data: Raw trust regeneration metrics
            
        Returns:
            Dict: Transformed data for regeneration visualization
        """
        # Extract relevant regeneration information
        transformed = {
            "metric_type": "regeneration",
            "data": [],
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process regeneration metrics
        if "regeneration_metrics" in data:
            for component, metrics in data["regeneration_metrics"].items():
                transformed["data"].append({
                    "component": component,
                    "current_trust": metrics.get("current_trust", 0),
                    "regeneration_rate": metrics.get("regeneration_rate", 0),
                    "time_to_full": metrics.get("time_to_full", 0),
                    "history": metrics.get("history", [])
                })
        
        return transformed
    
    def _transform_for_boundary_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms trust metrics for boundary visualization.
        
        Args:
            data: Raw trust boundary metrics
            
        Returns:
            Dict: Transformed data for boundary visualization
        """
        # Extract relevant boundary information
        transformed = {
            "metric_type": "boundary",
            "data": [],
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process boundary metrics
        if "boundary_metrics" in data:
            for boundary, metrics in data["boundary_metrics"].items():
                transformed["data"].append({
                    "boundary": boundary,
                    "integrity": metrics.get("integrity", 0),
                    "crossings": metrics.get("crossings", 0),
                    "violations": metrics.get("violations", 0),
                    "history": metrics.get("history", [])
                })
        
        return transformed
    
    def _transform_for_attestation_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms trust metrics for attestation visualization.
        
        Args:
            data: Raw trust attestation metrics
            
        Returns:
            Dict: Transformed data for attestation visualization
        """
        # Extract relevant attestation information
        transformed = {
            "metric_type": "attestation",
            "data": [],
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process attestation metrics
        if "attestation_metrics" in data:
            for component, metrics in data["attestation_metrics"].items():
                transformed["data"].append({
                    "component": component,
                    "validity": metrics.get("validity", 0),
                    "claims": metrics.get("claims", 0),
                    "verifications": metrics.get("verifications", 0),
                    "history": metrics.get("history", [])
                })
        
        return transformed
    
    def _transform_for_combined_metrics_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms trust metrics for combined metrics visualization.
        
        Args:
            data: Raw combined trust metrics
            
        Returns:
            Dict: Transformed data for combined metrics visualization
        """
        # Create a combined metrics visualization
        transformed = {
            "metric_type": "combined",
            "decay": self._transform_for_decay_visualization(data).get("data", []),
            "regeneration": self._transform_for_regeneration_visualization(data).get("data", []),
            "boundary": self._transform_for_boundary_visualization(data).get("data", []),
            "attestation": self._transform_for_attestation_visualization(data).get("data", []),
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        return transformed
    
    def _transform_for_compliance_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms health report data for compliance visualization.
        
        Args:
            data: Raw compliance health report data
            
        Returns:
            Dict: Transformed data for compliance visualization
        """
        # Extract relevant compliance information
        transformed = {
            "report_type": "compliance",
            "data": {
                "overall_compliance": data.get("overall_compliance", 0),
                "components": []
            },
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process component compliance
        if "components" in data:
            for component, compliance in data["components"].items():
                transformed["data"]["components"].append({
                    "name": component,
                    "compliance_level": compliance.get("level", 0),
                    "violations": compliance.get("violations", 0),
                    "requirements": compliance.get("requirements", 0),
                    "details": compliance.get("details", {})
                })
        
        return transformed
    
    def _transform_for_attestation_report_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms health report data for attestation report visualization.
        
        Args:
            data: Raw attestation health report data
            
        Returns:
            Dict: Transformed data for attestation report visualization
        """
        # Extract relevant attestation report information
        transformed = {
            "report_type": "attestation",
            "data": {
                "overall_attestation": data.get("overall_attestation", 0),
                "attestations": []
            },
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process attestations
        if "attestations" in data:
            for attestation in data["attestations"]:
                transformed["data"]["attestations"].append({
                    "id": attestation.get("id", ""),
                    "status": attestation.get("status", ""),
                    "validity": attestation.get("validity", 0),
                    "claims": attestation.get("claims", 0),
                    "details": attestation.get("details", {})
                })
        
        return transformed
    
    def _transform_for_boundary_report_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms health report data for boundary report visualization.
        
        Args:
            data: Raw boundary health report data
            
        Returns:
            Dict: Transformed data for boundary report visualization
        """
        # Extract relevant boundary report information
        transformed = {
            "report_type": "boundary",
            "data": {
                "overall_integrity": data.get("overall_integrity", 0),
                "boundaries": []
            },
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process boundaries
        if "boundaries" in data:
            for boundary in data["boundaries"]:
                transformed["data"]["boundaries"].append({
                    "id": boundary.get("id", ""),
                    "integrity": boundary.get("integrity", 0),
                    "crossings": boundary.get("crossings", 0),
                    "violations": boundary.get("violations", 0),
                    "details": boundary.get("details", {})
                })
        
        return transformed
    
    def _transform_for_expansion_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms health report data for expansion visualization.
        
        Args:
            data: Raw expansion health report data
            
        Returns:
            Dict: Transformed data for expansion visualization
        """
        # Extract relevant expansion information
        transformed = {
            "report_type": "expansion",
            "data": {
                "overall_expansion": data.get("overall_expansion", 0),
                "modules": []
            },
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        # Process modules
        if "modules" in data:
            for module in data["modules"]:
                transformed["data"]["modules"].append({
                    "id": module.get("id", ""),
                    "status": module.get("status", ""),
                    "compatibility": module.get("compatibility", 0),
                    "lifecycle_stage": module.get("lifecycle_stage", ""),
                    "details": module.get("details", {})
                })
        
        return transformed
    
    def _transform_for_combined_report_visualization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms health report data for combined report visualization.
        
        Args:
            data: Raw combined health report data
            
        Returns:
            Dict: Transformed data for combined report visualization
        """
        # Create a combined report visualization
        transformed = {
            "report_type": "combined",
            "compliance": self._transform_for_compliance_visualization(data).get("data", {}),
            "attestation": self._transform_for_attestation_report_visualization(data).get("data", {}),
            "boundary": self._transform_for_boundary_report_visualization(data).get("data", {}),
            "expansion": self._transform_for_expansion_visualization(data).get("data", {}),
            "metadata": {
                "timestamp": data.get("timestamp", ""),
                "version": data.get("version", "1.0.0")
            }
        }
        
        return transformed
    
    def _optimize_for_time_series(self, data: Dict[str, Any], max_points: int) -> Dict[str, Any]:
        """
        Optimizes time series data for visualization.
        
        Args:
            data: Time series data to optimize
            max_points: Maximum number of data points
            
        Returns:
            Dict: Optimized time series data
        """
        optimized = {
            "type": "time_series",
            "data": data.copy()
        }
        
        # Check if we need to downsample
        if "data" in data and isinstance(data["data"], list):
            series_data = data["data"]
            if len(series_data) > max_points:
                # Simple downsampling by selecting evenly spaced points
                step = len(series_data) // max_points
                optimized["data"]["data"] = series_data[::step]
                
                # Ensure we include the last point
                if optimized["data"]["data"][-1] != series_data[-1]:
                    optimized["data"]["data"].append(series_data[-1])
        
        return optimized
    
    def _optimize_for_categorical(self, data: Dict[str, Any], max_points: int) -> Dict[str, Any]:
        """
        Optimizes categorical data for visualization.
        
        Args:
            data: Categorical data to optimize
            max_points: Maximum number of categories
            
        Returns:
            Dict: Optimized categorical data
        """
        optimized = {
            "type": "categorical",
            "data": data.copy()
        }
        
        # Check if we need to consolidate categories
        if "data" in data and isinstance(data["data"], list):
            categories = data["data"]
            if len(categories) > max_points:
                # Sort by value (assuming each category has a value)
                sorted_categories = sorted(categories, key=lambda x: x.get("value", 0), reverse=True)
                
                # Keep top categories and consolidate the rest
                top_categories = sorted_categories[:max_points-1]
                other_categories = sorted_categories[max_points-1:]
                
                # Create "Other" category
                other_value = sum(cat.get("value", 0) for cat in other_categories)
                other_category = {
                    "name": "Other",
                    "value": other_value
                }
                
                optimized["data"]["data"] = top_categories + [other_category]
        
        return optimized
    
    def _optimize_for_heatmap(self, data: Dict[str, Any], max_points: int) -> Dict[str, Any]:
        """
        Optimizes heatmap data for visualization.
        
        Args:
            data: Heatmap data to optimize
            max_points: Maximum number of cells
            
        Returns:
            Dict: Optimized heatmap data
        """
        optimized = {
            "type": "heatmap",
            "data": data.copy()
        }
        
        # Check if we need to reduce resolution
        if "data" in data and isinstance(data["data"], list):
            cells = data["data"]
            total_cells = len(cells)
            
            if total_cells > max_points:
                # Determine new grid dimensions
                old_width = data.get("width", int(total_cells ** 0.5))
                old_height = data.get("height", total_cells // old_width)
                
                # Calculate scaling factor
                scale_factor = (max_points / total_cells) ** 0.5
                new_width = max(1, int(old_width * scale_factor))
                new_height = max(1, int(old_height * scale_factor))
                
                # Create new grid with reduced resolution
                new_cells = []
                for y in range(new_height):
                    for x in range(new_width):
                        # Map to original grid
                        x1 = int(x * old_width / new_width)
                        y1 = int(y * old_height / new_height)
                        x2 = int((x + 1) * old_width / new_width)
                        y2 = int((y + 1) * old_height / new_height)
                        
                        # Aggregate values in this region
                        region_cells = [
                            cells[i * old_width + j]
                            for i in range(y1, min(y2, old_height))
                            for j in range(x1, min(x2, old_width))
                            if i * old_width + j < total_cells
                        ]
                        
                        if region_cells:
                            # Average the values
                            avg_value = sum(cell.get("value", 0) for cell in region_cells) / len(region_cells)
                            new_cells.append({
                                "x": x,
                                "y": y,
                                "value": avg_value
                            })
                
                optimized["data"]["data"] = new_cells
                optimized["data"]["width"] = new_width
                optimized["data"]["height"] = new_height
        
        return optimized
    
    def _optimize_for_relational(self, data: Dict[str, Any], max_points: int) -> Dict[str, Any]:
        """
        Optimizes relational data for visualization.
        
        Args:
            data: Relational data to optimize
            max_points: Maximum number of nodes
            
        Returns:
            Dict: Optimized relational data
        """
        optimized = {
            "type": "relational",
            "data": data.copy()
        }
        
        # Check if we need to reduce nodes
        if "nodes" in data and isinstance(data["nodes"], list):
            nodes = data["nodes"]
            edges = data.get("edges", [])
            
            if len(nodes) > max_points:
                # Sort nodes by importance (assuming each node has a weight or degree)
                node_importance = {}
                for node in nodes:
                    node_id = node.get("id", "")
                    # Count connections as a measure of importance
                    connections = sum(1 for edge in edges if edge.get("source") == node_id or edge.get("target") == node_id)
                    node_importance[node_id] = connections
                
                # Sort nodes by importance
                sorted_nodes = sorted(nodes, key=lambda x: node_importance.get(x.get("id", ""), 0), reverse=True)
                
                # Keep top nodes
                top_nodes = sorted_nodes[:max_points]
                top_node_ids = {node.get("id", "") for node in top_nodes}
                
                # Filter edges to only include connections between top nodes
                filtered_edges = [
                    edge for edge in edges
                    if edge.get("source", "") in top_node_ids and edge.get("target", "") in top_node_ids
                ]
                
                optimized["data"]["nodes"] = top_nodes
                optimized["data"]["edges"] = filtered_edges
        
        return optimized
    
    def _infer_metric_type(self, metric_name: str, metric_value: Any) -> str:
        """
        Infers the type of a metric based on its name and value.
        
        Args:
            metric_name: Name of the metric
            metric_value: Value of the metric
            
        Returns:
            str: Inferred metric type
        """
        # Check value type
        if isinstance(metric_value, bool):
            return "boolean"
        elif isinstance(metric_value, (int, float)):
            # Check for percentage
            if "percent" in metric_name.lower() or "ratio" in metric_name.lower():
                return "percentage"
            # Check for time
            elif "time" in metric_name.lower() or "duration" in metric_name.lower():
                return "time"
            # Default to number
            return "number"
        elif isinstance(metric_value, str):
            return "string"
        elif isinstance(metric_value, list):
            return "array"
        elif isinstance(metric_value, dict):
            return "object"
        else:
            return "unknown"
