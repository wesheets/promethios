"""
Policy Adaptation Engine for Promethios.

This module provides policy adaptation capabilities for the Meta-Governance Framework,
enabling dynamic adjustment of governance policies based on system state and requirements.
"""

import logging
import json
import os
import time
import uuid
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class PolicyAdaptationEngine:
    """
    Policy adaptation engine for the Meta-Governance Framework.
    
    Enables dynamic adjustment of governance policies based on system state,
    performance metrics, and changing requirements.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Policy Adaptation Engine with the specified configuration.
        
        Args:
            config: Configuration dictionary
        """
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing Policy Adaptation Engine")
        
        # Store configuration
        self.config = config
        
        # Initialize policy store
        self.policy_store = {}
        
        # Initialize adaptation history
        self.adaptation_history = []
        
        # Initialize directories
        os.makedirs(self.config.get('policy_directory', 'config/policies'), exist_ok=True)
        os.makedirs(self.config.get('adaptation_directory', 'logs/policy_adaptations'), exist_ok=True)
        
        # Load policies from disk
        self._load_policies()
        
        # Load adaptation history from disk
        self._load_adaptation_history()
        
        self.logger.info("Policy Adaptation Engine initialized")
    
    def register_policy(self, policy_data: Dict[str, Any]) -> str:
        """
        Register a policy with the adaptation engine.
        
        Args:
            policy_data: Policy data
            
        Returns:
            str: Policy ID
        """
        self.logger.info(f"Registering policy: {policy_data.get('name')}")
        
        # Generate policy ID if not provided
        policy_id = policy_data.get('id', str(uuid.uuid4()))
        
        # Add timestamps
        policy_data['registration_timestamp'] = time.time()
        policy_data['last_updated_timestamp'] = time.time()
        policy_data['id'] = policy_id
        
        # Set initial version
        policy_data['version'] = policy_data.get('version', '1.0.0')
        
        # Add to store
        self.policy_store[policy_id] = policy_data
        
        # Save to disk
        self._save_policy(policy_id, policy_data)
        
        return policy_id
    
    def get_policy(self, policy_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a policy from the adaptation engine.
        
        Args:
            policy_id: ID of the policy
            
        Returns:
            dict: Policy data or None if not found
        """
        self.logger.info(f"Getting policy: {policy_id}")
        
        # Check if policy exists
        if policy_id not in self.policy_store:
            self.logger.error(f"Policy not found: {policy_id}")
            return None
        
        return self.policy_store[policy_id]
    
    def list_policies(self, filter_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List policies in the adaptation engine, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the policies by
            
        Returns:
            list: List of policy data
        """
        self.logger.info("Listing policies")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for policy_id, policy_data in self.policy_store.items():
                match = True
                for key, value in filter_params.items():
                    if key not in policy_data or policy_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(policy_data)
        else:
            result = list(self.policy_store.values())
        
        return result
    
    def adapt_policy(self, policy_id: str, adaptation_params: Dict[str, Any]) -> bool:
        """
        Adapt a policy based on the specified parameters.
        
        Args:
            policy_id: ID of the policy to adapt
            adaptation_params: Parameters for the adaptation
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Adapting policy: {policy_id}")
        
        # Check if policy exists
        if policy_id not in self.policy_store:
            self.logger.error(f"Policy not found: {policy_id}")
            return False
        
        # Get policy data
        policy_data = self.policy_store[policy_id]
        
        # Create adaptation record
        adaptation_id = str(uuid.uuid4())
        adaptation_record = {
            'id': adaptation_id,
            'policy_id': policy_id,
            'timestamp': time.time(),
            'adaptation_type': adaptation_params.get('type', 'manual'),
            'adaptation_reason': adaptation_params.get('reason', ''),
            'previous_version': policy_data.get('version', '1.0.0'),
            'previous_state': policy_data.copy(),
            'changes': adaptation_params.get('changes', {})
        }
        
        # Apply changes to policy
        updated_policy = policy_data.copy()
        for key, value in adaptation_params.get('changes', {}).items():
            if key == 'rules':
                # Special handling for rules
                if 'rules' not in updated_policy:
                    updated_policy['rules'] = []
                
                # Apply rule changes
                for rule_change in value:
                    change_type = rule_change.get('type')
                    rule_id = rule_change.get('rule_id')
                    
                    if change_type == 'add':
                        # Add new rule
                        new_rule = rule_change.get('rule', {})
                        if 'id' not in new_rule:
                            new_rule['id'] = str(uuid.uuid4())
                        updated_policy['rules'].append(new_rule)
                    elif change_type == 'update' and rule_id:
                        # Update existing rule
                        for i, rule in enumerate(updated_policy['rules']):
                            if rule.get('id') == rule_id:
                                for rule_key, rule_value in rule_change.get('changes', {}).items():
                                    rule[rule_key] = rule_value
                                break
                    elif change_type == 'remove' and rule_id:
                        # Remove rule
                        updated_policy['rules'] = [r for r in updated_policy['rules'] if r.get('id') != rule_id]
            elif key == 'parameters':
                # Update parameters
                if 'parameters' not in updated_policy:
                    updated_policy['parameters'] = {}
                updated_policy['parameters'].update(value)
            elif key != 'id' and key != 'registration_timestamp':
                # Update other fields
                updated_policy[key] = value
        
        # Update version
        if 'version' in adaptation_params:
            updated_policy['version'] = adaptation_params['version']
        else:
            # Increment version
            version_parts = updated_policy.get('version', '1.0.0').split('.')
            if len(version_parts) == 3:
                version_parts[2] = str(int(version_parts[2]) + 1)
                updated_policy['version'] = '.'.join(version_parts)
        
        # Update timestamp
        updated_policy['last_updated_timestamp'] = time.time()
        
        # Add adaptation record
        adaptation_record['new_version'] = updated_policy.get('version')
        adaptation_record['new_state'] = updated_policy
        
        # Update policy store
        self.policy_store[policy_id] = updated_policy
        
        # Save policy to disk
        self._save_policy(policy_id, updated_policy)
        
        # Add to adaptation history
        self.adaptation_history.append(adaptation_record)
        
        # Save adaptation record to disk
        self._save_adaptation_record(adaptation_id, adaptation_record)
        
        return True
    
    def get_adaptation_history(self, policy_id: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get the adaptation history for a policy or all policies.
        
        Args:
            policy_id: ID of the policy or None for all policies
            limit: Maximum number of records to return
            
        Returns:
            list: List of adaptation records
        """
        self.logger.info(f"Getting adaptation history for policy: {policy_id or 'all'}")
        
        # Filter by policy ID if provided
        if policy_id:
            history = [record for record in self.adaptation_history if record.get('policy_id') == policy_id]
        else:
            history = self.adaptation_history
        
        # Sort by timestamp (newest first)
        history.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
        
        # Apply limit
        history = history[:limit]
        
        return history
    
    def get_adaptation_statistics(self, policy_id: str = None) -> Dict[str, Any]:
        """
        Get statistics about policy adaptations.
        
        Args:
            policy_id: ID of the policy or None for all policies
            
        Returns:
            dict: Adaptation statistics
        """
        self.logger.info(f"Getting adaptation statistics for policy: {policy_id or 'all'}")
        
        # Filter by policy ID if provided
        if policy_id:
            history = [record for record in self.adaptation_history if record.get('policy_id') == policy_id]
        else:
            history = self.adaptation_history
        
        # Initialize statistics
        statistics = {
            'total_adaptations': len(history),
            'adaptations_by_type': {},
            'adaptations_by_policy': {},
            'adaptations_over_time': {}
        }
        
        # Calculate statistics
        for record in history:
            # Count by type
            adaptation_type = record.get('adaptation_type', 'unknown')
            if adaptation_type not in statistics['adaptations_by_type']:
                statistics['adaptations_by_type'][adaptation_type] = 0
            statistics['adaptations_by_type'][adaptation_type] += 1
            
            # Count by policy
            policy_id = record.get('policy_id', 'unknown')
            if policy_id not in statistics['adaptations_by_policy']:
                statistics['adaptations_by_policy'][policy_id] = 0
            statistics['adaptations_by_policy'][policy_id] += 1
            
            # Count over time
            timestamp = record.get('timestamp', 0)
            date = time.strftime('%Y-%m-%d', time.localtime(timestamp))
            if date not in statistics['adaptations_over_time']:
                statistics['adaptations_over_time'][date] = 0
            statistics['adaptations_over_time'][date] += 1
        
        return statistics
    
    def _load_policies(self):
        """Load policies from disk."""
        policy_directory = self.config.get('policy_directory', 'config/policies')
        if not os.path.exists(policy_directory):
            return
        
        for filename in os.listdir(policy_directory):
            if filename.endswith('.json'):
                policy_path = os.path.join(policy_directory, filename)
                try:
                    with open(policy_path, 'r') as f:
                        policy_data = json.load(f)
                    
                    policy_id = policy_data.get('id')
                    if policy_id:
                        self.policy_store[policy_id] = policy_data
                except Exception as e:
                    self.logger.error(f"Error loading policy from {filename}: {str(e)}")
    
    def _save_policy(self, policy_id: str, policy_data: Dict[str, Any]):
        """
        Save a policy to disk.
        
        Args:
            policy_id: ID of the policy
            policy_data: Policy data to save
        """
        policy_directory = self.config.get('policy_directory', 'config/policies')
        os.makedirs(policy_directory, exist_ok=True)
        
        policy_path = os.path.join(policy_directory, f"{policy_id}.json")
        with open(policy_path, 'w') as f:
            json.dump(policy_data, f, indent=2)
    
    def _load_adaptation_history(self):
        """Load adaptation history from disk."""
        adaptation_directory = self.config.get('adaptation_directory', 'logs/policy_adaptations')
        if not os.path.exists(adaptation_directory):
            return
        
        for filename in os.listdir(adaptation_directory):
            if filename.endswith('.json'):
                adaptation_path = os.path.join(adaptation_directory, filename)
                try:
                    with open(adaptation_path, 'r') as f:
                        adaptation_record = json.load(f)
                    
                    self.adaptation_history.append(adaptation_record)
                except Exception as e:
                    self.logger.error(f"Error loading adaptation record from {filename}: {str(e)}")
    
    def _save_adaptation_record(self, adaptation_id: str, adaptation_record: Dict[str, Any]):
        """
        Save an adaptation record to disk.
        
        Args:
            adaptation_id: ID of the adaptation record
            adaptation_record: Adaptation record to save
        """
        adaptation_directory = self.config.get('adaptation_directory', 'logs/policy_adaptations')
        os.makedirs(adaptation_directory, exist_ok=True)
        
        adaptation_path = os.path.join(adaptation_directory, f"{adaptation_id}.json")
        with open(adaptation_path, 'w') as f:
            json.dump(adaptation_record, f, indent=2)
