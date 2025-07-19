#!/usr/bin/env python3
"""
Fix Event Bus Method Calls

This script fixes all publish_event calls to use the correct publish method
with proper GovernanceEvent objects.
"""

import re

def fix_event_bus_calls():
    """Fix all event bus method calls in the enhanced factory"""
    
    # Read the file
    with open('enhanced_real_component_factory.py', 'r') as f:
        content = f.read()
    
    # Pattern to match publish_event calls
    pattern = r'await self\.event_bus\.publish_event\(\{([^}]+)\}\)'
    
    def replace_publish_call(match):
        # Extract the event data
        event_data = match.group(1)
        
        # Create the replacement with proper GovernanceEvent
        replacement = f"""# Create and publish governance event
                try:
                    from governance_event_bus import GovernanceEvent
                    event_data = {{{event_data}}}
                    governance_event = GovernanceEvent(
                        id=str(uuid.uuid4()),
                        type=event_data.get('type', 'unknown'),
                        component=event_data.get('component', 'unknown'),
                        timestamp=datetime.now(),
                        priority='MEDIUM',
                        data=event_data
                    )
                    await self.event_bus.publish(governance_event)
                except Exception as e:
                    self.logger.warning(f"Could not publish event: {{e}}")
                    # Continue without event publishing"""
        
        return replacement
    
    # Replace all occurrences
    fixed_content = re.sub(pattern, replace_publish_call, content, flags=re.DOTALL)
    
    # Write back to file
    with open('enhanced_real_component_factory.py', 'w') as f:
        f.write(fixed_content)
    
    print("✅ Fixed all event bus method calls")

if __name__ == "__main__":
    fix_event_bus_calls()

