"""
Quorum Calculator for Promethios Governance System.

This module provides functionality for calculating quorum requirements
for consensus decisions based on network size and fault tolerance requirements.
"""

import logging
import math
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

class QuorumCalculator:
    """
    Calculator for determining quorum requirements for consensus decisions.
    
    Provides methods for calculating quorum sizes based on different consensus
    algorithms and fault tolerance requirements.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the quorum calculator with the specified configuration.
        
        Args:
            config: Configuration parameters for the calculator
        """
        self.config = config or {}
        self.logger = logging.getLogger(__name__)
        
    def calculate_bft_quorum(self, node_count: int, max_byzantine_nodes: int = None) -> int:
        """
        Calculate the quorum size for Byzantine Fault Tolerance.
        
        For BFT, we need at least 2f+1 nodes to agree, where f is the maximum
        number of Byzantine nodes that can be tolerated. The total network size
        must be at least 3f+1.
        
        Args:
            node_count: Total number of nodes in the network
            max_byzantine_nodes: Maximum number of Byzantine nodes to tolerate
            
        Returns:
            int: Required quorum size
        """
        # If max_byzantine_nodes is not specified, calculate the maximum that can be tolerated
        if max_byzantine_nodes is None:
            max_byzantine_nodes = (node_count - 1) // 3
        
        # Validate that the network can tolerate the specified number of Byzantine nodes
        min_network_size = 3 * max_byzantine_nodes + 1
        if node_count < min_network_size:
            self.logger.warning(
                f"Network size {node_count} is too small to tolerate {max_byzantine_nodes} "
                f"Byzantine nodes. Minimum required size is {min_network_size}."
            )
            # Adjust max_byzantine_nodes to what can be tolerated
            max_byzantine_nodes = (node_count - 1) // 3
        
        # Calculate quorum size: 2f+1
        quorum_size = 2 * max_byzantine_nodes + 1
        
        self.logger.info(
            f"BFT quorum size for {node_count} nodes with {max_byzantine_nodes} "
            f"Byzantine nodes: {quorum_size}"
        )
        return quorum_size
        
    def calculate_raft_quorum(self, node_count: int) -> int:
        """
        Calculate the quorum size for Raft consensus.
        
        For Raft, we need a majority of nodes to agree: (n/2)+1.
        
        Args:
            node_count: Total number of nodes in the network
            
        Returns:
            int: Required quorum size
        """
        quorum_size = (node_count // 2) + 1
        
        self.logger.info(f"Raft quorum size for {node_count} nodes: {quorum_size}")
        return quorum_size
        
    def calculate_paxos_quorum(self, node_count: int) -> int:
        """
        Calculate the quorum size for Paxos consensus.
        
        For Paxos, we need a majority of nodes to agree: (n/2)+1.
        
        Args:
            node_count: Total number of nodes in the network
            
        Returns:
            int: Required quorum size
        """
        quorum_size = (node_count // 2) + 1
        
        self.logger.info(f"Paxos quorum size for {node_count} nodes: {quorum_size}")
        return quorum_size
        
    def calculate_custom_quorum(self, node_count: int, quorum_percentage: float) -> int:
        """
        Calculate a custom quorum size based on a percentage of nodes.
        
        Args:
            node_count: Total number of nodes in the network
            quorum_percentage: Percentage of nodes required for quorum (0.0 to 1.0)
            
        Returns:
            int: Required quorum size
        """
        if not 0.0 < quorum_percentage <= 1.0:
            self.logger.error(f"Invalid quorum percentage: {quorum_percentage}")
            quorum_percentage = 0.5  # Default to majority
        
        quorum_size = math.ceil(node_count * quorum_percentage)
        
        self.logger.info(
            f"Custom quorum size for {node_count} nodes with {quorum_percentage*100}% "
            f"requirement: {quorum_size}"
        )
        return quorum_size
        
    def calculate_quorum(self, protocol_type: str, node_count: int, **kwargs) -> int:
        """
        Calculate the quorum size based on the specified protocol type.
        
        Args:
            protocol_type: Type of consensus protocol
            node_count: Total number of nodes in the network
            **kwargs: Additional parameters for specific protocols
            
        Returns:
            int: Required quorum size
        """
        if protocol_type.lower() == 'pbft':
            max_byzantine_nodes = kwargs.get('max_byzantine_nodes')
            return self.calculate_bft_quorum(node_count, max_byzantine_nodes)
        elif protocol_type.lower() == 'raft':
            return self.calculate_raft_quorum(node_count)
        elif protocol_type.lower() == 'paxos':
            return self.calculate_paxos_quorum(node_count)
        elif protocol_type.lower() == 'custom':
            quorum_percentage = kwargs.get('quorum_percentage', 0.5)
            return self.calculate_custom_quorum(node_count, quorum_percentage)
        else:
            self.logger.warning(f"Unsupported protocol type: {protocol_type}, defaulting to BFT")
            return self.calculate_bft_quorum(node_count)
        
    def validate_quorum_size(self, quorum_size: int, node_count: int, protocol_type: str) -> bool:
        """
        Validate that a quorum size is appropriate for the specified protocol and network size.
        
        Args:
            quorum_size: Quorum size to validate
            node_count: Total number of nodes in the network
            protocol_type: Type of consensus protocol
            
        Returns:
            bool: True if the quorum size is valid
        """
        if quorum_size <= 0:
            self.logger.error(f"Invalid quorum size: {quorum_size}")
            return False
        
        if quorum_size > node_count:
            self.logger.error(f"Quorum size {quorum_size} exceeds network size {node_count}")
            return False
        
        if protocol_type.lower() == 'pbft':
            # For BFT, quorum must be at least 2f+1 where f is (n-1)/3
            max_byzantine_nodes = (node_count - 1) // 3
            min_quorum = 2 * max_byzantine_nodes + 1
            if quorum_size < min_quorum:
                self.logger.error(
                    f"Quorum size {quorum_size} is too small for BFT with {node_count} nodes. "
                    f"Minimum required quorum is {min_quorum}."
                )
                return False
        elif protocol_type.lower() in ['raft', 'paxos']:
            # For Raft and Paxos, quorum must be at least (n/2)+1
            min_quorum = (node_count // 2) + 1
            if quorum_size < min_quorum:
                self.logger.error(
                    f"Quorum size {quorum_size} is too small for {protocol_type} with {node_count} nodes. "
                    f"Minimum required quorum is {min_quorum}."
                )
                return False
        
        return True
