"""
External Service Registry for API Management

This registry manages external service integrations and API connections
that the LLM service might need to coordinate with. It extends the existing
SaaS connector functionality with centralized service discovery and management.

Purpose:
- External API service discovery
- Service health monitoring and failover
- API rate limiting and quota management
- Integration with existing SaaS connector
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from enum import Enum
from pydantic import BaseModel
import httpx

# Import existing SaaS connector
from ...api.saas_connector import load_schema, validate_against_schema

logger = logging.getLogger(__name__)

class ServiceType(Enum):
    """Types of external services."""
    API = "api"
    DATABASE = "database"
    STORAGE = "storage"
    MESSAGING = "messaging"
    ANALYTICS = "analytics"
    AI_SERVICE = "ai_service"

class ServiceStatus(Enum):
    """Service availability status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    ERROR = "error"

class ServiceMetrics(BaseModel):
    """Service performance metrics."""
    response_time_avg: float
    success_rate: float
    requests_per_minute: int
    last_check: str
    uptime_percentage: float

class ServiceConfig(BaseModel):
    """Service configuration."""
    base_url: str
    api_key: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    timeout: int = 30
    retry_count: int = 3
    rate_limit: Optional[int] = None  # requests per minute

class ExternalService(BaseModel):
    """External service definition."""
    service_id: str
    name: str
    service_type: ServiceType
    config: ServiceConfig
    status: ServiceStatus
    metrics: ServiceMetrics
    capabilities: List[str]
    description: str

class ExternalServiceRegistry:
    """
    Registry for managing external service integrations.
    
    This registry provides centralized management of external APIs and services
    that the LLM system might need to coordinate with, extending the existing
    SaaS connector functionality.
    """
    
    def __init__(self):
        """Initialize the external service registry."""
        self.services: Dict[str, ExternalService] = {}
        self.http_client = httpx.AsyncClient(timeout=30.0)
        self._initialize_default_services()
        logger.info("External Service Registry initialized")
    
    def _initialize_default_services(self):
        """Initialize with default external service configurations."""
        default_services = [
            {
                "service_id": "openai-api",
                "name": "OpenAI API",
                "service_type": ServiceType.AI_SERVICE,
                "config": ServiceConfig(
                    base_url="https://api.openai.com/v1",
                    headers={"Content-Type": "application/json"},
                    timeout=60,
                    retry_count=3,
                    rate_limit=60  # requests per minute
                ),
                "status": ServiceStatus.ACTIVE,
                "metrics": ServiceMetrics(
                    response_time_avg=2.5,
                    success_rate=0.98,
                    requests_per_minute=0,
                    last_check=datetime.utcnow().isoformat(),
                    uptime_percentage=99.5
                ),
                "capabilities": ["text-generation", "embeddings", "chat-completion"],
                "description": "OpenAI API for language model services"
            },
            {
                "service_id": "anthropic-api",
                "name": "Anthropic API",
                "service_type": ServiceType.AI_SERVICE,
                "config": ServiceConfig(
                    base_url="https://api.anthropic.com/v1",
                    headers={"Content-Type": "application/json"},
                    timeout=60,
                    retry_count=3,
                    rate_limit=50
                ),
                "status": ServiceStatus.ACTIVE,
                "metrics": ServiceMetrics(
                    response_time_avg=3.0,
                    success_rate=0.97,
                    requests_per_minute=0,
                    last_check=datetime.utcnow().isoformat(),
                    uptime_percentage=99.2
                ),
                "capabilities": ["text-generation", "chat-completion", "analysis"],
                "description": "Anthropic Claude API for language model services"
            },
            {
                "service_id": "research-api",
                "name": "Research Data API",
                "service_type": ServiceType.API,
                "config": ServiceConfig(
                    base_url="https://api.research-service.com/v1",
                    timeout=30,
                    retry_count=2,
                    rate_limit=100
                ),
                "status": ServiceStatus.ACTIVE,
                "metrics": ServiceMetrics(
                    response_time_avg=1.8,
                    success_rate=0.95,
                    requests_per_minute=0,
                    last_check=datetime.utcnow().isoformat(),
                    uptime_percentage=98.8
                ),
                "capabilities": ["data-retrieval", "search", "analysis"],
                "description": "External research data and information API"
            }
        ]
        
        for service_data in default_services:
            service = ExternalService(**service_data)
            self.services[service.service_id] = service
    
    def register_service(self, service: ExternalService) -> bool:
        """
        Register a new external service.
        
        Args:
            service: External service to register
            
        Returns:
            True if registration successful
        """
        try:
            # Validate service configuration
            if not service.service_id or not service.config.base_url:
                logger.error("Invalid service configuration")
                return False
            
            # Test connectivity
            connectivity_ok = await self._test_service_connectivity(service)
            if not connectivity_ok:
                logger.warning(f"Service {service.service_id} failed connectivity test")
                service.status = ServiceStatus.ERROR
            
            self.services[service.service_id] = service
            logger.info(f"Registered external service: {service.service_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error registering service {service.service_id}: {str(e)}")
            return False
    
    async def _test_service_connectivity(self, service: ExternalService) -> bool:
        """Test connectivity to an external service."""
        try:
            # Simple health check - try to connect to the base URL
            response = await self.http_client.get(
                service.config.base_url,
                headers=service.config.headers or {},
                timeout=service.config.timeout
            )
            return response.status_code < 500
            
        except Exception as e:
            logger.error(f"Connectivity test failed for {service.service_id}: {str(e)}")
            return False
    
    def get_service(self, service_id: str) -> Optional[ExternalService]:
        """Get a specific external service."""
        return self.services.get(service_id)
    
    def list_services_by_type(self, service_type: ServiceType) -> List[ExternalService]:
        """List services by type."""
        return [service for service in self.services.values() 
                if service.service_type == service_type]
    
    def list_services_by_capability(self, capability: str) -> List[ExternalService]:
        """List services that have a specific capability."""
        return [service for service in self.services.values() 
                if capability in service.capabilities and service.status == ServiceStatus.ACTIVE]
    
    def get_best_service_for_capability(self, capability: str) -> Optional[ExternalService]:
        """
        Get the best service for a specific capability based on performance metrics.
        
        Args:
            capability: Required capability
            
        Returns:
            Best service or None if no suitable service found
        """
        suitable_services = self.list_services_by_capability(capability)
        
        if not suitable_services:
            return None
        
        # Score services based on success rate and response time
        def service_score(service):
            success_weight = 0.7
            speed_weight = 0.3
            success_score = service.metrics.success_rate
            speed_score = 1.0 / (service.metrics.response_time_avg + 0.1)
            return success_weight * success_score + speed_weight * speed_score
        
        return max(suitable_services, key=service_score)
    
    async def health_check_all_services(self) -> Dict[str, bool]:
        """
        Perform health checks on all registered services.
        
        Returns:
            Dictionary mapping service IDs to health status
        """
        health_status = {}
        
        for service_id, service in self.services.items():
            try:
                is_healthy = await self._test_service_connectivity(service)
                health_status[service_id] = is_healthy
                
                # Update service status based on health check
                if is_healthy:
                    if service.status == ServiceStatus.ERROR:
                        service.status = ServiceStatus.ACTIVE
                        logger.info(f"Service {service_id} recovered")
                else:
                    service.status = ServiceStatus.ERROR
                    logger.warning(f"Service {service_id} health check failed")
                
                # Update last check time
                service.metrics.last_check = datetime.utcnow().isoformat()
                
            except Exception as e:
                logger.error(f"Health check error for {service_id}: {str(e)}")
                health_status[service_id] = False
                service.status = ServiceStatus.ERROR
        
        return health_status
    
    def update_service_metrics(self, service_id: str, metrics: Dict[str, Any]):
        """Update service performance metrics."""
        if service_id not in self.services:
            return
        
        service = self.services[service_id]
        
        if "response_time" in metrics:
            # Update average response time
            current_avg = service.metrics.response_time_avg
            new_time = metrics["response_time"]
            # Simple moving average (could be improved with more sophisticated tracking)
            service.metrics.response_time_avg = (current_avg * 0.9 + new_time * 0.1)
        
        if "success" in metrics:
            # Update success rate
            current_rate = service.metrics.success_rate
            success = 1.0 if metrics["success"] else 0.0
            service.metrics.success_rate = (current_rate * 0.95 + success * 0.05)
        
        if "requests_per_minute" in metrics:
            service.metrics.requests_per_minute = metrics["requests_per_minute"]
        
        service.metrics.last_check = datetime.utcnow().isoformat()
        logger.debug(f"Updated metrics for service {service_id}")
    
    def get_service_recommendations(self, task_type: str) -> List[ExternalService]:
        """
        Get service recommendations for a specific task type.
        
        Args:
            task_type: Type of task (research, analysis, generation, etc.)
            
        Returns:
            List of recommended services sorted by suitability
        """
        task_capability_mapping = {
            "research": ["data-retrieval", "search", "analysis"],
            "generation": ["text-generation", "content-creation"],
            "analysis": ["analysis", "data-processing", "insights"],
            "communication": ["messaging", "notifications", "email"],
            "storage": ["storage", "backup", "archival"]
        }
        
        required_capabilities = task_capability_mapping.get(task_type, [])
        
        suitable_services = []
        for capability in required_capabilities:
            services = self.list_services_by_capability(capability)
            suitable_services.extend(services)
        
        # Remove duplicates and sort by performance
        unique_services = list({service.service_id: service for service in suitable_services}.values())
        return sorted(unique_services, key=lambda s: s.metrics.success_rate, reverse=True)
    
    async def close(self):
        """Clean up resources."""
        await self.http_client.aclose()

# Global registry instance
external_service_registry = ExternalServiceRegistry()

