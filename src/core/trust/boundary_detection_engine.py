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
    
    Codex Contract: v2025.05.21
    Phase ID: 5.9
    """
    
    def __init__(
        self,
        governance_primitive_manager: GovernancePrimitiveManager = None,
        trust_metrics_calculator: TrustMetricsCalculator = None,
        seal_verification_service: SealVerificationService = None,
        schema_validator: SchemaValidator = None,
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
            if self.seal_verification_service:
                seal = self.seal_verification_service.create_seal(json.dumps(data))
                data['seal'] = seal
            
            with open(self.boundaries_file_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving boundaries: {str(e)}")
    
    def _verify_contract_tether(self, method_name):
        """
        Verify contract tether for a method call.
        
        Args:
            method_name: Name of the method being called
            
        Returns:
            True if verification passes, raises exception otherwise
        """
        # Verify contract tether
        if self.seal_verification_service and not self.seal_verification_service.verify_contract_tether():
            raise ValueError(f"Contract tether verification failed for {method_name}")
            
        return True
    
    def register_boundary(self, boundary):
        """
        Register a new boundary.
        
        Args:
            boundary: Boundary definition
            
        Returns:
            ID of the registered boundary
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("register_boundary")
        
        # Validate boundary schema if validator is available
        if self.schema_validator:
            validation_result = self.schema_validator.validate(boundary, "schemas/trust/trust_boundary.schema.v1.json")
            if not validation_result.is_valid:
                raise ValueError(f"Invalid boundary definition: {validation_result.errors}")
        
        # Add boundary to storage
        boundary_id = boundary["boundary_id"]
        self.boundaries[boundary_id] = boundary
        
        # Initialize controls list if not present
        if "controls" not in self.boundaries[boundary_id]:
            self.boundaries[boundary_id]["controls"] = []
        
        # Save boundaries
        self._save_boundaries()
        
        return boundary_id
        
    def get_boundary(self, boundary_id):
        """
        Get a boundary by ID.
        
        Args:
            boundary_id: ID of the boundary to get
            
        Returns:
            Boundary definition, or None if not found
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_boundary")
        
        # Return boundary if found
        return self.boundaries.get(boundary_id)
        
    def update_boundary(self, boundary_id, updates):
        """
        Update a boundary.
        
        Args:
            boundary_id: ID of the boundary to update
            updates: Dictionary of updates to apply
            
        Returns:
            True if update was successful, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("update_boundary")
        
        # Check if boundary exists
        if boundary_id not in self.boundaries:
            return False
        
        # Apply updates
        for key, value in updates.items():
            if key != "boundary_id":  # Don't allow changing the ID
                self.boundaries[boundary_id][key] = value
        
        # Update timestamp
        self.boundaries[boundary_id]["updated_at"] = datetime.utcnow().isoformat()
        
        # Validate updated boundary
        if self.schema_validator:
            validation_result = self.schema_validator.validate(self.boundaries[boundary_id], "schemas/trust/trust_boundary.schema.v1.json")
            if not validation_result.is_valid:
                # Revert changes
                self._load_boundaries()
                return False
        
        # Save boundaries
        self._save_boundaries()
        
        return True
        
    def delete_boundary(self, boundary_id):
        """
        Delete a boundary.
        
        Args:
            boundary_id: ID of the boundary to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("delete_boundary")
        
        # Check if boundary exists
        if boundary_id not in self.boundaries:
            return False
        
        # Delete boundary
        del self.boundaries[boundary_id]
        
        # Save boundaries
        self._save_boundaries()
        
        return True
        
    def list_boundaries(self, boundary_type=None, status=None):
        """
        List boundaries, optionally filtered by type and status.
        
        Args:
            boundary_type: Type of boundaries to list
            status: Status of boundaries to list
            
        Returns:
            List of boundaries
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("list_boundaries")
        
        # Start with all boundaries
        result = list(self.boundaries.values())
        
        # Filter by type if provided
        if boundary_type:
            result = [b for b in result if b.get("boundary_type") == boundary_type]
        
        # Filter by status if provided
        if status:
            result = [b for b in result if b.get("status") == status]
        
        return result
        
    def search_boundaries(self, search_term):
        """
        Search boundaries by name or description.
        
        Args:
            search_term: Term to search for
            
        Returns:
            List of matching boundaries
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("search_boundaries")
        
        # Convert search term to lowercase for case-insensitive search
        search_term = search_term.lower()
        
        # Search in name and description
        result = []
        for boundary in self.boundaries.values():
            name = boundary.get("name", "").lower()
            description = boundary.get("description", "").lower()
            
            if search_term in name or search_term in description:
                result.append(boundary)
        
        return result
        
    def add_boundary_control(self, boundary_id, control):
        """
        Add a control to a boundary.
        
        Args:
            boundary_id: ID of the boundary
            control: Control definition
            
        Returns:
            True if control was added successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("add_boundary_control")
        
        # Check if boundary exists
        if boundary_id not in self.boundaries:
            return False
        
        # Initialize controls list if not present
        if "controls" not in self.boundaries[boundary_id]:
            self.boundaries[boundary_id]["controls"] = []
        
        # Add control
        self.boundaries[boundary_id]["controls"].append(control)
        
        # Save boundaries
        self._save_boundaries()
        
        return True
        
    def remove_boundary_control(self, boundary_id, control_id):
        """
        Remove a control from a boundary.
        
        Args:
            boundary_id: ID of the boundary
            control_id: ID of the control to remove
            
        Returns:
            True if control was removed successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("remove_boundary_control")
        
        # Check if boundary exists
        if boundary_id not in self.boundaries:
            return False
        
        # Check if boundary has controls
        if "controls" not in self.boundaries[boundary_id]:
            return False
        
        # Find control
        controls = self.boundaries[boundary_id]["controls"]
        for i, control in enumerate(controls):
            if control.get("control_id") == control_id:
                # Remove control
                controls.pop(i)
                
                # Save boundaries
                self._save_boundaries()
                
                return True
        
        # Control not found
        return False
        
    def get_boundary_controls(self, boundary_id):
        """
        Get controls for a boundary.
        
        Args:
            boundary_id: ID of the boundary
            
        Returns:
            List of controls, empty list if boundary not found
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_boundary_controls")
        
        # Check if boundary exists
        if boundary_id not in self.boundaries:
            return []
        
        # Return controls
        return self.boundaries[boundary_id].get("controls", [])
        
    def add_entry_point(self, boundary_id, entry_point):
        """
        Add an entry point to a boundary.
        
        Args:
            boundary_id: ID of the boundary
            entry_point: Entry point definition
            
        Returns:
            True if entry point was added successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("add_entry_point")
        
        # Check if boundary exists
        if boundary_id not in self.boundaries:
            return False
        
        # Initialize entry points list if not present
        if "entry_points" not in self.boundaries[boundary_id]:
            self.boundaries[boundary_id]["entry_points"] = []
        
        # Add entry point
        self.boundaries[boundary_id]["entry_points"].append(entry_point)
        
        # Save boundaries
        self._save_boundaries()
        
        return True
        
    def add_exit_point(self, boundary_id, exit_point):
        """
        Add an exit point to a boundary.
        
        Args:
            boundary_id: ID of the boundary
            exit_point: Exit point definition
            
        Returns:
            True if exit point was added successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("add_exit_point")
        
        # Check if boundary exists
        if boundary_id not in self.boundaries:
            return False
        
        # Initialize exit points list if not present
        if "exit_points" not in self.boundaries[boundary_id]:
            self.boundaries[boundary_id]["exit_points"] = []
        
        # Add exit point
        self.boundaries[boundary_id]["exit_points"].append(exit_point)
        
        # Save boundaries
        self._save_boundaries()
        
        return True
        
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
        if self.schema_validator:
            schema_path = "schemas/trust/trust_boundary.schema.v1.json"
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
        # Default classification mapping
        classification_map = {
            "process": "confidential",
            "network": "restricted",
            "data": "restricted",
            "user": "confidential",
            "module": "internal",
            "governance": "restricted"
        }
        
        return classification_map.get(boundary_type, "internal")
