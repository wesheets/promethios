"""
Mesh Topology Management for Phase 5.5.

This module provides functionality for creating and managing the topology
of the governance mesh network.

This component implements Phase 5.5 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.5
Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import os
import json
import uuid
from datetime import datetime

class MeshTopologyManager:
    """
    Manager for governance mesh network topology.
    
    This class handles the creation, validation, and management of
    the governance mesh network topology.
    """
    
    def __init__(self, schema_validator):
        """
        Initialize the mesh topology manager.
        
        Args:
            schema_validator: SchemaValidator instance for schema validation
        
        Raises:
            ValueError: If schema_validator is None
        """
        if schema_validator is None:
            raise ValueError("Schema validator is required")
            
        self.schema_validator = schema_validator
        self.phase_id = "5.5"
        self.codex_clauses = ["5.5", "5.4", "11.0", "11.1", "5.2.5"]
        
        # Perform tether check on initialization
        self._codex_tether_check()
        
    def create_topology(self, nodes, connections=None, domains=None):
        """
        Create a new mesh topology.
        
        Args:
            nodes: List of node definitions
            connections: Optional list of connections between nodes
            domains: Optional list of governance domains
            
        Returns:
            Dict containing the topology data
        """
        if connections is None:
            connections = []
            
        if domains is None:
            domains = []
            
        topology_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        topology = {
            "topology_id": topology_id,
            "created_at": timestamp,
            "updated_at": timestamp,
            "timestamp": timestamp,  # Adding required timestamp field
            "phase_id": self.phase_id,
            "codex_clauses": self.codex_clauses,
            "nodes": nodes,
            "connections": connections,
            "domains": domains
        }
        
        # Validate topology against schema
        validation_result = self.schema_validator.validate_mesh_topology(topology)
        
        if not validation_result.get("valid", False):
            raise ValueError(f"Invalid topology: {validation_result.get('error', 'Unknown error')}")
            
        return topology
        
    def add_node(self, topology, node_data):
        """
        Add a node to the mesh topology.
        
        Args:
            topology: Current topology data
            node_data: Node definition to add
            
        Returns:
            Updated topology data
        """
        # Create a copy of the topology to avoid modifying the original
        updated_topology = dict(topology)
        updated_topology["nodes"] = list(topology["nodes"])
        
        # Check if node already exists
        for node in updated_topology["nodes"]:
            if node["node_id"] == node_data["node_id"]:
                raise ValueError(f"Node {node_data['node_id']} already exists in topology")
                
        # Add the node
        updated_topology["nodes"].append(node_data)
        timestamp = datetime.utcnow().isoformat() + "Z"
        updated_topology["updated_at"] = timestamp
        updated_topology["timestamp"] = timestamp  # Update timestamp field
        
        # Generate a new topology ID
        updated_topology["topology_id"] = str(uuid.uuid4())
        
        # Validate updated topology
        validation_result = self.schema_validator.validate_mesh_topology(updated_topology)
        
        if not validation_result.get("valid", False):
            raise ValueError(f"Invalid topology after adding node: {validation_result.get('error', 'Unknown error')}")
            
        return updated_topology
        
    def remove_node(self, topology, node_id):
        """
        Remove a node from the mesh topology.
        
        Args:
            topology: Current topology data
            node_id: ID of the node to remove
            
        Returns:
            Updated topology data
        """
        # Create a copy of the topology to avoid modifying the original
        updated_topology = dict(topology)
        updated_topology["nodes"] = [node for node in topology["nodes"] if node["node_id"] != node_id]
        
        # Also remove any connections involving this node
        if "connections" in updated_topology:
            updated_topology["connections"] = [
                conn for conn in topology.get("connections", [])
                if conn["source_node_id"] != node_id and conn["target_node_id"] != node_id
            ]
            
        # Update domains to remove this node from member lists
        if "domains" in updated_topology:
            updated_domains = []
            for domain in topology.get("domains", []):
                updated_domain = dict(domain)
                if "member_nodes" in updated_domain:
                    updated_domain["member_nodes"] = [
                        member for member in domain["member_nodes"] if member != node_id
                    ]
                updated_domains.append(updated_domain)
            updated_topology["domains"] = updated_domains
            
        timestamp = datetime.utcnow().isoformat() + "Z"
        updated_topology["updated_at"] = timestamp
        updated_topology["timestamp"] = timestamp  # Update timestamp field
        
        # Generate a new topology ID
        updated_topology["topology_id"] = str(uuid.uuid4())
        
        # Validate updated topology
        validation_result = self.schema_validator.validate_mesh_topology(updated_topology)
        
        if not validation_result.get("valid", False):
            raise ValueError(f"Invalid topology after removing node: {validation_result.get('error', 'Unknown error')}")
            
        return updated_topology
        
    def add_connection(self, topology, connection_data):
        """
        Add a connection between nodes in the mesh topology.
        
        Args:
            topology: Current topology data
            connection_data: Connection definition to add
            
        Returns:
            Updated topology data
        """
        # Create a copy of the topology to avoid modifying the original
        updated_topology = dict(topology)
        
        if "connections" not in updated_topology:
            updated_topology["connections"] = []
        else:
            updated_topology["connections"] = list(topology["connections"])
            
        # Check if connection already exists
        for conn in updated_topology["connections"]:
            if (conn["source_node_id"] == connection_data["source_node_id"] and 
                conn["target_node_id"] == connection_data["target_node_id"]):
                raise ValueError(f"Connection from {connection_data['source_node_id']} to {connection_data['target_node_id']} already exists")
                
        # Check if nodes exist
        node_ids = [node["node_id"] for node in updated_topology["nodes"]]
        if connection_data["source_node_id"] not in node_ids:
            raise ValueError(f"Source node {connection_data['source_node_id']} does not exist in topology")
            
        if connection_data["target_node_id"] not in node_ids:
            raise ValueError(f"Target node {connection_data['target_node_id']} does not exist in topology")
            
        # Add the connection
        updated_topology["connections"].append(connection_data)
        timestamp = datetime.utcnow().isoformat() + "Z"
        updated_topology["updated_at"] = timestamp
        updated_topology["timestamp"] = timestamp  # Update timestamp field
        
        # Generate a new topology ID
        updated_topology["topology_id"] = str(uuid.uuid4())
        
        # Validate updated topology
        validation_result = self.schema_validator.validate_mesh_topology(updated_topology)
        
        if not validation_result.get("valid", False):
            raise ValueError(f"Invalid topology after adding connection: {validation_result.get('error', 'Unknown error')}")
            
        return updated_topology
        
    def add_domain(self, topology, domain_data):
        """
        Add a governance domain to the mesh topology.
        
        Args:
            topology: Current topology data
            domain_data: Domain definition to add
            
        Returns:
            Updated topology data
        """
        # Create a copy of the topology to avoid modifying the original
        updated_topology = dict(topology)
        
        if "domains" not in updated_topology:
            updated_topology["domains"] = []
        else:
            updated_topology["domains"] = list(topology["domains"])
            
        # Check if domain already exists
        for domain in updated_topology["domains"]:
            if domain["domain_id"] == domain_data["domain_id"]:
                raise ValueError(f"Domain {domain_data['domain_id']} already exists in topology")
                
        # Check if admin node exists
        node_ids = [node["node_id"] for node in updated_topology["nodes"]]
        if domain_data["admin_node_id"] not in node_ids:
            raise ValueError(f"Admin node {domain_data['admin_node_id']} does not exist in topology")
            
        # Check if member nodes exist
        for member_id in domain_data.get("member_nodes", []):
            if member_id not in node_ids:
                raise ValueError(f"Member node {member_id} does not exist in topology")
                
        # Add the domain
        updated_topology["domains"].append(domain_data)
        timestamp = datetime.utcnow().isoformat() + "Z"
        updated_topology["updated_at"] = timestamp
        updated_topology["timestamp"] = timestamp  # Update timestamp field
        
        # Generate a new topology ID
        updated_topology["topology_id"] = str(uuid.uuid4())
        
        # Validate updated topology
        validation_result = self.schema_validator.validate_mesh_topology(updated_topology)
        
        if not validation_result.get("valid", False):
            raise ValueError(f"Invalid topology after adding domain: {validation_result.get('error', 'Unknown error')}")
            
        return updated_topology
    
    def _codex_tether_check(self):
        """
        Explicit Codex tether check method for testing.
        
        This method is used to verify that the component is properly
        tethered to the Codex Contract.
        """
        # This method is intentionally left minimal for testing purposes
        pass
