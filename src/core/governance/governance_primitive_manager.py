"""
Governance Primitive Manager for the Minimal Viable Governance framework.

This module provides functionality for creating, managing, and validating governance primitives.
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

class GovernancePrimitiveManager:
    """
    Governance Primitive Manager for the Minimal Viable Governance framework.
    
    This class provides functionality for creating, managing, and validating governance primitives.
    """
    
    # Codex contract constants
    CODEX_CONTRACT_ID = "governance.primitive_manager"
    CODEX_CONTRACT_VERSION = "v1.0.0"
    
    # Valid primitive types
    VALID_PRIMITIVE_TYPES = ['CONSTRAINT', 'RULE', 'DIRECTIVE', 'CONTROL', 'STANDARD']
    
    # Valid primitive statuses
    VALID_STATUSES = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED']
    
    def __init__(self, config: Dict[str, Any], codex_lock: Any, decision_framework: Any, 
                 attestation_service: Any, trust_metrics_calculator: Any):
        """
        Initialize the GovernancePrimitiveManager.
        
        Args:
            config: Configuration dictionary for the module
            codex_lock: Reference to the CodexLock instance
            decision_framework: Reference to the DecisionFrameworkEngine instance
            attestation_service: Reference to the AttestationService instance
            trust_metrics_calculator: Reference to the TrustMetricsCalculator instance
        """
        self.config = config
        self.codex_lock = codex_lock
        self.decision_framework = decision_framework
        self.attestation_service = attestation_service
        self.trust_metrics_calculator = trust_metrics_calculator
        
        # Verify tether to Codex contract
        if not self.codex_lock.verify_tether(self.CODEX_CONTRACT_ID, self.CODEX_CONTRACT_VERSION):
            raise ValueError(f"Failed to verify tether to Codex contract {self.CODEX_CONTRACT_ID}")
        
        # Initialize storage
        self.storage_dir = self.config.get('storage_dir', os.path.join('data', 'governance', 'primitives'))
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Initialize schema validator
        schema_path = self.config.get('schema_path', os.path.join('schemas', 'governance', 'governance_primitive.schema.v1.json'))
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)
        
        # Load existing primitives
        self.primitives = {}
        self._load_primitives()
        
        # Initialize event handlers
        self.event_handlers = {
            'PRIMITIVE_CREATED': [],
            'PRIMITIVE_UPDATED': [],
            'PRIMITIVE_DELETED': [],
            'PRIMITIVE_ACTIVATED': [],
            'PRIMITIVE_DEPRECATED': []
        }
        
        logging.info(f"GovernancePrimitiveManager initialized with {len(self.primitives)} primitives")
    
    def _load_primitives(self):
        """Load existing primitives from storage."""
        primitives_dir = os.path.join(self.storage_dir, 'primitives')
        if not os.path.exists(primitives_dir):
            os.makedirs(primitives_dir, exist_ok=True)
            return
        
        for filename in os.listdir(primitives_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(primitives_dir, filename), 'r') as f:
                        primitive = json.load(f)
                    
                    primitive_id = primitive.get('primitive_id')
                    
                    if primitive_id:
                        self.primitives[primitive_id] = primitive
                except Exception as e:
                    logging.error(f"Error loading primitive from {filename}: {str(e)}")
    
    def _save_primitive(self, primitive: Dict[str, Any]):
        """
        Save a primitive to storage.
        
        Args:
            primitive: The primitive to save
        """
        primitive_id = primitive.get('primitive_id')
        
        if not primitive_id:
            raise ValueError("Primitive must have primitive_id")
        
        filename = f"{primitive_id}.json"
        filepath = os.path.join(self.storage_dir, 'primitives', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(primitive, f, indent=2)
    
    def _generate_primitive_id(self):
        """Generate a unique primitive ID."""
        return f"prm-{uuid.uuid4()}"
    
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
    
    def create_primitive(self, primitive: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        """
        Create a new governance primitive.
        
        Args:
            primitive: The primitive to create
            
        Returns:
            A tuple of (success, message, primitive_id)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "create_primitive"):
            return False, "Operation tether verification failed", None
        
        # Validate primitive against schema
        try:
            # Add primitive_id for schema validation
            primitive_copy = primitive.copy()
            primitive_copy['primitive_id'] = self._generate_primitive_id()
            self.schema_validator(primitive_copy, self.schema)
        except Exception as e:
            return False, f"Primitive validation failed: {str(e)}", None
        
        # Validate primitive type
        primitive_type = primitive.get('primitive_type')
        if primitive_type not in self.VALID_PRIMITIVE_TYPES:
            return False, f"Invalid primitive type: {primitive_type}", None
        
        # Generate primitive ID
        primitive_id = primitive_copy['primitive_id']
        
        # Add metadata
        primitive['primitive_id'] = primitive_id
        primitive['created_at'] = datetime.datetime.utcnow().isoformat()
        primitive['updated_at'] = primitive['created_at']
        primitive['status'] = primitive.get('status', 'DRAFT')
        
        # Save primitive
        self.primitives[primitive_id] = primitive
        
        try:
            self._save_primitive(primitive)
        except Exception as e:
            return False, f"Failed to save primitive: {str(e)}", None
        
        # Record event
        self.record_governance_event(
            event_type="PRIMITIVE_CREATED",
            entity_id=primitive_id,
            entity_type="GOVERNANCE_PRIMITIVE",
            data={
                'primitive_id': primitive_id,
                'name': primitive.get('name'),
                'primitive_type': primitive_type
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('PRIMITIVE_CREATED', []):
            try:
                handler({
                    'primitive_id': primitive_id,
                    'name': primitive.get('name'),
                    'primitive_type': primitive_type
                })
            except Exception as e:
                logging.error(f"Error in PRIMITIVE_CREATED event handler: {str(e)}")
        
        return True, "Primitive created successfully", primitive_id
    
    def get_primitive(self, primitive_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a governance primitive.
        
        Args:
            primitive_id: The ID of the primitive to get
            
        Returns:
            The primitive, or None if not found
        """
        return self.primitives.get(primitive_id)
    
    def list_primitives(self, status: Optional[str] = None, primitive_type: Optional[str] = None,
                       limit: Optional[int] = None, offset: Optional[int] = 0) -> List[Dict[str, Any]]:
        """
        List governance primitives.
        
        Args:
            status: Filter by status
            primitive_type: Filter by primitive type
            limit: Maximum number of primitives to return
            offset: Number of primitives to skip
            
        Returns:
            A list of primitives
        """
        primitives = list(self.primitives.values())
        
        # Apply filters
        if status:
            primitives = [p for p in primitives if p.get('status') == status]
        
        if primitive_type:
            primitives = [p for p in primitives if p.get('primitive_type') == primitive_type]
        
        # Sort by updated_at (newest first)
        primitives.sort(key=lambda p: p.get('updated_at', ''), reverse=True)
        
        # Apply pagination
        if offset:
            primitives = primitives[offset:]
        
        if limit:
            primitives = primitives[:limit]
        
        return primitives
    
    def update_primitive(self, primitive_id: str, updated_primitive: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Update a governance primitive.
        
        Args:
            primitive_id: The ID of the primitive to update
            updated_primitive: The updated primitive
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "update_primitive"):
            return False, "Operation tether verification failed"
        
        # Check if primitive exists
        if primitive_id not in self.primitives:
            return False, f"Primitive {primitive_id} not found"
        
        # Get current primitive
        current_primitive = self.primitives[primitive_id]
        
        # Validate updated primitive against schema
        try:
            # Create a merged primitive for validation
            merged_primitive = current_primitive.copy()
            for key, value in updated_primitive.items():
                if key not in ['primitive_id', 'created_at']:
                    merged_primitive[key] = value
            
            self.schema_validator(merged_primitive, self.schema)
        except Exception as e:
            return False, f"Primitive validation failed: {str(e)}"
        
        # Validate primitive type
        primitive_type = updated_primitive.get('primitive_type')
        if primitive_type and primitive_type not in self.VALID_PRIMITIVE_TYPES:
            return False, f"Invalid primitive type: {primitive_type}"
        
        # Validate status
        status = updated_primitive.get('status')
        if status and status not in self.VALID_STATUSES:
            return False, f"Invalid status: {status}"
        
        # Merge current primitive with updates
        merged_primitive = current_primitive.copy()
        for key, value in updated_primitive.items():
            if key not in ['primitive_id', 'created_at']:
                merged_primitive[key] = value
        
        # Update metadata
        merged_primitive['updated_at'] = datetime.datetime.utcnow().isoformat()
        
        # Save primitive
        self.primitives[primitive_id] = merged_primitive
        
        try:
            self._save_primitive(merged_primitive)
        except Exception as e:
            return False, f"Failed to save primitive: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="PRIMITIVE_UPDATED",
            entity_id=primitive_id,
            entity_type="GOVERNANCE_PRIMITIVE",
            data={
                'primitive_id': primitive_id,
                'name': merged_primitive.get('name'),
                'primitive_type': merged_primitive.get('primitive_type'),
                'status': merged_primitive.get('status')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('PRIMITIVE_UPDATED', []):
            try:
                handler({
                    'primitive_id': primitive_id,
                    'name': merged_primitive.get('name'),
                    'primitive_type': merged_primitive.get('primitive_type'),
                    'status': merged_primitive.get('status')
                })
            except Exception as e:
                logging.error(f"Error in PRIMITIVE_UPDATED event handler: {str(e)}")
        
        return True, "Primitive updated successfully"
    
    def delete_primitive(self, primitive_id: str) -> Tuple[bool, str]:
        """
        Delete a governance primitive.
        
        Args:
            primitive_id: The ID of the primitive to delete
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "delete_primitive"):
            return False, "Operation tether verification failed"
        
        # Check if primitive exists
        if primitive_id not in self.primitives:
            return False, f"Primitive {primitive_id} not found"
        
        # Get primitive
        primitive = self.primitives[primitive_id]
        
        # Check if primitive is active
        if primitive.get('status') == 'ACTIVE':
            return False, f"Cannot delete active primitive {primitive_id}"
        
        # Remove primitive
        del self.primitives[primitive_id]
        
        # Remove from storage
        filename = f"{primitive_id}.json"
        filepath = os.path.join(self.storage_dir, 'primitives', filename)
        
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                return False, f"Failed to delete primitive file: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="PRIMITIVE_DELETED",
            entity_id=primitive_id,
            entity_type="GOVERNANCE_PRIMITIVE",
            data={
                'primitive_id': primitive_id,
                'name': primitive.get('name'),
                'primitive_type': primitive.get('primitive_type')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('PRIMITIVE_DELETED', []):
            try:
                handler({
                    'primitive_id': primitive_id,
                    'name': primitive.get('name'),
                    'primitive_type': primitive.get('primitive_type')
                })
            except Exception as e:
                logging.error(f"Error in PRIMITIVE_DELETED event handler: {str(e)}")
        
        return True, "Primitive deleted successfully"
    
    def activate_primitive(self, primitive_id: str) -> Tuple[bool, str]:
        """
        Activate a governance primitive.
        
        Args:
            primitive_id: The ID of the primitive to activate
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "activate_primitive"):
            return False, "Operation tether verification failed"
        
        # Check if primitive exists
        if primitive_id not in self.primitives:
            return False, f"Primitive {primitive_id} not found"
        
        # Get primitive
        primitive = self.primitives[primitive_id]
        
        # Check if primitive is already active
        if primitive.get('status') == 'ACTIVE':
            return True, f"Primitive {primitive_id} is already active"
        
        # Check if primitive is in a valid state for activation
        if primitive.get('status') not in ['DRAFT', 'DEPRECATED']:
            return False, f"Cannot activate primitive {primitive_id} with status {primitive.get('status')}"
        
        # Update status
        primitive['status'] = 'ACTIVE'
        primitive['updated_at'] = datetime.datetime.utcnow().isoformat()
        
        # Save primitive
        self.primitives[primitive_id] = primitive
        
        try:
            self._save_primitive(primitive)
        except Exception as e:
            return False, f"Failed to save primitive: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="PRIMITIVE_ACTIVATED",
            entity_id=primitive_id,
            entity_type="GOVERNANCE_PRIMITIVE",
            data={
                'primitive_id': primitive_id,
                'name': primitive.get('name'),
                'primitive_type': primitive.get('primitive_type')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('PRIMITIVE_ACTIVATED', []):
            try:
                handler({
                    'primitive_id': primitive_id,
                    'name': primitive.get('name'),
                    'primitive_type': primitive.get('primitive_type')
                })
            except Exception as e:
                logging.error(f"Error in PRIMITIVE_ACTIVATED event handler: {str(e)}")
        
        return True, "Primitive activated successfully"
    
    def deprecate_primitive(self, primitive_id: str) -> Tuple[bool, str]:
        """
        Deprecate a governance primitive.
        
        Args:
            primitive_id: The ID of the primitive to deprecate
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "deprecate_primitive"):
            return False, "Operation tether verification failed"
        
        # Check if primitive exists
        if primitive_id not in self.primitives:
            return False, f"Primitive {primitive_id} not found"
        
        # Get primitive
        primitive = self.primitives[primitive_id]
        
        # Check if primitive is already deprecated
        if primitive.get('status') == 'DEPRECATED':
            return True, f"Primitive {primitive_id} is already deprecated"
        
        # Check if primitive is in a valid state for deprecation
        if primitive.get('status') != 'ACTIVE':
            return False, f"Cannot deprecate primitive {primitive_id} with status {primitive.get('status')}"
        
        # Update status
        primitive['status'] = 'DEPRECATED'
        primitive['updated_at'] = datetime.datetime.utcnow().isoformat()
        
        # Save primitive
        self.primitives[primitive_id] = primitive
        
        try:
            self._save_primitive(primitive)
        except Exception as e:
            return False, f"Failed to save primitive: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="PRIMITIVE_DEPRECATED",
            entity_id=primitive_id,
            entity_type="GOVERNANCE_PRIMITIVE",
            data={
                'primitive_id': primitive_id,
                'name': primitive.get('name'),
                'primitive_type': primitive.get('primitive_type')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('PRIMITIVE_DEPRECATED', []):
            try:
                handler({
                    'primitive_id': primitive_id,
                    'name': primitive.get('name'),
                    'primitive_type': primitive.get('primitive_type')
                })
            except Exception as e:
                logging.error(f"Error in PRIMITIVE_DEPRECATED event handler: {str(e)}")
        
        return True, "Primitive deprecated successfully"
    
    def evaluate_primitive(self, primitive_id: str, entity_id: str, entity_type: str, context: Dict[str, Any]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Evaluate an entity against a primitive.
        
        Args:
            primitive_id: The ID of the primitive to evaluate
            entity_id: The ID of the entity to evaluate
            entity_type: The type of the entity
            context: Additional context for evaluation
            
        Returns:
            A tuple of (compliant, message, rule_results)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "evaluate_primitive"):
            return False, "Operation tether verification failed", []
        
        # Check if primitive exists
        if primitive_id not in self.primitives:
            return False, f"Primitive {primitive_id} not found", []
        
        # Get primitive
        primitive = self.primitives[primitive_id]
        
        # Check if primitive is active
        if primitive.get('status') != 'ACTIVE':
            return False, f"Primitive {primitive_id} is not active", []
        
        # Evaluate rules
        rules = primitive.get('rules', [])
        rule_results = []
        all_compliant = True
        
        for rule in rules:
            rule_id = rule.get('rule_id')
            rule_type = rule.get('rule_type')
            rule_definition = rule.get('definition')
            
            # Evaluate rule based on type
            if rule_type == 'SCRIPT':
                # Execute script rule
                try:
                    result = self._evaluate_script_rule(rule_definition, entity_id, entity_type, context)
                    rule_results.append({
                        'rule_id': rule_id,
                        'compliant': result,
                        'details': f"Script rule {'passed' if result else 'failed'}"
                    })
                    
                    if not result:
                        all_compliant = False
                except Exception as e:
                    logging.error(f"Error evaluating script rule {rule_id}: {str(e)}")
                    rule_results.append({
                        'rule_id': rule_id,
                        'compliant': False,
                        'details': f"Error evaluating rule: {str(e)}"
                    })
                    all_compliant = False
            
            elif rule_type == 'CONDITION':
                # Evaluate condition rule
                try:
                    result = self._evaluate_condition_rule(rule_definition, entity_id, entity_type, context)
                    rule_results.append({
                        'rule_id': rule_id,
                        'compliant': result,
                        'details': f"Condition rule {'passed' if result else 'failed'}"
                    })
                    
                    if not result:
                        all_compliant = False
                except Exception as e:
                    logging.error(f"Error evaluating condition rule {rule_id}: {str(e)}")
                    rule_results.append({
                        'rule_id': rule_id,
                        'compliant': False,
                        'details': f"Error evaluating rule: {str(e)}"
                    })
                    all_compliant = False
            
            elif rule_type == 'ATTESTATION':
                # Evaluate attestation rule
                try:
                    result = self._evaluate_attestation_rule(rule_definition, entity_id, entity_type, context)
                    rule_results.append({
                        'rule_id': rule_id,
                        'compliant': result,
                        'details': f"Attestation rule {'passed' if result else 'failed'}"
                    })
                    
                    if not result:
                        all_compliant = False
                except Exception as e:
                    logging.error(f"Error evaluating attestation rule {rule_id}: {str(e)}")
                    rule_results.append({
                        'rule_id': rule_id,
                        'compliant': False,
                        'details': f"Error evaluating rule: {str(e)}"
                    })
                    all_compliant = False
        
        message = "Entity is compliant with primitive" if all_compliant else "Entity is not compliant with primitive"
        return all_compliant, message, rule_results
    
    def _evaluate_script_rule(self, rule_definition: Dict[str, Any], entity_id: str, entity_type: str, context: Dict[str, Any]) -> bool:
        """
        Evaluate a script rule.
        
        Args:
            rule_definition: The rule definition
            entity_id: The ID of the entity to evaluate
            entity_type: The type of the entity
            context: Additional context for evaluation
            
        Returns:
            True if the entity is compliant with the rule, False otherwise
        """
        script = rule_definition.get('script')
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
            logging.error(f"Error executing script rule: {str(e)}")
            return False
    
    def _evaluate_condition_rule(self, rule_definition: Dict[str, Any], entity_id: str, entity_type: str, context: Dict[str, Any]) -> bool:
        """
        Evaluate a condition rule.
        
        Args:
            rule_definition: The rule definition
            entity_id: The ID of the entity to evaluate
            entity_type: The type of the entity
            context: Additional context for evaluation
            
        Returns:
            True if the entity is compliant with the rule, False otherwise
        """
        condition_type = rule_definition.get('condition_type')
        condition_value = rule_definition.get('condition_value')
        
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
    
    def _evaluate_attestation_rule(self, rule_definition: Dict[str, Any], entity_id: str, entity_type: str, context: Dict[str, Any]) -> bool:
        """
        Evaluate an attestation rule.
        
        Args:
            rule_definition: The rule definition
            entity_id: The ID of the entity to evaluate
            entity_type: The type of the entity
            context: Additional context for evaluation
            
        Returns:
            True if the entity is compliant with the rule, False otherwise
        """
        attestation_type = rule_definition.get('attestation_type')
        attestation_value = rule_definition.get('attestation_value')
        
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
        Get the status of the governance primitive manager.
        
        Returns:
            A dictionary with status information
        """
        # Count primitives
        primitive_count = len(self.primitives)
        
        # Count primitives by type
        primitive_types = {}
        for primitive in self.primitives.values():
            primitive_type = primitive.get('primitive_type', 'UNKNOWN')
            primitive_types[primitive_type] = primitive_types.get(primitive_type, 0) + 1
        
        # Count primitives by status
        primitive_statuses = {}
        for primitive in self.primitives.values():
            status = primitive.get('status', 'UNKNOWN')
            primitive_statuses[status] = primitive_statuses.get(status, 0) + 1
        
        return {
            'status': 'HEALTHY',
            'primitive_count': primitive_count,
            'primitive_types': primitive_types,
            'primitive_statuses': primitive_statuses,
            'contract_id': self.CODEX_CONTRACT_ID,
            'contract_version': self.CODEX_CONTRACT_VERSION
        }
    
    def validate_primitive(self, primitive: Dict[str, Any]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Validate a primitive against the schema and business rules.
        
        Args:
            primitive: The primitive to validate
            
        Returns:
            A tuple of (success, message, validation_results)
        """
        validation_results = []
        
        # Validate against schema
        try:
            # Add primitive_id for schema validation if not present
            primitive_copy = primitive.copy()
            if 'primitive_id' not in primitive_copy:
                primitive_copy['primitive_id'] = self._generate_primitive_id()
                
            self.schema_validator(primitive_copy, self.schema)
            validation_results.append({
                'rule': 'SCHEMA_VALIDATION',
                'valid': True,
                'message': 'Primitive is valid against schema'
            })
        except Exception as e:
            validation_results.append({
                'rule': 'SCHEMA_VALIDATION',
                'valid': False,
                'message': f'Schema validation failed: {str(e)}'
            })
            return False, f"Primitive validation failed: {str(e)}", validation_results
        
        # Validate primitive type
        primitive_type = primitive.get('primitive_type')
        if primitive_type not in self.VALID_PRIMITIVE_TYPES:
            validation_results.append({
                'rule': 'PRIMITIVE_TYPE',
                'valid': False,
                'message': f'Invalid primitive type: {primitive_type}'
            })
            return False, f"Invalid primitive type: {primitive_type}", validation_results
        else:
            validation_results.append({
                'rule': 'PRIMITIVE_TYPE',
                'valid': True,
                'message': f'Valid primitive type: {primitive_type}'
            })
        
        # Validate rules
        rules = primitive.get('rules', [])
        if not rules:
            validation_results.append({
                'rule': 'RULES',
                'valid': False,
                'message': 'Primitive must have at least one rule'
            })
            return False, "Primitive must have at least one rule", validation_results
        else:
            validation_results.append({
                'rule': 'RULES',
                'valid': True,
                'message': f'Primitive has {len(rules)} rules'
            })
        
        return True, "Primitive is valid", validation_results
