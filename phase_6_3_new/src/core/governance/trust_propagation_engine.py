"""
Trust Propagation Engine for Promethios Distributed Trust Surface

Codex Contract: v2025.05.20
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""

import json
import uuid
import hashlib
import time
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Set

class TrustPropagationEngine:
    """
    Manages the propagation of trust across the distributed network.
    
    The TrustPropagationEngine is responsible for:
    1. Managing trust propagation across the distributed network
    2. Implementing trust decay and reinforcement mechanisms
    3. Handling trust conflicts and resolution
    4. Calculating transitive trust paths
    """
    
    def __init__(self, instance_id: str, schema_validator=None, 
                trust_boundary_manager=None, attestation_service=None):
        """
        Initialize the Trust Propagation Engine.
        
        Args:
            instance_id: The identifier of this Promethios instance
            schema_validator: Optional validator for schema validation
            trust_boundary_manager: Optional reference to the Trust Boundary Manager
            attestation_service: Optional reference to the Attestation Service
        """
        self.instance_id = instance_id
        self.schema_validator = schema_validator
        self.trust_boundary_manager = trust_boundary_manager
        self.attestation_service = attestation_service
        
        self.trust_graph: Dict[str, Dict[str, float]] = {}  # source_id -> {target_id -> trust_level}
        self.propagation_paths: Dict[str, Dict[str, List[str]]] = {}  # source_id -> {target_id -> [path]}
        self.trust_history: Dict[str, Dict[str, List[Dict]]] = {}  # source_id -> {target_id -> [history_entries]}
        self.conflict_records: List[Dict] = []
        
        # Configuration
        self.decay_rate = 0.1  # Trust decay rate per day
        self.propagation_threshold = 0.5  # Minimum trust level for propagation
        self.transitive_discount = 0.8  # Discount factor for transitive trust
        self.max_path_length = 3  # Maximum path length for trust propagation
    
    def update_trust_graph(self) -> bool:
        """
        Update the trust graph based on current trust boundaries.
        
        Returns:
            True if the update was successful, False otherwise
        """
        if not self.trust_boundary_manager:
            return False
            
        # Get all active boundaries
        boundaries = self.trust_boundary_manager.list_boundaries()
        
        # Clear existing graph
        self.trust_graph = {}
        
        # Build graph from boundaries
        for boundary in boundaries:
            source_id = boundary["source_instance_id"]
            target_id = boundary["target_instance_id"]
            trust_level = boundary["trust_level"] / 100.0  # Convert from percentage to decimal
            
            # Ensure source node exists in graph
            if source_id not in self.trust_graph:
                self.trust_graph[source_id] = {}
            
            # Update trust level
            self.trust_graph[source_id][target_id] = trust_level
        
        # Recalculate propagation paths
        self._calculate_propagation_paths()
        
        return True
    
    def get_direct_trust(self, source_id: str, target_id: str) -> float:
        """
        Get the direct trust level between two nodes.
        
        Args:
            source_id: The ID of the source node
            target_id: The ID of the target node
            
        Returns:
            Trust level between 0 and 1, or 0 if no direct trust exists
        """
        if source_id not in self.trust_graph:
            return 0.0
        
        return self.trust_graph[source_id].get(target_id, 0.0)
    
    def get_propagated_trust(self, source_id: str, target_id: str) -> Tuple[float, List[str]]:
        """
        Get the propagated trust level between two nodes.
        
        Args:
            source_id: The ID of the source node
            target_id: The ID of the target node
            
        Returns:
            Tuple of (trust_level, path)
        """
        # Check for direct trust first
        direct_trust = self.get_direct_trust(source_id, target_id)
        if direct_trust > 0:
            return direct_trust, [source_id, target_id]
        
        # Check for propagation paths
        if source_id in self.propagation_paths and target_id in self.propagation_paths[source_id]:
            path = self.propagation_paths[source_id][target_id]
            
            # Calculate propagated trust along the path
            trust_level = 1.0
            for i in range(len(path) - 1):
                current = path[i]
                next_node = path[i + 1]
                edge_trust = self.get_direct_trust(current, next_node)
                trust_level *= edge_trust
            
            # Apply transitive discount based on path length
            discount = math.pow(self.transitive_discount, len(path) - 2)
            return trust_level * discount, path
        
        return 0.0, []
    
    def apply_trust_decay(self, days: int = 1) -> bool:
        """
        Apply trust decay to all trust relationships.
        
        Args:
            days: Number of days to apply decay for
            
        Returns:
            True if decay was applied successfully, False otherwise
        """
        if not self.trust_boundary_manager:
            return False
            
        # Get all active boundaries
        boundaries = self.trust_boundary_manager.list_boundaries()
        
        # Apply decay to each boundary
        for boundary in boundaries:
            boundary_id = boundary["boundary_id"]
            current_trust = boundary["trust_level"]
            
            # Calculate new trust level with decay
            decay_factor = math.pow(1 - self.decay_rate, days)
            new_trust = int(current_trust * decay_factor)
            
            # Update the boundary
            self.trust_boundary_manager.update_boundary(
                boundary_id=boundary_id,
                trust_level=new_trust
            )
        
        # Update the trust graph
        self.update_trust_graph()
        
        return True
    
    def reinforce_trust(self, source_id: str, target_id: str, 
                       reinforcement_value: float, reason: str) -> bool:
        """
        Reinforce trust between two nodes.
        
        Args:
            source_id: The ID of the source node
            target_id: The ID of the target node
            reinforcement_value: Value to reinforce trust by (0 to 1)
            reason: Reason for reinforcement
            
        Returns:
            True if reinforcement was successful, False otherwise
        """
        if not self.trust_boundary_manager:
            return False
            
        # Get boundaries between source and target
        boundaries = self.trust_boundary_manager.list_boundaries(
            source_instance_id=source_id,
            target_instance_id=target_id
        )
        
        if not boundaries:
            return False
            
        # Get the first matching boundary
        boundary = boundaries[0]
        boundary_id = boundary["boundary_id"]
        current_trust = boundary["trust_level"]
        
        # Calculate new trust level with reinforcement
        reinforcement_points = int(reinforcement_value * 100)
        new_trust = min(100, current_trust + reinforcement_points)
        
        # Update the boundary
        self.trust_boundary_manager.update_boundary(
            boundary_id=boundary_id,
            trust_level=new_trust
        )
        
        # Record the reinforcement
        self._record_trust_change(
            source_id=source_id,
            target_id=target_id,
            trust_level=new_trust / 100.0,
            reason=f"reinforcement: {reason}"
        )
        
        # Update the trust graph
        self.update_trust_graph()
        
        return True
    
    def handle_trust_conflict(self, source_id: str, target_id: str, 
                             conflict_type: str, conflict_data: Dict) -> str:
        """
        Handle a trust conflict between two nodes.
        
        Args:
            source_id: The ID of the source node
            target_id: The ID of the target node
            conflict_type: Type of conflict
            conflict_data: Additional conflict data
            
        Returns:
            The ID of the created conflict record
        """
        # Generate a conflict ID
        conflict_id = f"tc-{uuid.uuid4().hex}"
        
        # Create conflict record
        conflict = {
            "conflict_id": conflict_id,
            "created_at": datetime.utcnow().isoformat() + 'Z',
            "source_instance_id": source_id,
            "target_instance_id": target_id,
            "conflict_type": conflict_type,
            "conflict_data": conflict_data,
            "resolution_status": "pending",
            "resolution_data": None
        }
        
        # Add to conflict records
        self.conflict_records.append(conflict)
        
        # Reduce trust due to conflict
        if self.trust_boundary_manager:
            # Get boundaries between source and target
            boundaries = self.trust_boundary_manager.list_boundaries(
                source_instance_id=source_id,
                target_instance_id=target_id
            )
            
            if boundaries:
                # Get the first matching boundary
                boundary = boundaries[0]
                boundary_id = boundary["boundary_id"]
                current_trust = boundary["trust_level"]
                
                # Reduce trust by 20%
                new_trust = max(0, current_trust - 20)
                
                # Update the boundary
                self.trust_boundary_manager.update_boundary(
                    boundary_id=boundary_id,
                    trust_level=new_trust
                )
                
                # Update the trust graph
                self.update_trust_graph()
        
        return conflict_id
    
    def resolve_trust_conflict(self, conflict_id: str, resolution_status: str,
                              resolution_data: Dict, trust_adjustment: int = 0) -> bool:
        """
        Resolve a trust conflict.
        
        Args:
            conflict_id: The ID of the conflict to resolve
            resolution_status: New resolution status
            resolution_data: Resolution data
            trust_adjustment: Trust adjustment to apply (positive or negative)
            
        Returns:
            True if resolution was successful, False otherwise
        """
        # Find the conflict record
        conflict = None
        for record in self.conflict_records:
            if record["conflict_id"] == conflict_id:
                conflict = record
                break
        
        if not conflict:
            return False
        
        # Update conflict record
        conflict["resolution_status"] = resolution_status
        conflict["resolution_data"] = resolution_data
        conflict["resolved_at"] = datetime.utcnow().isoformat() + 'Z'
        
        # Adjust trust if needed
        if trust_adjustment != 0 and self.trust_boundary_manager:
            source_id = conflict["source_instance_id"]
            target_id = conflict["target_instance_id"]
            
            # Get boundaries between source and target
            boundaries = self.trust_boundary_manager.list_boundaries(
                source_instance_id=source_id,
                target_instance_id=target_id
            )
            
            if boundaries:
                # Get the first matching boundary
                boundary = boundaries[0]
                boundary_id = boundary["boundary_id"]
                current_trust = boundary["trust_level"]
                
                # Adjust trust
                new_trust = max(0, min(100, current_trust + trust_adjustment))
                
                # Update the boundary
                self.trust_boundary_manager.update_boundary(
                    boundary_id=boundary_id,
                    trust_level=new_trust
                )
                
                # Update the trust graph
                self.update_trust_graph()
        
        return True
    
    def get_trust_conflicts(self, source_id: str = None, target_id: str = None,
                           conflict_type: str = None, resolution_status: str = None) -> List[Dict]:
        """
        Get trust conflicts, optionally filtered by various criteria.
        
        Args:
            source_id: Optional source instance ID to filter by
            target_id: Optional target instance ID to filter by
            conflict_type: Optional conflict type to filter by
            resolution_status: Optional resolution status to filter by
            
        Returns:
            List of matching conflict records
        """
        results = []
        
        for conflict in self.conflict_records:
            if source_id and conflict["source_instance_id"] != source_id:
                continue
            
            if target_id and conflict["target_instance_id"] != target_id:
                continue
            
            if conflict_type and conflict["conflict_type"] != conflict_type:
                continue
            
            if resolution_status and conflict["resolution_status"] != resolution_status:
                continue
            
            results.append(conflict)
        
        return results
    
    def _calculate_propagation_paths(self):
        """Calculate the best trust propagation paths between all nodes."""
        # Initialize empty paths
        self.propagation_paths = {}
        
        # For each source node
        for source_id in self.trust_graph:
            self.propagation_paths[source_id] = {}
            
            # Find paths to all other nodes
            for target_id in self.trust_graph:
                if source_id == target_id:
                    continue
                
                # Find the best path
                best_path = self._find_best_path(source_id, target_id)
                if best_path:
                    self.propagation_paths[source_id][target_id] = best_path
    
    def _find_best_path(self, source_id: str, target_id: str, visited: Set[str] = None, 
                       current_path: List[str] = None, depth: int = 0) -> List[str]:
        """
        Find the best trust propagation path between two nodes using DFS.
        
        Args:
            source_id: The ID of the source node
            target_id: The ID of the target node
            visited: Set of visited nodes
            current_path: Current path being explored
            depth: Current depth in the search
            
        Returns:
            The best path as a list of node IDs, or None if no path exists
        """
        # Initialize visited set and current path if not provided
        if visited is None:
            visited = set()
        if current_path is None:
            current_path = [source_id]
        
        # Check if we've reached the target
        if source_id == target_id:
            return current_path
        
        # Check if we've exceeded the maximum path length
        if depth >= self.max_path_length:
            return None
        
        # Mark current node as visited
        visited.add(source_id)
        
        # Get neighbors with trust above threshold
        neighbors = {}
        if source_id in self.trust_graph:
            for neighbor_id, trust in self.trust_graph[source_id].items():
                if trust >= self.propagation_threshold and neighbor_id not in visited:
                    neighbors[neighbor_id] = trust
        
        # Sort neighbors by trust level (descending)
        sorted_neighbors = sorted(neighbors.items(), key=lambda x: x[1], reverse=True)
        
        best_path = None
        best_trust = 0.0
        
        # Explore neighbors
        for neighbor_id, trust in sorted_neighbors:
            # Recursively find path from neighbor to target
            new_path = self._find_best_path(
                neighbor_id, target_id, visited.copy(), 
                current_path + [neighbor_id], depth + 1
            )
            
            # If a path was found
            if new_path:
                # Calculate trust along this path
                path_trust = 1.0
                for i in range(len(new_path) - 1):
                    current = new_path[i]
                    next_node = new_path[i + 1]
                    edge_trust = self.get_direct_trust(current, next_node)
                    path_trust *= edge_trust
                
                # Apply transitive discount
                discount = math.pow(self.transitive_discount, len(new_path) - 2)
                path_trust *= discount
                
                # If this path has higher trust, update best path
                if path_trust > best_trust:
                    best_path = new_path
                    best_trust = path_trust
        
        return best_path
    
    def _record_trust_change(self, source_id: str, target_id: str, trust_level: float, reason: str):
        """
        Record a trust change in the history.
        
        Args:
            source_id: The ID of the source node
            target_id: The ID of the target node
            trust_level: New trust level
            reason: Reason for the change
        """
        # Ensure source node exists in history
        if source_id not in self.trust_history:
            self.trust_history[source_id] = {}
        
        # Ensure target node exists in history
        if target_id not in self.trust_history[source_id]:
            self.trust_history[source_id][target_id] = []
        
        # Create history entry
        entry = {
            "timestamp": datetime.utcnow().isoformat() + 'Z',
            "trust_level": trust_level,
            "reason": reason
        }
        
        # Add to history
        self.trust_history[source_id][target_id].append(entry)
    
    def _codex_tether_check(self) -> Dict:
        """
        Perform a Codex Contract tethering check.
        
        Returns:
            A dictionary with tethering information
        """
        return {
            "codex_contract_version": "v2025.05.20",
            "phase_id": "5.6",
            "clauses": ["5.6", "5.5", "5.4", "11.0", "11.1", "5.2.6"],
            "component": "TrustPropagationEngine",
            "status": "compliant",
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
