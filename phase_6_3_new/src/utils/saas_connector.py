#!/usr/bin/env python3
"""
SaaS Flow Connector for Promethios Kernel
Phase 5.1: External Trigger Integration
Contract Version: v2025.05.20
"""

import json
import uuid
import datetime
import os
import sys
import requests
import jsonschema

# Constants
SCHEMA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schemas")
CONTRACT_VERSION = "v2025.05.20"
PHASE_ID = "5.1"
API_ENDPOINT = "http://localhost:8000/api/v1/external-trigger"

def load_schema(schema_name):
    """Load a schema file from the schemas directory"""
    schema_path = os.path.join(SCHEMA_DIR, schema_name)
    if not os.path.exists(schema_path):
        print(f"Error: Schema file {schema_name} not found in {SCHEMA_DIR}")
        return None
    
    with open(schema_path, 'r') as f:
        return json.load(f)

def validate_against_schema(instance, schema, schema_name=""):
    """Validate data against a JSON schema"""
    try:
        jsonschema.validate(instance=instance, schema=schema)
        return None
    except jsonschema.exceptions.ValidationError as e:
        return {
            "message": f"Schema validation failed for {schema_name}: {e.message}",
            "path": list(e.path),
            "validator": e.validator,
            "validator_value": e.validator_value,
        }
    except Exception as e:
        return {
            "message": f"Unexpected error during schema validation for {schema_name}: {str(e)}",
        }

def pre_loop_tether_check():
    """Verify Codex Contract Tethering"""
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
    required_schemas = ["external_trigger.schema.v1.json"]
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

class SaaSConnector:
    """
    SaaS Flow Connector for Promethios Kernel
    Provides methods for triggering loops from SaaS platforms
    """
    
    def __init__(self, api_endpoint=API_ENDPOINT):
        """Initialize the SaaS connector"""
        self.api_endpoint = api_endpoint
        self.external_trigger_schema = load_schema("external_trigger.schema.v1.json")
        
        # Verify schemas are loaded
        if not self.external_trigger_schema:
            raise ValueError("Failed to load required schemas")
        
        # Verify Codex Contract Tethering
        tether_check = pre_loop_tether_check()
        if not tether_check["success"]:
            raise ValueError(f"Contract tethering verification failed: {tether_check['message']}")
    
    def create_trigger_payload(self, platform_name, user_id, loop_input, options=None):
        """Create a trigger payload for a SaaS platform"""
        trigger_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        
        trigger_payload = {
            "trigger_id": trigger_id,
            "trigger_type": "saas_flow",
            "timestamp": timestamp,
            "source": {
                "identifier": user_id,
                "type": "service",
                "metadata": {
                    "platform": platform_name,
                    "integration_version": "1.0.0"
                }
            },
            "payload": {
                "loop_input": loop_input,
                "options": options or {}
            }
        }
        
        # Validate against schema
        validation_error = validate_against_schema(
            trigger_payload, 
            self.external_trigger_schema, 
            "external_trigger"
        )
        
        if validation_error:
            raise ValueError(f"Trigger payload validation failed: {validation_error['message']}")
        
        return trigger_payload
    
    def trigger_from_zapier(self, user_id, loop_input, options=None):
        """Trigger a loop from Zapier"""
        return self.trigger_from_platform("zapier", user_id, loop_input, options)
    
    def trigger_from_make(self, user_id, loop_input, options=None):
        """Trigger a loop from Make (Integromat)"""
        return self.trigger_from_platform("make", user_id, loop_input, options)
    
    def trigger_from_n8n(self, user_id, loop_input, options=None):
        """Trigger a loop from n8n"""
        return self.trigger_from_platform("n8n", user_id, loop_input, options)
    
    def trigger_from_platform(self, platform_name, user_id, loop_input, options=None):
        """Generic method to trigger a loop from any SaaS platform"""
        # Create trigger payload
        trigger_payload = self.create_trigger_payload(
            platform_name, 
            user_id, 
            loop_input, 
            options
        )
        
        # Send request to API
        try:
            response = requests.post(
                self.api_endpoint,
                json=trigger_payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                return {
                    "status": "ERROR",
                    "message": f"API request failed with status code {response.status_code}",
                    "details": response.text
                }
            
            return response.json()
        
        except requests.exceptions.RequestException as e:
            return {
                "status": "ERROR",
                "message": f"Failed to connect to API: {str(e)}"
            }
        except Exception as e:
            return {
                "status": "ERROR",
                "message": f"Unexpected error: {str(e)}"
            }

# Example usage
if __name__ == "__main__":
    try:
        connector = SaaSConnector()
        
        # Example loop input
        loop_input = {
            "task": "test saas flow trigger",
            "some_detail": "detail_for_saas_flow_trigger"
        }
        
        # Example options
        options = {
            "priority": "normal",
            "timeout": 60
        }
        
        # Trigger from Zapier
        print("\n--- Testing Zapier Trigger ---")
        zapier_result = connector.trigger_from_zapier(
            "zapier_user_123",
            loop_input,
            options
        )
        print(json.dumps(zapier_result, indent=2))
        
        # Trigger from Make
        print("\n--- Testing Make Trigger ---")
        make_result = connector.trigger_from_make(
            "make_user_456",
            loop_input,
            options
        )
        print(json.dumps(make_result, indent=2))
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
