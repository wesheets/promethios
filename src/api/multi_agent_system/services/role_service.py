"""
Agent Role Management Service

Manages agent role assignment, validation, and execution order for multi-agent systems.
Provides predefined standard roles that users can click to assign, with proper validation
to ensure agent capabilities match role requirements.
"""

from typing import Dict, List, Any, Optional, Tuple
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum
import json
import asyncio

class StandardRole(str, Enum):
    # Workflow Roles
    COORDINATOR = "coordinator"
    PROCESSOR = "processor" 
    VALIDATOR = "validator"
    AGGREGATOR = "aggregator"
    
    # Functional Roles
    DATA_ANALYST = "data_analyst"
    CONTENT_CREATOR = "content_creator"
    RESEARCHER = "researcher"
    QUALITY_ASSURER = "quality_assurer"
    
    # Communication Roles
    FACILITATOR = "facilitator"
    TRANSLATOR = "translator"
    BROADCASTER = "broadcaster"
    COLLECTOR = "collector"
    
    # Specialized Roles
    DECISION_MAKER = "decision_maker"
    CONFLICT_RESOLVER = "conflict_resolver"
    RESOURCE_MANAGER = "resource_manager"
    MONITOR = "monitor"

class ExecutionPriority(str, Enum):
    CRITICAL = "critical"      # Must execute first
    HIGH = "high"             # Execute early
    NORMAL = "normal"         # Standard execution order
    LOW = "low"               # Execute later
    BACKGROUND = "background"  # Execute when resources available

class AgentRoleAssignment(BaseModel):
    agent_id: str = Field(..., description="Unique identifier for the agent")
    role: StandardRole = Field(..., description="Assigned role for the agent")
    execution_order: int = Field(..., description="Order in which agent should execute (1-based)")
    priority: ExecutionPriority = Field(ExecutionPriority.NORMAL, description="Execution priority")
    custom_config: Optional[Dict[str, Any]] = Field(None, description="Role-specific configuration")
    dependencies: List[str] = Field(default_factory=list, description="Agent IDs this agent depends on")
    
    @validator('execution_order')
    def validate_execution_order(cls, v):
        if v < 1:
            raise ValueError('Execution order must be 1 or greater')
        return v

class RoleCapabilityRequirement(BaseModel):
    capability: str
    required_level: float = Field(ge=0.0, le=1.0, description="Required proficiency level (0-1)")
    critical: bool = Field(False, description="Whether this capability is critical for the role")

class RoleDefinition(BaseModel):
    role: StandardRole
    name: str
    description: str
    category: str
    required_capabilities: List[RoleCapabilityRequirement]
    optimal_collaboration_models: List[str]
    execution_characteristics: Dict[str, Any]
    conflict_resolution_priority: int = Field(ge=1, le=10, description="Priority in conflict resolution (1=highest)")

class AgentCapabilityProfile(BaseModel):
    agent_id: str
    capabilities: Dict[str, float] = Field(description="Capability name -> proficiency level (0-1)")
    specializations: List[str] = Field(default_factory=list)
    performance_metrics: Dict[str, float] = Field(default_factory=dict)
    availability: bool = Field(True)
    max_concurrent_tasks: int = Field(1, ge=1)

class RoleValidationResult(BaseModel):
    valid: bool
    agent_id: str
    role: StandardRole
    capability_score: float = Field(ge=0.0, le=1.0)
    missing_capabilities: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

class ExecutionPlan(BaseModel):
    context_id: str
    role_assignments: List[AgentRoleAssignment]
    execution_sequence: List[List[str]] = Field(description="Batches of agent IDs that can execute in parallel")
    estimated_duration: float = Field(description="Estimated execution time in seconds")
    critical_path: List[str] = Field(description="Agent IDs on the critical execution path")
    resource_requirements: Dict[str, Any] = Field(default_factory=dict)

class AgentRoleService:
    """Service for managing agent roles, validation, and execution planning."""
    
    def __init__(self):
        self.role_definitions = self._initialize_role_definitions()
        self.agent_profiles = {}  # Cache for agent capability profiles
    
    def _initialize_role_definitions(self) -> Dict[StandardRole, RoleDefinition]:
        """Initialize predefined role definitions with capabilities and characteristics."""
        
        return {
            # Workflow Roles
            StandardRole.COORDINATOR: RoleDefinition(
                role=StandardRole.COORDINATOR,
                name="Coordinator",
                description="Manages overall workflow, delegates tasks, and ensures coordination between agents",
                category="workflow",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="task_delegation", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="workflow_management", required_level=0.7, critical=True),
                    RoleCapabilityRequirement(capability="communication", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="decision_making", required_level=0.7, critical=False),
                    RoleCapabilityRequirement(capability="conflict_resolution", required_level=0.6, critical=False)
                ],
                optimal_collaboration_models=["hierarchical_coordination", "sequential_handoffs"],
                execution_characteristics={
                    "execution_pattern": "orchestrator",
                    "resource_intensity": "low",
                    "communication_frequency": "high",
                    "decision_authority": "high"
                },
                conflict_resolution_priority=1
            ),
            
            StandardRole.PROCESSOR: RoleDefinition(
                role=StandardRole.PROCESSOR,
                name="Processor",
                description="Handles main task execution and data processing operations",
                category="workflow",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="data_processing", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="task_execution", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="algorithm_implementation", required_level=0.7, critical=False),
                    RoleCapabilityRequirement(capability="performance_optimization", required_level=0.6, critical=False)
                ],
                optimal_collaboration_models=["parallel_processing", "sequential_handoffs"],
                execution_characteristics={
                    "execution_pattern": "worker",
                    "resource_intensity": "high",
                    "communication_frequency": "medium",
                    "decision_authority": "medium"
                },
                conflict_resolution_priority=5
            ),
            
            StandardRole.VALIDATOR: RoleDefinition(
                role=StandardRole.VALIDATOR,
                name="Validator",
                description="Reviews, validates, and ensures quality of outputs from other agents",
                category="workflow",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="quality_assessment", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="error_detection", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="compliance_checking", required_level=0.7, critical=True),
                    RoleCapabilityRequirement(capability="analytical_thinking", required_level=0.7, critical=False)
                ],
                optimal_collaboration_models=["sequential_handoffs", "hierarchical_coordination"],
                execution_characteristics={
                    "execution_pattern": "reviewer",
                    "resource_intensity": "medium",
                    "communication_frequency": "medium",
                    "decision_authority": "high"
                },
                conflict_resolution_priority=2
            ),
            
            StandardRole.AGGREGATOR: RoleDefinition(
                role=StandardRole.AGGREGATOR,
                name="Aggregator",
                description="Combines and synthesizes results from multiple agents into cohesive outputs",
                category="workflow",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="data_aggregation", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="synthesis", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="pattern_recognition", required_level=0.7, critical=False),
                    RoleCapabilityRequirement(capability="summarization", required_level=0.7, critical=False)
                ],
                optimal_collaboration_models=["parallel_processing", "consensus_decision"],
                execution_characteristics={
                    "execution_pattern": "collector",
                    "resource_intensity": "medium",
                    "communication_frequency": "high",
                    "decision_authority": "medium"
                },
                conflict_resolution_priority=3
            ),
            
            # Functional Roles
            StandardRole.DATA_ANALYST: RoleDefinition(
                role=StandardRole.DATA_ANALYST,
                name="Data Analyst",
                description="Specializes in data analysis, statistical processing, and insight generation",
                category="functional",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="statistical_analysis", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="data_visualization", required_level=0.7, critical=True),
                    RoleCapabilityRequirement(capability="pattern_recognition", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="mathematical_modeling", required_level=0.7, critical=False)
                ],
                optimal_collaboration_models=["parallel_processing", "sequential_handoffs"],
                execution_characteristics={
                    "execution_pattern": "analyst",
                    "resource_intensity": "high",
                    "communication_frequency": "low",
                    "decision_authority": "medium"
                },
                conflict_resolution_priority=6
            ),
            
            StandardRole.CONTENT_CREATOR: RoleDefinition(
                role=StandardRole.CONTENT_CREATOR,
                name="Content Creator",
                description="Generates text, documents, reports, and other content outputs",
                category="functional",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="text_generation", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="creative_writing", required_level=0.7, critical=True),
                    RoleCapabilityRequirement(capability="document_formatting", required_level=0.6, critical=False),
                    RoleCapabilityRequirement(capability="style_adaptation", required_level=0.6, critical=False)
                ],
                optimal_collaboration_models=["sequential_handoffs", "shared_context"],
                execution_characteristics={
                    "execution_pattern": "creator",
                    "resource_intensity": "medium",
                    "communication_frequency": "medium",
                    "decision_authority": "medium"
                },
                conflict_resolution_priority=7
            ),
            
            StandardRole.RESEARCHER: RoleDefinition(
                role=StandardRole.RESEARCHER,
                name="Researcher",
                description="Gathers information, conducts research, and provides knowledge insights",
                category="functional",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="information_retrieval", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="research_methodology", required_level=0.7, critical=True),
                    RoleCapabilityRequirement(capability="fact_verification", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="knowledge_synthesis", required_level=0.7, critical=False)
                ],
                optimal_collaboration_models=["parallel_processing", "shared_context"],
                execution_characteristics={
                    "execution_pattern": "investigator",
                    "resource_intensity": "medium",
                    "communication_frequency": "low",
                    "decision_authority": "low"
                },
                conflict_resolution_priority=8
            ),
            
            StandardRole.QUALITY_ASSURER: RoleDefinition(
                role=StandardRole.QUALITY_ASSURER,
                name="Quality Assurer",
                description="Ensures standards, compliance, and quality across all system outputs",
                category="functional",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="quality_control", required_level=0.9, critical=True),
                    RoleCapabilityRequirement(capability="compliance_checking", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="standard_enforcement", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="audit_trail", required_level=0.7, critical=False)
                ],
                optimal_collaboration_models=["sequential_handoffs", "hierarchical_coordination"],
                execution_characteristics={
                    "execution_pattern": "auditor",
                    "resource_intensity": "low",
                    "communication_frequency": "medium",
                    "decision_authority": "high"
                },
                conflict_resolution_priority=2
            ),
            
            # Communication Roles
            StandardRole.FACILITATOR: RoleDefinition(
                role=StandardRole.FACILITATOR,
                name="Facilitator",
                description="Manages communication flow and facilitates collaboration between agents",
                category="communication",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="communication_management", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="collaboration_facilitation", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="conflict_mediation", required_level=0.7, critical=False),
                    RoleCapabilityRequirement(capability="group_dynamics", required_level=0.6, critical=False)
                ],
                optimal_collaboration_models=["shared_context", "consensus_decision"],
                execution_characteristics={
                    "execution_pattern": "mediator",
                    "resource_intensity": "low",
                    "communication_frequency": "very_high",
                    "decision_authority": "low"
                },
                conflict_resolution_priority=4
            ),
            
            StandardRole.TRANSLATOR: RoleDefinition(
                role=StandardRole.TRANSLATOR,
                name="Translator",
                description="Converts between different formats, protocols, and communication standards",
                category="communication",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="format_conversion", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="protocol_translation", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="data_transformation", required_level=0.7, critical=True),
                    RoleCapabilityRequirement(capability="semantic_mapping", required_level=0.6, critical=False)
                ],
                optimal_collaboration_models=["sequential_handoffs", "parallel_processing"],
                execution_characteristics={
                    "execution_pattern": "transformer",
                    "resource_intensity": "medium",
                    "communication_frequency": "high",
                    "decision_authority": "low"
                },
                conflict_resolution_priority=9
            ),
            
            StandardRole.BROADCASTER: RoleDefinition(
                role=StandardRole.BROADCASTER,
                name="Broadcaster",
                description="Distributes information and updates to multiple agents efficiently",
                category="communication",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="message_distribution", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="notification_management", required_level=0.7, critical=True),
                    RoleCapabilityRequirement(capability="routing_optimization", required_level=0.6, critical=False),
                    RoleCapabilityRequirement(capability="delivery_confirmation", required_level=0.6, critical=False)
                ],
                optimal_collaboration_models=["shared_context", "hierarchical_coordination"],
                execution_characteristics={
                    "execution_pattern": "distributor",
                    "resource_intensity": "low",
                    "communication_frequency": "very_high",
                    "decision_authority": "low"
                },
                conflict_resolution_priority=10
            ),
            
            StandardRole.COLLECTOR: RoleDefinition(
                role=StandardRole.COLLECTOR,
                name="Collector",
                description="Gathers inputs, feedback, and data from multiple sources and agents",
                category="communication",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="data_collection", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="input_aggregation", required_level=0.7, critical=True),
                    RoleCapabilityRequirement(capability="source_management", required_level=0.6, critical=False),
                    RoleCapabilityRequirement(capability="data_validation", required_level=0.6, critical=False)
                ],
                optimal_collaboration_models=["parallel_processing", "consensus_decision"],
                execution_characteristics={
                    "execution_pattern": "gatherer",
                    "resource_intensity": "medium",
                    "communication_frequency": "high",
                    "decision_authority": "low"
                },
                conflict_resolution_priority=8
            ),
            
            # Specialized Roles
            StandardRole.DECISION_MAKER: RoleDefinition(
                role=StandardRole.DECISION_MAKER,
                name="Decision Maker",
                description="Makes final decisions in consensus models and resolves deadlocks",
                category="specialized",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="decision_making", required_level=0.9, critical=True),
                    RoleCapabilityRequirement(capability="risk_assessment", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="strategic_thinking", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="leadership", required_level=0.7, critical=False)
                ],
                optimal_collaboration_models=["consensus_decision", "hierarchical_coordination"],
                execution_characteristics={
                    "execution_pattern": "decider",
                    "resource_intensity": "low",
                    "communication_frequency": "medium",
                    "decision_authority": "very_high"
                },
                conflict_resolution_priority=1
            ),
            
            StandardRole.CONFLICT_RESOLVER: RoleDefinition(
                role=StandardRole.CONFLICT_RESOLVER,
                name="Conflict Resolver",
                description="Handles disagreements and conflicts between agents",
                category="specialized",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="conflict_resolution", required_level=0.9, critical=True),
                    RoleCapabilityRequirement(capability="negotiation", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="mediation", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="emotional_intelligence", required_level=0.7, critical=False)
                ],
                optimal_collaboration_models=["consensus_decision", "shared_context"],
                execution_characteristics={
                    "execution_pattern": "resolver",
                    "resource_intensity": "medium",
                    "communication_frequency": "high",
                    "decision_authority": "high"
                },
                conflict_resolution_priority=1
            ),
            
            StandardRole.RESOURCE_MANAGER: RoleDefinition(
                role=StandardRole.RESOURCE_MANAGER,
                name="Resource Manager",
                description="Allocates and manages computational resources across agents",
                category="specialized",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="resource_allocation", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="performance_monitoring", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="optimization", required_level=0.7, critical=True),
                    RoleCapabilityRequirement(capability="capacity_planning", required_level=0.6, critical=False)
                ],
                optimal_collaboration_models=["parallel_processing", "hierarchical_coordination"],
                execution_characteristics={
                    "execution_pattern": "manager",
                    "resource_intensity": "low",
                    "communication_frequency": "medium",
                    "decision_authority": "medium"
                },
                conflict_resolution_priority=5
            ),
            
            StandardRole.MONITOR: RoleDefinition(
                role=StandardRole.MONITOR,
                name="Monitor",
                description="Tracks system health, performance, and operational metrics",
                category="specialized",
                required_capabilities=[
                    RoleCapabilityRequirement(capability="system_monitoring", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="performance_tracking", required_level=0.8, critical=True),
                    RoleCapabilityRequirement(capability="anomaly_detection", required_level=0.7, critical=True),
                    RoleCapabilityRequirement(capability="alerting", required_level=0.6, critical=False)
                ],
                optimal_collaboration_models=["parallel_processing", "shared_context"],
                execution_characteristics={
                    "execution_pattern": "observer",
                    "resource_intensity": "low",
                    "communication_frequency": "low",
                    "decision_authority": "low"
                },
                conflict_resolution_priority=10
            )
        }
    
    async def get_available_roles(self, collaboration_model: Optional[str] = None) -> Dict[str, Any]:
        """Get all available roles, optionally filtered by collaboration model."""
        
        roles = {}
        for role_enum, definition in self.role_definitions.items():
            # Filter by collaboration model if specified
            if collaboration_model and collaboration_model not in definition.optimal_collaboration_models:
                continue
            
            roles[role_enum.value] = {
                "name": definition.name,
                "description": definition.description,
                "category": definition.category,
                "required_capabilities": [cap.dict() for cap in definition.required_capabilities],
                "optimal_collaboration_models": definition.optimal_collaboration_models,
                "execution_characteristics": definition.execution_characteristics,
                "conflict_resolution_priority": definition.conflict_resolution_priority
            }
        
        return {
            "roles": roles,
            "total_roles": len(roles),
            "categories": list(set(definition.category for definition in self.role_definitions.values()))
        }
    
    async def validate_role_assignment(
        self, 
        agent_id: str, 
        role: StandardRole,
        agent_capabilities: Optional[Dict[str, float]] = None
    ) -> RoleValidationResult:
        """Validate if an agent can fulfill a specific role."""
        
        # Get agent capabilities
        if agent_capabilities is None:
            agent_profile = await self._get_agent_capability_profile(agent_id)
            agent_capabilities = agent_profile.capabilities
        
        role_definition = self.role_definitions[role]
        missing_capabilities = []
        warnings = []
        recommendations = []
        
        # Calculate capability score
        total_score = 0.0
        total_weight = 0.0
        
        for req_cap in role_definition.required_capabilities:
            capability_name = req_cap.capability
            required_level = req_cap.required_level
            is_critical = req_cap.critical
            
            agent_level = agent_capabilities.get(capability_name, 0.0)
            
            # Weight critical capabilities more heavily
            weight = 2.0 if is_critical else 1.0
            total_weight += weight
            
            if agent_level >= required_level:
                total_score += weight * agent_level
            else:
                total_score += weight * agent_level * 0.5  # Partial credit
                
                if is_critical:
                    missing_capabilities.append(capability_name)
                else:
                    warnings.append(f"Below optimal level for {capability_name}: {agent_level:.2f} < {required_level:.2f}")
        
        capability_score = total_score / total_weight if total_weight > 0 else 0.0
        
        # Generate recommendations
        if missing_capabilities:
            recommendations.append(f"Agent needs training in: {', '.join(missing_capabilities)}")
        
        if capability_score < 0.7:
            recommendations.append("Consider assigning a different role or providing additional capabilities")
        elif capability_score > 0.9:
            recommendations.append("Excellent fit for this role")
        
        return RoleValidationResult(
            valid=len(missing_capabilities) == 0 and capability_score >= 0.6,
            agent_id=agent_id,
            role=role,
            capability_score=capability_score,
            missing_capabilities=missing_capabilities,
            warnings=warnings,
            recommendations=recommendations
        )
    
    async def assign_roles(
        self, 
        context_id: str,
        role_assignments: List[AgentRoleAssignment]
    ) -> Dict[str, Any]:
        """Assign roles to agents and validate the overall configuration."""
        
        # Validate each role assignment
        validation_results = []
        for assignment in role_assignments:
            validation = await self.validate_role_assignment(assignment.agent_id, assignment.role)
            validation_results.append(validation)
        
        # Check for conflicts and issues
        issues = []
        warnings = []
        
        # Check for duplicate execution orders
        execution_orders = [assignment.execution_order for assignment in role_assignments]
        if len(execution_orders) != len(set(execution_orders)):
            issues.append("Duplicate execution orders detected")
        
        # Check for missing critical roles
        assigned_roles = [assignment.role for assignment in role_assignments]
        if StandardRole.COORDINATOR not in assigned_roles and len(role_assignments) > 3:
            warnings.append("Consider assigning a Coordinator role for better workflow management")
        
        # Check for dependency cycles
        dependency_issues = self._check_dependency_cycles(role_assignments)
        issues.extend(dependency_issues)
        
        # Generate execution plan
        execution_plan = await self._generate_execution_plan(context_id, role_assignments)
        
        return {
            "success": len(issues) == 0,
            "context_id": context_id,
            "role_assignments": [assignment.dict() for assignment in role_assignments],
            "validation_results": [result.dict() for result in validation_results],
            "execution_plan": execution_plan.dict(),
            "issues": issues,
            "warnings": warnings,
            "total_agents": len(role_assignments)
        }
    
    async def _get_agent_capability_profile(self, agent_id: str) -> AgentCapabilityProfile:
        """Get capability profile for an agent (mock implementation for now)."""
        
        # Check cache first
        if agent_id in self.agent_profiles:
            return self.agent_profiles[agent_id]
        
        # Mock agent capabilities - in real implementation, would query agent registry
        mock_capabilities = {
            "task_delegation": 0.7,
            "workflow_management": 0.6,
            "communication": 0.8,
            "decision_making": 0.7,
            "conflict_resolution": 0.5,
            "data_processing": 0.8,
            "task_execution": 0.9,
            "algorithm_implementation": 0.7,
            "performance_optimization": 0.6,
            "quality_assessment": 0.8,
            "error_detection": 0.7,
            "compliance_checking": 0.6,
            "analytical_thinking": 0.8,
            "data_aggregation": 0.7,
            "synthesis": 0.8,
            "pattern_recognition": 0.8,
            "summarization": 0.7,
            "statistical_analysis": 0.6,
            "data_visualization": 0.5,
            "mathematical_modeling": 0.4,
            "text_generation": 0.8,
            "creative_writing": 0.7,
            "document_formatting": 0.6,
            "style_adaptation": 0.6,
            "information_retrieval": 0.8,
            "research_methodology": 0.6,
            "fact_verification": 0.7,
            "knowledge_synthesis": 0.7,
            "quality_control": 0.8,
            "standard_enforcement": 0.7,
            "audit_trail": 0.6,
            "communication_management": 0.8,
            "collaboration_facilitation": 0.7,
            "conflict_mediation": 0.6,
            "group_dynamics": 0.5,
            "format_conversion": 0.7,
            "protocol_translation": 0.6,
            "data_transformation": 0.8,
            "semantic_mapping": 0.5,
            "message_distribution": 0.8,
            "notification_management": 0.7,
            "routing_optimization": 0.6,
            "delivery_confirmation": 0.7,
            "data_collection": 0.8,
            "input_aggregation": 0.7,
            "source_management": 0.6,
            "data_validation": 0.7,
            "risk_assessment": 0.6,
            "strategic_thinking": 0.5,
            "leadership": 0.6,
            "negotiation": 0.5,
            "mediation": 0.6,
            "emotional_intelligence": 0.4,
            "resource_allocation": 0.6,
            "performance_monitoring": 0.7,
            "optimization": 0.6,
            "capacity_planning": 0.5,
            "system_monitoring": 0.8,
            "performance_tracking": 0.8,
            "anomaly_detection": 0.7,
            "alerting": 0.7
        }
        
        profile = AgentCapabilityProfile(
            agent_id=agent_id,
            capabilities=mock_capabilities,
            specializations=["general_purpose"],
            performance_metrics={
                "response_time": 0.8,
                "accuracy": 0.85,
                "reliability": 0.9
            },
            availability=True,
            max_concurrent_tasks=3
        )
        
        # Cache the profile
        self.agent_profiles[agent_id] = profile
        return profile
    
    def _check_dependency_cycles(self, role_assignments: List[AgentRoleAssignment]) -> List[str]:
        """Check for circular dependencies in role assignments."""
        
        # Build dependency graph
        dependencies = {}
        for assignment in role_assignments:
            dependencies[assignment.agent_id] = assignment.dependencies
        
        # Check for cycles using DFS
        visited = set()
        rec_stack = set()
        cycles = []
        
        def has_cycle(node, path):
            if node in rec_stack:
                cycle_start = path.index(node)
                cycles.append(f"Dependency cycle detected: {' -> '.join(path[cycle_start:] + [node])}")
                return True
            
            if node in visited:
                return False
            
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            
            for dependency in dependencies.get(node, []):
                if has_cycle(dependency, path):
                    return True
            
            rec_stack.remove(node)
            path.pop()
            return False
        
        for agent_id in dependencies:
            if agent_id not in visited:
                has_cycle(agent_id, [])
        
        return cycles
    
    async def _generate_execution_plan(
        self, 
        context_id: str, 
        role_assignments: List[AgentRoleAssignment]
    ) -> ExecutionPlan:
        """Generate an optimized execution plan based on role assignments."""
        
        # Sort by execution order and priority
        sorted_assignments = sorted(
            role_assignments, 
            key=lambda x: (x.execution_order, x.priority.value)
        )
        
        # Group agents that can execute in parallel
        execution_sequence = []
        current_batch = []
        current_order = None
        
        for assignment in sorted_assignments:
            if current_order is None or assignment.execution_order == current_order:
                current_batch.append(assignment.agent_id)
                current_order = assignment.execution_order
            else:
                if current_batch:
                    execution_sequence.append(current_batch)
                current_batch = [assignment.agent_id]
                current_order = assignment.execution_order
        
        if current_batch:
            execution_sequence.append(current_batch)
        
        # Estimate duration (mock calculation)
        estimated_duration = len(execution_sequence) * 30.0  # 30 seconds per batch
        
        # Identify critical path (longest dependency chain)
        critical_path = self._find_critical_path(role_assignments)
        
        # Calculate resource requirements
        resource_requirements = {
            "cpu_cores": len(role_assignments) * 0.5,
            "memory_gb": len(role_assignments) * 1.0,
            "network_bandwidth": "medium",
            "storage_gb": 10.0
        }
        
        return ExecutionPlan(
            context_id=context_id,
            role_assignments=role_assignments,
            execution_sequence=execution_sequence,
            estimated_duration=estimated_duration,
            critical_path=critical_path,
            resource_requirements=resource_requirements
        )
    
    def _find_critical_path(self, role_assignments: List[AgentRoleAssignment]) -> List[str]:
        """Find the critical path (longest dependency chain) in the execution plan."""
        
        # Build dependency graph
        dependencies = {}
        for assignment in role_assignments:
            dependencies[assignment.agent_id] = assignment.dependencies
        
        # Find longest path using DFS
        def longest_path(node, visited):
            if node in visited:
                return []
            
            visited.add(node)
            max_path = [node]
            
            for dependency in dependencies.get(node, []):
                dep_path = longest_path(dependency, visited.copy())
                if len(dep_path) + 1 > len(max_path):
                    max_path = [node] + dep_path
            
            return max_path
        
        critical_path = []
        for agent_id in dependencies:
            path = longest_path(agent_id, set())
            if len(path) > len(critical_path):
                critical_path = path
        
        return critical_path
    
    async def get_role_suggestions(
        self, 
        agent_ids: List[str], 
        collaboration_model: str
    ) -> Dict[str, Any]:
        """Get smart role suggestions based on agent capabilities and collaboration model."""
        
        suggestions = []
        
        # Get agent profiles
        agent_profiles = []
        for agent_id in agent_ids:
            profile = await self._get_agent_capability_profile(agent_id)
            agent_profiles.append(profile)
        
        # Get roles optimal for the collaboration model
        optimal_roles = []
        for role_enum, definition in self.role_definitions.items():
            if collaboration_model in definition.optimal_collaboration_models:
                optimal_roles.append((role_enum, definition))
        
        # Match agents to roles based on capabilities
        for i, profile in enumerate(agent_profiles):
            best_role = None
            best_score = 0.0
            
            for role_enum, definition in optimal_roles:
                validation = await self.validate_role_assignment(
                    profile.agent_id, 
                    role_enum, 
                    profile.capabilities
                )
                
                if validation.capability_score > best_score:
                    best_score = validation.capability_score
                    best_role = role_enum
            
            if best_role:
                suggestions.append({
                    "agent_id": profile.agent_id,
                    "suggested_role": best_role.value,
                    "confidence_score": best_score,
                    "execution_order": i + 1,
                    "rationale": f"Best capability match with {best_score:.2f} score"
                })
        
        return {
            "suggestions": suggestions,
            "collaboration_model": collaboration_model,
            "total_agents": len(agent_ids),
            "optimal_roles_for_model": [role.value for role, _ in optimal_roles]
        }

# Global service instance
role_service = AgentRoleService()

