"""
Seal Distribution Service for distributed verification network.

This module implements the SealDistributionService component of Phase 5.4.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import uuid
import json
from datetime import datetime
from src.core.common.schema_validator import validate_against_schema

def pre_loop_tether_check(contract_version, phase_id):
    """
    Perform pre-loop tether check to ensure compliance with Codex Contract.
    
    Args:
        contract_version (str): The contract version to check against.
        phase_id (str): The phase ID to check against.
        
    Returns:
        bool: True if tether check passes, False otherwise.
    """
    return contract_version == "v2025.05.18" and phase_id == "5.4"


class SealDistributionService:
    """
    Manages the distribution of Merkle seals to verification nodes.
    
    This class is responsible for distributing Merkle seals to verification nodes
    in the distributed verification network, tracking distribution status, and
    handling retries for failed distributions.
    
    Codex Contract: v2025.05.18
    Phase ID: 5.4
    Clauses: 5.4, 11.0, 5.2.5
    """
    
    def __init__(self):
        """Initialize the SealDistributionService."""
        self.distribution_queue = []
        self.distribution_history = {}
        
        # Ensure tether to Codex Contract
        if not pre_loop_tether_check("v2025.05.18", "5.4"):
            raise ValueError("Tether check failed: Invalid contract version or phase ID")
    
    def queue_seal_for_distribution(self, seal, priority=1):
        """
        Queue a seal for distribution to verification nodes.
        
        Args:
            seal (dict): The seal to distribute.
            priority (int, optional): The priority of the distribution (1-5, 5 highest).
                Defaults to 1.
            
        Returns:
            str: The distribution ID.
            
        Raises:
            ValueError: If validation fails or priority is invalid.
        """
        # Validate priority
        if priority < 1 or priority > 5:
            raise ValueError(f"Invalid priority: {priority}. Must be between 1 and 5.")
        
        # Validate seal against schema
        valid, error = validate_against_schema(seal, "schemas/merkle_seal.schema.v1.json")
        if not valid:
            raise ValueError(f"Invalid seal: {error}")
        
        # Create distribution record
        distribution_id = str(uuid.uuid4())
        distribution_record = {
            "distribution_id": distribution_id,
            "seal_id": seal["seal_id"],
            "seal": seal,
            "status": "queued",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "priority": priority,
            "node_distributions": [],
            "retry_count": 0,
            "contract_version": "v2025.05.18",
            "phase_id": "5.4",
            "codex_clauses": ["5.4", "11.0", "5.2.5"]
        }
        
        # Add to queue
        self.distribution_queue.append(distribution_record)
        
        # Sort queue by priority (highest first)
        self.distribution_queue.sort(key=lambda x: x["priority"], reverse=True)
        
        return distribution_id
    
    def distribute_seal(self, distribution_id, nodes):
        """
        Distribute a seal to verification nodes.
        
        Args:
            distribution_id (str): The ID of the distribution to process.
            nodes (list): List of node dictionaries to distribute to.
            
        Returns:
            dict: The distribution record with updated status.
            
        Raises:
            ValueError: If the distribution is not found.
        """
        # Find distribution record
        distribution_record = None
        for record in self.distribution_queue:
            if record["distribution_id"] == distribution_id:
                distribution_record = record
                break
        
        if distribution_record is None:
            raise ValueError(f"Distribution not found: {distribution_id}")
        
        # Update status
        distribution_record["status"] = "distributing"
        
        # Distribute to nodes
        node_distributions = []
        success_count = 0
        
        for node in nodes:
            # Send seal to node
            success = self._send_seal_to_node(distribution_record["seal"], node)
            
            # Record result
            node_distribution = {
                "node_id": node["node_id"],
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "success": success
            }
            
            node_distributions.append(node_distribution)
            
            if success:
                success_count += 1
        
        # Update distribution record
        distribution_record["node_distributions"] = node_distributions
        distribution_record["retry_count"] += 1
        
        # Determine final status
        if success_count == len(nodes):
            distribution_record["status"] = "distributed"
            
            # Move to history
            self.distribution_history[distribution_id] = distribution_record
            self.distribution_queue.remove(distribution_record)
        elif success_count > 0:
            distribution_record["status"] = "partially_distributed"
        else:
            distribution_record["status"] = "failed"
        
        return distribution_record
    
    def retry_failed_distributions(self, nodes):
        """
        Retry all failed distributions.
        
        Args:
            nodes (list): List of node dictionaries to distribute to.
            
        Returns:
            list: List of distribution records with updated status.
        """
        # Find failed distributions
        failed_distributions = [
            record for record in self.distribution_queue
            if record["status"] in ["failed", "partially_distributed"]
        ]
        
        # Retry each failed distribution
        results = []
        for record in failed_distributions:
            result = self.distribute_seal(record["distribution_id"], nodes)
            results.append(result)
        
        return results
    
    def get_distribution_status(self, distribution_id):
        """
        Get the status of a distribution.
        
        Args:
            distribution_id (str): The ID of the distribution to check.
            
        Returns:
            dict: The distribution status.
            
        Raises:
            ValueError: If the distribution is not found.
        """
        # Check queue
        for record in self.distribution_queue:
            if record["distribution_id"] == distribution_id:
                return self._create_status_summary(record)
        
        # Check history
        if distribution_id in self.distribution_history:
            return self._create_status_summary(self.distribution_history[distribution_id])
        
        raise ValueError(f"Distribution not found: {distribution_id}")
    
    def get_seal_distribution_history(self, seal_id):
        """
        Get the distribution history for a seal.
        
        Args:
            seal_id (str): The ID of the seal to check.
            
        Returns:
            list: List of distribution records for the seal.
        """
        # Check queue
        queue_records = [
            self._create_status_summary(record)
            for record in self.distribution_queue
            if record["seal_id"] == seal_id
        ]
        
        # Check history
        history_records = [
            self._create_status_summary(record)
            for record_id, record in self.distribution_history.items()
            if record["seal_id"] == seal_id
        ]
        
        return queue_records + history_records
    
    def get_node_distribution_history(self, node_id):
        """
        Get the distribution history for a node.
        
        Args:
            node_id (str): The ID of the node to check.
            
        Returns:
            list: List of distribution records involving the node.
        """
        # Check queue
        queue_records = []
        for record in self.distribution_queue:
            for node_dist in record["node_distributions"]:
                if node_dist["node_id"] == node_id:
                    queue_records.append({
                        "distribution_id": record["distribution_id"],
                        "seal_id": record["seal_id"],
                        "timestamp": node_dist["timestamp"],
                        "success": node_dist["success"],
                        "status": record["status"]
                    })
        
        # Check history
        history_records = []
        for record_id, record in self.distribution_history.items():
            for node_dist in record["node_distributions"]:
                if node_dist["node_id"] == node_id:
                    history_records.append({
                        "distribution_id": record["distribution_id"],
                        "seal_id": record["seal_id"],
                        "timestamp": node_dist["timestamp"],
                        "success": node_dist["success"],
                        "status": record["status"]
                    })
        
        return queue_records + history_records
    
    def prioritize_seal_distribution(self, distribution_id, priority):
        """
        Update the priority of a seal distribution.
        
        Args:
            distribution_id (str): The ID of the distribution to update.
            priority (int): The new priority (1-5, 5 highest).
            
        Returns:
            dict: The updated distribution record.
            
        Raises:
            ValueError: If the distribution is not found or priority is invalid.
        """
        # Validate priority
        if priority < 1 or priority > 5:
            raise ValueError(f"Invalid priority: {priority}. Must be between 1 and 5.")
        
        # Find distribution record
        distribution_record = None
        for record in self.distribution_queue:
            if record["distribution_id"] == distribution_id:
                distribution_record = record
                break
        
        if distribution_record is None:
            raise ValueError(f"Distribution not found: {distribution_id}")
        
        # Update priority
        distribution_record["priority"] = priority
        
        # Resort queue
        self.distribution_queue.sort(key=lambda x: x["priority"], reverse=True)
        
        return distribution_record
    
    def optimize_bandwidth(self, max_concurrent=5):
        """
        Optimize bandwidth usage by limiting concurrent distributions.
        
        Args:
            max_concurrent (int, optional): Maximum number of concurrent distributions.
                Defaults to 5.
            
        Returns:
            list: List of distribution records selected for distribution.
        """
        # Find queued distributions
        queued_distributions = [
            record for record in self.distribution_queue
            if record["status"] == "queued"
        ]
        
        # Select distributions to process
        selected_distributions = queued_distributions[:max_concurrent]
        
        # Update status
        for record in selected_distributions:
            record["status"] = "distributing"
        
        return selected_distributions
    
    def _send_seal_to_node(self, seal, node):
        """
        Send a seal to a verification node.
        
        Args:
            seal (dict): The seal to send.
            node (dict): The node to send to.
            
        Returns:
            bool: True if successful, False otherwise.
        """
        # In a real implementation, this would make an HTTP request to the node
        # For now, we'll simulate success/failure
        return True
    
    def _create_status_summary(self, record):
        """
        Create a status summary from a distribution record.
        
        Args:
            record (dict): The distribution record.
            
        Returns:
            dict: The status summary.
        """
        node_count = len(record["node_distributions"])
        success_count = sum(1 for node_dist in record["node_distributions"] if node_dist["success"])
        
        return {
            "distribution_id": record["distribution_id"],
            "seal_id": record["seal_id"],
            "status": record["status"],
            "timestamp": record["timestamp"],
            "priority": record["priority"],
            "node_count": node_count,
            "success_count": success_count,
            "retry_count": record["retry_count"]
        }
