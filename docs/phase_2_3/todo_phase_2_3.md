# Phase 2.3 Audit Readiness - TODO

## Task: Kernel Integration and Log Validation (Iterative)

**Objective:** Ensure `runtime_executor.py` correctly captures and logs schema-compliant emotion telemetry and justification logs from the *actual* `GovernanceCore` kernel.

**Key Steps & Status:**

1.  **[COMPLETED]** Setup Actual Kernel Environment
2.  **[COMPLETED]** Configure Schema Paths for Kernel
3.  **[COMPLETED]** Configure `runtime_executor.py`
4.  **[COMPLETED]** Install Dependencies
5.  **[COMPLETED]** Iterative Kernel Testing & Bug Fixing (Justification Logs)
6.  **[COMPLETED]** Validate Emotion Telemetry Logging
    *   **[OBSERVED - Secondary Issue]** Kernel internal validation for emotion telemetry fails with `Schema Validation Error for \'emotion_telemetry\': \'factor\' is a required property` when processing `trust_factor` (Scenario 3). This does not block `runtime_executor.py` from capturing the *initial* valid emotion telemetry, but indicates a separate kernel bug to be addressed.
7.  **[COMPLETED]** Validate Justification Log Logging
8.  **[COMPLETED]** Validate SHA256 Hashing for Logs

## Task: CLI Observability Tool (`view_logs.py`) Development

**Objective:** Develop a CLI tool to parse, view, and query `emotion_telemetry.log.jsonl` and `justification.log.jsonl`.

**Key Sub-Tasks & Status:**

1.  **[COMPLETED]** Initial Setup & Argument Parsing:
    *   **[COMPLETED]** Implement basic script structure for `view_logs.py`.
    *   **[COMPLETED]** Use `argparse` (or similar) to handle global options (`--emotion-log-file`, `--justification-log-file`, `-h`, `--help`).
    *   **[COMPLETED]** Implement logic to use default log file paths if not provided.
    *   **[COMPLETED]** Implement graceful handling for missing/empty log files (initial version in `load_log_file`).
2.  **[COMPLETED]** Core Viewing - `list_loops` / `recent` command:
    *   **[COMPLETED]** Implement command to display a summary of the last N loop executions (default N=10).
    *   **[COMPLETED]** Extract `request_id`, timestamp, overall status, and primary emotion state.
    *   **[COMPLETED]** Implement `--start-date` and `--end-date` options for this command.
    *   **[COMPLETED]** Ensure human-readable, well-formatted output.
3.  **[COMPLETED]** Core Viewing - `get_loop <request_id>` command:
    *   **[COMPLETED]** Implement command to display detailed emotion telemetry for a given `request_id`.
    *   **[COMPLETED]** Implement command to display full justification trace for a given `request_id`.
    *   **[COMPLETED]** Ensure pretty-printed JSON for readability.
4.  **[COMPLETED]** Filtering - `find_overrides` command:
    *   **[COMPLETED]** Implement command to list loop executions where an operator override was active.
    *   **[COMPLETED]** Implement `--start-date` and `--end-date` options for this command.
5.  **[COMPLETED]** Filtering - `query_logs` command (Advanced):
    *   **[COMPLETED]** Implement command structure.
    *   **[COMPLETED]** Implement filtering by `--request-id`.
    *   **[COMPLETED]** Implement filtering by `--start-date` and `--end-date`.
    *   **[COMPLETED]** Implement filtering by `--override-active <true|false>`.
    *   **[COMPLETED]** Implement filtering by `--log-type <emotion|justification|all>`.
    *   **[COMPLETED]** (Optional Bonus) Implement filtering by `--emotion-state`.
    *   **[COMPLETED]** (Optional Bonus) Implement keyword search with `--search-term`.
6.  **[COMPLETED]** Error Handling & Usability:
    *   **[COMPLETED]** Implement comprehensive help messages for all commands and options (via argparse formatter_class and help strings).
    *   **[COMPLETED]** Ensure robust error handling for invalid arguments, file issues, malformed log entries (partially done in `load_log_file` and `parse_iso_datetime`).
7.  **[IN PROGRESS]** Testing:
    *   **[COMPLETED]** Perform manual testing of all CLI commands and options.
    *   **[PENDING]** Develop unit tests for parsing functions and command handlers.
    *   **[PENDING]** Prepare more sample log files for integration tests (various scenarios beyond basic).
    *   **[PENDING]** Develop integration tests for CLI commands.
8.  **[PENDING]** Documentation:
    *   **[PENDING]** Add internal code comments.
    *   **[PENDING]** Create user documentation (e.g., `README_VIEW_LOGS.md` or update existing README).

## Task: Validator & Reporting Tools Development

**Objective:** Develop a suite of tools for log packaging, schema validation, component usage analysis, and deterministic replay testing.

**1. Log Collection & Packaging Utility (`package_logs.py`)**
    *   **[COMPLETED]** Implement argument parsing (`--request-ids`, `--start-date`, `--end-date`, `--num-recent-loops`, `--include-overrides-only`, `--output-file`, log file paths).
    *   **[COMPLETED]** Implement logic to read and filter emotion and justification logs based on criteria.
    *   **[COMPLETED]** Implement logic to write filtered entries to temporary `.jsonl` files.
    *   **[COMPLETED]** Implement logic to package temporary files into a specified ZIP archive.
    *   **[COMPLETED]** Ensure graceful error handling (file I/O, invalid args) - Basic handling implemented, needs review for robustness.
    *   **[COMPLETED]** Add help messages and user documentation.
    *   **[COMPLETED]** Develop unit and integration tests.

**2. Schema Validation Reporting Tool (`validate_schema_compliance.py`)**
    *   **[COMPLETED]** Implement argument parsing (input log file(s) or ZIP archive).
    *   **[COMPLETED]** Implement logic to handle individual `.jsonl` or ZIP input.
    *   **[COMPLETED]** Implement logic to determine log entry type and load corresponding Codex schema.
    *   **[COMPLETED]** Implement schema validation for each log entry using `jsonschema`.
    *   **[COMPLETED]** Implement summary report generation (total checked, passed, failed, details for failures).
    *   **[COMPLETED]** Ensure robust error handling - Basic handling implemented, needs review for robustness.
    *   **[COMPLETED]** Add help messages and user documentation.
    *   **[COMPLETED]** Develop unit and integration tests (with valid and invalid logs).

**3. Component Inventory & Invocation Analysis Tool (`analyze_component_usage.py`)**
    *   **[COMPLETED]** Implement argument parsing (justification log files, Codex manifest, output report).
    *   **[COMPLETED]** Implement Codex manifest parsing (e.g., `ResurrectionCodex/manifest.md`).
    *   **[COMPLETED]** Implement justification log analysis to identify schema/component invocations.
    *   **[COMPLETED]** Implement report generation comparing manifest to observed invocations.
    *   **[COMPLETED]** Ensure robust error handling - Basic handling implemented, needs review for robustness.
    *   **[COMPLETED]** Add help messages and user documentation.
    *   **[COMPLETED]** Develop unit and integration tests.

**4. Deterministic Replay Test Harness (e.g., `test_deterministic_replay.py` or extend `test_api.py`)**
    *   **[COMPLETED]** Implement argument parsing for input request payload file, output report, and kernel path.
    *   **[COMPLETED]** Implement logic to make two consecutive identical calls to `/loop/execute` API (using actual kernel via `runtime_executor.py` and `PROMETHIOS_KERNEL_PATH`).
    *   **[COMPLETED]** Implement capture of log entries and `entry_sha256_hash` for each run.
    *   **[COMPLETED]** Implement comparison of hash sequences from both runs.
    *   **[COMPLETED]** Implement report generation (pass/fail for deterministic replay).
    *   **[COMPLETED]** Ensure robust error handling - Basic handling implemented, needs review for robustness.
    *   **[COMPLETED]** Add help messages and user documentation.
    *   **[COMPLETED]** Develop tests for the harness.

## Task: Final Phase 2.3 Steps

1.  **[PENDING]** Pass All Codex Checks for Phase 2.3.
2.  **[PENDING]** Prepare Deliverables (Completion Report, updated code, etc.).