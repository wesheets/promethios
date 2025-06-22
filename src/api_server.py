"""
FastAPI application for Promethios Governance Core Runtime.

This module provides the main FastAPI application with governance loop execution endpoints.
"""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import jsonschema # For request validation
import os
import uuid

from src.main.runtime_executor import RuntimeExecutor, load_schema # Assuming runtime_executor.py is in the same directory or accessible

# Import multi-agent routes
from src.api.multi_agent import router as multi_agent_router

# Import agent routes
from src.api.agents.routes import router as agents_router

# Import multi-agent system routes
from src.api.multi_agent_system.routes import router as multi_agent_system_router

# Import observer routes
from src.api.observers.routes import router as observers_router

# Import policy routes
from src.api.policy.routes import router as policy_router

# Import trust and audit routes from Phase 6.3
# Temporarily commented out due to import issues - will fix in Phase 2
# import sys
# sys.path.append('/home/ubuntu/promethios/phase_6_3_new/src')
# sys.path.append('/home/ubuntu/promethios/phase_6_3_new')
# from phase_6_3_new.src.api.trust.routes import router as trust_router
# from phase_6_3_new.src.api.audit.routes import router as audit_router

# Import chat routes
from src.api.chat.routes import router as chat_router

# --- FastAPI App Initialization --- #
app = FastAPI(
    title="Promethios Governance Core Runtime",
    version="2.1.0",
    description="HTTP API for executing the Promethios GovernanceCore loop and multi-agent coordination."
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include multi-agent routes
app.include_router(multi_agent_router, prefix="/api/multi_agent", tags=["Multi-Agent"])

# Include agent routes
app.include_router(agents_router)

# Include multi-agent system routes
app.include_router(multi_agent_system_router, prefix="/api/multi_agent_system", tags=["Multi-Agent System"])

# Include observer routes
app.include_router(observers_router, prefix="/api/observers", tags=["Observer Agents"])

# Include policy routes
app.include_router(policy_router, prefix="/api/policy", tags=["Policy Management"])

# Include trust routes - temporarily commented out
# app.include_router(trust_router, prefix="/api/trust", tags=["Trust Management"])

# Include audit routes - temporarily commented out  
# app.include_router(audit_router, prefix="/api/audit", tags=["Audit & Compliance"])

# Include chat routes
app.include_router(chat_router, prefix="/api", tags=["Chat System"])

# --- Schema Loading for Request Validation --- #
# These paths assume main.py is in the root of promethios_repo
SCHEMA_BASE_PATH = os.path.join(os.path.dirname(__file__), "..", "ResurrectionCodex")
API_SCHEMA_PATH = os.path.join(SCHEMA_BASE_PATH, "02_System_Architecture", "API_Schemas")
MGC_SCHEMA_PATH = os.path.join(SCHEMA_BASE_PATH, "01_Minimal_Governance_Core_MGC", "MGC_Schema_Registry")

LOOP_EXECUTE_REQUEST_SCHEMA_PATH = os.path.join(API_SCHEMA_PATH, "loop_execute_request.v1.schema.json")
OPERATOR_OVERRIDE_SCHEMA_PATH = os.path.join(MGC_SCHEMA_PATH, "operator_override.schema.v1.json")

loop_execute_request_schema = load_schema(LOOP_EXECUTE_REQUEST_SCHEMA_PATH)
operator_override_schema = load_schema(OPERATOR_OVERRIDE_SCHEMA_PATH)

# --- Runtime Executor Instance --- #
runtime_executor = RuntimeExecutor()

# --- Helper for Schema Validation Error Response --- #
def create_validation_error_response(errors, status_code=status.HTTP_400_BAD_REQUEST):
    error_details_list = []
    if isinstance(errors, jsonschema.exceptions.ValidationError):
        # Single top-level error
        error_details_list.append({
            "message": errors.message,
            "path": list(errors.path),
            "validator": errors.validator,
            "validator_value": errors.validator_value
        })
    elif isinstance(errors, list): # List of errors (e.g. from multiple checks)
        error_details_list = errors
    else: # Generic fallback
        error_details_list.append({"message": str(errors)})
    
    return JSONResponse(
        status_code=status_code,
        content={
            "request_id": "N/A", # Or try to get from request if possible
            "execution_status": "REJECTED",
            "governance_core_output": None,
            "emotion_telemetry": None,
            "justification_log": None,
            "validation_errors": error_details_list
        }
    )

