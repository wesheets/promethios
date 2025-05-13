# Promethios Phase 2.1 - Builder Manus TODO

## Phase 2.1: Runtime Execution Interface Implementation

### 1. Project Setup and Artifact Integration
- [ ] **1.1. Clone Promethios Repository:** (Completed) Cloned from `https://github.com/wesheets/promethios`.
- [ ] **1.2. Setup Virtual Environment:** (Completed) Python 3.11 venv created and FastAPI, Uvicorn, Pydantic, python-multipart, uuid installed.
- [ ] **1.3. Obtain Core Artifacts:**
    - [ ] Obtain `promethios_kernel_bundle.zip` or individual core artifacts (`governance_core.py`, `mgc_emotion_telemetry.schema.json`, `loop_justification_log.schema.v1.json`, `operator_override.schema.v1.json`).
    - [ ] Place artifacts into the `promethios_repo` directory structure (e.g., `ResurrectionCodex/...`).
- [ ] **1.4. Verify Integrity of Core Artifacts (Codex Check 5.3):**
    - [ ] Verify hash of `governance_core.py` (Expected: `170e18a9ca2a9d18529d4e0ce62898ff65f1e11891847db2fac362c227a9ff60`).
    - [ ] Verify hash of `loop_runtime_test_harness.py` (Expected: `1500a2b129871ceb376294a1adc1d8e5897d7c57d683a3634e03bb699a1bf202`) (if used).
- [ ] **1.5. Ensure Python Dependencies for `governance_core.py`:**
    - [ ] Identify and install any additional dependencies required by `governance_core.py`.

### 2. API Schema Definition (Batch Plan Section 5.1)
- [ ] **2.1. Create `loop_execute_request.v1.schema.json`:**
    - [ ] Define schema based on `loop_execute_trigger_interface_spec.md`.
    - [ ] Place in `promethios_repo/ResurrectionCodex/02_System_Architecture/API_Schemas/loop_execute_request.v1.schema.json`.
- [ ] **2.2. Create `loop_execute_response.v1.schema.json`:**
    - [ ] Define schema based on `loop_execute_trigger_interface_spec.md`.
    - [ ] Place in `promethios_repo/ResurrectionCodex/02_System_Architecture/API_Schemas/loop_execute_response.v1.schema.json`.

### 3. `GovernanceCore` Invocation Logic (`runtime_executor.py`) (Task 2.1.2)
- [ ] **3.1. Develop `runtime_executor.py`:**
    - [ ] Create `promethios_repo/runtime_executor.py`.
    - [ ] Implement logic to instantiate `GovernanceCore` from `governance_core.py`.
    - [ ] Implement function to invoke `GovernanceCore.execute_loop()`.
- [ ] **3.2. Input Handling for `GovernanceCore` (Task 2.1.3):**
    - [ ] Transform API input (`plan_input`, `operator_override_signal`) into the format expected by `governance_core.py`.
- [ ] **3.3. Output Capturing from `GovernanceCore`:**
    - [ ] Capture direct return value.
    - [ ] Capture emotion telemetry JSON.
    - [ ] Capture justification log JSON.

### 4. FastAPI Endpoint: `/loop/execute` (Batch Plan Section 5)
- [ ] **4.1. Create FastAPI Application:**
    - [ ] Set up `main.py` (or similar) in `promethios_repo/` with FastAPI app.
- [ ] **4.2. Implement `POST /loop/execute` Endpoint:**
    - [ ] Define endpoint to accept requests conforming to `loop_execute_request.v1.schema.json`.
    - [ ] Use `runtime_executor.py` to call `GovernanceCore`.
    - [ ] Construct response conforming to `loop_execute_response.v1.schema.json`.

### 5. Codex Compliance: Validations and Checks
- [ ] **5.1. Input Validation (Codex Checks 1.1, 1.2):**
    - [ ] Validate incoming `/loop/execute` request body against `loop_execute_request.v1.schema.json`.
    - [ ] If `operator_override_signal` is present, validate it against `operator_override.schema.v1.json`.
    - [ ] Implement rejection with 400 error and details on failure.
- [ ] **5.2. Output Schema Validation (Task 2.1.4, Codex Checks 2.1, 2.2):**
    - [ ] Validate captured emotion telemetry against `mgc_emotion_telemetry.schema.json`.
    - [ ] Validate captured justification log against `loop_justification_log.schema.v1.json` (v1.2.0).
    - [ ] Handle validation failures as per plan (log, nullify/indicate in response, update `error_details`).
- [ ] **5.3. Operator Override Handling (Task 2.1.4.5, Codex Checks 3.1, 3.2):**
    - [ ] Ensure valid `operator_override_signal` is passed to `GovernanceCore`.
    - [ ] Verify `justification_log` correctly reflects override status.
- [ ] **5.4. Justification Log Content Checks (Codex Checks 4.1, 4.2):**
    - [ ] Ensure all mandatory fields in `justification_log` are populated.
    - [ ] Ensure `schema_versions` field in `justification_log` is accurate.
- [ ] **5.5. General Codex Adherence (Task 2.1.6, Codex Checks 5.1, 5.2):**
    - [ ] Ensure no unregistered schemas are used.
    - [ ] Ensure no unauthorized memory surface access.

### 6. Logging and Error Handling (Task 2.1.5)
- [ ] **6.1. Implement Logging in `runtime_executor.py`:**
    - [ ] Log key events, inputs, outputs, errors.
- [ ] **6.2. Graceful Error Handling:**
    - [ ] Catch exceptions from `GovernanceCore` execution.
    - [ ] Report errors appropriately in API response (`execution_status`, `error_details`).

### 7. Testing and Validation (Deliverables Section 8)
- [ ] **7.1. Unit and Integration Tests:**
    - [ ] Write tests for `runtime_executor.py`.
    - [ ] Write tests for the `/loop/execute` API endpoint.
- [ ] **7.2. Local Validation:**
    - [ ] Manually test the endpoint with various valid and invalid inputs.
    - [ ] Verify all Codex checks pass during testing.

### 8. Deliverables (Batch Plan Section 8)
- [ ] **8.1. Prepare `runtime_executor.py`.**
- [ ] **8.2. Prepare `loop_execute_request.v1.schema.json`.**
- [ ] **8.3. Prepare `loop_execute_response.v1.schema.json`.**
- [ ] **8.4. Prepare unit/integration tests.**
- [ ] **8.5. Prepare documentation for running/testing API locally (e.g., a `README.md` section).**
- [ ] **8.6. Prepare report confirming task completion and Codex check validation.**
- [ ] **8.7. Package all deliverables.**

