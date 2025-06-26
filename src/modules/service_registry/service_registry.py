"""
Service Registry for Promethios.

This module provides comprehensive service management within the Promethios
governance system. It enables external services to be integrated, discovered,
orchestrated, and monitored with full governance compliance.
"""

import os
import json
import hashlib
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, NamedTuple
from enum import Enum
import uuid

# Configure logging
logger = logging.getLogger(__name__)

class ServiceType(Enum):
    """Service type enumeration."""
    REST_API = "rest_api"
    GRAPHQL = "graphql"
    WEBSOCKET = "websocket"
    DATABASE = "database"
    MESSAGE_QUEUE = "message_queue"
    STORAGE = "storage"
    AUTHENTICATION = "authentication"
    ANALYTICS = "analytics"
    ML_MODEL = "ml_model"
    EXTERNAL_TOOL = "external_tool"

class ServiceStatus(Enum):
    """Service status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    DEPRECATED = "deprecated"
    FAILED = "failed"
    TESTING = "testing"

class AuthenticationType(Enum):
    """Authentication type enumeration."""
    NONE = "none"
    API_KEY = "api_key"
    BEARER_TOKEN = "bearer_token"
    BASIC_AUTH = "basic_auth"
    OAUTH2 = "oauth2"
    CUSTOM = "custom"

class ServiceEndpoint(NamedTuple):
    """Service endpoint definition."""
    endpoint_id: str
    url: str
    method: str
    parameters: Dict[str, Any]
    response_format: str
    rate_limit: Optional[Dict[str, Any]]

class ServiceRegistrationResult(NamedTuple):
    """Result of service registration."""
    success: bool
    service_id: Optional[str] = None
    error: Optional[str] = None
    registration_timestamp: Optional[str] = None

class ServiceInvocationResult(NamedTuple):
    """Result of service invocation."""
    success: bool
    response_data: Optional[Any] = None
    error: Optional[str] = None
    response_time: float = 0.0
    governance_score: float = 0.0

class ServiceRegistry:
    """Registry for managing external service integrations."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        registry_path: str,
        governance_integration=None
    ):
        """Initialize the service registry.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            registry_path: Path to the registry JSON file.
            governance_integration: Optional governance integration service.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.registry_path = registry_path
        self.governance_integration = governance_integration
        self.services = {}
        self.service_health = {}
        self.service_usage_stats = {}
        self.service_configurations = {}
        
        # Load existing registry if available
        self._load_registry()
    
    def _load_registry(self):
        """Load the registry from the JSON file."""
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r') as f:
                    data = json.load(f)
                
                # Verify the seal
                if not self.seal_verification_service.verify_seal(data):
                    logger.error("Service registry file seal verification failed")
                    raise ValueError("Service registry file seal verification failed")
                
                # Load registry data
                self.services = data.get("services", {})
                self.service_health = data.get("service_health", {})
                self.service_usage_stats = data.get("service_usage_stats", {})
                self.service_configurations = data.get("service_configurations", {})
                
                logger.info(f"Loaded {len(self.services)} services from registry")
            except Exception as e:
                logger.error(f"Error loading service registry: {str(e)}")
                self._initialize_empty_registry()
    
    def _initialize_empty_registry(self):
        """Initialize empty registry structures."""
        self.services = {}
        self.service_health = {}
        self.service_usage_stats = {}
        self.service_configurations = {}
    
    def _save_registry(self):
        """Save the registry to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.registry_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        # Prepare data for serialization (excluding sensitive information)
        safe_services = {}
        for service_id, service in self.services.items():
            safe_service = service.copy()
            # Remove sensitive authentication data
            if "authentication" in safe_service:
                auth = safe_service["authentication"].copy()
                if "credentials" in auth:
                    auth["credentials"] = {"***": "REDACTED"}
                safe_service["authentication"] = auth
            safe_services[service_id] = safe_service
        
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_service_registry",
            "services": safe_services,
            "service_health": self.service_health,
            "service_usage_stats": self.service_usage_stats,
            "service_configurations": self.service_configurations
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.services)} services to registry")
    
    def _get_registry_state_hash(self) -> str:
        """Get a hash of the current registry state.
        
        Returns:
            Hash of the current registry state.
        """
        # Create a string representation of the registry state (excluding sensitive data)
        state_data = {
            "services_count": len(self.services),
            "service_health": self.service_health,
            "service_usage_stats": self.service_usage_stats,
            "service_configurations": self.service_configurations
        }
        state_str = json.dumps(state_data, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def register_service(self, service_data: Dict[str, Any]) -> ServiceRegistrationResult:
        """Register a new external service.
        
        Args:
            service_data: Data for the service to register.
                Must include service_id, name, description, service_type,
                endpoints, authentication, and governance configuration.
                
        Returns:
            ServiceRegistrationResult with success status and details.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "register_service",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return ServiceRegistrationResult(
                    success=False,
                    error="Pre-loop tether verification failed"
                )
            
            # Validate the service data
            validation_result = self.schema_validator.validate(service_data, "service_registration.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Service validation failed: {validation_result.errors}")
                return ServiceRegistrationResult(
                    success=False,
                    error=f"Service validation failed: {validation_result.errors}"
                )
            
            # Check if the service already exists
            service_id = service_data["service_id"]
            if service_id in self.services:
                logger.error(f"Service {service_id} already exists")
                return ServiceRegistrationResult(
                    success=False,
                    error=f"Service {service_id} already exists"
                )
            
            # Prepare the service data
            registration_timestamp = datetime.utcnow().isoformat()
            service = {
                "service_id": service_id,
                "name": service_data["name"],
                "description": service_data["description"],
                "service_type": service_data["service_type"],
                "version": service_data.get("version", "1.0.0"),
                "provider": service_data.get("provider", "unknown"),
                "endpoints": service_data["endpoints"],
                "authentication": service_data.get("authentication", {"type": AuthenticationType.NONE.value}),
                "rate_limits": service_data.get("rate_limits", {}),
                "governance_config": service_data.get("governance_config", {}),
                "metadata": service_data.get("metadata", {}),
                "registration_timestamp": registration_timestamp,
                "status": ServiceStatus.TESTING.value,
                "usage_count": 0,
                "last_used": None
            }
            
            # Create a seal for the service
            service["seal"] = self.seal_verification_service.create_seal(service)
            
            # Add the service to the registry
            self.services[service_id] = service
            
            # Initialize service health monitoring
            self.service_health[service_id] = {
                "status": ServiceStatus.TESTING.value,
                "last_health_check": None,
                "health_score": 0.0,
                "response_times": [],
                "error_count": 0,
                "uptime_percentage": 0.0,
                "health_history": []
            }
            
            # Initialize service usage statistics
            self.service_usage_stats[service_id] = {
                "total_invocations": 0,
                "successful_invocations": 0,
                "failed_invocations": 0,
                "average_response_time": 0.0,
                "average_governance_score": 0.0,
                "endpoint_usage": {},
                "usage_history": []
            }
            
            # Perform initial health check
            health_result = self._perform_health_check(service_id)
            if health_result:
                service["status"] = ServiceStatus.ACTIVE.value
                self.service_health[service_id]["status"] = ServiceStatus.ACTIVE.value
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Registered service {service_id}")
            return ServiceRegistrationResult(
                success=True,
                service_id=service_id,
                registration_timestamp=registration_timestamp
            )
            
        except Exception as e:
            logger.error(f"Error registering service: {str(e)}")
            return ServiceRegistrationResult(
                success=False,
                error=f"Error registering service: {str(e)}"
            )
    
    def invoke_service(self, service_id: str, endpoint_id: str, parameters: Dict[str, Any], 
                      invocation_config: Optional[Dict[str, Any]] = None) -> ServiceInvocationResult:
        """Invoke a service endpoint.
        
        Args:
            service_id: ID of the service to invoke.
            endpoint_id: ID of the endpoint to invoke.
            parameters: Parameters for the service invocation.
            invocation_config: Optional invocation configuration.
            
        Returns:
            ServiceInvocationResult with success status and response data.
        """
        start_time = datetime.utcnow()
        
        try:
            # Check if the service exists
            if service_id not in self.services:
                return ServiceInvocationResult(
                    success=False,
                    error=f"Service {service_id} does not exist"
                )
            
            service = self.services[service_id]
            
            # Check if service is active
            if service.get("status") != ServiceStatus.ACTIVE.value:
                return ServiceInvocationResult(
                    success=False,
                    error=f"Service {service_id} is not active (status: {service.get('status')})"
                )
            
            # Find the endpoint
            endpoint = None
            for ep in service["endpoints"]:
                if ep["endpoint_id"] == endpoint_id:
                    endpoint = ep
                    break
            
            if not endpoint:
                return ServiceInvocationResult(
                    success=False,
                    error=f"Endpoint {endpoint_id} not found in service {service_id}"
                )
            
            # Check governance requirements
            governance_score = 1.0
            if self.governance_integration:
                governance_result = self.governance_integration.evaluate_service_invocation(
                    service_id, endpoint_id, parameters
                )
                governance_score = governance_result.get("overall_score", 1.0)
                if not governance_result.get("approved", True):
                    return ServiceInvocationResult(
                        success=False,
                        error=f"Service invocation not approved by governance: {governance_result.get('reason', 'Unknown')}"
                    )
            
            # Perform the service invocation
            response_data = self._invoke_service_endpoint(service, endpoint, parameters, invocation_config)
            
            # Calculate response time
            end_time = datetime.utcnow()
            response_time = (end_time - start_time).total_seconds()
            
            # Update service usage statistics
            self._update_service_usage_stats(service_id, endpoint_id, True, response_time, governance_score)
            
            # Update service health
            self._update_service_health(service_id, True, response_time)
            
            return ServiceInvocationResult(
                success=True,
                response_data=response_data,
                response_time=response_time,
                governance_score=governance_score
            )
            
        except Exception as e:
            end_time = datetime.utcnow()
            response_time = (end_time - start_time).total_seconds()
            
            # Update service usage statistics for failure
            if service_id in self.services:
                self._update_service_usage_stats(service_id, endpoint_id, False, response_time, 0.0)
                self._update_service_health(service_id, False, response_time)
            
            logger.error(f"Error invoking service {service_id}: {str(e)}")
            return ServiceInvocationResult(
                success=False,
                error=f"Error invoking service: {str(e)}",
                response_time=response_time
            )
    
    def _invoke_service_endpoint(self, service: Dict[str, Any], endpoint: Dict[str, Any], 
                               parameters: Dict[str, Any], invocation_config: Optional[Dict[str, Any]]) -> Any:
        """Invoke a service endpoint.
        
        Args:
            service: Service configuration.
            endpoint: Endpoint configuration.
            parameters: Invocation parameters.
            invocation_config: Optional invocation configuration.
            
        Returns:
            Response data from the service.
        """
        url = endpoint["url"]
        method = endpoint["method"].upper()
        
        # Prepare headers
        headers = {"Content-Type": "application/json"}
        
        # Add authentication
        auth_config = service.get("authentication", {})
        auth_type = auth_config.get("type", AuthenticationType.NONE.value)
        
        if auth_type == AuthenticationType.API_KEY.value:
            api_key = auth_config.get("credentials", {}).get("api_key")
            key_header = auth_config.get("key_header", "X-API-Key")
            if api_key:
                headers[key_header] = api_key
        
        elif auth_type == AuthenticationType.BEARER_TOKEN.value:
            token = auth_config.get("credentials", {}).get("token")
            if token:
                headers["Authorization"] = f"Bearer {token}"
        
        elif auth_type == AuthenticationType.BASIC_AUTH.value:
            # Basic auth would be handled by requests.auth
            pass
        
        # Prepare request parameters
        request_params = parameters.copy()
        
        # Add any default parameters from endpoint configuration
        default_params = endpoint.get("parameters", {})
        for key, value in default_params.items():
            if key not in request_params:
                request_params[key] = value
        
        # Set timeout from invocation config or default
        timeout = invocation_config.get("timeout", 30) if invocation_config else 30
        
        # Make the request
        if method == "GET":
            response = requests.get(url, params=request_params, headers=headers, timeout=timeout)
        elif method == "POST":
            response = requests.post(url, json=request_params, headers=headers, timeout=timeout)
        elif method == "PUT":
            response = requests.put(url, json=request_params, headers=headers, timeout=timeout)
        elif method == "DELETE":
            response = requests.delete(url, params=request_params, headers=headers, timeout=timeout)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        # Check response status
        response.raise_for_status()
        
        # Parse response based on format
        response_format = endpoint.get("response_format", "json")
        if response_format == "json":
            return response.json()
        elif response_format == "text":
            return response.text
        elif response_format == "binary":
            return response.content
        else:
            return response.text
    
    def _perform_health_check(self, service_id: str) -> bool:
        """Perform a health check on a service.
        
        Args:
            service_id: ID of the service to check.
            
        Returns:
            True if the service is healthy.
        """
        try:
            if service_id not in self.services:
                return False
            
            service = self.services[service_id]
            
            # Find a health check endpoint or use the first available endpoint
            health_endpoint = None
            for endpoint in service["endpoints"]:
                if endpoint.get("is_health_check", False):
                    health_endpoint = endpoint
                    break
            
            if not health_endpoint and service["endpoints"]:
                # Use the first endpoint for health check
                health_endpoint = service["endpoints"][0]
            
            if not health_endpoint:
                return False
            
            # Perform a simple health check request
            start_time = datetime.utcnow()
            response_data = self._invoke_service_endpoint(service, health_endpoint, {}, {"timeout": 10})
            end_time = datetime.utcnow()
            
            response_time = (end_time - start_time).total_seconds()
            
            # Update health information
            health_info = self.service_health[service_id]
            health_info["last_health_check"] = datetime.utcnow().isoformat()
            health_info["response_times"].append(response_time)
            
            # Keep only last 50 response times
            if len(health_info["response_times"]) > 50:
                health_info["response_times"] = health_info["response_times"][-50:]
            
            # Calculate health score based on response time
            if response_time < 1.0:
                health_score = 1.0
            elif response_time < 5.0:
                health_score = 0.8
            elif response_time < 10.0:
                health_score = 0.6
            else:
                health_score = 0.4
            
            health_info["health_score"] = health_score
            
            # Add to health history
            health_info["health_history"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "healthy": True,
                "response_time": response_time,
                "health_score": health_score
            })
            
            # Keep only last 100 health history entries
            if len(health_info["health_history"]) > 100:
                health_info["health_history"] = health_info["health_history"][-100:]
            
            return True
            
        except Exception as e:
            logger.error(f"Health check failed for service {service_id}: {str(e)}")
            
            # Update health information for failure
            if service_id in self.service_health:
                health_info = self.service_health[service_id]
                health_info["last_health_check"] = datetime.utcnow().isoformat()
                health_info["error_count"] += 1
                health_info["health_score"] = 0.0
                
                health_info["health_history"].append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "healthy": False,
                    "error": str(e),
                    "health_score": 0.0
                })
                
                if len(health_info["health_history"]) > 100:
                    health_info["health_history"] = health_info["health_history"][-100:]
            
            return False
    
    def _update_service_usage_stats(self, service_id: str, endpoint_id: str, success: bool, 
                                  response_time: float, governance_score: float):
        """Update service usage statistics.
        
        Args:
            service_id: ID of the service.
            endpoint_id: ID of the endpoint.
            success: Whether the invocation was successful.
            response_time: Response time in seconds.
            governance_score: Governance score for the invocation.
        """
        if service_id not in self.service_usage_stats:
            return
        
        stats = self.service_usage_stats[service_id]
        
        # Update counters
        stats["total_invocations"] += 1
        if success:
            stats["successful_invocations"] += 1
        else:
            stats["failed_invocations"] += 1
        
        # Update average response time
        total_time = stats["average_response_time"] * (stats["total_invocations"] - 1) + response_time
        stats["average_response_time"] = total_time / stats["total_invocations"]
        
        # Update average governance score
        total_governance = stats["average_governance_score"] * (stats["total_invocations"] - 1) + governance_score
        stats["average_governance_score"] = total_governance / stats["total_invocations"]
        
        # Update endpoint usage
        if endpoint_id not in stats["endpoint_usage"]:
            stats["endpoint_usage"][endpoint_id] = {
                "invocation_count": 0,
                "success_count": 0,
                "average_response_time": 0.0
            }
        
        endpoint_stats = stats["endpoint_usage"][endpoint_id]
        endpoint_stats["invocation_count"] += 1
        if success:
            endpoint_stats["success_count"] += 1
        
        # Update endpoint average response time
        endpoint_total_time = endpoint_stats["average_response_time"] * (endpoint_stats["invocation_count"] - 1) + response_time
        endpoint_stats["average_response_time"] = endpoint_total_time / endpoint_stats["invocation_count"]
        
        # Update service's usage count
        self.services[service_id]["usage_count"] = stats["total_invocations"]
        self.services[service_id]["last_used"] = datetime.utcnow().isoformat()
        
        # Add to usage history (keep last 100 entries)
        stats["usage_history"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "endpoint_id": endpoint_id,
            "success": success,
            "response_time": response_time,
            "governance_score": governance_score
        })
        if len(stats["usage_history"]) > 100:
            stats["usage_history"] = stats["usage_history"][-100:]
    
    def _update_service_health(self, service_id: str, success: bool, response_time: float):
        """Update service health information.
        
        Args:
            service_id: ID of the service.
            success: Whether the operation was successful.
            response_time: Response time in seconds.
        """
        if service_id not in self.service_health:
            return
        
        health_info = self.service_health[service_id]
        
        if success:
            # Calculate health score based on response time
            if response_time < 1.0:
                health_score = 1.0
            elif response_time < 5.0:
                health_score = 0.8
            elif response_time < 10.0:
                health_score = 0.6
            else:
                health_score = 0.4
            
            health_info["health_score"] = health_score
            health_info["response_times"].append(response_time)
            
            # Keep only last 50 response times
            if len(health_info["response_times"]) > 50:
                health_info["response_times"] = health_info["response_times"][-50:]
        else:
            health_info["error_count"] += 1
            health_info["health_score"] = max(0.0, health_info["health_score"] - 0.1)
    
    def get_service(self, service_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a service.
        
        Args:
            service_id: ID of the service to get.
            
        Returns:
            Information about the service, or None if it doesn't exist.
        """
        service = self.services.get(service_id)
        if service:
            # Return a copy without sensitive authentication data
            safe_service = service.copy()
            if "authentication" in safe_service:
                auth = safe_service["authentication"].copy()
                if "credentials" in auth:
                    auth["credentials"] = {"***": "REDACTED"}
                safe_service["authentication"] = auth
            return safe_service
        return None
    
    def get_service_health(self, service_id: str) -> Optional[Dict[str, Any]]:
        """Get service health information.
        
        Args:
            service_id: ID of the service.
            
        Returns:
            Service health information, or None if it doesn't exist.
        """
        return self.service_health.get(service_id)
    
    def get_service_usage_stats(self, service_id: str) -> Optional[Dict[str, Any]]:
        """Get service usage statistics.
        
        Args:
            service_id: ID of the service.
            
        Returns:
            Service usage statistics, or None if it doesn't exist.
        """
        return self.service_usage_stats.get(service_id)
    
    def list_services(self, service_type_filter: Optional[ServiceType] = None,
                     status_filter: Optional[ServiceStatus] = None) -> Dict[str, Dict[str, Any]]:
        """List all registered services with optional filtering.
        
        Args:
            service_type_filter: Optional service type filter.
            status_filter: Optional status filter.
            
        Returns:
            Dictionary mapping service IDs to service information.
        """
        filtered_services = {}
        
        for service_id, service in self.services.items():
            # Apply service type filter
            if service_type_filter and service.get("service_type") != service_type_filter.value:
                continue
            
            # Apply status filter
            if status_filter and service.get("status") != status_filter.value:
                continue
            
            # Return safe service data
            safe_service = service.copy()
            if "authentication" in safe_service:
                auth = safe_service["authentication"].copy()
                if "credentials" in auth:
                    auth["credentials"] = {"***": "REDACTED"}
                safe_service["authentication"] = auth
            
            filtered_services[service_id] = safe_service
        
        return filtered_services
    
    def get_active_services(self) -> List[str]:
        """Get list of currently active services.
        
        Returns:
            List of active service IDs.
        """
        active_services = []
        
        for service_id, service in self.services.items():
            if service.get("status") == ServiceStatus.ACTIVE.value:
                active_services.append(service_id)
        
        return active_services
    
    def get_registry_statistics(self) -> Dict[str, Any]:
        """Get registry statistics.
        
        Returns:
            Dictionary containing registry statistics.
        """
        stats = {
            "total_services": len(self.services),
            "services_by_type": {},
            "services_by_status": {},
            "total_invocations": sum(usage.get("total_invocations", 0) for usage in self.service_usage_stats.values()),
            "average_health_scores": {},
            "average_response_times": {}
        }
        
        # Count services by type
        for service in self.services.values():
            service_type = service.get("service_type", "unknown")
            stats["services_by_type"][service_type] = stats["services_by_type"].get(service_type, 0) + 1
        
        # Count services by status
        for service in self.services.values():
            status = service.get("status", "unknown")
            stats["services_by_status"][status] = stats["services_by_status"].get(status, 0) + 1
        
        # Calculate average health scores
        if self.service_health:
            health_scores = [health.get("health_score", 0.0) for health in self.service_health.values()]
            stats["average_health_scores"]["overall"] = sum(health_scores) / len(health_scores) if health_scores else 0.0
        
        # Calculate average response times
        if self.service_usage_stats:
            response_times = [usage.get("average_response_time", 0.0) for usage in self.service_usage_stats.values()]
            stats["average_response_times"]["overall"] = sum(response_times) / len(response_times) if response_times else 0.0
        
        return stats
    
    def check_service_exists(self, service_id: str) -> bool:
        """Check if a service exists.
        
        Args:
            service_id: ID of the service to check.
            
        Returns:
            True if the service exists, False otherwise.
        """
        return service_id in self.services
    
    def update_service_status(self, service_id: str, status: ServiceStatus) -> bool:
        """Update a service's status.
        
        Args:
            service_id: ID of the service to update.
            status: New status for the service.
            
        Returns:
            True if the status was updated successfully.
        """
        try:
            if service_id not in self.services:
                logger.error(f"Service {service_id} does not exist")
                return False
            
            # Update service status
            self.services[service_id]["status"] = status.value
            
            # Update health status
            if service_id in self.service_health:
                self.service_health[service_id]["status"] = status.value
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Updated service {service_id} status to {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating service {service_id} status: {str(e)}")
            return False
    
    def perform_health_checks(self) -> Dict[str, bool]:
        """Perform health checks on all active services.
        
        Returns:
            Dictionary mapping service IDs to health check results.
        """
        results = {}
        
        for service_id, service in self.services.items():
            if service.get("status") == ServiceStatus.ACTIVE.value:
                health_result = self._perform_health_check(service_id)
                results[service_id] = health_result
                
                # Update service status based on health check
                if not health_result:
                    self.services[service_id]["status"] = ServiceStatus.FAILED.value
                    if service_id in self.service_health:
                        self.service_health[service_id]["status"] = ServiceStatus.FAILED.value
        
        # Save updated registry if any status changes occurred
        if results:
            self._save_registry()
        
        return results

