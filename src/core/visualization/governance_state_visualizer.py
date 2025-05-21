"""
Governance State Visualizer for the Governance Visualization framework.

This module provides functionality to visualize the current state of governance
across the system, including active policies, decision frameworks, and governance primitives.

It integrates with:
- Minimal Viable Governance (5.11)
- Governance Expansion Protocol (5.12)
- Trust Boundary Definition (5.13)
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union
import datetime

# Import necessary components from previous phases
from src.core.governance.governance_primitive_manager import GovernancePrimitiveManager
from src.core.governance.decision_framework_engine import DecisionFrameworkEngine
from src.core.governance.policy_management_module import PolicyManagementModule
from src.core.governance.module_extension_registry import ModuleExtensionRegistry
from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer

class GovernanceStateVisualizer:
    """
    Visualizes the current state of governance across the system.
    
    Integrates with:
    - Minimal Viable Governance (5.11)
    - Governance Expansion Protocol (5.12)
    - Trust Boundary Definition (5.13)
    """
    
    def __init__(self, 
                 governance_registry: Optional[GovernancePrimitiveManager] = None,
                 decision_engine: Optional[DecisionFrameworkEngine] = None,
                 policy_manager: Optional[PolicyManagementModule] = None,
                 extension_registry: Optional[ModuleExtensionRegistry] = None,
                 boundary_engine: Optional[BoundaryDetectionEngine] = None,
                 data_transformer: Optional[VisualizationDataTransformer] = None):
        """
        Initialize the GovernanceStateVisualizer.
        
        Args:
            governance_registry: GovernancePrimitiveManager for accessing governance primitives
            decision_engine: DecisionFrameworkEngine for accessing decision frameworks
            policy_manager: PolicyManagementModule for accessing policies
            extension_registry: ModuleExtensionRegistry for accessing module extensions
            boundary_engine: BoundaryDetectionEngine for accessing trust boundaries
            data_transformer: VisualizationDataTransformer for transforming data
        """
        self.logger = logging.getLogger(__name__)
        self.governance_registry = governance_registry
        self.decision_engine = decision_engine
        self.policy_manager = policy_manager
        self.extension_registry = extension_registry
        self.boundary_engine = boundary_engine
        self.data_transformer = data_transformer or VisualizationDataTransformer()
        
    def generate_governance_state_view(self, 
                                      include_primitives: bool = True,
                                      include_decisions: bool = True,
                                      include_policies: bool = True,
                                      include_extensions: bool = True,
                                      include_boundaries: bool = True) -> Dict[str, Any]:
        """
        Generates a comprehensive view of the current governance state.
        
        Args:
            include_primitives: Whether to include governance primitives
            include_decisions: Whether to include decision frameworks
            include_policies: Whether to include policies
            include_extensions: Whether to include module extensions
            include_boundaries: Whether to include trust boundaries
            
        Returns:
            dict: Structured representation of governance state
        """
        self.logger.info("Generating governance state view")
        
        # Initialize state data structure
        state_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "components": {}
        }
        
        # Collect governance primitives if available and requested
        if include_primitives and self.governance_registry:
            state_data["components"]["primitives"] = self._collect_governance_primitives()
        
        # Collect decision frameworks if available and requested
        if include_decisions and self.decision_engine:
            state_data["components"]["decisions"] = self._collect_decision_frameworks()
        
        # Collect policies if available and requested
        if include_policies and self.policy_manager:
            state_data["components"]["policies"] = self._collect_policies()
        
        # Collect module extensions if available and requested
        if include_extensions and self.extension_registry:
            state_data["components"]["extensions"] = self._collect_module_extensions()
        
        # Collect trust boundaries if available and requested
        if include_boundaries and self.boundary_engine:
            state_data["components"]["boundaries"] = self._collect_trust_boundaries()
        
        # Transform data for visualization
        visualization_data = self.data_transformer.transform_governance_data(
            state_data, visualization_type="state"
        )
        
        return visualization_data
    
    def generate_policy_heatmap(self, 
                               policy_type: Optional[str] = None,
                               granularity: str = "module") -> Dict[str, Any]:
        """
        Generates a heatmap visualization of policy enforcement across the system.
        
        Args:
            policy_type: Optional filter for policy type
            granularity: Granularity level for the heatmap (module, component, function)
            
        Returns:
            dict: Heatmap data structure
        """
        self.logger.info(f"Generating policy heatmap with granularity {granularity}")
        
        if not self.policy_manager:
            self.logger.error("Policy manager not available")
            raise ValueError("Policy manager is required for policy heatmap generation")
        
        # Collect policy enforcement data
        enforcement_data = self._collect_policy_enforcement(policy_type, granularity)
        
        # Create heatmap structure
        heatmap_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "type": "policy_heatmap",
            "policy_type": policy_type,
            "granularity": granularity,
            "data": enforcement_data
        }
        
        # Transform data for visualization
        visualization_data = self.data_transformer.transform_governance_data(
            heatmap_data, visualization_type="heatmap"
        )
        
        return visualization_data
    
    def generate_governance_network(self, 
                                   include_relationships: bool = True,
                                   include_dependencies: bool = True) -> Dict[str, Any]:
        """
        Generates a network visualization of governance components and their relationships.
        
        Args:
            include_relationships: Whether to include component relationships
            include_dependencies: Whether to include component dependencies
            
        Returns:
            dict: Network visualization data structure
        """
        self.logger.info("Generating governance network visualization")
        
        # Collect nodes (governance components)
        nodes = []
        
        # Add primitives as nodes if available
        if self.governance_registry:
            primitive_nodes = self._collect_governance_primitive_nodes()
            nodes.extend(primitive_nodes)
        
        # Add policies as nodes if available
        if self.policy_manager:
            policy_nodes = self._collect_policy_nodes()
            nodes.extend(policy_nodes)
        
        # Add decision frameworks as nodes if available
        if self.decision_engine:
            decision_nodes = self._collect_decision_framework_nodes()
            nodes.extend(decision_nodes)
        
        # Add module extensions as nodes if available
        if self.extension_registry:
            extension_nodes = self._collect_module_extension_nodes()
            nodes.extend(extension_nodes)
        
        # Add trust boundaries as nodes if available
        if self.boundary_engine:
            boundary_nodes = self._collect_trust_boundary_nodes()
            nodes.extend(boundary_nodes)
        
        # Collect edges (relationships and dependencies)
        edges = []
        
        if include_relationships:
            relationship_edges = self._collect_relationship_edges()
            edges.extend(relationship_edges)
        
        if include_dependencies:
            dependency_edges = self._collect_dependency_edges()
            edges.extend(dependency_edges)
        
        # Create network structure
        network_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "type": "governance_network",
            "nodes": nodes,
            "edges": edges
        }
        
        # Transform data for visualization
        visualization_data = self.data_transformer.transform_governance_data(
            network_data, visualization_type="network"
        )
        
        return visualization_data
    
    def generate_governance_timeline(self, 
                                    time_period: str = "monthly",
                                    component_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates a timeline visualization of governance events and changes.
        
        Args:
            time_period: Time period for the timeline (daily, weekly, monthly)
            component_type: Optional filter for component type
            
        Returns:
            dict: Timeline visualization data structure
        """
        self.logger.info(f"Generating governance timeline for {time_period} period")
        
        # Determine date range based on time period
        end_date = datetime.datetime.now()
        if time_period == "daily":
            start_date = end_date - datetime.timedelta(days=1)
        elif time_period == "weekly":
            start_date = end_date - datetime.timedelta(weeks=1)
        elif time_period == "monthly":
            start_date = end_date - datetime.timedelta(days=30)
        else:
            start_date = end_date - datetime.timedelta(days=30)  # Default to monthly
        
        # Collect timeline events
        events = self._collect_governance_events(start_date, end_date, component_type)
        
        # Create timeline structure
        timeline_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "type": "governance_timeline",
            "time_period": time_period,
            "component_type": component_type,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "events": events
        }
        
        # Transform data for visualization
        visualization_data = self.data_transformer.transform_governance_data(
            timeline_data, visualization_type="timeline"
        )
        
        return visualization_data
    
    def _collect_governance_primitives(self) -> List[Dict[str, Any]]:
        """
        Collects governance primitives from the registry.
        
        Returns:
            list: List of governance primitives
        """
        primitives = []
        
        try:
            if self.governance_registry:
                # Get all primitives from the registry
                all_primitives = self.governance_registry.get_all_primitives()
                
                for primitive in all_primitives:
                    primitives.append({
                        "id": primitive.get("id", ""),
                        "type": primitive.get("type", ""),
                        "name": primitive.get("name", ""),
                        "description": primitive.get("description", ""),
                        "status": primitive.get("status", "active"),
                        "created_at": primitive.get("created_at", ""),
                        "updated_at": primitive.get("updated_at", ""),
                        "metadata": primitive.get("metadata", {})
                    })
        except Exception as e:
            self.logger.error(f"Error collecting governance primitives: {str(e)}")
        
        return primitives
    
    def _collect_decision_frameworks(self) -> List[Dict[str, Any]]:
        """
        Collects decision frameworks from the decision engine.
        
        Returns:
            list: List of decision frameworks
        """
        frameworks = []
        
        try:
            if self.decision_engine:
                # Get all decision frameworks
                all_frameworks = self.decision_engine.get_all_frameworks()
                
                for framework in all_frameworks:
                    frameworks.append({
                        "id": framework.get("id", ""),
                        "name": framework.get("name", ""),
                        "description": framework.get("description", ""),
                        "status": framework.get("status", "active"),
                        "decision_count": framework.get("decision_count", 0),
                        "created_at": framework.get("created_at", ""),
                        "updated_at": framework.get("updated_at", ""),
                        "metadata": framework.get("metadata", {})
                    })
        except Exception as e:
            self.logger.error(f"Error collecting decision frameworks: {str(e)}")
        
        return frameworks
    
    def _collect_policies(self) -> List[Dict[str, Any]]:
        """
        Collects policies from the policy manager.
        
        Returns:
            list: List of policies
        """
        policies = []
        
        try:
            if self.policy_manager:
                # Get all policies
                all_policies = self.policy_manager.get_all_policies()
                
                for policy in all_policies:
                    policies.append({
                        "id": policy.get("id", ""),
                        "name": policy.get("name", ""),
                        "description": policy.get("description", ""),
                        "type": policy.get("type", ""),
                        "status": policy.get("status", "active"),
                        "enforcement_level": policy.get("enforcement_level", ""),
                        "created_at": policy.get("created_at", ""),
                        "updated_at": policy.get("updated_at", ""),
                        "metadata": policy.get("metadata", {})
                    })
        except Exception as e:
            self.logger.error(f"Error collecting policies: {str(e)}")
        
        return policies
    
    def _collect_module_extensions(self) -> List[Dict[str, Any]]:
        """
        Collects module extensions from the extension registry.
        
        Returns:
            list: List of module extensions
        """
        extensions = []
        
        try:
            if self.extension_registry:
                # Get all module extensions
                all_extensions = self.extension_registry.get_all_extensions()
                
                for extension in all_extensions:
                    extensions.append({
                        "id": extension.get("id", ""),
                        "name": extension.get("name", ""),
                        "description": extension.get("description", ""),
                        "version": extension.get("version", ""),
                        "status": extension.get("status", "active"),
                        "compatibility": extension.get("compatibility", {}),
                        "created_at": extension.get("created_at", ""),
                        "updated_at": extension.get("updated_at", ""),
                        "metadata": extension.get("metadata", {})
                    })
        except Exception as e:
            self.logger.error(f"Error collecting module extensions: {str(e)}")
        
        return extensions
    
    def _collect_trust_boundaries(self) -> List[Dict[str, Any]]:
        """
        Collects trust boundaries from the boundary engine.
        
        Returns:
            list: List of trust boundaries
        """
        boundaries = []
        
        try:
            if self.boundary_engine:
                # Get all trust boundaries
                all_boundaries = self.boundary_engine.get_all_boundaries()
                
                for boundary in all_boundaries:
                    boundaries.append({
                        "id": boundary.get("id", ""),
                        "name": boundary.get("name", ""),
                        "description": boundary.get("description", ""),
                        "type": boundary.get("type", ""),
                        "status": boundary.get("status", "active"),
                        "integrity": boundary.get("integrity", 0),
                        "created_at": boundary.get("created_at", ""),
                        "updated_at": boundary.get("updated_at", ""),
                        "metadata": boundary.get("metadata", {})
                    })
        except Exception as e:
            self.logger.error(f"Error collecting trust boundaries: {str(e)}")
        
        return boundaries
    
    def _collect_policy_enforcement(self, 
                                   policy_type: Optional[str] = None,
                                   granularity: str = "module") -> List[Dict[str, Any]]:
        """
        Collects policy enforcement data for heatmap visualization.
        
        Args:
            policy_type: Optional filter for policy type
            granularity: Granularity level for the data
            
        Returns:
            list: Policy enforcement data
        """
        enforcement_data = []
        
        try:
            if self.policy_manager:
                # Get policy enforcement metrics
                if policy_type:
                    metrics = self.policy_manager.get_enforcement_metrics(
                        policy_type=policy_type, granularity=granularity
                    )
                else:
                    metrics = self.policy_manager.get_enforcement_metrics(
                        granularity=granularity
                    )
                
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
                    
                    enforcement_data.append({
                        "x": x,
                        "y": y,
                        "value": value,
                        "component": component
                    })
        except Exception as e:
            self.logger.error(f"Error collecting policy enforcement data: {str(e)}")
        
        return enforcement_data
    
    def _collect_governance_primitive_nodes(self) -> List[Dict[str, Any]]:
        """
        Collects governance primitives as nodes for network visualization.
        
        Returns:
            list: Governance primitive nodes
        """
        nodes = []
        
        try:
            if self.governance_registry:
                primitives = self.governance_registry.get_all_primitives()
                
                for primitive in primitives:
                    nodes.append({
                        "id": primitive.get("id", ""),
                        "label": primitive.get("name", ""),
                        "type": "primitive",
                        "subtype": primitive.get("type", ""),
                        "status": primitive.get("status", "active"),
                        "size": 1.0,  # Default size
                        "color": "#4285F4"  # Blue for primitives
                    })
        except Exception as e:
            self.logger.error(f"Error collecting governance primitive nodes: {str(e)}")
        
        return nodes
    
    def _collect_policy_nodes(self) -> List[Dict[str, Any]]:
        """
        Collects policies as nodes for network visualization.
        
        Returns:
            list: Policy nodes
        """
        nodes = []
        
        try:
            if self.policy_manager:
                policies = self.policy_manager.get_all_policies()
                
                for policy in policies:
                    nodes.append({
                        "id": policy.get("id", ""),
                        "label": policy.get("name", ""),
                        "type": "policy",
                        "subtype": policy.get("type", ""),
                        "status": policy.get("status", "active"),
                        "size": 1.2,  # Slightly larger than primitives
                        "color": "#0F9D58"  # Green for policies
                    })
        except Exception as e:
            self.logger.error(f"Error collecting policy nodes: {str(e)}")
        
        return nodes
    
    def _collect_decision_framework_nodes(self) -> List[Dict[str, Any]]:
        """
        Collects decision frameworks as nodes for network visualization.
        
        Returns:
            list: Decision framework nodes
        """
        nodes = []
        
        try:
            if self.decision_engine:
                frameworks = self.decision_engine.get_all_frameworks()
                
                for framework in frameworks:
                    nodes.append({
                        "id": framework.get("id", ""),
                        "label": framework.get("name", ""),
                        "type": "decision_framework",
                        "status": framework.get("status", "active"),
                        "size": 1.5,  # Larger than policies
                        "color": "#DB4437"  # Red for decision frameworks
                    })
        except Exception as e:
            self.logger.error(f"Error collecting decision framework nodes: {str(e)}")
        
        return nodes
    
    def _collect_module_extension_nodes(self) -> List[Dict[str, Any]]:
        """
        Collects module extensions as nodes for network visualization.
        
        Returns:
            list: Module extension nodes
        """
        nodes = []
        
        try:
            if self.extension_registry:
                extensions = self.extension_registry.get_all_extensions()
                
                for extension in extensions:
                    nodes.append({
                        "id": extension.get("id", ""),
                        "label": extension.get("name", ""),
                        "type": "module_extension",
                        "status": extension.get("status", "active"),
                        "size": 1.3,  # Between policies and decision frameworks
                        "color": "#F4B400"  # Yellow for extensions
                    })
        except Exception as e:
            self.logger.error(f"Error collecting module extension nodes: {str(e)}")
        
        return nodes
    
    def _collect_trust_boundary_nodes(self) -> List[Dict[str, Any]]:
        """
        Collects trust boundaries as nodes for network visualization.
        
        Returns:
            list: Trust boundary nodes
        """
        nodes = []
        
        try:
            if self.boundary_engine:
                boundaries = self.boundary_engine.get_all_boundaries()
                
                for boundary in boundaries:
                    nodes.append({
                        "id": boundary.get("id", ""),
                        "label": boundary.get("name", ""),
                        "type": "trust_boundary",
                        "subtype": boundary.get("type", ""),
                        "status": boundary.get("status", "active"),
                        "size": 1.8,  # Largest nodes
                        "color": "#9C27B0"  # Purple for boundaries
                    })
        except Exception as e:
            self.logger.error(f"Error collecting trust boundary nodes: {str(e)}")
        
        return nodes
    
    def _collect_relationship_edges(self) -> List[Dict[str, Any]]:
        """
        Collects relationship edges for network visualization.
        
        Returns:
            list: Relationship edges
        """
        edges = []
        
        try:
            # Collect primitive relationships
            if self.governance_registry:
                primitives = self.governance_registry.get_all_primitives()
                
                for primitive in primitives:
                    if "relationships" in primitive:
                        for relationship in primitive["relationships"]:
                            edges.append({
                                "id": f"rel_{primitive['id']}_{relationship['target_id']}",
                                "source": primitive["id"],
                                "target": relationship["target_id"],
                                "label": relationship.get("type", "relates_to"),
                                "type": "relationship",
                                "weight": 1.0,
                                "color": "#4285F4"  # Blue for relationships
                            })
            
            # Collect policy relationships
            if self.policy_manager:
                policies = self.policy_manager.get_all_policies()
                
                for policy in policies:
                    if "targets" in policy:
                        for target in policy["targets"]:
                            edges.append({
                                "id": f"pol_{policy['id']}_{target['id']}",
                                "source": policy["id"],
                                "target": target["id"],
                                "label": "governs",
                                "type": "policy",
                                "weight": 1.2,
                                "color": "#0F9D58"  # Green for policy edges
                            })
            
            # Collect boundary relationships
            if self.boundary_engine:
                boundaries = self.boundary_engine.get_all_boundaries()
                
                for boundary in boundaries:
                    if "domains" in boundary:
                        for domain in boundary["domains"]:
                            edges.append({
                                "id": f"bound_{boundary['id']}_{domain['id']}",
                                "source": boundary["id"],
                                "target": domain["id"],
                                "label": "contains",
                                "type": "boundary",
                                "weight": 1.5,
                                "color": "#9C27B0"  # Purple for boundary edges
                            })
        except Exception as e:
            self.logger.error(f"Error collecting relationship edges: {str(e)}")
        
        return edges
    
    def _collect_dependency_edges(self) -> List[Dict[str, Any]]:
        """
        Collects dependency edges for network visualization.
        
        Returns:
            list: Dependency edges
        """
        edges = []
        
        try:
            # Collect extension dependencies
            if self.extension_registry:
                extensions = self.extension_registry.get_all_extensions()
                
                for extension in extensions:
                    if "dependencies" in extension:
                        for dependency in extension["dependencies"]:
                            edges.append({
                                "id": f"dep_{extension['id']}_{dependency['id']}",
                                "source": extension["id"],
                                "target": dependency["id"],
                                "label": "depends_on",
                                "type": "dependency",
                                "weight": 0.8,
                                "color": "#F4B400"  # Yellow for dependencies
                            })
            
            # Collect decision framework dependencies
            if self.decision_engine:
                frameworks = self.decision_engine.get_all_frameworks()
                
                for framework in frameworks:
                    if "dependencies" in framework:
                        for dependency in framework["dependencies"]:
                            edges.append({
                                "id": f"dec_{framework['id']}_{dependency['id']}",
                                "source": framework["id"],
                                "target": dependency["id"],
                                "label": "uses",
                                "type": "decision",
                                "weight": 0.9,
                                "color": "#DB4437"  # Red for decision edges
                            })
        except Exception as e:
            self.logger.error(f"Error collecting dependency edges: {str(e)}")
        
        return edges
    
    def _collect_governance_events(self, 
                                  start_date: datetime.datetime,
                                  end_date: datetime.datetime,
                                  component_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Collects governance events for timeline visualization.
        
        Args:
            start_date: Start date for events
            end_date: End date for events
            component_type: Optional filter for component type
            
        Returns:
            list: Governance events
        """
        events = []
        
        try:
            # Collect primitive events
            if self.governance_registry and (not component_type or component_type == "primitive"):
                primitive_events = self.governance_registry.get_events(start_date, end_date)
                
                for event in primitive_events:
                    events.append({
                        "id": event.get("id", ""),
                        "timestamp": event.get("timestamp", ""),
                        "type": "primitive",
                        "subtype": event.get("subtype", ""),
                        "component_id": event.get("primitive_id", ""),
                        "component_name": event.get("primitive_name", ""),
                        "description": event.get("description", ""),
                        "metadata": event.get("metadata", {})
                    })
            
            # Collect policy events
            if self.policy_manager and (not component_type or component_type == "policy"):
                policy_events = self.policy_manager.get_events(start_date, end_date)
                
                for event in policy_events:
                    events.append({
                        "id": event.get("id", ""),
                        "timestamp": event.get("timestamp", ""),
                        "type": "policy",
                        "subtype": event.get("subtype", ""),
                        "component_id": event.get("policy_id", ""),
                        "component_name": event.get("policy_name", ""),
                        "description": event.get("description", ""),
                        "metadata": event.get("metadata", {})
                    })
            
            # Collect decision framework events
            if self.decision_engine and (not component_type or component_type == "decision"):
                decision_events = self.decision_engine.get_events(start_date, end_date)
                
                for event in decision_events:
                    events.append({
                        "id": event.get("id", ""),
                        "timestamp": event.get("timestamp", ""),
                        "type": "decision",
                        "subtype": event.get("subtype", ""),
                        "component_id": event.get("framework_id", ""),
                        "component_name": event.get("framework_name", ""),
                        "description": event.get("description", ""),
                        "metadata": event.get("metadata", {})
                    })
            
            # Collect extension events
            if self.extension_registry and (not component_type or component_type == "extension"):
                extension_events = self.extension_registry.get_events(start_date, end_date)
                
                for event in extension_events:
                    events.append({
                        "id": event.get("id", ""),
                        "timestamp": event.get("timestamp", ""),
                        "type": "extension",
                        "subtype": event.get("subtype", ""),
                        "component_id": event.get("extension_id", ""),
                        "component_name": event.get("extension_name", ""),
                        "description": event.get("description", ""),
                        "metadata": event.get("metadata", {})
                    })
            
            # Collect boundary events
            if self.boundary_engine and (not component_type or component_type == "boundary"):
                boundary_events = self.boundary_engine.get_events(start_date, end_date)
                
                for event in boundary_events:
                    events.append({
                        "id": event.get("id", ""),
                        "timestamp": event.get("timestamp", ""),
                        "type": "boundary",
                        "subtype": event.get("subtype", ""),
                        "component_id": event.get("boundary_id", ""),
                        "component_name": event.get("boundary_name", ""),
                        "description": event.get("description", ""),
                        "metadata": event.get("metadata", {})
                    })
            
            # Sort events by timestamp
            events.sort(key=lambda x: x.get("timestamp", ""))
        except Exception as e:
            self.logger.error(f"Error collecting governance events: {str(e)}")
        
        return events
