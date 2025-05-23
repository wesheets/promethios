"""
Audit Trail Explorer component for the Trust Surface Dashboard.

This module provides UI components for exploring and verifying the governance
audit trail within the Trust Surface Dashboard.
"""

import logging
import json
from typing import Dict, List, Optional, Any, Callable
import dash
from dash import html, dcc, callback, Input, Output, State
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime, timedelta

# Import required dependencies
try:
    from src.core.governance.governance_audit_trail import GovernanceAuditTrail
except ImportError:
    # Handle import errors gracefully for testing environments
    logging.warning("Running with mock dependencies. Some functionality may be limited.")
    GovernanceAuditTrail = None


class AuditTrailExplorer:
    """
    Dashboard component for exploring and verifying the governance audit trail.
    
    The AuditTrailExplorer provides UI components for:
    - Audit event listing and filtering
    - Audit event details and verification
    - Merkle tree visualization
    - Entity audit trail exploration
    
    This component integrates with the Trust Surface Dashboard and
    provides visualization of audit trail data.
    """
    
    def __init__(self, audit_trail: GovernanceAuditTrail):
        """
        Initialize the AuditTrailExplorer with the required services.
        
        Args:
            audit_trail: Instance of GovernanceAuditTrail
        """
        self.logger = logging.getLogger(__name__)
        self.audit_trail = audit_trail
        
        # Initialize dashboard components
        self.layout = self._create_layout()
        
        # Register callbacks
        self._register_callbacks()
        
        self.logger.info("AuditTrailExplorer initialized")
    
    def _create_layout(self):
        """Create the dashboard layout."""
        return html.Div([
            dbc.Row([
                dbc.Col([
                    html.H2("Governance Audit Trail Explorer", className="mb-4"),
                    html.P("Explore and verify the immutable audit trail of governance events"),
                ], width=12)
            ], className="mb-4"),
            
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("Audit Trail Overview"),
                        dbc.CardBody([
                            html.Div(id="audit-stats", className="d-flex justify-content-around"),
                            dcc.Graph(id="audit-event-distribution")
                        ])
                    ])
                ], width=12)
            ], className="mb-4"),
            
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("Audit Event Filters"),
                        dbc.CardBody([
                            dbc.Row([
                                dbc.Col([
                                    html.Label("Entity ID"),
                                    dbc.Input(id="filter-entity-id", type="text", placeholder="Filter by entity ID")
                                ], width=3),
                                dbc.Col([
                                    html.Label("Event Type"),
                                    dcc.Dropdown(
                                        id="filter-event-type",
                                        options=[
                                            {"label": "Attestation Created", "value": "ATTESTATION_CREATED"},
                                            {"label": "Attestation Verified", "value": "ATTESTATION_VERIFIED"},
                                            {"label": "Attestation Revoked", "value": "ATTESTATION_REVOKED"},
                                            {"label": "Claim Created", "value": "CLAIM_CREATED"},
                                            {"label": "Claim Verified", "value": "CLAIM_VERIFIED"},
                                            {"label": "Claim Rejected", "value": "CLAIM_REJECTED"},
                                            {"label": "Authority Registered", "value": "AUTHORITY_REGISTERED"},
                                            {"label": "Authority Updated", "value": "AUTHORITY_UPDATED"},
                                            {"label": "Authority Revoked", "value": "AUTHORITY_REVOKED"},
                                            {"label": "Governance Decision", "value": "GOVERNANCE_DECISION"},
                                            {"label": "Compliance Check", "value": "COMPLIANCE_CHECK"},
                                            {"label": "Security Event", "value": "SECURITY_EVENT"}
                                        ],
                                        placeholder="Select event type"
                                    )
                                ], width=3),
                                dbc.Col([
                                    html.Label("Actor ID"),
                                    dbc.Input(id="filter-actor-id", type="text", placeholder="Filter by actor ID")
                                ], width=3),
                                dbc.Col([
                                    html.Label(""),
                                    dbc.Button("Apply Filters", id="apply-audit-filters", color="primary", className="mt-4")
                                ], width=3)
                            ])
                        ])
                    ])
                ], width=12)
            ], className="mb-4"),
            
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("Audit Events"),
                        dbc.CardBody([
                            html.Div(id="audit-event-list-container", style={"maxHeight": "400px", "overflow": "auto"})
                        ])
                    ])
                ], width=8),
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("Audit Event Details"),
                        dbc.CardBody([
                            html.Div(id="audit-event-details")
                        ])
                    ])
                ], width=4)
            ], className="mb-4"),
            
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("Merkle Tree Visualization"),
                        dbc.CardBody([
                            dcc.Graph(id="merkle-tree-graph")
                        ])
                    ])
                ], width=12)
            ], className="mb-4"),
            
            # Hidden components for storing state
            dcc.Store(id="selected-audit-event-id"),
            dcc.Store(id="audit-event-data"),
            dcc.Interval(id="audit-refresh-interval", interval=30000)  # 30 seconds refresh
        ])
    
    def _register_callbacks(self):
        """Register all dashboard callbacks."""
        if not dash.callback_context:
            self.logger.warning("Callback context not available, skipping callback registration")
            return
        
        # Callback to update audit stats
        @callback(
            Output("audit-stats", "children"),
            [Input("audit-refresh-interval", "n_intervals"),
             Input("apply-audit-filters", "n_clicks")],
            [State("filter-entity-id", "value"),
             State("filter-event-type", "value"),
             State("filter-actor-id", "value")]
        )
        def update_audit_stats(n_intervals, n_clicks, entity_id, event_type, actor_id):
            """Update audit statistics."""
            try:
                # Get all audit events
                events = self._get_filtered_events(entity_id, event_type, actor_id)
                
                # Count by type
                type_counts = {}
                for event in events:
                    event_type = event["event_type"]
                    if event_type not in type_counts:
                        type_counts[event_type] = 0
                    type_counts[event_type] += 1
                
                # Count by severity
                severity_counts = {}
                for event in events:
                    severity = event["metadata"].get("severity", "INFO")
                    if severity not in severity_counts:
                        severity_counts[severity] = 0
                    severity_counts[severity] += 1
                
                # Create stat cards
                stats = [
                    dbc.Card([
                        dbc.CardBody([
                            html.H3(len(events)),
                            html.P("Total Events")
                        ])
                    ], className="text-center"),
                    dbc.Card([
                        dbc.CardBody([
                            html.H3(severity_counts.get("INFO", 0)),
                            html.P("Info Events")
                        ])
                    ], className="text-center"),
                    dbc.Card([
                        dbc.CardBody([
                            html.H3(severity_counts.get("MEDIUM", 0) + severity_counts.get("HIGH", 0)),
                            html.P("Critical Events")
                        ])
                    ], className="text-center")
                ]
                
                return stats
            except Exception as e:
                self.logger.error(f"Error updating audit stats: {str(e)}")
                return [html.Div("Error loading audit statistics")]
        
        # Callback to update event distribution chart
        @callback(
            Output("audit-event-distribution", "figure"),
            [Input("audit-refresh-interval", "n_intervals"),
             Input("apply-audit-filters", "n_clicks")],
            [State("filter-entity-id", "value"),
             State("filter-event-type", "value"),
             State("filter-actor-id", "value")]
        )
        def update_event_distribution(n_intervals, n_clicks, entity_id, event_type, actor_id):
            """Update audit event distribution chart."""
            try:
                # Get all audit events
                events = self._get_filtered_events(entity_id, event_type, actor_id)
                
                # Count by type
                type_counts = {}
                for event in events:
                    event_type = event["event_type"]
                    if event_type not in type_counts:
                        type_counts[event_type] = 0
                    type_counts[event_type] += 1
                
                # Convert to lists for plotting
                types = list(type_counts.keys())
                counts = list(type_counts.values())
                
                # Create figure
                fig = go.Figure(data=[
                    go.Bar(
                        x=types,
                        y=counts,
                        marker_color='rgb(55, 83, 109)'
                    )
                ])
                
                fig.update_layout(
                    title="Event Type Distribution",
                    xaxis_title="Event Type",
                    yaxis_title="Count",
                    margin=dict(l=40, r=40, t=40, b=40)
                )
                
                return fig
            except Exception as e:
                self.logger.error(f"Error updating event distribution: {str(e)}")
                return go.Figure()
        
        # Callback to update audit event list
        @callback(
            Output("audit-event-list-container", "children"),
            [Input("audit-refresh-interval", "n_intervals"),
             Input("apply-audit-filters", "n_clicks")],
            [State("filter-entity-id", "value"),
             State("filter-event-type", "value"),
             State("filter-actor-id", "value")]
        )
        def update_audit_event_list(n_intervals, n_clicks, entity_id, event_type, actor_id):
            """Update audit event list."""
            try:
                # Get filtered events
                events = self._get_filtered_events(entity_id, event_type, actor_id)
                
                # Sort by timestamp (newest first)
                events.sort(key=lambda x: x["timestamp"], reverse=True)
                
                # Create table
                table_header = [
                    html.Thead(html.Tr([
                        html.Th("ID"),
                        html.Th("Type"),
                        html.Th("Entity"),
                        html.Th("Actor"),
                        html.Th("Date"),
                        html.Th("Severity"),
                        html.Th("Actions")
                    ]))
                ]
                
                rows = []
                for event in events:
                    # Format date
                    timestamp = event["timestamp"]
                    date_str = timestamp.split("T")[0]
                    
                    # Format severity
                    severity = event["metadata"].get("severity", "INFO")
                    severity_color = {
                        "INFO": "info",
                        "LOW": "success",
                        "MEDIUM": "warning",
                        "HIGH": "danger"
                    }.get(severity, "secondary")
                    
                    severity_badge = dbc.Badge(
                        severity,
                        color=severity_color,
                        className="ms-1"
                    )
                    
                    # Create row
                    row = html.Tr([
                        html.Td(event["event_id"]),
                        html.Td(event["event_type"]),
                        html.Td(event["entity_id"]),
                        html.Td(event["actor_id"]),
                        html.Td(date_str),
                        html.Td(severity_badge),
                        html.Td(
                            dbc.Button(
                                "View",
                                id={"type": "view-audit-event", "index": event["event_id"]},
                                color="primary",
                                size="sm"
                            )
                        )
                    ])
                    rows.append(row)
                
                table_body = [html.Tbody(rows)]
                
                if not rows:
                    return html.Div("No audit events found matching the filters")
                
                return dbc.Table(table_header + table_body, bordered=True, hover=True, responsive=True)
            except Exception as e:
                self.logger.error(f"Error updating audit event list: {str(e)}")
                return html.Div(f"Error loading audit events: {str(e)}")
        
        # Callback to handle audit event selection
        @callback(
            Output("selected-audit-event-id", "data"),
            [Input({"type": "view-audit-event", "index": dash.dependencies.ALL}, "n_clicks")],
            prevent_initial_call=True
        )
        def select_audit_event(n_clicks_list):
            """Handle audit event selection."""
            ctx = dash.callback_context
            if not ctx.triggered:
                return dash.no_update
            
            # Get the ID of the clicked button
            button_id = ctx.triggered[0]["prop_id"].split(".")[0]
            event_id = json.loads(button_id)["index"]
            
            return event_id
        
        # Callback to update audit event details
        @callback(
            [Output("audit-event-details", "children"),
             Output("audit-event-data", "data")],
            [Input("selected-audit-event-id", "data")],
            prevent_initial_call=True
        )
        def update_audit_event_details(event_id):
            """Update audit event details."""
            if not event_id:
                return html.Div("Select an audit event to view details"), None
            
            try:
                # Get audit event
                event = self.audit_trail.get_event(event_id)
                if not event:
                    return html.Div(f"Audit event not found: {event_id}"), None
                
                # Format details
                details = [
                    html.H4("Audit Event Details"),
                    html.Hr(),
                    html.P([html.Strong("ID: "), event["event_id"]]),
                    html.P([html.Strong("Type: "), event["event_type"]]),
                    html.P([html.Strong("Entity: "), event["entity_id"]]),
                    html.P([html.Strong("Actor: "), event["actor_id"]]),
                    html.P([html.Strong("Timestamp: "), event["timestamp"]]),
                    html.P([
                        html.Strong("Severity: "),
                        dbc.Badge(
                            event["metadata"].get("severity", "INFO"),
                            color={
                                "INFO": "info",
                                "LOW": "success",
                                "MEDIUM": "warning",
                                "HIGH": "danger"
                            }.get(event["metadata"].get("severity", "INFO"), "secondary"),
                            className="ms-1"
                        )
                    ]),
                    html.Hr(),
                    html.H5("Event Data"),
                    html.Pre(json.dumps(event["event_data"], indent=2), 
                            style={"backgroundColor": "#f8f9fa", "padding": "10px", "borderRadius": "5px"})
                ]
                
                # Add verification button
                details.append(html.Div([
                    dbc.Button(
                        "Verify Event",
                        id="verify-event-btn",
                        color="primary",
                        className="mt-3 me-2"
                    ),
                    dbc.Button(
                        "View Merkle Proof",
                        id="view-merkle-proof-btn",
                        color="secondary",
                        className="mt-3"
                    )
                ]))
                
                # Add verification result container
                details.append(html.Div(id="event-verification-result", className="mt-3"))
                
                return html.Div(details), event
            except Exception as e:
                self.logger.error(f"Error updating audit event details: {str(e)}")
                return html.Div(f"Error loading audit event details: {str(e)}"), None
        
        # Callback to verify audit event
        @callback(
            Output("event-verification-result", "children"),
            [Input("verify-event-btn", "n_clicks")],
            [State("selected-audit-event-id", "data")],
            prevent_initial_call=True
        )
        def verify_audit_event(n_clicks, event_id):
            """Verify audit event."""
            if not event_id:
                return html.Div("No audit event selected")
            
            try:
                # Verify event
                is_valid, details = self.audit_trail.verify_event(event_id)
                
                if is_valid:
                    return dbc.Alert(
                        [
                            html.P("Audit event is valid"),
                            html.P(f"Root hash: {details.get('root_hash', 'N/A')}")
                        ],
                        color="success",
                        dismissable=True
                    )
                else:
                    return dbc.Alert(
                        [
                            html.P("Audit event is invalid"),
                            html.P(f"Reason: {details.get('error', 'Unknown error')}")
                        ],
                        color="danger",
                        dismissable=True
                    )
            except Exception as e:
                self.logger.error(f"Error verifying audit event: {str(e)}")
                return dbc.Alert(
                    f"Error verifying audit event: {str(e)}",
                    color="warning",
                    dismissable=True
                )
        
        # Callback to update Merkle tree graph
        @callback(
            Output("merkle-tree-graph", "figure"),
            [Input("view-merkle-proof-btn", "n_clicks")],
            [State("audit-event-data", "data")],
            prevent_initial_call=True
        )
        def update_merkle_graph(n_clicks, event_data):
            """Update Merkle tree graph."""
            if not event_data:
                return go.Figure()
            
            try:
                # Get Merkle proof from event
                merkle_proof = event_data.get("merkle_proof", {})
                if not merkle_proof:
                    return go.Figure()
                
                # Extract proof path
                path = merkle_proof.get("path", [])
                leaf_hash = merkle_proof.get("leaf_hash", "")
                root_hash = merkle_proof.get("root_hash", "")
                
                # Create a simplified visualization of the Merkle path
                # This is a basic representation - in a real implementation,
                # you might use a more sophisticated tree visualization
                
                # Create nodes and edges
                nodes = []
                edges = []
                
                # Add leaf node
                nodes.append({
                    "id": "leaf",
                    "label": f"Leaf: {leaf_hash[:8]}...",
                    "level": 0
                })
                
                # Add intermediate nodes from path
                for i, node in enumerate(path):
                    node_id = f"node_{i}"
                    nodes.append({
                        "id": node_id,
                        "label": f"Node: {node['hash'][:8]}...",
                        "level": i + 1
                    })
                    
                    # Add edge from previous node
                    if i == 0:
                        edges.append({
                            "from": "leaf",
                            "to": node_id
                        })
                    else:
                        edges.append({
                            "from": f"node_{i-1}",
                            "to": node_id
                        })
                
                # Add root node
                nodes.append({
                    "id": "root",
                    "label": f"Root: {root_hash[:8]}...",
                    "level": len(path) + 1
                })
                
                # Add edge from last intermediate node to root
                if path:
                    edges.append({
                        "from": f"node_{len(path)-1}",
                        "to": "root"
                    })
                else:
                    edges.append({
                        "from": "leaf",
                        "to": "root"
                    })
                
                # Create figure using plotly
                fig = go.Figure()
                
                # Position nodes in a tree layout
                for node in nodes:
                    level = node["level"]
                    # Position horizontally based on level
                    x = level
                    # Position vertically to create a tree-like structure
                    y = 0
                    
                    fig.add_trace(go.Scatter(
                        x=[x],
                        y=[y],
                        mode="markers+text",
                        marker=dict(
                            size=20,
                            color="blue" if node["id"] == "root" else 
                                  "green" if node["id"] == "leaf" else "gray"
                        ),
                        text=node["label"],
                        textposition="bottom center",
                        name=node["id"]
                    ))
                
                # Add edges
                for edge in edges:
                    from_node = next(n for n in nodes if n["id"] == edge["from"])
                    to_node = next(n for n in nodes if n["id"] == edge["to"])
                    
                    fig.add_trace(go.Scatter(
                        x=[from_node["level"], to_node["level"]],
                        y=[0, 0],
                        mode="lines",
                        line=dict(width=1, color="gray"),
                        hoverinfo="none",
                        showlegend=False
                    ))
                
                fig.update_layout(
                    title="Merkle Proof Path",
                    showlegend=False,
                    hovermode="closest",
                    margin=dict(l=40, r=40, t=40, b=40),
                    xaxis=dict(showgrid=False, zeroline=False, title="Tree Level"),
                    yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
                )
                
                return fig
            except Exception as e:
                self.logger.error(f"Error updating Merkle graph: {str(e)}")
                return go.Figure()
    
    def _get_filtered_events(self, entity_id=None, event_type=None, actor_id=None):
        """Get filtered audit events based on criteria."""
        try:
            # Get events
            events = self.audit_trail.find_events(
                entity_id=entity_id,
                event_type=event_type,
                actor_id=actor_id
            )
            
            return events
        except Exception as e:
            self.logger.error(f"Error getting filtered audit events: {str(e)}")
            return []
