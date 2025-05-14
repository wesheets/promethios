# Promethios UI Justification Surface - README

**Version:** 1.0
**Date:** 2025-05-14

## 1. Introduction

The Promethios UI Justification Surface is a minimal, Codex-governed web application designed to provide Operators with visibility into the cognitive logs of the Promethios system. It allows for the review of emotion telemetry and justification logs, verification of log integrity via SHA256 hashes, and initiation of manual deterministic replays.

This UI prioritizes **visibility** and **trust**, presenting schema-bound log data from Codex-sealed surfaces in a structured, traceable, and human-readable format.

## 2. Setup and Installation

### Prerequisites

*   Python 3.8+ installed.
*   Access to the `promethios_repo` Git repository.
*   Log files (`emotion_telemetry.log.jsonl`, `justification.log.jsonl`) and `sha256_manifest.txt` present in the configured log directory (default: `promethios_repo/logs/`).
*   The `test_deterministic_replay.py` script (or equivalent) available at the configured path (default: `promethios_repo/test_deterministic_replay.py`).

### Installation Steps

1.  **Clone the Repository (if not already done):**
    ```bash
    git clone <repository_url> promethios_repo
    cd promethios_repo
    ```

2.  **Navigate to the UI Surface Directory:**
    ```bash
    cd promethios_ui_surface
    ```

3.  **Create and Activate a Virtual Environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
    *(On Windows, use `venv\Scripts\activate`)*

4.  **Install Dependencies:**
    The `create_flask_app` utility should have created an initial `requirements.txt`. If you added dependencies, ensure they are listed. For a basic Flask app, it might be minimal.
    ```bash
    pip install Flask
    # Add any other specific dependencies if they were introduced
    pip freeze > requirements.txt # To update requirements.txt if new packages were added
    ```
    Ensure `Flask` is in your `requirements.txt`. If it was created by `create_flask_app` it should be.

5.  **Configure Log Paths (Optional - Environment Variables):**
    The application uses environment variables to locate log files and other configurations. Default paths are set in `src/config.py` relative to the `promethios_repo` root.
    To override defaults, set these environment variables before running the application:
    *   `LOG_DATA_DIR`: Absolute path to the directory containing log files and the manifest.
    *   `EMOTION_LOG_FILENAME`: Filename for emotion telemetry logs (default: `emotion_telemetry.log.jsonl`).
    *   `JUSTIFICATION_LOG_FILENAME`: Filename for justification logs (default: `justification.log.jsonl`).
    *   `SHA256_MANIFEST_FILENAME`: Filename for the SHA256 manifest (default: `sha256_manifest.txt`).
    *   `REPLAY_SCRIPT_NAME`: Name of the replay script relative to `PROJECT_ROOT` (default: `test_deterministic_replay.py`).
    *   `ITEMS_PER_PAGE`: Number of log entries per page (default: `20`).

    Example:
    ```bash
    export LOG_DATA_DIR="/path/to/your/custom/logs"
    ```

## 3. Running the Application

1.  **Ensure your virtual environment is activated.**
    ```bash
    source venv/bin/activate 
    ```
    *(Or `venv\Scripts\activate` on Windows)*

2.  **Navigate to the UI surface source directory:**
    ```bash
    cd /path/to/promethios_repo/promethios_ui_surface/src
    ```

3.  **Run the Flask Application:**
    ```bash
    python main.py
    ```

4.  **Access the UI:**
    Open your web browser and navigate to `http://0.0.0.0:5001` (or `http://localhost:5001`).

## 4. Using the UI Features

### 4.1. Home Page
*   Provides a brief overview and navigation links to other sections.

### 4.2. Emotion Telemetry Logs (`/emotion_logs`)
*   **View Logs:** Displays emotion telemetry log entries in a paginated table.
*   **Fields Displayed:** Includes Line Number, Request ID, Capture Timestamp, Telemetry Timestamp, Emotion State, State Intensity, Trust Score, Triggering Event ID, Contributing Factors, Entry SHA256, and Component Versions.
*   **Filtering:**
    *   **By Emotion State:** Enter text to filter logs where the emotion state contains the entered string (case-insensitive).
    *   **By Timestamp:** Select a start and/or end date/time to filter logs within that range.
*   **Pagination:** Navigate through pages of log entries.
*   **Clear Filters:** Resets all active filters.

### 4.3. Justification Logs (`/justification_logs`)
*   **View Logs:** Displays justification log entries in a paginated table.
*   **Fields Displayed:** Includes Line Number, Request ID, Capture Timestamp, Log Entry ID, Log Timestamp, Loop ID, Agent ID, Plan ID, Decision Type, Decision Outcome, Justification Text (preformatted), Rejection Reason, Emotion at Decision (parsed JSON, preformatted), Trust at Decision, Override Signal, Override Details, Override Required, Validation Passed, Schema Versions, Entry SHA256, and Component Versions.
*   **Filtering:**
    *   **By Decision Outcome:** Enter text to filter logs where the decision outcome contains the entered string (case-insensitive).
    *   **By Override Required:** Select `Any`, `True`, or `False` from the dropdown.
    *   **By Timestamp:** Select a start and/or end date/time to filter logs within that range.
*   **Pagination:** Navigate through pages of log entries.
*   **Clear Filters:** Resets all active filters.

### 4.4. Log Integrity Check (`/integrity_check`)
*   **Functionality:** Reads the `sha256_manifest.txt` file from the configured log directory.
*   For each file listed in the manifest, it calculates the SHA256 hash of the corresponding log file (located in the same log directory) and compares it to the expected hash from the manifest.
*   **Display:** Shows a table with:
    *   **File Path (from Manifest):** The relative path of the log file as listed in the manifest.
    *   **Expected SHA256 Hash:** The hash value from the manifest.
    *   **Calculated SHA256 Hash:** The newly computed hash of the log file.
    *   **Status:** 
        *   `Valid`: Expected and calculated hashes match.
        *   `Invalid`: Hashes do not match.
        *   `File Not Found`: The log file listed in the manifest was not found in the log directory.
        *   `Error`: An error occurred during processing (e.g., manifest format error).

### 4.5. Manual Replay (`/replay`)
*   **Functionality:** Allows an operator to trigger the `test_deterministic_replay.py` script (or configured equivalent).
*   **Input Form:**
    *   **Scenario ID / Log File Path (Required):** The ID of the replay scenario or the path to a specific input log file for the replay script. This is typically a filename like `deterministic_replay_input_audit_replay_test_xxxxxxxx.json`.
    *   **Path to loop_input.json (Optional):** If the replay script requires a specific `loop_input.json` that isn_t inferred by the scenario ID, provide its path here. Paths should be relative to the `LOG_DATA_DIR` or absolute (use with caution, ensure paths are valid and secure).
*   **Action:** Clicking "Initiate Replay" executes the replay script with the provided parameters.
*   **Output Display:** Shows the standard output (stdout) and standard error (stderr) from the executed replay script, along with its return code.

## 5. Configuration Details (`src/config.py`)

The application configuration is managed in `src/config.py`. Key settings include:

*   `PROJECT_ROOT`: Automatically determined root of the `promethios_repo`.
*   `DEFAULT_LOG_DIR`: Default log directory (`promethios_repo/logs/`).
*   `LOG_DATA_DIR`: Actual log directory used, configurable via environment variable `LOG_DATA_DIR`.
*   `EMOTION_LOG_FILE`, `JUSTIFICATION_LOG_FILE`, `SHA256_MANIFEST_FILE`: Full paths to these files, constructed using `LOG_DATA_DIR` and configurable filenames (e.g., `EMOTION_LOG_FILENAME`).
*   `REPLAY_SCRIPT_PATH`: Full path to the replay script, constructed using `PROJECT_ROOT` and a configurable script name (`REPLAY_SCRIPT_NAME`).
*   `ITEMS_PER_PAGE`: Number of items per page in log views, configurable via `ITEMS_PER_PAGE` environment variable.

## 6. Troubleshooting

*   **File Not Found Errors (Logs/Manifest):**
    *   Ensure the `LOG_DATA_DIR` environment variable (if set) points to the correct directory containing your log files and `sha256_manifest.txt`.
    *   Verify that the filenames specified in `src/config.py` (or via environment variables like `EMOTION_LOG_FILENAME`) match the actual filenames in your log directory.
    *   The application creates empty dummy files on first startup if they don_t exist in the default location. If you_re using custom locations, ensure the files are present.
*   **Replay Script Not Found/Errors:**
    *   Ensure `REPLAY_SCRIPT_PATH` in `src/config.py` (or `REPLAY_SCRIPT_NAME` env var) correctly points to your `test_deterministic_replay.py` script relative to the `promethios_repo` root.
    *   Check the permissions of the replay script to ensure it_s executable by the user running the Flask application.
    *   Review the output displayed in the UI for specific error messages from the script itself.
*   **Incorrect Hashes in Integrity Check:**
    *   Ensure the `sha256_manifest.txt` was generated correctly for the *current* versions of the log files in `LOG_DATA_DIR`.
    *   If log files are modified after the manifest is created, hashes will mismatch.
*   **Timestamp Filtering Issues:**
    *   Ensure timestamps in your log data are in a format that can be parsed by `datetime.fromisoformat` or the fallback `strptime` (e.g., `YYYY-MM-DDTHH:MM:SSZ` or `YYYY-MM-DDTHH:MM:SS.sssZ`).
    *   The UI uses `datetime-local` input, which should generally align with ISO format.
*   **General Flask Errors:**
    *   Check the Flask development server console output for detailed error messages and tracebacks.
    *   Ensure all dependencies in `requirements.txt` are installed in your active virtual environment.

## 7. Developer Notes

*   The application is structured with a `src` directory containing `main.py` (Flask routes), `config.py`, `utils/log_parser.py`, and `templates/` and `static/` subdirectories.
*   Log parsing includes adding `_line_number` and `entry_sha256_hash` to each log entry for traceability.
*   The `emotion_state_at_decision` field in justification logs is parsed from a JSON string into a more readable format for display.
*   Pagination is handled by a simple `Pagination` class in `main.py`.
*   The replay feature uses `subprocess.run()` to execute the external replay script. Care has been taken to sanitize inputs, but further security hardening might be considered depending on the deployment environment.

This UI is a tool for transparency and auditability, adhering to the principles of the Promethios project.

