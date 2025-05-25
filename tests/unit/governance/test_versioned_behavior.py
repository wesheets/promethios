"""
Test suite for the Versioned Behavior System in Promethios.

This module contains unit tests for the Versioned Behavior System,
ensuring that behavior versioning, context management, and semantic shift detection work correctly.
"""

import os
import sys
import unittest
import threading
from unittest.mock import patch, MagicMock

# Add the repository root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from src.versioned_behavior.core import (
    BehaviorVersion, BehaviorContext, BehaviorRegistry,
    BehaviorConfig, with_behavior_version, SemanticShiftDetector
)


class TestVersionedBehaviorSystem(unittest.TestCase):
    """Test cases for the Versioned Behavior System."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Reset behavior registry for each test
        BehaviorRegistry._behaviors = {}
        
        # Reset thread locals
        if hasattr(BehaviorContext._thread_local, "stack"):
            BehaviorContext._thread_local.stack = []
        
        if hasattr(BehaviorRegistry._thread_local, "active_version"):
            delattr(BehaviorRegistry._thread_local, "active_version")
        
        # Reset config
        BehaviorConfig.DEFAULT_VERSION = "6.4.0"
        BehaviorConfig.LEGACY_COMPATIBILITY = True
        BehaviorConfig.VERSION_OVERRIDE = None
        BehaviorConfig.STRICT_MODE = False
        
        # Register test behaviors
        def test_behavior_pre_6_4(arg):
            return f"pre_6.4: {arg}"
        
        def test_behavior_6_4_0(arg):
            return f"6.4.0: {arg}"
        
        BehaviorRegistry.register("test_behavior", "pre_6.4", test_behavior_pre_6_4)
        BehaviorRegistry.register("test_behavior", "6.4.0", test_behavior_6_4_0)
    
    def test_behavior_version_from_string(self):
        """Test that BehaviorVersion can be created from a string."""
        # Test pre_6.4 special version
        version = BehaviorVersion.from_string("pre_6.4")
        self.assertEqual(version.major, 6)
        self.assertEqual(version.minor, 3)
        self.assertEqual(version.patch, 0)
        self.assertEqual(version.label, "pre_6.4")
        self.assertEqual(str(version), "pre_6.4")
        
        # Test semantic version
        version = BehaviorVersion.from_string("6.4.0")
        self.assertEqual(version.major, 6)
        self.assertEqual(version.minor, 4)
        self.assertEqual(version.patch, 0)
        self.assertIsNone(version.label)
        self.assertEqual(str(version), "6.4.0")
        
        # Test version with label
        version = BehaviorVersion.from_string("6.4.0-beta")
        self.assertEqual(version.major, 6)
        self.assertEqual(version.minor, 4)
        self.assertEqual(version.patch, 0)
        self.assertEqual(version.label, "beta")
        self.assertEqual(str(version), "6.4.0-beta")
    
    def test_behavior_version_comparison(self):
        """Test that BehaviorVersion comparison works correctly."""
        v1 = BehaviorVersion.from_string("6.3.0")
        v2 = BehaviorVersion.from_string("6.4.0")
        v3 = BehaviorVersion.from_string("6.4.1")
        v4 = BehaviorVersion.from_string("7.0.0")
        v5 = BehaviorVersion.from_string("pre_6.4")
        
        # Test less than
        self.assertTrue(v1 < v2)
        self.assertTrue(v2 < v3)
        self.assertTrue(v3 < v4)
        self.assertTrue(v5 < v2)  # pre_6.4 < 6.4.0
        
        # Test equality
        self.assertEqual(v1, BehaviorVersion.from_string("6.3.0"))
        self.assertEqual(v5, BehaviorVersion.from_string("pre_6.4"))
        
        # Test compatibility
        self.assertTrue(v1.is_compatible_with(v1))
        self.assertTrue(v2.is_compatible_with(v3))  # Same major version
        self.assertFalse(v2.is_compatible_with(v4))  # Different major version
        self.assertFalse(v5.is_compatible_with(v2))  # pre_6.4 not compatible with 6.4.0
    
    def test_behavior_context(self):
        """Test that BehaviorContext manages thread-local behavior versions."""
        # Default context
        self.assertEqual(str(BehaviorContext.current().version), "6.4.0")
        
        # Explicit context
        with BehaviorContext("pre_6.4"):
            self.assertEqual(str(BehaviorContext.current().version), "pre_6.4")
            
            # Nested context
            with BehaviorContext("6.4.0"):
                self.assertEqual(str(BehaviorContext.current().version), "6.4.0")
            
            # Back to outer context
            self.assertEqual(str(BehaviorContext.current().version), "pre_6.4")
        
        # Back to default
        self.assertEqual(str(BehaviorContext.current().version), "6.4.0")
    
    def test_behavior_registry(self):
        """Test that BehaviorRegistry manages behavior implementations."""
        # Get behavior with default version (6.4.0)
        behavior = BehaviorRegistry.get_behavior("test_behavior")
        self.assertEqual(behavior("test"), "6.4.0: test")
        
        # Get behavior with explicit version
        with BehaviorContext("pre_6.4"):
            behavior = BehaviorRegistry.get_behavior("test_behavior")
            self.assertEqual(behavior("test"), "pre_6.4: test")
    
    def test_with_behavior_version_decorator(self):
        """Test that with_behavior_version decorator works correctly."""
        # Define a function with explicit version
        @with_behavior_version("pre_6.4")
        def test_function():
            behavior = BehaviorRegistry.get_behavior("test_behavior")
            return behavior("test")
        
        # Call the function
        result = test_function()
        self.assertEqual(result, "pre_6.4: test")
        
        # Verify that the version is reset after the function call
        behavior = BehaviorRegistry.get_behavior("test_behavior")
        self.assertEqual(behavior("test"), "6.4.0: test")
    
    def test_semantic_shift_detector(self):
        """Test that SemanticShiftDetector detects behavioral changes."""
        detector = SemanticShiftDetector(BehaviorVersion.from_string("pre_6.4"))
        
        # Define test states
        before_state = {"state": "running", "termination_reason": "resource_limit"}
        after_state_pre_6_4 = {"state": "completed", "termination_reason": "resource_limit"}
        after_state_6_4_0 = {"state": "aborted", "termination_reason": "resource_limit"}
        
        # Check with compatible states (no violation)
        detector.check_state_transition("loop_termination", before_state, after_state_pre_6_4)
        self.assertEqual(len(detector.violations), 0)
        
        # Check with incompatible states (violation)
        with patch.object(BehaviorRegistry, "get_active_version", 
                         return_value=BehaviorVersion.from_string("6.4.0")):
            detector.check_state_transition("loop_termination", before_state, after_state_6_4_0)
            self.assertEqual(len(detector.violations), 1)
            self.assertEqual(detector.violations[0]["operation"], "loop_termination")
            self.assertEqual(detector.violations[0]["expected_version"], "pre_6.4")
            self.assertEqual(detector.violations[0]["actual_version"], "6.4.0")


if __name__ == '__main__':
    unittest.main()
