"""
Metrics Panel Component for Trust Surface Dashboard

This component displays trust metrics and statistics.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class MetricsPanel:
    """
    Component for displaying trust metrics and statistics.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the Metrics Panel component.
        
        Args:
            config: Configuration dictionary for the component
        """
        self.config = config or {}
        self.metrics_data = None
        self.display_mode = self.config.get("display_mode", "summary")
        self.selected_metric_type = None
        logger.info("Metrics Panel component initialized")
    
    def update_data(self, metrics_data: Dict[str, Any]) -> None:
        """
        Update the component with new metrics data.
        
        Args:
            metrics_data: New metrics data
        """
        self.metrics_data = metrics_data
        logger.debug("Metrics Panel updated with new data")
    
    def render(self, container_id: str = "metrics-panel-container") -> str:
        """
        Render the component.
        
        Args:
            container_id: ID of the container element
            
        Returns:
            HTML representation of the component
        """
        if not self.metrics_data:
            return f'<div id="{container_id}" class="metrics-panel-empty">No metrics data available</div>'
        
        # In a real implementation, this would generate a complex metrics display
        # For now, we'll return a placeholder
        return f"""
        <div id="{container_id}" class="metrics-panel">
            <div class="metrics-panel-header">
                <h3>Trust Metrics</h3>
                <div class="metrics-panel-controls">
                    <select class="display-mode">
                        <option value="summary" {"selected" if self.display_mode == "summary" else ""}>Summary</option>
                        <option value="detailed" {"selected" if self.display_mode == "detailed" else ""}>Detailed</option>
                        <option value="chart" {"selected" if self.display_mode == "chart" else ""}>Chart</option>
                    </select>
                </div>
            </div>
            <div class="metrics-panel-content">
                {self._render_metrics_content()}
            </div>
        </div>
        """
    
    def _render_metrics_content(self) -> str:
        """
        Render the metrics content based on display mode.
        
        Returns:
            HTML representation of the metrics content
        """
        if self.display_mode == "summary":
            return self._render_summary_view()
        elif self.display_mode == "detailed":
            return self._render_detailed_view()
        elif self.display_mode == "chart":
            return self._render_chart_view()
        else:
            return "<div class='error'>Invalid display mode</div>"
    
    def _render_summary_view(self) -> str:
        """
        Render the summary view of metrics.
        
        Returns:
            HTML representation of the summary view
        """
        # Extract aggregated metrics if available
        aggregated = self.metrics_data.get("aggregated_metrics", {})
        
        # Create summary HTML
        html = "<div class='metrics-summary'>"
        
        # Add metrics cards
        for metric_type, values in aggregated.items():
            if "mean" in values:
                value = values["mean"]
                color_class = self._get_trust_level_class(value)
                html += f"""
                <div class="metric-card {color_class}">
                    <div class="metric-title">{metric_type.capitalize()}</div>
                    <div class="metric-value">{value:.2f}</div>
                    <div class="metric-range">
                        <span class="min">{values.get("min", 0):.2f}</span>
                        <span class="max">{values.get("max", 1):.2f}</span>
                    </div>
                </div>
                """
        
        html += "</div>"
        return html
    
    def _render_detailed_view(self) -> str:
        """
        Render the detailed view of metrics.
        
        Returns:
            HTML representation of the detailed view
        """
        # Create detailed HTML with tables
        html = "<div class='metrics-detailed'>"
        
        # Add metrics tables
        html += "<table class='metrics-table'>"
        html += "<thead><tr><th>Metric</th><th>Mean</th><th>Min</th><th>Max</th><th>Count</th></tr></thead>"
        html += "<tbody>"
        
        # Extract aggregated metrics if available
        aggregated = self.metrics_data.get("aggregated_metrics", {})
        
        for metric_type, values in aggregated.items():
            html += f"""
            <tr>
                <td>{metric_type.capitalize()}</td>
                <td>{values.get("mean", 0):.2f}</td>
                <td>{values.get("min", 0):.2f}</td>
                <td>{values.get("max", 0):.2f}</td>
                <td>{values.get("count", 0)}</td>
            </tr>
            """
        
        html += "</tbody></table>"
        html += "</div>"
        return html
    
    def _render_chart_view(self) -> str:
        """
        Render the chart view of metrics.
        
        Returns:
            HTML representation of the chart view
        """
        # In a real implementation, this would generate chart elements
        # For now, we'll return a placeholder
        return """
        <div class='metrics-chart'>
            <canvas id="metrics-chart-canvas" width="400" height="200"></canvas>
            <div class="chart-legend">
                <div class="legend-item">
                    <span class="color-box integrity"></span>
                    <span class="legend-label">Integrity</span>
                </div>
                <div class="legend-item">
                    <span class="color-box availability"></span>
                    <span class="legend-label">Availability</span>
                </div>
                <div class="legend-item">
                    <span class="color-box consistency"></span>
                    <span class="legend-label">Consistency</span>
                </div>
            </div>
        </div>
        """
    
    def _get_trust_level_class(self, value: float) -> str:
        """
        Get the CSS class for a trust level.
        
        Args:
            value: Trust value (0.0 to 1.0)
            
        Returns:
            CSS class name
        """
        if value >= 0.8:
            return "high-trust"
        elif value >= 0.5:
            return "medium-trust"
        else:
            return "low-trust"
    
    def set_display_mode(self, mode: str) -> Dict[str, Any]:
        """
        Set the display mode of the metrics panel.
        
        Args:
            mode: Display mode ("summary", "detailed", "chart")
            
        Returns:
            Dictionary with display mode result
        """
        valid_modes = ["summary", "detailed", "chart"]
        if mode not in valid_modes:
            return {
                "error": f"Invalid display mode: {mode}",
                "valid_modes": valid_modes
            }
        
        self.display_mode = mode
        
        return {
            "display_mode": self.display_mode,
            "status": "updated"
        }
    
    def select_metric_type(self, metric_type: str) -> Dict[str, Any]:
        """
        Select a metric type to focus on.
        
        Args:
            metric_type: Type of metric to select
            
        Returns:
            Dictionary with selection result
        """
        self.selected_metric_type = metric_type
        
        # Check if the metric type exists in the data
        if self.metrics_data and "aggregated_metrics" in self.metrics_data:
            if metric_type in self.metrics_data["aggregated_metrics"]:
                return {
                    "metric_type": metric_type,
                    "selected": True,
                    "metric_data": self.metrics_data["aggregated_metrics"][metric_type]
                }
        
        return {
            "metric_type": metric_type,
            "selected": False,
            "error": "Metric type not found in metrics data"
        }
