#!/usr/bin/env python3

# Read the factory file
with open('governance_component_factory.py', 'r') as f:
    content = f.read()

# Add mock fallback pattern to all component creation methods
patterns_to_fix = [
    ('GovernanceIntegratedDecisionEngine', 'MockDecisionFrameworkEngine'),
    ('GovernanceIntegratedEnhancedVeritas', 'MockEnhancedVeritas'),
    ('GovernanceIntegratedCore', 'MockGovernanceCore'),
    ('GovernanceIntegratedReflectionTracker', 'MockReflectionLoopTracker')
]

for real_class, mock_class in patterns_to_fix:
    # Find and replace the instance creation pattern
    old_pattern = f'instance = {real_class}('
    new_pattern = f'''# Create instance with configuration
            if component_class.__name__ == '{real_class}':
                # Real component with backwards compatible parameters
                instance = component_class('''
    
    content = content.replace(old_pattern, new_pattern)
    
    # Add the else clause for mock components
    # This is a bit tricky, so we'll do it manually for each component
    
# Add mock fallback for all components after the real component creation
mock_fallback = '''
            else:
                # Mock component with simple parameters
                instance = component_class(
                    config=config,
                    storage_backend=storage_backend,
                    event_bus=event_bus
                )'''

# Insert mock fallback after each real component creation
# We'll look for the pattern where real components are created and add the mock fallback

# Write the updated content
with open('governance_component_factory.py', 'w') as f:
    f.write(content)

print("Applied component creation patterns")
