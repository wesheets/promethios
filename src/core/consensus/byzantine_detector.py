"""
Byzantine Detector for Promethios Governance System.

This module provides functionality for detecting Byzantine behavior in consensus nodes,
identifying nodes that are behaving maliciously or inconsistently.
"""

import logging
import time
from typing import Dict, List, Optional, Any, Set

logger = logging.getLogger(__name__)

class ByzantineDetector:
    """
    Detector for Byzantine behavior in consensus nodes.
    
    Identifies nodes that are behaving maliciously or inconsistently in the
    consensus process, allowing the system to mitigate their impact.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the Byzantine detector with the specified configuration.
        
        Args:
            config: Configuration parameters for the detector
        """
        self.config = config or {}
        self.detection_window = self.config.get('detection_window', 3600)  # Default to 1 hour
        self.inconsistency_threshold = self.config.get('inconsistency_threshold', 0.2)
        self.vote_flip_threshold = self.config.get('vote_flip_threshold', 3)
        self.logger = logging.getLogger(__name__)
        self.detection_history = {}
        
    def detect_byzantine_nodes(self, nodes: Dict[str, Dict[str, Any]], 
                              proposals: Dict[str, Dict[str, Any]]) -> List[str]:
        """
        Detect nodes exhibiting Byzantine behavior.
        
        Args:
            nodes: Dictionary of node data, keyed by node ID
            proposals: Dictionary of proposal data, keyed by proposal ID
            
        Returns:
            list: IDs of nodes exhibiting Byzantine behavior
        """
        byzantine_nodes = set()
        
        # Check for inconsistent voting patterns
        inconsistent_nodes = self._detect_inconsistent_voting(nodes, proposals)
        byzantine_nodes.update(inconsistent_nodes)
        
        # Check for vote flipping
        vote_flipping_nodes = self._detect_vote_flipping(nodes, proposals)
        byzantine_nodes.update(vote_flipping_nodes)
        
        # Check for equivocation (voting multiple times for the same proposal)
        equivocation_nodes = self._detect_equivocation(nodes, proposals)
        byzantine_nodes.update(equivocation_nodes)
        
        # Record detection results
        timestamp = time.time()
        for node_id in byzantine_nodes:
            if node_id not in self.detection_history:
                self.detection_history[node_id] = []
            
            self.detection_history[node_id].append({
                'timestamp': timestamp,
                'reason': 'byzantine_behavior'
            })
        
        return list(byzantine_nodes)
        
    def _detect_inconsistent_voting(self, nodes: Dict[str, Dict[str, Any]], 
                                   proposals: Dict[str, Dict[str, Any]]) -> Set[str]:
        """
        Detect nodes with inconsistent voting patterns.
        
        Args:
            nodes: Dictionary of node data, keyed by node ID
            proposals: Dictionary of proposal data, keyed by proposal ID
            
        Returns:
            set: IDs of nodes with inconsistent voting patterns
        """
        inconsistent_nodes = set()
        
        # Group proposals by decision
        decision_proposals = {}
        for proposal_id, proposal in proposals.items():
            decision_id = proposal.get('decision_id')
            if decision_id not in decision_proposals:
                decision_proposals[decision_id] = []
            decision_proposals[decision_id].append(proposal_id)
        
        # Check for inconsistent votes on proposals for the same decision
        for decision_id, proposal_ids in decision_proposals.items():
            if len(proposal_ids) <= 1:
                continue
            
            # Check each node's votes across proposals for the same decision
            for node_id in nodes:
                votes = []
                for proposal_id in proposal_ids:
                    proposal = proposals[proposal_id]
                    if 'votes' in proposal and node_id in proposal['votes']:
                        vote = proposal['votes'][node_id]
                        if isinstance(vote, dict):
                            vote = vote.get('vote')
                        votes.append(vote)
                
                # If node voted on multiple proposals for the same decision
                if len(votes) > 1:
                    # Check for inconsistency
                    if len(set(votes)) > 1:
                        inconsistent_nodes.add(node_id)
                        self.logger.warning(
                            f"Node {node_id} voted inconsistently on proposals for decision {decision_id}"
                        )
        
        return inconsistent_nodes
        
    def _detect_vote_flipping(self, nodes: Dict[str, Dict[str, Any]], 
                             proposals: Dict[str, Dict[str, Any]]) -> Set[str]:
        """
        Detect nodes that flip their votes frequently.
        
        Args:
            nodes: Dictionary of node data, keyed by node ID
            proposals: Dictionary of proposal data, keyed by proposal ID
            
        Returns:
            set: IDs of nodes that flip their votes frequently
        """
        vote_flipping_nodes = set()
        
        # Track vote history for each node
        node_vote_history = {}
        
        # Collect vote history
        for proposal_id, proposal in proposals.items():
            if 'votes' not in proposal:
                continue
            
            for node_id, vote in proposal['votes'].items():
                if node_id not in node_vote_history:
                    node_vote_history[node_id] = []
                
                if isinstance(vote, dict):
                    vote_value = vote.get('vote')
                    vote_time = vote.get('timestamp', time.time())
                else:
                    vote_value = vote
                    vote_time = time.time()
                
                node_vote_history[node_id].append({
                    'proposal_id': proposal_id,
                    'vote': vote_value,
                    'timestamp': vote_time
                })
        
        # Sort vote history by timestamp
        for node_id in node_vote_history:
            node_vote_history[node_id].sort(key=lambda x: x['timestamp'])
        
        # Check for vote flipping
        for node_id, vote_history in node_vote_history.items():
            if len(vote_history) < 2:
                continue
            
            flip_count = 0
            prev_vote = vote_history[0]['vote']
            
            for vote_entry in vote_history[1:]:
                if vote_entry['vote'] != prev_vote:
                    flip_count += 1
                    prev_vote = vote_entry['vote']
            
            if flip_count >= self.vote_flip_threshold:
                vote_flipping_nodes.add(node_id)
                self.logger.warning(
                    f"Node {node_id} flipped votes {flip_count} times, exceeding threshold of "
                    f"{self.vote_flip_threshold}"
                )
        
        return vote_flipping_nodes
        
    def _detect_equivocation(self, nodes: Dict[str, Dict[str, Any]], 
                            proposals: Dict[str, Dict[str, Any]]) -> Set[str]:
        """
        Detect nodes that vote multiple times for the same proposal.
        
        Args:
            nodes: Dictionary of node data, keyed by node ID
            proposals: Dictionary of proposal data, keyed by proposal ID
            
        Returns:
            set: IDs of nodes that vote multiple times for the same proposal
        """
        equivocation_nodes = set()
        
        # Check for multiple votes on the same proposal
        for proposal_id, proposal in proposals.items():
            if 'vote_history' not in proposal:
                continue
            
            # Count votes per node
            node_vote_counts = {}
            for vote_entry in proposal['vote_history']:
                node_id = vote_entry.get('node_id')
                if node_id not in node_vote_counts:
                    node_vote_counts[node_id] = 0
                node_vote_counts[node_id] += 1
            
            # Check for nodes with multiple votes
            for node_id, vote_count in node_vote_counts.items():
                if vote_count > 1:
                    equivocation_nodes.add(node_id)
                    self.logger.warning(
                        f"Node {node_id} voted {vote_count} times on proposal {proposal_id}"
                    )
        
        return equivocation_nodes
        
    def get_detection_history(self, node_id: str = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get the detection history for a node or all nodes.
        
        Args:
            node_id: Identifier of the node, or None for all nodes
            
        Returns:
            dict: Detection history
        """
        if node_id is not None:
            if node_id not in self.detection_history:
                return {node_id: []}
            return {node_id: self.detection_history[node_id]}
        
        return self.detection_history
        
    def clear_detection_history(self, node_id: str = None) -> bool:
        """
        Clear the detection history for a node or all nodes.
        
        Args:
            node_id: Identifier of the node, or None for all nodes
            
        Returns:
            bool: True if clearing was successful
        """
        if node_id is not None:
            if node_id in self.detection_history:
                self.detection_history[node_id] = []
        else:
            self.detection_history = {}
        
        return True
        
    def update_detection_parameters(self, parameters: Dict[str, Any]) -> bool:
        """
        Update the detection parameters.
        
        Args:
            parameters: New detection parameters
            
        Returns:
            bool: True if update was successful
        """
        if 'detection_window' in parameters:
            self.detection_window = parameters['detection_window']
        
        if 'inconsistency_threshold' in parameters:
            self.inconsistency_threshold = parameters['inconsistency_threshold']
        
        if 'vote_flip_threshold' in parameters:
            self.vote_flip_threshold = parameters['vote_flip_threshold']
        
        self.logger.info(f"Detection parameters updated: {parameters}")
        return True
