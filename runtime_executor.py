import json
import uuid
import datetime
import jsonschema
import os
import importlib.util # Added for dynamic module loading
import sys # Added to manipulate path

# --- Dynamically Import GovernanceCore --- #
# Get the absolute path to governance_core.py
# runtime_executor.py is in /home/ubuntu/promethios_repo/
# governance_core.py is in /home/ubuntu/promethios_repo/ResurrectionCodex/01_Minimal_Governance_Core_MGC/governance_core.py
current_dir = os.path.dirname(os.path.abspath(__file__))
governance_core_module_path = os.path.join(current_dir, "ResurrectionCodex", "01_Minimal_Governance_Core_MGC", "governance_core.py")

# Create a module spec
module_name = "governance_core_dynamic"
spec = importlib.util.spec_from_file_location(module_name, governance_core_module_path)

# Create a new module based on spec
governance_core_module = importlib.util.module_from_spec(spec)

# Add the module to sys.modules (optional, but can be good practice)
sys.modules[module_name] = governance_core_module

# Execute the module in its own namespace
spec.loader.exec_module(governance_core_module)

# Now we can access GovernanceCore class
GovernanceCore = governance_core_module.GovernanceCore

# --- Schema Loading --- #
SCHEMA_BASE_PATH = os.path.join(os.path.dirname(__file__), "ResurrectionCodex")
API_SCHEMA_PATH = os.path.join(SCHEMA_BASE_PATH, "02_System_Architecture", "API_Schemas")
MGC_SCHEMA_PATH = os.path.join(SCHEMA_BASE_PATH, "01_Minimal_Governance_Core_MGC", "MGC_Schema_Registry")

def load_schema(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)

OPERATOR_OVERRIDE_SCHEMA_PATH = os.path.join(MGC_SCHEMA_PATH, "operator_override.schema.v1.json")
EMOTION_TELEMETRY_SCHEMA_PATH = os.path.join(MGC_SCHEMA_PATH, "mgc_emotion_telemetry.schema.json")
JUSTIFICATION_LOG_SCHEMA_PATH = os.path.join(MGC_SCHEMA_PATH, "loop_justification_log.schema.v1.json")

operator_override_schema = load_schema(OPERATOR_OVERRIDE_SCHEMA_PATH)
emotion_telemetry_schema = load_schema(EMOTION_TELEMETRY_SCHEMA_PATH)
justification_log_schema = load_schema(JUSTIFICATION_LOG_SCHEMA_PATH)

class RuntimeExecutor:
    def __init__(self):
        self.governance_core = GovernanceCore()

    def validate_against_schema(self, instance, schema, schema_name=""):
        try:
            jsonschema.validate(instance=instance, schema=schema)
            return None  # No errors
        except jsonschema.exceptions.ValidationError as e:
            error_detail = {
                "message": f"Schema validation failed for {schema_name if schema_name else 'output'}: {e.message}",
                "path": list(e.path),
                "validator": e.validator,
                "validator_value": e.validator_value,
            }
            return error_detail
        except Exception as e:
            error_detail = {
                "message": f"Unexpected error during schema validation for {schema_name if schema_name else 'output'}: {str(e)}",
            }
            return error_detail

    def execute_core_loop(self, request_data: dict) -> dict:
        request_id = request_data.get("request_id", str(uuid.uuid4()))
        plan_input = request_data.get("plan_input")
        operator_override_signal = request_data.get("operator_override_signal")

        schema_validation_errors = []

        if operator_override_signal:
            override_validation_error = self.validate_against_schema(
                operator_override_signal, operator_override_schema, "operator_override_signal"
            )
            if override_validation_error:
                schema_validation_errors.append(override_validation_error)

        try:
            core_output, emotion_telemetry, justification_log = self.governance_core.execute_loop(
                plan_input=plan_input,
                operator_override_signal=operator_override_signal
            )

            emotion_validation_error = self.validate_against_schema(
                emotion_telemetry, emotion_telemetry_schema, "emotion_telemetry"
            )
            if emotion_validation_error:
                schema_validation_errors.append(emotion_validation_error)
                emotion_telemetry = None 

            justification_validation_error = self.validate_against_schema(
                justification_log, justification_log_schema, "justification_log"
            )
            if justification_validation_error:
                schema_validation_errors.append(justification_validation_error)
                justification_log = None 
            elif justification_log: 
                pass

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
                "emotion_telemetry": emotion_telemetry,
                "justification_log": justification_log,
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
    executor = RuntimeExecutor()
    
    if not os.path.exists(OPERATOR_OVERRIDE_SCHEMA_PATH):
        print(f"Warning: Operator override schema not found at {OPERATOR_OVERRIDE_SCHEMA_PATH}. Creating dummy.")
        with open(OPERATOR_OVERRIDE_SCHEMA_PATH, 'w') as f: json.dump({"$schema": "http://json-schema.org/draft-07/schema#", "type":"object"}, f)
    if not os.path.exists(EMOTION_TELEMETRY_SCHEMA_PATH):
        print(f"Warning: Emotion telemetry schema not found at {EMOTION_TELEMETRY_SCHEMA_PATH}. Creating dummy.")
        with open(EMOTION_TELEMETRY_SCHEMA_PATH, 'w') as f: json.dump({"$schema": "http://json-schema.org/draft-07/schema#", "type":"object"}, f)
    if not os.path.exists(JUSTIFICATION_LOG_SCHEMA_PATH):
        print(f"Warning: Justification log schema not found at {JUSTIFICATION_LOG_SCHEMA_PATH}. Creating dummy.")
        with open(JUSTIFICATION_LOG_SCHEMA_PATH, 'w') as f: json.dump({"$schema": "http://json-schema.org/draft-07/schema#", "type":"object"}, f)
    
    operator_override_schema = load_schema(OPERATOR_OVERRIDE_SCHEMA_PATH)
    emotion_telemetry_schema = load_schema(EMOTION_TELEMETRY_SCHEMA_PATH)
    justification_log_schema = load_schema(JUSTIFICATION_LOG_SCHEMA_PATH)

    mock_request_valid = {
        "request_id": str(uuid.uuid4()),
        "plan_input": {"task": "test valid execution"},
        "operator_override_signal": None
    }
    print("--- Testing Valid Request ---")
    result_valid = executor.execute_core_loop(mock_request_valid)
    print(json.dumps(result_valid, indent=2))

    mock_request_with_override = {
        "request_id": str(uuid.uuid4()),
        "plan_input": {"task": "test with override"},
        "operator_override_signal": {
            "override_type": "HALT_IMMEDIATE", 
            "reason": "Test override signal"
        }
    }
    print("\n--- Testing Request with Valid Override ---")
    result_override = executor.execute_core_loop(mock_request_with_override)
    print(json.dumps(result_override, indent=2))

