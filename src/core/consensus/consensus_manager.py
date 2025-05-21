"""
Consensus Manager for Promethios Governance System.

This module provides the central manager for consensus operations, coordinating
the consensus process across multiple nodes and ensuring Byzantine Fault Tolerance.
"""

import json
import logging
import uuid
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger(__name__)

class ConsensusManager:
    """
    Manages consensus operations for distributed governance decisions.
    
    Provides Byzantine Fault Tolerant consensus for multi-node deployments,
    ensuring that governance decisions remain consistent and tamper-proof
    across distributed environments.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the consensus manager with the specified configuration.
        
        Args:
            config_path: Path to the consensus configuration file
        """
        self.config = self._load_config(config_path)
        self.nodes = {}
        self.quorum_size = self.config.get('quorum_size')
        self.consensus_protocol = self._initialize_protocol(self.config.get('protocol_type'))
        self.decision_registry = {}
        self.proposals = {}
        self.logger = logging.getLogger(__name__)
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """
        Load configuration from the specified path.
        
        Args:
            config_path: Path to the configuration file
            
        Returns:
            dict: Configuration data
        """
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Validate required configuration parameters
            required_params = ['quorum_size', 'protocol_type', 'node_timeout']
            for param in required_params:
                if param not in config:
                    raise ValueError(f"Missing required configuration parameter: {param}")
            
            return config
        except Exception as e:
            self.logger.error(f"Failed to load configuration: {str(e)}")
            # Provide sensible defaults for critical parameters
            return {
                'quorum_size': 3,  # Minimum for BFT with f=1
                'protocol_type': 'pbft',
                'node_timeout': 30,  # seconds
                'max_retries': 3
            }
    
    def _initialize_protocol(self, protocol_type: str) -> Any:
        """
        Initialize the consensus protocol based on the specified type.
        
        Args:
            protocol_type: Type of consensus protocol to use
            
        Returns:
            object: Initialized protocol object
        """
        if protocol_type.lower() == 'pbft':
            from .consensus_protocol import PBFTProtocol
            return PBFTProtocol(self.config)
        elif protocol_type.lower() == 'raft':
            from .consensus_protocol import RaftProtocol
            return RaftProtocol(self.config)
        else:
            self.logger.warning(f"Unsupported protocol type: {protocol_type}, defaulting to PBFT")
            from .consensus_protocol import PBFTProtocol
            return PBFTProtocol(self.config)
        
    def register_node(self, node_id: str, node_info: Dict[str, Any]) -> bool:
        """
        Register a node in the consensus network.
        
        Args:
            node_id: Unique identifier for the node
            node_info: Information about the node
            
        Returns:
            bool: True if registration was successful
        """
        if node_id in self.nodes:
            self.logger.warning(f"Node {node_id} is already registered")
            return False
        
        # Validate required node information
        required_info = ['public_key', 'endpoint', 'capabilities']
        for info in required_info:
            if info not in node_info:
                self.logger.error(f"Missing required node information: {info}")
                return False
        
        # Add node to registry
        self.nodes[node_id] = {
            'info': node_info,
            'status': 'active',
            'last_seen': None,
            'votes': {}
        }
        
        self.logger.info(f"Node {node_id} registered successfully")
        return True
        
    def propose_decision(self, decision_id: str, decision_data: Dict[str, Any]) -> str:
        """
        Propose a governance decision for consensus.
        
        Args:
            decision_id: Unique identifier for the decision
            decision_data: Data associated with the decision
            
        Returns:
            str: Proposal ID
        """
        # Generate a unique proposal ID
        proposal_id = str(uuid.uuid4())
        
        # Create proposal record
        proposal = {
            'proposal_id': proposal_id,
            'decision_id': decision_id,
            'decision_data': decision_data,
            'status': 'proposed',
            'votes': {},
            'timestamp': None,  # Will be set by the protocol
            'result': None
        }
        
        # Submit proposal to consensus protocol
        success = self.consensus_protocol.submit_proposal(proposal)
        if not success:
            self.logger.error(f"Failed to submit proposal {proposal_id}")
            return None
        
        # Store proposal in local registry
        self.proposals[proposal_id] = proposal
        
        self.logger.info(f"Decision {decision_id} proposed with proposal ID {proposal_id}")
        return proposal_id
        
    def vote_on_proposal(self, proposal_id: str, node_id: str, vote: bool) -> bool:
        """
        Record a vote on a proposal from a node.
        
        Args:
            proposal_id: Identifier of the proposal
            node_id: Identifier of the voting node
            vote: The node's vote
            
        Returns:
            bool: True if the vote was recorded successfully
        """
        # Validate proposal and node
        if proposal_id not in self.proposals:
            self.logger.error(f"Proposal {proposal_id} not found")
            return False
        
        if node_id not in self.nodes:
            self.logger.error(f"Node {node_id} not registered")
            return False
        
        # Record vote
        proposal = self.proposals[proposal_id]
        proposal['votes'][node_id] = vote
        
        # Submit vote to consensus protocol
        success = self.consensus_protocol.submit_vote(proposal_id, node_id, vote)
        if not success:
            self.logger.error(f"Failed to submit vote from node {node_id} for proposal {proposal_id}")
            return False
        
        # Check if consensus has been reached
        consensus_result = self.consensus_protocol.check_consensus(proposal_id)
        if consensus_result is not None:
            self._finalize_decision(proposal_id, consensus_result)
        
        self.logger.info(f"Vote from node {node_id} for proposal {proposal_id} recorded successfully")
        return True
        
    def get_decision_status(self, proposal_id: str) -> Dict[str, Any]:
        """
        Get the current status of a decision proposal.
        
        Args:
            proposal_id: Identifier of the proposal
            
        Returns:
            dict: Current status of the proposal
        """
        if proposal_id not in self.proposals:
            self.logger.error(f"Proposal {proposal_id} not found")
            return None
        
        proposal = self.proposals[proposal_id]
        
        # Get additional status from consensus protocol
        protocol_status = self.consensus_protocol.get_proposal_status(proposal_id)
        
        # Merge status information
        status = {
            'proposal_id': proposal_id,
            'decision_id': proposal['decision_id'],
            'status': proposal['status'],
            'vote_count': len(proposal['votes']),
            'positive_votes': sum(1 for v in proposal['votes'].values() if v),
            'negative_votes': sum(1 for v in proposal['votes'].values() if not v),
            'result': proposal['result'],
            'protocol_status': protocol_status
        }
        
        return status
        
    def finalize_decision(self, proposal_id: str) -> Dict[str, Any]:
        """
        Finalize a decision once consensus is reached.
        
        Args:
            proposal_id: Identifier of the proposal
            
        Returns:
            dict: Final decision data
        """
        if proposal_id not in self.proposals:
            self.logger.error(f"Proposal {proposal_id} not found")
            return None
        
        proposal = self.proposals[proposal_id]
        
        # Check if consensus has already been reached
        if proposal['status'] == 'finalized':
            self.logger.info(f"Proposal {proposal_id} already finalized")
            return proposal
        
        # Force consensus check
        consensus_result = self.consensus_protocol.check_consensus(proposal_id)
        if consensus_result is None:
            self.logger.error(f"Consensus not reached for proposal {proposal_id}")
            return None
        
        # Finalize decision
        return self._finalize_decision(proposal_id, consensus_result)
    
    def _finalize_decision(self, proposal_id: str, consensus_result: bool) -> Dict[str, Any]:
        """
        Internal method to finalize a decision.
        
        Args:
            proposal_id: Identifier of the proposal
            consensus_result: Result of the consensus
            
        Returns:
            dict: Final decision data
        """
        proposal = self.proposals[proposal_id]
        
        # Update proposal status
        proposal['status'] = 'finalized'
        proposal['result'] = consensus_result
        
        # Register decision in decision registry
        decision_id = proposal['decision_id']
        self.decision_registry[decision_id] = {
            'decision_id': decision_id,
            'proposal_id': proposal_id,
            'decision_data': proposal['decision_data'],
            'consensus_result': consensus_result,
            'finalized_at': None  # Will be set by the protocol
        }
        
        # Notify consensus protocol of finalization
        self.consensus_protocol.finalize_proposal(proposal_id, consensus_result)
        
        self.logger.info(f"Decision {decision_id} finalized with result {consensus_result}")
        return proposal
    
    def get_active_nodes(self) -> List[str]:
        """
        Get a list of active nodes in the consensus network.
        
        Returns:
            list: Active node IDs
        """
        return [node_id for node_id, node in self.nodes.items() if node['status'] == 'active']
    
    def get_quorum_size(self) -> int:
        """
        Get the current quorum size for consensus decisions.
        
        Returns:
            int: Quorum size
        """
        return self.quorum_size
    
    def update_quorum_size(self, new_size: int) -> bool:
        """
        Update the quorum size for consensus decisions.
        
        Args:
            new_size: New quorum size
            
        Returns:
            bool: True if update was successful
        """
        # Validate new quorum size
        active_nodes = len(self.get_active_nodes())
        if new_size > active_nodes:
            self.logger.error(f"Quorum size {new_size} exceeds number of active nodes {active_nodes}")
            return False
        
        # Update quorum size
        self.quorum_size = new_size
        
        # Update consensus protocol
        self.consensus_protocol.update_quorum_size(new_size)
        
        self.logger.info(f"Quorum size updated to {new_size}")
        return True
    
    def detect_byzantine_behavior(self) -> List[str]:
        """
        Detect nodes exhibiting Byzantine behavior.
        
        Returns:
            list: IDs of nodes exhibiting Byzantine behavior
        """
        return self.consensus_protocol.detect_byzantine_nodes()
