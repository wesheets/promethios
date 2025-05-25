"""
Updated Test Suite for Trust Propagation System

This module contains updated test cases for the Trust Propagation System components
including integration tests between Trust Propagation Manager and Trust Inheritance Handler.

Author: Manus
Date: May 24, 2025
Status: Implementation Phase
"""

import unittest
import time
import logging
from typing import Dict, List, Optional, Set

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("TrustPropagationTests")

# Import components to test
from trust_propagation_manager import TrustAttribute, TrustPropagationManager
from trust_inheritance_handler import TrustInheritanceHandler
from trust_propagation_integration import TrustPropagationIntegration

class TestTrustAttribute(unittest.TestCase):
    """Test cases for the TrustAttribute data structure."""
    
    def test_trust_attribute_creation(self):
        """Test creation of trust attributes."""
        # Create a valid trust attribute
        attr = TrustAttribute(entity_id="test_entity")
        self.assertEqual(attr.entity_id, "test_entity")
        self.assertEqual(attr.base_score, 0.0)
        self.assertEqual(attr.context_scores, {})
        self.assertEqual(attr.inheritance_chain, [])
        self.assertIsNone(attr.verification_status)
        self.assertIsNone(attr.tier)
        self.assertEqual(attr.promotion_history, [])
        
        # Create a trust attribute with custom values
        attr = TrustAttribute(
            entity_id="test_entity",
            base_score=0.8,
            context_scores={"security": 0.9, "privacy": 0.7},
            inheritance_chain=["parent1", "parent2"],
            verification_status="verified",
            tier="tier2",
            promotion_history=[{"from": "tier1", "to": "tier2", "timestamp": time.time()}]
        )
        self.assertEqual(attr.entity_id, "test_entity")
        self.assertEqual(attr.base_score, 0.8)
        self.assertEqual(attr.context_scores, {"security": 0.9, "privacy": 0.7})
        self.assertEqual(attr.inheritance_chain, ["parent1", "parent2"])
        self.assertEqual(attr.verification_status, "verified")
        self.assertEqual(attr.tier, "tier2")
        self.assertEqual(len(attr.promotion_history), 1)
    
    def test_trust_attribute_validation(self):
        """Test validation of trust attributes."""
        # Valid attribute
        attr = TrustAttribute(
            entity_id="test_entity",
            base_score=0.8,
            context_scores={"security": 0.9, "privacy": 0.7}
        )
        self.assertTrue(attr.validate())
        
        # Invalid base score (too high)
        attr = TrustAttribute(
            entity_id="test_entity",
            base_score=1.1
        )
        self.assertFalse(attr.validate())
        
        # Invalid base score (too low)
        attr = TrustAttribute(
            entity_id="test_entity",
            base_score=-0.1
        )
        self.assertFalse(attr.validate())
        
        # Invalid context score
        attr = TrustAttribute(
            entity_id="test_entity",
            base_score=0.8,
            context_scores={"security": 1.2}
        )
        self.assertFalse(attr.validate())
        
        # Invalid timestamp (future)
        attr = TrustAttribute(
            entity_id="test_entity",
            base_score=0.8,
            last_updated=time.time() + 3600  # 1 hour in the future
        )
        self.assertFalse(attr.validate())
        
        # Invalid verification status with empty inheritance chain
        attr = TrustAttribute(
            entity_id="test_entity",
            base_score=0.8,
            verification_status="verified",
            inheritance_chain=[]
        )
        self.assertFalse(attr.validate())


class TestTrustPropagationManager(unittest.TestCase):
    """Test cases for the TrustPropagationManager component."""
    
    def setUp(self):
        """Set up test environment."""
        self.manager = TrustPropagationManager()
        
        # Create test attributes
        self.source_attr = TrustAttribute(
            entity_id="source_entity",
            base_score=0.8,
            context_scores={"security": 0.9, "privacy": 0.7}
        )
        
        self.target_attr = TrustAttribute(
            entity_id="target_entity",
            base_score=0.5,
            context_scores={"security": 0.6, "privacy": 0.4}
        )
    
    def test_begin_propagation(self):
        """Test beginning a trust propagation transaction."""
        # Valid propagation
        transaction_id = self.manager.begin_propagation(
            "source_entity", 
            "target_entity", 
            self.target_attr
        )
        self.assertIsNotNone(transaction_id)
        
        # Check transaction status
        status = self.manager.get_transaction_status(transaction_id)
        self.assertEqual(status, "pending")
        
        # Invalid propagation (invalid attributes)
        invalid_attr = TrustAttribute(
            entity_id="target_entity",
            base_score=1.1  # Invalid base score
        )
        transaction_id = self.manager.begin_propagation(
            "source_entity", 
            "target_entity", 
            invalid_attr
        )
        self.assertIsNone(transaction_id)
    
    def test_execute_propagation(self):
        """Test executing a trust propagation transaction."""
        # Begin propagation
        transaction_id = self.manager.begin_propagation(
            "source_entity", 
            "target_entity", 
            self.target_attr
        )
        self.assertIsNotNone(transaction_id)
        
        # Execute propagation (should fail without source attributes)
        success = self.manager.execute_propagation(transaction_id)
        self.assertFalse(success)
        
        # Set source attributes
        self.manager._update_entity_attributes("source_entity", self.source_attr)
        
        # Begin new propagation
        transaction_id = self.manager.begin_propagation(
            "source_entity", 
            "target_entity", 
            self.target_attr
        )
        self.assertIsNotNone(transaction_id)
        
        # Execute propagation (should succeed now)
        success = self.manager.execute_propagation(transaction_id)
        self.assertTrue(success)
        
        # Check transaction status
        status = self.manager.get_transaction_status(transaction_id)
        self.assertEqual(status, "completed")
        
        # Check target attributes
        target_attributes = self.manager._get_entity_attributes("target_entity")
        self.assertIsNotNone(target_attributes)
        self.assertAlmostEqual(target_attributes.base_score, 0.8 * 0.8, places=2)  # 80% of source
        self.assertAlmostEqual(target_attributes.context_scores["security"], 0.9 * 0.8, places=2)
        self.assertAlmostEqual(target_attributes.context_scores["privacy"], 0.7 * 0.8, places=2)
        self.assertIn("source_entity", target_attributes.inheritance_chain)
    
    def test_verify_propagation(self):
        """Test verifying trust propagation."""
        # Set source attributes
        self.manager._update_entity_attributes("source_entity", self.source_attr)
        
        # Begin propagation
        transaction_id = self.manager.begin_propagation(
            "source_entity", 
            "target_entity", 
            self.target_attr
        )
        self.assertIsNotNone(transaction_id)
        
        # Execute propagation
        success = self.manager.execute_propagation(transaction_id)
        self.assertTrue(success)
        
        # Verify propagation
        verified = self.manager.verify_propagation("source_entity", "target_entity")
        self.assertTrue(verified)
        
        # Verify non-existent propagation
        verified = self.manager.verify_propagation("source_entity", "nonexistent_entity")
        self.assertFalse(verified)
        
        # Verify propagation with incorrect inheritance
        target_attributes = self.manager._get_entity_attributes("target_entity")
        target_attributes.inheritance_chain.remove("source_entity")
        self.manager._update_entity_attributes("target_entity", target_attributes)
        
        verified = self.manager.verify_propagation("source_entity", "target_entity")
        self.assertFalse(verified)
    
    def test_rollback_propagation(self):
        """Test rolling back a trust propagation transaction."""
        # Set source attributes
        self.manager._update_entity_attributes("source_entity", self.source_attr)
        
        # Begin propagation
        transaction_id = self.manager.begin_propagation(
            "source_entity", 
            "target_entity", 
            self.target_attr
        )
        self.assertIsNotNone(transaction_id)
        
        # Execute propagation
        success = self.manager.execute_propagation(transaction_id)
        self.assertTrue(success)
        
        # Verify propagation
        verified = self.manager.verify_propagation("source_entity", "target_entity")
        self.assertTrue(verified)
        
        # Begin another propagation
        transaction_id = self.manager.begin_propagation(
            "source_entity", 
            "target_entity", 
            self.target_attr
        )
        self.assertIsNotNone(transaction_id)
        
        # Rollback propagation (should now work with pending transactions)
        success = self.manager.rollback_propagation(transaction_id)
        self.assertTrue(success)
        
        # Check transaction status
        status = self.manager.get_transaction_status(transaction_id)
        self.assertEqual(status, "rolled_back")
    
    def test_propagate_trust(self):
        """Test the main propagate_trust method."""
        # Set source attributes
        self.manager._update_entity_attributes("source_entity", self.source_attr)
        
        # Propagate trust
        success = self.manager.propagate_trust(
            "source_entity", 
            "target_entity", 
            self.target_attr
        )
        self.assertTrue(success)
        
        # Verify propagation
        verified = self.manager.verify_propagation("source_entity", "target_entity")
        self.assertTrue(verified)
        
        # Propagate trust with invalid attributes
        invalid_attr = TrustAttribute(
            entity_id="target_entity",
            base_score=1.1  # Invalid base score
        )
        success = self.manager.propagate_trust(
            "source_entity", 
            "target_entity", 
            invalid_attr
        )
        self.assertFalse(success)


class TestTrustInheritanceHandler(unittest.TestCase):
    """Test cases for the TrustInheritanceHandler component."""
    
    def setUp(self):
        """Set up test environment."""
        self.handler = TrustInheritanceHandler()
        
        # Create test attributes
        self.parent1_attr = TrustAttribute(
            entity_id="parent1",
            base_score=0.8,
            context_scores={"security": 0.9, "privacy": 0.7}
        )
        
        self.parent2_attr = TrustAttribute(
            entity_id="parent2",
            base_score=0.6,
            context_scores={"security": 0.7, "privacy": 0.5, "reliability": 0.8}
        )
        
        self.child_attr = TrustAttribute(
            entity_id="child",
            base_score=0.5,
            context_scores={"security": 0.6, "privacy": 0.4}
        )
        
        self.grandchild_attr = TrustAttribute(
            entity_id="grandchild",
            base_score=0.4,
            context_scores={"security": 0.5, "privacy": 0.3}
        )
    
    def test_register_inheritance_relationship(self):
        """Test registering inheritance relationships."""
        # Register valid relationship
        success = self.handler.register_inheritance_relationship("parent1", "child")
        self.assertTrue(success)
        
        # Register another valid relationship
        success = self.handler.register_inheritance_relationship("parent2", "child")
        self.assertTrue(success)
        
        # Register grandchild relationship
        success = self.handler.register_inheritance_relationship("child", "grandchild")
        self.assertTrue(success)
        
        # Check parents
        parents = self.handler.get_parents("child")
        self.assertEqual(set(parents), {"parent1", "parent2"})
        
        # Check children
        children = self.handler.get_children("parent1")
        self.assertEqual(children, ["child"])
        
        # Check inheritance chain
        chain = self.handler.get_inheritance_chain("grandchild")
        self.assertEqual(set(chain), {"child", "parent1", "parent2"})
        
        # Try to register self-inheritance (should fail)
        success = self.handler.register_inheritance_relationship("child", "child")
        self.assertFalse(success)
        
        # Try to register circular inheritance (should fail)
        success = self.handler.register_inheritance_relationship("grandchild", "parent1")
        self.assertFalse(success)
    
    def test_unregister_inheritance_relationship(self):
        """Test unregistering inheritance relationships."""
        # Register relationships
        self.handler.register_inheritance_relationship("parent1", "child")
        self.handler.register_inheritance_relationship("parent2", "child")
        self.handler.register_inheritance_relationship("child", "grandchild")
        
        # Unregister relationship
        success = self.handler.unregister_inheritance_relationship("parent1", "child")
        self.assertTrue(success)
        
        # Check parents
        parents = self.handler.get_parents("child")
        self.assertEqual(parents, ["parent2"])
        
        # Check children
        children = self.handler.get_children("parent1")
        self.assertEqual(children, [])
        
        # Check inheritance chain
        chain = self.handler.get_inheritance_chain("grandchild")
        self.assertEqual(set(chain), {"child", "parent2"})
        
        # Try to unregister non-existent relationship
        success = self.handler.unregister_inheritance_relationship("parent1", "child")
        self.assertFalse(success)
    
    def test_calculate_inherited_trust(self):
        """Test calculating inherited trust."""
        # Set entity attributes
        self.handler.set_entity_attributes("parent1", self.parent1_attr)
        self.handler.set_entity_attributes("parent2", self.parent2_attr)
        self.handler.set_entity_attributes("child", self.child_attr)
        self.handler.set_entity_attributes("grandchild", self.grandchild_attr)
        
        # Register relationships
        self.handler.register_inheritance_relationship("parent1", "child")
        self.handler.register_inheritance_relationship("parent2", "child")
        self.handler.register_inheritance_relationship("child", "grandchild")
        
        # Calculate inherited trust for child
        inherited = self.handler.calculate_inherited_trust(["parent1", "parent2"], "child")
        self.assertIsNotNone(inherited)
        self.assertEqual(inherited.entity_id, "child")
        
        # Check base score (average of 80% of each parent's score)
        expected_base_score = (0.8 * 0.8 + 0.6 * 0.8) / 2
        self.assertAlmostEqual(inherited.base_score, expected_base_score, places=2)
        
        # Check context scores
        expected_security = (0.9 * 0.8 + 0.7 * 0.8) / 2
        self.assertAlmostEqual(inherited.context_scores["security"], expected_security, places=2)
        
        expected_privacy = (0.7 * 0.8 + 0.5 * 0.8) / 2
        self.assertAlmostEqual(inherited.context_scores["privacy"], expected_privacy, places=2)
        
        # Check reliability (only from parent2)
        expected_reliability = (0.8 * 0.8) / 2
        self.assertAlmostEqual(inherited.context_scores["reliability"], expected_reliability, places=2)
        
        # Check inheritance chain
        self.assertEqual(set(inherited.inheritance_chain), {"parent1", "parent2"})
        
        # Calculate inherited trust for grandchild
        inherited = self.handler.calculate_inherited_trust(["child"], "grandchild")
        self.assertIsNotNone(inherited)
        
        # Check base score (80% of child's score)
        child_attributes = self.handler.get_entity_attributes("child")
        expected_base_score = child_attributes.base_score * 0.8
        self.assertAlmostEqual(inherited.base_score, expected_base_score, places=2)
    
    def test_verify_inheritance_chain(self):
        """Test verifying inheritance chains."""
        # Set entity attributes
        self.handler.set_entity_attributes("parent1", self.parent1_attr)
        self.handler.set_entity_attributes("parent2", self.parent2_attr)
        self.handler.set_entity_attributes("child", self.child_attr)
        self.handler.set_entity_attributes("grandchild", self.grandchild_attr)
        
        # Register relationships
        self.handler.register_inheritance_relationship("parent1", "child")
        self.handler.register_inheritance_relationship("parent2", "child")
        self.handler.register_inheritance_relationship("child", "grandchild")
        
        # Update inherited attributes
        self.handler._update_inherited_attributes("child")
        self.handler._update_inherited_attributes("grandchild")
        
        # Verify inheritance chain (should now pass with updated comparison logic)
        verified = self.handler.verify_inheritance_chain("child")
        self.assertTrue(verified)
        
        verified = self.handler.verify_inheritance_chain("grandchild")
        self.assertTrue(verified)
        
        # Modify attributes to create inconsistency
        child_attributes = self.handler.get_entity_attributes("child")
        child_attributes.base_score = 0.1  # Inconsistent with inheritance
        self.handler.set_entity_attributes("child", child_attributes)
        
        # Verify inheritance chain (should fail)
        verified = self.handler.verify_inheritance_chain("child")
        self.assertFalse(verified)
    
    def test_resolve_inheritance_conflicts(self):
        """Test resolving inheritance conflicts."""
        # Set entity attributes
        self.handler.set_entity_attributes("parent1", self.parent1_attr)
        self.handler.set_entity_attributes("parent2", self.parent2_attr)
        self.handler.set_entity_attributes("child", self.child_attr)
        
        # Register relationships
        self.handler.register_inheritance_relationship("parent1", "child")
        self.handler.register_inheritance_relationship("parent2", "child")
        
        # Modify attributes to create conflict
        child_attributes = self.handler.get_entity_attributes("child")
        child_attributes.base_score = 0.1  # Inconsistent with inheritance
        self.handler.set_entity_attributes("child", child_attributes)
        
        # Verify inheritance chain (should fail)
        verified = self.handler.verify_inheritance_chain("child")
        self.assertFalse(verified)
        
        # Resolve conflicts
        resolved = self.handler.resolve_inheritance_conflicts("child")
        self.assertTrue(resolved)
        
        # Verify inheritance chain (should succeed now)
        verified = self.handler.verify_inheritance_chain("child")
        self.assertTrue(verified)
        
        # Check base score (should be updated)
        child_attributes = self.handler.get_entity_attributes("child")
        expected_base_score = (0.8 * 0.8 + 0.6 * 0.8) / 2
        self.assertAlmostEqual(child_attributes.base_score, expected_base_score, places=2)


class TestTrustPropagationIntegration(unittest.TestCase):
    """Test cases for the TrustPropagationIntegration component."""
    
    def setUp(self):
        """Set up test environment."""
        self.integration = TrustPropagationIntegration()
        
        # Create test attributes
        self.entity1_attr = TrustAttribute(
            entity_id="entity1",
            base_score=0.9,
            context_scores={"security": 0.95, "privacy": 0.85}
        )
        
        self.entity2_attr = TrustAttribute(
            entity_id="entity2",
            base_score=0.7,
            context_scores={"security": 0.75, "privacy": 0.65}
        )
        
        self.entity3_attr = TrustAttribute(
            entity_id="entity3",
            base_score=0.5,
            context_scores={"security": 0.55, "privacy": 0.45}
        )
    
    def test_register_entity(self):
        """Test registering entities with the integration system."""
        # Register entities
        success = self.integration.register_entity("entity1", self.entity1_attr)
        self.assertTrue(success)
        
        success = self.integration.register_entity("entity2", self.entity2_attr)
        self.assertTrue(success)
        
        success = self.integration.register_entity("entity3", self.entity3_attr)
        self.assertTrue(success)
        
        # Check entities in propagation manager
        entity1_prop = self.integration.propagation_manager._get_entity_attributes("entity1")
        self.assertIsNotNone(entity1_prop)
        self.assertEqual(entity1_prop.entity_id, "entity1")
        
        # Check entities in inheritance handler
        entity1_inh = self.integration.inheritance_handler.get_entity_attributes("entity1")
        self.assertIsNotNone(entity1_inh)
        self.assertEqual(entity1_inh.entity_id, "entity1")
    
    def test_register_inheritance_relationship(self):
        """Test registering inheritance relationships with the integration system."""
        # Register entities
        self.integration.register_entity("entity1", self.entity1_attr)
        self.integration.register_entity("entity2", self.entity2_attr)
        self.integration.register_entity("entity3", self.entity3_attr)
        
        # Register inheritance relationships
        success = self.integration.register_inheritance_relationship("entity1", "entity2")
        self.assertTrue(success)
        
        success = self.integration.register_inheritance_relationship("entity2", "entity3")
        self.assertTrue(success)
        
        # Check inheritance relationships in inheritance handler
        parents = self.integration.inheritance_handler.get_parents("entity2")
        self.assertEqual(parents, ["entity1"])
        
        parents = self.integration.inheritance_handler.get_parents("entity3")
        self.assertEqual(parents, ["entity2"])
        
        # Check inheritance chain
        chain = self.integration.inheritance_handler.get_inheritance_chain("entity3")
        self.assertEqual(set(chain), {"entity1", "entity2"})
        
        # Check propagation in propagation manager
        entity2_prop = self.integration.propagation_manager._get_entity_attributes("entity2")
        self.assertIn("entity1", entity2_prop.inheritance_chain)
        
        entity3_prop = self.integration.propagation_manager._get_entity_attributes("entity3")
        self.assertIn("entity2", entity3_prop.inheritance_chain)
    
    def test_verify_propagation_and_inheritance(self):
        """Test verifying propagation and inheritance with the integration system."""
        # Register entities
        self.integration.register_entity("entity1", self.entity1_attr)
        self.integration.register_entity("entity2", self.entity2_attr)
        self.integration.register_entity("entity3", self.entity3_attr)
        
        # Register inheritance relationships
        self.integration.register_inheritance_relationship("entity1", "entity2")
        self.integration.register_inheritance_relationship("entity2", "entity3")
        
        # Verify propagation and inheritance
        verified = self.integration.verify_propagation_and_inheritance("entity1", "entity2")
        self.assertTrue(verified)
        
        verified = self.integration.verify_propagation_and_inheritance("entity2", "entity3")
        self.assertTrue(verified)
    
    def test_synchronize_attributes(self):
        """Test synchronizing attributes between propagation and inheritance systems."""
        # Register entities
        self.integration.register_entity("entity1", self.entity1_attr)
        self.integration.register_entity("entity2", self.entity2_attr)
        
        # Register inheritance relationship
        self.integration.register_inheritance_relationship("entity1", "entity2")
        
        # Modify attributes in propagation manager
        entity2_prop = self.integration.propagation_manager._get_entity_attributes("entity2")
        entity2_prop.base_score = 0.6  # Different from inherited value
        self.integration.propagation_manager._update_entity_attributes("entity2", entity2_prop)
        
        # Synchronize attributes
        success = self.integration.synchronize_attributes("entity2")
        self.assertTrue(success)
        
        # Check synchronized attributes
        entity2_prop = self.integration.propagation_manager._get_entity_attributes("entity2")
        entity2_inh = self.integration.inheritance_handler.get_entity_attributes("entity2")
        
        # Both should have the same base score now
        self.assertAlmostEqual(entity2_prop.base_score, entity2_inh.base_score, places=2)
        
        # Both should have the same inheritance chain
        self.assertEqual(set(entity2_prop.inheritance_chain), set(entity2_inh.inheritance_chain))
    
    def test_propagation_and_inheritance(self):
        """Test integration of propagation and inheritance."""
        # Register entities
        self.integration.register_entity("entity1", self.entity1_attr)
        self.integration.register_entity("entity2", self.entity2_attr)
        self.integration.register_entity("entity3", self.entity3_attr)
        
        # Register inheritance relationships
        success = self.integration.register_inheritance_relationship("entity1", "entity2")
        self.assertTrue(success)
        
        success = self.integration.register_inheritance_relationship("entity2", "entity3")
        self.assertTrue(success)
        
        # Verify propagation
        verified = self.integration.propagation_manager.verify_propagation("entity1", "entity2")
        self.assertTrue(verified)
        
        verified = self.integration.propagation_manager.verify_propagation("entity2", "entity3")
        self.assertTrue(verified)
        
        # Verify inheritance chain
        verified = self.integration.inheritance_handler.verify_inheritance_chain("entity2")
        self.assertTrue(verified)
        
        verified = self.integration.inheritance_handler.verify_inheritance_chain("entity3")
        self.assertTrue(verified)
        
        # Check multi-level inheritance
        chain = self.integration.inheritance_handler.get_inheritance_chain("entity3")
        self.assertEqual(set(chain), {"entity1", "entity2"})
        
        # Check base score for entity3
        entity3_attributes = self.integration.inheritance_handler.get_entity_attributes("entity3")
        
        # entity3 should inherit from entity2, which inherits from entity1
        # entity1 base score: 0.9
        # entity2 base score: 0.9 * 0.8 = 0.72
        # entity3 base score: 0.72 * 0.8 = 0.576
        expected_base_score = 0.9 * 0.8 * 0.8
        self.assertAlmostEqual(entity3_attributes.base_score, expected_base_score, places=2)


if __name__ == "__main__":
    unittest.main()
