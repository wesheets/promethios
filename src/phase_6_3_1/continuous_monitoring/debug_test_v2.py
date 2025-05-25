"""
Debug script for inheritance loop detection with version verification.
"""

import logging
import sys
import inspect
from monitoring_framework import MonitoringFramework
from governance_inheritance_monitor import GovernanceInheritanceMonitor

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

# Print the source code of the _has_inheritance_loop function to verify we're using the latest version
print("=== VERIFYING CODE VERSION ===")
print(inspect.getsource(GovernanceInheritanceMonitor._has_inheritance_loop))
print("=== END CODE VERIFICATION ===\n")

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

# Debug the _find_loop_indicators function
loop_indicators = monitor._find_loop_indicators(chain)
print(f"Loop indicators: {loop_indicators}")

# Add a direct test of the loop detection logic
print("\nDirect test of loop detection:")
test_chains = [
    ["A", "B", "C"],                  # No loop
    ["A", "B", "A"],                  # Loop with A
    ["A", "B", "C", "B"],             # Loop with B
    ["parent1", "grandparent1", "entity1"]  # Test case from test
]

for i, test_chain in enumerate(test_chains):
    has_loop = monitor._has_inheritance_loop(test_chain)
    indicators = monitor._find_loop_indicators(test_chain)
    print(f"Chain {i+1}: {test_chain}")
    print(f"  Has loop: {has_loop}")
    print(f"  Loop indicators: {indicators}")

# Execute monitor with debug tracing
print("\nExecuting monitor with debug tracing...")
# Add a debug wrapper to verify_inheritance_chains
original_verify = monitor.verify_inheritance_chains
def debug_verify():
    print("Entering verify_inheritance_chains")
    for entity_id, chain_data in monitor._test_chain_data.items():
        print(f"Processing entity: {entity_id}")
        print(f"  declared_chain: {chain_data.get('declared_chain', [])}")
        print(f"  actual_chain: {chain_data.get('actual_chain', [])}")
        actual_chain = chain_data.get('actual_chain', [])
        has_loop = monitor._has_inheritance_loop(actual_chain)
        print(f"  Has loop: {has_loop}")
        if has_loop:
            print(f"  Loop indicators: {monitor._find_loop_indicators(actual_chain)}")
            print("  Should emit inheritance_loop_detected event")
    original_verify()
    print("Exited verify_inheritance_chains")

# Replace the method with our debug version
monitor.verify_inheritance_chains = debug_verify

# Execute the monitor
monitor.verify_inheritance_chains()

# Check events
events = [e for e in framework.event_history if e.event_type == "inheritance_loop_detected"]
print(f"\nNumber of inheritance_loop_detected events: {len(events)}")
if events:
    print(f"Event details: {events[0].details}")
    print(f"Event severity: {events[0].severity}")
else:
    print("No inheritance_loop_detected events found")

# Check all events
print("\nAll events:")
for i, event in enumerate(framework.event_history):
    print(f"{i+1}. {event.event_type}: {event.details}")

# Check if emit_event is working for other event types
print("\nTesting emit_event functionality...")
monitor.emit_event(
    event_type="test_event",
    details={"test": "data"},
    severity=3
)

test_events = [e for e in framework.event_history if e.event_type == "test_event"]
print(f"Number of test events: {len(test_events)}")
if test_events:
    print(f"Test event details: {test_events[0].details}")
    print(f"Test event severity: {test_events[0].severity}")
