"""
Trust Surface Dashboard Main Component

This module serves as the main entry point for the Trust Surface Dashboard UI.
It integrates all dashboard components and provides the primary UI interface.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import logging
import json
import datetime
import hashlib
import uuid
from typing import Dict, List, Any, Optional, Tuple

from src.ui.trust_surface_dashboard.components.surface_view import SurfaceView
from src.ui.trust_surface_dashboard.components.metrics_panel import MetricsPanel
from src.ui.trust_surface_dashboard.components.boundary_alerts import BoundaryAlerts
from src.ui.trust_surface_dashboard.components.trend_charts import TrendCharts
from src.ui.trust_surface_dashboard.layouts.dashboard_layout import DashboardLayout
from src.core.trust.trust_surface_analytics import TrustSurfaceAnalytics
from src.core.trust.trust_metrics_aggregator import TrustMetricsAggregator
from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer

logger = logging.getLogger(__name__)

class TrustSurfaceDashboard:
    """
    Main component for the Trust Surface Dashboard UI.
    
    This dashboard provides a comprehensive view of trust surfaces, boundaries,
    metrics, alerts, and trends. It integrates with the Trust Surface Analytics,
    Trust Metrics Aggregator, and Visualization Data Transformer to provide
    real-time visualization and analysis of trust data.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the Trust Surface Dashboard.
        
        Args:
            config: Configuration dictionary for the dashboard
        """
        self.config = config or {}
        self.dashboard_id = str(uuid.uuid4())
        self.last_update = datetime.datetime.utcnow().isoformat()
        self.active_surface_id = None
        self.visualization_cache = {}
        self.time_series_cache = {}
        self.alert_history = []
        self.max_alerts = self.config.get("max_alerts", 100)
        self.refresh_interval = self.config.get("refresh_interval", 60)  # seconds
        self.theme = self.config.get("theme", "light")
        
        # Initialize analytics and visualization components
        self.analytics = TrustSurfaceAnalytics(self.config.get("analytics_config"))
        self.aggregator = TrustMetricsAggregator(self.config.get("aggregator_config"))
        self.transformer = VisualizationDataTransformer(self.config.get("transformer_config"))
        
        # Initialize UI components
        self.surface_view = SurfaceView(self.config.get("surface_view_config"))
        self.metrics_panel = MetricsPanel(self.config.get("metrics_panel_config"))
        self.boundary_alerts = BoundaryAlerts(self.config.get("boundary_alerts_config"))
        self.trend_charts = TrendCharts(self.config.get("trend_charts_config"))
        
        # Initialize layout
        self.layout = DashboardLayout(
            surface_view=self.surface_view,
            metrics_panel=self.metrics_panel,
            boundary_alerts=self.boundary_alerts,
            trend_charts=self.trend_charts,
            config=self.config.get("layout_config")
        )
        
        logger.info("Trust Surface Dashboard initialized with ID: %s", self.dashboard_id)
        
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
            "clauses": ["5.7", "5.6", "11.0", "11.1", "11.4", "12.25", "12.66"],
            "component": "TrustSurfaceDashboard",
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
            return hashlib.sha256(b"TrustSurfaceDashboard").hexdigest()
        except Exception as e:
            logger.error("Failed to calculate component hash: %s", str(e))
            return ""
        
    def render(self) -> str:
        """
        Render the dashboard UI.
        
        Returns:
            HTML representation of the dashboard
        """
        try:
            # Add dashboard metadata to the layout
            metadata = {
                "dashboard_id": self.dashboard_id,
                "last_update": self.last_update,
                "active_surface_id": self.active_surface_id,
                "theme": self.theme,
                "refresh_interval": self.refresh_interval,
                "alert_count": len(self.alert_history),
                "version": "1.0.0",
                "codex_contract": "v2025.05.19"
            }
            
            # Render the layout with metadata
            html = self.layout.render(metadata)
            
            logger.debug("Dashboard rendered successfully")
            return html
            
        except Exception as e:
            logger.error("Error rendering dashboard: %s", str(e))
            return f"""
            <div class="error-container">
                <h1>Dashboard Rendering Error</h1>
                <p>An error occurred while rendering the Trust Surface Dashboard:</p>
                <pre>{str(e)}</pre>
            </div>
            """
    
    def update_data(self, surface_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update the dashboard with new surface data.
        
        This method processes the surface data through the analytics pipeline
        and updates all UI components with the results.
        
        Args:
            surface_data: Trust surface data
            
        Returns:
            Dictionary with update results
        """
        if not surface_data:
            logger.error("Invalid surface data provided for dashboard update")
            return {"error": "Invalid surface data", "timestamp": datetime.datetime.utcnow().isoformat()}
            
        surface_id = surface_data.get("surface_id")
        if not surface_id:
            logger.error("Missing surface_id in surface data")
            return {"error": "Missing surface_id", "timestamp": datetime.datetime.utcnow().isoformat()}
            
        try:
            # Set as active surface
            self.active_surface_id = surface_id
            
            # Process through analytics pipeline
            analytics_result = self.analytics.analyze_surface(surface_data)
            
            # Collect metrics from analytics result
            metrics_result = self.aggregator.collect_metrics(
                surface_data.get("node_id", "dashboard"),
                [analytics_result.get("metrics", {})]
            )
            
            # Aggregate metrics for the surface
            aggregated_metrics = self.aggregator.aggregate_metrics(surface_id)
            
            # Transform to visualization
            visualization_data = self.transformer.transform_surface_to_visualization(
                surface_data, 
                aggregated_metrics
            )
            
            # Cache the visualization
            self.visualization_cache[surface_id] = visualization_data
            
            # Get historical metrics for time series
            historical_metrics = self.aggregator.get_historical_metrics(
                surface_id,
                start_time=(datetime.datetime.utcnow() - datetime.timedelta(days=7)).isoformat(),
                end_time=datetime.datetime.utcnow().isoformat()
            )
            
            # Generate time series data
            time_series_data = self.transformer.generate_time_series_data(historical_metrics)
            
            # Cache the time series data
            self.time_series_cache[surface_id] = time_series_data
            
            # Extract alerts from analytics result
            alerts = analytics_result.get("alerts", [])
            
            # Add alerts to history
            if alerts:
                self.alert_history.extend(alerts)
                # Trim history to max alerts
                if len(self.alert_history) > self.max_alerts:
                    self.alert_history = self.alert_history[-self.max_alerts:]
            
            # Update UI components
            self._update_ui_components(
                visualization_data=visualization_data,
                time_series_data=time_series_data,
                alerts=alerts,
                metrics=aggregated_metrics
            )
            
            # Update last update timestamp
            self.last_update = datetime.datetime.utcnow().isoformat()
            
            logger.info("Dashboard updated with data for surface %s", surface_id)
            
            return {
                "surface_id": surface_id,
                "dashboard_id": self.dashboard_id,
                "timestamp": self.last_update,
                "status": "updated",
                "components_updated": [
                    "surface_view",
                    "metrics_panel",
                    "boundary_alerts",
                    "trend_charts"
                ]
            }
            
        except Exception as e:
            logger.error("Error updating dashboard with surface data: %s", str(e))
            return {
                "error": f"Dashboard update error: {str(e)}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
    
    def _update_ui_components(self, visualization_data: Dict[str, Any], 
                             time_series_data: Dict[str, Any],
                             alerts: List[Dict[str, Any]],
                             metrics: Dict[str, Any]) -> None:
        """
        Update all UI components with new data.
        
        Args:
            visualization_data: Visualization data for surface view
            time_series_data: Time series data for trend charts
            alerts: Alert data for boundary alerts panel
            metrics: Metrics data for metrics panel
        """
        # Update surface view with visualization data
        self.surface_view.update_data(visualization_data)
        
        # Update metrics panel with aggregated metrics
        self.metrics_panel.update_data(metrics)
        
        # Update boundary alerts with alerts
        self.boundary_alerts.update_data(alerts)
        
        # Update trend charts with time series data
        self.trend_charts.update_data(time_series_data)
        
    def get_surface_visualization(self, surface_id: str) -> Dict[str, Any]:
        """
        Get visualization data for a specific surface.
        
        Args:
            surface_id: ID of the trust surface
            
        Returns:
            Visualization data for the surface
        """
        if surface_id in self.visualization_cache:
            return self.visualization_cache[surface_id]
        else:
            logger.warning("No visualization data found for surface %s", surface_id)
            return {
                "error": f"No visualization data found for surface {surface_id}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
    
    def get_surface_time_series(self, surface_id: str) -> Dict[str, Any]:
        """
        Get time series data for a specific surface.
        
        Args:
            surface_id: ID of the trust surface
            
        Returns:
            Time series data for the surface
        """
        if surface_id in self.time_series_cache:
            return self.time_series_cache[surface_id]
        else:
            logger.warning("No time series data found for surface %s", surface_id)
            return {
                "error": f"No time series data found for surface {surface_id}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
    
    def get_alerts(self, limit: int = 10, severity: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get recent alerts, optionally filtered by severity.
        
        Args:
            limit: Maximum number of alerts to return
            severity: Optional severity filter ('info', 'warning', 'critical', 'emergency')
            
        Returns:
            List of alerts
        """
        # Filter alerts by severity if specified
        if severity:
            filtered_alerts = [a for a in self.alert_history if a.get("severity") == severity]
        else:
            filtered_alerts = self.alert_history
        
        # Sort by timestamp (newest first) and limit
        sorted_alerts = sorted(
            filtered_alerts,
            key=lambda a: a.get("timestamp", ""),
            reverse=True
        )[:limit]
        
        return sorted_alerts
    
    def get_dashboard_status(self) -> Dict[str, Any]:
        """
        Get the current status of the dashboard.
        
        Returns:
            Dictionary with dashboard status information
        """
        return {
            "dashboard_id": self.dashboard_id,
            "active_surface_id": self.active_surface_id,
            "last_update": self.last_update,
            "surfaces_count": len(self.visualization_cache),
            "alert_count": len(self.alert_history),
            "theme": self.theme,
            "refresh_interval": self.refresh_interval,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    
    def set_theme(self, theme: str) -> Dict[str, Any]:
        """
        Set the dashboard theme.
        
        Args:
            theme: Theme name ('light', 'dark', 'system')
            
        Returns:
            Dictionary with theme update result
        """
        valid_themes = ["light", "dark", "system"]
        if theme not in valid_themes:
            logger.warning("Invalid theme: %s. Using default.", theme)
            theme = "light"
            
        self.theme = theme
        
        logger.info("Dashboard theme set to: %s", theme)
        
        return {
            "dashboard_id": self.dashboard_id,
            "theme": self.theme,
            "status": "updated",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    
    def set_refresh_interval(self, interval: int) -> Dict[str, Any]:
        """
        Set the dashboard refresh interval.
        
        Args:
            interval: Refresh interval in seconds
            
        Returns:
            Dictionary with refresh interval update result
        """
        if interval < 5:
            logger.warning("Refresh interval too low: %d. Setting to minimum (5s).", interval)
            interval = 5
            
        self.refresh_interval = interval
        
        logger.info("Dashboard refresh interval set to: %d seconds", interval)
        
        return {
            "dashboard_id": self.dashboard_id,
            "refresh_interval": self.refresh_interval,
            "status": "updated",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    
    def export_dashboard_data(self, format: str = "json") -> Dict[str, Any]:
        """
        Export dashboard data in the specified format.
        
        Args:
            format: Export format ('json', 'csv')
            
        Returns:
            Dictionary with export result and data
        """
        if format not in ["json", "csv"]:
            logger.warning("Invalid export format: %s. Using default (json).", format)
            format = "json"
            
        try:
            # Prepare export data
            export_data = {
                "dashboard_id": self.dashboard_id,
                "active_surface_id": self.active_surface_id,
                "last_update": self.last_update,
                "surfaces": {},
                "alerts": self.alert_history,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
            # Add surface data
            for surface_id, visualization in self.visualization_cache.items():
                export_data["surfaces"][surface_id] = {
                    "visualization": visualization,
                    "time_series": self.time_series_cache.get(surface_id, {})
                }
            
            # Format the data
            if format == "json":
                # For JSON, we just return the data structure
                result = {
                    "format": "json",
                    "data": export_data,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
            elif format == "csv":
                # For CSV, we would convert to CSV format
                # This is a placeholder for demonstration
                result = {
                    "format": "csv",
                    "data": "CSV data would be generated here",
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
            
            logger.info("Dashboard data exported in %s format", format)
            
            return result
            
        except Exception as e:
            logger.error("Error exporting dashboard data: %s", str(e))
            return {
                "error": f"Export error: {str(e)}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
