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
    
    def __init__(self, schema_validator=None, governance_state_provider=None, 
                 trust_metrics_provider=None, health_data_provider=None, 
                 contract_sealer: Optional[ContractSealer] = None):
        """
        Initialize the VisualizationDataTransformer.
        
        Args:
            schema_validator: Validator for schema compliance
            governance_state_provider: Provider for governance state data
            trust_metrics_provider: Provider for trust metrics data
            health_data_provider: Provider for health report data
            contract_sealer: Optional ContractSealer for data integrity verification
        """
        self.logger = logging.getLogger(__name__)
        self.schema_validator = schema_validator
        self.governance_state_provider = governance_state_provider
        self.trust_metrics_provider = trust_metrics_provider
        self.health_data_provider = health_data_provider
        self.contract_sealer = contract_sealer
        self.mutation_detector = MutationDetector() if contract_sealer else None
        
    def transform_governance_state_for_visualization(self, options=None):
        """
        Transforms governance state data for visualization.
        
        Args:
            options: Optional configuration options
            
        Returns:
            Dict: Transformed governance state data optimized for visualization
        """
        self.logger.info("Transforming governance state data for visualization")
        
        # Validate provider exists
        if not self.governance_state_provider:
            self.logger.error("Missing governance state provider")
            raise ValueError("Governance state provider is required")
        
        # Get governance state data from provider
        governance_data = self.governance_state_provider.get_current_state()
        
        # Validate data is not empty
        if not governance_data:
            self.logger.error("Empty governance state data provided")
            raise ValueError("Governance state data cannot be empty")
        
        # Validate data schema if validator is available
        if self.schema_validator and not self.schema_validator.validate(governance_data):
            self.logger.error("Invalid governance state data schema")
            raise ValueError("Invalid governance state data schema")
        
        # Transform components to nodes
        nodes = []
        if 'components' in governance_data:
            for component in governance_data['components']:
                nodes.append({
                    'id': component.get('id', ''),
                    'label': component.get('name', component.get('id', '')),
                    'status': component.get('status', ''),
                    'health': component.get('health', 0)
                })
        
        # Transform relationships to edges
        edges = []
        if 'relationships' in governance_data:
            for relationship in governance_data['relationships']:
                edges.append({
                    'source': relationship.get('source', ''),
                    'target': relationship.get('target', ''),
                    'type': relationship.get('type', ''),
                    'strength': relationship.get('strength', 0)
                })
        
        # Apply options if provided
        if options:
            # Filter inactive components if specified
            if not options.get('include_inactive', True):
                nodes = [node for node in nodes if node['status'] == 'active']
            
            # Filter by minimum health if specified
            if 'min_health' in options:
                nodes = [node for node in nodes if node['health'] >= options['min_health']]
            
            # Limit number of components if specified
            if 'max_components' in options and len(nodes) > options['max_components']:
                nodes = nodes[:options['max_components']]
                
                # Filter edges to only include nodes that remain
                node_ids = {node['id'] for node in nodes}
                edges = [edge for edge in edges 
                         if edge['source'] in node_ids and edge['target'] in node_ids]
        
        # Return transformed data
        return {
            'nodes': nodes,
            'edges': edges
        }
    
    def transform_trust_metrics_for_visualization(self, options=None):
        """
        Transforms trust metrics data for visualization.
        
        Args:
            options: Optional configuration options
            
        Returns:
            Dict: Transformed trust metrics data optimized for visualization
        """
        self.logger.info("Transforming trust metrics data for visualization")
        
        # Validate provider exists
        if not self.trust_metrics_provider:
            self.logger.error("Missing trust metrics provider")
            raise ValueError("Trust metrics provider is required")
        
        # Get trust metrics data from provider
        trust_metrics = self.trust_metrics_provider.get_current_metrics()
        
        # Validate data is not empty
        if not trust_metrics:
            self.logger.error("Empty trust metrics data provided")
            raise ValueError("Trust metrics data cannot be empty")
        
        # Validate data schema if validator is available
        if self.schema_validator and not self.schema_validator.validate(trust_metrics):
            self.logger.error("Invalid trust metrics data schema")
            raise ValueError("Invalid trust metrics data schema")
        
        # Transform metrics
        metrics = []
        time_series = []
        
        if 'metrics' in trust_metrics:
            for metric in trust_metrics['metrics']:
                # Add to metrics list
                metrics.append({
                    'id': metric.get('id', ''),
                    'name': metric.get('name', ''),
                    'value': metric.get('value', 0),
                    'trend': metric.get('trend', 'stable')
                })
                
                # Add to time series if history is available
                if 'history' in metric:
                    time_series.append({
                        'metric_id': metric.get('id', ''),
                        'data': self._transform_time_series_data(metric['history'])
                    })
        
        # Get aggregates
        aggregates = trust_metrics.get('aggregates', {})
        
        # Apply options if provided
        if options:
            # Filter by metric type if specified
            if 'metric_type' in options:
                metrics = [m for m in metrics if m.get('type') == options['metric_type']]
                time_series = [ts for ts in time_series 
                               if any(m['id'] == ts['metric_id'] for m in metrics)]
            
            # Limit time range if specified
            if 'time_range' in options and options['time_range'] > 0:
                for ts in time_series:
                    ts['data'] = ts['data'][-options['time_range']:]
        
        # Return transformed data
        return {
            'metrics': metrics,
            'time_series': time_series,
            'aggregates': aggregates
        }
    
    def transform_health_report_for_visualization(self, options=None):
        """
        Transforms health report data for visualization.
        
        Args:
            options: Optional configuration options
            
        Returns:
            Dict: Transformed health report data optimized for visualization
        """
        self.logger.info("Transforming health report data for visualization")
        
        # Validate provider exists
        if not self.health_data_provider:
            self.logger.error("Missing health data provider")
            raise ValueError("Health data provider is required")
        
        # Get health report data from provider
        health_data = self.health_data_provider.get_current_health_report()
        
        # Validate data is not empty
        if not health_data:
            self.logger.error("Empty health report data provided")
            raise ValueError("Health report data cannot be empty")
        
        # Validate data schema if validator is available
        if self.schema_validator and not self.schema_validator.validate(health_data):
            self.logger.error("Invalid health report data schema")
            raise ValueError("Invalid health report data schema")
        
        # Transform overall health
        overall = health_data.get('overall_health', {})
        
        # Transform components
        components = health_data.get('components', {})
        
        # Calculate issues summary
        issues_summary = {
            'critical': 0,
            'major': 0,
            'minor': 0,
            'total': 0
        }
        
        # Add up issues from overall health
        if 'issues' in overall:
            issues_summary['critical'] += overall['issues'].get('critical', 0)
            issues_summary['major'] += overall['issues'].get('major', 0)
            issues_summary['minor'] += overall['issues'].get('minor', 0)
        
        # Calculate total
        issues_summary['total'] = (
            issues_summary['critical'] + 
            issues_summary['major'] + 
            issues_summary['minor']
        )
        
        # Apply options if provided
        if options:
            # Filter by component status if specified
            if 'status' in options:
                components = {
                    k: v for k, v in components.items() 
                    if v.get('status') == options['status']
                }
            
            # Filter by minimum health score if specified
            if 'min_score' in options:
                components = {
                    k: v for k, v in components.items() 
                    if v.get('score', 0) >= options['min_score']
                }
        
        # Return transformed data
        return {
            'overall': overall,
            'components': components,
            'issues_summary': issues_summary
        }
    
    def _transform_time_series_data(self, time_series_data):
        """
        Transforms time series data for visualization.
        
        Args:
            time_series_data: Raw time series data
            
        Returns:
            List: Transformed time series data optimized for visualization
        """
        self.logger.info("Transforming time series data")
        
        # Validate input data
        if not time_series_data:
            return []
        
        # Return the time series data as is (already in the right format)
        return time_series_data
    
    def transform_time_series_data(self, time_series_data, options=None):
        """
        Transforms time series data for visualization.
        
        Args:
            time_series_data: Raw time series data
            options: Optional configuration options
            
        Returns:
            Dict: Transformed time series data optimized for visualization
        """
        self.logger.info("Transforming time series data for visualization")
        
        # Validate input data
        if not time_series_data:
            self.logger.error("Empty time series data provided")
            raise ValueError("Time series data cannot be empty")
        
        # Transform the time series data
        transformed_data = self._transform_time_series_data(time_series_data)
        
        # Apply options if provided
        if options and 'max_data_points' in options and len(transformed_data) > options['max_data_points']:
            # Simple downsampling by selecting evenly spaced points
            step = len(transformed_data) // options['max_data_points']
            downsampled = [transformed_data[i] for i in range(0, len(transformed_data), step)]
            
            # Ensure we include the last point
            if downsampled[-1] != transformed_data[-1]:
                downsampled.append(transformed_data[-1])
                
            transformed_data = downsampled
        
        return transformed_data
