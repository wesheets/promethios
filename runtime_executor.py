import json
import uuid
import datetime
import jsonschema
import os
import importlib.util
import sys
import hashlib
import io
import contextlib
from fastapi import FastAPI, Request, HTTPException
import uvicorn
from typing import Any, Dict, Optional

# --- Dynamically Import GovernanceCore --- #
current_file_dir = os.path.dirname(os.path.abspath(__file__))
mock_governance_core_path = os.path.join(current_file_dir, "ResurrectionCodex", "01_Minimal_Governance_Core_MGC", "governance_core.py")

kernel_dir_from_env = os.environ.get("PROMETHIOS_KERNEL_PATH")
governance_core_module_path = None
using_actual_kernel = False
original_sys_path = list(sys.path) # Store original sys.path

if kernel_dir_from_env and os.path.isdir(kernel_dir_from_env):
    candidate_actual_kernel_file_path = os.path.join(kernel_dir_from_env, "governance_core.py")
    if os.path.exists(candidate_actual_kernel_file_path):
        governance_core_module_path = candidate_actual_kernel_file_path
        print(f"INFO: Attempting to use actual GovernanceCore from PROMETHIOS_KERNEL_PATH: {governance_core_module_path}")
        if kernel_dir_from_env not in sys.path: # Add kernel dir to allow its relative imports
            sys.path.insert(0, kernel_dir_from_env)
            print(f"INFO: Temporarily added {kernel_dir_from_env} to sys.path for kernel import.")
        using_actual_kernel = True
    else:
        print(f"WARNING: PROMETHIOS_KERNEL_PATH (\'{kernel_dir_from_env}\') is a directory, but \'governance_core.py\' not found in it. Falling back to mock.")
        governance_core_module_path = mock_governance_core_path
elif kernel_dir_from_env: # Path was provided but not a valid directory or file not found
    print(f"WARNING: PROMETHIOS_KERNEL_PATH (\'{kernel_dir_from_env}\') is not a valid directory or \'governance_core.py\' not found. Falling back to mock.")
    governance_core_module_path = mock_governance_core_path
else:
    governance_core_module_path = mock_governance_core_path

if not governance_core_module_path or not os.path.exists(governance_core_module_path):
    if governance_core_module_path == mock_governance_core_path:
         print(f"FATAL: Mock GovernanceCore module could not be found at \'{mock_governance_core_path}\'. Exiting.")
    else: 
         print(f"FATAL: GovernanceCore module could not be resolved. Path determined was \'{governance_core_module_path}\'. Exiting.")
    sys.exit(1)

if not using_actual_kernel:
     print(f"INFO: Using mock GovernanceCore from: {governance_core_module_path}")

module_name = "governance_core_dynamic"
try:
    spec = importlib.util.spec_from_file_location(module_name, governance_core_module_path)
    if spec is None:
        raise ImportError(f"Could not load spec for module at {governance_core_module_path}")
    governance_core_module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = governance_core_module
    spec.loader.exec_module(governance_core_module)
    GovernanceCore = governance_core_module.GovernanceCore
    print(f"INFO: Successfully loaded GovernanceCore from {governance_core_module_path}")
except Exception as e:
    print(f"FATAL: Failed to load GovernanceCore from {governance_core_module_path}: {e}. Exiting.")
    sys.exit(1)
finally:
    if using_actual_kernel and kernel_dir_from_env in sys.path: 
        sys.path = original_sys_path
        print(f"INFO: Restored sys.path after loading actual kernel.")

SCHEMA_BASE_PATH = os.path.join(current_file_dir, "ResurrectionCodex")
MGC_SCHEMA_PATH = os.path.join(SCHEMA_BASE_PATH, "01_Minimal_Governance_Core_MGC", "MGC_Schema_Registry")

def load_schema(file_path):
    if not os.path.exists(file_path):
        print(f"Warning: Schema file for output validation not found at {file_path}. Using basic object schema.")
        return {"$schema": "http://json-schema.org/draft-07/schema#", "type": "object"}
    with open(file_path, 'r') as f:
        return json.load(f)

EMOTION_TELEMETRY_SCHEMA_PATH = os.path.join(MGC_SCHEMA_PATH, "mgc_emotion_telemetry.schema.json")
JUSTIFICATION_LOG_SCHEMA_PATH = os.path.join(MGC_SCHEMA_PATH, "loop_justification_log.schema.v1.json")

emotion_telemetry_schema = load_schema(EMOTION_TELEMETRY_SCHEMA_PATH)
justification_log_schema = load_schema(JUSTIFICATION_LOG_SCHEMA_PATH)

DEFAULT_LOG_DIR = os.path.join(current_file_dir, "logs")
LOGGING_CONFIG_FILE = os.path.join(current_file_dir, "logging.conf.json")

def get_log_directory():
    if os.path.exists(LOGGING_CONFIG_FILE):
        try:
            with open(LOGGING_CONFIG_FILE, 'r') as f:
                config = json.load(f)
                log_dir = config.get("log_directory", DEFAULT_LOG_DIR)
                if not os.path.isabs(log_dir):
                    log_dir = os.path.join(current_file_dir, log_dir)
                return log_dir
        except Exception as e:
            print(f"Error reading logging config {LOGGING_CONFIG_FILE}: {e}. Using default log directory.")
            return DEFAULT_LOG_DIR
    return DEFAULT_LOG_DIR

def _canonical_json_string(data: dict) -> str:
    return json.dumps(data, sort_keys=True, separators=(',', ':'))

def _calculate_sha256_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

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
            content_to_hash = data_to_log.copy()
            canonical_string = _canonical_json_string(content_to_hash)
            entry_hash = _calculate_sha256_hash(canonical_string)
            data_to_log_with_hash = data_to_log.copy()
            data_to_log_with_hash["entry_sha256_hash"] = entry_hash
            with open(filename, 'a') as f:
                f.write(json.dumps(data_to_log_with_hash) + '\n')
        except Exception as e:
            print(f"Error writing to log file {filename}: {e}")

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
        plan_input_from_request = request_data.get("plan_input")
        operator_override_signal = request_data.get("operator_override_signal")
        timestamp_capture = datetime.datetime.utcnow().isoformat() + "Z"
        loop_input_for_kernel = {
            "loop_id": request_id,
            "plan_details": plan_input_from_request, 
            "operator_override_signal": operator_override_signal
        }
        core_output = None
        emotion_telemetry_from_stdout = None
        justification_log_from_stdout = None

        try:
            captured_stdout_io = io.StringIO()
            with contextlib.redirect_stdout(captured_stdout_io):
                core_output = self.governance_core.execute_loop(loop_input_for_kernel)
            
            stdout_full_text = captured_stdout_io.getvalue()

            EMOTION_PREFIX = "Emitting Emotion Telemetry: "
            JUSTIFICATION_PREFIX = "Logging Validated Justification: "
            decoder = json.JSONDecoder()

            current_pos = 0
            while current_pos < len(stdout_full_text):
                emotion_start_index = stdout_full_text.find(EMOTION_PREFIX, current_pos)
                justification_start_index = stdout_full_text.find(JUSTIFICATION_PREFIX, current_pos)

                next_prefix_pos = -1
                is_emotion = False

                if emotion_start_index != -1 and (justification_start_index == -1 or emotion_start_index < justification_start_index):
                    next_prefix_pos = emotion_start_index
                    is_emotion = True
                elif justification_start_index != -1:
                    next_prefix_pos = justification_start_index
                    is_emotion = False
                else:
                    break 
                
                prefix_len = len(EMOTION_PREFIX) if is_emotion else len(JUSTIFICATION_PREFIX)
                json_text_start_offset = next_prefix_pos + prefix_len
                
                if json_text_start_offset >= len(stdout_full_text):
                    break

                try:
                    obj, end_index_offset = decoder.raw_decode(stdout_full_text[json_text_start_offset:])
                    if is_emotion:
                        if self.validate_against_schema(obj, emotion_telemetry_schema, "stdout_emotion_telemetry_candidate") is None:
                            emotion_telemetry_from_stdout = obj
                    else: 
                        if self.validate_against_schema(obj, justification_log_schema, "stdout_justification_log_candidate") is None:
                            justification_log_from_stdout = obj
                    current_pos = json_text_start_offset + end_index_offset
                except json.JSONDecodeError:
                    current_pos = next_prefix_pos + prefix_len 
                    if current_pos >= len(stdout_full_text): break
            
            emotion_telemetry_for_response = None
            if emotion_telemetry_from_stdout is not None:
                emotion_telemetry_for_response = emotion_telemetry_from_stdout
                log_entry = {
                    "request_id": request_id,
                    "timestamp_capture": timestamp_capture,
                    "telemetry_data": emotion_telemetry_from_stdout
                }
                self._log_to_file(log_entry, self.emotion_log_file)
            
            justification_log_for_response = None
            if justification_log_from_stdout is not None:
                justification_log_for_response = justification_log_from_stdout
                log_entry = {
                    "request_id": request_id,
                    "timestamp_capture": timestamp_capture,
                    "justification_data": justification_log_from_stdout
                }
                self._log_to_file(log_entry, self.justification_log_file)

            execution_status = "SUCCESS" 
            error_details = None
            
            if core_output is None and emotion_telemetry_for_response is None and justification_log_for_response is None:
                 if not stdout_full_text.strip():
                    print("WARNING: GovernanceCore execute_loop returned None and produced no stdout. This might be unexpected.")

            response = {
                "request_id": request_id,
                "execution_status": execution_status,
                "governance_core_output": core_output,
                "emotion_telemetry": emotion_telemetry_for_response, 
                "justification_log": justification_log_for_response, 
                "error_details": error_details
            }

        except Exception as e:
            print(f"ERROR in execute_core_loop: {e}") # Log the exception
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

app = FastAPI()

if not os.path.exists(EMOTION_TELEMETRY_SCHEMA_PATH) or not os.path.exists(JUSTIFICATION_LOG_SCHEMA_PATH):
    print("FATAL: Core output validation schemas not found in project's ResurrectionCodex. Exiting.")
    sys.exit(1)

runtime_executor_instance = RuntimeExecutor()
print(f"Logging to directory: {runtime_executor_instance.log_directory}")
if os.path.exists(runtime_executor_instance.emotion_log_file):
    os.remove(runtime_executor_instance.emotion_log_file)
if os.path.exists(runtime_executor_instance.justification_log_file):
    os.remove(runtime_executor_instance.justification_log_file)

@app.post("/loop/execute")
async def loop_execute_endpoint(request: Request):
    try:
        request_data_dict = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    return runtime_executor_instance.execute_core_loop(request_data_dict)

if __name__ == "__main__":
    print("Starting FastAPI server for Promethios Runtime Executor...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

