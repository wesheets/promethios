"""
Policy Management Module for the Minimal Viable Governance framework.

This module provides functionality for creating, managing, and validating governance policies.
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

class PolicyManagementModule:
    """
    Policy Management Module for the Minimal Viable Governance framework.
    
    This class provides functionality for creating, managing, and validating governance policies.
    """
    
    # Codex contract constants
    CODEX_CONTRACT_ID = "governance.policy_management"
    CODEX_CONTRACT_VERSION = "v1.0.0"
    
    # Valid policy types
    VALID_POLICY_TYPES = ['SECURITY', 'COMPLIANCE', 'OPERATIONAL', 'ETHICAL', 'LEGAL']
    
    # Valid policy statuses
    VALID_STATUSES = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED']
    
    # Valid exemption statuses
    VALID_EXEMPTION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']
    
    def __init__(self, config: Dict[str, Any], codex_lock: Any, decision_framework: Any, 
                 attestation_service: Any, trust_metrics_calculator: Any, requirement_validation: Any):
        """
        Initialize the PolicyManagementModule.
        
        Args:
            config: Configuration dictionary for the module
            codex_lock: Reference to the CodexLock instance
            decision_framework: Reference to the DecisionFrameworkEngine instance
            attestation_service: Reference to the AttestationService instance
            trust_metrics_calculator: Reference to the TrustMetricsCalculator instance
            requirement_validation: Reference to the RequirementValidationModule instance
        """
        self.config = config
        self.codex_lock = codex_lock
        self.decision_framework = decision_framework
        self.attestation_service = attestation_service
        self.trust_metrics_calculator = trust_metrics_calculator
        self.requirement_validation = requirement_validation
        
        # Verify tether to Codex contract
        if not self.codex_lock.verify_tether(self.CODEX_CONTRACT_ID, self.CODEX_CONTRACT_VERSION):
            raise ValueError(f"Failed to verify tether to Codex contract {self.CODEX_CONTRACT_ID}")
        
        # Initialize storage
        self.storage_dir = self.config.get('storage_dir', os.path.join('data', 'governance', 'policies'))
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Initialize schema validator
        schema_path = self.config.get('schema_path', os.path.join('schemas', 'governance', 'governance_policy.schema.v1.json'))
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)
        
        # Load existing policies and exemptions
        self.policies = {}
        self.exemptions = {}
        self.policy_exemptions = {}
        self._load_policies()
        self._load_exemptions()
        
        # Initialize event handlers
        self.event_handlers = {
            'POLICY_CREATED': [],
            'POLICY_UPDATED': [],
            'POLICY_DELETED': [],
            'EXEMPTION_CREATED': [],
            'EXEMPTION_UPDATED': [],
            'EXEMPTION_DELETED': [],
            'EXEMPTION_EXPIRED': []
        }
        
        logging.info(f"PolicyManagementModule initialized with {len(self.policies)} policies and {len(self.exemptions)} exemptions")
    
    def _load_policies(self):
        """Load existing policies from storage."""
        policies_dir = os.path.join(self.storage_dir, 'policies')
        if not os.path.exists(policies_dir):
            os.makedirs(policies_dir, exist_ok=True)
            return
        
        for filename in os.listdir(policies_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(policies_dir, filename), 'r') as f:
                        policy = json.load(f)
                    
                    policy_id = policy.get('policy_id')
                    
                    if policy_id:
                        self.policies[policy_id] = policy
                except Exception as e:
                    logging.error(f"Error loading policy from {filename}: {str(e)}")
    
    def _load_exemptions(self):
        """Load existing exemptions from storage."""
        exemptions_dir = os.path.join(self.storage_dir, 'exemptions')
        if not os.path.exists(exemptions_dir):
            os.makedirs(exemptions_dir, exist_ok=True)
            return
        
        for filename in os.listdir(exemptions_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(exemptions_dir, filename), 'r') as f:
                        exemption = json.load(f)
                    
                    exemption_id = exemption.get('exemption_id')
                    policy_id = exemption.get('policy_id')
                    
                    if exemption_id and policy_id:
                        self.exemptions[exemption_id] = exemption
                        
                        if policy_id not in self.policy_exemptions:
                            self.policy_exemptions[policy_id] = set()
                        
                        self.policy_exemptions[policy_id].add(exemption_id)
                except Exception as e:
                    logging.error(f"Error loading exemption from {filename}: {str(e)}")
    
    def _save_policy(self, policy: Dict[str, Any]):
        """
        Save a policy to storage.
        
        Args:
            policy: The policy to save
        """
        policy_id = policy.get('policy_id')
        
        if not policy_id:
            raise ValueError("Policy must have policy_id")
        
        filename = f"{policy_id}.json"
        filepath = os.path.join(self.storage_dir, 'policies', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(policy, f, indent=2)
    
    def _save_exemption(self, exemption: Dict[str, Any]):
        """
        Save an exemption to storage.
        
        Args:
            exemption: The exemption to save
        """
        exemption_id = exemption.get('exemption_id')
        
        if not exemption_id:
            raise ValueError("Exemption must have exemption_id")
        
        filename = f"{exemption_id}.json"
        filepath = os.path.join(self.storage_dir, 'exemptions', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(exemption, f, indent=2)
    
    def _generate_policy_id(self):
        """Generate a unique policy ID."""
        return f"pol-{uuid.uuid4()}"
    
    def _generate_exemption_id(self):
        """Generate a unique exemption ID."""
        return f"exm-{uuid.uuid4()}"
    
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
    
    def create_policy(self, policy: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        """
        Create a new governance policy.
        
        Args:
            policy: The policy to create
            
        Returns:
            A tuple of (success, message, policy_id)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "create_policy"):
            return False, "Operation tether verification failed", None
        
        # Validate policy against schema
        try:
            # Add policy_id for schema validation
            policy_copy = policy.copy()
            policy_copy['policy_id'] = self._generate_policy_id()
            self.schema_validator(policy_copy, self.schema)
        except Exception as e:
            return False, f"Policy validation failed: {str(e)}", None
        
        # Validate policy type
        policy_type = policy.get('policy_type')
        if policy_type not in self.VALID_POLICY_TYPES:
            return False, f"Invalid policy type: {policy_type}", None
        
        # Generate policy ID
        policy_id = policy_copy['policy_id']
        
        # Add metadata
        policy['policy_id'] = policy_id
        policy['created_at'] = datetime.datetime.utcnow().isoformat()
        policy['updated_at'] = policy['created_at']
        policy['status'] = policy.get('status', 'DRAFT')
        
        # Save policy
        self.policies[policy_id] = policy
        
        try:
            self._save_policy(policy)
        except Exception as e:
            return False, f"Failed to save policy: {str(e)}", None
        
        # Record event
        self.record_governance_event(
            event_type="POLICY_CREATED",
            entity_id=policy_id,
            entity_type="GOVERNANCE_POLICY",
            data={
                'policy_id': policy_id,
                'name': policy.get('name'),
                'policy_type': policy_type
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('POLICY_CREATED', []):
            try:
                handler({
                    'policy_id': policy_id,
                    'name': policy.get('name'),
                    'policy_type': policy_type
                })
            except Exception as e:
                logging.error(f"Error in POLICY_CREATED event handler: {str(e)}")
        
        return True, "Policy created successfully", policy_id
    
    def get_policy(self, policy_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a governance policy.
        
        Args:
            policy_id: The ID of the policy to get
            
        Returns:
            The policy, or None if not found
        """
        return self.policies.get(policy_id)
    
    def list_policies(self, status: Optional[str] = None, policy_type: Optional[str] = None,
                     limit: Optional[int] = None, offset: Optional[int] = 0) -> List[Dict[str, Any]]:
        """
        List governance policies.
        
        Args:
            status: Filter by status
            policy_type: Filter by policy type
            limit: Maximum number of policies to return
            offset: Number of policies to skip
            
        Returns:
            A list of policies
        """
        policies = list(self.policies.values())
        
        # Apply filters
        if status:
            policies = [p for p in policies if p.get('status') == status]
        
        if policy_type:
            policies = [p for p in policies if p.get('policy_type') == policy_type]
        
        # Sort by updated_at (newest first)
        policies.sort(key=lambda p: p.get('updated_at', ''), reverse=True)
        
        # Apply pagination
        if offset:
            policies = policies[offset:]
        
        if limit:
            policies = policies[:limit]
        
        return policies
    
    def update_policy(self, policy_id: str, updated_policy: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Update a governance policy.
        
        Args:
            policy_id: The ID of the policy to update
            updated_policy: The updated policy
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "update_policy"):
            return False, "Operation tether verification failed"
        
        # Check if policy exists
        if policy_id not in self.policies:
            return False, f"Policy {policy_id} not found"
        
        # Get current policy
        current_policy = self.policies[policy_id]
        
        # Validate updated policy against schema
        try:
            # Create a merged policy for validation
            merged_policy = current_policy.copy()
            for key, value in updated_policy.items():
                if key not in ['policy_id', 'created_at']:
                    merged_policy[key] = value
            
            self.schema_validator(merged_policy, self.schema)
        except Exception as e:
            return False, f"Policy validation failed: {str(e)}"
        
        # Validate policy type
        policy_type = updated_policy.get('policy_type')
        if policy_type and policy_type not in self.VALID_POLICY_TYPES:
            return False, f"Invalid policy type: {policy_type}"
        
        # Validate status
        status = updated_policy.get('status')
        if status and status not in self.VALID_STATUSES:
            return False, f"Invalid status: {status}"
        
        # Merge current policy with updates
        merged_policy = current_policy.copy()
        for key, value in updated_policy.items():
            if key not in ['policy_id', 'created_at']:
                merged_policy[key] = value
        
        # Update metadata
        merged_policy['updated_at'] = datetime.datetime.utcnow().isoformat()
        
        # Save policy
        self.policies[policy_id] = merged_policy
        
        try:
            self._save_policy(merged_policy)
        except Exception as e:
            return False, f"Failed to save policy: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="POLICY_UPDATED",
            entity_id=policy_id,
            entity_type="GOVERNANCE_POLICY",
            data={
                'policy_id': policy_id,
                'name': merged_policy.get('name'),
                'policy_type': merged_policy.get('policy_type'),
                'status': merged_policy.get('status')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('POLICY_UPDATED', []):
            try:
                handler({
                    'policy_id': policy_id,
                    'name': merged_policy.get('name'),
                    'policy_type': merged_policy.get('policy_type'),
                    'status': merged_policy.get('status')
                })
            except Exception as e:
                logging.error(f"Error in POLICY_UPDATED event handler: {str(e)}")
        
        return True, "Policy updated successfully"
    
    def delete_policy(self, policy_id: str) -> Tuple[bool, str]:
        """
        Delete a governance policy.
        
        Args:
            policy_id: The ID of the policy to delete
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "delete_policy"):
            return False, "Operation tether verification failed"
        
        # Check if policy exists
        if policy_id not in self.policies:
            return False, f"Policy {policy_id} not found"
        
        # Get policy
        policy = self.policies[policy_id]
        
        # Check if policy has exemptions
        if policy_id in self.policy_exemptions and self.policy_exemptions[policy_id]:
            return False, f"Policy {policy_id} has active exemptions and cannot be deleted"
        
        # Remove policy
        del self.policies[policy_id]
        
        # Remove from storage
        filename = f"{policy_id}.json"
        filepath = os.path.join(self.storage_dir, 'policies', filename)
        
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                return False, f"Failed to delete policy file: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="POLICY_DELETED",
            entity_id=policy_id,
            entity_type="GOVERNANCE_POLICY",
            data={
                'policy_id': policy_id,
                'name': policy.get('name'),
                'policy_type': policy.get('policy_type')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('POLICY_DELETED', []):
            try:
                handler({
                    'policy_id': policy_id,
                    'name': policy.get('name'),
                    'policy_type': policy.get('policy_type')
                })
            except Exception as e:
                logging.error(f"Error in POLICY_DELETED event handler: {str(e)}")
        
        return True, "Policy deleted successfully"
    
    def create_exemption(self, exemption: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        """
        Create a new policy exemption.
        
        Args:
            exemption: The exemption to create
            
        Returns:
            A tuple of (success, message, exemption_id)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "create_exemption"):
            return False, "Operation tether verification failed", None
        
        # Validate required fields
        policy_id = exemption.get('policy_id')
        if not policy_id:
            return False, "Exemption must have policy_id", None
        
        requester = exemption.get('requester')
        if not requester:
            return False, "Exemption must have requester", None
        
        justification = exemption.get('justification')
        if not justification:
            return False, "Exemption must have justification", None
        
        entity_id = exemption.get('entity_id')
        if not entity_id:
            return False, "Exemption must have entity_id", None
        
        entity_type = exemption.get('entity_type')
        if not entity_type:
            return False, "Exemption must have entity_type", None
        
        # Check if policy exists
        if policy_id not in self.policies:
            return False, f"Policy {policy_id} not found", None
        
        # Check if policy is active
        policy = self.policies[policy_id]
        if policy.get('status') != 'ACTIVE':
            return False, f"Policy {policy_id} is not active", None
        
        # Generate exemption ID
        exemption_id = self._generate_exemption_id()
        
        # Add metadata
        exemption['exemption_id'] = exemption_id
        exemption['created_at'] = datetime.datetime.utcnow().isoformat()
        exemption['updated_at'] = exemption['created_at']
        exemption['status'] = exemption.get('status', 'PENDING')
        
        # Set expiration date (default: 30 days)
        duration_days = exemption.get('duration_days', 30)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=duration_days)
        exemption['expires_at'] = expires_at.isoformat()
        
        # Save exemption
        self.exemptions[exemption_id] = exemption
        
        # Add to policy exemptions
        if policy_id not in self.policy_exemptions:
            self.policy_exemptions[policy_id] = set()
        
        self.policy_exemptions[policy_id].add(exemption_id)
        
        try:
            self._save_exemption(exemption)
        except Exception as e:
            return False, f"Failed to save exemption: {str(e)}", None
        
        # Record event
        self.record_governance_event(
            event_type="EXEMPTION_CREATED",
            entity_id=exemption_id,
            entity_type="POLICY_EXEMPTION",
            data={
                'exemption_id': exemption_id,
                'policy_id': policy_id,
                'requester': requester,
                'entity_id': entity_id,
                'entity_type': entity_type,
                'status': exemption['status'],
                'expires_at': exemption['expires_at']
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('EXEMPTION_CREATED', []):
            try:
                handler({
                    'exemption_id': exemption_id,
                    'policy_id': policy_id,
                    'requester': requester,
                    'entity_id': entity_id,
                    'entity_type': entity_type,
                    'status': exemption['status'],
                    'expires_at': exemption['expires_at']
                })
            except Exception as e:
                logging.error(f"Error in EXEMPTION_CREATED event handler: {str(e)}")
        
        return True, "Exemption created successfully", exemption_id
    
    def get_exemption(self, exemption_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a policy exemption.
        
        Args:
            exemption_id: The ID of the exemption to get
            
        Returns:
            The exemption, or None if not found
        """
        return self.exemptions.get(exemption_id)
    
    def list_exemptions(self, policy_id: Optional[str] = None, entity_id: Optional[str] = None,
                       entity_type: Optional[str] = None, requester: Optional[str] = None,
                       status: Optional[str] = None, limit: Optional[int] = None,
                       offset: Optional[int] = 0) -> List[Dict[str, Any]]:
        """
        List policy exemptions.
        
        Args:
            policy_id: Filter by policy ID
            entity_id: Filter by entity ID
            entity_type: Filter by entity type
            requester: Filter by requester
            status: Filter by status
            limit: Maximum number of exemptions to return
            offset: Number of exemptions to skip
            
        Returns:
            A list of exemptions
        """
        exemptions = list(self.exemptions.values())
        
        # Apply filters
        if policy_id:
            exemptions = [e for e in exemptions if e.get('policy_id') == policy_id]
        
        if entity_id:
            exemptions = [e for e in exemptions if e.get('entity_id') == entity_id]
        
        if entity_type:
            exemptions = [e for e in exemptions if e.get('entity_type') == entity_type]
        
        if requester:
            exemptions = [e for e in exemptions if e.get('requester') == requester]
        
        if status:
            exemptions = [e for e in exemptions if e.get('status') == status]
        
        # Sort by updated_at (newest first)
        exemptions.sort(key=lambda e: e.get('updated_at', ''), reverse=True)
        
        # Apply pagination
        if offset:
            exemptions = exemptions[offset:]
        
        if limit:
            exemptions = exemptions[:limit]
        
        return exemptions
    
    def update_exemption(self, exemption_id: str, updated_exemption: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Update a policy exemption.
        
        Args:
            exemption_id: The ID of the exemption to update
            updated_exemption: The updated exemption
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "update_exemption"):
            return False, "Operation tether verification failed"
        
        # Check if exemption exists
        if exemption_id not in self.exemptions:
            return False, f"Exemption {exemption_id} not found"
        
        # Get current exemption
        current_exemption = self.exemptions[exemption_id]
        
        # Validate status
        status = updated_exemption.get('status')
        if status and status not in self.VALID_EXEMPTION_STATUSES:
            return False, f"Invalid status: {status}"
        
        # Merge current exemption with updates
        merged_exemption = current_exemption.copy()
        for key, value in updated_exemption.items():
            if key not in ['exemption_id', 'policy_id', 'created_at']:
                merged_exemption[key] = value
        
        # Update metadata
        merged_exemption['updated_at'] = datetime.datetime.utcnow().isoformat()
        
        # Save exemption
        self.exemptions[exemption_id] = merged_exemption
        
        try:
            self._save_exemption(merged_exemption)
        except Exception as e:
            return False, f"Failed to save exemption: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="EXEMPTION_UPDATED",
            entity_id=exemption_id,
            entity_type="POLICY_EXEMPTION",
            data={
                'exemption_id': exemption_id,
                'policy_id': merged_exemption.get('policy_id'),
                'status': merged_exemption.get('status'),
                'expires_at': merged_exemption.get('expires_at')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('EXEMPTION_UPDATED', []):
            try:
                handler({
                    'exemption_id': exemption_id,
                    'policy_id': merged_exemption.get('policy_id'),
                    'status': merged_exemption.get('status'),
                    'expires_at': merged_exemption.get('expires_at')
                })
            except Exception as e:
                logging.error(f"Error in EXEMPTION_UPDATED event handler: {str(e)}")
        
        return True, "Exemption updated successfully"
    
    def delete_exemption(self, exemption_id: str) -> Tuple[bool, str]:
        """
        Delete a policy exemption.
        
        Args:
            exemption_id: The ID of the exemption to delete
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "delete_exemption"):
            return False, "Operation tether verification failed"
        
        # Check if exemption exists
        if exemption_id not in self.exemptions:
            return False, f"Exemption {exemption_id} not found"
        
        # Get exemption
        exemption = self.exemptions[exemption_id]
        policy_id = exemption.get('policy_id')
        
        # Remove exemption
        del self.exemptions[exemption_id]
        
        # Remove from policy exemptions
        if policy_id in self.policy_exemptions:
            self.policy_exemptions[policy_id].discard(exemption_id)
        
        # Remove from storage
        filename = f"{exemption_id}.json"
        filepath = os.path.join(self.storage_dir, 'exemptions', filename)
        
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                return False, f"Failed to delete exemption file: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="EXEMPTION_DELETED",
            entity_id=exemption_id,
            entity_type="POLICY_EXEMPTION",
            data={
                'exemption_id': exemption_id,
                'policy_id': policy_id,
                'requester': exemption.get('requester'),
                'entity_id': exemption.get('entity_id')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('EXEMPTION_DELETED', []):
            try:
                handler({
                    'exemption_id': exemption_id,
                    'policy_id': policy_id,
                    'requester': exemption.get('requester'),
                    'entity_id': exemption.get('entity_id')
                })
            except Exception as e:
                logging.error(f"Error in EXEMPTION_DELETED event handler: {str(e)}")
        
        return True, "Exemption deleted successfully"
    
    def check_exemptions(self) -> int:
        """
        Check for expired exemptions and update their status.
        
        Returns:
            The number of exemptions that were expired
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "check_exemptions"):
            return 0
        
        now = datetime.datetime.utcnow().isoformat()
        expired_count = 0
        
        for exemption_id, exemption in list(self.exemptions.items()):
            if exemption.get('status') in ['PENDING', 'APPROVED']:
                expires_at = exemption.get('expires_at')
                
                if expires_at and expires_at < now:
                    # Update exemption status to EXPIRED
                    exemption['status'] = 'EXPIRED'
                    exemption['updated_at'] = now
                    
                    # Save exemption
                    self.exemptions[exemption_id] = exemption
                    
                    try:
                        self._save_exemption(exemption)
                    except Exception as e:
                        logging.error(f"Failed to save expired exemption {exemption_id}: {str(e)}")
                        continue
                    
                    # Record event
                    self.record_governance_event(
                        event_type="EXEMPTION_EXPIRED",
                        entity_id=exemption_id,
                        entity_type="POLICY_EXEMPTION",
                        data={
                            'exemption_id': exemption_id,
                            'policy_id': exemption.get('policy_id'),
                            'entity_id': exemption.get('entity_id'),
                            'entity_type': exemption.get('entity_type')
                        }
                    )
                    
                    # Trigger event handlers
                    for handler in self.event_handlers.get('EXEMPTION_EXPIRED', []):
                        try:
                            handler({
                                'exemption_id': exemption_id,
                                'policy_id': exemption.get('policy_id'),
                                'entity_id': exemption.get('entity_id'),
                                'entity_type': exemption.get('entity_type')
                            })
                        except Exception as e:
                            logging.error(f"Error in EXEMPTION_EXPIRED event handler: {str(e)}")
                    
                    expired_count += 1
        
        return expired_count
    
    def evaluate_policy(self, policy_id: str, entity_id: str, entity_type: str, context: Dict[str, Any]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Evaluate an entity against a policy.
        
        Args:
            policy_id: The ID of the policy to evaluate
            entity_id: The ID of the entity to evaluate
            entity_type: The type of the entity
            context: Additional context for evaluation
            
        Returns:
            A tuple of (compliant, message, rule_results)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "evaluate_policy"):
            return False, "Operation tether verification failed", []
        
        # Check if policy exists
        if policy_id not in self.policies:
            return False, f"Policy {policy_id} not found", []
        
        # Get policy
        policy = self.policies[policy_id]
        
        # Check if policy is active
        if policy.get('status') != 'ACTIVE':
            return False, f"Policy {policy_id} is not active", []
        
        # Check if entity is exempt from policy
        is_exempt, exemption_id = self._check_entity_exemption(policy_id, entity_id, entity_type)
        if is_exempt:
            return True, f"Entity is exempt from policy (exemption: {exemption_id})", []
        
        # Evaluate rules
        rules = policy.get('rules', [])
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
            
            elif rule_type == 'REQUIREMENT':
                # Evaluate requirement rule
                try:
                    result = self._evaluate_requirement_rule(rule_definition, entity_id, entity_type, context)
                    rule_results.append({
                        'rule_id': rule_id,
                        'compliant': result,
                        'details': f"Requirement rule {'passed' if result else 'failed'}"
                    })
                    
                    if not result:
                        all_compliant = False
                except Exception as e:
                    logging.error(f"Error evaluating requirement rule {rule_id}: {str(e)}")
                    rule_results.append({
                        'rule_id': rule_id,
                        'compliant': False,
                        'details': f"Error evaluating rule: {str(e)}"
                    })
                    all_compliant = False
        
        message = "Entity is compliant with policy" if all_compliant else "Entity is not compliant with policy"
        return all_compliant, message, rule_results
    
    def _check_entity_exemption(self, policy_id: str, entity_id: str, entity_type: str) -> Tuple[bool, Optional[str]]:
        """
        Check if an entity is exempt from a policy.
        
        Args:
            policy_id: The ID of the policy
            entity_id: The ID of the entity
            entity_type: The type of the entity
            
        Returns:
            A tuple of (is_exempt, exemption_id)
        """
        # Check if policy has exemptions
        if policy_id not in self.policy_exemptions:
            return False, None
        
        # Get current time
        now = datetime.datetime.utcnow().isoformat()
        
        # Check each exemption
        for exemption_id in self.policy_exemptions[policy_id]:
            exemption = self.exemptions.get(exemption_id)
            
            if not exemption:
                continue
            
            # Check if exemption applies to entity
            if exemption.get('entity_id') == entity_id and exemption.get('entity_type') == entity_type:
                # Check if exemption is approved and not expired
                if exemption.get('status') == 'APPROVED' and exemption.get('expires_at', '') > now:
                    return True, exemption_id
        
        return False, None
    
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
    
    def _evaluate_requirement_rule(self, rule_definition: Dict[str, Any], entity_id: str, entity_type: str, context: Dict[str, Any]) -> bool:
        """
        Evaluate a requirement rule.
        
        Args:
            rule_definition: The rule definition
            entity_id: The ID of the entity to evaluate
            entity_type: The type of the entity
            context: Additional context for evaluation
            
        Returns:
            True if the entity is compliant with the rule, False otherwise
        """
        requirement_id = rule_definition.get('requirement_id')
        if not requirement_id:
            return True
        
        # Validate entity against requirement
        success, _, _, results = self.requirement_validation.validate_entity(entity_id, entity_type, context)
        
        # Check if entity passed the specific requirement
        for result in results:
            if result.get('requirement_id') == requirement_id:
                return result.get('valid', False)
        
        # Requirement not found in results
        return False
    
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
        Get the status of the policy management module.
        
        Returns:
            A dictionary with status information
        """
        # Count policies
        policy_count = len(self.policies)
        
        # Count policies by type
        policy_types = {}
        for policy in self.policies.values():
            policy_type = policy.get('policy_type', 'UNKNOWN')
            policy_types[policy_type] = policy_types.get(policy_type, 0) + 1
        
        # Count policies by status
        policy_statuses = {}
        for policy in self.policies.values():
            status = policy.get('status', 'UNKNOWN')
            policy_statuses[status] = policy_statuses.get(status, 0) + 1
        
        # Count exemptions
        exemption_count = len(self.exemptions)
        
        # Count exemptions by status
        exemption_statuses = {}
        for exemption in self.exemptions.values():
            status = exemption.get('status', 'UNKNOWN')
            exemption_statuses[status] = exemption_statuses.get(status, 0) + 1
        
        return {
            'status': 'HEALTHY',
            'policy_count': policy_count,
            'policy_types': policy_types,
            'policy_statuses': policy_statuses,
            'exemption_count': exemption_count,
            'exemption_statuses': exemption_statuses,
            'contract_id': self.CODEX_CONTRACT_ID,
            'contract_version': self.CODEX_CONTRACT_VERSION
        }
    
    def validate_policy(self, policy: Dict[str, Any]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Validate a policy against the schema and business rules.
        
        Args:
            policy: The policy to validate
            
        Returns:
            A tuple of (success, message, validation_results)
        """
        validation_results = []
        
        # Validate against schema
        try:
            # Add policy_id for schema validation if not present
            policy_copy = policy.copy()
            if 'policy_id' not in policy_copy:
                policy_copy['policy_id'] = self._generate_policy_id()
                
            self.schema_validator(policy_copy, self.schema)
            validation_results.append({
                'rule': 'SCHEMA_VALIDATION',
                'valid': True,
                'message': 'Policy is valid against schema'
            })
        except Exception as e:
            validation_results.append({
                'rule': 'SCHEMA_VALIDATION',
                'valid': False,
                'message': f'Schema validation failed: {str(e)}'
            })
            return False, f"Policy validation failed: {str(e)}", validation_results
        
        # Validate policy type
        policy_type = policy.get('policy_type')
        if policy_type not in self.VALID_POLICY_TYPES:
            validation_results.append({
                'rule': 'POLICY_TYPE',
                'valid': False,
                'message': f'Invalid policy type: {policy_type}'
            })
            return False, f"Invalid policy type: {policy_type}", validation_results
        else:
            validation_results.append({
                'rule': 'POLICY_TYPE',
                'valid': True,
                'message': f'Valid policy type: {policy_type}'
            })
        
        # Validate rules
        rules = policy.get('rules', [])
        if not rules:
            validation_results.append({
                'rule': 'RULES',
                'valid': False,
                'message': 'Policy must have at least one rule'
            })
            return False, "Policy must have at least one rule", validation_results
        else:
            validation_results.append({
                'rule': 'RULES',
                'valid': True,
                'message': f'Policy has {len(rules)} rules'
            })
        
        return True, "Policy is valid", validation_results
