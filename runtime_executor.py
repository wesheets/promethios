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
import requests

# --- Constants for Phase 5.1: External Trigger Integration --- #
SCHEMA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schemas")
CONTRACT_VERSION = "v2025.05.18"
PHASE_ID = "5.1"

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
EXTERNAL_TRIGGER_SCHEMA_PATH = os.path.join(SCHEMA_DIR, "external_trigger.schema.v1.json")
WEBHOOK_PAYLOAD_SCHEMA_PATH = os.path.join(SCHEMA_DIR, "webhook_payload.schema.v1.json")

emotion_telemetry_schema = load_schema(EMOTION_TELEMETRY_SCHEMA_PATH)
justification_log_schema = load_schema(JUSTIFICATION_LOG_SCHEMA_PATH)
external_trigger_schema = load_schema(EXTERNAL_TRIGGER_SCHEMA_PATH)
webhook_payload_schema = load_schema(WEBHOOK_PAYLOAD_SCHEMA_PATH)

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

def pre_loop_tether_check():
    """Verify Codex Contract Tethering for Phase 5.1"""
    codex_lock_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".codex.lock")
    
    if not os.path.exists(codex_lock_path):
        return {
            "success": False,
            "message": ".codex.lock file not found. Contract tethering verification failed."
        }
    
    with open(codex_lock_path, 'r') as f:
        lock_content = f.read()
    
    if CONTRACT_VERSION not in lock_content:
        return {
            "success": False,
            "message": f"Contract version {CONTRACT_VERSION} not found in .codex.lock file."
        }
    
    if PHASE_ID not in lock_content:
        return {
            "success": False,
            "message": f"Phase ID {PHASE_ID} not found in .codex.lock file."
        }
    
    # Verify schema files are referenced in the lock file
    required_schemas = ["external_trigger.schema.v1.json", "webhook_payload.schema.v1.json", "cli_args.schema.v1.json"]
    for schema in required_schemas:
        if schema not in lock_content:
            return {
                "success": False,
                "message": f"Required schema {schema} not referenced in .codex.lock file."
            }
    
    # Verify schema files exist
    for schema in required_schemas:
        schema_path = os.path.join(SCHEMA_DIR, schema)
        if not os.path.exists(schema_path):
            return {
                "success": False,
                "message": f"Required schema file {schema} not found in {SCHEMA_DIR}"
            }
    
    return {
        "success": True,
        "message": "Codex Contract Tethering verification successful."
    }

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
        self.trigger_log_file = os.path.join(self.log_directory, "external_triggers.log.jsonl")

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
        schema_validation_errors = []
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
            print(f"DEBUG: Captured stdout from kernel:\n---\n{stdout_full_text}\n---")

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
                    break # No more known prefixes
                
                prefix_len = len(EMOTION_PREFIX) if is_emotion else len(JUSTIFICATION_PREFIX)
                json_text_start_offset = next_prefix_pos + prefix_len
                
                if json_text_start_offset >= len(stdout_full_text):
                    break

                try:
                    obj, end_index_offset = decoder.raw_decode(stdout_full_text[json_text_start_offset:])
                    if is_emotion:
                        if self.validate_against_schema(obj, emotion_telemetry_schema, "stdout_emotion_telemetry_candidate") is None:
                            emotion_telemetry_from_stdout = obj
                            print(f"DEBUG: Successfully parsed EMOTION telemetry from stdout using raw_decode.")
                    else: # justification
                        if self.validate_against_schema(obj, justification_log_schema, "stdout_justification_log_candidate") is None:
                            justification_log_from_stdout = obj
                            print(f"DEBUG: Successfully parsed JUSTIFICATION log from stdout using raw_decode.")
                        else:
                            val_error = self.validate_against_schema(obj, justification_log_schema, "stdout_justification_log_candidate_failed")
                            print(f"DEBUG: Failed to validate parsed JUSTIFICATION log from stdout: {val_error}")
                    current_pos = json_text_start_offset + end_index_offset
                except json.JSONDecodeError as e:
                    print(f"DEBUG: JSONDecodeError while parsing from stdout (prefix: {'EMOTION' if is_emotion else 'JUSTIFICATION'}): {e}. Skipping to next potential prefix.")
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

    def handle_external_trigger(self, trigger_data: dict) -> dict:
        """
        Handle external trigger requests for Phase 5.1
        Contract Version: v2025.05.18
        """
        # Verify Codex Contract Tethering
        tether_check = pre_loop_tether_check()
        if not tether_check["success"]:
            return {
                "status": "ERROR",
                "message": tether_check["message"],
                "trigger_id": trigger_data.get("trigger_id", str(uuid.uuid4()))
            }
        
        # Validate trigger data against schema
        validation_error = self.validate_against_schema(trigger_data, external_trigger_schema, "external_trigger")
        if validation_error:
            return {
                "status": "ERROR",
                "message": validation_error["message"],
                "trigger_id": trigger_data.get("trigger_id", str(uuid.uuid4()))
            }
        
        # Extract loop input from trigger payload
        trigger_id = trigger_data["trigger_id"]
        trigger_type = trigger_data["trigger_type"]
        timestamp = trigger_data["timestamp"]
        source = trigger_data["source"]
        loop_input = trigger_data["payload"]["loop_input"]
        options = trigger_data["payload"].get("options", {})
        
        # Log the trigger
        trigger_log_entry = {
            "trigger_id": trigger_id,
            "trigger_type": trigger_type,
            "timestamp": timestamp,
            "source": source,
            "options": options
        }
        self._log_to_file(trigger_log_entry, self.trigger_log_file)
        
        # Prepare request data for core loop execution
        request_data = {
            "request_id": trigger_id,
            "plan_input": loop_input,
            "operator_override_signal": None,
            "trigger_metadata": {
                "trigger_type": trigger_type,
                "trigger_timestamp": timestamp,
                "source_identifier": source["identifier"],
                "source_type": source["type"]
            }
        }
        
        # Execute the loop
        result = self.execute_core_loop(request_data)
        
        # Return results with trigger information
        response = {
            "status": "SUCCESS",
            "trigger_id": trigger_id,
            "execution_result": result,
            "trigger_metadata": {
                "trigger_type": trigger_type,
                "timestamp": timestamp,
                "source": source
            }
        }
        
        return response

    def handle_webhook_trigger(self, webhook_data: dict) -> dict:
        """
        Handle webhook trigger requests for Phase 5.1
        Contract Version: v2025.05.18
        """
        # Verify Codex Contract Tethering
        tether_check = pre_loop_tether_check()
        if not tether_check["success"]:
            return {
                "status": "ERROR",
                "message": tether_check["message"]
            }
        
        # Validate webhook payload against schema
        validation_error = self.validate_against_schema(webhook_data, webhook_payload_schema, "webhook_payload")
        if validation_error:
            return {
                "status": "ERROR",
                "message": validation_error["message"]
            }
        
        # Verify authentication token
        auth_token = webhook_data["auth_token"]
        # In a real implementation, this would validate against stored tokens
        # For this implementation, we'll accept any non-empty token
        if not auth_token:
            return {
                "status": "ERROR",
                "message": "Invalid authentication token"
            }
        
        # Extract data from webhook payload
        loop_input = webhook_data["loop_input"]
        callback_url = webhook_data.get("callback_url")
        execution_options = webhook_data.get("execution_options", {})
        
        # Create trigger payload - allow explicit trigger_id for testing
        trigger_id = webhook_data.get("explicit_trigger_id") or str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        
        trigger_payload = {
            "trigger_id": trigger_id,
            "trigger_type": "webhook",
            "timestamp": timestamp,
            "source": {
                "identifier": "webhook_client",
                "type": "service",
                "metadata": {
                    "client_ip": "127.0.0.1",  # In a real implementation, this would be the client IP
                    "auth_token_hash": _calculate_sha256_hash(auth_token)
                }
            },
            "payload": {
                "loop_input": loop_input,
                "options": execution_options
            }
        }
        
        # Execute the trigger
        result = self.handle_external_trigger(trigger_payload)
        
        # Handle callback if provided
        if callback_url and result["status"] == "SUCCESS":
            try:
                # Use the same trigger_id in the callback payload
                callback_payload = {
                    "trigger_id": trigger_id,
                    "status": "SUCCESS",
                    "execution_result": result["execution_result"]
                }
                requests.post(callback_url, json=callback_payload, timeout=5)
            except Exception as e:
                print(f"Error sending callback to {callback_url}: {e}")
        
        return result

def verify_logged_hashes(log_file_path: str):
    if not os.path.exists(log_file_path):
        print(f"Verification: Log file {log_file_path} not found. Skipping.")
        return False, 0, 0
    verified_count = 0
    failed_count = 0
    print(f"--- Verifying hashes in {os.path.basename(log_file_path)} ---")
    with open(log_file_path, 'r') as f:
        for i, line in enumerate(f):
            try:
                entry_with_hash = json.loads(line.strip())
                stored_hash = entry_with_hash.pop("entry_sha256_hash", None)
                if stored_hash is None:
                    print(f"  Line {i+1}: No entry_sha256_hash field. Skipping.")
                    failed_count +=1
                    continue
                original_content_str = _canonical_json_string(entry_with_hash)
                recalculated_hash = _calculate_sha256_hash(original_content_str)
                if stored_hash == recalculated_hash:
                    verified_count += 1
                else:
                    print(f"  Line {i+1}: Hash mismatch! Stored: {stored_hash}, Recalculated: {recalculated_hash}")
                    failed_count += 1
            except json.JSONDecodeError:
                print(f"  Line {i+1}: Invalid JSON. Skipping.")
                failed_count += 1
            except Exception as e:
                print(f"  Line {i+1}: Error verifying hash: {e}. Skipping.")
                failed_count += 1
    print(f"Verification for {os.path.basename(log_file_path)}: {verified_count} verified, {failed_count} failed.")
    return failed_count == 0 and verified_count >= 0, verified_count, failed_count

if __name__ == "__main__":
    if not os.path.exists(EMOTION_TELEMETRY_SCHEMA_PATH) or not os.path.exists(JUSTIFICATION_LOG_SCHEMA_PATH):
        print("FATAL: Core output validation schemas not found in project's ResurrectionCodex. Exiting.")
        sys.exit(1)
    executor = RuntimeExecutor()
    print(f"Logging to directory: {executor.log_directory}")
    if os.path.exists(executor.emotion_log_file):
        os.remove(executor.emotion_log_file)
    if os.path.exists(executor.justification_log_file):
        os.remove(executor.justification_log_file)

    mock_request_valid = {
        "request_id": str(uuid.uuid4()),
        "plan_input": {"task": "test valid execution", "some_detail": "detail_for_valid_plan"},
        "operator_override_signal": None
    }
    print("\n--- Testing Valid Request (Scenario 1) ---")
    result_valid = executor.execute_core_loop(mock_request_valid)
    print(json.dumps(result_valid, indent=2))

    mock_request_with_override_simple = {
        "request_id": str(uuid.uuid4()),
        "plan_input": {
            "task": "test with simple override"
        },
        "operator_override_signal": {
            "override_type": "simple",
            "override_reason": "Testing simple override"
        }
    }
    print("\n--- Testing Request with Simple Override (Scenario 2) ---")
    result_with_override = executor.execute_core_loop(mock_request_with_override_simple)
    print(json.dumps(result_with_override, indent=2))

    # Test external trigger
    print("\n--- Testing External Trigger (Phase 5.1) ---")
    mock_external_trigger = {
        "trigger_id": str(uuid.uuid4()),
        "trigger_type": "cli",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "source": {
            "identifier": "test_user",
            "type": "user",
            "metadata": {
                "hostname": "test_host",
                "cli_version": "1.0.0"
            }
        },
        "payload": {
            "loop_input": {
                "task": "test external trigger",
                "some_detail": "detail_for_external_trigger"
            },
            "options": {
                "wait": True,
                "timeout": 60,
                "verbose": True
            }
        }
    }
    result_external_trigger = executor.handle_external_trigger(mock_external_trigger)
    print(json.dumps(result_external_trigger, indent=2))

    # Test webhook trigger
    print("\n--- Testing Webhook Trigger (Phase 5.1) ---")
    mock_webhook_payload = {
        "auth_token": "test_token",
        "loop_input": {
            "task": "test webhook trigger",
            "some_detail": "detail_for_webhook_trigger"
        },
        "execution_options": {
            "priority": "normal",
            "timeout": 60
        }
    }
    result_webhook_trigger = executor.handle_webhook_trigger(mock_webhook_payload)
    print(json.dumps(result_webhook_trigger, indent=2))

    print("\n--- Verifying Log File Integrity ---")
    verify_logged_hashes(executor.emotion_log_file)
    verify_logged_hashes(executor.justification_log_file)
    verify_logged_hashes(executor.trigger_log_file)
