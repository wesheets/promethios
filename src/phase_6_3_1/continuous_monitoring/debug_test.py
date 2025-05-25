"""
Debug script for inheritance loop detection test.
"""

import logging
import sys
from monitoring_framework import MonitoringFramework
from governance_inheritance_monitor import GovernanceInheritanceMonitor

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

# Create framework and monitor
framework = MonitoringFramework()
monitor = GovernanceInheritanceMonitor("debug_monitor", framework)
framework.register_monitor(monitor)

# Set up test data with an inheritance loop
test_chain_data = {
    "entity1": {
        "declared_chain": ["parent1", "grandparent1", "entity1"],  # Loop back to entity1
        "actual_chain": ["parent1", "grandparent1", "entity1"]
    }
}

# Set test data
print("Setting test data...")
monitor.set_test_data(chain_data=test_chain_data)

# Debug the _has_inheritance_loop function
chain = test_chain_data["entity1"]["actual_chain"]
print(f"Testing chain: {chain}")
has_loop = monitor._has_inheritance_loop(chain)
print(f"Has loop: {has_loop}")
loop_indicators = monitor._find_loop_indicators(chain)
print(f"Loop indicators: {loop_indicators}")

# Execute monitor
print("Executing monitor...")
monitor.verify_inheritance_chains()

# Check events
events = [e for e in framework.event_history if e.event_type == "inheritance_loop_detected"]
print(f"Number of inheritance_loop_detected events: {len(events)}")
if events:
    print(f"Event details: {events[0].details}")
    print(f"Event severity: {events[0].severity}")
else:
    print("No inheritance_loop_detected events found")

# Check all events
print("\nAll events:")
for i, event in enumerate(framework.event_history):
    print(f"{i+1}. {event.event_type}: {event.details}")
