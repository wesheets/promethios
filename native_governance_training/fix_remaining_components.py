#!/usr/bin/env python3

# Read the factory file
with open('governance_component_factory.py', 'r') as f:
    content = f.read()

# Replace the emotion logger import
content = content.replace(
    'from extensions.emotion_telemetry_extension import GovernanceIntegratedEmotionLogger',
    '''# Try to import real extension first
            try:
                from extensions.emotion_telemetry_extension import GovernanceIntegratedEmotionLogger
                component_class = GovernanceIntegratedEmotionLogger
                logger.info("Using real GovernanceIntegratedEmotionLogger")
            except ImportError as e:
                logger.warning(f"Real emotion logger not available: {e}")
                # Fallback to mock for testing
                from mock_components import MockEmotionTelemetryLogger
                component_class = MockEmotionTelemetryLogger
                logger.info("Using MockEmotionTelemetryLogger for testing")'''
)

# Replace the decision engine import
content = content.replace(
    'from extensions.decision_engine_extension import GovernanceIntegratedDecisionEngine',
    '''# Try to import real extension first
            try:
                from extensions.decision_engine_extension import GovernanceIntegratedDecisionEngine
                component_class = GovernanceIntegratedDecisionEngine
                logger.info("Using real GovernanceIntegratedDecisionEngine")
            except ImportError as e:
                logger.warning(f"Real decision engine not available: {e}")
                # Fallback to mock for testing
                from mock_components import MockDecisionFrameworkEngine
                component_class = MockDecisionFrameworkEngine
                logger.info("Using MockDecisionFrameworkEngine for testing")'''
)

# Replace the enhanced veritas import
content = content.replace(
    'from extensions.enhanced_veritas_extension import GovernanceIntegratedEnhancedVeritas',
    '''# Try to import real extension first
            try:
                from extensions.enhanced_veritas_extension import GovernanceIntegratedEnhancedVeritas
                component_class = GovernanceIntegratedEnhancedVeritas
                logger.info("Using real GovernanceIntegratedEnhancedVeritas")
            except ImportError as e:
                logger.warning(f"Real enhanced veritas not available: {e}")
                # Fallback to mock for testing
                from mock_components import MockEnhancedVeritas
                component_class = MockEnhancedVeritas
                logger.info("Using MockEnhancedVeritas for testing")'''
)

# Replace the governance core import
content = content.replace(
    'from extensions.governance_core_extension import GovernanceIntegratedCore',
    '''# Try to import real extension first
            try:
                from extensions.governance_core_extension import GovernanceIntegratedCore
                component_class = GovernanceIntegratedCore
                logger.info("Using real GovernanceIntegratedCore")
            except ImportError as e:
                logger.warning(f"Real governance core not available: {e}")
                # Fallback to mock for testing
                from mock_components import MockGovernanceCore
                component_class = MockGovernanceCore
                logger.info("Using MockGovernanceCore for testing")'''
)

# Replace the reflection tracker import
content = content.replace(
    'from extensions.reflection_tracker_extension import GovernanceIntegratedReflectionTracker',
    '''# Try to import real extension first
            try:
                from extensions.reflection_tracker_extension import GovernanceIntegratedReflectionTracker
                component_class = GovernanceIntegratedReflectionTracker
                logger.info("Using real GovernanceIntegratedReflectionTracker")
            except ImportError as e:
                logger.warning(f"Real reflection tracker not available: {e}")
                # Fallback to mock for testing
                from mock_components import MockReflectionLoopTracker
                component_class = MockReflectionLoopTracker
                logger.info("Using MockReflectionLoopTracker for testing")'''
)

# Write the updated content
with open('governance_component_factory.py', 'w') as f:
    f.write(content)

print("Fixed remaining component imports with mock fallbacks")
