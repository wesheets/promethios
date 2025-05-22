"""
Override Resolve API endpoint for Promethios.

This module provides the API endpoint for resolving governance override requests.
"""

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OverrideResolveAPI:
    """
    API endpoint for resolving governance override requests.
    
    This class handles the processing of override resolutions, including validation,
    storage, and response generation.
    """
    
    def __init__(self, schema_validator, governance_engine, storage_manager, audit_manager):
        """
        Initialize the OverrideResolveAPI.
        
        Args:
            schema_validator: Validator for request schemas
            governance_engine: Engine for governance decisions
            storage_manager: Manager for storing override requests and resolutions
            audit_manager: Manager for audit trail generation
        """
        self.schema_validator = schema_validator
        self.governance_engine = governance_engine
        self.storage_manager = storage_manager
        self.audit_manager = audit_manager
        logger.info("OverrideResolveAPI initialized")
    
    def process_resolution(self, resolution_data: Dict) -> Dict:
        """
        Process an override resolution.
        
        Args:
            resolution_data: The override resolution data
            
        Returns:
            Response containing the status and details of the resolution
        """
        logger.info(f"Processing override resolution for request: {resolution_data.get('request_id', 'unknown')}")
        
        # Validate the resolution schema
        validation_result = self.schema_validator.validate(
            resolution_data, 
            "override_resolution.schema.v1"
        )
        
        if not validation_result['valid']:
            logger.warning(f"Invalid override resolution: {validation_result['errors']}")
            return self._create_error_response(
                "invalid_resolution", 
                f"Resolution validation failed: {validation_result['errors']}"
            )
        
        # Check if the request exists
        request_id = resolution_data.get('request_id')
        request = self.storage_manager.get_override_request(request_id)
        
        if not request:
            logger.warning(f"Override request not found: {request_id}")
            return self._create_error_response(
                "request_not_found",
                f"Override request {request_id} not found"
            )
        
        # Check if the request is already resolved
        if request.get('status') not in ['pending', None]:
            logger.warning(f"Override request already resolved: {request_id}")
            return self._create_error_response(
                "already_resolved",
                f"Override request {request_id} is already resolved with status {request.get('status')}"
            )
        
        # Apply governance rules to the resolution
        governance_result = self.governance_engine.apply_resolution(resolution_data, request)
        
        # Create audit trail
        audit_result = self.audit_manager.record_resolution(
            request_id=request_id,
            resolution=resolution_data,
            governance_result=governance_result
        )
        
        # Update the request with the resolution
        update_result = self.storage_manager.update_override_request(
            request_id=request_id,
            updates={
                'status': resolution_data['resolution'],
                'resolution': resolution_data,
                'governance_result': governance_result,
                'audit_trail': audit_result
            }
        )
        
        if not update_result['success']:
            logger.error(f"Failed to update override request: {update_result['error']}")
            return self._create_error_response(
                "storage_error", 
                f"Failed to update request: {update_result['error']}"
            )
        
        # Create response
        response = {
            "request_id": request_id,
            "resolution_id": resolution_data.get('resolution_id', f"ORRES-{uuid.uuid4().hex[:6].upper()}"),
            "status": "success",
            "timestamp": datetime.now().isoformat()
        }
        
        # Add effects if available
        if 'effects' in governance_result:
            response['effects'] = governance_result['effects']
        
        # Add audit reference
        if 'audit_reference' in audit_result:
            response['audit_reference'] = audit_result['audit_reference']
        
        logger.info(f"Override resolution processed: {response['resolution_id']}")
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
    
    def get_resolution(self, request_id: str) -> Dict:
        """
        Get the resolution for an override request.
        
        Args:
            request_id: ID of the request
            
        Returns:
            Resolution details if available
        """
        logger.info(f"Getting resolution for override request: {request_id}")
        
        # Retrieve request from storage
        request = self.storage_manager.get_override_request(request_id)
        
        if not request:
            logger.warning(f"Override request not found: {request_id}")
            return self._create_error_response(
                "not_found",
                f"Override request {request_id} not found"
            )
        
        if 'resolution' not in request:
            logger.info(f"No resolution found for request: {request_id}")
            return {
                "request_id": request_id,
                "status": "pending",
                "timestamp": datetime.now().isoformat()
            }
        
        # Return the resolution
        resolution = request['resolution']
        
        response = {
            "request_id": request_id,
            "resolution_id": resolution.get('resolution_id'),
            "resolution": resolution.get('resolution'),
            "resolver_id": resolution.get('resolver_id'),
            "timestamp": resolution.get('timestamp'),
            "reason": resolution.get('reason')
        }
        
        # Add governance impact if available
        if 'governance_impact' in resolution:
            response['governance_impact'] = resolution['governance_impact']
        
        # Add audit trail if available
        if 'audit_trail' in request:
            response['audit_reference'] = request['audit_trail'].get('audit_reference')
        
        logger.info(f"Retrieved resolution for override request: {request_id}")
        return response


# Example usage
if __name__ == "__main__":
    # Mock dependencies
    class MockSchemaValidator:
        def validate(self, data, schema):
            return {"valid": True, "errors": []}
    
    class MockGovernanceEngine:
        def apply_resolution(self, resolution, request):
            return {
                "effects": {
                    "permissions_granted": ["read_restricted_data"],
                    "restrictions_applied": ["audit_logging_required"],
                    "duration": 3600
                }
            }
    
    class MockStorageManager:
        def get_override_request(self, request_id):
            return {
                "request_id": request_id,
                "status": "pending",
                "timestamp": "2025-05-22T00:00:00Z"
            }
        
        def update_override_request(self, request_id, updates):
            return {"success": True}
    
    class MockAuditManager:
        def record_resolution(self, request_id, resolution, governance_result):
            return {
                "audit_reference": f"AUDIT-{uuid.uuid4().hex[:8].upper()}"
            }
    
    # Create API instance
    api = OverrideResolveAPI(
        MockSchemaValidator(),
        MockGovernanceEngine(),
        MockStorageManager(),
        MockAuditManager()
    )
    
    # Example resolution
    resolution = {
        "request_id": "OR-123456",
        "resolution": "approved",
        "resolver_id": "ADMIN-001",
        "timestamp": datetime.now().isoformat(),
        "reason": "Approved for legitimate business need",
        "scope": "one-time"
    }
    
    # Process resolution
    response = api.process_resolution(resolution)
    print(json.dumps(response, indent=2))
    
    # Get resolution
    resolution_details = api.get_resolution(resolution["request_id"])
    print(json.dumps(resolution_details, indent=2))
