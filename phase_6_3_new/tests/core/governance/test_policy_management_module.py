"""
Unit tests for the PolicyManagementModule class.

This module contains unit tests for the PolicyManagementModule class.
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from src.core.governance.policy_management_module import PolicyManagementModule

class TestPolicyManagementModule(unittest.TestCase):
    """Test cases for the PolicyManagementModule class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.mock_codex_lock = MagicMock()
        self.mock_codex_lock.verify_tether.return_value = True
        self.mock_codex_lock.verify_operation_tether.return_value = True
        
        self.mock_decision_framework = MagicMock()
        self.mock_attestation_service = MagicMock()
        self.mock_trust_metrics_calculator = MagicMock()
        self.mock_requirement_validation = MagicMock()
        
        # Create test config
        self.test_config = {
            'storage_dir': os.path.join('test_data', 'governance', 'policies'),
            'schema_path': os.path.join('schemas', 'governance', 'governance_policy.schema.v1.json')
        }
        
        # Create test directories
        os.makedirs(os.path.join('test_data', 'governance', 'policies', 'policies'), exist_ok=True)
        os.makedirs(os.path.join('test_data', 'governance', 'policies', 'exemptions'), exist_ok=True)
        os.makedirs(os.path.join('test_data', 'governance', 'policies', 'events'), exist_ok=True)
        
        # Create module
        self.policy_module = PolicyManagementModule(
            self.test_config,
            self.mock_codex_lock,
            self.mock_decision_framework,
            self.mock_attestation_service,
            self.mock_trust_metrics_calculator,
            self.mock_requirement_validation
        )
        
        # Mock schema validator
        self.policy_module.schema_validator = MagicMock()
        
        # Add test policy
        self.test_policy = {
            'name': 'Test Policy',
            'description': 'A test policy',
            'policy_type': 'SECURITY',
            'rules': [
                {
                    'rule_id': 'rule-1',
                    'rule_type': 'CONDITION',
                    'definition': {
                        'condition_type': 'ENTITY_PROPERTY',
                        'condition_value': {
                            'property_name': 'security_level',
                            'expected_value': 'HIGH'
                        }
                    }
                }
            ]
        }
        
        # Add test exemption
        self.test_exemption = {
            'policy_id': 'pol-test-1',
            'requester': 'user-1',
            'justification': 'Test justification',
            'entity_id': 'entity-1',
            'entity_type': 'SYSTEM'
        }
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test directories
        import shutil
        if os.path.exists('test_data'):
            shutil.rmtree('test_data')
    
    def test_init(self):
        """Test initialization of PolicyManagementModule."""
        self.assertEqual(self.policy_module.config, self.test_config)
        self.assertEqual(self.policy_module.codex_lock, self.mock_codex_lock)
        self.assertEqual(self.policy_module.decision_framework, self.mock_decision_framework)
        self.assertEqual(self.policy_module.attestation_service, self.mock_attestation_service)
        self.assertEqual(self.policy_module.trust_metrics_calculator, self.mock_trust_metrics_calculator)
        self.assertEqual(self.policy_module.requirement_validation, self.mock_requirement_validation)
        self.assertEqual(self.policy_module.storage_dir, os.path.join('test_data', 'governance', 'policies'))
        self.assertEqual(len(self.policy_module.policies), 0)
        self.assertEqual(len(self.policy_module.exemptions), 0)
        self.assertEqual(len(self.policy_module.policy_exemptions), 0)
    
    def test_create_policy(self):
        """Test creating a governance policy."""
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Policy created successfully")
        self.assertIsNotNone(policy_id)
        self.assertTrue(policy_id.startswith('pol-'))
        
        # Check policy was saved
        self.assertIn(policy_id, self.policy_module.policies)
        policy = self.policy_module.policies[policy_id]
        self.assertEqual(policy['name'], self.test_policy['name'])
        self.assertEqual(policy['description'], self.test_policy['description'])
        self.assertEqual(policy['policy_type'], self.test_policy['policy_type'])
        self.assertEqual(policy['status'], 'DRAFT')
        self.assertIn('created_at', policy)
        self.assertIn('updated_at', policy)
    
    def test_create_policy_invalid_type(self):
        """Test creating a policy with an invalid type."""
        # Create invalid policy
        invalid_policy = self.test_policy.copy()
        invalid_policy['policy_type'] = 'INVALID'
        
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(invalid_policy)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Invalid policy type: INVALID")
        self.assertIsNone(policy_id)
    
    def test_get_policy(self):
        """Test getting a governance policy."""
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Get policy
        policy = self.policy_module.get_policy(policy_id)
        
        # Check result
        self.assertIsNotNone(policy)
        self.assertEqual(policy['name'], self.test_policy['name'])
        self.assertEqual(policy['description'], self.test_policy['description'])
        self.assertEqual(policy['policy_type'], self.test_policy['policy_type'])
    
    def test_get_policy_not_found(self):
        """Test getting a policy that doesn't exist."""
        # Get non-existent policy
        policy = self.policy_module.get_policy('pol-nonexistent')
        
        # Check result
        self.assertIsNone(policy)
    
    def test_list_policies(self):
        """Test listing governance policies."""
        # Create policies
        self.policy_module.create_policy(self.test_policy)
        
        # Create another policy
        another_policy = self.test_policy.copy()
        another_policy['name'] = 'Another Policy'
        another_policy['policy_type'] = 'COMPLIANCE'
        self.policy_module.create_policy(another_policy)
        
        # List policies
        policies = self.policy_module.list_policies()
        
        # Check result
        self.assertEqual(len(policies), 2)
    
    def test_list_policies_with_filters(self):
        """Test listing policies with filters."""
        # Create policies
        self.policy_module.create_policy(self.test_policy)
        
        # Create another policy
        another_policy = self.test_policy.copy()
        another_policy['name'] = 'Another Policy'
        another_policy['policy_type'] = 'COMPLIANCE'
        self.policy_module.create_policy(another_policy)
        
        # List policies with filter
        policies = self.policy_module.list_policies(policy_type='SECURITY')
        
        # Check result
        self.assertEqual(len(policies), 1)
        self.assertEqual(policies[0]['policy_type'], 'SECURITY')
    
    def test_update_policy(self):
        """Test updating a governance policy."""
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Update policy
        updated_policy = {
            'name': 'Updated Policy',
            'description': 'An updated test policy',
            'status': 'ACTIVE'
        }
        
        success, message = self.policy_module.update_policy(policy_id, updated_policy)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Policy updated successfully")
        
        # Check policy was updated
        policy = self.policy_module.get_policy(policy_id)
        self.assertEqual(policy['name'], updated_policy['name'])
        self.assertEqual(policy['description'], updated_policy['description'])
        self.assertEqual(policy['status'], updated_policy['status'])
        self.assertEqual(policy['policy_type'], self.test_policy['policy_type'])  # Unchanged
    
    def test_update_policy_not_found(self):
        """Test updating a policy that doesn't exist."""
        # Update non-existent policy
        success, message = self.policy_module.update_policy('pol-nonexistent', {})
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Policy pol-nonexistent not found")
    
    def test_delete_policy(self):
        """Test deleting a governance policy."""
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Delete policy
        success, message = self.policy_module.delete_policy(policy_id)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Policy deleted successfully")
        
        # Check policy was deleted
        self.assertNotIn(policy_id, self.policy_module.policies)
    
    def test_delete_policy_not_found(self):
        """Test deleting a policy that doesn't exist."""
        # Delete non-existent policy
        success, message = self.policy_module.delete_policy('pol-nonexistent')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Policy pol-nonexistent not found")
    
    def test_create_exemption(self):
        """Test creating a policy exemption."""
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Update policy to ACTIVE
        self.policy_module.update_policy(policy_id, {'status': 'ACTIVE'})
        
        # Create exemption
        exemption = self.test_exemption.copy()
        exemption['policy_id'] = policy_id
        
        success, message, exemption_id = self.policy_module.create_exemption(exemption)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Exemption created successfully")
        self.assertIsNotNone(exemption_id)
        self.assertTrue(exemption_id.startswith('exm-'))
        
        # Check exemption was saved
        self.assertIn(exemption_id, self.policy_module.exemptions)
        saved_exemption = self.policy_module.exemptions[exemption_id]
        self.assertEqual(saved_exemption['policy_id'], policy_id)
        self.assertEqual(saved_exemption['requester'], exemption['requester'])
        self.assertEqual(saved_exemption['justification'], exemption['justification'])
        self.assertEqual(saved_exemption['entity_id'], exemption['entity_id'])
        self.assertEqual(saved_exemption['entity_type'], exemption['entity_type'])
        self.assertEqual(saved_exemption['status'], 'PENDING')
        self.assertIn('created_at', saved_exemption)
        self.assertIn('updated_at', saved_exemption)
        self.assertIn('expires_at', saved_exemption)
        
        # Check exemption was added to policy exemptions
        self.assertIn(policy_id, self.policy_module.policy_exemptions)
        self.assertIn(exemption_id, self.policy_module.policy_exemptions[policy_id])
    
    def test_create_exemption_invalid_policy(self):
        """Test creating an exemption with an invalid policy."""
        # Create exemption with non-existent policy
        exemption = self.test_exemption.copy()
        exemption['policy_id'] = 'pol-nonexistent'
        
        success, message, exemption_id = self.policy_module.create_exemption(exemption)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Policy pol-nonexistent not found")
        self.assertIsNone(exemption_id)
    
    def test_create_exemption_inactive_policy(self):
        """Test creating an exemption for an inactive policy."""
        # Create policy (DRAFT by default)
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Create exemption
        exemption = self.test_exemption.copy()
        exemption['policy_id'] = policy_id
        
        success, message, exemption_id = self.policy_module.create_exemption(exemption)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, f"Policy {policy_id} is not active")
        self.assertIsNone(exemption_id)
    
    def test_get_exemption(self):
        """Test getting a policy exemption."""
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Update policy to ACTIVE
        self.policy_module.update_policy(policy_id, {'status': 'ACTIVE'})
        
        # Create exemption
        exemption = self.test_exemption.copy()
        exemption['policy_id'] = policy_id
        
        success, message, exemption_id = self.policy_module.create_exemption(exemption)
        
        # Get exemption
        saved_exemption = self.policy_module.get_exemption(exemption_id)
        
        # Check result
        self.assertIsNotNone(saved_exemption)
        self.assertEqual(saved_exemption['policy_id'], policy_id)
        self.assertEqual(saved_exemption['requester'], exemption['requester'])
        self.assertEqual(saved_exemption['justification'], exemption['justification'])
        self.assertEqual(saved_exemption['entity_id'], exemption['entity_id'])
        self.assertEqual(saved_exemption['entity_type'], exemption['entity_type'])
    
    def test_get_exemption_not_found(self):
        """Test getting an exemption that doesn't exist."""
        # Get non-existent exemption
        exemption = self.policy_module.get_exemption('exm-nonexistent')
        
        # Check result
        self.assertIsNone(exemption)
    
    def test_list_exemptions(self):
        """Test listing policy exemptions."""
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Update policy to ACTIVE
        self.policy_module.update_policy(policy_id, {'status': 'ACTIVE'})
        
        # Create exemptions
        exemption1 = self.test_exemption.copy()
        exemption1['policy_id'] = policy_id
        exemption1['requester'] = 'user-1'
        
        exemption2 = self.test_exemption.copy()
        exemption2['policy_id'] = policy_id
        exemption2['requester'] = 'user-2'
        
        self.policy_module.create_exemption(exemption1)
        self.policy_module.create_exemption(exemption2)
        
        # List exemptions
        exemptions = self.policy_module.list_exemptions()
        
        # Check result
        self.assertEqual(len(exemptions), 2)
    
    def test_list_exemptions_with_filters(self):
        """Test listing exemptions with filters."""
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Update policy to ACTIVE
        self.policy_module.update_policy(policy_id, {'status': 'ACTIVE'})
        
        # Create exemptions
        exemption1 = self.test_exemption.copy()
        exemption1['policy_id'] = policy_id
        exemption1['requester'] = 'user-1'
        
        exemption2 = self.test_exemption.copy()
        exemption2['policy_id'] = policy_id
        exemption2['requester'] = 'user-2'
        
        self.policy_module.create_exemption(exemption1)
        self.policy_module.create_exemption(exemption2)
        
        # List exemptions with filter
        exemptions = self.policy_module.list_exemptions(requester='user-1')
        
        # Check result
        self.assertEqual(len(exemptions), 1)
        self.assertEqual(exemptions[0]['requester'], 'user-1')
    
    def test_update_exemption(self):
        """Test updating a policy exemption."""
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Update policy to ACTIVE
        self.policy_module.update_policy(policy_id, {'status': 'ACTIVE'})
        
        # Create exemption
        exemption = self.test_exemption.copy()
        exemption['policy_id'] = policy_id
        
        success, message, exemption_id = self.policy_module.create_exemption(exemption)
        
        # Update exemption
        updated_exemption = {
            'justification': 'Updated justification',
            'status': 'APPROVED'
        }
        
        success, message = self.policy_module.update_exemption(exemption_id, updated_exemption)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Exemption updated successfully")
        
        # Check exemption was updated
        saved_exemption = self.policy_module.get_exemption(exemption_id)
        self.assertEqual(saved_exemption['justification'], updated_exemption['justification'])
        self.assertEqual(saved_exemption['status'], updated_exemption['status'])
        self.assertEqual(saved_exemption['policy_id'], policy_id)  # Unchanged
        self.assertEqual(saved_exemption['requester'], exemption['requester'])  # Unchanged
    
    def test_update_exemption_not_found(self):
        """Test updating an exemption that doesn't exist."""
        # Update non-existent exemption
        success, message = self.policy_module.update_exemption('exm-nonexistent', {})
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Exemption exm-nonexistent not found")
    
    def test_delete_exemption(self):
        """Test deleting a policy exemption."""
        # Create policy
        success, message, policy_id = self.policy_module.create_policy(self.test_policy)
        
        # Update policy to ACTIVE
        self.policy_module.update_policy(policy_id, {'status': 'ACTIVE'})
        
        # Create exemption
        exemption = self.test_exemption.copy()
        exemption['policy_id'] = policy_id
        
        success, message, exemption_id = self.policy_module.create_exemption(exemption)
        
        # Delete exemption
        success, message = self.policy_module.delete_exemption(exemption_id)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Exemption deleted successfully")
        
        # Check exemption was deleted
        self.assertNotIn(exemption_id, self.policy_module.exemptions)
        self.assertNotIn(exemption_id, self.policy_module.policy_exemptions[policy_id])
    
    def test_delete_exemption_not_found(self):
        """Test deleting an exemption that doesn't exist."""
        # Delete non-existent exemption
        success, message = self.policy_module.delete_exemption('exm-nonexistent')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Exemption exm-nonexistent not found")
    
    def test_validate_policy(self):
        """Test validating a governance policy."""
        # Validate policy
        success, message, validation_results = self.policy_module.validate_policy(self.test_policy)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Policy is valid")
        self.assertEqual(len(validation_results), 3)
        self.assertTrue(validation_results[0]['valid'])
        self.assertTrue(validation_results[1]['valid'])
        self.assertTrue(validation_results[2]['valid'])
    
    def test_validate_policy_invalid_type(self):
        """Test validating a policy with an invalid type."""
        # Create invalid policy
        invalid_policy = self.test_policy.copy()
        invalid_policy['policy_type'] = 'INVALID'
        
        # Validate policy
        success, message, validation_results = self.policy_module.validate_policy(invalid_policy)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Invalid policy type: INVALID")
        self.assertEqual(len(validation_results), 2)
        self.assertTrue(validation_results[0]['valid'])
        self.assertFalse(validation_results[1]['valid'])
    
    def test_validate_policy_no_rules(self):
        """Test validating a policy with no rules."""
        # Create invalid policy
        invalid_policy = self.test_policy.copy()
        invalid_policy['rules'] = []
        
        # Validate policy
        success, message, validation_results = self.policy_module.validate_policy(invalid_policy)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Policy must have at least one rule")
        self.assertEqual(len(validation_results), 3)
        self.assertTrue(validation_results[0]['valid'])
        self.assertTrue(validation_results[1]['valid'])
        self.assertFalse(validation_results[2]['valid'])

if __name__ == '__main__':
    unittest.main()
