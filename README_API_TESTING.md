# How to Run and Test the /loop/execute API Locally

This document provides instructions for running the FastAPI application and executing the tests for the `/loop/execute` API endpoint.

## 1. Prerequisites

- Python 3.11
- Git
- Access to the Promethios repository: `https://github.com/wesheets/promethios`

## 2. Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/wesheets/promethios promethios_repo
    cd promethios_repo
    ```

2.  **Create and Activate Virtual Environment:**
    ```bash
    python3.11 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Install Dependencies:**
    The core dependencies (`fastapi`, `uvicorn`, `python-multipart`, `pydantic`, `uuid`, `jsonschema`) should have been installed during the setup. For testing, you also need `pytest` and `httpx`.
    ```bash
    pip install fastapi uvicorn python-multipart pydantic uuid jsonschema pytest httpx
    ```

4.  **Ensure Codex Artifacts are in Place:**
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
    ├── main.py
    ├── runtime_executor.py
    └── test_api.py
    ```

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

## 5. Example Manual Test using cURL

Once the Uvicorn server is running, you can test the `/loop/execute` endpoint using `curl` or a tool like Postman.

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

**Example Valid Request (with override):**
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
    "reason": "Manual test override signal from cURL"
  }
}"
```

**Example Invalid Request (missing plan_input):**
```bash
curl -X POST "http://127.0.0.1:8000/loop/execute" \
-H "Content-Type: application/json" \
-d 
  "request_id": "$(uuidgen)"
}"
```
This should return a 400 error with schema validation details.

