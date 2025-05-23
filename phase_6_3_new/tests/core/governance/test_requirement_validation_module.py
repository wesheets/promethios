"""
Unit tests for the RequirementValidationModule class.

This module contains unit tests for the RequirementValidationModule class.
"""

import os
import json
import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from src.core.governance.requirement_validation_module import RequirementValidationModule

class TestRequirementValidationModule(unittest.TestCase):
    """Test cases for the RequirementValidationModule class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create mock dependencies
        self.mock_codex_lock = MagicMock()
        self.mock_codex_lock.verify_tether.return_value = True
        self.mock_codex_lock.verify_operation_tether.return_value = True
        
        self.mock_decision_framework = MagicMock()
        self.mock_attestation_service = MagicMock()
        self.mock_trust_metrics_calculator = MagicMock()
        self.mock_governance_primitive_manager = MagicMock()
        
        # Create test config
        self.test_config = {
            'storage_dir': os.path.join('test_data', 'governance', 'requirements'),
            'schema_path': os.path.join('schemas', 'governance', 'governance_requirement.schema.v1.json')
        }
        
        # Create test directories
        os.makedirs(os.path.join('test_data', 'governance', 'requirements', 'requirements'), exist_ok=True)
        os.makedirs(os.path.join('test_data', 'governance', 'requirements', 'validations'), exist_ok=True)
        os.makedirs(os.path.join('test_data', 'governance', 'requirements', 'events'), exist_ok=True)
        
        # Create module
        self.requirement_module = RequirementValidationModule(
            self.test_config,
            self.mock_codex_lock,
            self.mock_decision_framework,
            self.mock_attestation_service,
            self.mock_trust_metrics_calculator,
            self.mock_governance_primitive_manager
        )
        
        # Mock schema validator
        self.requirement_module.schema_validator = MagicMock()
        
        # Add test requirement
        self.test_requirement = {
            'name': 'Test Requirement',
            'description': 'A test requirement',
            'requirement_type': 'SECURITY',
            'criticality': 'HIGH',
            'validation_criteria': [
                {
                    'criterion_id': 'crit-1',
                    'criterion_type': 'CONDITION',
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
        """Test initialization of RequirementValidationModule."""
        self.assertEqual(self.requirement_module.config, self.test_config)
        self.assertEqual(self.requirement_module.codex_lock, self.mock_codex_lock)
        self.assertEqual(self.requirement_module.decision_framework, self.mock_decision_framework)
        self.assertEqual(self.requirement_module.attestation_service, self.mock_attestation_service)
        self.assertEqual(self.requirement_module.trust_metrics_calculator, self.mock_trust_metrics_calculator)
        self.assertEqual(self.requirement_module.governance_primitive_manager, self.mock_governance_primitive_manager)
        self.assertEqual(self.requirement_module.storage_dir, os.path.join('test_data', 'governance', 'requirements'))
        self.assertEqual(len(self.requirement_module.requirements), 0)
        self.assertEqual(len(self.requirement_module.validations), 0)
    
    def test_create_requirement(self):
        """Test creating a governance requirement."""
        # Create requirement
        success, message, requirement_id = self.requirement_module.create_requirement(self.test_requirement)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Requirement created successfully")
        self.assertIsNotNone(requirement_id)
        self.assertTrue(requirement_id.startswith('req-'))
        
        # Check requirement was saved
        self.assertIn(requirement_id, self.requirement_module.requirements)
        requirement = self.requirement_module.requirements[requirement_id]
        self.assertEqual(requirement['name'], self.test_requirement['name'])
        self.assertEqual(requirement['description'], self.test_requirement['description'])
        self.assertEqual(requirement['requirement_type'], self.test_requirement['requirement_type'])
        self.assertEqual(requirement['criticality'], self.test_requirement['criticality'])
        self.assertEqual(requirement['status'], 'DRAFT')
        self.assertIn('created_at', requirement)
        self.assertIn('updated_at', requirement)
    
    def test_create_requirement_invalid_type(self):
        """Test creating a requirement with an invalid type."""
        # Create invalid requirement
        invalid_requirement = self.test_requirement.copy()
        invalid_requirement['requirement_type'] = 'INVALID'
        
        # Create requirement
        success, message, requirement_id = self.requirement_module.create_requirement(invalid_requirement)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Invalid requirement type: INVALID")
        self.assertIsNone(requirement_id)
    
    def test_get_requirement(self):
        """Test getting a governance requirement."""
        # Create requirement
        success, message, requirement_id = self.requirement_module.create_requirement(self.test_requirement)
        
        # Get requirement
        requirement = self.requirement_module.get_requirement(requirement_id)
        
        # Check result
        self.assertIsNotNone(requirement)
        self.assertEqual(requirement['name'], self.test_requirement['name'])
        self.assertEqual(requirement['description'], self.test_requirement['description'])
        self.assertEqual(requirement['requirement_type'], self.test_requirement['requirement_type'])
    
    def test_get_requirement_not_found(self):
        """Test getting a requirement that doesn't exist."""
        # Get non-existent requirement
        requirement = self.requirement_module.get_requirement('req-nonexistent')
        
        # Check result
        self.assertIsNone(requirement)
    
    def test_list_requirements(self):
        """Test listing governance requirements."""
        # Create requirements
        self.requirement_module.create_requirement(self.test_requirement)
        
        # Create another requirement
        another_requirement = self.test_requirement.copy()
        another_requirement['name'] = 'Another Requirement'
        another_requirement['requirement_type'] = 'COMPLIANCE'
        self.requirement_module.create_requirement(another_requirement)
        
        # List requirements
        requirements = self.requirement_module.list_requirements()
        
        # Check result
        self.assertEqual(len(requirements), 2)
    
    def test_list_requirements_with_filters(self):
        """Test listing requirements with filters."""
        # Create requirements
        self.requirement_module.create_requirement(self.test_requirement)
        
        # Create another requirement
        another_requirement = self.test_requirement.copy()
        another_requirement['name'] = 'Another Requirement'
        another_requirement['requirement_type'] = 'COMPLIANCE'
        self.requirement_module.create_requirement(another_requirement)
        
        # List requirements with filter
        requirements = self.requirement_module.list_requirements(requirement_type='SECURITY')
        
        # Check result
        self.assertEqual(len(requirements), 1)
        self.assertEqual(requirements[0]['requirement_type'], 'SECURITY')
    
    def test_update_requirement(self):
        """Test updating a governance requirement."""
        # Create requirement
        success, message, requirement_id = self.requirement_module.create_requirement(self.test_requirement)
        
        # Update requirement
        updated_requirement = {
            'name': 'Updated Requirement',
            'description': 'An updated test requirement',
            'status': 'ACTIVE'
        }
        
        success, message = self.requirement_module.update_requirement(requirement_id, updated_requirement)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Requirement updated successfully")
        
        # Check requirement was updated
        requirement = self.requirement_module.get_requirement(requirement_id)
        self.assertEqual(requirement['name'], updated_requirement['name'])
        self.assertEqual(requirement['description'], updated_requirement['description'])
        self.assertEqual(requirement['status'], updated_requirement['status'])
        self.assertEqual(requirement['requirement_type'], self.test_requirement['requirement_type'])  # Unchanged
    
    def test_update_requirement_not_found(self):
        """Test updating a requirement that doesn't exist."""
        # Update non-existent requirement
        success, message = self.requirement_module.update_requirement('req-nonexistent', {})
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Requirement req-nonexistent not found")
    
    def test_delete_requirement(self):
        """Test deleting a governance requirement."""
        # Create requirement
        success, message, requirement_id = self.requirement_module.create_requirement(self.test_requirement)
        
        # Delete requirement
        success, message = self.requirement_module.delete_requirement(requirement_id)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Requirement deleted successfully")
        
        # Check requirement was deleted
        self.assertNotIn(requirement_id, self.requirement_module.requirements)
    
    def test_delete_requirement_not_found(self):
        """Test deleting a requirement that doesn't exist."""
        # Delete non-existent requirement
        success, message = self.requirement_module.delete_requirement('req-nonexistent')
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Requirement req-nonexistent not found")
    
    def test_validate_entity(self):
        """Test validating an entity against requirements."""
        # Create requirement
        success, message, requirement_id = self.requirement_module.create_requirement(self.test_requirement)
        
        # Update requirement to ACTIVE
        self.requirement_module.update_requirement(requirement_id, {'status': 'ACTIVE'})
        
        # Mock _evaluate_condition_criterion to return True
        with patch.object(self.requirement_module, '_evaluate_condition_criterion', return_value=True):
            # Validate entity
            success, message, validation_id, results = self.requirement_module.validate_entity('entity-1', 'SYSTEM', {})
            
            # Check result
            self.assertTrue(success)
            self.assertEqual(message, "Entity validation completed successfully")
            self.assertIsNotNone(validation_id)
            self.assertTrue(validation_id.startswith('val-'))
            self.assertEqual(len(results), 1)
            self.assertTrue(results[0]['valid'])
            self.assertEqual(results[0]['requirement_id'], requirement_id)
    
    def test_validate_entity_failure(self):
        """Test validating an entity with validation failures."""
        # Create requirement
        success, message, requirement_id = self.requirement_module.create_requirement(self.test_requirement)
        
        # Update requirement to ACTIVE
        self.requirement_module.update_requirement(requirement_id, {'status': 'ACTIVE'})
        
        # Mock _evaluate_condition_criterion to return False
        with patch.object(self.requirement_module, '_evaluate_condition_criterion', return_value=False):
            # Validate entity
            success, message, validation_id, results = self.requirement_module.validate_entity('entity-1', 'SYSTEM', {})
            
            # Check result
            self.assertFalse(success)
            self.assertEqual(message, "Entity validation failed")
            self.assertIsNotNone(validation_id)
            self.assertTrue(validation_id.startswith('val-'))
            self.assertEqual(len(results), 1)
            self.assertFalse(results[0]['valid'])
            self.assertEqual(results[0]['requirement_id'], requirement_id)
    
    def test_get_validation(self):
        """Test getting a validation result."""
        # Create requirement
        success, message, requirement_id = self.requirement_module.create_requirement(self.test_requirement)
        
        # Update requirement to ACTIVE
        self.requirement_module.update_requirement(requirement_id, {'status': 'ACTIVE'})
        
        # Mock _evaluate_condition_criterion to return True
        with patch.object(self.requirement_module, '_evaluate_condition_criterion', return_value=True):
            # Validate entity
            success, message, validation_id, results = self.requirement_module.validate_entity('entity-1', 'SYSTEM', {})
            
            # Get validation
            validation = self.requirement_module.get_validation(validation_id)
            
            # Check result
            self.assertIsNotNone(validation)
            self.assertEqual(validation['entity_id'], 'entity-1')
            self.assertEqual(validation['entity_type'], 'SYSTEM')
            self.assertEqual(validation['valid'], True)
            self.assertEqual(len(validation['results']), 1)
    
    def test_get_validation_not_found(self):
        """Test getting a validation that doesn't exist."""
        # Get non-existent validation
        validation = self.requirement_module.get_validation('val-nonexistent')
        
        # Check result
        self.assertIsNone(validation)
    
    def test_list_validations(self):
        """Test listing validation results."""
        # Create requirement
        success, message, requirement_id = self.requirement_module.create_requirement(self.test_requirement)
        
        # Update requirement to ACTIVE
        self.requirement_module.update_requirement(requirement_id, {'status': 'ACTIVE'})
        
        # Mock _evaluate_condition_criterion to return True
        with patch.object(self.requirement_module, '_evaluate_condition_criterion', return_value=True):
            # Validate entity
            self.requirement_module.validate_entity('entity-1', 'SYSTEM', {})
            self.requirement_module.validate_entity('entity-2', 'SYSTEM', {})
            
            # List validations
            validations = self.requirement_module.list_validations()
            
            # Check result
            self.assertEqual(len(validations), 2)
    
    def test_list_validations_with_filters(self):
        """Test listing validations with filters."""
        # Create requirement
        success, message, requirement_id = self.requirement_module.create_requirement(self.test_requirement)
        
        # Update requirement to ACTIVE
        self.requirement_module.update_requirement(requirement_id, {'status': 'ACTIVE'})
        
        # Mock _evaluate_condition_criterion to return True
        with patch.object(self.requirement_module, '_evaluate_condition_criterion', return_value=True):
            # Validate entities
            self.requirement_module.validate_entity('entity-1', 'SYSTEM', {})
            self.requirement_module.validate_entity('entity-2', 'APPLICATION', {})
            
            # List validations with filter
            validations = self.requirement_module.list_validations(entity_type='SYSTEM')
            
            # Check result
            self.assertEqual(len(validations), 1)
            self.assertEqual(validations[0]['entity_type'], 'SYSTEM')
    
    def test_validate_requirement(self):
        """Test validating a requirement."""
        # Validate requirement
        success, message, validation_results = self.requirement_module.validate_requirement(self.test_requirement)
        
        # Check result
        self.assertTrue(success)
        self.assertEqual(message, "Requirement is valid")
        self.assertEqual(len(validation_results), 4)  # Four validation results
        self.assertTrue(validation_results[0]['valid'])
        self.assertTrue(validation_results[1]['valid'])
        self.assertTrue(validation_results[2]['valid'])
        self.assertTrue(validation_results[3]['valid'])
    
    def test_validate_requirement_invalid_type(self):
        """Test validating a requirement with an invalid type."""
        # Create invalid requirement
        invalid_requirement = self.test_requirement.copy()
        invalid_requirement['requirement_type'] = 'INVALID'
        
        # Validate requirement
        success, message, validation_results = self.requirement_module.validate_requirement(invalid_requirement)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Invalid requirement type: INVALID")
        self.assertEqual(len(validation_results), 2)
        self.assertTrue(validation_results[0]['valid'])
        self.assertFalse(validation_results[1]['valid'])
    
    def test_validate_requirement_no_criteria(self):
        """Test validating a requirement with no validation criteria."""
        # Create invalid requirement
        invalid_requirement = self.test_requirement.copy()
        invalid_requirement['validation_criteria'] = []
        
        # Validate requirement
        success, message, validation_results = self.requirement_module.validate_requirement(invalid_requirement)
        
        # Check result
        self.assertFalse(success)
        self.assertEqual(message, "Requirement must have at least one validation criterion")
        self.assertEqual(len(validation_results), 4)
        self.assertTrue(validation_results[0]['valid'])
        self.assertTrue(validation_results[1]['valid'])
        self.assertTrue(validation_results[2]['valid'])
        self.assertFalse(validation_results[3]['valid'])

if __name__ == '__main__':
    unittest.main()
