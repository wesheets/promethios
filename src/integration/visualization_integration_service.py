"""
Visualization Integration Service for the Governance Visualization framework.

This service provides integration between different visualization components
and manages data flow between the core governance system and UI components.
"""

import logging
from typing import Dict, List, Any, Optional
from src.core.visualization.governance_state_visualizer import GovernanceStateVisualizer
from src.core.visualization.trust_metrics_dashboard import TrustMetricsDashboard
from src.core.visualization.governance_health_reporter import GovernanceHealthReporter
from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer

logger = logging.getLogger(__name__)

class VisualizationIntegrationService:
    """
    Service for integrating visualization components with the governance system.
    """
    
    def __init__(self):
        """Initialize the VisualizationIntegrationService."""
        self.data_transformer = VisualizationDataTransformer()
        self.state_visualizer = GovernanceStateVisualizer(data_transformer=self.data_transformer)
        self.metrics_dashboard = TrustMetricsDashboard(data_transformer=self.data_transformer)
        self.health_reporter = GovernanceHealthReporter(data_transformer=self.data_transformer)
        logger.info("VisualizationIntegrationService initialized")
    
    def get_integrated_dashboard_data(self) -> Dict[str, Any]:
        """Get integrated data for the main governance dashboard."""
        try:
            return {
                "governance_state": self.state_visualizer.generate_governance_state_view(),
                "trust_metrics": self.metrics_dashboard.generate_trust_metrics_view(),
                "health_report": self.health_reporter.generate_health_report(),
                "timestamp": self.data_transformer.get_current_timestamp()
            }
        except Exception as e:
            logger.error(f"Error getting integrated dashboard data: {str(e)}")
            return {"error": str(e)}
    
    def refresh_all_data(self) -> bool:
        """Refresh all visualization data sources."""
        try:
            # Refresh data in all components
            self.data_transformer.refresh_data_sources()
            logger.info("All visualization data refreshed successfully")
            return True
        except Exception as e:
            logger.error(f"Error refreshing visualization data: {str(e)}")
            return False
    
    def get_component_status(self) -> Dict[str, str]:
        """Get status of all visualization components."""
        return {
            "state_visualizer": "active" if self.state_visualizer else "inactive",
            "metrics_dashboard": "active" if self.metrics_dashboard else "inactive", 
            "health_reporter": "active" if self.health_reporter else "inactive",
            "data_transformer": "active" if self.data_transformer else "inactive"
        }

