#!/usr/bin/env python3
"""
CLI Trigger for Promethios Kernel
Phase 5.1: External Trigger Integration
Contract Version: v2025.05.20
"""

import argparse
import json
import uuid
import datetime
import os
import sys
import requests
import jsonschema

# Constants
SCHEMA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schemas")
CONTRACT_VERSION = "v2025.05.20"
PHASE_ID = "5.1"

def load_schema(schema_name):
    """Load a schema file from the schemas directory"""
    schema_path = os.path.join(SCHEMA_DIR, schema_name)
    if not os.path.exists(schema_path):
        print(f"Error: Schema file {schema_name} not found in {SCHEMA_DIR}")
        sys.exit(1)
    
    with open(schema_path, 'r') as f:
        return json.load(f)

def validate_against_schema(instance, schema, schema_name=""):
    """Validate data against a JSON schema"""
    try:
        jsonschema.validate(instance=instance, schema=schema)
        return None
    except jsonschema.exceptions.ValidationError as e:
        return {
            "message": f"Schema validation failed for {schema_name}: {e.message}",
            "path": list(e.path),
            "validator": e.validator,
            "validator_value": e.validator_value,
        }
    except Exception as e:
        return {
            "message": f"Unexpected error during schema validation for {schema_name}: {str(e)}",
        }

def pre_loop_tether_check():
    """Verify Codex Contract Tethering"""
    codex_lock_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".codex.lock")
    
    if not os.path.exists(codex_lock_path):
        print("Error: .codex.lock file not found. Contract tethering verification failed.")
        sys.exit(1)
    
    with open(codex_lock_path, 'r') as f:
        lock_content = f.read()
    
    if CONTRACT_VERSION not in lock_content:
        print(f"Error: Contract version {CONTRACT_VERSION} not found in .codex.lock file.")
        sys.exit(1)
    
    if PHASE_ID not in lock_content:
        print(f"Error: Phase ID {PHASE_ID} not found in .codex.lock file.")
        sys.exit(1)
    
    # Verify schema files are referenced in the lock file
    required_schemas = ["external_trigger.schema.v1.json", "cli_args.schema.v1.json"]
    for schema in required_schemas:
        if schema not in lock_content:
            print(f"Error: Required schema {schema} not referenced in .codex.lock file.")
            sys.exit(1)
    
    # Verify schema files exist
    for schema in required_schemas:
        schema_path = os.path.join(SCHEMA_DIR, schema)
        if not os.path.exists(schema_path):
            print(f"Error: Required schema file {schema} not found in {SCHEMA_DIR}")
            sys.exit(1)
    
    print("Codex Contract Tethering verification successful.")
    return True

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description=f"Promethios CLI Trigger (Contract: {CONTRACT_VERSION}, Phase: {PHASE_ID})")
    parser.add_argument("--input-file", required=True, help="Path to JSON file containing loop input")
    parser.add_argument("--output-file", help="Optional path to write execution results")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    parser.add_argument("--no-wait", dest="wait", action="store_false", help="Don't wait for execution completion")
    parser.add_argument("--timeout", type=int, default=60, help="Execution timeout in seconds (1-300)")
    
    args = parser.parse_args()
    
    # Validate input file exists
    if not os.path.exists(args.input_file):
        print(f"Error: Input file {args.input_file} not found")
        sys.exit(1)
    
    # Validate timeout range
    if args.timeout < 1 or args.timeout > 300:
        print("Error: Timeout must be between 1 and 300 seconds")
        sys.exit(1)
    
    return args

def create_trigger_payload(input_data, args):
    """Create and validate the trigger payload"""
    trigger_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"
    
    # Create the trigger payload
    trigger_payload = {
        "trigger_id": trigger_id,
        "trigger_type": "cli",
        "timestamp": timestamp,
        "source": {
            "identifier": os.environ.get("USER", "unknown"),
            "type": "user",
            "metadata": {
                "hostname": os.environ.get("HOSTNAME", "unknown"),
                "cli_version": "1.0.0"
            }
        },
        "payload": {
            "loop_input": input_data,
            "options": {
                "wait": args.wait,
                "timeout": args.timeout,
                "verbose": args.verbose
            }
        }
    }
    
    # Load and validate against schemas
    external_trigger_schema = load_schema("external_trigger.schema.v1.json")
    validation_error = validate_against_schema(trigger_payload, external_trigger_schema, "external_trigger")
    
    if validation_error:
        print(f"Error: Trigger payload validation failed: {validation_error['message']}")
        sys.exit(1)
    
    # Create CLI args object for validation
    cli_args_obj = {
        "input_file": args.input_file,
        "output_file": args.output_file,
        "verbose": args.verbose,
        "wait": args.wait,
        "timeout": args.timeout
    }
    
    cli_args_schema = load_schema("cli_args.schema.v1.json")
    validation_error = validate_against_schema(cli_args_obj, cli_args_schema, "cli_args")
    
    if validation_error:
        print(f"Error: CLI arguments validation failed: {validation_error['message']}")
        sys.exit(1)
    
    return trigger_payload

def execute_loop(trigger_payload, args):
    """Execute the loop via API call"""
    api_url = "http://localhost:8000/api/v1/external-trigger"
    
    try:
        if args.verbose:
            print(f"Sending trigger payload to {api_url}")
            print(json.dumps(trigger_payload, indent=2))
        
        response = requests.post(api_url, json=trigger_payload)
        
        if response.status_code != 200:
            print(f"Error: API call failed with status code {response.status_code}")
            print(response.text)
            sys.exit(1)
        
        result = response.json()
        
        if args.verbose:
            print("Execution result:")
            print(json.dumps(result, indent=2))
        
        if args.output_file:
            with open(args.output_file, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"Results written to {args.output_file}")
        
        return result
    
    except requests.exceptions.RequestException as e:
        print(f"Error: Failed to connect to API: {e}")
        sys.exit(1)
    except json.JSONDecodeError:
        print("Error: Invalid JSON response from API")
        sys.exit(1)
    except Exception as e:
        print(f"Error: Unexpected error during execution: {e}")
        sys.exit(1)

def main():
    """Main entry point"""
    # Verify Codex Contract Tethering
    pre_loop_tether_check()
    
    # Parse command line arguments
    args = parse_arguments()
    
    # Load input file
    try:
        with open(args.input_file, 'r') as f:
            input_data = json.load(f)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in input file {args.input_file}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: Failed to read input file: {e}")
        sys.exit(1)
    
    # Create and validate trigger payload
    trigger_payload = create_trigger_payload(input_data, args)
    
    # Execute the loop
    result = execute_loop(trigger_payload, args)
    
    # Print success message
    print(f"Loop execution completed successfully. Trigger ID: {trigger_payload['trigger_id']}")
    
    # Return success status
    return 0

if __name__ == "__main__":
    sys.exit(main())
