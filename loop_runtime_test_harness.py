#!/usr/bin/env python3
# loop_runtime_test_harness.py

"""
Test Harness for executing the GovernanceCore and validating its schema-bound loops.

This harness instantiates the GovernanceCore, runs predefined test cases through its
execute_loop method, and captures the outputs to verify adherence to the Resurrection
Codex requirements: emotion telemetry emission, justification logging, and schema
validation for all surfaces.
"""

import json
import sys
import os
import uuid # For generating override signal IDs

# Add the directory containing governance_core.py to the Python path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MGC_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "01_Minimal_Governance_Core_MGC"))
sys.path.append(MGC_DIR)

try:
    from src.core.governance.governance_core import GovernanceCore
except ImportError as e:
    print(f"CRITICAL ERROR: Could not import GovernanceCore. Ensure governance_core.py is in {MGC_DIR}. Error: {e}")
    sys.exit(1)

def run_test_case(core, test_name, loop_input):
    """Runs a single test case against the GovernanceCore."""
    print(f"\n--- Test Case: {test_name} ---")
    print(f"Input: {json.dumps(loop_input, indent=2)}")
    
    initial_log_count = len(core.justification_log)
    initial_emotion_state = core.current_emotion_state.copy() # Deep copy for comparison

    result = core.execute_loop(loop_input)
    
    print(f"\nOutput from execute_loop for {test_name}:")
    print(json.dumps(result, indent=2))
    
    print(f"\nJustification Log Entries for {test_name}:")
    if len(core.justification_log) > initial_log_count:
        for i, entry in enumerate(core.justification_log[initial_log_count:]):
            print(f"Entry {i+1} (Overall {initial_log_count + i + 1}):")
            print(json.dumps(entry, indent=2))
            # Check for new fields in justification log for relevant test cases
            if "Trust-Based Rejection" in test_name or "Override Signal" in test_name:
                assert "trust_score_at_decision" in entry, f"Missing trust_score_at_decision in {test_name}"
                assert "override_signal_received" in entry, f"Missing override_signal_received in {test_name}"
                if entry["override_signal_received"]:
                    assert "override_details" in entry and entry["override_details"] is not None, f"Missing override_details when override_signal_received is true in {test_name}"

    else:
        print("No new justification log entries for this test case.")
        
    print(f"\nEmotion State after {test_name}:")
    print(json.dumps(core.current_emotion_state, indent=2))
    
    print(f"--- End Test Case: {test_name} ---")
    return result

def main():
    print("Initializing Loop Runtime Test Harness for Phase 1.1...")
    core = GovernanceCore()
    print("GovernanceCore instantiated by Test Harness.")

    # Test Case 1: Plan Acceptance (High Trust)
    test_input_accept_high_trust = {
        "loop_id": "harness_loop_trust_001", 
        "plan_id": "harness_plan_trust_accept_001", 
        "plan_details": {"description": "A good plan with positive trust factor.", "trust_factor": 0.2}
    }
    run_test_case(core, "Plan Acceptance (High Trust)", test_input_accept_high_trust)

    # Test Case 2: Plan Rejection (Low Trust)
    test_input_reject_low_trust = {
        "loop_id": "harness_loop_trust_002", 
        "plan_id": "harness_plan_trust_reject_002", 
        "plan_details": {"description": "A risky plan due to very low trust factor.", "trust_factor": -0.5} # Should be below 0.4 threshold
    }
    run_test_case(core, "Plan Rejection (Low Trust)", test_input_reject_low_trust)

    # Test Case 3: Plan Acceptance (Default Trust, no explicit factor)
    test_input_accept_default_trust = {
        "loop_id": "harness_loop_trust_003", 
        "plan_id": "harness_plan_trust_default_003", 
        "plan_details": {"description": "An average plan, should use default trust."}
    }
    run_test_case(core, "Plan Acceptance (Default Trust)", test_input_accept_default_trust)

    # Test Case 4: Loop with VALID Operator Override Signal (Conceptual Recognition)
    valid_override_signal = {
        "override_signal_id": str(uuid.uuid4()),
        "timestamp": core._get_timestamp(),
        "operator_id": "OPERATOR_TEST_001",
        "override_type": "PAUSE_MGC_LOOP", 
        "justification": "Test harness: Valid override signal for conceptual recognition."
    }
    test_input_with_valid_override = {
        "loop_id": "harness_loop_override_001", 
        "plan_id": "harness_plan_override_valid_001", 
        "plan_details": {"description": "Plan processed during a valid override signal."},
        "operator_override_signal": valid_override_signal
    }
    run_test_case(core, "Loop with VALID Operator Override Signal", test_input_with_valid_override)

    # Test Case 5: Loop with INVALID Operator Override Signal (Conceptual Recognition)
    invalid_override_signal = {
        "override_signal_id": str(uuid.uuid4()),
        # "timestamp": core._get_timestamp(), # Intentionally missing timestamp to make it invalid
        "operator_id": "OPERATOR_TEST_002",
        "override_type": "FORCE_ACCEPT_PLAN",
        "justification": "Test harness: Invalid override signal."
    }
    test_input_with_invalid_override = {
        "loop_id": "harness_loop_override_002", 
        "plan_id": "harness_plan_override_invalid_002", 
        "plan_details": {"description": "Plan processed during an invalid override signal attempt."},
        "operator_override_signal": invalid_override_signal
    }
    run_test_case(core, "Loop with INVALID Operator Override Signal", test_input_with_invalid_override)

    # Test Case 6: Plan Rejection (Low Trust) with an Override Signal Present
    # This tests if both trust and override info are logged correctly
    test_input_reject_low_trust_with_override = {
        "loop_id": "harness_loop_trust_override_003", 
        "plan_id": "harness_plan_trust_reject_override_003", 
        "plan_details": {"description": "Low trust plan during an override.", "trust_factor": -0.6},
        "operator_override_signal": valid_override_signal # Reuse the valid one
    }
    run_test_case(core, "Plan Rejection (Low Trust) with Override Signal", test_input_reject_low_trust_with_override)

    print("\n--- Test Harness Execution Complete for Phase 1.1 ---")
    print("\nFinal Justification Log (All Test Cases):")
    if core.justification_log:
        for i, entry in enumerate(core.justification_log):
            print(f"Entry {i+1}:")
            print(json.dumps(entry, indent=2))
    else:
        print("No justification log entries recorded.")
    
    print("\nFinal Emotion State (After All Test Cases):")
    print(json.dumps(core.current_emotion_state, indent=2))

if __name__ == "__main__":
    main()

