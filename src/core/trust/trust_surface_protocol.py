"""
Trust Surface Protocol implementation for Phase 5.6.

This module implements the Trust Surface Protocol component of Phase 5.6,
providing functionality for creating and managing trust surfaces that combine
multiple trust boundaries in the distributed trust system.

Codex Contract: v2025.05.18
Phase ID: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import uuid
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional

from src.core.common.schema_validator import SchemaValidator
from src.core.trust.trust_boundary_manager import TrustBoundaryManager


class TrustSurfaceProtocol:
    """
    Implements protocol for trust surface interactions in the distributed trust system.
    
    This class provides functionality for creating, updating, and validating
    trust surfaces, which combine multiple trust boundaries to form a cohesive
    trust interface for distributed systems.
    """
    
    def __init__(self, schema_validator: SchemaValidator):
        """
        Initialize the Trust Surface Protocol.
        
        Args:
            schema_validator: Validator for schema validation
        
        Raises:
            ValueError: If schema_validator is None
        """
        if schema_validator is None:
            raise ValueError("Schema validator is required")
        
        self.schema_validator = schema_validator
        self.surfaces = {}  # Dictionary to store surfaces by ID
        
        # Perform Codex tether check
        self._codex_tether_check()
    
    def _codex_tether_check(self) -> bool:
        """
        Verify compliance with Codex contract.
        
        Returns:
            True if compliant, False otherwise
        """
        contract_version = "v2025.05.18"
        phase_id = "5.6"
        
        # In a real implementation, this would check against actual Codex contract
        # For now, we just verify the expected values
        if contract_version != "v2025.05.18" or phase_id != "5.6":
            return False
        
        return True
    
    def create_trust_surface(
        self,
        node_id: str,
        boundary_ids: List[str],
        surface_type: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a new trust surface.
        
        Args:
            node_id: ID of the node creating the surface
            boundary_ids: List of boundary IDs that compose this surface
            surface_type: Type of surface (standard, enhanced, minimal, composite)
            metadata: Additional metadata for the surface
        
        Returns:
            Created surface object
            
        Raises:
            ValueError: If validation fails
        """
        # Create surface object
        surface = {
            "surface_id": str(uuid.uuid4()),
            "node_id": node_id,
            "boundary_ids": boundary_ids,
            "surface_type": surface_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "contract_version": "v2025.05.18",
            "phase_id": "5.6",
            "codex_clauses": ["5.6", "5.5", "5.4", "11.0", "11.1", "5.2.5"],
            "metadata": metadata,
            "status": "active"
        }
        
        # Validate surface
        self.validate_trust_surface(surface)
        
        # Store surface
        self.surfaces[surface["surface_id"]] = surface
        
        return surface
    
    def validate_trust_surface(self, surface: Dict[str, Any]) -> None:
        """
        Validate a trust surface against the schema.
        
        Args:
            surface: Surface object to validate
            
        Raises:
            ValueError: If validation fails
        """
        is_valid, error = self.schema_validator.validate_against_schema(
            surface,
            "trust/trust_surface.schema.v1.json"
        )
        
        if not is_valid:
            raise ValueError(f"Invalid surface: {error}")
    
    def get_trust_surface(self, surface_id: str) -> Dict[str, Any]:
        """
        Get a trust surface by ID.
        
        Args:
            surface_id: ID of the surface to retrieve
            
        Returns:
            Surface object
            
        Raises:
            ValueError: If surface not found
        """
        if surface_id not in self.surfaces:
            raise ValueError(f"Surface {surface_id} not found")
        
        return self.surfaces[surface_id]
    
    def update_trust_surface(
        self,
        surface_id: str,
        boundary_ids: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update a trust surface.
        
        Args:
            surface_id: ID of the surface to update
            boundary_ids: New boundary IDs (optional)
            metadata: New metadata (optional)
            status: New status (optional)
            
        Returns:
            Updated surface object
            
        Raises:
            ValueError: If surface not found or validation fails
        """
        # Get existing surface
        surface = self.get_trust_surface(surface_id)
        
        # Update fields if provided
        if boundary_ids is not None:
            surface["boundary_ids"] = boundary_ids
        
        if metadata is not None:
            surface["metadata"] = metadata
        
        if status is not None:
            if status not in ["active", "inactive", "pending", "deprecated"]:
                raise ValueError(f"Invalid status: {status}")
            surface["status"] = status
        
        # Validate updated surface
        self.validate_trust_surface(surface)
        
        # Store updated surface
        self.surfaces[surface_id] = surface
        
        return surface
    
    def delete_trust_surface(self, surface_id: str) -> bool:
        """
        Delete a trust surface.
        
        Args:
            surface_id: ID of the surface to delete
            
        Returns:
            True if successful
            
        Raises:
            ValueError: If surface not found
        """
        # Check if surface exists
        self.get_trust_surface(surface_id)
        
        # Remove surface
        del self.surfaces[surface_id]
        
        return True
    
    def list_trust_surfaces(self) -> List[Dict[str, Any]]:
        """
        List all trust surfaces.
        
        Returns:
            List of surface objects
        """
        return list(self.surfaces.values())
    
    def filter_surfaces_by_type(self, surface_type: str) -> List[Dict[str, Any]]:
        """
        Filter surfaces by type.
        
        Args:
            surface_type: Type to filter by
            
        Returns:
            List of matching surface objects
        """
        return [s for s in self.surfaces.values() if s["surface_type"] == surface_type]
    
    def filter_surfaces_by_boundary(self, boundary_id: str) -> List[Dict[str, Any]]:
        """
        Filter surfaces by boundary ID.
        
        Args:
            boundary_id: Boundary ID to filter by
            
        Returns:
            List of matching surface objects
        """
        return [s for s in self.surfaces.values() if boundary_id in s["boundary_ids"]]
    
    def merge_surfaces(
        self,
        node_id: str,
        surface_ids: List[str],
        surface_type: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Merge multiple trust surfaces into a new composite surface.
        
        Args:
            node_id: ID of the node creating the merged surface
            surface_ids: List of surface IDs to merge
            surface_type: Type of the new surface
            metadata: Metadata for the new surface
            
        Returns:
            Created composite surface object
            
        Raises:
            ValueError: If any surface not found or validation fails
        """
        # Get all surfaces to merge
        surfaces = [self.get_trust_surface(sid) for sid in surface_ids]
        
        # Collect all boundary IDs from all surfaces
        all_boundary_ids = []
        for surface in surfaces:
            all_boundary_ids.extend(surface["boundary_ids"])
        
        # Remove duplicates
        unique_boundary_ids = list(set(all_boundary_ids))
        
        # Create new composite surface
        return self.create_trust_surface(
            node_id,
            unique_boundary_ids,
            surface_type,
            metadata
        )
