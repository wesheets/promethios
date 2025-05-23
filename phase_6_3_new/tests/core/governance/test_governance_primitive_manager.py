"""
Unit tests for the GovernancePrimitiveManager class.

This module contains unit tests for the GovernancePrimitiveManager class.
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from src.core.governance.governance_primitive_manager import GovernancePrimitiveManager

class TestGovernancePrimitiveManager(unittest.TestCase):
    """Test cases for the GovernancePrimitiveManager class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.mock_codex_lock = MagicMock()
        self.mock_codex_lock.verify_tether.return_value = True
        self.mock_codex_lock.verify_operation_tether.return_value = True
        
        self.mock_decision_framework = MagicMock()
        self.mock_attestation_service = MagicMock()
        self.mock_trust_metrics_calculator = MagicMock()
        
        # Create test config
        self.test_config = {
            'storage_dir': os.path.join('test_data', 'governance', 'primitives'),
            'schema_path': os.path.join('schemas', 'governance', 'governance_primitive.schema.v1.json')
        }
        
        # Create test directories
        os.makedirs(os.path.join('test_data', 'governance', 'primitives', 'primitives'), exist_ok=True)
        os.makedirs(os.path.join('test_data', 'governance', 'primitives', 'events'), exist_ok=True)
        
        # Create module
        self.primitive_manager = GovernancePrimitiveManager(
            self.test_config,
            self.mock_codex_lock,
            self.mock_decision_framework,
            self.mock_attestation_service,
            self.mock_trust_metrics_calculator
        )
        
        # Mock schema validator at the instance level
        self.mock_schema_validator = MagicMock()
        self.primitive_manager.schema_validator = self.mock_schema_validator
        
        # Add test primitive
        self.test_primitive = {
            'name': 'Test Primitive',
            'description': 'A test primitive',
            'primitive_type': 'CONSTRAINT',
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
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test directories
        import shutil
        if os.path.exists('test_data'):
            shutil.rmtree('test_data')
    
    def test_init(self):
        """Test initialization of GovernancePrimitiveManager."""
        self.assertEqual(self.primitive_manager.config, self.test_config)
        self.assertEqual(self.primitive_manager.codex_lock, self.mock_codex_lock)
        self.assertEqual(self.primitive_manager.decision_framework, self.mock_decision_framework)
        self.assertEqual(self.primitive_manager.attestation_service, self.mock_attestation_service)
        self.assertEqual(self.primitive_manager.trust_metrics_calculator, self.mock_trust_metrics_calculator)
        self.assertEqual(self.primitive_manager.storage_dir, os.path.join('test_data', 'governance', 'primitives'))
        self.assertEqual(len(self.primitive_manager.primitives), 0)
    
    def test_create_primitive(self):
        """Test creating a governance primitive."""
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Primitive created successfully")
        self.assertIsNotNone(primitive_id)
        self.assertTrue(primitive_id.startswith('prm-'))
        
        # Check primitive was saved
        self.assertIn(primitive_id, self.primitive_manager.primitives)
        primitive = self.primitive_manager.primitives[primitive_id]
        self.assertEqual(primitive['name'], self.test_primitive['name'])
        self.assertEqual(primitive['description'], self.test_primitive['description'])
        self.assertEqual(primitive['primitive_type'], self.test_primitive['primitive_type'])
        self.assertEqual(primitive['status'], 'DRAFT')
        self.assertIn('created_at', primitive)
        self.assertIn('updated_at', primitive)
    
    def test_create_primitive_invalid_type(self):
        """Test creating a primitive with an invalid type."""
        # Create invalid primitive
        invalid_primitive = self.test_primitive.copy()
        invalid_primitive['primitive_type'] = 'INVALID'
        
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(invalid_primitive)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Invalid primitive type: INVALID")
        self.assertIsNone(primitive_id)
    
    def test_get_primitive(self):
        """Test getting a governance primitive."""
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Get primitive
        primitive = self.primitive_manager.get_primitive(primitive_id)
        
        # Check result
        self.assertIsNotNone(primitive)
        self.assertEqual(primitive['name'], self.test_primitive['name'])
        self.assertEqual(primitive['description'], self.test_primitive['description'])
        self.assertEqual(primitive['primitive_type'], self.test_primitive['primitive_type'])
    
    def test_get_primitive_not_found(self):
        """Test getting a primitive that doesn't exist."""
        # Get non-existent primitive
        primitive = self.primitive_manager.get_primitive('prm-nonexistent')
        
        # Check result
        self.assertIsNone(primitive)
    
    def test_list_primitives(self):
        """Test listing governance primitives."""
        # Create primitives
        self.primitive_manager.create_primitive(self.test_primitive)
        
        # Create another primitive
        another_primitive = self.test_primitive.copy()
        another_primitive['name'] = 'Another Primitive'
        another_primitive['primitive_type'] = 'RULE'
        self.primitive_manager.create_primitive(another_primitive)
        
        # List primitives
        primitives = self.primitive_manager.list_primitives()
        
        # Check result
        self.assertEqual(len(primitives), 2)
    
    def test_list_primitives_with_filters(self):
        """Test listing primitives with filters."""
        # Create primitives
        self.primitive_manager.create_primitive(self.test_primitive)
        
        # Create another primitive
        another_primitive = self.test_primitive.copy()
        another_primitive['name'] = 'Another Primitive'
        another_primitive['primitive_type'] = 'RULE'
        self.primitive_manager.create_primitive(another_primitive)
        
        # List primitives with filter
        primitives = self.primitive_manager.list_primitives(primitive_type='CONSTRAINT')
        
        # Check result
        self.assertEqual(len(primitives), 1)
        self.assertEqual(primitives[0]['primitive_type'], 'CONSTRAINT')
    
    def test_update_primitive(self):
        """Test updating a governance primitive."""
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Update primitive
        updated_primitive = {
            'name': 'Updated Primitive',
            'description': 'An updated test primitive',
            'status': 'ACTIVE'
        }
        
        success, message = self.primitive_manager.update_primitive(primitive_id, updated_primitive)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Primitive updated successfully")
        
        # Check primitive was updated
        primitive = self.primitive_manager.get_primitive(primitive_id)
        self.assertEqual(primitive['name'], updated_primitive['name'])
        self.assertEqual(primitive['description'], updated_primitive['description'])
        self.assertEqual(primitive['status'], updated_primitive['status'])
        self.assertEqual(primitive['primitive_type'], self.test_primitive['primitive_type'])  # Unchanged
    
    def test_update_primitive_not_found(self):
        """Test updating a primitive that doesn't exist."""
        # Update non-existent primitive
        success, message = self.primitive_manager.update_primitive('prm-nonexistent', {})
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Primitive prm-nonexistent not found")
    
    def test_delete_primitive(self):
        """Test deleting a governance primitive."""
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Delete primitive
        success, message = self.primitive_manager.delete_primitive(primitive_id)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Primitive deleted successfully")
        
        # Check primitive was deleted
        self.assertNotIn(primitive_id, self.primitive_manager.primitives)
    
    def test_delete_primitive_not_found(self):
        """Test deleting a primitive that doesn't exist."""
        # Delete non-existent primitive
        success, message = self.primitive_manager.delete_primitive('prm-nonexistent')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Primitive prm-nonexistent not found")
    
    def test_activate_primitive(self):
        """Test activating a governance primitive."""
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Activate primitive
        success, message = self.primitive_manager.activate_primitive(primitive_id)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Primitive activated successfully")
        
        # Check primitive was activated
        primitive = self.primitive_manager.get_primitive(primitive_id)
        self.assertEqual(primitive['status'], 'ACTIVE')
    
    def test_activate_primitive_already_active(self):
        """Test activating a primitive that is already active."""
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Activate primitive
        self.primitive_manager.activate_primitive(primitive_id)
        
        # Activate again
        success, message = self.primitive_manager.activate_primitive(primitive_id)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, f"Primitive {primitive_id} is already active")
    
    def test_activate_primitive_not_found(self):
        """Test activating a primitive that doesn't exist."""
        # Activate non-existent primitive
        success, message = self.primitive_manager.activate_primitive('prm-nonexistent')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Primitive prm-nonexistent not found")
    
    def test_deprecate_primitive(self):
        """Test deprecating a governance primitive."""
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Activate primitive
        self.primitive_manager.activate_primitive(primitive_id)
        
        # Deprecate primitive
        success, message = self.primitive_manager.deprecate_primitive(primitive_id)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Primitive deprecated successfully")
        
        # Check primitive was deprecated
        primitive = self.primitive_manager.get_primitive(primitive_id)
        self.assertEqual(primitive['status'], 'DEPRECATED')
    
    def test_deprecate_primitive_already_deprecated(self):
        """Test deprecating a primitive that is already deprecated."""
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Activate primitive
        self.primitive_manager.activate_primitive(primitive_id)
        
        # Deprecate primitive
        self.primitive_manager.deprecate_primitive(primitive_id)
        
        # Deprecate again
        success, message = self.primitive_manager.deprecate_primitive(primitive_id)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, f"Primitive {primitive_id} is already deprecated")
    
    def test_deprecate_primitive_not_active(self):
        """Test deprecating a primitive that is not active."""
        # Create primitive (DRAFT by default)
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Deprecate primitive
        success, message = self.primitive_manager.deprecate_primitive(primitive_id)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, f"Cannot deprecate primitive {primitive_id} with status DRAFT")
    
    def test_deprecate_primitive_not_found(self):
        """Test deprecating a primitive that doesn't exist."""
        # Deprecate non-existent primitive
        success, message = self.primitive_manager.deprecate_primitive('prm-nonexistent')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Primitive prm-nonexistent not found")
    
    def test_evaluate_primitive(self):
        """Test evaluating an entity against a primitive."""
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Activate primitive
        self.primitive_manager.activate_primitive(primitive_id)
        
        # Mock _evaluate_condition_rule to return True
        with patch.object(self.primitive_manager, '_evaluate_condition_rule', return_value=True):
            # Evaluate entity
            compliant, message, rule_results = self.primitive_manager.evaluate_primitive(
                primitive_id, 'entity-1', 'SYSTEM', {}
            )
            
            # Check result
            self.assertTrue(compliant)
            self.assertEqual(message, "Entity is compliant with primitive")
            self.assertEqual(len(rule_results), 1)
            self.assertTrue(rule_results[0]['compliant'])
            self.assertEqual(rule_results[0]['rule_id'], 'rule-1')
    
    def test_evaluate_primitive_not_compliant(self):
        """Test evaluating an entity that is not compliant with a primitive."""
        # Create primitive
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Activate primitive
        self.primitive_manager.activate_primitive(primitive_id)
        
        # Mock _evaluate_condition_rule to return False
        with patch.object(self.primitive_manager, '_evaluate_condition_rule', return_value=False):
            # Evaluate entity
            compliant, message, rule_results = self.primitive_manager.evaluate_primitive(
                primitive_id, 'entity-1', 'SYSTEM', {}
            )
            
            # Check result
            self.assertFalse(compliant)
            self.assertEqual(message, "Entity is not compliant with primitive")
            self.assertEqual(len(rule_results), 1)
            self.assertFalse(rule_results[0]['compliant'])
            self.assertEqual(rule_results[0]['rule_id'], 'rule-1')
    
    def test_evaluate_primitive_not_found(self):
        """Test evaluating an entity against a primitive that doesn't exist."""
        # Evaluate entity against non-existent primitive
        compliant, message, rule_results = self.primitive_manager.evaluate_primitive(
            'prm-nonexistent', 'entity-1', 'SYSTEM', {}
        )
        
        # Check result
        self.assertFalse(compliant)
        self.assertEqual(message, "Primitive prm-nonexistent not found")
        self.assertEqual(len(rule_results), 0)
    
    def test_evaluate_primitive_not_active(self):
        """Test evaluating an entity against a primitive that is not active."""
        # Create primitive (DRAFT by default)
        success, message, primitive_id = self.primitive_manager.create_primitive(self.test_primitive)
        
        # Evaluate entity
        compliant, message, rule_results = self.primitive_manager.evaluate_primitive(
            primitive_id, 'entity-1', 'SYSTEM', {}
        )
        
        # Check result
        self.assertFalse(compliant)
        self.assertEqual(message, f"Primitive {primitive_id} is not active")
        self.assertEqual(len(rule_results), 0)
    
    def test_validate_primitive(self):
        """Test validating a governance primitive."""
        # Validate primitive
        success, message, validation_results = self.primitive_manager.validate_primitive(self.test_primitive)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Primitive is valid")
        self.assertEqual(len(validation_results), 3)
        self.assertTrue(validation_results[0]['valid'])
        self.assertTrue(validation_results[1]['valid'])
        self.assertTrue(validation_results[2]['valid'])
    
    def test_validate_primitive_invalid_type(self):
        """Test validating a primitive with an invalid type."""
        # Create invalid primitive
        invalid_primitive = self.test_primitive.copy()
        invalid_primitive['primitive_type'] = 'INVALID'
        
        # Validate primitive
        success, message, validation_results = self.primitive_manager.validate_primitive(invalid_primitive)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Invalid primitive type: INVALID")
        self.assertEqual(len(validation_results), 2)
        self.assertTrue(validation_results[0]['valid'])
        self.assertFalse(validation_results[1]['valid'])
    
    def test_validate_primitive_no_rules(self):
        """Test validating a primitive with no rules."""
        # Create invalid primitive
        invalid_primitive = self.test_primitive.copy()
        invalid_primitive['rules'] = []
        
        # Validate primitive
        success, message, validation_results = self.primitive_manager.validate_primitive(invalid_primitive)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Primitive must have at least one rule")
        self.assertEqual(len(validation_results), 3)
        self.assertTrue(validation_results[0]['valid'])
        self.assertTrue(validation_results[1]['valid'])
        self.assertFalse(validation_results[2]['valid'])

if __name__ == '__main__':
    unittest.main()
