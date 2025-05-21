"""
Boundary Detection Engine for the Trust Boundary Definition framework.

This module provides functionality for detecting, classifying, and managing trust boundaries
within the Promethios system. It identifies points where trust assumptions change and
maintains metadata about these boundaries.
"""

import os
import json
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple

# Import dependencies from previous phases
from src.core.governance.governance_primitive_manager import GovernancePrimitiveManager
from src.core.trust.trust_metrics_calculator import TrustMetricsCalculator
from src.core.verification.seal_verification import SealVerificationService
from src.core.common.schema_validator import SchemaValidator

class BoundaryDetectionEngine:
    """
    Engine for detecting and managing trust boundaries within the Promethios system.
    
    The BoundaryDetectionEngine is responsible for identifying points in the system where
    trust assumptions change, classifying these boundaries, and maintaining metadata about them.
    It provides functionality for automatic boundary detection, boundary classification,
    relationship mapping, and change detection.
    """
    
    def __init__(
        self,
        governance_primitive_manager: GovernancePrimitiveManager,
        trust_metrics_calculator: TrustMetricsCalculator,
        seal_verification_service: SealVerificationService,
        schema_validator: SchemaValidator,
        boundaries_file_path: str = None
    ):
        """
        Initialize the BoundaryDetectionEngine.
        
        Args:
            governance_primitive_manager: Manager for governance primitives
            trust_metrics_calculator: Calculator for trust metrics
            seal_verification_service: Service for verifying seals
            schema_validator: Validator for schema compliance
            boundaries_file_path: Path to the file storing boundary definitions
        """
        self.governance_primitive_manager = governance_primitive_manager
        self.trust_metrics_calculator = trust_metrics_calculator
        self.seal_verification_service = seal_verification_service
        self.schema_validator = schema_validator
        
        # Set default boundaries file path if not provided
        if boundaries_file_path is None:
            boundaries_file_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                "data",
                "trust",
                "boundaries.json"
            )
        
        self.boundaries_file_path = boundaries_file_path
        self.boundaries = {}
        self.boundary_relationships = {}
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(self.boundaries_file_path), exist_ok=True)
        
        # Load existing boundaries if file exists
        if os.path.exists(self.boundaries_file_path):
            self._load_boundaries()
        else:
            self._save_boundaries()
        
        self.logger = logging.getLogger(__name__)
    
    def _load_boundaries(self) -> None:
        """
        Load boundaries from the boundaries file.
        """
        try:
            with open(self.boundaries_file_path, 'r') as f:
                data = json.load(f)
                self.boundaries = data.get('boundaries', {})
                self.boundary_relationships = data.get('relationships', {})
        except Exception as e:
            self.logger.error(f"Error loading boundaries: {str(e)}")
            self.boundaries = {}
            self.boundary_relationships = {}
    
    def _save_boundaries(self) -> None:
        """
        Save boundaries to the boundaries file.
        """
        try:
            data = {
                'boundaries': self.boundaries,
                'relationships': self.boundary_relationships
            }
            
            # Create a seal for the boundaries data
            seal = self.seal_verification_service.create_seal(json.dumps(data))
            data['seal'] = seal
            
            with open(self.boundaries_file_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving boundaries: {str(e)}")
    
    def detect_boundaries(self, system_components: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect trust boundaries within the system based on provided components.
        
        Args:
            system_components: List of system components to analyze
            
        Returns:
            List of detected boundaries
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("detect_boundaries")
        
        detected_boundaries = []
        
        # Process components to identify potential boundaries
        for component in system_components:
            # Detect process boundaries
            if self._is_process_boundary(component):
                boundary = self._create_boundary(
                    name=f"Process boundary for {component.get('name', 'Unknown')}",
                    description=f"Trust boundary between processes for {component.get('name', 'Unknown')}",
                    boundary_type="process",
                    component_id=component.get('id'),
                    detection_confidence=0.9
                )
                detected_boundaries.append(boundary)
            
            # Detect network boundaries
            if self._is_network_boundary(component):
                boundary = self._create_boundary(
                    name=f"Network boundary for {component.get('name', 'Unknown')}",
                    description=f"Trust boundary across network interfaces for {component.get('name', 'Unknown')}",
                    boundary_type="network",
                    component_id=component.get('id'),
                    detection_confidence=0.85
                )
                detected_boundaries.append(boundary)
            
            # Detect data boundaries
            if self._is_data_boundary(component):
                boundary = self._create_boundary(
                    name=f"Data boundary for {component.get('name', 'Unknown')}",
                    description=f"Trust boundary for data access in {component.get('name', 'Unknown')}",
                    boundary_type="data",
                    component_id=component.get('id'),
                    detection_confidence=0.8
                )
                detected_boundaries.append(boundary)
            
            # Detect user boundaries
            if self._is_user_boundary(component):
                boundary = self._create_boundary(
                    name=f"User boundary for {component.get('name', 'Unknown')}",
                    description=f"Trust boundary between user interactions for {component.get('name', 'Unknown')}",
                    boundary_type="user",
                    component_id=component.get('id'),
                    detection_confidence=0.75
                )
                detected_boundaries.append(boundary)
            
            # Detect module boundaries
            if self._is_module_boundary(component):
                boundary = self._create_boundary(
                    name=f"Module boundary for {component.get('name', 'Unknown')}",
                    description=f"Trust boundary between modules for {component.get('name', 'Unknown')}",
                    boundary_type="module",
                    component_id=component.get('id'),
                    detection_confidence=0.9
                )
                detected_boundaries.append(boundary)
            
            # Detect governance boundaries
            if self._is_governance_boundary(component):
                boundary = self._create_boundary(
                    name=f"Governance boundary for {component.get('name', 'Unknown')}",
                    description=f"Trust boundary for governance in {component.get('name', 'Unknown')}",
                    boundary_type="governance",
                    component_id=component.get('id'),
                    detection_confidence=0.95
                )
                detected_boundaries.append(boundary)
        
        # Save the detected boundaries
        for boundary in detected_boundaries:
            self.boundaries[boundary['boundary_id']] = boundary
        
        self._save_boundaries()
        
        return detected_boundaries
    
    def _is_process_boundary(self, component: Dict[str, Any]) -> bool:
        """
        Determine if a component represents a process boundary.
        
        Args:
            component: Component to analyze
            
        Returns:
            True if the component represents a process boundary, False otherwise
        """
        # Check if component has process-related attributes
        if component.get('type') == 'process' or component.get('category') == 'process':
            return True
        
        # Check if component has inter-process communication
        if 'interfaces' in component and any(i.get('type') == 'ipc' for i in component['interfaces']):
            return True
        
        # Check if component has process isolation
        if component.get('isolation') == 'process':
            return True
        
        return False
    
    def _is_network_boundary(self, component: Dict[str, Any]) -> bool:
        """
        Determine if a component represents a network boundary.
        
        Args:
            component: Component to analyze
            
        Returns:
            True if the component represents a network boundary, False otherwise
        """
        # Check if component has network-related attributes
        if component.get('type') == 'network' or component.get('category') == 'network':
            return True
        
        # Check if component has network interfaces
        if 'interfaces' in component and any(i.get('type') == 'network' for i in component['interfaces']):
            return True
        
        # Check if component has network protocols
        if 'protocols' in component and any(p in ['http', 'https', 'tcp', 'udp'] for p in component['protocols']):
            return True
        
        return False
    
    def _is_data_boundary(self, component: Dict[str, Any]) -> bool:
        """
        Determine if a component represents a data boundary.
        
        Args:
            component: Component to analyze
            
        Returns:
            True if the component represents a data boundary, False otherwise
        """
        # Check if component has data-related attributes
        if component.get('type') == 'data' or component.get('category') == 'data':
            return True
        
        # Check if component has data storage
        if 'storage' in component or component.get('persistence') is True:
            return True
        
        # Check if component has data transformation
        if 'data_transformations' in component:
            return True
        
        return False
    
    def _is_user_boundary(self, component: Dict[str, Any]) -> bool:
        """
        Determine if a component represents a user boundary.
        
        Args:
            component: Component to analyze
            
        Returns:
            True if the component represents a user boundary, False otherwise
        """
        # Check if component has user-related attributes
        if component.get('type') == 'user' or component.get('category') == 'user':
            return True
        
        # Check if component has user interfaces
        if 'interfaces' in component and any(i.get('type') == 'ui' for i in component['interfaces']):
            return True
        
        # Check if component has user authentication
        if 'authentication' in component:
            return True
        
        return False
    
    def _is_module_boundary(self, component: Dict[str, Any]) -> bool:
        """
        Determine if a component represents a module boundary.
        
        Args:
            component: Component to analyze
            
        Returns:
            True if the component represents a module boundary, False otherwise
        """
        # Check if component has module-related attributes
        if component.get('type') == 'module' or component.get('category') == 'module':
            return True
        
        # Check if component has module interfaces
        if 'interfaces' in component and any(i.get('type') == 'module' for i in component['interfaces']):
            return True
        
        # Check if component has module dependencies
        if 'dependencies' in component:
            return True
        
        return False
    
    def _is_governance_boundary(self, component: Dict[str, Any]) -> bool:
        """
        Determine if a component represents a governance boundary.
        
        Args:
            component: Component to analyze
            
        Returns:
            True if the component represents a governance boundary, False otherwise
        """
        # Check if component has governance-related attributes
        if component.get('type') == 'governance' or component.get('category') == 'governance':
            return True
        
        # Check if component has governance primitives
        if 'governance_primitives' in component:
            return True
        
        # Check if component has policy enforcement
        if 'policies' in component or 'policy_enforcement' in component:
            return True
        
        return False
    
    def _create_boundary(
        self,
        name: str,
        description: str,
        boundary_type: str,
        component_id: str,
        detection_confidence: float
    ) -> Dict[str, Any]:
        """
        Create a new boundary definition.
        
        Args:
            name: Name of the boundary
            description: Description of the boundary
            boundary_type: Type of boundary
            component_id: ID of the component associated with the boundary
            detection_confidence: Confidence level in the boundary detection
            
        Returns:
            Newly created boundary definition
        """
        boundary_id = f"boundary-{str(uuid.uuid4())}"
        now = datetime.utcnow().isoformat()
        
        boundary = {
            "boundary_id": boundary_id,
            "name": name,
            "description": description,
            "boundary_type": boundary_type,
            "classification": self._classify_boundary(boundary_type),
            "metadata": {
                "component_id": component_id
            },
            "detection_method": "automatic",
            "detection_confidence": detection_confidence,
            "created_at": now,
            "updated_at": now,
            "version": "1.0.0",
            "status": "active"
        }
        
        # Validate the boundary against the schema
        schema_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            "schemas",
            "trust",
            "trust_boundary.schema.v1.json"
        )
        
        validation_result = self.schema_validator.validate(boundary, schema_path)
        if not validation_result.is_valid:
            self.logger.error(f"Invalid boundary definition: {validation_result.errors}")
            raise ValueError(f"Invalid boundary definition: {validation_result.errors}")
        
        return boundary
    
    def _classify_boundary(self, boundary_type: str) -> str:
        """
        Classify a boundary based on its type.
        
        Args:
            boundary_type: Type of boundary
            
        Returns:
            Classification of the boundary
        """
        # Default classifications based on boundary type
        classifications = {
            "process": "internal",
            "network": "restricted",
            "data": "confidential",
            "user": "public",
            "module": "internal",
            "governance": "critical"
        }
        
        return classifications.get(boundary_type, "internal")
    
    def register_boundary(self, boundary_definition: Dict[str, Any]) -> str:
        """
        Register a new boundary in the system.
        
        Args:
            boundary_definition: Definition of the boundary to register
            
        Returns:
            ID of the registered boundary
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("register_boundary")
        
        # Validate the boundary definition
        schema_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            "schemas",
            "trust",
            "trust_boundary.schema.v1.json"
        )
        
        validation_result = self.schema_validator.validate(boundary_definition, schema_path)
        if not validation_result.is_valid:
            self.logger.error(f"Invalid boundary definition: {validation_result.errors}")
            raise ValueError(f"Invalid boundary definition: {validation_result.errors}")
        
        # Generate a boundary ID if not provided
        if 'boundary_id' not in boundary_definition:
            boundary_definition['boundary_id'] = f"boundary-{str(uuid.uuid4())}"
        
        # Set timestamps if not provided
        now = datetime.utcnow().isoformat()
        if 'created_at' not in boundary_definition:
            boundary_definition['created_at'] = now
        if 'updated_at' not in boundary_definition:
            boundary_definition['updated_at'] = now
        
        # Set version if not provided
        if 'version' not in boundary_definition:
            boundary_definition['version'] = "1.0.0"
        
        # Set status if not provided
        if 'status' not in boundary_definition:
            boundary_definition['status'] = "active"
        
        # Add the boundary to the registry
        boundary_id = boundary_definition['boundary_id']
        self.boundaries[boundary_id] = boundary_definition
        
        # Save the updated boundaries
        self._save_boundaries()
        
        return boundary_id
    
    def get_boundary(self, boundary_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a boundary by its ID.
        
        Args:
            boundary_id: ID of the boundary to retrieve
            
        Returns:
            Boundary definition or None if not found
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_boundary")
        
        return self.boundaries.get(boundary_id)
    
    def update_boundary(self, boundary_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a boundary definition.
        
        Args:
            boundary_id: ID of the boundary to update
            updates: Updates to apply to the boundary
            
        Returns:
            True if the update was successful, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("update_boundary")
        
        if boundary_id not in self.boundaries:
            self.logger.error(f"Boundary {boundary_id} not found")
            return False
        
        # Get the current boundary definition
        boundary = self.boundaries[boundary_id]
        
        # Apply updates
        for key, value in updates.items():
            if key not in ['boundary_id', 'created_at']:
                boundary[key] = value
        
        # Update the timestamp
        boundary['updated_at'] = datetime.utcnow().isoformat()
        
        # Increment the version
        version_parts = boundary['version'].split('.')
        version_parts[-1] = str(int(version_parts[-1]) + 1)
        boundary['version'] = '.'.join(version_parts)
        
        # Validate the updated boundary
        schema_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            "schemas",
            "trust",
            "trust_boundary.schema.v1.json"
        )
        
        validation_result = self.schema_validator.validate(boundary, schema_path)
        if not validation_result.is_valid:
            self.logger.error(f"Invalid boundary definition after update: {validation_result.errors}")
            return False
        
        # Update the boundary in the registry
        self.boundaries[boundary_id] = boundary
        
        # Save the updated boundaries
        self._save_boundaries()
        
        return True
    
    def delete_boundary(self, boundary_id: str) -> bool:
        """
        Delete a boundary from the registry.
        
        Args:
            boundary_id: ID of the boundary to delete
            
        Returns:
            True if the deletion was successful, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("delete_boundary")
        
        if boundary_id not in self.boundaries:
            self.logger.error(f"Boundary {boundary_id} not found")
            return False
        
        # Remove the boundary from the registry
        del self.boundaries[boundary_id]
        
        # Remove any relationships involving this boundary
        for rel_id in list(self.boundary_relationships.keys()):
            rel = self.boundary_relationships[rel_id]
            if rel['source_boundary_id'] == boundary_id or rel['target_boundary_id'] == boundary_id:
                del self.boundary_relationships[rel_id]
        
        # Save the updated boundaries
        self._save_boundaries()
        
        return True
    
    def list_boundaries(self, boundary_type: str = None) -> List[Dict[str, Any]]:
        """
        List all boundaries in the registry, optionally filtered by type.
        
        Args:
            boundary_type: Type of boundaries to filter by
            
        Returns:
            List of boundary definitions
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("list_boundaries")
        
        if boundary_type:
            return [b for b in self.boundaries.values() if b.get('boundary_type') == boundary_type]
        else:
            return list(self.boundaries.values())
    
    def add_boundary_relationship(
        self,
        source_boundary_id: str,
        target_boundary_id: str,
        relationship_type: str,
        description: str = None
    ) -> str:
        """
        Add a relationship between two boundaries.
        
        Args:
            source_boundary_id: ID of the source boundary
            target_boundary_id: ID of the target boundary
            relationship_type: Type of relationship
            description: Description of the relationship
            
        Returns:
            ID of the created relationship
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("add_boundary_relationship")
        
        # Verify that both boundaries exist
        if source_boundary_id not in self.boundaries:
            self.logger.error(f"Source boundary {source_boundary_id} not found")
            raise ValueError(f"Source boundary {source_boundary_id} not found")
        
        if target_boundary_id not in self.boundaries:
            self.logger.error(f"Target boundary {target_boundary_id} not found")
            raise ValueError(f"Target boundary {target_boundary_id} not found")
        
        # Verify that the relationship type is valid
        valid_relationship_types = [
            "contains",
            "contained_by",
            "intersects",
            "adjacent",
            "depends_on",
            "depended_on_by"
        ]
        
        if relationship_type not in valid_relationship_types:
            self.logger.error(f"Invalid relationship type: {relationship_type}")
            raise ValueError(f"Invalid relationship type: {relationship_type}")
        
        # Create the relationship
        relationship_id = f"rel-{str(uuid.uuid4())}"
        relationship = {
            "relationship_id": relationship_id,
            "source_boundary_id": source_boundary_id,
            "target_boundary_id": target_boundary_id,
            "relationship_type": relationship_type,
            "description": description,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Add the relationship to the registry
        self.boundary_relationships[relationship_id] = relationship
        
        # Update the boundaries to include the relationship
        source_boundary = self.boundaries[source_boundary_id]
        if 'relationships' not in source_boundary:
            source_boundary['relationships'] = []
        
        source_boundary['relationships'].append({
            "related_boundary_id": target_boundary_id,
            "relationship_type": relationship_type,
            "description": description
        })
        
        # Save the updated boundaries
        self._save_boundaries()
        
        return relationship_id
    
    def get_boundary_relationships(self, boundary_id: str) -> List[Dict[str, Any]]:
        """
        Get all relationships involving a specific boundary.
        
        Args:
            boundary_id: ID of the boundary
            
        Returns:
            List of relationships involving the boundary
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_boundary_relationships")
        
        return [
            rel for rel in self.boundary_relationships.values()
            if rel['source_boundary_id'] == boundary_id or rel['target_boundary_id'] == boundary_id
        ]
    
    def detect_boundary_changes(self, boundary_id: str, previous_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Detect changes in a boundary by comparing with a previous state.
        
        Args:
            boundary_id: ID of the boundary to check
            previous_state: Previous state of the boundary
            
        Returns:
            List of detected changes
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("detect_boundary_changes")
        
        if boundary_id not in self.boundaries:
            self.logger.error(f"Boundary {boundary_id} not found")
            raise ValueError(f"Boundary {boundary_id} not found")
        
        current_state = self.boundaries[boundary_id]
        changes = []
        
        # Compare fields to detect changes
        for key in current_state:
            if key in previous_state:
                if current_state[key] != previous_state[key]:
                    changes.append({
                        "field": key,
                        "previous_value": previous_state[key],
                        "current_value": current_state[key],
                        "change_type": "modified"
                    })
            else:
                changes.append({
                    "field": key,
                    "current_value": current_state[key],
                    "change_type": "added"
                })
        
        # Check for removed fields
        for key in previous_state:
            if key not in current_state:
                changes.append({
                    "field": key,
                    "previous_value": previous_state[key],
                    "change_type": "removed"
                })
        
        return changes
    
    def prepare_boundary_visualization(self, boundary_ids: List[str] = None) -> Dict[str, Any]:
        """
        Prepare data for visualizing boundaries and their relationships.
        
        Args:
            boundary_ids: IDs of boundaries to include in the visualization
            
        Returns:
            Data structure for visualization
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("prepare_boundary_visualization")
        
        # If no boundary IDs are provided, include all boundaries
        if boundary_ids is None:
            boundary_ids = list(self.boundaries.keys())
        
        # Prepare nodes (boundaries)
        nodes = []
        for boundary_id in boundary_ids:
            if boundary_id in self.boundaries:
                boundary = self.boundaries[boundary_id]
                nodes.append({
                    "id": boundary_id,
                    "name": boundary.get('name', 'Unknown'),
                    "type": boundary.get('boundary_type', 'Unknown'),
                    "classification": boundary.get('classification', 'Unknown'),
                    "status": boundary.get('status', 'Unknown')
                })
        
        # Prepare edges (relationships)
        edges = []
        for rel in self.boundary_relationships.values():
            source_id = rel['source_boundary_id']
            target_id = rel['target_boundary_id']
            if source_id in boundary_ids and target_id in boundary_ids:
                edges.append({
                    "id": rel.get('relationship_id', 'Unknown'),
                    "source": source_id,
                    "target": target_id,
                    "type": rel.get('relationship_type', 'Unknown'),
                    "description": rel.get('description', '')
                })
        
        return {
            "nodes": nodes,
            "edges": edges
        }
    
    def _verify_contract_tether(self, operation: str) -> None:
        """
        Verify the contract tether before performing an operation.
        
        Args:
            operation: Name of the operation being performed
            
        Raises:
            ValueError: If the contract tether verification fails
        """
        # Create a contract state representation
        contract_state = {
            "operation": operation,
            "timestamp": datetime.utcnow().isoformat(),
            "boundaries_count": len(self.boundaries),
            "relationships_count": len(self.boundary_relationships)
        }
        
        # Verify the contract state
        if not self.seal_verification_service.verify_contract_tether(
            "BoundaryDetectionEngine",
            operation,
            json.dumps(contract_state)
        ):
            self.logger.error(f"Contract tether verification failed for operation: {operation}")
            raise ValueError(f"Contract tether verification failed for operation: {operation}")
