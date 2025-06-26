"""
⚠️  DUPLICATE REGISTRY - DO NOT USE ⚠️

This Capability Registry is a DUPLICATE of existing functionality.
USE THE EXISTING SYSTEM INSTEAD:

EXISTING CAPABILITY MANAGEMENT:
- Trust Calculation Engine: Handles capability assessment
- Collective Intelligence Assessor: /api/holistic-governance/collective-intelligence
- Agent capability validation in collaboration services
- Performance metrics in existing multi-agent systems

EXISTING APIs TO USE:
- Trust relationships: /api/multi-agent/trust-relationships
- Agent capabilities through collaboration service
- Intelligence assessment through existing governance APIs
- Capability matching in Trust Calculation Engine

This registry was built in error - the system already has capability
management integrated into the trust and intelligence systems.

DO NOT EXTEND THIS CODE - USE EXISTING SYSTEM INSTEAD
"""

import os
import json
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, NamedTuple, Set
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class CapabilityType(Enum):
    """Capability type enumeration."""
    COGNITIVE = "cognitive"
    TECHNICAL = "technical"
    GOVERNANCE = "governance"
    COMMUNICATION = "communication"
    REASONING = "reasoning"
    CREATIVE = "creative"
    ANALYTICAL = "analytical"
    COLLABORATIVE = "collaborative"

class CapabilityLevel(Enum):
    """Capability level enumeration."""
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"
    MASTER = "master"

class CapabilityStatus(Enum):
    """Capability status enumeration."""
    AVAILABLE = "available"
    DEVELOPING = "developing"
    DEPRECATED = "deprecated"
    EXPERIMENTAL = "experimental"
    DISABLED = "disabled"

class CapabilityRequirement(NamedTuple):
    """Capability requirement definition."""
    capability_id: str
    minimum_level: str
    required: bool
    alternatives: List[str]

class CapabilityMatch(NamedTuple):
    """Capability match result."""
    capability_id: str
    provider_id: str
    provider_type: str
    match_score: float
    level: str
    metadata: Dict[str, Any]

class CapabilityRegistrationResult(NamedTuple):
    """Result of capability registration."""
    success: bool
    capability_id: Optional[str] = None
    error: Optional[str] = None
    registration_timestamp: Optional[str] = None

class CapabilityRegistry:
    """Registry for managing capability lifecycle and discovery."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        registry_path: str,
        governance_integration=None,
        agent_registry=None,
        tool_registry=None,
        model_registry=None
    ):
        """Initialize the capability registry.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            registry_path: Path to the registry JSON file.
            governance_integration: Optional governance integration service.
            agent_registry: Optional agent registry for capability providers.
            tool_registry: Optional tool registry for capability providers.
            model_registry: Optional model registry for capability providers.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.registry_path = registry_path
        self.governance_integration = governance_integration
        self.agent_registry = agent_registry
        self.tool_registry = tool_registry
        self.model_registry = model_registry
        self.capabilities = {}
        self.capability_providers = {}
        self.capability_compositions = {}
        self.capability_usage_stats = {}
        
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
                    logger.error("Capability registry file seal verification failed")
                    raise ValueError("Capability registry file seal verification failed")
                
                # Load registry data
                self.capabilities = data.get("capabilities", {})
                self.capability_providers = data.get("capability_providers", {})
                self.capability_compositions = data.get("capability_compositions", {})
                self.capability_usage_stats = data.get("capability_usage_stats", {})
                
                logger.info(f"Loaded {len(self.capabilities)} capabilities from registry")
            except Exception as e:
                logger.error(f"Error loading capability registry: {str(e)}")
                self._initialize_empty_registry()
    
    def _initialize_empty_registry(self):
        """Initialize empty registry structures."""
        self.capabilities = {}
        self.capability_providers = {}
        self.capability_compositions = {}
        self.capability_usage_stats = {}
    
    def _save_registry(self):
        """Save the registry to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.registry_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        # Prepare data for serialization
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_capability_registry",
            "capabilities": self.capabilities,
            "capability_providers": self.capability_providers,
            "capability_compositions": self.capability_compositions,
            "capability_usage_stats": self.capability_usage_stats
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.capabilities)} capabilities to registry")
    
    def _get_registry_state_hash(self) -> str:
        """Get a hash of the current registry state.
        
        Returns:
            Hash of the current registry state.
        """
        # Create a string representation of the registry state
        state_data = {
            "capabilities": self.capabilities,
            "capability_providers": self.capability_providers,
            "capability_compositions": self.capability_compositions,
            "capability_usage_stats": self.capability_usage_stats
        }
        state_str = json.dumps(state_data, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def register_capability(self, capability_data: Dict[str, Any]) -> CapabilityRegistrationResult:
        """Register a new capability.
        
        Args:
            capability_data: Data for the capability to register.
                Must include capability_id, name, description, capability_type,
                level, requirements, and governance configuration.
                
        Returns:
            CapabilityRegistrationResult with success status and details.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "register_capability",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return CapabilityRegistrationResult(
                    success=False,
                    error="Pre-loop tether verification failed"
                )
            
            # Validate the capability data
            validation_result = self.schema_validator.validate(capability_data, "capability_registration.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Capability validation failed: {validation_result.errors}")
                return CapabilityRegistrationResult(
                    success=False,
                    error=f"Capability validation failed: {validation_result.errors}"
                )
            
            # Check if the capability already exists
            capability_id = capability_data["capability_id"]
            if capability_id in self.capabilities:
                logger.error(f"Capability {capability_id} already exists")
                return CapabilityRegistrationResult(
                    success=False,
                    error=f"Capability {capability_id} already exists"
                )
            
            # Prepare the capability data
            registration_timestamp = datetime.utcnow().isoformat()
            capability = {
                "capability_id": capability_id,
                "name": capability_data["name"],
                "description": capability_data["description"],
                "capability_type": capability_data["capability_type"],
                "level": capability_data.get("level", CapabilityLevel.BASIC.value),
                "version": capability_data.get("version", "1.0.0"),
                "author": capability_data.get("author", "unknown"),
                "requirements": capability_data.get("requirements", []),
                "dependencies": capability_data.get("dependencies", []),
                "governance_config": capability_data.get("governance_config", {}),
                "metadata": capability_data.get("metadata", {}),
                "registration_timestamp": registration_timestamp,
                "status": CapabilityStatus.AVAILABLE.value,
                "usage_count": 0,
                "last_used": None
            }
            
            # Create a seal for the capability
            capability["seal"] = self.seal_verification_service.create_seal(capability)
            
            # Add the capability to the registry
            self.capabilities[capability_id] = capability
            
            # Initialize capability usage stats
            self.capability_usage_stats[capability_id] = {
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "average_performance_score": 0.0,
                "providers_using_capability": [],
                "request_history": []
            }
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Registered capability {capability_id}")
            return CapabilityRegistrationResult(
                success=True,
                capability_id=capability_id,
                registration_timestamp=registration_timestamp
            )
            
        except Exception as e:
            logger.error(f"Error registering capability: {str(e)}")
            return CapabilityRegistrationResult(
                success=False,
                error=f"Error registering capability: {str(e)}"
            )
    
    def register_capability_provider(self, provider_data: Dict[str, Any]) -> bool:
        """Register a capability provider.
        
        Args:
            provider_data: Data for the provider to register.
                Must include provider_id, provider_type, capabilities, and metadata.
                
        Returns:
            True if the provider was registered successfully.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "register_capability_provider",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return False
            
            # Validate the provider data
            validation_result = self.schema_validator.validate(provider_data, "capability_provider.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Provider validation failed: {validation_result.errors}")
                return False
            
            provider_id = provider_data["provider_id"]
            provider_type = provider_data["provider_type"]
            
            # Verify provider exists in appropriate registry
            if provider_type == "agent" and self.agent_registry:
                if not self.agent_registry.check_agent_exists(provider_id):
                    logger.error(f"Agent provider {provider_id} does not exist")
                    return False
            elif provider_type == "tool" and self.tool_registry:
                if not self.tool_registry.check_tool_exists(provider_id):
                    logger.error(f"Tool provider {provider_id} does not exist")
                    return False
            elif provider_type == "model" and self.model_registry:
                if not self.model_registry.check_model_exists(provider_id):
                    logger.error(f"Model provider {provider_id} does not exist")
                    return False
            
            # Prepare the provider data
            provider = {
                "provider_id": provider_id,
                "provider_type": provider_type,
                "capabilities": provider_data["capabilities"],
                "performance_metrics": provider_data.get("performance_metrics", {}),
                "availability": provider_data.get("availability", 1.0),
                "metadata": provider_data.get("metadata", {}),
                "registration_timestamp": datetime.utcnow().isoformat()
            }
            
            # Create a seal for the provider
            provider["seal"] = self.seal_verification_service.create_seal(provider)
            
            # Add the provider to the registry
            provider_key = f"{provider_type}:{provider_id}"
            self.capability_providers[provider_key] = provider
            
            # Update capability usage stats
            for capability_id in provider["capabilities"]:
                if capability_id in self.capability_usage_stats:
                    providers = self.capability_usage_stats[capability_id]["providers_using_capability"]
                    if provider_key not in providers:
                        providers.append(provider_key)
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Registered capability provider {provider_key}")
            return True
            
        except Exception as e:
            logger.error(f"Error registering capability provider: {str(e)}")
            return False
    
    def find_capability_providers(self, capability_requirements: List[CapabilityRequirement]) -> List[CapabilityMatch]:
        """Find providers that match capability requirements.
        
        Args:
            capability_requirements: List of capability requirements to match.
            
        Returns:
            List of capability matches sorted by match score.
        """
        matches = []
        
        for requirement in capability_requirements:
            capability_id = requirement.capability_id
            minimum_level = requirement.minimum_level
            
            # Find providers for this capability
            for provider_key, provider in self.capability_providers.items():
                if capability_id in provider["capabilities"]:
                    # Calculate match score
                    match_score = self._calculate_match_score(provider, requirement)
                    
                    if match_score > 0.0:
                        provider_type, provider_id = provider_key.split(":", 1)
                        match = CapabilityMatch(
                            capability_id=capability_id,
                            provider_id=provider_id,
                            provider_type=provider_type,
                            match_score=match_score,
                            level=provider.get("level", CapabilityLevel.BASIC.value),
                            metadata=provider.get("metadata", {})
                        )
                        matches.append(match)
        
        # Sort by match score (descending)
        matches.sort(key=lambda x: x.match_score, reverse=True)
        return matches
    
    def _calculate_match_score(self, provider: Dict[str, Any], requirement: CapabilityRequirement) -> float:
        """Calculate match score between provider and requirement.
        
        Args:
            provider: Provider information.
            requirement: Capability requirement.
            
        Returns:
            Match score between 0.0 and 1.0.
        """
        base_score = 0.5  # Base score for having the capability
        
        # Level matching bonus
        provider_level = provider.get("level", CapabilityLevel.BASIC.value)
        required_level = requirement.minimum_level
        
        level_scores = {
            CapabilityLevel.BASIC.value: 1,
            CapabilityLevel.INTERMEDIATE.value: 2,
            CapabilityLevel.ADVANCED.value: 3,
            CapabilityLevel.EXPERT.value: 4,
            CapabilityLevel.MASTER.value: 5
        }
        
        provider_level_score = level_scores.get(provider_level, 1)
        required_level_score = level_scores.get(required_level, 1)
        
        if provider_level_score >= required_level_score:
            level_bonus = 0.3 + (provider_level_score - required_level_score) * 0.05
        else:
            level_bonus = -0.2  # Penalty for not meeting minimum level
        
        # Performance metrics bonus
        performance_metrics = provider.get("performance_metrics", {})
        performance_bonus = 0.0
        if performance_metrics:
            avg_performance = sum(performance_metrics.values()) / len(performance_metrics)
            performance_bonus = (avg_performance - 0.5) * 0.2  # Scale to ±0.2
        
        # Availability bonus
        availability = provider.get("availability", 1.0)
        availability_bonus = (availability - 0.5) * 0.1  # Scale to ±0.1
        
        # Calculate final score
        final_score = base_score + level_bonus + performance_bonus + availability_bonus
        return max(0.0, min(1.0, final_score))  # Clamp to [0, 1]
    
    def compose_capabilities(self, composition_data: Dict[str, Any]) -> bool:
        """Create a capability composition.
        
        Args:
            composition_data: Data for the composition to create.
                Must include composition_id, name, component_capabilities, and composition_logic.
                
        Returns:
            True if the composition was created successfully.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "compose_capabilities",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return False
            
            # Validate the composition data
            validation_result = self.schema_validator.validate(composition_data, "capability_composition.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Composition validation failed: {validation_result.errors}")
                return False
            
            composition_id = composition_data["composition_id"]
            
            # Check if the composition already exists
            if composition_id in self.capability_compositions:
                logger.error(f"Capability composition {composition_id} already exists")
                return False
            
            # Validate component capabilities exist
            component_capabilities = composition_data["component_capabilities"]
            for capability_id in component_capabilities:
                if capability_id not in self.capabilities:
                    logger.error(f"Component capability {capability_id} does not exist")
                    return False
            
            # Prepare the composition data
            composition = {
                "composition_id": composition_id,
                "name": composition_data["name"],
                "description": composition_data.get("description", ""),
                "component_capabilities": component_capabilities,
                "composition_logic": composition_data["composition_logic"],
                "output_capability": composition_data.get("output_capability"),
                "metadata": composition_data.get("metadata", {}),
                "registration_timestamp": datetime.utcnow().isoformat(),
                "usage_count": 0
            }
            
            # Create a seal for the composition
            composition["seal"] = self.seal_verification_service.create_seal(composition)
            
            # Add the composition to the registry
            self.capability_compositions[composition_id] = composition
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Created capability composition {composition_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating capability composition: {str(e)}")
            return False
    
    def execute_capability_composition(self, composition_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a capability composition.
        
        Args:
            composition_id: ID of the composition to execute.
            input_data: Input data for the composition.
            
        Returns:
            Execution results.
        """
        try:
            if composition_id not in self.capability_compositions:
                return {
                    "success": False,
                    "error": f"Capability composition {composition_id} does not exist"
                }
            
            composition = self.capability_compositions[composition_id]
            component_capabilities = composition["component_capabilities"]
            composition_logic = composition["composition_logic"]
            
            # Execute component capabilities
            component_results = {}
            for capability_id in component_capabilities:
                # Find providers for this capability
                requirement = CapabilityRequirement(
                    capability_id=capability_id,
                    minimum_level=CapabilityLevel.BASIC.value,
                    required=True,
                    alternatives=[]
                )
                matches = self.find_capability_providers([requirement])
                
                if matches:
                    # Use the best match
                    best_match = matches[0]
                    result = self._execute_capability(best_match, input_data)
                    component_results[capability_id] = result
                else:
                    component_results[capability_id] = {
                        "success": False,
                        "error": f"No providers found for capability {capability_id}"
                    }
            
            # Apply composition logic
            final_result = self._apply_composition_logic(composition_logic, component_results, input_data)
            
            # Update usage count
            self.capability_compositions[composition_id]["usage_count"] += 1
            
            return final_result
            
        except Exception as e:
            logger.error(f"Error executing capability composition {composition_id}: {str(e)}")
            return {
                "success": False,
                "error": f"Error executing composition: {str(e)}"
            }
    
    def _execute_capability(self, match: CapabilityMatch, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a capability using a matched provider.
        
        Args:
            match: Capability match information.
            input_data: Input data for the capability.
            
        Returns:
            Execution results.
        """
        provider_type = match.provider_type
        provider_id = match.provider_id
        capability_id = match.capability_id
        
        try:
            if provider_type == "agent" and self.agent_registry:
                # Execute agent capability (simulated)
                return {
                    "success": True,
                    "output": f"Agent {provider_id} executed capability {capability_id}",
                    "provider_type": provider_type,
                    "provider_id": provider_id
                }
            elif provider_type == "tool" and self.tool_registry:
                # Execute tool capability
                tool_result = self.tool_registry.invoke_tool(provider_id, input_data)
                return {
                    "success": tool_result.success,
                    "output": tool_result.output,
                    "error": tool_result.error,
                    "provider_type": provider_type,
                    "provider_id": provider_id
                }
            elif provider_type == "model" and self.model_registry:
                # Execute model capability
                inference_result = self.model_registry.inference(provider_id, input_data)
                return {
                    "success": inference_result.success,
                    "output": inference_result.output,
                    "error": inference_result.error,
                    "provider_type": provider_type,
                    "provider_id": provider_id
                }
            else:
                return {
                    "success": False,
                    "error": f"Unknown provider type: {provider_type}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error executing capability: {str(e)}"
            }
    
    def _apply_composition_logic(self, composition_logic: str, component_results: Dict[str, Any], 
                               input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply composition logic to component results.
        
        Args:
            composition_logic: Logic for combining component results.
            component_results: Results from component capabilities.
            input_data: Original input data.
            
        Returns:
            Final composition result.
        """
        # Simple composition logic implementation
        # In a real system, this would be more sophisticated
        
        if composition_logic == "sequential":
            # Execute capabilities in sequence, passing output to next
            current_data = input_data.copy()
            for capability_id, result in component_results.items():
                if result.get("success"):
                    if result.get("output"):
                        current_data.update(result["output"])
                else:
                    return {
                        "success": False,
                        "error": f"Sequential composition failed at {capability_id}: {result.get('error')}"
                    }
            
            return {
                "success": True,
                "output": current_data,
                "composition_type": "sequential"
            }
        
        elif composition_logic == "parallel":
            # Combine all successful results
            combined_output = input_data.copy()
            successful_components = []
            
            for capability_id, result in component_results.items():
                if result.get("success"):
                    successful_components.append(capability_id)
                    if result.get("output"):
                        combined_output[f"{capability_id}_output"] = result["output"]
            
            return {
                "success": len(successful_components) > 0,
                "output": combined_output,
                "successful_components": successful_components,
                "composition_type": "parallel"
            }
        
        elif composition_logic == "consensus":
            # Use majority consensus of results
            successful_results = [r for r in component_results.values() if r.get("success")]
            
            if len(successful_results) > len(component_results) / 2:
                # Majority success
                consensus_output = input_data.copy()
                consensus_output["consensus_results"] = successful_results
                
                return {
                    "success": True,
                    "output": consensus_output,
                    "consensus_count": len(successful_results),
                    "composition_type": "consensus"
                }
            else:
                return {
                    "success": False,
                    "error": "Consensus not reached",
                    "successful_count": len(successful_results),
                    "total_count": len(component_results)
                }
        
        else:
            # Default: return all results
            return {
                "success": True,
                "output": {
                    "input_data": input_data,
                    "component_results": component_results
                },
                "composition_type": "default"
            }
    
    def get_capability(self, capability_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a capability.
        
        Args:
            capability_id: ID of the capability to get.
            
        Returns:
            Information about the capability, or None if it doesn't exist.
        """
        return self.capabilities.get(capability_id)
    
    def get_capability_providers(self, capability_id: str) -> List[Dict[str, Any]]:
        """Get providers for a specific capability.
        
        Args:
            capability_id: ID of the capability.
            
        Returns:
            List of providers that offer the capability.
        """
        providers = []
        
        for provider_key, provider in self.capability_providers.items():
            if capability_id in provider["capabilities"]:
                provider_copy = provider.copy()
                provider_copy["provider_key"] = provider_key
                providers.append(provider_copy)
        
        return providers
    
    def get_capability_usage_stats(self, capability_id: str) -> Optional[Dict[str, Any]]:
        """Get capability usage statistics.
        
        Args:
            capability_id: ID of the capability.
            
        Returns:
            Capability usage statistics, or None if it doesn't exist.
        """
        return self.capability_usage_stats.get(capability_id)
    
    def list_capabilities(self, capability_type_filter: Optional[CapabilityType] = None,
                         level_filter: Optional[CapabilityLevel] = None,
                         status_filter: Optional[CapabilityStatus] = None) -> Dict[str, Dict[str, Any]]:
        """List all registered capabilities with optional filtering.
        
        Args:
            capability_type_filter: Optional capability type filter.
            level_filter: Optional level filter.
            status_filter: Optional status filter.
            
        Returns:
            Dictionary mapping capability IDs to capability information.
        """
        filtered_capabilities = {}
        
        for capability_id, capability in self.capabilities.items():
            # Apply capability type filter
            if capability_type_filter and capability.get("capability_type") != capability_type_filter.value:
                continue
            
            # Apply level filter
            if level_filter and capability.get("level") != level_filter.value:
                continue
            
            # Apply status filter
            if status_filter and capability.get("status") != status_filter.value:
                continue
            
            filtered_capabilities[capability_id] = capability
        
        return filtered_capabilities
    
    def get_available_capabilities(self) -> List[str]:
        """Get list of currently available capabilities.
        
        Returns:
            List of available capability IDs.
        """
        available_capabilities = []
        
        for capability_id, capability in self.capabilities.items():
            if capability.get("status") == CapabilityStatus.AVAILABLE.value:
                available_capabilities.append(capability_id)
        
        return available_capabilities
    
    def get_registry_statistics(self) -> Dict[str, Any]:
        """Get registry statistics.
        
        Returns:
            Dictionary containing registry statistics.
        """
        stats = {
            "total_capabilities": len(self.capabilities),
            "capabilities_by_type": {},
            "capabilities_by_level": {},
            "capabilities_by_status": {},
            "total_providers": len(self.capability_providers),
            "providers_by_type": {},
            "total_compositions": len(self.capability_compositions)
        }
        
        # Count capabilities by type
        for capability in self.capabilities.values():
            capability_type = capability.get("capability_type", "unknown")
            stats["capabilities_by_type"][capability_type] = stats["capabilities_by_type"].get(capability_type, 0) + 1
        
        # Count capabilities by level
        for capability in self.capabilities.values():
            level = capability.get("level", "unknown")
            stats["capabilities_by_level"][level] = stats["capabilities_by_level"].get(level, 0) + 1
        
        # Count capabilities by status
        for capability in self.capabilities.values():
            status = capability.get("status", "unknown")
            stats["capabilities_by_status"][status] = stats["capabilities_by_status"].get(status, 0) + 1
        
        # Count providers by type
        for provider in self.capability_providers.values():
            provider_type = provider.get("provider_type", "unknown")
            stats["providers_by_type"][provider_type] = stats["providers_by_type"].get(provider_type, 0) + 1
        
        return stats
    
    def check_capability_exists(self, capability_id: str) -> bool:
        """Check if a capability exists.
        
        Args:
            capability_id: ID of the capability to check.
            
        Returns:
            True if the capability exists, False otherwise.
        """
        return capability_id in self.capabilities
    
    def update_capability_status(self, capability_id: str, status: CapabilityStatus) -> bool:
        """Update a capability's status.
        
        Args:
            capability_id: ID of the capability to update.
            status: New status for the capability.
            
        Returns:
            True if the status was updated successfully.
        """
        try:
            if capability_id not in self.capabilities:
                logger.error(f"Capability {capability_id} does not exist")
                return False
            
            # Update capability status
            self.capabilities[capability_id]["status"] = status.value
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Updated capability {capability_id} status to {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating capability {capability_id} status: {str(e)}")
            return False

