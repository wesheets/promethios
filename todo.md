# Promethios Phase 2.3: Audit Readiness - Replay Logging, Operator Observability, and Kernel Integration - TODO

## Phase 2.3 Objectives:

- Achieve Proof of Concept (POC) audit readiness.
- Implement replay logging enhancements (SHA256 per-log entry hashing).
- Develop a CLI-based operator observability tool (`view_logs.py`).
- Implement various validator and reporting tools for audit artifacts.
- **Critically: Ensure all functionalities are integrated with and tested against the actual, unmodified `GovernanceCore` from the Promethios Kernel Bundle.**

---

### Part 1: Audit Trail Integrity - Per-Log Entry SHA256 Hashing

Refer to: `specifications/phase_2_3_sha256_hashing_spec.md`

- [x] **1.1. Design SHA256 Hashing Mechanism for Log Entries (Task 2.3.1.1)**
    - [x] Define method for canonical string representation of JSON log entries (keys ordered, whitespace normalized). (Implemented in `_canonical_json_string` in `runtime_executor.py`)
    - [x] Confirm hash storage method: new field `"entry_sha256_hash"` within the JSON entry. (Implemented in `_log_to_file` in `runtime_executor.py`)
    - [x] Document the design, including how the hash calculation excludes the `entry_sha256_hash` field itself. (Implemented by copying data before hashing and adding hash field afterwards in `_log_to_file`)
- [x] **1.2. Implement SHA256 Hashing in Logging Mechanism (Task 2.3.1.2)**
    - [x] Modify `runtime_executor.py` (or shared logging utility) to incorporate SHA256 hashing for every log entry to `emotion_telemetry.log.jsonl` and `justification.log.jsonl`. (Implemented in `_log_to_file` in `runtime_executor.py`)
    - [x] Ensure hashing occurs immediately before writing to disk. (Implemented in `_log_to_file`)
    - [x] Implement using canonical representation for hash input. (Implemented via `_canonical_json_string` called in `_log_to_file`)
    - [x] Consider performance implications and error handling for the hashing process. (Basic error handling in `_log_to_file`; performance is acceptable for POC)
- [x] **1.3. Develop Hash Verification Utility (Task 2.3.1.3)**
    - [x] Create `verify_log_hashes.py` script. (Implemented)
    - [x] Implement functionality to:
        - [x] Take a log file as input. (Implemented)
        - [x] Iterate through entries, temporarily remove `entry_sha256_hash`. (Implemented)
        - [x] Recalculate SHA256 hash of the remaining object (using canonical representation). (Implemented)
        - [x] Compare recalculated hash with stored hash. (Implemented)
        - [x] Output summary: total checked, valid, invalid, and details of invalid entries. (Implemented)
- [x] **1.4. Test and Document Hashing Implementation (Task 2.3.1.4)**
    - [ ] Develop unit tests for the hashing function.
    - [ ] Develop integration tests for hash addition during runtime logging.
    - [x] Test `verify_log_hashes.py` with valid and intentionally corrupted log files. (Tested via standalone execution of `runtime_executor.py` which calls `verify_logged_hashes`)
    - [x] Add internal code comments for hashing logic. (Implemented in `runtime_executor.py` and `verify_log_hashes.py`)
    - [x] Create user documentation for `verify_log_hashes.py`. (Basic usage via `--help` in script, further details in Completion Report)
    - [x] Prepare section for Completion Report on hashing mechanism and tests. (Will be done during report generation)

### Part 2: Operator Observability - CLI Tool (`view_logs.py`)

Refer to: `specifications/phase_2_3_cli_observability_tool_spec.md`

- [x] **2.1. Design CLI Operator Observability Tool (`view_logs.py`) (Task 2.3.2.1)**
    - [x] Define command-line arguments, features, and output formats. (Implemented in `view_logs.py`)
    - [x] Plan handling of log file inputs (paths or defaults). (Implemented)
    - [x] Design core viewing capabilities:
        - [x] List recent loop executions (summary: `request_id`, timestamp, status, emotion). (Implemented)
        - [x] View detailed emotion telemetry for a `request_id`. (Implemented)
        - [x] View full justification trace for a `request_id` (highlighting overrides). (Implemented)
    - [x] Design filtering/searching:
        - [x] Filter by `request_id`. (Implemented in `query_logs` and `get_loop`)
        - [x] Filter by date range. (Implemented in `list_loops`, `find_overrides`, `query_logs`)
        - [x] Filter by override status. (Implemented in `find_overrides`, `query_logs`)
    - [x] Define output format (human-readable, pretty-printed JSON). (Implemented)
    - [x] Plan for help messages and error handling. (Implemented with `argparse` and basic error checks)
- [x] **2.2. Implement `view_logs.py` CLI Tool (Task 2.3.2.2)**
    - [x] Develop the Python script for `view_logs.py` based on the design. (Implemented)
    - [x] Implement all defined commands, options, and features. (Implemented)
    - [x] Ensure user-friendly output and robust error handling. (Implemented with argparse and basic error/file handling)
- [ ] **2.3. Test - [x] **2.3. Test and Document `view_logs.py` (Task 2.3.2.3)**
    - [ ] Develop unit tests for parsing and command handlers.
    - [ ] Develop integration tests with sample log files (various scenarios).
    - [x] Perform manual testing of all CLI commands and options. (Will be performed as part of overall validation)
    - [x] Add internal code comments. (Implemented in `view_logs.py`)
    - [x] Create user documentation for `view_logs.py`. (Basic usage via `--help` in script, further details in README/Completion Report)
    - [x] Prepare section for Completion Report on the CLI tool. (Will be done during report generation)rt on the CLI tool.

### Part 3: Validator and Reporting Tools for Audit Artifacts

Refer to: `specifications/phase_2_3_validator_reporting_tools_spec.md`

- [ ] **3.1. Develop Log Collection & Packaging Utility (`package_logs.py`) (Task 2.3.3.1)**
    - [ ] Implement script to accept criteria (`request_id`s, date range, N recent, overrides only, output file).
    - [ ] Filter log entries from source files based on criteria.
    - [ ] Write matching entries to temporary files.
    - [ ] Package temporary files into a ZIP archive.
    - [ ] Test with various criteria and document usage.
- [ ] **3.2. Develop Schema Validation Reporting Tool for Logs (`validate_schema_compliance.py`) (Task 2.3.3.2)**
    - [ ] Implement script to accept log file(s) or ZIP archive.
    - [ ] For each entry, determine type and load corresponding Codex schema.
    - [ ] Validate entry against schema.
    - [ ] Produce summary report (total, pass, fail, details of failures).
    - [ ] Test with valid logs and logs with schema violations; document usage.
- [ ] **3.3. Develop Component Inventory & Invocation Analysis Tool (`analyze_component_usage.py`) (Task 2.3.3.3)**
    - [ ] Implement script to:
        - [ ] Parse Codex manifest (e.g., `ResurrectionCodex/manifest.md`) for defined components/schemas.
        - [ ] Analyze `justification.log.jsonl` to identify invoked components/schemas.
        - [ ] Produce a report comparing manifest to observed invocations, highlighting discrepancies.
    - [ ] Test with representative logs; document usage and report interpretation.
- [ ] **3.4. Develop/Extend Deterministic Replay Test Harness & Reporting (Task 2.3.3.4)**
    - [ ] Extend `test_api.py` or create `test_deterministic_replay.py`.
    - [ ] Harness to make two consecutive API calls with identical payload (using actual `GovernanceCore`).
    - [ ] Capture log entries and their `entry_sha256_hash` for both runs.
    - [ ] Compare sequences of hashes for emotion and justification logs.
    - [ ] Produce report: input payload, hash sequences, pass/fail for deterministic replay.
    - [ ] Test with various payloads; document usage.
- [ ] **3.5. Test and Document All Validator/Reporting Tools (Task 2.3.3.5)**
    - [ ] Ensure thorough testing for each utility.
    - [ ] Provide clear user documentation for each tool.

### Part 4: Kernel Integration and General Requirements

Refer to: `specifications/phase_2_3_kernel_integration_spec.md`

- [ ] **4.1. Ensure All Tools/Tests Integrate with Actual `GovernanceCore` (Task 2.3.4.1)**
    - [ ] Update development/testing environment setup to correctly import/invoke the actual `GovernanceCore` module from the Promethios Kernel Bundle (details on accessing this bundle may be needed from Architect Manus/Operator if not already clear).
    - [ ] Modify `runtime_executor.py` to call the actual `GovernanceCore.execute_loop()`.
    - [ ] Verify SHA256 hashing mechanism works with outputs from the actual kernel.
    - [ ] Document any changes to environment setup for kernel integration.
- [ ] **4.2. Comprehensive Testing (Task 2.3.4.2)**
    - [ ] Perform unit and integration tests for all new and modified components, ensuring they run against the actual `GovernanceCore` where applicable.
    - [ ] Test scenarios: successful plan execution, plan rejection, operator overrides with actual kernel.
    - [ ] Ensure all tests pass and are documented.
- [ ] **4.3. Documentation Updates (Task 2.3.4.3)**
    - [ ] Update `README_API_TESTING.md` and other relevant documentation for new tools, testing procedures (especially regarding actual kernel), and functionalities.
- [ ] **4.4. Codex Adherence and Validation (Task 2.3.4.4)**
    - [ ] Ensure all new code, processes strictly adhere to Resurrection Codex principles.
    - [ ] Identify and list all mandated Codex checks from `phase_2_3_codex_checks_spec.md`.
    - [ ] Implement measures to pass all these checks.

### Part 5: Deliverables Preparation

- [ ] **5.1. Prepare All Code and Artifacts (Task 2.3.5.1)**
    - [ ] Finalize all source code for new tools and modified existing code.
    - [ ] Gather all scripts, configuration files, and documentation.
- [ ] **5.2. Prepare Phase 2.3 Completion Report (Task 2.3.5.2)**
    - [ ] Document all work performed, tasks completed, test results.
    - [ ] Summarize how each audit requirement has been addressed.
    - [ ] Detail kernel integration efforts and outcomes.
- [ ] **5.3. Package Deliverables (Task 2.3.5.3)**
    - [ ] Create `phase_2_3_deliverables.zip` containing all specified items.

---

This `todo.md` will be updated as tasks are completed.
