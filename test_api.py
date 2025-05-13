import pytest
import json
from fastapi.testclient import TestClient
import uuid
import os

# Add project root to sys.path to allow main to be imported
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir) # Assuming tests are in a subdirectory like /tests
# If tests are in the root, then project_root = current_dir
# For this setup, assuming tests will be in /home/ubuntu/promethios_repo/tests/
# and main.py is in /home/ubuntu/promethios_repo/
# So, project_root should be /home/ubuntu/promethios_repo
# Let's adjust if tests are in the root itself.
# For now, assuming tests are in the root for simplicity of this example.
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from main import app # app should be importable if main.py is in the python path

client = TestClient(app)

# --- Helper to get schema paths --- #
SCHEMA_BASE_PATH = os.path.join(project_root, "ResurrectionCodex")
API_SCHEMA_PATH = os.path.join(SCHEMA_BASE_PATH, "02_System_Architecture", "API_Schemas")
MGC_SCHEMA_PATH = os.path.join(SCHEMA_BASE_PATH, "01_Minimal_Governance_Core_MGC", "MGC_Schema_Registry")

LOOP_EXECUTE_REQUEST_SCHEMA_PATH = os.path.join(API_SCHEMA_PATH, "loop_execute_request.v1.schema.json")
OPERATOR_OVERRIDE_SCHEMA_PATH = os.path.join(MGC_SCHEMA_PATH, "operator_override.schema.v1.json")

# --- Test Cases --- #

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Promethios Governance Core Runtime is active."}

def test_execute_loop_valid_request_no_override():
    request_id = str(uuid.uuid4())
    payload = {
        "request_id": request_id,
        "plan_input": {"task_description": "Test valid execution via API"}
    }
    response = client.post("/loop/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == request_id
    assert data["execution_status"] == "SUCCESS"
    assert data["governance_core_output"] is not None
    assert data["emotion_telemetry"] is not None
    assert data["justification_log"] is not None
    assert data["error_details"] is None

def test_execute_loop_valid_request_with_override():
    request_id = str(uuid.uuid4())
    payload = {
        "request_id": request_id,
        "plan_input": {"task_description": "Test valid execution with override via API"},
        "operator_override_signal": {
            "override_type": "HALT_IMMEDIATE",
            "reason": "API test override"
        }
    }
    response = client.post("/loop/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == request_id
    assert data["execution_status"] == "SUCCESS"
    assert data["governance_core_output"]["received_override"] is not None
    assert data["justification_log"]["override_required"] is True

def test_execute_loop_invalid_json_body():
    response = client.post("/loop/execute", data="not a json")
    assert response.status_code == 400
    data = response.json()
    assert data["execution_status"] == "REJECTED"
    assert data["error_details"]["code"] == "INVALID_JSON"

def test_execute_loop_missing_request_id():
    payload = {
        # "request_id": str(uuid.uuid4()), # Missing
        "plan_input": {"task_description": "Test missing request_id"}
    }
    response = client.post("/loop/execute", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["execution_status"] == "REJECTED"
    assert data["error_details"]["code"] == "REQUEST_VALIDATION_ERROR"
    assert any("request_id" in e["message"] for e in data["error_details"]["schema_validation_errors"])

def test_execute_loop_invalid_override_signal():
    request_id = str(uuid.uuid4())
    payload = {
        "request_id": request_id,
        "plan_input": {"task_description": "Test invalid override"},
        "operator_override_signal": {
            "override_type": "INVALID_TYPE", # Not in enum
            "reason": "Test invalid override signal"
        }
    }
    response = client.post("/loop/execute", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["execution_status"] == "REJECTED"
    assert data["error_details"]["code"] == "REQUEST_VALIDATION_ERROR"
    assert "Operator override signal failed validation" in data["error_details"]["schema_validation_errors"][0]["message"]

# To run these tests: pytest test_api.py
# Ensure pytest and httpx (TestClient dependency) are installed in the venv
# /home/ubuntu/promethios_repo/.venv/bin/pip install pytest httpx

