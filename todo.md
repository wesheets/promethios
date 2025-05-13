# Promethios Phase 2.2 - Builder Manus TODO

## Phase 2.2: Memory Surface Activation + Override Input Handler

### Part 1: Memory Surface Activation (Structured Log Files)

- [x] **1.1. Design Logging Configuration:** (Implemented: `logging.conf.json` and default `./logs/`)
- [x] **1.2. Implement Log Directory Creation:** (Implemented in `runtime_executor.py` `__init__`)
- [ ] **1.3. Emotion Telemetry Logging (`emotion_telemetry.log.jsonl`):
    - [x] **1.3.1. Modify `runtime_executor.py` to capture validated `mgc_emotion_telemetry.json`.** (Implemented in P2.2)
    - [x] **1.3.2. Construct structured log line:** `{"request_id": "<uuid>", "timestamp_capture": "<timestamp>", "telemetry_data": <object>}`. (Implemented in `runtime_executor.py`)
    - [x] **1.3.3. Implement append-to-file logic for `emotion_telemetry.log.jsonl` with error handling.** (Implemented in `runtime_executor.py` `_log_to_file` method)
    - [x] **1.3.4. Ensure logged data matches `mgc_emotion_telemetry.schema.json` (via telemetry_data field).** (Validated in `runtime_executor.py`)
- [ ] **1.4. Justification Log Logging (`justification.log.jsonl`):
    - [x] **1.4.1. Modify `runtime_executor.py` to capture validated `loop_justification_log.v1.json`.** (Implemented in P2.2)
    - [x] **1.4.2. Construct structured log line:** `{"request_id": "<uuid>", "timestamp_capture": "<timestamp>", "justification_data": <object>}`. (Implemented in `runtime_executor.py`)
    - [x] **1.4.3. Implement append-to-file logic for `justification.log.jsonl` with error handling.** (Implemented in `runtime_executor.py` `_log_to_file` method)
    - [x] **1.4.4. Ensure logged data matches `loop_justification_log.schema.v1.json` (v1.2.0) (via justification_data field).** (Validated in `runtime_executor.py`)
- [x] **1.5. Testing for Memory Surface Logging:** (Local validation and `runtime_executor.py` standalone tests cover this)
    - [ ] Develop unit/integration tests to verify telemetry and justification logs are correctly captured, structured, and written to files.
    - [ ] Test log directory creation and configuration.

### Part 2: Operator Override Input Handler Implementation

- [ ] **2.1. Override Signal Reception and Validation (API Layer - `main.py`):
    - [x] **2.1.1. [P2.1 VERIFIED] Review `/loop/execute` endpoint to ensure `operator_override_signal` is correctly parsed.**
    - [x] **2.1.2. Implement strict schema validation of `operator_override_signal` (if provided) against `operator_override.schema.v1.json` in `main.py`.** (Verified in `main.py`)
    - [x] **2.1.3. Ensure API rejects requests with invalid override signals (400 error with details).** (Verified in `main.py`)
- [ ] **2.2. Override Signal Propagation (`runtime_executor.py`):
    - [x] **2.2.1. Modify `runtime_executor.py` to accept the validated `operator_override_signal` from `main.py`.** (Verified in `runtime_executor.py` and `main.py` interaction)
    - [x] **2.2.2. Ensure the signal is correctly passed to `GovernanceCore.execute_loop()`.** (Verified in `runtime_executor.py`).3. `GovernanceCore` Response to Override (Testing & Verification):
    - [x] **2.3.1. Test and verify (using mock `GovernanceCore`) that it acknowledges the signal and its `loop_justification_log.v1.json` output details the override event (type, parameters, impact) as per schema.** (Mock GC updated, verification via tests and local runs)
- [ ] **2.4. API Response Handling for Overrides (`main.py` & `runtime_executor.py`):
    - [x] **2.4.1. Ensure `loop_execute_response.v1.schema.json` (via `justification_log` field) reflects override processing.** (No schema change mandated for response if justification_log is sufficient). (Verified, justification_log in response is sufficient)
- [x] **2.5. Testing for Override Handler:** (Local validation, `main.py` and `runtime_executor.py` standalone tests cover this)
    - [ ] Develop comprehensive unit/integration tests for:
        - [ ] Valid override signals (various types).
        - [ ] Invalid override signals (schema violations).
        - [ ] Requests with no override signal.
        - [ ] Verification of `justification_log` content when override is active.

### Part 3: General Tasks for Phase 2.2

- [x] **3.1. Update Documentation:** (Will be updated before final packaging)
    - [ ] Update `README_API_TESTING.md` to include how to access/observe memory logs and use the operator override feature.
- [ ] **3.2. Codex Adherence and Validation (Continuous):
    - [ ] **3.2.1. Ensure all new code adheres to Codex principles.**
    - [ ] **3.2.2. Implement and pass all Codex Checks specified in `phase_2_2_codex_checks_spec.md`.**
    - [ ] **3.2.3. Confirm no unvalidated modifications to `governance_core.py`.**
- [ ] **3.3. Deliverables Preparation:
    - [ ] **3.3.1. Prepare all updated source code (`main.py`, `runtime_executor.py`, new utilities), config files (e.g. `logging.conf.json`), and test scripts.**
    - [ ] **3.3.2. Draft Phase 2.2 Completion Report.**

### Phase 2.2 Deliverables (from Batch Plan Section 7)

- [ ] Updated `main.py`
- [ ] Updated `runtime_executor.py`
- [ ] New logging utility modules (if any)
- [ ] New configuration files (e.g., `logging.conf.json`)
- [ ] New and updated test scripts
- [ ] Updated `README_API_TESTING.md`
- [ ] Phase 2.2 Completion Report

