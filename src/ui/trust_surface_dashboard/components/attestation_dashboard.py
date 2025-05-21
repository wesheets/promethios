"""
Attestation Dashboard component for the Trust Surface Dashboard.

This module provides UI components for viewing and managing attestations
within the Trust Surface Dashboard.
"""

import logging
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
    from src.core.governance.attestation_service import AttestationService
    from src.core.governance.claim_verification_protocol import ClaimVerificationProtocol
    from src.core.governance.attestation_authority_manager import AttestationAuthorityManager
    from src.ui.trust_surface_dashboard.components.trust_decay_dashboard import TrustDecayDashboard
except ImportError:
    # Handle import errors gracefully for testing environments
    logging.warning("Running with mock dependencies. Some functionality may be limited.")
    AttestationService = None
    ClaimVerificationProtocol = None
    AttestationAuthorityManager = None
    TrustDecayDashboard = None


class AttestationDashboard:
    """
    Dashboard component for viewing and managing attestations.
    
    The AttestationDashboard provides UI components for:
    - Attestation listing and filtering
    - Attestation chain visualization
    - Attestation verification status
    - Attestation creation interface
    
    This component integrates with the Trust Surface Dashboard and
    provides visualization of attestation data.
    """
    
    def __init__(self, 
                attestation_service: AttestationService,
                claim_protocol: ClaimVerificationProtocol,
                authority_manager: Optional[AttestationAuthorityManager] = None,
                trust_decay_dashboard: Optional[TrustDecayDashboard] = None):
        """
        Initialize the AttestationDashboard with the required services.
        
        Args:
            attestation_service: Instance of AttestationService
            claim_protocol: Instance of ClaimVerificationProtocol
            authority_manager: Optional instance of AttestationAuthorityManager
            trust_decay_dashboard: Optional instance of TrustDecayDashboard for integration
        """
        self.logger = logging.getLogger(__name__)
        self.attestation_service = attestation_service
        self.claim_protocol = claim_protocol
        self.authority_manager = authority_manager
        self.trust_decay_dashboard = trust_decay_dashboard
        
        # Initialize dashboard components
        self.layout = self._create_layout()
        
        # Register callbacks
        self._register_callbacks()
        
        self.logger.info("AttestationDashboard initialized")
    
    def _create_layout(self):
        """Create the dashboard layout."""
        return html.Div([
            dbc.Row([
                dbc.Col([
                    html.H2("Attestation Dashboard", className="mb-4"),
                    html.P("Monitor and manage attestations across the governance framework"),
                ], width=12)
            ], className="mb-4"),
            
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("Attestation Overview"),
                        dbc.CardBody([
                            html.Div(id="attestation-stats", className="d-flex justify-content-around"),
                            dcc.Graph(id="attestation-trend-chart")
                        ])
                    ])
                ], width=12)
            ], className="mb-4"),
            
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("Attestation Filters"),
                        dbc.CardBody([
                            dbc.Row([
                                dbc.Col([
                                    html.Label("Subject ID"),
                                    dbc.Input(id="filter-subject-id", type="text", placeholder="Filter by subject ID")
                                ], width=3),
                                dbc.Col([
                                    html.Label("Attestation Type"),
                                    dcc.Dropdown(
                                        id="filter-attestation-type",
                                        options=[
                                            {"label": "Verification", "value": "VERIFICATION"},
                                            {"label": "Certification", "value": "CERTIFICATION"},
                                            {"label": "Approval", "value": "APPROVAL"},
                                            {"label": "Audit", "value": "AUDIT"},
                                            {"label": "Compliance", "value": "COMPLIANCE"},
                                            {"label": "Delegation", "value": "DELEGATION"}
                                        ],
                                        placeholder="Select attestation type"
                                    )
                                ], width=3),
                                dbc.Col([
                                    html.Label("Status"),
                                    dcc.Dropdown(
                                        id="filter-status",
                                        options=[
                                            {"label": "Active", "value": "ACTIVE"},
                                            {"label": "Revoked", "value": "REVOKED"},
                                            {"label": "Suspended", "value": "SUSPENDED"}
                                        ],
                                        placeholder="Select status"
                                    )
                                ], width=3),
                                dbc.Col([
                                    html.Label(""),
                                    dbc.Button("Apply Filters", id="apply-filters", color="primary", className="mt-4")
                                ], width=3)
                            ])
                        ])
                    ])
                ], width=12)
            ], className="mb-4"),
            
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("Attestations"),
                        dbc.CardBody([
                            html.Div(id="attestation-list-container", style={"maxHeight": "400px", "overflow": "auto"})
                        ])
                    ])
                ], width=8),
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("Attestation Details"),
                        dbc.CardBody([
                            html.Div(id="attestation-details")
                        ])
                    ])
                ], width=4)
            ], className="mb-4"),
            
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("Attestation Chain Visualization"),
                        dbc.CardBody([
                            dcc.Graph(id="attestation-chain-graph")
                        ])
                    ])
                ], width=12)
            ], className="mb-4"),
            
            # Hidden components for storing state
            dcc.Store(id="selected-attestation-id"),
            dcc.Store(id="attestation-data"),
            dcc.Interval(id="refresh-interval", interval=30000)  # 30 seconds refresh
        ])
    
    def _register_callbacks(self):
        """Register all dashboard callbacks."""
        if not dash.callback_context:
            self.logger.warning("Callback context not available, skipping callback registration")
            return
        
        # Callback to update attestation stats
        @callback(
            Output("attestation-stats", "children"),
            [Input("refresh-interval", "n_intervals"),
             Input("apply-filters", "n_clicks")],
            [State("filter-subject-id", "value"),
             State("filter-attestation-type", "value"),
             State("filter-status", "value")]
        )
        def update_attestation_stats(n_intervals, n_clicks, subject_id, attestation_type, status):
            """Update attestation statistics."""
            try:
                # Get all attestations
                attestations = self._get_filtered_attestations(subject_id, attestation_type, status)
                
                # Count by status
                active_count = sum(1 for att in attestations if att["metadata"]["revocation_status"] == "ACTIVE")
                revoked_count = sum(1 for att in attestations if att["metadata"]["revocation_status"] == "REVOKED")
                
                # Count by type
                type_counts = {}
                for att in attestations:
                    att_type = att["attestation_type"]
                    if att_type not in type_counts:
                        type_counts[att_type] = 0
                    type_counts[att_type] += 1
                
                # Create stat cards
                stats = [
                    dbc.Card([
                        dbc.CardBody([
                            html.H3(len(attestations)),
                            html.P("Total Attestations")
                        ])
                    ], className="text-center"),
                    dbc.Card([
                        dbc.CardBody([
                            html.H3(active_count),
                            html.P("Active Attestations")
                        ])
                    ], className="text-center"),
                    dbc.Card([
                        dbc.CardBody([
                            html.H3(revoked_count),
                            html.P("Revoked Attestations")
                        ])
                    ], className="text-center")
                ]
                
                return stats
            except Exception as e:
                self.logger.error(f"Error updating attestation stats: {str(e)}")
                return [html.Div("Error loading attestation statistics")]
        
        # Callback to update trend chart
        @callback(
            Output("attestation-trend-chart", "figure"),
            [Input("refresh-interval", "n_intervals"),
             Input("apply-filters", "n_clicks")],
            [State("filter-subject-id", "value"),
             State("filter-attestation-type", "value"),
             State("filter-status", "value")]
        )
        def update_trend_chart(n_intervals, n_clicks, subject_id, attestation_type, status):
            """Update attestation trend chart."""
            try:
                # Get all attestations
                attestations = self._get_filtered_attestations(subject_id, attestation_type, status)
                
                # Group by date
                date_counts = {}
                for att in attestations:
                    # Parse timestamp
                    timestamp = att["timestamp"]
                    date_str = timestamp.split("T")[0]  # Extract date part
                    
                    if date_str not in date_counts:
                        date_counts[date_str] = {"created": 0, "revoked": 0}
                    
                    date_counts[date_str]["created"] += 1
                    
                    # Check if revoked
                    if att["metadata"]["revocation_status"] == "REVOKED":
                        revocation_timestamp = att["metadata"]["revocation_timestamp"]
                        if revocation_timestamp:
                            revocation_date = revocation_timestamp.split("T")[0]
                            if revocation_date not in date_counts:
                                date_counts[revocation_date] = {"created": 0, "revoked": 0}
                            date_counts[revocation_date]["revoked"] += 1
                
                # Convert to dataframe
                dates = []
                created_counts = []
                revoked_counts = []
                
                for date_str, counts in sorted(date_counts.items()):
                    dates.append(date_str)
                    created_counts.append(counts["created"])
                    revoked_counts.append(counts["revoked"])
                
                # Create figure
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=dates,
                    y=created_counts,
                    mode="lines+markers",
                    name="Created",
                    line=dict(color="green")
                ))
                fig.add_trace(go.Scatter(
                    x=dates,
                    y=revoked_counts,
                    mode="lines+markers",
                    name="Revoked",
                    line=dict(color="red")
                ))
                
                fig.update_layout(
                    title="Attestation Trends",
                    xaxis_title="Date",
                    yaxis_title="Count",
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                    margin=dict(l=40, r=40, t=40, b=40)
                )
                
                return fig
            except Exception as e:
                self.logger.error(f"Error updating trend chart: {str(e)}")
                return go.Figure()
        
        # Callback to update attestation list
        @callback(
            Output("attestation-list-container", "children"),
            [Input("refresh-interval", "n_intervals"),
             Input("apply-filters", "n_clicks")],
            [State("filter-subject-id", "value"),
             State("filter-attestation-type", "value"),
             State("filter-status", "value")]
        )
        def update_attestation_list(n_intervals, n_clicks, subject_id, attestation_type, status):
            """Update attestation list."""
            try:
                # Get filtered attestations
                attestations = self._get_filtered_attestations(subject_id, attestation_type, status)
                
                # Sort by timestamp (newest first)
                attestations.sort(key=lambda x: x["timestamp"], reverse=True)
                
                # Create table
                table_header = [
                    html.Thead(html.Tr([
                        html.Th("ID"),
                        html.Th("Type"),
                        html.Th("Subject"),
                        html.Th("Issuer"),
                        html.Th("Date"),
                        html.Th("Status"),
                        html.Th("Actions")
                    ]))
                ]
                
                rows = []
                for att in attestations:
                    # Format date
                    timestamp = att["timestamp"]
                    date_str = timestamp.split("T")[0]
                    
                    # Format status
                    status = att["metadata"]["revocation_status"]
                    status_badge = dbc.Badge(
                        status,
                        color="success" if status == "ACTIVE" else "danger",
                        className="ms-1"
                    )
                    
                    # Create row
                    row = html.Tr([
                        html.Td(att["attestation_id"]),
                        html.Td(att["attestation_type"]),
                        html.Td(att["subject_id"]),
                        html.Td(att["issuer_id"]),
                        html.Td(date_str),
                        html.Td(status_badge),
                        html.Td(
                            dbc.Button(
                                "View",
                                id={"type": "view-attestation", "index": att["attestation_id"]},
                                color="primary",
                                size="sm"
                            )
                        )
                    ])
                    rows.append(row)
                
                table_body = [html.Tbody(rows)]
                
                if not rows:
                    return html.Div("No attestations found matching the filters")
                
                return dbc.Table(table_header + table_body, bordered=True, hover=True, responsive=True)
            except Exception as e:
                self.logger.error(f"Error updating attestation list: {str(e)}")
                return html.Div(f"Error loading attestations: {str(e)}")
        
        # Callback to handle attestation selection
        @callback(
            Output("selected-attestation-id", "data"),
            [Input({"type": "view-attestation", "index": dash.dependencies.ALL}, "n_clicks")],
            prevent_initial_call=True
        )
        def select_attestation(n_clicks_list):
            """Handle attestation selection."""
            ctx = dash.callback_context
            if not ctx.triggered:
                return dash.no_update
            
            # Get the ID of the clicked button
            button_id = ctx.triggered[0]["prop_id"].split(".")[0]
            attestation_id = json.loads(button_id)["index"]
            
            return attestation_id
        
        # Callback to update attestation details
        @callback(
            [Output("attestation-details", "children"),
             Output("attestation-data", "data")],
            [Input("selected-attestation-id", "data")],
            prevent_initial_call=True
        )
        def update_attestation_details(attestation_id):
            """Update attestation details."""
            if not attestation_id:
                return html.Div("Select an attestation to view details"), None
            
            try:
                # Get attestation
                attestation = self.attestation_service.get_attestation(attestation_id)
                if not attestation:
                    return html.Div(f"Attestation not found: {attestation_id}"), None
                
                # Format details
                details = [
                    html.H4("Attestation Details"),
                    html.Hr(),
                    html.P([html.Strong("ID: "), attestation["attestation_id"]]),
                    html.P([html.Strong("Type: "), attestation["attestation_type"]]),
                    html.P([html.Strong("Subject: "), attestation["subject_id"]]),
                    html.P([html.Strong("Issuer: "), attestation["issuer_id"]]),
                    html.P([html.Strong("Claim: "), attestation["claim_id"]]),
                    html.P([html.Strong("Created: "), attestation["timestamp"]]),
                    html.P([html.Strong("Expires: "), attestation["expiration"]]),
                    html.P([
                        html.Strong("Status: "),
                        dbc.Badge(
                            attestation["metadata"]["revocation_status"],
                            color="success" if attestation["metadata"]["revocation_status"] == "ACTIVE" else "danger",
                            className="ms-1"
                        )
                    ]),
                    html.Hr(),
                    html.H5("Attestation Data"),
                    html.Pre(json.dumps(attestation["attestation_data"], indent=2), 
                            style={"backgroundColor": "#f8f9fa", "padding": "10px", "borderRadius": "5px"})
                ]
                
                # Add verification button
                details.append(html.Div([
                    dbc.Button(
                        "Verify Attestation",
                        id="verify-attestation-btn",
                        color="primary",
                        className="mt-3 me-2"
                    ),
                    dbc.Button(
                        "View Chain",
                        id="view-chain-btn",
                        color="secondary",
                        className="mt-3"
                    )
                ]))
                
                # Add verification result container
                details.append(html.Div(id="verification-result", className="mt-3"))
                
                return html.Div(details), attestation
            except Exception as e:
                self.logger.error(f"Error updating attestation details: {str(e)}")
                return html.Div(f"Error loading attestation details: {str(e)}"), None
        
        # Callback to verify attestation
        @callback(
            Output("verification-result", "children"),
            [Input("verify-attestation-btn", "n_clicks")],
            [State("selected-attestation-id", "data")],
            prevent_initial_call=True
        )
        def verify_attestation(n_clicks, attestation_id):
            """Verify attestation."""
            if not attestation_id:
                return html.Div("No attestation selected")
            
            try:
                # Verify attestation
                is_valid, details = self.attestation_service.validate_attestation(attestation_id)
                
                if is_valid:
                    return dbc.Alert(
                        "Attestation is valid",
                        color="success",
                        dismissable=True
                    )
                else:
                    return dbc.Alert(
                        [
                            html.P("Attestation is invalid"),
                            html.P(f"Reason: {details.get('error', 'Unknown error')}")
                        ],
                        color="danger",
                        dismissable=True
                    )
            except Exception as e:
                self.logger.error(f"Error verifying attestation: {str(e)}")
                return dbc.Alert(
                    f"Error verifying attestation: {str(e)}",
                    color="warning",
                    dismissable=True
                )
        
        # Callback to update attestation chain graph
        @callback(
            Output("attestation-chain-graph", "figure"),
            [Input("view-chain-btn", "n_clicks")],
            [State("selected-attestation-id", "data")],
            prevent_initial_call=True
        )
        def update_chain_graph(n_clicks, attestation_id):
            """Update attestation chain graph."""
            if not attestation_id:
                return go.Figure()
            
            try:
                # Get attestation chain
                chain = self.attestation_service.get_attestation_chain(attestation_id)
                if not chain:
                    return go.Figure()
                
                # Create network graph
                nodes = []
                edges = []
                
                for i, att in enumerate(chain):
                    # Add node
                    nodes.append({
                        "id": att["attestation_id"],
                        "label": f"{att['attestation_type']}<br>{att['attestation_id'][:8]}",
                        "color": "green" if att["metadata"]["revocation_status"] == "ACTIVE" else "red",
                        "size": 30 if i == 0 else 20  # Make selected attestation larger
                    })
                    
                    # Add edge if there's a parent
                    if att["parent_attestation_id"]:
                        edges.append({
                            "from": att["attestation_id"],
                            "to": att["parent_attestation_id"],
                            "arrows": "to"
                        })
                
                # Create figure using plotly
                # This is a simplified version - in a real implementation, 
                # you might use a more sophisticated network visualization
                
                # Create node positions (simple tree layout)
                pos = {}
                for i, node in enumerate(nodes):
                    pos[node["id"]] = (i, 0)
                
                # Create figure
                fig = go.Figure()
                
                # Add nodes
                for node in nodes:
                    x, y = pos[node["id"]]
                    fig.add_trace(go.Scatter(
                        x=[x],
                        y=[y],
                        mode="markers+text",
                        marker=dict(
                            size=node["size"],
                            color=node["color"]
                        ),
                        text=node["label"],
                        textposition="bottom center",
                        name=node["id"]
                    ))
                
                # Add edges
                for edge in edges:
                    x0, y0 = pos[edge["from"]]
                    x1, y1 = pos[edge["to"]]
                    fig.add_trace(go.Scatter(
                        x=[x0, x1],
                        y=[y0, y1],
                        mode="lines",
                        line=dict(width=1, color="gray"),
                        hoverinfo="none",
                        showlegend=False
                    ))
                
                fig.update_layout(
                    title="Attestation Chain",
                    showlegend=False,
                    hovermode="closest",
                    margin=dict(l=40, r=40, t=40, b=40),
                    xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                    yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
                )
                
                return fig
            except Exception as e:
                self.logger.error(f"Error updating chain graph: {str(e)}")
                return go.Figure()
    
    def _get_filtered_attestations(self, subject_id=None, attestation_type=None, status=None):
        """Get filtered attestations based on criteria."""
        try:
            # Convert status to revocation_status
            revocation_status = None
            if status:
                revocation_status = status
            
            # Get attestations
            attestations = self.attestation_service.find_attestations(
                subject_id=subject_id,
                attestation_type=attestation_type,
                active_only=(revocation_status == "ACTIVE")
            )
            
            # Apply additional filtering if needed
            if revocation_status and revocation_status != "ACTIVE":
                attestations = [
                    att for att in attestations
                    if att["metadata"]["revocation_status"] == revocation_status
                ]
            
            return attestations
        except Exception as e:
            self.logger.error(f"Error getting filtered attestations: {str(e)}")
            return []
