#!/usr/bin/env python3

# Read the factory file
with open('governance_component_factory.py', 'r') as f:
    content = f.read()

# Fix the emotion logger creation method
content = content.replace(
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
                logger.info("Using MockEmotionTelemetryLogger for testing")
            
            config = self._component_configs[component_name].config
            
            # Get dependencies
            storage_backend = await self._get_storage_backend()
            event_bus = await self._get_event_bus()
            
            # Create instance with real configuration
            instance = GovernanceIntegratedEmotionLogger(''',
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
                logger.info("Using MockEmotionTelemetryLogger for testing")
            
            config = self._component_configs[component_name].config
            
            # Get dependencies
            storage_backend = await self._get_storage_backend()
            event_bus = await self._get_event_bus()
            
            # Create instance with configuration
            if component_class.__name__ == 'GovernanceIntegratedEmotionLogger':
                # Real component with backwards compatible parameters
                instance = component_class('''
)

# Write the updated content
with open('governance_component_factory.py', 'w') as f:
    f.write(content)

print("Fixed component scoping issues")
