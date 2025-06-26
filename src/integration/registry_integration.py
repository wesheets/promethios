"""
Comprehensive Registry Integration Module for Promethios.

This module integrates all 8 registries with the governance-native LLM system:
1. Agent Registry - Multi-agent management
2. Tool Registry - Tool discovery and execution
3. Model Registry - LLM model management
4. Workflow Registry - Multi-agent orchestration
5. Capability Registry - System discovery
6. Persona Registry - Agent roles/personalities
7. Service Registry - External integrations
8. Template Registry - Reusable components

This creates the complete AI Agent Operating System.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, NamedTuple
from enum import Enum
import asyncio
import uuid

# Import all registries
from src.modules.agent_registry.agent_registry import AgentRegistry
from src.modules.tool_registry.tool_registry import ToolRegistry
from src.modules.model_registry.model_registry import ModelRegistry
from src.modules.workflow_registry.workflow_registry import WorkflowRegistry
from src.modules.capability_registry.capability_registry import CapabilityRegistry
from src.modules.persona_registry.persona_registry import PersonaRegistry
from src.modules.service_registry.service_registry import ServiceRegistry
from src.modules.template_registry.template_registry import TemplateRegistry

# Import LLM integration
from src.extensions.llm.models.governance_native_llm import GovernanceNativeLLM

# Configure logging
logger = logging.getLogger(__name__)

class RegistryType(Enum):
    """Registry type enumeration."""
    AGENT = "agent"
    TOOL = "tool"
    MODEL = "model"
    WORKFLOW = "workflow"
    CAPABILITY = "capability"
    PERSONA = "persona"
    SERVICE = "service"
    TEMPLATE = "template"

class IntegrationStatus(Enum):
    """Integration status enumeration."""
    INITIALIZING = "initializing"
    ACTIVE = "active"
    ERROR = "error"
    MAINTENANCE = "maintenance"

class OperationResult(NamedTuple):
    """Result of registry operation."""
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    registry_type: Optional[str] = None
    operation_id: Optional[str] = None

class RegistryIntegration:
    """Comprehensive integration of all registries with LLM system."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        governance_integration,
        registry_base_path: str = "/home/ubuntu/promethios/data/registries",
        llm_config: Optional[Dict[str, Any]] = None
    ):
        """Initialize the registry integration.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            governance_integration: Governance integration service.
            registry_base_path: Base path for registry files.
            llm_config: Optional LLM configuration.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.governance_integration = governance_integration
        self.registry_base_path = registry_base_path
        self.llm_config = llm_config or {}
        
        # Integration status
        self.status = IntegrationStatus.INITIALIZING
        self.initialization_timestamp = datetime.utcnow().isoformat()
        self.operation_history = []
        
        # Initialize all registries
        self.registries = {}
        self._initialize_registries()
        
        # Initialize LLM integration
        self.llm = None
        self._initialize_llm()
        
        # Set status to active
        self.status = IntegrationStatus.ACTIVE
        logger.info("Registry integration initialized successfully")
    
    def _initialize_registries(self):
        """Initialize all 8 registries."""
        try:
            # Ensure registry directory exists
            os.makedirs(self.registry_base_path, exist_ok=True)
            
            # Initialize Agent Registry
            self.registries[RegistryType.AGENT] = AgentRegistry(
                schema_validator=self.schema_validator,
                seal_verification_service=self.seal_verification_service,
                registry_path=os.path.join(self.registry_base_path, "agents.json"),
                governance_integration=self.governance_integration
            )
            
            # Initialize Tool Registry
            self.registries[RegistryType.TOOL] = ToolRegistry(
                schema_validator=self.schema_validator,
                seal_verification_service=self.seal_verification_service,
                registry_path=os.path.join(self.registry_base_path, "tools.json"),
                governance_integration=self.governance_integration
            )
            
            # Initialize Model Registry
            self.registries[RegistryType.MODEL] = ModelRegistry(
                schema_validator=self.schema_validator,
                seal_verification_service=self.seal_verification_service,
                registry_path=os.path.join(self.registry_base_path, "models.json"),
                governance_integration=self.governance_integration
            )
            
            # Initialize Workflow Registry
            self.registries[RegistryType.WORKFLOW] = WorkflowRegistry(
                schema_validator=self.schema_validator,
                seal_verification_service=self.seal_verification_service,
                registry_path=os.path.join(self.registry_base_path, "workflows.json"),
                governance_integration=self.governance_integration
            )
            
            # Initialize Capability Registry
            self.registries[RegistryType.CAPABILITY] = CapabilityRegistry(
                schema_validator=self.schema_validator,
                seal_verification_service=self.seal_verification_service,
                registry_path=os.path.join(self.registry_base_path, "capabilities.json"),
                governance_integration=self.governance_integration
            )
            
            # Initialize Persona Registry
            self.registries[RegistryType.PERSONA] = PersonaRegistry(
                schema_validator=self.schema_validator,
                seal_verification_service=self.seal_verification_service,
                registry_path=os.path.join(self.registry_base_path, "personas.json"),
                governance_integration=self.governance_integration
            )
            
            # Initialize Service Registry
            self.registries[RegistryType.SERVICE] = ServiceRegistry(
                schema_validator=self.schema_validator,
                seal_verification_service=self.seal_verification_service,
                registry_path=os.path.join(self.registry_base_path, "services.json"),
                governance_integration=self.governance_integration
            )
            
            # Initialize Template Registry
            self.registries[RegistryType.TEMPLATE] = TemplateRegistry(
                schema_validator=self.schema_validator,
                seal_verification_service=self.seal_verification_service,
                registry_path=os.path.join(self.registry_base_path, "templates.json"),
                governance_integration=self.governance_integration
            )
            
            logger.info("All 8 registries initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing registries: {str(e)}")
            self.status = IntegrationStatus.ERROR
            raise
    
    def _initialize_llm(self):
        """Initialize the governance-native LLM."""
        try:
            # Create LLM with registry integration
            self.llm = GovernanceNativeLLM(
                governance_integration=self.governance_integration,
                registry_integration=self,
                config=self.llm_config
            )
            
            logger.info("Governance-native LLM initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing LLM: {str(e)}")
            # Don't fail the entire integration if LLM fails
            self.llm = None
    
    def get_registry(self, registry_type: RegistryType):
        """Get a specific registry.
        
        Args:
            registry_type: Type of registry to get.
            
        Returns:
            Registry instance or None if not found.
        """
        return self.registries.get(registry_type)
    
    def get_all_registries(self) -> Dict[RegistryType, Any]:
        """Get all registries.
        
        Returns:
            Dictionary mapping registry types to registry instances.
        """
        return self.registries.copy()
    
    def register_agent(self, agent_data: Dict[str, Any]) -> OperationResult:
        """Register an agent through the integration.
        
        Args:
            agent_data: Agent data to register.
            
        Returns:
            OperationResult with success status and details.
        """
        operation_id = str(uuid.uuid4())
        
        try:
            agent_registry = self.registries[RegistryType.AGENT]
            result = agent_registry.register_agent(agent_data)
            
            # Log operation
            self._log_operation("register_agent", operation_id, result.success, result.error)
            
            return OperationResult(
                success=result.success,
                result=result,
                error=result.error,
                registry_type=RegistryType.AGENT.value,
                operation_id=operation_id
            )
            
        except Exception as e:
            error_msg = f"Error registering agent: {str(e)}"
            self._log_operation("register_agent", operation_id, False, error_msg)
            return OperationResult(
                success=False,
                error=error_msg,
                registry_type=RegistryType.AGENT.value,
                operation_id=operation_id
            )
    
    def register_tool(self, tool_data: Dict[str, Any]) -> OperationResult:
        """Register a tool through the integration.
        
        Args:
            tool_data: Tool data to register.
            
        Returns:
            OperationResult with success status and details.
        """
        operation_id = str(uuid.uuid4())
        
        try:
            tool_registry = self.registries[RegistryType.TOOL]
            result = tool_registry.register_tool(tool_data)
            
            # Log operation
            self._log_operation("register_tool", operation_id, result.success, result.error)
            
            return OperationResult(
                success=result.success,
                result=result,
                error=result.error,
                registry_type=RegistryType.TOOL.value,
                operation_id=operation_id
            )
            
        except Exception as e:
            error_msg = f"Error registering tool: {str(e)}"
            self._log_operation("register_tool", operation_id, False, error_msg)
            return OperationResult(
                success=False,
                error=error_msg,
                registry_type=RegistryType.TOOL.value,
                operation_id=operation_id
            )
    
    def register_model(self, model_data: Dict[str, Any]) -> OperationResult:
        """Register a model through the integration.
        
        Args:
            model_data: Model data to register.
            
        Returns:
            OperationResult with success status and details.
        """
        operation_id = str(uuid.uuid4())
        
        try:
            model_registry = self.registries[RegistryType.MODEL]
            result = model_registry.register_model(model_data)
            
            # Log operation
            self._log_operation("register_model", operation_id, result.success, result.error)
            
            return OperationResult(
                success=result.success,
                result=result,
                error=result.error,
                registry_type=RegistryType.MODEL.value,
                operation_id=operation_id
            )
            
        except Exception as e:
            error_msg = f"Error registering model: {str(e)}"
            self._log_operation("register_model", operation_id, False, error_msg)
            return OperationResult(
                success=False,
                error=error_msg,
                registry_type=RegistryType.MODEL.value,
                operation_id=operation_id
            )
    
    def execute_workflow(self, workflow_id: str, input_data: Dict[str, Any]) -> OperationResult:
        """Execute a workflow through the integration.
        
        Args:
            workflow_id: ID of the workflow to execute.
            input_data: Input data for the workflow.
            
        Returns:
            OperationResult with success status and details.
        """
        operation_id = str(uuid.uuid4())
        
        try:
            workflow_registry = self.registries[RegistryType.WORKFLOW]
            result = workflow_registry.execute_workflow(workflow_id, input_data)
            
            # Log operation
            self._log_operation("execute_workflow", operation_id, result.success, result.error)
            
            return OperationResult(
                success=result.success,
                result=result,
                error=result.error,
                registry_type=RegistryType.WORKFLOW.value,
                operation_id=operation_id
            )
            
        except Exception as e:
            error_msg = f"Error executing workflow: {str(e)}"
            self._log_operation("execute_workflow", operation_id, False, error_msg)
            return OperationResult(
                success=False,
                error=error_msg,
                registry_type=RegistryType.WORKFLOW.value,
                operation_id=operation_id
            )
    
    def discover_capabilities(self, query: str) -> OperationResult:
        """Discover capabilities through the integration.
        
        Args:
            query: Query for capability discovery.
            
        Returns:
            OperationResult with success status and details.
        """
        operation_id = str(uuid.uuid4())
        
        try:
            capability_registry = self.registries[RegistryType.CAPABILITY]
            result = capability_registry.discover_capabilities(query)
            
            # Log operation
            self._log_operation("discover_capabilities", operation_id, True, None)
            
            return OperationResult(
                success=True,
                result=result,
                registry_type=RegistryType.CAPABILITY.value,
                operation_id=operation_id
            )
            
        except Exception as e:
            error_msg = f"Error discovering capabilities: {str(e)}"
            self._log_operation("discover_capabilities", operation_id, False, error_msg)
            return OperationResult(
                success=False,
                error=error_msg,
                registry_type=RegistryType.CAPABILITY.value,
                operation_id=operation_id
            )
    
    def apply_persona(self, agent_id: str, persona_id: str) -> OperationResult:
        """Apply a persona to an agent through the integration.
        
        Args:
            agent_id: ID of the agent.
            persona_id: ID of the persona to apply.
            
        Returns:
            OperationResult with success status and details.
        """
        operation_id = str(uuid.uuid4())
        
        try:
            persona_registry = self.registries[RegistryType.PERSONA]
            result = persona_registry.apply_persona(agent_id, persona_id)
            
            # Log operation
            self._log_operation("apply_persona", operation_id, result.success, result.error)
            
            return OperationResult(
                success=result.success,
                result=result,
                error=result.error,
                registry_type=RegistryType.PERSONA.value,
                operation_id=operation_id
            )
            
        except Exception as e:
            error_msg = f"Error applying persona: {str(e)}"
            self._log_operation("apply_persona", operation_id, False, error_msg)
            return OperationResult(
                success=False,
                error=error_msg,
                registry_type=RegistryType.PERSONA.value,
                operation_id=operation_id
            )
    
    def instantiate_template(self, template_id: str, variables: Dict[str, Any]) -> OperationResult:
        """Instantiate a template through the integration.
        
        Args:
            template_id: ID of the template to instantiate.
            variables: Variables for template instantiation.
            
        Returns:
            OperationResult with success status and details.
        """
        operation_id = str(uuid.uuid4())
        
        try:
            template_registry = self.registries[RegistryType.TEMPLATE]
            result = template_registry.instantiate_template(template_id, variables)
            
            # Log operation
            self._log_operation("instantiate_template", operation_id, result.success, result.error)
            
            return OperationResult(
                success=result.success,
                result=result,
                error=result.error,
                registry_type=RegistryType.TEMPLATE.value,
                operation_id=operation_id
            )
            
        except Exception as e:
            error_msg = f"Error instantiating template: {str(e)}"
            self._log_operation("instantiate_template", operation_id, False, error_msg)
            return OperationResult(
                success=False,
                error=error_msg,
                registry_type=RegistryType.TEMPLATE.value,
                operation_id=operation_id
            )
    
    def llm_inference(self, prompt: str, model_preferences: Optional[List[str]] = None, 
                     governance_context: Optional[Dict[str, Any]] = None) -> OperationResult:
        """Perform LLM inference through the integration.
        
        Args:
            prompt: Input prompt for inference.
            model_preferences: Optional list of preferred model IDs.
            governance_context: Optional governance context.
            
        Returns:
            OperationResult with success status and details.
        """
        operation_id = str(uuid.uuid4())
        
        try:
            if not self.llm:
                return OperationResult(
                    success=False,
                    error="LLM not initialized",
                    operation_id=operation_id
                )
            
            # Use model registry to find suitable models
            if model_preferences:
                available_models = []
                model_registry = self.registries[RegistryType.MODEL]
                for model_id in model_preferences:
                    if model_registry.check_model_exists(model_id):
                        model = model_registry.get_model(model_id)
                        if model and model.get("status") == "active":
                            available_models.append(model_id)
                
                if not available_models:
                    return OperationResult(
                        success=False,
                        error="No preferred models available",
                        operation_id=operation_id
                    )
            
            # Perform inference
            result = self.llm.generate(
                prompt=prompt,
                model_preferences=model_preferences,
                governance_context=governance_context
            )
            
            # Log operation
            self._log_operation("llm_inference", operation_id, True, None)
            
            return OperationResult(
                success=True,
                result=result,
                operation_id=operation_id
            )
            
        except Exception as e:
            error_msg = f"Error performing LLM inference: {str(e)}"
            self._log_operation("llm_inference", operation_id, False, error_msg)
            return OperationResult(
                success=False,
                error=error_msg,
                operation_id=operation_id
            )
    
    def get_system_overview(self) -> Dict[str, Any]:
        """Get comprehensive system overview.
        
        Returns:
            Dictionary containing system overview information.
        """
        overview = {
            "integration_status": self.status.value,
            "initialization_timestamp": self.initialization_timestamp,
            "registries": {},
            "llm_status": "active" if self.llm else "inactive",
            "total_operations": len(self.operation_history),
            "recent_operations": self.operation_history[-10:] if self.operation_history else []
        }
        
        # Get statistics from each registry
        for registry_type, registry in self.registries.items():
            try:
                stats = registry.get_registry_statistics()
                overview["registries"][registry_type.value] = {
                    "status": "active",
                    "statistics": stats
                }
            except Exception as e:
                overview["registries"][registry_type.value] = {
                    "status": "error",
                    "error": str(e)
                }
        
        return overview
    
    def get_cross_registry_insights(self) -> Dict[str, Any]:
        """Get insights across all registries.
        
        Returns:
            Dictionary containing cross-registry insights.
        """
        insights = {
            "agent_tool_compatibility": self._analyze_agent_tool_compatibility(),
            "model_capability_coverage": self._analyze_model_capability_coverage(),
            "workflow_complexity_analysis": self._analyze_workflow_complexity(),
            "persona_usage_patterns": self._analyze_persona_usage(),
            "template_reusability": self._analyze_template_reusability(),
            "service_integration_health": self._analyze_service_integration(),
            "capability_gaps": self._identify_capability_gaps(),
            "optimization_recommendations": self._generate_optimization_recommendations()
        }
        
        return insights
    
    def _analyze_agent_tool_compatibility(self) -> Dict[str, Any]:
        """Analyze compatibility between agents and tools."""
        try:
            agent_registry = self.registries[RegistryType.AGENT]
            tool_registry = self.registries[RegistryType.TOOL]
            
            agents = agent_registry.list_agents()
            tools = tool_registry.list_tools()
            
            compatibility_matrix = {}
            for agent_id, agent in agents.items():
                agent_capabilities = agent.get("capabilities", [])
                compatible_tools = []
                
                for tool_id, tool in tools.items():
                    tool_requirements = tool.get("requirements", [])
                    # Simple compatibility check
                    if any(cap.get("capability_id") in [req.get("capability") for req in tool_requirements] 
                           for cap in agent_capabilities):
                        compatible_tools.append(tool_id)
                
                compatibility_matrix[agent_id] = compatible_tools
            
            return {
                "total_agents": len(agents),
                "total_tools": len(tools),
                "compatibility_matrix": compatibility_matrix,
                "average_tools_per_agent": sum(len(tools) for tools in compatibility_matrix.values()) / len(agents) if agents else 0
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def _analyze_model_capability_coverage(self) -> Dict[str, Any]:
        """Analyze capability coverage across models."""
        try:
            model_registry = self.registries[RegistryType.MODEL]
            capability_registry = self.registries[RegistryType.CAPABILITY]
            
            models = model_registry.list_models()
            all_capabilities = capability_registry.list_capabilities()
            
            capability_coverage = {}
            for capability_id in all_capabilities:
                covering_models = []
                for model_id, model in models.items():
                    model_capabilities = model.get("capabilities", [])
                    if any(cap.get("capability_id") == capability_id for cap in model_capabilities):
                        covering_models.append(model_id)
                capability_coverage[capability_id] = covering_models
            
            return {
                "total_capabilities": len(all_capabilities),
                "total_models": len(models),
                "capability_coverage": capability_coverage,
                "uncovered_capabilities": [cap for cap, models in capability_coverage.items() if not models]
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def _analyze_workflow_complexity(self) -> Dict[str, Any]:
        """Analyze workflow complexity patterns."""
        try:
            workflow_registry = self.registries[RegistryType.WORKFLOW]
            workflows = workflow_registry.list_workflows()
            
            complexity_analysis = {
                "simple_workflows": 0,
                "medium_workflows": 0,
                "complex_workflows": 0,
                "average_steps": 0,
                "most_complex_workflow": None
            }
            
            total_steps = 0
            max_complexity = 0
            most_complex = None
            
            for workflow_id, workflow in workflows.items():
                steps = workflow.get("steps", [])
                step_count = len(steps)
                total_steps += step_count
                
                if step_count > max_complexity:
                    max_complexity = step_count
                    most_complex = workflow_id
                
                if step_count <= 3:
                    complexity_analysis["simple_workflows"] += 1
                elif step_count <= 7:
                    complexity_analysis["medium_workflows"] += 1
                else:
                    complexity_analysis["complex_workflows"] += 1
            
            if workflows:
                complexity_analysis["average_steps"] = total_steps / len(workflows)
                complexity_analysis["most_complex_workflow"] = most_complex
            
            return complexity_analysis
            
        except Exception as e:
            return {"error": str(e)}
    
    def _analyze_persona_usage(self) -> Dict[str, Any]:
        """Analyze persona usage patterns."""
        try:
            persona_registry = self.registries[RegistryType.PERSONA]
            agent_registry = self.registries[RegistryType.AGENT]
            
            personas = persona_registry.list_personas()
            agents = agent_registry.list_agents()
            
            usage_patterns = {
                "total_personas": len(personas),
                "personas_in_use": 0,
                "unused_personas": [],
                "most_popular_persona": None,
                "persona_usage_count": {}
            }
            
            # Analyze persona usage
            for persona_id in personas:
                usage_count = 0
                for agent_id, agent in agents.items():
                    if agent.get("persona_id") == persona_id:
                        usage_count += 1
                
                usage_patterns["persona_usage_count"][persona_id] = usage_count
                if usage_count > 0:
                    usage_patterns["personas_in_use"] += 1
                else:
                    usage_patterns["unused_personas"].append(persona_id)
            
            # Find most popular persona
            if usage_patterns["persona_usage_count"]:
                most_popular = max(usage_patterns["persona_usage_count"].items(), key=lambda x: x[1])
                usage_patterns["most_popular_persona"] = most_popular[0]
            
            return usage_patterns
            
        except Exception as e:
            return {"error": str(e)}
    
    def _analyze_template_reusability(self) -> Dict[str, Any]:
        """Analyze template reusability patterns."""
        try:
            template_registry = self.registries[RegistryType.TEMPLATE]
            templates = template_registry.list_templates()
            
            reusability_analysis = {
                "total_templates": len(templates),
                "highly_reused": 0,
                "moderately_reused": 0,
                "rarely_used": 0,
                "unused": 0,
                "most_reused_template": None
            }
            
            max_usage = 0
            most_reused = None
            
            for template_id, template in templates.items():
                usage_count = template.get("usage_count", 0)
                
                if usage_count > max_usage:
                    max_usage = usage_count
                    most_reused = template_id
                
                if usage_count == 0:
                    reusability_analysis["unused"] += 1
                elif usage_count <= 5:
                    reusability_analysis["rarely_used"] += 1
                elif usage_count <= 20:
                    reusability_analysis["moderately_reused"] += 1
                else:
                    reusability_analysis["highly_reused"] += 1
            
            reusability_analysis["most_reused_template"] = most_reused
            
            return reusability_analysis
            
        except Exception as e:
            return {"error": str(e)}
    
    def _analyze_service_integration(self) -> Dict[str, Any]:
        """Analyze service integration health."""
        try:
            service_registry = self.registries[RegistryType.SERVICE]
            services = service_registry.list_services()
            
            integration_health = {
                "total_services": len(services),
                "active_services": 0,
                "inactive_services": 0,
                "error_services": 0,
                "average_response_time": 0,
                "service_status_distribution": {}
            }
            
            total_response_time = 0
            active_count = 0
            
            for service_id, service in services.items():
                status = service.get("status", "unknown")
                integration_health["service_status_distribution"][status] = \
                    integration_health["service_status_distribution"].get(status, 0) + 1
                
                if status == "active":
                    integration_health["active_services"] += 1
                    response_time = service.get("average_response_time", 0)
                    total_response_time += response_time
                    active_count += 1
                elif status == "inactive":
                    integration_health["inactive_services"] += 1
                elif status == "error":
                    integration_health["error_services"] += 1
            
            if active_count > 0:
                integration_health["average_response_time"] = total_response_time / active_count
            
            return integration_health
            
        except Exception as e:
            return {"error": str(e)}
    
    def _identify_capability_gaps(self) -> List[str]:
        """Identify capability gaps in the system."""
        try:
            capability_registry = self.registries[RegistryType.CAPABILITY]
            agent_registry = self.registries[RegistryType.AGENT]
            tool_registry = self.registries[RegistryType.TOOL]
            model_registry = self.registries[RegistryType.MODEL]
            
            # Get all required capabilities
            required_capabilities = set()
            
            # From agents
            agents = agent_registry.list_agents()
            for agent in agents.values():
                for cap in agent.get("required_capabilities", []):
                    required_capabilities.add(cap.get("capability_id"))
            
            # From tools
            tools = tool_registry.list_tools()
            for tool in tools.values():
                for req in tool.get("requirements", []):
                    required_capabilities.add(req.get("capability"))
            
            # Get available capabilities
            available_capabilities = set()
            
            # From capability registry
            capabilities = capability_registry.list_capabilities()
            available_capabilities.update(capabilities.keys())
            
            # From models
            models = model_registry.list_models()
            for model in models.values():
                for cap in model.get("capabilities", []):
                    available_capabilities.add(cap.get("capability_id"))
            
            # Find gaps
            capability_gaps = list(required_capabilities - available_capabilities)
            
            return capability_gaps
            
        except Exception as e:
            return [f"Error analyzing capability gaps: {str(e)}"]
    
    def _generate_optimization_recommendations(self) -> List[str]:
        """Generate optimization recommendations."""
        recommendations = []
        
        try:
            # Analyze system overview
            overview = self.get_system_overview()
            
            # Check registry health
            for registry_type, registry_info in overview.get("registries", {}).items():
                if registry_info.get("status") == "error":
                    recommendations.append(f"Fix errors in {registry_type} registry")
            
            # Check for unused resources
            insights = self.get_cross_registry_insights()
            
            unused_personas = insights.get("persona_usage_patterns", {}).get("unused_personas", [])
            if unused_personas:
                recommendations.append(f"Consider removing or repurposing {len(unused_personas)} unused personas")
            
            unused_templates = insights.get("template_reusability", {}).get("unused", 0)
            if unused_templates > 0:
                recommendations.append(f"Review and optimize {unused_templates} unused templates")
            
            # Check capability gaps
            capability_gaps = insights.get("capability_gaps", [])
            if capability_gaps:
                recommendations.append(f"Address {len(capability_gaps)} capability gaps in the system")
            
            # Check service health
            service_health = insights.get("service_integration_health", {})
            error_services = service_health.get("error_services", 0)
            if error_services > 0:
                recommendations.append(f"Fix {error_services} services in error state")
            
            if not recommendations:
                recommendations.append("System is well-optimized. Continue monitoring for improvements.")
            
            return recommendations
            
        except Exception as e:
            return [f"Error generating recommendations: {str(e)}"]
    
    def _log_operation(self, operation_type: str, operation_id: str, success: bool, error: Optional[str]):
        """Log an operation to the operation history.
        
        Args:
            operation_type: Type of operation performed.
            operation_id: Unique operation ID.
            success: Whether the operation was successful.
            error: Error message if operation failed.
        """
        operation_record = {
            "operation_id": operation_id,
            "operation_type": operation_type,
            "timestamp": datetime.utcnow().isoformat(),
            "success": success,
            "error": error
        }
        
        self.operation_history.append(operation_record)
        
        # Keep only last 1000 operations
        if len(self.operation_history) > 1000:
            self.operation_history = self.operation_history[-1000:]
    
    def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check.
        
        Returns:
            Dictionary containing health check results.
        """
        health_status = {
            "overall_status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "integration_status": self.status.value,
            "registry_health": {},
            "llm_health": "healthy" if self.llm else "unavailable",
            "issues": []
        }
        
        # Check each registry
        for registry_type, registry in self.registries.items():
            try:
                # Basic health check - try to get statistics
                stats = registry.get_registry_statistics()
                health_status["registry_health"][registry_type.value] = "healthy"
            except Exception as e:
                health_status["registry_health"][registry_type.value] = "unhealthy"
                health_status["issues"].append(f"{registry_type.value} registry error: {str(e)}")
                health_status["overall_status"] = "degraded"
        
        # Check LLM health
        if self.llm:
            try:
                # Simple test inference
                test_result = self.llm.generate("Health check test", max_tokens=10)
                if not test_result:
                    health_status["llm_health"] = "degraded"
                    health_status["issues"].append("LLM test inference failed")
                    health_status["overall_status"] = "degraded"
            except Exception as e:
                health_status["llm_health"] = "unhealthy"
                health_status["issues"].append(f"LLM error: {str(e)}")
                health_status["overall_status"] = "degraded"
        
        # Set overall status based on issues
        if health_status["issues"]:
            if len(health_status["issues"]) > 3:
                health_status["overall_status"] = "unhealthy"
            elif health_status["overall_status"] != "degraded":
                health_status["overall_status"] = "degraded"
        
        return health_status
    
    def get_integration_metrics(self) -> Dict[str, Any]:
        """Get comprehensive integration metrics.
        
        Returns:
            Dictionary containing integration metrics.
        """
        metrics = {
            "uptime": (datetime.utcnow() - datetime.fromisoformat(self.initialization_timestamp)).total_seconds(),
            "total_operations": len(self.operation_history),
            "successful_operations": sum(1 for op in self.operation_history if op["success"]),
            "failed_operations": sum(1 for op in self.operation_history if not op["success"]),
            "operations_by_type": {},
            "registry_metrics": {},
            "cross_registry_metrics": self.get_cross_registry_insights()
        }
        
        # Calculate operation metrics
        for operation in self.operation_history:
            op_type = operation["operation_type"]
            if op_type not in metrics["operations_by_type"]:
                metrics["operations_by_type"][op_type] = {"total": 0, "successful": 0, "failed": 0}
            
            metrics["operations_by_type"][op_type]["total"] += 1
            if operation["success"]:
                metrics["operations_by_type"][op_type]["successful"] += 1
            else:
                metrics["operations_by_type"][op_type]["failed"] += 1
        
        # Get registry-specific metrics
        for registry_type, registry in self.registries.items():
            try:
                metrics["registry_metrics"][registry_type.value] = registry.get_registry_statistics()
            except Exception as e:
                metrics["registry_metrics"][registry_type.value] = {"error": str(e)}
        
        return metrics

