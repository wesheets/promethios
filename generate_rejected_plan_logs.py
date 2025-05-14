#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""generate_rejected_plan_logs.py: Script to generate logs for rejected plans, including operator overrides."""

import json
import os
import uuid
import time
from datetime import datetime
import requests # Ensure 'requests' is installed: pip3 install requests

# Configuration
LOG_DIR = "./logs" # Assumes script is run from promethios_repo root
RUNTIME_EXECUTOR_ENDPOINT = "http://localhost:8000/loop/execute"
NUM_DISTINCT_REJECTED_PLANS = 5

# Ensure PROMETHIOS_KERNEL_PATH is set in the environment where runtime_executor.py is started.


def generate_distinct_rejected_plan_with_override(iteration):
    """Generates logs for a distinct rejected plan scenario with an operator override."""
    request_id = f"audit_rejected_override_distinct_{iteration}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{str(uuid.uuid4())[:8]}"
    # Vary the payload slightly for distinctness
    task_descriptions = [
        "Attempt a task requiring teleportation of a large whale for audit.",
        "Attempt to reverse entropy in a closed system for audit.",
        "Attempt to prove P=NP within 1 second for audit.",
        "Attempt to build a Dyson sphere around a black hole for audit.",
        "Attempt to communicate with past civilizations using only a toaster for audit."
    ]
    complexity_levels = ["extreme", "impossible", "computationally_infeasible", "cosmic_engineering", "absurd"]
    
    payload = {
        "request_id": request_id,
        "plan_input": {
            "task_description": task_descriptions[iteration % len(task_descriptions)],
            "complexity_level": complexity_levels[iteration % len(complexity_levels)],
            "safety_critical": True,
            "context_data": {
                "constraints": [f"Constraint set {iteration+1}a", f"Constraint set {iteration+1}b"],
                "desired_outcome": f"Achieve impossible outcome variant {iteration+1}"
            }
        },
        "operator_override_signal": {
            "override_type": "REJECT_PLAN_AND_HALT", 
            "reason": f"Audit test {iteration+1}: Operator overriding a clearly unfeasible plan.",
            "authorization_code": f"AUDIT_OVERRIDE_AUTH_{iteration+1:03d}"
        }
    }

    print(f"--- Generating Distinct Rejected Plan with Override (Request ID: {request_id}) ---")
    try:
        response = requests.post(RUNTIME_EXECUTOR_ENDPOINT, json=payload, timeout=60)
        response.raise_for_status() 
        
        print(f"Execution Status Code: {response.status_code}")
        print(f"Response Body (first 200 chars): {response.text[:200]}...")
        print(f"--- Distinct Rejected Plan with Override Log Generation Attempt Completed (Iteration {iteration+1}) ---")
        
        os.makedirs(LOG_DIR, exist_ok=True)
        input_payload_file = os.path.join(LOG_DIR, f"rejected_plan_override_input_{request_id}.json")
        with open(input_payload_file, 'w') as f:
            json.dump(payload, f, indent=2)
        print(f"Saved input payload to: {input_payload_file}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"Error: Could not connect or received error from server: {e}")
        return False
    except Exception as e:
        print(f"Error during execution: {e}")
        return False

def main():
    print("Starting Log Generation for Multiple Distinct Rejected Plan Scenarios (Audit)..." )
    print(f"IMPORTANT: Ensure the Promethios runtime_executor.py FastAPI server is running and accessible at {RUNTIME_EXECUTOR_ENDPOINT}")
    print(f"IMPORTANT: Ensure runtime_executor.py is started with PROMETHIOS_KERNEL_PATH pointing to the correct actual kernel.")
    print(f"Log files will be appended to in the '{LOG_DIR}' directory (relative to where runtime_executor.py is running).")

    successful_generations = 0
    for i in range(NUM_DISTINCT_REJECTED_PLANS):
        print(f"\nAttempting generation for distinct rejected plan {i+1} of {NUM_DISTINCT_REJECTED_PLANS}...")
        if generate_distinct_rejected_plan_with_override(i):
            successful_generations += 1
        else:
            print(f"Failed to generate logs for distinct rejected plan {i+1}.")
        if i < NUM_DISTINCT_REJECTED_PLANS - 1:
            print("Waiting 2 seconds before next distinct scenario...")
            time.sleep(2) # Brief pause between distinct calls
            
    print(f"\nSummary for Distinct Rejected Plan Log Generation:")
    print(f"Total distinct scenarios attempted: {NUM_DISTINCT_REJECTED_PLANS}")
    print(f"Successfully attempted generations: {successful_generations}")

    if successful_generations == NUM_DISTINCT_REJECTED_PLANS:
        print("Successfully attempted generation of all distinct rejected plan with override logs.")
        print("Please verify the contents of the emotion telemetry and justification logs.")
    else:
        print("Not all distinct rejected plan log generations were successful. Check server status and logs.")

if __name__ == "__main__":
    main()

