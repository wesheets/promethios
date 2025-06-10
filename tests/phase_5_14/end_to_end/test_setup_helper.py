"""
Test setup helper for end-to-end tests.

This module provides helper functions for setting up end-to-end tests
and ensuring proper mock injection and configuration.
"""

def inject_mocks_into_test_components(test_instance):
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
        
    if hasattr(test_instance, 'governance_dashboard') and test_instance.governance_dashboard:
        test_instance.governance_dashboard.governance_primitive_manager = test_instance.governance_primitive_manager
        test_instance.governance_dashboard.trust_decay_engine = test_instance.trust_decay_engine
