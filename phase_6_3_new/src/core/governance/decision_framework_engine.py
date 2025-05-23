"""
Decision Framework Engine for the Minimal Viable Governance framework.

This module provides functionality for creating, managing, and executing decision frameworks.
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

class DecisionFrameworkEngine:
    """
    Decision Framework Engine for the Minimal Viable Governance framework.
    
    This class provides functionality for creating, managing, and executing decision frameworks.
    """
    
    # Codex contract constants
    CODEX_CONTRACT_ID = "governance.decision_framework"
    CODEX_CONTRACT_VERSION = "v1.0.0"
    
    # Valid decision models
    VALID_DECISION_MODELS = ['CONSENSUS', 'MAJORITY', 'SUPERMAJORITY', 'UNANIMOUS', 'WEIGHTED', 'HIERARCHICAL']
    
    # Valid decision statuses
    VALID_DECISION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'DEFERRED', 'EXPIRED']
    
    def __init__(self, config: Dict[str, Any], codex_lock: Any, attestation_service: Any, 
                 trust_metrics_calculator: Any):
        """
        Initialize the DecisionFrameworkEngine.
        
        Args:
            config: Configuration dictionary for the module
            codex_lock: Reference to the CodexLock instance
            attestation_service: Reference to the AttestationService instance
            trust_metrics_calculator: Reference to the TrustMetricsCalculator instance
        """
        self.config = config
        self.codex_lock = codex_lock
        self.attestation_service = attestation_service
        self.trust_metrics_calculator = trust_metrics_calculator
        
        # Verify tether to Codex contract
        if not self.codex_lock.verify_tether(self.CODEX_CONTRACT_ID, self.CODEX_CONTRACT_VERSION):
            raise ValueError(f"Failed to verify tether to Codex contract {self.CODEX_CONTRACT_ID}")
        
        # Initialize storage
        self.storage_dir = self.config.get('storage_dir', os.path.join('data', 'governance', 'decision_frameworks'))
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Initialize schema validator
        schema_path = self.config.get('schema_path', os.path.join('schemas', 'governance', 'decision_framework.schema.v1.json'))
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)
        
        # Load existing frameworks and decisions
        self.frameworks = {}
        self.decisions = {}
        self._load_frameworks()
        self._load_decisions()
        
        # Initialize event handlers
        self.event_handlers = {
            'FRAMEWORK_CREATED': [],
            'FRAMEWORK_UPDATED': [],
            'FRAMEWORK_DELETED': [],
            'DECISION_CREATED': [],
            'DECISION_UPDATED': [],
            'DECISION_APPROVED': [],
            'DECISION_REJECTED': []
        }
        
        logging.info(f"DecisionFrameworkEngine initialized with {len(self.frameworks)} frameworks and {len(self.decisions)} decisions")
    
    def _load_frameworks(self):
        """Load existing frameworks from storage."""
        frameworks_dir = os.path.join(self.storage_dir, 'frameworks')
        if not os.path.exists(frameworks_dir):
            os.makedirs(frameworks_dir, exist_ok=True)
            return
        
        for filename in os.listdir(frameworks_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(frameworks_dir, filename), 'r') as f:
                        framework = json.load(f)
                    
                    framework_id = framework.get('framework_id')
                    
                    if framework_id:
                        self.frameworks[framework_id] = framework
                except Exception as e:
                    logging.error(f"Error loading framework from {filename}: {str(e)}")
    
    def _load_decisions(self):
        """Load existing decisions from storage."""
        decisions_dir = os.path.join(self.storage_dir, 'decisions')
        if not os.path.exists(decisions_dir):
            os.makedirs(decisions_dir, exist_ok=True)
            return
        
        for filename in os.listdir(decisions_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(decisions_dir, filename), 'r') as f:
                        decision = json.load(f)
                    
                    decision_id = decision.get('decision_id')
                    
                    if decision_id:
                        self.decisions[decision_id] = decision
                except Exception as e:
                    logging.error(f"Error loading decision from {filename}: {str(e)}")
    
    def _save_framework(self, framework: Dict[str, Any]):
        """
        Save a framework to storage.
        
        Args:
            framework: The framework to save
        """
        framework_id = framework.get('framework_id')
        
        if not framework_id:
            raise ValueError("Framework must have framework_id")
        
        filename = f"{framework_id}.json"
        filepath = os.path.join(self.storage_dir, 'frameworks', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(framework, f, indent=2)
    
    def _save_decision(self, decision: Dict[str, Any]):
        """
        Save a decision to storage.
        
        Args:
            decision: The decision to save
        """
        decision_id = decision.get('decision_id')
        
        if not decision_id:
            raise ValueError("Decision must have decision_id")
        
        filename = f"{decision_id}.json"
        filepath = os.path.join(self.storage_dir, 'decisions', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(decision, f, indent=2)
    
    def _generate_framework_id(self):
        """Generate a unique framework ID."""
        return f"frm-{uuid.uuid4()}"
    
    def _generate_decision_id(self):
        """Generate a unique decision ID."""
        return f"dec-{uuid.uuid4()}"
    
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
    
    def create_framework(self, framework: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        """
        Create a new decision framework.
        
        Args:
            framework: The framework to create
            
        Returns:
            A tuple of (success, message, framework_id)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "create_framework"):
            return False, "Operation tether verification failed", None
        
        # Validate framework against schema
        try:
            # Add framework_id for schema validation
            framework_copy = framework.copy()
            framework_copy['framework_id'] = self._generate_framework_id()
            self.schema_validator(framework_copy, self.schema)
        except Exception as e:
            return False, f"Framework validation failed: {str(e)}", None
        
        # Validate decision model
        decision_model = framework.get('decision_model')
        if decision_model not in self.VALID_DECISION_MODELS:
            return False, f"Invalid decision model: {decision_model}", None
        
        # Generate framework ID
        framework_id = framework_copy['framework_id']
        
        # Add metadata
        framework['framework_id'] = framework_id
        framework['created_at'] = datetime.datetime.utcnow().isoformat()
        framework['updated_at'] = framework['created_at']
        framework['active'] = framework.get('active', True)
        
        # Save framework
        self.frameworks[framework_id] = framework
        
        try:
            self._save_framework(framework)
        except Exception as e:
            return False, f"Failed to save framework: {str(e)}", None
        
        # Record event
        self.record_governance_event(
            event_type="FRAMEWORK_CREATED",
            entity_id=framework_id,
            entity_type="DECISION_FRAMEWORK",
            data={
                'framework_id': framework_id,
                'name': framework.get('name'),
                'decision_model': decision_model
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('FRAMEWORK_CREATED', []):
            try:
                handler({
                    'framework_id': framework_id,
                    'name': framework.get('name'),
                    'decision_model': decision_model
                })
            except Exception as e:
                logging.error(f"Error in FRAMEWORK_CREATED event handler: {str(e)}")
        
        return True, "Framework created successfully", framework_id
    
    def get_framework(self, framework_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a decision framework.
        
        Args:
            framework_id: The ID of the framework to get
            
        Returns:
            The framework, or None if not found
        """
        return self.frameworks.get(framework_id)
    
    def list_frameworks(self, active_only: bool = False, limit: Optional[int] = None, 
                       offset: Optional[int] = 0) -> List[Dict[str, Any]]:
        """
        List decision frameworks.
        
        Args:
            active_only: Whether to only return active frameworks
            limit: Maximum number of frameworks to return
            offset: Number of frameworks to skip
            
        Returns:
            A list of frameworks
        """
        frameworks = list(self.frameworks.values())
        
        # Apply filters
        if active_only:
            frameworks = [f for f in frameworks if f.get('active', True)]
        
        # Sort by updated_at (newest first)
        frameworks.sort(key=lambda f: f.get('updated_at', ''), reverse=True)
        
        # Apply pagination
        if offset:
            frameworks = frameworks[offset:]
        
        if limit:
            frameworks = frameworks[:limit]
        
        return frameworks
    
    def update_framework(self, framework_id: str, updated_framework: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Update a decision framework.
        
        Args:
            framework_id: The ID of the framework to update
            updated_framework: The updated framework
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "update_framework"):
            return False, "Operation tether verification failed"
        
        # Check if framework exists
        if framework_id not in self.frameworks:
            return False, f"Framework {framework_id} not found"
        
        # Get current framework
        current_framework = self.frameworks[framework_id]
        
        # Validate updated framework against schema
        try:
            # Create a merged framework for validation
            merged_framework = current_framework.copy()
            for key, value in updated_framework.items():
                if key not in ['framework_id', 'created_at']:
                    merged_framework[key] = value
            
            self.schema_validator(merged_framework, self.schema)
        except Exception as e:
            return False, f"Framework validation failed: {str(e)}"
        
        # Validate decision model
        decision_model = updated_framework.get('decision_model')
        if decision_model and decision_model not in self.VALID_DECISION_MODELS:
            return False, f"Invalid decision model: {decision_model}"
        
        # Merge current framework with updates
        merged_framework = current_framework.copy()
        for key, value in updated_framework.items():
            if key not in ['framework_id', 'created_at']:
                merged_framework[key] = value
        
        # Update metadata
        merged_framework['updated_at'] = datetime.datetime.utcnow().isoformat()
        
        # Save framework
        self.frameworks[framework_id] = merged_framework
        
        try:
            self._save_framework(merged_framework)
        except Exception as e:
            return False, f"Failed to save framework: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="FRAMEWORK_UPDATED",
            entity_id=framework_id,
            entity_type="DECISION_FRAMEWORK",
            data={
                'framework_id': framework_id,
                'name': merged_framework.get('name'),
                'decision_model': merged_framework.get('decision_model'),
                'active': merged_framework.get('active', True)
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('FRAMEWORK_UPDATED', []):
            try:
                handler({
                    'framework_id': framework_id,
                    'name': merged_framework.get('name'),
                    'decision_model': merged_framework.get('decision_model'),
                    'active': merged_framework.get('active', True)
                })
            except Exception as e:
                logging.error(f"Error in FRAMEWORK_UPDATED event handler: {str(e)}")
        
        return True, "Framework updated successfully"
    
    def delete_framework(self, framework_id: str) -> Tuple[bool, str]:
        """
        Delete a decision framework.
        
        Args:
            framework_id: The ID of the framework to delete
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "delete_framework"):
            return False, "Operation tether verification failed"
        
        # Check if framework exists
        if framework_id not in self.frameworks:
            return False, f"Framework {framework_id} not found"
        
        # Get framework
        framework = self.frameworks[framework_id]
        
        # Check if framework has active decisions
        active_decisions = [d for d in self.decisions.values() if d.get('framework_id') == framework_id and d.get('status') == 'PENDING']
        if active_decisions:
            return False, f"Cannot delete framework {framework_id} with active decisions"
        
        # Remove framework
        del self.frameworks[framework_id]
        
        # Remove from storage
        filename = f"{framework_id}.json"
        filepath = os.path.join(self.storage_dir, 'frameworks', filename)
        
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                return False, f"Failed to delete framework file: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="FRAMEWORK_DELETED",
            entity_id=framework_id,
            entity_type="DECISION_FRAMEWORK",
            data={
                'framework_id': framework_id,
                'name': framework.get('name'),
                'decision_model': framework.get('decision_model')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('FRAMEWORK_DELETED', []):
            try:
                handler({
                    'framework_id': framework_id,
                    'name': framework.get('name'),
                    'decision_model': framework.get('decision_model')
                })
            except Exception as e:
                logging.error(f"Error in FRAMEWORK_DELETED event handler: {str(e)}")
        
        return True, "Framework deleted successfully"
    
    def create_decision(self, decision: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        """
        Create a new decision.
        
        Args:
            decision: The decision to create
            
        Returns:
            A tuple of (success, message, decision_id)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "create_decision"):
            return False, "Operation tether verification failed", None
        
        # Check if framework exists
        framework_id = decision.get('framework_id')
        if not framework_id:
            return False, "Decision must have framework_id", None
        
        if framework_id not in self.frameworks:
            return False, f"Framework {framework_id} not found", None
        
        # Get framework
        framework = self.frameworks[framework_id]
        
        # Check if framework is active
        if not framework.get('active', True):
            return False, f"Framework {framework_id} is not active", None
        
        # Generate decision ID
        decision_id = self._generate_decision_id()
        
        # Add metadata
        decision['decision_id'] = decision_id
        decision['created_at'] = datetime.datetime.utcnow().isoformat()
        decision['updated_at'] = decision['created_at']
        decision['status'] = decision.get('status', 'PENDING')
        decision['votes'] = decision.get('votes', [])
        
        # Save decision
        self.decisions[decision_id] = decision
        
        try:
            self._save_decision(decision)
        except Exception as e:
            return False, f"Failed to save decision: {str(e)}", None
        
        # Record event
        self.record_governance_event(
            event_type="DECISION_CREATED",
            entity_id=decision_id,
            entity_type="DECISION",
            data={
                'decision_id': decision_id,
                'framework_id': framework_id,
                'title': decision.get('title'),
                'status': decision.get('status', 'PENDING')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('DECISION_CREATED', []):
            try:
                handler({
                    'decision_id': decision_id,
                    'framework_id': framework_id,
                    'title': decision.get('title'),
                    'status': decision.get('status', 'PENDING')
                })
            except Exception as e:
                logging.error(f"Error in DECISION_CREATED event handler: {str(e)}")
        
        return True, "Decision created successfully", decision_id
    
    def get_decision(self, decision_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a decision.
        
        Args:
            decision_id: The ID of the decision to get
            
        Returns:
            The decision, or None if not found
        """
        return self.decisions.get(decision_id)
    
    def list_decisions(self, framework_id: Optional[str] = None, status: Optional[str] = None,
                      limit: Optional[int] = None, offset: Optional[int] = 0) -> List[Dict[str, Any]]:
        """
        List decisions.
        
        Args:
            framework_id: Filter by framework ID
            status: Filter by status
            limit: Maximum number of decisions to return
            offset: Number of decisions to skip
            
        Returns:
            A list of decisions
        """
        decisions = list(self.decisions.values())
        
        # Apply filters
        if framework_id:
            decisions = [d for d in decisions if d.get('framework_id') == framework_id]
        
        if status:
            decisions = [d for d in decisions if d.get('status') == status]
        
        # Sort by updated_at (newest first)
        decisions.sort(key=lambda d: d.get('updated_at', ''), reverse=True)
        
        # Apply pagination
        if offset:
            decisions = decisions[offset:]
        
        if limit:
            decisions = decisions[:limit]
        
        return decisions
    
    def update_decision(self, decision_id: str, updated_decision: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Update a decision.
        
        Args:
            decision_id: The ID of the decision to update
            updated_decision: The updated decision
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "update_decision"):
            return False, "Operation tether verification failed"
        
        # Check if decision exists
        if decision_id not in self.decisions:
            return False, f"Decision {decision_id} not found"
        
        # Get current decision
        current_decision = self.decisions[decision_id]
        
        # Check if decision is already finalized
        if current_decision.get('status') in ['APPROVED', 'REJECTED']:
            return False, f"Cannot update finalized decision {decision_id}"
        
        # Merge current decision with updates
        merged_decision = current_decision.copy()
        for key, value in updated_decision.items():
            if key not in ['decision_id', 'framework_id', 'created_at']:
                merged_decision[key] = value
        
        # Update metadata
        merged_decision['updated_at'] = datetime.datetime.utcnow().isoformat()
        
        # Save decision
        self.decisions[decision_id] = merged_decision
        
        try:
            self._save_decision(merged_decision)
        except Exception as e:
            return False, f"Failed to save decision: {str(e)}"
        
        # Record event
        self.record_governance_event(
            event_type="DECISION_UPDATED",
            entity_id=decision_id,
            entity_type="DECISION",
            data={
                'decision_id': decision_id,
                'framework_id': merged_decision.get('framework_id'),
                'title': merged_decision.get('title'),
                'status': merged_decision.get('status')
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get('DECISION_UPDATED', []):
            try:
                handler({
                    'decision_id': decision_id,
                    'framework_id': merged_decision.get('framework_id'),
                    'title': merged_decision.get('title'),
                    'status': merged_decision.get('status')
                })
            except Exception as e:
                logging.error(f"Error in DECISION_UPDATED event handler: {str(e)}")
        
        return True, "Decision updated successfully"
    
    def cast_vote(self, decision_id: str, voter_id: str, vote: str, 
                 justification: Optional[str] = None) -> Tuple[bool, str]:
        """
        Cast a vote on a decision.
        
        Args:
            decision_id: The ID of the decision to vote on
            voter_id: The ID of the voter
            vote: The vote (APPROVE, REJECT, ABSTAIN)
            justification: Optional justification for the vote
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "cast_vote"):
            return False, "Operation tether verification failed"
        
        # Check if decision exists
        if decision_id not in self.decisions:
            return False, f"Decision {decision_id} not found"
        
        # Get decision
        decision = self.decisions[decision_id]
        
        # Check if decision is still pending
        if decision.get('status') != 'PENDING':
            return False, f"Cannot vote on {decision.get('status')} decision {decision_id}"
        
        # Check if vote is valid
        if vote not in ['APPROVE', 'REJECT', 'ABSTAIN']:
            return False, f"Invalid vote: {vote}"
        
        # Check if voter has already voted
        votes = decision.get('votes', [])
        for existing_vote in votes:
            if existing_vote.get('voter_id') == voter_id:
                return False, f"Voter {voter_id} has already voted on decision {decision_id}"
        
        # Add vote
        vote_obj = {
            'voter_id': voter_id,
            'vote': vote,
            'timestamp': datetime.datetime.utcnow().isoformat()
        }
        
        if justification:
            vote_obj['justification'] = justification
        
        votes.append(vote_obj)
        decision['votes'] = votes
        decision['updated_at'] = datetime.datetime.utcnow().isoformat()
        
        # Save decision
        self.decisions[decision_id] = decision
        
        try:
            self._save_decision(decision)
        except Exception as e:
            return False, f"Failed to save decision: {str(e)}"
        
        # Check if decision can be finalized
        self._check_decision_finalization(decision_id)
        
        # Record event
        self.record_governance_event(
            event_type="VOTE_CAST",
            entity_id=decision_id,
            entity_type="DECISION",
            data={
                'decision_id': decision_id,
                'voter_id': voter_id,
                'vote': vote
            }
        )
        
        return True, "Vote cast successfully"
    
    def _check_decision_finalization(self, decision_id: str) -> bool:
        """
        Check if a decision can be finalized based on votes.
        
        Args:
            decision_id: The ID of the decision to check
            
        Returns:
            True if the decision was finalized, False otherwise
        """
        # Get decision
        decision = self.decisions.get(decision_id)
        if not decision:
            return False
        
        # Check if decision is already finalized
        if decision.get('status') != 'PENDING':
            return False
        
        # Get framework
        framework_id = decision.get('framework_id')
        framework = self.frameworks.get(framework_id)
        if not framework:
            return False
        
        # Get decision model
        decision_model = framework.get('decision_model')
        
        # Get votes
        votes = decision.get('votes', [])
        approve_votes = [v for v in votes if v.get('vote') == 'APPROVE']
        reject_votes = [v for v in votes if v.get('vote') == 'REJECT']
        abstain_votes = [v for v in votes if v.get('vote') == 'ABSTAIN']
        
        # Check if decision can be finalized based on model
        finalized = False
        result = None
        
        if decision_model == 'CONSENSUS':
            # Consensus requires no rejections
            if reject_votes:
                # Cannot reach consensus with any rejections
                return False
            
            # Check if all required voters have voted
            required_voters = framework.get('required_voters', [])
            if required_voters:
                voted_ids = [v.get('voter_id') for v in votes]
                for voter_id in required_voters:
                    if voter_id not in voted_ids:
                        # Not all required voters have voted
                        return False
            
            # All required voters have approved or abstained
            if approve_votes:
                finalized = True
                result = 'APPROVED'
        
        elif decision_model == 'MAJORITY':
            # Majority requires more approvals than rejections
            total_votes = len(approve_votes) + len(reject_votes)
            if total_votes == 0:
                return False
            
            # Check if all required voters have voted
            required_voters = framework.get('required_voters', [])
            if required_voters:
                voted_ids = [v.get('voter_id') for v in votes]
                for voter_id in required_voters:
                    if voter_id not in voted_ids:
                        # Not all required voters have voted
                        return False
            
            # Check if majority threshold is met
            if len(approve_votes) > len(reject_votes):
                finalized = True
                result = 'APPROVED'
            elif len(reject_votes) > len(approve_votes):
                finalized = True
                result = 'REJECTED'
        
        elif decision_model == 'SUPERMAJORITY':
            # Supermajority requires a specific threshold of approvals
            threshold = framework.get('threshold', 0.67)  # Default to 2/3
            total_votes = len(approve_votes) + len(reject_votes)
            if total_votes == 0:
                return False
            
            # Check if all required voters have voted
            required_voters = framework.get('required_voters', [])
            if required_voters:
                voted_ids = [v.get('voter_id') for v in votes]
                for voter_id in required_voters:
                    if voter_id not in voted_ids:
                        # Not all required voters have voted
                        return False
            
            # Check if supermajority threshold is met
            approve_ratio = len(approve_votes) / total_votes
            reject_ratio = len(reject_votes) / total_votes
            
            if approve_ratio >= threshold:
                finalized = True
                result = 'APPROVED'
            elif reject_ratio >= threshold:
                finalized = True
                result = 'REJECTED'
        
        elif decision_model == 'UNANIMOUS':
            # Unanimous requires all votes to be approvals
            if not votes:
                return False
            
            # Check if all required voters have voted
            required_voters = framework.get('required_voters', [])
            if required_voters:
                voted_ids = [v.get('voter_id') for v in votes]
                for voter_id in required_voters:
                    if voter_id not in voted_ids:
                        # Not all required voters have voted
                        return False
            
            # Check if all votes are approvals
            if len(reject_votes) == 0 and len(approve_votes) > 0:
                finalized = True
                result = 'APPROVED'
            elif len(reject_votes) > 0:
                finalized = True
                result = 'REJECTED'
        
        elif decision_model == 'WEIGHTED':
            # Weighted voting assigns different weights to different voters
            voter_weights = framework.get('voter_weights', {})
            
            # Calculate weighted votes
            approve_weight = sum(voter_weights.get(v.get('voter_id'), 1) for v in approve_votes)
            reject_weight = sum(voter_weights.get(v.get('voter_id'), 1) for v in reject_votes)
            
            # Check if all required voters have voted
            required_voters = framework.get('required_voters', [])
            if required_voters:
                voted_ids = [v.get('voter_id') for v in votes]
                for voter_id in required_voters:
                    if voter_id not in voted_ids:
                        # Not all required voters have voted
                        return False
            
            # Check if threshold is met
            threshold = framework.get('threshold', 0.5)  # Default to majority
            total_weight = approve_weight + reject_weight
            
            if total_weight == 0:
                return False
            
            approve_ratio = approve_weight / total_weight
            reject_ratio = reject_weight / total_weight
            
            if approve_ratio >= threshold:
                finalized = True
                result = 'APPROVED'
            elif reject_ratio >= threshold:
                finalized = True
                result = 'REJECTED'
        
        elif decision_model == 'HIERARCHICAL':
            # Hierarchical voting gives precedence to higher-level voters
            hierarchy_levels = framework.get('hierarchy_levels', {})
            
            # Process votes by hierarchy level
            for level in sorted(hierarchy_levels.keys()):
                level_voters = hierarchy_levels.get(level, [])
                level_votes = [v for v in votes if v.get('voter_id') in level_voters]
                
                level_approve = [v for v in level_votes if v.get('vote') == 'APPROVE']
                level_reject = [v for v in level_votes if v.get('vote') == 'REJECT']
                
                # If this level has votes, make decision based on this level
                if level_approve or level_reject:
                    if len(level_approve) > len(level_reject):
                        finalized = True
                        result = 'APPROVED'
                    elif len(level_reject) > len(level_approve):
                        finalized = True
                        result = 'REJECTED'
                    
                    # If decision made at this level, stop processing
                    if finalized:
                        break
        
        # If decision is finalized, update status
        if finalized and result:
            decision['status'] = result
            decision['finalized_at'] = datetime.datetime.utcnow().isoformat()
            decision['updated_at'] = decision['finalized_at']
            
            # Save decision
            self.decisions[decision_id] = decision
            
            try:
                self._save_decision(decision)
            except Exception as e:
                logging.error(f"Failed to save finalized decision: {str(e)}")
                return False
            
            # Record event
            event_type = "DECISION_APPROVED" if result == 'APPROVED' else "DECISION_REJECTED"
            self.record_governance_event(
                event_type=event_type,
                entity_id=decision_id,
                entity_type="DECISION",
                data={
                    'decision_id': decision_id,
                    'framework_id': decision.get('framework_id'),
                    'title': decision.get('title'),
                    'status': result
                }
            )
            
            # Trigger event handlers
            for handler in self.event_handlers.get(event_type, []):
                try:
                    handler({
                        'decision_id': decision_id,
                        'framework_id': decision.get('framework_id'),
                        'title': decision.get('title'),
                        'status': result
                    })
                except Exception as e:
                    logging.error(f"Error in {event_type} event handler: {str(e)}")
            
            return True
        
        return False
    
    def finalize_decision(self, decision_id: str, result: str, 
                        justification: Optional[str] = None) -> Tuple[bool, str]:
        """
        Manually finalize a decision.
        
        Args:
            decision_id: The ID of the decision to finalize
            result: The result (APPROVED, REJECTED, DEFERRED, EXPIRED)
            justification: Optional justification for the finalization
            
        Returns:
            A tuple of (success, message)
        """
        # Verify operation tether
        if not self.codex_lock.verify_operation_tether(self.CODEX_CONTRACT_ID, "finalize_decision"):
            return False, "Operation tether verification failed"
        
        # Check if decision exists
        if decision_id not in self.decisions:
            return False, f"Decision {decision_id} not found"
        
        # Get decision
        decision = self.decisions[decision_id]
        
        # Check if decision is already finalized
        if decision.get('status') in ['APPROVED', 'REJECTED', 'DEFERRED', 'EXPIRED']:
            return False, f"Decision {decision_id} is already finalized"
        
        # Check if result is valid
        if result not in ['APPROVED', 'REJECTED', 'DEFERRED', 'EXPIRED']:
            return False, f"Invalid result: {result}"
        
        # Update decision
        decision['status'] = result
        decision['finalized_at'] = datetime.datetime.utcnow().isoformat()
        decision['updated_at'] = decision['finalized_at']
        
        if justification:
            decision['finalization_justification'] = justification
        
        # Save decision
        self.decisions[decision_id] = decision
        
        try:
            self._save_decision(decision)
        except Exception as e:
            return False, f"Failed to save decision: {str(e)}"
        
        # Record event
        event_type = f"DECISION_{result}"
        self.record_governance_event(
            event_type=event_type,
            entity_id=decision_id,
            entity_type="DECISION",
            data={
                'decision_id': decision_id,
                'framework_id': decision.get('framework_id'),
                'title': decision.get('title'),
                'status': result,
                'justification': justification
            }
        )
        
        # Trigger event handlers
        for handler in self.event_handlers.get(event_type, []):
            try:
                handler({
                    'decision_id': decision_id,
                    'framework_id': decision.get('framework_id'),
                    'title': decision.get('title'),
                    'status': result,
                    'justification': justification
                })
            except Exception as e:
                logging.error(f"Error in {event_type} event handler: {str(e)}")
        
        return True, f"Decision {decision_id} finalized as {result}"
    
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
        Get the status of the decision framework engine.
        
        Returns:
            A dictionary with status information
        """
        # Count frameworks
        framework_count = len(self.frameworks)
        
        # Count active frameworks
        active_frameworks = len([f for f in self.frameworks.values() if f.get('active', True)])
        
        # Count decisions by status
        decision_statuses = {}
        for decision in self.decisions.values():
            status = decision.get('status', 'UNKNOWN')
            decision_statuses[status] = decision_statuses.get(status, 0) + 1
        
        return {
            'status': 'HEALTHY',
            'framework_count': framework_count,
            'active_frameworks': active_frameworks,
            'decision_count': len(self.decisions),
            'decision_statuses': decision_statuses,
            'contract_id': self.CODEX_CONTRACT_ID,
            'contract_version': self.CODEX_CONTRACT_VERSION
        }
    
    def validate_framework(self, framework: Dict[str, Any]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Validate a framework against the schema and business rules.
        
        Args:
            framework: The framework to validate
            
        Returns:
            A tuple of (success, message, validation_results)
        """
        validation_results = []
        
        # Validate against schema
        try:
            # Add framework_id for schema validation if not present
            framework_copy = framework.copy()
            if 'framework_id' not in framework_copy:
                framework_copy['framework_id'] = self._generate_framework_id()
                
            self.schema_validator(framework_copy, self.schema)
            validation_results.append({
                'rule': 'SCHEMA_VALIDATION',
                'valid': True,
                'message': 'Framework is valid against schema'
            })
        except Exception as e:
            validation_results.append({
                'rule': 'SCHEMA_VALIDATION',
                'valid': False,
                'message': f'Schema validation failed: {str(e)}'
            })
            return False, f"Framework validation failed: {str(e)}", validation_results
        
        # Validate decision model
        decision_model = framework.get('decision_model')
        if decision_model not in self.VALID_DECISION_MODELS:
            validation_results.append({
                'rule': 'DECISION_MODEL',
                'valid': False,
                'message': f'Invalid decision model: {decision_model}'
            })
            return False, f"Invalid decision model: {decision_model}", validation_results
        else:
            validation_results.append({
                'rule': 'DECISION_MODEL',
                'valid': True,
                'message': f'Valid decision model: {decision_model}'
            })
        
        # Validate model-specific requirements
        if decision_model == 'SUPERMAJORITY':
            threshold = framework.get('threshold')
            if threshold is None or not isinstance(threshold, (int, float)) or threshold <= 0 or threshold > 1:
                validation_results.append({
                    'rule': 'THRESHOLD',
                    'valid': False,
                    'message': f'Invalid threshold for SUPERMAJORITY model: {threshold}'
                })
                return False, f"Invalid threshold for SUPERMAJORITY model: {threshold}", validation_results
            else:
                validation_results.append({
                    'rule': 'THRESHOLD',
                    'valid': True,
                    'message': f'Valid threshold: {threshold}'
                })
        
        elif decision_model == 'WEIGHTED':
            voter_weights = framework.get('voter_weights')
            if not voter_weights or not isinstance(voter_weights, dict):
                validation_results.append({
                    'rule': 'VOTER_WEIGHTS',
                    'valid': False,
                    'message': 'WEIGHTED model requires voter_weights'
                })
                return False, "WEIGHTED model requires voter_weights", validation_results
            else:
                validation_results.append({
                    'rule': 'VOTER_WEIGHTS',
                    'valid': True,
                    'message': f'Valid voter weights with {len(voter_weights)} voters'
                })
        
        elif decision_model == 'HIERARCHICAL':
            hierarchy_levels = framework.get('hierarchy_levels')
            if not hierarchy_levels or not isinstance(hierarchy_levels, dict):
                validation_results.append({
                    'rule': 'HIERARCHY_LEVELS',
                    'valid': False,
                    'message': 'HIERARCHICAL model requires hierarchy_levels'
                })
                return False, "HIERARCHICAL model requires hierarchy_levels", validation_results
            else:
                validation_results.append({
                    'rule': 'HIERARCHY_LEVELS',
                    'valid': True,
                    'message': f'Valid hierarchy levels with {len(hierarchy_levels)} levels'
                })
        
        return True, "Framework is valid", validation_results
