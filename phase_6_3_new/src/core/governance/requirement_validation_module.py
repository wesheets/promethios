"""
Requirement Validation Module for the Minimal Viable Governance framework.

This module provides functionality for creating, managing, and validating governance requirements.
"""

import os
import json
import uuid
import time
import hashlib
import logging
import datetime
import jsonschema
from typing import Dict, List, Tuple, Set, Any, Optional, Callable

class RequirementValidationModule:
    """
    Requirement Validation Module for the Minimal Viable Governance framework.
    
    This class provides functionality for creating, managing, and validating governance requirements.
    """
    
    # Codex contract constants
    CODEX_CONTRACT_ID = "governance.requirement_validation"
    CODEX_CONTRACT_VERSION = "v1.0.0"
    
    # Valid requirement types
    VALID_REQUIREMENT_TYPES = ['SECURITY', 'COMPLIANCE', 'OPERATIONAL', 'ETHICAL', 'LEGAL']
    
    # Valid requirement statuses
    VALID_STATUSES = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED']
    
    # Valid criticality levels
    VALID_CRITICALITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    
    def __init__(self, config: Dict[str, Any], codex_lock: Any, decision_framework: Any, 
                 attestation_service: Any, trust_metrics_calculator: Any, governance_primitive_manager: Any):
        """
        Initialize the RequirementValidationModule.
        
        Args:
            config: Configuration dictionary for the module
            codex_lock: Reference to the CodexLock instance
            decision_framework: Reference to the DecisionFrameworkEngine instance
            attestation_service: Reference to the AttestationService instance
            trust_metrics_calculator: Reference to the TrustMetricsCalculator instance
            governance_primitive_manager: Reference to the GovernancePrimitiveManager instance
        """
        self.config = config
        self.codex_lock = codex_lock
        self.decision_framework = decision_framework
        self.attestation_service = attestation_service
        self.trust_metrics_calculator = trust_metrics_calculator
        self.governance_primitive_manager = governance_primitive_manager
        
        # Verify tether to Codex contract
        if not self.codex_lock.verify_tether(self.CODEX_CONTRACT_ID, self.CODEX_CONTRACT_VERSION):
            raise ValueError(f"Failed to verify tether to Codex contract {self.CODEX_CONTRACT_ID}")
        
        # Initialize storage
        self.storage_dir = self.config.get('storage_dir', os.path.join('data', 'governance', 'requirements'))
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Initialize schema validator
        schema_path = self.config.get('schema_path', os.path.join('schemas', 'governance', 'governance_requirement.schema.v1.json'))
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)
        
        # Load existing requirements and validations
        self.requirements = {}
        self.validations = {}
        self._load_requirements()
        self._load_validations()
        
        # Initialize event handlers
        self.event_handlers = {
            'REQUIREMENT_CREATED': [],
            'REQUIREMENT_UPDATED': [],
            'REQUIREMENT_DELETED': [],
            'VALIDATION_COMPLETED': [],
            'VALIDATION_FAILED': []
        }
        
        logging.info(f"RequirementValidationModule initialized with {len(self.requirements)} requirements and {len(self.validations)} validations")
    
    def _load_requirements(self):
        """Load existing requirements from storage."""
        requirements_dir = os.path.join(self.storage_dir, 'requirements')
        if not os.path.exists(requirements_dir):
            os.makedirs(requirements_dir, exist_ok=True)
            return
        
        for filename in os.listdir(requirements_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(requirements_dir, filename), 'r') as f:
                        requirement = json.load(f)
                    
                    requirement_id = requirement.get('requirement_id')
                    
                    if requirement_id:
                        self.requirements[requirement_id] = requirement
                except Exception as e:
                    logging.error(f"Error loading requirement from {filename}: {str(e)}")
    
    def _load_validations(self):
        """Load existing validations from storage."""
        validations_dir = os.path.join(self.storage_dir, 'validations')
        if not os.path.exists(validations_dir):
            os.makedirs(validations_dir, exist_ok=True)
            return
        
        for filename in os.listdir(validations_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(validations_dir, filename), 'r') as f:
                        validation = json.load(f)
                    
                    validation_id = validation.get('validation_id')
                    
                    if validation_id:
                        self.validations[validation_id] = validation
                except Exception as e:
                    logging.error(f"Error loading validation from {filename}: {str(e)}")
    
    def _save_requirement(self, requirement: Dict[str, Any]):
        """
        Save a requirement to storage.
        
        Args:
            requirement: The requirement to save
        """
        requirement_id = requirement.get('requirement_id')
        
        if not requirement_id:
            raise ValueError("Requirement must have requirement_id")
        
        filename = f"{requirement_id}.json"
        filepath = os.path.join(self.storage_dir, 'requirements', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(requirement, f, indent=2)
    
    def _save_validation(self, validation: Dict[str, Any]):
        """
        Save a validation to storage.
        
        Args:
            validation: The validation to save
        """
        validation_id = validation.get('validation_id')
        
        if not validation_id:
            raise ValueError("Validation must have validation_id")
        
        filename = f"{validation_id}.json"
        filepath = os.path.join(self.storage_dir, 'validations', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(validation, f, indent=2)
    
    def _generate_requirement_id(self):
        """Generate a unique requirement ID."""
        return f"req-{uuid.uuid4()}"
    
    def _generate_validation_id(self):
        """Generate a unique validation ID."""
        return f"val-{uuid.uuid4()}"
    
    def schema_validator(self, data, schema):
        """
        Validate data against a JSON schema.
        
        Args:
            data: The data to validate
            schema: The schema to validate against
            
        Raises:
            jsonschema.exceptions.ValidationError: If validation fails
        """
        jsonschema.validate(data, schema)
    
    def create_requirement(self, requirement: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        """
        Create a new governance requirement.
        
        Args:
            requirement: The requirement to create
            
        Returns:
            A tuple of (success, message, requirement_id)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "create_requirement"):
            return False, "Operation tether verification failed", None
        
        # Validate requirement against schema
        try:
            self.schema_validator(requirement, self.schema)
        except Exception as e:
            return False, f"Requirement validation failed: {str(e)}", None
        
        # Validate requirement type
        requirement_type = requirement.get('requirement_type')
        if requirement_type not in self.VALID_REQUIREMENT_TYPES:
            return False, f"Invalid requirement type: {requirement_type}", None
        
        # Validate criticality
        criticality = requirement.get('criticality')
        if criticality not in self.VALID_CRITICALITY_LEVELS:
            return False, f"Invalid criticality level: {criticality}", None
        
        # Generate requirement ID
        requirement_id = self._generate_requirement_id()
        
        # Add metadata
        requirement['requirement_id'] = requirement_id
        requirement['created_at'] = datetime.datetime.utcnow().isoformat()
        requirement['updated_at'] = requirement['created_at']
        requirement['status'] = requirement.get('status', 'DRAFT')
        
        # Save requirement
        self.requirements[requirement_id] = requirement
        
        try:
            self._save_requirement(requirement)
        except Exception as e:
            return False, f"Failed to save requirement: {str(e)}", None
        
        # Record event
        self.record_governance_event(
            event_type="REQUIREMENT_CREATED",
            entity_id=requirement_id,
            entity_type="GOVERNANCE_REQUIREMENT",
            data={
                'requirement_id': requirement_id,
                'name': requirement.get('name'),
                'requirement_type': requirement_type,
                'criticality': criticality
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('REQUIREMENT_CREATED', []):
            try:
                handler({
                    'requirement_id': requirement_id,
                    'name': requirement.get('name'),
                    'requirement_type': requirement_type,
                    'criticality': criticality
                })
            except Exception as e:
                logging.error(f"Error in REQUIREMENT_CREATED event handler: {str(e)}")
        
        return True, "Requirement created successfully", requirement_id
    
    def get_requirement(self, requirement_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a governance requirement.
        
        Args:
            requirement_id: The ID of the requirement to get
            
        Returns:
            The requirement, or None if not found
        """
        return self.requirements.get(requirement_id)
    
    def list_requirements(self, status: Optional[str] = None, requirement_type: Optional[str] = None,
                         criticality: Optional[str] = None, limit: Optional[int] = None,
                         offset: Optional[int] = 0) -> List[Dict[str, Any]]:
        """
        List governance requirements.
        
        Args:
            status: Filter by status
            requirement_type: Filter by requirement type
            criticality: Filter by criticality level
            limit: Maximum number of requirements to return
            offset: Number of requirements to skip
            
        Returns:
            A list of requirements
        """
        requirements = list(self.requirements.values())
        
        # Apply filters
        if status:
            requirements = [r for r in requirements if r.get('status') == status]
        
        if requirement_type:
            requirements = [r for r in requirements if r.get('requirement_type') == requirement_type]
        
        if criticality:
            requirements = [r for r in requirements if r.get('criticality') == criticality]
        
        # Sort by updated_at (newest first)
        requirements.sort(key=lambda r: r.get('updated_at', ''), reverse=True)
        
        # Apply pagination
        if offset:
            requirements = requirements[offset:]
        
        if limit:
            requirements = requirements[:limit]
        
        return requirements
    
    def update_requirement(self, requirement_id: str, updated_requirement: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Update a governance requirement.
        
        Args:
            requirement_id: The ID of the requirement to update
            updated_requirement: The updated requirement
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "update_requirement"):
            return False, "Operation tether verification failed"
        
        # Check if requirement exists
        if requirement_id not in self.requirements:
            return False, f"Requirement {requirement_id} not found"
        
        # Get current requirement
        current_requirement = self.requirements[requirement_id]
        
        # Validate updated requirement against schema
        try:
            self.schema_validator(updated_requirement, self.schema)
        except Exception as e:
            return False, f"Requirement validation failed: {str(e)}"
        
        # Validate requirement type
        requirement_type = updated_requirement.get('requirement_type')
        if requirement_type and requirement_type not in self.VALID_REQUIREMENT_TYPES:
            return False, f"Invalid requirement type: {requirement_type}"
        
        # Validate criticality
        criticality = updated_requirement.get('criticality')
        if criticality and criticality not in self.VALID_CRITICALITY_LEVELS:
            return False, f"Invalid criticality level: {criticality}"
        
        # Validate status
        status = updated_requirement.get('status')
        if status and status not in self.VALID_STATUSES:
            return False, f"Invalid status: {status}"
        
        # Merge current requirement with updates
        merged_requirement = current_requirement.copy()
        for key, value in updated_requirement.items():
            if key not in ['requirement_id', 'created_at']:
                merged_requirement[key] = value
        
        # Update metadata
        merged_requirement['updated_at'] = datetime.datetime.utcnow().isoformat()
        
        # Save requirement
        self.requirements[requirement_id] = merged_requirement
        
        try:
            self._save_requirement(merged_requirement)
        except Exception as e:
            return False, f"Failed to save requirement: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="REQUIREMENT_UPDATED",
            entity_id=requirement_id,
            entity_type="GOVERNANCE_REQUIREMENT",
            data={
                'requirement_id': requirement_id,
                'name': merged_requirement.get('name'),
                'requirement_type': merged_requirement.get('requirement_type'),
                'criticality': merged_requirement.get('criticality'),
                'status': merged_requirement.get('status')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('REQUIREMENT_UPDATED', []):
            try:
                handler({
                    'requirement_id': requirement_id,
                    'name': merged_requirement.get('name'),
                    'requirement_type': merged_requirement.get('requirement_type'),
                    'criticality': merged_requirement.get('criticality'),
                    'status': merged_requirement.get('status')
                })
            except Exception as e:
                logging.error(f"Error in REQUIREMENT_UPDATED event handler: {str(e)}")
        
        return True, "Requirement updated successfully"
    
    def delete_requirement(self, requirement_id: str) -> Tuple[bool, str]:
        """
        Delete a governance requirement.
        
        Args:
            requirement_id: The ID of the requirement to delete
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "delete_requirement"):
            return False, "Operation tether verification failed"
        
        # Check if requirement exists
        if requirement_id not in self.requirements:
            return False, f"Requirement {requirement_id} not found"
        
        # Get requirement
        requirement = self.requirements[requirement_id]
        
        # Remove requirement
        del self.requirements[requirement_id]
        
        # Remove from storage
        filename = f"{requirement_id}.json"
        filepath = os.path.join(self.storage_dir, 'requirements', filename)
        
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                return False, f"Failed to delete requirement file: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="REQUIREMENT_DELETED",
            entity_id=requirement_id,
            entity_type="GOVERNANCE_REQUIREMENT",
            data={
                'requirement_id': requirement_id,
                'name': requirement.get('name'),
                'requirement_type': requirement.get('requirement_type')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('REQUIREMENT_DELETED', []):
            try:
                handler({
                    'requirement_id': requirement_id,
                    'name': requirement.get('name'),
                    'requirement_type': requirement.get('requirement_type')
                })
            except Exception as e:
                logging.error(f"Error in REQUIREMENT_DELETED event handler: {str(e)}")
        
        return True, "Requirement deleted successfully"
    
    def validate_entity(self, entity_id: str, entity_type: str, context: Dict[str, Any]) -> Tuple[bool, str, str, List[Dict[str, Any]]]:
        """
        Validate an entity against all applicable requirements.
        
        Args:
            entity_id: The ID of the entity to validate
            entity_type: The type of the entity
            context: Additional context for validation
            
        Returns:
            A tuple of (success, message, validation_id, results)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "validate_entity"):
            return False, "Operation tether verification failed", None, []
        
        # Get active requirements
        active_requirements = self.list_requirements(status='ACTIVE')
        
        # Filter requirements by entity type
        applicable_requirements = []
        for requirement in active_requirements:
            entity_types = requirement.get('applicable_entity_types', [])
            if not entity_types or entity_type in entity_types:
                applicable_requirements.append(requirement)
        
        # Validate against each requirement
        validation_results = []
        all_valid = True
        
        for requirement in applicable_requirements:
            requirement_id = requirement.get('requirement_id')
            requirement_name = requirement.get('name')
            criticality = requirement.get('criticality')
            
            # Evaluate validation criteria
            criteria = requirement.get('validation_criteria', [])
            criteria_results = []
            requirement_valid = True
            
            for criterion in criteria:
                criterion_id = criterion.get('criterion_id')
                criterion_type = criterion.get('criterion_type')
                criterion_definition = criterion.get('definition')
                
                # Evaluate criterion based on type
                if criterion_type == 'SCRIPT':
                    # Execute script criterion
                    try:
                        result = self._evaluate_script_criterion(criterion_definition, entity_id, entity_type, context)
                        criteria_results.append({
                            'criterion_id': criterion_id,
                            'valid': result,
                            'details': f"Script criterion {'passed' if result else 'failed'}"
                        })
                        
                        if not result:
                            requirement_valid = False
                    except Exception as e:
                        logging.error(f"Error evaluating script criterion {criterion_id}: {str(e)}")
                        criteria_results.append({
                            'criterion_id': criterion_id,
                            'valid': False,
                            'details': f"Error evaluating criterion: {str(e)}"
                        })
                        requirement_valid = False
                
                elif criterion_type == 'CONDITION':
                    # Evaluate condition criterion
                    try:
                        result = self._evaluate_condition_criterion(criterion_definition, entity_id, entity_type, context)
                        criteria_results.append({
                            'criterion_id': criterion_id,
                            'valid': result,
                            'details': f"Condition criterion {'passed' if result else 'failed'}"
                        })
                        
                        if not result:
                            requirement_valid = False
                    except Exception as e:
                        logging.error(f"Error evaluating condition criterion {criterion_id}: {str(e)}")
                        criteria_results.append({
                            'criterion_id': criterion_id,
                            'valid': False,
                            'details': f"Error evaluating criterion: {str(e)}"
                        })
                        requirement_valid = False
                
                elif criterion_type == 'ATTESTATION':
                    # Evaluate attestation criterion
                    try:
                        result = self._evaluate_attestation_criterion(criterion_definition, entity_id, entity_type, context)
                        criteria_results.append({
                            'criterion_id': criterion_id,
                            'valid': result,
                            'details': f"Attestation criterion {'passed' if result else 'failed'}"
                        })
                        
                        if not result:
                            requirement_valid = False
                    except Exception as e:
                        logging.error(f"Error evaluating attestation criterion {criterion_id}: {str(e)}")
                        criteria_results.append({
                            'criterion_id': criterion_id,
                            'valid': False,
                            'details': f"Error evaluating criterion: {str(e)}"
                        })
                        requirement_valid = False
            
            # Add requirement result
            validation_results.append({
                'requirement_id': requirement_id,
                'requirement_name': requirement_name,
                'criticality': criticality,
                'valid': requirement_valid,
                'criteria_results': criteria_results
            })
            
            if not requirement_valid:
                all_valid = False
        
        # Generate validation ID
        validation_id = self._generate_validation_id()
        
        # Create validation record
        validation = {
            'validation_id': validation_id,
            'entity_id': entity_id,
            'entity_type': entity_type,
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'valid': all_valid,
            'results': validation_results
        }
        
        # Save validation
        self.validations[validation_id] = validation
        
        try:
            self._save_validation(validation)
        except Exception as e:
            return False, f"Failed to save validation: {str(e)}", validation_id, validation_results
        
        # Record event
        event_type = "VALIDATION_COMPLETED" if all_valid else "VALIDATION_FAILED"
        self.record_governance_event(
            event_type=event_type,
            entity_id=entity_id,
            entity_type=entity_type,
            data={
                'validation_id': validation_id,
                'valid': all_valid,
                'result_count': len(validation_results)
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get(event_type, []):
            try:
                handler({
                    'validation_id': validation_id,
                    'entity_id': entity_id,
                    'entity_type': entity_type,
                    'valid': all_valid,
                    'result_count': len(validation_results)
                })
            except Exception as e:
                logging.error(f"Error in {event_type} event handler: {str(e)}")
        
        message = "Entity validation completed successfully" if all_valid else "Entity validation failed"
        return all_valid, message, validation_id, validation_results
    
    def _evaluate_script_criterion(self, criterion_definition: Dict[str, Any], entity_id: str, entity_type: str, context: Dict[str, Any]) -> bool:
        """
        Evaluate a script criterion.
        
        Args:
            criterion_definition: The criterion definition
            entity_id: The ID of the entity to validate
            entity_type: The type of the entity
            context: Additional context for validation
            
        Returns:
            True if the entity passes the criterion, False otherwise
        """
        script = criterion_definition.get('script')
        if not script:
            return True
        
        # Create a safe execution environment
        locals_dict = {
            'entity_id': entity_id,
            'entity_type': entity_type,
            'context': context,
            'result': True
        }
        
        # Execute script
        try:
            exec(script, {'__builtins__': {}}, locals_dict)
            return locals_dict.get('result', True)
        except Exception as e:
            logging.error(f"Error executing script criterion: {str(e)}")
            return False
    
    def _evaluate_condition_criterion(self, criterion_definition: Dict[str, Any], entity_id: str, entity_type: str, context: Dict[str, Any]) -> bool:
        """
        Evaluate a condition criterion.
        
        Args:
            criterion_definition: The criterion definition
            entity_id: The ID of the entity to validate
            entity_type: The type of the entity
            context: Additional context for validation
            
        Returns:
            True if the entity passes the criterion, False otherwise
        """
        condition_type = criterion_definition.get('condition_type')
        condition_value = criterion_definition.get('condition_value')
        
        if not condition_type or not condition_value:
            return True
        
        if condition_type == 'ENTITY_PROPERTY':
            # Check if entity has a property with a specific value
            property_name = condition_value.get('property_name')
            expected_value = condition_value.get('expected_value')
            
            if not property_name or expected_value is None:
                return True
            
            actual_value = context.get(property_name)
            return actual_value == expected_value
        
        elif condition_type == 'CONTEXT_PROPERTY':
            # Check if context has a property with a specific value
            property_name = condition_value.get('property_name')
            expected_value = condition_value.get('expected_value')
            
            if not property_name or expected_value is None:
                return True
            
            actual_value = context.get(property_name)
            return actual_value == expected_value
        
        elif condition_type == 'TRUST_LEVEL':
            # Check if entity has a minimum trust level
            min_trust_level = condition_value.get('min_trust_level')
            
            if min_trust_level is None:
                return True
            
            # Get trust level from trust metrics calculator
            trust_level = self.trust_metrics_calculator.get_entity_trust_level(entity_id, entity_type)
            return trust_level >= min_trust_level
        
        return True
    
    def _evaluate_attestation_criterion(self, criterion_definition: Dict[str, Any], entity_id: str, entity_type: str, context: Dict[str, Any]) -> bool:
        """
        Evaluate an attestation criterion.
        
        Args:
            criterion_definition: The criterion definition
            entity_id: The ID of the entity to validate
            entity_type: The type of the entity
            context: Additional context for validation
            
        Returns:
            True if the entity passes the criterion, False otherwise
        """
        attestation_type = criterion_definition.get('attestation_type')
        attestation_value = criterion_definition.get('attestation_value')
        
        if not attestation_type or not attestation_value:
            return True
        
        if attestation_type == 'REQUIRED_ATTESTATION':
            # Check if entity has a required attestation
            attestation_id = attestation_value.get('attestation_id')
            
            if not attestation_id:
                return True
            
            # Check if attestation exists
            return self.attestation_service.has_valid_attestation(entity_id, entity_type, attestation_id)
        
        elif attestation_type == 'AUTHORITY_LEVEL':
            # Check if entity has an attestation from an authority with a minimum level
            min_authority_level = attestation_value.get('min_authority_level')
            
            if min_authority_level is None:
                return True
            
            # Check if attestation exists
            return self.attestation_service.has_authority_attestation(entity_id, entity_type, min_authority_level)
        
        return True
    
    def get_validation(self, validation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a validation result.
        
        Args:
            validation_id: The ID of the validation to get
            
        Returns:
            The validation, or None if not found
        """
        return self.validations.get(validation_id)
    
    def list_validations(self, entity_id: Optional[str] = None, entity_type: Optional[str] = None,
                        valid: Optional[bool] = None, limit: Optional[int] = None,
                        offset: Optional[int] = 0) -> List[Dict[str, Any]]:
        """
        List validation results.
        
        Args:
            entity_id: Filter by entity ID
            entity_type: Filter by entity type
            valid: Filter by validation result
            limit: Maximum number of validations to return
            offset: Number of validations to skip
            
        Returns:
            A list of validations
        """
        validations = list(self.validations.values())
        
        # Apply filters
        if entity_id:
            validations = [v for v in validations if v.get('entity_id') == entity_id]
        
        if entity_type:
            validations = [v for v in validations if v.get('entity_type') == entity_type]
        
        if valid is not None:
            validations = [v for v in validations if v.get('valid') == valid]
        
        # Sort by timestamp (newest first)
        validations.sort(key=lambda v: v.get('timestamp', ''), reverse=True)
        
        # Apply pagination
        if offset:
            validations = validations[offset:]
        
        if limit:
            validations = validations[:limit]
        
        return validations
    
    def record_governance_event(self, event_type: str, entity_id: str, entity_type: str,
                              data: Dict[str, Any]) -> bool:
        """
        Record a governance event.
        
        Args:
            event_type: The type of event
            entity_id: The ID of the entity
            entity_type: The type of the entity
            data: Event data
            
        Returns:
            True if the event was recorded successfully, False otherwise
        """
        # Create event
        event = {
            'event_id': f"evt-{uuid.uuid4()}",
            'event_type': event_type,
            'entity_id': entity_id,
            'entity_type': entity_type,
            'data': data,
            'timestamp': datetime.datetime.utcnow().isoformat()
        }
        
        # Save event
        events_dir = os.path.join(self.storage_dir, 'events')
        os.makedirs(events_dir, exist_ok=True)
        
        filename = f"{event['event_id']}.json"
        filepath = os.path.join(events_dir, filename)
        
        try:
            with open(filepath, 'w') as f:
                json.dump(event, f, indent=2)
            return True
        except Exception as e:
            logging.error(f"Failed to save governance event: {str(e)}")
            return False
    
    def register_event_handler(self, event_type: str, handler: Callable):
        """
        Register an event handler.
        
        Args:
            event_type: The type of event to handle
            handler: The handler function
        """
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        
        self.event_handlers[event_type].append(handler)
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get the status of the requirement validation module.
        
        Returns:
            A dictionary with status information
        """
        # Count requirements
        requirement_count = len(self.requirements)
        
        # Count requirements by type
        requirement_types = {}
        for requirement in self.requirements.values():
            requirement_type = requirement.get('requirement_type', 'UNKNOWN')
            requirement_types[requirement_type] = requirement_types.get(requirement_type, 0) + 1
        
        # Count requirements by status
        requirement_statuses = {}
        for requirement in self.requirements.values():
            status = requirement.get('status', 'UNKNOWN')
            requirement_statuses[status] = requirement_statuses.get(status, 0) + 1
        
        # Count validations
        validation_count = len(self.validations)
        
        # Count validations by result
        validation_results = {
            'VALID': 0,
            'INVALID': 0
        }
        
        for validation in self.validations.values():
            if validation.get('valid', False):
                validation_results['VALID'] += 1
            else:
                validation_results['INVALID'] += 1
        
        return {
            'status': 'HEALTHY',
            'requirement_count': requirement_count,
            'requirement_types': requirement_types,
            'requirement_statuses': requirement_statuses,
            'validation_count': validation_count,
            'validation_results': validation_results,
            'contract_id': self.CODEX_CONTRACT_ID,
            'contract_version': self.CODEX_CONTRACT_VERSION
        }
    
    def validate_requirement(self, requirement: Dict[str, Any]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Validate a requirement against the schema and business rules.
        
        Args:
            requirement: The requirement to validate
            
        Returns:
            A tuple of (success, message, validation_results)
        """
        validation_results = []
        
        # Validate against schema
        try:
            self.schema_validator(requirement, self.schema)
            validation_results.append({
                'rule': 'SCHEMA_VALIDATION',
                'valid': True,
                'message': 'Requirement is valid against schema'
            })
        except Exception as e:
            validation_results.append({
                'rule': 'SCHEMA_VALIDATION',
                'valid': False,
                'message': f'Schema validation failed: {str(e)}'
            })
            return False, f"Requirement validation failed: {str(e)}", validation_results
        
        # Validate requirement type
        requirement_type = requirement.get('requirement_type')
        if requirement_type not in self.VALID_REQUIREMENT_TYPES:
            validation_results.append({
                'rule': 'REQUIREMENT_TYPE',
                'valid': False,
                'message': f'Invalid requirement type: {requirement_type}'
            })
            return False, f"Invalid requirement type: {requirement_type}", validation_results
        else:
            validation_results.append({
                'rule': 'REQUIREMENT_TYPE',
                'valid': True,
                'message': f'Valid requirement type: {requirement_type}'
            })
        
        # Validate criticality
        criticality = requirement.get('criticality')
        if criticality not in self.VALID_CRITICALITY_LEVELS:
            validation_results.append({
                'rule': 'CRITICALITY',
                'valid': False,
                'message': f'Invalid criticality level: {criticality}'
            })
            return False, f"Invalid criticality level: {criticality}", validation_results
        else:
            validation_results.append({
                'rule': 'CRITICALITY',
                'valid': True,
                'message': f'Valid criticality level: {criticality}'
            })
        
        # Validate validation criteria
        criteria = requirement.get('validation_criteria', [])
        if not criteria:
            validation_results.append({
                'rule': 'VALIDATION_CRITERIA',
                'valid': False,
                'message': 'Requirement must have at least one validation criterion'
            })
            return False, "Requirement must have at least one validation criterion", validation_results
        else:
            validation_results.append({
                'rule': 'VALIDATION_CRITERIA',
                'valid': True,
                'message': f'Requirement has {len(criteria)} validation criteria'
            })
        
        return True, "Requirement is valid", validation_results
