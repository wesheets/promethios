#!/usr/bin/env python3

# Read the factory file
with open('governance_component_factory.py', 'r') as f:
    lines = f.readlines()

# Find and fix each component creation method
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    new_lines.append(line)
    
    # Look for component creation patterns that need mock fallbacks
    if 'instance = component_class(' in line and 'else:' not in lines[i-5:i+5]:
        # Add mock fallback after the real component creation
        # Find the end of the real component creation (look for closing parenthesis)
        j = i + 1
        paren_count = line.count('(') - line.count(')')
        while j < len(lines) and paren_count > 0:
            new_lines.append(lines[j])
            paren_count += lines[j].count('(') - lines[j].count(')')
            j += 1
        
        # Add the mock fallback
        indent = '            '
        new_lines.append(f'{indent}else:\n')
        new_lines.append(f'{indent}    # Mock component with simple parameters\n')
        new_lines.append(f'{indent}    instance = component_class(\n')
        new_lines.append(f'{indent}        config=config,\n')
        new_lines.append(f'{indent}        storage_backend=storage_backend,\n')
        new_lines.append(f'{indent}        event_bus=event_bus\n')
        new_lines.append(f'{indent}    )\n')
        
        i = j
        continue
    
    i += 1

# Write the updated content
with open('governance_component_factory.py', 'w') as f:
    f.writelines(new_lines)

print("Added mock fallbacks to all component creation methods")
