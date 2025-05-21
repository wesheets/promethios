"""
Integration tests for the Distributed Consensus Mechanism.

This module provides tests to validate the integration of all consensus components,
ensuring they work together correctly to achieve Byzantine Fault Tolerance.
"""

import unittest
import json
import os
import tempfile
import time
from typing import Dict, List, Any

from src.core.consensus.consensus_manager import ConsensusManager
from src.core.consensus.consensus_node import ConsensusNode
from src.core.consensus.decision_registry import DecisionRegistry
from src.core.consensus.quorum_calculator import QuorumCalculator
from src.core.consensus.vote_validator import VoteValidator
from src.core.consensus.byzantine_detector import ByzantineDetector

class TestDistributedConsensusIntegration(unittest.TestCase):
    """Integration tests for the Distributed Consensus Mechanism."""
    
    def setUp(self):
        """Set up test environment."""
        # Create a temporary config file
        self.config_file = tempfile.NamedTemporaryFile(delete=False)
        config = {
            'quorum_size': 3,
            'protocol_type': 'pbft',
            'node_timeout': 30,
            'max_retries': 3
        }
        with open(self.config_file.name, 'w') as f:
            json.dump(config, f)
        
        # Initialize components
        self.consensus_manager = ConsensusManager(self.config_file.name)
        self.decision_registry = DecisionRegistry()
        self.quorum_calculator = QuorumCalculator()
        self.vote_validator = VoteValidator()
        self.byzantine_detector = ByzantineDetector()
        
        # Register test nodes
        for i in range(5):
            node_id = f"node_{i}"
            node_info = {
                'public_key': f"key_{i}",
                'endpoint': f"http://node{i}:8000",
                'capabilities': ['vote', 'propose']
            }
            self.consensus_manager.register_node(node_id, node_info)
    
    def tearDown(self):
        """Clean up after tests."""
        os.unlink(self.config_file.name)
    
    def test_consensus_flow(self):
        """Test the complete consensus flow."""
        # Create a decision
        decision_id = "test_decision"
        decision_data = {
            'type': 'governance_update',
            'content': 'Update governance policy',
            'metadata': {'priority': 'high'}
        }
        self.decision_registry.register_decision(decision_id, decision_data)
        
        # Propose the decision
        proposal_id = self.consensus_manager.propose_decision(decision_id, decision_data)
        self.assertIsNotNone(proposal_id)
        
        # Register the proposal in the decision registry
        self.decision_registry.register_proposal(proposal_id, decision_id, decision_data)
        
        # Submit votes
        for i in range(4):  # 4 out of 5 nodes vote yes
            node_id = f"node_{i}"
            vote = True
            self.consensus_manager.vote_on_proposal(proposal_id, node_id, vote)
            self.decision_registry.record_vote(proposal_id, node_id, vote)
        
        # One node votes no
        self.consensus_manager.vote_on_proposal(proposal_id, "node_4", False)
        self.decision_registry.record_vote(proposal_id, "node_4", False)
        
        # Check consensus
        consensus_result = self.consensus_manager.finalize_decision(proposal_id)
        self.assertIsNotNone(consensus_result)
        self.assertTrue(consensus_result['result'])
        
        # Finalize in decision registry
        self.decision_registry.finalize_proposal(proposal_id, True)
        
        # Verify decision status
        decision = self.decision_registry.get_decision(decision_id)
        self.assertEqual(decision['status'], 'finalized')
    
    def test_byzantine_detection(self):
        """Test detection of Byzantine behavior."""
        # Create proposals
        proposals = {}
        for i in range(3):
            proposal_id = f"proposal_{i}"
            decision_id = f"decision_{i}"
            proposal_data = {
                'type': 'governance_update',
                'content': f'Update {i}',
                'metadata': {'priority': 'high'}
            }
            
            proposals[proposal_id] = {
                'proposal_id': proposal_id,
                'decision_id': decision_id,
                'data': proposal_data,
                'votes': {},
                'vote_history': []
            }
        
        # Simulate normal voting
        for i in range(4):
            node_id = f"node_{i}"
            for proposal_id in proposals:
                vote = True
                proposals[proposal_id]['votes'][node_id] = {'vote': vote, 'timestamp': time.time()}
                proposals[proposal_id]['vote_history'].append({'node_id': node_id, 'vote': vote})
        
        # Simulate Byzantine behavior for node_4
        node_id = "node_4"
        # Inconsistent voting
        proposals['proposal_0']['votes'][node_id] = {'vote': True, 'timestamp': time.time()}
        proposals['proposal_1']['votes'][node_id] = {'vote': False, 'timestamp': time.time()}
        proposals['proposal_2']['votes'][node_id] = {'vote': True, 'timestamp': time.time()}
        
        # Add to vote history
        for proposal_id in proposals:
            vote = proposals[proposal_id]['votes'][node_id]['vote']
            proposals[proposal_id]['vote_history'].append({'node_id': node_id, 'vote': vote})
        
        # Simulate equivocation (multiple votes on same proposal)
        proposals['proposal_0']['vote_history'].append({'node_id': node_id, 'vote': False})
        
        # Detect Byzantine nodes
        nodes = {f"node_{i}": {'node_id': f"node_{i}", 'status': 'active'} for i in range(5)}
        byzantine_nodes = self.byzantine_detector.detect_byzantine_nodes(nodes, proposals)
        
        # Verify node_4 is detected as Byzantine
        self.assertIn("node_4", byzantine_nodes)
    
    def test_quorum_calculation(self):
        """Test quorum calculation for different protocols."""
        # Test BFT quorum
        node_count = 10
        max_byzantine = 3
        bft_quorum = self.quorum_calculator.calculate_bft_quorum(node_count, max_byzantine)
        self.assertEqual(bft_quorum, 2 * max_byzantine + 1)
        
        # Test Raft quorum
        raft_quorum = self.quorum_calculator.calculate_raft_quorum(node_count)
        self.assertEqual(raft_quorum, (node_count // 2) + 1)
        
        # Test custom quorum
        percentage = 0.7
        custom_quorum = self.quorum_calculator.calculate_custom_quorum(node_count, percentage)
        self.assertEqual(custom_quorum, 7)  # 70% of 10
    
    def test_vote_validation(self):
        """Test validation of votes."""
        # Valid vote
        vote_data = {
            'vote_id': 'vote_1',
            'proposal_id': 'proposal_1',
            'vote': True,
            'timestamp': time.time()
        }
        
        node_data = {
            'node_id': 'node_1',
            'status': 'active',
            'trust_score': 0.8,
            'capabilities': ['vote', 'propose']
        }
        
        # Validate vote
        result = self.vote_validator.validate_vote(vote_data, node_data)
        self.assertTrue(result)
        
        # Invalid vote (inactive node)
        node_data['status'] = 'inactive'
        result = self.vote_validator.validate_vote(vote_data, node_data)
        self.assertFalse(result)
        
        # Invalid vote (low trust score)
        node_data['status'] = 'active'
        node_data['trust_score'] = 0.3
        result = self.vote_validator.validate_vote(vote_data, node_data)
        self.assertFalse(result)
        
        # Invalid vote (future timestamp)
        node_data['trust_score'] = 0.8
        vote_data['timestamp'] = time.time() + 3600
        result = self.vote_validator.validate_vote(vote_data, node_data)
        self.assertFalse(result)

if __name__ == '__main__':
    unittest.main()
