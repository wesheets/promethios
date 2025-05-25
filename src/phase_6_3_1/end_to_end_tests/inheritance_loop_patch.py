"""
Enhanced inheritance loop detection for TrustPropagationIntegration

This patch modifies the register_inheritance_relationship method in TrustPropagationIntegration
to raise an exception when a cycle is detected, rather than just returning False.
"""

def enhanced_register_inheritance_relationship(self, parent_id: str, child_id: str) -> bool:
    """
    Register an inheritance relationship between parent and child entities.
    
    Args:
        parent_id: Parent entity ID
        child_id: Child entity ID
        
    Returns:
        bool: True if successful, False otherwise
        
    Raises:
        ValueError: If registering this relationship would create a circular inheritance
    """
    import logging
    logger = logging.getLogger("TrustPropagationIntegration")
    
    logger.info(f"Registering inheritance relationship from {parent_id} to {child_id}")
    
    # Check for circular inheritance
    if self._would_create_cycle(parent_id, child_id):
        error_msg = f"Cannot register inheritance from {parent_id} to {child_id}: would create circular inheritance"
        logger.error(error_msg)
        # Raise an exception instead of just returning False
        raise ValueError(error_msg)
    
    # Continue with the original implementation
    # Get parent and child attributes before registration
    parent_attributes = self.propagation_manager._get_entity_attributes(parent_id)
    child_attributes = self.propagation_manager._get_entity_attributes(child_id)
    
    # If attributes are missing, create default ones to prevent NoneType errors
    if not parent_attributes:
        logger.warning(f"Parent entity {parent_id} not found, creating default attributes")
        parent_attributes = self.trust_attribute(
            entity_id=parent_id,
            base_score=0.8,
            context_scores={},
            inheritance_chain=[],
            verification_status="unverified"
        )
        self.register_entity(parent_id, parent_attributes)
    
    if not child_attributes:
        logger.warning(f"Child entity {child_id} not found, creating default attributes")
        child_attributes = self.trust_attribute(
            entity_id=child_id,
            base_score=0.7,
            context_scores={},
            inheritance_chain=[],
            verification_status="unverified"
        )
        self.register_entity(child_id, child_attributes)
    
    # Register with inheritance handler
    success = self.inheritance_handler.register_inheritance_relationship(parent_id, child_id)
    
    if not success:
        logger.error(f"Failed to register inheritance relationship from {parent_id} to {child_id}")
        return False
    
    # Get updated child attributes after inheritance registration
    child_attributes = self.propagation_manager._get_entity_attributes(child_id)
    if not child_attributes:
        logger.error(f"Child entity {child_id} attributes missing after inheritance registration")
        return False
    
    # Propagate trust from parent to child
    success = self.propagation_manager.propagate_trust(parent_id, child_id, child_attributes)
    
    if not success:
        logger.error(f"Failed to propagate trust from {parent_id} to {child_id}")
        # Rollback inheritance relationship
        self.inheritance_handler.unregister_inheritance_relationship(parent_id, child_id)
        return False
    
    # Get updated child attributes from propagation manager
    updated_child_attributes = self.propagation_manager._get_entity_attributes(child_id)
    
    if not updated_child_attributes:
        logger.error(f"Updated child attributes not found in propagation manager")
        return False
    
    logger.info(f"Updated child attributes after propagation: {updated_child_attributes.inheritance_chain}")
    
    # Build complete inheritance chain using the improved method
    complete_chain = self._build_complete_inheritance_chain_for_entity(child_id)
    logger.info(f"Complete inheritance chain built: {complete_chain}")
    
    # Update child's inheritance chain to include all ancestors
    updated_child_attributes.inheritance_chain = complete_chain
    
    logger.info(f"Updated child inheritance chain with all ancestors: {updated_child_attributes.inheritance_chain}")
    
    # Update child attributes in both systems
    self.propagation_manager._update_entity_attributes(child_id, updated_child_attributes)
    success = self.inheritance_handler.set_entity_attributes(child_id, updated_child_attributes)
    
    if not success:
        logger.error(f"Failed to update child attributes in inheritance handler")
        return False
    
    # Synchronize attributes to ensure consistency
    success = self.synchronize_attributes(child_id)
    
    if not success:
        logger.error(f"Failed to synchronize attributes for {child_id}")
        return False
    
    # Update inheritance chains for all descendants of child_id
    self._update_descendant_inheritance_chains(child_id)
        
    logger.info(f"Successfully registered inheritance relationship from {parent_id} to {child_id}")
    return True

# Add the trust_attribute property to TrustPropagationIntegration for convenience
def get_trust_attribute(self):
    """Get the TrustAttribute class from the propagation manager module."""
    from trust_propagation_manager import TrustAttribute
    return TrustAttribute

# Apply the patches
from trust_propagation_integration import TrustPropagationIntegration
TrustPropagationIntegration.register_inheritance_relationship = enhanced_register_inheritance_relationship
TrustPropagationIntegration.trust_attribute = property(get_trust_attribute)
