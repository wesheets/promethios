import json
import uuid
import datetime
import jsonschema
import os
import importlib.util
import sys

# --- Dynamically Import GovernanceCore --- #
current_dir = os.path.dirname(os.path.abspath(__file__))
governance_core_module_path = os.path.join(current_dir, "ResurrectionCodex", "01_Minimal_Governance_Core_MGC", "governance_core.py")
module_name = "governance_core_dynamic"
spec = importlib.util.spec_from_file_location(module_name, governance_core_module_path)
governance_core_module = importlib.util.module_from_spec(spec)
sys.modules[module_name] = governance_core_module
spec.loader.exec_module(governance_core_module)
GovernanceCore = governance_core_module.GovernanceCore

# --- Schema Loading --- #
SCHEMA_BASE_PATH = os.path.join(current_dir, "ResurrectionCodex")
API_SCHEMA_PATH = os.path.join(SCHEMA_BASE_PATH, "02_System_Architecture", "API_Schemas")
MGC_SCHEMA_PATH = os.path.join(SCHEMA_BASE_PATH, "01_Minimal_Governance_Core_MGC", "MGC_Schema_Registry")

def load_schema(file_path):
    if not os.path.exists(file_path):
        print(f"Warning: Schema file not found at {file_path}. Using basic object schema.")
        return {"$schema": "http://json-schema.org/draft-07/schema#", "type": "object"}
    with open(file_path, 'r') as f:
        return json.load(f)

OPERATOR_OVERRIDE_SCHEMA_PATH = os.path.join(MGC_SCHEMA_PATH, "operator_override.schema.v1.json")
EMOTION_TELEMETRY_SCHEMA_PATH = os.path.join(MGC_SCHEMA_PATH, "mgc_emotion_telemetry.schema.json")
JUSTIFICATION_LOG_SCHEMA_PATH = os.path.join(MGC_SCHEMA_PATH, "loop_justification_log.schema.v1.json")

operator_override_schema = load_schema(OPERATOR_OVERRIDE_SCHEMA_PATH)
emotion_telemetry_schema = load_schema(EMOTION_TELEMETRY_SCHEMA_PATH)
justification_log_schema = load_schema(JUSTIFICATION_LOG_SCHEMA_PATH)

# --- Logging Configuration --- #
DEFAULT_LOG_DIR = os.path.join(current_dir, "logs")
LOGGING_CONFIG_FILE = os.path.join(current_dir, "logging.conf.json")

def get_log_directory():
    if os.path.exists(LOGGING_CONFIG_FILE):
        try:
            with open(LOGGING_CONFIG_FILE, 'r') as f:
                config = json.load(f)
                log_dir = config.get("log_directory", DEFAULT_LOG_DIR)
                # Ensure the path is absolute or relative to current_dir
                if not os.path.isabs(log_dir):
                    log_dir = os.path.join(current_dir, log_dir)
                return log_dir
        except Exception as e:
            print(f"Error reading logging config {LOGGING_CONFIG_FILE}: {e}. Using default log directory.")
            return DEFAULT_LOG_DIR
    return DEFAULT_LOG_DIR

class RuntimeExecutor:
    def __init__(self):
        self.governance_core = GovernanceCore()
        self.log_directory = get_log_directory()
        if not os.path.exists(self.log_directory):
            try:
                os.makedirs(self.log_directory)
                print(f"Created log directory: {self.log_directory}")
            except Exception as e:
                print(f"Error creating log directory {self.log_directory}: {e}. Logging may fail.")
        self.emotion_log_file = os.path.join(self.log_directory, "emotion_telemetry.log.jsonl")
        self.justification_log_file = os.path.join(self.log_directory, "justification.log.jsonl")

    def _log_to_file(self, data_to_log: dict, filename: str):
        try:
            with open(filename, 'a') as f:
                f.write(json.dumps(data_to_log) + '\n')
        except Exception as e:
            print(f"Error writing to log file {filename}: {e}") # Log to stderr or system log

    def validate_against_schema(self, instance, schema, schema_name=""):
        try:
            jsonschema.validate(instance=instance, schema=schema)
            return None
        except jsonschema.exceptions.ValidationError as e:
            return {
                "message": f"Schema validation failed for {schema_name if schema_name else 'output'}: {e.message}",
                "path": list(e.path),
                "validator": e.validator,
                "validator_value": e.validator_value,
            }
        except Exception as e:
            return {
                "message": f"Unexpected error during schema validation for {schema_name if schema_name else 'output'}: {str(e)}",
            }

    def execute_core_loop(self, request_data: dict) -> dict:
        request_id = request_data.get("request_id", str(uuid.uuid4()))
        plan_input = request_data.get("plan_input")
        operator_override_signal = request_data.get("operator_override_signal")
        timestamp_capture = datetime.datetime.utcnow().isoformat() + "Z"

        schema_validation_errors = []

        # Phase 2.2: Full override signal processing will be handled by API layer first for validation
        # Here, we assume it's either valid or None if API layer handled rejection.
        # If it's passed, GC will process it.

        try:
            core_output, emotion_telemetry, justification_log = self.governance_core.execute_loop(
                plan_input=plan_input,
                operator_override_signal=operator_override_signal
            )

            # Validate and log emotion telemetry
            if emotion_telemetry is not None:
                emotion_validation_error = self.validate_against_schema(
                    emotion_telemetry, emotion_telemetry_schema, "emotion_telemetry"
                )
                if emotion_validation_error:
                    schema_validation_errors.append(emotion_validation_error)
                    emotion_telemetry_for_response = None # Nullify on validation failure for API response
                else:
                    emotion_telemetry_for_response = emotion_telemetry
                    # Log valid emotion telemetry
                    log_entry = {
                        "request_id": request_id,
                        "timestamp_capture": timestamp_capture,
                        "telemetry_data": emotion_telemetry
                    }
                    self._log_to_file(log_entry, self.emotion_log_file)
            else:
                 emotion_telemetry_for_response = None

            # Validate and log justification log
            if justification_log is not None:
                justification_validation_error = self.validate_against_schema(
                    justification_log, justification_log_schema, "justification_log"
                )
                if justification_validation_error:
                    schema_validation_errors.append(justification_validation_error)
                    justification_log_for_response = None # Nullify on validation failure for API response
                else:
                    justification_log_for_response = justification_log
                    # Log valid justification log
                    log_entry = {
                        "request_id": request_id,
                        "timestamp_capture": timestamp_capture,
                        "justification_data": justification_log
                    }
                    self._log_to_file(log_entry, self.justification_log_file)
            else:
                justification_log_for_response = None

            if schema_validation_errors:
                execution_status = "FAILURE"
                error_details = {
                    "code": "SCHEMA_VALIDATION_ERROR",
                    "message": "One or more output schemas failed validation.",
                    "schema_validation_errors": schema_validation_errors
                }
            else:
                execution_status = "SUCCESS"
                error_details = None

            response = {
                "request_id": request_id,
                "execution_status": execution_status,
                "governance_core_output": core_output,
                "emotion_telemetry": emotion_telemetry_for_response, # Use the potentially nullified version
                "justification_log": justification_log_for_response, # Use the potentially nullified version
                "error_details": error_details
            }

        except Exception as e:
            response = {
                "request_id": request_id,
                "execution_status": "FAILURE",
                "governance_core_output": None,
                "emotion_telemetry": None,
                "justification_log": None,
                "error_details": {
                    "code": "CORE_EXECUTION_ERROR",
                    "message": str(e)
                }
            }
        
        return response

if __name__ == "__main__":
    # Ensure schemas exist for standalone test or create dummies
    for p in [OPERATOR_OVERRIDE_SCHEMA_PATH, EMOTION_TELEMETRY_SCHEMA_PATH, JUSTIFICATION_LOG_SCHEMA_PATH]:
        if not os.path.exists(p):
            print(f"Warning: Schema file {p} not found. Creating dummy for standalone test.")
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, 'w') as f: json.dump({"$schema": "http://json-schema.org/draft-07/schema#", "type":"object"}, f)
    
    # Reload schemas in case they were dummied
    operator_override_schema = load_schema(OPERATOR_OVERRIDE_SCHEMA_PATH)
    emotion_telemetry_schema = load_schema(EMOTION_TELEMETRY_SCHEMA_PATH)
    justification_log_schema = load_schema(JUSTIFICATION_LOG_SCHEMA_PATH)

    executor = RuntimeExecutor()
    print(f"Logging to directory: {executor.log_directory}")

    mock_request_valid = {
        "request_id": str(uuid.uuid4()),
        "plan_input": {"task": "test valid execution for logging"},
        "operator_override_signal": None
    }
    print("--- Testing Valid Request for Logging ---")
    result_valid = executor.execute_core_loop(mock_request_valid)
    print(json.dumps(result_valid, indent=2))

    mock_request_with_override = {
        "request_id": str(uuid.uuid4()),
        "plan_input": {"task": "test with override for logging"},
        "operator_override_signal": {
            "override_type": "HALT_IMMEDIATE", 
            "reason": "Test override signal for logging"
        }
    }
    print("\n--- Testing Request with Valid Override for Logging ---")
    result_override = executor.execute_core_loop(mock_request_with_override)
    print(json.dumps(result_override, indent=2))

    # Test with mock GC producing invalid telemetry to check logging behavior
    # This requires modifying the mock GovernanceCore temporarily or adding a specific test mode to it.
    # For now, we assume valid outputs from GC for logging part.
    print(f"\nCheck log files in {executor.log_directory}:")
    print(f"- {executor.emotion_log_file}")
    print(f"- {executor.justification_log_file}")

