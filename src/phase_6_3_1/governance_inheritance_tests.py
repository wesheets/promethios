# Governance Inheritance Tests

"""
Test suite for validating the Governance Inheritance corrections
implemented as part of Phase 6.3.1 remediation.

This test suite focuses on validating:
1. Complete inheritance chain propagation
2. Cycle detection and prevention
3. Boundary enforcement with inheritance
4. Multi-level inheritance verification
5. Synchronization before verification

Author: Manus
Date: May 24, 2025
"""

import unittest
import logging
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("GovernanceInheritanceTests")

# Import components
from trust_propagation_integration import TrustPropagationIntegration
from trust_inheritance_handler import TrustInheritanceHandler
from trust_propagation_manager import TrustAttribute, TrustPropagationManager, TrustBoundary

class TestGovernanceInheritance(unittest.TestCase):
    """Test cases for Governance Inheritance corrections."""
    
    def setUp(self):
        """Set up test environment."""
        # Create a single propagation manager instance to be shared
        self.propagation_manager = TrustPropagationManager()
        
        # Create inheritance handler with reference to the same propagation manager
        self.inheritance_handler = TrustInheritanceHandler()
        
        # Create integration with references to the existing instances
        # rather than creating new ones internally
        self.integration = TrustPropagationIntegration(
            propagation_manager=self.propagation_manager,
            inheritance_handler=self.inheritance_handler
        )
        
        # Create test entities
        self.root_entity = "root_entity"
        self.parent_entity = "parent_entity"
        self.child_entity = "child_entity"
        self.grandchild_entity = "grandchild_entity"
        self.sibling_entity = "sibling_entity"
        
        # Create test attributes
        self.root_attributes = TrustAttribute(
            entity_id=self.root_entity,
            base_score=0.9,
            context_scores={"security": 0.95, "reliability": 0.85},
            inheritance_chain=[],
            verification_status="verified",
            last_updated="2025-05-24T12:00:00Z",
            tier="gold",
            promotion_history=[]
        )
        
        self.parent_attributes = TrustAttribute(
            entity_id=self.parent_entity,
            base_score=0.8,
            context_scores={"security": 0.85, "reliability": 0.75},
            inheritance_chain=[self.root_entity],
            verification_status="verified",
            last_updated="2025-05-24T12:00:00Z",
            tier="silver",
            promotion_history=[]
        )
        
        self.child_attributes = TrustAttribute(
            entity_id=self.child_entity,
            base_score=0.7,
            context_scores={"security": 0.75, "reliability": 0.65},
            inheritance_chain=[self.parent_entity],
            verification_status="verified",
            last_updated="2025-05-24T12:00:00Z",
            tier="bronze",
            promotion_history=[]
        )
        
        self.grandchild_attributes = TrustAttribute(
            entity_id=self.grandchild_entity,
            base_score=0.6,
            context_scores={"security": 0.65, "reliability": 0.55},
            inheritance_chain=[self.child_entity],
            verification_status="verified",
            last_updated="2025-05-24T12:00:00Z",
            tier="bronze",
            promotion_history=[]
        )
        
        self.sibling_attributes = TrustAttribute(
            entity_id=self.sibling_entity,
            base_score=0.75,
            context_scores={"security": 0.8, "reliability": 0.7},
            inheritance_chain=[self.parent_entity],
            verification_status="verified",
            last_updated="2025-05-24T12:00:00Z",
            tier="silver",
            promotion_history=[]
        )
        
        # Register entities
        self.integration.register_entity(self.root_entity, self.root_attributes)
        self.integration.register_entity(self.parent_entity, self.parent_attributes)
        self.integration.register_entity(self.child_entity, self.child_attributes)
        self.integration.register_entity(self.grandchild_entity, self.grandchild_attributes)
        self.integration.register_entity(self.sibling_entity, self.sibling_attributes)
        
        # Create test boundaries
        self.high_boundary = TrustBoundary(
            boundary_id="high_boundary",
            required_score=0.8,
            allow_inheritance=True
        )
        
        self.medium_boundary = TrustBoundary(
            boundary_id="medium_boundary",
            required_score=0.6,
            allow_inheritance=True
        )
        
        self.strict_boundary = TrustBoundary(
            boundary_id="strict_boundary",
            required_score=0.7,
            allow_inheritance=False
        )
        
        # Register boundaries
        self.propagation_manager._register_boundary(self.high_boundary)
        self.propagation_manager._register_boundary(self.medium_boundary)
        self.propagation_manager._register_boundary(self.strict_boundary)
    
    def test_complete_inheritance_chain_propagation(self):
        """Test complete inheritance chain propagation across component boundaries."""
        # Register inheritance relationships
        self.integration.register_inheritance_relationship(self.root_entity, self.parent_entity)
        self.integration.register_inheritance_relationship(self.parent_entity, self.child_entity)
        self.integration.register_inheritance_relationship(self.child_entity, self.grandchild_entity)
        
        # Force synchronization for all entities
        self.integration.synchronize_attributes(self.root_entity)
        self.integration.synchronize_attributes(self.parent_entity)
        self.integration.synchronize_attributes(self.child_entity)
        self.integration.synchronize_attributes(self.grandchild_entity)
        
        # Get grandchild attributes
        grandchild_attributes = self.propagation_manager._get_entity_attributes(self.grandchild_entity)
        
        # Debug output
        print(f"Grandchild attributes: {grandchild_attributes}")
        if grandchild_attributes:
            print(f"Inheritance chain: {grandchild_attributes.inheritance_chain}")
        
        # Verify grandchild attributes exist
        self.assertIsNotNone(grandchild_attributes, "Grandchild attributes should not be None")
        
        # Verify inheritance chain includes all ancestors
        self.assertIn(self.child_entity, grandchild_attributes.inheritance_chain)
        self.assertIn(self.parent_entity, grandchild_attributes.inheritance_chain)
        self.assertIn(self.root_entity, grandchild_attributes.inheritance_chain)
        
        # Verify inheritance chain in inheritance handler
        inheritance_attributes = self.inheritance_handler.get_entity_attributes(self.grandchild_entity)
        self.assertIn(self.child_entity, inheritance_attributes.inheritance_chain)
        self.assertIn(self.parent_entity, inheritance_attributes.inheritance_chain)
        self.assertIn(self.root_entity, inheritance_attributes.inheritance_chain)
        
        # Verify chain length
        self.assertEqual(len(grandchild_attributes.inheritance_chain), 3)
    
    def test_cycle_detection_and_prevention(self):
        """Test cycle detection and prevention in inheritance relationships."""
        # Register valid inheritance relationships
        self.integration.register_inheritance_relationship(self.root_entity, self.parent_entity)
        self.integration.register_inheritance_relationship(self.parent_entity, self.child_entity)
        
        # Attempt to create a cycle
        result = self.integration.register_inheritance_relationship(self.child_entity, self.parent_entity)
        
        # Verify cycle was prevented
        self.assertFalse(result)
        
        # Verify parent's inheritance chain doesn't include child
        parent_attributes = self.propagation_manager._get_entity_attributes(self.parent_entity)
        self.assertNotIn(self.child_entity, parent_attributes.inheritance_chain)
        
        # Attempt to create a self-cycle
        result = self.integration.register_inheritance_relationship(self.root_entity, self.root_entity)
        
        # Verify self-cycle was prevented
        self.assertFalse(result)
    
    def test_boundary_enforcement_with_inheritance(self):
        """Test boundary enforcement with inheritance."""
        # Register inheritance relationships
        self.integration.register_inheritance_relationship(self.root_entity, self.parent_entity)
        self.integration.register_inheritance_relationship(self.parent_entity, self.child_entity)
        
        # Enforce high boundary on parent entity
        result = self.integration.enforce_trust_boundary("high_boundary", self.parent_entity)
        
        # Verify enforcement
        self.assertTrue(result["enforced"])
        self.assertTrue(result["inheritance_verified"])
        self.assertTrue(result["allow_inheritance"])
        self.assertIn(self.root_entity, result["inheritance_chain"])
        
        # Enforce high boundary on child entity (should fail due to score)
        result = self.integration.enforce_trust_boundary("high_boundary", self.child_entity)
        
        # Verify enforcement failure
        self.assertFalse(result["enforced"])
        self.assertTrue(result["inheritance_verified"])
        self.assertTrue(result["allow_inheritance"])
        self.assertIn(self.parent_entity, result["inheritance_chain"])
        self.assertIn(self.root_entity, result["inheritance_chain"])
        
        # Enforce strict boundary on child entity (should fail due to inheritance)
        result = self.integration.enforce_trust_boundary("strict_boundary", self.child_entity)
        
        # Verify enforcement failure
        self.assertFalse(result["enforced"])
        self.assertTrue(result["inheritance_verified"])
        self.assertFalse(result["allow_inheritance"])
        self.assertIn(self.parent_entity, result["inheritance_chain"])
    
    def test_multi_level_inheritance_verification(self):
        """Test verification of multi-level inheritance."""
        # Register inheritance relationships
        self.integration.register_inheritance_relationship(self.root_entity, self.parent_entity)
        self.integration.register_inheritance_relationship(self.parent_entity, self.child_entity)
        self.integration.register_inheritance_relationship(self.child_entity, self.grandchild_entity)
        
        # Verify propagation and inheritance
        result = self.integration.verify_propagation_and_inheritance(self.root_entity, self.grandchild_entity)
        
        # Verify result
        self.assertTrue(result)
        
        # Verify grandchild's inheritance chain
        grandchild_attributes = self.propagation_manager._get_entity_attributes(self.grandchild_entity)
        self.assertIn(self.child_entity, grandchild_attributes.inheritance_chain)
        self.assertIn(self.parent_entity, grandchild_attributes.inheritance_chain)
        self.assertIn(self.root_entity, grandchild_attributes.inheritance_chain)
    
    def test_synchronization_before_verification(self):
        """Test synchronization before verification."""
        # Register inheritance relationships
        self.integration.register_inheritance_relationship(self.root_entity, self.parent_entity)
        self.integration.register_inheritance_relationship(self.parent_entity, self.child_entity)
        
        # Manually modify inheritance chain in propagation manager
        child_attributes = self.propagation_manager._get_entity_attributes(self.child_entity)
        child_attributes.inheritance_chain = [self.parent_entity]  # Remove root_entity
        self.propagation_manager._update_entity_attributes(self.child_entity, child_attributes)
        
        # Verify propagation and inheritance (should synchronize first)
        result = self.integration.verify_propagation_and_inheritance(self.parent_entity, self.child_entity)
        
        # Verify result
        self.assertTrue(result)
        
        # Verify child's inheritance chain is synchronized
        child_attributes = self.propagation_manager._get_entity_attributes(self.child_entity)
        self.assertIn(self.parent_entity, child_attributes.inheritance_chain)
        self.assertIn(self.root_entity, child_attributes.inheritance_chain)
    
    def test_verify_all_boundaries(self):
        """Test verification of all boundaries for an entity."""
        # Register inheritance relationships
        self.integration.register_inheritance_relationship(self.root_entity, self.parent_entity)
        
        # Verify all boundaries for parent entity
        result = self.integration.verify_all_boundaries(self.parent_entity)
        
        # Verify result
        self.assertTrue(result["verified"])
        self.assertTrue(result["inheritance_verified"])
        self.assertEqual(result["entity_id"], self.parent_entity)
        self.assertEqual(len(result["boundaries"]), 3)
        
        # Verify individual boundary results
        self.assertTrue(result["boundaries"]["high_boundary"]["enforced"])
        self.assertTrue(result["boundaries"]["medium_boundary"]["enforced"])
        self.assertTrue(result["boundaries"]["strict_boundary"]["enforced"])
        
        # Verify all boundaries for child entity
        self.integration.register_inheritance_relationship(self.parent_entity, self.child_entity)
        result = self.integration.verify_all_boundaries(self.child_entity)
        
        # Verify result
        self.assertFalse(result["verified"])
        self.assertTrue(result["inheritance_verified"])
        self.assertEqual(result["entity_id"], self.child_entity)
        
        # Verify individual boundary results
        self.assertFalse(result["boundaries"]["high_boundary"]["enforced"])
        self.assertTrue(result["boundaries"]["medium_boundary"]["enforced"])
        self.assertFalse(result["boundaries"]["strict_boundary"]["enforced"])
    
    def test_unregister_inheritance_relationship(self):
        """Test unregistering inheritance relationships."""
        # Register inheritance relationships
        self.integration.register_inheritance_relationship(self.root_entity, self.parent_entity)
        self.integration.register_inheritance_relationship(self.parent_entity, self.child_entity)
        self.integration.register_inheritance_relationship(self.parent_entity, self.sibling_entity)
        
        # Verify initial inheritance chains
        child_attributes = self.propagation_manager._get_entity_attributes(self.child_entity)
        self.assertIn(self.parent_entity, child_attributes.inheritance_chain)
        self.assertIn(self.root_entity, child_attributes.inheritance_chain)
        
        sibling_attributes = self.propagation_manager._get_entity_attributes(self.sibling_entity)
        self.assertIn(self.parent_entity, sibling_attributes.inheritance_chain)
        self.assertIn(self.root_entity, sibling_attributes.inheritance_chain)
        
        # Unregister relationship between parent and child
        result = self.integration.unregister_inheritance_relationship(self.parent_entity, self.child_entity)
        
        # Verify result
        self.assertTrue(result)
        
        # Verify child's inheritance chain is updated
        child_attributes = self.propagation_manager._get_entity_attributes(self.child_entity)
        self.assertNotIn(self.parent_entity, child_attributes.inheritance_chain)
        self.assertNotIn(self.root_entity, child_attributes.inheritance_chain)
        
        # Verify sibling's inheritance chain is unchanged
        sibling_attributes = self.propagation_manager._get_entity_attributes(self.sibling_entity)
        self.assertIn(self.parent_entity, sibling_attributes.inheritance_chain)
        self.assertIn(self.root_entity, sibling_attributes.inheritance_chain)
    
    def test_descendant_inheritance_chain_updates(self):
        """Test updates to descendant inheritance chains."""
        # Register inheritance relationships
        self.integration.register_inheritance_relationship(self.root_entity, self.parent_entity)
        self.integration.register_inheritance_relationship(self.parent_entity, self.child_entity)
        self.integration.register_inheritance_relationship(self.child_entity, self.grandchild_entity)
        
        # Verify initial inheritance chains
        grandchild_attributes = self.propagation_manager._get_entity_attributes(self.grandchild_entity)
        self.assertIn(self.child_entity, grandchild_attributes.inheritance_chain)
        self.assertIn(self.parent_entity, grandchild_attributes.inheritance_chain)
        self.assertIn(self.root_entity, grandchild_attributes.inheritance_chain)
        
        # Unregister relationship between root and parent
        result = self.integration.unregister_inheritance_relationship(self.root_entity, self.parent_entity)
        
        # Verify result
        self.assertTrue(result)
        
        # Verify parent's inheritance chain is updated
        parent_attributes = self.propagation_manager._get_entity_attributes(self.parent_entity)
        self.assertNotIn(self.root_entity, parent_attributes.inheritance_chain)
        
        # Verify child's inheritance chain is updated
        child_attributes = self.propagation_manager._get_entity_attributes(self.child_entity)
        self.assertIn(self.parent_entity, child_attributes.inheritance_chain)
        self.assertNotIn(self.root_entity, child_attributes.inheritance_chain)
        
        # Verify grandchild's inheritance chain is updated
        grandchild_attributes = self.propagation_manager._get_entity_attributes(self.grandchild_entity)
        self.assertIn(self.child_entity, grandchild_attributes.inheritance_chain)
        self.assertIn(self.parent_entity, grandchild_attributes.inheritance_chain)
        self.assertNotIn(self.root_entity, grandchild_attributes.inheritance_chain)

if __name__ == "__main__":
    unittest.main()
