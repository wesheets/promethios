"""
Override Request API endpoint for Promethios.

This module provides the API endpoint for requesting governance overrides.
"""

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OverrideRequestAPI:
    """
    API endpoint for requesting governance overrides.
    
    This class handles the processing of override requests, including validation,
    storage, and response generation.
    """
    
    def __init__(self, schema_validator, governance_engine, storage_manager):
        """
        Initialize the OverrideRequestAPI.
        
        Args:
            schema_validator: Validator for request schemas
            governance_engine: Engine for governance decisions
            storage_manager: Manager for storing override requests
        """
        self.schema_validator = schema_validator
        self.governance_engine = governance_engine
        self.storage_manager = storage_manager
        logger.info("OverrideRequestAPI initialized")
    
    def process_request(self, request_data: Dict) -> Dict:
        """
        Process an override request.
        
        Args:
            request_data: The override request data
            
        Returns:
            Response containing the status and details of the request
        """
        logger.info(f"Processing override request: {request_data.get('request_id', 'unknown')}")
        
        # Validate the request schema
        validation_result = self.schema_validator.validate(
            request_data, 
            "override_request.schema.v1"
        )
        
        if not validation_result['valid']:
            logger.warning(f"Invalid override request: {validation_result['errors']}")
            return self._create_error_response(
                "invalid_request", 
                f"Request validation failed: {validation_result['errors']}"
            )
        
        # Generate request ID if not provided
        if 'request_id' not in request_data:
            request_data['request_id'] = f"OR-{uuid.uuid4().hex[:6].upper()}"
        
        # Add timestamp if not provided
        if 'timestamp' not in request_data:
            request_data['timestamp'] = datetime.now().isoformat()
        
        # Evaluate governance implications
        governance_result = self.governance_engine.evaluate_override(request_data)
        
        # Store the request
        storage_result = self.storage_manager.store_override_request(request_data, governance_result)
        
        if not storage_result['success']:
            logger.error(f"Failed to store override request: {storage_result['error']}")
            return self._create_error_response(
                "storage_error", 
                f"Failed to store request: {storage_result['error']}"
            )
        
        # Create response
        response = {
            "request_id": request_data['request_id'],
            "status": "pending",
            "timestamp": datetime.now().isoformat(),
            "response_id": f"ORRESP-{uuid.uuid4().hex[:6].upper()}"
        }
        
        # Add governance impact if available
        if 'governance_impact' in governance_result:
            response['governance_impact'] = governance_result['governance_impact']
        
        # Add expiration if provided in request
        if 'expiration' in request_data:
            response['expiration'] = request_data['expiration']
        
        logger.info(f"Override request processed: {response['request_id']}")
        return response
    
    def _create_error_response(self, error_code: str, error_message: str) -> Dict:
        """
        Create an error response.
        
        Args:
            error_code: Error code
            error_message: Error message
            
        Returns:
            Error response dictionary
        """
        return {
            "error": {
                "code": error_code,
                "message": error_message
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def get_request_status(self, request_id: str) -> Dict:
        """
        Get the status of an override request.
        
        Args:
            request_id: ID of the request
            
        Returns:
            Status of the request
        """
        logger.info(f"Getting status for override request: {request_id}")
        
        # Retrieve request from storage
        request = self.storage_manager.get_override_request(request_id)
        
        if not request:
            logger.warning(f"Override request not found: {request_id}")
            return self._create_error_response(
                "not_found",
                f"Override request {request_id} not found"
            )
        
        # Create status response
        response = {
            "request_id": request_id,
            "status": request.get("status", "pending"),
            "timestamp": datetime.now().isoformat()
        }
        
        # Add resolution if available
        if "resolution" in request:
            response["resolution"] = request["resolution"]
        
        # Add expiration if available
        if "expiration" in request:
            response["expiration"] = request["expiration"]
        
        logger.info(f"Retrieved status for override request: {request_id}")
        return response


# Example usage
if __name__ == "__main__":
    # Mock dependencies
    class MockSchemaValidator:
        def validate(self, data, schema):
            return {"valid": True, "errors": []}
    
    class MockGovernanceEngine:
        def evaluate_override(self, request):
            return {
                "governance_impact": {
                    "trust_impact": -0.05,
                    "policy_exceptions": ["data_access_policy"]
                }
            }
    
    class MockStorageManager:
        def store_override_request(self, request, governance_result):
            return {"success": True}
        
        def get_override_request(self, request_id):
            return {
                "request_id": request_id,
                "status": "pending",
                "timestamp": "2025-05-22T00:00:00Z"
            }
    
    # Create API instance
    api = OverrideRequestAPI(
        MockSchemaValidator(),
        MockGovernanceEngine(),
        MockStorageManager()
    )
    
    # Example request
    request = {
        "agent_id": "A-1234",
        "task_id": "T-123456",
        "action": "read",
        "reason": "policy",
        "details": "Need access to restricted data for analysis",
        "priority": "high"
    }
    
    # Process request
    response = api.process_request(request)
    print(json.dumps(response, indent=2))
    
    # Get status
    status = api.get_request_status(response["request_id"])
    print(json.dumps(status, indent=2))
