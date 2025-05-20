"""
Boundary Alerts Component for Trust Surface Dashboard

This component displays trust boundary violation alerts.

Part of Phase 5.7: Trust Surface Visualization and Analytics
"""

import logging
from typing import Dict, Any, List
import datetime

logger = logging.getLogger(__name__)

class BoundaryAlerts:
    """
    Component for displaying trust boundary violation alerts.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the Boundary Alerts component.
        
        Args:
            config: Configuration dictionary for the component
        """
        self.config = config or {}
        self.alerts = []
        self.max_alerts = self.config.get("max_alerts", 50)
        self.filter_severity = None
        self.sort_order = self.config.get("sort_order", "newest")
        logger.info("Boundary Alerts component initialized")
    
    def update_data(self, alerts: List[Dict[str, Any]]) -> None:
        """
        Update the component with new alerts data.
        
        Args:
            alerts: New alerts data
        """
        if alerts:
            self.alerts.extend(alerts)
            # Trim to max alerts
            if len(self.alerts) > self.max_alerts:
                self.alerts = self.alerts[-self.max_alerts:]
        logger.debug("Boundary Alerts updated with %d new alerts", len(alerts) if alerts else 0)
    
    def render(self, container_id: str = "boundary-alerts-container") -> str:
        """
        Render the component.
        
        Args:
            container_id: ID of the container element
            
        Returns:
            HTML representation of the component
        """
        if not self.alerts:
            return f'<div id="{container_id}" class="boundary-alerts-empty">No boundary alerts</div>'
        
        # Sort alerts based on sort order
        sorted_alerts = self._sort_alerts()
        
        # Filter alerts based on severity
        if self.filter_severity:
            filtered_alerts = [a for a in sorted_alerts if a.get("severity") == self.filter_severity]
        else:
            filtered_alerts = sorted_alerts
        
        # In a real implementation, this would generate a complex alerts display
        # For now, we'll return a placeholder
        return f"""
        <div id="{container_id}" class="boundary-alerts">
            <div class="boundary-alerts-header">
                <h3>Boundary Alerts</h3>
                <div class="boundary-alerts-controls">
                    <select class="severity-filter">
                        <option value="">All Severities</option>
                        <option value="info" {"selected" if self.filter_severity == "info" else ""}>Info</option>
                        <option value="warning" {"selected" if self.filter_severity == "warning" else ""}>Warning</option>
                        <option value="critical" {"selected" if self.filter_severity == "critical" else ""}>Critical</option>
                        <option value="emergency" {"selected" if self.filter_severity == "emergency" else ""}>Emergency</option>
                    </select>
                    <select class="sort-order">
                        <option value="newest" {"selected" if self.sort_order == "newest" else ""}>Newest First</option>
                        <option value="oldest" {"selected" if self.sort_order == "oldest" else ""}>Oldest First</option>
                        <option value="severity" {"selected" if self.sort_order == "severity" else ""}>By Severity</option>
                    </select>
                </div>
            </div>
            <div class="boundary-alerts-list">
                {self._render_alerts_list(filtered_alerts)}
            </div>
            <div class="boundary-alerts-footer">
                <span class="alert-count">Showing {len(filtered_alerts)} of {len(self.alerts)} alerts</span>
                <button class="clear-alerts">Clear All</button>
            </div>
        </div>
        """
    
    def _render_alerts_list(self, alerts: List[Dict[str, Any]]) -> str:
        """
        Render the list of alerts.
        
        Args:
            alerts: List of alerts to render
            
        Returns:
            HTML representation of the alerts list
        """
        html = ""
        
        for alert in alerts:
            severity = alert.get("severity", "info")
            timestamp = alert.get("timestamp", datetime.datetime.utcnow().isoformat())
            boundary_id = alert.get("boundary_id", "unknown")
            message = alert.get("message", "Unknown alert")
            
            # Format timestamp for display
            try:
                dt = datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                formatted_time = dt.strftime("%Y-%m-%d %H:%M:%S")
            except (ValueError, TypeError):
                formatted_time = timestamp
            
            html += f"""
            <div class="alert-item {severity}">
                <div class="alert-header">
                    <span class="alert-severity">{severity.upper()}</span>
                    <span class="alert-timestamp">{formatted_time}</span>
                </div>
                <div class="alert-content">
                    <div class="alert-boundary">Boundary: {boundary_id}</div>
                    <div class="alert-message">{message}</div>
                </div>
                <div class="alert-actions">
                    <button class="dismiss-alert" data-alert-id="{alert.get('alert_id', '')}">Dismiss</button>
                    <button class="view-details" data-alert-id="{alert.get('alert_id', '')}">Details</button>
                </div>
            </div>
            """
        
        return html
    
    def _sort_alerts(self) -> List[Dict[str, Any]]:
        """
        Sort alerts based on the current sort order.
        
        Returns:
            Sorted list of alerts
        """
        if self.sort_order == "newest":
            return sorted(
                self.alerts,
                key=lambda a: a.get("timestamp", ""),
                reverse=True
            )
        elif self.sort_order == "oldest":
            return sorted(
                self.alerts,
                key=lambda a: a.get("timestamp", "")
            )
        elif self.sort_order == "severity":
            # Define severity order (highest to lowest)
            severity_order = {
                "emergency": 0,
                "critical": 1,
                "warning": 2,
                "info": 3
            }
            return sorted(
                self.alerts,
                key=lambda a: severity_order.get(a.get("severity", "info"), 999)
            )
        else:
            return self.alerts
    
    def set_filter_severity(self, severity: str) -> Dict[str, Any]:
        """
        Set the severity filter.
        
        Args:
            severity: Severity to filter by (None for all)
            
        Returns:
            Dictionary with filter result
        """
        valid_severities = [None, "info", "warning", "critical", "emergency"]
        if severity not in valid_severities:
            return {
                "error": f"Invalid severity: {severity}",
                "valid_severities": valid_severities
            }
        
        self.filter_severity = severity
        
        return {
            "filter_severity": self.filter_severity,
            "status": "updated",
            "filtered_count": len([a for a in self.alerts if a.get("severity") == severity]) if severity else len(self.alerts)
        }
    
    def set_sort_order(self, order: str) -> Dict[str, Any]:
        """
        Set the sort order for alerts.
        
        Args:
            order: Sort order ("newest", "oldest", "severity")
            
        Returns:
            Dictionary with sort order result
        """
        valid_orders = ["newest", "oldest", "severity"]
        if order not in valid_orders:
            return {
                "error": f"Invalid sort order: {order}",
                "valid_orders": valid_orders
            }
        
        self.sort_order = order
        
        return {
            "sort_order": self.sort_order,
            "status": "updated"
        }
    
    def clear_alerts(self) -> Dict[str, Any]:
        """
        Clear all alerts.
        
        Returns:
            Dictionary with clear result
        """
        cleared_count = len(self.alerts)
        self.alerts = []
        
        return {
            "cleared_count": cleared_count,
            "status": "cleared"
        }
    
    def dismiss_alert(self, alert_id: str) -> Dict[str, Any]:
        """
        Dismiss a specific alert.
        
        Args:
            alert_id: ID of the alert to dismiss
            
        Returns:
            Dictionary with dismiss result
        """
        for i, alert in enumerate(self.alerts):
            if alert.get("alert_id") == alert_id:
                self.alerts.pop(i)
                return {
                    "alert_id": alert_id,
                    "status": "dismissed"
                }
        
        return {
            "alert_id": alert_id,
            "status": "not_found",
            "error": "Alert not found"
        }
