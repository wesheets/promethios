"""
Governance Visualization API for the Governance Visualization framework.

This module provides RESTful API endpoints for accessing governance visualization data,
including governance state, trust metrics, and health reports.

It integrates with:
- Governance State Visualizer
- Trust Metrics Dashboard
- Governance Health Reporter
- Visualization Data Transformer
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union
import datetime
from flask import Blueprint, jsonify, request, Response

# Import necessary components from previous phases and core visualization components
from src.core.visualization.governance_state_visualizer import GovernanceStateVisualizer
from src.core.visualization.trust_metrics_dashboard import TrustMetricsDashboard
from src.core.visualization.governance_health_reporter import GovernanceHealthReporter
from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer

# Create Blueprint for governance visualization API
governance_visualization_api = Blueprint('governance_visualization_api', __name__)

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize visualization components
state_visualizer = None
metrics_dashboard = None
health_reporter = None
data_transformer = None

def initialize_components():
    """Initialize visualization components if not already initialized."""
    global state_visualizer, metrics_dashboard, health_reporter, data_transformer
    
    if data_transformer is None:
        data_transformer = VisualizationDataTransformer()
    
    if state_visualizer is None:
        state_visualizer = GovernanceStateVisualizer(data_transformer=data_transformer)
    
    if metrics_dashboard is None:
        metrics_dashboard = TrustMetricsDashboard(data_transformer=data_transformer)
    
    if health_reporter is None:
        health_reporter = GovernanceHealthReporter(data_transformer=data_transformer)

@governance_visualization_api.route('/api/v1/visualization/governance-state', methods=['GET'])
def get_governance_state():
    """
    Get governance state visualization data.
    
    Query Parameters:
        view_type (str): Type of view (overview, detailed, heatmap)
        component_id (str, optional): Filter by component ID
        
    Returns:
        JSON response with governance state visualization data
    """
    initialize_components()
    
    try:
        view_type = request.args.get('view_type', 'overview')
        component_id = request.args.get('component_id')
        
        # Get governance state data
        state_data = state_visualizer.generate_governance_state_view(
            view_type=view_type,
            component_id=component_id
        )
        
        return jsonify(state_data)
    except Exception as e:
        logger.error(f"Error getting governance state: {str(e)}")
        return jsonify({"error": str(e)}), 500

@governance_visualization_api.route('/api/v1/visualization/policy-heatmap', methods=['GET'])
def get_policy_heatmap():
    """
    Get policy heatmap visualization data.
    
    Query Parameters:
        granularity (str): Heatmap granularity (low, medium, high)
        policy_type (str, optional): Filter by policy type
        
    Returns:
        JSON response with policy heatmap visualization data
    """
    initialize_components()
    
    try:
        granularity = request.args.get('granularity', 'medium')
        policy_type = request.args.get('policy_type')
        
        # Get policy heatmap data
        heatmap_data = state_visualizer.generate_policy_heatmap(
            granularity=granularity,
            policy_type=policy_type
        )
        
        return jsonify(heatmap_data)
    except Exception as e:
        logger.error(f"Error getting policy heatmap: {str(e)}")
        return jsonify({"error": str(e)}), 500

@governance_visualization_api.route('/api/v1/visualization/trust-metrics', methods=['GET'])
def get_trust_metrics():
    """
    Get trust metrics visualization data.
    
    Query Parameters:
        view_type (str): Type of view (overview, detailed, trends)
        metric_type (str, optional): Filter by metric type
        time_period (str, optional): Time period for trends (daily, weekly, monthly)
        
    Returns:
        JSON response with trust metrics visualization data
    """
    initialize_components()
    
    try:
        view_type = request.args.get('view_type', 'overview')
        metric_type = request.args.get('metric_type')
        time_period = request.args.get('time_period', 'daily')
        
        # Get trust metrics data
        metrics_data = metrics_dashboard.generate_trust_metrics_view(
            view_type=view_type,
            metric_type=metric_type,
            time_period=time_period
        )
        
        return jsonify(metrics_data)
    except Exception as e:
        logger.error(f"Error getting trust metrics: {str(e)}")
        return jsonify({"error": str(e)}), 500

@governance_visualization_api.route('/api/v1/visualization/trust-trends', methods=['GET'])
def get_trust_trends():
    """
    Get trust trends visualization data.
    
    Query Parameters:
        metric_type (str, optional): Filter by metric type
        time_period (str): Time period (daily, weekly, monthly)
        aggregation (str, optional): Aggregation method (avg, min, max, sum)
        
    Returns:
        JSON response with trust trends visualization data
    """
    initialize_components()
    
    try:
        metric_type = request.args.get('metric_type')
        time_period = request.args.get('time_period', 'daily')
        aggregation = request.args.get('aggregation', 'avg')
        
        # Get trust trends data
        trends_data = metrics_dashboard.generate_trust_trend_visualization(
            metric_type=metric_type,
            time_period=time_period,
            aggregation=aggregation
        )
        
        return jsonify(trends_data)
    except Exception as e:
        logger.error(f"Error getting trust trends: {str(e)}")
        return jsonify({"error": str(e)}), 500

@governance_visualization_api.route('/api/v1/visualization/health-report', methods=['GET'])
def get_health_report():
    """
    Get governance health report visualization data.
    
    Query Parameters:
        include_attestation (bool): Whether to include attestation health
        include_policy (bool): Whether to include policy health
        include_requirement (bool): Whether to include requirement health
        include_boundary (bool): Whether to include boundary health
        include_audit (bool): Whether to include audit trail health
        
    Returns:
        JSON response with health report visualization data
    """
    initialize_components()
    
    try:
        include_attestation = request.args.get('include_attestation', 'true').lower() == 'true'
        include_policy = request.args.get('include_policy', 'true').lower() == 'true'
        include_requirement = request.args.get('include_requirement', 'true').lower() == 'true'
        include_boundary = request.args.get('include_boundary', 'true').lower() == 'true'
        include_audit = request.args.get('include_audit', 'true').lower() == 'true'
        
        # Get health report data
        health_data = health_reporter.generate_health_report(
            include_attestation=include_attestation,
            include_policy=include_policy,
            include_requirement=include_requirement,
            include_boundary=include_boundary,
            include_audit=include_audit
        )
        
        return jsonify(health_data)
    except Exception as e:
        logger.error(f"Error getting health report: {str(e)}")
        return jsonify({"error": str(e)}), 500

@governance_visualization_api.route('/api/v1/visualization/issue-report', methods=['GET'])
def get_issue_report():
    """
    Get governance issue report visualization data.
    
    Query Parameters:
        severity (str, optional): Filter by issue severity (critical, major, minor)
        component_type (str, optional): Filter by component type
        
    Returns:
        JSON response with issue report visualization data
    """
    initialize_components()
    
    try:
        severity = request.args.get('severity')
        component_type = request.args.get('component_type')
        
        # Get issue report data
        issue_data = health_reporter.generate_issue_report(
            severity=severity,
            component_type=component_type
        )
        
        return jsonify(issue_data)
    except Exception as e:
        logger.error(f"Error getting issue report: {str(e)}")
        return jsonify({"error": str(e)}), 500

@governance_visualization_api.route('/api/v1/visualization/compliance-report', methods=['GET'])
def get_compliance_report():
    """
    Get governance compliance report visualization data.
    
    Query Parameters:
        compliance_type (str, optional): Filter by compliance type
        
    Returns:
        JSON response with compliance report visualization data
    """
    initialize_components()
    
    try:
        compliance_type = request.args.get('compliance_type')
        
        # Get compliance report data
        compliance_data = health_reporter.generate_compliance_report(
            compliance_type=compliance_type
        )
        
        return jsonify(compliance_data)
    except Exception as e:
        logger.error(f"Error getting compliance report: {str(e)}")
        return jsonify({"error": str(e)}), 500

@governance_visualization_api.route('/api/v1/visualization/anomaly-report', methods=['GET'])
def get_anomaly_report():
    """
    Get governance anomaly report visualization data.
    
    Query Parameters:
        time_period (str): Time period for anomaly detection (hourly, daily, weekly, monthly)
        
    Returns:
        JSON response with anomaly report visualization data
    """
    initialize_components()
    
    try:
        time_period = request.args.get('time_period', 'daily')
        
        # Get anomaly report data
        anomaly_data = health_reporter.generate_governance_anomaly_report(
            time_period=time_period
        )
        
        return jsonify(anomaly_data)
    except Exception as e:
        logger.error(f"Error getting anomaly report: {str(e)}")
        return jsonify({"error": str(e)}), 500

@governance_visualization_api.route('/api/v1/visualization/export-data', methods=['GET'])
def export_visualization_data():
    """
    Export visualization data in various formats.
    
    Query Parameters:
        data_type (str): Type of data to export (governance-state, trust-metrics, health-report)
        format (str): Export format (json, csv)
        
    Returns:
        Response with exported data in requested format
    """
    initialize_components()
    
    try:
        data_type = request.args.get('data_type', 'governance-state')
        export_format = request.args.get('format', 'json')
        
        # Get data based on type
        if data_type == 'governance-state':
            view_type = request.args.get('view_type', 'overview')
            component_id = request.args.get('component_id')
            data = state_visualizer.generate_governance_state_view(
                view_type=view_type,
                component_id=component_id
            )
        elif data_type == 'trust-metrics':
            view_type = request.args.get('view_type', 'overview')
            metric_type = request.args.get('metric_type')
            time_period = request.args.get('time_period', 'daily')
            data = metrics_dashboard.generate_trust_metrics_view(
                view_type=view_type,
                metric_type=metric_type,
                time_period=time_period
            )
        elif data_type == 'health-report':
            include_attestation = request.args.get('include_attestation', 'true').lower() == 'true'
            include_policy = request.args.get('include_policy', 'true').lower() == 'true'
            include_requirement = request.args.get('include_requirement', 'true').lower() == 'true'
            include_boundary = request.args.get('include_boundary', 'true').lower() == 'true'
            include_audit = request.args.get('include_audit', 'true').lower() == 'true'
            data = health_reporter.generate_health_report(
                include_attestation=include_attestation,
                include_policy=include_policy,
                include_requirement=include_requirement,
                include_boundary=include_boundary,
                include_audit=include_audit
            )
        else:
            return jsonify({"error": f"Unsupported data type: {data_type}"}), 400
        
        # Export data in requested format
        if export_format == 'json':
            return jsonify(data)
        elif export_format == 'csv':
            # Transform data to CSV format
            csv_data = data_transformer.transform_to_csv(data)
            
            # Create response with CSV data
            response = Response(csv_data, mimetype='text/csv')
            response.headers['Content-Disposition'] = f'attachment; filename={data_type}_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            return response
        else:
            return jsonify({"error": f"Unsupported export format: {export_format}"}), 400
    except Exception as e:
        logger.error(f"Error exporting visualization data: {str(e)}")
        return jsonify({"error": str(e)}), 500

def register_api(app):
    """Register the governance visualization API with the Flask app."""
    app.register_blueprint(governance_visualization_api)
    logger.info("Governance Visualization API registered")

class GovernanceVisualizationAPI:
    """
    API class for governance visualization endpoints.
    This class wraps the Flask blueprint functionality for programmatic access.
    """
    
    def __init__(self):
        """Initialize the GovernanceVisualizationAPI."""
        self.state_visualizer = None
        self.metrics_dashboard = None
        self.health_reporter = None
        self.data_transformer = None
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize visualization components if not already initialized."""
        from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer
        from src.core.visualization.governance_state_visualizer import GovernanceStateVisualizer
        from src.core.visualization.trust_metrics_dashboard import TrustMetricsDashboard
        from src.core.visualization.governance_health_reporter import GovernanceHealthReporter
        
        if self.data_transformer is None:
            self.data_transformer = VisualizationDataTransformer()
        
        if self.state_visualizer is None:
            self.state_visualizer = GovernanceStateVisualizer(data_transformer=self.data_transformer)
        
        if self.metrics_dashboard is None:
            self.metrics_dashboard = TrustMetricsDashboard(data_transformer=self.data_transformer)
        
        if self.health_reporter is None:
            self.health_reporter = GovernanceHealthReporter(data_transformer=self.data_transformer)
    
    def get_governance_state(self, view_type='overview', component_id=None):
        """Get governance state visualization data."""
        return self.state_visualizer.generate_governance_state_view(
            view_type=view_type,
            component_id=component_id
        )
    
    def get_trust_metrics(self, view_type='overview', metric_type=None, time_period='daily'):
        """Get trust metrics visualization data."""
        return self.metrics_dashboard.generate_trust_metrics_view(
            view_type=view_type,
            metric_type=metric_type,
            time_period=time_period
        )
    
    def get_health_report(self, include_attestation=True, include_policy=True, 
                         include_requirement=True, include_boundary=True, include_audit=True):
        """Get governance health report visualization data."""
        return self.health_reporter.generate_health_report(
            include_attestation=include_attestation,
            include_policy=include_policy,
            include_requirement=include_requirement,
            include_boundary=include_boundary,
            include_audit=include_audit
        )

