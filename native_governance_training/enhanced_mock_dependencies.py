"""
Enhanced Mock Dependencies for Real Component Integration

This module provides complete mock implementations of dependencies required
by real Promethios governance components. These mocks have all the methods
and signatures expected by the real components.

Codex Contract: v2025.05.21
Phase ID: 6.3
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import uuid

logger = logging.getLogger(__name__)

class MockCodexLock:
    """
    Enhanced mock CodexLock with complete method signatures.
    
    This mock provides all methods expected by DecisionFrameworkEngine
    and other governance components that require codex contract verification.
    """
    
    def __init__(self):
        self.contracts = {}
        self.logger = logging.getLogger(__name__)
    
    def verify_tether(self, contract_id: str, version: str) -> bool:
        """
        Mock implementation of verify_tether method.
        
        Args:
            contract_id: The contract identifier to verify
            version: The contract version to verify
            
        Returns:
            bool: Always returns True for mock implementation
        """
        self.logger.info(f"Mock CodexLock: Verifying tether for {contract_id} v{version}")
        
        # Store the contract for tracking
        self.contracts[contract_id] = {
            'version': version,
            'verified_at': datetime.now().isoformat(),
            'status': 'verified'
        }
        
        return True
    
    def register_contract(self, contract_id: str, version: str, metadata: Dict[str, Any] = None) -> bool:
        """
        Mock implementation of register_contract method.
        
        Args:
            contract_id: The contract identifier to register
            version: The contract version to register
            metadata: Optional metadata for the contract
            
        Returns:
            bool: Always returns True for mock implementation
        """
        self.logger.info(f"Mock CodexLock: Registering contract {contract_id} v{version}")
        
        self.contracts[contract_id] = {
            'version': version,
            'registered_at': datetime.now().isoformat(),
            'metadata': metadata or {},
            'status': 'registered'
        }
        
        return True
    
    def get_contract_status(self, contract_id: str) -> Dict[str, Any]:
        """
        Mock implementation of get_contract_status method.
        
        Args:
            contract_id: The contract identifier to check
            
        Returns:
            Dict[str, Any]: Contract status information
        """
        return self.contracts.get(contract_id, {
            'status': 'not_found',
            'version': None,
            'verified_at': None
        })

class MockAttestationService:
    """
    Enhanced mock AttestationService with complete method signatures.
    
    This mock provides all methods expected by DecisionFrameworkEngine
    and other governance components that require attestation services.
    """
    
    def __init__(self):
        self.attestations = {}
        self.logger = logging.getLogger(__name__)
    
    def create_attestation(self, data: Dict[str, Any], attestor: str = "mock_attestor") -> str:
        """
        Mock implementation of create_attestation method.
        
        Args:
            data: The data to attest
            attestor: The entity creating the attestation
            
        Returns:
            str: Attestation ID
        """
        attestation_id = str(uuid.uuid4())
        
        self.attestations[attestation_id] = {
            'id': attestation_id,
            'data': data,
            'attestor': attestor,
            'created_at': datetime.now().isoformat(),
            'status': 'valid',
            'signature': f"mock_signature_{attestation_id[:8]}"
        }
        
        self.logger.info(f"Mock AttestationService: Created attestation {attestation_id}")
        return attestation_id
    
    def verify_attestation(self, attestation_id: str) -> bool:
        """
        Mock implementation of verify_attestation method.
        
        Args:
            attestation_id: The attestation ID to verify
            
        Returns:
            bool: True if attestation is valid
        """
        attestation = self.attestations.get(attestation_id)
        if attestation:
            self.logger.info(f"Mock AttestationService: Verified attestation {attestation_id}")
            return attestation.get('status') == 'valid'
        
        self.logger.warning(f"Mock AttestationService: Attestation {attestation_id} not found")
        return False
    
    def get_attestation(self, attestation_id: str) -> Optional[Dict[str, Any]]:
        """
        Mock implementation of get_attestation method.
        
        Args:
            attestation_id: The attestation ID to retrieve
            
        Returns:
            Optional[Dict[str, Any]]: Attestation data if found
        """
        return self.attestations.get(attestation_id)
    
    def revoke_attestation(self, attestation_id: str, reason: str = "revoked") -> bool:
        """
        Mock implementation of revoke_attestation method.
        
        Args:
            attestation_id: The attestation ID to revoke
            reason: Reason for revocation
            
        Returns:
            bool: True if successfully revoked
        """
        if attestation_id in self.attestations:
            self.attestations[attestation_id]['status'] = 'revoked'
            self.attestations[attestation_id]['revoked_at'] = datetime.now().isoformat()
            self.attestations[attestation_id]['revocation_reason'] = reason
            
            self.logger.info(f"Mock AttestationService: Revoked attestation {attestation_id}")
            return True
        
        return False

class MockTrustMetricsCalculatorForDecisionEngine:
    """
    Enhanced mock TrustMetricsCalculator specifically for DecisionFrameworkEngine.
    
    This mock provides all methods expected by DecisionFrameworkEngine
    when it needs to calculate trust metrics for decision participants.
    """
    
    def __init__(self):
        self.trust_scores = {}
        self.logger = logging.getLogger(__name__)
    
    def calculate_entity_trust(self, entity_id: str, context: str = "decision_making") -> float:
        """
        Mock implementation of calculate_entity_trust method.
        
        Args:
            entity_id: The entity to calculate trust for
            context: The context for trust calculation
            
        Returns:
            float: Trust score between 0.0 and 1.0
        """
        # Generate consistent but varied trust scores
        import hashlib
        hash_input = f"{entity_id}_{context}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest()[:8], 16)
        trust_score = 0.5 + (hash_value % 500) / 1000.0  # Range: 0.5 to 1.0
        
        self.trust_scores[entity_id] = {
            'score': trust_score,
            'context': context,
            'calculated_at': datetime.now().isoformat()
        }
        
        self.logger.info(f"Mock TrustMetricsCalculator: Calculated trust for {entity_id}: {trust_score:.3f}")
        return trust_score
    
    def get_trust_history(self, entity_id: str) -> List[Dict[str, Any]]:
        """
        Mock implementation of get_trust_history method.
        
        Args:
            entity_id: The entity to get trust history for
            
        Returns:
            List[Dict[str, Any]]: Trust history records
        """
        if entity_id in self.trust_scores:
            return [self.trust_scores[entity_id]]
        return []
    
    def update_trust_based_on_decision(self, entity_id: str, decision_outcome: str, 
                                     decision_quality: float) -> float:
        """
        Mock implementation of update_trust_based_on_decision method.
        
        Args:
            entity_id: The entity to update trust for
            decision_outcome: The outcome of the decision
            decision_quality: Quality score of the decision
            
        Returns:
            float: Updated trust score
        """
        current_trust = self.trust_scores.get(entity_id, {}).get('score', 0.7)
        
        # Simple trust update logic
        if decision_outcome == 'successful':
            adjustment = decision_quality * 0.1
        else:
            adjustment = -decision_quality * 0.05
        
        new_trust = max(0.0, min(1.0, current_trust + adjustment))
        
        self.trust_scores[entity_id] = {
            'score': new_trust,
            'context': 'decision_outcome_update',
            'calculated_at': datetime.now().isoformat(),
            'previous_score': current_trust,
            'adjustment': adjustment
        }
        
        self.logger.info(f"Mock TrustMetricsCalculator: Updated trust for {entity_id}: {current_trust:.3f} -> {new_trust:.3f}")
        return new_trust

def create_enhanced_mock_dependencies() -> Dict[str, Any]:
    """
    Create all enhanced mock dependencies needed for real component integration.
    
    Returns:
        Dict[str, Any]: Dictionary of mock dependency instances
    """
    return {
        'codex_lock': MockCodexLock(),
        'attestation_service': MockAttestationService(),
        'trust_metrics_calculator': MockTrustMetricsCalculatorForDecisionEngine()
    }

