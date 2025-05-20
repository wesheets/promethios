"""
UI Component Integration for Phase 5.5 (Governance Mesh Integration).

This module implements the UI components for the governance mesh,
including the Codex Contract Dashboard, Schema/Contract Drift Alert,
and Governance Mesh Visualization.

This component implements Phase 5.5 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.5
Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GovernanceMeshUI:
    """
    UI components for the Governance Mesh.
    
    This component implements Phase 5.5 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.5
    Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
    """
    
    def __init__(self, mesh_topology_manager=None, contract_sync_manager=None, 
                governance_proposal=None, governance_mesh_integration=None):
        """
        Initialize the governance mesh UI components.
        
        Args:
            mesh_topology_manager: Reference to the MeshTopologyManager instance
            contract_sync_manager: Reference to the ContractSyncManager instance
            governance_proposal: Reference to the GovernancePolicyProposal instance
            governance_mesh_integration: Reference to the GovernanceMeshIntegration instance
        """
        # Perform pre-loop tether check to ensure Codex compliance
        self._perform_tether_check()
        
        self.mesh_topology_manager = mesh_topology_manager
        self.contract_sync_manager = contract_sync_manager
        self.governance_proposal = governance_proposal
        self.governance_mesh_integration = governance_mesh_integration
        
        # Initialize UI components
        self.ui_components = {
            "UI-12.21": {
                "name": "Codex Contract Dashboard",
                "schema_file": "contract_registry.schema.v1.json",
                "schema_version": "v1",
                "pending_data": False,
                "build_ready": True,
                "contract_clauses": ["5.5", "6.06", "11.3"],
                "depends_on": ["5.5", "6.06", "11.3"]
            },
            "UI-12.33": {
                "name": "Schema/Contract Drift Alert",
                "schema_file": "schema_drift.schema.v1.json",
                "schema_version": "v1",
                "pending_data": False,
                "build_ready": True,
                "contract_clauses": ["5.5", "11.0", "5.2.5"],
                "depends_on": ["5.5", "11.0"]
            },
            "UI-12.66": {
                "name": "Governance Mesh Visualization",
                "schema_file": "governance_mesh.schema.v1.json",
                "schema_version": "v1",
                "pending_data": False,
                "build_ready": True,
                "contract_clauses": ["5.5", "11.4"],
                "depends_on": ["5.4", "5.5", "11.4"]
            }
        }
        
        logger.info("GovernanceMeshUI initialized with %d UI components", len(self.ui_components))
    
    def _perform_tether_check(self) -> None:
        """
        Perform pre-loop tether check to ensure Codex compliance.
        
        This method verifies that the component is properly tethered to the Codex Contract
        before any operations are performed.
        
        Raises:
            ValueError: If tether check fails
        """
        # Check if .codex.lock exists and contains required phase and clauses
        codex_lock_path = os.path.join(os.path.dirname(__file__), '.codex.lock')
        if not os.path.exists(codex_lock_path):
            raise ValueError("Codex tether check failed: .codex.lock file not found")
        
        try:
            with open(codex_lock_path, 'r') as f:
                codex_content = f.read()
            
            # Check for Phase 5.5
            if "phase_id: 5.5" not in codex_content and "Phase 5.5 Governance Entry" not in codex_content:
                raise ValueError("Codex tether check failed: Phase 5.5 not found in .codex.lock")
            
            # Check for required clauses
            required_clauses = ["5.5", "5.4", "11.0", "11.1", "5.2.5"]
            for clause in required_clauses:
                if clause not in codex_content:
                    raise ValueError(f"Codex tether check failed: Required clause {clause} not found in .codex.lock")
            
            # Check for UI components in schema registry
            ui_schema_registry_path = os.path.join(os.path.dirname(__file__), 'schemas/ui/ui_schema_registry.json')
            if not os.path.exists(ui_schema_registry_path):
                raise ValueError("Codex tether check failed: UI schema registry not found")
            
            with open(ui_schema_registry_path, 'r') as f:
                ui_registry = json.load(f)
            
            required_ui_components = ["UI-12.21", "UI-12.33", "UI-12.66"]
            for component_id in required_ui_components:
                if component_id not in ui_registry:
                    raise ValueError(f"Codex tether check failed: Required UI component {component_id} not found in UI schema registry")
            
            logger.info("Codex tether check passed for GovernanceMeshUI")
        except Exception as e:
            logger.error("Codex tether check failed: %s", str(e))
            raise
    
    def get_ui_component_data(self, component_id: str) -> Dict[str, Any]:
        """
        Get data for a specific UI component.
        
        Args:
            component_id: ID of the UI component
            
        Returns:
            Component data object
        """
        logger.debug("Getting data for UI component %s", component_id)
        
        # Check if component exists
        if component_id not in self.ui_components:
            logger.error("UI component %s not found", component_id)
            raise ValueError(f"UI component {component_id} not found")
        
        component = self.ui_components[component_id]
        
        # Get component-specific data
        if component_id == "UI-12.21":  # Codex Contract Dashboard
            return self._get_contract_dashboard_data()
        elif component_id == "UI-12.33":  # Schema/Contract Drift Alert
            return self._get_schema_drift_alert_data()
        elif component_id == "UI-12.66":  # Governance Mesh Visualization
            return self._get_mesh_visualization_data()
        else:
            logger.error("Unknown UI component %s", component_id)
            raise ValueError(f"Unknown UI component {component_id}")
    
    def _get_contract_dashboard_data(self) -> Dict[str, Any]:
        """
        Get data for the Codex Contract Dashboard.
        
        Returns:
            Dashboard data object
        """
        logger.debug("Getting data for Codex Contract Dashboard")
        
        # Get contract data from contract sync manager
        if self.contract_sync_manager:
            try:
                contracts = self.contract_sync_manager.list_contracts()
                sync_status = self.contract_sync_manager.get_sync_status()
                
                return {
                    "component_id": "UI-12.21",
                    "name": "Codex Contract Dashboard",
                    "contracts": contracts,
                    "sync_status": sync_status,
                    "last_updated": datetime.utcnow().isoformat() + "Z"
                }
            except Exception as e:
                logger.error("Error getting contract dashboard data: %s", str(e))
                return {
                    "component_id": "UI-12.21",
                    "name": "Codex Contract Dashboard",
                    "error": str(e),
                    "last_updated": datetime.utcnow().isoformat() + "Z"
                }
        else:
            logger.warning("Contract sync manager not available")
            return {
                "component_id": "UI-12.21",
                "name": "Codex Contract Dashboard",
                "contracts": [],
                "sync_status": {"status": "unavailable"},
                "last_updated": datetime.utcnow().isoformat() + "Z"
            }
    
    def _get_schema_drift_alert_data(self) -> Dict[str, Any]:
        """
        Get data for the Schema/Contract Drift Alert.
        
        Returns:
            Drift alert data object
        """
        logger.debug("Getting data for Schema/Contract Drift Alert")
        
        # Get drift data from contract sync manager
        if self.contract_sync_manager:
            try:
                drift_alerts = self.contract_sync_manager.check_schema_drift()
                
                return {
                    "component_id": "UI-12.33",
                    "name": "Schema/Contract Drift Alert",
                    "drift_alerts": drift_alerts,
                    "last_checked": datetime.utcnow().isoformat() + "Z"
                }
            except Exception as e:
                logger.error("Error getting schema drift alert data: %s", str(e))
                return {
                    "component_id": "UI-12.33",
                    "name": "Schema/Contract Drift Alert",
                    "error": str(e),
                    "last_checked": datetime.utcnow().isoformat() + "Z"
                }
        else:
            logger.warning("Contract sync manager not available")
            return {
                "component_id": "UI-12.33",
                "name": "Schema/Contract Drift Alert",
                "drift_alerts": [],
                "last_checked": datetime.utcnow().isoformat() + "Z"
            }
    
    def _get_mesh_visualization_data(self) -> Dict[str, Any]:
        """
        Get data for the Governance Mesh Visualization.
        
        Returns:
            Mesh visualization data object
        """
        logger.debug("Getting data for Governance Mesh Visualization")
        
        # Get mesh topology data
        if self.mesh_topology_manager:
            try:
                topology = self.mesh_topology_manager.get_topology()
                metrics = self.mesh_topology_manager._calculate_topology_metrics()
                
                # Get verification data if available
                verification_data = {}
                if self.governance_mesh_integration:
                    verification_requests = self.governance_mesh_integration.list_verification_requests(limit=5)
                    verification_data = {
                        "verification_requests": verification_requests
                    }
                
                return {
                    "component_id": "UI-12.66",
                    "name": "Governance Mesh Visualization",
                    "topology": topology,
                    "metrics": metrics,
                    "verification_data": verification_data,
                    "last_updated": datetime.utcnow().isoformat() + "Z"
                }
            except Exception as e:
                logger.error("Error getting mesh visualization data: %s", str(e))
                return {
                    "component_id": "UI-12.66",
                    "name": "Governance Mesh Visualization",
                    "error": str(e),
                    "last_updated": datetime.utcnow().isoformat() + "Z"
                }
        else:
            logger.warning("Mesh topology manager not available")
            return {
                "component_id": "UI-12.66",
                "name": "Governance Mesh Visualization",
                "topology": {"nodes": [], "connections": []},
                "metrics": {},
                "last_updated": datetime.utcnow().isoformat() + "Z"
            }
    
    def render_contract_dashboard(self) -> Dict[str, Any]:
        """
        Render the Codex Contract Dashboard.
        
        Returns:
            Rendered dashboard object
        """
        logger.info("Rendering Codex Contract Dashboard")
        
        # Get dashboard data
        dashboard_data = self._get_contract_dashboard_data()
        
        # Prepare rendering data
        rendering = {
            "component_id": "UI-12.21",
            "name": "Codex Contract Dashboard",
            "render_timestamp": datetime.utcnow().isoformat() + "Z",
            "data": dashboard_data,
            "sections": [
                {
                    "id": "contract_summary",
                    "title": "Contract Summary",
                    "type": "summary",
                    "data": {
                        "total_contracts": len(dashboard_data.get("contracts", [])),
                        "sync_status": dashboard_data.get("sync_status", {}).get("status", "unknown")
                    }
                },
                {
                    "id": "contract_list",
                    "title": "Contract List",
                    "type": "table",
                    "data": dashboard_data.get("contracts", [])
                },
                {
                    "id": "sync_history",
                    "title": "Synchronization History",
                    "type": "timeline",
                    "data": dashboard_data.get("sync_status", {}).get("history", [])
                }
            ]
        }
        
        return rendering
    
    def render_schema_drift_alert(self) -> Dict[str, Any]:
        """
        Render the Schema/Contract Drift Alert.
        
        Returns:
            Rendered alert object
        """
        logger.info("Rendering Schema/Contract Drift Alert")
        
        # Get drift alert data
        drift_data = self._get_schema_drift_alert_data()
        
        # Prepare rendering data
        rendering = {
            "component_id": "UI-12.33",
            "name": "Schema/Contract Drift Alert",
            "render_timestamp": datetime.utcnow().isoformat() + "Z",
            "data": drift_data,
            "sections": [
                {
                    "id": "drift_summary",
                    "title": "Drift Summary",
                    "type": "summary",
                    "data": {
                        "total_alerts": len(drift_data.get("drift_alerts", [])),
                        "last_checked": drift_data.get("last_checked")
                    }
                },
                {
                    "id": "drift_alerts",
                    "title": "Drift Alerts",
                    "type": "alerts",
                    "data": drift_data.get("drift_alerts", [])
                }
            ]
        }
        
        return rendering
    
    def render_mesh_visualization(self) -> Dict[str, Any]:
        """
        Render the Governance Mesh Visualization.
        
        Returns:
            Rendered visualization object
        """
        logger.info("Rendering Governance Mesh Visualization")
        
        # Get mesh visualization data
        mesh_data = self._get_mesh_visualization_data()
        
        # Prepare rendering data
        rendering = {
            "component_id": "UI-12.66",
            "name": "Governance Mesh Visualization",
            "render_timestamp": datetime.utcnow().isoformat() + "Z",
            "data": mesh_data,
            "sections": [
                {
                    "id": "mesh_summary",
                    "title": "Mesh Summary",
                    "type": "summary",
                    "data": {
                        "node_count": mesh_data.get("metrics", {}).get("node_count", 0),
                        "connection_count": mesh_data.get("metrics", {}).get("connection_count", 0),
                        "average_path_length": mesh_data.get("metrics", {}).get("average_path_length", 0),
                        "last_updated": mesh_data.get("last_updated")
                    }
                },
                {
                    "id": "mesh_graph",
                    "title": "Mesh Network Graph",
                    "type": "graph",
                    "data": {
                        "nodes": mesh_data.get("topology", {}).get("nodes", []),
                        "connections": mesh_data.get("topology", {}).get("connections", [])
                    }
                },
                {
                    "id": "verification_status",
                    "title": "Verification Status",
                    "type": "status",
                    "data": mesh_data.get("verification_data", {}).get("verification_requests", [])
                }
            ]
        }
        
        return rendering
    
    def get_ui_component_html(self, component_id: str) -> str:
        """
        Get HTML representation of a UI component.
        
        Args:
            component_id: ID of the UI component
            
        Returns:
            HTML string
        """
        logger.debug("Getting HTML for UI component %s", component_id)
        
        # Check if component exists
        if component_id not in self.ui_components:
            logger.error("UI component %s not found", component_id)
            raise ValueError(f"UI component {component_id} not found")
        
        # Get component data
        if component_id == "UI-12.21":  # Codex Contract Dashboard
            rendering = self.render_contract_dashboard()
        elif component_id == "UI-12.33":  # Schema/Contract Drift Alert
            rendering = self.render_schema_drift_alert()
        elif component_id == "UI-12.66":  # Governance Mesh Visualization
            rendering = self.render_mesh_visualization()
        else:
            logger.error("Unknown UI component %s", component_id)
            raise ValueError(f"Unknown UI component {component_id}")
        
        # Generate HTML
        html = self._generate_component_html(rendering)
        
        return html
    
    def _generate_component_html(self, rendering: Dict[str, Any]) -> str:
        """
        Generate HTML for a UI component.
        
        Args:
            rendering: Rendering data
            
        Returns:
            HTML string
        """
        # In a real implementation, this would generate actual HTML
        # For now, we'll return a placeholder
        
        component_id = rendering.get("component_id", "unknown")
        component_name = rendering.get("name", "Unknown Component")
        render_timestamp = rendering.get("render_timestamp", datetime.utcnow().isoformat() + "Z")
        
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{component_name}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }}
        .component-header {{
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }}
        .component-section {{
            margin-bottom: 30px;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
        }}
        .section-title {{
            font-size: 18px;
            margin-bottom: 15px;
            color: #444;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }}
        .codex-reference {{
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }}
        .timestamp {{
            font-size: 12px;
            color: #999;
            margin-top: 10px;
        }}
    </style>
</head>
<body>
    <div class="component-header">
        <h1>{component_name}</h1>
        <div class="codex-reference">
            Component ID: {component_id}<br>
            Codex Contract: v2025.05.18<br>
            Phase ID: 5.5<br>
            Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
        </div>
        <div class="timestamp">
            Rendered at: {render_timestamp}
        </div>
    </div>
"""
        
        # Add sections
        for section in rendering.get("sections", []):
            section_id = section.get("id", "unknown")
            section_title = section.get("title", "Unknown Section")
            section_type = section.get("type", "unknown")
            
            html += f"""
    <div class="component-section" id="{section_id}">
        <h2 class="section-title">{section_title}</h2>
        <div class="section-content section-type-{section_type}">
            <!-- Content for {section_type} would be rendered here -->
            <p>This is a placeholder for the {section_type} content of the {section_title} section.</p>
        </div>
    </div>
"""
        
        # Close HTML
        html += """
    <script>
        // JavaScript for component functionality would be here
        console.log('Component initialized');
    </script>
</body>
</html>
"""
        
        return html
    
    def update_ui_schema_registry(self) -> Dict[str, Any]:
        """
        Update the UI schema registry with the latest component information.
        
        Returns:
            Update result object
        """
        logger.info("Updating UI schema registry")
        
        try:
            # Get UI schema registry path
            ui_schema_registry_path = os.path.join(os.path.dirname(__file__), 'schemas/ui/ui_schema_registry.json')
            
            # Read current registry
            with open(ui_schema_registry_path, 'r') as f:
                registry = json.load(f)
            
            # Update components
            for component_id, component in self.ui_components.items():
                if component_id in registry:
                    # Update existing component
                    registry[component_id].update(component)
                else:
                    # Add new component
                    registry[component_id] = component
            
            # Update last_updated timestamp
            registry["last_updated"] = datetime.utcnow().isoformat() + "Z"
            
            # Write updated registry
            with open(ui_schema_registry_path, 'w') as f:
                json.dump(registry, f, indent=2)
            
            logger.info("Updated UI schema registry with %d components", len(self.ui_components))
            
            return {
                "status": "success",
                "components_updated": list(self.ui_components.keys()),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        except Exception as e:
            logger.error("Error updating UI schema registry: %s", str(e))
            return {
                "status": "failed",
                "reason": str(e),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
    
    def check_ui_data_readiness(self) -> Dict[str, Any]:
        """
        Check if all UI components have the necessary data.
        
        Returns:
            Readiness check result object
        """
        logger.info("Checking UI data readiness")
        
        results = {}
        all_ready = True
        
        for component_id, component in self.ui_components.items():
            try:
                # Get component data
                data = self.get_ui_component_data(component_id)
                
                # Check if data is available
                if "error" in data:
                    results[component_id] = {
                        "status": "error",
                        "reason": data["error"],
                        "ready": False
                    }
                    all_ready = False
                else:
                    results[component_id] = {
                        "status": "ready",
                        "ready": True
                    }
            except Exception as e:
                logger.error("Error checking data readiness for component %s: %s", component_id, str(e))
                results[component_id] = {
                    "status": "error",
                    "reason": str(e),
                    "ready": False
                }
                all_ready = False
        
        logger.info("UI data readiness check complete: %s", "all ready" if all_ready else "not all ready")
        
        return {
            "status": "success" if all_ready else "partial",
            "all_ready": all_ready,
            "component_results": results,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
