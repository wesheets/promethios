"""
Unit tests for the DecisionFrameworkEngine class.

This module contains unit tests for the DecisionFrameworkEngine class.
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from src.core.governance.decision_framework_engine import DecisionFrameworkEngine

class TestDecisionFrameworkEngine(unittest.TestCase):
    """Test cases for the DecisionFrameworkEngine class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.mock_codex_lock = MagicMock()
        self.mock_codex_lock.verify_tether.return_value = True
        self.mock_codex_lock.verify_operation_tether.return_value = True
        
        self.mock_attestation_service = MagicMock()
        self.mock_trust_metrics_calculator = MagicMock()
        
        # Create test config
        self.test_config = {
            'storage_dir': os.path.join('test_data', 'governance', 'decision_frameworks'),
            'schema_path': os.path.join('schemas', 'governance', 'decision_framework.schema.v1.json')
        }
        
        # Create test directories
        os.makedirs(os.path.join('test_data', 'governance', 'decision_frameworks', 'frameworks'), exist_ok=True)
        os.makedirs(os.path.join('test_data', 'governance', 'decision_frameworks', 'decisions'), exist_ok=True)
        os.makedirs(os.path.join('test_data', 'governance', 'decision_frameworks', 'events'), exist_ok=True)
        
        # Create module
        self.framework_engine = DecisionFrameworkEngine(
            self.test_config,
            self.mock_codex_lock,
            self.mock_attestation_service,
            self.mock_trust_metrics_calculator
        )
        
        # Mock schema validator at the instance level
        self.mock_schema_validator = MagicMock()
        self.framework_engine.schema_validator = self.mock_schema_validator
        
        # Add test framework
        self.test_framework = {
            'name': 'Test Framework',
            'description': 'A test decision framework',
            'decision_model': 'MAJORITY',
            'required_voters': ['voter-1', 'voter-2'],
            'active': True
        }
        
        # Add test decision
        self.test_decision = {
            'framework_id': None,  # Will be set after framework creation
            'title': 'Test Decision',
            'description': 'A test decision',
            'options': ['Option A', 'Option B'],
            'deadline': (datetime.utcnow() + timedelta(days=7)).isoformat()
        }
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test directories
        import shutil
        if os.path.exists('test_data'):
            shutil.rmtree('test_data')
    
    def test_init(self):
        """Test initialization of DecisionFrameworkEngine."""
        self.assertEqual(self.framework_engine.config, self.test_config)
        self.assertEqual(self.framework_engine.codex_lock, self.mock_codex_lock)
        self.assertEqual(self.framework_engine.attestation_service, self.mock_attestation_service)
        self.assertEqual(self.framework_engine.trust_metrics_calculator, self.mock_trust_metrics_calculator)
        self.assertEqual(self.framework_engine.storage_dir, os.path.join('test_data', 'governance', 'decision_frameworks'))
        self.assertEqual(len(self.framework_engine.frameworks), 0)
        self.assertEqual(len(self.framework_engine.decisions), 0)
    
    def test_create_framework(self):
        """Test creating a decision framework."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Framework created successfully")
        self.assertIsNotNone(framework_id)
        self.assertTrue(framework_id.startswith('frm-'))
        
        # Check framework was saved
        self.assertIn(framework_id, self.framework_engine.frameworks)
        framework = self.framework_engine.frameworks[framework_id]
        self.assertEqual(framework['name'], self.test_framework['name'])
        self.assertEqual(framework['description'], self.test_framework['description'])
        self.assertEqual(framework['decision_model'], self.test_framework['decision_model'])
        self.assertEqual(framework['active'], self.test_framework['active'])
        self.assertIn('created_at', framework)
        self.assertIn('updated_at', framework)
    
    def test_create_framework_invalid_model(self):
        """Test creating a framework with an invalid decision model."""
        # Create invalid framework
        invalid_framework = self.test_framework.copy()
        invalid_framework['decision_model'] = 'INVALID'
        
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(invalid_framework)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Invalid decision model: INVALID")
        self.assertIsNone(framework_id)
    
    def test_get_framework(self):
        """Test getting a decision framework."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Get framework
        framework = self.framework_engine.get_framework(framework_id)
        
        # Check result
        self.assertIsNotNone(framework)
        self.assertEqual(framework['name'], self.test_framework['name'])
        self.assertEqual(framework['description'], self.test_framework['description'])
        self.assertEqual(framework['decision_model'], self.test_framework['decision_model'])
    
    def test_get_framework_not_found(self):
        """Test getting a framework that doesn't exist."""
        # Get non-existent framework
        framework = self.framework_engine.get_framework('frm-nonexistent')
        
        # Check result
        self.assertIsNone(framework)
    
    def test_list_frameworks(self):
        """Test listing decision frameworks."""
        # Create frameworks
        self.framework_engine.create_framework(self.test_framework)
        
        # Create another framework
        another_framework = self.test_framework.copy()
        another_framework['name'] = 'Another Framework'
        another_framework['decision_model'] = 'CONSENSUS'
        self.framework_engine.create_framework(another_framework)
        
        # List frameworks
        frameworks = self.framework_engine.list_frameworks()
        
        # Check result
        self.assertEqual(len(frameworks), 2)
    
    def test_list_frameworks_with_filters(self):
        """Test listing frameworks with filters."""
        # Create frameworks
        self.framework_engine.create_framework(self.test_framework)
        
        # Create another framework
        another_framework = self.test_framework.copy()
        another_framework['name'] = 'Another Framework'
        another_framework['decision_model'] = 'CONSENSUS'
        another_framework['active'] = False
        self.framework_engine.create_framework(another_framework)
        
        # List frameworks with filter
        frameworks = self.framework_engine.list_frameworks(active_only=True)
        
        # Check result
        self.assertEqual(len(frameworks), 1)
        self.assertEqual(frameworks[0]['decision_model'], 'MAJORITY')
    
    def test_update_framework(self):
        """Test updating a framework."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Update framework
        updated_framework = {
            'name': 'Updated Framework',
            'description': 'An updated test framework',
            'active': False
        }
        
        success, message = self.framework_engine.update_framework(framework_id, updated_framework)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Framework updated successfully")
        
        # Check framework was updated
        framework = self.framework_engine.get_framework(framework_id)
        self.assertEqual(framework['name'], updated_framework['name'])
        self.assertEqual(framework['description'], updated_framework['description'])
        self.assertEqual(framework['active'], updated_framework['active'])
        self.assertEqual(framework['decision_model'], self.test_framework['decision_model'])  # Unchanged
    
    def test_update_framework_not_found(self):
        """Test updating a framework that doesn't exist."""
        # Update non-existent framework
        success, message = self.framework_engine.update_framework('frm-nonexistent', {})
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Framework frm-nonexistent not found")
    
    def test_delete_framework(self):
        """Test deleting a framework."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Delete framework
        success, message = self.framework_engine.delete_framework(framework_id)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Framework deleted successfully")
        
        # Check framework was deleted
        self.assertNotIn(framework_id, self.framework_engine.frameworks)
    
    def test_delete_framework_not_found(self):
        """Test deleting a framework that doesn't exist."""
        # Delete non-existent framework
        success, message = self.framework_engine.delete_framework('frm-nonexistent')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Framework frm-nonexistent not found")
    
    def test_create_decision(self):
        """Test creating a decision."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Create decision
        decision = self.test_decision.copy()
        decision['framework_id'] = framework_id
        
        success, message, decision_id = self.framework_engine.create_decision(decision)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Decision created successfully")
        self.assertIsNotNone(decision_id)
        self.assertTrue(decision_id.startswith('dec-'))
        
        # Check decision was saved
        self.assertIn(decision_id, self.framework_engine.decisions)
        saved_decision = self.framework_engine.decisions[decision_id]
        self.assertEqual(saved_decision['title'], decision['title'])
        self.assertEqual(saved_decision['description'], decision['description'])
        self.assertEqual(saved_decision['framework_id'], framework_id)
        self.assertEqual(saved_decision['status'], 'PENDING')
        self.assertIn('created_at', saved_decision)
        self.assertIn('updated_at', saved_decision)
    
    def test_create_decision_framework_not_found(self):
        """Test creating a decision with a non-existent framework."""
        # Create decision
        decision = self.test_decision.copy()
        decision['framework_id'] = 'frm-nonexistent'
        
        success, message, decision_id = self.framework_engine.create_decision(decision)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Framework frm-nonexistent not found")
        self.assertIsNone(decision_id)
    
    def test_get_decision(self):
        """Test getting a decision."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Create decision
        decision = self.test_decision.copy()
        decision['framework_id'] = framework_id
        
        success, message, decision_id = self.framework_engine.create_decision(decision)
        
        # Get decision
        saved_decision = self.framework_engine.get_decision(decision_id)
        
        # Check result
        self.assertIsNotNone(saved_decision)
        self.assertEqual(saved_decision['title'], decision['title'])
        self.assertEqual(saved_decision['description'], decision['description'])
        self.assertEqual(saved_decision['framework_id'], framework_id)
    
    def test_get_decision_not_found(self):
        """Test getting a decision that doesn't exist."""
        # Get non-existent decision
        decision = self.framework_engine.get_decision('dec-nonexistent')
        
        # Check result
        self.assertIsNone(decision)
    
    def test_list_decisions(self):
        """Test listing decisions."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Create decisions
        decision1 = self.test_decision.copy()
        decision1['framework_id'] = framework_id
        decision1['title'] = 'Decision 1'
        
        decision2 = self.test_decision.copy()
        decision2['framework_id'] = framework_id
        decision2['title'] = 'Decision 2'
        
        self.framework_engine.create_decision(decision1)
        self.framework_engine.create_decision(decision2)
        
        # List decisions
        decisions = self.framework_engine.list_decisions()
        
        # Check result
        self.assertEqual(len(decisions), 2)
    
    def test_list_decisions_with_filters(self):
        """Test listing decisions with filters."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Create another framework
        another_framework = self.test_framework.copy()
        another_framework['name'] = 'Another Framework'
        success, message, another_framework_id = self.framework_engine.create_framework(another_framework)
        
        # Create decisions
        decision1 = self.test_decision.copy()
        decision1['framework_id'] = framework_id
        decision1['title'] = 'Decision 1'
        
        decision2 = self.test_decision.copy()
        decision2['framework_id'] = another_framework_id
        decision2['title'] = 'Decision 2'
        
        self.framework_engine.create_decision(decision1)
        self.framework_engine.create_decision(decision2)
        
        # List decisions with filter
        decisions = self.framework_engine.list_decisions(framework_id=framework_id)
        
        # Check result
        self.assertEqual(len(decisions), 1)
        self.assertEqual(decisions[0]['title'], 'Decision 1')
    
    def test_update_decision(self):
        """Test updating a decision."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Create decision
        decision = self.test_decision.copy()
        decision['framework_id'] = framework_id
        
        success, message, decision_id = self.framework_engine.create_decision(decision)
        
        # Update decision
        updated_decision = {
            'title': 'Updated Decision',
            'description': 'An updated test decision'
        }
        
        success, message = self.framework_engine.update_decision(decision_id, updated_decision)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Decision updated successfully")
        
        # Check decision was updated
        saved_decision = self.framework_engine.get_decision(decision_id)
        self.assertEqual(saved_decision['title'], updated_decision['title'])
        self.assertEqual(saved_decision['description'], updated_decision['description'])
        self.assertEqual(saved_decision['framework_id'], framework_id)  # Unchanged
    
    def test_update_decision_not_found(self):
        """Test updating a decision that doesn't exist."""
        # Update non-existent decision
        success, message = self.framework_engine.update_decision('dec-nonexistent', {})
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Decision dec-nonexistent not found")
    
    def test_cast_vote(self):
        """Test casting a vote on a decision."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Create decision
        decision = self.test_decision.copy()
        decision['framework_id'] = framework_id
        
        success, message, decision_id = self.framework_engine.create_decision(decision)
        
        # Cast vote
        success, message = self.framework_engine.cast_vote(decision_id, 'voter-1', 'APPROVE', 'I approve this decision')
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Vote cast successfully")
        
        # Check vote was saved
        saved_decision = self.framework_engine.get_decision(decision_id)
        self.assertEqual(len(saved_decision['votes']), 1)
        self.assertEqual(saved_decision['votes'][0]['voter_id'], 'voter-1')
        self.assertEqual(saved_decision['votes'][0]['vote'], 'APPROVE')
        self.assertEqual(saved_decision['votes'][0]['justification'], 'I approve this decision')
    
    def test_cast_vote_decision_not_found(self):
        """Test casting a vote on a decision that doesn't exist."""
        # Cast vote on non-existent decision
        success, message = self.framework_engine.cast_vote('dec-nonexistent', 'voter-1', 'APPROVE')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Decision dec-nonexistent not found")
    
    def test_cast_vote_invalid_vote(self):
        """Test casting an invalid vote."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Create decision
        decision = self.test_decision.copy()
        decision['framework_id'] = framework_id
        
        success, message, decision_id = self.framework_engine.create_decision(decision)
        
        # Cast invalid vote
        success, message = self.framework_engine.cast_vote(decision_id, 'voter-1', 'INVALID')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Invalid vote: INVALID")
    
    def test_cast_vote_already_voted(self):
        """Test casting a vote when the voter has already voted."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Create decision
        decision = self.test_decision.copy()
        decision['framework_id'] = framework_id
        
        success, message, decision_id = self.framework_engine.create_decision(decision)
        
        # Cast vote
        self.framework_engine.cast_vote(decision_id, 'voter-1', 'APPROVE')
        
        # Cast vote again
        success, message = self.framework_engine.cast_vote(decision_id, 'voter-1', 'REJECT')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, f"Voter voter-1 has already voted on decision {decision_id}")
    
    def test_finalize_decision(self):
        """Test manually finalizing a decision."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Create decision
        decision = self.test_decision.copy()
        decision['framework_id'] = framework_id
        
        success, message, decision_id = self.framework_engine.create_decision(decision)
        
        # Finalize decision
        success, message = self.framework_engine.finalize_decision(decision_id, 'APPROVED', 'Manual approval')
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, f"Decision {decision_id} finalized as APPROVED")
        
        # Check decision was finalized
        saved_decision = self.framework_engine.get_decision(decision_id)
        self.assertEqual(saved_decision['status'], 'APPROVED')
        self.assertEqual(saved_decision['finalization_justification'], 'Manual approval')
        self.assertIn('finalized_at', saved_decision)
    
    def test_finalize_decision_not_found(self):
        """Test finalizing a decision that doesn't exist."""
        # Finalize non-existent decision
        success, message = self.framework_engine.finalize_decision('dec-nonexistent', 'APPROVED')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Decision dec-nonexistent not found")
    
    def test_finalize_decision_already_finalized(self):
        """Test finalizing a decision that is already finalized."""
        # Create framework
        success, message, framework_id = self.framework_engine.create_framework(self.test_framework)
        
        # Create decision
        decision = self.test_decision.copy()
        decision['framework_id'] = framework_id
        
        success, message, decision_id = self.framework_engine.create_decision(decision)
        
        # Finalize decision
        self.framework_engine.finalize_decision(decision_id, 'APPROVED')
        
        # Finalize again
        success, message = self.framework_engine.finalize_decision(decision_id, 'REJECTED')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, f"Decision {decision_id} is already finalized")
    
    def test_validate_framework(self):
        """Test validating a framework."""
        # Validate framework
        success, message, validation_results = self.framework_engine.validate_framework(self.test_framework)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Framework is valid")
        self.assertEqual(len(validation_results), 2)
        self.assertTrue(validation_results[0]['valid'])
        self.assertTrue(validation_results[1]['valid'])
    
    def test_validate_framework_invalid_model(self):
        """Test validating a framework with an invalid decision model."""
        # Create invalid framework
        invalid_framework = self.test_framework.copy()
        invalid_framework['decision_model'] = 'INVALID'
        
        # Validate framework
        success, message, validation_results = self.framework_engine.validate_framework(invalid_framework)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Invalid decision model: INVALID")
        self.assertEqual(len(validation_results), 2)
        self.assertTrue(validation_results[0]['valid'])
        self.assertFalse(validation_results[1]['valid'])

if __name__ == '__main__':
    unittest.main()
