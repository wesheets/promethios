import json
import jsonschema
import os

EMOTION_SCHEMA_PATH = "/home/ubuntu/promethios/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/mgc_emotion_telemetry.schema.json"
JUSTIFICATION_SCHEMA_PATH = "/home/ubuntu/promethios/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/loop_justification_log.schema.v1.json"

EMOTION_LOG_FILE = "/home/ubuntu/promethios/logs/emotion_telemetry.log.jsonl"
JUSTIFICATION_LOG_FILE = "/home/ubuntu/promethios/logs/justification.log.jsonl"

def load_schema(schema_path):
    with open(schema_path, 'r') as f:
        return json.load(f)

def validate_log_file(log_file_path, schema, data_key):
    print(f"Validating schema for {log_file_path} using data_key \'{data_key}\'...")
    if not os.path.exists(log_file_path):
        print(f"ERROR: Log file not found: {log_file_path}")
        return False

    all_valid = True
    entry_count = 0
    with open(log_file_path, 'r') as f:
        for i, line in enumerate(f):
            entry_count += 1
            try:
                log_entry = json.loads(line)
                data_to_validate = log_entry.get(data_key)
                if data_to_validate is None:
                    print(f"ERROR: Entry {i+1} in {log_file_path} is missing data_key \'{data_key}\'.")
                    all_valid = False
                    continue
                jsonschema.validate(instance=data_to_validate, schema=schema)
                # print(f"Entry {i+1} in {log_file_path} is schema-valid.")
            except json.JSONDecodeError as e:
                print(f"ERROR: Entry {i+1} in {log_file_path} is not valid JSON: {e}")
                all_valid = False
            except jsonschema.exceptions.ValidationError as e:
                print(f"ERROR: Entry {i+1} in {log_file_path} failed schema validation for key \'{data_key}\': {e.message} (Path: {list(e.path)}) ")
                all_valid = False
            except Exception as e:
                print(f"ERROR: Unexpected error validating entry {i+1} in {log_file_path}: {e}")
                all_valid = False
    
    if entry_count == 0:
        print(f"WARNING: Log file {log_file_path} is empty.")
        # Depending on requirements, an empty log might be invalid or just a warning.
        # For this test, if the replay ran, logs should not be empty.
        all_valid = False 

    if all_valid and entry_count > 0:
        print(f"All {entry_count} entries in {log_file_path} are schema-valid for key \'{data_key}\'.")
    elif entry_count > 0:
        print(f"Found schema validation errors in {log_file_path}.")
    return all_valid

if __name__ == "__main__":
    print("--- Starting Replay Log Schema Validation ---")
    
    if not os.path.exists(EMOTION_SCHEMA_PATH):
        print(f"FATAL: Emotion schema not found at {EMOTION_SCHEMA_PATH}")
        exit(1)
    if not os.path.exists(JUSTIFICATION_SCHEMA_PATH):
        print(f"FATAL: Justification schema not found at {JUSTIFICATION_SCHEMA_PATH}")
        exit(1)
        
    emotion_schema = load_schema(EMOTION_SCHEMA_PATH)
    justification_schema = load_schema(JUSTIFICATION_SCHEMA_PATH)
    
    emotion_logs_valid = validate_log_file(EMOTION_LOG_FILE, emotion_schema, "telemetry_data")
    justification_logs_valid = validate_log_file(JUSTIFICATION_LOG_FILE, justification_schema, "justification_data")
    
    print("\n--- Schema Validation Summary ---")
    if emotion_logs_valid and justification_logs_valid:
        print("SUCCESS: All replay logs (emotion and justification) are schema-valid and appear untouched (hashes previously verified).")
    else:
        print("FAILURE: One or more replay logs failed schema validation or were not found/empty.")
        if not emotion_logs_valid:
            print("- Emotion log validation failed or file issue.")
        if not justification_logs_valid:
            print("- Justification log validation failed or file issue.")

