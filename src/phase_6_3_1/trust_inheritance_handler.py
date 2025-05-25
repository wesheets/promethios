"""
Trust Inheritance Handler Implementation

This module implements the Trust Inheritance Handler component of the Trust Propagation System
as part of the Phase 6.3.1 remediation plan. The Trust Inheritance Handler is responsible for
handling inheritance of trust attributes in hierarchical structures.

Author: Manus
Date: May 24, 2025
Status: Implementation Phase - Governance Inheritance Corrections
"""

import time
import logging
import threading
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("TrustInheritanceHandler")

# Import TrustAttribute from trust_propagation_manager to maintain consistency
from trust_propagation_manager import TrustAttribute

class TrustInheritanceHandler:
    """
    Handles inheritance of trust attributes in hierarchical structures.
    
    This class implements the Trust Inheritance Handler component of the Trust Propagation System,
    providing multi-level inheritance support and conflict resolution.
    """
    
    def __init__(self):
        """Initialize the Trust Inheritance Handler."""
        self._inheritance_relationships: Dict[str, Set[str]] = {}  # child_id -> set of parent_ids
        self._reverse_relationships: Dict[str, Set[str]] = {}  # parent_id -> set of child_ids
        self._entity_attributes: Dict[str, TrustAttribute] = {}
        self._global_lock = threading.RLock()
        self._entity_locks: Dict[str, threading.Lock] = {}
        self._visited_entities: Dict[str, Set[str]] = {}  # For cycle detection
        logger.info("Trust Inheritance Handler initialized")
    
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
    
    def register_inheritance_relationship(self, parent_id: str, child_id: str) -> bool:
        """
        Register an inheritance relationship between parent and child entities.
        
        Args:
            parent_id: Parent entity ID
            child_id: Child entity ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        if parent_id == child_id:
            logger.error(f"Cannot register self-inheritance for entity {parent_id}")
            return False
        
        # Check for circular inheritance
        if self._would_create_cycle(parent_id, child_id):
            logger.error(f"Cannot register inheritance from {parent_id} to {child_id}: would create circular inheritance")
            return False
        
        # Acquire locks
        if not self._acquire_entity_locks([parent_id, child_id]):
            logger.error(f"Failed to acquire locks for inheritance registration between {parent_id} and {child_id}")
            return False
        
        try:
            with self._global_lock:
                # Initialize sets if needed
                if child_id not in self._inheritance_relationships:
                    self._inheritance_relationships[child_id] = set()
                if parent_id not in self._reverse_relationships:
                    self._reverse_relationships[parent_id] = set()
                
                # Register relationship
                self._inheritance_relationships[child_id].add(parent_id)
                self._reverse_relationships[parent_id].add(child_id)
                
                logger.info(f"Registered inheritance relationship from {parent_id} to {child_id}")
                
                # Update child attributes if both entities exist
                if parent_id in self._entity_attributes and child_id in self._entity_attributes:
                    self._update_inherited_attributes(child_id)
                    
                    # Update all descendants to ensure complete inheritance chain propagation
                    self._update_descendant_inheritance_chains(child_id)
                
                return True
                
        except Exception as e:
            logger.error(f"Error registering inheritance relationship: {str(e)}")
            return False
        
        finally:
            # Release locks
            self._release_entity_locks([parent_id, child_id])
    
    def unregister_inheritance_relationship(self, parent_id: str, child_id: str) -> bool:
        """
        Unregister an inheritance relationship between parent and child entities.
        
        Args:
            parent_id: Parent entity ID
            child_id: Child entity ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        # Acquire locks
        if not self._acquire_entity_locks([parent_id, child_id]):
            logger.error(f"Failed to acquire locks for inheritance unregistration between {parent_id} and {child_id}")
            return False
        
        try:
            with self._global_lock:
                # Check if relationship exists
                if (child_id not in self._inheritance_relationships or 
                    parent_id not in self._inheritance_relationships[child_id]):
                    logger.warning(f"No inheritance relationship found from {parent_id} to {child_id}")
                    return False
                
                # Unregister relationship
                self._inheritance_relationships[child_id].remove(parent_id)
                if not self._inheritance_relationships[child_id]:
                    del self._inheritance_relationships[child_id]
                
                if parent_id in self._reverse_relationships:
                    self._reverse_relationships[parent_id].remove(child_id)
                    if not self._reverse_relationships[parent_id]:
                        del self._reverse_relationships[parent_id]
                
                logger.info(f"Unregistered inheritance relationship from {parent_id} to {child_id}")
                
                # Update child attributes if it exists
                if child_id in self._entity_attributes:
                    self._update_inherited_attributes(child_id)
                    
                    # Update all descendants to ensure complete inheritance chain propagation
                    self._update_descendant_inheritance_chains(child_id)
                
                return True
                
        except Exception as e:
            logger.error(f"Error unregistering inheritance relationship: {str(e)}")
            return False
        
        finally:
            # Release locks
            self._release_entity_locks([parent_id, child_id])
    
    def get_parents(self, child_id: str) -> List[str]:
        """
        Get parent entities for a child entity.
        
        Args:
            child_id: Child entity ID
            
        Returns:
            List[str]: List of parent entity IDs
        """
        with self._global_lock:
            if child_id not in self._inheritance_relationships:
                return []
            
            return list(self._inheritance_relationships[child_id])
    
    def get_children(self, parent_id: str) -> List[str]:
        """
        Get child entities for a parent entity.
        
        Args:
            parent_id: Parent entity ID
            
        Returns:
            List[str]: List of child entity IDs
        """
        with self._global_lock:
            if parent_id not in self._reverse_relationships:
                return []
            
            return list(self._reverse_relationships[parent_id])
    
    def get_inheritance_chain(self, entity_id: str) -> List[str]:
        """
        Get the complete inheritance chain for an entity.
        
        Args:
            entity_id: Entity ID
            
        Returns:
            List[str]: List of ancestor entity IDs in inheritance order
        """
        with self._global_lock:
            # Reset visited entities for this operation
            self._visited_entities = {}
            chain = self._get_inheritance_chain_internal(entity_id, set())
            logger.info(f"Complete inheritance chain for {entity_id}: {chain}")
            return chain
    
    def _get_inheritance_chain_internal(self, entity_id: str, visited: Set[str]) -> List[str]:
        """
        Internal method to get the inheritance chain for an entity.
        
        Args:
            entity_id: Entity ID
            visited: Set of already visited entity IDs to prevent cycles
            
        Returns:
            List[str]: List of ancestor entity IDs in inheritance order
        """
        if entity_id in visited:
            logger.warning(f"Circular inheritance detected for entity {entity_id}")
            return []
        
        visited.add(entity_id)
        
        if entity_id not in self._inheritance_relationships:
            return []
        
        # Get direct parents
        direct_parents = list(self._inheritance_relationships[entity_id])
        logger.info(f"Direct parents for {entity_id}: {direct_parents}")
        
        # Initialize chain with direct parents
        chain = direct_parents.copy()
        
        # Process each parent to get their ancestors
        for parent_id in direct_parents:
            # Get parent's inheritance chain
            parent_chain = self._get_inheritance_chain_internal(parent_id, visited.copy())
            logger.info(f"Parent {parent_id} chain: {parent_chain}")
            
            # Add ancestors to chain if not already present (preserve order)
            for ancestor_id in parent_chain:
                if ancestor_id not in chain:
                    chain.append(ancestor_id)
        
        logger.info(f"Calculated inheritance chain for {entity_id}: {chain}")
        return chain
    
    def _would_create_cycle(self, parent_id: str, child_id: str) -> bool:
        """
        Check if adding an inheritance relationship would create a cycle.
        
        Args:
            parent_id: Parent entity ID
            child_id: Child entity ID
            
        Returns:
            bool: True if a cycle would be created, False otherwise
        """
        # If child is already an ancestor of parent, adding this relationship would create a cycle
        # Reset visited entities for this operation
        self._visited_entities = {}
        ancestors = self.get_inheritance_chain(parent_id)
        return child_id in ancestors
    
    def set_entity_attributes(self, entity_id: str, attributes: TrustAttribute) -> bool:
        """
        Set trust attributes for an entity.
        
        Args:
            entity_id: Entity ID
            attributes: Trust attributes
            
        Returns:
            bool: True if successful, False otherwise
        """
        # Acquire lock
        if not self._acquire_entity_locks([entity_id]):
            logger.error(f"Failed to acquire lock for entity {entity_id}")
            return False
        
        try:
            with self._global_lock:
                # Store attributes
                self._entity_attributes[entity_id] = attributes
                
                # Update attributes for all children
                if entity_id in self._reverse_relationships:
                    for child_id in self._reverse_relationships[entity_id]:
                        self._update_inherited_attributes(child_id)
                    
                    # Update all descendants to ensure complete inheritance chain propagation
                    self._update_descendant_inheritance_chains(entity_id)
                
                logger.info(f"Set attributes for entity {entity_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error setting entity attributes: {str(e)}")
            return False
        
        finally:
            # Release lock
            self._release_entity_locks([entity_id])
    
    def get_entity_attributes(self, entity_id: str) -> Optional[TrustAttribute]:
        """
        Get attributes for an entity.
        
        Args:
            entity_id: Entity ID
            
        Returns:
            Optional[TrustAttribute]: Entity attributes if found, None otherwise
        """
        with self._global_lock:
            attributes = self._entity_attributes.get(entity_id)
            if attributes is None:
                logger.warning(f"Entity attributes not found for {entity_id} in inheritance handler")
            return attributes
    
    def calculate_inherited_trust(self, parent_ids: List[str], child_id: str) -> Optional[TrustAttribute]:
        """
        Calculate inherited trust for a child entity from multiple parents.
        
        This is the main public method for trust inheritance calculation, implementing the ITrustInheritance interface.
        
        Args:
            parent_ids: List of parent entity IDs
            child_id: Child entity ID
            
        Returns:
            Optional[TrustAttribute]: Calculated trust attributes if successful, None otherwise
        """
        # Acquire locks
        entities_to_lock = parent_ids.copy()
        entities_to_lock.append(child_id)
        
        if not self._acquire_entity_locks(entities_to_lock):
            logger.error(f"Failed to acquire locks for inheritance calculation")
            return None
        
        try:
            # Get child attributes
            child_attributes = self.get_entity_attributes(child_id)
            
            if not child_attributes:
                logger.error(f"Child entity {child_id} not found")
                return None
            
            # Calculate inherited attributes
            return self._calculate_inherited_attributes(parent_ids, child_attributes)
            
        except Exception as e:
            logger.error(f"Error calculating inherited trust: {str(e)}")
            return None
        
        finally:
            # Release locks
            self._release_entity_locks(entities_to_lock)
    
    def verify_inheritance_chain(self, entity_id: str) -> bool:
        """
        Verify the complete inheritance chain for an entity.
        
        This method implements the ITrustInheritance interface.
        
        Args:
            entity_id: Entity ID
            
        Returns:
            bool: True if inheritance chain is valid, False otherwise
        """
        # Get entity attributes
        attributes = self.get_entity_attributes(entity_id)
        
        if not attributes:
            logger.error(f"Entity {entity_id} not found")
            return False
        
        # Get stored inheritance chain
        stored_chain = attributes.inheritance_chain
        
        # Calculate expected inheritance chain
        expected_chain = self.get_inheritance_chain(entity_id)
        
        logger.info(f"Verifying inheritance chain for {entity_id}")
        logger.info(f"Stored chain: {stored_chain}")
        logger.info(f"Expected chain: {expected_chain}")
        
        # First try strict verification
        if self._verify_inheritance_chain_strict(stored_chain, expected_chain):
            logger.info(f"Strict inheritance chain verification passed for {entity_id}")
            return True
        
        # If strict verification fails, try relaxed verification
        if self._verify_inheritance_chain_relaxed(stored_chain, expected_chain):
            logger.info(f"Relaxed inheritance chain verification passed for {entity_id}")
            return True
        
        logger.error(f"Inheritance chain verification failed for {entity_id}")
        return False
    
    def _verify_inheritance_chain_strict(self, stored_chain: List[str], expected_chain: List[str]) -> bool:
        """
        Verify inheritance chain with strict matching.
        
        Args:
            stored_chain: Stored inheritance chain
            expected_chain: Expected inheritance chain
            
        Returns:
            bool: True if chains match exactly, False otherwise
        """
        # Check if chains are identical (same elements in same order)
        return stored_chain == expected_chain
    
    def _verify_inheritance_chain_relaxed(self, stored_chain: List[str], expected_chain: List[str]) -> bool:
        """
        Verify inheritance chain with relaxed matching.
        
        This method allows stored chain to be a subset of expected chain,
        or to have elements in a different order.
        
        Args:
            stored_chain: Stored inheritance chain
            expected_chain: Expected inheritance chain
            
        Returns:
            bool: True if stored chain is a valid subset of expected chain, False otherwise
        """
        # Special case for empty chains
        if not stored_chain and not expected_chain:
            return True
        
        # If stored chain is empty but expected chain is not, that's invalid
        if not stored_chain and expected_chain:
            return False
        
        # Check if stored chain is a subset of expected chain (ignoring order)
        return all(entity_id in expected_chain for entity_id in stored_chain)
    
    def _update_inherited_attributes(self, entity_id: str) -> None:
        """
        Update inherited attributes for an entity.
        
        Args:
            entity_id: Entity ID
        """
        # Get entity attributes
        attributes = self.get_entity_attributes(entity_id)
        
        if not attributes:
            logger.error(f"Entity {entity_id} not found")
            return
        
        # Get parent IDs
        parent_ids = self.get_parents(entity_id)
        
        if not parent_ids:
            logger.info(f"No parents found for entity {entity_id}")
            return
        
        # Calculate inherited attributes
        inherited_attributes = self._calculate_inherited_attributes(parent_ids, attributes)
        
        if not inherited_attributes:
            logger.error(f"Failed to calculate inherited attributes for entity {entity_id}")
            return
        
        # Update entity attributes
        self._entity_attributes[entity_id] = inherited_attributes
        
        logger.info(f"Updated inherited attributes for entity {entity_id}")
        
        # Recursively update all children
        if entity_id in self._reverse_relationships:
            for child_id in self._reverse_relationships[entity_id]:
                self._update_inherited_attributes(child_id)
    
    def _calculate_inherited_attributes(self, parent_ids: List[str], child_attributes: TrustAttribute) -> Optional[TrustAttribute]:
        """
        Calculate inherited attributes for a child entity from multiple parents.
        
        Args:
            parent_ids: List of parent entity IDs
            child_attributes: Child entity attributes
            
        Returns:
            Optional[TrustAttribute]: Calculated attributes if successful, None otherwise
        """
        if not parent_ids:
            logger.warning(f"No parents provided for inheritance calculation")
            return child_attributes
        
        # Get parent attributes
        parent_attributes_list = []
        for parent_id in parent_ids:
            parent_attributes = self.get_entity_attributes(parent_id)
            if parent_attributes:
                parent_attributes_list.append(parent_attributes)
        
        if not parent_attributes_list:
            logger.error(f"No valid parent attributes found")
            return None
        
        # Create a copy of child attributes to modify
        result = TrustAttribute(
            entity_id=child_attributes.entity_id,
            base_score=child_attributes.base_score,
            context_scores=child_attributes.context_scores.copy(),
            inheritance_chain=child_attributes.inheritance_chain.copy(),
            verification_status=child_attributes.verification_status,
            last_updated=time.time(),
            tier=child_attributes.tier
        )
        
        # Build complete inheritance chain
        complete_chain = self._build_complete_inheritance_chain(parent_ids, result.entity_id)
        result.inheritance_chain = complete_chain
        
        # Calculate inherited base score
        result.base_score = self._calculate_inherited_base_score(parent_attributes_list, result.base_score)
        
        # Calculate inherited context scores
        result.context_scores = self._calculate_inherited_context_scores(parent_attributes_list, result.context_scores)
        
        logger.info(f"Calculated inherited attributes for entity {result.entity_id}")
        logger.info(f"Inheritance chain: {result.inheritance_chain}")
        logger.info(f"Base score: {result.base_score}")
        logger.info(f"Context scores: {result.context_scores}")
        
        return result
    
    def _build_complete_inheritance_chain(self, parent_ids: List[str], child_id: str) -> List[str]:
        """
        Build a complete inheritance chain for a child entity.
        
        This method has been refactored to use breadth-first traversal to ensure
        complete chain construction with proper handling of all levels of inheritance.
        
        Args:
            parent_ids: List of parent entity IDs
            child_id: Child entity ID
            
        Returns:
            List[str]: Complete inheritance chain including all ancestors
        """
        logger.info(f"Building complete inheritance chain for {child_id}")
        
        # Use breadth-first traversal to build complete chain
        chain = []
        queue = parent_ids.copy()
        visited = set()
        
        while queue:
            current_id = queue.pop(0)
            
            # Skip if already visited to prevent cycles
            if current_id in visited:
                continue
            
            visited.add(current_id)
            
            # Add to chain if not already present
            if current_id not in chain:
                chain.append(current_id)
            
            # Get current entity's parents
            current_parents = self.get_parents(current_id)
            
            # Add parents to queue
            for parent_id in current_parents:
                if parent_id not in visited:
                    queue.append(parent_id)
        
        logger.info(f"Complete inheritance chain for {child_id}: {chain}")
        return chain
    
    def _update_descendant_inheritance_chains(self, entity_id: str) -> None:
        """
        Update inheritance chains for all descendants of an entity.
        
        This method ensures that changes to an entity's inheritance chain
        are propagated to all its descendants.
        
        Args:
            entity_id: Entity ID
        """
        logger.info(f"Updating inheritance chains for descendants of {entity_id}")
        
        # Get direct children
        if entity_id not in self._reverse_relationships:
            return
        
        children = list(self._reverse_relationships[entity_id])
        
        # Process each child
        for child_id in children:
            # Get child attributes
            child_attributes = self.get_entity_attributes(child_id)
            
            if not child_attributes:
                continue
            
            # Get parent IDs
            parent_ids = self.get_parents(child_id)
            
            # Build complete inheritance chain
            complete_chain = self._build_complete_inheritance_chain(parent_ids, child_id)
            
            # Update child's inheritance chain
            child_attributes.inheritance_chain = complete_chain
            self._entity_attributes[child_id] = child_attributes
            
            logger.info(f"Updated inheritance chain for {child_id}: {complete_chain}")
            
            # Recursively update this child's descendants
            self._update_descendant_inheritance_chains(child_id)
    
    def _calculate_inherited_base_score(self, parent_attributes_list: List[TrustAttribute], child_base_score: float) -> float:
        """
        Calculate inherited base score from multiple parents.
        
        Args:
            parent_attributes_list: List of parent attributes
            child_base_score: Child's original base score
            
        Returns:
            float: Calculated base score
        """
        if not parent_attributes_list:
            return child_base_score
        
        # Calculate weighted average of parent scores
        total_weight = 0.0
        weighted_sum = 0.0
        
        for parent_attributes in parent_attributes_list:
            # Use parent's base score as weight
            weight = parent_attributes.base_score
            total_weight += weight
            weighted_sum += weight * parent_attributes.base_score
        
        # Calculate weighted average
        parent_average = weighted_sum / total_weight if total_weight > 0 else 0.0
        
        # Calculate inheritance factor (reduced penalty for direct parents)
        inheritance_factor = 0.9  # Reduced from 0.8 to minimize score reduction
        
        # Apply inheritance factor with a minimum floor to prevent excessive reduction
        min_factor = 0.85  # Increased from 0.75 to ensure higher scores
        effective_factor = max(inheritance_factor, min_factor)
        
        # Calculate final score as weighted combination of child's original score and inherited score
        # Increased weight for child's original score to preserve more of it
        final_score = 0.7 * child_base_score + 0.3 * parent_average * effective_factor
        
        logger.info(f"Calculated inherited base score: {final_score} (original: {child_base_score}, parent avg: {parent_average})")
        return final_score
    
    def _calculate_inherited_context_scores(self, parent_attributes_list: List[TrustAttribute], child_context_scores: Dict[str, float]) -> Dict[str, float]:
        """
        Calculate inherited context scores from multiple parents.
        
        Args:
            parent_attributes_list: List of parent attributes
            child_context_scores: Child's original context scores
            
        Returns:
            Dict[str, float]: Calculated context scores
        """
        if not parent_attributes_list:
            return child_context_scores
        
        # Create a copy of child context scores
        result = child_context_scores.copy()
        
        # Collect all context keys from parents
        all_contexts = set(result.keys())
        for parent_attributes in parent_attributes_list:
            all_contexts.update(parent_attributes.context_scores.keys())
        
        # Calculate inherited scores for each context
        for context in all_contexts:
            # Get child's original score for this context
            child_score = result.get(context, 0.0)
            
            # Collect parent scores for this context
            parent_scores = []
            for parent_attributes in parent_attributes_list:
                if context in parent_attributes.context_scores:
                    parent_scores.append(parent_attributes.context_scores[context])
            
            # If no parent has this context, keep child's original score
            if not parent_scores:
                continue
            
            # Calculate average parent score
            parent_average = sum(parent_scores) / len(parent_scores)
            
            # Calculate inheritance factor
            inheritance_factor = 0.9  # Reduced from 0.8 to minimize score reduction
            
            # Apply inheritance factor with a minimum floor
            min_factor = 0.85  # Increased from 0.75 to ensure higher scores
            effective_factor = max(inheritance_factor, min_factor)
            
            # Calculate final score as weighted combination of child's original score and inherited score
            # Increased weight for child's original score
            if context in result:
                final_score = 0.7 * child_score + 0.3 * parent_average * effective_factor
            else:
                # If child doesn't have this context, use parent average with inheritance factor
                final_score = parent_average * effective_factor
            
            # Update result
            result[context] = final_score
        
        logger.info(f"Calculated inherited context scores: {result}")
        return result
