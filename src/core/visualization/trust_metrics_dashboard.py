"""
Trust Metrics Dashboard for the Governance Visualization framework.

This module provides functionality to visualize trust metrics across the system,
including trust decay, regeneration, and boundary integrity.

It integrates with:
- Trust Decay Engine (5.9)
- Governance Attestation Framework (5.10)
- Trust Boundary Definition (5.13)
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union
import datetime

# Import necessary components from previous phases
from src.core.trust.trust_decay_engine import TrustDecayEngine
from src.core.trust.trust_regeneration_protocol import TrustRegenerationProtocol
from src.core.trust.trust_metrics_provider import TrustMetricsProvider
from src.core.governance.attestation_service import AttestationService
from src.core.trust.boundary_integrity_verifier import BoundaryIntegrityVerifier
from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer

class TrustMetricsDashboard:
    """
    Provides real-time visualization of trust metrics.
    
    Integrates with:
    - Trust Decay Engine (5.9)
    - Governance Attestation Framework (5.10)
    - Trust Boundary Definition (5.13)
    """
    
    def __init__(self, 
                 trust_decay_engine: Optional[TrustDecayEngine] = None,
                 trust_regeneration_protocol: Optional[TrustRegenerationProtocol] = None,
                 trust_metrics_provider: Optional[TrustMetricsProvider] = None,
                 attestation_service: Optional[AttestationService] = None,
                 boundary_integrity_verifier: Optional[BoundaryIntegrityVerifier] = None,
                 data_transformer: Optional[VisualizationDataTransformer] = None):
        """
        Initialize the TrustMetricsDashboard.
        
        Args:
            trust_decay_engine: TrustDecayEngine for accessing trust decay metrics
            trust_regeneration_protocol: TrustRegenerationProtocol for accessing trust regeneration metrics
            trust_metrics_provider: TrustMetricsProvider for accessing general trust metrics
            attestation_service: AttestationService for accessing attestation metrics
            boundary_integrity_verifier: BoundaryIntegrityVerifier for accessing boundary integrity metrics
            data_transformer: VisualizationDataTransformer for transforming data
        """
        self.logger = logging.getLogger(__name__)
        self.trust_decay_engine = trust_decay_engine
        self.trust_regeneration_protocol = trust_regeneration_protocol
        self.trust_metrics_provider = trust_metrics_provider
        self.attestation_service = attestation_service
        self.boundary_integrity_verifier = boundary_integrity_verifier
        self.data_transformer = data_transformer or VisualizationDataTransformer()
        
    def generate_trust_metrics_view(self,
                                   include_decay: bool = True,
                                   include_regeneration: bool = True,
                                   include_attestation: bool = True,
                                   include_boundary: bool = True) -> Dict[str, Any]:
        """
        Generates a comprehensive view of current trust metrics.
        
        Args:
            include_decay: Whether to include trust decay metrics
            include_regeneration: Whether to include trust regeneration metrics
            include_attestation: Whether to include attestation metrics
            include_boundary: Whether to include boundary integrity metrics
            
        Returns:
            dict: Structured representation of trust metrics
        """
        self.logger.info("Generating trust metrics view")
        
        # Initialize metrics data structure
        metrics_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "components": {}
        }
        
        # Collect trust decay metrics if available and requested
        if include_decay and self.trust_decay_engine:
            metrics_data["components"]["decay"] = self._collect_trust_decay_metrics()
        
        # Collect trust regeneration metrics if available and requested
        if include_regeneration and self.trust_regeneration_protocol:
            metrics_data["components"]["regeneration"] = self._collect_trust_regeneration_metrics()
        
        # Collect attestation metrics if available and requested
        if include_attestation and self.attestation_service:
            metrics_data["components"]["attestation"] = self._collect_attestation_metrics()
        
        # Collect boundary integrity metrics if available and requested
        if include_boundary and self.boundary_integrity_verifier:
            metrics_data["components"]["boundary"] = self._collect_boundary_integrity_metrics()
        
        # Add overall trust metrics if available
        if self.trust_metrics_provider:
            metrics_data["overall_trust"] = self.trust_metrics_provider.get_overall_trust_metrics()
        
        # Transform data for visualization
        visualization_data = self.data_transformer.transform_trust_metrics(
            metrics_data, metric_type="combined"
        )
        
        return visualization_data
    
    def generate_trust_trend_visualization(self, 
                                          time_period: str = "daily",
                                          metric_type: str = "decay",
                                          component_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates visualization of trust trends over the specified time period.
        
        Args:
            time_period: Time period for trend analysis (hourly, daily, weekly, monthly)
            metric_type: Type of trust metric to visualize (decay, regeneration, attestation, boundary)
            component_id: Optional component ID to filter metrics
            
        Returns:
            dict: Trust trend visualization data
        """
        self.logger.info(f"Generating trust trend visualization for {metric_type} over {time_period}")
        
        # Determine date range based on time period
        end_date = datetime.datetime.now()
        if time_period == "hourly":
            start_date = end_date - datetime.timedelta(hours=24)
            interval = "hour"
        elif time_period == "daily":
            start_date = end_date - datetime.timedelta(days=30)
            interval = "day"
        elif time_period == "weekly":
            start_date = end_date - datetime.timedelta(weeks=12)
            interval = "week"
        elif time_period == "monthly":
            start_date = end_date - datetime.timedelta(days=365)
            interval = "month"
        else:
            start_date = end_date - datetime.timedelta(days=30)  # Default to daily
            interval = "day"
        
        # Collect trend data based on metric type
        if metric_type == "decay":
            trend_data = self._collect_trust_decay_trend(start_date, end_date, interval, component_id)
        elif metric_type == "regeneration":
            trend_data = self._collect_trust_regeneration_trend(start_date, end_date, interval, component_id)
        elif metric_type == "attestation":
            trend_data = self._collect_attestation_trend(start_date, end_date, interval, component_id)
        elif metric_type == "boundary":
            trend_data = self._collect_boundary_integrity_trend(start_date, end_date, interval, component_id)
        elif metric_type == "combined":
            trend_data = self._collect_combined_trust_trend(start_date, end_date, interval, component_id)
        else:
            self.logger.error(f"Unsupported metric type: {metric_type}")
            raise ValueError(f"Unsupported metric type: {metric_type}")
        
        # Create trend visualization structure
        visualization_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "metric_type": metric_type,
            "time_period": time_period,
            "interval": interval,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "component_id": component_id,
            "trend_data": trend_data
        }
        
        # Transform data for visualization
        transformed_data = self.data_transformer.transform_trust_metrics(
            visualization_data, metric_type=metric_type
        )
        
        return transformed_data
    
    def generate_trust_heatmap(self,
                              metric_type: str = "decay",
                              granularity: str = "module") -> Dict[str, Any]:
        """
        Generates a heatmap visualization of trust metrics across the system.
        
        Args:
            metric_type: Type of trust metric to visualize (decay, regeneration, attestation, boundary)
            granularity: Granularity level for the heatmap (module, component, function)
            
        Returns:
            dict: Trust heatmap visualization data
        """
        self.logger.info(f"Generating trust heatmap for {metric_type} with granularity {granularity}")
        
        # Collect heatmap data based on metric type
        if metric_type == "decay":
            if not self.trust_decay_engine:
                self.logger.error("Trust decay engine not available")
                raise ValueError("Trust decay engine is required for decay heatmap generation")
            heatmap_data = self._collect_trust_decay_heatmap(granularity)
        elif metric_type == "regeneration":
            if not self.trust_regeneration_protocol:
                self.logger.error("Trust regeneration protocol not available")
                raise ValueError("Trust regeneration protocol is required for regeneration heatmap generation")
            heatmap_data = self._collect_trust_regeneration_heatmap(granularity)
        elif metric_type == "attestation":
            if not self.attestation_service:
                self.logger.error("Attestation service not available")
                raise ValueError("Attestation service is required for attestation heatmap generation")
            heatmap_data = self._collect_attestation_heatmap(granularity)
        elif metric_type == "boundary":
            if not self.boundary_integrity_verifier:
                self.logger.error("Boundary integrity verifier not available")
                raise ValueError("Boundary integrity verifier is required for boundary heatmap generation")
            heatmap_data = self._collect_boundary_integrity_heatmap(granularity)
        else:
            self.logger.error(f"Unsupported metric type: {metric_type}")
            raise ValueError(f"Unsupported metric type: {metric_type}")
        
        # Create heatmap structure
        visualization_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "type": "trust_heatmap",
            "metric_type": metric_type,
            "granularity": granularity,
            "data": heatmap_data
        }
        
        # Transform data for visualization
        transformed_data = self.data_transformer.transform_trust_metrics(
            visualization_data, metric_type=metric_type
        )
        
        return transformed_data
    
    def generate_trust_comparison(self,
                                 metric_types: List[str],
                                 component_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Generates a comparison visualization of different trust metrics.
        
        Args:
            metric_types: List of trust metric types to compare
            component_ids: Optional list of component IDs to filter metrics
            
        Returns:
            dict: Trust comparison visualization data
        """
        self.logger.info(f"Generating trust comparison for metrics: {', '.join(metric_types)}")
        
        # Initialize comparison data
        comparison_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "type": "trust_comparison",
            "metrics": {}
        }
        
        # Collect metrics for each type
        for metric_type in metric_types:
            if metric_type == "decay":
                if self.trust_decay_engine:
                    comparison_data["metrics"]["decay"] = self._collect_trust_decay_metrics(component_ids)
            elif metric_type == "regeneration":
                if self.trust_regeneration_protocol:
                    comparison_data["metrics"]["regeneration"] = self._collect_trust_regeneration_metrics(component_ids)
            elif metric_type == "attestation":
                if self.attestation_service:
                    comparison_data["metrics"]["attestation"] = self._collect_attestation_metrics(component_ids)
            elif metric_type == "boundary":
                if self.boundary_integrity_verifier:
                    comparison_data["metrics"]["boundary"] = self._collect_boundary_integrity_metrics(component_ids)
            else:
                self.logger.warning(f"Unsupported metric type: {metric_type}, skipping")
        
        # Transform data for visualization
        transformed_data = self.data_transformer.transform_trust_metrics(
            comparison_data, metric_type="combined"
        )
        
        return transformed_data
    
    def generate_trust_radar_chart(self,
                                  component_id: str,
                                  include_metrics: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Generates a radar chart visualization of trust metrics for a specific component.
        
        Args:
            component_id: ID of the component to visualize
            include_metrics: Optional list of specific metrics to include
            
        Returns:
            dict: Trust radar chart visualization data
        """
        self.logger.info(f"Generating trust radar chart for component: {component_id}")
        
        # Initialize radar chart data
        radar_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "type": "trust_radar",
            "component_id": component_id,
            "metrics": {}
        }
        
        # Determine which metrics to include
        if not include_metrics:
            include_metrics = ["decay", "regeneration", "attestation", "boundary", "overall"]
        
        # Collect metrics for the component
        for metric in include_metrics:
            if metric == "decay" and self.trust_decay_engine:
                decay_metrics = self.trust_decay_engine.get_component_metrics(component_id)
                if decay_metrics:
                    radar_data["metrics"]["decay"] = decay_metrics.get("current_trust", 0)
            
            elif metric == "regeneration" and self.trust_regeneration_protocol:
                regen_metrics = self.trust_regeneration_protocol.get_component_metrics(component_id)
                if regen_metrics:
                    radar_data["metrics"]["regeneration"] = regen_metrics.get("regeneration_rate", 0)
            
            elif metric == "attestation" and self.attestation_service:
                attest_metrics = self.attestation_service.get_component_attestation_metrics(component_id)
                if attest_metrics:
                    radar_data["metrics"]["attestation"] = attest_metrics.get("validity", 0)
            
            elif metric == "boundary" and self.boundary_integrity_verifier:
                boundary_metrics = self.boundary_integrity_verifier.get_component_boundary_metrics(component_id)
                if boundary_metrics:
                    radar_data["metrics"]["boundary"] = boundary_metrics.get("integrity", 0)
            
            elif metric == "overall" and self.trust_metrics_provider:
                overall_metrics = self.trust_metrics_provider.get_component_trust_metrics(component_id)
                if overall_metrics:
                    radar_data["metrics"]["overall"] = overall_metrics.get("trust_score", 0)
        
        # Transform data for visualization
        transformed_data = self.data_transformer.transform_trust_metrics(
            radar_data, metric_type="combined"
        )
        
        return transformed_data
    
    def _collect_trust_decay_metrics(self, component_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Collects trust decay metrics from the decay engine.
        
        Args:
            component_ids: Optional list of component IDs to filter metrics
            
        Returns:
            list: Trust decay metrics
        """
        decay_metrics = []
        
        try:
            if self.trust_decay_engine:
                # Get all component metrics or filter by component IDs
                if component_ids:
                    for component_id in component_ids:
                        metrics = self.trust_decay_engine.get_component_metrics(component_id)
                        if metrics:
                            decay_metrics.append({
                                "component_id": component_id,
                                "current_trust": metrics.get("current_trust", 0),
                                "decay_rate": metrics.get("decay_rate", 0),
                                "time_to_critical": metrics.get("time_to_critical", 0),
                                "last_update": metrics.get("last_update", ""),
                                "metadata": metrics.get("metadata", {})
                            })
                else:
                    all_metrics = self.trust_decay_engine.get_all_component_metrics()
                    for component_id, metrics in all_metrics.items():
                        decay_metrics.append({
                            "component_id": component_id,
                            "current_trust": metrics.get("current_trust", 0),
                            "decay_rate": metrics.get("decay_rate", 0),
                            "time_to_critical": metrics.get("time_to_critical", 0),
                            "last_update": metrics.get("last_update", ""),
                            "metadata": metrics.get("metadata", {})
                        })
        except Exception as e:
            self.logger.error(f"Error collecting trust decay metrics: {str(e)}")
        
        return decay_metrics
    
    def _collect_trust_regeneration_metrics(self, component_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Collects trust regeneration metrics from the regeneration protocol.
        
        Args:
            component_ids: Optional list of component IDs to filter metrics
            
        Returns:
            list: Trust regeneration metrics
        """
        regeneration_metrics = []
        
        try:
            if self.trust_regeneration_protocol:
                # Get all component metrics or filter by component IDs
                if component_ids:
                    for component_id in component_ids:
                        metrics = self.trust_regeneration_protocol.get_component_metrics(component_id)
                        if metrics:
                            regeneration_metrics.append({
                                "component_id": component_id,
                                "current_trust": metrics.get("current_trust", 0),
                                "regeneration_rate": metrics.get("regeneration_rate", 0),
                                "time_to_full": metrics.get("time_to_full", 0),
                                "last_regeneration": metrics.get("last_regeneration", ""),
                                "metadata": metrics.get("metadata", {})
                            })
                else:
                    all_metrics = self.trust_regeneration_protocol.get_all_component_metrics()
                    for component_id, metrics in all_metrics.items():
                        regeneration_metrics.append({
                            "component_id": component_id,
                            "current_trust": metrics.get("current_trust", 0),
                            "regeneration_rate": metrics.get("regeneration_rate", 0),
                            "time_to_full": metrics.get("time_to_full", 0),
                            "last_regeneration": metrics.get("last_regeneration", ""),
                            "metadata": metrics.get("metadata", {})
                        })
        except Exception as e:
            self.logger.error(f"Error collecting trust regeneration metrics: {str(e)}")
        
        return regeneration_metrics
    
    def _collect_attestation_metrics(self, component_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Collects attestation metrics from the attestation service.
        
        Args:
            component_ids: Optional list of component IDs to filter metrics
            
        Returns:
            list: Attestation metrics
        """
        attestation_metrics = []
        
        try:
            if self.attestation_service:
                # Get all component metrics or filter by component IDs
                if component_ids:
                    for component_id in component_ids:
                        metrics = self.attestation_service.get_component_attestation_metrics(component_id)
                        if metrics:
                            attestation_metrics.append({
                                "component_id": component_id,
                                "validity": metrics.get("validity", 0),
                                "claims": metrics.get("claims", 0),
                                "verifications": metrics.get("verifications", 0),
                                "last_attestation": metrics.get("last_attestation", ""),
                                "metadata": metrics.get("metadata", {})
                            })
                else:
                    all_metrics = self.attestation_service.get_all_attestation_metrics()
                    for component_id, metrics in all_metrics.items():
                        attestation_metrics.append({
                            "component_id": component_id,
                            "validity": metrics.get("validity", 0),
                            "claims": metrics.get("claims", 0),
                            "verifications": metrics.get("verifications", 0),
                            "last_attestation": metrics.get("last_attestation", ""),
                            "metadata": metrics.get("metadata", {})
                        })
        except Exception as e:
            self.logger.error(f"Error collecting attestation metrics: {str(e)}")
        
        return attestation_metrics
    
    def _collect_boundary_integrity_metrics(self, component_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Collects boundary integrity metrics from the boundary integrity verifier.
        
        Args:
            component_ids: Optional list of component IDs to filter metrics
            
        Returns:
            list: Boundary integrity metrics
        """
        boundary_metrics = []
        
        try:
            if self.boundary_integrity_verifier:
                # Get all boundary metrics or filter by component IDs
                if component_ids:
                    for component_id in component_ids:
                        metrics = self.boundary_integrity_verifier.get_component_boundary_metrics(component_id)
                        if metrics:
                            boundary_metrics.append({
                                "component_id": component_id,
                                "boundary_id": metrics.get("boundary_id", ""),
                                "integrity": metrics.get("integrity", 0),
                                "crossings": metrics.get("crossings", 0),
                                "violations": metrics.get("violations", 0),
                                "last_verification": metrics.get("last_verification", ""),
                                "metadata": metrics.get("metadata", {})
                            })
                else:
                    all_metrics = self.boundary_integrity_verifier.get_all_boundary_metrics()
                    for boundary_id, metrics in all_metrics.items():
                        boundary_metrics.append({
                            "boundary_id": boundary_id,
                            "integrity": metrics.get("integrity", 0),
                            "crossings": metrics.get("crossings", 0),
                            "violations": metrics.get("violations", 0),
                            "last_verification": metrics.get("last_verification", ""),
                            "components": metrics.get("components", []),
                            "metadata": metrics.get("metadata", {})
                        })
        except Exception as e:
            self.logger.error(f"Error collecting boundary integrity metrics: {str(e)}")
        
        return boundary_metrics
    
    def _collect_trust_decay_trend(self, 
                                  start_date: datetime.datetime,
                                  end_date: datetime.datetime,
                                  interval: str,
                                  component_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Collects trust decay trend data for the specified time period.
        
        Args:
            start_date: Start date for trend data
            end_date: End date for trend data
            interval: Interval for data points (hour, day, week, month)
            component_id: Optional component ID to filter metrics
            
        Returns:
            list: Trust decay trend data
        """
        trend_data = []
        
        try:
            if self.trust_decay_engine:
                # Get trend data for specific component or all components
                if component_id:
                    history = self.trust_decay_engine.get_component_history(
                        component_id, start_date, end_date, interval
                    )
                    
                    for entry in history:
                        trend_data.append({
                            "timestamp": entry.get("timestamp", ""),
                            "component_id": component_id,
                            "trust_level": entry.get("trust_level", 0),
                            "decay_rate": entry.get("decay_rate", 0),
                            "metadata": entry.get("metadata", {})
                        })
                else:
                    # Get aggregate trend data for all components
                    aggregate_history = self.trust_decay_engine.get_aggregate_history(
                        start_date, end_date, interval
                    )
                    
                    for entry in aggregate_history:
                        trend_data.append({
                            "timestamp": entry.get("timestamp", ""),
                            "average_trust": entry.get("average_trust", 0),
                            "min_trust": entry.get("min_trust", 0),
                            "max_trust": entry.get("max_trust", 0),
                            "component_count": entry.get("component_count", 0),
                            "metadata": entry.get("metadata", {})
                        })
        except Exception as e:
            self.logger.error(f"Error collecting trust decay trend data: {str(e)}")
        
        return trend_data
    
    def _collect_trust_regeneration_trend(self, 
                                         start_date: datetime.datetime,
                                         end_date: datetime.datetime,
                                         interval: str,
                                         component_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Collects trust regeneration trend data for the specified time period.
        
        Args:
            start_date: Start date for trend data
            end_date: End date for trend data
            interval: Interval for data points (hour, day, week, month)
            component_id: Optional component ID to filter metrics
            
        Returns:
            list: Trust regeneration trend data
        """
        trend_data = []
        
        try:
            if self.trust_regeneration_protocol:
                # Get trend data for specific component or all components
                if component_id:
                    history = self.trust_regeneration_protocol.get_component_history(
                        component_id, start_date, end_date, interval
                    )
                    
                    for entry in history:
                        trend_data.append({
                            "timestamp": entry.get("timestamp", ""),
                            "component_id": component_id,
                            "trust_level": entry.get("trust_level", 0),
                            "regeneration_rate": entry.get("regeneration_rate", 0),
                            "regeneration_event": entry.get("regeneration_event", False),
                            "metadata": entry.get("metadata", {})
                        })
                else:
                    # Get aggregate trend data for all components
                    aggregate_history = self.trust_regeneration_protocol.get_aggregate_history(
                        start_date, end_date, interval
                    )
                    
                    for entry in aggregate_history:
                        trend_data.append({
                            "timestamp": entry.get("timestamp", ""),
                            "average_trust": entry.get("average_trust", 0),
                            "average_regeneration": entry.get("average_regeneration", 0),
                            "regeneration_events": entry.get("regeneration_events", 0),
                            "component_count": entry.get("component_count", 0),
                            "metadata": entry.get("metadata", {})
                        })
        except Exception as e:
            self.logger.error(f"Error collecting trust regeneration trend data: {str(e)}")
        
        return trend_data
    
    def _collect_attestation_trend(self, 
                                  start_date: datetime.datetime,
                                  end_date: datetime.datetime,
                                  interval: str,
                                  component_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Collects attestation trend data for the specified time period.
        
        Args:
            start_date: Start date for trend data
            end_date: End date for trend data
            interval: Interval for data points (hour, day, week, month)
            component_id: Optional component ID to filter metrics
            
        Returns:
            list: Attestation trend data
        """
        trend_data = []
        
        try:
            if self.attestation_service:
                # Get trend data for specific component or all components
                if component_id:
                    history = self.attestation_service.get_attestation_history(
                        component_id, start_date, end_date, interval
                    )
                    
                    for entry in history:
                        trend_data.append({
                            "timestamp": entry.get("timestamp", ""),
                            "component_id": component_id,
                            "validity": entry.get("validity", 0),
                            "claims": entry.get("claims", 0),
                            "verifications": entry.get("verifications", 0),
                            "attestation_event": entry.get("attestation_event", False),
                            "metadata": entry.get("metadata", {})
                        })
                else:
                    # Get aggregate trend data for all components
                    aggregate_history = self.attestation_service.get_aggregate_attestation_history(
                        start_date, end_date, interval
                    )
                    
                    for entry in aggregate_history:
                        trend_data.append({
                            "timestamp": entry.get("timestamp", ""),
                            "average_validity": entry.get("average_validity", 0),
                            "total_claims": entry.get("total_claims", 0),
                            "total_verifications": entry.get("total_verifications", 0),
                            "attestation_events": entry.get("attestation_events", 0),
                            "component_count": entry.get("component_count", 0),
                            "metadata": entry.get("metadata", {})
                        })
        except Exception as e:
            self.logger.error(f"Error collecting attestation trend data: {str(e)}")
        
        return trend_data
    
    def _collect_boundary_integrity_trend(self, 
                                         start_date: datetime.datetime,
                                         end_date: datetime.datetime,
                                         interval: str,
                                         boundary_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Collects boundary integrity trend data for the specified time period.
        
        Args:
            start_date: Start date for trend data
            end_date: End date for trend data
            interval: Interval for data points (hour, day, week, month)
            boundary_id: Optional boundary ID to filter metrics
            
        Returns:
            list: Boundary integrity trend data
        """
        trend_data = []
        
        try:
            if self.boundary_integrity_verifier:
                # Get trend data for specific boundary or all boundaries
                if boundary_id:
                    history = self.boundary_integrity_verifier.get_boundary_history(
                        boundary_id, start_date, end_date, interval
                    )
                    
                    for entry in history:
                        trend_data.append({
                            "timestamp": entry.get("timestamp", ""),
                            "boundary_id": boundary_id,
                            "integrity": entry.get("integrity", 0),
                            "crossings": entry.get("crossings", 0),
                            "violations": entry.get("violations", 0),
                            "verification_event": entry.get("verification_event", False),
                            "metadata": entry.get("metadata", {})
                        })
                else:
                    # Get aggregate trend data for all boundaries
                    aggregate_history = self.boundary_integrity_verifier.get_aggregate_boundary_history(
                        start_date, end_date, interval
                    )
                    
                    for entry in aggregate_history:
                        trend_data.append({
                            "timestamp": entry.get("timestamp", ""),
                            "average_integrity": entry.get("average_integrity", 0),
                            "total_crossings": entry.get("total_crossings", 0),
                            "total_violations": entry.get("total_violations", 0),
                            "verification_events": entry.get("verification_events", 0),
                            "boundary_count": entry.get("boundary_count", 0),
                            "metadata": entry.get("metadata", {})
                        })
        except Exception as e:
            self.logger.error(f"Error collecting boundary integrity trend data: {str(e)}")
        
        return trend_data
    
    def _collect_combined_trust_trend(self, 
                                     start_date: datetime.datetime,
                                     end_date: datetime.datetime,
                                     interval: str,
                                     component_id: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Collects combined trust trend data for the specified time period.
        
        Args:
            start_date: Start date for trend data
            end_date: End date for trend data
            interval: Interval for data points (hour, day, week, month)
            component_id: Optional component ID to filter metrics
            
        Returns:
            dict: Combined trust trend data
        """
        combined_data = {
            "decay": [],
            "regeneration": [],
            "attestation": [],
            "boundary": []
        }
        
        # Collect decay trend data
        if self.trust_decay_engine:
            combined_data["decay"] = self._collect_trust_decay_trend(
                start_date, end_date, interval, component_id
            )
        
        # Collect regeneration trend data
        if self.trust_regeneration_protocol:
            combined_data["regeneration"] = self._collect_trust_regeneration_trend(
                start_date, end_date, interval, component_id
            )
        
        # Collect attestation trend data
        if self.attestation_service:
            combined_data["attestation"] = self._collect_attestation_trend(
                start_date, end_date, interval, component_id
            )
        
        # Collect boundary trend data
        if self.boundary_integrity_verifier:
            combined_data["boundary"] = self._collect_boundary_integrity_trend(
                start_date, end_date, interval, component_id
            )
        
        return combined_data
    
    def _collect_trust_decay_heatmap(self, granularity: str = "module") -> List[Dict[str, Any]]:
        """
        Collects trust decay data for heatmap visualization.
        
        Args:
            granularity: Granularity level for the data
            
        Returns:
            list: Trust decay heatmap data
        """
        heatmap_data = []
        
        try:
            if self.trust_decay_engine:
                # Get trust decay metrics with specified granularity
                metrics = self.trust_decay_engine.get_trust_metrics_by_granularity(granularity)
                
                # Convert metrics to heatmap data
                for component, value in metrics.items():
                    # Parse component coordinates based on granularity
                    if granularity == "module":
                        x = component
                        y = "module"
                    elif granularity == "component":
                        parts = component.split(".")
                        x = parts[0] if len(parts) > 0 else component
                        y = parts[1] if len(parts) > 1 else "component"
                    elif granularity == "function":
                        parts = component.split(".")
                        x = parts[0] if len(parts) > 0 else component
                        y = ".".join(parts[1:]) if len(parts) > 1 else "function"
                    else:
                        x = component
                        y = granularity
                    
                    heatmap_data.append({
                        "x": x,
                        "y": y,
                        "value": value.get("current_trust", 0),
                        "component": component,
                        "decay_rate": value.get("decay_rate", 0),
                        "time_to_critical": value.get("time_to_critical", 0)
                    })
        except Exception as e:
            self.logger.error(f"Error collecting trust decay heatmap data: {str(e)}")
        
        return heatmap_data
    
    def _collect_trust_regeneration_heatmap(self, granularity: str = "module") -> List[Dict[str, Any]]:
        """
        Collects trust regeneration data for heatmap visualization.
        
        Args:
            granularity: Granularity level for the data
            
        Returns:
            list: Trust regeneration heatmap data
        """
        heatmap_data = []
        
        try:
            if self.trust_regeneration_protocol:
                # Get trust regeneration metrics with specified granularity
                metrics = self.trust_regeneration_protocol.get_regeneration_metrics_by_granularity(granularity)
                
                # Convert metrics to heatmap data
                for component, value in metrics.items():
                    # Parse component coordinates based on granularity
                    if granularity == "module":
                        x = component
                        y = "module"
                    elif granularity == "component":
                        parts = component.split(".")
                        x = parts[0] if len(parts) > 0 else component
                        y = parts[1] if len(parts) > 1 else "component"
                    elif granularity == "function":
                        parts = component.split(".")
                        x = parts[0] if len(parts) > 0 else component
                        y = ".".join(parts[1:]) if len(parts) > 1 else "function"
                    else:
                        x = component
                        y = granularity
                    
                    heatmap_data.append({
                        "x": x,
                        "y": y,
                        "value": value.get("regeneration_rate", 0),
                        "component": component,
                        "current_trust": value.get("current_trust", 0),
                        "time_to_full": value.get("time_to_full", 0)
                    })
        except Exception as e:
            self.logger.error(f"Error collecting trust regeneration heatmap data: {str(e)}")
        
        return heatmap_data
    
    def _collect_attestation_heatmap(self, granularity: str = "module") -> List[Dict[str, Any]]:
        """
        Collects attestation data for heatmap visualization.
        
        Args:
            granularity: Granularity level for the data
            
        Returns:
            list: Attestation heatmap data
        """
        heatmap_data = []
        
        try:
            if self.attestation_service:
                # Get attestation metrics with specified granularity
                metrics = self.attestation_service.get_attestation_metrics_by_granularity(granularity)
                
                # Convert metrics to heatmap data
                for component, value in metrics.items():
                    # Parse component coordinates based on granularity
                    if granularity == "module":
                        x = component
                        y = "module"
                    elif granularity == "component":
                        parts = component.split(".")
                        x = parts[0] if len(parts) > 0 else component
                        y = parts[1] if len(parts) > 1 else "component"
                    elif granularity == "function":
                        parts = component.split(".")
                        x = parts[0] if len(parts) > 0 else component
                        y = ".".join(parts[1:]) if len(parts) > 1 else "function"
                    else:
                        x = component
                        y = granularity
                    
                    heatmap_data.append({
                        "x": x,
                        "y": y,
                        "value": value.get("validity", 0),
                        "component": component,
                        "claims": value.get("claims", 0),
                        "verifications": value.get("verifications", 0)
                    })
        except Exception as e:
            self.logger.error(f"Error collecting attestation heatmap data: {str(e)}")
        
        return heatmap_data
    
    def _collect_boundary_integrity_heatmap(self, granularity: str = "module") -> List[Dict[str, Any]]:
        """
        Collects boundary integrity data for heatmap visualization.
        
        Args:
            granularity: Granularity level for the data
            
        Returns:
            list: Boundary integrity heatmap data
        """
        heatmap_data = []
        
        try:
            if self.boundary_integrity_verifier:
                # Get boundary integrity metrics with specified granularity
                metrics = self.boundary_integrity_verifier.get_boundary_metrics_by_granularity(granularity)
                
                # Convert metrics to heatmap data
                for boundary, value in metrics.items():
                    # Parse boundary coordinates based on granularity
                    if granularity == "module":
                        x = boundary
                        y = "module"
                    elif granularity == "component":
                        parts = boundary.split(".")
                        x = parts[0] if len(parts) > 0 else boundary
                        y = parts[1] if len(parts) > 1 else "component"
                    elif granularity == "domain":
                        domains = value.get("domains", [])
                        for domain in domains:
                            domain_name = domain.get("name", "domain")
                            heatmap_data.append({
                                "x": boundary,
                                "y": domain_name,
                                "value": domain.get("integrity", 0),
                                "boundary": boundary,
                                "domain": domain_name,
                                "crossings": domain.get("crossings", 0),
                                "violations": domain.get("violations", 0)
                            })
                        continue  # Skip the default entry below
                    else:
                        x = boundary
                        y = granularity
                    
                    heatmap_data.append({
                        "x": x,
                        "y": y,
                        "value": value.get("integrity", 0),
                        "boundary": boundary,
                        "crossings": value.get("crossings", 0),
                        "violations": value.get("violations", 0)
                    })
        except Exception as e:
            self.logger.error(f"Error collecting boundary integrity heatmap data: {str(e)}")
        
        return heatmap_data
