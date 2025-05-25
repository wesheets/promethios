"""
Trust Propagation Manager Implementation

This module implements the Trust Propagation Manager component of the Trust Propagation System
as part of the Phase 6.3.1 remediation plan. The Trust Propagation Manager is responsible for
managing the propagation of trust attributes across components with atomic transaction support.

Author: Manus
Date: May 24, 2025
Status: Implementation Phase
"""

import uuid
import time
import logging
import threading
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field

# Import TrustBoundary from trust_verification_system to make it available for tests
from trust_verification_system import TrustBoundary

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("TrustPropagationManager")

@dataclass
class TrustAttribute:
    """Trust attribute data structure."""
    entity_id: str
    base_score: float = 0.0
    context_scores: Dict[str, float] = field(default_factory=dict)
    inheritance_chain: List[str] = field(default_factory=list)
    verification_status: Optional[str] = None
    last_updated: float = field(default_factory=time.time)
    tier: Optional[str] = None
    promotion_history: List[Dict[str, Any]] = field(default_factory=list)

    def validate(self) -> bool:
        """Validate trust attributes for consistency."""
        # Base score must be between 0.0 and 1.0
        if not 0.0 <= self.base_score <= 1.0:
            logger.error(f"Invalid base score: {self.base_score} for entity {self.entity_id}")
            return False
        
        # Context scores must be between 0.0 and 1.0
        for context, score in self.context_scores.items():
            if not 0.0 <= score <= 1.0:
                logger.error(f"Invalid context score: {score} for context {context}, entity {self.entity_id}")
                return False
        
        # Inheritance chain must not be empty if verification status is set
        if self.verification_status and not self.inheritance_chain:
            logger.error(f"Empty inheritance chain with verification status {self.verification_status} for entity {self.entity_id}")
            return False
        
        # Last updated timestamp must be in the past
        if self.last_updated > time.time():
            logger.error(f"Future timestamp {self.last_updated} for entity {self.entity_id}")
            return False
        
        return True


@dataclass
class TrustPropagationTransaction:
    """Trust propagation transaction data structure."""
    transaction_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    source_id: Optional[str] = None
    target_id: Optional[str] = None
    attributes: Optional[TrustAttribute] = None
    status: str = "pending"
    timestamp: float = field(default_factory=time.time)
    verification_result: Optional[bool] = None
    
    def is_valid(self) -> bool:
        """Check if transaction is valid."""
        if not self.source_id or not self.target_id:
            logger.error(f"Transaction {self.transaction_id} missing source or target ID")
            return False
        
        if not self.attributes:
            logger.error(f"Transaction {self.transaction_id} missing attributes")
            return False
        
        if not self.attributes.validate():
            logger.error(f"Transaction {self.transaction_id} has invalid attributes")
            return False
        
        return True


class TrustPropagationManager:
    """
    Manages propagation of trust attributes across components with atomic transaction support.
    
    This class implements the Trust Propagation Manager component of the Trust Propagation System,
    providing atomic transaction support for trust propagation operations.
    """
    
    def __init__(self):
        """Initialize the Trust Propagation Manager."""
        self._transactions: Dict[str, TrustPropagationTransaction] = {}
        self._entity_locks: Dict[str, threading.Lock] = {}
        self._global_lock = threading.RLock()
        self._entity_attributes: Dict[str, TrustAttribute] = {}
        self._transaction_log: List[Dict[str, Any]] = []
        self._boundaries: Dict[str, TrustBoundary] = {}
        logger.info("Trust Propagation Manager initialized")
    
    def _get_entity_lock(self, entity_id: str) -> threading.Lock:
        """Get or create a lock for the specified entity."""
        with self._global_lock:
            if entity_id not in self._entity_locks:
                self._entity_locks[entity_id] = threading.Lock()
            return self._entity_locks[entity_id]
    
    def _acquire_entity_locks(self, entity_ids: List[str]) -> bool:
        """
        Acquire locks for multiple entities in a consistent order to prevent deadlocks.
        
        Args:
            entity_ids: List of entity IDs to lock
            
        Returns:
            bool: True if all locks were acquired, False otherwise
        """
        # Sort entity IDs to ensure consistent lock acquisition order
        sorted_ids = sorted(set(entity_ids))
        acquired_locks = []
        
        try:
            for entity_id in sorted_ids:
                lock = self._get_entity_lock(entity_id)
                if not lock.acquire(timeout=5.0):  # 5-second timeout
                    # Release any acquired locks
                    for acquired_id in acquired_locks:
                        self._entity_locks[acquired_id].release()
                    logger.error(f"Failed to acquire lock for entity {entity_id}")
                    return False
                acquired_locks.append(entity_id)
            return True
        except Exception as e:
            # Release any acquired locks
            for acquired_id in acquired_locks:
                self._entity_locks[acquired_id].release()
            logger.error(f"Error acquiring locks: {str(e)}")
            return False
    
    def _release_entity_locks(self, entity_ids: List[str]) -> None:
        """
        Release locks for multiple entities.
        
        Args:
            entity_ids: List of entity IDs to unlock
        """
        # Sort entity IDs to ensure consistent lock release order
        sorted_ids = sorted(set(entity_ids), reverse=True)
        
        for entity_id in sorted_ids:
            if entity_id in self._entity_locks:
                try:
                    self._entity_locks[entity_id].release()
                except Exception as e:
                    logger.error(f"Error releasing lock for entity {entity_id}: {str(e)}")
                    
    def _register_boundary(self, boundary: TrustBoundary) -> bool:
        """
        Register a trust boundary with the propagation manager.
        
        Args:
            boundary: Trust boundary to register
            
        Returns:
            bool: True if registration was successful, False otherwise
        """
        if not boundary:
            logger.error("Cannot register null boundary")
            return False
            
        with self._global_lock:
            # Store boundary by ID
            self._boundaries[boundary.boundary_id] = boundary
            logger.info(f"Registered boundary: {boundary.boundary_id} with min_trust_score: {boundary.min_trust_score}")
            return True
            
    def _get_boundary(self, boundary_id: str) -> Optional[TrustBoundary]:
        """
        Get a registered trust boundary by ID.
        
        Args:
            boundary_id: Boundary ID
            
        Returns:
            Optional[TrustBoundary]: Trust boundary if found, None otherwise
        """
        with self._global_lock:
            return self._boundaries.get(boundary_id)
            
    def _get_all_boundaries(self) -> Dict[str, TrustBoundary]:
        """
        Get all registered trust boundaries.
        
        Returns:
            Dict[str, TrustBoundary]: Dictionary of all registered boundaries
        """
        with self._global_lock:
            return self._boundaries.copy()
            
    def propagate_trust(self, source_id: str, target_id: str, target_attributes: TrustAttribute) -> bool:
        """
        Propagate trust from source entity to target entity.
        
        Args:
            source_id: Source entity ID
            target_id: Target entity ID
            target_attributes: Target entity attributes
            
        Returns:
            bool: True if propagation was successful, False otherwise
        """
        logger.info(f"Propagating trust from {source_id} to {target_id}")
        
        # Validate inputs
        if not source_id or not target_id:
            logger.error("Invalid source or target ID")
            return False
            
        if not target_attributes:
            logger.error("Invalid target attributes")
            return False
            
        # Acquire locks for both entities
        if not self._acquire_entity_locks([source_id, target_id]):
            logger.error(f"Failed to acquire locks for {source_id} and {target_id}")
            return False
            
        try:
            # Get source attributes
            source_attributes = self._get_entity_attributes(source_id)
            if not source_attributes:
                logger.error(f"Source entity {source_id} not found")
                return False
                
            # Update inheritance chain
            if source_id not in target_attributes.inheritance_chain:
                target_attributes.inheritance_chain.append(source_id)
                
            # Add source's inheritance chain to target's inheritance chain
            for ancestor in source_attributes.inheritance_chain:
                if ancestor not in target_attributes.inheritance_chain:
                    target_attributes.inheritance_chain.append(ancestor)
                    
            # Update target attributes
            target_attributes.last_updated = time.time()
            self._update_entity_attributes(target_id, target_attributes)
            
            logger.info(f"Trust propagated from {source_id} to {target_id}")
            logger.info(f"Updated inheritance chain for {target_id}: {target_attributes.inheritance_chain}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error propagating trust from {source_id} to {target_id}: {str(e)}")
            return False
            
        finally:
            # Release locks
            self._release_entity_locks([source_id, target_id])
    
    def begin_propagation(self, source_id: str, target_id: str, attributes: TrustAttribute) -> Optional[str]:
        """
        Begin a trust propagation transaction.
        
        Args:
            source_id: Source entity ID
            target_id: Target entity ID
            attributes: Trust attributes to propagate
            
        Returns:
            Optional[str]: Transaction ID if successful, None otherwise
        """
        # Create transaction
        transaction = TrustPropagationTransaction(
            source_id=source_id,
            target_id=target_id,
            attributes=attributes
        )
        
        # Validate transaction
        if not transaction.is_valid():
            logger.error(f"Invalid transaction: {transaction.transaction_id}")
            return None
        
        # Store transaction
        with self._global_lock:
            self._transactions[transaction.transaction_id] = transaction
            logger.info(f"Transaction {transaction.transaction_id} created for propagation from {source_id} to {target_id}")
        
        return transaction.transaction_id
    
    def execute_propagation(self, transaction_id: str) -> bool:
        """
        Execute a trust propagation transaction.
        
        Args:
            transaction_id: Transaction ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        # Get transaction
        with self._global_lock:
            if transaction_id not in self._transactions:
                logger.error(f"Transaction {transaction_id} not found")
                return False
            
            transaction = self._transactions[transaction_id]
            
            if transaction.status != "pending":
                logger.error(f"Transaction {transaction_id} is not pending (status: {transaction.status})")
                return False
            
            # Update transaction status
            transaction.status = "executing"
        
        # Acquire locks
        if not self._acquire_entity_locks([transaction.source_id, transaction.target_id]):
            with self._global_lock:
                transaction.status = "failed"
                self._log_transaction(transaction, "Failed to acquire locks")
            return False
        
        try:
            # Get source and target attributes
            source_attributes = self._get_entity_attributes(transaction.source_id)
            
            if not source_attributes:
                logger.error(f"Source entity {transaction.source_id} not found")
                with self._global_lock:
                    transaction.status = "failed"
                    self._log_transaction(transaction, "Source entity not found")
                return False
            
            # Apply propagation rules
            propagated_attributes = self._apply_propagation_rules(
                source_attributes, 
                transaction.attributes
            )
            
            if not propagated_attributes:
                logger.error(f"Failed to apply propagation rules for transaction {transaction_id}")
                with self._global_lock:
                    transaction.status = "failed"
                    self._log_transaction(transaction, "Failed to apply propagation rules")
                return False
            
            # Update target entity
            self._update_entity_attributes(transaction.target_id, propagated_attributes)
            
            # Verify propagation
            verification_result = self._verify_propagation(
                transaction.source_id, 
                transaction.target_id
            )
            
            with self._global_lock:
                transaction.verification_result = verification_result
                
                if verification_result:
                    transaction.status = "completed"
                    self._log_transaction(transaction, "Propagation completed successfully")
                    logger.info(f"Transaction {transaction_id} completed successfully")
                else:
                    transaction.status = "failed"
                    self._log_transaction(transaction, "Propagation verification failed")
                    logger.error(f"Transaction {transaction_id} verification failed")
            
            return verification_result
            
        except Exception as e:
            logger.error(f"Error executing transaction {transaction_id}: {str(e)}")
            with self._global_lock:
                transaction.status = "failed"
                self._log_transaction(transaction, f"Error: {str(e)}")
            return False
        
        finally:
            # Release locks
            self._release_entity_locks([transaction.source_id, transaction.target_id])
    
    def rollback_propagation(self, transaction_id: str) -> bool:
        """
        Rollback a trust propagation transaction.
        
        Args:
            transaction_id: Transaction ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        # Get transaction
        with self._global_lock:
            if transaction_id not in self._transactions:
                logger.error(f"Transaction {transaction_id} not found")
                return False
            
            transaction = self._transactions[transaction_id]
            
            # Allow rollback of pending transactions as well
            if transaction.status not in ["failed", "executing", "pending"]:
                logger.error(f"Transaction {transaction_id} cannot be rolled back (status: {transaction.status})")
                return False
            
            # Update transaction status
            transaction.status = "rolling_back"
        
        # Acquire locks
        if not self._acquire_entity_locks([transaction.source_id, transaction.target_id]):
            with self._global_lock:
                transaction.status = "rollback_failed"
                self._log_transaction(transaction, "Failed to acquire locks for rollback")
            return False
        
        try:
            # Check if target entity was modified
            target_attributes = self._get_entity_attributes(transaction.target_id)
            
            if not target_attributes:
                logger.info(f"Target entity {transaction.target_id} not found, nothing to rollback")
                with self._global_lock:
                    transaction.status = "rolled_back"
                    self._log_transaction(transaction, "Nothing to rollback")
                return True
            
            # Check if attributes were propagated from this transaction
            if transaction.source_id in target_attributes.inheritance_chain:
                # Remove source from inheritance chain
                target_attributes.inheritance_chain.remove(transaction.source_id)
                
                # Recalculate attributes
                self._recalculate_attributes(transaction.target_id)
                
                with self._global_lock:
                    transaction.status = "rolled_back"
                    self._log_transaction(transaction, "Propagation rolled back successfully")
                    logger.info(f"Transaction {transaction_id} rolled back successfully")
                
                return True
            else:
                logger.info(f"No propagation found from {transaction.source_id} to {transaction.target_id}, nothing to rollback")
                with self._global_lock:
                    transaction.status = "rolled_back"
                    self._log_transaction(transaction, "Nothing to rollback")
                return True
            
        except Exception as e:
            logger.error(f"Error rolling back transaction {transaction_id}: {str(e)}")
            with self._global_lock:
                transaction.status = "rollback_failed"
                self._log_transaction(transaction, f"Rollback error: {str(e)}")
            return False
        
        finally:
            # Release locks
            self._release_entity_locks([transaction.source_id, transaction.target_id])
    
    def get_transaction_status(self, transaction_id: str) -> Optional[str]:
        """
        Get the status of a trust propagation transaction.
        
        Args:
            transaction_id: Transaction ID
            
        Returns:
            Optional[str]: Transaction status if found, None otherwise
        """
        with self._global_lock:
            if transaction_id not in self._transactions:
                logger.error(f"Transaction {transaction_id} not found")
                return None
            
            return self._transactions[transaction_id].status
    
    def verify_propagation(self, source_id: str, target_id: str) -> bool:
        """
        Verify successful propagation between source and target entities.
        
        Args:
            source_id: Source entity ID
            target_id: Target entity ID
            
        Returns:
            bool: True if propagation is verified, False otherwise
        """
        # Acquire locks
        if not self._acquire_entity_locks([source_id, target_id]):
            logger.error(f"Failed to acquire locks for verification between {source_id} and {target_id}")
            return False
        
        try:
            return self._verify_propagation(source_id, target_id)
        finally:
            # Release locks
            self._release_entity_locks([source_id, target_id])
    
    def _verify_propagation(self, source_id: str, target_id: str) -> bool:
        """
        Internal method to verify successful propagation between source and target entities.
        
        Args:
            source_id: Source entity ID
            target_id: Target entity ID
            
        Returns:
            bool: True if propagation is verified, False otherwise
        """
        # Get source and target attributes
        source_attributes = self._get_entity_attributes(source_id)
        target_attributes = self._get_entity_attributes(target_id)
        
        if not source_attributes or not target_attributes:
            logger.error(f"Source or target entity not found: {source_id}, {target_id}")
            return False
        
        # Check if source is in target's inheritance chain
        if source_id not in target_attributes.inheritance_chain:
            logger.error(f"Source {source_id} not in target's inheritance chain: {target_attributes.inheritance_chain}")
            return False
        
        # Check if target's base score is influenced by source
        # This is a simplified check; in a real system, we would have more complex verification
        if target_attributes.base_score <= 0.0:
            logger.error(f"Target's base score is not positive: {target_attributes.base_score}")
            return False
        
        return True
    
    def _get_entity_attributes(self, entity_id: str) -> Optional[TrustAttribute]:
        """
        Get attributes for an entity.
        
        Args:
            entity_id: Entity ID
            
        Returns:
            Optional[TrustAttribute]: Entity attributes if found, None otherwise
        """
        with self._global_lock:
            # Debug: Print the entire _entity_attributes dictionary
            logger.info(f"DEBUG: Current _entity_attributes dictionary: {list(self._entity_attributes.keys())}")
            
            attributes = self._entity_attributes.get(entity_id)
            if attributes is None:
                logger.warning(f"Entity attributes not found for {entity_id}")
            else:
                logger.info(f"Retrieved attributes for {entity_id}: {attributes.__dict__}")
            return attributes
    
    def _update_entity_attributes(self, entity_id: str, attributes: TrustAttribute) -> None:
        """
        Update attributes for an entity.
        
        Args:
            entity_id: Entity ID
            attributes: Entity attributes
        """
        if not entity_id:
            logger.error("Cannot update attributes with empty entity_id")
            return
            
        if not attributes:
            logger.error(f"Cannot update entity {entity_id} with None attributes")
            return
            
        # Create a deep copy to prevent reference issues
        copied_attributes = TrustAttribute(
            entity_id=attributes.entity_id,
            base_score=attributes.base_score,
            context_scores=dict(attributes.context_scores),
            inheritance_chain=list(attributes.inheritance_chain),
            verification_status=attributes.verification_status,
            tier=attributes.tier,
            promotion_history=list(attributes.promotion_history) if attributes.promotion_history else [],
            last_updated=attributes.last_updated
        )
        
        with self._global_lock:
            self._entity_attributes[entity_id] = copied_attributes
            logger.info(f"Updated attributes for entity {entity_id}: {copied_attributes.__dict__}")
            
        # Verify update was successful
        verification = self._get_entity_attributes(entity_id)
        if not verification:
            logger.error(f"Failed to update attributes for entity {entity_id} - verification failed")
        else:
            logger.info(f"Verified attributes update for entity {entity_id}")
            logger.info(f"Inheritance chain after update: {verification.inheritance_chain}")
    
    def _apply_propagation_rules(self, source_attributes: TrustAttribute, target_attributes: TrustAttribute) -> Optional[TrustAttribute]:
        """
        Apply propagation rules to calculate new attributes for target entity.
        
        Args:
            source_attributes: Source entity attributes
            target_attributes: Target entity attributes
            
        Returns:
            Optional[TrustAttribute]: New target attributes if successful, None otherwise
        """
        try:
            # Create a copy of target attributes
            new_attributes = TrustAttribute(
                entity_id=target_attributes.entity_id,
                base_score=target_attributes.base_score,
                context_scores=dict(target_attributes.context_scores),
                inheritance_chain=list(target_attributes.inheritance_chain),
                verification_status=target_attributes.verification_status,
                tier=target_attributes.tier,
                promotion_history=list(target_attributes.promotion_history)
            )
            
            # Add source to inheritance chain if not already present
            if source_attributes.entity_id not in new_attributes.inheritance_chain:
                new_attributes.inheritance_chain.append(source_attributes.entity_id)
            
            # Calculate new base score
            # This is a simplified calculation; in a real system, we would have more complex rules
            new_base_score = (new_attributes.base_score + source_attributes.base_score) / 2
            new_attributes.base_score = min(1.0, new_base_score)
            
            # Update context scores
            for context, score in source_attributes.context_scores.items():
                if context in new_attributes.context_scores:
                    new_attributes.context_scores[context] = (new_attributes.context_scores[context] + score) / 2
                else:
                    new_attributes.context_scores[context] = score
            
            # Update verification status
            new_attributes.verification_status = "propagated"
            
            # Update last updated timestamp
            new_attributes.last_updated = time.time()
            
            return new_attributes
        except Exception as e:
            logger.error(f"Error applying propagation rules: {str(e)}")
            return None
    
    def _recalculate_attributes(self, entity_id: str) -> bool:
        """
        Recalculate attributes for an entity based on its inheritance chain.
        
        Args:
            entity_id: Entity ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get entity attributes
            attributes = self._get_entity_attributes(entity_id)
            
            if not attributes:
                logger.error(f"Entity {entity_id} not found")
                return False
            
            # If inheritance chain is empty, nothing to recalculate
            if not attributes.inheritance_chain:
                return True
            
            # Calculate new base score based on inheritance chain
            new_base_score = attributes.base_score
            context_scores = dict(attributes.context_scores)
            
            for parent_id in attributes.inheritance_chain:
                parent_attributes = self._get_entity_attributes(parent_id)
                
                if not parent_attributes:
                    logger.warning(f"Parent entity {parent_id} not found, removing from inheritance chain")
                    attributes.inheritance_chain.remove(parent_id)
                    continue
                
                # Update base score
                new_base_score = (new_base_score + parent_attributes.base_score) / 2
                
                # Update context scores
                for context, score in parent_attributes.context_scores.items():
                    if context in context_scores:
                        context_scores[context] = (context_scores[context] + score) / 2
                    else:
                        context_scores[context] = score
            
            # Update attributes
            attributes.base_score = min(1.0, new_base_score)
            attributes.context_scores = context_scores
            attributes.last_updated = time.time()
            
            return True
        except Exception as e:
            logger.error(f"Error recalculating attributes for entity {entity_id}: {str(e)}")
            return False
    
    def _log_transaction(self, transaction: TrustPropagationTransaction, message: str) -> None:
        """
        Log a transaction.
        
        Args:
            transaction: Transaction
            message: Log message
        """
        log_entry = {
            "transaction_id": transaction.transaction_id,
            "source_id": transaction.source_id,
            "target_id": transaction.target_id,
            "status": transaction.status,
            "timestamp": time.time(),
            "message": message
        }
        
        self._transaction_log.append(log_entry)
    
    def get_transaction_log(self) -> List[Dict[str, Any]]:
        """
        Get transaction log.
        
        Returns:
            List[Dict[str, Any]]: Transaction log
        """
        with self._global_lock:
            return list(self._transaction_log)
    
    def register_entity(self, entity_id: str, base_score: float = 0.5, context_scores: Dict[str, float] = None) -> bool:
        """
        Register a new entity.
        
        Args:
            entity_id: Entity ID
            base_score: Base trust score (0.0-1.0)
            context_scores: Dictionary of context names and scores
            
        Returns:
            bool: True if registration was successful, False otherwise
        """
        # Validate base score
        if not 0.0 <= base_score <= 1.0:
            logger.error(f"Invalid base score: {base_score}")
            return False
        
        # Validate context scores
        if context_scores:
            for context, score in context_scores.items():
                if not 0.0 <= score <= 1.0:
                    logger.error(f"Invalid context score for {context}: {score}")
                    return False
        
        # Create attributes
        attributes = TrustAttribute(
            entity_id=entity_id,
            base_score=base_score,
            context_scores=context_scores or {},
            verification_status="registered"
        )
        
        # Register entity
        with self._global_lock:
            if entity_id in self._entity_attributes:
                logger.error(f"Entity {entity_id} already registered")
                return False
            
            self._entity_attributes[entity_id] = attributes
            logger.info(f"Entity {entity_id} registered with base score {base_score}")
        
        return True
    
    def update_entity(self, entity_id: str, base_score: Optional[float] = None, context_scores: Optional[Dict[str, float]] = None) -> bool:
        """
        Update an existing entity.
        
        Args:
            entity_id: Entity ID
            base_score: New base trust score (0.0-1.0)
            context_scores: New dictionary of context names and scores
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        # Acquire lock
        if not self._acquire_entity_locks([entity_id]):
            logger.error(f"Failed to acquire lock for entity {entity_id}")
            return False
        
        try:
            # Get entity attributes
            attributes = self._get_entity_attributes(entity_id)
            
            if not attributes:
                logger.error(f"Entity {entity_id} not found")
                return False
            
            # Update base score
            if base_score is not None:
                if not 0.0 <= base_score <= 1.0:
                    logger.error(f"Invalid base score: {base_score}")
                    return False
                
                attributes.base_score = base_score
            
            # Update context scores
            if context_scores:
                for context, score in context_scores.items():
                    if not 0.0 <= score <= 1.0:
                        logger.error(f"Invalid context score for {context}: {score}")
                        return False
                    
                    attributes.context_scores[context] = score
            
            # Update last updated timestamp
            attributes.last_updated = time.time()
            
            logger.info(f"Entity {entity_id} updated")
            return True
        finally:
            # Release lock
            self._release_entity_locks([entity_id])
    
    def get_entity(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """
        Get entity information.
        
        Args:
            entity_id: Entity ID
            
        Returns:
            Optional[Dict[str, Any]]: Entity information if found, None otherwise
        """
        # Get entity attributes
        attributes = self._get_entity_attributes(entity_id)
        
        if not attributes:
            logger.error(f"Entity {entity_id} not found")
            return None
        
        # Convert to dictionary
        return {
            "entity_id": attributes.entity_id,
            "base_score": attributes.base_score,
            "context_scores": dict(attributes.context_scores),
            "inheritance_chain": list(attributes.inheritance_chain),
            "verification_status": attributes.verification_status,
            "last_updated": attributes.last_updated,
            "tier": attributes.tier
        }
    
    def list_entities(self) -> List[str]:
        """
        List all registered entities.
        
        Returns:
            List[str]: List of entity IDs
        """
        with self._global_lock:
            return list(self._entity_attributes.keys())
    
    def delete_entity(self, entity_id: str) -> bool:
        """
        Delete an entity.
        
        Args:
            entity_id: Entity ID
            
        Returns:
            bool: True if deletion was successful, False otherwise
        """
        # Acquire lock
        if not self._acquire_entity_locks([entity_id]):
            logger.error(f"Failed to acquire lock for entity {entity_id}")
            return False
        
        try:
            # Check if entity exists
            if entity_id not in self._entity_attributes:
                logger.error(f"Entity {entity_id} not found")
                return False
            
            # Remove entity from all inheritance chains
            for other_id, attributes in self._entity_attributes.items():
                if entity_id in attributes.inheritance_chain:
                    attributes.inheritance_chain.remove(entity_id)
                    self._recalculate_attributes(other_id)
            
            # Delete entity
            with self._global_lock:
                del self._entity_attributes[entity_id]
                logger.info(f"Entity {entity_id} deleted")
            
            return True
        finally:
            # Release lock
            self._release_entity_locks([entity_id])
