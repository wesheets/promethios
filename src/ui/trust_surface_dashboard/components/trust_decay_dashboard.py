#!/usr/bin/env python3
"""
Trust Decay Dashboard UI Component for Promethios Phase 5.9

This module implements the UI components for the Trust Decay Engine visualization
in the Trust Surface Dashboard.

Codex Contract: v2025.05.21
Phase ID: 5.9
"""

import json
import os
import re
import logging
import dash
from dash import dcc, html, callback, Input, Output, State
import plotly.graph_objs as go
import plotly.express as px
import pandas as pd
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrustDecayDashboard:
    """
    Implements UI components for the Trust Decay Engine visualization.
    
    This component extends the Trust Surface Dashboard with decay-specific
    visualizations, including trust level trends, decay events, and alerts.
    
    Codex Contract: v2025.05.21
    Phase ID: 5.9
    """
    
    def __init__(self, trust_decay_visualization, config=None):
        """
        Initialize the Trust Decay Dashboard with visualization component.
        
        Args:
            trust_decay_visualization (TrustDecayVisualization): Instance of TrustDecayVisualization
            config (dict, optional): Configuration dictionary for dashboard parameters
        """
        # Codex contract tethering
        self.contract_version = "v2025.05.21"
        self.phase_id = "5.9"
        self.codex_clauses = ["5.9", "11.3", "11.7"]
        
        # Store visualization component
        self.visualization = trust_decay_visualization
        
        # Initialize configuration
        self.config = config or self._load_default_config()
        
        # Perform pre-loop tether check
        if not self._pre_loop_tether_check():
            raise ValueError("Pre-loop tether check failed for TrustDecayDashboard")
        
        logger.info("TrustDecayDashboard initialized with contract version %s", self.contract_version)
    
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
            
        # Verify visualization component
        if not self.visualization:
            logger.error("Missing visualization component")
            return False
            
        return True
    
    def _load_default_config(self):
        """
        Load default configuration for the Trust Decay Dashboard.
        
        Returns:
            dict: Default configuration dictionary.
        """
        return {
            "dashboard": {
                "refresh_interval_seconds": 30,
                "max_alerts_displayed": 10,
                "max_events_displayed": 20,
                "default_view": "overview"
            }
        }
    
    def create_dashboard_layout(self):
        """
        Create the dashboard layout.
        
        Returns:
            html.Div: Dashboard layout
        """
        return html.Div([
            html.Div([
                html.H2("Trust Decay Dashboard", className="dashboard-title"),
                html.Div([
                    html.Button("Refresh", id="refresh-button", className="refresh-button"),
                    dcc.Dropdown(
                        id="view-selector",
                        options=[
                            {"label": "Overview", "value": "overview"},
                            {"label": "Entity Details", "value": "entity-details"},
                            {"label": "Alerts", "value": "alerts"},
                            {"label": "Events", "value": "events"}
                        ],
                        value=self.config["dashboard"]["default_view"],
                        clearable=False,
                        className="view-selector"
                    )
                ], className="dashboard-controls")
            ], className="dashboard-header"),
            
            dcc.Loading(
                id="loading-indicator",
                type="circle",
                children=[
                    html.Div(id="dashboard-content", className="dashboard-content")
                ]
            ),
            
            dcc.Interval(
                id="refresh-interval",
                interval=self.config["dashboard"]["refresh_interval_seconds"] * 1000,
                n_intervals=0
            ),
            
            # Store for selected entity
            dcc.Store(id="selected-entity-store"),
            
            # Store for dashboard data
            dcc.Store(id="dashboard-data-store")
        ], className="trust-decay-dashboard")
    
    def register_callbacks(self, app):
        """
        Register dashboard callbacks.
        
        Args:
            app: Dash application instance
        """
        @app.callback(
            Output("dashboard-data-store", "data"),
            [Input("refresh-interval", "n_intervals"),
             Input("refresh-button", "n_clicks")]
        )
        def update_dashboard_data(n_intervals, n_clicks):
            """Update dashboard data."""
            try:
                # Get dashboard data
                dashboard_data = self.visualization.get_trust_decay_dashboard_data()
                
                # Get trust surface overlay
                overlay_data = self.visualization.get_trust_surface_overlay()
                
                # Combine data
                combined_data = {
                    "dashboard": dashboard_data,
                    "overlay": overlay_data,
                    "timestamp": datetime.now().isoformat()
                }
                
                return combined_data
            except Exception as e:
                logger.error("Error updating dashboard data: %s", str(e))
                return {"error": str(e)}
        
        @app.callback(
            Output("dashboard-content", "children"),
            [Input("dashboard-data-store", "data"),
             Input("view-selector", "value"),
             Input("selected-entity-store", "data")]
        )
        def update_dashboard_content(data, view, selected_entity):
            """Update dashboard content based on selected view."""
            if not data or "error" in data:
                return html.Div([
                    html.H3("Error loading dashboard data"),
                    html.P(data.get("error", "Unknown error"))
                ], className="error-message")
            
            if view == "overview":
                return self._create_overview_layout(data["dashboard"], data["overlay"])
            elif view == "entity-details":
                if not selected_entity:
                    return html.Div([
                        html.H3("Select an entity"),
                        html.P("Please select an entity from the trust surface to view details.")
                    ], className="info-message")
                
                entity_id = selected_entity.get("entity_id")
                entity_data = self.visualization.get_entity_trust_data(entity_id)
                
                if not entity_data:
                    return html.Div([
                        html.H3(f"Entity not found: {entity_id}"),
                        html.P("The selected entity could not be found or has no trust data.")
                    ], className="error-message")
                
                return self._create_entity_details_layout(entity_data)
            elif view == "alerts":
                return self._create_alerts_layout(data["dashboard"]["recent_alerts"])
            elif view == "events":
                return self._create_events_layout(data["dashboard"]["recent_events"])
            else:
                return html.Div([
                    html.H3(f"Unknown view: {view}"),
                    html.P("Please select a valid view.")
                ], className="error-message")
        
        @app.callback(
            Output("selected-entity-store", "data"),
            [Input("entity-select", "value")]
        )
        def update_selected_entity(entity_id):
            """Update selected entity."""
            if not entity_id:
                return None
            
            return {"entity_id": entity_id}
    
    def _create_overview_layout(self, dashboard_data, overlay_data):
        """
        Create overview layout.
        
        Args:
            dashboard_data (dict): Dashboard data
            overlay_data (dict): Trust surface overlay data
            
        Returns:
            html.Div: Overview layout
        """
        # Create entity options for dropdown
        entity_options = [
            {"label": entity_id, "value": entity_id}
            for entity_id in overlay_data["entities"].keys()
        ]
        
        # Create trust distribution chart
        distribution = dashboard_data["trust_distribution"]
        distribution_fig = go.Figure(data=[
            go.Pie(
                labels=distribution["labels"],
                values=distribution["values"],
                marker=dict(colors=distribution["colors"]),
                hole=0.4
            )
        ])
        distribution_fig.update_layout(
            title="Trust Level Distribution",
            margin=dict(l=20, r=20, t=40, b=20)
        )
        
        return html.Div([
            html.Div([
                html.Div([
                    html.Div([
                        html.H3("Trust Overview"),
                        html.Div([
                            html.Div([
                                html.H4(dashboard_data["entity_count"]),
                                html.P("Entities")
                            ], className="stat-box"),
                            html.Div([
                                html.H4(dashboard_data["alert_count"]),
                                html.P("Active Alerts")
                            ], className="stat-box alert-stat"),
                            html.Div([
                                html.H4(dashboard_data["critical_entities"]),
                                html.P("Critical Entities")
                            ], className="stat-box critical-stat"),
                            html.Div([
                                html.H4(dashboard_data["high_trust_entities"]),
                                html.P("High Trust Entities")
                            ], className="stat-box high-trust-stat")
                        ], className="stat-container")
                    ], className="overview-header"),
                    
                    html.Div([
                        html.H3("Entity Selection"),
                        dcc.Dropdown(
                            id="entity-select",
                            options=entity_options,
                            placeholder="Select an entity to view details",
                            className="entity-select-dropdown"
                        )
                    ], className="entity-selector"),
                    
                    html.Div([
                        dcc.Graph(
                            id="trust-distribution-chart",
                            figure=distribution_fig,
                            config={"displayModeBar": False}
                        )
                    ], className="distribution-chart")
                ], className="overview-left-panel"),
                
                html.Div([
                    html.Div([
                        html.H3("Recent Alerts"),
                        self._create_alerts_table(dashboard_data["recent_alerts"][:5])
                    ], className="recent-alerts-panel"),
                    
                    html.Div([
                        html.H3("Recent Events"),
                        self._create_events_table(dashboard_data["recent_events"][:5])
                    ], className="recent-events-panel")
                ], className="overview-right-panel")
            ], className="overview-container")
        ], className="overview-layout")
    
    def _create_entity_details_layout(self, entity_data):
        """
        Create entity details layout.
        
        Args:
            entity_data (dict): Entity trust data
            
        Returns:
            html.Div: Entity details layout
        """
        # Create trust level trend chart
        history = entity_data["aggregate_history"]
        trend_fig = go.Figure()
        
        if history["timestamps"]:
            # Add raw values
            trend_fig.add_trace(go.Scatter(
                x=history["timestamps"],
                y=history["values"],
                mode="lines+markers",
                name="Trust Level",
                line=dict(color="#B0BEC5", width=1, dash="dot"),
                marker=dict(size=3)
            ))
            
            # Add smoothed values
            trend_fig.add_trace(go.Scatter(
                x=history["timestamps"],
                y=history["smoothed_values"],
                mode="lines",
                name="Trend",
                line=dict(color=entity_data["color"], width=3)
            ))
            
            # Add threshold lines
            thresholds = self.visualization.config["visualization"]["thresholds"]
            for label, value in thresholds.items():
                trend_fig.add_shape(
                    type="line",
                    x0=min(history["timestamps"]),
                    y0=value,
                    x1=max(history["timestamps"]),
                    y1=value,
                    line=dict(
                        color=self.visualization.config["visualization"]["color_scheme"][label],
                        width=1,
                        dash="dash"
                    )
                )
        
        trend_fig.update_layout(
            title="Trust Level Trend",
            xaxis_title="Time",
            yaxis_title="Trust Level",
            yaxis=dict(range=[0, 1]),
            margin=dict(l=20, r=20, t=40, b=20),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        
        # Create dimension comparison chart
        dimensions = entity_data["dimensions"]
        dimension_fig = go.Figure()
        
        if dimensions:
            dimension_fig.add_trace(go.Bar(
                x=list(dimensions.keys()),
                y=list(dimensions.values()),
                marker_color=[
                    self.visualization.config["visualization"]["color_scheme"][
                        self._get_trust_category_for_value(value)
                    ]
                    for value in dimensions.values()
                ]
            ))
        
        dimension_fig.update_layout(
            title="Trust Dimensions",
            xaxis_title="Dimension",
            yaxis_title="Trust Level",
            yaxis=dict(range=[0, 1]),
            margin=dict(l=20, r=20, t=40, b=20)
        )
        
        # Format first seen date
        first_seen = datetime.fromisoformat(entity_data["first_seen"])
        first_seen_str = first_seen.strftime("%Y-%m-%d %H:%M:%S")
        
        # Format trend direction
        trend = entity_data["trend"]
        trend_icon = "↑" if trend["direction"] == "improving" else (
            "↓" if trend["direction"] == "declining" else "→"
        )
        trend_color = "#4CAF50" if trend["direction"] == "improving" else (
            "#F44336" if trend["direction"] == "declining" else "#9E9E9E"
        )
        
        return html.Div([
            html.Div([
                html.H3(f"Entity: {entity_data['entity_id']}"),
                html.Div([
                    html.Div([
                        html.H4(f"{entity_data['trust_level']:.2f}"),
                        html.P("Trust Level")
                    ], className="stat-box", style={"background-color": entity_data["color"]}),
                    html.Div([
                        html.H4(entity_data["trust_category"].replace("_", " ").title()),
                        html.P("Category")
                    ], className="stat-box"),
                    html.Div([
                        html.H4(f"{trend_icon} {trend['percentage']:.1f}%", style={"color": trend_color}),
                        html.P("Trend")
                    ], className="stat-box"),
                    html.Div([
                        html.H4(first_seen_str),
                        html.P("First Seen")
                    ], className="stat-box")
                ], className="stat-container")
            ], className="entity-details-header"),
            
            html.Div([
                html.Div([
                    dcc.Graph(
                        id="trust-trend-chart",
                        figure=trend_fig,
                        config={"displayModeBar": False}
                    )
                ], className="trend-chart-container"),
                
                html.Div([
                    dcc.Graph(
                        id="dimension-chart",
                        figure=dimension_fig,
                        config={"displayModeBar": False}
                    )
                ], className="dimension-chart-container")
            ], className="charts-container"),
            
            html.Div([
                html.Div([
                    html.H3("Active Alerts"),
                    self._create_alerts_table(entity_data["active_alerts"])
                ], className="entity-alerts-panel"),
                
                html.Div([
                    html.H3("Recent Events"),
                    self._create_events_table(entity_data["recent_events"])
                ], className="entity-events-panel")
            ], className="entity-details-bottom")
        ], className="entity-details-layout")
    
    def _create_alerts_layout(self, alerts):
        """
        Create alerts layout.
        
        Args:
            alerts (list): Alert data
            
        Returns:
            html.Div: Alerts layout
        """
        return html.Div([
            html.H3("Trust Alerts"),
            html.P(f"Showing {len(alerts)} alerts"),
            self._create_alerts_table(alerts, show_all=True)
        ], className="alerts-layout")
    
    def _create_events_layout(self, events):
        """
        Create events layout.
        
        Args:
            events (list): Event data
            
        Returns:
            html.Div: Events layout
        """
        return html.Div([
            html.H3("Trust Events"),
            html.P(f"Showing {len(events)} events"),
            self._create_events_table(events, show_all=True)
        ], className="events-layout")
    
    def _create_alerts_table(self, alerts, show_all=False):
        """
        Create alerts table.
        
        Args:
            alerts (list): Alert data
            show_all (bool, optional): Whether to show all details
            
        Returns:
            html.Table: Alerts table
        """
        if not alerts:
            return html.Div("No alerts", className="no-data-message")
        
        headers = ["Level", "Entity", "Message", "Time"]
        if show_all:
            headers.extend(["Alert ID", "Value", "Threshold"])
        
        return html.Table([
            html.Thead(
                html.Tr([html.Th(header) for header in headers])
            ),
            html.Tbody([
                html.Tr([
                    html.Td(
                        html.Div(alert["level"].upper(), className=f"alert-level {alert['level']}"),
                        style={"background-color": alert["color"]}
                    ),
                    html.Td(alert["entity_id"]),
                    html.Td(alert["message"]),
                    html.Td(self._format_timestamp(alert["timestamp"])),
                    *([
                        html.Td(alert["alert_id"]),
                        html.Td(f"{alert['value']:.2f}"),
                        html.Td(f"{alert['threshold']:.2f}")
                    ] if show_all else [])
                ], className=f"alert-row {alert['level']}")
                for alert in alerts
            ])
        ], className="alerts-table")
    
    def _create_events_table(self, events, show_all=False):
        """
        Create events table.
        
        Args:
            events (list): Event data
            show_all (bool, optional): Whether to show all details
            
        Returns:
            html.Table: Events table
        """
        if not events:
            return html.Div("No events", className="no-data-message")
        
        headers = ["Type", "Entity", "Change", "Time"]
        if show_all:
            headers.extend(["Details", "Old Value", "New Value"])
        
        return html.Table([
            html.Thead(
                html.Tr([html.Th(header) for header in headers])
            ),
            html.Tbody([
                html.Tr([
                    html.Td(
                        html.Div(
                            f"{event['event_type'].title()}: {event.get(event['event_type'] + '_type', '').replace('_', ' ').title()}",
                            className=f"event-type {event['event_type']}"
                        ),
                        style={"background-color": event["color"]}
                    ),
                    html.Td(event["entity_id"]),
                    html.Td(
                        f"{'+' if event['event_type'] == 'regeneration' else '-'}{abs(event['change']):.2f}",
                        style={"color": "#4CAF50" if event['event_type'] == 'regeneration' else "#F44336"}
                    ),
                    html.Td(self._format_timestamp(event["timestamp"])),
                    *([
                        html.Td(str(event["details"])),
                        html.Td(f"{event['old_trust']:.2f}"),
                        html.Td(f"{event['new_trust']:.2f}")
                    ] if show_all else [])
                ], className=f"event-row {event['event_type']}")
                for event in events
            ])
        ], className="events-table")
    
    def _format_timestamp(self, timestamp_str):
        """
        Format timestamp for display.
        
        Args:
            timestamp_str (str): ISO format timestamp
            
        Returns:
            str: Formatted timestamp
        """
        timestamp = datetime.fromisoformat(timestamp_str)
        now = datetime.now()
        
        # If today, show time only
        if timestamp.date() == now.date():
            return timestamp.strftime("%H:%M:%S")
        
        # If this year, show month and day
        if timestamp.year == now.year:
            return timestamp.strftime("%b %d, %H:%M")
        
        # Otherwise show full date
        return timestamp.strftime("%Y-%m-%d %H:%M")
    
    def _get_trust_category_for_value(self, value):
        """
        Get trust category for a value.
        
        Args:
            value (float): Trust value
            
        Returns:
            str: Trust category
        """
        thresholds = self.visualization.config["visualization"]["thresholds"]
        
        if value >= thresholds["high_trust"]:
            return "high_trust"
        elif value >= thresholds["medium_trust"]:
            return "medium_trust"
        elif value >= thresholds["low_trust"]:
            return "low_trust"
        else:
            return "critical"
    
    def verify_contract_integrity(self):
        """
        Verify the integrity of the contract tethering.
        
        Returns:
            bool: True if contract integrity is verified, False otherwise
        """
        return self._pre_loop_tether_check()
