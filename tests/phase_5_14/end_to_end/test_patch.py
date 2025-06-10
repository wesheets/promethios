"""
Patch for TestGovernanceVisualizationE2E to inject mocks properly.

This module patches the TestGovernanceVisualizationE2E class to ensure
proper mock injection and test setup.
"""

from unittest.mock import patch
import sys
import os

# Add the src directory to the path so we can import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

def patch_test_class():
    """
    Patch the TestGovernanceVisualizationE2E class to inject mocks properly.
    """
    from tests.phase_5_14.end_to_end.test_governance_visualization_e2e import TestGovernanceVisualizationE2E
    
    # Store the original setUp method
    original_setUp = TestGovernanceVisualizationE2E.setUp
    
    def patched_setUp(self):
        """
        Patched setUp method that injects mocks into UI components.
        """
        # Call the original setUp
        original_setUp(self)
        
        # Inject mocks into UI components
        if hasattr(self, 'governance_health_reporter_ui') and self.governance_health_reporter_ui:
            self.governance_health_reporter_ui.governance_primitive_manager = self.governance_primitive_manager
            
        if hasattr(self, 'trust_metrics_visualizer') and self.trust_metrics_visualizer:
            self.trust_metrics_visualizer.trust_decay_engine = self.trust_decay_engine
            self.trust_metrics_visualizer.governance_primitive_manager = self.governance_primitive_manager
            
        if hasattr(self, 'governance_dashboard') and self.governance_dashboard:
            self.governance_dashboard.governance_primitive_manager = self.governance_primitive_manager
            self.governance_dashboard.trust_decay_engine = self.trust_decay_engine
    
    # Replace the setUp method
    TestGovernanceVisualizationE2E.setUp = patched_setUp
