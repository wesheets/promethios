"""
Consensus Node implementation for Promethios Governance System.

This module provides the representation of a node in the consensus network,
managing node state, capabilities, and participation in the consensus process.
"""

import logging
import time
import uuid
from typing import Dict, List, Optional, Any, Set

logger = logging.getLogger(__name__)

class ConsensusNode:
    """
    Represents a node in the consensus network.
    
    Manages node state, capabilities, and participation in the consensus process.
    """
    
    def __init__(self, node_id: str, node_info: Dict[str, Any]):
        """
        Initialize a consensus node.
        
        Args:
            node_id: Unique identifier for the node
            node_info: Information about the node
        """
        self.node_id = node_id
        self.public_key = node_info.get('public_key')
        self.endpoint = node_info.get('endpoint')
        self.capabilities = node_info.get('capabilities', [])
        self.status = 'active'
        self.last_seen = time.time()
        self.votes = {}
        self.proposals = {}
        self.trust_score = 1.0
        self.logger = logging.getLogger(__name__)
        
    def update_status(self, status: str) -> bool:
        """
        Update the status of the node.
        
        Args:
            status: New status (active, inactive, suspended, byzantine)
            
        Returns:
            bool: True if update was successful
        """
        valid_statuses = ['active', 'inactive', 'suspended', 'byzantine']
        if status not in valid_statuses:
            self.logger.error(f"Invalid status: {status}")
            return False
        
        self.status = status
        self.logger.info(f"Node {self.node_id} status updated to {status}")
        return True
        
    def record_heartbeat(self) -> None:
        """
        Record a heartbeat from the node.
        """
        self.last_seen = time.time()
        
    def record_vote(self, proposal_id: str, vote: bool) -> None:
        """
        Record a vote from the node.
        
        Args:
            proposal_id: Identifier of the proposal
            vote: The node's vote
        """
        self.votes[proposal_id] = {
            'vote': vote,
            'timestamp': time.time()
        }
        
    def record_proposal(self, proposal_id: str, proposal_data: Dict[str, Any]) -> None:
        """
        Record a proposal from the node.
        
        Args:
            proposal_id: Identifier of the proposal
            proposal_data: Data associated with the proposal
        """
        self.proposals[proposal_id] = {
            'data': proposal_data,
            'timestamp': time.time()
        }
        
    def get_vote_history(self) -> Dict[str, Any]:
        """
        Get the voting history of the node.
        
        Returns:
            dict: Voting history
        """
        return self.votes
        
    def get_proposal_history(self) -> Dict[str, Any]:
        """
        Get the proposal history of the node.
        
        Returns:
            dict: Proposal history
        """
        return self.proposals
        
    def update_trust_score(self, new_score: float) -> bool:
        """
        Update the trust score of the node.
        
        Args:
            new_score: New trust score (0.0 to 1.0)
            
        Returns:
            bool: True if update was successful
        """
        if not 0.0 <= new_score <= 1.0:
            self.logger.error(f"Invalid trust score: {new_score}")
            return False
        
        self.trust_score = new_score
        self.logger.info(f"Node {self.node_id} trust score updated to {new_score}")
        return True
        
    def is_active(self) -> bool:
        """
        Check if the node is active.
        
        Returns:
            bool: True if the node is active
        """
        return self.status == 'active'
        
    def has_capability(self, capability: str) -> bool:
        """
        Check if the node has a specific capability.
        
        Args:
            capability: Capability to check
            
        Returns:
            bool: True if the node has the capability
        """
        return capability in self.capabilities
        
    def add_capability(self, capability: str) -> bool:
        """
        Add a capability to the node.
        
        Args:
            capability: Capability to add
            
        Returns:
            bool: True if addition was successful
        """
        if capability in self.capabilities:
            self.logger.warning(f"Node {self.node_id} already has capability {capability}")
            return False
        
        self.capabilities.append(capability)
        self.logger.info(f"Capability {capability} added to node {self.node_id}")
        return True
        
    def remove_capability(self, capability: str) -> bool:
        """
        Remove a capability from the node.
        
        Args:
            capability: Capability to remove
            
        Returns:
            bool: True if removal was successful
        """
        if capability not in self.capabilities:
            self.logger.warning(f"Node {self.node_id} does not have capability {capability}")
            return False
        
        self.capabilities.remove(capability)
        self.logger.info(f"Capability {capability} removed from node {self.node_id}")
        return True
        
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the node to a dictionary.
        
        Returns:
            dict: Node data
        """
        return {
            'node_id': self.node_id,
            'public_key': self.public_key,
            'endpoint': self.endpoint,
            'capabilities': self.capabilities,
            'status': self.status,
            'last_seen': self.last_seen,
            'trust_score': self.trust_score
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConsensusNode':
        """
        Create a node from a dictionary.
        
        Args:
            data: Node data
            
        Returns:
            ConsensusNode: Created node
        """
        node_id = data.get('node_id')
        node_info = {
            'public_key': data.get('public_key'),
            'endpoint': data.get('endpoint'),
            'capabilities': data.get('capabilities', [])
        }
        
        node = cls(node_id, node_info)
        node.status = data.get('status', 'active')
        node.last_seen = data.get('last_seen', time.time())
        node.trust_score = data.get('trust_score', 1.0)
        
        return node
