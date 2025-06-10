"""
Test helper for end-to-end tests.

This module provides helper functions and setup for end-to-end tests.
"""

def inject_mocks_into_components(test_instance):
    """
    Inject mock objects into test components to ensure proper test flow.
    
    Args:
        test_instance: The test instance to inject mocks into
    """
    # Inject mocks into UI components
    if hasattr(test_instance, 'governance_health_reporter_ui') and test_instance.governance_health_reporter_ui:
        test_instance.governance_health_reporter_ui.governance_primitive_manager = test_instance.governance_primitive_manager
        
    if hasattr(test_instance, 'trust_metrics_visualizer') and test_instance.trust_metrics_visualizer:
        test_instance.trust_metrics_visualizer.trust_decay_engine = test_instance.trust_decay_engine
        test_instance.trust_metrics_visualizer.governance_primitive_manager = test_instance.governance_primitive_manager
