from flask import Flask, render_template, jsonify, request, redirect, url_for
import os
import json
import datetime

app = Flask(__name__)

# Constants for Phase 5.1: External Trigger Integration
CONTRACT_VERSION = "v2025.05.18"
PHASE_ID = "5.1"

# Mock data for trigger history
# In a real implementation, this would be loaded from the database or log files
MOCK_TRIGGERS = [
    {
        "trigger_id": "a1b2c3d4-e5f6-4a3b-8c9d-0e1f2a3b4c5d",
        "trigger_type": "cli",
        "timestamp": "2025-05-18T12:30:45Z",
        "source": {
            "identifier": "admin_user",
            "type": "user",
            "metadata": {
                "hostname": "dev-machine",
                "cli_version": "1.0.0"
            }
        },
        "status": "SUCCESS"
    },
    {
        "trigger_id": "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
        "trigger_type": "webhook",
        "timestamp": "2025-05-18T14:15:30Z",
        "source": {
            "identifier": "external_service",
            "type": "service",
            "metadata": {
                "client_ip": "192.168.1.100",
                "auth_token_hash": "7f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e"
            }
        },
        "status": "SUCCESS"
    },
    {
        "trigger_id": "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
        "trigger_type": "saas_flow",
        "timestamp": "2025-05-18T16:45:20Z",
        "source": {
            "identifier": "zapier_user_123",
            "type": "service",
            "metadata": {
                "platform": "zapier",
                "integration_version": "1.0.0"
            }
        },
        "status": "FAILURE"
    }
]

@app.route('/')
def index():
    return render_template('index.html', 
                          contract_version=CONTRACT_VERSION,
                          phase_id=PHASE_ID)

@app.route('/logs')
def logs():
    return render_template('logs.html',
                          contract_version=CONTRACT_VERSION,
                          phase_id=PHASE_ID)

@app.route('/trigger_history')
def trigger_history():
    return render_template('trigger_history.html', 
                          triggers=MOCK_TRIGGERS,
                          contract_version=CONTRACT_VERSION,
                          phase_id=PHASE_ID)

@app.route('/settings')
def settings():
    return render_template('settings.html',
                          contract_version=CONTRACT_VERSION,
                          phase_id=PHASE_ID)

@app.route('/api/v1/trigger/<trigger_id>')
def get_trigger_details(trigger_id):
    # In a real implementation, this would fetch from a database or log files
    for trigger in MOCK_TRIGGERS:
        if trigger['trigger_id'] == trigger_id:
            # Add mock execution result
            trigger_with_result = trigger.copy()
            trigger_with_result['execution_result'] = {
                "request_id": trigger_id,
                "execution_status": "SUCCESS" if trigger['status'] == "SUCCESS" else "FAILURE",
                "governance_core_output": {
                    "plan_status": "APPROVED",
                    "execution_details": "Mock execution details for " + trigger_id
                },
                "error_details": None if trigger['status'] == "SUCCESS" else {
                    "code": "EXECUTION_ERROR",
                    "message": "Mock error message for failed execution"
                }
            }
            return jsonify(trigger_with_result)
    
    return jsonify({"error": "Trigger not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
