#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""test_deterministic_replay.py: Script to test deterministic replay of Promethios Core by making HTTP requests."""

import json
import os
import uuid
import time
from datetime import datetime
import requests # Ensure 'requests' is installed: pip3 install requests

# Configuration
NUM_REPLAYS = 3
LOG_DIR = "./logs" # Assumes script is run from promethios_repo root
RUNTIME_EXECUTOR_ENDPOINT = "http://localhost:8000/loop/execute"

# Ensure PROMETHIOS_KERNEL_PATH is set in the environment where runtime_executor.py is started.
# This script does not directly control the kernel path for a separate server process.

FIXED_REQUEST_ID_FOR_REPLAY_TEST = f"audit_replay_test_{datetime.now().strftime('%Y%m%d%H%M%S')}_{str(uuid.uuid4())[:8]}"

SAMPLE_LOOP_EXECUTE_INPUT = {
    "request_id": FIXED_REQUEST_ID_FOR_REPLAY_TEST, # This will be the *same* for each of the 3+ calls
    "plan_input": {
        "task_description": "Execute a deterministic task for audit replay testing.",
        "complexity_level": "medium",
        "context_data": {
            "previous_attempts": 0,
            "relevant_knowledge_ids": ["kn_audit_replay_1", "kn_audit_replay_2"]
        }
    },
    "operator_override_signal": None # Ensuring no override for pure determinism test
}

def run_single_execution(input_payload, execution_num):
    """Runs a single execution by making an HTTP POST request to the runtime_executor."""
    print(f"--- Starting Execution {execution_num} for Replay Test (Request ID: {input_payload['request_id']}) ---")
    try:
        response = requests.post(RUNTIME_EXECUTOR_ENDPOINT, json=input_payload, timeout=60)
        response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
        
        print(f"Execution {execution_num} Status Code: {response.status_code}")
        print(f"Execution {execution_num} Response Body (first 200 chars): {response.text[:200]}...")
        print(f"--- Execution {execution_num} Completed ---")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error: Execution {execution_num} failed. Could not connect or received error from server: {e}")
        return False
    except Exception as e:
        print(f"Error during execution {execution_num}: {e}")
        return False

def main():
    print("Starting Deterministic Replay Test for Audit...")
    print(f"IMPORTANT: Ensure the Promethios runtime_executor.py FastAPI server is running and accessible at {RUNTIME_EXECUTOR_ENDPOINT}")
    print(f"IMPORTANT: Ensure runtime_executor.py is started with PROMETHIOS_KERNEL_PATH pointing to the correct actual kernel.")
    print(f"Log files will be appended to in the '{LOG_DIR}' directory (relative to where runtime_executor.py is running).")
    
    # Create LOG_DIR if it doesn't exist locally for saving the input payload
    # Note: runtime_executor.py will handle creation of its own log directory if needed.
    os.makedirs(LOG_DIR, exist_ok=True) 

    input_payload_file = os.path.join(LOG_DIR, f"deterministic_replay_input_{FIXED_REQUEST_ID_FOR_REPLAY_TEST}.json")
    with open(input_payload_file, 'w') as f:
        json.dump(SAMPLE_LOOP_EXECUTE_INPUT, f, indent=2)
    print(f"Saved replay input payload to: {input_payload_file}")

    successful_runs = 0
    for i in range(1, NUM_REPLAYS + 1):
        print(f"Waiting 2 seconds before next execution to allow logs to flush if necessary...")
        time.sleep(2)
        if run_single_execution(SAMPLE_LOOP_EXECUTE_INPUT, i):
            successful_runs += 1
        else:
            print(f"Execution {i} was not successful. Check server logs and ensure runtime_executor.py is running correctly.")
    
    print(f"\nDeterministic Replay Test Summary:")
    print(f"Total executions attempted: {NUM_REPLAYS}")
    print(f"Successful executions: {successful_runs}")
    
    if successful_runs == NUM_REPLAYS:
        print("\nAll replay executions attempted. Please verify the contents of:")
        print(f"  - Emotion Telemetry Log: {os.path.join(LOG_DIR, 'emotion_telemetry.log.jsonl')}") # Path relative to runtime_executor
        print(f"  - Justification Log: {os.path.join(LOG_DIR, 'justification.log.jsonl')}") # Path relative to runtime_executor
        print(f"Ensure that {NUM_REPLAYS} entries corresponding to the request_id "
              f"'{FIXED_REQUEST_ID_FOR_REPLAY_TEST}' are present in each log and are identical where expected.")
        print(f"The input payload used is saved at: {input_payload_file}")
    else:
        print("Not all replay executions were successful. Further investigation needed.")

if __name__ == "__main__":
    main()

