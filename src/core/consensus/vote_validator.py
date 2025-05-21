"""
Vote Validator for Promethios Governance System.

This module provides functionality for validating votes in the consensus process,
ensuring that votes are properly authenticated, authorized, and consistent.
"""

import logging
import time
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

class VoteValidator:
    """
    Validator for node votes in the consensus process.
    
    Ensures that votes are properly authenticated, authorized, and consistent
    with the node's capabilities and trust level.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the vote validator with the specified configuration.
        
        Args:
            config: Configuration parameters for the validator
        """
        self.config = config or {}
        self.min_trust_score = self.config.get('min_trust_score', 0.5)
        self.required_capabilities = self.config.get('required_capabilities', [])
        self.logger = logging.getLogger(__name__)
        
    def validate_vote(self, vote_data: Dict[str, Any], node_data: Dict[str, Any]) -> bool:
        """
        Validate a vote from a node.
        
        Args:
            vote_data: Data associated with the vote
            node_data: Data associated with the voting node
            
        Returns:
            bool: True if the vote is valid
        """
        # Check if node is active
        if node_data.get('status') != 'active':
            self.logger.warning(f"Vote from inactive node {node_data.get('node_id')}")
            return False
        
        # Check if node has sufficient trust score
        trust_score = node_data.get('trust_score', 0.0)
        if trust_score < self.min_trust_score:
            self.logger.warning(
                f"Vote from node {node_data.get('node_id')} with insufficient trust score: "
                f"{trust_score} < {self.min_trust_score}"
            )
            return False
        
        # Check if node has required capabilities
        node_capabilities = node_data.get('capabilities', [])
        for capability in self.required_capabilities:
            if capability not in node_capabilities:
                self.logger.warning(
                    f"Vote from node {node_data.get('node_id')} missing required capability: "
                    f"{capability}"
                )
                return False
        
        # Validate vote signature if present
        if 'signature' in vote_data:
            if not self._validate_signature(vote_data, node_data):
                self.logger.warning(f"Invalid vote signature from node {node_data.get('node_id')}")
                return False
        
        # Validate vote timestamp if present
        if 'timestamp' in vote_data:
            if not self._validate_timestamp(vote_data):
                self.logger.warning(f"Invalid vote timestamp from node {node_data.get('node_id')}")
                return False
        
        return True
        
    def _validate_signature(self, vote_data: Dict[str, Any], node_data: Dict[str, Any]) -> bool:
        """
        Validate the signature of a vote.
        
        Args:
            vote_data: Data associated with the vote
            node_data: Data associated with the voting node
            
        Returns:
            bool: True if the signature is valid
        """
        # In a real implementation, this would use cryptographic verification
        # For now, we'll just check that the signature exists
        return 'signature' in vote_data
        
    def _validate_timestamp(self, vote_data: Dict[str, Any]) -> bool:
        """
        Validate the timestamp of a vote.
        
        Args:
            vote_data: Data associated with the vote
            
        Returns:
            bool: True if the timestamp is valid
        """
        timestamp = vote_data.get('timestamp', 0)
        current_time = time.time()
        
        # Check if timestamp is in the future
        if timestamp > current_time + 60:  # Allow for 1 minute clock skew
            self.logger.warning(f"Vote timestamp is in the future: {timestamp} > {current_time}")
            return False
        
        # Check if timestamp is too old
        max_age = self.config.get('max_vote_age', 3600)  # Default to 1 hour
        if current_time - timestamp > max_age:
            self.logger.warning(
                f"Vote timestamp is too old: {current_time} - {timestamp} > {max_age}"
            )
            return False
        
        return True
        
    def validate_vote_batch(self, votes: List[Dict[str, Any]], nodes: Dict[str, Dict[str, Any]]) -> Dict[str, bool]:
        """
        Validate a batch of votes from multiple nodes.
        
        Args:
            votes: List of vote data
            nodes: Dictionary of node data, keyed by node ID
            
        Returns:
            dict: Dictionary of validation results, keyed by vote ID
        """
        results = {}
        
        for vote in votes:
            vote_id = vote.get('vote_id')
            node_id = vote.get('node_id')
            
            if node_id not in nodes:
                self.logger.warning(f"Vote from unknown node: {node_id}")
                results[vote_id] = False
                continue
            
            node_data = nodes[node_id]
            results[vote_id] = self.validate_vote(vote, node_data)
        
        return results
        
    def update_min_trust_score(self, new_score: float) -> bool:
        """
        Update the minimum trust score required for vote validation.
        
        Args:
            new_score: New minimum trust score
            
        Returns:
            bool: True if update was successful
        """
        if not 0.0 <= new_score <= 1.0:
            self.logger.error(f"Invalid trust score: {new_score}")
            return False
        
        self.min_trust_score = new_score
        self.logger.info(f"Minimum trust score updated to {new_score}")
        return True
        
    def update_required_capabilities(self, capabilities: List[str]) -> bool:
        """
        Update the capabilities required for vote validation.
        
        Args:
            capabilities: New required capabilities
            
        Returns:
            bool: True if update was successful
        """
        self.required_capabilities = capabilities
        self.logger.info(f"Required capabilities updated to {capabilities}")
        return True
