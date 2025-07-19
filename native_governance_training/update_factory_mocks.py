#!/usr/bin/env python3
import re

# Read the factory file
with open('governance_component_factory.py', 'r') as f:
    content = f.read()

# Define the mock mappings
mock_mappings = {
    'GovernanceIntegratedEmotionLogger': 'MockEmotionTelemetryLogger',
    'GovernanceIntegratedDecisionEngine': 'MockDecisionFrameworkEngine', 
    'GovernanceIntegratedEnhancedVeritas': 'MockEnhancedVeritas',
    'GovernanceIntegratedCore': 'MockGovernanceCore',
    'GovernanceIntegratedReflectionTracker': 'MockReflectionLoopTracker'
}

# Update each component creation method
for real_class, mock_class in mock_mappings.items():
    # Find the import pattern and replace with try/except
    import_pattern = f'from extensions\\..*? import {real_class}'
    
    replacement = f'''# Try to import real extension first
            try:
                from extensions.{real_class.lower().replace('governanceintegrated', '').replace('governance', '')}_extension import {real_class}
                component_class = {real_class}
                logger.info("Using real {real_class}")
            except ImportError as e:
                logger.warning(f"Real component not available: {{e}}")
                # Fallback to mock for testing
                from mock_components import {mock_class}
                component_class = {mock_class}
                logger.info("Using {mock_class} for testing")'''
    
    content = re.sub(import_pattern, replacement, content)

# Write the updated content
with open('governance_component_factory.py', 'w') as f:
    f.write(content)

print("Updated factory with mock fallbacks")
