"""
Decision Registry for Promethios Governance System.

This module provides a registry for tracking decision proposals and their status
throughout the consensus process.
"""

import logging
import time
import uuid
from typing import Dict, List, Optional, Any, Set

logger = logging.getLogger(__name__)

class DecisionRegistry:
    """
    Registry for tracking decision proposals and their status.
    
    Maintains a record of all governance decisions that have gone through
    the consensus process, including their status, votes, and outcomes.
    """
    
    def __init__(self):
        """
        Initialize the decision registry.
        """
        self.decisions = {}
        self.proposals = {}
        self.decision_history = {}
        self.logger = logging.getLogger(__name__)
        
    def register_decision(self, decision_id: str, decision_data: Dict[str, Any]) -> bool:
        """
        Register a new governance decision.
        
        Args:
            decision_id: Unique identifier for the decision
            decision_data: Data associated with the decision
            
        Returns:
            bool: True if registration was successful
        """
        if decision_id in self.decisions:
            self.logger.warning(f"Decision {decision_id} already registered")
            return False
        
        # Validate decision data
        required_fields = ['type', 'content', 'metadata']
        for field in required_fields:
            if field not in decision_data:
                self.logger.error(f"Missing required field in decision data: {field}")
                return False
        
        # Register decision
        self.decisions[decision_id] = {
            'decision_id': decision_id,
            'data': decision_data,
            'status': 'registered',
            'proposals': [],
            'current_proposal': None,
            'finalized_proposal': None,
            'created_at': time.time(),
            'updated_at': time.time()
        }
        
        # Initialize decision history
        self.decision_history[decision_id] = [{
            'timestamp': time.time(),
            'action': 'register',
            'status': 'registered',
            'data': decision_data
        }]
        
        self.logger.info(f"Decision {decision_id} registered successfully")
        return True
        
    def register_proposal(self, proposal_id: str, decision_id: str, proposal_data: Dict[str, Any]) -> bool:
        """
        Register a proposal for a decision.
        
        Args:
            proposal_id: Unique identifier for the proposal
            decision_id: Identifier of the associated decision
            proposal_data: Data associated with the proposal
            
        Returns:
            bool: True if registration was successful
        """
        if proposal_id in self.proposals:
            self.logger.warning(f"Proposal {proposal_id} already registered")
            return False
        
        if decision_id not in self.decisions:
            self.logger.error(f"Decision {decision_id} not found")
            return False
        
        # Register proposal
        self.proposals[proposal_id] = {
            'proposal_id': proposal_id,
            'decision_id': decision_id,
            'data': proposal_data,
            'status': 'proposed',
            'votes': {},
            'result': None,
            'created_at': time.time(),
            'updated_at': time.time()
        }
        
        # Update decision
        decision = self.decisions[decision_id]
        decision['proposals'].append(proposal_id)
        decision['current_proposal'] = proposal_id
        decision['status'] = 'proposed'
        decision['updated_at'] = time.time()
        
        # Update decision history
        self.decision_history[decision_id].append({
            'timestamp': time.time(),
            'action': 'propose',
            'status': 'proposed',
            'proposal_id': proposal_id,
            'data': proposal_data
        })
        
        self.logger.info(f"Proposal {proposal_id} registered for decision {decision_id}")
        return True
        
    def record_vote(self, proposal_id: str, node_id: str, vote: bool) -> bool:
        """
        Record a vote on a proposal.
        
        Args:
            proposal_id: Identifier of the proposal
            node_id: Identifier of the voting node
            vote: The node's vote
            
        Returns:
            bool: True if recording was successful
        """
        if proposal_id not in self.proposals:
            self.logger.error(f"Proposal {proposal_id} not found")
            return False
        
        proposal = self.proposals[proposal_id]
        decision_id = proposal['decision_id']
        
        # Record vote
        proposal['votes'][node_id] = {
            'vote': vote,
            'timestamp': time.time()
        }
        proposal['updated_at'] = time.time()
        
        # Update decision history
        self.decision_history[decision_id].append({
            'timestamp': time.time(),
            'action': 'vote',
            'node_id': node_id,
            'proposal_id': proposal_id,
            'vote': vote
        })
        
        self.logger.info(f"Vote from node {node_id} for proposal {proposal_id} recorded")
        return True
        
    def finalize_proposal(self, proposal_id: str, result: bool) -> bool:
        """
        Finalize a proposal with the given result.
        
        Args:
            proposal_id: Identifier of the proposal
            result: Result of the consensus
            
        Returns:
            bool: True if finalization was successful
        """
        if proposal_id not in self.proposals:
            self.logger.error(f"Proposal {proposal_id} not found")
            return False
        
        proposal = self.proposals[proposal_id]
        decision_id = proposal['decision_id']
        decision = self.decisions[decision_id]
        
        # Update proposal
        proposal['status'] = 'finalized'
        proposal['result'] = result
        proposal['updated_at'] = time.time()
        
        # Update decision
        decision['status'] = 'finalized' if result else 'rejected'
        decision['finalized_proposal'] = proposal_id if result else None
        decision['updated_at'] = time.time()
        
        # Update decision history
        self.decision_history[decision_id].append({
            'timestamp': time.time(),
            'action': 'finalize',
            'status': decision['status'],
            'proposal_id': proposal_id,
            'result': result
        })
        
        self.logger.info(f"Proposal {proposal_id} finalized with result {result}")
        return True
        
    def get_decision(self, decision_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a decision.
        
        Args:
            decision_id: Identifier of the decision
            
        Returns:
            dict or None: Decision information
        """
        if decision_id not in self.decisions:
            self.logger.error(f"Decision {decision_id} not found")
            return None
        
        return self.decisions[decision_id]
        
    def get_proposal(self, proposal_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a proposal.
        
        Args:
            proposal_id: Identifier of the proposal
            
        Returns:
            dict or None: Proposal information
        """
        if proposal_id not in self.proposals:
            self.logger.error(f"Proposal {proposal_id} not found")
            return None
        
        return self.proposals[proposal_id]
        
    def get_decision_history(self, decision_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        Get the history of a decision.
        
        Args:
            decision_id: Identifier of the decision
            
        Returns:
            list or None: Decision history
        """
        if decision_id not in self.decision_history:
            self.logger.error(f"Decision {decision_id} not found")
            return None
        
        return self.decision_history[decision_id]
        
    def get_decisions_by_status(self, status: str) -> List[str]:
        """
        Get decisions with the specified status.
        
        Args:
            status: Status to filter by
            
        Returns:
            list: Decision IDs
        """
        return [
            decision_id for decision_id, decision in self.decisions.items()
            if decision['status'] == status
        ]
        
    def get_proposals_by_status(self, status: str) -> List[str]:
        """
        Get proposals with the specified status.
        
        Args:
            status: Status to filter by
            
        Returns:
            list: Proposal IDs
        """
        return [
            proposal_id for proposal_id, proposal in self.proposals.items()
            if proposal['status'] == status
        ]
        
    def get_decision_count(self) -> Dict[str, int]:
        """
        Get the count of decisions by status.
        
        Returns:
            dict: Decision counts by status
        """
        counts = {}
        for decision in self.decisions.values():
            status = decision['status']
            counts[status] = counts.get(status, 0) + 1
        
        return counts
        
    def get_proposal_count(self) -> Dict[str, int]:
        """
        Get the count of proposals by status.
        
        Returns:
            dict: Proposal counts by status
        """
        counts = {}
        for proposal in self.proposals.values():
            status = proposal['status']
            counts[status] = counts.get(status, 0) + 1
        
        return counts
