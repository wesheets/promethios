# How to Run and Test the /loop/execute API Locally (Phase 2.2 Update)

This document provides instructions for running the FastAPI application and executing the tests for the `/loop/execute` API endpoint, including features added in Phase 2.2 (Memory Surface Activation and Operator Override Handling).

## 1. Prerequisites

- Python 3.11
- Git
- Access to the Promethios repository: `https://github.com/wesheets/promethios`

## 2. Setup

1.  **Clone the Repository (if not already done) and Checkout the Correct Branch:**
    ```bash
    # If starting fresh:
    git clone https://github.com/wesheets/promethios promethios_repo
    cd promethios_repo
    # Ensure you are on the main branch or the relevant feature branch for Phase 2.2 (e.g., feature/phase-2.2-memory-override)
    # git checkout main
    # git pull origin main
    # git checkout feature/phase-2.2-memory-override
    ```

2.  **Create and Activate Virtual Environment:**
    ```bash
    python3.11 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Install Dependencies:**
    The core dependencies (`fastapi`, `uvicorn`, `python-multipart`, `pydantic`, `uuid`, `jsonschema`) should have been installed. For testing, you also need `pytest` and `httpx`.
    ```bash
    pip install fastapi uvicorn python-multipart pydantic uuid jsonschema pytest httpx
    ```

4.  **Ensure Codex Artifacts and Configuration are in Place:**
    The application expects the following directory structure and files (mock versions are provided in the repository for local testing):
    ```
    promethios_repo/
    ├── ResurrectionCodex/
    │   ├── 01_Minimal_Governance_Core_MGC/
    │   │   ├── MGC_Schema_Registry/
    │   │   │   ├── mgc_emotion_telemetry.schema.json
    │   │   │   ├── loop_justification_log.schema.v1.json
    │   │   │   └── operator_override.schema.v1.json
    │   │   └── governance_core.py (mock implementation)
    │   └── 02_System_Architecture/
    │       └── API_Schemas/
    │           ├── loop_execute_request.v1.schema.json
    │           └── loop_execute_response.v1.schema.json
    ├── logs/  (This directory will be created automatically if it doesn't exist, or based on logging.conf.json)
    ├── logging.conf.json (Optional, defaults to ./logs/)
    ├── main.py
    ├── runtime_executor.py
    └── test_api.py
    ```
    The `logging.conf.json` file can be created to specify a custom log directory:
    ```json
    {
      "log_directory": "./my_custom_promethios_logs"
    }
    ```
    If this file is not present, logs will be written to `./logs/` by default.

## 3. Running the FastAPI Application Locally

Navigate to the root of the `promethios_repo` directory where `main.py` is located.

Run the Uvicorn server:
```bash
.venv/bin/uvicorn main:app --reload --port 8000
```

The API will be accessible at `http://127.0.0.1:8000`.
-   The `/loop/execute` endpoint is at `http://127.0.0.1:8000/loop/execute` (POST).
-   The health check endpoint is at `http://127.0.0.1:8000/` (GET).
-   API documentation (Swagger UI) is available at `http://127.0.0.1:8000/docs`.
-   Alternative API documentation (ReDoc) is available at `http://127.0.0.1:8000/redoc`.

## 4. Running Tests

Ensure your virtual environment is activated and you are in the `promethios_repo` directory.

Run Pytest:
```bash
.venv/bin/pytest test_api.py
```

This will execute all tests defined in `test_api.py`, covering:
-   Health check.
-   Valid `/loop/execute` requests (with and without override signals).
-   Invalid JSON body requests.
-   Requests with missing required fields (e.g., `request_id`).
-   Requests with invalid `operator_override_signal` schema.
-   (Phase 2.2) Verification of memory surface log file creation and content (implicitly via successful execution and manual inspection, or dedicated tests if added).

## 5. Memory Surface Activation (Phase 2.2 Feature)

As of Phase 2.2, the `GovernanceCore`'s memory outputs (`emotion_telemetry` and `justification_log`) are logged to structured JSON Lines files.

-   **Log File Location:** By default, logs are stored in the `./logs/` directory relative to the application root. This can be changed by creating a `logging.conf.json` file in the root directory with the content: `{"log_directory": "./your_preferred_log_path"}`.
-   **Emotion Telemetry Log:** `emotion_telemetry.log.jsonl`
-   **Justification Log:** `justification.log.jsonl`

**Format per line (Example for `emotion_telemetry.log.jsonl`):**
```json
{"request_id": "<uuid_from_request>", "timestamp_capture": "<iso8601_timestamp>", "telemetry_data": <full_mgc_emotion_telemetry_json_object>}
```
**Format per line (Example for `justification.log.jsonl`):**
```json
{"request_id": "<uuid_from_request>", "timestamp_capture": "<iso8601_timestamp>", "justification_data": <full_loop_justification_log_v1_json_object>}
```

You can inspect these files using standard command-line tools (e.g., `cat`, `tail`, `grep`, `jq`) to observe the outputs of each loop execution.

## 6. Example Manual Test using cURL (Phase 2.2 Update)

Once the Uvicorn server is running, you can test the `/loop/execute` endpoint.

**Example Valid Request (no override):**
```bash
curl -X POST "http://127.0.0.1:8000/loop/execute" \
-H "Content-Type: application/json" \
-d 
  "request_id": "$(uuidgen)",
  "plan_input": {
    "task_description": "Manual cURL test for loop execution.",
    "data_source": "/mnt/data/input.csv"
  }
}"
```
After this request, check the `./logs/` directory for new entries in `emotion_telemetry.log.jsonl` and `justification.log.jsonl`.

**Example Valid Request (with operator override):**
```bash
curl -X POST "http://127.0.0.1:8000/loop/execute" \
-H "Content-Type: application/json" \
-d 
  "request_id": "$(uuidgen)",
  "plan_input": {
    "task_description": "Manual cURL test with override."
  },
  "operator_override_signal": {
    "override_type": "HALT_IMMEDIATE",
    "reason": "Manual test override signal from cURL",
    "issuing_operator_id": "curl_op_007",
    "parameters": {"custom_param": "test_value"}
  }
}"
```
Observe the API response and the content of the justification log file. The `justification_log` should detail the override event.

**Example Invalid Request (invalid override signal schema):**
```bash
curl -X POST "http://127.0.0.1:8000/loop/execute" \
-H "Content-Type: application/json" \
-d 
  "request_id": "$(uuidgen)",
  "plan_input": {
    "task_description": "Test with invalid override."
  },
  "operator_override_signal": {
    "override_type": 123, 
    "reason": "This signal has an invalid type for override_type."
  }
}"
```
This should return a 400 error with schema validation details for the `operator_override_signal`.

